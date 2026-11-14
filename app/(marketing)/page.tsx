"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Providers, useActiveBundle } from "@/components/providers";
import { BusinessLogo } from "@/components/shell/business-logo";
import { HeroStage } from "@/components/three/hero-stage";
import { useDemoStore } from "@/lib/store";
import { getSeedBundles } from "@/lib/seed";
import { cn } from "@/lib/utils/cn";

function Landing() {
  const active = useActiveBundle();
  const setActive = useDemoStore((s) => s.setActiveBusiness);

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col px-6 py-14">
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-sm font-medium text-accent">PostPilot</p>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            A month of on-brand posts. Approved on WhatsApp. Published on time.
          </h1>
          <p className="mt-5 max-w-xl text-fg-muted">Pick a business to preview how PostPilot would run its Instagram and Facebook.</p>
          <Link href="/calendar" className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent">
            Start demo <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <HeroStage bundle={active} />
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Choose a demo business">
        {getSeedBundles().map(({ business, brandKit }) => {
          const selected = business.id === active.business.id;
          return (
            <li key={business.id}>
              <button type="button" aria-pressed={selected} onClick={() => setActive(business.id)} className={cn("relative w-full rounded-card border bg-panel p-5 text-left hover:bg-panel-2", selected ? "border-accent" : "border-line")}>
                {selected && <Check className="absolute right-4 top-4 size-4 text-accent" aria-hidden />}
                <BusinessLogo business={business} kit={brandKit} className="size-11" />
                <span className="mt-4 block font-medium">{business.name}</span>
                <span className="block text-sm text-fg-muted">{business.city}</span>
                <span className="mt-3 block text-sm">{business.tagline}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <footer className="mt-auto pt-16 text-xs text-fg-muted">Built by Neovia AI</footer>
    </main>
  );
}

export default function LandingPage() {
  return (
    <Providers>
      <Landing />
    </Providers>
  );
}
