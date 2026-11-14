"use client";

import { Inbox, Search, Trash2 } from "lucide-react";
import type { CapturedRequest } from "@/lib/types";
import { formatBytes, methodStyle, timeAgo } from "@/lib/client";

const METHODS = ["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"];

export function RequestList({
  requests,
  total,
  selectedId,
  onSelect,
  search,
  onSearch,
  method,
  onMethod,
  onClearAll,
  now,
}: {
  requests: CapturedRequest[];
  total: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearch: (s: string) => void;
  method: string;
  onMethod: (m: string) => void;
  onClearAll: () => void;
  now: number;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-slate-200 p-3 dark:border-ink-800">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Inbox className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            Requests
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              {total}
            </span>
          </h2>
          {total > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search body, headers, IP…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-8 text-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onMethod(m)}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide transition ${
                method === m
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:bg-ink-800 dark:text-slate-400 dark:hover:text-brand-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {requests.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {total === 0 ? "Waiting for the first request…" : "No requests match your filters."}
          </div>
        ) : (
          <ul>
            {requests.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelect(r.id)}
                  className={`w-full border-b border-l-4 border-slate-100 px-3 py-2.5 text-left transition dark:border-b-ink-850 ${
                    selectedId === r.id
                      ? "border-l-brand-500 bg-brand-50/70 dark:bg-brand-500/10"
                      : "border-l-transparent hover:bg-slate-50 dark:hover:bg-ink-850"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${methodStyle(r.method)}`}>
                      {r.method}
                    </span>
                    <span className="truncate font-mono text-xs text-slate-600 dark:text-slate-300">{r.path}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{r.ip}</span>
                    <span className="shrink-0">
                      {formatBytes(r.size)} · {timeAgo(r.receivedAt, now)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
