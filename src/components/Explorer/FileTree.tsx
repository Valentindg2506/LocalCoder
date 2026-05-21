import { useState } from "react";
import { useStore } from "../../store";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FolderPlus } from "lucide-react";
import type { FileNode } from "../../types";

const EXT_COLOR: Record<string,string> = {
  php:"#7dd3fc", js:"#fbbf24", ts:"#818cf8", tsx:"#67e8f9", jsx:"#fde68a",
  py:"#86efac", rs:"#fb923c", sql:"#e879f9", css:"#c4b5fd", html:"#f87171",
  json:"#fcd34d", md:"#94a3b8", sh:"#a3e635", vue:"#4ade80", scss:"#c084fc",
};

function TreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const { setActiveFile, activeFile } = useStore();
  const color = EXT_COLOR[node.extension] || "#2e2e50";
  const pad = { paddingLeft: `${8 + depth * 12}px` };

  if (node.is_dir) return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ ...pad, color: isOpen ? "#818cf8" : "#3a3a60" }}
        className="group flex items-center gap-1.5 w-full hover:bg-[#11111c] py-[3px] pr-2 text-xs rounded-sm transition-all"
      >
        <span className="transition-transform" style={{opacity:0.5}}>
          {isOpen ? <ChevronDown size={9}/> : <ChevronRight size={9}/>}
        </span>
        {isOpen
          ? <FolderOpen size={12} style={{color:"#7c3aed", flexShrink:0}}/>
          : <Folder size={12} style={{color:"#3a3a60", flexShrink:0}}/>}
        <span className="truncate" style={{color: isOpen ? "#a5b4fc" : "#4a4a6a"}}>{node.name}</span>
      </button>
      {isOpen && (
        <div style={{borderLeft:"1px solid #1a1a2e", marginLeft:`${8+depth*12+5}px`}}>
          {node.children.map(c => <TreeNode key={c.path} node={c} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );

  const isActive = activeFile === node.path;
  return (
    <button
      onClick={() => setActiveFile(node.path)}
      style={{ ...pad, background: isActive ? "#131320" : undefined, borderLeft: isActive ? "2px solid #7c3aed" : "2px solid transparent" }}
      className="group flex items-center gap-1.5 w-full py-[3px] pr-2 text-xs transition-all hover:bg-[#11111c]"
    >
      <File size={11} style={{ color, flexShrink: 0 }} />
      <span className="truncate" style={{color: isActive ? "#c7d2fe" : "#3a3a60"}}>{node.name}</span>
    </button>
  );
}

export default function FileExplorer() {
  const { setProjectPath, projectPath } = useStore();
  const [tree, setTree] = useState<FileNode[]>([]);

  const openFolder = async () => {
    const selected = await open({ directory: true, multiple: false, title: "Abrir proyecto" });
    if (typeof selected === "string") {
      setProjectPath(selected);
      const nodes = await invoke<FileNode[]>("list_directory", { path: selected });
      setTree(nodes);
    }
  };

  const folderName = projectPath ? projectPath.split("/").pop() : null;

  return (
    <div className="flex flex-col h-full" style={{background:"#0a0a11"}}>
      <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0" style={{borderBottom:"1px solid #111118"}}>
        {folderName
          ? <span className="text-[10px] font-mono truncate max-w-[140px]" style={{color:"#3a3a60"}}>{folderName}</span>
          : <span className="text-[10px]" style={{color:"#2e2e4a"}}>Sin carpeta</span>
        }
        <button onClick={openFolder} title="Abrir carpeta" style={{color:"#3a3a60"}} className="hover:opacity-100 transition-opacity p-0.5 rounded">
          <FolderPlus size={12}/>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-0.5">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Folder size={24} style={{color:"#1a1a2e"}}/>
            <button onClick={openFolder} className="text-[10px] px-3 py-1 rounded transition-all hover:opacity-80" style={{background:"#131320", color:"#3a3a60"}}>
              Abrir carpeta
            </button>
          </div>
        ) : (
          <div className="py-0.5">
            {tree.map(n => <TreeNode key={n.path} node={n} />)}
          </div>
        )}
      </div>
    </div>
  );
}
