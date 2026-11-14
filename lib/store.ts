"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_BUSINESS_ID } from "./seed";
import { initialPosts } from "./seed-posts";
import { applyEdit, transition } from "./services/post-state";
import type { EventItem } from "./events";
import type { BrandKit, Platform, Post, PostStatus } from "./types";
import type { AppMode, GenerationSpeed, ThemeMode } from "./types";

export interface ChatMessage {
  id: string;
  from: "bot" | "owner";
  kind: "text" | "post";
  text?: string;
  postId?: string;
  label?: string;
  choice?: "approve" | "edit" | "skip" | null;
  at: string;
}

export interface ApprovalLogEntry {
  id: string;
  at: string;
  text: string;
}

export interface JobLogEntry {
  at: string;
  step: string;
  ok: boolean;
}

export interface PublishJob {
  id: string;
  postId: string;
  title: string;
  platforms: string[];
  scheduledAt: string;
  /** Status the post had when queued; the publish API re-checks it before touching any network. */
  gateStatus: "approved" | "scheduled";
  attempt: number;
  status: "queued" | "running" | "retrying" | "deferred" | "succeeded" | "failed";
  nextRetryAt?: string;
  reason?: string;
  error?: string;
  simulateFailure: boolean;
  /** Queued by autopilot (not by a person) and how late it ran against its slot. */
  auto?: boolean;
  lateMinutes?: number;
  log: JobLogEntry[];
}

export interface AutopilotSettings {
  enabled: boolean;
  /** Standing approval: posts without unverified facts are approved automatically. */
  autoApprove: boolean;
  platforms: Platform[];
  useOpenAI: boolean;
}

export interface BrandAsset {
  id: string;
  name: string;
  dataUrl: string;
  kind: "portfolio" | "bts" | "team" | "ai_generated";
}

interface Settings {
  generationSpeed: GenerationSpeed;
  simulateFailedPublish: boolean;
}

interface DemoState {
  activeBusinessId: string;
  mode: AppMode;
  theme: ThemeMode;
  presentation: boolean;
  settings: Settings;
  posts: Record<string, Post>;
  /** Brand kit edits made in the form, layered over the seed kit and autosaved. */
  events: EventItem[];
  autopilot: AutopilotSettings;
  clockOffsetMs: number;
  addEvent: (event: EventItem) => void;
  removeEvent: (id: string) => void;
  setAutopilot: (patch: Partial<AutopilotSettings>) => void;
  setClockOffset: (ms: number) => void;
  brandOverrides: Record<string, Partial<BrandKit>>;
  brandAssets: Record<string, BrandAsset[]>;
  updateBrandKit: (businessId: string, patch: Partial<BrandKit>) => void;
  clearBrandKit: (businessId: string) => void;
  setBrandAssets: (businessId: string, assets: BrandAsset[]) => void;
  resetCount: number;
  /** Session-only: the WhatsApp-style chat and event log per business, plus phone-link tokens. */
  chats: Record<string, ChatMessage[]>;
  approvalLog: Record<string, ApprovalLogEntry[]>;
  approvalTokens: Record<string, string>;
  /** Session-only: command palette state and a one-shot command for the next screen to run. */
  paletteOpen: boolean;
  pendingCommand: string | null;
  setPaletteOpen: (open: boolean) => void;
  setPendingCommand: (name: string | null) => void;
  jobs: PublishJob[];
  quotaUsedExtra: number;
  failureUsed: boolean;
  addJob: (job: PublishJob) => void;
  patchJob: (id: string, patch: Partial<PublishJob>) => void;
  appendJobLog: (id: string, entry: JobLogEntry) => void;
  bumpQuota: () => void;
  markFailureUsed: (used: boolean) => void;
  pushChat: (businessId: string, message: ChatMessage) => void;
  patchChat: (businessId: string, id: string, patch: Partial<ChatMessage>) => void;
  logApproval: (businessId: string, text: string) => void;
  setApprovalToken: (businessId: string, token: string) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, patch: Partial<Post>) => void;
  /** Content edit: resets approval on approved or scheduled posts. Returns true when approval was reset. */
  editPost: (id: string, patch: Partial<Post>) => boolean;
  moveStatus: (id: string, to: PostStatus, note?: string) => void;
  setActiveBusiness: (id: string) => void;
  setMode: (mode: AppMode) => void;
  setTheme: (theme: ThemeMode) => void;
  togglePresentation: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetDemo: () => void;
}

