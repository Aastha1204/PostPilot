"use client";

import { useEffect, useRef, useState } from "react";
import { CANVAS, type CanvasSize } from "@/lib/templates/schema";

interface Props {
  size: CanvasSize;
  label: string;
  children: React.ReactNode;
  className?: string;
}

/** Draws a full-size design and scales it to fit its container, so previews stay pixel-identical to exports. */
export function ScaledCanvas({ size, label, children, className }: Props) {
  const { width, height } = CANVAS[size];
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => entry && setScale(entry.contentRect.width / width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className={className}
      style={{ position: "relative", width: "100%", aspectRatio: `${width} / ${height}`, overflow: "hidden" }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
