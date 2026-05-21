import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Session, Message, OllamaModel, HardwareInfo, FileNode, AnalysisChunk } from "../types";

const PROJECT_KEY = "lc_project";
const SESSION_KEY = "lc_session_id";
const TABS_KEY = "lc_tabs";
const ACTIVE_FILE_KEY = "lc_active_file";

function lsGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch {}
}
function lsDel(key: string) {
  try { localStorage.removeItem(key); } catch {}
}

interface AppStore {
  sessions: Session[];
  activeSession: Session | null;
  messages: Message[];
  models: OllamaModel[];
  modelsError: string | null;
  hardware: HardwareInfo | null;
  activeFile: string | null;
  fileContent: string;
  unsavedFiles: Set<string>;
  projectPath: string | null;
  projectTree: FileNode[];
  projectChunks: string[];
  isIndexing: boolean;
  indexProgress: number;
  isStreaming: boolean;
  streamBuffer: string;
  openTabs: string[];
  cursorLine: number;
  cursorCol: number;
  aiCompleting: boolean;   // inline completion in progress

  loadSessions: () => Promise<void>;
  createSession: (name: string, projectPath?: string, model?: string) => Promise<Session>;
  setActiveSession: (s: Session) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  indexProject: () => Promise<void>;
  loadModels: () => Promise<void>;
  loadHardware: () => Promise<void>;
  setActiveFile: (path: string) => Promise<void>;
  closeTab: (path: string) => void;
  saveFile: () => Promise<void>;
  setFileContent: (c: string) => void;
  markUnsaved: (path: string) => void;
  markSaved: (path: string) => void;
  setProjectPath: (p: string) => void;
  loadProjectTree: (path: string) => Promise<void>;
  setCursor: (line: number, col: number) => void;
  appendStream: (token: string) => void;
  setAiCompleting: (v: boolean) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  sessions: [], activeSession: null, messages: [], models: [], modelsError: null,
  hardware: null, activeFile: null, fileContent: "", unsavedFiles: new Set(),
  projectPath: lsGet(PROJECT_KEY), projectTree: [],
  projectChunks: [], isIndexing: false, indexProgress: 0,
  isStreaming: false, streamBuffer: "",
  openTabs: [], cursorLine: 1, cursorCol: 1,
  aiCompleting: false,

  loadSessions: async () => {
    const sessions = await invoke<Session[]>("get_sessions");
    let activeSession: Session | null = null;
    let messages: Message[] = [];
    const savedId = lsGet(SESSION_KEY);
    if (savedId) {
      const found = sessions.find(s => s.id === savedId);
      if (found) { activeSession = found; messages = await invoke<Message[]>("get_messages", { sessionId: found.id }); }
    }
    const savedTabs = lsGet(TABS_KEY);
    const savedFile = lsGet(ACTIVE_FILE_KEY);
    const openTabs: string[] = savedTabs ? JSON.parse(savedTabs) : [];
    let fileContent = ""; let activeFile: string | null = null;
    if (savedFile && openTabs.includes(savedFile)) {
      try { fileContent = await invoke<string>("read_file", { path: savedFile }); activeFile = savedFile; }
      catch { lsDel(ACTIVE_FILE_KEY); }
    }
    set({ sessions, activeSession, messages, openTabs, activeFile, fileContent });
  },

  createSession: async (name, projectPath, model = "llama3.1:8b") => {
    const session = await invoke<Session>("create_session", { name, projectPath, model });
    lsSet(SESSION_KEY, session.id);
    set(s => ({ sessions: [session, ...s.sessions], activeSession: session, messages: [], openTabs: [], activeFile: null, fileContent: "" }));
    return session;
  },

  setActiveSession: async (session) => {
    const messages = await invoke<Message[]>("get_messages", { sessionId: session.id });
    lsSet(SESSION_KEY, session.id);
    set({ activeSession: session, messages });
  },

  deleteSession: async (id) => {
    await invoke("delete_session", { id });
    if (lsGet(SESSION_KEY) === id) lsDel(SESSION_KEY);
    set(s => ({
      sessions: s.sessions.filter(x => x.id !== id),
      activeSession: s.activeSession?.id === id ? null : s.activeSession,
      messages: s.activeSession?.id === id ? [] : s.messages,
    }));
  },

