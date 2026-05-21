import { useEffect, useState } from "react";
import { useStore } from "../store";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Cpu, HardDrive, Plus, FolderOpen, Download, CheckCircle } from "lucide-react";
import type { ModelRecommendation } from "../types";

export default function WelcomeScreen() {
  const { hardware, models, loadModels, createSession, setProjectPath } = useStore();
  const [recommendations, setRecommendations] = useState<ModelRecommendation[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [sessionName, setSessionName] = useState("Nueva sesi\u00f3n");
  const [pulling, setPulling] = useState<string|null>(null);
  const [pullProgress, setPullProgress] = useState("");

  useEffect(() => {
    if (hardware) invoke<ModelRecommendation[]>("get_recommended_models", { ramGb: hardware.total_ram_gb }).then(setRecommendations);
  }, [hardware]);

  useEffect(() => {
    if (models.length>0 && !selectedModel) setSelectedModel(models[0].name);
  }, [models]);

  const handlePull = async (modelName: string) => {
    setPulling(modelName); setPullProgress("Iniciando...");
    const { listen } = await import("@tauri-apps/api/event");
    const ul = await listen("pull_progress", (e: any) => { if (e.payload?.status) setPullProgress(e.payload.status); });
    await invoke("pull_model", { model: modelName });
    ul(); await loadModels(); setPulling(null); setPullProgress("");
  };

  const handleCreate = async () => {
    if (!selectedModel) return;
    await createSession(sessionName, undefined, selectedModel);
  };

  const handleOpenProject = async () => {
    const selected = await open({ directory: true, title: "Abrir proyecto" });
    if (typeof selected === "string") {
      setProjectPath(selected);
      const name = selected.split("/").pop() || "Proyecto";
      setSessionName(name);
      await createSession(name, selected, selectedModel || models[0]?.name || "llama3.1:8b");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#1e1e2e] p-8 overflow-y-auto">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#89b4fa] mb-1">LocalCoder</h1>
          <p className="text-[#6c7086] text-sm">IDE con IA 100% local &middot; Sin nube &middot; Sin l&iacute;mites</p>
        </div>
        {hardware && (
          <div className="bg-[#181825] rounded-xl p-4 grid grid-cols-2 gap-3 border border-[#313244]">
            <div className="flex items-center gap-3">
              <Cpu size={18} className="text-[#89b4fa]"/>
              <div><p className="text-xs text-[#6c7086]">CPU</p><p className="text-sm truncate">{hardware.cpu_name} ({hardware.cpu_cores} n&uacute;cleos)</p></div>
            </div>
            <div className="flex items-center gap-3">
              <HardDrive size={18} className="text-[#89b4fa]"/>
              <div><p className="text-xs text-[#6c7086]">RAM</p><p className="text-sm">{hardware.total_ram_gb} GB total &middot; {hardware.available_ram_gb} GB libre</p></div>
            </div>
          </div>
        )}
        <div className="bg-[#181825] rounded-xl p-4 border border-[#313244]">
          <h2 className="text-xs text-[#6c7086] uppercase tracking-wider mb-3">Modelos instalados en Ollama</h2>
          {models.length===0
            ? <p className="text-sm text-[#6c7086]">No hay modelos instalados. Descarga uno abajo.</p>
            : <div className="grid grid-cols-2 gap-2">
                {models.map(m => (
                  <button key={m.name} onClick={()=>setSelectedModel(m.name)}
                    className={"flex items-center gap-2 p-2 rounded-lg text-sm text-left transition-colors " + (selectedModel===m.name?"bg-[#89b4fa] text-[#1e1e2e]":"bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4]")}>
                    <span className="font-medium truncate">{m.name}</span>
                    <span className="ml-auto text-xs opacity-60">{(m.size/1e9).toFixed(1)}GB</span>
                  </button>
                ))}
              </div>
          }
        </div>
        <div className="bg-[#181825] rounded-xl p-4 border border-[#313244]">
          <h2 className="text-xs text-[#6c7086] uppercase tracking-wider mb-3">Modelos recomendados para tu equipo</h2>
          <div className="space-y-2">
            {recommendations.map(r => {
              const installed = models.some(m => m.name===r.name);
              return (
                <div key={r.name} className="flex items-start gap-3 p-3 bg-[#313244] rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-medium text-sm">{r.display_name}</span>
                      <span className="text-xs text-[#6c7086]">{r.size_gb}GB</span>
                      {r.tags.map(t=><span key={t} className="text-xs bg-[#1e1e2e] px-1.5 py-0.5 rounded text-[#89b4fa]">{t}</span>)}
                    </div>
                    <p className="text-xs text-[#6c7086]">{r.description}</p>
                    {pulling===r.pull_name && <p className="text-xs text-[#f9e2af] mt-1">{pullProgress}</p>}
                  </div>
                  {installed
                    ? <CheckCircle size={16} className="text-[#a6e3a1] flex-shrink-0 mt-0.5"/>
                    : <button onClick={()=>handlePull(r.pull_name)} disabled={!!pulling}
                        className="flex items-center gap-1 text-xs bg-[#89b4fa] text-[#1e1e2e] px-2 py-1 rounded hover:opacity-80 disabled:opacity-40 flex-shrink-0">
                        <Download size={11}/>{pulling===r.pull_name?"...":"Descargar"}
                      </button>
                  }
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-3">
          <input value={sessionName} onChange={e=>setSessionName(e.target.value)} placeholder="Nombre de la sesi\u00f3n"
            className="flex-1 bg-[#181825] border border-[#313244] rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#89b4fa]"/>
          <button onClick={handleOpenProject} className="flex items-center gap-2 bg-[#313244] hover:bg-[#45475a] px-4 py-3 rounded-lg text-sm transition-colors">
            <FolderOpen size={15}/> Abrir proyecto
          </button>
          <button onClick={handleCreate} disabled={!selectedModel}
            className="flex items-center gap-2 bg-[#89b4fa] text-[#1e1e2e] hover:opacity-90 px-4 py-3 rounded-lg text-sm font-medium disabled:opacity-40">
            <Plus size={15}/> Nueva sesi\u00f3n
          </button>
        </div>
      </div>
    </div>
  );
}
