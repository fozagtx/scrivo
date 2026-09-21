"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";

import { api } from "@/convex/_generated/api";
import { AppHeader } from "@/components/app-header";
import { Reveal, RevealLine } from "@/components/reveal";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Writing",
  "Coding",
  "Design",
  "Research",
  "Video",
  "Productivity",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me);
  const upsert = useMutation(api.profiles.upsert);

  const [categories, setCategories] = useState<string[]>(["Coding"]);
  const [budget, setBudget] = useState(40);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const resolvedEmail = email || me?.email || "";

  const toggle = (c: string) =>
    setCategories((list) =>
      list.includes(c) ? list.filter((v) => v !== c) : [...list, c],
    );

  const submit = async () => {
    if (!isAuthenticated) {
      router.push("/alerts/new");
      return;
    }
    setSaving(true);
    try {
      await upsert({
        categories,
        monthlyBudgetCents: budget * 100,
        alertEmail: resolvedEmail,
      });
      router.push("/alerts/new");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] font-sans text-[#1D1D1F]">
      <AppHeader />
      <main className="flex min-h-[calc(100vh-72px)] flex-col items-center px-6 py-12">
        <div className="flex w-full max-w-[1180px] flex-col items-center gap-4">
          <p className="text-sm text-[#777773]">Step 1 of 3</p>
          <section className="w-full rounded-[22px] border border-[#E5E3DC] bg-white p-8 md:p-12">
            <div className="grid min-h-[480px] gap-12 md:grid-cols-2">
              <Reveal className="flex flex-col justify-center gap-6 md:pr-8">
                <RevealLine>
                  <p className="text-xs font-semibold tracking-[0.18em] text-[#3F83F8]">
                    PERSONALIZE YOUR SCOUT
                  </p>
                </RevealLine>
                <RevealLine index={1}>
                  <h1 className="max-w-md text-[40px] font-medium leading-[0.98] -tracking-[0.06em]">
                    Tell us what you want to save on.
                  </h1>
                </RevealLine>
                <RevealLine index={2}>
                  <p className="max-w-md text-base leading-7 -tracking-[0.01em] text-[#777773]">
                    We’ll use your preferences to find relevant AI subscription
                    deals and skip the noise.
                  </p>
                </RevealLine>
              </Reveal>
              <div className="flex flex-col gap-6 rounded-[14px] border border-[#E5E3DC] bg-white p-8">
                <h2 className="text-xl font-medium -tracking-[0.03em]">
                  Your deal profile
                </h2>
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-semibold">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggle(c)}
                          className={cn(
                            "rounded-full border border-[#E5E3DC] px-4 py-2 text-sm text-[#1D1D1F] transition-colors",
                            categories.includes(c) &&
                              "border-transparent bg-[#3F83F8]/10 font-medium text-[#2563D6]",
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="budget" className="text-sm font-semibold">
                        Monthly budget
                      </label>
                      <span className="text-sm font-semibold text-[#3F83F8]">
                        ${budget} / month
                      </span>
                    </div>
                    <input
                      id="budget"
                      type="range"
                      min={0}
                      max={100}
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="h-2 w-full accent-[#3F83F8]"
                    />
                    <div className="flex justify-between text-xs text-[#777773]">
                      <span>$0</span>
                      <span>$100+</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-sm font-semibold">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={resolvedEmail || "you@example.com"}
                      className="h-10 rounded-[8px] border border-[#E5E3DC] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#3F83F8]"
                    />
                    <p className="text-xs text-[#777773]">
                      Your alerts will be sent here.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#E5E3DC] pt-6">
                  <Link
                    href="/deals"
                    className="rounded-full px-3 py-2 text-sm font-medium text-[#777773]"
                  >
                    Skip for now
                  </Link>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={saving}
                    className="rounded-[8px] bg-[#3F83F8] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Continue"}
                  </button>
                </div>
              </div>
            </div>
          </section>
          <p className="text-sm text-[#777773]">
            You can change these preferences anytime.
          </p>
        </div>
      </main>
    </div>
  );
}
