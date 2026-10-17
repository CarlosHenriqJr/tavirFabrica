// TAVIR domain helpers: colors, badges, agent accents

export const BADGE = {
  CRIACAO: "bg-teal-500/10 text-teal-300 border-teal-500/20",
  MANUTENCAO: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  AUTH: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  ERROR: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export const CODE_BADGE = {
  "LP-C": "bg-teal-500/10 text-teal-300 border-teal-500/20",
  "SY-C": "bg-teal-500/10 text-teal-300 border-teal-500/20",
  "OF-C": "bg-teal-500/10 text-teal-300 border-teal-500/20",
  "LP-M": "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  "SY-M": "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  "OF-M": "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
};

export const TYPE_LABEL = { CRIACAO: "CRIAÇÃO", MANUTENCAO: "MANUTENÇÃO" };

export const STATUS = {
  andamento: { label: "Em andamento", dot: "bg-teal-400", text: "text-teal-300" },
  pausado: { label: "Pausado", dot: "bg-amber-400", text: "text-amber-300" },
  concluido: { label: "Concluído", dot: "bg-lime-400", text: "text-lime-300" },
};

// Deterministic accent per agent (for activity log / avatars)
const ACCENTS = [
  "text-teal-300", "text-lime-300", "text-indigo-300", "text-amber-300",
  "text-cyan-300", "text-emerald-300", "text-sky-300", "text-violet-300",
  "text-rose-300", "text-fuchsia-300",
];
export function agentAccent(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}
export function initials(name = "") {
  const parts = name.replace(/·.*/, "").trim().split(/\s|\+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

export const STACK_OPTIONS = [
  "Flutter 3.38 + Dart",
  "React + Vite + TypeScript",
  "Python 3.12 + FastAPI",
];
export const DB_OPTIONS = ["Supabase PostgreSQL", "SQLite WAL", "MongoDB", "Firebase"];
