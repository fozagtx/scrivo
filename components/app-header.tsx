"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Tag } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

import { cn } from "@/lib/utils";
import { HAS_CLERK } from "@/lib/clerk";

const NAV = [
  { href: "/deals", label: "Deals" },
  { href: "/saved", label: "Saved" },
  { href: "/automations", label: "Automations" },
  { href: "/scout", label: "Scout" },
];

export function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="flex h-[72px] w-full items-center justify-between border-b border-[#E5E3DC] bg-white px-8">
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-2" aria-label="Scrivo home">
          <Tag className="size-5 text-[#3F83F8]" />
          <span className="text-base font-semibold -tracking-[0.02em] text-[#1D1D1F]">
            Scrivo
          </span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Primary navigation">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm text-[#1D1D1F]",
                  active && "bg-[#3F83F8]/10 font-medium text-[#2563D6]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="rounded-full p-2 text-[#3F83F8]"
        >
          <Bell className="size-5" />
        </button>
        <div className="flex items-center gap-2 rounded-full p-1">
          {HAS_CLERK ? (
            <UserButton
              appearance={{ elements: { avatarBox: "size-8" } }}
              afterSignOutUrl="/"
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-[#3F83F8] text-xs font-semibold text-white">
              DS
            </span>
          )}
          <ChevronDown className="size-4 text-[#777773]" />
        </div>
      </div>
    </header>
  );
}
