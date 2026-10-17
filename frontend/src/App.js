import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AppShell from "@/components/shell/AppShell";
import Dashboard from "@/pages/Dashboard";
import ProjectView from "@/pages/ProjectView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projeto/:id" element={<ProjectView />} />
        </Route>
      </Routes>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#0F1623",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#E8EDF5",
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
