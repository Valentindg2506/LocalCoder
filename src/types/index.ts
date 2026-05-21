export interface Session { id:string; name:string; project_path?:string; model:string; created_at:string; updated_at:string; }
export interface Message { id:number; session_id:string; role:"user"|"assistant"|"system"; content:string; created_at:string; }
export interface OllamaModel { name:string; size:number; digest:string; modified_at:string; }
export interface HardwareInfo { total_ram_gb:number; available_ram_gb:number; cpu_name:string; cpu_cores:number; os:string; }
export interface ModelRecommendation { name:string; display_name:string; size_gb:number; min_ram_gb:number; description:string; tags:string[]; pull_name:string; }
export interface FileNode { path:string; name:string; is_dir:boolean; size:number; extension:string; children:FileNode[]; }
export interface AnalysisChunk { file_path:string; content:string; start_line:number; end_line:number; }
