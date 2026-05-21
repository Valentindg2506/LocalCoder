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

/// Build an intelligent system prompt based on project context
fn build_system_prompt(
    project_path: Option<&str>,
    active_file: Option<&str>,
    relevant_chunks: &[String],
) -> String {
    let project_name = project_path
        .and_then(|p| p.split('/').last())
        .unwrap_or("proyecto");

    let file_info = active_file
        .map(|f| {
            let name = f.split('/').last().unwrap_or(f);
            let ext = name.split('.').last().unwrap_or("");
            format!("Archivo activo: `{}` ({})", name, ext)
        })
        .unwrap_or_else(|| "Sin archivo activo".to_string());

    let context_section = if !relevant_chunks.is_empty() {
        format!(
            "\n\nContexto relevante del proyecto:\n{}",
            relevant_chunks.join("\n---\n")
        )
    } else {
        String::new()
    };

    format!(
        "Eres un asistente de programación experto integrado en LocalCoder, un IDE local con IA.\n\
        Proyecto: {}\n\
        {}{}\n\n\
        Reglas:\n\
        - Responde siempre en español salvo que el usuario escriba en otro idioma\n\
        - Sé conciso y directo\n\
        - Para código, usa bloques markdown con el lenguaje correcto\n\
        - Si no tienes suficiente contexto, pídelo explícitamente\n\
        - No inventes rutas de archivos que no conozcas",
        project_name, file_info, context_section
    )
}

/// Simple keyword-based chunk relevance ranking
fn rank_chunks(chunks: &[String], query: &str, max: usize) -> Vec<String> {
    let query_words: Vec<&str> = query
        .split_whitespace()
        .filter(|w| w.len() > 3)
        .collect();

    if query_words.is_empty() {
        return chunks.iter().take(max).cloned().collect();
    }

    let mut scored: Vec<(usize, &String)> = chunks.iter().map(|chunk| {
        let chunk_lower = chunk.to_lowercase();
        let score = query_words.iter()
            .filter(|w| chunk_lower.contains(&w.to_lowercase()))
            .count();
        (score, chunk)
    }).collect();

    scored.sort_by(|a, b| b.0.cmp(&a.0));
    scored.into_iter()
        .filter(|(score, _)| *score > 0)
        .take(max)
        .map(|(_, c)| c.clone())
        .collect()
}

#[tauri::command]
pub async fn chat_stream(
    window: Window,
    model: String,
    messages: Vec<ChatMessage>,
    session_id: String,
    project_path: Option<String>,
    active_file: Option<String>,
    project_chunks: Vec<String>,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    // Get the last user message for chunk ranking
    let last_query = messages.iter()
        .filter(|m| m.role == "user")
        .last()
        .map(|m| m.content.as_str())
        .unwrap_or("");

    // Rank and pick top 5 most relevant chunks (max ~3000 chars total)
    let relevant_chunks = rank_chunks(&project_chunks, last_query, 5);

    // Build system prompt
    let system_prompt = build_system_prompt(
        project_path.as_deref(),
        active_file.as_deref(),
        &relevant_chunks,
    );

    // Prepend system message
    let mut full_messages = vec![
        serde_json::json!({ "role": "system", "content": system_prompt })
    ];
    for m in &messages {
        full_messages.push(serde_json::json!({ "role": m.role, "content": m.content }));
    }

    let payload = serde_json::json!({
        "model": model,
        "messages": full_messages,
        "stream": true
    });

    let mut resp = client
        .post(format!("{}/api/chat", OLLAMA_BASE))
        .json(&payload)
        .send().await
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

#[tauri::command]
pub async fn pull_model(window: Window, model: String) -> Result<(), String> {
    let client = reqwest::Client::new();
    let payload = serde_json::json!({ "name": model, "stream": true });
    let mut resp = client
        .post(format!("{}/api/pull", OLLAMA_BASE))
        .json(&payload)
        .send().await
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
