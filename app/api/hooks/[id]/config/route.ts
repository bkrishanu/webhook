import { NextRequest, NextResponse } from "next/server";
import { getConfig, setConfig } from "@/lib/store";
import { badHookId, handleError, isValidHookId } from "@/lib/api";
import { ResponseConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidHookId(id)) return badHookId();
  try {
    return NextResponse.json(await getConfig(id), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidHookId(id)) return badHookId();
  try {
    const input = (await req.json()) as Partial<ResponseConfig>;
    const status = Number(input.status);
    if (!Number.isInteger(status) || status < 200 || status > 599) {
      return NextResponse.json({ error: "Status must be a whole number from 200 to 599" }, { status: 400 });
    }
    const body = String(input.body ?? "");
    if (body.length > 10_000) {
      return NextResponse.json({ error: "Response body must be 10,000 characters or fewer" }, { status: 400 });
    }
    const headers = Array.isArray(input.headers)
      ? input.headers
          .slice(0, 20)
          .map((h) => ({ key: String(h?.key ?? "").slice(0, 200), value: String(h?.value ?? "").slice(0, 2000) }))
          .filter((h) => h.key.trim())
      : [];
    const config: ResponseConfig = {
      status,
      contentType: String(input.contentType ?? "").slice(0, 200),
      body,
      headers,
    };
    await setConfig(id, config);
    return NextResponse.json(config);
  } catch (err) {
    return handleError(err);
  }
}
