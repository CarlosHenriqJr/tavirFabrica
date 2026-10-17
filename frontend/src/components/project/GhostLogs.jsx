import React, { useRef, useEffect } from "react";
import { Terminal, ChevronDown, Loader2, Circle } from "lucide-react";

const COLORS = {
  cmd: "text-lime-300",
  info: "text-[#8A94A6]",
  think: "text-sky-300",
  ok: "text-teal-300",
  warn: "text-amber-300",
};

export default function GhostLogs({ logs, open, setOpen, running }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  return (
    <div className="fixed bottom-4 right-6 z-40 w-[min(540px,calc(100vw-360px))]" data-testid="ghost-logs">
      <div className="surface rounded-xl overflow-hidden shadow-2xl">
        <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]" data-testid="ghost-logs-toggle">
          <Terminal size={14} className="text-lime-400" />
          <span className="mono text-[12px] text-[#E8EDF5] font-semibold">GhostCLI · Logs ao vivo</span>
          {running ? <Loader2 size={12} className="animate-spin text-lime-400" /> : <Circle size={7} className="fill-[#5C6578] text-[#5C6578]" />}
          <span className="ml-auto mono text-[10px] text-[#5C6578]">{logs.length} linhas</span>
          <ChevronDown size={14} className={`text-[#5C6578] transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
        {open && (
          <div className="max-h-[240px] overflow-y-auto p-3 bg-[#070A11]">
            {logs.length === 0 ? (
              <p className="mono text-[11.5px] text-[#5C6578]">aguardando execução · clique em "Iniciar Execução Autônoma" ou "Simular conclusão da etapa"</p>
            ) : (
              <div className="mono text-[11.5px] space-y-0.5 leading-relaxed">
                {logs.map((l, i) => <div key={i} className={`fade-up ${COLORS[l.t] || "text-[#8A94A6]"}`}>{l.v}</div>)}
                <div ref={endRef} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
