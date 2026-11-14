import type { CSSProperties, ReactNode } from "react";
import type { DesignTokens } from "@/lib/templates/tokens";
import { mix } from "@/lib/utils/color";

// Satori renders flexbox only, so every element below sets display explicitly.
export const col: CSSProperties = { display: "flex", flexDirection: "column" };
export const row: CSSProperties = { display: "flex", flexDirection: "row" };

export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function heading(t: DesignTokens, size: number): CSSProperties {
  return {
    display: "flex",
    fontFamily: t.headingFont,
    fontWeight: t.headingWeight,
    fontSize: size,
    lineHeight: 1.04,
    color: t.fg,
    textTransform: t.uppercase ? "uppercase" : "none",
    letterSpacing: t.uppercase ? 1 : -0.5,
  };
}

export function bodyText(t: DesignTokens, size: number, weight: 400 | 700 = 400): CSSProperties {
  return { display: "flex", fontFamily: t.bodyFont, fontWeight: weight, fontSize: size, lineHeight: 1.35, color: t.fg };
}

function petalPath(cx: number, cy: number, angle: number, inner: number, outer: number, width: number): string {
  const rot = (x: number, y: number): [number, number] => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [cx + x * c - y * s, cy + x * s + y * c];
  };
  const [x0, y0] = rot(0, -inner);
  const [x1, y1] = rot(0, -outer);
  const [lx, ly] = rot(-width, -(inner + outer) / 2);
  const [rx, ry] = rot(width, -(inner + outer) / 2);
  return `M${x0} ${y0} Q${lx} ${ly} ${x1} ${y1} Q${rx} ${ry} ${x0} ${y0}`;
}

/** Original line-art mandala. */
export function Mandala({ size, color, sw = 2 }: { size: number; color: string; sw?: number }) {
  const c = size / 2;
  const petals = (n: number, inner: number, outer: number, width: number, offset = 0) =>
    Array.from({ length: n }, (_, i) => petalPath(c, c, offset + (i * 2 * Math.PI) / n, inner, outer, width));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle cx={c} cy={c} r={c * 0.96} stroke={color} strokeWidth={sw} />
      <circle cx={c} cy={c} r={c * 0.9} stroke={color} strokeWidth={sw / 2} />
      {petals(16, c * 0.52, c * 0.88, c * 0.1).map((d, i) => (
        <path key={`o${i}`} d={d} stroke={color} strokeWidth={sw} />
      ))}
      {petals(12, c * 0.22, c * 0.55, c * 0.12, Math.PI / 12).map((d, i) => (
        <path key={`m${i}`} d={d} stroke={color} strokeWidth={sw} />
      ))}
      {petals(8, 0, c * 0.26, c * 0.08).map((d, i) => (
        <path key={`i${i}`} d={d} stroke={color} strokeWidth={sw} />
      ))}
      <circle cx={c} cy={c} r={c * 0.05} fill={color} />
    </svg>
  );
}

/** Original paisley motif for dividers. */
export function Paisley({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M14 2C23 4 26 15 18 23C11 29 2 24 5 16C6.5 11.5 12 12.5 12.5 16.5C13 19.5 9.5 20.5 8.5 18" stroke={color} strokeWidth={1.4} />
      <circle cx={17} cy={11} r={1.4} fill={color} />
    </svg>
  );
}

export function Divider({ t, width = 360 }: { t: DesignTokens; width?: number }) {
  if (t.style !== "ornate") {
    return <div style={{ display: "flex", width: 120, height: t.style === "bold" ? 10 : 6, borderRadius: t.style === "friendly" ? 6 : 0, background: t.accent }} />;
  }
  return (
    <div style={{ ...row, alignItems: "center", gap: 18, width }}>
      <div style={{ display: "flex", flex: 1, height: 2, background: t.accent }} />
      <Paisley size={36} color={t.accent} />
      <div style={{ display: "flex", flex: 1, height: 2, background: t.accent }} />
    </div>
  );
}

