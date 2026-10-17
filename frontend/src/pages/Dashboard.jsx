import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShell } from "@/components/shell/AppShell";
import { getEsteiras, getProjects } from "@/lib/api";
import { TYPE_LABEL, BADGE, CODE_BADGE, STATUS } from "@/lib/tavir";
import { Layers, ShieldCheck, AlertCircle, Plus } from "lucide-react";

function EsteiraCard({ e, onClick, delay }) {
  return (
    <button
      onClick={onClick}
      data-testid={`esteira-card-${e.id}`}
      className="text-left surface rounded-2xl p-5 transition-all duration-200 hover:border-white/15 hover:-translate-y-0.5 fade-up group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border mono tracking-wide ${BADGE[e.type]}`}>{TYPE_LABEL[e.type]}</span>
        <span className="text-[11px] mono text-[#5C6578]">{e.projects} {e.projects === 1 ? "projeto" : "projetos"}</span>
      </div>
      <h3 className="font-bold text-[15px] text-[#E8EDF5] tracking-tight group-hover:text-lime-300 transition-colors">{e.title}</h3>
      <p className="text-[12.5px] text-[#8A94A6] mt-2 leading-relaxed line-clamp-4">{e.description}</p>
      {e.badge && (
        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-lime-400/5 border border-lime-400/15">
          <ShieldCheck size={11} className="text-lime-400" />
          <span className="text-[10px] mono text-lime-300/80">{e.badge}</span>
        </div>
      )}
      <div className="mt-4 pt-3 border-t border-white/[0.06]">
        <span className="text-[11px] mono text-[#5C6578]">{e.steps} etapas no pipeline · {e.mesas} mesas</span>
      </div>
    </button>
  );
}

function ProjectCard({ p, onClick, delay }) {
  const st = STATUS[p.status] || STATUS.andamento;
  const hasPend = p.pendencies > 0;
  return (
    <button
      onClick={onClick}
      data-testid={`project-card-${p.id}`}
      className={`text-left surface rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 fade-up ${hasPend ? "glow-teal" : "hover:border-white/15"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border mono ${CODE_BADGE[p.code]}`}>{p.code}</span>
        <span className={`flex items-center gap-1.5 text-[11px] ${st.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${p.status !== "concluido" ? "animate-pulse" : ""}`} />
          {st.label}
        </span>
      </div>
      <h3 className="font-bold text-[15px] text-[#E8EDF5] tracking-tight">{p.name}</h3>
      <p className="text-[12px] text-[#8A94A6] mt-0.5">{p.client}</p>
      {p.stack && p.code.startsWith("SY") && (
        <span className="inline-block mt-2 text-[10px] mono text-indigo-300/70 px-2 py-0.5 rounded bg-indigo-500/5 border border-indigo-500/15">{p.stack}</span>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] mono text-[#8A94A6]">etapa {p.currentStep} de {p.totalSteps}</span>
          <span className="text-[11px] mono text-[#E8EDF5] font-semibold">{p.progress}%</span>
        </div>
        <div className="prog-track h-1.5"><div className="prog-fill" style={{ width: `${p.progress}%` }} /></div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.06] min-h-[18px] flex items-center justify-between">
        {p.completionGuard ? (
          <span className="flex items-center gap-1.5 text-[11px] text-lime-300"><ShieldCheck size={12} />Completion Guard {p.completionGuard} PASS</span>
        ) : <span />}
        {hasPend && (
          <span className="flex items-center gap-1.5 text-[11px] text-amber-300 ml-auto"><AlertCircle size={12} />{p.pendencies} {p.pendencies === 1 ? "pendência" : "pendências"}</span>
        )}
      </div>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const shell = useShell();
  const [esteiras, setEsteiras] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    shell?.setProjectName(null);
    getEsteiras().then(setEsteiras).catch(() => {});
    getProjects().then(setProjects).catch(() => {});
  }, []); // eslint-disable-line

  const counts = {
    all: esteiras.length,
    CRIACAO: esteiras.filter((e) => e.type === "CRIACAO").length,
    MANUTENCAO: esteiras.filter((e) => e.type === "MANUTENCAO").length,
  };
  const shown = esteiras.filter((e) => filter === "all" || e.type === filter);

  const FILTERS = [
    { id: "all", label: `Todas (${counts.all})` },
    { id: "CRIACAO", label: `Criação (${counts.CRIACAO})` },
    { id: "MANUTENCAO", label: `Manutenção (${counts.MANUTENCAO})` },
  ];

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1500px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#5C6578] mono">MÓDULOS · TAVIR FÁBRICA</p>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-[#E8EDF5]">Esteiras de desenvolvimento</h2>
          <p className="text-[#8A94A6] mt-1.5">Esteiras com gates humanos obrigatórios, mesas especializadas e controle de entrega.</p>
        </div>
        <button
          onClick={() => shell?.openNewProject()}
          data-testid="new-project-button"
          className="btn-lime h-11 px-5 rounded-xl flex items-center gap-2 text-[15px] shrink-0"
        >
          <Plus size={18} strokeWidth={2.5} />
          Novo Projeto
        </button>
      </div>

      <div className="flex items-center gap-2 mt-7">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            data-testid={`filter-${f.id}`}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all border
              ${filter === f.id ? "bg-white/[0.07] border-white/15 text-[#E8EDF5]" : "border-transparent text-[#8A94A6] hover:text-[#E8EDF5] hover:bg-white/[0.04]"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
        {shown.map((e, i) => (
          <EsteiraCard key={e.id} e={e} delay={i * 45} onClick={() => setFilter(e.type)} />
        ))}
      </div>

      <h2 className="text-xl font-bold tracking-tight mt-12 flex items-center gap-2 text-[#E8EDF5]">
        <Layers size={18} className="text-teal-400" /> Projetos em andamento na Fábrica
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-5 pb-10">
        {projects.map((p, i) => (
          <ProjectCard key={p.id} p={p} delay={i * 45} onClick={() => navigate(`/projeto/${p.id}`)} />
        ))}
      </div>
    </div>
  );
}
