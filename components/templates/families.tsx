import type { ReactNode } from "react";
import type { DesignTokens } from "@/lib/templates/tokens";
import type { TemplateContent } from "@/lib/templates/schema";
import { Decor, Divider, Footer, FramedPhoto, Mandala, PhotoSlot, Pill, alpha, bodyText, col, heading, row } from "./ui";

export interface FamilyProps {
  t: DesignTokens;
  c: TemplateContent;
  w: number;
  h: number;
  slide: number;
}

const PAD = 76;

function Frame({ t, w, h, children }: { t: DesignTokens; w: number; h: number; children: ReactNode }) {
  return (
    <div style={{ ...col, position: "relative", width: w, height: h, overflow: "hidden", background: t.bg, color: t.fg, fontFamily: t.bodyFont }}>
      <Decor t={t} w={w} h={h} />
      {children}
    </div>
  );
}

export function Festival({ t, c, w, h }: FamilyProps) {
  return (
    <Frame t={t} w={w} h={h}>
      <div style={{ ...col, flex: 1, alignItems: "center", justifyContent: "center", padding: `0 ${PAD + 20}px`, gap: 36, textAlign: "center" }}>
        {c.badge && <Pill t={t}>{c.badge}</Pill>}
        {t.style === "ornate" ? <Mandala size={260} color={t.accent} sw={2.5} /> : null}
        <div style={{ ...heading(t, h > 1300 ? 136 : 120), justifyContent: "center", textAlign: "center" }}>{c.headline}</div>
        <Divider t={t} />
        {c.subhead && <div style={{ ...bodyText(t, 40), justifyContent: "center", textAlign: "center", maxWidth: 800 }}>{c.subhead}</div>}
      </div>
      <Footer t={t} />
    </Frame>
  );
}

export function Offer({ t, c, w, h }: FamilyProps) {
  return (
    <Frame t={t} w={w} h={h}>
      <div style={{ ...col, flex: 1, justifyContent: "center", padding: `0 ${PAD}px`, gap: 40 }}>
        {c.badge && (
          <div style={{ ...row }}>
            <Pill t={t}>{c.badge}</Pill>
          </div>
        )}
        <div style={heading(t, 112)}>{c.headline}</div>
        <div
          style={{
            ...col,
            padding: 44,
            gap: 12,
            border: `3px solid ${t.accent}`,
            borderRadius: t.radius,
            background: alpha(t.accent, 0.12),
          }}
        >
          <div style={{ ...bodyText(t, 28, 700), color: t.muted, letterSpacing: 3, textTransform: "uppercase" }}>Offer</div>
          <div style={{ ...bodyText(t, 46, 700), lineHeight: 1.25 }}>{c.body}</div>
        </div>
        {c.cta && <div style={{ ...bodyText(t, 36), color: t.muted }}>{c.cta}</div>}
      </div>
      <Footer t={t} />
    </Frame>
  );
}

export function TipCarousel({ t, c, w, h, slide }: FamilyProps) {
  const slides = c.slides ?? [];
  const total = slides.length + 1;
  const index = Math.min(Math.max(slide, 0), total - 1);
  const current = index > 0 ? slides[index - 1] : undefined;
  const dots = (
    <div style={{ ...row, gap: 10 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ display: "flex", width: i === index ? 36 : 14, height: 14, borderRadius: 7, background: i === index ? t.accent : alpha(t.fg, 0.25) }} />
      ))}
    </div>
  );
  return (
    <Frame t={t} w={w} h={h}>
      <div style={{ ...col, flex: 1, justifyContent: "center", padding: `0 ${PAD}px`, gap: 36 }}>
        {current ? (
          <div style={{ ...col, gap: 36 }}>
            <div style={{ ...heading(t, 220), fontFamily: t.bodyFont, fontWeight: 700, color: t.accent }}>{String(index).padStart(2, "0")}</div>
            <div style={heading(t, 90)}>{current.title}</div>
            <Divider t={t} width={280} />
            <div style={bodyText(t, 44)}>{current.body}</div>
          </div>
        ) : (
          <div style={{ ...col, gap: 36 }}>
            <div style={{ ...row }}>
              <Pill t={t}>Swipe</Pill>
            </div>
            <div style={heading(t, 124)}>{c.headline}</div>
            <Divider t={t} width={280} />
            {c.subhead && <div style={bodyText(t, 42)}>{c.subhead}</div>}
          </div>
        )}
      </div>
      <Footer t={t} right={dots} />
    </Frame>
  );
}

export function Testimonial({ t, c, w, h }: FamilyProps) {
  return (
    <Frame t={t} w={w} h={h}>
      <div style={{ ...col, flex: 1, justifyContent: "center", padding: `0 ${PAD + 16}px`, gap: 20 }}>
        <div style={{ ...heading(t, 300), color: t.accent, height: 190, lineHeight: 1 }}>“</div>
        <div style={{ ...heading(t, 68), lineHeight: 1.18, textTransform: "none" }}>{c.quote}</div>
        <div style={{ display: "flex", marginTop: 24 }}>
          <Divider t={t} width={220} />
        </div>
        {c.attribution && <div style={{ ...bodyText(t, 32, 700), color: t.muted, letterSpacing: 2, textTransform: "uppercase" }}>{c.attribution}</div>}
      </div>
      <Footer t={t} />
    </Frame>
  );
}

