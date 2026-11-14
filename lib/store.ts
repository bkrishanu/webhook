import { Redis } from "@upstash/redis";
import {
  CapturedRequest,
  DEFAULT_RESPONSE,
  MAX_REQUESTS,
  ResponseConfig,
  RETENTION_SECONDS,
} from "./types";

/**
 * Storage layer. Uses Upstash Redis when credentials are present
 * (KV_REST_API_* from the Vercel Marketplace, or UPSTASH_REDIS_REST_*).
 * During local development without credentials it falls back to memory.
 */

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Storage is not configured. Connect Upstash Redis to this Vercel project (see README).",
    );
  }
}

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token, automaticDeserialization: false }) : null;

// ---- in-memory fallback (local dev only) ----
type Mem = { lists: Map<string, string[]>; kv: Map<string, string> };
const g = globalThis as unknown as { __hooknestMem?: Mem };
const mem: Mem = (g.__hooknestMem ??= { lists: new Map(), kv: new Map() });

function ensureStorage() {
  if (!redis && process.env.NODE_ENV === "production") {
    throw new StorageNotConfiguredError();
  }
}

const listKey = (hookId: string) => `hook:${hookId}:requests`;
const configKey = (hookId: string) => `hook:${hookId}:config`;

export async function saveRequest(req: CapturedRequest): Promise<void> {
  ensureStorage();
  const key = listKey(req.hookId);
  const value = JSON.stringify(req);
  if (redis) {
    const p = redis.pipeline();
    p.lpush(key, value);
    p.ltrim(key, 0, MAX_REQUESTS - 1);
    p.expire(key, RETENTION_SECONDS);
    await p.exec();
    return;
  }
  const list = mem.lists.get(key) ?? [];
  list.unshift(value);
  mem.lists.set(key, list.slice(0, MAX_REQUESTS));
}

async function rawList(hookId: string, count: number): Promise<string[]> {
  ensureStorage();
  const key = listKey(hookId);
  if (redis) return (await redis.lrange<string>(key, 0, count - 1)) ?? [];
  return (mem.lists.get(key) ?? []).slice(0, count);
}

function parse(raw: string[]): CapturedRequest[] {
  const out: CapturedRequest[] = [];
  for (const r of raw) {
    try {
      out.push(typeof r === "string" ? JSON.parse(r) : (r as CapturedRequest));
    } catch {
      /* skip corrupt entry */
    }
  }
  return out;
}

const cutoff = () => Date.now() - RETENTION_SECONDS * 1000;

/** All stored requests, newest first. */
export async function listRequests(hookId: string): Promise<CapturedRequest[]> {
  return parse(await rawList(hookId, MAX_REQUESTS)).filter((r) => r.receivedAt >= cutoff());
}

/** Requests newer than `since` (ms). Only scans the most recent 50 to keep polling cheap. */
export async function listRequestsSince(hookId: string, since: number): Promise<CapturedRequest[]> {
  return parse(await rawList(hookId, 50)).filter((r) => r.receivedAt > since);
}

export async function deleteRequest(hookId: string, reqId: string): Promise<boolean> {
  const key = listKey(hookId);
  const raw = await rawList(hookId, MAX_REQUESTS);
  const match = raw.find((r) => {
    try {
      return JSON.parse(r).id === reqId;
    } catch {
      return false;
    }
  });
  if (!match) return false;
  if (redis) {
    await redis.lrem(key, 1, match);
  } else {
    mem.lists.set(key, (mem.lists.get(key) ?? []).filter((r) => r !== match));
  }
  return true;
}

export async function clearRequests(hookId: string): Promise<void> {
  ensureStorage();
  const key = listKey(hookId);
  if (redis) await redis.del(key);
  else mem.lists.delete(key);
}

// Response config lives 30 days and is refreshed whenever it is read or saved.
const CONFIG_TTL = 30 * 24 * 60 * 60;

export async function getConfig(hookId: string): Promise<ResponseConfig> {
  ensureStorage();
  const key = configKey(hookId);
  let raw: string | null;
  if (redis) {
    raw = await redis.get<string>(key);
    if (raw) await redis.expire(key, CONFIG_TTL);
  } else {
    raw = mem.kv.get(key) ?? null;
  }
  if (!raw) return DEFAULT_RESPONSE;
  try {
    return { ...DEFAULT_RESPONSE, ...(typeof raw === "string" ? JSON.parse(raw) : raw) };
  } catch {
    return DEFAULT_RESPONSE;
  }
}

export async function setConfig(hookId: string, config: ResponseConfig): Promise<void> {
  ensureStorage();
  const key = configKey(hookId);
  const value = JSON.stringify(config);
  if (redis) await redis.set(key, value, { ex: CONFIG_TTL });
  else mem.kv.set(key, value);
}
