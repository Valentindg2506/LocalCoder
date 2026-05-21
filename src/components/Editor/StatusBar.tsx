import { useStore } from "../../store";

const LANG_MAP: Record<string,string> = {
  php:"PHP", js:"JavaScript", ts:"TypeScript", tsx:"TypeScript React", jsx:"JavaScript React",
  py:"Python", rs:"Rust", sql:"SQL", css:"CSS", html:"HTML", json:"JSON", md:"Markdown",
  sh:"Shell", yaml:"YAML", yml:"YAML", toml:"TOML", vue:"Vue", xml:"XML",
  c:"C", cpp:"C++", cs:"C#", go:"Go", rb:"Ruby", kt:"Kotlin",
};

export default function StatusBar() {
  const { activeFile, fileContent, activeSession } = useStore();
  const ext = activeFile?.split(".").pop()?.toLowerCase() || "";
  const lang = LANG_MAP[ext] || "Texto";
  const lines = fileContent.split("\n").length;
  const chars = fileContent.length;
  const fileName = activeFile?.split("/").pop() || "";

  return (
    <div
      className="flex items-center justify-between px-3 flex-shrink-0"
      style={{height:22, background:"#0a0a11", borderTop:"1px solid #1a1a2e", fontSize:11}}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1" style={{color:"#3a3a60"}}>
          <div className="w-1.5 h-1.5 rounded-full" style={{background:"#7c3aed"}}/>
          <span style={{color:"#4a4a7a"}}>{activeSession?.model || "Sin modelo"}</span>
        </div>
        {activeFile && (
          <span style={{color:"#2e2e50"}} className="font-mono">
            {activeFile.replace(/\/var\/www\/html\/GitHub\//,"").split("/").join(" › ")}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4" style={{color:"#2e2e50"}}>
        {activeFile && (
          <>
            <span>{lines} l\u00edneas</span>
            <span>{chars.toLocaleString()} chars</span>
            <span>UTF-8</span>
            <span style={{color:"#4a4a7a", fontWeight:600}}>{lang}</span>
          </>
        )}
      </div>
    </div>
  );
}