  sendMessage: async (content) => {
    const { activeSession, messages, projectPath, activeFile, projectChunks } = get();
    if (!activeSession) return;
    const userMsg = await invoke<Message>("add_message", { sessionId: activeSession.id, role: "user", content });
    set(s => ({ messages: [...s.messages, userMsg], isStreaming: true, streamBuffer: "" }));
    const chatMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    const ul1 = await listen<string>(`chat_token_${activeSession.id}`, e => get().appendStream(e.payload));
    const ul2 = await listen<string>(`chat_done_${activeSession.id}`, async e => {
      ul1(); ul2();
      const assistantMsg = await invoke<Message>("add_message", { sessionId: activeSession.id, role: "assistant", content: e.payload });
      set(s => ({ messages: [...s.messages, assistantMsg], isStreaming: false, streamBuffer: "" }));
    });
    invoke("chat_stream", {
      model: activeSession.model, messages: chatMessages, sessionId: activeSession.id,
      projectPath: projectPath ?? null, activeFile: activeFile ?? null, projectChunks,
    });
  },

  indexProject: async () => {
    const { projectPath } = get();
    if (!projectPath) return;
    set({ isIndexing: true, indexProgress: 0, projectChunks: [] });
    const chunks: string[] = [];
    const ul1 = await listen<AnalysisChunk>("analysis_chunk", e => {
      const { file_path, content, start_line, end_line } = e.payload;
      const fileName = file_path.split("/").pop() || file_path;
      chunks.push(`// ${fileName} (líneas ${start_line}-${end_line})\n${content}`);
      set(s => ({ indexProgress: s.indexProgress + 1 }));
    });
    const ul2 = await listen<number>("analysis_complete", () => {
      ul1(); ul2();
      set({ isIndexing: false, projectChunks: chunks });
    });
    try { await invoke("analyze_project_chunks", { path: projectPath }); }
    catch { ul1(); ul2(); set({ isIndexing: false }); }
  },

  loadModels: async () => {
    try { set({ models: await invoke<OllamaModel[]>("list_models"), modelsError: null }); }
    catch (e: any) { set({ models: [], modelsError: e?.message || "No se pudo conectar con Ollama" }); }
  },

  loadHardware: async () => set({ hardware: await invoke<HardwareInfo>("get_hardware_info") }),

  setActiveFile: async (path) => {
    try {
      const content = await invoke<string>("read_file", { path });
      set(s => {
        const openTabs = s.openTabs.includes(path) ? s.openTabs : [...s.openTabs, path];
        lsSet(TABS_KEY, JSON.stringify(openTabs)); lsSet(ACTIVE_FILE_KEY, path);
        return { activeFile: path, fileContent: content, openTabs, cursorLine: 1, cursorCol: 1 };
      });
    } catch (e: any) { console.error("Error al abrir archivo:", e); }
  },

  closeTab: (path) => {
    set(s => {
      const tabs = s.openTabs.filter(t => t !== path);
      const newActive = s.activeFile === path ? (tabs.length > 0 ? tabs[tabs.length - 1] : null) : s.activeFile;
      lsSet(TABS_KEY, JSON.stringify(tabs));
      if (newActive) lsSet(ACTIVE_FILE_KEY, newActive); else lsDel(ACTIVE_FILE_KEY);
      const unsaved = new Set(s.unsavedFiles); unsaved.delete(path);
      return { openTabs: tabs, activeFile: newActive, unsavedFiles: unsaved };
    });
  },

  saveFile: async () => {
    const { activeFile, fileContent } = get();
    if (activeFile) { await invoke("write_file", { path: activeFile, content: fileContent }); get().markSaved(activeFile); }
  },

  setFileContent: c => set({ fileContent: c }),
  markUnsaved: (path) => set(s => { const u = new Set(s.unsavedFiles); u.add(path); return { unsavedFiles: u }; }),
  markSaved: (path) => set(s => { const u = new Set(s.unsavedFiles); u.delete(path); return { unsavedFiles: u }; }),
  setProjectPath: (p) => { lsSet(PROJECT_KEY, p); set({ projectPath: p }); },

  loadProjectTree: async (path) => {
    const nodes = await invoke<FileNode[]>("list_directory", { path });
    lsSet(PROJECT_KEY, path); set({ projectTree: nodes, projectPath: path });
  },

  setCursor: (line, col) => set({ cursorLine: line, cursorCol: col }),
  appendStream: token => set(s => ({ streamBuffer: s.streamBuffer + token })),
  setAiCompleting: (v) => set({ aiCompleting: v }),
}));
