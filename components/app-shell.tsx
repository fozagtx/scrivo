"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { HookSidebar } from "@/components/hook-sidebar";
import { CandyButton } from "@/components/ui/candy-button";
import { useGuestId } from "@/lib/guest";

const ITEMS = [
  { label: "Deals", href: "/deals" },
  { label: "Saved", href: "/saved" },
  { label: "Automations", href: "/automations" },
  { label: "Scout", href: "/scout" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const guestId = useGuestId();
  const me = useQuery(
    api.users.me,
    guestId === null ? "skip" : { guestId },
  );

  return (
    <div className="flex min-h-screen bg-[#F8F7F3] font-sans text-[#1D1D1F]">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-[#E5E3DC] bg-white px-5 py-7">
        <Link
          href="/"
          className="pl-0.5 text-lg font-semibold -tracking-[0.04em] text-[#1D1D1F]"
          aria-label="Scrivo home"
        >
          Scrivo
        </Link>
        <HookSidebar items={ITEMS} label="Dashboard" className="mt-8" />
        <div className="mt-auto flex flex-col gap-4 border-t border-[#E5E3DC] pt-5">
          {me && (
            <div className="flex items-center gap-2.5 pl-0.5">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#3F83F8] text-[11px] font-semibold text-white">
                {me.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold">{me.name}</p>
                {me.email && (
                  <p className="truncate text-[11px] text-[#9B988E]">
                    {me.email}
                  </p>
                )}
              </div>
            </div>
          )}
          <Link href="/alerts/new" className="w-full">
            <CandyButton className="flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs">
              <Plus className="size-3.5" />
              New alert
            </CandyButton>
          </Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
