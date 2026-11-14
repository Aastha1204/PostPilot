"use client";

import { useRef, useState } from "react";
import { Check, ImagePlus, Plus, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { useActiveBundle } from "@/components/providers";
import { useDemoStore, type BrandAsset } from "@/lib/store";
import { AVAILABLE_FONTS } from "@/lib/templates/fonts";
import type { BrandKit } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { fileToDataUrl } from "@/lib/utils/image";
import { extractPalette } from "@/lib/utils/palette";
import { LiveBrandPreview } from "./live-brand-preview";
import { sampleCaption } from "./tone-samples";

const STEPS = ["Identity", "Voice", "Services & offers", "Audience", "Hashtags & rules", "Photos"] as const;
const COLOUR_FIELDS = ["primary", "secondary", "surface"] as const;
const TONES: { id: BrandKit["tone"]; label: string }[] = [{ id: "english", label: "English" }, { id: "hinglish", label: "Hinglish" }, { id: "marathi_mix", label: "Marathi mix" }];
const AI_NAME = /(^|[-_ .])(ai|midjourney|dalle|firefly|generated)([-_ .]|$)/i;
const field = "w-full rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm";
const card = "rounded-card border border-line bg-panel p-5";

function ChipList({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  const [text, setText] = useState("");
  const add = () => {
    const v = text.trim();
    setText("");
    if (v && !items.includes(v)) onChange([...items, v]);
  };
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{label}</h3>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <li key={it} className="inline-flex items-center gap-1 rounded-full bg-panel-2 py-1 pl-3 pr-1.5 text-xs">
            {it}
            <button type="button" aria-label={`Remove ${it}`} onClick={() => onChange(items.filter((x) => x !== it))} className="grid size-4 place-items-center rounded-full hover:bg-panel"><X className="size-3" aria-hidden /></button>
          </li>
        ))}
      </ul>
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} aria-label={`Add to ${label}`} placeholder={placeholder} className={field} />
        <button type="submit" disabled={!text.trim()} className="rounded-xl border border-line px-4 text-sm disabled:opacity-50">Add</button>
      </form>
    </div>
  );
}

