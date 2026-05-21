import { useStore } from "../../store";
import { X } from "lucide-react";

const EXT_COLOR: Record<string,string> = {
  php:"#7dd3fc", js:"#fbbf24", ts:"#818cf8", tsx:"#67e8f9", jsx:"#fde68a",
  py:"#86efac", rs:"#fb923c", sql:"#e879f9", css:"#c4b5fd", html:"#f87171",
  json:"#fcd34d", md:"#94a3b8", sh:"#a3e635", vue:"#4ade80", scss:"#c084fc",
  toml:"#fb923c", yaml:"#60a5fa", xml:"#f87171",
};

const EXT_ICON: Record<string,string> = {
  tsx:"⚛", jsx:"⚛", ts:"TS", js:"JS", php:"PHP", py:"PY",
  rs:"RS", sql:"DB", css:"CSS", scss:"CSS", html:"HTML",
  json:"{ }", md:"MD", sh:"SH", vue:"VUE", yaml:"YML",
};

export default function TabBar() {
  const { openTabs, activeFile, setActiveFile, closeTab } = useStore();

  if (!openTabs || openTabs.length === 0) {
    return <div style={{height:38, background:"#0d0d14", borderBottom:"1px solid #1a1a2e"}} className="flex-shrink-0" />;
  }

  return (
    <div
      className="flex items-end overflow-x-auto flex-shrink-0"
      style={{height:38, background:"#0d0d14", borderBottom:"1px solid #1a1a2e"}}
    >
      {openTabs.map(tab => {
        const name = tab.split("/").pop() || tab;
        const ext = name.split(".").pop()?.toLowerCase() || "";
        const color = EXT_COLOR[ext] || "#6b6b8a";
        const icon = EXT_ICON[ext] || null;
        const isActive = activeFile === tab;
        return (
          <div
            key={tab}
            onClick={() => setActiveFile(tab)}
            className="group flex items-center gap-1.5 px-3 h-full cursor-pointer transition-all flex-shrink-0 max-w-[200px] relative"
            style={{
              background: isActive ? "#131320" : "transparent",
              borderBottom: isActive ? "2px solid #7c3aed" : "2px solid transparent",
              borderRight: "1px solid #1a1a2e",
            }}
          >
            {icon && (
              <span className="text-[9px] font-bold flex-shrink-0" style={{color}}>{icon}</span>
            )}
            <span
              className="text-xs truncate"
              style={{color: isActive ? "#e2e4f0" : "#4a4a6a", fontFamily:"'JetBrains Mono', monospace"}}
            >
              {name}
            </span>
            <button
              onClick={e => { e.stopPropagation(); closeTab(tab); }}
              className="ml-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity flex-shrink-0"
              style={{color:"#f87171"}}
            >
              <X size={10} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
