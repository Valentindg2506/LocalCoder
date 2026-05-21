#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod db;
mod hardware;
mod ollama;
mod scanner;
use db::{AppState, DbConn};
use std::sync::Mutex;

fn main() {
    let conn = db::init_db();
    tauri::Builder::default()
        .manage(AppState { db: Mutex::new(DbConn { conn }) })
        .invoke_handler(tauri::generate_handler![
            db::get_sessions, db::create_session, db::delete_session,
            db::get_messages, db::add_message,
            ollama::list_models, ollama::chat_stream, ollama::pull_model,
            scanner::list_directory, scanner::read_file, scanner::write_file,
            scanner::analyze_project_chunks,
            hardware::get_hardware_info, hardware::get_recommended_models,
        ])
        .run(tauri::generate_context!())
        .expect("Error corriendo LocalCoder");
}
