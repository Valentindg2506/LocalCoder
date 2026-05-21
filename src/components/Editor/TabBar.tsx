import { useStore } from "../../store";
import { X, FileCode } from "lucide-react";

const EXT_COLOR: Record<string,string> = {
  php:"#7dd3fc", js:"#fde047", ts:"#93c5fd", tsx:"#67e8f9", jsx:"#fef08a",
  py:"#86efac", rs:"#fb923c", sql:"#f0abfc", css:"#c4b5fd", html:"#fca5a5",
  json:"#fcd34d", md:"#94a3b8", sh:"#a3e635", vue:"#86efac",
};

export default function TabBar() {
  const { openTabs, activeFile, setActiveFile, closeTab } = useStore();

  if (!openTabs || openTabs.length === 0) {
    return <div className="h-9 bg-[#181825] border-b border-[#11111b] flex-shrink-0" />;
  }

  return (
    <div className="flex items-end bg-[#181825] border-b border-[#11111b] overflow-x-auto flex-shrink-0 scrollbar-none" style={{height:36}}>
      {openTabs.map(tab => {
        const name = tab.split("/").pop() || tab;
        const ext = name.split(".").pop() || "";
        const color = EXT_COLOR[ext] || "#6c7086";
        const isActive = activeFile === tab;
        return (
          <div
            key={tab}
            onClick={() => setActiveFile(tab)}
            className={"group flex items-center gap-1.5 px-3 h-full border-r border-[#11111b] cursor-pointer text-xs transition-colors flex-shrink-0 max-w-[180px] " +
              (isActive
                ? "bg-[#1e1e2e] text-[#cdd6f4] border-t-2 border-t-[#89b4fa]"
                : "bg-[#181825] text-[#6c7086] hover:bg-[#1e1e2e] hover:text-[#a6adc8] border-t-2 border-t-transparent")}
          >
            <FileCode size={11} style={{color}} className="flex-shrink-0" />
            <span className="truncate">{name}</span>
            {closeTab && (
              <button
                onClick={e => { e.stopPropagation(); closeTab(tab); }}
                className="ml-auto pl-1 opacity-0 group-hover:opacity-100 hover:text-[#f38ba8] transition-all flex-shrink-0"
              >
                <X size={10} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
