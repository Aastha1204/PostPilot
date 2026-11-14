# PostPilot by Neovia AI

Interactive demo prototype. A month of on-brand Instagram and Facebook posts is generated from a brand kit, approved by the owner on WhatsApp (or a phone link), and published on schedule.

It runs in two modes from one codebase:

- **Demo mode (default, zero API keys).** All data is seeded. Generation, WhatsApp delivery and Instagram publishing are simulated with realistic latency, streaming and logs. It works with every external API down.
- **Live mode.** Real LLM (Groq or Gemini), real WhatsApp Cloud API, real Instagram and Facebook Page publishing. Enabled only when the credentials exist, plus a UI toggle.

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run typecheck`, `npm run lint`.

To try phone approval locally, add `APPROVAL_LOCAL_SYNC=true` and open the app through your computer's network address so a phone can reach it. See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the 3-minute walkthrough and [DECISIONS.md](DECISIONS.md) for every design decision.

## Environment

Copy `.env.example` to `.env.local`. Nothing is required for demo mode.

| Variable | Purpose |
| --- | --- |
| `DEMO_PASSCODE` | Gates the app routes behind a simple passcode. Empty means open. |
| `LLM_PROVIDER`, `LLM_MODEL`, `GROQ_API_KEY` / `GEMINI_API_KEY` | Live generation and AI edits. |
| `IG_USER_ID`, `IG_ACCESS_TOKEN`, `META_GRAPH_VERSION`, `IG_DAILY_LIMIT_FALLBACK` | Instagram publishing and quota. |
| `FB_PAGE_ID`, `FB_PAGE_ACCESS_TOKEN` | Facebook Page photo posts. |
| `WA_PHONE_NUMBER_ID`, `WA_ACCESS_TOKEN`, `WA_VERIFY_TOKEN`, `WA_TEMPLATE_NAME`, `WA_OWNER_NUMBER`, `META_APP_SECRET` | WhatsApp previews and the webhook. |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLIC_BUCKET` | Cross-device approval, media storage and durable posts. |
| `APPROVAL_LOCAL_SYNC` | `true` syncs phone approvals through the server's memory (local demos). |
| `CRON_SECRET` | Protects `/api/cron/tick`. |

**Live** is enabled when the LLM key and model, `IG_USER_ID` and `IG_ACCESS_TOKEN` are all set. The Live toggle explains what is missing.

## What is in it

| Screen | What it does |
| --- | --- |
| `/` | 3D hero landing (React Three Fiber, static fallback without WebGL or with reduced motion) and the business picker. |
| `/calendar` | Month, week and list views; filters; festival markers; drag to reschedule with undo; streamed generation with a planning panel, progress ring, summary and stats rail. |
| `/posts`, `/posts/[id]` | Post editor: three design variants, carousel reorder, photo swap, caption and hashtag tools, IST scheduler, AI edits with a diff, fact guard, reel script, status timeline. |
| `/approvals` | Dual 3D phones: WhatsApp-style approval chat (Approve, Edit, Skip and the edit loop) and an Instagram-style grid; QR phone link; live event timeline. |
| `/m/approve/[token]` | Mobile-first approval page, no login, token-scoped. |
| `/templates` | Seven template families rendered live with the active brand. |
| `/brand-kit` | Six-step autosaving form with a live preview; the whole app re-themes as you edit. |
| `/accounts` | Instagram, Facebook Page and WhatsApp connection cards and the publishing quota meter. |
| `/queue` | Publish jobs, retries with backoff, step logs and a log console. |
| `/insights` | KPIs, pillar chart, best-time heatmap, per-post table and a two-page printable monthly report. |
| `/settings` | Demo toggles and the festival calendar review list. |

Shortcuts: **Ctrl/Cmd+K** command palette, **P** presentation mode.

## Architecture

