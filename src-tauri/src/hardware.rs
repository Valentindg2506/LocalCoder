use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HardwareInfo {
    pub total_ram_gb: f32,
    pub available_ram_gb: f32,
    pub cpu_name: String,
    pub cpu_cores: usize,
    pub os: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelRecommendation {
    pub name: String,
    pub display_name: String,
    pub size_gb: f32,
    pub min_ram_gb: f32,
    pub description: String,
    pub tags: Vec<String>,
    pub pull_name: String,
}

#[tauri::command]
pub fn get_hardware_info() -> HardwareInfo {
    let mut sys = System::new_all();
    sys.refresh_all();
    let total_ram = sys.total_memory() as f32 / 1_073_741_824.0;
    let available_ram = sys.available_memory() as f32 / 1_073_741_824.0;
    let cpu_name = sys.cpus().first().map(|c| c.brand().to_string()).unwrap_or_else(|| "Desconocido".into());
    let cpu_cores = sys.cpus().len();
    let os = format!("{} {}", System::name().unwrap_or_default(), System::os_version().unwrap_or_default());
    HardwareInfo { total_ram_gb: total_ram, available_ram_gb: available_ram, cpu_name, cpu_cores, os }
}

#[tauri::command]
pub fn get_recommended_models(ram_gb: f32) -> Vec<ModelRecommendation> {
    let all = vec![
        ModelRecommendation { name: "phi4-mini".into(), display_name: "Phi 4 Mini".into(), size_gb: 2.5, min_ram_gb: 4.0, description: "Modelo ligero de Microsoft. R\u{e1}pido para c\u{f3}digo PHP, JS, Python.".into(), tags: vec!["ligero".into(), "r\u{e1}pido".into()], pull_name: "phi4-mini".into() },
        ModelRecommendation { name: "qwen2.5-coder:3b".into(), display_name: "Qwen 2.5 Coder 3B".into(), size_gb: 3.0, min_ram_gb: 4.0, description: "Especializado en c\u{f3}digo. Excelente con poca RAM.".into(), tags: vec!["c\u{f3}digo".into(), "ligero".into()], pull_name: "qwen2.5-coder:3b".into() },
        ModelRecommendation { name: "llama3.2:3b".into(), display_name: "Llama 3.2 3B".into(), size_gb: 3.0, min_ram_gb: 4.0, description: "General de Meta, equilibrado para conversaci\u{f3}n y c\u{f3}digo.".into(), tags: vec!["general".into()], pull_name: "llama3.2:3b".into() },
        ModelRecommendation { name: "qwen2.5-coder:7b".into(), display_name: "Qwen 2.5 Coder 7B".into(), size_gb: 6.0, min_ram_gb: 8.0, description: "Recomendado para an\u{e1}lisis de proyectos grandes. Muy bueno en PHP/JS.".into(), tags: vec!["c\u{f3}digo".into(), "recomendado".into()], pull_name: "qwen2.5-coder:7b".into() },
        ModelRecommendation { name: "llama3.1:8b".into(), display_name: "Llama 3.1 8B".into(), size_gb: 7.0, min_ram_gb: 8.0, description: "Excelente razonamiento y explicaciones de c\u{f3}digo.".into(), tags: vec!["general".into(), "razonamiento".into()], pull_name: "llama3.1:8b".into() },
        ModelRecommendation { name: "deepseek-coder-v2:16b".into(), display_name: "DeepSeek Coder V2 16B".into(), size_gb: 14.0, min_ram_gb: 16.0, description: "An\u{e1}lisis profundo de proyectos grandes.".into(), tags: vec!["avanzado".into()], pull_name: "deepseek-coder-v2:16b".into() },
        ModelRecommendation { name: "qwen2.5-coder:32b".into(), display_name: "Qwen 2.5 Coder 32B".into(), size_gb: 25.0, min_ram_gb: 32.0, description: "El m\u{e1}s potente en local. Para equipos high-end.".into(), tags: vec!["potente".into()], pull_name: "qwen2.5-coder:32b".into() },
    ];
    all.into_iter().filter(|m| m.min_ram_gb <= ram_gb + 2.0).collect()
}
