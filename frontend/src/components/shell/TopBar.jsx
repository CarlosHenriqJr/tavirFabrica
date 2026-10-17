import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Plus, ChevronRight } from "lucide-react";

export default function TopBar({ projectName, onOpenPalette, onNewProject }) {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 surface border-b" style={{ borderRadius: 0 }} data-testid="top-bar">
      <div className="flex items-center gap-4 min-w-0">
        <nav className="flex items-center gap-1.5 text-sm min-w-0">
          <button onClick={() => navigate("/")} className="text-[#8A94A6] hover:text-[#E8EDF5] transition-colors">Módulos</button>
          <ChevronRight size={14} className="text-[#5C6578]" />
          <button onClick={() => navigate("/")} className="text-[#E8EDF5] font-semibold truncate">Tavir Fábrica</button>
          {projectName && (
            <>
              <ChevronRight size={14} className="text-[#5C6578]" />
              <span className="text-[#8A94A6] truncate">{projectName}</span>
            </>
          )}
        </nav>
        <span className="hidden md:inline-flex items-center gap-2 px-2.5 py-1 rounded-full surface-2 text-[11px] mono text-[#8A94A6]">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          office.py · SQLite ao vivo
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenPalette}
          data-testid="command-palette-trigger"
          className="hidden sm:flex items-center gap-2 h-9 pl-3 pr-2 rounded-lg surface-2 text-[#5C6578] hover:text-[#8A94A6] hover:border-white/15 transition-all w-[280px]"
        >
          <Search size={15} />
          <span className="text-sm flex-1 text-left truncate">Buscar em Tasks, Cérebro, Da...</span>
          <kbd className="text-[10px] mono px-1.5 py-0.5 rounded border border-white/10 bg-white/5">Ctrl K</kbd>
        </button>

        <button
          onClick={onNewProject}
          data-testid="new-project-button-top"
          className="btn-lime h-9 px-4 rounded-lg flex items-center gap-2 text-sm"
        >
          <Plus size={16} strokeWidth={2.5} />
          Novo Projeto
        </button>
      </div>
    </header>
  );
}
