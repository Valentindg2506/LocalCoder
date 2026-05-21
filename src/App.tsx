import { useEffect } from "react";
import { useStore } from "./store";
import FileExplorer from "./components/Explorer/FileTree";
import WelcomeScreen from "./components/WelcomeScreen";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatPanel from "./components/Chat/ChatPanel";

export default function App() {
  const { loadSessions, loadModels, loadHardware, activeSession } = useStore();

  useEffect(() => {
    loadSessions();
    loadModels();
    loadHardware();
  }, []);

  return (
    <div className="flex h-screen bg-[#1e1e2e] text-[#cdd6f4] overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 flex flex-col border-r border-[#181825] bg-[#181825]">
        <div className="flex-shrink-0 border-b border-[#1e1e2e]">
          <Sidebar />
        </div>
        <div className="flex-1 overflow-hidden">
          <FileExplorer />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeSession ? <ChatPanel /> : <WelcomeScreen />}
      </div>
    </div>
  );
}
