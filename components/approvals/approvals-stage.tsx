"use client";

import { useMemo, useState } from "react";
import { LayoutGroup } from "framer-motion";
import { ChevronLeft, ChevronRight, Rocket, Send } from "lucide-react";
import { toast } from "sonner";
import { useActiveBundle } from "@/components/providers";
import { useApprovalsFlow } from "@/lib/approvals/use-approvals-flow";
import { useCommand } from "@/lib/use-command";
import { enqueuePost, pickNextApproved } from "@/lib/publishing/runner";
import { tokensFor } from "@/lib/templates/tokens";
import { addDays, monthName } from "@/lib/utils/dates";
import { EventTimeline } from "./event-timeline";
import { QrCard } from "./qr-card";
import { InstagramPhone } from "@/components/phone/instagram-phone";
import { WhatsAppPhone } from "@/components/phone/whatsapp-phone";

const DEFAULT_WEEK = "2026-12-07";

function weekLabel(start: string): string {
  const end = addDays(start, 6);
  const a = Number(start.slice(8));
  const b = Number(end.slice(8));
  return start.slice(5, 7) === end.slice(5, 7)
    ? `${a}–${b} ${monthName(start.slice(0, 7)).slice(0, 3)}`
    : `${a} ${monthName(start.slice(0, 7)).slice(0, 3)} – ${b} ${monthName(end.slice(0, 7)).slice(0, 3)}`;
}

export function ApprovalsStage({ approvalSync }: { approvalSync: boolean }) {
  const bundle = useActiveBundle();
  const tokens = useMemo(() => tokensFor(bundle), [bundle]);
  const [weekStart, setWeekStart] = useState(DEFAULT_WEEK);
  const flow = useApprovalsFlow({ bundle, weekStart, approvalSync });
  const bid = bundle.business.id;

  useCommand("send-previews", () => void flow.sendPreviews());

  function publishNext() {
    const next = pickNextApproved(bid);
    if (!next) {
      toast.info("Nothing approved yet", { description: "Approve a post first. Nothing publishes without approval." });
      return;
    }
    toast(`Publishing “${next.title}”…`);
    enqueuePost(next.id);
  }

  return (
    <LayoutGroup>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))} className="grid size-9 place-items-center rounded-full border border-line bg-panel"><ChevronLeft className="size-4" aria-hidden /></button>
          <h1 className="min-w-52 text-center font-serif text-2xl font-semibold">This week: {weekLabel(weekStart)}</h1>
          <button type="button" aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))} className="grid size-9 place-items-center rounded-full border border-line bg-panel"><ChevronRight className="size-4" aria-hidden /></button>
        </div>
        <button type="button" onClick={() => void flow.sendPreviews()} disabled={flow.sending} className="ml-auto inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent disabled:opacity-60"><Send className="size-4" aria-hidden /> Send this week&apos;s previews</button>
        <button type="button" onClick={publishNext} className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-5 py-2.5 text-sm font-medium hover:bg-panel-2"><Rocket className="size-4" aria-hidden /> Publish next approved post</button>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-x-6 gap-y-10 pb-8">
        <WhatsAppPhone
          businessId={bid}
          tokens={tokens}
          typing={flow.typing}
          awaitingEdit={Boolean(flow.awaitingEdit)}
          onApprove={(postId, cardId) => void flow.approve(postId, "whatsapp", cardId)}
          onEdit={(postId, cardId) => void flow.startEdit(postId, cardId)}
          onSkip={(postId, cardId) => void flow.skip(postId, "whatsapp", cardId)}
          onText={(t) => void flow.ownerText(t)}
        />
        <div className="flex w-full max-w-[200px] flex-col gap-4 self-center">
          <EventTimeline businessId={bid} />
        </div>
        <InstagramPhone bundle={bundle} tokens={tokens} />
      </div>

      {approvalSync && <div className="mx-auto max-w-xl"><QrCard token={flow.token} /></div>}
    </LayoutGroup>
  );
}
