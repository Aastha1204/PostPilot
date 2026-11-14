"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, CheckCheck, ChevronDown, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { useActiveBundle } from "@/components/providers";
import { StatusChip } from "@/components/calendar/status";
import { DEMO_TODAY } from "@/lib/demo-clock";
import { useDemoStore } from "@/lib/store";
import { checkFacts, unresolved } from "@/lib/services/fact-guard";
import { FAMILIES, type FamilyId } from "@/lib/templates/schema";
import { sampleContent } from "@/lib/templates/samples";
import { tokensFor } from "@/lib/templates/tokens";
import { addDays, postDate, postTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import type { Platform, Post } from "@/lib/types";
import { AiActions } from "./ai-actions";
import { DesignPanel } from "./design-panel";
import { FactGuardPanel } from "./fact-guard-panel";
import { ReelScriptView } from "./reel-script-view";
import { StatusTimeline } from "./timeline";

const IG_CAPTION_MAX = 2200;
const IG_HASHTAG_MAX = 30;

function useNewPostRedirect(id: string) {
  const bundle = useActiveBundle();
  const addPost = useDemoStore((s) => s.addPost);
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    const family = FAMILIES.find((f) => `new-${f.id}` === id);
    if (!family || done.current) return;
    done.current = true;
    const content = sampleContent(bundle, family.id as FamilyId);
    const now = new Date().toISOString();
    const newId = `${bundle.business.id}-new-${Date.now()}`;
    addPost({
      id: newId, businessId: bundle.business.id, pillarId: bundle.pillars[0]!.id, format: family.format, title: content.headline,
      caption: [content.headline, bundle.brandKit.cta].join("\n"), hashtags: bundle.brandKit.hashtagSets[0]?.tags ?? [], cta: bundle.brandKit.cta,
      visualBrief: "Start from the template sample, then adjust.", templateId: family.id, templateProps: content, photoTags: [],
      scheduledAt: `${addDays(DEMO_TODAY, 1)}T11:00:00+05:30`, status: "draft", platforms: ["instagram", "facebook"], factFlags: [],
      variant: 0, watermark: true, factConfirmed: [], timeline: [], createdAt: now, updatedAt: now,
    });
    router.replace(`/posts/${newId}`);
  }, [id, bundle, addPost, router]);
}

