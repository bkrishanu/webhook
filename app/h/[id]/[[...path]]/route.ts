import { NextRequest, NextResponse } from "next/server";
import { getConfig, saveRequest } from "@/lib/store";
import { badHookId, handleError, isValidHookId } from "@/lib/api";
import { CapturedRequest, MAX_BODY_BYTES } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; path?: string[] }> };

const TEXT_TYPES = /^(text\/|application\/(json|xml|x-www-form-urlencoded|javascript|graphql|.*\+json|.*\+xml))/i;
const HIDDEN_HEADERS = /^(x-vercel-|x-middleware-|x-matched-path|forwarded$)/i;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*",
};

async function capture(req: NextRequest, ctx: Ctx) {
  const { id, path } = await ctx.params;
  if (!isValidHookId(id)) return badHookId();

  try {
    const buf = new Uint8Array(await req.arrayBuffer());
    const contentType = req.headers.get("content-type") ?? "";
    const truncated = buf.byteLength > MAX_BODY_BYTES;
    const slice = truncated ? buf.subarray(0, MAX_BODY_BYTES) : buf;
    const isText = buf.byteLength === 0 || !contentType || TEXT_TYPES.test(contentType);

    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      if (!HIDDEN_HEADERS.test(key)) headers[key] = value;
    });

    const query: Record<string, string | string[]> = {};
    req.nextUrl.searchParams.forEach((value, key) => {
      const prev = query[key];
      query[key] = prev === undefined ? value : Array.isArray(prev) ? [...prev, value] : [prev, value];
    });

    const captured: CapturedRequest = {
      id: crypto.randomUUID(),
      hookId: id,
      method: req.method,
      path: "/" + (path ?? []).join("/"),
      url: req.nextUrl.pathname + req.nextUrl.search,
      query,
      headers,
      body: isText ? new TextDecoder().decode(slice) : Buffer.from(slice).toString("base64"),
      bodyEncoding: isText ? "text" : "base64",
      bodyTruncated: truncated,
      size: buf.byteLength,
      contentType,
      ip:
        req.headers.get("x-real-ip") ??
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        "unknown",
      userAgent: req.headers.get("user-agent") ?? "",
      receivedAt: Date.now(),
    };

    await saveRequest(captured);
    const config = await getConfig(id);

    const resHeaders = new Headers(CORS);
    if (config.contentType) resHeaders.set("Content-Type", config.contentType);
    for (const h of config.headers) {
      if (h.key.trim()) {
        try {
          resHeaders.set(h.key.trim(), h.value);
        } catch {
          /* ignore invalid header names */
        }
      }
    }
    resHeaders.set("X-HookNest-Request-Id", captured.id);

    const noBody = req.method === "HEAD" || [204, 304].includes(config.status);
    return new NextResponse(noBody ? null : config.body, { status: config.status, headers: resHeaders });
  } catch (err) {
    return handleError(err);
  }
}

export {
  capture as GET,
  capture as POST,
  capture as PUT,
  capture as PATCH,
  capture as DELETE,
  capture as HEAD,
  capture as OPTIONS,
};
