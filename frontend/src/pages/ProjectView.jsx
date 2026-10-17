import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useShell } from "@/components/shell/AppShell";
import { getProject, completeStep } from "@/lib/api";
import { CODE_BADGE, STATUS } from "@/lib/tavir";
import { ArrowLeft, Zap, Pause, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import StepsList from "@/components/project/StepsList";
import Pendencies from "@/components/project/Pendencies";
import ActivityLog from "@/components/project/ActivityLog";
import CompletionGuard from "@/components/project/CompletionGuard";
import { FilesTab, AccessTab } from "@/components/project/Tabs";
import SecondaryTab from "@/components/project/SecondaryTab";
import ProjectChat from "@/components/project/ProjectChat";

const TABS = [
  { id: "overview", label: "Visão geral" },
  { id: "kanban", label: "Kanban" },
  { id: "roadmap", label: "Roadmap" },
  { id: "documentos", label: "Documentos" },
  { id: "arquivos", label: "Arquivos" },
  { id: "guard", label: "Completion Guard & QA" },
  { id: "acessos", label: "Acessos" },
];

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shell = useShell();
  const [project, setProject] = useState(null);
  const [tab, setTab] = useState("overview");
  const [simulating, setSimulating] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const autoRef = useRef(false);

  const load = useCallback(async () => {
    const p = await getProject(id);
    setProject(p);
    shell?.setProjectName(p.name);
    return p;
  }, [id]); // eslint-disable-line

  useEffect(() => { load().catch(() => toast.error("Projeto não encontrado")); }, [load]);
  useEffect(() => () => { autoRef.current = false; }, []);

  const doStep = async () => {
    const res = await completeStep(id);
    setProject(res.project);
    return res;
  };

  const simulate = async () => {
    setSimulating(true);
    try {
      const res = await doStep();
      if (res.blocked) {
        toast.warning(res.reason === "build" ? "Bloqueio técnico: cadastre SUPABASE_URL em Acessos." : "Gate Humano obrigatório · autorize na aba Pendências.");
      } else if (res.done) {
        toast.success("Esteira concluída · Completion Guard 8/8 PASS");
      }
    } catch (e) { toast.error("Falha ao simular etapa"); }
    finally { setSimulating(false); }
  };

  const runAutonomous = async () => {
    if (autoRef.current) { autoRef.current = false; setAutoRunning(false); return; }
    autoRef.current = true; setAutoRunning(true);
    while (autoRef.current) {
      let res;
      try { res = await doStep(); } catch { autoRef.current = false; break; }
      if (res.blocked) {
        toast.warning(res.reason === "build"
          ? "Execução pausada · bloqueio técnico (SUPABASE_URL). Resolva em Pendências/Acessos."
          : "Execução pausada · Gate Humano obrigatório. Autorize em Pendências.");
        break;
      }
      if (res.done) { toast.success("Execução autônoma concluída · Completion Guard 8/8 PASS"); break; }
      await new Promise((r) => setTimeout(r, 1100));
    }
    autoRef.current = false; setAutoRunning(false);
  };

  const onResolved = (p) => {
    setProject(p);
    if (p.signature) toast.success(`Gate assinado · ${p.signature.slice(0, 28)}...`);
  };

  if (!project) {
    return <div className="flex items-center justify-center h-full text-[#5C6578]"><Loader2 className="animate-spin mr-2" size={18} />Carregando projeto...</div>;
  }

  const st = STATUS[project.status] || STATUS.andamento;

  return (
    <div className="px-6 lg:px-8 py-6 max-w-[1500px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} data-testid="back-button"
            className="w-10 h-10 rounded-full surface flex items-center justify-center text-[#8A94A6] hover:text-[#E8EDF5] hover:border-white/20 transition-all shrink-0">
            <ArrowLeft size={17} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#E8EDF5]">{project.name}</h1>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border mono ${CODE_BADGE[project.code]}`}>{project.code}</span>
              <span className={`flex items-center gap-1.5 text-[12px] ${st.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${project.status !== "concluido" ? "animate-pulse" : ""}`} />{st.label}
              </span>
            </div>
            <p className="text-[13px] text-[#8A94A6] mt-0.5">{project.client} · etapa atual: {project.currentStep} de {project.totalSteps}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block w-[160px]">
            <div className="flex justify-between mb-1"><span className="text-[10px] mono text-[#5C6578]">progresso</span><span className="text-[12px] mono font-semibold text-[#E8EDF5]">{project.progress}%</span></div>
            <div className="prog-track h-1.5"><div className="prog-fill" style={{ width: `${project.progress}%` }} /></div>
          </div>
          <button onClick={runAutonomous} data-testid="autonomous-exec-button"
            className={`h-10 px-4 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all relative overflow-hidden ${autoRunning ? "bg-amber-500/15 text-amber-200 border border-amber-500/40" : "btn-lime"}`}>
            {autoRunning ? <><Pause size={15} /> Pausar Execução Autônoma<span className="sweep absolute inset-0" /></> : <><Zap size={15} fill="#090D16" strokeWidth={0} /> Iniciar Execução Autônoma</>}
          </button>
          <button onClick={() => setChatOpen(true)} data-testid="project-chat-button"
            className="h-10 px-3.5 rounded-lg surface flex items-center gap-2 text-sm text-[#E8EDF5] hover:border-white/20 transition-all">
            <MessageSquare size={15} className="text-violet-400" /> Chat do projeto
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mt-6 p-1 surface rounded-xl w-fit max-w-full overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all ${tab === t.id ? "bg-white/[0.08] text-[#E8EDF5]" : "text-[#8A94A6] hover:text-[#E8EDF5]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-5 pb-10">
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3"><StepsList project={project} onSimulate={simulate} simulating={simulating} /></div>
            <div className="lg:col-span-2 space-y-5">
              <Pendencies project={project} onResolved={onResolved} />
              <ActivityLog activity={project.activity} />
            </div>
          </div>
        )}
        {tab === "kanban" && <SecondaryTab type="kanban" project={project} />}
        {tab === "roadmap" && <SecondaryTab type="roadmap" project={project} />}
        {tab === "documentos" && <SecondaryTab type="documentos" project={project} />}
        {tab === "arquivos" && <FilesTab project={project} />}
        {tab === "guard" && <CompletionGuard guard={project.guard} />}
        {tab === "acessos" && <AccessTab project={project} />}
      </div>

      <ProjectChat open={chatOpen} setOpen={setChatOpen} project={project} />
    </div>
  );
}
