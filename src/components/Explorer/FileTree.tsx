import { useState } from "react";
import { useStore } from "../../store";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FolderPlus } from "lucide-react";
import type { FileNode } from "../../types";

const EXT_COLOR: Record<string,string> = {
  php:"#7dd3fc", js:"#fde047", ts:"#93c5fd", tsx:"#67e8f9", jsx:"#fef08a",
  py:"#86efac", rs:"#fb923c", sql:"#f0abfc", css:"#c4b5fd", html:"#fca5a5",
  json:"#fcd34d", md:"#94a3b8", sh:"#a3e635", vue:"#86efac", scss:"#c4b5fd",
};

function TreeNode({ node, depth=0 }: { node:FileNode; depth?:number }) {
  const [isOpen, setIsOpen] = useState(false);
  const { setActiveFile, activeFile } = useStore();
  const color = EXT_COLOR[node.extension] || "#585b70";
  const pad = { paddingLeft:`${10+depth*14}px` };

  if (node.is_dir) return (
    <div>
      <button
        onClick={()=>setIsOpen(!isOpen)}
        style={pad}
        className="group flex items-center gap-1.5 w-full hover:bg-[#2a2b3d] py-[3px] pr-2 text-xs rounded-sm text-[#cdd6f4] transition-colors"
      >
        <span className="text-[#45475a] group-hover:text-[#6c7086] transition-colors">
          {isOpen ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
        </span>
        {isOpen
          ? <FolderOpen size={13} className="text-[#89b4fa] flex-shrink-0"/>
          : <Folder size={13} className="text-[#89b4fa] flex-shrink-0"/>}
        <span className="truncate font-medium">{node.name}</span>
      </button>
      {isOpen && (
        <div className="border-l border-[#2a2b3d] ml-[18px]">
          {node.children.map(c=><TreeNode key={c.path} node={c} depth={depth+1}/>)}
        </div>
      )}
    </div>
  );

  return (
    <button
      onClick={()=>setActiveFile(node.path)}
      style={pad}
      className={"group flex items-center gap-1.5 w-full py-[3px] pr-2 text-xs rounded-sm transition-colors " +
        (activeFile===node.path
          ? "bg-[#313244] text-[#89b4fa]"
          : "hover:bg-[#2a2b3d] text-[#a6adc8]")}
    >
      <File size={11} style={{color}} className="flex-shrink-0"/>
      <span className="truncate">{node.name}</span>
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
    <div className="flex flex-col h-full bg-[#181825]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e1e2e] flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-[#45475a] uppercase tracking-widest">Explorador</span>
          {folderName && <span className="text-[10px] text-[#6c7086] truncate max-w-[100px]">— {folderName}</span>}
        </div>
        <button
          onClick={openFolder}
          title="Abrir carpeta"
          className="text-[#45475a] hover:text-[#89b4fa] transition-colors p-0.5 rounded"
        >
          <FolderPlus size={14}/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-[#313244] scrollbar-track-transparent">
        {tree.length===0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
            <Folder size={32} className="text-[#313244]"/>
            <p className="text-center text-[11px] text-[#45475a] leading-relaxed">
              Abre una carpeta<br/>para explorar archivos
            </p>
            <button
              onClick={openFolder}
              className="text-xs bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] px-3 py-1.5 rounded-md transition-colors"
            >
              Abrir carpeta
            </button>
          </div>
        ) : (
          <div className="py-0.5">
            {tree.map(n=><TreeNode key={n.path} node={n}/>)}
          </div>
        )}
      </div>
    </div>
  );
}
