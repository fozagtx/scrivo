import Link from "next/link";
import { Bell, MoveRight } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { BackgroundSwitcher } from "@/components/background-switcher";
import { ArcBandsBackground } from "@/components/background-gradient/arc-bands-background";
import { SandDriftBackground } from "@/components/background-gradient/sand-drift-background";
import { PhoneMockupCard } from "@/components/mockups/phone-mockup-card";
import { ToolMark } from "@/components/tool-mark";
import { Reveal, RevealLine } from "@/components/reveal";
import { AvatarGroup } from "@/components/avatar-group";
import { DealEmailScreen } from "@/components/deal-email-screen";
import { DealExplorer } from "@/components/deal-explorer";
import { StartComparing } from "@/components/start-comparing";
import RetroDither from "@/components/canvasui/RetroDither";

const HERO_DEALS = [
  { slug: "claude", name: "Claude Pro", offer: "20% off annual", price: "$17/mo" },
  { slug: "devin", name: "Devin", offer: "Free trial extended", price: "$15/mo" },
  { slug: "cursor", name: "Cursor", offer: "Student discount", price: "$16/mo" },
  { slug: "codex", name: "OpenAI Codex", offer: "Bundle with Plus", price: "$10/mo" },
];

const WATCHED_TOOLS = [
  { slug: "claude", name: "Claude" },
  { slug: "devin", name: "Devin" },
  { slug: "cursor", name: "Cursor" },
  { slug: "chatgpt", name: "ChatGPT" },
  { slug: "perplexity", name: "Perplexity" },
  { slug: "midjourney", name: "Midjourney" },
  { slug: "notion-ai", name: "Notion AI" },
  { slug: "gemini", name: "Gemini" },
  { slug: "runway", name: "Runway" },
];



