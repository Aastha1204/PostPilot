"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarPlus, Clock, FastForward, Loader2, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { PostThumb } from "@/components/calendar/post-thumb";
import { useActiveBundle } from "@/components/providers";
import { PageHeader } from "@/components/ui/page-header";
import { ScaledCanvas } from "@/components/templates/scaled-canvas";
import { Template } from "@/components/templates/template";
import { appNow } from "@/lib/clock";
import { DEMO_TODAY } from "@/lib/demo-clock";
import { EVENT_TYPES, type EventItem } from "@/lib/events";
import { festivalsFor } from "@/lib/festivals";
import { skipToNextSlot } from "@/lib/publishing/runner";
import { useDemoStore } from "@/lib/store";
import { sampleContent } from "@/lib/templates/samples";
import { applyTheme, tokensFor } from "@/lib/templates/tokens";
import { THEMES, getTheme } from "@/lib/themes";
import type { Platform, Post } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatTime, postDate } from "@/lib/utils/dates";
import { formatDayMonth, formatIstStamp } from "@/lib/utils/format";

const PLATFORMS: { id: Platform; label: string; note?: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook Page" },
  { id: "linkedin", label: "LinkedIn", note: "preview" },
  { id: "x", label: "X", note: "preview" },
];
const field = "w-full rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm";
const card = "rounded-card border border-line bg-panel p-5";

function Switch({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span><span className="block text-sm font-medium">{label}</span><span className="block text-xs text-fg-muted">{hint}</span></span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-5 shrink-0 accent-[var(--accent)]" />
    </label>
  );
}

