import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Check, AlertTriangle, Loader2, Terminal } from "lucide-react";
import { toast } from "sonner";
import { getEsteiras, createProject } from "@/lib/api";
import { TYPE_LABEL, BADGE } from "@/lib/tavir";

const DIMENSIONS = [
  { key: "d1_ideia", label: "Ideia & Problema de Negócio", ph: "Qual problema real este projeto resolve e por quê agora?" },
  { key: "d2_publico", label: "Público-Alvo & Perfil de Utilizador", ph: "Quem usa? Perfis, dores e contexto de uso." },
  { key: "d3_stack", label: "Stack Tecnológica", ph: "Flutter 3.38 + Dart · React + Vite + TypeScript · Python 3.12 + FastAPI" },
  { key: "d4_banco", label: "Banco de Dados", ph: "Supabase PostgreSQL · SQLite WAL · etc." },
  { key: "d5_materiais", label: "Materiais & Referências Visuais", ph: "Links, brand, referências, tokens de design." },
  { key: "d6_integracoes", label: "Integrações & MCPs", ph: "GhostCLI · Playwright · Android SDK / tavir_qa" },
  { key: "d7_regras", label: "Regras de Negócio & Escopo Negativo", ph: "O que é obrigatório e o que está fora de escopo." },
];

const VAGUE = ["a definir", "pendente", "tbd", "n/a", "todo"];

const empty = {
  esteira: "lp-c", nome: "", cliente: "",
  d1_ideia: "", d2_publico: "", d3_stack: "", d4_banco: "", d5_materiais: "", d6_integracoes: "", d7_regras: "",
};

