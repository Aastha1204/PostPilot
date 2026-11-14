import { z } from "zod";

export const EVENT_TYPES = [
  { id: "festival", label: "Festival" },
  { id: "wedding", label: "Wedding / engagement" },
  { id: "birthday", label: "Birthday / anniversary" },
  { id: "launch", label: "Launch / opening" },
  { id: "sale", label: "Sale / offer" },
  { id: "workshop", label: "Workshop / class" },
  { id: "party", label: "Party / night out" },
  { id: "custom", label: "Something else" },
] as const;

export const eventInputSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.string().max(30),
  notes: z.string().max(400).optional(),
});
export type EventInput = z.infer<typeof eventInputSchema>;

export interface EventItem extends EventInput {
  businessId: string;
  themeId: string;
  imageCount: number;
  status: "ready" | "needs_review";
  postIds: string[];
  createdAt: string;
}
