"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Send } from "lucide-react";
import { PostThumb } from "@/components/calendar/post-thumb";
import { useDemoStore, type ChatMessage } from "@/lib/store";
import type { DesignTokens } from "@/lib/templates/tokens";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatIstTime24 } from "@/lib/utils/format";
import { motion } from "framer-motion";
import { PhoneFrame } from "./phone-frame";

interface Props {
  businessId: string;
  tokens: DesignTokens;
  typing: boolean;
  awaitingEdit: boolean;
  onApprove: (postId: string, cardId: string) => void;
  onEdit: (postId: string, cardId: string) => void;
  onSkip: (postId: string, cardId: string) => void;
  onText: (text: string) => void;
}

const BUTTONS = [
  { id: "approve", label: "✅ Approve" },
  { id: "edit", label: "✏️ Edit" },
  { id: "skip", label: "⏭ Skip" },
] as const;

function PostBubble({ message, post, tokens, onAct }: { message: ChatMessage; post: Post; tokens: DesignTokens; onAct: (a: "approve" | "edit" | "skip") => void }) {
  const published = post.status === "published";
  const done = post.status === "scheduled" || post.status === "approved" || post.status === "skipped" || published;
  return (
    <div className="max-w-[88%] rounded-xl rounded-tl-sm bg-[#1f2c34] p-1.5 text-[12px] text-white/90">
      {message.label && <p className="px-1.5 pb-1 text-[11px] font-medium text-[#53bdeb]">{message.label}</p>}
      {published ? (
        <p className="px-2 py-3 text-center text-[11px] text-green-400">Published ✓ See it on Instagram →</p>
      ) : (
        <motion.div layoutId={`post-${post.id}`} className="overflow-hidden rounded-lg"><PostThumb post={post} tokens={tokens} className="overflow-hidden rounded-lg" /></motion.div>
      )}
      <p className="line-clamp-5 whitespace-pre-line px-1.5 pt-1.5 leading-snug">{post.caption}</p>
      <p className="px-1.5 pb-1 pt-1 text-right text-[10px] text-white/40">{formatIstTime24(message.at)}</p>
      <div className="grid gap-1 border-t border-white/10 pt-1">
        {BUTTONS.map((b) => {
          const chosen = message.choice === b.id;
          return (
            <button
              key={b.id}
              type="button"
              disabled={Boolean(message.choice) || done}
              onClick={() => onAct(b.id)}
              className={cn("flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] font-medium text-[#53bdeb] hover:bg-white/5 disabled:cursor-default disabled:hover:bg-transparent", chosen && "bg-[#53bdeb]/15", (Boolean(message.choice) || done) && !chosen && "opacity-40")}
            >
              {chosen && <Check className="size-3.5" aria-hidden />}
              {b.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WhatsAppPhone({ businessId, tokens, typing, awaitingEdit, onApprove, onEdit, onSkip, onText }: Props) {
  const messages = useDemoStore((s) => s.chats[businessId]);
  const posts = useDemoStore((s) => s.posts);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const list = messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [list.length, typing]);

  return (
    <PhoneFrame label="WhatsApp preview" baseRotateY={12}>
      <div className="flex h-full flex-col bg-[#0b141a]">
        <header className="flex items-center gap-2 bg-[#1f2c34] px-3 pb-2 pt-9">
          <span className="grid size-8 place-items-center rounded-full bg-[#25d366] text-[11px] font-bold text-[#0b141a]">PP</span>
          <span className="leading-tight">
            <span className="block text-[13px] font-medium text-white">PostPilot by Neovia</span>
            <span className="block text-[10px] text-white/50">{typing ? "typing…" : "business account"}</span>
          </span>
        </header>
        <div className="flex-1 space-y-2 overflow-y-auto px-2.5 py-3" role="log" aria-label="WhatsApp conversation" aria-live="polite">
          {list.length === 0 && <p className="mx-auto mt-16 max-w-[200px] text-center text-[11px] text-white/40">Press “Send this week’s previews” to start the conversation.</p>}
          {list.map((m) => {
            const post = m.postId ? posts[m.postId] : undefined;
            if (m.kind === "post" && post) {
              return (
                <div key={m.id} className="flex">
                  <PostBubble message={m} post={post} tokens={tokens} onAct={(a) => (a === "approve" ? onApprove(post.id, m.id) : a === "edit" ? onEdit(post.id, m.id) : onSkip(post.id, m.id))} />
                </div>
              );
            }
            const mine = m.from === "owner";
            return (
              <div key={m.id} className={cn("flex", mine && "justify-end")}>
                <p className={cn("max-w-[82%] rounded-xl px-2.5 py-1.5 text-[12px] leading-snug text-white/90", mine ? "rounded-tr-sm bg-[#005c4b]" : "rounded-tl-sm bg-[#1f2c34]")}>
                  {m.text}
                  <span className="ml-2 inline-flex items-center gap-0.5 align-bottom text-[9px] text-white/40">{formatIstTime24(m.at)}{mine && <CheckCheck className="size-3 text-[#53bdeb]" aria-hidden />}</span>
                </p>
              </div>
            );
          })}
          {typing && (
            <div className="flex" aria-label="Typing">
              <span className="flex gap-1 rounded-xl rounded-tl-sm bg-[#1f2c34] px-3 py-2.5">
                {[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-bounce rounded-full bg-white/50" style={{ animationDelay: `${i * 140}ms` }} />)}
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <form className="flex items-center gap-2 bg-[#0b141a] px-2.5 pb-4 pt-2" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { onText(draft.trim()); setDraft(""); } }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Reply to PostPilot" placeholder={awaitingEdit ? "Kya change karna hai?" : "Type a message"} className="min-w-0 flex-1 rounded-full bg-[#1f2c34] px-3.5 py-2 text-[12px] text-white placeholder:text-white/40" />
          <button type="submit" aria-label="Send" disabled={!draft.trim()} className="grid size-8 place-items-center rounded-full bg-[#00a884] text-white disabled:opacity-40"><Send className="size-4" aria-hidden /></button>
        </form>
      </div>
    </PhoneFrame>
  );
}