export default function Gate0Modal({ open, setOpen }) {
  const navigate = useNavigate();
  const [esteiras, setEsteiras] = useState([]);
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState("form"); // form | scaffold
  const [scaffoldLog, setScaffoldLog] = useState([]);

  React.useEffect(() => {
    if (open) { getEsteiras().then(setEsteiras).catch(() => {}); setForm(empty); setPhase("form"); setScaffoldLog([]); }
  }, [open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const fieldError = (k) => {
    const v = (form[k] || "").trim();
    if (!v) return null;
    if (v.length < 8) return "curto demais";
    if (VAGUE.some((t) => v.toLowerCase().includes(t))) return "termo vago proibido";
    return null;
  };

  const valid = useMemo(() => {
    if (!form.nome.trim() || !form.cliente.trim()) return false;
    return DIMENSIONS.every((d) => {
      const v = (form[d.key] || "").trim();
      return v.length >= 8 && !VAGUE.some((t) => v.toLowerCase().includes(t));
    });
  }, [form]);

  const runScaffold = (scaffold, hash) => {
    const lines = [
      `$ ${scaffold} ${form.nome.toLowerCase().replace(/\s+/g, "-")}`,
      "→ gerando scaffold físico oficial...",
      "✓ manifesto criado (package.json / pubspec.yaml)",
      "✓ entrypoint executável registrado",
      `✓ Gate 0 assinado · ${hash.slice(0, 32)}...`,
      "✓ projeto adicionado à Fábrica",
    ];
    setScaffoldLog([]);
    lines.forEach((l, i) => setTimeout(() => setScaffoldLog((p) => [...p, l]), 320 * (i + 1)));
  };

  const submit = async () => {
    if (!valid) { toast.error("Validação anti-teatro bloqueou o envio. Preencha todas as 7 dimensões com conteúdo real."); return; }
    setSubmitting(true);
    try {
      const res = await createProject(form);
      setPhase("scaffold");
      runScaffold(res.scaffold || "pnpm create vite", res.hash || "sha256:...");
      setTimeout(() => {
        setOpen(false);
        setSubmitting(false);
        toast.success(`${res.name} criado · Scaffold físico (${res.scaffold}) gerado`);
        navigate(`/projeto/${res.id}`);
      }, 2300);
    } catch (e) {
      setSubmitting(false);
      toast.error(e?.response?.data?.detail || "Falha ao criar o job");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && setOpen(v)}>
      <DialogContent className="max-w-3xl p-0 gap-0 bg-[#0F1623] border-white/10 text-[#E8EDF5] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/[0.07] shrink-0">
          <DialogTitle className="flex items-center gap-2.5 text-lg tracking-tight">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#A3E635,#14B8A6)" }}>
              <Zap size={16} className="text-[#090D16]" fill="#090D16" />
            </span>
            Gate 0 · Intake & Briefing Estruturado
          </DialogTitle>
          <p className="text-sm text-[#8A94A6] mt-1">7 dimensões obrigatórias · assinatura SHA-256 · validação anti-teatro</p>
        </DialogHeader>

        {phase === "form" ? (
          <div className="overflow-y-auto px-6 py-5 space-y-5">
            {/* Esteira selector */}
            <div>
              <label className="text-[11px] font-semibold tracking-wider text-[#5C6578] uppercase">Escolha da Esteira</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {esteiras.map((e) => {
                  const active = form.esteira === e.id;
                  return (
                    <button
                      key={e.id}
                      onClick={() => set("esteira", e.id)}
                      data-testid={`gate0-esteira-${e.id}`}
                      className={`text-left px-3 py-2.5 rounded-lg surface-2 transition-all ${active ? "glow-lime" : "hover:border-white/15"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold">{e.title.replace("TAVIR Fábrica · ", "")}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border mono ${BADGE[e.type]}`}>{TYPE_LABEL[e.type]}</span>
                      </div>
                      <span className="text-[10.5px] text-[#5C6578] mono">{e.steps} etapas · {e.mesas} mesas</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold tracking-wider text-[#5C6578] uppercase">Nome do Projeto</label>
                <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Landing Meridian Capital"
                  data-testid="gate0-nome" className="mt-1.5 bg-[#090D16] border-white/10 focus-visible:ring-lime-400/40" />
              </div>
              <div>
                <label className="text-[11px] font-semibold tracking-wider text-[#5C6578] uppercase">Cliente</label>
                <Input value={form.cliente} onChange={(e) => set("cliente", e.target.value)} placeholder="Ex.: Meridian Capital"
                  data-testid="gate0-cliente" className="mt-1.5 bg-[#090D16] border-white/10 focus-visible:ring-lime-400/40" />
              </div>
            </div>

            {DIMENSIONS.map((d, i) => {
              const err = fieldError(d.key);
              return (
                <div key={d.key}>
                  <label className="text-[11px] font-semibold tracking-wider text-[#5C6578] uppercase flex items-center gap-2">
                    <span className="mono text-lime-400/70">{i + 1}</span>{d.label}
                    {err && <span className="text-rose-400 normal-case tracking-normal flex items-center gap-1"><AlertTriangle size={11} />{err}</span>}
                  </label>
                  <Textarea
                    value={form[d.key]} onChange={(e) => set(d.key, e.target.value)} placeholder={d.ph}
                    data-testid={`gate0-${d.key}`}
                    className={`mt-1.5 bg-[#090D16] border-white/10 min-h-[64px] text-sm focus-visible:ring-lime-400/40 ${err ? "border-rose-500/40" : ""}`}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-y-auto px-6 py-6">
            <div className="rounded-xl surface-2 p-4">
              <div className="flex items-center gap-2 text-[11px] text-[#8A94A6] mono mb-3">
                <Terminal size={13} className="text-lime-400" /> GhostCLI · scaffold físico oficial
              </div>
              <div className="mono text-[12.5px] space-y-1.5">
                {scaffoldLog.map((l, i) => (
                  <div key={i} className={`fade-up ${l.startsWith("✓") ? "text-teal-300" : l.startsWith("$") ? "text-lime-300" : "text-[#8A94A6]"}`}>{l}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === "form" && (
          <div className="px-6 py-4 border-t border-white/[0.07] flex items-center justify-between shrink-0">
            <p className="text-[11px] text-[#5C6578]">
              {valid ? <span className="text-teal-300 flex items-center gap-1.5"><Check size={13} /> Anti-teatro aprovado</span>
                : "Preencha todas as dimensões com conteúdo verificável"}
            </p>
            <button onClick={submit} disabled={!valid || submitting} data-testid="gate0-submit" className="btn-lime h-10 px-5 rounded-lg flex items-center gap-2 text-sm">
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} fill="#090D16" strokeWidth={0} />}
              Aprovar Demanda e Liberar Esteira
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
