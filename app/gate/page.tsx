"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

function GateForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch("/api/gate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(true);
      return;
    }
    const next = params.get("next");
    router.replace(next && next.startsWith("/") ? next : "/calendar");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="glass w-full max-w-sm rounded-card p-6">
      <span className="mb-4 grid size-10 place-items-center rounded-xl bg-accent text-on-accent">
        <Lock className="size-5" aria-hidden />
      </span>
      <h1 className="font-serif text-2xl font-semibold">Private demo</h1>
      <p className="mt-1 text-sm text-fg-muted">Enter the passcode shared with you by Neovia AI.</p>
      <label htmlFor="passcode" className="mt-5 block text-sm font-medium">Passcode</label>
      <input
        id="passcode"
        type="password"
        autoFocus
        autoComplete="off"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        aria-invalid={error}
        aria-describedby={error ? "passcode-error" : undefined}
        className="mt-1.5 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm"
      />
      {error && <p id="passcode-error" role="alert" className="mt-2 text-sm text-red-400">That passcode did not match. Try again.</p>}
      <button
        type="submit"
        disabled={busy || !passcode}
        className="mt-5 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-on-accent disabled:opacity-60"
      >
        {busy ? "Checking…" : "Enter demo"}
      </button>
    </form>
  );
}

export default function GatePage() {
  return (
    <main className="relative z-10 grid min-h-dvh place-items-center px-4">
      <Suspense>
        <GateForm />
      </Suspense>
    </main>
  );
}
