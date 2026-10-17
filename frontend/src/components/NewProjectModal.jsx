import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Rocket, Loader2, UploadCloud, FileText, Palette, X, Check, Lightbulb, FileCheck2, Layers, Code2, Server, Database,
} from "lucide-react";
import { toast } from "sonner";
import { uploadFile, createProjectIntake } from "@/lib/api";

const TIPOS = [
  { id: "lp", label: "Landing Page", code: "LP-C" },
  { id: "sistema", label: "Sistema / SaaS", code: "SY-C" },
  { id: "oferta", label: "Oferta", code: "OF-C" },
];

const empty = {
  nome: "", empresa: "", front: "", back: "", db: "",
  tipo: "sistema", escopo: "ideacao", segmento: "", concorrentes: "",
};

export default function NewProjectModal({ open, setOpen }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [ctxFiles, setCtxFiles] = useState([]);
  const [design, setDesign] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const ctxInput = useRef(null);
  const dsInput = useRef(null);

  React.useEffect(() => {
    if (open) { setForm(empty); setCtxFiles([]); setDesign(null); setSubmitting(false); }
  }, [open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onCtxPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const res = await uploadFile(file, "context");
        setCtxFiles((prev) => [...prev, res]);
      } catch (err) {
        toast.error(err?.response?.data?.detail || `Falha no upload de ${file.name}`);
      }
    }
    setUploading(false);
  };

  const onDesignPick = async (e) => {
    const file = (e.target.files || [])[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file, "design");
      setDesign(res);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Falha no upload do Design System");
    }
    setUploading(false);
  };

  const valid = form.nome.trim() && form.empresa.trim();

  const submit = async () => {
    if (!valid) { toast.error("Preencha Nome do projeto e Empresa."); return; }
    setSubmitting(true);
    try {
      const res = await createProjectIntake({
        ...form,
        contextFiles: ctxFiles,
        designSystem: design,
      });
      toast.success(
        form.escopo === "ideacao"
          ? `${res.name} criado · Dora iniciando ideação e pesquisa de mercado`
          : `${res.name} criado · Escopo pronto · ${res.scaffold}`
      );
      setOpen(false);
      navigate(`/projeto/${res.id}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Falha ao criar projeto");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && setOpen(v)}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-[#0F1623] border-white/10 text-[#E8EDF5] max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/[0.07] shrink-0">
          <DialogTitle className="flex items-center gap-2.5 text-lg tracking-tight">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#A3E635,#14B8A6)" }}>
              <Rocket size={16} className="text-[#090D16]" />
            </span>
            Novo Projeto
          </DialogTitle>
          <DialogDescription className="text-sm text-[#8A94A6]">
            Contexto, stack opcional, anexos e definição da esteira de execução.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
          {/* Básicas */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold tracking-[0.14em] text-[#5C6578] uppercase">Informações básicas</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-[#8A94A6]">Nome do projeto *</label>
                <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Portal de Clientes"
                  data-testid="np-nome" className="mt-1.5 bg-[#090D16] border-white/10 focus-visible:ring-lime-400/40" />
              </div>
              <div>
                <label className="text-[12px] text-[#8A94A6]">Empresa *</label>
                <Input value={form.empresa} onChange={(e) => set("empresa", e.target.value)} placeholder="Ex.: Atlas Holdings"
                  data-testid="np-empresa" className="mt-1.5 bg-[#090D16] border-white/10 focus-visible:ring-lime-400/40" />
              </div>
            </div>
            <div>
              <label className="text-[12px] text-[#8A94A6]">Tipo de projeto</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {TIPOS.map((t) => (
                  <button key={t.id} onClick={() => set("tipo", t.id)} data-testid={`np-tipo-${t.id}`}
                    className={`px-3 py-2 rounded-lg surface-2 text-[13px] transition-all ${form.tipo === t.id ? "glow-lime text-[#E8EDF5]" : "text-[#8A94A6] hover:border-white/15"}`}>
                    {t.label}
                    <span className="block text-[9px] mono text-[#5C6578] mt-0.5">{t.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Stack */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold tracking-[0.14em] text-[#5C6578] uppercase flex items-center gap-2">
              <Layers size={13} /> Stack <span className="normal-case tracking-normal text-[#5C6578]">(opcional)</span>
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[12px] text-[#8A94A6] flex items-center gap-1.5"><Code2 size={12} className="text-teal-400" />Front-end</label>
                <Input value={form.front} onChange={(e) => set("front", e.target.value)} placeholder="React + Vite"
                  data-testid="np-front" className="mt-1.5 bg-[#090D16] border-white/10 mono text-[13px] focus-visible:ring-lime-400/40" />
              </div>
              <div>
                <label className="text-[12px] text-[#8A94A6] flex items-center gap-1.5"><Server size={12} className="text-indigo-400" />Back-end</label>
                <Input value={form.back} onChange={(e) => set("back", e.target.value)} placeholder="FastAPI"
                  data-testid="np-back" className="mt-1.5 bg-[#090D16] border-white/10 mono text-[13px] focus-visible:ring-lime-400/40" />
              </div>
              <div>
                <label className="text-[12px] text-[#8A94A6] flex items-center gap-1.5"><Database size={12} className="text-lime-400" />Banco de Dados</label>
                <Input value={form.db} onChange={(e) => set("db", e.target.value)} placeholder="MongoDB"
                  data-testid="np-db" className="mt-1.5 bg-[#090D16] border-white/10 mono text-[13px] focus-visible:ring-lime-400/40" />
              </div>
            </div>
          </section>

          {/* Anexos */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold tracking-[0.14em] text-[#5C6578] uppercase">Anexos de contexto & Design System</h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Context */}
              <div>
                <input ref={ctxInput} type="file" multiple accept=".md,.txt,.html" className="hidden" onChange={onCtxPick} data-testid="np-context-input" />
                <button onClick={() => ctxInput.current?.click()} data-testid="np-context-btn"
                  className="w-full border border-dashed border-white/15 rounded-xl px-4 py-5 flex flex-col items-center gap-1.5 hover:border-lime-400/40 hover:bg-white/[0.02] transition-all">
                  <UploadCloud size={20} className="text-teal-400" />
                  <span className="text-[12.5px] text-[#E8EDF5] font-medium">Documentos de contexto</span>
                  <span className="text-[10.5px] text-[#5C6578] mono">.md · .txt · .html · múltiplos</span>
                </button>
                <div className="mt-2 space-y-1.5">
                  {ctxFiles.map((f) => (
                    <div key={f.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg surface-2 text-[12px]" data-testid={`np-ctx-${f.id}`}>
                      <FileText size={13} className="text-teal-400 shrink-0" />
                      <span className="truncate flex-1 text-[#E8EDF5]">{f.name}</span>
                      <button onClick={() => setCtxFiles((p) => p.filter((x) => x.id !== f.id))} className="text-[#5C6578] hover:text-rose-400"><X size={13} /></button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Design system */}
              <div>
                <input ref={dsInput} type="file" accept=".zip" className="hidden" onChange={onDesignPick} data-testid="np-design-input" />
                <button onClick={() => dsInput.current?.click()} data-testid="np-design-btn"
                  className="w-full border border-dashed border-white/15 rounded-xl px-4 py-5 flex flex-col items-center gap-1.5 hover:border-lime-400/40 hover:bg-white/[0.02] transition-all">
                  <Palette size={20} className="text-indigo-400" />
                  <span className="text-[12.5px] text-[#E8EDF5] font-medium">Design System</span>
                  <span className="text-[10.5px] text-[#5C6578] mono">.zip (imagens, tokens, html, json…)</span>
                </button>
                {design && (
                  <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg surface-2 text-[12px]" data-testid="np-design-file">
                    <Palette size={13} className="text-indigo-400 shrink-0" />
                    <span className="truncate flex-1 text-[#E8EDF5]">{design.name}</span>
                    <button onClick={() => setDesign(null)} className="text-[#5C6578] hover:text-rose-400"><X size={13} /></button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Escopo */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold tracking-[0.14em] text-[#5C6578] uppercase">Esteira de execução *</h4>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => set("escopo", "ideacao")} data-testid="np-escopo-ideacao"
                className={`text-left p-4 rounded-xl surface-2 transition-all ${form.escopo === "ideacao" ? "glow-lime" : "hover:border-white/15"}`}>
                <div className="flex items-center justify-between">
                  <Lightbulb size={18} className="text-lime-400" />
                  {form.escopo === "ideacao" && <Check size={15} className="text-lime-400" />}
                </div>
                <p className="text-[13.5px] font-semibold mt-2 text-[#E8EDF5]">Projeto do zero</p>
                <p className="text-[11.5px] text-[#8A94A6] mt-1 leading-relaxed">Aciona a esteira de ideação, levantamento e pesquisa de mercado com a agente <span className="text-lime-300">Dora</span>.</p>
              </button>
              <button onClick={() => set("escopo", "pronto")} data-testid="np-escopo-pronto"
                className={`text-left p-4 rounded-xl surface-2 transition-all ${form.escopo === "pronto" ? "glow-teal" : "hover:border-white/15"}`}>
                <div className="flex items-center justify-between">
                  <FileCheck2 size={18} className="text-teal-400" />
                  {form.escopo === "pronto" && <Check size={15} className="text-teal-400" />}
                </div>
                <p className="text-[13.5px] font-semibold mt-2 text-[#E8EDF5]">Escopo pronto</p>
                <p className="text-[11.5px] text-[#8A94A6] mt-1 leading-relaxed">Aciona a esteira de desenvolvimento direta baseada nos arquivos e briefing anexados.</p>
              </button>
            </div>

            {form.escopo === "ideacao" && (
              <div className="grid grid-cols-2 gap-3 fade-up">
                <div>
                  <label className="text-[12px] text-[#8A94A6]">Segmento / Mercado</label>
                  <Input value={form.segmento} onChange={(e) => set("segmento", e.target.value)} placeholder="Ex.: Fintech B2B"
                    data-testid="np-segmento" className="mt-1.5 bg-[#090D16] border-white/10 focus-visible:ring-lime-400/40" />
                </div>
                <div>
                  <label className="text-[12px] text-[#8A94A6]">Concorrentes de referência</label>
                  <Input value={form.concorrentes} onChange={(e) => set("concorrentes", e.target.value)} placeholder="Ex.: Nubank, Stripe"
                    data-testid="np-concorrentes" className="mt-1.5 bg-[#090D16] border-white/10 focus-visible:ring-lime-400/40" />
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.07] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#5C6578]">
            {uploading ? <span className="flex items-center gap-1.5 text-teal-300"><Loader2 size={12} className="animate-spin" /> enviando anexos...</span>
              : `${ctxFiles.length} documento(s)${design ? " · design system" : ""}`}
          </span>
          <button onClick={submit} disabled={!valid || submitting || uploading} data-testid="np-submit"
            className="btn-lime h-10 px-5 rounded-lg flex items-center gap-2 text-sm">
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
            Criar projeto
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
