import type { CapturedRequest } from "./types";

export const HOOK_STORAGE_KEY = "hooknest-hook-id";

export function newHookId(): string {
  return crypto.randomUUID();
}

export function getSavedHookId(): string | null {
  try {
    return localStorage.getItem(HOOK_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveHookId(id: string) {
  try {
    localStorage.setItem(HOOK_STORAGE_KEY, id);
  } catch {
    /* storage unavailable */
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export const METHOD_STYLES: Record<string, string> = {
  GET: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  POST: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  PATCH: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  DELETE: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};
export const methodStyle = (m: string) =>
  METHOD_STYLES[m] ?? "bg-slate-200 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";

/** Try to parse a request body as JSON; returns undefined if it isn't JSON. */
export function tryParseJson(body: string): unknown {
  const t = body.trim();
  if (!t || (t[0] !== "{" && t[0] !== "[")) return undefined;
  try {
    return JSON.parse(t);
  } catch {
    return undefined;
  }
}

const SKIP_CURL_HEADERS = new Set([
  "host",
  "content-length",
  "connection",
  "accept-encoding",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
  "x-real-ip",
]);

const shq = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

export function toCurl(req: CapturedRequest, origin: string): string {
  const parts = [`curl -X ${req.method} ${shq(origin + req.url)}`];
  for (const [k, v] of Object.entries(req.headers)) {
    if (!SKIP_CURL_HEADERS.has(k.toLowerCase())) parts.push(`-H ${shq(`${k}: ${v}`)}`);
  }
  if (req.body && req.bodyEncoding === "text") parts.push(`--data-raw ${shq(req.body)}`);
  return parts.join(" \\\n  ");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
