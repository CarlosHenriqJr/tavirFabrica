import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import IconRail from "./IconRail";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import CommandPalette from "@/components/CommandPalette";
import Gate0Modal from "@/components/Gate0Modal";

const ShellContext = createContext(null);
export const useShell = () => useContext(ShellContext);

export default function AppShell() {
  const [projectName, setProjectName] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [gate0Open, setGate0Open] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ctx = {
    setProjectName: useCallback((n) => setProjectName(n), []),
    openGate0: () => setGate0Open(true),
  };

  return (
    <ShellContext.Provider value={ctx}>
      <div className="h-screen w-screen flex overflow-hidden grain bg-[#090D16]">
        <IconRail />
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            projectName={projectName}
            onOpenPalette={() => setPaletteOpen(true)}
            onOpenGate0={() => setGate0Open(true)}
          />
          <main className="flex-1 overflow-y-auto relative z-[2]">
            <Outlet />
          </main>
        </div>
      </div>

      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} onInitiateJob={() => setGate0Open(true)} />
      <Gate0Modal open={gate0Open} setOpen={setGate0Open} />
    </ShellContext.Provider>
  );
}
