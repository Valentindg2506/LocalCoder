import { useState } from "react";
import { useStore } from "../../store";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import type { FileNode } from "../../types";

const EXT_COLOR: Record<string,string> = {
  php:"#7dd3fc", js:"#fde047", ts:"#93c5fd", tsx:"#67e8f9", jsx:"#fef08a",
  py:"#86efac", rs:"#fb923c", sql:"#f0abfc", css:"#c4b5fd", html:"#fca5a5",
  json:"#fcd34d", md:"#94a3b8", sh:"#a3e635",
};

function TreeNode({ node, depth=0 }: { node:FileNode; depth?:number }) {
  const [open: openState, setOpen] = useState(depth < 2);
  const { setActiveFile, activeFile } = useStore();
  const color = EXT_COLOR[node.extension] || "#6c7086";
  const pad = { paddingLeft:`${8+depth*12}px` };
  if (node.is_dir) return (
    <div>
      <button onClick={()=>setOpen(!openState)} style={pad} className="flex items-center gap-1 w-full hover:bg-[#313244] py-0.5 text-sm rounded text-[#cdd6f4]">
        {openState ? <ChevronDown size={11}/> : <ChevronRight size={11}/>}
        {openState ? <FolderOpen size={13} color="#89b4fa"/> : <Folder size={13} color="#89b4fa"/>}
        <span className="truncate">{node.name}</span>
      </button>
      {openState && node.children.map(c=><TreeNode key={c.path} node={c} depth={depth+1}/>)}
    </div>
  );
  return (
    <button onClick={()=>setActiveFile(node.path)} style={pad}
      className={"flex items-center gap-1.5 w-full py-0.5 text-sm rounded " + (activeFile===node.path?"bg-[#313244] text-[#89b4fa]":"hover:bg-[#313244] text-[#cdd6f4]")}>
      <File size={12} color={color}/>
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export default function FileExplorer() {
  const { setProjectPath } = useStore();
  const [tree, setTree] = useState<FileNode[]>([]);
  const openFolder = async () => {
    const selected = await open({ directory: true, multiple: false, title: "Abrir proyecto" });
    if (typeof selected === "string") {
      setProjectPath(selected);
      const nodes = await invoke<FileNode[]>("list_directory", { path: selected });
      setTree(nodes);
    }
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#313244] flex-shrink-0">
        <span className="text-xs text-[#6c7086] uppercase tracking-wider">Explorador</span>
        <button onClick={openFolder} className="text-xs bg-[#313244] hover:bg-[#89b4fa] hover:text-[#1e1e2e] px-2 py-0.5 rounded transition-colors">Abrir</button>
      </div>
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        {tree.length===0
          ? <p className="px-3 py-6 text-center text-xs text-[#6c7086]">Abre una carpeta para ver los archivos</p>
          : tree.map(n=><TreeNode key={n.path} node={n}/>)}
      </div>
    </div>
  );
}