export function AutopilotView() {
  const bundle = useActiveBundle();
  const bid = bundle.business.id;
  const tokens = useMemo(() => tokensFor(bundle), [bundle]);
  const { autopilot, mode, clockOffsetMs, posts, jobs, events } = useDemoStore();
  const setAutopilot = useDemoStore((s) => s.setAutopilot);
  const addPost = useDemoStore((s) => s.addPost);
  const addEvent = useDemoStore((s) => s.addEvent);
  const assets = useDemoStore((s) => s.brandAssets[bid]) ?? [];
  const [now, setNow] = useState(() => appNow(mode, clockOffsetMs));
  const [openai, setOpenai] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [form, setForm] = useState({ name: "", date: "2026-12-12", type: "festival", notes: "", themeId: "auto", imageCount: 3, imageSource: "ai" as "ai" | "mine" | "mix", postTime: "11:00", teaser: true });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ posts: Post[]; themeName: string; notices: string[]; provider: string } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(appNow(mode, clockOffsetMs)), 1000);
    return () => clearInterval(id);
  }, [mode, clockOffsetMs]);
  useEffect(() => {
    fetch("/api/accounts/status").then((r) => r.json()).then((s: { openai?: boolean }) => setOpenai(Boolean(s.openai))).catch(() => undefined);
  }, []);

  const mine = Object.values(posts).filter((p) => p.businessId === bid);
  const upcoming = mine.filter((p) => p.status === "scheduled").sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const myJobs = jobs.filter((j) => posts[j.postId]?.businessId === bid);
  const autoPublished = myJobs.filter((j) => j.auto && j.status === "succeeded").length;
  const late = myJobs.filter((j) => j.auto && (j.lateMinutes ?? 0) > 5).length;
  const failed = myJobs.filter((j) => j.status === "failed").length;
  const overdue = upcoming.filter((p) => Date.parse(p.scheduledAt) < now && !myJobs.some((j) => ["queued", "running", "retrying", "deferred"].includes(j.status) && j.postId === p.id)).length;
  const today = new Date(now + 5.5 * 3600_000).toISOString().slice(0, 10) < DEMO_TODAY ? DEMO_TODAY : new Date(now + 5.5 * 3600_000).toISOString().slice(0, 10);
  const planned = new Set(events.map((e) => e.id));
  const suggestions = festivalsFor(bundle.business.type).filter((f) => f.date >= today && !planned.has(f.id));
  const chosenTheme = getTheme(form.themeId);

  async function plan(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || busy) return;
    setBusy(true);
    setResult(null);
    const id = suggestions.find((f) => f.name === form.name)?.id ?? `ev${Date.now().toString(36)}`;
    try {
      const res = await fetch("/api/events/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessId: bid,
          event: { id, name: form.name.trim(), date: form.date, type: form.type, notes: form.notes.trim() || undefined },
          themeId: form.themeId === "auto" ? undefined : form.themeId,
          imageCount: form.imageCount,
          imageSource: form.imageSource,
          userPhotos: assets.filter((a) => a.kind !== "ai_generated").slice(0, 6).map((a) => a.dataUrl),
          postTime: form.postTime,
          teaser: form.teaser,
          autoApprove: autopilot.autoApprove,
          platforms: autopilot.platforms,
          useOpenAI: autopilot.useOpenAI,
          today,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { posts: Post[]; theme: { id: string; name: string }; notices: string[]; imageProvider: string };
      for (const p of data.posts) addPost(p);
      const item: EventItem = { id, businessId: bid, name: form.name.trim(), date: form.date, type: form.type, notes: form.notes.trim() || undefined, themeId: data.theme.id, imageCount: form.imageCount, status: data.posts.every((p) => p.status === "scheduled") ? "ready" : "needs_review", postIds: data.posts.map((p) => p.id), createdAt: new Date().toISOString() };
      addEvent(item);
      setResult({ posts: data.posts, themeName: data.theme.name, notices: data.notices, provider: data.imageProvider });
      const scheduled = data.posts.filter((p) => p.status === "scheduled").length;
      toast.success(`${data.posts.length} post${data.posts.length > 1 ? "s" : ""} planned`, { description: scheduled ? `${scheduled} scheduled on autopilot.` : "Review and approve them to schedule." });
    } catch {
      toast.error("Couldn't plan this event", { description: "Nothing was changed. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  const togglePlatform = (p: Platform) => setAutopilot({ platforms: autopilot.platforms.includes(p) ? autopilot.platforms.filter((x) => x !== p) : [...autopilot.platforms, p] });

  return (
    <>
      <PageHeader title="Event Autopilot" description="Add an event. AI picks a theme, writes the post, creates the images and puts it on the calendar. Autopilot publishes it at its time, on every connected account." />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <section className={card} aria-label="Autopilot status">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-medium"><span className={cn("size-2.5 rounded-full", autopilot.enabled ? "bg-green-500" : "bg-gray-500")} aria-hidden /> Autopilot is {autopilot.enabled ? "on" : "off"}</h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted"><Clock className="size-3.5" aria-hidden /> {mode === "demo" ? "Demo time" : "Time"}: {formatIstStamp(new Date(now).toISOString())} IST</span>
          </div>
          <Switch label="Auto-post at the scheduled time" hint="Every scheduled post goes out by itself. A missed slot is caught up on the next check and shown as late, never skipped." checked={autopilot.enabled} onChange={(enabled) => setAutopilot({ enabled })} />
          <Switch label="Standing approval for event posts" hint="You approve once, here. New event posts are scheduled without asking again. Posts with an unverified number or date are still held for you." checked={autopilot.autoApprove} onChange={(autoApprove) => setAutopilot({ autoApprove })} />
          <Switch label="Generate real AI images" hint={openai ? "Uses OpenAI when it has credits, otherwise a free image service. Captions use OpenAI when available." : "Uses a free image service (no key needed). Add OPENAI_API_KEY for OpenAI quality."} checked={autopilot.useOpenAI} onChange={(useOpenAI) => setAutopilot({ useOpenAI })} />
          <fieldset className="mt-2">
            <legend className="mb-1.5 text-sm font-medium">Post to</legend>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button key={p.id} type="button" aria-pressed={autopilot.platforms.includes(p.id)} onClick={() => togglePlatform(p.id)} className={cn("rounded-full border px-3 py-1.5 text-xs", autopilot.platforms.includes(p.id) ? "border-accent bg-accent/10" : "border-line text-fg-muted hover:text-fg")}>
                  {p.label}{p.note && <span className="ml-1 text-[10px] text-fg-muted">({p.note})</span>}
                </button>
              ))}
            </div>
          </fieldset>
        </section>

        <section className={card} aria-label="Reliability">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-4 text-accent" aria-hidden /> Nothing gets missed</h2>
          <dl className="grid grid-cols-4 gap-2 text-center">
            {[["Upcoming", upcoming.length], ["Auto-posted", autoPublished], ["Caught up late", late], ["Missed", overdue + failed]].map(([l, n]) => (
              <div key={l as string} className="rounded-xl bg-panel-2 p-2"><dd className={cn("text-2xl font-semibold", l === "Missed" && Number(n) > 0 && "text-red-400")}>{n}</dd><dt className="text-[11px] text-fg-muted">{l}</dt></div>
            ))}
          </dl>
          <ol className="mt-3 space-y-1.5 text-sm" aria-label="Next scheduled posts">
            {upcoming.slice(0, 5).map((p) => <li key={p.id} className="flex justify-between gap-3"><Link href={`/posts/${p.id}`} className="truncate hover:text-accent">{p.title}</Link><span className="shrink-0 text-xs text-fg-muted">{formatDayMonth(postDate(p.scheduledAt))}, {formatTime(p.scheduledAt)}</span></li>)}
            {upcoming.length === 0 && <li className="text-xs text-fg-muted">Nothing scheduled yet. Plan an event below.</li>}
          </ol>
          {mode === "demo" && (
            <button type="button" onClick={() => (skipToNextSlot() ? toast.info("Jumped to just before the next slot", { description: "Autopilot will post it in a moment." }) : toast.info("No scheduled posts to jump to"))} className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs hover:bg-panel-2"><FastForward className="size-3.5" aria-hidden /> Skip to next scheduled post</button>
          )}
          {mode === "live" && <p className="mt-3 text-xs text-fg-muted">Live mode: the server cron (every minute) publishes due posts even when this tab is closed.</p>}
        </section>
      </div>

      <form ref={formRef} onSubmit={plan} className={cn(card, "mt-4")} aria-label="Plan an event">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-medium"><CalendarPlus className="size-4 text-accent" aria-hidden /> Plan an event</h2>
        {suggestions.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-fg-muted">Quick start from festivals:</span>
            {suggestions.slice(0, 5).map((f) => <button key={f.id} type="button" onClick={() => setForm((s) => ({ ...s, name: f.name, date: f.date, type: "festival", themeId: "auto" }))} className="rounded-full border border-line px-3 py-1 hover:bg-panel-2">{f.name} · {formatDayMonth(f.date)}</button>)}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm"><span className="mb-1.5 block text-fg-muted">Event name</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sangeet night for the Mehta family" className={field} /></label>
          <label className="block text-sm"><span className="mb-1.5 block text-fg-muted">Event date</span><input required type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={field} /></label>
          <label className="block text-sm"><span className="mb-1.5 block text-fg-muted">Type</span><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={field}>{EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
          <label className="block text-sm"><span className="mb-1.5 block text-fg-muted">Post at (IST)</span><input type="time" value={form.postTime} onChange={(e) => setForm({ ...form, postTime: e.target.value })} className={field} /></label>
          <label className="block text-sm sm:col-span-2"><span className="mb-1.5 block text-fg-muted">Details the AI may use (optional)</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Venue, dress code, anything you want mentioned. Only what you write here is treated as fact." className={field} /></label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm"><span className="mb-1.5 flex justify-between text-fg-muted"><span>Images per post</span><span>{form.imageCount}</span></span><input type="range" min={1} max={5} value={form.imageCount} onChange={(e) => setForm({ ...form, imageCount: Number(e.target.value) })} className="w-full accent-[var(--accent)]" /></label>
          <div role="radiogroup" aria-label="Image source" className="flex flex-wrap items-end gap-2">
            {([["ai", "AI-generated"], ["mine", `My photos (${assets.length})`], ["mix", "Mix of both"]] as const).map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={form.imageSource === id} disabled={id !== "ai" && assets.length === 0} data-tip={id !== "ai" && assets.length === 0 ? "Add photos in Brand Kit step 6 first" : undefined} onClick={() => setForm({ ...form, imageSource: id })} className={cn("rounded-full border px-3 py-1.5 text-xs disabled:opacity-40", form.imageSource === id ? "border-accent bg-accent/10" : "border-line hover:bg-panel-2")}>{label}</button>
            ))}
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.teaser} onChange={(e) => setForm({ ...form, teaser: e.target.checked })} className="size-4 accent-[var(--accent)]" /> Also post a teaser 3 days before</label>

        <h3 className="mb-2 mt-5 text-sm font-medium">Theme <span className="font-normal text-fg-muted">· {form.themeId === "auto" ? "AI picks the best one from your event" : chosenTheme?.mood}</span></h3>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6" role="radiogroup" aria-label="Theme">
          <li><button type="button" role="radio" aria-checked={form.themeId === "auto"} onClick={() => setForm({ ...form, themeId: "auto" })} className={cn("grid h-full w-full place-items-center gap-1 rounded-xl border p-2 text-center text-xs", form.themeId === "auto" ? "border-accent bg-accent/10" : "border-line hover:bg-panel-2")}><Wand2 className="size-5 text-accent" aria-hidden /> Auto (AI picks)</button></li>
          {THEMES.map((t) => (
            <li key={t.id}>
              <button type="button" role="radio" aria-checked={form.themeId === t.id} onClick={() => setForm({ ...form, themeId: t.id })} className={cn("w-full rounded-xl border p-1.5 text-center text-[11px]", form.themeId === t.id ? "border-accent bg-accent/10" : "border-line hover:bg-panel-2")}>
                <ScaledCanvas size="feed" label={`${t.name} preview`} className="mb-1.5 overflow-hidden rounded-md">
                  <Template family="festival" tokens={applyTheme(tokens, t.id)} content={sampleContent(bundle, "festival")} />
                </ScaledCanvas>
                {t.name}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy || !form.name.trim() || autopilot.platforms.length === 0} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-on-accent disabled:opacity-60">
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />} {busy ? "Creating the post and images…" : "Plan and generate"}
          </button>
          <p className="text-xs text-fg-muted">{autopilot.autoApprove ? "Standing approval is on: clean posts are scheduled automatically." : "Posts land as drafts for you to approve."}</p>
        </div>
      </form>

      {result && (
        <section className={cn(card, "mt-4")} aria-label="Planned posts">
          <h2 className="mb-1 text-sm font-medium">Planned with the {result.themeName} theme</h2>
          <p className="mb-3 text-xs text-fg-muted">Images: {result.provider === "openai" ? "generated by OpenAI" : result.provider === "free" ? "AI-generated by a free image service" : "themed demo artwork"}. {result.notices.join(" ")}</p>
          <ul className="flex flex-wrap gap-4">
            {result.posts.map((p) => (
              <li key={p.id} className="w-44">
                <PostThumb post={p} tokens={tokens} />
                <p className="mt-2 text-sm font-medium">{p.title}</p>
                <p className="text-xs text-fg-muted">{formatDayMonth(postDate(p.scheduledAt))}, {formatTime(p.scheduledAt)} · {p.status === "scheduled" ? "Scheduled" : "Draft"}</p>
                <Link href={`/posts/${p.id}`} className="text-xs text-accent hover:underline">Open editor</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {events.filter((e) => e.businessId === bid).length > 0 && (
        <section className={cn(card, "mt-4")} aria-label="Planned events">
          <h2 className="mb-3 text-sm font-medium">Your events</h2>
          <ul className="divide-y divide-[var(--line)] text-sm">
            {events.filter((e) => e.businessId === bid).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                <span><span className="font-medium">{e.name}</span> <span className="text-xs text-fg-muted">· {formatDayMonth(e.date)} · {getTheme(e.themeId)?.name} · {e.postIds.length} post{e.postIds.length > 1 ? "s" : ""}</span></span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px]", e.status === "ready" ? "bg-green-500/15 text-green-500" : "bg-amber-500/15 text-amber-500")}>{e.status === "ready" ? "Scheduled" : "Needs your review"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
