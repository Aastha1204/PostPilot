"use client";

import { useRef } from "react";

interface Props {
  label: string;
  baseRotateY: number;
  children: React.ReactNode;
}

/** Generic CSS-3D smartphone. Screen content is real HTML, so text stays crisp and clickable. */
export function PhoneFrame({ label, baseRotateY, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function move(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--ty", `${((e.clientX - r.left) / r.width - 0.5) * 12}deg`);
    el.style.setProperty("--tx", `${(0.5 - (e.clientY - r.top) / r.height) * 12}deg`);
  }
  function leave() {
    ref.current?.style.setProperty("--ty", "0deg");
    ref.current?.style.setProperty("--tx", "0deg");
  }

  return (
    <figure className="m-0 flex flex-col items-center" onPointerMove={move} onPointerLeave={leave}>
      <div style={{ perspective: 1600 }}>
        <div
          ref={ref}
          style={{
            width: 292,
            height: 610,
            transformStyle: "preserve-3d",
            transform: `rotateY(calc(${baseRotateY}deg + var(--ty, 0deg))) rotateX(var(--tx, 0deg))`,
            transition: "transform 180ms ease-out",
          }}
          className="relative rounded-[46px] border border-white/15 bg-gradient-to-b from-[#2b2b33] to-[#111116] p-[10px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]"
        >
          <div aria-hidden className="absolute left-1/2 top-[14px] z-30 h-[18px] w-[84px] -translate-x-1/2 rounded-full bg-black" />
          <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-[#0b0b10]">{children}</div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[10px] z-40 rounded-[36px]"
            style={{ background: "linear-gradient(115deg, rgb(255 255 255 / 0.14) 0%, rgb(255 255 255 / 0.03) 32%, transparent 48%)" }}
          />
        </div>
      </div>
      <div aria-hidden className="-mt-3 h-6 w-56 rounded-[100%] bg-black/50 blur-xl" />
      <figcaption className="mt-3 rounded-full border border-line px-3 py-1 text-[11px] text-fg-muted">{label}</figcaption>
    </figure>
  );
}
