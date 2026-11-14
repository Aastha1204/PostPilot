"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useDemoStore } from "@/lib/store";

export function ResetButton() {
  const resetDemo = useDemoStore((s) => s.resetDemo);
  const [busy, setBusy] = useState(false);

  async function reset() {
    setBusy(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      resetDemo();
      toast.success("Demo reset", { description: "Everything is back to the seed state, ready for the next prospect." });
    } catch {
      // Local state is the source of truth in demo mode, so reset anyway.
      resetDemo();
      toast.success("Demo reset", { description: "Restored locally." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      data-dev
      onClick={reset}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-medium text-fg-muted hover:text-fg disabled:opacity-60"
    >
      <RotateCcw className={busy ? "size-3.5 animate-spin" : "size-3.5"} aria-hidden />
      Reset demo
    </button>
  );
}
