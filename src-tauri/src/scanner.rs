use serde::{Deserialize, Serialize};
use walkdir::WalkDir;
use std::fs;
use tauri::Window;

const CODE_EXT: &[&str] = &["php","js","ts","tsx","jsx","py","rs","go","java","kt","c","cpp","h","css","html","sql","json","yaml","yml","toml","sh","md","xml","rb","dart","vue","svelte"];
const IGNORE: &[&str] = &["node_modules",".git","vendor","dist","build","target",".cache","__pycache__",".venv","venv"];

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileNode { pub path:String, pub name:String, pub is_dir:bool, pub size:u64, pub extension:String, pub children:Vec<FileNode> }
#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectScan { pub root:String, pub total_files:usize, pub total_lines:usize, pub files:Vec<ScannedFile> }
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScannedFile { pub path:String, pub extension:String, pub size:u64, pub lines:usize }
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AnalysisChunk { pub file_path:String, pub content:String, pub start_line:usize, pub end_line:usize }

#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<FileNode>, String> {
    fn build(p: &std::path::Path, depth: u32) -> FileNode {
        let name = p.file_name().unwrap_or_default().to_string_lossy().to_string();
        let is_dir = p.is_dir();
        let size = if is_dir { 0 } else { fs::metadata(p).map(|m| m.len()).unwrap_or(0) };
        let ext = p.extension().unwrap_or_default().to_string_lossy().to_string();
        let mut children = vec![];
        if is_dir && depth < 30 && !IGNORE.contains(&name.as_str()) {
            if let Ok(rd) = fs::read_dir(p) {
                let mut entries: Vec<_> = rd.filter_map(|e| e.ok()).collect();
                entries.sort_by(|a,b| b.path().is_dir().cmp(&a.path().is_dir()).then(a.file_name().cmp(&b.file_name())));
                for e in entries {
                    let n = e.file_name().to_string_lossy().to_string();
                    if !n.starts_with('.') || n == ".env" { children.push(build(&e.path(), depth+1)); }
                }
            }
        }
        FileNode { path: p.to_string_lossy().to_string(), name, is_dir, size, extension: ext, children }
    }
    let p = std::path::Path::new(&path);
    if !p.exists() { return Err(format!("Ruta no encontrada: {}", path)); }
    Ok(vec![build(p, 0)])
}

#[tauri::command]
pub fn scan_project(path: String) -> Result<ProjectScan, String> {
    let mut files = vec![];
    let mut total_lines = 0usize;
    for entry in WalkDir::new(&path).follow_links(false).into_iter()
        .filter_entry(|e| { let n = e.file_name().to_string_lossy(); !IGNORE.contains(&n.as_ref()) && !n.starts_with('.') })
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            let fp = entry.path();
            let ext = fp.extension().unwrap_or_default().to_string_lossy().to_string();
            if CODE_EXT.contains(&ext.to_lowercase().as_str()) {
                let size = fp.metadata().map(|m| m.len()).unwrap_or(0);
                let lines = if size < 10_000_000 { fs::read_to_string(fp).map(|c| c.lines().count()).unwrap_or(0) } else { 0 };
                total_lines += lines;
                files.push(ScannedFile { path: fp.to_string_lossy().to_string(), extension: ext, size, lines });
            }
        }
    }
    Ok(ProjectScan { root: path, total_files: files.len(), total_lines, files })
}

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Error leyendo {}: {}", path, e))
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("Error escribiendo {}: {}", path, e))
}

#[tauri::command]
pub async fn analyze_project_chunks(window: Window, project_path: String, chunk_size: usize) -> Result<usize, String> {
    let scan = scan_project(project_path)?;
    let chunk_lines = if chunk_size == 0 { 80 } else { chunk_size };
    let mut total = 0;
    for file in &scan.files {
        if let Ok(content) = fs::read_to_string(&file.path) {
            let lines: Vec<&str> = content.lines().collect();
            let mut start = 0;
            while start < lines.len() {
                let end = (start + chunk_lines).min(lines.len());
                window.emit("analysis_chunk", &AnalysisChunk {
                    file_path: file.path.clone(), content: lines[start..end].join("\n"),
                    start_line: start+1, end_line: end,
                }).ok();
                total += 1; start = end;
            }
        }
    }
    window.emit("analysis_complete", scan.total_files).ok();
    Ok(total)
}
