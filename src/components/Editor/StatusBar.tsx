import { useStore } from "../../store";

const LANG_LABEL: Record<string,string> = {
  php:"PHP", js:"JavaScript", ts:"TypeScript", tsx:"TypeScript React", jsx:"JavaScript React",
  py:"Python", rs:"Rust", sql:"SQL", css:"CSS", html:"HTML", json:"JSON", md:"Markdown",
  sh:"Shell", yaml:"YAML", yml:"YAML", toml:"TOML", vue:"Vue", xml:"XML",
  c:"C", cpp:"C++", cs:"C#", go:"Go", rb:"Ruby",
};

export default function StatusBar() {
  const { activeFile, fileContent, activeSession, cursorLine, cursorCol } = useStore();
  const ext = activeFile?.split(".").pop()?.toLowerCase() || "";
  const lang = LANG_LABEL[ext] || "Texto";
  const lines = fileContent ? fileContent.split("\n").length : 0;
  const chars = fileContent ? fileContent.length : 0;

  return (
    <div
      className="flex items-center justify-between px-3 flex-shrink-0 select-none"
      style={{height:22, background:"#0f0f1a", borderTop:"1px solid #1e1e35", fontSize:11, color:"#3a3a5c"}}
    >
      {/* Left: model indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{background:"#7c3aed"}}/>
          <span style={{color:"#4a4a7a"}}>{activeSession?.model || "Sin modelo"}</span>
        </div>
      </div>

      {/* Right: file info */}
      <div className="flex items-center gap-4" style={{color:"#3a3a5c"}}>
        {activeFile && (
          <>
            <span style={{color:"#5a5a8a"}}>Ln {cursorLine}, Col {cursorCol}</span>
            <span>{lines} líneas</span>
            <span>{chars.toLocaleString()} chars</span>
            <span>UTF-8</span>
            <span style={{color:"#6b6b9a", fontWeight:600}}>{lang}</span>
          </>
        )}
      </div>
    </div>
  );
}
