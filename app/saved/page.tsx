"use client";

import { useMutation, useQuery } from "convex/react";
import { ExternalLink } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { AppShell, Page, PageHeader } from "@/components/app-shell";
import { useGuestId } from "@/lib/guest";
import type { ListedOffer } from "@/components/deal-explorer";
import { ToolMark } from "@/components/tool-mark";
import { SaveButton } from "@/components/save-button";

const fmt = (cents?: number | null) =>
  cents == null ? "—" : `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}/mo`;

export default function SavedPage() {
  const guestId = useGuestId();
  const saved = useQuery(
    api.offers.saved,
    guestId === null ? "skip" : { guestId },
  );
  const unsave = useMutation(api.offers.save);

  return (
    <AppShell>
      <Page>
        <PageHeader
          title="Saved deals"
          description="Deals you bookmarked."
        />
        {saved === undefined ? (
          <p className="py-16 text-center text-sm text-[#777773]">Loading…</p>
        ) : saved.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#E5E3DC] bg-white p-12 text-center">
            <p className="font-medium">Nothing saved yet</p>
            <p className="mt-1 text-sm text-[#777773]">
              Tap the bookmark on any deal to keep it here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {saved.map((o: ListedOffer) => (
              <article
                key={o._id}
                className="flex flex-col gap-4 rounded-[14px] border border-[#E5E3DC] bg-white p-5 sm:flex-row sm:items-center sm:gap-5"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#F1F0EB] text-lg font-semibold">
                  <ToolMark
                    slug={o.tool.slug}
                    mark={o.tool.mark}
                    name={o.tool.name}
                    className="size-6"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{o.tool.name}</h3>
                    <span className="text-xs text-[#777773]">
                      {o.tool.category}
                    </span>
                    <span className="rounded-md bg-[#FFF3B8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8A6B00]">
                      {o.offerType.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-[#777773]">
                    {o.summary}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-semibold">
                      {fmt(o.priceCents)}
                    </span>
                    {o.originalPriceCents != null && (
                      <span className="text-sm text-[#777773] line-through">
                        {fmt(o.originalPriceCents)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-full bg-[#1D1D1F] px-4 py-2 text-sm font-semibold text-white"
                  >
                    View deal
                    <ExternalLink className="size-3.5" />
                  </a>
                  <SaveButton
                    saved
                    onToggle={() =>
                      unsave({ offerId: o._id, guestId: guestId ?? undefined })
                    }
                    className="rounded-full border border-[#E5E3DC] p-2 text-[#3F83F8]"
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </Page>
    </AppShell>
  );
}
