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
  const [cursorInfo, setCursorInfo] = useState({ line: 1, col: 1 });

  const ext = activeFile?.split(".").pop()?.toLowerCase() || "";
  const lang = LANG_MAP[ext] || "plaintext";

  useEffect(() => { setUnsaved(false); }, [activeFile]);

  const handleSave = useCallback(async () => {
    await saveFile();
    setUnsaved(false);
  }, [saveFile]);

  if (!activeFile) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5" style={{background:"#0d0d14"}}>
      <div style={{opacity:0.07}}>
        <FileCode size={72} color="#818cf8"/>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium" style={{color:"#4a4a6a"}}>Ning\u00fan archivo abierto</p>
        <p className="text-xs" style={{color:"#2e2e4a"}}>Selecciona un archivo del explorador</p>
      </div>
      <div className="flex gap-2 text-[10px]" style={{color:"#2e2e4a"}}>
        <kbd className="px-1.5 py-0.5 rounded" style={{background:"#1a1a2e"}}>Ctrl+S</kbd>
        <span>guardar</span>
        <span style={{color:"#1a1a2e"}}>|</span>
        <kbd className="px-1.5 py-0.5 rounded" style={{background:"#1a1a2e"}}>Click</kbd>
        <span>abrir archivo</span>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{background:"#0d0d14"}}>
      <div className="flex-1 overflow-hidden">
        <Editor
          value={fileContent}
          language={lang}
          onChange={v => { setFileContent(v || ""); setUnsaved(true); }}
          onMount={(editor, monaco) => {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, handleSave);
            editor.onDidChangeCursorPosition(e => {
              setCursorInfo({ line: e.position.lineNumber, col: e.position.column });
            });
            monaco.editor.defineTheme("lc", {
              base: "vs-dark",
              inherit: true,
              rules: [
                { token: "", foreground: "c8cce8" },
                { token: "comment", foreground: "2e2e50", fontStyle: "italic" },
                { token: "keyword", foreground: "a78bfa", fontStyle: "bold" },
                { token: "keyword.control", foreground: "818cf8" },
                { token: "string", foreground: "6ee7b7" },
                { token: "string.escape", foreground: "34d399" },
                { token: "number", foreground: "fb923c" },
                { token: "type", foreground: "38bdf8" },
                { token: "type.identifier", foreground: "7dd3fc" },
                { token: "function", foreground: "60a5fa" },
                { token: "variable", foreground: "c8cce8" },
                { token: "variable.predefined", foreground: "f472b6" },
                { token: "constant", foreground: "fb7185" },
                { token: "delimiter", foreground: "3a3a60" },
                { token: "tag", foreground: "f87171" },
                { token: "attribute.name", foreground: "818cf8" },
                { token: "attribute.value", foreground: "6ee7b7" },
              ],
              colors: {
                "editor.background": "#0d0d14",
                "editor.foreground": "#c8cce8",
                "editorLineNumber.foreground": "#1e1e35",
                "editorLineNumber.activeForeground": "#4a4a7a",
                "editor.lineHighlightBackground": "#11111c",
                "editor.lineHighlightBorderColor": "#1a1a30",
                "editorCursor.foreground": "#818cf8",
                "editor.selectionBackground": "#2d2b55",
                "editor.inactiveSelectionBackground": "#1e1e35",
                "editorIndentGuide.background1": "#1a1a2e",
                "editorIndentGuide.activeBackground1": "#2e2e50",
                "editorBracketMatch.background": "#7c3aed30",
                "editorBracketMatch.border": "#7c3aed",
                "editorGutter.background": "#0d0d14",
                "scrollbar.shadow": "#00000000",
                "scrollbarSlider.background": "#1a1a2e80",
                "scrollbarSlider.hoverBackground": "#2e2e4a80",
                "scrollbarSlider.activeBackground": "#3a3a6080",
                "editorWidget.background": "#131320",
                "editorWidget.border": "#1a1a2e",
                "input.background": "#0a0a11",
                "input.border": "#1a1a2e",
                "input.foreground": "#c8cce8",
                "list.hoverBackground": "#131320",
                "list.activeSelectionBackground": "#1e1e35",
                "list.activeSelectionForeground": "#c7d2fe",
                "focusBorder": "#7c3aed",
                "breadcrumb.foreground": "#2e2e50",
                "breadcrumb.activeSelectionForeground": "#818cf8",
              }
            });
            monaco.editor.setTheme("lc");
          }}
          options={{
            fontSize: 13.5,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            minimap: { enabled: true, scale: 1, renderCharacters: false },
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
            cursorStyle: "line",
            guides: { indentation: true, bracketPairs: true },
            suggest: { showKeywords: true, showSnippets: true },
            quickSuggestions: { other: true, comments: false, strings: false },
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            renderWhitespace: "none",
            occurrencesHighlight: "singleFile",
            colorDecorators: true,
            'semanticHighlighting.enabled': true,
          }}
        />
      </div>
    </div>
  );
}

export { };
export type { } from "../../store";
// export cursor info for StatusBar
export const useCursorInfo = () => ({ line: 1, col: 1 });
