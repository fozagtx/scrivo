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
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

export function DealExplorer() {
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

  const shown = useMemo<ListedOffer[]>(() => offers ?? [], [offers]);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = () => {
    setToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 2400);
  };

  return (
    <section id="deals" className="mx-auto w-full max-w-[1180px] pb-24">
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
          <aside className="lg:border-r lg:border-[#E5E3DC] lg:pr-6">
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
          <div>
            <div className="flex items-center gap-3">
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
                <SelectTrigger className="w-52 border-[#D2D0C8] bg-white">
                  <SelectValue placeholder="Sort: Biggest savings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="biggest-savings">
                    Sort: Biggest savings
                  </SelectItem>
                  <SelectItem value="lowest-price">
                    Sort: Lowest price
                  </SelectItem>
                  <SelectItem value="newest">Sort: Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div
              className={cn(
                "t-skel mt-6",
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
                    className="flex items-center gap-5 rounded-[14px] border border-[#E5E3DC] p-5"
                  >
                    <div className="size-12 shrink-0 rounded-xl bg-[#F1F0EB]" />
                    <div className="min-w-0 flex-1">
                      <div className="h-4 w-44 rounded bg-[#F1F0EB]" />
                      <div className="mt-2 h-3 w-72 max-w-full rounded bg-[#F1F0EB]" />
                      <div className="mt-3 h-4 w-24 rounded bg-[#F1F0EB]" />
                    </div>
                    <div className="hidden h-9 w-24 shrink-0 rounded-full bg-[#F1F0EB] sm:block" />
                  </div>
                ))}
              </div>
              <div className="t-skel-content flex flex-col gap-4">
              {shown.length === 0 ? (
                <div className="rounded-[14px] border border-[#E5E3DC] py-16 text-center">
                  <p className="font-medium text-[#1D1D1F]">
                    No offers match these filters yet
                  </p>
                  <p className="mt-1 text-sm text-[#777773]">
                    Scout checks vendor pages continuously — matches land here
                    as they go live.
                  </p>
                </div>
              ) : (
                shown.map((o, i) => (
                  <article
                    key={o._id}
                    className="t-msg-in flex items-center gap-5 rounded-[14px] border border-[#E5E3DC] p-5"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    <div className="flex size-12 items-center justify-center rounded-xl bg-[#F1F0EB] text-lg font-semibold text-[#1D1D1F]">
                      <ToolMark
                        slug={o.tool.slug}
                        mark={o.tool.mark}
                        name={o.tool.name}
                        className="size-6"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
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
                      <p className="mt-1 line-clamp-1 text-sm text-[#777773]">
                        {o.summary}
                      </p>
                      <div className="mt-2 flex items-baseline gap-2">
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
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <a
                        href={o.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-[#1D1D1F] px-4 py-2 text-sm font-semibold text-white"
                      >
                        View deal
                      </a>
                      <SaveDealButton offerId={o._id} onSaved={showToast} />
                    </div>
                  </article>
                ))
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toast open={toast}>Saved — find it under Saved</Toast>
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
  const [saved, setSaved] = useState(false);
  return (
    <SaveButton
      saved={saved}
      className="rounded-full border border-[#E5E3DC] p-2 text-[#777773] transition-colors hover:text-[#3F83F8]"
      onToggle={async () => {
        try {
          const now = await save({ offerId });
          setSaved(now);
          if (now) onSaved();
        } catch {
          /* sign-in required */
        }
      }}
    />
  );
}