export function PostEditor({ id }: { id: string }) {
  const bundle = useActiveBundle();
  const post = useDemoStore((s) => s.posts[id]);
  const editPost = useDemoStore((s) => s.editPost);
  const updatePost = useDemoStore((s) => s.updatePost);
  const moveStatus = useDemoStore((s) => s.moveStatus);
  const [tag, setTag] = useState("");
  const [briefOpen, setBriefOpen] = useState(false);
  const tokens = useMemo(() => tokensFor(bundle), [bundle]);
  useNewPostRedirect(id);

  if (!post) {
    return (
      <div className="grid max-w-md gap-3 rounded-card border border-line bg-panel p-8">
        <h1 className="font-serif text-2xl font-semibold">Post not found</h1>
        <p className="text-sm text-fg-muted">It may belong to another business or have been cleared by Reset demo.</p>
        <Link href="/calendar" className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-on-accent"><ArrowLeft className="size-4" aria-hidden /> Back to calendar</Link>
      </div>
    );
  }

  const locked = post.status === "published" || post.status === "publishing";
  const pillar = bundle.pillars.find((p) => p.id === post.pillarId);
  const flags = checkFacts(`${post.caption}\n${post.cta}`, bundle);
  const open = unresolved(flags, post.factConfirmed);
  const tagLimit = bundle.brandKit.preferredHashtagCount;
  const blockers = [
    open.length > 0 && "Fact guard has unresolved items",
    post.caption.length > IG_CAPTION_MAX && "Caption is over 2,200 characters",
    post.hashtags.length > IG_HASHTAG_MAX && "More than 30 hashtags",
    post.platforms.length === 0 && "Pick at least one platform",
  ].filter((b): b is string => Boolean(b));

  function commit(patch: Partial<Post>) {
    const next = { ...patch };
    if (patch.caption !== undefined || patch.cta !== undefined) {
      const caption = patch.caption ?? post!.caption;
      const cta = patch.cta ?? post!.cta;
      next.factFlags = checkFacts(`${caption}\n${cta}`, bundle);
    }
    if (editPost(post!.id, next)) toast.info("Approval reset", { description: "You edited an approved post, so it needs approving again." });
  }

  function approve() {
    const stillDraft = post!.status === "draft" || post!.status === "awaiting_approval";
    if (!stillDraft || blockers.length) return;
    moveStatus(post!.id, "approved", "Approved in editor");
    moveStatus(post!.id, "scheduled", "Scheduled for its slot");
    toast.success("Approved and scheduled", { description: "It publishes at its slot once the queue runs." });
  }

  function addTag() {
    const clean = `#${tag.replace(/[^\p{L}\p{N}_]/gu, "")}`;
    setTag("");
    if (clean.length > 1 && !post!.hashtags.includes(clean)) commit({ hashtags: [...post!.hashtags, clean] });
  }

  const togglePlatform = (p: Platform) => commit({ platforms: post.platforms.includes(p) ? post.platforms.filter((x) => x !== p) : [...post.platforms, p] });
  const captionOver = post.caption.length > IG_CAPTION_MAX;
  const field = "w-full rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm disabled:opacity-60";

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/calendar" aria-label="Back to calendar" className="grid size-9 place-items-center rounded-full border border-line bg-panel"><ArrowLeft className="size-4" aria-hidden /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-2xl font-semibold">{post.title}</h1>
          <p className="text-sm text-fg-muted">{pillar?.name} · <span className="capitalize">{post.format}</span></p>
        </div>
        <StatusChip status={post.status} />
        {post.status === "skipped" ? (
          <button type="button" onClick={() => moveStatus(post.id, "draft", "Restored")} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm"><RotateCcw className="size-4" aria-hidden /> Restore</button>
        ) : (
          <>
            {!locked && <button type="button" onClick={() => { moveStatus(post.id, "skipped", "Skipped in editor"); toast("Post skipped"); }} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:bg-panel-2"><Ban className="size-4" aria-hidden /> Skip</button>}
            {(post.status === "draft" || post.status === "awaiting_approval") && (
              <button type="button" onClick={approve} disabled={blockers.length > 0} data-tip={blockers[0]} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-on-accent disabled:cursor-not-allowed disabled:opacity-50"><CheckCheck className="size-4" aria-hidden /> Approve</button>
            )}
          </>
        )}
      </div>
      {locked && <p className="mb-4 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm text-fg-muted">This post is {post.status}, so it can no longer be edited.</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <DesignPanel post={post} tokens={tokens} locked={locked} onChange={commit} />

        <div className="space-y-4">
          <section className="rounded-card border border-line bg-panel p-4">
            <label htmlFor="caption" className="mb-1.5 block text-sm font-medium">Caption</label>
            <textarea id="caption" rows={9} value={post.caption} disabled={locked} onChange={(e) => commit({ caption: e.target.value })} className={cn(field, "resize-y leading-relaxed")} />
            <p className={cn("mt-1 text-right text-xs", captionOver ? "text-red-400" : "text-fg-muted")}>{post.caption.length.toLocaleString("en-IN")} / 2,200</p>

            <h3 className="mb-1.5 mt-3 text-sm font-medium">Hashtags</h3>
            <ul className="flex flex-wrap gap-1.5">
              {post.hashtags.map((h) => (
                <li key={h} className="inline-flex items-center gap-1 rounded-full bg-panel-2 py-1 pl-3 pr-1.5 text-xs">
                  {h}
                  <button type="button" aria-label={`Remove ${h}`} disabled={locked} onClick={() => commit({ hashtags: post.hashtags.filter((x) => x !== h) })} className="grid size-4 place-items-center rounded-full hover:bg-panel"><X className="size-3" aria-hidden /></button>
                </li>
              ))}
            </ul>
            <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); addTag(); }}>
              <input value={tag} onChange={(e) => setTag(e.target.value)} disabled={locked} aria-label="Add a hashtag" placeholder="Add hashtag" className={field} />
              <button type="submit" disabled={locked || !tag.trim()} className="rounded-xl border border-line px-4 text-sm disabled:opacity-50">Add</button>
            </form>
            <p className={cn("mt-1 text-xs", post.hashtags.length > IG_HASHTAG_MAX ? "text-red-400" : post.hashtags.length > tagLimit ? "text-amber-500" : "text-fg-muted")}>
              {post.hashtags.length} / {IG_HASHTAG_MAX}
              {post.hashtags.length > tagLimit && post.hashtags.length <= IG_HASHTAG_MAX && ` · above the brand's preferred ${tagLimit}`}
            </p>

            <label htmlFor="cta" className="mb-1.5 mt-3 block text-sm font-medium">Call to action</label>
            <input id="cta" value={post.cta} disabled={locked} onChange={(e) => commit({ cta: e.target.value })} className={field} />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="date" className="mb-1.5 block text-sm font-medium">Date (IST)</label>
                <input id="date" type="date" min={DEMO_TODAY} value={postDate(post.scheduledAt)} disabled={locked} onChange={(e) => e.target.value && commit({ scheduledAt: `${e.target.value}T${postTime(post.scheduledAt)}:00+05:30` })} className={field} />
              </div>
              <div>
                <label htmlFor="time" className="mb-1.5 block text-sm font-medium">Time (IST)</label>
                <input id="time" type="time" value={postTime(post.scheduledAt)} disabled={locked} onChange={(e) => e.target.value && commit({ scheduledAt: `${postDate(post.scheduledAt)}T${e.target.value}:00+05:30` })} className={field} />
              </div>
            </div>
            <fieldset className="mt-4" disabled={locked}>
              <legend className="mb-1.5 text-sm font-medium">Publish to</legend>
              <div className="flex gap-5 text-sm">
                {(["instagram", "facebook", "linkedin", "x"] as const).map((p) => (
                  <label key={p} className="flex items-center gap-2 capitalize"><input type="checkbox" checked={post.platforms.includes(p)} onChange={() => togglePlatform(p)} className="size-4 accent-[var(--accent)]" />{p === "facebook" ? "Facebook Page" : p === "linkedin" ? "LinkedIn (preview)" : p === "x" ? "X (preview)" : "Instagram"}</label>
                ))}
              </div>
            </fieldset>
          </section>

          <AiActions businessId={bundle.business.id} postId={post.id} post={{ caption: post.caption, hashtags: post.hashtags, cta: post.cta }} disabled={locked} onAccept={(r) => { commit({ caption: r.caption, hashtags: r.hashtags, cta: r.cta }); toast.success("Caption updated"); }} />

          <FactGuardPanel flags={flags} confirmed={post.factConfirmed} disabled={locked} onToggleConfirm={(text) => updatePost(post.id, { factConfirmed: post.factConfirmed.includes(text) ? post.factConfirmed.filter((t) => t !== text) : [...post.factConfirmed, text] })} />

          {post.format === "reel" && <ReelScriptView post={post} ownerName={bundle.business.ownerName} onSend={() => updatePost(post.id, { timeline: [...post.timeline, { status: post.status, at: new Date().toISOString(), note: "Reel script sent to owner" }] })} />}

          <section className="rounded-card border border-line bg-panel">
            <button type="button" aria-expanded={briefOpen} onClick={() => setBriefOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium">
              Visual brief <ChevronDown className={cn("size-4 transition-transform", briefOpen && "rotate-180")} aria-hidden />
            </button>
            {briefOpen && <p className="px-4 pb-4 text-sm text-fg-muted">{post.visualBrief}</p>}
          </section>
        </div>
      </div>

      <section className="mt-6 rounded-card border border-line bg-panel p-4">
        <h2 className="mb-3 text-sm font-medium">Status timeline</h2>
        <StatusTimeline post={post} />
      </section>
    </>
  );
}