```
app/            Next.js 15 App Router: screens and thin route handlers (api/*)
components/     shell, calendar, editor, phone, approvals, publishing, templates, three, brand, insights
lib/services/   Plain server functions (generation, fact guard, state machine, publish, approvals, edit, render)
lib/adapters/   Provider interfaces with Mock and Live implementations
lib/ai/prompts/ Prompt files, kept separate so they can be tuned
lib/templates/  Design tokens, content schema, sample copy, fonts
data/seed/      Businesses, brand kits, pre-generated calendars (Zod-validated on load)
data/festivals/ Festival calendar by season
supabase/       Migrations
```

Key ideas:

- **Adapters.** The UI never calls a vendor SDK. `LLMProvider`, `PublisherProvider`, `MessagingProvider`, `StorageProvider` and the approval store each have a Mock and a Live implementation. Mocks mirror the live response shapes.
- **One design, two renderers.** Post designs are flexbox-only React components. The browser draws them directly; `/api/render/[postId]` draws the same component with `next/og`, then `sharp` converts to JPEG at 1080×1350 for Instagram.
- **State machine.** `lib/services/post-state.ts` holds the allowed status transitions. Publishing requires approved or scheduled; the publish API returns 409 for anything else.
- **Fact guard.** Numbers, amounts, percentages, dates, times, phones and handles in captions are checked against the brand kit; unverified ones block approval until edited out or explicitly confirmed. It is enforced in the editor, the WhatsApp preview and the phone-link API.
- **Honesty.** AI backgrounds are badged and stored separately; simulated channels carry a "Preview" label; demo connect is clearly labelled; festival dates are unverified until reviewed.
- Server logic is plain functions under `lib/services`, so it can be ported to FastAPI later.

## Going live

1. **Supabase**: run `supabase/migrations/0001_init.sql` then `0002_post_meta.sql`; create a public storage bucket (default name `post-media`); set the three Supabase variables.
2. **Meta**: create a Meta app in development mode with a test Instagram professional account that has a role on the app, and a Facebook Page. Put the tokens and ids in env. Publishing to client accounts in production needs Meta app review.
3. **WhatsApp**: create a utility template with an image header and three quick-reply buttons (Approve, Edit, Skip), set `WA_TEMPLATE_NAME`, point the webhook at `/api/webhooks/whatsapp` with your `WA_VERIFY_TOKEN`, and set `META_APP_SECRET` so signatures are verified. The test number only messages verified recipients, so add the prospect's number first, or use the QR phone link.
4. **Cron**: call `GET /api/cron/tick` every minute with `Authorization: Bearer $CRON_SECRET` (Supabase `pg_cron` or an external scheduler). Hobby-tier platform cron is too infrequent.
5. **Deploy** to Vercel. The render route needs the Node runtime (already set).

## Quality checks (14 Nov 2026)

- Typecheck, lint and production build pass.
- Lighthouse (desktop): calendar 100 / 100 / 100 (performance, accessibility, best practices), LCP 0.2 s; landing 87 / 100 / 100 (the 3D scene adds about 320 ms total blocking time).
- No page-level horizontal overflow at 1366×768 or 1920×1080 on the main screens.
- Publish API returns 409 on a draft; quota limit defers; simulated failure retries; webhook handshake and signature check; cron auth.
- Reset demo restores the seed state (14 posts, 10 published, brand edits cleared).

## Known limitations

- **Live mode is unverified.** No real Groq, Gemini, Meta, WhatsApp or Supabase credentials were available, so those paths are written but untested.
- **Posts live in the browser** in demo mode. The publish API checks the status of the snapshot it is sent; the durable live path is Supabase (`/api/posts/sync` and the cron tick).
- **Phone approval** uses polling every 2 seconds; Supabase Realtime push is not wired.
- **Reels** cannot publish live (no video file); the cover and script are used in the Instagram app. Add licensed music there.
- **"Connect with Meta" OAuth** is not built; dev mode uses env tokens, and demo mode shows a labelled simulated connect.
- **Stock photos** are not bundled. Designs show marked photo slots until licensed photos are added (see `public/demo/ATTRIBUTION.md`).
- **Fonts** are Latin subsets, so ₹ and Devanagari glyphs would fall back to a default face in rendered images.
- The WhatsApp webhook's idempotency and pending-edit memory are process-local; use `message_log` when running serverless.
- Not yet tested on a real Android phone over 4G.
