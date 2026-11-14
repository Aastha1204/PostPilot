"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Smartphone } from "lucide-react";
import { toast } from "sonner";

export function QrCard({ token }: { token: string | undefined }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(process.env.NEXT_PUBLIC_APP_URL || window.location.origin), []);
  const url = token ? `${origin}/m/approve/${token}` : null;
  const local = /localhost|127\.0\.0\.1/.test(origin);

  return (
    <section aria-label="Approve on your own phone" className="rounded-card border border-line bg-panel p-4 text-sm">
      <h2 className="mb-1 flex items-center gap-2 font-medium"><Smartphone className="size-4 text-accent" aria-hidden /> Approve on your own phone</h2>
      {url ? (
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-white p-2"><QRCodeSVG value={url} size={112} aria-label="QR code for the phone approval link" /></div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs text-fg-muted">Scan to approve, edit or skip from any phone. No login. Actions appear here within a couple of seconds.</p>
            <p className="break-all rounded-lg bg-panel-2 px-2 py-1 font-mono text-[10px]" data-testid="approval-url">{url}</p>
            {local && <p className="text-xs text-amber-500">This address only works on this computer. Open the app through your laptop&apos;s network address so a phone can reach it.</p>}
            <button type="button" onClick={() => { void navigator.clipboard?.writeText(url); toast.success("Link copied"); }} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs hover:bg-panel-2"><Copy className="size-3" aria-hidden /> Copy link</button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-fg-muted">Send this week&apos;s previews and a QR code appears here.</p>
      )}
    </section>
  );
}
