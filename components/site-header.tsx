"use client";

import Link from "next/link";
import { Tag } from "lucide-react";
import { SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react";

import { HAS_CLERK } from "@/lib/clerk";

export function SiteHeader() {
  return (
    <header className="flex h-[72px] items-center justify-between border-b border-[#E5E3DC] bg-white px-6 md:px-[84px]">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg border-2 border-[#3F83F8]">
          <Tag className="size-4 text-[#3F83F8]" />
        </div>
        <span className="text-lg font-semibold -tracking-[0.04em] text-[#1D1D1F]">
          Scrivo
        </span>
      </Link>
      <nav className="hidden items-center gap-8 text-sm text-[#777773] md:flex">
        <a href="#deals" className="text-[#1D1D1F]">
          Explore deals
        </a>
        <a href="#categories">Categories</a>
      </nav>
      <div className="flex items-center gap-6">
        {!HAS_CLERK && (
          <Link
            href="/deals"
            className="rounded-full bg-[#1D1D1F] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Start comparing
          </Link>
        )}
        {HAS_CLERK && (
          <>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm text-[#1D1D1F]">Sign in</button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="rounded-full bg-[#1D1D1F] px-5 py-2.5 text-sm font-semibold text-white">
                  Start comparing
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/automations"
                className="rounded-full bg-[#1D1D1F] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Open app
              </Link>
            </SignedIn>
          </>
        )}
      </div>
    </header>
  );
}
