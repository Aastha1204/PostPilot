"use client";

import { useRef } from "react";

/** Hover tilt with a specular highlight. CSS variables keep pointer moves off React's render path. */
export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function move(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(px - 0.5) * 10}deg`);
    el.style.setProperty("--rx", `${(0.5 - py) * 10}deg`);
    el.style.setProperty("--hx", `${px * 100}%`);
    el.style.setProperty("--hy", `${py * 100}%`);
  }

  function leave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div style={{ perspective: 900 }} className={className}>
      <div
        ref={ref}
        onPointerMove={move}
        onPointerLeave={leave}
        className="group/tilt relative"
        style={{ transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))", transition: "transform 150ms ease-out", transformStyle: "preserve-3d" }}
      >
        {children}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity group-hover/tilt:opacity-100"
          style={{ background: "radial-gradient(circle at var(--hx, 50%) var(--hy, 50%), rgb(255 255 255 / 0.22), transparent 55%)" }}
        />
      </div>
    </div>
  );
}
