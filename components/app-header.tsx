"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { Bell, ChevronDown, User } from "lucide-react";
import { UserButton } from "@clerk/react";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { HAS_CLERK } from "@/lib/clerk";
import { useGuestId } from "@/lib/guest";

const NAV = [
  { href: "/deals", label: "Deals" },
  { href: "/saved", label: "Saved" },
  { href: "/automations", label: "Automations" },
  { href: "/scout", label: "Scout" },
];

export function AppHeader() {
  const pathname = usePathname();
  const guestId = useGuestId();
  const me = useQuery(
    api.users.me,
    guestId === null ? "skip" : { guestId },
  );
  return (
    <header className="flex h-[72px] w-full items-center justify-between border-b border-[#E5E3DC] bg-white px-8">
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-2" aria-label="Scrivo home">
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
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-[#3F83F8] text-xs font-semibold text-white">
              {me?.name ? (
                me.name.charAt(0).toUpperCase()
              ) : (
                <User className="size-4" />
              )}
            </span>
          )}
          <ChevronDown className="size-4 text-[#777773]" />
        </div>
      </div>
    </header>
  );
}
