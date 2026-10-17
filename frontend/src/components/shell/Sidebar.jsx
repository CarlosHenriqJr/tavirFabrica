import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const MODULES = [
  { id: "studio", label: "Tavir Studio", to: null },
  { id: "fabrica", label: "Tavir Fábrica", to: "/", active: true },
  { id: "flow", label: "Tavir Flow", to: null },
  { id: "edicao", label: "Tavir Edição", to: null },
];

const STATUS = [
  { label: "office.py · SQLite (WAL ativo)", color: "bg-teal-400" },
  { label: "Sincron Brain MCP", color: "bg-lime-400" },
  { label: "GhostCLI · claude-sonnet-5 / opus-5-5", color: "bg-indigo-400" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const onFabrica = location.pathname === "/" || location.pathname.startsWith("/projeto");

  return (
    <aside className="w-[230px] shrink-0 h-full flex flex-col surface border-r" style={{ borderRadius: 0 }} data-testid="module-sidebar">
      <div className="px-5 pt-5 pb-6">
        <h1 className="font-extrabold text-xl tracking-tight text-[#E8EDF5]">TAVIR</h1>
        <p className="text-[11px] text-[#5C6578] mt-0.5 mono">Escritório Virtual · localhost</p>
      </div>

      <div className="px-3 flex-1 overflow-y-auto">
        <p className="px-2 text-[10px] font-semibold tracking-[0.18em] text-[#5C6578] mb-2">MÓDULOS</p>
        <nav className="flex flex-col gap-0.5">
          {MODULES.map((m) => {
            const active = m.active && onFabrica;
            return (
              <button
                key={m.id}
                onClick={() => m.to && navigate(m.to)}
                data-testid={`module-${m.id}`}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 relative
                  ${active
                    ? "text-[#E8EDF5] font-semibold"
                    : "text-[#8A94A6] hover:text-[#E8EDF5] hover:bg-white/[0.04]"}`}
                style={active ? { background: "rgba(163,230,53,0.06)", boxShadow: "inset 0 0 0 1px rgba(163,230,53,0.28)" } : {}}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-lime-400" />}
                {m.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-4 py-4 border-t border-white/[0.06] space-y-2">
        {STATUS.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${s.color} animate-pulse shrink-0`} />
            <span className="text-[10.5px] text-[#8A94A6] mono leading-tight">{s.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
