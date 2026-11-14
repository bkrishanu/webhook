"use client";

import { Loader2, Plus, Settings2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_RESPONSE, type ResponseConfig } from "@/lib/types";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-950";

const STATUS_PRESETS = [200, 201, 202, 204, 400, 401, 403, 404, 500, 503];

export function ResponseSettings({ hookId, onClose }: { hookId: string; onClose: () => void }) {
  const [cfg, setCfg] = useState<ResponseConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/hooks/${hookId}/config`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setCfg)
      .catch(() => setCfg(DEFAULT_RESPONSE));
  }, [hookId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/hooks/${hookId}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const setHeader = (i: number, field: "key" | "value", v: string) =>
    cfg && setCfg({ ...cfg, headers: cfg.headers.map((h, j) => (j === i ? { ...h, [field]: v } : h)) });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="scrollbar-thin max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-ink-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resp-title"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-ink-800">
          <h2 id="resp-title" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <Settings2 className="h-5 w-5 text-brand-600 dark:text-brand-400" /> Custom response
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!cfg ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : (
          <div className="space-y-4 p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This is what your webhook URL sends back to whoever calls it.
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">Status code</label>
              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  type="number"
                  min={200}
                  max={599}
                  value={cfg.status}
                  onChange={(e) => setCfg({ ...cfg, status: Number(e.target.value) })}
                  className={`${inputCls} w-24`}
                />
                {STATUS_PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setCfg({ ...cfg, status: s })}
                    className={`rounded-md px-2 py-1 font-mono text-xs ${
                      cfg.status === s ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-brand-50 dark:bg-ink-800 dark:text-slate-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">Content-Type</label>
              <input value={cfg.contentType} onChange={(e) => setCfg({ ...cfg, contentType: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">Body</label>
              <textarea
                rows={6}
                value={cfg.body}
                onChange={(e) => setCfg({ ...cfg, body: e.target.value })}
                className={`${inputCls} font-mono text-xs`}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">Extra headers</label>
              <div className="space-y-2">
                {cfg.headers.map((h, i) => (
                  <div key={i} className="flex gap-2">
                    <input placeholder="Header name" value={h.key} onChange={(e) => setHeader(i, "key", e.target.value)} className={`${inputCls} font-mono text-xs`} />
                    <input placeholder="Value" value={h.value} onChange={(e) => setHeader(i, "value", e.target.value)} className={`${inputCls} font-mono text-xs`} />
                    <button
                      type="button"
                      onClick={() => setCfg({ ...cfg, headers: cfg.headers.filter((_, j) => j !== i) })}
                      className="rounded-lg px-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                      aria-label="Remove header"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setCfg({ ...cfg, headers: [...cfg.headers, { key: "", value: "" }] })}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-400"
                >
                  <Plus className="h-4 w-4" /> Add header
                </button>
              </div>
            </div>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
            <div className="flex justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCfg(DEFAULT_RESPONSE)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-ink-800"
              >
                Reset to default
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-ink-800">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
