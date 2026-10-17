import React from "react";
import { Check, X, ShieldCheck, Terminal, MonitorSmartphone } from "lucide-react";

function LinterPill({ l }) {
  const ok = l.status === "pass";
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg surface-2 ${ok ? "" : "opacity-60"}`}>
      <Terminal size={13} className={ok ? "text-teal-400" : "text-[#5C6578]"} />
      <span className="mono text-[12px] text-[#E8EDF5] flex-1">{l.cmd}</span>
      <span className={`text-[10px] mono px-1.5 py-0.5 rounded border ${ok ? "bg-teal-500/10 text-teal-300 border-teal-500/20" : "bg-white/5 text-[#5C6578] border-white/10"}`}>
        {ok ? "PASS" : "idle"}
      </span>
    </div>
  );
}

export default function CompletionGuard({ guard }) {
  if (!guard) return null;
  const pct = Math.round((guard.passed / guard.total) * 100);
  return (
    <div className="space-y-4">
      <div className="surface rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[15px] flex items-center gap-2 text-[#E8EDF5]"><ShieldCheck size={16} className={guard.allPass ? "text-lime-400" : "text-teal-400"} />Completion Guard · 8 Validações Físicas</h3>
          <span className={`text-[13px] font-bold mono ${guard.allPass ? "text-lime-300" : "text-teal-300"}`}>{guard.passed}/{guard.total} {guard.allPass ? "PASS" : ""}</span>
        </div>
        <div className="prog-track h-1.5 mb-5"><div className="prog-fill" style={{ width: `${pct}%`, background: guard.allPass ? "linear-gradient(90deg,#A3E635,#bef264)" : undefined }} /></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {guard.rules.map((r) => (
            <div key={r.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg surface-2" data-testid={`guard-rule-${r.id}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${r.pass ? "bg-teal-500/15 text-teal-300" : "bg-rose-500/10 text-rose-400"}`}>
                {r.pass ? <Check size={12} /> : <X size={12} />}
              </span>
              <span className="mono text-[9px] text-[#5C6578]">{String(r.id).padStart(2, "0")}</span>
              <span className={`text-[12px] ${r.pass ? "text-[#E8EDF5]" : "text-[#8A94A6]"}`}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="surface rounded-2xl p-5">
        <h3 className="font-bold text-[14px] mb-3 text-[#E8EDF5]">Loop de Auto-Correção via Linter</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {guard.linters.map((l) => <LinterPill key={l.cmd} l={l} />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg surface-2">
            <Terminal size={13} className={guard.playwright === "pass" ? "text-lime-400" : "text-[#5C6578]"} />
            <span className="mono text-[12px] flex-1 text-[#E8EDF5]">Playwright E2E</span>
            <span className={`text-[10px] mono px-1.5 py-0.5 rounded border ${guard.playwright === "pass" ? "bg-lime-400/10 text-lime-300 border-lime-400/20" : "bg-white/5 text-[#5C6578] border-white/10"}`}>{guard.playwright === "pass" ? "PASS" : "idle"}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg surface-2">
            <MonitorSmartphone size={13} className={guard.emulator !== "idle" ? "text-teal-400" : "text-[#5C6578]"} />
            <span className="mono text-[12px] flex-1 text-[#E8EDF5]">Android Emulator</span>
            <span className={`text-[10px] mono px-1.5 py-0.5 rounded border ${guard.emulator !== "idle" ? "bg-teal-500/10 text-teal-300 border-teal-500/20" : "bg-white/5 text-[#5C6578] border-white/10"}`}>{guard.emulator !== "idle" ? guard.emulator : "idle"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
