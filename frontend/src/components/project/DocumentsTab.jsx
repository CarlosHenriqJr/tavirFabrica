import React, { useEffect, useState } from "react";
import { getDocuments } from "@/lib/api";
import { Markdown } from "@/lib/md";
import { FileText, ShieldCheck, Loader2 } from "lucide-react";

export default function DocumentsTab({ projectId }) {
  const [docs, setDocs] = useState(null);
  const [active, setActive] = useState(0);

  useEffect(() => { getDocuments(projectId).then(setDocs).catch(() => setDocs([])); }, [projectId]);

  if (!docs) return <div className="flex items-center gap-2 text-[#5C6578] py-10 justify-center"><Loader2 className="animate-spin" size={16} />Carregando documentos...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 fade-up">
      <div className="lg:col-span-1 space-y-1.5">
        {docs.map((d, i) => (
          <button key={d.name} onClick={() => setActive(i)} data-testid={`doc-${d.name}`}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 ${active === i ? "surface glow-teal" : "surface-2 hover:border-white/15"}`}>
            <FileText size={14} className={active === i ? "text-teal-400" : "text-[#8A94A6]"} />
            <span className="mono text-[12px] text-[#E8EDF5] truncate">{d.name}</span>
            {d.reviewed && <ShieldCheck size={12} className="text-lime-400 ml-auto shrink-0" />}
          </button>
        ))}
      </div>
      <div className="lg:col-span-3 surface rounded-2xl p-6">
        {docs[active] && (
          <>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.07]">
              <span className="mono text-[12px] text-[#5C6578]">{docs[active].name}</span>
              <span className="flex items-center gap-1.5 text-[11px] text-lime-300 px-2 py-0.5 rounded-full bg-lime-400/5 border border-lime-400/20">
                <ShieldCheck size={12} /> Selo · Banca Revisora Independente
              </span>
            </div>
            <Markdown source={docs[active].content} />
          </>
        )}
      </div>
    </div>
  );
}
