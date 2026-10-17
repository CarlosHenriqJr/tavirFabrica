import React from "react";
import { Kanban, CalendarRange, FileText, CheckCircle2 } from "lucide-react";

const ICONS = { kanban: Kanban, roadmap: CalendarRange, documentos: FileText };

const KANBAN_COLS = ["Descoberta", "Arquitetura / Prova Visual", "Engenharia Front/Back", "Linter & Compiler", "QA Físico", "Segurança", "Handoff"];

export default function SecondaryTab({ type, project }) {
  if (type === "kanban") {
    return (
      <div className="fade-up">
        <div className="flex gap-3 overflow-x-auto pb-3">
          {KANBAN_COLS.map((col) => {
            const steps = (project.steps || []).filter((s) =>
              (col === "Descoberta" && s.idx <= 2) ||
              (col === "Arquitetura / Prova Visual" && s.idx > 2 && s.idx <= 5) ||
              (col === "Engenharia Front/Back" && s.title.toLowerCase().includes("constru")) ||
              (col === "Linter & Compiler" && s.title.toLowerCase().includes("linter")) ||
              (col === "QA Físico" && s.title.toLowerCase().includes("qa")) ||
              (col === "Segurança" && s.title.toLowerCase().includes("segur")) ||
              (col === "Handoff" && (s.title.toLowerCase().includes("document") || s.title.toLowerCase().includes("gate final")))
            );
            return (
              <div key={col} className="w-[230px] shrink-0 surface rounded-xl p-3">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] font-semibold text-[#E8EDF5]">{col}</span>
                  <span className="text-[10px] mono text-[#5C6578]">{steps.length}</span>
                </div>
                <div className="space-y-2">
                  {steps.map((s) => (
                    <div key={s.idx} className="surface-2 rounded-lg p-2.5">
                      <p className="text-[12px] text-[#E8EDF5] font-medium leading-snug">{s.title}</p>
                      <p className="text-[10.5px] mt-1 text-[#8A94A6]">{s.agent}</p>
                      <span className={`inline-block mt-1.5 text-[9px] mono px-1.5 py-0.5 rounded border ${s.status === "done" ? "bg-teal-500/10 text-teal-300 border-teal-500/20" : s.status === "active" ? "bg-lime-400/10 text-lime-300 border-lime-400/20" : "bg-white/5 text-[#5C6578] border-white/10"}`}>
                        {s.status === "done" ? "concluído" : s.status === "active" ? "em execução" : "aguardando"}
                      </span>
                    </div>
                  ))}
                  {steps.length === 0 && <p className="text-[11px] text-[#5C6578] py-2 text-center">—</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "roadmap") {
    return (
      <div className="surface rounded-2xl p-5 fade-up">
        <h3 className="font-bold text-[15px] mb-4 flex items-center gap-2 text-[#E8EDF5]"><CalendarRange size={16} className="text-teal-400" />Roadmap · Timeline das etapas</h3>
        <div className="space-y-1">
          {(project.steps || []).map((s) => (
            <div key={s.idx} className="flex items-center gap-3">
              <span className="mono text-[10px] text-[#5C6578] w-6">{String(s.idx).padStart(2, "0")}</span>
              <div className="flex-1 h-7 rounded-md overflow-hidden surface-2 relative">
                <div className={`h-full ${s.status === "done" ? "bg-teal-500/25" : s.status === "active" ? "bg-lime-400/25 sweep" : "bg-white/[0.03]"}`}
                  style={{ width: s.status === "done" ? "100%" : s.status === "active" ? "55%" : "0%", transition: "width .5s" }} />
                <span className="absolute inset-0 flex items-center px-3 text-[12px] text-[#E8EDF5]">{s.title}{s.isGate ? " · GATE" : ""}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // documentos
  const DOCS = [
    { f: "PROJECT.md", d: "Visão geral do projeto, escopo e objetivos." },
    { f: "01-briefing-gate0.md", d: "Briefing das 7 dimensões assinado no Gate 0." },
    { f: "02-requisitos.md", d: "Requisitos verificáveis aprovados pela Banca Revisora." },
    { f: "03-arquitetura.md", d: "Decisões de arquitetura e modelagem de dados." },
  ];
  return (
    <div className="surface rounded-2xl p-5 fade-up">
      <h3 className="font-bold text-[15px] mb-4 flex items-center gap-2 text-[#E8EDF5]"><FileText size={16} className="text-teal-400" />Documentos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DOCS.map((doc) => (
          <div key={doc.f} className="surface-2 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="mono text-[13px] text-[#E8EDF5]">{doc.f}</span>
              <span className="flex items-center gap-1 text-[10px] text-lime-300"><CheckCircle2 size={11} />Banca Revisora</span>
            </div>
            <p className="text-[12px] text-[#8A94A6] mt-1.5">{doc.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
