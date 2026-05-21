import { useState, useRef, useEffect } from "react";
import { useStore } from "../../store";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ChatPanel() {
  const { messages, sendMessage, isStreaming, streamBuffer, activeSession } = useStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, streamBuffer]);
  const send = async () => { if (!input.trim()||isStreaming) return; const msg=input; setInput(""); await sendMessage(msg); };
  return (
    <div className="flex flex-col border-l border-[#313244] bg-[#181825] flex-shrink-0" style={{width:380}}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#313244] flex-shrink-0">
        <Bot size={15} className="text-[#89b4fa]"/>
        <span className="text-sm font-medium">Chat IA</span>
        <span className="ml-auto text-xs text-[#6c7086] bg-[#313244] px-2 py-0.5 rounded">{activeSession?.model}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length===0 && (
          <div className="text-center text-xs text-[#6c7086] pt-8">
            <Bot size={32} className="mx-auto mb-2 opacity-20"/>
            <p>Hola! Puedo analizar tu código,<br/>explicarlo, buscar bugs y más.</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={"flex gap-2.5 " + (msg.role==="user"?"flex-row-reverse":"")}>
            <div className={"w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 " + (msg.role==="user"?"bg-[#89b4fa]":"bg-[#313244]")}>
              {msg.role==="user" ? <User size={12} color="#1e1e2e"/> : <Bot size={12}/>}
            </div>
            <div className={"max-w-[85%] rounded-lg px-3 py-2 text-sm prose prose-invert prose-sm max-w-none " + (msg.role==="user"?"bg-[#89b4fa] text-[#1e1e2e]":"bg-[#313244] text-[#cdd6f4]")}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isStreaming && streamBuffer && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#313244] flex items-center justify-center flex-shrink-0"><Bot size={12}/></div>
            <div className="max-w-[85%] bg-[#313244] rounded-lg px-3 py-2 text-sm prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{streamBuffer}</ReactMarkdown>
              <span className="animate-pulse">▍</span>
            </div>
          </div>
        )}
        {isStreaming && !streamBuffer && (
          <div className="flex items-center gap-2 text-xs text-[#6c7086]"><Loader2 size={13} className="animate-spin"/> Procesando...</div>
        )}
        <div ref={bottomRef}/>
      </div>
      <div className="flex gap-1.5 px-3 py-2 border-t border-[#313244] flex-wrap flex-shrink-0">
        {["Analiza este archivo","Explica este código","Busca bugs","Refactoriza","Genera tests","Analiza el proyecto"].map(a=>(
          <button key={a} onClick={()=>setInput(a)} className="text-xs bg-[#313244] hover:bg-[#89b4fa] hover:text-[#1e1e2e] px-2 py-0.5 rounded transition-colors">{a}</button>
        ))}
      </div>
      <div className="flex gap-2 p-3 border-t border-[#313244] flex-shrink-0">
        <textarea value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
          placeholder="Pregunta algo... (Enter para enviar)" rows={2}
          className="flex-1 bg-[#313244] rounded px-3 py-2 text-sm resize-none outline-none placeholder:text-[#6c7086] focus:ring-1 focus:ring-[#89b4fa]"/>
        <button onClick={send} disabled={isStreaming||!input.trim()}
          className="w-9 h-9 rounded bg-[#89b4fa] text-[#1e1e2e] flex items-center justify-center hover:opacity-80 disabled:opacity-30 self-end transition-opacity">
          <Send size={15}/>
        </button>
      </div>
    </div>
  );
}
