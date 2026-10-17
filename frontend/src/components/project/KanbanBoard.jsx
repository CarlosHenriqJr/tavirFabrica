import React, { useState } from "react";
import { Check, Loader2, Lock, Clock, GripVertical } from "lucide-react";
import { agentAccent } from "@/lib/tavir";
import { toast } from "sonner";

const COLS = [
  { id: "aguardando", label: "Aguardando", dot: "bg-[#5C6578]" },
  { id: "bloqueado", label: "Bloqueado", dot: "bg-rose-400" },
  { id: "active", label: "Em execução", dot: "bg-lime-400" },
  { id: "done", label: "Concluído", dot: "bg-teal-400" },
];

function colOf(s) {
  if (s.status === "done") return "done";
  if (s.status === "active") return "active";
  if (s.status === "blocked" && s.blockReason) return "bloqueado";
  return "aguardando";
}

export default function KanbanBoard({ project, onCompleteStep }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const drop = async (colId) => {
    setOverCol(null);
    const step = project.steps.find((s) => s.idx === dragId);
    setDragId(null);
    if (!step) return;
    if (colId === "done") {
      if (step.status === "done") return;
      if (step.status === "active") { await onCompleteStep(step); return; }
      if (step.status === "blocked" && step.blockReason) {
        toast.warning(step.blockReason === "build" ? "Bloqueio técnico · resolva SUPABASE_URL em Pendências." : "Gate Humano obrigatório · autorize em Pendências.");
        return;
      }
      toast.info("Conclua as etapas em ordem · esta ainda não é a etapa atual.");
    }
  };

  return (
    <div className="fade-up">
      <p className="text-[12px] text-[#5C6578] mb-3">Arraste a etapa <span className="text-lime-300">em execução</span> para <span className="text-teal-300">Concluído</span> para avançar a esteira ao vivo.</p>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {COLS.map((col) => {
          const steps = project.steps.filter((s) => colOf(s) === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.id); }}
              onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
              onDrop={() => drop(col.id)}
              data-testid={`kanban-col-${col.id}`}
              className={`w-[250px] shrink-0 surface rounded-xl p-3 transition-all ${overCol === col.id ? "glow-lime" : ""}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                <span className="text-[12px] font-semibold text-[#E8EDF5]">{col.label}</span>
                <span className="ml-auto text-[10px] mono text-[#5C6578]">{steps.length}</span>
              </div>
              <div className="space-y-2 min-h-[40px]">
                {steps.map((s) => {
                  const draggable = s.status === "active";
                  return (
                    <div
                      key={s.idx}
                      draggable={draggable}
                      onDragStart={() => setDragId(s.idx)}
                      onDragEnd={() => { setDragId(null); setOverCol(null); }}
                      data-testid={`kanban-card-${s.idx}`}
                      className={`surface-2 rounded-lg p-2.5 ${draggable ? "cursor-grab active:cursor-grabbing hover:border-lime-400/40" : ""} ${dragId === s.idx ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start gap-1.5">
                        {draggable && <GripVertical size={13} className="text-lime-400/70 mt-0.5 shrink-0" />}
                        {s.status === "done" && <Check size={13} className="text-teal-300 mt-0.5 shrink-0" />}
                        {s.status === "active" && !draggable && <Loader2 size={12} className="text-lime-300 animate-spin mt-0.5 shrink-0" />}
                        {col.id === "bloqueado" && <Lock size={12} className="text-rose-400 mt-0.5 shrink-0" />}
                        {col.id === "aguardando" && <Clock size={12} className="text-[#5C6578] mt-0.5 shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-[12px] text-[#E8EDF5] font-medium leading-snug">{String(s.idx).padStart(2, "0")} · {s.title}</p>
                          <p className={`text-[10.5px] mt-0.5 ${agentAccent(s.agent)}`}>{s.agent}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {steps.length === 0 && <p className="text-[11px] text-[#5C6578] py-2 text-center">—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
