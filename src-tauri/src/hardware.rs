use serde::{Deserialize, Serialize};
use sysinfo::{System, SystemExt, CpuExt};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HardwareInfo { pub total_ram_gb:f64, pub available_ram_gb:f64, pub cpu_name:String, pub cpu_cores:usize, pub os:String }
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelRecommendation { pub name:String, pub display_name:String, pub size_gb:f64, pub min_ram_gb:f64, pub description:String, pub tags:Vec<String>, pub pull_name:String }

#[tauri::command]
pub fn get_hardware_info() -> HardwareInfo {
    let mut sys = System::new_all(); sys.refresh_all();
    HardwareInfo {
        total_ram_gb: ((sys.total_memory() as f64/1073741824.0)*10.0).round()/10.0,
        available_ram_gb: ((sys.available_memory() as f64/1073741824.0)*10.0).round()/10.0,
        cpu_name: sys.cpus().first().map(|c| c.brand().to_string()).unwrap_or_default(),
        cpu_cores: sys.cpus().len(),
        os: format!("{} {}", sys.name().unwrap_or_default(), sys.os_version().unwrap_or_default()),
    }
}

#[tauri::command]
pub fn get_recommended_models(ram_gb: f64) -> Vec<ModelRecommendation> {
    vec![
        ModelRecommendation { name:"phi4-mini".into(), display_name:"Phi 4 Mini".into(), size_gb:2.5, min_ram_gb:4.0, description:"Modelo ligero de Microsoft. R\u00e1pido para c\u00f3digo PHP, JS, Python.".into(), tags:vec!["ligero".into(),"r\u00e1pido".into()], pull_name:"phi4-mini".into() },
        ModelRecommendation { name:"qwen2.5-coder:3b".into(), display_name:"Qwen 2.5 Coder 3B".into(), size_gb:3.0, min_ram_gb:4.0, description:"Especializado en c\u00f3digo. Excelente con poca RAM.".into(), tags:vec!["c\u00f3digo".into(),"ligero".into()], pull_name:"qwen2.5-coder:3b".into() },
        ModelRecommendation { name:"llama3.2:3b".into(), display_name:"Llama 3.2 3B".into(), size_gb:3.0, min_ram_gb:4.0, description:"General de Meta, equilibrado para conversaci\u00f3n y c\u00f3digo.".into(), tags:vec!["general".into()], pull_name:"llama3.2:3b".into() },
        ModelRecommendation { name:"qwen2.5-coder:7b".into(), display_name:"Qwen 2.5 Coder 7B".into(), size_gb:6.0, min_ram_gb:8.0, description:"Recomendado para an\u00e1lisis de proyectos grandes. Muy bueno en PHP/JS.".into(), tags:vec!["c\u00f3digo".into(),"recomendado".into()], pull_name:"qwen2.5-coder:7b".into() },
        ModelRecommendation { name:"llama3.1:8b".into(), display_name:"Llama 3.1 8B".into(), size_gb:7.0, min_ram_gb:8.0, description:"Excelente razonamiento y explicaciones de c\u00f3digo.".into(), tags:vec!["general".into(),"razonamiento".into()], pull_name:"llama3.1:8b".into() },
        ModelRecommendation { name:"deepseek-coder-v2:16b".into(), display_name:"DeepSeek Coder V2 16B".into(), size_gb:14.0, min_ram_gb:16.0, description:"An\u00e1lisis profundo de proyectos grandes.".into(), tags:vec!["avanzado".into()], pull_name:"deepseek-coder-v2:16b".into() },
        ModelRecommendation { name:"qwen2.5-coder:32b".into(), display_name:"Qwen 2.5 Coder 32B".into(), size_gb:25.0, min_ram_gb:32.0, description:"El m\u00e1s potente en local. Para equipos high-end.".into(), tags:vec!["potente".into()], pull_name:"qwen2.5-coder:32b".into() },
    ].into_iter().filter(|m| m.min_ram_gb <= ram_gb).collect()
}
