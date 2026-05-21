import { useStore } from "../../store";
import { Code2, RefreshCw } from "lucide-react";
export default function Topbar() {
  const { activeSession, loadModels } = useStore();
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-[#181825] border-b border-[#313244] h-10 flex-shrink-0">
      <Code2 size={16} className="text-[#89b4fa]" />
      <span className="text-sm font-bold text-[#89b4fa]">LocalCoder</span>
      {activeSession && <>
        <span className="text-[#6c7086] text-xs">·</span>
        <span className="text-xs text-[#6c7086] truncate max-w-xs">{activeSession.name}</span>
        <span className="text-xs text-[#6c7086] ml-1">— {activeSession.model}</span>
      </>}
      <button onClick={loadModels} className="ml-auto text-[#6c7086] hover:text-[#cdd6f4] transition-colors" title="Recargar modelos">
        <RefreshCw size={14} />
      </button>
    </div>
  );
}
