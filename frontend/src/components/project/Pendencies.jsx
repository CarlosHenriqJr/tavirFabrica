import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, AlertTriangle, Loader2, Hash, Check } from "lucide-react";
import { toast } from "sonner";
import { resolvePendency } from "@/lib/api";
import { BADGE, agentAccent } from "@/lib/tavir";

function ResolveGateModal({ open, setOpen, project, pend, onResolved }) {
  const [loading, setLoading] = useState(false);
  const isBuild = pend?.unlocks === "build";
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  const submit = async () => {
    setLoading(true);
    try {
      const body = isBuild ? { supabase_url: url } : { note };
      const res = await resolvePendency(project.id, pend.id, body);
      onResolved(res);
      setOpen(false);
      toast.success(isBuild ? "SUPABASE_URL cadastrado · preview refeito com sucesso" : `Gate autorizado${res.signature ? " · assinado" : ""}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Falha ao resolver");
    } finally { setLoading(false); setUrl(""); setNote(""); }
  };

  if (!pend) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
      <DialogContent className="max-w-lg bg-[#0F1623] border-white/10 text-[#E8EDF5]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {isBuild ? <AlertTriangle size={17} className="text-rose-400" /> : <ShieldCheck size={17} className="text-amber-300" />}
            {isBuild ? "Resolver bloqueio técnico de build" : "Decisão executiva · Gate Humano"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg surface-2 p-3">
            <p className="text-[13px] font-semibold">{pend.title}</p>
            <p className="text-[12px] text-[#8A94A6] mt-1">{pend.text}</p>
            {pend.error_code && <p className="mono text-[11px] text-rose-400 mt-2">{pend.error_code}</p>}
          </div>

          {isBuild ? (
            <div>
              <label className="text-[11px] font-semibold tracking-wider text-[#5C6578] uppercase mono">SUPABASE_URL · conta vercel · tavir</label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co"
                data-testid="resolve-supabase-url" className="mt-1.5 bg-[#090D16] border-white/10 mono text-sm focus-visible:ring-lime-400/40" />
            </div>
          ) : (
            <>
              <div>
                <label className="text-[11px] font-semibold tracking-wider text-[#5C6578] uppercase">Nota da decisão (opcional)</label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Observação do CEO ao liberar o gate"
                  className="mt-1.5 bg-[#090D16] border-white/10 text-sm focus-visible:ring-lime-400/40" />
              </div>
              <div className="flex items-center gap-2 text-[11px] mono text-[#5C6578]">
                <Hash size={11} className="text-teal-400/60" /> A aprovação será registrada com assinatura SHA-256
              </div>
            </>
          )}

          <button onClick={submit} disabled={loading || (isBuild && !url.trim())} data-testid="resolve-submit"
            className="btn-lime w-full h-10 rounded-lg flex items-center justify-center gap-2 text-sm">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} strokeWidth={2.5} />}
            {isBuild ? "Refazer preview" : "Autorizar e assinar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PendencyCard({ pend, onResolve }) {
  const isErr = pend.type === "ERROR";
  return (
    <div className={`rounded-xl p-4 surface-2 ${isErr ? "glow-rose" : "glow-lime"}`} data-testid={`pendency-${pend.id}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border mono ${BADGE[pend.type]}`}>{pend.type}</span>
        <span className={`text-[12px] ${agentAccent(pend.agent)}`}>{pend.agent}</span>
      </div>
      <h4 className="font-bold text-[14px] text-[#E8EDF5]">{pend.title}</h4>
      <p className="text-[12.5px] text-[#8A94A6] mt-1.5 leading-relaxed">{pend.text}</p>
      {pend.diagnosis && (
        <p className="text-[11.5px] text-[#8A94A6] mt-2 mono bg-rose-500/[0.06] border border-rose-500/15 rounded-lg p-2 leading-relaxed">{pend.diagnosis}</p>
      )}
      <button onClick={() => onResolve(pend)} data-testid={`resolve-${pend.id}`}
        className="btn-lime h-9 px-4 rounded-lg text-[13px] mt-3">Autorizar / Resolver</button>
    </div>
  );
}

export default function Pendencies({ project, onResolved }) {
  const open = (project.pendencies || []).filter((p) => !p.resolved);
  const [modalOpen, setModalOpen] = useState(false);
  const [active, setActive] = useState(null);

  const handleResolve = (pend) => { setActive(pend); setModalOpen(true); };

  return (
    <div className={`surface rounded-2xl ${open.length ? "glow-teal" : ""}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <h3 className="font-bold text-[15px] text-[#E8EDF5]">Pendências</h3>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${open.length ? "bg-amber-500/15 text-amber-300" : "bg-white/5 text-[#5C6578]"}`}>{open.length}</span>
      </div>
      <div className="p-4 space-y-3">
        {open.length === 0 ? (
          <p className="text-[13px] text-[#5C6578] text-center py-6">Nenhuma pendência em aberto · esteira fluindo</p>
        ) : open.map((p) => <PendencyCard key={p.id} pend={p} onResolve={handleResolve} />)}
      </div>
      <ResolveGateModal open={modalOpen} setOpen={setModalOpen} project={project} pend={active} onResolved={onResolved} />
    </div>
  );
}
