use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::AppState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Session { pub id:String, pub name:String, pub project_path:Option<String>, pub model:String, pub created_at:String, pub updated_at:String }
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message { pub id:i64, pub session_id:String, pub role:String, pub content:String, pub created_at:String }
pub struct Database { pub conn: Connection }

impl Database {
    pub fn new() -> Result<Self> {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".into());
        let data_dir = format!("{}/.localcoder", home);
        std::fs::create_dir_all(&data_dir).ok();
        let conn = Connection::open(format!("{}/localcoder.db", data_dir))?;
        conn.execute_batch("
            PRAGMA foreign_keys = ON;
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY, name TEXT NOT NULL, project_path TEXT,
                model TEXT NOT NULL DEFAULT 'llama3.1:8b',
                created_at TEXT NOT NULL, updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL, role TEXT NOT NULL,
                content TEXT NOT NULL, created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );
        ")?;
        Ok(Self { conn })
    }
}

fn now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    format!("{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs())
}

#[tauri::command]
pub fn create_session(state: State<AppState>, name: String, project_path: Option<String>, model: String) -> Result<Session, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let id = format!("sess_{}", now());
    let created = now();
    db.conn.execute("INSERT INTO sessions (id,name,project_path,model,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6)",
        params![id, name, project_path, model, created, created]).map_err(|e| e.to_string())?;
    Ok(Session { id, name, project_path, model, created_at: created.clone(), updated_at: created })
}

#[tauri::command]
pub fn get_sessions(state: State<AppState>) -> Result<Vec<Session>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.conn.prepare("SELECT id,name,project_path,model,created_at,updated_at FROM sessions ORDER BY updated_at DESC").map_err(|e| e.to_string())?;
    Ok(stmt.query_map([], |row| Ok(Session { id:row.get(0)?, name:row.get(1)?, project_path:row.get(2)?, model:row.get(3)?, created_at:row.get(4)?, updated_at:row.get(5)? }))
        .map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect())
}

#[tauri::command]
pub fn get_session(state: State<AppState>, id: String) -> Result<Session, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.conn.query_row("SELECT id,name,project_path,model,created_at,updated_at FROM sessions WHERE id=?1", params![id],
        |row| Ok(Session { id:row.get(0)?, name:row.get(1)?, project_path:row.get(2)?, model:row.get(3)?, created_at:row.get(4)?, updated_at:row.get(5)? }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_session(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.conn.execute("DELETE FROM sessions WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn add_message(state: State<AppState>, session_id: String, role: String, content: String) -> Result<Message, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let created = now();
    db.conn.execute("INSERT INTO messages (session_id,role,content,created_at) VALUES (?1,?2,?3,?4)",
        params![session_id, role, content, created]).map_err(|e| e.to_string())?;
    db.conn.execute("UPDATE sessions SET updated_at=?1 WHERE id=?2", params![created, session_id]).map_err(|e| e.to_string())?;
    let id = db.conn.last_insert_rowid();
    Ok(Message { id, session_id, role, content, created_at: created })
}

#[tauri::command]
pub fn get_messages(state: State<AppState>, session_id: String) -> Result<Vec<Message>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.conn.prepare("SELECT id,session_id,role,content,created_at FROM messages WHERE session_id=?1 ORDER BY id ASC").map_err(|e| e.to_string())?;
    Ok(stmt.query_map(params![session_id], |row| Ok(Message { id:row.get(0)?, session_id:row.get(1)?, role:row.get(2)?, content:row.get(3)?, created_at:row.get(4)? }))
        .map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect())
}
