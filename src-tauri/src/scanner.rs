use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::{Window, Emitter};
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileNode {
    pub path: String, pub name: String, pub is_dir: bool,
    pub size: u64, pub extension: String, pub children: Vec<FileNode>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AnalysisChunk {
    pub file_path: String, pub content: String,
    pub start_line: usize, pub end_line: usize,
}

#[derive(Default)]
pub struct ProjectScan { pub total_files: usize }

const CODE_EXTENSIONS: &[&str] = &[
    "php","js","ts","tsx","jsx","py","rs","sql","css","html","json",
    "md","sh","yaml","yml","toml","vue","svelte","java","go","rb","c","cpp","h",
];
const IGNORED_DIRS: &[&str] = &["node_modules","target",".git","dist","build",".cache","vendor"];

#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<FileNode>, String> {
    let p = Path::new(&path);
    if !p.exists() { return Err("Ruta no existe".into()); }
    Ok(read_dir_recursive(p, 0))
}

fn read_dir_recursive(path: &Path, depth: usize) -> Vec<FileNode> {
    if depth > 5 { return vec![]; }
    let mut entries: Vec<FileNode> = vec![];
    let Ok(dir) = std::fs::read_dir(path) else { return vec![]; };
    let mut items: Vec<_> = dir.filter_map(|e| e.ok()).collect();
    items.sort_by_key(|e| (!e.file_type().map(|t| t.is_dir()).unwrap_or(false), e.file_name()));
    for entry in items {
        let ep = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') { continue; }
        let is_dir = ep.is_dir();
        if is_dir && IGNORED_DIRS.contains(&name.as_str()) { continue; }
        let ext = ep.extension().and_then(|e| e.to_str()).unwrap_or("").to_string();
        let size = if is_dir { 0 } else { std::fs::metadata(&ep).map(|m| m.len()).unwrap_or(0) };
        let children = if is_dir { read_dir_recursive(&ep, depth + 1) } else { vec![] };
        entries.push(FileNode { path: ep.to_string_lossy().to_string(), name, is_dir, size, extension: ext, children });
    }
    entries
}

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn analyze_project_chunks(window: Window, path: String) -> Result<usize, String> {
    let mut scan = ProjectScan::default();
    for entry in WalkDir::new(&path).into_iter().filter_map(|e| e.ok()) {
        let ep = entry.path();
        if !ep.is_file() { continue; }
        let parts: Vec<&str> = ep.to_str().unwrap_or("").split('/').collect();
        if parts.iter().any(|p| IGNORED_DIRS.contains(p)) { continue; }
        let ext = ep.extension().and_then(|e| e.to_str()).unwrap_or("");
        if !CODE_EXTENSIONS.contains(&ext) { continue; }
        let Ok(content) = std::fs::read_to_string(ep) else { continue; };
        let lines: Vec<&str> = content.lines().collect();
        let chunk_size = 100usize;
        let mut start = 0usize;
        while start < lines.len() {
            let end = (start + chunk_size).min(lines.len());
            let chunk_content = lines[start..end].join("\n");
            window.emit("analysis_chunk", &AnalysisChunk {
                file_path: ep.to_string_lossy().to_string(),
                content: chunk_content,
                start_line: start + 1,
                end_line: end,
            }).ok();
            start = end;
            scan.total_files += 1;
        }
    }
    window.emit("analysis_complete", scan.total_files).ok();
    Ok(scan.total_files)
}
