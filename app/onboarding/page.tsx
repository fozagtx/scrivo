"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Tag } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { AppHeader } from "@/components/app-header";
import { Reveal, RevealLine } from "@/components/reveal";
import { CandyButton } from "@/components/ui/candy-button";
import RetroDither from "@/components/canvasui/RetroDither";
import { useGuestId } from "@/lib/guest";

export default function OnboardingPage() {
  const router = useRouter();
  const guestId = useGuestId();
  const me = useQuery(
    api.users.me,
    guestId === null ? "skip" : { guestId },
  );
  const identify = useMutation(api.users.identify);

  const [name, setName] = useState("");
  const [preparing, setPreparing] = useState(false);

  const resolvedName = (name.trim() || me?.name || "").trim();

  useEffect(() => {
    if (!preparing) return;
    const t = setTimeout(() => router.push("/deals"), 2000);
    return () => clearTimeout(t);
  }, [preparing, router]);

  const submit = async () => {
    if (!resolvedName || preparing) return;
    setPreparing(true);
    try {
      await identify({
        guestId: guestId ?? undefined,
        name: resolvedName,
      });
    } catch {
      router.push("/deals");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] font-sans text-[#1D1D1F]">
      <AppHeader />
      <main className="flex min-h-[calc(100vh-72px)] flex-col items-center px-6 py-12">
        <div className="flex w-full max-w-[1180px] flex-col items-center gap-4">
          <section className="w-full overflow-hidden rounded-[22px] border border-[#E5E3DC] bg-white p-8 md:p-12">
            {preparing ? (
              <div className="flex min-h-[480px] flex-col items-center justify-center gap-6 text-center">
                <span className="t-prepare-pulse flex size-14 items-center justify-center rounded-2xl bg-[#3F83F8]">
                  <Tag className="size-6 text-white" />
                </span>
                <div>
                  <h1 className="text-3xl font-medium -tracking-[0.05em] md:text-4xl">
                    Setting up{" "}
                    <span className="text-[#3F83F8]">{resolvedName}</span>
                    ’s dashboard
                  </h1>
                  <p className="mt-3 text-sm text-[#777773]">
                    Saving your profile and warming up the scanners.
                  </p>
                </div>
                <div className="h-1 w-56 overflow-hidden rounded-full bg-[#F1F0EB]">
                  <div className="t-prepare-bar h-full rounded-full bg-[#3F83F8]" />
                </div>
              </div>
            ) : (
              <div className="grid min-h-[480px] gap-12 md:grid-cols-2">
                <RetroDither
                  className="overflow-hidden rounded-[14px] border border-[#E5E3DC]"
                  baseStrength={0.55}
                  strength={0.85}
                  colorize={0.15}
                  pixelSize={3}
                  darkColor={[0.11, 0.11, 0.12]}
                  lightColor={[0.97, 0.96, 0.95]}
                >
                  <div className="relative flex h-full min-h-[320px] flex-col justify-center gap-6 overflow-hidden p-8 md:p-10">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -left-16 -top-16 size-64 rounded-full bg-[#3F83F8]/25 blur-2xl"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -bottom-20 -right-10 size-72 rounded-full bg-[#2563D6]/15 blur-2xl"
                    />
                    <Reveal className="relative flex flex-col justify-center gap-6">
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
                        <p className="max-w-md text-base leading-7 -tracking-[0.01em] text-[#55534D]">
                          We’ll use your preferences to find relevant AI
                          subscription deals and skip the noise.
                        </p>
                      </RevealLine>
                    </Reveal>
                  </div>
                </RetroDither>
                <div className="flex flex-col gap-6 rounded-[14px] border border-[#E5E3DC] bg-white p-8">
                  <h2 className="text-xl font-medium -tracking-[0.03em]">
                    First, what should we call you?
                  </h2>
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="name"
                        className="text-sm font-semibold"
                      >
                        Your name
                      </label>
                      <input
                        id="name"
                        type="text"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && submit()}
                        placeholder={me?.name || "e.g. Fawuzan"}
                        className="h-11 rounded-[8px] border border-[#E5E3DC] bg-white px-3 text-sm outline-hidden focus:ring-2 focus:ring-[#3F83F8]"
                      />
                      <p className="text-xs text-[#777773]">
                        This is the name we’ll greet you with across your
                        dashboard and digests. You’ll pick the delivery email
                        when you set up your first automation.
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-[#E5E3DC] pt-6">
                    <Link
                      href="/deals"
                      className="rounded-full px-3 py-2 text-sm font-medium text-[#777773]"
                    >
                      Skip for now
                    </Link>
                    <CandyButton
                      type="button"
                      onClick={submit}
                      disabled={!resolvedName}
                      className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm disabled:opacity-50"
                    >
                      Continue
                      <ArrowRight className="size-4" />
                    </CandyButton>
                  </div>
                </div>
              </div>
            )}
          </section>
          <p className="text-sm text-[#777773]">
            You can change these preferences anytime.
          </p>
        </div>
      </main>
    </div>
  );
}
