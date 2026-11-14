"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSavedHookId, newHookId, saveHookId } from "@/lib/client";
import { isValidHookId } from "@/lib/types";
import { LogoMark } from "@/components/Logo";

/** Sends the visitor to their saved inbox, or creates a new permanent one. */
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    let id = getSavedHookId();
    if (!id || !isValidHookId(id)) {
      id = newHookId();
      saveHookId(id);
    }
    router.replace(`/inbox/${id}`);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <LogoMark className="h-14 w-14" />
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-brand-600" /> Preparing your webhook URL…
      </div>
    </div>
  );
}
