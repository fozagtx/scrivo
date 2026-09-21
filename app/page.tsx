import Link from "next/link";
import { Bell, Radar } from "lucide-react";

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
                  <Link
                    href="/onboarding"
                    className="rounded-full bg-[#1D1D1F] px-6 py-3 text-sm font-semibold text-white transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Start comparing
                  </Link>
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
          <DealExplorer />
        </div>

        <section className="mx-auto w-full max-w-[1180px] px-6 pb-24 md:px-10">
          <h2 className="text-center text-3xl font-medium -tracking-[0.06em]">
            The details that matter
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {/* Digest email — wide */}
            <div className="rounded-2xl border border-[#E5E3DC] bg-white md:col-span-2">
              <BentoVisual className="items-center justify-center px-6">
                <div className="w-full max-w-[300px] rounded-xl border border-[#E5E3DC] bg-white p-3 shadow-sm">
                  <p className="text-[10px] font-semibold text-[#1D1D1F]">
                    2 deals hit your watchlist
                  </p>
                  {[
                    { slug: "claude", name: "Claude Pro", price: "$17/mo" },
                    { slug: "cursor", name: "Cursor", price: "Free" },
                  ].map((d) => (
                    <div
                      key={d.slug}
                      className="mt-1.5 flex items-center gap-2 rounded-lg border border-[#E5E3DC] px-2 py-1.5"
                    >
                      <ToolMark slug={d.slug} name={d.name} className="size-3.5" />
                      <span className="flex-1 text-[9px] font-medium text-[#1D1D1F]">
                        {d.name}
                      </span>
                      <span className="text-[9px] font-semibold text-[#1D1D1F]">
                        {d.price}
                      </span>
                    </div>
                  ))}
                </div>
              </BentoVisual>
              <BentoCopy
                title="Digests that only fire on matches"
                body="An email goes out the moment a deal matches your watchlist — never noise, never spam."
              />
            </div>
            {/* Tools watched */}
            <div className="rounded-2xl border border-[#E5E3DC] bg-white">
              <BentoVisual className="items-center justify-center">
                <div className="grid grid-cols-3 gap-3">
                  {["claude", "chatgpt", "cursor", "devin", "perplexity", "gemini"].map(
                    (slug) => (
                      <span
                        key={slug}
                        className="flex size-11 items-center justify-center rounded-full border border-[#E5E3DC] bg-white shadow-sm"
                      >
                        <ToolMark slug={slug} name={slug} className="size-5" />
                      </span>
                    ),
                  )}
                </div>
              </BentoVisual>
              <BentoCopy
                title="Every major AI tool, watched"
                body="12 vendors tracked across coding, writing, research, video, and design."
              />
            </div>
            {/* Savings */}
            <div className="rounded-2xl border border-[#E5E3DC] bg-white">
              <BentoVisual className="items-center justify-center px-8">
                <div className="w-full">
                  <div className="mb-2 flex items-center justify-between text-[9px] text-[#777773]">
                    <span>Cost after intro ends</span>
                    <span className="rounded bg-[#EAF7EE] px-1.5 py-0.5 font-semibold text-[#41A85F]">
                      Save 60%
                    </span>
                  </div>
                  <svg viewBox="0 0 200 48" className="w-full">
                    <polyline
                      points="0,34 30,30 60,36 90,22 120,26 150,14 180,18 200,8"
                      fill="none"
                      stroke="#3F83F8"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <polyline
                      points="0,10 30,12 60,8 90,14 120,10 150,16 180,12 200,14"
                      fill="none"
                      stroke="#D2D0C8"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  </svg>
                </div>
              </BentoVisual>
              <BentoCopy
                title="Real savings, quantified"
                body="Intro price, renewal cost, and savings % side by side on every offer."
              />
            </div>
            {/* Budget */}
            <div className="rounded-2xl border border-[#E5E3DC] bg-white">
              <BentoVisual className="items-center justify-center px-8">
                <div className="w-full">
                  <div className="h-1.5 w-full rounded-full bg-[#F1F0EB]">
                    <div className="h-full w-2/5 rounded-full bg-[#3F83F8]" />
                  </div>
                  <div className="mt-2 flex justify-between text-[9px] font-medium text-[#777773]">
                    <span>$0</span>
                    <span className="rounded-full bg-[#1D1D1F] px-2 py-0.5 text-white">
                      $40/mo
                    </span>
                    <span>$100+</span>
                  </div>
                </div>
              </BentoVisual>
              <BentoCopy
                title="Budget-aware filtering"
                body="Cap your monthly spend and only see offers that fit under it."
              />
            </div>
            {/* Scout */}
            <div className="rounded-2xl border border-[#E5E3DC] bg-white">
              <BentoVisual className="items-end justify-center px-5 pb-4">
                <div className="w-full">
                  <div className="ml-auto w-fit max-w-[85%] rounded-xl rounded-br-sm bg-[#3F83F8] px-3 py-2 text-[9px] font-medium text-white">
                    Cheapest coding setup under $30/mo?
                  </div>
                  <div className="mt-1.5 w-fit max-w-[85%] rounded-xl rounded-bl-sm border border-[#E5E3DC] bg-white px-3 py-2 text-[9px] text-[#55534D]">
                    Cursor student Pro + Codex via ChatGPT Go — $8/mo total.
                  </div>
                </div>
              </BentoVisual>
              <BentoCopy
                title="Scout answers from live offers"
                body="Ask what fits your workflow — Scout grounds every answer in current deals."
              />
            </div>
            {/* Hourly scans */}
            <div className="rounded-2xl border border-[#E5E3DC] bg-white">
              <BentoVisual className="items-center justify-center">
                <div className="flex items-center gap-3">
                  <span className="relative flex size-11 items-center justify-center rounded-full border border-[#E5E3DC] bg-white shadow-sm">
                    <Radar className="size-5 text-[#3F83F8]" />
                    <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#41A85F] ring-2 ring-white" />
                  </span>
                  <div className="text-left">
                    <p className="text-[10px] font-semibold text-[#1D1D1F]">
                      Scanning pricing pages
                    </p>
                    <p className="text-[9px] text-[#777773]">every hour, via Firecrawl</p>
                  </div>
                </div>
              </BentoVisual>
              <BentoCopy
                title="Fresh scans on a schedule"
                body="Vendor pricing pages are re-checked hourly — stale deals get retired automatically."
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
                <Link
                  href="/onboarding"
                  className="rounded-full bg-[#1D1D1F] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-px"
                >
                  Start comparing
                </Link>
                <a
                  href="mailto:alerts@scrivo.app"
                  className="rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1D1D1F] transition-transform hover:-translate-y-px"
                >
                  alerts@scrivo.app
                </a>
              </div>
              <div className="mt-16 grid grid-cols-2 gap-10">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9B988E]">
                    Product
                  </p>
                  <div className="mt-4 flex flex-col gap-2.5 text-sm text-[#1D1D1F]">
                    <Link href="/deals" className="hover:text-[#3F83F8]">Explore deals</Link>
                    <Link href="/alerts/new" className="hover:text-[#3F83F8]">Set an alert</Link>
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

function BentoVisual({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-44 overflow-hidden rounded-t-2xl border-b border-[#E5E3DC] bg-[#F8F7F3] bg-[linear-gradient(#EDEBE4_1px,transparent_1px),linear-gradient(90deg,#EDEBE4_1px,transparent_1px)] bg-[size:22px_22px] ${className}`}
    >
      {children}
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
