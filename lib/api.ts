import { NextResponse } from "next/server";
import { StorageNotConfiguredError } from "./store";
import { isValidHookId } from "./types";

export function badHookId() {
  return NextResponse.json({ error: "Invalid webhook ID" }, { status: 400 });
}

export function handleError(err: unknown) {
  if (err instanceof StorageNotConfiguredError) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export { isValidHookId };
