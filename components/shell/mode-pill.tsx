"use client";

import { toast } from "sonner";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils/cn";

interface Props {
  liveAvailable: boolean;
  missing: string[];
}

export function ModePill({ liveAvailable, missing }: Props) {
  const mode = useDemoStore((s) => s.mode);
  const setMode = useDemoStore((s) => s.setMode);
  const liveTip = liveAvailable
    ? "Real LLM, WhatsApp and Instagram calls"
    : `Live mode needs credentials: ${missing.join(", ")}`;

  return (
    <div data-dev role="group" aria-label="Data mode" className="flex rounded-full border border-line bg-panel p-0.5 text-xs font-medium">
      <button
        type="button"
        aria-pressed={mode === "demo"}
        onClick={() => setMode("demo")}
        data-tip="Seeded data, simulated channels. Works offline."
        className={cn("rounded-full px-3 py-1.5", mode === "demo" ? "bg-accent text-on-accent" : "text-fg-muted hover:text-fg")}
      >
        Demo
      </button>
      <button
        type="button"
        aria-pressed={mode === "live"}
        aria-disabled={!liveAvailable}
        data-tip={liveTip}
        onClick={() => {
          if (!liveAvailable) {
            toast.info("Live mode is off", { description: "Add the API keys from .env.example to enable it." });
            return;
          }
          setMode("live");
        }}
        className={cn(
          "rounded-full px-3 py-1.5",
          mode === "live" ? "bg-accent text-on-accent" : "text-fg-muted hover:text-fg",
          !liveAvailable && "cursor-not-allowed opacity-60",
        )}
      >
        Live
      </button>
    </div>
  );
}
