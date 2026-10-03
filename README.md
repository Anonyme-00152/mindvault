# MindVault — Your mind, vaulted.

A private, local-first vault for notes, tasks and files, with an assistant that only knows what you hand it — and a cinematic marketing site built to compete for an Awwwards nomination.

**Two surfaces, one design system**

| Surface | URL | Purpose |
| --- | --- | --- |
| Marketing site | `/` | Scroll-driven storytelling: WebGL glass vault, pinned sequences, horizontal features, live AI demo |
| Product | `/app` (behind `/login`) | Notes · Calendar · Ask (AI) · Files · Export — all data in IndexedDB |

## Stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript** strict
- **Tailwind CSS v4** + CSS design tokens (dark + light)
- **GSAP 3.15** (ScrollTrigger, SplitText, DrawSVG, CustomEase) · **Lenis** smooth scroll
- **Three.js** via **React Three Fiber** + **drei** (`MeshTransmissionMaterial`, procedural `Environment`)
- **Motion** (ex-Framer Motion) for layout / shared-element animations in the app
- **Dexie** (IndexedDB) · **Zustand** · **cmdk** · **date-fns** · **JSZip** · **jsPDF**
- **OpenAI** streamed through a server route (optional — demo mode works offline)

## Run it

```bash
npm install
cp .env.example .env      # then edit AUTH_*, SESSION_SECRET (and OPENAI_API_KEY if you have one)
npm run dev               # http://localhost:3000  (Turbopack)
```

Production:

```bash
npm run build
npm start
```

Demo credentials are read from `.env` (`AUTH_USER` / `AUTH_PASSWORD`) and shown on the login screen while `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true`. Set it to `false` before publishing.

## Live

**https://mindvault-xi.vercel.app** — production on Vercel (project `mindvault`). Demo sign-in: `demo` / `vault-2026`.

## Deploy (Vercel)

1. Import the repo, framework preset **Next.js**.
2. Add the environment variables from `.env.example` (`SESSION_SECRET` must be a long random string).
3. Deploy. Add a custom domain — Awwwards requires one to submit.

## Project map

```
src/
  app/
    page.tsx                 marketing site
    login/                   sign-in screen (split layout, WebGL scene)
    app/                     product: layout + dashboard, notes, calendar, ask, files, export
    api/auth/*               login / logout (HMAC-signed httpOnly cookie)
    api/ai/*                 streaming assistant (OpenAI or local demo mode)
    api/push/*               Web Push: vapid, subscribe, reminders, tick (scheduler), test
    api/ics                  .ics generator (Add to Calendar)
    app/settings             notifications, calendar, install, storage, theme
    manifest.ts, icon.tsx, apple-icon.tsx   PWA manifest + generated icons
    opengraph-image.tsx      generated OG image
    globals.css              design tokens, primitives, motion helpers
  components/
    landing/                 Preloader, Nav, Opening (hero + vault), Features, AskDemo, Privacy, Manifesto, Footer
    three/Monolith.tsx       the glass vault (R3F)
    app/                     Shell, CommandPalette, NoteEditor, NoteCard, …
    Cursor, SmoothScroll, Magnetic, Markdown, Logo
  lib/
    db.ts                    Dexie schema, seed, backup import/export
    auth.ts                  session signing (Web Crypto, edge-safe)
    ai-local.ts              offline assistant
    export.ts                ZIP / PDF generation
    ics.ts, reminders.ts     calendar + reminder maths (unit-tested)
    pwa.ts                   service worker, push subscription, local scheduler, badge, share
    push-store.ts, push-send.ts   server-side subscription store (file / Upstash) + web-push
    gsap.ts                  plugin registration, custom ease
    store.ts                 UI state + per-frame motionState
  middleware.ts              protects /app
public/sw.js                 service worker (push, clicks, offline shell)
vercel.json                  cron: /api/push/tick every minute
```

See [DECISIONS.md](./DECISIONS.md) for every architectural and design decision taken during the rebuild.

## iPhone: notifications, calendar, install

MindVault is a PWA. On iPhone (iOS 16.4+):

1. Open the site in **Safari** → **Share** → **Add to Home Screen** (push only works from the installed app).
2. Open MindVault from the Home Screen → **Settings** → **Turn on** notifications → allow.
3. Tap **Send a real push** — a notification should arrive within seconds, even with the app closed.
4. Create a note with a date and time: you'll be reminded (default 10 min before) and offered **Add to iPhone Calendar** (opens the Calendar app via an `.ics`).

Requirements for a live deployment: **HTTPS** (a service worker needs it), `VAPID_*` keys (`npm run push:keys`), `CRON_SECRET`, and a scheduler that hits `/api/push/tick` every minute. `vercel.json` ships a **daily** cron (the only cadence Vercel Hobby allows). For minute-level delivery with the app closed: on Vercel Pro change the schedule to `* * * * *`, or on any plan create a free job at cron-job.org calling `https://<your-domain>/api/push/tick` every minute with header `Authorization: Bearer <CRON_SECRET>`. With the app open on any device, reminders fire regardless. On Vercel also set `UPSTASH_REDIS_REST_URL/TOKEN` (free tier) so subscriptions persist across deployments; self-hosted installs can keep the default JSON file.

To test on your phone from this computer: run `npm run dev -- --experimental-https` (or expose port 3000 with `ngrok http 3000`) and open the https URL on the iPhone.

Tests: `npm test` (unit).

## Keyboard

- `⌘/Ctrl K` command palette · `⌘/Ctrl N` new note · `⌘/Ctrl ↵` save · `Esc` close · `1–7` jump to a section

## Licence

Portfolio project — © Ebubekir. Code is yours to reuse; the design is the case study.
