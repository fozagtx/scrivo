"use client";

import { SignInButton } from "@clerk/react";

import { HAS_CLERK } from "@/lib/clerk";

/**
 * "Sign in with your account" door for onboarding. Renders nothing unless
 * Clerk is configured — and keeps @clerk/react out of callers' imports so
 * the page works when ClerkProvider isn't mounted.
 */
export function ClerkSignIn() {
  if (!HAS_CLERK) return null;
  return (
    <>
      <SignInButton mode="modal" forceRedirectUrl="/deals">
        <button
          type="button"
          className="w-full rounded-lg bg-[#F1F0EB] px-5 py-2.5 text-sm font-medium text-[#1D1D1F]"
        >
          Sign in with your account
        </button>
      </SignInButton>
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-[#E5E3DC]" />
        <span className="text-xs text-[#777773]">or</span>
        <span className="h-px flex-1 bg-[#E5E3DC]" />
      </div>
    </>
  );
}
