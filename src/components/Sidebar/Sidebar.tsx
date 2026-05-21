import { useState } from "react";
import { useStore } from "../../store";
import { MessageSquare, Trash2, Plus, ChevronDown, ChevronRight, Zap, Search, Settings, GitBranch, FolderTree } from "lucide-react";
import FileExplorer from "../Explorer/FileTree";
import SearchPanel from "../Search/SearchPanel";
import SettingsPanel from "../Settings/SettingsPanel";

type SideView = "explorer" | "search" | "settings";

export default function Sidebar() {
  const { sessions, activeSession, setActiveSession, deleteSession, createSession, models, gitBranch, gitChanges, settings } = useStore();
  const [sessionsOpen, setSessionsOpen] = useState(true);
  const [sideView, setSideView] = useState<SideView>("explorer");

  return (
    <div
      className="flex flex-col overflow-hidden flex-shrink-0"
      style={{ width: 220, background: "#0f0f1a", borderRight: "1px solid #1e1e35" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid #1e1e35" }}>
        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#3b82f6)" }}>
          <Zap size={11} color="#fff" />
        </div>
        <span className="text-xs font-bold tracking-wide" style={{ color: "#d4d6f0" }}>LocalCoder</span>
        {activeSession && (
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-mono truncate max-w-[80px]" style={{ background: "#1e1e35", color: "#818cf8" }}>
            {activeSession.model.split(":")[0]}
          </span>
        )}
      </div>

      {/* Sessions */}
      <div className="flex-shrink-0">
        <button
          onClick={() => setSessionsOpen(o => !o)}
          className="flex items-center gap-1.5 w-full px-3 py-1.5 transition-colors hover:bg-white/5"
          style={{ color: "#3a3a5c" }}
        >
          {sessionsOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          <span className="text-[10px] font-semibold uppercase tracking-widest">Sesiones</span>
          <button
            onClick={e => { e.stopPropagation(); createSession("Nueva sesión", undefined, models[0]?.name || settings.defaultModel); }}
            className="ml-auto p-0.5 rounded hover:opacity-100 opacity-50 transition-opacity"
            style={{ color: "#818cf8" }}
            title="Nueva sesión"
          >
            <Plus size={11} />
          </button>
        </button>
        {sessionsOpen && (
          <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
            {sessions.length === 0 && (
              <p className="text-[11px] px-4 py-2 italic" style={{ color: "#2e2e4a" }}>Sin sesiones</p>
            )}
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => setActiveSession(s)}
                className="group flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-all hover:bg-white/5"
                style={{
                  borderLeft: activeSession?.id === s.id ? "2px solid #7c3aed" : "2px solid transparent",
                  background: activeSession?.id === s.id ? "#1a1a2e" : undefined,
                }}
              >
                <MessageSquare size={10} style={{ color: activeSession?.id === s.id ? "#818cf8" : "#2e2e4a", flexShrink: 0 }} />
                <span className="text-xs truncate flex-1" style={{ color: activeSession?.id === s.id ? "#c7d2fe" : "#6b6b8a" }}>{s.name}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "#f87171" }}
                >
                  <Trash2 size={9} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: "#1e1e35", margin: "2px 12px" }} />

      {/* View switcher tabs */}
      <div className="flex items-center gap-0.5 px-2 py-1 flex-shrink-0" style={{ borderBottom: "1px solid #1e1e35" }}>
        {([
          { id: "explorer", icon: <FolderTree size={11} />, title: "Explorador" },
          { id: "search",   icon: <Search size={11} />,     title: "Buscar (Ctrl+Shift+F)" },
          { id: "settings", icon: <Settings size={11} />,   title: "Configuración" },
        ] as { id: SideView; icon: React.ReactNode; title: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSideView(tab.id)}
            title={tab.title}
            className="flex-1 flex items-center justify-center py-1 rounded transition-all"
            style={{ color: sideView === tab.id ? "#818cf8" : "#3a3a5c", background: sideView === tab.id ? "#1e1e35" : "transparent" }}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      {/* Git branch badge (only in explorer) */}
      {sideView === "explorer" && gitBranch && (
        <div className="flex items-center gap-1.5 px-3 py-1 flex-shrink-0" style={{ borderBottom: "1px solid #1e1e35" }}>
          <GitBranch size={10} style={{ color: "#818cf8", flexShrink: 0 }} />
          <span className="text-[10px] font-mono truncate" style={{ color: "#818cf8" }}>{gitBranch}</span>
          {gitChanges.length > 0 && (
            <span className="ml-auto text-[9px] px-1 rounded" style={{ background: "#2a1a0f", color: "#fb923c" }}>{gitChanges.length}</span>
          )}
        </div>
      )}

      {/* Panel area */}
      <div className="flex-1 overflow-hidden">
        {sideView === "explorer" && <FileExplorer />}
        {sideView === "search" && <SearchPanel />}
        {sideView === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}
