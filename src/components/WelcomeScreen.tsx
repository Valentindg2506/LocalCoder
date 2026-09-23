import { useEffect, useState } from "react";
import { useStore } from "../store";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Cpu, MemoryStick, Plus, FolderOpen, Download, CheckCircle, Zap, AlertTriangle } from "lucide-react";
import type { ModelRecommendation } from "../types";

export default function WelcomeScreen() {
  const { hardware, models, modelsError, loadModels, createSession, setProjectPath } = useStore();
  const [recommendations, setRecommendations] = useState<ModelRecommendation[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [sessionName, setSessionName] = useState("Nueva sesión");
  const [pulling, setPulling] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState("");

  useEffect(() => {
    if (hardware) invoke<ModelRecommendation[]>("get_recommended_models", { ramGb: hardware.total_ram_gb }).then(setRecommendations);
  }, [hardware]);

  useEffect(() => {
    if (models.length > 0 && !selectedModel) setSelectedModel(models[0].name);
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
    <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto" style={{ background: "#13131f" }}>
      <div className="w-full max-w-2xl space-y-5">

        {/* Header */}
        <div className="text-center pb-2">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#3b82f6)" }}>
              <Zap size={16} color="#fff" />
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#d4d6f0" }}>LocalCoder</h1>
          </div>
          <p className="text-sm" style={{ color: "#3a3a5c" }}>IDE con IA 100% local · Sin nube · Sin límites</p>
        </div>

        {/* Ollama error banner */}
        {modelsError && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: "#1a0f0f", border: "1px solid #3a1515" }}>
            <AlertTriangle size={15} style={{ color: "#f87171", flexShrink: 0 }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: "#f87171" }}>Ollama no responde</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#6b3a3a" }}>Asegúrate de que Ollama está instalado y ejecutándose con <code className="font-mono">ollama serve</code></p>
            </div>
          </div>
        )}

        {/* Hardware info */}
        {hardware && (
          <div className="rounded-xl p-4 grid grid-cols-2 gap-4" style={{ background: "#0f0f1a", border: "1px solid #1e1e35" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#1e1e35" }}>
                <Cpu size={15} style={{ color: "#818cf8" }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#3a3a5c" }}>CPU</p>
                <p className="text-xs truncate" style={{ color: "#c8cce8" }}>{hardware.cpu_name}</p>
                <p className="text-[10px]" style={{ color: "#4a4a6a" }}>{hardware.cpu_cores} núcleos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#1e1e35" }}>
                <MemoryStick size={15} style={{ color: "#818cf8" }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#3a3a5c" }}>RAM</p>
                <p className="text-xs" style={{ color: "#c8cce8" }}>{hardware.total_ram_gb.toFixed(1)} GB total</p>
                <p className="text-[10px]" style={{ color: "#4a4a6a" }}>{hardware.available_ram_gb.toFixed(1)} GB libre</p>
              </div>
            </div>
          </div>
        )}

        {/* Installed models */}
        <div className="rounded-xl p-4" style={{ background: "#0f0f1a", border: "1px solid #1e1e35" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#3a3a5c" }}>Modelos instalados en Ollama</p>
          {models.length === 0 ? (
            <p className="text-xs italic" style={{ color: "#2e2e4a" }}>
              {modelsError ? "No se pudo conectar con Ollama." : "No hay modelos instalados. Descarga uno abajo."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {models.map(m => (
                <button key={m.name} onClick={() => setSelectedModel(m.name)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={selectedModel === m.name
                    ? { background: "#7c3aed", color: "#fff" }
                    : { background: "#1e1e35", color: "#6b6b8a" }}>
                  {m.name}
                  <span style={{ opacity: 0.5 }}>{(m.size / 1e9).toFixed(1)}GB</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recommended models */}
        <div className="rounded-xl p-4" style={{ background: "#0f0f1a", border: "1px solid #1e1e35" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#3a3a5c" }}>Recomendados para tu equipo ({hardware?.total_ram_gb.toFixed(0)}GB RAM)</p>
          <div className="space-y-2">
            {recommendations.map(r => {
              const installed = models.some(m => m.name === r.name);
              const isDownloading = pulling === r.pull_name;
              return (
                <div key={r.name}
                  className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                  style={{ border: installed ? "1px solid #2e4a2e" : "1px solid #1e1e35", background: installed ? "#0f1a0f" : "#13131f" }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-xs" style={{ color: "#c8cce8" }}>{r.display_name}</span>
                      <span className="text-[10px]" style={{ color: "#3a3a5c" }}>{r.size_gb}GB</span>
                      {r.tags.map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#1e1e35", color: "#818cf8" }}>{t}</span>
                      ))}
                    </div>
                    <p className="text-[11px]" style={{ color: "#4a4a6a" }}>{r.description}</p>
                    {isDownloading && (
                      <div className="mt-1.5">
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1e1e35" }}>
                          <div className="h-full rounded-full animate-pulse" style={{ background: "#7c3aed", width: "60%" }} />
                        </div>
                        <p className="text-[10px] mt-1" style={{ color: "#f9e2af" }}>{pullProgress}</p>
                      </div>
                    )}
                  </div>
                  {installed ? (
                    <div className="flex items-center gap-1" style={{ color: "#86efac" }}>
                      <CheckCircle size={14} />
                      <span className="text-[10px]">Instalado</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePull(r.pull_name)}
                      disabled={!!pulling}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 flex-shrink-0 font-medium"
                      style={{ background: "#1e1e35", color: "#c8cce8" }}
                    >
                      <Download size={11} />
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
            onChange={e => setSessionName(e.target.value)}
            placeholder="Nombre de la sesión"
            className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
            style={{ background: "#0f0f1a", border: "1px solid #1e1e35", color: "#c8cce8" }}
          />
          <button
            onClick={handleOpenProject}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors font-medium flex-shrink-0"
            style={{ background: "#1e1e35", color: "#c8cce8" }}
          >
            <FolderOpen size={14} /> Proyecto
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedModel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 transition-all flex-shrink-0"
            style={{ background: "#7c3aed", color: "#fff" }}
          >
            <Plus size={14} /> Nueva sesión
          </button>
        </div>

      </div>
    </div>
  );
}
