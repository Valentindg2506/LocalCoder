import Editor from "@monaco-editor/react";
import { useStore } from "../../store";
import { FileCode } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const LANG_MAP: Record<string,string> = {
  php:"php", js:"javascript", ts:"typescript", tsx:"typescriptreact", jsx:"javascriptreact",
  py:"python", rs:"rust", sql:"sql", css:"css", html:"html", json:"json", md:"markdown",
  sh:"shell", yaml:"yaml", yml:"yaml", toml:"ini", vue:"html", svelte:"html",
  txt:"plaintext", xml:"xml", c:"c", cpp:"cpp", cs:"csharp", go:"go", rb:"ruby",
};

export default function EditorPanel() {
  const { activeFile, fileContent, setFileContent, saveFile } = useStore();
  const [unsaved, setUnsaved] = useState(false);

  const ext = activeFile?.split(".").pop()?.toLowerCase() || "";
  const lang = LANG_MAP[ext] || "plaintext";
  const fileName = activeFile?.split("/").pop() || "";

  useEffect(() => { setUnsaved(false); }, [activeFile]);

  const handleSave = useCallback(async () => {
    await saveFile();
    setUnsaved(false);
  }, [saveFile]);

  if (!activeFile) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{background:"#13131f"}}>
      <FileCode size={52} style={{color:"#2a2a45"}}/>
      <div className="text-center">
        <p className="text-sm" style={{color:"#4a4a6a"}}>Ningún archivo abierto</p>
        <p className="text-xs mt-1" style={{color:"#2e2e4a"}}>Selecciona un archivo del explorador</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{background:"#13131f"}}>
      {/* Breadcrumb bar */}
      <div className="flex items-center justify-between px-4 py-1 flex-shrink-0" style={{background:"#13131f", borderBottom:"1px solid #1e1e35"}}>
        <div className="flex items-center gap-1 text-xs font-mono min-w-0 overflow-hidden">
          {activeFile.split("/").slice(-3, -1).map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              <span style={{color:"#2e2e4a"}}>{part}</span>
              <span style={{color:"#1e1e35"}}>›</span>
            </span>
          ))}
          <span style={{color:"#c7d2fe", fontWeight:600}}>{fileName}</span>
          {unsaved && <span style={{color:"#f9e2af", marginLeft:4}}>●</span>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded" style={{background:"#1e1e35",color:"#4a4a6a"}}>{lang}</span>
          <button
            onClick={handleSave}
            className="text-xs px-2.5 py-0.5 rounded font-medium transition-all"
            style={unsaved
              ? {background:"#7c3aed", color:"#fff"}
              : {background:"#1e1e35", color:"#4a4a6a"}}
          >
            Guardar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Editor
          value={fileContent}
          language={lang}
          onChange={v => { setFileContent(v || ""); setUnsaved(true); }}
          onMount={(editor, monaco) => {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, handleSave);
            monaco.editor.defineTheme("lc", {
              base: "vs-dark",
              inherit: true,
              rules: [
                { token: "", foreground: "c8cce8" },
                { token: "comment", foreground: "3a3a60", fontStyle: "italic" },
                { token: "keyword", foreground: "a78bfa", fontStyle: "bold" },
                { token: "string", foreground: "6ee7b7" },
                { token: "number", foreground: "fb923c" },
                { token: "type", foreground: "7dd3fc" },
                { token: "function", foreground: "93c5fd" },
                { token: "variable.predefined", foreground: "f472b6" },
                { token: "tag", foreground: "f87171" },
                { token: "attribute.name", foreground: "a5b4fc" },
                { token: "attribute.value", foreground: "6ee7b7" },
              ],
              colors: {
                "editor.background": "#13131f",
                "editor.foreground": "#c8cce8",
                "editorLineNumber.foreground": "#252540",
                "editorLineNumber.activeForeground": "#5a5a8a",
                "editor.lineHighlightBackground": "#17172a",
                "editor.lineHighlightBorderColor": "#1e1e35",
                "editorCursor.foreground": "#818cf8",
                "editor.selectionBackground": "#2d2b5580",
                "editorIndentGuide.background1": "#1e1e35",
                "editorIndentGuide.activeBackground1": "#2e2e50",
                "editorBracketMatch.background": "#7c3aed25",
                "editorBracketMatch.border": "#7c3aed",
                "editorGutter.background": "#13131f",
                "scrollbarSlider.background": "#1e1e3580",
                "scrollbarSlider.hoverBackground": "#2e2e5080",
                "editorWidget.background": "#17172a",
                "editorWidget.border": "#1e1e35",
                "input.background": "#0f0f1a",
                "input.foreground": "#c8cce8",
                "list.hoverBackground": "#17172a",
                "list.activeSelectionBackground": "#1e1e35",
                "list.activeSelectionForeground": "#c7d2fe",
                "focusBorder": "#7c3aed",
              }
            });
            monaco.editor.setTheme("lc");
          }}
          options={{
            fontSize: 13.5,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: true, scale: 1 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "off",
            lineNumbers: "on",
            renderLineHighlight: "all",
            bracketPairColorization: { enabled: true },
            padding: { top: 16, bottom: 16 },
            smoothScrolling: true,
            cursorSmoothCaretAnimation: "on",
            cursorBlinking: "smooth",
            guides: { indentation: true, bracketPairs: true },
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
          }}
        />
      </div>
    </div>
  );
}
