use serde::{Deserialize, Serialize};
use tauri::Window;
const OLLAMA_BASE: &str = "http://localhost:11434";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OllamaModel { pub name:String, pub size:u64, pub digest:String, pub modified_at:String }
#[derive(Debug, Serialize, Deserialize)]
struct TagsResponse { models: Vec<OllamaModel> }
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage { pub role:String, pub content:String }

#[tauri::command]
pub async fn list_models() -> Result<Vec<OllamaModel>, String> {
    let client = reqwest::Client::new();
    let resp = client.get(format!("{}/api/tags", OLLAMA_BASE)).send().await
        .map_err(|e| format!("No se puede conectar a Ollama: {}", e))?;
    let tags: TagsResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(tags.models)
}

#[tauri::command]
pub async fn chat_stream(window: Window, model: String, messages: Vec<ChatMessage>, session_id: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let payload = serde_json::json!({ "model": model, "messages": messages, "stream": true });
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

#[tauri::command]
pub async fn pull_model(window: Window, model: String) -> Result<(), String> {
    let client = reqwest::Client::new();
    let payload = serde_json::json!({ "name": model, "stream": true });
    let mut resp = client.post(format!("{}/api/pull", OLLAMA_BASE)).json(&payload).send().await.map_err(|e| e.to_string())?;
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
