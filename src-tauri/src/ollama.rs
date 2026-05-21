use serde::{Deserialize, Serialize};
use tauri::{Window, Emitter};
const OLLAMA_BASE: &str = "http://localhost:11434";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OllamaModel { pub name: String, pub size: u64, pub digest: String, pub modified_at: String }
#[derive(Debug, Serialize, Deserialize)]
struct TagsResponse { models: Vec<OllamaModel> }
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage { pub role: String, pub content: String }

#[tauri::command]
pub async fn list_models() -> Result<Vec<OllamaModel>, String> {
    let client = reqwest::Client::new();
    let resp = client.get(format!("{}/api/tags", OLLAMA_BASE)).send().await
        .map_err(|e| format!("No se puede conectar a Ollama: {}", e))?;
    let tags: TagsResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(tags.models)
}

fn build_system_prompt(project_path: Option<&str>, active_file: Option<&str>, relevant_chunks: &[String]) -> String {
    let project_name = project_path.and_then(|p| p.split('/').last()).unwrap_or("proyecto");
    let file_info = active_file
        .map(|f| { let name = f.split('/').last().unwrap_or(f); let ext = name.split('.').last().unwrap_or(""); format!("Archivo activo: `{}` ({})", name, ext) })
        .unwrap_or_else(|| "Sin archivo activo".to_string());
    let context_section = if !relevant_chunks.is_empty() {
        format!("\n\nContexto relevante del proyecto:\n{}", relevant_chunks.join("\n---\n"))
    } else { String::new() };
    format!(
        "Eres un asistente de programación experto integrado en LocalCoder, un IDE local con IA.\nProyecto: {}\n{}{}\n\nReglas:\n- Responde siempre en español salvo que el usuario escriba en otro idioma\n- Sé conciso y directo\n- Para código, usa bloques markdown con el lenguaje correcto\n- Si no tienes suficiente contexto, pídelo explícitamente\n- No inventes rutas de archivos que no conozcas",
        project_name, file_info, context_section
    )
}

fn rank_chunks(chunks: &[String], query: &str, max: usize) -> Vec<String> {
    let query_words: Vec<&str> = query.split_whitespace().filter(|w| w.len() > 3).collect();
    if query_words.is_empty() { return chunks.iter().take(max).cloned().collect(); }
    let mut scored: Vec<(usize, &String)> = chunks.iter().map(|chunk| {
        let chunk_lower = chunk.to_lowercase();
        let score = query_words.iter().filter(|w| chunk_lower.contains(&w.to_lowercase())).count();
        (score, chunk)
    }).collect();
    scored.sort_by(|a, b| b.0.cmp(&a.0));
    scored.into_iter().filter(|(s, _)| *s > 0).take(max).map(|(_, c)| c.clone()).collect()
}

#[tauri::command]
pub async fn chat_stream(
    window: Window, model: String, messages: Vec<ChatMessage>, session_id: String,
    project_path: Option<String>, active_file: Option<String>, project_chunks: Vec<String>,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let last_query = messages.iter().filter(|m| m.role == "user").last().map(|m| m.content.as_str()).unwrap_or("");
    let relevant_chunks = rank_chunks(&project_chunks, last_query, 5);
    let system_prompt = build_system_prompt(project_path.as_deref(), active_file.as_deref(), &relevant_chunks);
    let mut full_messages = vec![serde_json::json!({ "role": "system", "content": system_prompt })];
    for m in &messages { full_messages.push(serde_json::json!({ "role": m.role, "content": m.content })); }
    let payload = serde_json::json!({ "model": model, "messages": full_messages, "stream": true });
    let mut resp = client.post(format!("{}/api/chat", OLLAMA_BASE)).json(&payload).send().await
        .map_err(|e| format!("Error conectando a Ollama: {}", e))?;
    let mut full_response = String::new();
    while let Some(chunk) = resp.chunk().await.map_err(|e| e.to_string())? {
        let text = String::from_utf8_lossy(&chunk);
        for line in text.lines() {
            if line.is_empty() { continue; }
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
                if let Some(content) = json["message"]["content"].as_str() {
                    full_response.push_str(content);
                    window.emit(&format!("chat_token_{}", session_id), content).ok();
                }
                if json["done"].as_bool().unwrap_or(false) {
                    window.emit(&format!("chat_done_{}", session_id), &full_response).ok();
                }
            }
        }
    }
    Ok(full_response)
}

/// AI inline code completion using Ollama /api/generate (FIM-style)
#[tauri::command]
pub async fn complete_code(
    model: String,
    prefix: String,   // code before cursor
    suffix: String,   // code after cursor
    language: String,
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .map_err(|e| e.to_string())?;

    // FIM prompt — works well with codellama, deepseek-coder, qwen2.5-coder
    // Falls back to a simple completion prompt for general models
    let prompt = format!(
        "<PRE>{}<SUF>{}<MID>",
        &prefix[prefix.len().saturating_sub(800)..],  // last 800 chars
        &suffix[..suffix.len().min(200)],              // first 200 chars after cursor
    );

    let payload = serde_json::json!({
        "model": model,
        "prompt": prompt,
        "stream": false,
        "options": {
            "temperature": 0.1,
            "top_p": 0.9,
            "num_predict": 120,
            "stop": ["\n\n", "<EOT>", "</s>", "<|endoftext|>"]
        }
    });

    let resp = client
        .post(format!("{}/api/generate", OLLAMA_BASE))
        .json(&payload)
        .send().await
        .map_err(|e| format!("Error: {}", e))?;

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let completion = json["response"].as_str().unwrap_or("").trim().to_string();

    // Sanity filter: reject if response looks like a re-echo of the prompt
    if completion.contains("<PRE>") || completion.contains("<SUF>") || completion.contains("<MID>") {
        return Ok(String::new());
    }

    // Only return the first logical "line group" (up to first blank line)
    let clean: String = completion
        .lines()
        .take_while(|l| !l.trim().is_empty() || completion.lines().count() == 1)
        .collect::<Vec<_>>()
        .join("\n");

    Ok(clean)
}

#[tauri::command]
pub async fn pull_model(window: Window, model: String) -> Result<(), String> {
    let client = reqwest::Client::new();
    let payload = serde_json::json!({ "name": model, "stream": true });
    let mut resp = client.post(format!("{}/api/pull", OLLAMA_BASE)).json(&payload).send().await
        .map_err(|e| e.to_string())?;
    while let Some(chunk) = resp.chunk().await.map_err(|e| e.to_string())? {
        let text = String::from_utf8_lossy(&chunk);
        for line in text.lines() {
            if line.is_empty() { continue; }
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
                window.emit("pull_progress", &json).ok();
            }
        }
    }
    Ok(())
}
