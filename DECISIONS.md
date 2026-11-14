# Decisions

- **Phase 1 dependencies only.** R3F, dnd-kit, Recharts, react-hook-form, Supabase and sharp are installed in the phase that uses them, to keep installs and bundles lean.
- **UI accent is derived, not raw.** Brand colours such as maroon are too dark for text on the ink background, so `--accent` is the more vivid brand colour nudged to AA contrast (`lib/utils/color.ts`). `--brand-*` keep the exact brand values for designs.
- **Store hydration is manual** (`skipHydration`) to avoid SSR/localStorage mismatches; `Providers` rehydrates on mount.
- **Reset demo** restores seed state but keeps the viewer's light/dark preference.
- **Passcode gate** is middleware on app routes only, active when `DEMO_PASSCODE` is set; the cookie holds a SHA-256 of the passcode. `/m/approve/*` stays open (token-scoped).
- **Live mode availability** is computed server-side from env vars; values never reach the client.
- **Festival dates** are seeded with `verified: false` and listed in Settings for manual review.

## Phase 2
- **One design, two renderers.** Templates are flexbox-only React components in `components/templates`. The browser draws them via `ScaledCanvas`; `/api/render/[postId]` draws the same component with `next/og`, then `sharp` converts to JPEG (mozjpeg, flattened onto the brand background).
- **Fonts** come from `@fontsource` packages with real family names, so the same `font-family` works in CSS and Satori. The renderer reads the `.woff` files from `node_modules` (traced via `outputFileTracingIncludes`); `next/font` was dropped. Only Latin subsets are loaded, so avoid ₹ and Devanagari glyphs in designs until a font with those ranges is added.
- **Satori gotchas fixed:** fragments inside flex containers broke layout (wrapped in divs); Cormorant's numerals look like "OI", so carousel step numbers use the body font.
- **Render ids:** `sample-<family>` resolves sample content; real post ids plug into `lib/templates/resolve.ts` in Phase 3.
- **No stock photos bundled.** Photo slots are clearly marked and `public/demo/ATTRIBUTION.md` plus `photos.manifest.json` are ready for licensed images. The testimonial and before/after samples are labelled as sample wording, so nothing reads as a real review.
- **Style is derived from business type and surface luminance** (`lib/templates/tokens.ts`): ornate (wedding, interior), friendly (café and similar), bold (dark surface, gym).

## Phase 3
- **Demo clock.** `lib/demo-clock.ts` fixes "today" at 14 Nov 2026 so published/scheduled seed data stays coherent whenever the demo runs. Drag-to-reschedule refuses days before it.
- **Seed calendars** are generated JSON in `data/seed/calendars/` (Shubh Vivah Nov 14 posts and Dec 18; café and gym Dec 9 each). Only November is in the store at start; December is "generated" by streaming the seed, so Reset demo makes the demo repeatable.
- **Generation** streams NDJSON events (`step`, `post`, `notice`, `done`) from `/api/generate/calendar`. Demo mode streams the seed at 2.5–4 s per post (about 55 s), or 0.5–0.9 s per post with the Fast setting. Live mode runs plan then write through the Groq/Gemini adapter, validates with Zod (one retry), drops duplicate ideas (Jaccard > 0.6), and falls back per post to the seed after a 60 s budget.
- **Summary figures** are computed, not hard-coded. Shubh Vivah December gives 18 posts, 6 pillars, 3 festivals, 0 duplicates, 2 posts needing review. Two seeded captions carry deliberate unverified claims ("2 days", "24 ghante") so the Phase 4 fact guard has something to flag.
- **Added festivals:** Diwali (8 Nov) and Vivah Panchami (14 Dec), both `verified: false`.

## Phase 4
- **State machine** lives in `lib/services/post-state.ts` (allowed transitions, `canPublish`, `transition`, `applyEdit`). Editing the content of an approved or scheduled post sends it back to draft so it needs approving again. Phase 6's publish API must call `canPublish` and return 409 for anything else.
- **Fact guard** (`lib/services/fact-guard.ts`) extracts ₹ amounts, percentages, dates and ranges, times, phone numbers, @handles and number-plus-unit durations ("2 days", "24 ghante"). Bare small numbers and years are ignored so counting words don't raise false alarms. Known facts are the allowed offers, services, audience, CTA, contact details and festival dates. Run over every seed post, it flags exactly the two deliberately seeded claims. Live-generated posts are now checked too.
- **Approve is blocked** by unresolved fact warnings (edit them out, or press "Confirm it's accurate"), a caption over 2,200 characters, more than 30 hashtags, or no platform chosen. The preferred hashtag count is a brand kit field (default 12).
- **Design variants** are colour variants (Classic, Bold, Soft) driven by tokens, plus a watermark toggle. Swap photo takes an uploaded client photo (resized to a JPEG data URL), only on templates with a photo slot.
- **AI edit** (`/api/posts/[id]/edit`) returns revised fields, a one-line summary, a word diff and any new unverified facts. Demo mode uses deterministic rewrites (shorter, fewer emoji, festive, Hinglish, formal); live mode calls the LLM with a demo fallback.
- **Reel script** is derived from the caption and visual brief. "Send script to owner" is a demo-mode toast plus a timeline note until the WhatsApp adapter lands in Phase 6.
- **Persisted store bumped to v2** (new post fields), which resets stored posts to seed once.
- **`/posts/new-<family>`** from the template gallery now creates a draft from the sample and redirects to its editor.

