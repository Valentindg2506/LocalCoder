import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Session, Message, OllamaModel, HardwareInfo, FileNode } from "../types";

const STORAGE_KEY = "lc_project";

interface AppStore {
  sessions: Session[];
  activeSession: Session | null;
  messages: Message[];
  models: OllamaModel[];
  hardware: HardwareInfo | null;
  activeFile: string | null;
  fileContent: string;
  projectPath: string | null;
  projectTree: FileNode[];
  isStreaming: boolean;
  streamBuffer: string;
  openTabs: string[];

  loadSessions: () => Promise<void>;
  createSession: (name: string, projectPath?: string, model?: string) => Promise<Session>;
  setActiveSession: (s: Session) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  loadModels: () => Promise<void>;
  loadHardware: () => Promise<void>;
  setActiveFile: (path: string) => Promise<void>;
  closeTab: (path: string) => void;
  saveFile: () => Promise<void>;
  setFileContent: (c: string) => void;
  setProjectPath: (p: string) => void;
  loadProjectTree: (path: string) => Promise<void>;
  appendStream: (token: string) => void;
}

// Restore persisted project path
const savedProject = localStorage.getItem(STORAGE_KEY);

export const useStore = create<AppStore>((set, get) => ({
  sessions: [], activeSession: null, messages: [], models: [],
  hardware: null, activeFile: null, fileContent: "",
  projectPath: savedProject || null,
  projectTree: [],
  isStreaming: false, streamBuffer: "",
  openTabs: [],

  loadSessions: async () => set({ sessions: await invoke<Session[]>("get_sessions") }),

  createSession: async (name, projectPath, model = "llama3.1:8b") => {
    const session = await invoke<Session>("create_session", { name, projectPath, model });
    set(s => ({ sessions: [session, ...s.sessions], activeSession: session, messages: [] }));
    return session;
  },

  setActiveSession: async (session) => {
    const messages = await invoke<Message[]>("get_messages", { sessionId: session.id });
    set({ activeSession: session, messages });
  },

  deleteSession: async (id) => {
    await invoke("delete_session", { id });
    set(s => ({
      sessions: s.sessions.filter(x => x.id !== id),
      activeSession: s.activeSession?.id === id ? null : s.activeSession,
      messages: s.activeSession?.id === id ? [] : s.messages,
    }));
  },

  sendMessage: async (content) => {
    const { activeSession, messages } = get();
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
    invoke("chat_stream", { model: activeSession.model, messages: chatMessages, sessionId: activeSession.id });
  },

  loadModels: async () => {
    try { set({ models: await invoke<OllamaModel[]>("list_models") }); }
    catch { set({ models: [] }); }
  },

  loadHardware: async () => set({ hardware: await invoke<HardwareInfo>("get_hardware_info") }),

  setActiveFile: async (path) => {
    const content = await invoke<string>("read_file", { path });
    set(s => ({
      activeFile: path,
      fileContent: content,
      openTabs: s.openTabs.includes(path) ? s.openTabs : [...s.openTabs, path],
    }));
  },

  closeTab: (path) => {
    set(s => {
      const tabs = s.openTabs.filter(t => t !== path);
      const newActive = s.activeFile === path
        ? (tabs.length > 0 ? tabs[tabs.length - 1] : null)
        : s.activeFile;
      return { openTabs: tabs, activeFile: newActive };
    });
  },

  saveFile: async () => {
    const { activeFile, fileContent } = get();
    if (activeFile) await invoke("write_file", { path: activeFile, content: fileContent });
  },

  setFileContent: c => set({ fileContent: c }),

  setProjectPath: (p) => {
    localStorage.setItem(STORAGE_KEY, p);
    set({ projectPath: p });
  },

  loadProjectTree: async (path) => {
    const nodes = await invoke<FileNode[]>("list_directory", { path });
    set({ projectTree: nodes, projectPath: path });
    localStorage.setItem(STORAGE_KEY, path);
  },

  appendStream: token => set(s => ({ streamBuffer: s.streamBuffer + token })),
}));
