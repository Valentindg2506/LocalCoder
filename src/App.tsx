import { useEffect, useState } from "react";
import { useStore } from "./store";
import Sidebar from "./components/Sidebar/Sidebar";
import WelcomeScreen from "./components/WelcomeScreen";
import EditorPanel from "./components/Editor/EditorPanel";
import TabBar from "./components/Editor/TabBar";
import StatusBar from "./components/Editor/StatusBar";
import ChatPanel from "./components/Chat/ChatPanel";
import { Bot } from "lucide-react";

export default function App() {
  const { loadSessions, loadModels, loadHardware, activeSession, projectPath, loadProjectTree } = useStore();
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    loadSessions();
    loadModels();
    loadHardware();
  }, []);

  // Restore project tree once on mount if path is persisted
  useEffect(() => {
    if (projectPath) loadProjectTree(projectPath);
  }, []); // intentionally empty — only on mount

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "#13131f", color: "#d4d6f0", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {!activeSession ? (
            <WelcomeScreen />
          ) : (
            <>
              <TabBar />
              <EditorPanel />
            </>
          )}
        </div>
        {activeSession && chatOpen && (
          <ChatPanel onClose={() => setChatOpen(false)} />
        )}
      </div>

      {activeSession && (
        <div
          className="flex items-center flex-shrink-0 select-none"
          style={{ height: 22, background: "#0f0f1a", borderTop: "1px solid #1e1e35" }}
        >
          <StatusBar />
          <button
            onClick={() => setChatOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 h-full transition-all flex-shrink-0"
            style={{ color: chatOpen ? "#818cf8" : "#3a3a5c", borderLeft: "1px solid #1e1e35" }}
            title="Abrir / cerrar chat IA (Ctrl+I)"
          >
            <Bot size={11} />
            <span style={{ fontSize: 10 }}>IA</span>
          </button>
        </div>
      )}
    </div>
  );
}
