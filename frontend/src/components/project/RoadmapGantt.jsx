import React, { useState } from "react";
import { CalendarRange, Diamond, Check, Loader2, Lock } from "lucide-react";
import { agentAccent } from "@/lib/tavir";

const PHASE_COLOR = [
  "from-teal-500/40 to-teal-400/10",
  "from-indigo-500/40 to-indigo-400/10",
  "from-lime-500/40 to-lime-400/10",
  "from-cyan-500/40 to-cyan-400/10",
];

export default function RoadmapGantt({ project }) {
  const steps = project.steps;
  const total = steps.length;
  const [hover, setHover] = useState(null);

  return (
    <div className="surface rounded-2xl p-5 fade-up">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-[15px] flex items-center gap-2 text-[#E8EDF5]"><CalendarRange size={16} className="text-teal-400" />Roadmap · Gantt da esteira ({total} etapas)</h3>
        <div className="flex items-center gap-3 text-[10.5px] text-[#8A94A6]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-teal-400/60" />concluído</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-lime-400/60" />em execução</span>
          <span className="flex items-center gap-1"><Diamond size={10} className="text-amber-300 fill-amber-300" />Gate Humano</span>
        </div>
      </div>

      {/* timeline ruler */}
      <div className="flex items-center gap-3 mb-2 pl-[200px]">
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
          {steps.map((s) => (
            <div key={s.idx} className="text-center mono text-[9px] text-[#5C6578] border-l border-white/[0.05]">{s.idx}</div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        {steps.map((s, i) => {
          const done = s.status === "done";
          const active = s.status === "active";
          const phase = PHASE_COLOR[Math.floor(i / Math.max(1, Math.ceil(total / 4))) % 4];
          const start = (i / total) * 100;
          const width = (1 / total) * 100;
          return (
            <div key={s.idx} className="flex items-center gap-3" onMouseEnter={() => setHover(s.idx)} onMouseLeave={() => setHover(null)} data-testid={`gantt-row-${s.idx}`}>
              <div className="w-[188px] shrink-0 flex items-center gap-2 overflow-hidden">
                <span className="shrink-0">
                  {done ? <Check size={12} className="text-teal-300" /> : active ? <Loader2 size={11} className="text-lime-300 animate-spin" /> : <Lock size={10} className="text-[#5C6578]" />}
                </span>
                <span className={`text-[11.5px] truncate ${done ? "text-[#E8EDF5]" : active ? "text-lime-200" : "text-[#8A94A6]"}`}>{s.title}</span>
              </div>
              <div className="flex-1 relative h-7 rounded-md surface-2 overflow-visible">
                <div
                  className={`absolute top-1/2 -translate-y-1/2 h-4 rounded bg-gradient-to-r ${phase} ${active ? "sweep" : ""} ${done ? "opacity-100" : active ? "opacity-90" : "opacity-30"}`}
                  style={{ left: `${start}%`, width: `calc(${width}% - 4px)`, marginLeft: "2px" }}
                />
                {s.isGate && (
                  <Diamond size={13} className="absolute top-1/2 -translate-y-1/2 text-amber-300 fill-amber-300" style={{ left: `calc(${start + width}% - 10px)`, filter: "drop-shadow(0 0 6px rgba(252,211,77,0.6))" }} />
                )}
                {hover === s.idx && (
                  <div className="absolute -top-9 left-2 z-10 px-2.5 py-1 rounded-md surface text-[10.5px] whitespace-nowrap shadow-lg">
                    <span className={agentAccent(s.agent)}>{s.agent}</span>
                    {s.isGate && <span className="text-amber-300 ml-2">· Gate Humano</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
