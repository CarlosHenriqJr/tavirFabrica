import React from "react";
import { agentAccent } from "@/lib/tavir";

export default function ActivityLog({ activity = [] }) {
  return (
    <div className="surface rounded-2xl">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="font-bold text-[15px] text-[#E8EDF5]">Atividade recente</h3>
      </div>
      <div className="p-4 max-h-[340px] overflow-y-auto">
        <div className="mono text-[11.5px] space-y-2">
          {activity.map((a, i) => (
            <div key={i} className="flex gap-3 fade-up" style={{ animationDelay: `${i * 25}ms` }} data-testid={`activity-${i}`}>
              <span className="text-[#5C6578] shrink-0 w-[72px]">{a.date}</span>
              <span className={`shrink-0 w-[120px] truncate ${agentAccent(a.agent)}`}>{a.agent}</span>
              <span className="text-[#8A94A6] flex-1">{a.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
