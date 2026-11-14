import { z } from "zod";
import { postSchema } from "@/lib/schemas";

export const sessionSchema = z.object({
  token: z.string(),
  businessId: z.string(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  posts: z.array(postSchema),
  createdAt: z.string(),
});
export type ApprovalSession = z.infer<typeof sessionSchema>;

export const eventSchema = z.object({
  id: z.string(),
  token: z.string(),
  postId: z.string(),
  action: z.enum(["approve", "edit", "skip"]),
  comment: z.string().optional(),
  revised: z.object({ caption: z.string(), hashtags: z.array(z.string()), cta: z.string() }).optional(),
  summary: z.string().optional(),
  channel: z.literal("mobile_link"),
  at: z.string(),
});
export type ApprovalEvent = z.infer<typeof eventSchema>;
