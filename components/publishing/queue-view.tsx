"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, RotateCw, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useActiveBundle } from "@/components/providers";
import { MAX_ATTEMPTS, enqueuePost, pickNextApproved, retryNow } from "@/lib/publishing/runner";
import { useDemoStore, type PublishJob } from "@/lib/store";
import { cn } from "@/lib/utils/cn";
import { formatIstStamp } from "@/lib/utils/format";

const JOB_STATUS: Record<PublishJob["status"], { label: string; colour: string }> = {
  queued: { label: "Queued", colour: "#9a98a8" },
  running: { label: "Publishing", colour: "#06b6d4" },
  retrying: { label: "Retrying", colour: "#f59e0b" },
  deferred: { label: "Deferred", colour: "#8b5cf6" },
  succeeded: { label: "Published", colour: "#22c55e" },
  failed: { label: "Failed", colour: "#ef4444" },
};

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function QueueView() {
  const bundle = useActiveBundle();
  const jobs = useDemoStore((s) => s.jobs);
  const posts = useDemoStore((s) => s.posts);
  const mode = useDemoStore((s) => s.mode);
  const simulate = useDemoStore((s) => s.settings.simulateFailedPublish);
  const [open, setOpen] = useState<string | null>(null);
  const now = useNow();
  const mine = jobs.filter((j) => posts[j.postId]?.businessId === bundle.business.id);
  const console_ = mine.flatMap((j) => j.log.map((l) => ({ ...l, title: j.title }))).sort((a, b) => a.at.localeCompare(b.at)).slice(-40);

  function publishNext() {
    const next = pickNextApproved(bundle.business.id);
    if (!next) {
      toast.info("Nothing approved yet", { description: "Approve a post first. Nothing publishes without approval." });
      return;
    }
    enqueuePost(next.id);
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={publishNext} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent"><Rocket className="size-4" aria-hidden /> Publish next approved post now</button>
        {simulate && <p data-dev className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-500">Failure simulation is on: the next job fails once, then retries.</p>}
        <p className="ml-auto text-xs text-fg-muted">{mode === "demo" ? "Demo mode: retries run at 20× speed. Real backoff is 1, 5 and 15 minutes." : "Live mode: retries back off 1, 5 and 15 minutes."}</p>
      </div>

      <div className="overflow-x-auto rounded-card border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs text-fg-muted">
            <tr><th className="w-8 p-3"><span className="sr-only">Expand</span></th><th>Post</th><th>Platforms</th><th>Scheduled</th><th>Attempt</th><th>Status</th><th>Last error</th><th className="pr-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {mine.map((j) => {
              const meta = JOB_STATUS[j.status];
              const isOpen = open === j.id;
              const countdown = j.nextRetryAt ? Math.max(0, Math.ceil((Date.parse(j.nextRetryAt) - now) / 1000)) : null;
              return (
                <Fragment key={j.id}>
                  <tr className="border-b border-line last:border-0">
                    <td className="p-3"><button type="button" aria-expanded={isOpen} aria-label={`${isOpen ? "Hide" : "Show"} steps for ${j.title}`} onClick={() => setOpen(isOpen ? null : j.id)}><ChevronRight className={cn("size-4 transition-transform", isOpen && "rotate-90")} aria-hidden /></button></td>
                    <td className="py-2 pr-3"><Link href={`/posts/${j.postId}`} className="hover:text-accent">{j.title}</Link></td>
                    <td className="pr-3 capitalize">{j.platforms.join(", ")}</td>
                    <td className="whitespace-nowrap pr-3">{formatIstStamp(j.scheduledAt)}</td>
                    <td className="pr-3">{j.attempt} / {MAX_ATTEMPTS}</td>
                    <td className="pr-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[11px]"><span className="size-2 rounded-full" style={{ background: meta.colour }} aria-hidden />{meta.label}</span>
                      {countdown !== null && <span className="ml-2 text-[11px] text-fg-muted">in {countdown} s</span>}
                    </td>
                    <td className="max-w-xs truncate pr-3 text-xs text-fg-muted" title={j.reason ?? j.error}>{j.reason ?? j.error ?? "—"}</td>
                    <td className="pr-3 text-right">
                      {(j.status === "failed" || j.status === "retrying" || j.status === "deferred") && (
                        <button type="button" onClick={() => retryNow(j.id)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs hover:bg-panel-2"><RotateCw className="size-3" aria-hidden /> Retry now</button>
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-line bg-panel-2/50">
                      <td />
                      <td colSpan={7} className="py-3 pr-3">
                        <ol className="space-y-1 text-xs">
                          {j.log.length === 0 && <li className="text-fg-muted">No steps yet.</li>}
                          {j.log.map((l, i) => <li key={i} className={l.ok ? "" : "text-red-400"}><span className="mr-2 text-fg-muted">{formatIstStamp(l.at).split(", ")[1]}</span>{l.ok ? "→ " : "✕ "}{l.step}</li>)}
                        </ol>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {mine.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-fg-muted">No publish jobs yet. Approve a post, then press “Publish next approved post now”.</td></tr>}
          </tbody>
        </table>
      </div>

      <section aria-label="Log console" className="mt-5 rounded-card border border-line bg-[#0a0a0f] p-4 font-mono text-xs text-green-300">
        <h2 className="mb-2 font-sans text-xs font-medium uppercase tracking-wide text-fg-muted">Log console</h2>
        <div role="log" aria-live="polite" className="max-h-56 space-y-0.5 overflow-y-auto">
          {console_.length === 0 && <p className="text-white/40">Waiting for a publish job…</p>}
          {console_.map((l, i) => <p key={i} className={l.ok ? undefined : "text-red-400"}><span className="text-white/40">{formatIstStamp(l.at).split(", ")[1]}</span> [{l.title}] {l.step}</p>)}
        </div>
      </section>
    </>
  );
}
