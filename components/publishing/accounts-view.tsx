"use client";

import { useCallback, useEffect, useState } from "react";
import { Camera, CircleCheck, Flag, MessageCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useActiveBundle } from "@/components/providers";
import { BusinessLogo } from "@/components/shell/business-logo";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils/cn";

interface Status {
  live: boolean;
  quota: { used: number; total: number; source: "live" | "demo" | "fallback" };
  instagram: { configured: boolean };
  facebook: { configured: boolean };
  whatsapp: { configured: boolean };
}

export function AccountsView() {
  const { business, brandKit } = useActiveBundle();
  const mode = useDemoStore((s) => s.mode);
  const extra = useDemoStore((s) => s.quotaUsedExtra);
  const [status, setStatus] = useState<Status | null>(null);
  const [connected, setConnected] = useState<Record<string, boolean>>({ instagram: true, facebook: true, whatsapp: true });
  const [lastSync, setLastSync] = useState<string>("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/accounts/status?mode=${mode}&used=${12 + extra}`, { cache: "no-store" });
      if (res.ok) setStatus((await res.json()) as Status);
      setLastSync(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }));
    } catch {
      toast.error("Couldn't refresh account status");
    }
  }, [mode, extra]);

  useEffect(() => { void load(); }, [load]);

  const demo = mode === "demo";
  const quota = status?.quota;
  const pct = quota ? Math.min(100, (quota.used / quota.total) * 100) : 0;
  const owner = business.ownerWhatsapp.replace(/\d(?=\d{3})/g, "x");

  const cards = [
    { id: "instagram", name: "Instagram professional account", handle: business.handle, icon: Camera, ok: demo || status?.instagram.configured, detail: "Publishes feed images and carousels" },
    { id: "facebook", name: "Facebook Page", handle: `${business.shortName} Page`, icon: Flag, ok: demo || status?.facebook.configured, detail: "Photo posts with the same caption" },
    { id: "whatsapp", name: "WhatsApp Business number", handle: owner, icon: MessageCircle, ok: demo || status?.whatsapp.configured, detail: "Weekly approval previews" },
  ] as const;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map(({ id, name, handle, icon: Icon, ok, detail }) => {
          const isConnected = connected[id] && ok;
          return (
            <section key={id} className="rounded-card border border-line bg-panel p-5" aria-label={name}>
              <div className="flex items-start gap-3">
                <BusinessLogo business={business} kit={brandKit} className="size-11 rounded-full" />
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-sm font-medium"><Icon className="size-4 text-accent" aria-hidden /> {name}</h2>
                  <p className="truncate text-sm text-fg-muted">{handle}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-fg-muted">{detail}</p>
              <dl className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between"><dt className="text-fg-muted">Status</dt><dd className={cn("inline-flex items-center gap-1", isConnected ? "text-green-500" : "text-amber-500")}>{isConnected && <CircleCheck className="size-3.5" aria-hidden />}{isConnected ? (demo ? "Connected (preview)" : "Connected") : "Not connected"}</dd></div>
                <div className="flex justify-between"><dt className="text-fg-muted">Token expiry</dt><dd>{demo ? "59 days (simulated)" : "Checked by Meta"}</dd></div>
                <div className="flex justify-between"><dt className="text-fg-muted">Last sync</dt><dd>{lastSync ? `${lastSync} IST` : "—"}</dd></div>
              </dl>
              <div className="mt-4 flex gap-2">
                {demo ? (
                  <button type="button" onClick={() => { setConnected((c) => ({ ...c, [id]: true })); toast.success("Simulated connection", { description: "Preview only. Live mode uses real Meta credentials." }); }} className="rounded-full border border-line px-4 py-1.5 text-xs hover:bg-panel-2">Connect (simulated)</button>
                ) : (
                  <button type="button" onClick={() => void load().then(() => toast.success("Status refreshed"))} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-xs hover:bg-panel-2"><RefreshCw className="size-3" aria-hidden /> Verify connection</button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-4 rounded-card border border-line bg-panel p-5" aria-label="Publishing quota">
        <h2 className="mb-2 text-sm font-medium">Publishing quota</h2>
        <p className="text-2xl font-semibold">{quota ? `${quota.used} of ${quota.total}` : "…"} <span className="text-sm font-normal text-fg-muted">used in the last 24 h</span></p>
        <div className="mt-3 h-2 rounded-full bg-panel-2" role="progressbar" aria-valuenow={quota?.used ?? 0} aria-valuemin={0} aria-valuemax={quota?.total ?? 50}><div className={cn("h-full rounded-full", pct > 85 ? "bg-red-500" : "bg-accent")} style={{ width: `${pct}%` }} /></div>
        <p className="mt-2 text-xs text-fg-muted">{quota?.source === "live" ? "Read from Meta's content_publishing_limit." : quota?.source === "fallback" ? "Meta's limit couldn't be read, so the configured fallback is shown." : "Demo data. A carousel counts as one post. When the limit is reached, jobs wait with a visible reason."}</p>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          { name: "Comment & DM auto-replies", text: "Answer common questions on Instagram automatically, with your approval rules." },
          { name: "Google Business Profile posts", text: "Send approved updates to your Google listing too." },
        ].map((c) => (
          <section key={c.name} className="rounded-card border border-dashed border-line bg-panel/60 p-5">
            <span className="rounded-full bg-panel-2 px-2 py-0.5 text-[11px] text-fg-muted">Coming soon</span>
            <h2 className="mt-2 text-sm font-medium">{c.name}</h2>
            <p className="mt-1 text-xs text-fg-muted">{c.text}</p>
          </section>
        ))}
      </div>
    </>
  );
}
