"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { ScaledCanvas } from "@/components/templates/scaled-canvas";
import { Template } from "@/components/templates/template";
import { sampleContent } from "@/lib/templates/samples";
import { tokensFor } from "@/lib/templates/tokens";
import type { BusinessBundle } from "@/lib/types";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false, loading: () => <div className="skeleton size-full" aria-label="Loading 3D scene" /> });

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Static stack of real designs: the fallback when WebGL is missing or reduced motion is on. */
function StaticHero({ bundle }: { bundle: BusinessBundle }) {
  const tokens = tokensFor(bundle);
  const families = ["portfolio", "offer", "festival"] as const;
  return (
    <div className="relative mx-auto h-full max-w-sm" role="img" aria-label="Stack of sample posts in the brand's colours">
      {families.map((f, i) => (
        <div key={f} className="absolute left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2 shadow-2xl" style={{ transform: `translate(calc(-50% + ${(i - 1) * 70}px), calc(-50% + ${i * 14 - 14}px)) rotate(${(i - 1) * 6}deg)`, zIndex: i }}>
          <ScaledCanvas size="feed" label={`${f} sample`} className="overflow-hidden rounded-xl border border-line">
            <Template family={f} tokens={tokens} content={sampleContent(bundle, f)} />
          </ScaledCanvas>
        </div>
      ))}
    </div>
  );
}

export function HeroStage({ bundle }: { bundle: BusinessBundle }) {
  const [mode, setMode] = useState<"checking" | "3d" | "static">("checking");
  const [still, setStill] = useState(false);
  const tokens = useMemo(() => tokensFor(bundle), [bundle]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStill(reduced);
    setMode(reduced || !webglAvailable() ? "static" : "3d");
  }, []);

  return (
    <div className="h-[420px] w-full">
      {mode === "checking" ? <div className="skeleton size-full" /> : mode === "3d" ? <div role="img" aria-label="Floating post cards, colour swatches and logo" className="size-full"><HeroScene tokens={tokens} still={still} /></div> : <StaticHero bundle={bundle} />}
    </div>
  );
}
