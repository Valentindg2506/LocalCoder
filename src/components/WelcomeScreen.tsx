import { useEffect, useState } from "react";
import { useStore } from "../store";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Cpu, MemoryStick, Plus, FolderOpen, Download, CheckCircle, Zap } from "lucide-react";
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
    setPulling(modelName); setPullProgress("Iniciando descarga...");
    const { listen } = await import("@tauri-apps/api/event");
    const ul = await listen("pull_progress", (e: any) => {
      if (e.payload?.status) setPullProgress(e.payload.status);
    });
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
      <div className="w-full max-w-2xl space-y-5">

        {/* Header */}
        <div className="text-center pb-2">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-[#89b4fa] rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-[#1e1e2e]"/>
            </div>
            <h1 className="text-3xl font-bold text-[#cdd6f4]">LocalCoder</h1>
          </div>
          <p className="text-[#585b70] text-sm">IDE con IA 100% local &nbsp;&middot;&nbsp; Sin nube &nbsp;&middot;&nbsp; Sin l&iacute;mites</p>
        </div>

        {/* Hardware info */}
        {hardware && (
          <div className="bg-[#181825] rounded-xl p-4 grid grid-cols-2 gap-4 border border-[#313244]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#313244] rounded-lg flex items-center justify-center flex-shrink-0">
                <Cpu size={15} className="text-[#89b4fa]"/>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[#45475a] uppercase tracking-wider mb-0.5">CPU</p>
                <p className="text-xs text-[#cdd6f4] truncate">{hardware.cpu_name}</p>
                <p className="text-[10px] text-[#6c7086]">{hardware.cpu_cores} n&uacute;cleos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#313244] rounded-lg flex items-center justify-center flex-shrink-0">
                <MemoryStick size={15} className="text-[#89b4fa]"/>
              </div>
              <div>
                <p className="text-[10px] text-[#45475a] uppercase tracking-wider mb-0.5">RAM</p>
                <p className="text-xs text-[#cdd6f4]">{hardware.total_ram_gb.toFixed(1)} GB total</p>
                <p className="text-[10px] text-[#6c7086]">{hardware.available_ram_gb.toFixed(1)} GB libre</p>
              </div>
            </div>
          </div>
        )}

        {/* Installed models */}
        <div className="bg-[#181825] rounded-xl p-4 border border-[#313244]">
          <p className="text-[10px] font-semibold text-[#45475a] uppercase tracking-widest mb-3">Modelos instalados en Ollama</p>
          {models.length===0 ? (
            <p className="text-xs text-[#45475a] italic">No hay modelos instalados. Descarga uno abajo.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {models.map(m => (
                <button key={m.name} onClick={()=>setSelectedModel(m.name)}
                  className={"flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all " +
                    (selectedModel===m.name
                      ? "bg-[#89b4fa] text-[#1e1e2e] shadow-lg shadow-[#89b4fa]/20"
                      : "bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4]")}>
                  {m.name}
                  <span className="opacity-60">{(m.size/1e9).toFixed(1)}GB</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recommended models */}
        <div className="bg-[#181825] rounded-xl p-4 border border-[#313244]">
          <p className="text-[10px] font-semibold text-[#45475a] uppercase tracking-widest mb-3">Recomendados para tu equipo ({hardware?.total_ram_gb.toFixed(0)}GB RAM)</p>
          <div className="space-y-2">
            {recommendations.map(r => {
              const installed = models.some(m => m.name===r.name);
              const isDownloading = pulling===r.pull_name;
              return (
                <div key={r.name}
                  className={"flex items-center gap-3 p-3 rounded-lg border transition-colors " +
                    (installed ? "border-[#a6e3a1]/20 bg-[#a6e3a1]/5" : "border-[#2a2b3d] bg-[#1e1e2e] hover:border-[#313244]")}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-xs text-[#cdd6f4]">{r.display_name}</span>
                      <span className="text-[10px] text-[#45475a]">{r.size_gb}GB</span>
                      {r.tags.map(t=>(
                        <span key={t} className="text-[10px] bg-[#313244] px-1.5 py-0.5 rounded text-[#89b4fa]">{t}</span>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#585b70]">{r.description}</p>
                    {isDownloading && (
                      <div className="mt-1.5">
                        <div className="h-1 bg-[#313244] rounded-full overflow-hidden">
                          <div className="h-full bg-[#89b4fa] rounded-full animate-pulse w-3/4"/>
                        </div>
                        <p className="text-[10px] text-[#f9e2af] mt-1">{pullProgress}</p>
                      </div>
                    )}
                  </div>
                  {installed ? (
                    <div className="flex items-center gap-1 text-[#a6e3a1]">
                      <CheckCircle size={14}/>
                      <span className="text-[10px]">Instalado</span>
                    </div>
                  ) : (
                    <button
                      onClick={()=>handlePull(r.pull_name)}
                      disabled={!!pulling}
                      className="flex items-center gap-1.5 text-xs bg-[#313244] hover:bg-[#89b4fa] hover:text-[#1e1e2e] text-[#cdd6f4] px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 flex-shrink-0 font-medium"
                    >
                      <Download size={11}/>
                      {isDownloading ? "Descargando..." : "Descargar"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex gap-2">
          <input
            value={sessionName}
            onChange={e=>setSessionName(e.target.value)}
            placeholder="Nombre de la sesi\u00f3n"
            className="flex-1 bg-[#181825] border border-[#313244] focus:border-[#89b4fa] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[#45475a]"
          />
          <button
            onClick={handleOpenProject}
            className="flex items-center gap-2 bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] px-4 py-2.5 rounded-lg text-sm transition-colors font-medium flex-shrink-0"
          >
            <FolderOpen size={14}/> Proyecto
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedModel}
            className="flex items-center gap-2 bg-[#89b4fa] text-[#1e1e2e] hover:opacity-90 px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 transition-all flex-shrink-0 shadow-lg shadow-[#89b4fa]/20"
          >
            <Plus size={14}/> Nueva sesi\u00f3n
          </button>
        </div>

      </div>
    </div>
  );
}
