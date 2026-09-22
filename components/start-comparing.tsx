"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { CandyButton } from "@/components/ui/candy-button";
import { cn } from "@/lib/utils";

/**
 * Primary CTA — candy button with a trailing arrow. Routes straight to
 * onboarding; the "setting up" interstitial lives on that page instead.
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

  return (
    <CandyButton
      type="button"
      onClick={() => router.push(href)}
      className={cn(
        "group flex items-center gap-2 rounded-full px-6 py-2.5 text-sm",
        className,
      )}
    >
      {label}
      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    </CandyButton>
  );
}
