"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { CandyButton } from "@/components/ui/candy-button";
import { cn } from "@/lib/utils";

/**
 * Primary CTA — candy button with arrow; on click plays a short
 * "setting up" micro-interaction before routing to onboarding.
 */
export function StartComparing({
  href = "/onboarding",
  label = "Start comparing",
  className,
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "busy" | "done">("idle");

  const go = () => {
    if (phase !== "idle") return;
    setPhase("busy");
    setTimeout(() => setPhase("done"), 1100);
    setTimeout(() => router.push(href), 1400);
  };

  return (
    <CandyButton
      type="button"
      onClick={go}
      disabled={phase !== "idle"}
      className={cn(
        "flex items-center gap-2 rounded-full px-6 py-2.5 text-sm disabled:cursor-wait",
        phase === "done" && "brightness-110",
        className,
      )}
    >
      {phase === "idle" ? (
        <>
          {label}
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </>
      ) : phase === "busy" ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Setting up your dashboard…
        </>
      ) : (
        "Done"
      )}
    </CandyButton>
  );
}