export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F7F3] font-sans text-[#1D1D1F]">
      <SiteHeader />
      <main>
        <BackgroundSwitcher
          intervalMs={9000}
          className="border-b border-[#E5E3DC]"
          backgrounds={[
            <ArcBandsBackground key="arc" className="h-full w-full" />,
            <SandDriftBackground key="sand" className="h-full w-full" />,
          ]}
        >
          <section className="mx-auto w-full max-w-[1180px] px-6 py-20 md:px-10 md:py-28">
            <div className="grid items-center gap-16 md:grid-cols-[1.15fr_360px]">
            <Reveal>
              <RevealLine>
                <h1 className="max-w-2xl text-[44px] font-medium leading-[0.98] -tracking-[0.06em] md:text-[72px]">
                  Discover the{" "}
                  <span className="text-[#3F83F8]">best deals</span>{" "}
                  for your most used AI subscriptions.
                </h1>
              </RevealLine>
              <RevealLine index={1}>
                <p className="mt-8 max-w-xl text-lg leading-7 text-[#55534D]">
                  Scrivo monitors AI subscription pricing pages and emails you
                  the moment a better offer, trial, or bundle goes live.
                </p>
              </RevealLine>
              <RevealLine index={2}>
                <div className="mt-8 flex items-center gap-3">
                  <StartComparing className="px-7 py-3 text-sm" />
                  <a
                    href="#deals"
                    className="rounded-full border border-[#D2D0C8] bg-white px-6 py-3 text-sm font-semibold text-[#1D1D1F] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    Explore deals
                  </a>
                </div>
              </RevealLine>
              <RevealLine index={3}>
                <div className="mt-10 flex items-center gap-6 text-sm text-[#55534D]">
                  <span className="flex items-center gap-2">
                    <Bell className="size-4 text-[#3F83F8]" />
                    Email digests + instant alerts
                  </span>
                </div>
              </RevealLine>
            </Reveal>
            <div className="mx-auto w-full max-w-[320px]">
              <PhoneMockupCard
                variant="titanium"
                visibleRatio={0.92}
                className="aspect-[9/19]"
              >
                <DealEmailScreen deals={HERO_DEALS} />
              </PhoneMockupCard>
            </div>
            </div>
            <div id="categories" className="mt-14 scroll-mt-24">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#777773]">
                Watching
              </span>
              <div className="t-marquee mt-4 overflow-hidden">
                <div className="t-marquee-track flex w-max items-center">
                  {[0, 1].map((copy) => (
                    <AvatarGroup
                      key={copy}
                      aria-hidden={copy === 1}
                      className="flex items-center gap-8 pr-8"
                      items={WATCHED_TOOLS.map((t) => (
                        <span
                          key={t.name}
                          className="flex items-center gap-2 text-sm text-[#55534D]"
                          title={t.name}
                        >
                          <span className="flex size-9 items-center justify-center text-sm font-semibold text-[#1D1D1F]">
                            <ToolMark slug={t.slug} name={t.name} className="size-5" />
                          </span>
                          {t.name}
                        </span>
                      ))}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </BackgroundSwitcher>

        <div id="deals" className="scroll-mt-24 px-6 pt-16 md:px-10">
          <div className="relative mx-auto w-full max-w-[1180px]">
            <RetroDither
              className="overflow-hidden rounded-[28px] border border-[#E5E3DC]"
              style={{ position: "absolute", inset: 0 }}
              baseStrength={0.5}
              strength={0.85}
              colorize={0.15}
              pixelSize={3}
              darkColor={[0.11, 0.11, 0.12]}
              lightColor={[0.97, 0.96, 0.95]}
            >
              <div className="relative h-full w-full overflow-hidden bg-[#F1F0EB]">
                <div
                  aria-hidden
                  className="absolute -left-24 -top-24 size-80 rounded-full bg-[#3F83F8]/20 blur-3xl"
                />
                <div
                  aria-hidden
                  className="absolute -bottom-28 -right-16 size-96 rounded-full bg-[#2563D6]/15 blur-3xl"
                />
              </div>
            </RetroDither>
            <div className="relative p-4 md:p-6">
              <DealExplorer className="max-w-none pb-0" />
            </div>
          </div>
        </div>

        <section className="mx-auto w-full max-w-[1180px] px-6 pb-24 md:px-10">
          <h2 className="text-center text-3xl font-medium -tracking-[0.06em]">
            The details that matter
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {/* Digest email — wide */}
            <div className="overflow-hidden rounded-2xl border border-[#E5E3DC] bg-white md:col-span-2">
              <div className="flex h-56 items-center justify-center border-b border-[#E5E3DC] bg-[#F1F0EB] px-8">
                <div className="w-full max-w-[340px] rounded-xl border border-[#E5E3DC] bg-white shadow-sm">
                  <div className="flex items-center gap-2 border-b border-[#E5E3DC] px-3.5 py-2.5">
                    <span className="flex size-5 items-center justify-center rounded-md bg-[#1D1D1F]">
                      <Bell className="size-3 text-white" />
                    </span>
                    <div className="flex-1 leading-tight">
                      <p className="text-[10px] font-semibold text-[#1D1D1F]">
                        Scrivo Alerts
                      </p>
                      <p className="text-[8px] text-[#9B988E]">
                        to you · just now
                      </p>
                    </div>
                    <span className="rounded-full bg-[#3F83F8] px-1.5 py-0.5 text-[8px] font-bold text-white">
                      3
                    </span>
                  </div>
                  <p className="px-3.5 pt-2.5 text-[10px] font-semibold text-[#1D1D1F]">
                    3 deals just matched your watchlist
                  </p>
                  <div className="px-3.5 pb-2.5 pt-1.5">
                    {[
                      { slug: "claude", name: "Claude Pro", tag: "20% off annual", price: "$17" },
                      { slug: "devin", name: "Devin", tag: "Core plan", price: "$15" },
                      { slug: "cursor", name: "Cursor", tag: "Student", price: "Free" },
                    ].map((d) => (
                      <div
                        key={d.slug}
                        className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E3DC] px-2 py-1.5"
                      >
                        <ToolMark slug={d.slug} name={d.name} className="size-3.5" />
                        <span className="text-[9px] font-semibold text-[#1D1D1F]">
                          {d.name}
                        </span>
                        <span className="flex-1 truncate text-[8px] text-[#9B988E]">
                          {d.tag}
                        </span>
                        <span className="text-[9px] font-bold text-[#1D1D1F]">
                          {d.price}
                          <span className="font-medium text-[#9B988E]">/mo</span>
                        </span>
                      </div>
                    ))}
                    <div className="mt-2 flex justify-center">
                      <span className="rounded-full bg-[#1D1D1F] px-4 py-1.5 text-[8px] font-bold uppercase tracking-wider text-white">
                        View all deals
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <BentoCopy
                title="Your inbox is the deal feed"
                body="Matched offers land as a digest you can act on. Every row links straight to the offer."
              />
            </div>
            {/* Live offer ticker — tall */}
            <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E5E3DC] bg-white md:row-span-2">
              <div className="relative flex-1 overflow-hidden bg-[#F1F0EB]">
                <div className="t-ticker absolute inset-x-3 top-0">
                  {[0, 1].map((copy) => (
                    <div key={copy} aria-hidden={copy === 1}>
                      {[
                        { slug: "chatgpt", name: "ChatGPT Go", tag: "New tier", price: "$8" },
                        { slug: "perplexity", name: "Perplexity", tag: "Annual", price: "$17" },
                        { slug: "gemini", name: "Gemini", tag: "1 mo free", price: "Trial" },
                        { slug: "midjourney", name: "Midjourney", tag: "20% off", price: "$8" },
                        { slug: "notion-ai", name: "Notion AI", tag: "Annual", price: "$8" },
                        { slug: "runway", name: "Runway", tag: "Free tier", price: "$0" },
                        { slug: "jasper", name: "Jasper", tag: "7-day trial", price: "Trial" },
                        { slug: "claude", name: "Claude Pro", tag: "Annual", price: "$17" },
                      ].map((d) => (
                        <div
                          key={`${copy}-${d.slug}`}
                          className="mt-2.5 flex items-center gap-2 rounded-xl border border-[#E5E3DC] bg-white px-2.5 py-2 shadow-sm"
                        >
                          <ToolMark slug={d.slug} name={d.name} className="size-4" />
                          <div className="min-w-0 flex-1 leading-tight">
                            <p className="truncate text-[9px] font-semibold text-[#1D1D1F]">
                              {d.name}
                            </p>
                            <p className="truncate text-[8px] text-[#9B988E]">{d.tag}</p>
                          </div>
                          <span className="text-[9px] font-bold text-[#1D1D1F]">
                            {d.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#F1F0EB] to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
              </div>
              <BentoCopy
                title="Every offer, as we find it"
                body="Vendor pricing pages get re-scanned hourly. New deals land in the feed the moment they go live."
              />
            </div>
            {/* Price drop */}
            <div className="overflow-hidden rounded-2xl border border-[#E5E3DC] bg-white">
              <div className="flex h-56 items-center justify-center border-b border-[#E5E3DC] bg-[#F1F0EB] px-8">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-medium -tracking-[0.04em] text-[#9B988E] line-through decoration-[#C96F5E] decoration-2">
                    $20
                  </span>
                  <MoveRight className="size-5 text-[#9B988E]" />
                  <div className="text-center">
                    <span className="text-5xl font-medium -tracking-[0.05em] text-[#3F83F8]">
                      $8
                    </span>
                    <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#9B988E]">
                      /mo · same plan
                    </p>
                  </div>
                </div>
              </div>
              <BentoCopy
                title="Watch the price drop"
                body="List price vs. the deal price, side by side. Intro offer, annual billing, student rate."
              />
            </div>
            {/* Renewal reminder */}
            <div className="overflow-hidden rounded-2xl border border-[#E5E3DC] bg-white">
              <div className="flex h-56 items-center justify-center border-b border-[#E5E3DC] bg-[#F1F0EB] px-8">
                <div className="w-full max-w-[260px] rounded-2xl border border-[#E5E3DC] bg-white/90 p-3 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-wider text-[#9B988E]">
                    <Bell className="size-2.5" />
                    Scrivo · now
                  </div>
                  <p className="mt-1.5 text-[10px] font-semibold leading-snug text-[#1D1D1F]">
                    Midjourney renews in 4 days
                  </p>
                  <p className="mt-0.5 text-[9px] leading-snug text-[#777773]">
                    Switch to annual before then and save 20%.
                  </p>
                </div>
              </div>
              <BentoCopy
                title="Reminders before you get billed"
                body="Trial ending, renewal coming, price changing. Scrivo pings you first."
              />
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#E5E3DC] bg-[#F4F2EC]">
        <div className="mx-auto w-full max-w-[1180px] px-6 pb-10 pt-20 md:px-10 md:pt-28">
          <div className="grid gap-16 md:grid-cols-2">
            <div>
              <span className="text-[96px] font-semibold leading-none -tracking-[0.06em] text-[#1D1D1F] md:text-[140px]">
                Scrivo<span className="text-[#3F83F8]">.</span>
              </span>
            </div>
            <div className="md:pt-4">
              <h2 className="max-w-sm text-3xl font-medium leading-tight -tracking-[0.04em] text-[#1D1D1F] md:text-4xl">
                Never overpay for an AI subscription again
              </h2>
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <StartComparing className="px-5 py-2.5 text-xs uppercase tracking-wider" />
                <a
                  href="mailto:scrivo@agentmail.to"
                  className="rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1D1D1F] transition-transform hover:-translate-y-px"
                >
                  scrivo@agentmail.to
                </a>
              </div>
              <div className="mt-16 grid grid-cols-2 gap-10">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9B988E]">
                    Product
                  </p>
                  <div className="mt-4 flex flex-col gap-2.5 text-sm text-[#1D1D1F]">
                    <Link href="/deals" className="hover:text-[#3F83F8]">Explore deals</Link>
                    <Link href="/automations?new=1" className="hover:text-[#3F83F8]">Set an alert</Link>
                    <Link href="/scout" className="hover:text-[#3F83F8]">Scout</Link>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9B988E]">
                    Your account
                  </p>
                  <div className="mt-4 flex flex-col gap-2.5 text-sm text-[#1D1D1F]">
                    <Link href="/onboarding" className="hover:text-[#3F83F8]">Onboarding</Link>
                    <Link href="/automations" className="hover:text-[#3F83F8]">Automations</Link>
                    <Link href="/saved" className="hover:text-[#3F83F8]">Saved deals</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-24 flex flex-col gap-3 border-t border-[#E5E3DC] pt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9B988E] md:flex-row md:items-center md:justify-between">
            <span>All rights reserved. Scrivo 2026.</span>
            <div className="flex gap-8">
              <span>Deals verified by Firecrawl</span>
              <span>Built on Convex</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BentoCopy({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-[#777773]">{body}</p>
    </div>
  );
}
