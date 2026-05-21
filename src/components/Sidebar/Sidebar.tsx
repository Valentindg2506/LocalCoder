import { useStore } from "../../store";
import FileExplorer from "../Explorer/FileTree";
import { MessageSquare, Trash2, Plus } from "lucide-react";
export default function Sidebar() {
  const { sessions, activeSession, setActiveSession, deleteSession, createSession, models } = useStore();
  return (
    <div className="flex flex-col bg-[#181825] border-r border-[#313244] overflow-hidden flex-shrink-0" style={{width:240}}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#313244] flex-shrink-0">
        <span className="text-xs text-[#6c7086] uppercase tracking-wider">Sesiones</span>
        <button onClick={() => createSession("Nueva sesión", undefined, models[0]?.name || "llama3.1:8b")}
          className="text-[#6c7086] hover:text-[#89b4fa] transition-colors"><Plus size={14}/></button>
      </div>
      <div className="overflow-y-auto scrollbar-thin flex-shrink-0" style={{maxHeight:200}}>
        {sessions.length===0 && <p className="text-xs text-[#6c7086] px-3 py-4">Sin sesiones aún</p>}
        {sessions.map(s => (
          <div key={s.id} onClick={()=>setActiveSession(s)}
            className={"flex items-center gap-2 px-3 py-2 cursor-pointer group " + (activeSession?.id===s.id ? "bg-[#313244] text-[#89b4fa]" : "hover:bg-[#313244] text-[#cdd6f4]")}>
            <MessageSquare size={12} className="flex-shrink-0"/>
            <span className="text-xs truncate flex-1">{s.name}</span>
            <button onClick={e=>{e.stopPropagation();deleteSession(s.id);}} className="opacity-0 group-hover:opacity-100 text-[#f38ba8] transition-opacity"><Trash2 size={11}/></button>
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-hidden border-t border-[#313244]"><FileExplorer /></div>
    </div>
  );
}
