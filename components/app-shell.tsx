"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import {
  Bookmark,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Tag,
  Zap,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { HookSidebar } from "@/components/hook-sidebar";
import { CandyButton } from "@/components/ui/candy-button";
import { useGuestId } from "@/lib/guest";
import { cn } from "@/lib/utils";

const SIDEBAR_KEY = "scrivo.sidebar";

const ITEMS = [
  { label: "Deals", href: "/deals", icon: Tag },
  { label: "Saved", href: "/saved", icon: Bookmark },
  { label: "Automations", href: "/automations", icon: Zap },
  { label: "Scout", href: "/scout", icon: MessageSquare },
];

const noopSubscribe = () => () => {};

export function AppShell({ children }: { children: React.ReactNode }) {
  const guestId = useGuestId();
  const pathname = usePathname();
  const me = useQuery(
    api.users.me,
    guestId === null ? "skip" : { guestId },
  );

  // Persisted collapse state. useSyncExternalStore keeps SSR/hydration at
  // expanded (server snapshot = false) then swaps to the stored value.
  const stored = useSyncExternalStore(
    noopSubscribe,
    () => window.localStorage.getItem(SIDEBAR_KEY) === "1",
    () => false,
  );
  const [override, setOverride] = useState<boolean | null>(null);
  const collapsed = override ?? stored;
  const toggleCollapsed = useCallback(() => {
    setOverride((prev) => {
      const next = !(prev ?? stored);
      window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  }, [stored]);

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

      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-[#E5E3DC] bg-white py-7 transition-[width] duration-300 ease-out motion-reduce:transition-none md:flex",
          collapsed ? "w-[68px] px-3" : "w-56 px-5",
        )}
      >
        {collapsed ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              aria-expanded={false}
              className="flex size-8 items-center justify-center rounded-lg border border-[#E5E3DC] text-[#55534D] transition-colors hover:bg-[#F8F7F3]"
            >
              <PanelLeftOpen className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="pl-0.5 text-lg font-semibold -tracking-[0.04em] text-[#1D1D1F]"
              aria-label="Scrivo home"
            >
              Scrivo
            </Link>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              aria-expanded={true}
              className="flex size-8 items-center justify-center rounded-lg border border-[#E5E3DC] text-[#55534D] transition-colors hover:bg-[#F8F7F3]"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </div>
        )}

        {collapsed ? (
          <nav className="mt-8 flex flex-col items-center gap-1">
            {ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg text-[#777773] transition-colors hover:bg-[#F8F7F3]",
                    active && "bg-[#3F83F8]/10 text-[#2563D6] hover:bg-[#3F83F8]/10",
                  )}
                >
                  <Icon className="size-4.5" />
                </Link>
              );
            })}
          </nav>
        ) : (
          <HookSidebar items={ITEMS} label="Dashboard" className="mt-8" />
        )}

        {collapsed ? (
          <div className="mt-auto flex flex-col items-center gap-3 border-t border-[#E5E3DC] pt-5">
            {me && (
              <span className="flex size-8 items-center justify-center rounded-full bg-[#3F83F8] text-[11px] font-semibold text-white">
                {me.name.charAt(0).toUpperCase()}
              </span>
            )}
            <Link
              href="/alerts/new"
              title="New alert"
              aria-label="New alert"
              className="flex size-10 items-center justify-center rounded-lg bg-[#3F83F8] text-white transition-colors hover:bg-[#2563D6]"
            >
              <Plus className="size-4.5" />
            </Link>
          </div>
        ) : (
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
        )}
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
