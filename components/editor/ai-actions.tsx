"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useDemoStore } from "@/lib/store";
import type { EditResult } from "@/lib/services/post-edit";
import type { EditAction } from "@/lib/ai/prompts/edit";
import { cn } from "@/lib/utils/cn";

interface Props {
  businessId: string;
  post: { caption: string; hashtags: string[]; cta: string };
  postId: string;
  disabled: boolean;
  onAccept: (revised: EditResult["revised"]) => void;
}

const ACTIONS: { id: EditAction; label: string }[] = [
  { id: "shorter", label: "Shorter" },
  { id: "festive", label: "More festive" },
  { id: "hinglish", label: "More Hinglish" },
  { id: "formal", label: "More formal" },
];

export function AiActions({ businessId, post, postId, disabled, onAccept }: Props) {
  const mode = useDemoStore((s) => s.mode);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<EditResult | null>(null);
  const [last, setLast] = useState<{ action?: EditAction; instruction?: string } | null>(null);

  async function run(request: { action?: EditAction; instruction?: string }) {
    setBusy(true);
    setLast(request);
    try {
      const res = await fetch(`/api/posts/${postId}/edit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId, mode, post, ...request }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setResult((await res.json()) as EditResult);
    } catch {
      toast.error("Couldn't revise the caption", { description: "Your original caption is unchanged. Try again." });
    } finally {
      setBusy(false);
    }
  }

  const changed = result && result.revised.caption !== post.caption;

  return (
    <section aria-label="AI edits" className="rounded-card border border-line bg-panel p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-accent" aria-hidden /> AI edits</h2>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button key={a.id} type="button" disabled={disabled || busy} onClick={() => run({ action: a.id })} className="rounded-full border border-line px-3 py-1.5 text-xs hover:bg-panel-2 disabled:opacity-50">{a.label}</button>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) void run({ instruction: text });
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled || busy}
          aria-label="Describe the change"
          placeholder="e.g. caption chhota karo, emoji kam"
          className="min-w-0 flex-1 rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm"
        />
        <button type="submit" disabled={disabled || busy || !text.trim()} className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-on-accent disabled:opacity-50">Revise</button>
      </form>

      {busy && <p className="mt-3 flex items-center gap-2 text-sm text-fg-muted"><Loader2 className="size-4 animate-spin" aria-hidden /> Revising…</p>}

      {result && !busy && (
        <div className="mt-4 rounded-xl border border-line bg-panel-2 p-3">
          <p className="mb-2 text-xs text-fg-muted">{result.summary}</p>
          <p className="whitespace-pre-line text-sm leading-relaxed" aria-label="Caption changes">
            {result.diff.map((op, i) => (
              <span key={i} className={cn(op.type === "remove" && "bg-red-500/15 text-red-400 line-through", op.type === "add" && "bg-green-500/15 text-green-400")}>{op.text}</span>
            ))}
          </p>
          {result.newWarnings.length > 0 && <p className="mt-2 text-xs text-amber-500">New unverified facts: {result.newWarnings.join(", ")}. Fact guard will flag them.</p>}
          <div className="mt-3 flex gap-2">
            {changed && <button type="button" onClick={() => { onAccept(result.revised); setResult(null); }} className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-on-accent">Accept</button>}
            {last && <button type="button" onClick={() => run(last)} className="rounded-full border border-line px-4 py-1.5 text-xs">Try again</button>}
            <button type="button" onClick={() => setResult(null)} className="rounded-full px-3 py-1.5 text-xs text-fg-muted hover:text-fg">Dismiss</button>
          </div>
        </div>
      )}
    </section>
  );
}
