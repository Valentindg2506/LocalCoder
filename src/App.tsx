import { useEffect } from "react";
import { useStore } from "./store";
import Sidebar from "./components/Sidebar/Sidebar";
import WelcomeScreen from "./components/WelcomeScreen";
import EditorPanel from "./components/Editor/EditorPanel";
import TabBar from "./components/Editor/TabBar";
import StatusBar from "./components/Editor/StatusBar";

export default function App() {
  const { loadSessions, loadModels, loadHardware, activeSession } = useStore();

  useEffect(() => {
    loadSessions();
    loadModels();
    loadHardware();
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{background:"#13131f", color:"#d4d6f0", fontFamily:"'Inter', system-ui, sans-serif"}}>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {!activeSession ? (
            <WelcomeScreen />
          ) : (
            <>
              <TabBar />
              <EditorPanel />
            </>
          )}
        </div>
      </div>
      {activeSession && <StatusBar />}
    </div>
  );
}