## Phase 5
- **Phone approval sync.** The laptop creates a token-scoped session (a snapshot of the week's posts) when previews are sent; the phone page `/m/approve/[token]` reads and acts on it through `/api/approvals/*`; the laptop polls `/events` every 2 s and applies each action once. State lives in an `ApprovalStore` adapter: Supabase over PostgREST (service role, server only) or an in-process memory store for a local demo (`APPROVAL_LOCAL_SYNC=true`, phone on the same network as the laptop). The QR card is hidden when neither is configured. **Supabase Realtime push is not wired; polling is the only transport.** The Supabase store is written but untested without a project.
- **Enforcement is server-side.** Approving from the phone link runs the fact guard and the state machine in `lib/services/approvals.ts` and returns 409 with the flagged text; in the WhatsApp preview the bot refuses the same way and points to Edit. A plain-text edit like "wo number hata do" removes the flagged line.
- **Edit loop.** Edit asks "Kya change karna hai?", the typed instruction goes to `/api/posts/[id]/edit`, and the revised post comes back with an "Updated ✨" label and fresh buttons.
- **3D phones** are CSS-3D (perspective, ±12° base rotation, up to 6° mouse tilt, bezel, glass sheen, floor shadow) with real HTML inside; tilt is disabled under reduced motion. The publish hand-off uses a Framer Motion `layoutId` from the chat thumbnail to the Instagram tile, with a like-burst. Not visually verified in motion.
- **Chat, event log and phone tokens are session-only** (not persisted) and cleared by Reset demo. Followers and following show "—" because no such numbers exist in the brand kit.
- **"Publish next approved post"** on this page is a demo stand-in that respects `canPublish`; it picks the earliest approved or scheduled post (so a scheduled November post goes first). Phase 6 replaces it with the real queue and 409 API.
- `supabase/migrations/0001_init.sql` now holds the full data model plus `approval_session` and `approval_event`.

## Phase 6
- **Adapters.** `PublisherProvider`, `StorageProvider` and `MessagingProvider` each have a Mock and a Live implementation behind a `get…(live)` factory (`lib/adapters`). The mock publisher mirrors the live step sequence ("Uploaded media → Created container → Container status FINISHED → Published (ig_media_id …)"), so the queue looks identical in demo mode.
- **Approval gate.** `publishPost` (`lib/services/publish.ts`) refuses anything but approved or scheduled with 409 before any network call. Because posts live in the browser store, the API checks the status of the snapshot it is sent; for live mode the Supabase `post` table plus `/api/posts/sync` and the cron tick are the durable path, and the cron tick only publishes rows the database says are approved or scheduled.
- **Quota guard.** Reads `content_publishing_limit` in live mode (fallback `IG_DAILY_LIMIT_FALLBACK`, default 50); a publish that would exceed it is deferred with a visible reason and retried by the ticker.
- **Retries.** Retryable errors back off 1, 5 and 15 minutes with three attempts; permanent ones (invalid token, permission, unsupported) fail immediately. Demo mode runs waits at 20× speed and says so. "Simulate a failed publish" fails the first attempt of one job once per session.
- **Errors** map Graph error codes to typed codes in `lib/adapters/errors.ts`. Rate-limit codes defer rather than fail.
- **Live limits.** Reels can't be published live (no video file): the job fails permanently with a clear message and the cover and script are used in the Instagram app. "Connect with Meta" OAuth is not built; dev mode uses the `IG_*` tokens from env and the Accounts page offers a connection check. Demo mode shows a clearly labelled simulated connect.
- **WhatsApp.** Business-initiated previews use the utility template (image header plus three quick-reply buttons) when `WA_TEMPLATE_NAME` is set, otherwise interactive buttons inside the 24-hour window. The webhook verifies the handshake and `X-Hub-Signature-256`, maps button taps and free-text edits to the approval session, and is idempotent by message id (process-local; use `message_log` when running serverless).
- **Cron.** `/api/cron/tick` requires `CRON_SECRET`, publishes due rows from Supabase, and sends the Monday 10:00 IST reminder once per day. In demo mode an in-browser ticker handles retries.
- `supabase/migrations/0002_post_meta.sql` adds a `meta` jsonb column for app-only post fields.

## Phase 7
- **Insights** are computed from published posts that carry demo results (November). Profile visits is a modelled 6.5% of reach, and the October baseline for month-over-month change is a labelled demo constant; both are replaced by Instagram API data in live mode. The best-time heatmap is an engagement model (peaks near 11:00 and 19:30 IST) nudged by real post results. Switching to a business with no published posts shows an empty state.
- **Monthly report** is a two-page branded print view (`/insights/report`); the shell is hidden under `@media print`, so the browser's "Save as PDF" yields just the report.
- **3D hero** (React Three Fiber, drei `Float`, local `Lightformer` environment so nothing is fetched from a CDN, `ContactShadows`, cursor parallax) is lazy-loaded with `ssr: false`. Cards are canvas textures drawn from the active brand, so choosing another business re-themes the scene. With no WebGL or with reduced motion it falls back to a static stack of real template designs. The empty-calendar state still uses a text card rather than the 3D scene.
- **Command palette** (Ctrl/Cmd+K, also a top-bar button) covers screens, Generate December, Send this week's previews, Publish next approved post, switching business, theme, presentation mode and Reset demo. Screen-bound commands go through a one-shot `pendingCommand` that the target screen consumes. It is mounted in the app shell, not on the landing page.
- **Presentation mode** (P) hides elements marked `data-dev` (Reset demo, Mode pill, failure-simulation banner), grows the base font 10%, shows the cursor ring and turns tooltips off; a toast confirms the toggle.
- **Brand kit form** has six steps with progress and autosave. Edits are layered over the seed kit in the store, so the whole app re-themes as you type; "Revert all edits" clears them and Reset demo clears them too. Logo colours come from a small canvas quantiser instead of node-vibrant (one less dependency). Tone and formality samples are prepared variants; the debounced live LLM rewrite is not built. Uploaded photos are downsized data URLs kept in local storage, and file names that look AI-made are tagged "AI".

## Phase 8
- **QA fixes:** added an app icon (the missing favicon was the only console error), removed date `aria-label`s from calendar cells (accessible-name mismatch) and moved the hero's label from the canvas wrapper to a `role="img"` container.
- **Lighthouse** (desktop, production build): calendar 100/100/100, landing 87/100/100. The landing's performance score is limited by about 320 ms of blocking time from the 3D scene, which is lazy-loaded; accepted.
- **Not covered:** Android Chrome over 4G, live API paths, a real screen reader pass, and visual review of animation quality.

## Event Autopilot (post-Phase 8 feature)
- **Event to post.** `/autopilot` takes an event (name, date, type, notes, time), picks a theme (12 themes in `lib/themes`, or you choose), writes the caption, creates 1–5 images and adds the post (plus an optional teaser 3 days earlier) to the calendar. Event posts use the new `photo-story` template (full-bleed photos, one per slide). Themes re-colour any template and keep the brand fonts.
- **OpenAI.** `OPENAI_API_KEY` powers captions (`LLM_MODEL`, default `gpt-4o-mini`) and images (`OPENAI_IMAGE_MODEL`, default `gpt-image-1`, 1024×1536 cropped to 4:5). With no key, or on any failure, themed demo artwork is used per image and a notice says so. Images are stored in Supabase when configured, otherwise kept as 1080×1350 JPEG data URLs in the post. AI images carry the "AI visual" badge. Real-photo mode uses photos uploaded in Brand Kit (now stored at 900 px).
- **"Nothing publishes without approval" is kept, via a standing approval.** The owner switches on "Standing approval for event posts" once; event posts are then approved by that rule (recorded on the timeline as "Approved by autopilot") and scheduled. Posts with an unverified number or date are still held. Numbers that come from the owner's own event name, date and notes count as confirmed.
- **Autopilot scheduler.** A 1-second ticker publishes every scheduled post whose slot has arrived and catches up missed slots, recording how late each ran. The Reliability panel shows upcoming, auto-posted, caught-up-late and missed counts. In demo mode "Skip to next scheduled post" moves the demo clock so you can watch it post. In live mode the server cron does this with the tab closed.
- **More platforms.** LinkedIn and X can be selected and are simulated (labelled "preview"); live publishing for them is not built and is logged as skipped.
