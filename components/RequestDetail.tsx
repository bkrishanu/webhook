"use client";

import { ArrowLeft, Clock, FileText, Globe, HardDrive, ListTree, Terminal, Trash2, Monitor } from "lucide-react";
import { useMemo, useState } from "react";
import type { CapturedRequest } from "@/lib/types";
import { formatBytes, methodStyle, toCurl, tryParseJson } from "@/lib/client";
import { CopyButton } from "./CopyButton";
import { JsonView } from "./JsonView";

function Section({
  title,
  icon,
  count,
  actions,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-ink-800 dark:bg-ink-900">
      <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 dark:border-ink-800 dark:bg-ink-850">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <span className="text-brand-600 dark:text-brand-400">{icon}</span>
          {title}
          {count !== undefined && <span className="text-xs font-normal text-slate-400">({count})</span>}
        </h3>
        {actions}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function KeyValueTable({ rows }: { rows: [string, string][] }) {
  if (rows.length === 0) return <p className="text-sm text-slate-400">None</p>;
  return (
    <table className="w-full table-fixed text-sm">
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={`${k}-${i}`} className="border-b border-slate-100 last:border-0 dark:border-ink-800">
            <td className="w-1/3 py-1.5 pr-3 align-top font-mono text-xs font-medium break-words text-slate-500 dark:text-slate-400">
              {k}
            </td>
            <td className="py-1.5 font-mono text-xs break-all text-slate-800 dark:text-slate-200">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3 dark:bg-ink-850">
      <span className="mt-0.5 text-brand-600 dark:text-brand-400">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">{label}</div>
        <div className="truncate text-sm text-slate-800 dark:text-slate-100" title={value}>
          {value}
        </div>
      </div>
    </div>
  );
}

export function RequestDetail({
  req,
  onDelete,
  onBack,
}: {
  req: CapturedRequest;
  onDelete: () => void;
  onBack: () => void;
}) {
  const [raw, setRaw] = useState(false);
  const json = useMemo(() => (req.bodyEncoding === "text" ? tryParseJson(req.body) : undefined), [req]);
  const formFields = useMemo<[string, string][]>(() => {
    if (!req.contentType.includes("application/x-www-form-urlencoded")) return [];
    return [...new URLSearchParams(req.body).entries()];
  }, [req]);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const queryRows: [string, string][] = Object.entries(req.query).flatMap(([k, v]) =>
    Array.isArray(v) ? v.map((x) => [k, x] as [string, string]) : [[k, v] as [string, string]],
  );
  const headerRows = Object.entries(req.headers).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-ink-800"
          aria-label="Back to list"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className={`rounded-md px-2 py-1 font-mono text-sm font-bold ${methodStyle(req.method)}`}>{req.method}</span>
        <code className="min-w-0 flex-1 truncate font-mono text-sm text-slate-700 dark:text-slate-200">{req.url}</code>
        <div className="flex items-center gap-2">
          <CopyButton text={toCurl(req, origin)} label="Copy as cURL" />
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:bg-ink-800 dark:text-slate-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Meta icon={<Clock className="h-4 w-4" />} label="Received" value={new Date(req.receivedAt).toLocaleString()} />
        <Meta icon={<Globe className="h-4 w-4" />} label="IP address" value={req.ip} />
        <Meta icon={<HardDrive className="h-4 w-4" />} label="Size" value={formatBytes(req.size)} />
        <Meta icon={<Monitor className="h-4 w-4" />} label="User agent" value={req.userAgent || "—"} />
      </div>

      <Section
        title="Body"
        icon={<FileText className="h-4 w-4" />}
        actions={
          <div className="flex items-center gap-2">
            {json !== undefined && (
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs dark:bg-ink-800">
                {["Pretty", "Raw"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setRaw(label === "Raw")}
                    className={`rounded-md px-2 py-1 font-medium ${
                      raw === (label === "Raw")
                        ? "bg-white text-brand-700 shadow-sm dark:bg-ink-700 dark:text-brand-300"
                        : "text-slate-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            {req.body && <CopyButton text={req.body} />}
          </div>
        }
      >
        {req.contentType && (
          <div className="mb-3 text-xs text-slate-500">
            Content-Type: <code className="font-mono text-slate-700 dark:text-slate-300">{req.contentType}</code>
          </div>
        )}
        {req.bodyTruncated && (
          <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            The body was larger than 100 KB, so only the first 100 KB was stored.
          </div>
        )}
        {!req.body ? (
          <p className="text-sm text-slate-400">No body</p>
        ) : req.bodyEncoding === "base64" ? (
          <div>
            <p className="mb-2 text-xs text-slate-500">Binary content, shown as base64:</p>
            <pre className="scrollbar-thin max-h-96 overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-xs break-all whitespace-pre-wrap dark:bg-ink-950">
              {req.body}
            </pre>
          </div>
        ) : json !== undefined && !raw ? (
          <div className="scrollbar-thin max-h-[32rem] overflow-auto rounded-lg bg-slate-50 p-3 dark:bg-ink-950">
            <JsonView data={json} />
          </div>
        ) : (
          <pre className="scrollbar-thin max-h-[32rem] overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-xs break-all whitespace-pre-wrap dark:bg-ink-950">
            {req.body}
          </pre>
        )}
        {formFields.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-xs font-semibold text-slate-500 uppercase">Form fields</div>
            <KeyValueTable rows={formFields} />
          </div>
        )}
      </Section>

      <Section title="Query parameters" icon={<ListTree className="h-4 w-4" />} count={queryRows.length}>
        <KeyValueTable rows={queryRows} />
      </Section>

      <Section
        title="Headers"
        icon={<Terminal className="h-4 w-4" />}
        count={headerRows.length}
        actions={<CopyButton text={headerRows.map(([k, v]) => `${k}: ${v}`).join("\n")} />}
      >
        <KeyValueTable rows={headerRows} />
      </Section>
    </div>
  );
}
