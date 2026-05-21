use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Session {
    pub id: String, pub name: String, pub project_path: Option<String>,
    pub model: String, pub created_at: String, pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message {
    pub id: i64, pub session_id: String, pub role: String,
    pub content: String, pub created_at: String,
}

pub struct DbConn { pub conn: Connection }
unsafe impl Send for DbConn {}

pub struct AppState { pub db: Mutex<DbConn> }

pub fn init_db() -> Connection {
    let home = dirs::home_dir().unwrap_or_default();
    let db_dir = home.join(".localcoder");
    std::fs::create_dir_all(&db_dir).ok();
    let conn = Connection::open(db_dir.join("data.db")).expect("Error abriendo DB");
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY, name TEXT NOT NULL,
            project_path TEXT, model TEXT NOT NULL,
            created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL, role TEXT NOT NULL,
            content TEXT NOT NULL, created_at TEXT NOT NULL
        );
    ").expect("Error creando tablas");
    conn
}

#[tauri::command]
pub fn get_sessions(state: State<AppState>) -> Result<Vec<Session>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.conn.prepare(
        "SELECT id,name,project_path,model,created_at,updated_at FROM sessions ORDER BY updated_at DESC"
    ).map_err(|e| e.to_string())?;
    let rows: Vec<Session> = stmt.query_map([], |row| Ok(Session {
        id: row.get(0)?, name: row.get(1)?, project_path: row.get(2)?,
        model: row.get(3)?, created_at: row.get(4)?, updated_at: row.get(5)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

#[tauri::command]
pub fn create_session(state: State<AppState>, name: String, project_path: Option<String>, model: String) -> Result<Session, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    db.conn.execute(
        "INSERT INTO sessions (id,name,project_path,model,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6)",
        params![id, name, project_path, model, now, now],
    ).map_err(|e| e.to_string())?;
    Ok(Session { id, name, project_path, model, created_at: now.clone(), updated_at: now })
}

#[tauri::command]
pub fn delete_session(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.conn.execute("DELETE FROM messages WHERE session_id=?1", params![id]).map_err(|e| e.to_string())?;
    db.conn.execute("DELETE FROM sessions WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_messages(state: State<AppState>, session_id: String) -> Result<Vec<Message>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.conn.prepare(
        "SELECT id,session_id,role,content,created_at FROM messages WHERE session_id=?1 ORDER BY id ASC"
    ).map_err(|e| e.to_string())?;
    let rows: Vec<Message> = stmt.query_map(params![session_id], |row| Ok(Message {
        id: row.get(0)?, session_id: row.get(1)?, role: row.get(2)?,
        content: row.get(3)?, created_at: row.get(4)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

#[tauri::command]
pub fn add_message(state: State<AppState>, session_id: String, role: String, content: String) -> Result<Message, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db.conn.execute(
        "INSERT INTO messages (session_id,role,content,created_at) VALUES (?1,?2,?3,?4)",
        params![session_id, role, content, now],
    ).map_err(|e| e.to_string())?;
    let id = db.conn.last_insert_rowid();
    db.conn.execute("UPDATE sessions SET updated_at=?1 WHERE id=?2", params![now, session_id]).map_err(|e| e.to_string())?;
    Ok(Message { id, session_id, role, content, created_at: now })
}
