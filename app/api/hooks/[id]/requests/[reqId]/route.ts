import { NextRequest, NextResponse } from "next/server";
import { deleteRequest } from "@/lib/store";
import { badHookId, handleError, isValidHookId } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; reqId: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id, reqId } = await ctx.params;
  if (!isValidHookId(id)) return badHookId();
  try {
    const removed = await deleteRequest(id, reqId);
    return NextResponse.json({ ok: removed }, { status: removed ? 200 : 404 });
  } catch (err) {
    return handleError(err);
  }
}
