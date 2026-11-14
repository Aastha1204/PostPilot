"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Pencil, SkipForward } from "lucide-react";
import { PostThumb } from "@/components/calendar/post-thumb";
import { getBundle } from "@/lib/seed";
import type { ApprovalSession } from "@/lib/approvals/types";
import { tokensFor } from "@/lib/templates/tokens";
import { cn } from "@/lib/utils/cn";
import { formatTime, postDate } from "@/lib/utils/dates";
import { formatDayMonth } from "@/lib/utils/format";
import { brandCssVars } from "@/lib/utils/theme";
import type { Post } from "@/lib/types";

type Outcome = "approve" | "skip";

export function MobileApprove({ token }: { token: string }) {
  const [session, setSession] = useState<ApprovalSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/approvals/${token}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("missing"))))
      .then((s: ApprovalSession) => { setSession(s); setPosts(s.posts); })
      .catch(() => setError("This approval link isn't valid any more. Ask Neovia AI for a fresh one."));
  }, [token]);

  const bundle = session ? getBundle(session.businessId) : null;
  const tokens = useMemo(() => (bundle ? tokensFor(bundle) : null), [bundle]);
  const vars = bundle ? (brandCssVars(bundle, "light") as React.CSSProperties) : undefined;

  async function act(post: Post, action: "approve" | "edit" | "skip", comment?: string) {
    setBusy(post.id);
    setNotes((n) => ({ ...n, [post.id]: "" }));
    try {
      const res = await fetch(`/api/approvals/${token}/action`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ postId: post.id, action, comment }) });
      const data = (await res.json()) as { post?: Post; error?: string; blocked?: string[] };
      if (!res.ok || !data.post) {
        const blocked = data.blocked?.length ? ` Check: "${data.blocked[0]}". Tap Edit and ask us to change it.` : "";
        setNotes((n) => ({ ...n, [post.id]: `${data.error ?? "Something went wrong."}${blocked}` }));
        return;
      }
      setPosts((list) => list.map((p) => (p.id === post.id ? data.post! : p)));
      if (action === "edit") {
        setEditing(null);
        setText("");
        setNotes((n) => ({ ...n, [post.id]: "Updated ✨ Have a look, then approve." }));
      } else setOutcomes((o) => ({ ...o, [post.id]: action }));
    } catch {
      setNotes((n) => ({ ...n, [post.id]: "No connection. Please try again." }));
    } finally {
      setBusy(null);
    }
  }

  if (error) return <main className="grid min-h-dvh place-items-center bg-[#f6f5f8] p-6 text-center text-[#14131a]"><p className="max-w-xs">{error}</p></main>;
  if (!session || !bundle || !tokens) return <main className="grid min-h-dvh place-items-center bg-[#f6f5f8]"><div className="skeleton h-72 w-56" aria-label="Loading" /></main>;

  return (
    <main style={vars} className="min-h-dvh bg-[#f6f5f8] pb-8 text-[#14131a]">
      <header className="px-5 pb-3 pt-6">
        <p className="text-xs font-medium text-[var(--accent)]">{bundle.business.name}</p>
        <h1 className="font-serif text-2xl font-semibold">Namaste {bundle.business.ownerName.split(" ")[0]} ji 🙏</h1>
        <p className="text-sm text-[#5b5968]">{posts.length} posts to look at. Swipe sideways to see each one.</p>
      </header>

      <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2" aria-label="Posts to approve">
        {posts.map((post) => {
          const outcome = outcomes[post.id];
          return (
            <li key={post.id} className="relative w-[84vw] max-w-sm shrink-0 snap-center rounded-3xl bg-white p-3 shadow-lg">
              <PostThumb post={post} tokens={tokens} className="overflow-hidden rounded-2xl" />
              <p className="mt-3 text-xs text-[#5b5968]">{formatDayMonth(postDate(post.scheduledAt))}, {formatTime(post.scheduledAt)} IST</p>
              <h2 className="font-medium">{post.title}</h2>
              <p className="mt-1 line-clamp-6 whitespace-pre-line text-sm leading-snug text-[#3a3846]">{post.caption}</p>
              {notes[post.id] && <p role="status" className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{notes[post.id]}</p>}

              {editing === post.id ? (
                <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) void act(post, "edit", text.trim()); }}>
                  <label htmlFor={`edit-${post.id}`} className="text-sm font-medium">Kya change karna hai?</label>
                  <textarea id={`edit-${post.id}`} value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <button type="submit" disabled={busy === post.id || !text.trim()} className="flex-1 rounded-full bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--on-accent)] disabled:opacity-50">{busy === post.id ? "Updating…" : "Send"}</button>
                    <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-black/15 px-4 text-sm">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button type="button" disabled={busy === post.id || Boolean(outcome)} onClick={() => void act(post, "approve")} className="flex flex-col items-center gap-1 rounded-2xl bg-[var(--accent)] py-3 text-xs font-medium text-[var(--on-accent)] disabled:opacity-40"><Check className="size-5" aria-hidden /> Approve</button>
                  <button type="button" disabled={busy === post.id || Boolean(outcome)} onClick={() => { setEditing(post.id); setText(""); }} className="flex flex-col items-center gap-1 rounded-2xl border border-black/15 py-3 text-xs font-medium disabled:opacity-40"><Pencil className="size-5" aria-hidden /> Edit</button>
                  <button type="button" disabled={busy === post.id || Boolean(outcome)} onClick={() => void act(post, "skip")} className="flex flex-col items-center gap-1 rounded-2xl border border-black/15 py-3 text-xs font-medium disabled:opacity-40"><SkipForward className="size-5" aria-hidden /> Skip</button>
                </div>
              )}

              <AnimatePresence>
                {outcome && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 grid place-items-center rounded-3xl bg-white/90 text-center">
                    <div>
                      <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.25, 1] }} transition={{ duration: 0.5 }} className={cn("mx-auto grid size-16 place-items-center rounded-full", outcome === "approve" ? "bg-green-500 text-white" : "bg-gray-400 text-white")}>
                        {outcome === "approve" ? <Check className="size-9" aria-hidden /> : <SkipForward className="size-8" aria-hidden />}
                      </motion.span>
                      <p className="mt-3 font-medium">{outcome === "approve" ? "Approved!" : "Skipped"}</p>
                      <p className="text-xs text-[#5b5968]">{outcome === "approve" ? "Scheduled for its slot." : "We'll leave this one out."}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
      <footer className="mt-4 text-center text-xs text-[#5b5968]">Powered by PostPilot · Neovia AI</footer>
    </main>
  );
}
