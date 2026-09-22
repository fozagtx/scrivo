"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Search } from "lucide-react";
import { ToolMark } from "@/components/tool-mark";
import { SaveButton } from "@/components/save-button";
import { Toast } from "@/components/toast";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useGuestId } from "@/lib/guest";

const CATEGORIES = [
  "Writing",
  "Coding",
  "Design",
  "Research",
  "Video",
  "Productivity",
];

const OFFER_TYPES = [
  { value: "free_trial", label: "Free trial" },
  { value: "discount", label: "Discount" },
  { value: "bundle", label: "Bundle" },
  { value: "student", label: "Student offer" },
];

const SORT_LABELS: Record<string, string> = {
  "biggest-savings": "Biggest savings",
  "lowest-price": "Lowest price",
  newest: "Newest",
};

const fmt = (cents: number | undefined | null) =>
  cents == null ? "—" : `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

export type ListedOffer = {
  _id: Id<"offers">;
  title: string;
  summary: string;
  url: string;
  offerType: string;
  priceCents?: number | null;
  originalPriceCents?: number | null;
  savingsPct?: number | null;
  tool: { name: string; category: string; slug?: string; mark?: string };
};

export function DealExplorer({
  className,
  variant = "card",
}: {
  className?: string;
  variant?: "card" | "page";
}) {
  const isPage = variant === "page";
  const [categories, setCategories] = useState<string[]>([]);
  const [offerTypes, setOfferTypes] = useState<string[]>([]);
  const [budget, setBudget] = useState(100);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("biggest-savings");
  const [toast, setToast] = useState(false);

  const offers = useQuery(api.offers.list, {
    categories: categories.length ? categories : undefined,
    offerTypes: offerTypes.length ? offerTypes : undefined,
    maxMonthlyCents: budget >= 100 ? undefined : budget * 100,
    search: search || undefined,
    sort,
  });

  const liveCount = useQuery(api.offers.count, {});

  const toggle = (
    list: string[],
    set: (v: string[]) => void,
    value: string,
  ) =>
    set(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value],
    );

  const reset = () => {
    setCategories([]);
    setOfferTypes([]);
    setBudget(100);
    setSearch("");
  };

  const anyFilterActive =
    categories.length > 0 ||
    offerTypes.length > 0 ||
    budget < 100 ||
    search !== "";

  const shown = useMemo<ListedOffer[]>(() => offers ?? [], [offers]);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = () => {
    setToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 2400);
  };

  const filtersAside = (
    <aside
      className={cn(
        "lg:border-r lg:border-[#E5E3DC] lg:pr-6",
        isPage && "hidden lg:block",
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#1D1D1F]">Filter deals</h3>
        <button
          onClick={reset}
          className="text-xs text-[#3F83F8]"
          type="button"
        >
          Reset filters
        </button>
      </div>
      <div className="mt-5 border-t border-[#E5E3DC] pt-5">
        <h4 className="text-sm font-semibold">Category</h4>
        <div className="mt-3 text-sm text-[#777773]">
          {CATEGORIES.map((c) => (
            <label key={c} className="mb-3 flex items-center gap-2 last:mb-0">
              <Checkbox
                checked={categories.includes(c)}
                onCheckedChange={() => toggle(categories, setCategories, c)}
              />
              {c}
            </label>
          ))}
        </div>
      </div>
      <div className="mt-6 border-t border-[#E5E3DC] pt-5">
        <h4 className="text-sm font-semibold">Monthly budget</h4>
        <input
          type="range"
          min={0}
          max={100}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="mt-4 w-full accent-[#3F83F8]"
        />
        <div className="flex justify-between text-xs text-[#777773]">
          <span>$0</span>
          <span>$100+</span>
        </div>
      </div>
      <div className="mt-6 border-t border-[#E5E3DC] pt-5">
        <h4 className="text-sm font-semibold">Offer type</h4>
        <div className="mt-3 text-sm text-[#777773]">
          {OFFER_TYPES.map((t) => (
            <label
              key={t.value}
              className="mb-3 flex items-center gap-2 last:mb-0"
            >
              <Checkbox
                checked={offerTypes.includes(t.value)}
                onCheckedChange={() =>
                  toggle(offerTypes, setOfferTypes, t.value)
                }
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );

  const results = (
    <div>
      {isPage && (
        <div className="no-scrollbar mb-3 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
          {CATEGORIES.map((c) => {
            const on = categories.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(categories, setCategories, c)}
                className={cn(
                  "shrink-0 rounded-full border border-[#E5E3DC] bg-white px-3 py-1.5 text-xs text-[#1D1D1F]",
                  on &&
                    "border-transparent bg-[#3F83F8]/10 font-medium text-[#2563D6]",
                )}
              >
                {c}
              </button>
            );
          })}
          {anyFilterActive && (
            <button
              type="button"
              onClick={reset}
              className="shrink-0 rounded-full border border-[#E5E3DC] bg-white px-3 py-1.5 text-xs font-medium text-[#3F83F8]"
            >
              Reset
            </button>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#777773]" />
          <input
            placeholder="Search tools or categories"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#D2D0C8] bg-white pl-9 pr-3 text-sm outline-hidden"
          />
        </div>
        <Select
          value={sort}
          onValueChange={(v) => {
            if (v) setSort(v);
          }}
        >
          <SelectTrigger className="w-full border-[#D2D0C8] bg-white sm:w-44">
            <span className="flex-1 text-left">{SORT_LABELS[sort]}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="biggest-savings">Biggest savings</SelectItem>
            <SelectItem value="lowest-price">Lowest price</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div
        className={cn(
          "t-skel mt-6 pr-1",
          !isPage && "max-h-[430px] overflow-y-auto",
          offers !== undefined && "is-revealed",
        )}
      >
        <div
          className="t-skel-skeleton is-pulsing flex flex-col gap-4"
          aria-hidden
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-[14px] border border-[#E5E3DC] p-5 sm:flex-row sm:items-center sm:gap-5"
            >
              <div className="flex items-center gap-3">
                <div className="size-12 shrink-0 rounded-xl bg-[#F1F0EB]" />
                <div className="h-4 w-32 rounded bg-[#F1F0EB] sm:hidden" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="hidden h-4 w-44 rounded bg-[#F1F0EB] sm:block" />
                <div className="mt-2 h-3 w-72 max-w-full rounded bg-[#F1F0EB]" />
                <div className="mt-3 hidden h-4 w-24 rounded bg-[#F1F0EB] sm:block" />
              </div>
              <div className="flex items-center justify-between gap-2 sm:shrink-0">
                <div className="h-4 w-24 rounded bg-[#F1F0EB] sm:hidden" />
                <div className="h-9 w-24 shrink-0 rounded-full bg-[#F1F0EB]" />
              </div>
            </div>
          ))}
        </div>
        <div className="t-skel-content flex flex-col gap-4">
        {shown.length === 0 ? (
          <div className="rounded-[14px] border border-[#E5E3DC] bg-white py-16 text-center">
            <p className="font-medium text-[#1D1D1F]">
              No offers match these filters yet
            </p>
            <p className="mt-1 text-sm text-[#777773]">
              Scout checks vendor pages continuously. Matches land here
              as they go live.
            </p>
          </div>
        ) : (
          shown.map((o, i) => (
            <article
              key={o._id}
              className="t-msg-in flex flex-col gap-4 rounded-[14px] border border-[#E5E3DC] bg-white p-5 sm:flex-row sm:items-center sm:gap-5"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F1F0EB] text-lg font-semibold text-[#1D1D1F]">
                  <ToolMark
                    slug={o.tool.slug}
                    mark={o.tool.mark}
                    name={o.tool.name}
                    className="size-6"
                  />
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:hidden">
                  <h3 className="font-semibold text-[#1D1D1F]">
                    {o.tool.name}
                  </h3>
                  <span className="text-xs text-[#777773]">
                    {o.tool.category}
                  </span>
                  <span className="rounded-md bg-offer px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-offer-foreground">
                    {o.offerType.replace("_", " ")}
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="hidden flex-wrap items-center gap-2 sm:flex">
                  <h3 className="font-semibold text-[#1D1D1F]">
                    {o.tool.name}
                  </h3>
                  <span className="text-xs text-[#777773]">
                    {o.tool.category}
                  </span>
                  <span className="rounded-md bg-offer px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-offer-foreground">
                    {o.offerType.replace("_", " ")}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-[#777773] sm:mt-1 sm:line-clamp-1">
                  {o.summary}
                </p>
                <div className="mt-2 hidden items-baseline gap-2 sm:flex">
                  <span className="whitespace-nowrap text-lg font-semibold text-[#1D1D1F]">
                    {fmt(o.priceCents)}/mo
                  </span>
                  {o.originalPriceCents != null && (
                    <span className="whitespace-nowrap text-sm text-[#777773] line-through">
                      {fmt(o.originalPriceCents)}/mo
                    </span>
                  )}
                  {o.savingsPct != null && (
                    <span className="whitespace-nowrap text-xs font-medium text-[#41A85F]">
                      Save {o.savingsPct}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 sm:shrink-0">
                <div className="flex items-baseline gap-2 whitespace-nowrap sm:hidden">
                  <span className="text-lg font-semibold text-[#1D1D1F]">
                    {fmt(o.priceCents)}/mo
                  </span>
                  {o.originalPriceCents != null && (
                    <span className="text-sm text-[#777773] line-through">
                      {fmt(o.originalPriceCents)}/mo
                    </span>
                  )}
                  {o.savingsPct != null && (
                    <span className="text-xs font-medium text-[#41A85F]">
                      Save {o.savingsPct}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noreferrer"
                    className="whitespace-nowrap rounded-full bg-[#1D1D1F] px-4 py-2 text-sm font-semibold text-white"
                  >
                    View deal
                  </a>
                  <SaveDealButton offerId={o._id} onSaved={showToast} />
                </div>
              </div>
            </article>
          ))
        )}
        </div>
      </div>
    </div>
  );

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-[1180px]",
        isPage ? "pb-0" : "pb-24",
        className,
      )}
    >
      {isPage ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          {filtersAside}
          {results}
        </div>
      ) : (
        <div className="rounded-[22px] border border-[#E5E3DC] bg-white p-6">
          <div className="flex items-center justify-between border-b border-[#E5E3DC] pb-5">
            <h2 className="text-xl font-medium -tracking-[0.04em] text-[#1D1D1F]">
              Less tab-hopping. More value.
            </h2>
            <span className="rounded-full bg-[#3F83F8] px-3 py-1.5 text-xs font-semibold text-white">
              {liveCount ?? 0} live offers
            </span>
          </div>
          <div className="grid grid-cols-1 gap-8 pt-6 lg:grid-cols-[240px_1fr]">
            {filtersAside}
            {results}
          </div>
        </div>
      )}
      <Toast open={toast}>Saved. Find it under Saved</Toast>
    </section>
  );
}

function SaveDealButton({
  offerId,
  onSaved,
}: {
  offerId: Id<"offers">;
  onSaved: () => void;
}) {
  const save = useMutation(api.offers.save);
  const guestId = useGuestId();
  const [saved, setSaved] = useState(false);
  return (
    <SaveButton
      saved={saved}
      className="rounded-full border border-[#E5E3DC] p-2 text-[#777773] transition-colors hover:text-[#3F83F8]"
      onToggle={async () => {
        try {
          const now = await save({
            offerId,
            guestId: guestId ?? undefined,
          });
          setSaved(now);
          if (now) onSaved();
        } catch {
          /* sign-in required */
        }
      }}
    />
  );
}
