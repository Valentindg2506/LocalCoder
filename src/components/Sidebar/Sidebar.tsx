import { useStore } from "../../store";
import { MessageSquare, Trash2, Plus } from "lucide-react";
import FileExplorer from "../Explorer/FileTree";

export default function Sidebar() {
  const { sessions, activeSession, setActiveSession, deleteSession, createSession, models } = useStore();

  return (
    <div className="flex flex-col bg-[#181825] border-r border-[#11111b] overflow-hidden flex-shrink-0" style={{width:220}}>
      {/* Sessions section */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#11111b]">
          <span className="text-[10px] font-semibold text-[#45475a] uppercase tracking-widest">Sesiones</span>
          <button
            onClick={() => createSession("Nueva sesión", undefined, models[0]?.name || "llama3.1:8b")}
            title="Nueva sesión"
            className="text-[#45475a] hover:text-[#89b4fa] transition-colors p-0.5 rounded"
          >
            <Plus size={13}/>
          </button>
        </div>
        <div className="overflow-y-auto" style={{maxHeight:160}}>
          {sessions.length === 0 && (
            <p className="text-[11px] text-[#45475a] px-3 py-3 italic">Sin sesiones aún</p>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => setActiveSession(s)}
              className={"group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors " +
                (activeSession?.id === s.id
                  ? "bg-[#2a2b3d] text-[#89b4fa]"
                  : "hover:bg-[#1e1e2e] text-[#a6adc8]")}
            >
              <MessageSquare size={11} className="flex-shrink-0 opacity-60"/>
              <span className="text-xs truncate flex-1">{s.name}</span>
              <button
                onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                className="opacity-0 group-hover:opacity-100 text-[#f38ba8] hover:text-[#f38ba8] transition-all flex-shrink-0"
              >
                <Trash2 size={10}/>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* File explorer */}
      <div className="flex-1 overflow-hidden border-t border-[#11111b]">
        <FileExplorer />
      </div>
    </div>
  );
}
