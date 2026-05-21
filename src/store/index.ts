import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Session, Message, OllamaModel, HardwareInfo } from "../types";

interface AppStore {
  sessions:Session[]; activeSession:Session|null; messages:Message[];
  models:OllamaModel[]; hardware:HardwareInfo|null;
  activeFile:string|null; fileContent:string;
  projectPath:string|null; isStreaming:boolean; streamBuffer:string;
  loadSessions:()=>Promise<void>;
  createSession:(name:string,projectPath?:string,model?:string)=>Promise<Session>;
  setActiveSession:(s:Session)=>Promise<void>;
  deleteSession:(id:string)=>Promise<void>;
  sendMessage:(content:string)=>Promise<void>;
  loadModels:()=>Promise<void>;
  loadHardware:()=>Promise<void>;
  setActiveFile:(path:string)=>Promise<void>;
  saveFile:()=>Promise<void>;
  setFileContent:(c:string)=>void;
  setProjectPath:(p:string)=>void;
  appendStream:(token:string)=>void;
}

export const useStore = create<AppStore>((set,get) => ({
  sessions:[], activeSession:null, messages:[], models:[],
  hardware:null, activeFile:null, fileContent:"",
  projectPath:null, isStreaming:false, streamBuffer:"",

  loadSessions: async () => set({ sessions: await invoke<Session[]>("get_sessions") }),

  createSession: async (name, projectPath, model="llama3.1:8b") => {
    const session = await invoke<Session>("create_session", { name, projectPath, model });
    set(s => ({ sessions:[session,...s.sessions], activeSession:session, messages:[] }));
    return session;
  },

  setActiveSession: async (session) => {
    const messages = await invoke<Message[]>("get_messages", { sessionId:session.id });
    set({ activeSession:session, messages });
  },

  deleteSession: async (id) => {
    await invoke("delete_session", { id });
    set(s => ({
      sessions: s.sessions.filter(x => x.id!==id),
      activeSession: s.activeSession?.id===id ? null : s.activeSession,
      messages: s.activeSession?.id===id ? [] : s.messages,
    }));
  },

  sendMessage: async (content) => {
    const { activeSession, messages } = get();
    if (!activeSession) return;
    const userMsg = await invoke<Message>("add_message", { sessionId:activeSession.id, role:"user", content });
    set(s => ({ messages:[...s.messages, userMsg], isStreaming:true, streamBuffer:"" }));
    const chatMessages = [...messages, userMsg].map(m => ({ role:m.role, content:m.content }));
    const ul1 = await listen<string>(`chat_token_${activeSession.id}`, e => get().appendStream(e.payload));
    const ul2 = await listen<string>(`chat_done_${activeSession.id}`, async e => {
      ul1(); ul2();
      const assistantMsg = await invoke<Message>("add_message", { sessionId:activeSession.id, role:"assistant", content:e.payload });
      set(s => ({ messages:[...s.messages, assistantMsg], isStreaming:false, streamBuffer:"" }));
    });
    invoke("chat_stream", { model:activeSession.model, messages:chatMessages, sessionId:activeSession.id });
  },

  loadModels: async () => { try { set({ models: await invoke<OllamaModel[]>("list_models") }); } catch { set({ models:[] }); } },
  loadHardware: async () => set({ hardware: await invoke<HardwareInfo>("get_hardware_info") }),
  setActiveFile: async (path) => { const content = await invoke<string>("read_file", { path }); set({ activeFile:path, fileContent:content }); },
  saveFile: async () => { const { activeFile, fileContent } = get(); if (activeFile) await invoke("write_file", { path:activeFile, content:fileContent }); },
  setFileContent: c => set({ fileContent:c }),
  setProjectPath: p => set({ projectPath:p }),
  appendStream: token => set(s => ({ streamBuffer: s.streamBuffer+token })),
}));
