"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

function Primitive({ value }: { value: unknown }) {
  if (value === null) return <span className="text-slate-400">null</span>;
  if (typeof value === "string")
    return <span className="text-brand-700 dark:text-brand-300">&quot;{value}&quot;</span>;
  if (typeof value === "number") return <span className="text-sky-600 dark:text-sky-300">{value}</span>;
  if (typeof value === "boolean") return <span className="text-amber-600 dark:text-amber-300">{String(value)}</span>;
  return <span>{String(value)}</span>;
}

function Node({ name, value, depth, last }: { name?: string; value: unknown; depth: number; last: boolean }) {
  const [open, setOpen] = useState(depth < 3);
  const isArr = Array.isArray(value);
  const isObj = value !== null && typeof value === "object";
  const comma = last ? "" : ",";
  const key =
    name !== undefined ? (
      <>
        <span className="text-violet-700 dark:text-violet-300">&quot;{name}&quot;</span>
        <span className="text-slate-400">: </span>
      </>
    ) : null;

  if (!isObj) {
    return (
      <div style={{ paddingLeft: depth ? 16 : 0 }}>
        {key}
        <Primitive value={value} />
        <span className="text-slate-400">{comma}</span>
      </div>
    );
  }

  const entries = isArr ? (value as unknown[]).map((v, i) => [String(i), v] as const) : Object.entries(value as object);
  const [o, c] = isArr ? ["[", "]"] : ["{", "}"];

  return (
    <div style={{ paddingLeft: depth ? 16 : 0 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="-ml-4 inline-flex w-4 items-center text-slate-400 hover:text-brand-600"
        aria-label={open ? "Collapse" : "Expand"}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {key}
      <span className="text-slate-500">{o}</span>
      {open ? (
        <>
          {entries.map(([k, v], i) => (
            <Node key={k} name={isArr ? undefined : k} value={v} depth={depth + 1} last={i === entries.length - 1} />
          ))}
          <span className="text-slate-500">{c}</span>
        </>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="text-slate-400 hover:text-brand-600">
          {" "}
          … {entries.length} {isArr ? "items" : "keys"} {c}
        </button>
      )}
      <span className="text-slate-400">{comma}</span>
    </div>
  );
}

export function JsonView({ data }: { data: unknown }) {
  return (
    <div className="pl-4 font-mono text-[13px] leading-relaxed">
      <Node value={data} depth={0} last />
    </div>
  );
}
