import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Zap, MessageSquare, Layers, Activity, Brain, Map, Briefcase, GitBranch, Settings,
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

const ICONS = [
  { id: "exec", icon: Zap, label: "Execução Rápida" },
  { id: "chat", icon: MessageSquare, label: "Comunicação" },
  { id: "modules", icon: Layers, label: "Módulos", active: true, to: "/" },
  { id: "runs", icon: Activity, label: "Telemetria / Runs" },
  { id: "brain", icon: Brain, label: "Sincron Brain MCP" },
  { id: "arch", icon: Map, label: "Arquitetura / Squads" },
  { id: "comercial", icon: Briefcase, label: "Comercial / Contratos" },
  { id: "pipes", icon: GitBranch, label: "Pipelines YAML" },
];

export default function IconRail() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className="w-[56px] shrink-0 h-full flex flex-col items-center py-3 surface border-r"
      style={{ borderRadius: 0 }}
      data-testid="icon-rail"
    >
      {/* Monogram */}
      <button
        onClick={() => navigate("/")}
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-5 relative group"
        style={{ background: "linear-gradient(135deg, #A3E635, #14B8A6)" }}
        data-testid="rail-logo"
      >
        <span className="text-[#090D16] font-extrabold text-lg leading-none">V</span>
      </button>

      <TooltipProvider delayDuration={100}>
        <nav className="flex flex-col gap-1.5 flex-1">
          {ICONS.map(({ id, icon: Icon, label, active, to }) => {
            const isActive = active && location.pathname !== undefined;
            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => to && navigate(to)}
                    data-testid={`rail-${id}`}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative
                      ${isActive
                        ? "text-lime-300 bg-lime-400/10"
                        : "text-[#5C6578] hover:text-[#E8EDF5] hover:bg-white/5"}`}
                    style={isActive ? { boxShadow: "inset 0 0 0 1px rgba(163,230,53,0.4), 0 0 18px -6px rgba(163,230,53,0.5)" } : {}}
                  >
                    <Icon size={18} strokeWidth={2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#0F1623] border-white/10 text-[#E8EDF5]">
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-2.5 mt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5C6578] hover:text-[#E8EDF5] hover:bg-white/5 transition-all" data-testid="rail-settings">
                <Settings size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#0F1623] border-white/10 text-[#E8EDF5]">Tema & configurações</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-[#090D16]"
                style={{ background: "linear-gradient(135deg, #A3E635, #14B8A6)" }}
                data-testid="rail-avatar"
              >
                CH
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#0F1623] border-white/10 text-[#E8EDF5]">Carlos Henrique · CEO</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </aside>
  );
}
