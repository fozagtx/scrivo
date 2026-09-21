import Link from "next/link";
import {
  BadgePercent,
  Bell,
  Calculator,
  Workflow,
} from "lucide-react";

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

const FEATURES = [
  {
    icon: Calculator,
    title: "Real monthly cost",
    body: "See what you’ll actually pay after the intro offer ends.",
  },
  {
    icon: BadgePercent,
    title: "Intro savings",
    body: "Compare the discount, trial length, and renewal price side by side.",
  },
  {
    icon: Workflow,
    title: "Best for your workflow",
    body: "Choose tools based on how you work — not hype.",
  },
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
                  <span className="text-[#3F83F8]">best AI subscription deals</span>{" "}
                  for your budget before you subscribe.
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
          <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-20">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <f.icon className="size-5 text-[#3F83F8]" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#777773]">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-[#E5E3DC] bg-white">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-6 py-8 text-sm text-[#777773] md:px-10">
          <span className="font-semibold text-[#1D1D1F]">Scrivo</span>
          <span>Deals verified by Firecrawl. Sent via email.</span>
        </div>
      </footer>
    </div>
  );
}
