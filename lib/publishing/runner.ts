"use client";

import { toast } from "sonner";
import { appNow, offsetFor } from "@/lib/clock";
import { canPublish } from "@/lib/services/post-state";
import type { PublishResult } from "@/lib/services/publish";
import { useDemoStore, type PublishJob } from "@/lib/store";
import type { Post } from "@/lib/types";

/** Backoff between automatic retries, in seconds: 1 min, 5 min, 15 min. Three attempts in total. */
export const BACKOFF_SECONDS = [60, 300, 900];
export const MAX_ATTEMPTS = 3;
/** Demo mode compresses waits so a retry is visible within a presentation. */
export const DEMO_SPEEDUP = 20;
const BASE_QUOTA_USED = 12;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const running = new Set<string>();
const state = () => useDemoStore.getState();

function safeMove(id: string, to: Post["status"], note: string) {
  try {
    state().moveStatus(id, to, note);
  } catch {
    /* already there */
  }
}

/** Prefers the post approved most recently (what the prospect just approved), else the earliest slot. */
export function pickNextApproved(businessId: string): Post | undefined {
  const posts = Object.values(state().posts).filter((p) => p.businessId === businessId && canPublish(p.status));
  const approvedAt = (p: Post) => [...p.timeline].reverse().find((t) => t.status === "approved")?.at ?? "";
  const fresh = posts.filter((p) => approvedAt(p)).sort((a, b) => approvedAt(b).localeCompare(approvedAt(a)))[0];
  return fresh ?? posts.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];
}

export function enqueuePost(postId: string, opts: { auto?: boolean; lateMinutes?: number } = {}): string | null {
  const post = state().posts[postId];
  if (!post) return null;
  if (!canPublish(post.status)) {
    toast.error("Can't publish yet", { description: "Only approved or scheduled posts can be published." });
    return null;
  }
  if (state().jobs.some((j) => j.postId === postId && ["queued", "running", "retrying", "deferred"].includes(j.status))) return null;
  const { settings, failureUsed } = state();
  const simulateFailure = settings.simulateFailedPublish && !failureUsed;
  if (simulateFailure) state().markFailureUsed(true);
  const job: PublishJob = {
    id: `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    postId, title: post.title, platforms: post.platforms, scheduledAt: post.scheduledAt,
    gateStatus: post.status === "approved" ? "approved" : "scheduled",
    attempt: 0, status: "queued", simulateFailure, auto: opts.auto, lateMinutes: opts.lateMinutes, log: [],
  };
  state().addJob(job);
  void runJob(job.id);
  return job.id;
}

async function reveal(jobId: string, steps: { step: string }[], ok = true) {
  for (const s of steps) {
    state().appendJobLog(jobId, { at: new Date().toISOString(), step: s.step, ok });
    await sleep(450);
  }
}

export async function runJob(jobId: string): Promise<void> {
  if (running.has(jobId)) return;
  const job = state().jobs.find((j) => j.id === jobId);
  const post = job && state().posts[job.postId];
  if (!job || !post) return;
  running.add(jobId);
  const attempt = job.attempt + 1;
  state().patchJob(jobId, { status: "running", attempt, nextRetryAt: undefined, reason: undefined });
  state().appendJobLog(jobId, { at: new Date().toISOString(), step: `Attempt ${attempt} of ${MAX_ATTEMPTS} started`, ok: true });

  const { mode, quotaUsedExtra } = state();
  try {
    const res = await fetch(`/api/publish/${post.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        post: { ...post, status: job.gateStatus },
        mode,
        quotaUsed: BASE_QUOTA_USED + quotaUsedExtra,
        simulateFailure: job.simulateFailure && attempt === 1,
      }),
    });
    if (res.status === 409) {
      const { error } = (await res.json()) as { error: string };
      await reveal(jobId, [{ step: `Refused: ${error}` }], false);
      state().patchJob(jobId, { status: "failed", error });
      return;
    }
    if (!res.ok) throw new Error(String(res.status));
    const result = (await res.json()) as Exclude<PublishResult, { kind: "blocked" }>;
    await handleResult(jobId, post, attempt, result);
  } catch {
    await handleResult(jobId, post, attempt, { kind: "error", code: "network", retryable: true, message: "Could not reach the publishing service", steps: [] });
  } finally {
    running.delete(jobId);
  }
}

