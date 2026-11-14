"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { checkFacts, unresolved } from "@/lib/services/fact-guard";
import { useDemoStore, type ChatMessage } from "@/lib/store";
import type { EditResult } from "@/lib/services/post-edit";
import type { ApprovalEvent } from "@/lib/approvals/types";
import { addDays, formatTime, postDate } from "@/lib/utils/dates";
import { formatDayMonth } from "@/lib/utils/format";
import type { BusinessBundle, Post } from "@/lib/types";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
let counter = 0;
const nextId = () => `m${Date.now()}-${(counter += 1)}`;

/** Moves a post, ignoring moves the state machine no longer allows (e.g. already approved on the other device). */
function safeMove(id: string, to: Post["status"], note: string) {
  try {
    useDemoStore.getState().moveStatus(id, to, note);
  } catch {
    /* already past this state */
  }
}

interface Options {
  bundle: BusinessBundle;
  weekStart: string;
  approvalSync: boolean;
}

export function useApprovalsFlow({ bundle, weekStart, approvalSync }: Options) {
  const bid = bundle.business.id;
  const owner = bundle.business.ownerName.split(" ")[0] ?? "Owner";
  const [typing, setTyping] = useState(false);
  const [awaitingEdit, setAwaitingEdit] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const alive = useRef(true);
  const seen = useRef(new Set<string>());
  const lastEventAt = useRef<string | undefined>(undefined);
  const token = useDemoStore((s) => s.approvalTokens[bid]);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const store = useDemoStore;
  const push = useCallback((m: Omit<ChatMessage, "id" | "at">) => {
    const message: ChatMessage = { ...m, id: nextId(), at: new Date().toISOString() };
    store.getState().pushChat(bid, message);
    return message.id;
  }, [bid, store]);

  const botSays = useCallback(async (m: Omit<ChatMessage, "id" | "at" | "from">, delay = 800) => {
    setTyping(true);
    await sleep(delay);
    setTyping(false);
    push({ from: "bot", ...m });
  }, [push]);

  const weekPosts = useCallback(() => {
    const end = addDays(weekStart, 6);
    return Object.values(store.getState().posts)
      .filter((p) => p.businessId === bid && postDate(p.scheduledAt) >= weekStart && postDate(p.scheduledAt) <= end)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }, [bid, weekStart, store]);

  const approve = useCallback(async (postId: string, via: string, cardId?: string) => {
    const post = store.getState().posts[postId];
    if (!post) return;
    push({ from: "owner", kind: "text", text: via === "whatsapp" ? "✅ Approve" : "✅ Approve (phone link)" });
    if (cardId) store.getState().patchChat(bid, cardId, { choice: "approve" });
    const open = unresolved(checkFacts(`${post.caption}\n${post.cta}`, bundle), post.factConfirmed);
    if (open.length) {
      if (cardId) store.getState().patchChat(bid, cardId, { choice: null });
      await botSays({ kind: "text", text: `Is post mein ek detail verify karni hai: "${open[0]!.text}". Edit dabakar ise hata dein ya badal dein, phir approve karein.` });
      return;
    }
    safeMove(postId, "approved", `Approved on ${via}`);
    safeMove(postId, "scheduled", "Scheduled for its slot");
    store.getState().logApproval(bid, `${owner} approved "${post.title}"`);
    toast.success(`Approved: ${post.title}`, { description: "Calendar updated live." });
    await botSays({ kind: "text", text: `Done! "${post.title}" ${formatDayMonth(postDate(post.scheduledAt))}, ${formatTime(post.scheduledAt)} par schedule ho gaya ✅` });
  }, [bid, bundle, owner, push, botSays, store]);

  const skip = useCallback(async (postId: string, via: string, cardId?: string) => {
    const post = store.getState().posts[postId];
    if (!post) return;
    push({ from: "owner", kind: "text", text: via === "whatsapp" ? "⏭ Skip" : "⏭ Skip (phone link)" });
    if (cardId) store.getState().patchChat(bid, cardId, { choice: "skip" });
    safeMove(postId, "skipped", `Skipped on ${via}`);
    store.getState().logApproval(bid, `${owner} skipped "${post.title}"`);
    await botSays({ kind: "text", text: "Skip kar diya. Koi baat nahi 👍" }, 600);
  }, [bid, owner, push, botSays, store]);

  const startEdit = useCallback(async (postId: string, cardId?: string) => {
    push({ from: "owner", kind: "text", text: "✏️ Edit" });
    if (cardId) store.getState().patchChat(bid, cardId, { choice: "edit" });
    setAwaitingEdit(postId);
    await botSays({ kind: "text", text: "Kya change karna hai?" }, 600);
  }, [bid, push, botSays, store]);

  const showUpdated = useCallback(async (postId: string, summary: string) => {
    await botSays({ kind: "text", text: summary }, 500);
    await botSays({ kind: "post", postId, label: "Updated ✨" }, 700);
  }, [botSays]);

  const ownerText = useCallback(async (text: string) => {
    push({ from: "owner", kind: "text", text });
    const postId = awaitingEdit;
    if (!postId) {
      await botSays({ kind: "text", text: "Pehle kisi post par ✏️ Edit dabaiye, phir batayiye kya badalna hai 🙂" }, 600);
      return;
    }
    setAwaitingEdit(null);
    const post = store.getState().posts[postId];
    if (!post) return;
    setTyping(true);
    try {
      const res = await fetch(`/api/posts/${postId}/edit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId: bid, mode: store.getState().mode, post: { caption: post.caption, hashtags: post.hashtags, cta: post.cta }, instruction: text }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const result = (await res.json()) as EditResult;
      setTyping(false);
      store.getState().editPost(postId, { ...result.revised, factFlags: checkFacts(`${result.revised.caption}\n${result.revised.cta}`, bundle) });
      store.getState().logApproval(bid, `${owner} asked for an edit on "${post.title}"`);
      await showUpdated(postId, result.summary);
    } catch {
      setTyping(false);
      await botSays({ kind: "text", text: "Maaf kijiye, abhi edit nahi ho paya. Dobara try karein." });
    }
  }, [awaitingEdit, bid, bundle, owner, push, botSays, showUpdated, store]);

  const sendPreviews = useCallback(async () => {
    const posts = weekPosts().filter((p) => p.status === "draft" || p.status === "awaiting_approval");
    if (posts.length === 0) {
      toast.info("Nothing to send", { description: "No posts in this week need approval." });
      return;
    }
    setSending(true);
    for (const p of posts) if (p.status === "draft") safeMove(p.id, "awaiting_approval", "Sent for approval");
    if (approvalSync) {
      try {
        const res = await fetch("/api/approvals/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ businessId: bid, weekStart, posts: posts.map((p) => store.getState().posts[p.id]) }),
        });
        if (res.ok) {
          const { token: t } = (await res.json()) as { token: string };
          lastEventAt.current = undefined;
          store.getState().setApprovalToken(bid, t);
        }
      } catch {
        toast.info("Phone link unavailable", { description: "The WhatsApp preview still works." });
      }
    }
    store.getState().logApproval(bid, `Previews sent to ${owner} (${posts.length} posts)`);
    await botSays({ kind: "text", text: `Namaste ${owner} ji! Is hafte ke ${posts.length} posts ready hain 👇` }, 1000);
    for (const p of posts) {
      if (!alive.current) break;
      await botSays({ kind: "post", postId: p.id }, 800);
    }
    setSending(false);
    toast.success("Previews sent", { description: "Approve, edit or skip from the WhatsApp preview." });
  }, [approvalSync, bid, botSays, owner, weekPosts, weekStart, store]);

  // Poll the phone link every 2 s; apply each owner action once.
  useEffect(() => {
    if (!token) return;
    const apply = (e: ApprovalEvent) => {
      if (seen.current.has(e.id)) return;
      seen.current.add(e.id);
      const post = store.getState().posts[e.postId];
      if (!post) return;
      if (e.action === "approve") void approve(e.postId, "phone link");
      else if (e.action === "skip") void skip(e.postId, "phone link");
      else if (e.revised) {
        push({ from: "owner", kind: "text", text: `${e.comment ?? "Edit"} (phone link)` });
        store.getState().editPost(e.postId, { ...e.revised, factFlags: checkFacts(`${e.revised.caption}\n${e.revised.cta}`, bundle) });
        store.getState().logApproval(bid, `${owner} asked for an edit on "${post.title}" from the phone link`);
        void showUpdated(e.postId, e.summary ?? "Post updated.");
      }
    };
    const tick = async () => {
      try {
        const q = lastEventAt.current ? `?since=${encodeURIComponent(lastEventAt.current)}` : "";
        const res = await fetch(`/api/approvals/${token}/events${q}`, { cache: "no-store" });
        if (!res.ok) return;
        const { events } = (await res.json()) as { events: ApprovalEvent[] };
        for (const e of events) {
          apply(e);
          lastEventAt.current = e.at;
        }
      } catch { /* retry on the next tick */ }
    };
    const id = setInterval(() => void tick(), 2000);
    return () => clearInterval(id);
  }, [token, approve, skip, push, showUpdated, bid, bundle, owner, store]);

  return { typing, sending, awaitingEdit, sendPreviews, approve, skip, startEdit, ownerText, token };
}
