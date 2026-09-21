import { Tag, ChevronLeft, Inbox } from "lucide-react";
import { ToolMark } from "@/components/tool-mark";

/**
 * iOS-Mail-style screen shown inside the PhoneMockupCard on the landing page.
 * Renders a Scrivo digest email with live offer rows.
 */
export function DealEmailScreen({
  deals,
}: {
  deals: { slug: string; name: string; offer: string; price: string }[];
}) {
  return (
    <div className="flex h-full w-full flex-col bg-[#F8F7F3] text-left">
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-12 text-[10px] font-semibold text-[#1D1D1F]">
        <span>8:41</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded-[2px] bg-[#1D1D1F]" />
          <span className="inline-block h-2 w-3 rounded-[2px] bg-[#1D1D1F]/60" />
        </span>
      </div>
      {/* Mail nav */}
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="flex items-center gap-1 text-[11px] text-[#3F83F8]">
          <ChevronLeft className="size-3" /> Inbox
        </span>
        <Inbox className="size-3.5 text-[#3F83F8]" />
      </div>
      {/* Email card */}
      <div className="mx-3 mt-2 flex-1 rounded-t-2xl bg-white p-3.5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-[#E5E3DC] pb-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#EAF2FF]">
            <Tag className="size-3.5 text-[#3F83F8]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-[#1D1D1F]">
              Scrivo Alerts
            </p>
            <p className="truncate text-[9px] text-[#777773]">
              alerts@scrivo.app · via AgentMail
            </p>
          </div>
          <span className="ml-auto text-[9px] text-[#777773]">8:00 AM</span>
        </div>
        <p className="pt-2.5 text-[11px] font-semibold leading-snug text-[#1D1D1F]">
          {deals.length} new AI deals match your watchlist
        </p>
        <p className="pt-0.5 text-[9px] text-[#777773]">
          Coding deals under $20/mo · Daily digest
        </p>
        <div className="mt-2.5 flex flex-col gap-1.5">
          {deals.map((d) => (
            <div
              key={d.name}
              className="flex items-center gap-2 rounded-lg border border-[#E5E3DC] px-2.5 py-2"
            >
              <ToolMark
                slug={d.slug}
                name={d.name}
                className="size-6 rounded-md bg-[#F1F0EB] p-1 text-[9px]"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-medium text-[#1D1D1F]">
                  {d.name}
                </p>
                <p className="truncate text-[8.5px] text-[#777773]">{d.offer}</p>
              </div>
              <span className="text-[10px] font-semibold text-[#1D1D1F]">
                {d.price}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg bg-[#1D1D1F] py-2 text-center text-[10px] font-semibold text-white">
          View all deals
        </div>
      </div>
    </div>
  );
}
