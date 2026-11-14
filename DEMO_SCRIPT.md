# PostPilot demo script (about 3 minutes)

Business: **Shubh Vivah Events & Decor** (Kalyan). Presenter: Neovia AI. Audience: a business owner on a laptop or projector.

## Before the prospect arrives

1. Open the app and press **Reset demo** (top bar). It restores the exact seed state: November published, December empty.
2. Switch the business to **Shubh Vivah** if it is not already selected.
3. For a snappier run, open **Settings** and turn on **Fast generation (15 s)**. Leave it off for the real 55-second version.
4. Phone approval: start the server with `APPROVAL_LOCAL_SYNC=true` (or configure Supabase) and open the app through your laptop's network address (not `localhost`) so the QR code works on a phone. Live mode: add the prospect's number as a verified recipient on the WhatsApp test number.
5. Press **P** for presentation mode. It hides Reset demo and the Mode pill, enlarges text and shows a cursor ring. Press **P** again to exit.

## 0:00 Landing and brand kit (25 s)

1. On `/`, move the mouse over the 3D hero: the post cards, colour swatches and logo follow the cursor.
2. Click the **Shubh Vivah Events & Decor** card, then **Start demo**.
3. Click **Brand Kit** in the sidebar. Point out the colours (maroon, gold, ivory) and fonts. Click **2. Voice** to show the Hinglish tone, and **6. Photos** for the photo library.
4. Say: "Everything below is generated from this one page."

## 0:25 Generate December (60 s)

1. Click **Calendar**, then **Generate December** (animated border).
2. The button becomes a progress ring ("n of 18 posts"). Read the **Planning your month** panel as it ticks: Reading brand kit, Mapping festivals, Balancing pillars, Writing captions, Designing posts.
3. Cells flip in with a gold shimmer. Point to the festival markers (Vivah Panchami, Christmas, New Year's Eve).
4. When it finishes, read the summary: **18 posts · 6 pillars · 3 festivals covered · 0 duplicate ideas · 2 posts need review**.
5. Point at the right rail: pillar mix against target weights.
6. Optional: drag a post to another day. It keeps its time; click **Undo** in the toast.

## 1:25 Open three posts (40 s)

1. Click **Mandap Magic** (7 Dec, carousel) and then **Open full editor**. Click **Bold** in the design variants. Click **Shorter** under AI edits and then **Accept**.
2. Back on the calendar, open **Fix the venue layout first** (8 Dec). In **Fact guard**, "2 days" is marked ⚠ because it is not in the brand kit, and **Approve** is disabled. Press **Confirm it's accurate** or **Shorter** to clear it.
3. Open **Vivah Panchami greeting** (14 Dec), the festival post.

## 2:05 Approve on WhatsApp (35 s)

1. Click **Approvals**. The header reads "This week: 7–13 Dec".
2. Click **Send this week's previews**. In the WhatsApp phone, the greeting arrives ("Namaste Riya ji! Is hafte ke 4 posts ready hain 👇") followed by each post.
3. On **Mandap Magic** tap **✅ Approve**. The bot confirms and the event timeline updates.
4. On **A haldi corner, transformed** tap **✏️ Edit**, then type `caption chhota karo, emoji kam` and send. The revised post returns labelled **Updated ✨**.
5. Optional: tap **✅ Approve** on **Floral entry prep**. The bot refuses because of the unverified "24 ghante" detail, which shows the fact guard at work.
6. Phone link: have the prospect scan the **QR code** and approve a post on their own phone. It appears here within two seconds. (Live mode: they receive the real WhatsApp message instead.)

## 2:40 Publish (15 s)

1. Click **Queue**, then **Publish next approved post now**.
2. Watch the log console stream: quota check, uploaded media, container created, container status FINISHED, published.
3. Click **Approvals**: the post has moved from the chat bubble into the Instagram phone's grid with a like burst. (Live mode: it also lands on the real demo account.)

To show resilience, turn on **Simulate a failed publish** in Settings first. The job fails once, then retries by itself and succeeds (demo speed is 20× faster than the real 1, 5 and 15 minute backoff).

## 2:55 Close

Show the line on screen: **"You approve on WhatsApp in five minutes a week. We handle the rest."**

## Bonus: one-second re-theme

Press **Ctrl+K**, type "chai" and press Enter to **Switch to Chai Chapter Café**. The whole app and every design change colours and fonts together. Open **Templates** to show all seven template families in the café's look.

## If something goes wrong

- **Generation seems stuck**: it is not. Demo mode streams a prepared calendar, and the planning panel shows progress. Turn on Fast generation.
- **Live call fails or is slow**: the app falls back to the prepared content with a quiet toast.
- **Need to start again**: **Reset demo** (or **Ctrl+K**, "Reset demo").
- **The QR code does not work on the phone**: use the **Copy link** button and open the link in the phone's browser. Check the phone is on the same network as the laptop.
