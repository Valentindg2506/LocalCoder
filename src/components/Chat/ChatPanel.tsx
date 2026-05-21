import { useState, useRef, useEffect } from "react";
import { useStore } from "../../store";
import { Send, Bot, User, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Props {
  onClose: () => void;
}

export default function ChatPanel({ onClose }: Props) {
  const { messages, sendMessage, isStreaming, streamBuffer, activeSession, fileContent, activeFile } = useStore();
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

  const quickAction = (action: string) => {
    const fileName = activeFile?.split("/").pop() || "este archivo";
    const prompts: Record<string, string> = {
      "Analiza": `Analiza el archivo ${fileName} y dame un resumen de lo que hace:\n\`\`\`\n${fileContent?.slice(0, 2000)}\n\`\`\``,
      "Explica": `Explica el siguiente código de ${fileName}:\n\`\`\`\n${fileContent?.slice(0, 2000)}\n\`\`\``,
      "Bugs": `Busca posibles bugs o problemas en ${fileName}:\n\`\`\`\n${fileContent?.slice(0, 2000)}\n\`\`\``,
      "Refactoriza": `Sugiere cómo refactorizar este código de ${fileName}:\n\`\`\`\n${fileContent?.slice(0, 2000)}\n\`\`\``,
      "Tests": `Genera tests para el código de ${fileName}:\n\`\`\`\n${fileContent?.slice(0, 2000)}\n\`\`\``,
    };
    setInput(prompts[action] || action);
  };

  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{width: 340, background: "#0f0f1a", borderLeft: "1px solid #1e1e35"}}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0" style={{borderBottom: "1px solid #1e1e35"}}>
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{background: "linear-gradient(135deg,#7c3aed,#3b82f6)"}}>
          <Bot size={11} color="#fff"/>
        </div>
        <span className="text-xs font-bold" style={{color: "#d4d6f0"}}>IA Local</span>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono" style={{background: "#1e1e35", color: "#818cf8"}}>
          {activeSession?.model?.split(":")[0] || "sin modelo"}
        </span>
        <button onClick={onClose} className="ml-2 opacity-40 hover:opacity-100 transition-opacity" style={{color: "#f87171"}}>
          <X size={12}/>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2" style={{color: "#2e2e4a"}}>
            <Bot size={32} style={{color: "#1e1e35"}}/>
            <p className="text-xs text-center" style={{color: "#3a3a5c"}}>
              Hola, soy tu IA local.<br/>Puedo analizar el archivo abierto,<br/>explicar código, buscar bugs y más.
            </p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={"flex gap-2 " + (msg.role === "user" ? "flex-row-reverse" : "")}>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{background: msg.role === "user" ? "#7c3aed" : "#1e1e35"}}
            >
              {msg.role === "user"
                ? <User size={10} color="#fff"/>
                : <Bot size={10} style={{color: "#818cf8"}}/>
              }
            </div>
            <div
              className="max-w-[85%] rounded-lg px-3 py-2 text-xs prose prose-invert prose-xs max-w-none"
              style={msg.role === "user"
                ? {background: "#1e1e35", color: "#c7d2fe"}
                : {background: "#17172a", color: "#c8cce8", border: "1px solid #1e1e35"}
              }
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isStreaming && streamBuffer && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{background: "#1e1e35"}}>
              <Bot size={10} style={{color: "#818cf8"}}/>
            </div>
            <div className="max-w-[85%] rounded-lg px-3 py-2 text-xs prose prose-invert prose-xs max-w-none" style={{background: "#17172a", color: "#c8cce8", border: "1px solid #1e1e35"}}>
              <ReactMarkdown>{streamBuffer}</ReactMarkdown>
              <span style={{color: "#7c3aed"}} className="animate-pulse">◍</span>
            </div>
          </div>
        )}
        {isStreaming && !streamBuffer && (
          <div className="flex items-center gap-2" style={{color: "#3a3a5c"}}>
            <Loader2 size={11} className="animate-spin"/>
            <span className="text-[11px]">Procesando...</span>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-1 px-3 py-2 flex-shrink-0" style={{borderTop: "1px solid #1e1e35"}}>
        {["Analiza", "Explica", "Bugs", "Refactoriza", "Tests"].map(a => (
          <button
            key={a}
            onClick={() => quickAction(a)}
            className="text-[10px] px-2 py-0.5 rounded transition-colors"
            style={{background: "#1e1e35", color: "#4a4a6a"}}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = "#2e2e50"; (e.target as HTMLElement).style.color = "#c7d2fe"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = "#1e1e35"; (e.target as HTMLElement).style.color = "#4a4a6a"; }}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 flex-shrink-0" style={{borderTop: "1px solid #1e1e35"}}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Pregunta algo... (Enter)"
          rows={2}
          className="flex-1 rounded px-3 py-2 text-xs resize-none outline-none"
          style={{background: "#13131f", border: "1px solid #1e1e35", color: "#c8cce8"}}
        />
        <button
          onClick={send}
          disabled={isStreaming || !input.trim()}
          className="w-8 h-8 rounded flex items-center justify-center transition-opacity disabled:opacity-30 self-end"
          style={{background: "#7c3aed"}}
        >
          <Send size={13} color="#fff"/>
        </button>
      </div>
    </div>
  );
}
