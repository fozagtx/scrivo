# Scrivo

Scrivo monitors AI subscription pricing pages and emails you when a better
deal, trial, or bundle goes live. Ask **Scout**, the built-in assistant, to
compare tools against your budget — every recommendation is grounded in
Firecrawl-verified offer data.

**Live:** https://ideal-seahorse-109.convex.site

## Screenshots

| Landing | Deals |
| --- | --- |
| ![Landing page](docs/screenshots/landing.png) | ![Deal explorer](docs/screenshots/deals.png) |

| Scout chat | New alert — what to watch |
| --- | --- |
| ![Scout chat](docs/screenshots/scout.png) | ![New alert wizard, step 1](docs/screenshots/new-alert-watch.png) |

| New alert — when to send |
| --- |
| ![New alert wizard, step 2](docs/screenshots/new-alert-schedule.png) |

## How it works

```mermaid
flowchart LR
    subgraph Browser["Next.js app (static export on Convex hosting)"]
        Onboard["/onboarding<br/>name → guest identity"]
        Deals["/deals · /saved<br/>deal explorer"]
        Auto["/automations<br/>alert wizard (modal)"]
        Scout["/scout<br/>Scout chat + live offers"]
    end

    subgraph Convex["Convex backend"]
        DB[("users · tools · offers<br/>alerts · matches<br/>scoutThreads · scanRuns")]
        Cron1["cron: scan offers<br/>every hour"]
        Cron2["cron: send digests<br/>every 15 min"]
        Scan["firecrawl.scanAll"]
        Match["matcher.matchAll"]
        Digest["mailer.sendDigests"]
        Send["scout.send"]
    end

    Firecrawl["Firecrawl<br/>scrapes pricing pages"]
    OpenAI["OpenAI<br/>gpt-4o-mini"]
    AgentMail["AgentMail<br/>scrivo@agentmail.to"]
    Inbox["Your inbox"]

    Onboard -->|identify| DB
    Deals <-->|offers.list / save| DB
    Auto -->|alerts.create| DB
    Scout -->|postUser| DB
    Scout -->|send| Send

    Cron1 --> Scan --> Firecrawl
    Firecrawl -->|live offers| Scan -->|upsertOffers| DB
    Scan --> Match -->|matches| DB
    Cron2 --> Digest
    DB -->|due alerts + matches| Digest --> AgentMail --> Inbox

    Send -->|grounded on live offers| OpenAI
    OpenAI -->|reply| Send -->|append| DB
    DB -.->|realtime subscriptions| Browser
```

1. **Watch.** Every hour `firecrawl.scanAll` scrapes each tracked tool's
   pricing page and `matcher.upsertOffers` stores what it finds in `offers`.
   Users can add any tool from the wizard — Firecrawl finds its pricing page
   on the fly.
2. **Match.** `matcher.matchAll` compares every active alert (categories,
   tools, budget, savings threshold) against the live offers and writes
   `matches`.
3. **Notify.** Every 15 minutes `mailer.sendDigests` picks alerts whose
   digest window is due (or whose instant threshold was hit) and sends one
   email per alert from `scrivo@agentmail.to`.
4. **Ask.** Scout answers questions with the LLM, but only over the offers
   currently in the database — no hallucinated prices.

## Stack

| Layer      | Tech                                                        |
| ---------- | ----------------------------------------------------------- |
| Frontend   | Next.js 16 (App Router, static export), React 19, Tailwind CSS 4 |
| Components | shadcn (base-ui) + Prompt Kit AI components, `page-mascot` owl for Scout |
| Backend    | Convex (schema, queries, mutations, actions, crons) + Convex static hosting |
| Auth       | Browser guest identity by default; Clerk optional (`ConvexProviderWithClerk`) |
| Scraping   | Firecrawl — verifies pricing/offer pages                      |
| Email      | AgentMail — deal alerts + digests                             |
| LLM        | OpenAI via Vercel AI SDK (`ai` + `@ai-sdk/openai`) for Scout  |

## Pages

| Route           | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| `/`             | Landing — hero on alternating gradient backgrounds, iPhone mockup showing a deal digest email, live deal explorer |
| `/deals`        | Filterable deal explorer (category, budget, offer type, search)  |
| `/onboarding`   | Name-first onboarding → guest identity in `users`                 |
| `/automations`  | Alert dashboard — status toggle, recent matches, scan activity. "New alert" opens the 3-step wizard (watch → schedule → review) as a modal; `/automations?new=1` deep-links to it |
| `/alerts/new`   | Redirects to `/automations?new=1` (kept for old links)           |
| `/saved`        | Bookmarked offers                                                |
| `/scout`        | Scout chat — threads, live offer panel, prompt-kit UI            |

## Convex backend

```
schema.ts      users, tools, offers, profiles, alerts, matches,
               scoutThreads, scoutMessages, savedOffers, scanRuns
users.ts       store() — Clerk identity upsert
tools.ts       seed catalog + ensureSeeded()
offers.ts      list/count/save/saved
profiles.ts    upsert() — onboarding preferences
alerts.ts      create/mine/setStatus/remove/matchesFor/lastScan
matcher.ts     scan bookkeeping, offer upsert, alert matching, digest selection
firecrawl.ts   scanAll internalAction — scrapes each tool's pricingUrl
mailer.ts      AgentMail send + sendDigests runner
scout.ts       send action — LLM reply grounded in live offers
scoutDb.ts     threads/messages/history/append/liveOffers
crons.ts       hourly offer scan + digest delivery every 15 min
```

## Environment variables

`.env.local` (frontend + `convex dev` writes `NEXT_PUBLIC_CONVEX_URL`):

```
NEXT_PUBLIC_CONVEX_URL=         # from `npx convex dev`
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_JWT_ISSUER_DOMAIN=        # convex/auth.config.ts if configured
```

Convex dashboard → Settings → Environment Variables:

```
FIRECRAWL_API_KEY=
AGENTMAIL_API_KEY=
AGENTMAIL_INBOX=scrivo@agentmail.to
OPENAI_API_KEY=                                # Scout agent (Vercel AI SDK)
OPENAI_BASE_URL=                               # optional — Azure/proxy endpoint
SCOUT_MODEL=gpt-4o-mini                        # optional override
```

## Setup

```bash
npm install
npx convex dev        # provisions a deployment, writes .env.local, runs codegen
# in another terminal:
npm run dev           # next dev
```

First run: seed the tool catalog once via the Convex dashboard
(`tools:ensureSeeded`) or let onboarding do it. Set the env vars above before
relying on scans, email, or Scout replies.

## Deploy

```bash
npm run deploy        # convex deploy --prod + next build + upload out/ to Convex static hosting
```

Convex prompts before pushing to prod; in a non-interactive shell run
`npx convex deploy --yes --cmd 'npm run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL && node scripts/upload-static.mjs --prod --dist out`.

## Design notes

- Flowstep-derived token system in `app/globals.css` — warm off-white
  `#F8F7F3`, ink `#1D1D1F`, blue `#3F83F8`, 14–22px radii.
- Landing hero crossfades between `ArcBandsBackground` and
  `SandDriftBackground` (opensourceui) via `BackgroundSwitcher`.
- iPhone mockup (`PhoneMockupCard`) renders `DealEmailScreen` — the digest
  email users will actually receive.
- Scout chat uses Prompt Kit: `ChatContainer`, `Message`, `PromptInput`,
  `PromptSuggestion`, `TextShimmer`.
- `convex/_generated/api.d.ts` was hand-synced to the current modules; run
  `npx convex dev` once to regenerate it properly.
