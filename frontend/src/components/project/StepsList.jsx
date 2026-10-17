import React from "react";
import { Check, Lock, Loader2, Hash, PlayCircle } from "lucide-react";
import { agentAccent, initials } from "@/lib/tavir";

function StepItem({ s, isCurrent }) {
  const done = s.status === "done";
  const active = s.status === "active" || isCurrent;
  const blocked = s.status === "blocked";

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-all ${active ? "bg-lime-400/[0.04]" : ""}`} data-testid={`step-${s.idx}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border
        ${done ? "bg-teal-500/15 border-teal-500/40 text-teal-300"
          : active ? "bg-lime-400/15 border-lime-400/50 text-lime-300"
          : "bg-white/[0.03] border-white/10 text-[#5C6578]"}`}>
        {done ? <Check size={13} /> : active ? <Loader2 size={12} className="animate-spin" /> : <Lock size={11} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="mono text-[10px] text-[#5C6578]">{String(s.idx).padStart(2, "0")}</span>
          <p className={`text-[13.5px] font-semibold truncate ${blocked ? "text-[#5C6578]" : "text-[#E8EDF5]"}`}>{s.title}</p>
          {s.isGate && <span className="text-[9px] px-1.5 py-0.5 rounded border mono bg-amber-500/10 text-amber-300 border-amber-500/30">GATE</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-[11.5px] ${agentAccent(s.agent)}`}>{s.agent}</span>
          {(s.skills || []).map((sk) => (
            <span key={sk} className="text-[9.5px] mono text-[#5C6578] px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">{sk}</span>
          ))}
        </div>
        {s.hash && (
          <div className="flex items-center gap-1 mt-1 text-[10px] mono text-[#5C6578]">
            <Hash size={9} className="text-teal-400/60" /><span className="truncate">{s.hash}</span>
          </div>
        )}
      </div>
      <span className="text-[11px] shrink-0 mt-1">
        {done ? <span className="text-teal-300/80">concluído</span>
          : active ? <span className="text-lime-300">em execução</span>
          : <span className="text-[#5C6578]">{s.blockReason === "gate" || s.blockReason === "gate-final" ? "aguardando gate" : s.blockReason === "build" ? "bloqueio técnico" : "aguardando"}</span>}
      </span>
    </div>
  );
}

export default function StepsList({ project, onSimulate, simulating }) {
  const ci = project.currentStep;
  return (
    <div className="surface rounded-2xl flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <h3 className="font-bold text-[15px] text-[#E8EDF5]">Esteira passo a passo</h3>
        <span className="mono text-[12px] text-[#8A94A6]"><span className="text-[#E8EDF5] font-semibold">{project.currentStep}</span> de {project.totalSteps}</span>
      </div>

      <div className="max-h-[520px] overflow-y-auto p-1.5">
        {project.steps.map((s) => <StepItem key={s.idx} s={s} isCurrent={s.idx === ci && s.status === "active"} />)}
      </div>

      <div className="px-5 py-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
        <button
          onClick={onSimulate}
          disabled={simulating || project.status === "concluido"}
          data-testid="simulate-step-button"
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg surface-2 text-[13px] text-[#E8EDF5] hover:border-white/20 transition-all disabled:opacity-40"
        >
          {simulating ? <Loader2 size={14} className="animate-spin text-lime-400" /> : <PlayCircle size={14} className="text-lime-400" />}
          Simular conclusão da etapa atual
        </button>
        <span className="mono text-[11px] text-[#5C6578]">{project.runner}</span>
      </div>
    </div>
  );
}
