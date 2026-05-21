import { useState, useEffect, useRef } from "react";
import { useStore } from "../../store";
import { open } from "@tauri-apps/plugin-dialog";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FolderPlus, RotateCcw } from "lucide-react";
import type { FileNode } from "../../types";

const EXT_COLOR: Record<string, string> = {
  php: "#7dd3fc", js: "#fbbf24", ts: "#a5b4fc", tsx: "#67e8f9", jsx: "#fde68a",
  py: "#86efac", rs: "#fb923c", sql: "#e879f9", css: "#c4b5fd", html: "#f87171",
  json: "#fcd34d", md: "#94a3b8", sh: "#a3e635", vue: "#4ade80", scss: "#c084fc",
};

function TreeNode({ node, depth = 0, activeFile }: { node: FileNode; depth?: number; activeFile: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const { setActiveFile } = useStore();
  const nodeRef = useRef<HTMLButtonElement>(null);
  const color = EXT_COLOR[node.extension] || "#4a4a6a";
  const pad = { paddingLeft: `${8 + depth * 12}px` };
  const isActive = activeFile === node.path;

  // Auto-scroll into view when this node becomes active
  useEffect(() => {
    if (isActive && nodeRef.current) {
      nodeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive]);

  if (node.is_dir) return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={pad}
        className="group flex items-center gap-1.5 w-full py-[3px] pr-2 text-xs rounded-sm transition-all hover:bg-white/5"
      >
        <span style={{ color: "#3a3a5c", opacity: 0.7 }}>
          {isOpen ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
        </span>
        {isOpen
          ? <FolderOpen size={12} style={{ color: "#818cf8", flexShrink: 0 }} />
          : <Folder size={12} style={{ color: "#3a3a5c", flexShrink: 0 }} />}
        <span className="truncate" style={{ color: isOpen ? "#c7d2fe" : "#6b6b8a" }}>{node.name}</span>
      </button>
      {isOpen && (
        <div style={{ borderLeft: "1px solid #1e1e35", marginLeft: `${8 + depth * 12 + 5}px` }}>
          {node.children.map(c => <TreeNode key={c.path} node={c} depth={depth + 1} activeFile={activeFile} />)}
        </div>
      )}
    </div>
  );

  return (
    <button
      ref={nodeRef}
      onClick={() => setActiveFile(node.path)}
      style={{ ...pad, background: isActive ? "#1e1e35" : undefined, borderLeft: isActive ? "2px solid #7c3aed" : "2px solid transparent" }}
      className="group flex items-center gap-1.5 w-full py-[3px] pr-2 text-xs transition-all hover:bg-white/5"
    >
      <File size={11} style={{ color, flexShrink: 0 }} />
      <span className="truncate" style={{ color: isActive ? "#c7d2fe" : "#6b6b8a" }}>{node.name}</span>
    </button>
  );
}

export default function FileExplorer() {
  const { projectPath, projectTree, loadProjectTree, activeFile } = useStore();

  const openFolder = async () => {
    const selected = await open({ directory: true, multiple: false, title: "Abrir proyecto" });
    if (typeof selected === "string") await loadProjectTree(selected);
  };

  const refresh = () => { if (projectPath) loadProjectTree(projectPath); };
  const folderName = projectPath ? projectPath.split("/").pop() : null;

  return (
    <div className="flex flex-col h-full" style={{ background: "#0f0f1a" }}>
      <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0" style={{ borderBottom: "1px solid #1e1e35" }}>
        {folderName
          ? <span className="text-[10px] font-mono truncate max-w-[120px]" style={{ color: "#4a4a6a" }}>{folderName}</span>
          : <span className="text-[10px]" style={{ color: "#2e2e4a" }}>Sin carpeta</span>}
        <div className="flex items-center gap-1">
          {projectPath && (
            <button onClick={refresh} title="Refrescar" style={{ color: "#4a4a6a" }} className="hover:opacity-100 opacity-50 transition-opacity p-0.5 rounded">
              <RotateCcw size={11} />
            </button>
          )}
          <button onClick={openFolder} title="Abrir carpeta" style={{ color: "#4a4a6a" }} className="hover:opacity-100 opacity-50 transition-opacity p-0.5 rounded">
            <FolderPlus size={12} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-0.5">
        {projectTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Folder size={28} style={{ color: "#1e1e35" }} />
            <p className="text-[10px] text-center" style={{ color: "#2e2e4a" }}>Abre una carpeta<br />para explorar</p>
            <button onClick={openFolder} className="text-[10px] px-3 py-1 rounded transition-all hover:opacity-80 mt-1" style={{ background: "#1e1e35", color: "#4a4a6a" }}>
              Abrir carpeta
            </button>
          </div>
        ) : (
          <div className="py-0.5">
            {projectTree.map(n => <TreeNode key={n.path} node={n} activeFile={activeFile} />)}
          </div>
        )}
      </div>
    </div>
  );
}
