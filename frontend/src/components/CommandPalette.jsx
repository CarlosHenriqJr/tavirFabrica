import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { Plus, Box, Brain, Layers, Activity } from "lucide-react";
import { getProjects } from "@/lib/api";

export default function CommandPalette({ open, setOpen, onNewProject }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (open) getProjects().then(setProjects).catch(() => {});
  }, [open]);

  const go = (fn) => { setOpen(false); fn(); };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar em Tasks, Cérebro, Dados, Projetos..." data-testid="command-input" />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Ações">
          <CommandItem onSelect={() => go(onNewProject)} data-testid="palette-new-project">
            <Plus className="mr-2 h-4 w-4 text-lime-400" />
            Novo Projeto
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate("/"))}>
            <Layers className="mr-2 h-4 w-4 text-teal-400" />
            Ir para Tavir Fábrica
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Projetos na Fábrica">
          {projects.map((p) => (
            <CommandItem key={p.id} onSelect={() => go(() => navigate(`/projeto/${p.id}`))} data-testid={`palette-proj-${p.id}`}>
              <Box className="mr-2 h-4 w-4 text-indigo-400" />
              <span>{p.name}</span>
              <span className="ml-auto text-[10px] mono text-[#5C6578]">{p.code}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Sistema">
          <CommandItem><Brain className="mr-2 h-4 w-4 text-violet-400" />Sincron Brain MCP</CommandItem>
          <CommandItem><Activity className="mr-2 h-4 w-4 text-cyan-400" />Telemetria / Runs</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
