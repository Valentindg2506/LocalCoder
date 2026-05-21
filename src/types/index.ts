export interface Session {
  id: string;
  name: string;
  project_path?: string;
  model: string;
  created_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface HardwareInfo {
  cpu_brand: string;
  cpu_cores: number;
  total_ram_gb: number;
  free_ram_gb: number;
  gpu_name?: string;
}

export interface FileNode {
  path: string;
  name: string;
  is_dir: boolean;
  size: number;
  extension: string;
  children: FileNode[];
}

export interface AnalysisChunk {
  file_path: string;
  content: string;
  start_line: number;
  end_line: number;
}

export interface SearchMatch {
  file_path: string;
  line_number: number;
  line_content: string;
  col_start: number;
}

export interface Settings {
  ollamaUrl: string;
  defaultModel: string;
  fontSize: number;
  aiCompletionsEnabled: boolean;
  theme: "dark" | "darker";
  tabSize: number;
  wordWrap: boolean;
  autoSave: boolean;
  autoSaveDelay: number; // ms
}

export const DEFAULT_SETTINGS: Settings = {
  ollamaUrl: "http://localhost:11434",
  defaultModel: "llama3.1:8b",
  fontSize: 13.5,
  aiCompletionsEnabled: true,
  theme: "darker",
  tabSize: 2,
  wordWrap: false,
  autoSave: false,
  autoSaveDelay: 2000,
};
