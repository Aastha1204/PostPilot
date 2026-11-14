import { z } from "zod";
import { getImageProvider, MockImages, takeUsedProviders, type ImageProvider } from "@/lib/adapters/images";
import { getLLM } from "@/lib/adapters/llm";
import { systemPrompt } from "@/lib/ai/prompts/system";
import type { EventInput } from "@/lib/events";
import { getTheme, pickTheme, type PostTheme } from "@/lib/themes";
import type { BusinessBundle, Platform, Post } from "@/lib/types";
import { addDays } from "@/lib/utils/dates";
import { formatDayMonth } from "@/lib/utils/format";
import { checkFacts, unresolved } from "./fact-guard";

export interface PlanInput {
  bundle: BusinessBundle;
  event: EventInput;
  themeId?: string;
  imageCount: number;
  imageSource: "ai" | "mine" | "mix";
  userPhotos: string[];
  postTime: string;
  teaser: boolean;
  autoApprove: boolean;
  platforms: Platform[];
  useOpenAI: boolean;
  today: string;
}

export interface PlanResult {
  posts: Post[];
  theme: PostTheme;
  notices: string[];
  imageProvider: ImageProvider["name"];
}

const ANGLES = ["wide establishing shot of the whole scene", "close-up detail of the most beautiful element", "overhead flat-lay composition", "candid atmosphere shot with soft depth of field", "symmetrical hero shot, centred"];

const captionSchema = z.object({ caption: z.string().min(1), hashtags: z.array(z.string()), headline: z.string(), subhead: z.string().optional() });

function imagePrompt(input: PlanInput, theme: PostTheme, index: number): string {
  const { event, bundle } = input;
  return [
    `Photographic social media image for "${event.name}", an event for ${bundle.business.name} (${bundle.brandKit.services.slice(0, 3).join(", ")}).`,
    `Style: ${theme.imageStyle}. Mood: ${theme.mood}.`,
    `Composition: ${ANGLES[index % ANGLES.length]}.`,
    event.notes ? `Context: ${event.notes}.` : "",
    "Vertical 4:5 portrait framing. No text, no letters, no logos, no watermarks, no recognisable real people or faces.",
  ].filter(Boolean).join(" ");
}

const COPY: Record<string, { hi: [string, string]; en: [string, string] }> = {
  festival: { hi: ["{name} ki hardik shubhkamnayein ✨", "Aapke aur aapke parivaar ke liye khushiyon bhari ho ye {name}."], en: ["Wishing you a joyful {name} ✨", "May it bring warmth and happiness to you and your family."] },
  wedding: { hi: ["{name}: ek khoobsurat shuruaat 💫", "Har detail pyaar se saji hui, taaki yaadein hamesha rahein."], en: ["{name}: a beautiful beginning 💫", "Every detail styled with care, so the memories last."] },
  birthday: { hi: ["{name} 🎉 celebration ka mood on hai!", "Khushiyon aur yaadon se bhara ek khaas din."], en: ["{name} 🎉 let the celebration begin!", "A special day filled with joy and memories."] },
  launch: { hi: ["Aa raha hai: {name} 🚀", "Humne ise bade pyaar se taiyaar kiya hai, aap sabse pehle dekhiye."], en: ["Coming soon: {name} 🚀", "We built it with care, and you get to see it first."] },
  sale: { hi: ["{name} 🛍️ khaas mauka aapke liye", "Details jaanne ke liye humse seedha baat karein."], en: ["{name} 🛍️ something special for you", "Message us to know the details."] },
  workshop: { hi: ["{name} 📚 seekhiye, banaiye, badhiye", "Seats limited ho sakti hain, isliye jaldi judiye."], en: ["{name} 📚 learn, make and grow", "Spaces may be limited, so join early."] },
  party: { hi: ["{name} 🎶 raat ko yaadgaar banate hain", "Music, roshni aur ek zabardast mahaul."], en: ["{name} 🎶 let's make the night unforgettable", "Music, lights and a great vibe."] },
  custom: { hi: ["{name} ✨ aapko invite karte hain", "Aaiye, is khaas pal ka hissa baniye."], en: ["{name} ✨ we'd love to see you there", "Come be part of this special moment."] },
};

function templateCaption(input: PlanInput, teaser: boolean): string[] {
  const { event, bundle } = input;
  const date = formatDayMonth(event.date);
  const english = bundle.brandKit.tone === "english";
  const copy = COPY[event.type] ?? COPY.custom!;
  const [hook, support] = (english ? copy.en : copy.hi).map((l) => l.replaceAll("{name}", event.name));
  const when = teaser
    ? english ? `Save the date: ${date}.` : `Date yaad rakhiye: ${date}.`
    : english ? `Join us on ${date}.` : `${date} ko milte hain.`;
  return [teaser ? (english ? `Coming up soon: ${event.name} ✨` : `Bas kuch din baaki: ${event.name} ✨`) : hook!, support!, when, ...(event.notes ? [event.notes.trim()] : []), bundle.brandKit.cta];
}