const initial = {
  activeBusinessId: DEFAULT_BUSINESS_ID,
  mode: "demo" as AppMode,
  theme: "dark" as ThemeMode,
  presentation: false,
  settings: { generationSpeed: "realistic", simulateFailedPublish: false } as Settings,
};

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      ...initial,
      resetCount: 0,
      chats: {},
      approvalLog: {},
      approvalTokens: {},
      paletteOpen: false,
      pendingCommand: null,
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      setPendingCommand: (pendingCommand) => set({ pendingCommand }),
      jobs: [],
      quotaUsedExtra: 0,
      failureUsed: false,
      addJob: (job) => set((s) => ({ jobs: [job, ...s.jobs] })),
      patchJob: (id, patch) => set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) })),
      appendJobLog: (id, entry) => set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, log: [...j.log, entry] } : j)) })),
      bumpQuota: () => set((s) => ({ quotaUsedExtra: s.quotaUsedExtra + 1 })),
      markFailureUsed: (failureUsed) => set({ failureUsed }),
      pushChat: (businessId, message) => set((s) => ({ chats: { ...s.chats, [businessId]: [...(s.chats[businessId] ?? []), message] } })),
      patchChat: (businessId, id, patch) =>
        set((s) => ({ chats: { ...s.chats, [businessId]: (s.chats[businessId] ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)) } })),
      logApproval: (businessId, text) =>
        set((s) => ({ approvalLog: { ...s.approvalLog, [businessId]: [{ id: `${Date.now()}-${Math.random()}`, at: new Date().toISOString(), text }, ...(s.approvalLog[businessId] ?? [])].slice(0, 30) } })),
      setApprovalToken: (businessId, token) => set((s) => ({ approvalTokens: { ...s.approvalTokens, [businessId]: token } })),
      posts: initialPosts(),
      events: [],
      autopilot: { enabled: true, autoApprove: false, platforms: ["instagram", "facebook"], useOpenAI: true },
      clockOffsetMs: 0,
      addEvent: (event) => set((s) => ({ events: [event, ...s.events] })),
      removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
      setAutopilot: (patch) => set((s) => ({ autopilot: { ...s.autopilot, ...patch } })),
      setClockOffset: (clockOffsetMs) => set({ clockOffsetMs }),
      brandOverrides: {},
      brandAssets: {},
      updateBrandKit: (businessId, patch) => set((s) => ({ brandOverrides: { ...s.brandOverrides, [businessId]: { ...s.brandOverrides[businessId], ...patch } } })),
      clearBrandKit: (businessId) => set((s) => { const next = { ...s.brandOverrides }; delete next[businessId]; return { brandOverrides: next }; }),
      setBrandAssets: (businessId, assets) => set((s) => ({ brandAssets: { ...s.brandAssets, [businessId]: assets } })),
      addPost: (post) => set((s) => ({ posts: { ...s.posts, [post.id]: post } })),
      updatePost: (id, patch) =>
        set((s) => {
          const existing = s.posts[id];
          return existing ? { posts: { ...s.posts, [id]: { ...existing, ...patch, updatedAt: new Date().toISOString() } } } : s;
        }),
      setActiveBusiness: (activeBusinessId) => set({ activeBusinessId }),
      setMode: (mode) => set({ mode }),
      setTheme: (theme) => set({ theme }),
      togglePresentation: () => set((s) => ({ presentation: !s.presentation })),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      // Restores the exact seed state; theme is a viewer preference and survives.
      editPost: (id, patch) => {
        const existing = useDemoStore.getState().posts[id];
        if (!existing) return false;
        const { post, approvalReset } = applyEdit(existing, patch);
        set((s) => ({ posts: { ...s.posts, [id]: post } }));
        return approvalReset;
      },
      moveStatus: (id, to, note) =>
        set((s) => {
          const existing = s.posts[id];
          return existing ? { posts: { ...s.posts, [id]: transition(existing, to, note) } } : s;
        }),
      resetDemo: () =>
        set((s) => ({
          ...initial,
          posts: initialPosts(),
          theme: s.theme,
          resetCount: s.resetCount + 1,
        })),
    }),
    {
      name: "postpilot-demo",
      version: 2,
      // v2 added post variant, watermark, fact confirmations and a timeline: drop v1 posts back to seed.
      migrate: (state) => ({ ...(state as object), posts: initialPosts() }),
      skipHydration: true,
      partialize: (s) => ({
        activeBusinessId: s.activeBusinessId,
        mode: s.mode,
        theme: s.theme,
        settings: s.settings,
        posts: s.posts,
        brandOverrides: s.brandOverrides,
        brandAssets: s.brandAssets,
        events: s.events,
        autopilot: s.autopilot,
        clockOffsetMs: s.clockOffsetMs,
      }),
    },
  ),
);
