import { useState } from "react";
import { useStore } from "../../store";
import { MessageSquare, Trash2, Plus, ChevronDown, ChevronRight, Zap } from "lucide-react";
import FileExplorer from "../Explorer/FileTree";

export default function Sidebar() {
  const { sessions, activeSession, setActiveSession, deleteSession, createSession, models } = useStore();
  const [sessionsOpen, setSessionsOpen] = useState(true);
  const [explorerOpen, setExplorerOpen] = useState(true);

  return (
    <div
      className="flex flex-col overflow-hidden flex-shrink-0 border-r"
      style={{
        width: 230,
        background: "#0a0a11",
        borderColor: "#1a1a2e",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0" style={{borderColor:"#1a1a2e"}}>
        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{background:"linear-gradient(135deg,#7c3aed,#3b82f6)"}}>
          <Zap size={11} color="#fff"/>
        </div>
        <span className="text-xs font-bold tracking-wide" style={{color:"#e2e4f0"}}>LocalCoder</span>
        {activeSession && (
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-mono truncate max-w-[80px]" style={{background:"#1a1a2e",color:"#818cf8"}}>
            {activeSession.model.split(":")[0]}
          </span>
        )}
      </div>

      {/* Sessions */}
      <div className="flex-shrink-0">
        <button
          onClick={() => setSessionsOpen(o => !o)}
          className="flex items-center gap-1.5 w-full px-3 py-1.5 transition-colors hover:opacity-80"
          style={{color:"#4a4a6a"}}
        >
          {sessionsOpen ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
          <span className="text-[10px] font-semibold uppercase tracking-widest">Sesiones</span>
          <button
            onClick={e => { e.stopPropagation(); createSession("Nueva sesi\u00f3n", undefined, models[0]?.name || "llama3.1:8b"); }}
            className="ml-auto p-0.5 rounded transition-colors hover:opacity-100"
            style={{color:"#4a4a6a"}}
            title="Nueva sesi\u00f3n"
          >
            <Plus size={11}/>
          </button>
        </button>

        {sessionsOpen && (
          <div className="overflow-y-auto" style={{maxHeight:150}}>
            {sessions.length === 0 && (
              <p className="text-[11px] px-4 py-2 italic" style={{color:"#2e2e4a"}}>Sin sesiones</p>
            )}
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => setActiveSession(s)}
                className="group flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-all"
                style={{
                  background: activeSession?.id === s.id ? "#131320" : "transparent",
                  borderLeft: activeSession?.id === s.id ? "2px solid #7c3aed" : "2px solid transparent",
                }}
              >
                <MessageSquare size={10} style={{color: activeSession?.id===s.id ? "#818cf8" : "#3a3a5c", flexShrink:0}}/>
                <span className="text-xs truncate flex-1" style={{color: activeSession?.id===s.id ? "#c7d2fe" : "#6b6b8a"}}>{s.name}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{color:"#f87171"}}
                >
                  <Trash2 size={9}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 my-1" style={{height:1, background:"#1a1a2e"}}/>

      {/* Explorer */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <button
          onClick={() => setExplorerOpen(o => !o)}
          className="flex items-center gap-1.5 w-full px-3 py-1.5 flex-shrink-0 transition-colors hover:opacity-80"
          style={{color:"#4a4a6a"}}
        >
          {explorerOpen ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
          <span className="text-[10px] font-semibold uppercase tracking-widest">Explorador</span>
        </button>
        {explorerOpen && (
          <div className="flex-1 overflow-hidden">
            <FileExplorer />
          </div>
        )}
      </div>
    </div>
  );
}