async function handleResult(jobId: string, post: Post, attempt: number, result: Exclude<PublishResult, { kind: "blocked" }>) {
  const demo = state().mode === "demo";
  const speed = demo ? DEMO_SPEEDUP : 1;
  await reveal(jobId, result.steps);

  if (result.kind === "ok") {
    safeMove(post.id, "publishing", "Publishing");
    safeMove(post.id, "published", "Published");
    state().updatePost(post.id, { igMediaId: result.outcome.igMediaId, fbPostId: result.outcome.fbPostId, error: undefined });
    state().bumpQuota();
    state().patchJob(jobId, { status: "succeeded", error: undefined });
    state().logApproval(post.businessId, `“${post.title}” published${state().mode === "demo" ? " (preview)" : ""}`);
    toast.success("Published", { description: post.title });
    return;
  }

  if (result.kind === "deferred") {
    const wait = Math.ceil((demo ? 300 / speed : 300));
    await reveal(jobId, [{ step: `Deferred: ${result.reason}` }], false);
    state().patchJob(jobId, { status: "deferred", reason: result.reason, nextRetryAt: new Date(Date.now() + wait * 1000).toISOString(), attempt: attempt - 1 });
    toast.info("Publishing deferred", { description: result.reason });
    return;
  }

  await reveal(jobId, [{ step: `Failed: ${result.message}` }], false);
  if (result.retryable && attempt < MAX_ATTEMPTS) {
    const wait = Math.ceil((BACKOFF_SECONDS[attempt - 1] ?? 900) / speed);
    state().patchJob(jobId, { status: "retrying", error: result.message, nextRetryAt: new Date(Date.now() + wait * 1000).toISOString() });
    toast.warning("Publish failed, retrying", { description: `${result.message}. Next attempt in ${wait} s${demo ? " (demo speed)" : ""}.` });
    return;
  }
  safeMove(post.id, "publishing", "Publishing");
  safeMove(post.id, "failed", result.message);
  state().updatePost(post.id, { error: result.message });
  state().patchJob(jobId, { status: "failed", error: result.message });
  toast.error("Publishing failed", { description: result.retryable ? "All attempts used. Retry from the queue." : result.message });
}

export function retryNow(jobId: string) {
  const job = state().jobs.find((j) => j.id === jobId);
  const post = job && state().posts[job.postId];
  if (!job || !post) return;
  if (job.status === "failed") {
    const wasApproved = post.timeline.some((t) => t.status === "approved" || t.status === "scheduled");
    if (!wasApproved) {
      toast.error("Approve the post again first");
      return;
    }
    // A failed post keeps its earlier approval, so it re-enters the queue as scheduled.
    state().patchJob(jobId, { attempt: 0, gateStatus: "scheduled", simulateFailure: false });
    if (post.status === "failed") {
      state().updatePost(post.id, { status: "scheduled" });
    }
  }
  void runJob(jobId);
}

/** Runs due retries and deferred jobs. In demo mode this stands in for the cron tick. */
export function tickJobs() {
  const now = Date.now();
  for (const j of state().jobs) {
    if ((j.status === "retrying" || j.status === "deferred") && j.nextRetryAt && Date.parse(j.nextRetryAt) <= now) void runJob(j.id);
  }
}

/**
 * Autopilot: publishes every scheduled post whose slot has arrived. A slot that was missed (tab closed,
 * server asleep) is caught up on the next tick and recorded as late, so nothing is silently skipped.
 */
export function autopilotTick() {
  const { autopilot, mode, clockOffsetMs, posts, jobs } = state();
  if (!autopilot.enabled) return;
  const now = appNow(mode, clockOffsetMs);
  for (const post of Object.values(posts)) {
    if (post.status !== "scheduled") continue;
    const due = Date.parse(post.scheduledAt);
    if (due > now) continue;
    if (jobs.some((j) => j.postId === post.id && ["queued", "running", "retrying", "deferred"].includes(j.status))) continue;
    const late = Math.max(0, Math.round((now - due) / 60000));
    enqueuePost(post.id, { auto: true, lateMinutes: late });
  }
}

/** Demo helper: jump the demo clock to just before the next scheduled slot so autopilot visibly posts it. */
export function skipToNextSlot(): boolean {
  const { mode, clockOffsetMs, posts } = state();
  const now = appNow(mode, clockOffsetMs);
  const next = Object.values(posts).filter((p) => p.status === "scheduled" && Date.parse(p.scheduledAt) > now).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];
  if (!next) return false;
  state().setClockOffset(offsetFor(Date.parse(next.scheduledAt) - 3000));
  return true;
}