export function BeforeAfter({ t, c, w, h }: FamilyProps) {
  const gap = 28;
  const pw = (w - PAD * 2 - gap) / 2;
  const ph = Math.round(h * 0.5);
  const tag = (text: string) => (
    <div style={{ ...row, position: "absolute", left: 18, bottom: 18 }}>
      <Pill t={t}>{text}</Pill>
    </div>
  );
  return (
    <Frame t={t} w={w} h={h}>
      <div style={{ ...col, flex: 1, justifyContent: "center", padding: `0 ${PAD}px`, gap: 36 }}>
        <div style={heading(t, 84)}>{c.headline}</div>
        <div style={{ ...row, gap }}>
          {[c.beforeLabel ?? "Before", c.afterLabel ?? "After"].map((label) => (
            <div key={label} style={{ ...row, position: "relative" }}>
              <PhotoSlot t={t} w={pw} h={ph} label={label} radius={t.radius ? t.radius / 2 : 0} />
              {tag(label)}
            </div>
          ))}
        </div>
        {c.subhead && <div style={{ ...bodyText(t, 36), color: t.muted }}>{c.subhead}</div>}
      </div>
      <Footer t={t} />
    </Frame>
  );
}

export function Portfolio({ t, c, w, h }: FamilyProps) {
  const ph = Math.round(h * 0.58);
  return (
    <Frame t={t} w={w} h={h}>
      <div style={{ ...col, flex: 1, justifyContent: "center", padding: `0 ${PAD}px`, gap: 34 }}>
        <FramedPhoto t={t} w={w - PAD * 2} h={ph} url={c.photoUrl} label={c.headline} ai={c.aiVisual} />
        <div style={{ ...col, gap: 14 }}>
          {c.badge && (
            <div style={{ ...bodyText(t, 26, 700), color: t.accent, letterSpacing: 4, textTransform: "uppercase" }}>{c.badge}</div>
          )}
          <div style={heading(t, 80)}>{c.headline}</div>
          {c.subhead && <div style={{ ...bodyText(t, 34), color: t.muted }}>{c.subhead}</div>}
        </div>
      </div>
      <Footer t={t} />
    </Frame>
  );
}

export function ReelCover({ t, c, w, h }: FamilyProps) {
  return (
    <div style={{ ...col, position: "relative", width: w, height: h, overflow: "hidden", background: t.bg, fontFamily: t.bodyFont }}>
      <div style={{ display: "flex", position: "absolute", top: 0, left: 0 }}>
        <PhotoSlot t={t} w={w} h={h} url={c.photoUrl} label="Reel cover frame" ai={c.aiVisual} />
      </div>
      <div style={{ display: "flex", position: "absolute", top: h * 0.45, left: 0, width: w, height: h * 0.55, background: `linear-gradient(to bottom, ${alpha(t.bg, 0)}, ${alpha(t.bg, 0.96)})` }} />
      <div style={{ ...col, position: "relative", flex: 1, justifyContent: "flex-end", padding: `0 ${PAD}px`, gap: 32 }}>
        <div style={{ ...row, alignItems: "center", gap: 14 }}>
          <Pill t={t}>
            {c.badge ?? "Reel"}
          </Pill>
          <svg width={44} height={44} viewBox="0 0 44 44">
            <circle cx={22} cy={22} r={20} fill={t.accent} />
            <path d="M17 13L32 22L17 31Z" fill={t.onAccent} />
          </svg>
        </div>
        <div style={heading(t, 130)}>{c.headline}</div>
        {c.subhead && <div style={{ ...bodyText(t, 42), color: t.muted }}>{c.subhead}</div>}
        <div style={{ display: "flex", height: 220 }} />
      </div>
      <div style={{ display: "flex", position: "absolute", left: 0, top: h - 190, width: w }}>
        <div style={{ ...col, width: w }}>
          <Footer t={t} />
        </div>
      </div>
    </div>
  );
}

/** Full-bleed photos (AI-generated or your own), one per slide, with the headline on the cover. */
export function PhotoStory({ t, c, w, h, slide }: FamilyProps) {
  const urls = c.photoUrls?.length ? c.photoUrls : c.photoUrl ? [c.photoUrl] : [];
  const total = Math.max(urls.length, 1);
  const index = Math.min(Math.max(slide, 0), total - 1);
  const cover = index === 0;
  return (
    <div style={{ ...col, position: "relative", width: w, height: h, overflow: "hidden", background: t.bg, fontFamily: t.bodyFont }}>
      <div style={{ display: "flex", position: "absolute", top: 0, left: 0 }}>
        <PhotoSlot t={t} w={w} h={h} url={urls[index]} label={`Photo ${index + 1}`} ai={c.aiVisual} />
      </div>
      <div style={{ display: "flex", position: "absolute", top: h * 0.5, left: 0, width: w, height: h * 0.5, background: `linear-gradient(to bottom, ${alpha("#000000", 0)}, ${alpha("#000000", 0.78)})` }} />
      <div style={{ ...col, position: "relative", flex: 1, justifyContent: "flex-end", padding: `0 ${PAD}px`, gap: 22 }}>
        {cover && c.badge && (
          <div style={{ ...row }}>
            <Pill t={t}>{c.badge}</Pill>
          </div>
        )}
        <div style={{ ...heading(t, cover ? 112 : 64), color: "#FFFFFF" }}>{cover ? c.headline : (c.subhead ?? c.headline)}</div>
        {cover && c.subhead && <div style={{ ...bodyText(t, 38), color: "#FFFFFF" }}>{c.subhead}</div>}
        {total > 1 && (
          <div style={{ ...row, gap: 10 }}>
            {Array.from({ length: total }, (_, i) => (
              <div key={i} style={{ display: "flex", width: i === index ? 36 : 14, height: 14, borderRadius: 7, background: i === index ? t.accent : "rgba(255,255,255,0.45)" }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ ...col, position: "relative" }}>
        <Footer t={{ ...t, fg: "#FFFFFF", muted: "rgba(255,255,255,0.8)" }} />
      </div>
    </div>
  );
}
