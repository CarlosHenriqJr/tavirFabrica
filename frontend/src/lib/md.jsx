import React from "react";

function inline(t, kBase) {
  const parts = [];
  let rest = t;
  let i = kBase * 1000;
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/;
  let m;
  while ((m = rest.match(re))) {
    const idx = m.index;
    if (idx > 0) parts.push(rest.slice(0, idx));
    if (m[2] !== undefined) parts.push(<strong key={i++} className="text-[#E8EDF5] font-semibold">{m[2]}</strong>);
    else parts.push(<code key={i++} className="mono text-[12px] px-1 py-0.5 rounded bg-white/5 text-teal-300">{m[3]}</code>);
    rest = rest.slice(idx + m[0].length);
  }
  parts.push(rest);
  return parts;
}

export function Markdown({ source }) {
  const lines = (source || "").split("\n");
  const out = [];
  let list = null;
  let key = 0;
  const flush = () => {
    if (list) {
      out.push(<ul key={key++} className="list-disc pl-5 space-y-1 my-2 text-[#8A94A6] text-[13px]">{list}</ul>);
      list = null;
    }
  };
  lines.forEach((ln) => {
    if (ln.startsWith("### ")) { flush(); out.push(<h4 key={key} className="text-[13px] font-bold text-[#E8EDF5] mt-4 mb-1">{inline(ln.slice(4), key++)}</h4>); }
    else if (ln.startsWith("## ")) { flush(); out.push(<h3 key={key} className="text-[15px] font-bold text-[#E8EDF5] mt-5 mb-1.5">{inline(ln.slice(3), key++)}</h3>); }
    else if (ln.startsWith("# ")) { flush(); out.push(<h2 key={key} className="text-lg font-extrabold text-[#E8EDF5] mt-1 mb-2 tracking-tight">{inline(ln.slice(2), key++)}</h2>); }
    else if (ln.startsWith("> ")) { flush(); out.push(<div key={key} className="flex items-start gap-2 my-3 px-3 py-2.5 rounded-lg bg-lime-400/5 border border-lime-400/20 text-[12.5px] text-lime-200/90">{inline(ln.slice(2), key++)}</div>); }
    else if (ln.startsWith("- ")) { if (!list) list = []; list.push(<li key={key}>{inline(ln.slice(2), key++)}</li>); }
    else if (ln.trim() === "---") { flush(); out.push(<hr key={key++} className="border-white/10 my-3" />); }
    else if (ln.trim() === "") { flush(); }
    else { flush(); out.push(<p key={key} className="text-[13px] text-[#8A94A6] leading-relaxed my-1.5">{inline(ln, key++)}</p>); }
  });
  flush();
  return <div>{out}</div>;
}
