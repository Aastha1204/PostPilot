import { randomUUID } from "node:crypto";
import { getApprovalStore } from "@/lib/adapters/approval-store";
import type { ApprovalEvent, ApprovalSession } from "@/lib/approvals/types";
import { getBundle } from "@/lib/seed";
import type { Post } from "@/lib/types";
import { checkFacts, unresolved } from "./fact-guard";
import { editPost } from "./post-edit";
import { transition } from "./post-state";

export async function createSession(businessId: string, weekStart: string, posts: Post[]): Promise<ApprovalSession> {
  const session: ApprovalSession = { token: randomUUID().replace(/-/g, ""), businessId, weekStart, posts, createdAt: new Date().toISOString() };
  await getApprovalStore().createSession(session);
  return session;
}

export type ActionResult =
  | { ok: true; post: Post; event: ApprovalEvent }
  | { ok: false; status: 404 | 409 | 400; error: string; blocked?: string[] };

/** Applies an owner action to the session snapshot. Fact guard and the state machine are enforced here, not in the UI. */
export async function applyAction(token: string, input: { postId: string; action: "approve" | "edit" | "skip"; comment?: string; live: boolean }): Promise<ActionResult> {
  const store = getApprovalStore();
  const session = await store.getSession(token);
  const post = session?.posts.find((p) => p.id === input.postId);
  if (!session || !post) return { ok: false, status: 404, error: "Link not found" };

  const bundle = getBundle(session.businessId);
  const event: ApprovalEvent = { id: randomUUID(), token, postId: post.id, action: input.action, channel: "mobile_link", at: new Date().toISOString() };
  let next: Post = post;

  if (input.action === "approve") {
    const blocked = unresolved(checkFacts(`${post.caption}\n${post.cta}`, bundle), post.factConfirmed).map((f) => f.text);
    if (blocked.length) return { ok: false, status: 409, error: "Some details need checking first", blocked };
    try {
      next = transition(transition(post, "approved", "Approved on phone link"), "scheduled", "Scheduled for its slot");
    } catch {
      return { ok: false, status: 409, error: "This post can't be approved right now" };
    }
  } else if (input.action === "skip") {
    try {
      next = transition(post, "skipped", "Skipped on phone link");
    } catch {
      return { ok: false, status: 409, error: "This post can't be skipped right now" };
    }
  } else {
    const comment = input.comment?.trim();
    if (!comment) return { ok: false, status: 400, error: "Tell us what to change" };
    const result = await editPost({ bundle, post, instruction: comment, live: input.live });
    const revised = { caption: result.revised.caption, hashtags: result.revised.hashtags, cta: result.revised.cta };
    next = { ...post, ...revised, factFlags: checkFacts(`${revised.caption}
${revised.cta}`, bundle), updatedAt: event.at };
    event.comment = comment;
    event.revised = revised;
    event.summary = result.summary;
  }

  await store.saveSession({ ...session, posts: session.posts.map((p) => (p.id === post.id ? next : p)) });
  await store.addEvent(event);
  return { ok: true, post: next, event };
}
