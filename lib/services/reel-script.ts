import type { Post } from "@/lib/types";

export interface ReelScript {
  hook: string;
  shots: { time: string; shot: string; onScreen: string }[];
  onScreenText: string[];
  caption: string;
}

/** Derives a shoot-ready script from the post's caption and visual brief. */
export function buildReelScript(post: Post): ReelScript {
  const sentences = post.visualBrief.split(/(?<=[.!?])\s+/).filter((s) => !/licensed music/i.test(s)).map((s) => s.replace(/^Reel:\s*/i, "").trim());
  const hook = post.caption.split("\n")[0] ?? post.title;
  const headline = post.templateProps.headline;
  const beats = [
    { time: "0–3 s", shot: sentences[0] ?? "Strong opening shot of the setup", onScreen: headline },
    { time: "3–8 s", shot: sentences[1] ?? "Two quick cuts of the work in progress", onScreen: post.templateProps.subhead ?? "Behind the scenes" },
    { time: "8–14 s", shot: sentences[2] ?? "Close-up of the key detail", onScreen: "" },
    { time: "14–18 s", shot: "End on the finished result with the logo", onScreen: post.cta },
  ];
  return {
    hook,
    shots: beats,
    onScreenText: beats.map((b) => b.onScreen).filter(Boolean),
    caption: post.caption,
  };
}
