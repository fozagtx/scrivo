"use client";

import Link from "next/link";
import { Show, SignInButton } from "@clerk/react";

import { HAS_CLERK } from "@/lib/clerk";

export function SiteHeader() {
  return (
    <header className="sticky top-4 z-50 mx-auto w-full max-w-[1180px] px-6 md:px-10">
      <div className="flex h-14 items-center justify-between rounded-full bg-[#1D1D1F] pl-5 pr-2 shadow-lg shadow-black/10">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold -tracking-[0.04em] text-white">
            Scrivo
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex">
          <a href="#deals" className="text-white">
            Explore deals
          </a>
          <a href="#categories" className="transition-colors hover:text-white">
            Categories
          </a>
        </nav>
        <div className="flex items-center gap-4">
          {!HAS_CLERK && (
            <Link
              href="/deals"
              className="rounded-full bg-[#F8F7F3] px-5 py-2 text-sm font-semibold text-[#1D1D1F] transition-transform hover:-translate-y-px"
            >
              Start comparing
            </Link>
          )}
          {HAS_CLERK && (
            <>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="text-sm text-white/70 transition-colors hover:text-white">
                    Sign in
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="rounded-full bg-[#F8F7F3] px-5 py-2 text-sm font-semibold text-[#1D1D1F] transition-transform hover:-translate-y-px">
                    Start comparing
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/automations"
                  className="rounded-full bg-[#F8F7F3] px-5 py-2 text-sm font-semibold text-[#1D1D1F] transition-transform hover:-translate-y-px"
                >
                  Open app
                </Link>
              </Show>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
