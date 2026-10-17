import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { agentAccent, initials } from "@/lib/tavir";
import { Brain } from "lucide-react";

export default function ProjectChat({ open, setOpen, project }) {
  const msgs = (project?.activity || []).slice().reverse().map((a) => ({
    agent: a.agent, text: a.message, date: a.date,
  }));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="bg-[#0F1623] border-white/10 text-[#E8EDF5] w-[420px] sm:max-w-[420px] p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-white/[0.07]">
          <SheetTitle className="flex items-center gap-2 text-[#E8EDF5] text-base">
            <Brain size={16} className="text-violet-400" /> Chat do projeto · raciocínio dos agentes
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {msgs.map((m, i) => (
            <div key={i} className="flex gap-3 fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold surface-2 ${agentAccent(m.agent)}`}>
                {initials(m.agent)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[12px] font-semibold ${agentAccent(m.agent)}`}>{m.agent}</span>
                  <span className="mono text-[10px] text-[#5C6578]">{m.date}</span>
                </div>
                <div className="mt-1 px-3 py-2 rounded-xl rounded-tl-sm surface-2 text-[12.5px] text-[#E8EDF5] leading-relaxed">{m.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-white/[0.07]">
          <div className="surface-2 rounded-lg px-3 py-2 text-[12px] text-[#5C6578] mono">GhostCLI · aguardando próxima etapa...</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
