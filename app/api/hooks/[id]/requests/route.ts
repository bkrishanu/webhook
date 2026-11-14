import { NextRequest, NextResponse } from "next/server";
import { clearRequests, listRequests, listRequestsSince } from "@/lib/store";
import { badHookId, handleError, isValidHookId } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidHookId(id)) return badHookId();
  try {
    const since = Number(req.nextUrl.searchParams.get("since"));
    const requests = since > 0 ? await listRequestsSince(id, since) : await listRequests(id);
    return NextResponse.json({ requests }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidHookId(id)) return badHookId();
  try {
    await clearRequests(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