export function Pill({ t, children, solid = true }: { t: DesignTokens; children: ReactNode; solid?: boolean }) {
  return (
    <div
      style={{
        ...row,
        alignItems: "center",
        padding: "14px 32px",
        borderRadius: t.style === "bold" ? 0 : 999,
        background: solid ? t.accent : "transparent",
        border: solid ? "none" : `3px solid ${t.accent}`,
        color: solid ? t.onAccent : t.fg,
        fontFamily: t.bodyFont,
        fontWeight: 700,
        fontSize: 32,
        letterSpacing: 2,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

/** Backdrop ornament, one per design style. */
export function Decor({ t, w, h }: { t: DesignTokens; w: number; h: number }) {
  if (t.style === "ornate") {
    const line = alpha(t.accent, 0.55);
    return (
      <>
        <div style={{ display: "flex", position: "absolute", top: 28, left: 28, right: 28, bottom: 28, border: `2px solid ${alpha(t.accent, 0.85)}` }} />
        <div style={{ display: "flex", position: "absolute", top: 40, left: 40, right: 40, bottom: 40, border: `1px solid ${alpha(t.accent, 0.5)}` }} />
        <div style={{ display: "flex", position: "absolute", top: -250, left: -250 }}>
          <Mandala size={380} color={line} />
        </div>
        <div style={{ display: "flex", position: "absolute", top: h - 130, left: w - 130 }}>
          <Mandala size={380} color={line} />
        </div>
      </>
    );
  }
  if (t.style === "friendly") {
    return (
      <>
        <div style={{ display: "flex", position: "absolute", top: -170, left: w - 330, width: 520, height: 520, borderRadius: 260, background: alpha(t.accent, 0.14) }} />
        <div style={{ display: "flex", position: "absolute", top: h - 330, left: -190, width: 460, height: 460, borderRadius: 230, background: alpha(t.secondary, 0.35) }} />
      </>
    );
  }
  return (
    <>
      <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: w, height: 18, background: t.accent }} />
      <div style={{ display: "flex", position: "absolute", top: -60, left: w - 220, width: 90, height: h * 0.55, background: alpha(t.accent, 0.16), transform: "rotate(18deg)" }} />
      <div style={{ display: "flex", position: "absolute", top: -60, left: w - 110, width: 36, height: h * 0.55, background: alpha(t.accent, 0.3), transform: "rotate(18deg)" }} />
    </>
  );
}

/** Logo watermark row. The monogram stands in until a real logo is uploaded. */
export function Footer({ t, right }: { t: DesignTokens; right?: ReactNode }) {
  if (!t.watermark) return <div style={{ display: "flex", height: 120, alignItems: "center", justifyContent: "flex-end", padding: "0 76px" }}>{right}</div>;
  return (
    <div style={{ ...row, alignItems: "center", justifyContent: "space-between", padding: "0 76px 64px" }}>
      <div style={{ ...row, alignItems: "center", gap: 16 }}>
        <div
          style={{
            ...row,
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: t.style === "bold" ? 8 : 28,
            background: t.style === "ornate" ? t.primary : t.accent,
            color: t.style === "ornate" ? t.secondary : t.onAccent,
            border: t.style === "ornate" ? `2px solid ${t.accent}` : "none",
            fontFamily: t.headingFont,
            fontWeight: t.headingWeight,
            fontSize: 24,
          }}
        >
          {t.monogram}
        </div>
        <div style={{ ...bodyText(t, 28, 700), color: t.muted }}>{t.shortName}</div>
      </div>
      {right ?? <div style={{ ...bodyText(t, 26), color: t.muted }}>{t.handle}</div>}
    </div>
  );
}

interface PhotoProps {
  t: DesignTokens;
  w: number;
  h: number;
  url?: string | null;
  label?: string;
  ai?: boolean;
  radius?: number;
}

/** Real photo when supplied; otherwise a clearly marked slot. AI visuals carry a badge. */
export function PhotoSlot({ t, w, h, url, label, ai, radius = 0 }: PhotoProps) {
  return (
    <div
      style={{
        ...col,
        position: "relative",
        width: w,
        height: h,
        borderRadius: radius,
        overflow: "hidden",
        background: `linear-gradient(135deg, ${mix(t.accent, t.bg, 0.45)}, ${mix(t.fg, t.bg, 0.72)})`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} width={w} height={h} alt="" style={{ width: w, height: h, objectFit: "cover" }} />
      ) : (
        <div style={{ ...col, alignItems: "center", gap: 8 }}>
          <div style={{ ...bodyText(t, 24, 700), color: alpha(t.fg, 0.55), letterSpacing: 4, textTransform: "uppercase" }}>Photo slot</div>
          {label && <div style={{ ...bodyText(t, 28), color: alpha(t.fg, 0.7) }}>{label}</div>}
        </div>
      )}
      {ai && (
        <div style={{ ...row, position: "absolute", top: 20, left: 20, padding: "6px 16px", borderRadius: 999, background: "rgba(0,0,0,0.65)", color: "#FFFFFF", fontFamily: t.bodyFont, fontSize: 22, fontWeight: 700 }}>
          AI visual
        </div>
      )}
    </div>
  );
}

/** Style-specific photo treatment: gold double frame, rounded card, or slab with accent bar. */
export function FramedPhoto(p: PhotoProps) {
  const { t, w, h } = p;
  if (t.style === "ornate") {
    return (
      <div style={{ ...row, width: w, height: h, border: `5px solid ${t.accent}`, padding: 12 }}>
        <div style={{ ...row, border: `2px solid ${alpha(t.accent, 0.7)}`, padding: 8 }}>
          <PhotoSlot {...p} w={w - 10 - 24 - 4 - 16} h={h - 10 - 24 - 4 - 16} />
        </div>
      </div>
    );
  }
  if (t.style === "friendly") return <PhotoSlot {...p} radius={t.radius} />;
  return (
    <div style={{ ...row, width: w, height: h }}>
      <div style={{ display: "flex", width: 16, height: h, background: t.accent }} />
      <PhotoSlot {...p} w={w - 16} />
    </div>
  );
}