export function BrandKitForm() {
  const { business, brandKit: kit } = useActiveBundle();
  const bid = business.id;
  const update = useDemoStore((s) => s.updateBrandKit);
  const clear = useDemoStore((s) => s.clearBrandKit);
  const assets = useDemoStore((s) => s.brandAssets[bid]) ?? [];
  const setAssets = useDemoStore((s) => s.setBrandAssets);
  const [step, setStep] = useState(0);
  const [palette, setPalette] = useState<string[]>([]);
  const [saved, setSaved] = useState(true);
  const logoRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // Every change goes through here: the kit autosaves, the whole app re-themes, and the preview redraws.
  const save = (patch: Partial<BrandKit>) => {
    update(bid, patch);
    setSaved(true);
  };

  async function onLogo(file: File | undefined) {
    if (!file) return;
    try {
      const colours = await extractPalette(file);
      setPalette(colours);
      toast.success("Logo colours found", { description: "Pick any chip to use it as a brand colour." });
    } catch {
      toast.error("That file couldn't be read as an image");
    }
  }

  async function onPhotos(files: FileList | File[] | null) {
    if (!files) return;
    const next: BrandAsset[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      try {
        next.push({ id: `${Date.now()}-${next.length}`, name: f.name, dataUrl: await fileToDataUrl(f, 900), kind: AI_NAME.test(f.name) ? "ai_generated" : "portfolio" });
      } catch { /* skip unreadable file */ }
    }
    if (next.length) {
      setAssets(bid, [...assets, ...next]);
      toast.success(`${next.length} photo${next.length === 1 ? "" : "s"} added`, { description: next.some((a) => a.kind === "ai_generated") ? "Files that look AI-made were tagged “AI” and stay badged." : undefined });
    }
  }

  const setHashtagSet = (i: number, patch: Partial<BrandKit["hashtagSets"][number]>) => save({ hashtagSets: kit.hashtagSets.map((h, idx) => (idx === i ? { ...h, ...patch } : h)) });
  const totalTags = kit.hashtagSets.reduce((n, h) => n + h.tags.length, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,340px)]">
      <div>
        <nav aria-label="Brand kit steps" className="mb-4">
          <div className="mb-2 flex items-center justify-between text-xs text-fg-muted">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span className="inline-flex items-center gap-1.5">{saved && <><Check className="size-3 text-green-500" aria-hidden /> All changes saved</>}</span>
          </div>
          <div className="h-1.5 rounded-full bg-panel-2" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
          <ol className="mt-3 flex flex-wrap gap-2">
            {STEPS.map((label, i) => (
              <li key={label}><button type="button" aria-current={i === step ? "step" : undefined} onClick={() => setStep(i)} className={cn("rounded-full border px-3 py-1 text-xs", i === step ? "border-accent bg-accent/10" : "border-line text-fg-muted hover:text-fg")}>{i + 1}. {label}</button></li>
            ))}
          </ol>
        </nav>

        {step === 0 && (
          <section className={card} aria-label="Identity">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-fg-muted">Logo, colours and fonts</h2>
              <button type="button" onClick={() => { clear(bid); toast.success("Reverted to the saved kit"); }} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-fg-muted hover:text-fg"><RotateCcw className="size-3" aria-hidden /> Revert all edits</button>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="sr-only" aria-label="Upload logo" onChange={(e) => void onLogo(e.target.files?.[0])} />
            <button type="button" onClick={() => logoRef.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:bg-panel-2"><ImagePlus className="size-4" aria-hidden /> Upload logo to find its colours</button>
            {palette.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-3" aria-label="Suggested palette">
                {palette.map((c) => (
                  <li key={c} className="rounded-xl border border-line p-2 text-center text-[10px]">
                    <span className="mx-auto block size-10 rounded-lg border border-line" style={{ background: c }} />
                    <span className="mt-1 block">{c}</span>
                    <span className="mt-1 flex gap-1">{COLOUR_FIELDS.map((k) => <button key={k} type="button" onClick={() => save({ colours: { ...kit.colours, [k]: c } })} className="rounded bg-panel-2 px-1.5 py-0.5 capitalize hover:bg-panel">{k.slice(0, 3)}</button>)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {COLOUR_FIELDS.map((k) => (
                <label key={k} className="block text-sm">
                  <span className="mb-1.5 block capitalize text-fg-muted">{k}</span>
                  <span className="flex items-center gap-3 rounded-xl border border-line bg-panel-2 px-3 py-2">
                    <input type="color" value={kit.colours[k]} onChange={(e) => save({ colours: { ...kit.colours, [k]: e.target.value.toUpperCase() } })} className="size-8 cursor-pointer rounded border-0 bg-transparent p-0" />
                    {kit.colours[k]}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(["heading", "body"] as const).map((slot) => (
                <label key={slot} className="block text-sm">
                  <span className="mb-1.5 block capitalize text-fg-muted">{slot} font</span>
                  <select value={kit.fonts[slot]} onChange={(e) => save({ fonts: { ...kit.fonts, [slot]: e.target.value } })} className={field}>{AVAILABLE_FONTS.map((f) => <option key={f}>{f}</option>)}</select>
                </label>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-panel-2 p-4">
              <p className="text-2xl" style={{ fontFamily: `"${kit.fonts.heading}", serif` }}>{business.name}</p>
              <p className="mt-1 text-sm text-fg-muted" style={{ fontFamily: `"${kit.fonts.body}", sans-serif` }}>{business.tagline}. The quick brown mandap greets every guest. 0123456789</p>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className={card} aria-label="Voice">
            <h2 className="mb-3 text-sm font-medium text-fg-muted">Tone and formality</h2>
            <div role="radiogroup" aria-label="Tone" className="flex flex-wrap gap-2">
              {TONES.map((t) => <button key={t.id} type="button" role="radio" aria-checked={kit.tone === t.id} onClick={() => save({ tone: t.id })} className={cn("rounded-full border px-4 py-1.5 text-sm", kit.tone === t.id ? "border-accent bg-accent/10" : "border-line hover:bg-panel-2")}>{t.label}</button>)}
            </div>
            <label className="mt-5 block text-sm"><span className="mb-1.5 flex justify-between text-fg-muted"><span>Casual</span><span>Formality {kit.formality}</span><span>Formal</span></span>
              <input type="range" min={0} max={100} value={kit.formality} onChange={(e) => save({ formality: Number(e.target.value) })} className="w-full accent-[var(--accent)]" />
            </label>
            <div className="mt-5 rounded-xl bg-panel-2 p-4" aria-live="polite">
              <p className="mb-1 text-xs text-fg-muted">Sample caption (prepared variants in demo mode)</p>
              <p className="text-sm">{sampleCaption(kit.tone, kit.formality, kit.services[0] ?? "décor")}</p>
            </div>
            <label className="mt-4 block text-sm"><span className="mb-1.5 block text-fg-muted">Voice notes</span><textarea rows={3} value={kit.toneNote} onChange={(e) => save({ toneNote: e.target.value })} className={field} /></label>
          </section>
        )}

        {step === 2 && (
          <section className={cn(card, "space-y-6")} aria-label="Services and offers">
            <ChipList label="Services" items={kit.services} onChange={(services) => save({ services })} placeholder="Add a service" />
            <div>
              <h3 className="mb-2 text-sm font-medium">Offers</h3>
              <ul className="space-y-2">
                {kit.offers.map((o, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl bg-panel-2 px-3 py-2 text-sm">
                    <input aria-label={`Offer ${i + 1} text`} value={o.text} onChange={(e) => save({ offers: kit.offers.map((x, idx) => (idx === i ? { ...x, text: e.target.value } : x)) })} className="min-w-0 flex-1 bg-transparent outline-none" />
                    <label className="flex shrink-0 items-center gap-1.5 text-xs"><input type="checkbox" checked={o.allowedInCaptions} onChange={(e) => save({ offers: kit.offers.map((x, idx) => (idx === i ? { ...x, allowedInCaptions: e.target.checked } : x)) })} className="size-4 accent-[var(--accent)]" /> Allowed in captions</label>
                    <button type="button" aria-label={`Remove offer ${i + 1}`} onClick={() => save({ offers: kit.offers.filter((_, idx) => idx !== i) })}><X className="size-4" aria-hidden /></button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => save({ offers: [...kit.offers, { text: "New offer", allowedInCaptions: false }] })} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs hover:bg-panel-2"><Plus className="size-3" aria-hidden /> Add offer</button>
              <p className="mt-2 text-xs text-fg-muted">Captions may only mention offers marked allowed. The fact guard checks every number against these.</p>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className={card} aria-label="Audience">
            <label className="block text-sm"><span className="mb-1.5 block text-fg-muted">Who are your customers?</span><textarea rows={5} value={kit.audience} onChange={(e) => save({ audience: e.target.value })} className={field} /></label>
            <label className="mt-4 block text-sm"><span className="mb-1.5 block text-fg-muted">Call to action</span><input value={kit.cta} onChange={(e) => save({ cta: e.target.value })} className={field} /></label>
          </section>
        )}

        {step === 4 && (
          <section className={cn(card, "space-y-6")} aria-label="Hashtags and rules">
            <div>
              <h3 className="mb-2 text-sm font-medium">Hashtag sets <span className="font-normal text-fg-muted">· {totalTags} tags in total</span></h3>
              <div className="space-y-3">
                {kit.hashtagSets.map((h, i) => (
                  <div key={i} className="rounded-xl bg-panel-2 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <input aria-label="Set name" value={h.name} onChange={(e) => setHashtagSet(i, { name: e.target.value })} className="w-32 rounded-lg border border-line bg-panel px-2 py-1 text-sm" />
                      <span className="text-xs text-fg-muted">{h.tags.length} tags</span>
                      <button type="button" aria-label={`Remove ${h.name} set`} onClick={() => save({ hashtagSets: kit.hashtagSets.filter((_, idx) => idx !== i) })} className="ml-auto"><X className="size-4" aria-hidden /></button>
                    </div>
                    <input aria-label={`${h.name} tags`} value={h.tags.join(" ")} onChange={(e) => setHashtagSet(i, { tags: e.target.value.split(/\s+/).filter(Boolean).map((t) => (t.startsWith("#") ? t : `#${t}`)) })} className={field} />
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => save({ hashtagSets: [...kit.hashtagSets, { name: "New set", tags: [] }] })} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs hover:bg-panel-2"><Plus className="size-3" aria-hidden /> Add set</button>
              <label className="mt-3 flex items-center gap-3 text-sm"><span className="text-fg-muted">Preferred hashtags per post</span><input type="number" min={1} max={30} value={kit.preferredHashtagCount} onChange={(e) => save({ preferredHashtagCount: Math.min(30, Math.max(1, Number(e.target.value) || 1)) })} className="w-20 rounded-lg border border-line bg-panel-2 px-2 py-1 text-sm" /></label>
            </div>
            <ChipList label="Do's" items={kit.rules.dos} onChange={(dos) => save({ rules: { ...kit.rules, dos } })} placeholder="Add a do" />
            <ChipList label="Don'ts" items={kit.rules.donts} onChange={(donts) => save({ rules: { ...kit.rules, donts } })} placeholder="Add a don't" />
          </section>
        )}

        {step === 5 && (
          <section className={card} aria-label="Photos">
            <h2 className="mb-1 text-sm font-medium">Photo library <span className="font-normal text-fg-muted">· {assets.length} of 10+ recommended</span></h2>
            <input ref={photoRef} type="file" accept="image/*" multiple className="sr-only" aria-label="Upload photos" onChange={(e) => { void onPhotos(e.target.files); e.target.value = ""; }} />
            <div
              role="button" tabIndex={0} aria-label="Drop photos here or press Enter to choose"
              onClick={() => photoRef.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && photoRef.current?.click()}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void onPhotos(e.dataTransfer.files); }}
              className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line px-4 py-10 text-center text-sm text-fg-muted hover:bg-panel-2"
            >
              <ImagePlus className="mb-2 size-6 text-accent" aria-hidden /> Drop real photos of your work here
            </div>
            <p className="mt-2 text-xs text-fg-muted">Only your own or licensed photos are used. Images that look AI-generated are tagged “AI” and badged on designs.</p>
            <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {assets.map((a) => (
                <li key={a.id} className="overflow-hidden rounded-xl border border-line text-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.dataUrl} alt={a.name} className="aspect-square w-full object-cover" />
                  {a.kind === "ai_generated" && <span className="block bg-black/70 px-2 py-0.5 text-center text-white">AI</span>}
                  <select aria-label={`Tag for ${a.name}`} value={a.kind} disabled={a.kind === "ai_generated"} onChange={(e) => setAssets(bid, assets.map((x) => (x.id === a.id ? { ...x, kind: e.target.value as BrandAsset["kind"] } : x)))} className="w-full bg-panel-2 px-1 py-1.5">
                    <option value="portfolio">Portfolio</option><option value="bts">Behind the scenes</option><option value="team">Team</option>{a.kind === "ai_generated" && <option value="ai_generated">AI</option>}
                  </select>
                  <button type="button" onClick={() => setAssets(bid, assets.filter((x) => x.id !== a.id))} className="w-full py-1 text-fg-muted hover:text-fg">Remove</button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-4 flex justify-between">
          <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-full border border-line px-5 py-2 text-sm disabled:opacity-40">Back</button>
          {step < STEPS.length - 1 ? <button type="button" onClick={() => setStep(step + 1)} className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-on-accent">Next</button> : <button type="button" onClick={() => toast.success("Brand kit saved", { description: "Every screen already uses your latest edits." })} className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-on-accent">Finish</button>}
        </div>
      </div>
      <LiveBrandPreview />
    </div>
  );
}
