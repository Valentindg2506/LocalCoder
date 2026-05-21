import { useStore } from "../store";
import { Zap } from "lucide-react";

export default function Topbar() {
  const { activeSession } = useStore();
  return (
    <div className="flex items-center h-9 bg-[#11111b] border-b border-[#181825] px-4 gap-3 flex-shrink-0 select-none" data-tauri-drag-region>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-[#89b4fa] rounded flex items-center justify-center">
          <Zap size={9} className="text-[#1e1e2e]"/>
        </div>
        <span className="text-xs font-semibold text-[#cdd6f4]">LocalCoder</span>
      </div>
      {activeSession && (
        <>
          <span className="text-[#313244]">|</span>
          <span className="text-xs text-[#6c7086] truncate max-w-[300px]">{activeSession.name}</span>
          <span className="text-[10px] bg-[#313244] text-[#89b4fa] px-1.5 py-0.5 rounded font-mono">{activeSession.model}</span>
        </>
      )}
    </div>
  );
}
