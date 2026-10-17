import React from "react";
import { FileText, Folder, Package, Download, Image as ImageIcon, Type, LayoutGrid } from "lucide-react";

export function FilesTab({ project }) {
  const files = project.files || [];
  const isLP = project.code.startsWith("LP");
  const iconFor = (t) => (t === "dir" ? Folder : t === "artifact" ? Package : FileText);

  return (
    <div className="surface rounded-2xl p-5 fade-up">
      <h3 className="font-bold text-[15px] mb-4 flex items-center gap-2 text-[#E8EDF5]"><Folder size={16} className="text-teal-400" />Arquivos & Workspace</h3>

      {isLP && project.inventory && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { icon: LayoutGrid, label: "seções", val: project.inventory.secoes },
            { icon: Type, label: "textos", val: project.inventory.textos },
            { icon: ImageIcon, label: "imagens", val: project.inventory.imagens },
          ].map((m) => (
            <div key={m.label} className="surface-2 rounded-xl p-4 text-center">
              <m.icon size={18} className="text-teal-400 mx-auto mb-1.5" />
              <div className="text-2xl font-extrabold text-[#E8EDF5]">{m.val}</div>
              <div className="text-[11px] text-[#5C6578] mono">{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 ? (
        <p className="text-[13px] text-[#5C6578] py-6 text-center">Scaffold físico ainda não gerado para este projeto.</p>
      ) : (
        <div className="mono text-[13px] space-y-0.5">
          {files.map((f) => {
            const Icon = iconFor(f.type);
            return (
              <div key={f.path} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors" data-testid={`file-${f.path}`}>
                <Icon size={14} className={f.type === "dir" ? "text-amber-300/70" : f.type === "artifact" ? "text-lime-400" : "text-[#8A94A6]"} />
                <span className="text-[#E8EDF5] flex-1">{f.path}</span>
                {f.type === "artifact" && (
                  <button className="flex items-center gap-1.5 text-[11px] text-lime-300 hover:text-lime-200 transition-colors" data-testid={`download-${f.path}`}>
                    <Download size={12} />download
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AccessTab({ project, onResolveBuild }) {
  const env = project.env || [];
  return (
    <div className="surface rounded-2xl p-5 fade-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[15px] flex items-center gap-2 text-[#E8EDF5]"><Package size={16} className="text-teal-400" />Acessos · ACESSOS.md / AMBIENTE.md</h3>
        <span className="text-[11px] mono text-[#5C6578]">conta: vercel · tavir</span>
      </div>
      {env.length === 0 ? (
        <p className="text-[13px] text-[#5C6578] py-6 text-center">Nenhuma variável de ambiente cadastrada.</p>
      ) : (
        <div className="space-y-2">
          {env.map((e) => (
            <div key={e.key} className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg surface-2" data-testid={`env-${e.key}`}>
              <span className="mono text-[12.5px] text-[#E8EDF5] w-[180px] shrink-0">{e.key}</span>
              <span className="mono text-[12px] text-[#8A94A6] flex-1 truncate">{e.value || <span className="text-rose-400 italic">não cadastrada</span>}</span>
              <span className={`text-[10px] mono px-2 py-0.5 rounded border ${e.status === "ok" ? "bg-teal-500/10 text-teal-300 border-teal-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/30"}`}>
                {e.status === "ok" ? "OK" : "MISSING"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
