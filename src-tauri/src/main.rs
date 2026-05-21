#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod db; mod ollama; mod scanner; mod hardware;
use db::Database;
use std::sync::Mutex;
pub struct AppState { pub db: Mutex<Database> }

fn main() {
    let db = Database::new().expect("Error iniciando base de datos");
    tauri::Builder::default()
        .manage(AppState { db: Mutex::new(db) })
        .invoke_handler(tauri::generate_handler![
            db::create_session, db::get_sessions, db::get_session,
            db::delete_session, db::add_message, db::get_messages,
            ollama::list_models, ollama::chat_stream, ollama::pull_model,
            scanner::scan_project, scanner::read_file, scanner::write_file,
            scanner::list_directory, scanner::analyze_project_chunks,
            hardware::get_hardware_info, hardware::get_recommended_models,
        ])
        .run(tauri::generate_context!())
        .expect("Error corriendo LocalCoder");
}
