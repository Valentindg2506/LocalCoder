import { useEffect } from "react";
import { useStore } from "./store";
import Sidebar from "./components/Sidebar/Sidebar";
import EditorPanel from "./components/Editor/EditorPanel";
import ChatPanel from "./components/Chat/ChatPanel";
import Topbar from "./components/Sidebar/Topbar";
import WelcomeScreen from "./components/WelcomeScreen";

export default function App() {
  const { loadModels, loadHardware, loadSessions, activeSession } = useStore();
  useEffect(() => { loadModels(); loadHardware(); loadSessions(); }, []);
  return (
    <div className="flex flex-col h-screen bg-[#1e1e2e] text-[#cdd6f4] overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {activeSession ? (
          <div className="flex flex-1 overflow-hidden">
            <EditorPanel />
            <ChatPanel />
          </div>
        ) : <WelcomeScreen />}
      </div>
    </div>
  );
}
