import Editor from "@monaco-editor/react";
import { useStore } from "../../store";
import { Save, FileCode } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const LANG_MAP: Record<string,string> = {
  php:"php", js:"javascript", ts:"typescript", tsx:"typescriptreact", jsx:"javascriptreact",
  py:"python", rs:"rust", sql:"sql", css:"css", html:"html", json:"json", md:"markdown",
  sh:"shell", yaml:"yaml", yml:"yaml", toml:"ini", vue:"html", svelte:"html",
  txt:"plaintext", xml:"xml", c:"c", cpp:"cpp", cs:"csharp", go:"go", rb:"ruby",
  kt:"kotlin", swift:"swift", dart:"dart",
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
    <div className="flex-1 flex items-center justify-center bg-[#1e1e2e] text-[#45475a]">
      <div className="text-center space-y-3">
        <FileCode size={48} className="mx-auto opacity-20"/>
        <p className="text-sm">Selecciona un archivo del explorador</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e2e]">
      {/* File path breadcrumb */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#181825] bg-[#1e1e2e] flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-[#45475a] font-mono min-w-0">
          <span className="text-[#313244] truncate max-w-[500px]">
            {activeFile.split("/").slice(0,-1).join(" › ")}
          </span>
          <span className="text-[#45475a]">›</span>
          <span className="text-[#cdd6f4] font-semibold">{fileName}</span>
          {unsaved && <span className="text-[#f9e2af] ml-1">●</span>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-[#45475a] bg-[#181825] px-2 py-0.5 rounded font-mono uppercase">{lang}</span>
          <button
            onClick={handleSave}
            className={"flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-all " +
              (unsaved
                ? "bg-[#89b4fa] text-[#1e1e2e] shadow-md shadow-[#89b4fa]/20 font-medium"
                : "bg-[#313244] text-[#6c7086] hover:bg-[#45475a] hover:text-[#cdd6f4]")}
          >
            <Save size={11}/> Guardar
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          value={fileContent}
          language={lang}
          theme="vs-dark"
          onChange={v => { setFileContent(v || ""); setUnsaved(true); }}
          onMount={(editor, monaco) => {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, handleSave);
            // Better theme
            monaco.editor.defineTheme("localcoder", {
              base: "vs-dark",
              inherit: true,
              rules: [
                { token: "comment", foreground: "585b70", fontStyle: "italic" },
                { token: "keyword", foreground: "cba6f7" },
                { token: "string", foreground: "a6e3a1" },
                { token: "number", foreground: "fab387" },
                { token: "type", foreground: "89dceb" },
                { token: "function", foreground: "89b4fa" },
              ],
              colors: {
                "editor.background": "#1e1e2e",
                "editor.foreground": "#cdd6f4",
                "editorLineNumber.foreground": "#45475a",
                "editorLineNumber.activeForeground": "#89b4fa",
                "editor.lineHighlightBackground": "#2a2b3d",
                "editorCursor.foreground": "#f5c2e7",
                "editor.selectionBackground": "#45475a80",
                "editorIndentGuide.background": "#313244",
                "editorIndentGuide.activeBackground": "#585b70",
                "scrollbarSlider.background": "#31324480",
                "scrollbarSlider.hoverBackground": "#45475a80",
              }
            });
            monaco.editor.setTheme("localcoder");
          }}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            minimap: { enabled: true, scale: 1 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "off",
            lineNumbers: "on",
            renderLineHighlight: "all",
            bracketPairColorization: { enabled: true },
            padding: { top: 12, bottom: 12 },
            smoothScrolling: true,
            cursorSmoothCaretAnimation: "on",
            cursorBlinking: "smooth",
            renderWhitespace: "boundary",
            guides: { indentation: true, bracketPairs: true },
            suggest: { showKeywords: true, showSnippets: true },
            quickSuggestions: { other: true, comments: false, strings: false },
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
          }}
        />
      </div>
    </div>
  );
}
