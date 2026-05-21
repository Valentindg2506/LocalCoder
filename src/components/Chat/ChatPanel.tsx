import { useState, useRef, useEffect } from "react";
import { useStore } from "../../store";
import { Send, Bot, User, Loader2, X, FolderSearch, CheckCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Props { onClose: () => void; }

const MAX_CONTEXT_CHARS = 4000;

export default function ChatPanel({ onClose }: Props) {
  const {
    messages, sendMessage, isStreaming, streamBuffer,
    activeSession, fileContent, activeFile,
    projectChunks, isIndexing, indexProgress, indexProject, projectPath,
  } = useStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamBuffer]);

  const send = async () => {
    if (!input.trim() || isStreaming) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
  };

  const buildFileContext = () => {
    if (!activeFile || !fileContent) return "";
    const fileName = activeFile.split("/").pop();
    const content = fileContent.length > MAX_CONTEXT_CHARS
      ? fileContent.slice(0, MAX_CONTEXT_CHARS) + `\n... (truncado a ${MAX_CONTEXT_CHARS} chars)`
      : fileContent;
    return `\nArchivo activo: ${fileName}\n\`\`\`\n${content}\n\`\`\``;
  };

  const quickAction = (action: string) => {
    const ctx = buildFileContext();
    const fileName = activeFile?.split("/").pop() || "este archivo";
    const prompts: Record<string, string> = {
      "Analiza": `Analiza ${fileName} y dame un resumen:${ctx}`,
      "Explica": `Explica el código de ${fileName}:${ctx}`,
      "Bugs": `Busca bugs o problemas en ${fileName}:${ctx}`,
      "Refactoriza": `Sugiere cómo refactorizar ${fileName}:${ctx}`,
      "Tests": `Genera tests para ${fileName}:${ctx}`,
    };
    setInput(prompts[action] || action);
  };

  const projectIndexed = projectChunks.length > 0;

  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: 340, background: "#0f0f1a", borderLeft: "1px solid #1e1e35" }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid #1e1e35" }}>
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#3b82f6)" }}>
          <Bot size={11} color="#fff" />
        </div>
        <span className="text-xs font-bold" style={{ color: "#d4d6f0" }}>IA Local</span>
        {activeFile && (
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono truncate max-w-[80px]" style={{ background: "#1e1e35", color: "#4a4a6a" }}>
            {activeFile.split("/").pop()}
          </span>
        )}
        {projectIndexed && (
          <span className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: "#0f2a0f", color: "#86efac", border: "1px solid #1a3a1a" }}>
            <CheckCircle size={8} /> {projectChunks.length} chunks
          </span>
        )}
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "#1e1e35", color: "#818cf8" }}>
          {activeSession?.model?.split(":")[0] || "sin modelo"}
        </span>
        <button onClick={onClose} className="ml-2 opacity-40 hover:opacity-100 transition-opacity" style={{ color: "#f87171" }}>
          <X size={12} />
        </button>
      </div>

      {/* Project index bar */}
      {projectPath && (
        <div className="flex items-center gap-2 px-3 py-1.5 flex-shrink-0" style={{ borderBottom: "1px solid #1e1e35", background: "#0d0d18" }}>
          {isIndexing ? (
            <>
              <Loader2 size={10} className="animate-spin flex-shrink-0" style={{ color: "#818cf8" }} />
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#1e1e35" }}>
                <div className="h-full rounded-full animate-pulse" style={{ background: "#7c3aed", width: `${Math.min(indexProgress * 2, 95)}%`, transition: "width 0.3s" }} />
              </div>
              <span className="text-[10px] flex-shrink-0" style={{ color: "#4a4a6a" }}>{indexProgress} chunks</span>
            </>
          ) : (
            <>
              <button
                onClick={indexProject}
                className="flex items-center gap-1.5 text-[10px] transition-opacity hover:opacity-100 opacity-70"
                style={{ color: projectIndexed ? "#86efac" : "#818cf8" }}
              >
                <FolderSearch size={11} />
                {projectIndexed ? `Proyecto indexado (${projectChunks.length})` : "Indexar proyecto"}
              </button>
              {projectIndexed && (
                <span className="ml-auto text-[9px]" style={{ color: "#2e2e4a" }}>contexto activo</span>
              )}
            </>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Bot size={32} style={{ color: "#1e1e35" }} />
            <p className="text-xs text-center" style={{ color: "#3a3a5c" }}>
              IA 100% local.<br />
              {projectPath
                ? <>Indexa el proyecto para<br />dar contexto completo a la IA.</>  
                : <>Abre un proyecto para<br />activar el contexto completo.</>}
            </p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={"flex gap-2 " + (msg.role === "user" ? "flex-row-reverse" : "")}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: msg.role === "user" ? "#7c3aed" : "#1e1e35" }}>
              {msg.role === "user"
                ? <User size={10} color="#fff" />
                : <Bot size={10} style={{ color: "#818cf8" }} />}
            </div>
            <div className="max-w-[85%] rounded-lg px-3 py-2 text-xs prose prose-invert prose-xs max-w-none"
              style={msg.role === "user"
                ? { background: "#1e1e35", color: "#c7d2fe" }
                : { background: "#17172a", color: "#c8cce8", border: "1px solid #1e1e35" }}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isStreaming && streamBuffer && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1e1e35" }}>
              <Bot size={10} style={{ color: "#818cf8" }} />
            </div>
            <div className="max-w-[85%] rounded-lg px-3 py-2 text-xs prose prose-invert prose-xs max-w-none"
              style={{ background: "#17172a", color: "#c8cce8", border: "1px solid #1e1e35" }}>
              <ReactMarkdown>{streamBuffer}</ReactMarkdown>
              <span style={{ color: "#7c3aed" }} className="animate-pulse">▍</span>
            </div>
          </div>
        )}
        {isStreaming && !streamBuffer && (
          <div className="flex items-center gap-2" style={{ color: "#3a3a5c" }}>
            <Loader2 size={11} className="animate-spin" />
            <span className="text-[11px]">Procesando...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-1 px-3 py-2 flex-shrink-0" style={{ borderTop: "1px solid #1e1e35" }}>
        {["Analiza", "Explica", "Bugs", "Refactoriza", "Tests"].map(a => (
          <button
            key={a}
            onClick={() => quickAction(a)}
            disabled={!activeFile}
            className="text-[10px] px-2 py-0.5 rounded transition-colors disabled:opacity-30"
            style={{ background: "#1e1e35", color: "#4a4a6a" }}
            onMouseEnter={e => { if (activeFile) { (e.target as HTMLElement).style.background = "#2e2e50"; (e.target as HTMLElement).style.color = "#c7d2fe"; } }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = "#1e1e35"; (e.target as HTMLElement).style.color = "#4a4a6a"; }}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 flex-shrink-0" style={{ borderTop: "1px solid #1e1e35" }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Pregunta algo... (Enter)"
          rows={2}
          className="flex-1 rounded px-3 py-2 text-xs resize-none outline-none"
          style={{ background: "#13131f", border: "1px solid #1e1e35", color: "#c8cce8" }}
        />
        <button
          onClick={send}
          disabled={isStreaming || !input.trim()}
          className="w-8 h-8 rounded flex items-center justify-center transition-opacity disabled:opacity-30 self-end"
          style={{ background: "#7c3aed" }}
        >
          <Send size={13} color="#fff" />
        </button>
      </div>
    </div>
  );
}
