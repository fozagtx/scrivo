"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { HookSidebar } from "@/components/hook-sidebar";
import { CandyButton } from "@/components/ui/candy-button";
import { useGuestId } from "@/lib/guest";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Deals", href: "/deals" },
  { label: "Saved", href: "/saved" },
  { label: "Automations", href: "/automations" },
  { label: "Scout", href: "/scout" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const guestId = useGuestId();
  const pathname = usePathname();
  const me = useQuery(
    api.users.me,
    guestId === null ? "skip" : { guestId },
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F7F3] font-sans text-[#1D1D1F] md:flex-row">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[#E5E3DC] bg-white px-4 md:hidden">
        <Link
          href="/"
          className="shrink-0 text-lg font-semibold -tracking-[0.04em] text-[#1D1D1F]"
          aria-label="Scrivo home"
        >
          Scrivo
        </Link>
        <nav className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-sm text-[#777773] transition-colors",
                  active && "bg-[#F1F0EB] font-medium text-[#1D1D1F]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {me && (
            <span className="flex size-7 items-center justify-center rounded-full bg-[#3F83F8] text-[11px] font-semibold text-white">
              {me.name.charAt(0).toUpperCase()}
            </span>
          )}
          <Link
            href="/alerts/new"
            aria-label="New alert"
            className="flex size-8 items-center justify-center rounded-lg border border-[#E5E3DC] text-[#55534D] transition-colors hover:bg-[#F8F7F3]"
          >
            <Plus className="size-4" />
          </Link>
        </div>
      </header>

      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-[#E5E3DC] bg-white px-5 py-7 md:flex">
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
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export function Page({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-[1420px] flex-col gap-6 px-4 py-6 md:px-10 md:py-8",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow && <p className="text-xs text-[#777773]">{eyebrow}</p>}
        <h1 className="text-balance text-2xl font-medium -tracking-[0.05em] md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-[#777773]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