/** Turns one event into a themed post (plus an optional teaser) with images, caption and a calendar slot. */
export async function planEventPosts(input: PlanInput): Promise<PlanResult> {
  const { bundle, event } = input;
  const notices: string[] = [];
  const theme = getTheme(input.themeId) ?? pickTheme({ name: event.name, type: event.type, notes: event.notes, businessType: bundle.business.type });
  const provider = getImageProvider(input.useOpenAI);
  const mock = new MockImages();

  const makeImages = async (count: number): Promise<{ urls: string[]; ai: boolean }> => {
    const urls: string[] = [];
    let ai = false;
    const mineCount = input.imageSource === "mine" ? count : input.imageSource === "mix" ? Math.min(input.userPhotos.length, Math.floor(count / 2)) : 0;
    for (let i = 0; i < mineCount; i += 1) {
      const photo = input.userPhotos[i % Math.max(input.userPhotos.length, 1)];
      if (photo) urls.push(photo);
    }
    if (input.imageSource === "mine" && urls.length === 0) notices.push("No photos were available, so artwork was generated instead.");
    const need = count - urls.length;
    const seed = `${event.id}-${theme.id}`;
    // One at a time: the free image service throttles parallel requests.
    for (let i = 0; i < need; i += 1) {
      const index = urls.length;
      try {
        urls.push(await provider.generate({ prompt: imagePrompt(input, theme, index), theme, seed, index }));
      } catch {
        urls.push(await mock.generate({ prompt: "", theme, seed, index }));
        if (!notices.includes("Some images used themed artwork because no image service answered.")) notices.push("Some images used themed artwork because no image service answered.");
      }
      ai = true;
    }
    return { urls, ai };
  };

  const llm = input.useOpenAI ? getLLM() : null;
  const writeCaption = async (teaser: boolean): Promise<{ lines: string[]; headline: string; subhead?: string; tags: string[] }> => {
    const fallback = { lines: templateCaption(input, teaser), headline: teaser ? `Coming up: ${event.name}` : event.name, subhead: formatDayMonth(event.date), tags: [] as string[] };
    if (!llm) return fallback;
    try {
      const raw = await llm.completeJson(
        systemPrompt(bundle.business, bundle.brandKit),
        [
          `Write the ${teaser ? "teaser (a few days before)" : "event-day"} post for: ${event.name} on ${formatDayMonth(event.date)}. Type: ${event.type}. Theme mood: ${theme.mood}.`,
          event.notes ? `Facts you may use: ${event.notes}` : "No extra facts. Do not invent any.",
          `End the caption with this CTA: ${bundle.brandKit.cta}`,
          'Return JSON: {"caption":string,"hashtags":string[],"headline":string,"subhead"?:string}',
        ].join("\n"),
        25_000,
      );
      const parsed = captionSchema.parse(JSON.parse(raw));
      return { lines: parsed.caption.split("\n"), headline: parsed.headline, subhead: parsed.subhead, tags: parsed.hashtags };
    } catch {
      if (!notices.includes("Caption was written by the built-in writer because AI text isn't available right now.")) notices.push("Caption was written by the built-in writer because AI text isn't available right now.");
      return fallback;
    }
  };

  const pillar = bundle.pillars.find((p) => /festival|seasonal|event/i.test(p.name)) ?? bundle.pillars[0]!;
  const brandTags = bundle.brandKit.hashtagSets.flatMap((h) => h.tags).slice(0, 6);
  const camel = `#${event.name.replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`;
  const now = new Date().toISOString();

  const build = async (teaser: boolean, n: number): Promise<Post> => {
    const count = teaser ? 1 : input.imageCount;
    const [{ urls, ai }, text] = await Promise.all([makeImages(count), writeCaption(teaser)]);
    const date = teaser ? addDays(event.date, -3) : event.date;
    const caption = text.lines.join("\n");
    const flags = checkFacts(`${caption}\n${bundle.brandKit.cta}`, bundle);
    // The owner typed the event name, date and notes, so numbers that come from them are confirmed facts.
    const eventText = `${event.name} ${formatDayMonth(event.date)} ${event.notes ?? ""}`.toLowerCase();
    const confirmed = flags.filter((f) => f.status === "warn" && eventText.includes(f.text.toLowerCase())).map((f) => f.text);
    const approvable = unresolved(flags, confirmed).length === 0;
    const auto = input.autoApprove && approvable;
    const at = new Date(Date.now()).toISOString();
    const base: Post = {
      id: `${bundle.business.id}-ev-${event.id}-${n}`,
      businessId: bundle.business.id,
      pillarId: pillar.id,
      format: count > 1 ? "carousel" : "image",
      title: teaser ? `${event.name} (teaser)` : event.name,
      caption,
      hashtags: [...new Set([...brandTags, camel, ...text.tags])].slice(0, bundle.brandKit.preferredHashtagCount),
      cta: bundle.brandKit.cta,
      visualBrief: `${theme.name}: ${theme.mood}. ${theme.imageStyle}.`,
      templateId: "photo-story",
      templateProps: { headline: text.headline, subhead: text.subhead, badge: teaser ? "Coming soon" : formatDayMonth(event.date), photoUrls: urls, aiVisual: ai },
      photoTags: [],
      scheduledAt: `${date}T${input.postTime}:00+05:30`,
      status: auto ? "scheduled" : "draft",
      platforms: input.platforms,
      factFlags: flags,
      variant: 0,
      watermark: true,
      factConfirmed: confirmed,
      timeline: auto
        ? [
            { status: "approved", at, note: "Approved by autopilot (standing approval)" },
            { status: "scheduled", at, note: "Scheduled for its slot" },
          ]
        : [],
      themeId: theme.id,
      source: "event",
      autoApproved: auto,
      createdAt: now,
      updatedAt: now,
    };
    return base;
  };

  const posts: Post[] = [await build(false, 1)];
  if (input.teaser && addDays(event.date, -3) >= input.today) posts.unshift(await build(true, 0));
  else if (input.teaser) notices.push("The teaser date has already passed, so only the event-day post was created.");
  if (input.autoApprove && posts.some((p) => !p.autoApproved)) notices.push("A post with an unverified fact was held for your review instead of auto-approving.");
  const engines = takeUsedProviders();
  return { posts, theme, notices, imageProvider: engines.includes("openai") ? "openai" : engines.includes("free") ? "free" : "mock" };
}
