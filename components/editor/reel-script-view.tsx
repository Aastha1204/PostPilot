"use client";

import { Clapperboard, Send } from "lucide-react";
import { toast } from "sonner";
import { buildReelScript } from "@/lib/services/reel-script";
import type { Post } from "@/lib/types";

export function ReelScriptView({ post, ownerName, onSend }: { post: Post; ownerName: string; onSend: () => void }) {
  const script = buildReelScript(post);
  return (
    <section aria-label="Reel script" className="rounded-card border border-line bg-panel p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium"><Clapperboard className="size-4 text-accent" aria-hidden /> Reel script</h2>
      <p className="text-sm"><span className="text-fg-muted">Hook: </span>{script.hook}</p>
      <table className="mt-3 w-full text-left text-sm">
        <thead className="text-xs text-fg-muted"><tr><th className="pb-1 pr-3">Time</th><th className="pb-1 pr-3">Shot</th><th className="pb-1">On-screen text</th></tr></thead>
        <tbody>
          {script.shots.map((s) => (
            <tr key={s.time} className="border-t border-line align-top"><td className="py-1.5 pr-3 whitespace-nowrap">{s.time}</td><td className="py-1.5 pr-3">{s.shot}</td><td className="py-1.5">{s.onScreen || "—"}</td></tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={() => {
          onSend();
          toast.success(`Script sent to ${ownerName.split(" ")[0]} ji`, { description: "WhatsApp preview in demo mode." });
        }}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-on-accent"
      >
        <Send className="size-4" aria-hidden /> Send script to owner
      </button>
      <p className="mt-3 text-xs text-fg-muted">Add licensed music in the Instagram app.</p>
    </section>
  );
}
