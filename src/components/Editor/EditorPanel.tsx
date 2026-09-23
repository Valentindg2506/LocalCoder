import Editor, { type OnMount } from "@monaco-editor/react";
import { useStore } from "../../store";
import { FileCode } from "lucide-react";
import { useCallback, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

const LANG_MAP: Record<string, string> = {
  php: "php", js: "javascript", ts: "typescript", tsx: "typescriptreact", jsx: "javascriptreact",
  py: "python", rs: "rust", sql: "sql", css: "css", html: "html", json: "json", md: "markdown",
  sh: "shell", yaml: "yaml", yml: "yaml", toml: "ini", vue: "html", svelte: "html",
  txt: "plaintext", xml: "xml", c: "c", cpp: "cpp", cs: "csharp", go: "go", rb: "ruby",
};

export default function EditorPanel() {
  const store = useStore();
  const {
    activeFile, fileContent, setFileContent, saveFile,
    setCursor, markUnsaved, markSaved, unsavedFiles,
    setAiCompleting, settings,
  } = store;

  const storeRef = useRef(store);
  useEffect(() => { storeRef.current = store; });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionDisposableRef = useRef<any>(null);
  const editorRef = useRef<any>(null);

  const ext = activeFile?.split(".").pop()?.toLowerCase() || "";
  const lang = LANG_MAP[ext] || "plaintext";
  const fileName = activeFile?.split("/").pop() || "";
  const isUnsaved = activeFile ? unsavedFiles.has(activeFile) : false;

  const handleSave = useCallback(async () => {
    await saveFile();
    if (activeFile) markSaved(activeFile);
  }, [saveFile, activeFile, markSaved]);

  // Cleanup on file change
  useEffect(() => {
    return () => {
      if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; setAiCompleting(false); }
      if (autoSaveRef.current) { clearTimeout(autoSaveRef.current); autoSaveRef.current = null; }
    };
  }, [activeFile]);

  // Auto-save
  useEffect(() => {
    if (!settings.autoSave || !isUnsaved || !activeFile) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => { handleSave(); }, settings.autoSaveDelay);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [fileContent, settings.autoSave, settings.autoSaveDelay]);

  // Update editor options live when settings change
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.updateOptions({
      fontSize: settings.fontSize,
      tabSize: settings.tabSize,
      wordWrap: settings.wordWrap ? "on" : "off",
      inlineSuggest: { enabled: settings.aiCompletionsEnabled },
    });
  }, [settings.fontSize, settings.tabSize, settings.wordWrap, settings.aiCompletionsEnabled]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, handleSave);
    editor.onDidChangeCursorPosition(e => setCursor(e.position.lineNumber, e.position.column));

    monaco.editor.defineTheme("lc", {
      base: "vs-dark", inherit: true,
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
        "editor.background": "#13131f", "editor.foreground": "#c8cce8",
        "editorLineNumber.foreground": "#252540", "editorLineNumber.activeForeground": "#5a5a8a",
        "editor.lineHighlightBackground": "#17172a", "editor.lineHighlightBorderColor": "#1e1e35",
        "editorCursor.foreground": "#818cf8", "editor.selectionBackground": "#2d2b5580",
        "editorIndentGuide.background1": "#1e1e35", "editorIndentGuide.activeBackground1": "#2e2e50",
        "editorBracketMatch.background": "#7c3aed25", "editorBracketMatch.border": "#7c3aed",
        "editorGutter.background": "#13131f",
        "scrollbarSlider.background": "#1e1e3580", "scrollbarSlider.hoverBackground": "#2e2e5080",
        "editorWidget.background": "#17172a", "editorWidget.border": "#1e1e35",
        "input.background": "#0f0f1a", "input.foreground": "#c8cce8",
        "list.hoverBackground": "#17172a",
        "list.activeSelectionBackground": "#1e1e35", "list.activeSelectionForeground": "#c7d2fe",
        "focusBorder": "#7c3aed",
        "editorGhostText.foreground": "#4a4a7a",
      }
    });
    monaco.editor.setTheme("lc");

    if (completionDisposableRef.current) { completionDisposableRef.current.dispose(); completionDisposableRef.current = null; }

    completionDisposableRef.current = monaco.languages.registerInlineCompletionsProvider(
      { pattern: "**" },
      {
        provideInlineCompletions: async (model, position) => {
          if (!storeRef.current.settings.aiCompletionsEnabled) return { items: [] };
          const fullText = model.getValue();
          const offset = model.getOffsetAt(position);
          const prefix = fullText.slice(0, offset);
          const suffix = fullText.slice(offset);
          const lastLine = prefix.split("\n").pop() || "";
          if (lastLine.trim().length < 2) return { items: [] };
          if (debounceRef.current) clearTimeout(debounceRef.current);
          return new Promise(resolve => {
            debounceRef.current = setTimeout(async () => {
              debounceRef.current = null;
              try {
                const { activeSession } = storeRef.current;
                const currentLang = storeRef.current.activeFile?.split(".").pop()?.toLowerCase() || "";
                const langId = LANG_MAP[currentLang] || "plaintext";
                const modelName = activeSession?.model || storeRef.current.settings.defaultModel;
                storeRef.current.setAiCompleting(true);
                const completion = await invoke<string>("complete_code", { model: modelName, prefix, suffix, language: langId });
                storeRef.current.setAiCompleting(false);
                if (!completion || completion.trim().length === 0) { resolve({ items: [] }); return; }
                resolve({
                  items: [{ insertText: completion, range: { startLineNumber: position.lineNumber, startColumn: position.column, endLineNumber: position.lineNumber, endColumn: position.column } }],
                });
              } catch { storeRef.current.setAiCompleting(false); resolve({ items: [] }); }
            }, 420);
          });
        },
        freeInlineCompletions: () => {},
      }
    );
  };

  if (!activeFile) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: "#13131f" }}>
      <FileCode size={52} style={{ color: "#2a2a45" }} />
      <div className="text-center">
        <p className="text-sm" style={{ color: "#4a4a6a" }}>Ningún archivo abierto</p>
        <p className="text-xs mt-1" style={{ color: "#2e2e4a" }}>Selecciona un archivo del explorador</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#13131f" }}>
      <div className="flex items-center justify-between px-4 py-1 flex-shrink-0" style={{ background: "#13131f", borderBottom: "1px solid #1e1e35" }}>
        <div className="flex items-center gap-1 text-xs font-mono min-w-0 overflow-hidden">
          {activeFile.split("/").slice(-3, -1).map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              <span style={{ color: "#2e2e4a" }}>{part}</span>
              <span style={{ color: "#1e1e35" }}>›</span>
            </span>
          ))}
          <span style={{ color: "#c7d2fe", fontWeight: 600 }}>{fileName}</span>
          {isUnsaved && <span style={{ color: "#f9e2af", marginLeft: 4 }} title="Cambios sin guardar">●</span>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded" style={{ background: "#1e1e35", color: "#4a4a6a" }}>{lang}</span>
          <button
            onClick={handleSave}
            className="text-xs px-2.5 py-0.5 rounded font-medium transition-all"
            style={isUnsaved ? { background: "#7c3aed", color: "#fff" } : { background: "#1e1e35", color: "#4a4a6a" }}
          >
            Guardar
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          value={fileContent}
          language={lang}
          onChange={v => { setFileContent(v || ""); if (activeFile) markUnsaved(activeFile); }}
          onMount={handleMount}
          options={{
            fontSize: settings.fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: true, scale: 1 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: settings.wordWrap ? "on" : "off",
            lineNumbers: "on",
            renderLineHighlight: "all",
            bracketPairColorization: { enabled: true },
            padding: { top: 16, bottom: 16 },
            smoothScrolling: true,
            cursorSmoothCaretAnimation: "on",
            cursorBlinking: "smooth",
            guides: { indentation: true, bracketPairs: true },
            tabSize: settings.tabSize,
            insertSpaces: true,
            formatOnPaste: true,
            inlineSuggest: { enabled: settings.aiCompletionsEnabled, mode: "prefix" },
            suggest: { preview: true },
          }}
        />
      </div>
    </div>
  );
}
