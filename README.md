# Scrivo

Scrivo monitors AI subscription pricing pages and emails you when a better
deal, trial, or bundle goes live. Ask **Scout**, the built-in assistant, to
compare tools against your budget — every recommendation is grounded in
Firecrawl-verified offer data.

## Stack

| Layer      | Tech                                                        |
| ---------- | ----------------------------------------------------------- |
| Frontend   | Next.js 14 (App Router), React 18, Tailwind CSS 3             |
| Components | shadcn (base-ui) + Prompt Kit AI components                   |
| Backend    | Convex (schema, queries, mutations, actions, crons)           |
| Auth       | Clerk (`ConvexProviderWithClerk`)                             |
| Scraping   | Firecrawl — verifies pricing/offer pages                      |
| Email      | AgentMail — deal alerts + digests                             |
| LLM        | OpenAI via Vercel AI SDK (`ai` + `@ai-sdk/openai`) for Scout  |

## Pages

| Route           | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| `/`             | Landing — hero on alternating gradient backgrounds, iPhone mockup showing a deal digest email, live deal explorer |
| `/deals`        | Filterable deal explorer (category, budget, offer type, search)  |
| `/onboarding`   | Step 1 — categories, monthly budget, alert email → `profiles`    |
| `/alerts/new`   | 3-step wizard — watch → schedule → review → `alerts`             |
| `/automations`  | Alert dashboard — status toggle, recent matches, scan activity   |
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

### How a deal reaches your inbox

1. `crons.ts` → `firecrawl.scanAll` scrapes every active tool's `pricingUrl`.
2. `matcher.upsertOffers` stores/updates rows in `offers`, writes `scanRuns`.
3. `matcher.matchAll` compares each `alert` (categories, tools, budget,
   thresholds) against active offers → `matches` rows.
4. `mailer.sendDigests` picks due alerts (cadence window or immediate
   threshold hit) and sends one email per alert via AgentMail.

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
AGENTMAIL_INBOX=alerts@scrivo.app
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

First run: sign in, then seed the tool catalog once via the Convex dashboard
(`tools:ensureSeeded`) or let onboarding do it. Set the env vars above before
relying on scans, email, or Scout replies.

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
