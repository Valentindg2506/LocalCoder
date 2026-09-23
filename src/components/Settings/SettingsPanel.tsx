import { useStore } from "../../store";
import { Settings as SettingsIcon, Zap, Type, ToggleLeft, ToggleRight, Save } from "lucide-react";

export default function SettingsPanel() {
  const { settings, updateSettings, models } = useStore();

  const toggle = (key: keyof typeof settings) =>
    updateSettings({ [key]: !settings[key as keyof typeof settings] } as any);

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #1e1e35" }}>
      <span className="text-[11px]" style={{ color: "#6b6b8a" }}>{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );

  const ToggleBtn = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} style={{ color: value ? "#818cf8" : "#3a3a5c" }}>
      {value ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
    </button>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: "#0f0f1a" }}>
      <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: "1px solid #1e1e35" }}>
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#3a3a5c" }}>Configuración</span>
      </div>

      <div className="px-3 py-1">
        {/* Ollama URL */}
        <div className="py-2" style={{ borderBottom: "1px solid #1e1e35" }}>
          <p className="text-[10px] mb-1" style={{ color: "#4a4a6a" }}>URL de Ollama</p>
          <input
            value={settings.ollamaUrl}
            onChange={e => updateSettings({ ollamaUrl: e.target.value })}
            className="w-full rounded px-2 py-1 text-xs font-mono outline-none"
            style={{ background: "#13131f", border: "1px solid #1e1e35", color: "#c8cce8" }}
          />
        </div>

        {/* Default model */}
        <div className="py-2" style={{ borderBottom: "1px solid #1e1e35" }}>
          <p className="text-[10px] mb-1" style={{ color: "#4a4a6a" }}>Modelo por defecto</p>
          {models.length > 0 ? (
            <select
              value={settings.defaultModel}
              onChange={e => updateSettings({ defaultModel: e.target.value })}
              className="w-full rounded px-2 py-1 text-xs outline-none"
              style={{ background: "#13131f", border: "1px solid #1e1e35", color: "#c8cce8" }}
            >
              {models.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
          ) : (
            <input
              value={settings.defaultModel}
              onChange={e => updateSettings({ defaultModel: e.target.value })}
              className="w-full rounded px-2 py-1 text-xs font-mono outline-none"
              style={{ background: "#13131f", border: "1px solid #1e1e35", color: "#c8cce8" }}
            />
          )}
        </div>

        {/* Font size */}
        <Row label="Tamaño de fuente">
          <Type size={11} style={{ color: "#3a3a5c" }} />
          <input
            type="number" min={10} max={24} step={0.5}
            value={settings.fontSize}
            onChange={e => updateSettings({ fontSize: parseFloat(e.target.value) })}
            className="w-14 rounded px-2 py-0.5 text-xs text-center outline-none font-mono"
            style={{ background: "#13131f", border: "1px solid #1e1e35", color: "#c8cce8" }}
          />
        </Row>

        {/* Tab size */}
        <Row label="Tamaño de tab">
          <select
            value={settings.tabSize}
            onChange={e => updateSettings({ tabSize: parseInt(e.target.value) })}
            className="rounded px-2 py-0.5 text-xs outline-none"
            style={{ background: "#13131f", border: "1px solid #1e1e35", color: "#c8cce8" }}
          >
            {[2, 4, 8].map(n => <option key={n} value={n}>{n} espacios</option>)}
          </select>
        </Row>

        {/* Word wrap */}
        <Row label="Ajuste de línea">
          <ToggleBtn value={settings.wordWrap} onToggle={() => toggle("wordWrap")} />
        </Row>

        {/* AI completions */}
        <Row label="Autocompletado IA">
          <Zap size={11} style={{ color: settings.aiCompletionsEnabled ? "#818cf8" : "#3a3a5c" }} />
          <ToggleBtn value={settings.aiCompletionsEnabled} onToggle={() => toggle("aiCompletionsEnabled")} />
        </Row>

        {/* Auto save */}
        <Row label="Guardado automático">
          <Save size={11} style={{ color: settings.autoSave ? "#818cf8" : "#3a3a5c" }} />
          <ToggleBtn value={settings.autoSave} onToggle={() => toggle("autoSave")} />
        </Row>

        {settings.autoSave && (
          <Row label="Delay guardado (ms)">
            <input
              type="number" min={500} max={10000} step={500}
              value={settings.autoSaveDelay}
              onChange={e => updateSettings({ autoSaveDelay: parseInt(e.target.value) })}
              className="w-20 rounded px-2 py-0.5 text-xs text-center outline-none font-mono"
              style={{ background: "#13131f", border: "1px solid #1e1e35", color: "#c8cce8" }}
            />
          </Row>
        )}
      </div>
    </div>
  );
}
