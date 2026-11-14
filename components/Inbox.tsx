"use client";

import { AlertTriangle, Bookmark, Link2, RefreshCw, Send, Settings2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CapturedRequest } from "@/lib/types";
import { MAX_REQUESTS } from "@/lib/types";
import { newHookId, saveHookId } from "@/lib/client";
import { CopyButton } from "./CopyButton";
import { Logo } from "./Logo";
import { RequestDetail } from "./RequestDetail";
import { RequestList } from "./RequestList";
import { ResponseSettings } from "./ResponseSettings";
import { ThemeToggle } from "./ThemeToggle";

const POLL_MS = 3000;

export function Inbox({ hookId }: { hookId: string }) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [requests, setRequests] = useState<CapturedRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("ALL");
  const [showSettings, setShowSettings] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const latestRef = useRef(0);

  useEffect(() => {
    setOrigin(window.location.origin);
    saveHookId(hookId);
  }, [hookId]);

  const webhookUrl = `${origin}/h/${hookId}`;
  const dashboardUrl = `${origin}/inbox/${hookId}`;

  const merge = useCallback((incoming: CapturedRequest[], replace: boolean) => {
    setRequests((prev) => {
      const base = replace ? [] : prev;
      const seen = new Set(base.map((r) => r.id));
      const fresh = incoming.filter((r) => !seen.has(r.id));
      const next = [...fresh, ...base].sort((a, b) => b.receivedAt - a.receivedAt).slice(0, MAX_REQUESTS);
      latestRef.current = next[0]?.receivedAt ?? 0;
      return next;
    });
  }, []);

  const load = useCallback(
    async (full: boolean) => {
      try {
        const since = full ? 0 : latestRef.current;
        const res = await fetch(`/api/hooks/${hookId}/requests${since ? `?since=${since}` : ""}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load requests");
        merge(data.requests, full);
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load requests");
      } finally {
        setLoaded(true);
      }
    },
    [hookId, merge],
  );

  // Initial load + polling (paused while the tab is hidden).
  useEffect(() => {
    latestRef.current = 0;
    setRequests([]);
    setSelectedId(null);
    load(true);
    const t = setInterval(() => {
      if (!document.hidden) load(false);
      setNow(Date.now());
    }, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  // Auto-select the newest request on desktop if nothing is selected.
  useEffect(() => {
    if (!selectedId && requests.length > 0 && window.matchMedia("(min-width: 1024px)").matches) {
      setSelectedId(requests[0].id);
    }
  }, [requests, selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (method !== "ALL" && r.method !== method) return false;
      if (!q) return true;
      return (
        r.body.toLowerCase().includes(q) ||
        r.url.toLowerCase().includes(q) ||
        r.ip.toLowerCase().includes(q) ||
        Object.entries(r.headers).some(([k, v]) => k.includes(q) || v.toLowerCase().includes(q))
      );
    });
  }, [requests, search, method]);

  const selected = requests.find((r) => r.id === selectedId) ?? null;

  const deleteOne = async (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setSelectedId(null);
    await fetch(`/api/hooks/${hookId}/requests/${id}`, { method: "DELETE" });
  };

  const clearAll = async () => {
    if (!confirm("Delete all requests for this webhook URL?")) return;
    setRequests([]);
    setSelectedId(null);
    await fetch(`/api/hooks/${hookId}/requests`, { method: "DELETE" });
  };

  const createNew = () => {
    if (!confirm("Create a new webhook URL? Your current URL keeps working; bookmark its dashboard link to come back to it.")) return;
    const id = newHookId();
    saveHookId(id);
    router.push(`/inbox/${id}`);
  };

  const sampleCurl = `curl -X POST '${webhookUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"event":"order.created","id":1234}'`;

  return (
    <div className="flex min-h-screen flex-col lg:h-screen">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-ink-800 dark:bg-ink-900/80">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <Logo />
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-ink-800 dark:hover:text-brand-300"
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Response</span>
            </button>
            <button
              type="button"
              onClick={createNew}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">New URL</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* URL card */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-teal-600 px-4 py-4 text-white lg:px-6 dark:from-brand-900 dark:via-brand-800 dark:to-teal-900">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wider text-brand-100 uppercase">
              <Link2 className="h-3.5 w-3.5" /> Your webhook URL
              <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-[10px] tracking-normal normal-case">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-300 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-300" />
                </span>
                Listening
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="min-w-0 truncate rounded-lg bg-black/20 px-3 py-2 font-mono text-sm sm:text-base">{webhookUrl}</code>
              <CopyButton text={webhookUrl} label="Copy" className="bg-white! text-brand-700! hover:bg-brand-50!" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-brand-50">
            <Bookmark className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              Bookmark to return: <code className="font-mono">{dashboardUrl}</code>
            </span>
            <CopyButton text={dashboardUrl} className="bg-white/15! text-white! hover:bg-white/25!" />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 lg:px-6 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          <button type="button" onClick={() => load(true)} className="ml-auto inline-flex items-center gap-1 font-medium underline">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Main */}
      <div className="flex min-h-0 flex-1">
        <aside
          className={`w-full shrink-0 border-r border-slate-200 bg-white lg:block lg:w-80 xl:w-96 dark:border-ink-800 dark:bg-ink-900 ${
            selected ? "hidden" : "block"
          }`}
        >
          <RequestList
            requests={filtered}
            total={requests.length}
            selectedId={selectedId}
            onSelect={setSelectedId}
            search={search}
            onSearch={setSearch}
            method={method}
            onMethod={setMethod}
            onClearAll={clearAll}
            now={now}
          />
        </aside>

        <main className={`scrollbar-thin min-w-0 flex-1 overflow-y-auto p-4 lg:block lg:p-6 ${selected ? "block" : "hidden"}`}>
          {selected ? (
            <RequestDetail req={selected} onDelete={() => deleteOne(selected.id)} onBack={() => setSelectedId(null)} />
          ) : (
            loaded && (
              <div className="mx-auto flex max-w-2xl flex-col items-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <Send className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Waiting for your first request</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Send any HTTP request to your webhook URL and it appears here within a few seconds. Requests are kept for 7 days
                  (up to {MAX_REQUESTS}).
                </p>
                <div className="mt-6 w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-left dark:border-ink-800 dark:bg-ink-900">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 dark:border-ink-800">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Try it with cURL</span>
                    <CopyButton text={sampleCurl} label="Copy" />
                  </div>
                  <pre className="scrollbar-thin overflow-x-auto p-4 font-mono text-xs text-slate-700 dark:text-slate-300">{sampleCurl}</pre>
                </div>
              </div>
            )
          )}
        </main>
      </div>

      {showSettings && <ResponseSettings hookId={hookId} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
