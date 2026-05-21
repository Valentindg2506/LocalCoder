import { useEffect } from "react";
import { useStore } from "./store";
import Sidebar from "./components/Sidebar/Sidebar";
import WelcomeScreen from "./components/WelcomeScreen";
import EditorPanel from "./components/Editor/EditorPanel";
import TabBar from "./components/Editor/TabBar";
import Topbar from "./components/Topbar";

export default function App() {
  const { loadSessions, loadModels, loadHardware, activeSession, activeFile } = useStore();

  useEffect(() => {
    loadSessions();
    loadModels();
    loadHardware();
  }, []);

  const showEditor = activeSession && activeFile;
  const showWelcome = !activeSession;

  return (
    <div className="flex flex-col h-screen bg-[#1e1e2e] text-[#cdd6f4] overflow-hidden select-none">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {showWelcome ? (
            <WelcomeScreen />
          ) : (
            <>
              <TabBar />
              {showEditor ? (
                <EditorPanel />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#1e1e2e] gap-4">
                  <div className="text-[#313244]">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-[#585b70] text-sm font-medium">Ningún archivo abierto</p>
                    <p className="text-[#45475a] text-xs mt-1">Selecciona un archivo del explorador</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
