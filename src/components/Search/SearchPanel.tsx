import { useState, useEffect, useRef } from "react";
import { useStore } from "../../store";
import { Search, X, CaseSensitive, Loader2, FileCode } from "lucide-react";
import type { SearchMatch } from "../../types";

export default function SearchPanel() {
  const { searchQuery, searchResults, searchLoading, runSearch, clearSearch, setActiveFile, projectPath } = useStore();
  const [input, setInput] = useState(searchQuery);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!input.trim()) { clearSearch(); return; }
    debounceRef.current = setTimeout(() => runSearch(input, caseSensitive), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, caseSensitive]);

  // Group results by file
  const grouped = searchResults.reduce<Record<string, SearchMatch[]>>((acc, m) => {
    (acc[m.file_path] = acc[m.file_path] || []).push(m);
    return acc;
  }, {});

  const openMatch = async (match: SearchMatch) => {
    await setActiveFile(match.file_path);
  };

  if (!projectPath) return (
    <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: "#2e2e4a" }}>
      <Search size={24} />
      <p className="text-[10px] text-center">Abre un proyecto<br />para buscar</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "#0f0f1a" }}>
      {/* Search input */}
      <div className="flex items-center gap-1.5 px-2 py-2 flex-shrink-0" style={{ borderBottom: "1px solid #1e1e35" }}>
        <div className="flex-1 flex items-center gap-1.5 rounded px-2 py-1" style={{ background: "#13131f", border: "1px solid #1e1e35" }}>
          {searchLoading
            ? <Loader2 size={10} className="animate-spin flex-shrink-0" style={{ color: "#818cf8" }} />
            : <Search size={10} className="flex-shrink-0" style={{ color: "#3a3a5c" }} />}
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Buscar en proyecto..."
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: "#c8cce8", minWidth: 0 }}
          />
          {input && (
            <button onClick={() => { setInput(""); clearSearch(); }} style={{ color: "#3a3a5c" }} className="hover:opacity-80">
              <X size={10} />
            </button>
          )}
        </div>
        <button
          onClick={() => setCaseSensitive(v => !v)}
          title="Sensible a mayúsculas"
          className="p-1 rounded transition-all"
          style={{ background: caseSensitive ? "#1e1e35" : "transparent", color: caseSensitive ? "#818cf8" : "#3a3a5c" }}
        >
          <CaseSensitive size={12} />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!input && (
          <p className="text-[10px] px-3 py-3 italic" style={{ color: "#2e2e4a" }}>Escribe para buscar...</p>
        )}
        {input && !searchLoading && searchResults.length === 0 && (
          <p className="text-[10px] px-3 py-3" style={{ color: "#2e2e4a" }}>Sin resultados</p>
        )}
        {Object.entries(grouped).map(([filePath, matches]) => {
          const fileName = filePath.split("/").pop() || filePath;
          const relPath = filePath.replace(projectPath + "/", "");
          return (
            <div key={filePath} className="mb-0.5">
              <div className="flex items-center gap-1.5 px-3 py-1 sticky top-0" style={{ background: "#0f0f1a" }}>
                <FileCode size={10} style={{ color: "#818cf8", flexShrink: 0 }} />
                <span className="text-[10px] font-medium truncate" style={{ color: "#818cf8" }}>{fileName}</span>
                <span className="text-[9px] truncate" style={{ color: "#2e2e4a" }}>{relPath}</span>
                <span className="ml-auto text-[9px] px-1 rounded" style={{ background: "#1e1e35", color: "#4a4a6a" }}>{matches.length}</span>
              </div>
              {matches.map((m, i) => (
                <button
                  key={i}
                  onClick={() => openMatch(m)}
                  className="w-full flex items-baseline gap-2 px-4 py-0.5 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-[9px] flex-shrink-0 font-mono" style={{ color: "#3a3a5c", minWidth: 24 }}>{m.line_number}</span>
                  <span className="text-[10px] font-mono truncate" style={{ color: "#6b6b8a" }}>{m.line_content}</span>
                </button>
              ))}
            </div>
          );
        })}
        {searchResults.length >= 500 && (
          <p className="text-[10px] px-3 py-2 italic" style={{ color: "#3a3a5c" }}>Mostrando primeros 500 resultados</p>
        )}
      </div>
    </div>
  );
}
