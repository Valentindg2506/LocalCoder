import Editor from "@monaco-editor/react";
import { useStore } from "../../store";
import { Save, FileCode } from "lucide-react";
import { useState, useEffect } from "react";

const LANG_MAP: Record<string,string> = {
  php:"php", js:"javascript", ts:"typescript", tsx:"typescriptreact", jsx:"javascriptreact",
  py:"python", rs:"rust", sql:"sql", css:"css", html:"html", json:"json", md:"markdown",
  sh:"shell", yaml:"yaml", yml:"yaml", toml:"ini", vue:"html", svelte:"html",
};

export default function EditorPanel() {
  const { activeFile, fileContent, setFileContent, saveFile } = useStore();
  const [unsaved, setUnsaved] = useState(false);
  const ext = activeFile?.split(".").pop() || "";
  const lang = LANG_MAP[ext] || "plaintext";
  useEffect(() => { setUnsaved(false); }, [activeFile]);
  const handleSave = async () => { await saveFile(); setUnsaved(false); };
  if (!activeFile) return (
    <div className="flex-1 flex items-center justify-center bg-[#1e1e2e] text-[#6c7086]">
      <div className="text-center"><FileCode size={48} className="mx-auto mb-3 opacity-20"/><p className="text-sm">Selecciona un archivo del explorador</p></div>
    </div>
  );
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#313244] bg-[#181825] flex-shrink-0">
        <span className="text-xs font-mono text-[#6c7086]">
          {activeFile.split("/").slice(-2).join("/")}
          {unsaved && <span className="ml-1 text-[#f9e2af]">●</span>}
        </span>
        <button onClick={handleSave} className="flex items-center gap-1 text-xs bg-[#313244] hover:bg-[#89b4fa] hover:text-[#1e1e2e] px-2 py-0.5 rounded transition-colors">
          <Save size={11}/> Guardar
        </button>
      </div>
      <div className="flex-1">
        <Editor value={fileContent} language={lang} theme="vs-dark"
          onChange={v => { setFileContent(v||""); setUnsaved(true); }}
          onMount={(editor, monaco) => { editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, handleSave); }}
          options={{ fontSize:14, fontFamily:"'JetBrains Mono','Fira Code',monospace", fontLigatures:true, minimap:{enabled:true}, scrollBeyondLastLine:false, automaticLayout:true, wordWrap:"on", lineNumbers:"on", renderLineHighlight:"all", bracketPairColorization:{enabled:true}, padding:{top:8} }}
        />
      </div>
    </div>
  );
}
