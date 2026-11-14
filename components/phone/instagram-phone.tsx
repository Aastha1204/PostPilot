"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Heart } from "lucide-react";
import { PostThumb } from "@/components/calendar/post-thumb";
import { BusinessLogo } from "@/components/shell/business-logo";
import { useDemoStore } from "@/lib/store";
import type { DesignTokens } from "@/lib/templates/tokens";
import type { BusinessBundle } from "@/lib/types";
import { PhoneFrame } from "./phone-frame";

export function InstagramPhone({ bundle, tokens }: { bundle: BusinessBundle; tokens: DesignTokens }) {
  const { business, brandKit } = bundle;
  const posts = useDemoStore((s) => s.posts);
  const mine = Object.values(posts).filter((p) => p.businessId === business.id);
  const published = mine.filter((p) => p.status === "published").sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  const upcoming = mine.filter((p) => p.status === "scheduled" || p.status === "approved" || p.status === "publishing").sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  // A like-burst plays on a tile the moment its post becomes published.
  const known = useRef<Set<string> | null>(null);
  const [burst, setBurst] = useState<string | null>(null);
  useEffect(() => {
    const ids = new Set(published.map((p) => p.id));
    if (known.current) {
      const fresh = [...ids].find((id) => !known.current!.has(id));
      if (fresh) {
        setBurst(fresh);
        const t = setTimeout(() => setBurst(null), 1600);
        known.current = ids;
        return () => clearTimeout(t);
      }
    }
    known.current = ids;
  }, [published]);

  const tile = (content: React.ReactNode, key: string) => (
    <div key={key} className="relative aspect-[4/5] overflow-hidden bg-[#16161d]">{content}</div>
  );

  return (
    <PhoneFrame label="Instagram preview" baseRotateY={-12}>
      <div className="flex h-full flex-col overflow-y-auto bg-black pb-4 text-white">
        <div className="px-3 pb-2 pt-9">
          <p className="text-[13px] font-semibold">{business.handle.replace("@", "")}</p>
          <div className="mt-2 flex items-center gap-4">
            <BusinessLogo business={business} kit={brandKit} className="size-14 rounded-full" />
            <dl className="flex flex-1 justify-around text-center text-[11px]">
              <div><dt className="text-white/60">Posts</dt><dd className="text-[13px] font-semibold">{published.length}</dd></div>
              <div><dt className="text-white/60">Followers</dt><dd className="text-[13px] font-semibold">—</dd></div>
              <div><dt className="text-white/60">Following</dt><dd className="text-[13px] font-semibold">—</dd></div>
            </dl>
          </div>
          <p className="mt-2 text-[12px] font-medium">{business.name}</p>
          <p className="text-[11px] leading-snug text-white/70">{business.tagline}<br />{business.city}</p>
          <ul className="mt-3 flex gap-3 overflow-x-auto" aria-label="Highlights">
            {brandKit.services.slice(0, 4).map((s) => (
              <li key={s} className="w-12 shrink-0 text-center">
                <span className="mx-auto grid size-11 place-items-center rounded-full border border-white/25 text-[10px]" style={{ background: tokens.accent, color: tokens.onAccent }}>{s.slice(0, 1)}</span>
                <span className="mt-1 block truncate text-[9px] text-white/70">{s.split(" ")[0]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-3 gap-px border-t border-white/10">
          {upcoming.map((p) => tile((
            <>
              <div className="absolute inset-x-0 top-0 opacity-45"><PostThumb post={p} tokens={tokens} className="w-full" /></div>
              <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-black/70" aria-label="Scheduled"><Clock className="size-3" aria-hidden /></span>
            </>
          ), `u-${p.id}`))}
          {published.map((p) => tile((
            <>
              <motion.div layoutId={`post-${p.id}`} className="absolute inset-x-0 top-0"><PostThumb post={p} tokens={tokens} className="w-full" /></motion.div>
              <AnimatePresence>
                {burst === p.id && (
                  <motion.span key="burst" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1.4, y: -14 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }} className="absolute inset-0 grid place-items-center text-red-500" aria-hidden>
                    <Heart className="size-10 fill-current" />
                  </motion.span>
                )}
              </AnimatePresence>
            </>
          ), `p-${p.id}`))}
        </div>
      </div>
    </PhoneFrame>
  );
}
