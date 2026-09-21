"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  CircleCheck,
  Mail,
  MoreHorizontal,
  Plus,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { ToolMark } from "@/components/tool-mark";
import { Toggle } from "@/components/ui/toggle";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { AppHeader } from "@/components/app-header";

const fmt = (cents?: number | null) =>
  cents == null ? "—" : `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}/mo`;

const CADENCE_LABEL: Record<string, string> = {
  hourly: "hourly",
  twice_daily: "twice daily",
  daily: "daily",
};

export default function AutomationsPage() {
  const params = useSearchParams();
  const justCreated = params.get("created") === "1";

  const alerts = useQuery(api.alerts.mine);
  const lastScan = useQuery(api.alerts.lastScan);
  const setStatus = useMutation(api.alerts.setStatus);

  return (
    <div className="min-h-screen bg-[#F8F7F3] font-sans text-[#1D1D1F]">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-6 py-8 md:px-8">
        {justCreated && (
          <div className="flex items-center gap-3 rounded-[8px] border border-[#3F83F8]/20 bg-[#3F83F8]/5 px-4 py-3">
            <CircleCheck className="size-5 text-[#3F83F8]" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">Your alert is live</p>
              <p className="text-sm text-[#777773]">
                We’ll email you when a better AI subscription deal is found.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-medium -tracking-[0.06em]">
            Automations
          </h1>
          <Link
            href="/alerts/new"
            className="flex items-center gap-2 rounded-[8px] bg-[#3F83F8] px-4 py-2 text-sm font-medium text-white"
          >
            <Plus className="size-4" />
            New alert
          </Link>
        </div>

        {alerts === undefined ? (
          <p className="py-16 text-center text-sm text-[#777773]">Loading…</p>
        ) : alerts.length === 0 ? (
          <div className="flex items-center justify-between gap-4 rounded-[14px] border border-dashed border-[#E5E3DC] bg-white p-6">
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold">No alerts yet</p>
              <p className="text-sm text-[#777773]">
                Create an alert and Scout will start watching for deals.
              </p>
            </div>
            <Link
              href="/alerts/new"
              className="rounded-[8px] border border-[#E5E3DC] px-4 py-2 text-sm font-medium"
            >
              Create an alert
            </Link>
          </div>
        ) : (
          alerts.map((a: Doc<"alerts">) => (
            <AlertCard
              key={a._id}
              alert={a}
              onToggle={() =>
                setStatus({
                  id: a._id,
                  status: a.status === "active" ? "paused" : "active",
                })
              }
            />
          ))
        )}

        {alerts && alerts.length > 0 && (
          <div className="grid gap-6 md:grid-cols-[1fr_280px]">
            <MatchesPanel alertId={alerts[0]._id} />
            <section className="flex h-fit flex-col gap-5 rounded-[14px] border border-[#E5E3DC] bg-white p-6">
              <h2 className="text-lg font-semibold -tracking-[0.03em]">
                Scout activity
              </h2>
              <div className="flex gap-3">
                <div className="mt-1 size-2 rounded-full bg-[#3F83F8]" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {lastScan
                      ? `Last scan ${new Date(lastScan.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                      : "No scans yet"}
                  </span>
                  <span className="text-xs text-[#777773]">
                    {lastScan
                      ? `${lastScan.pagesChecked ?? 0} pages checked`
                      : "Firecrawl will run on schedule"}
                  </span>
                </div>
              </div>
              <div className="border-t border-[#E5E3DC] pt-4 text-sm text-[#777773]">
                Firecrawl keeps your watchlist fresh.
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function AlertCard({
  alert,
  onToggle,
}: {
  alert: {
    _id: Id<"alerts">;
    name: string;
    status: string;
    toolIds: Id<"tools">[];
    cadence: string;
    digestHour: number;
    thresholdPct: number;
    email: string;
  };
  onToggle: () => void;
}) {
  const hourLabel =
    alert.digestHour === 12
      ? "12:00 PM"
      : alert.digestHour < 12
        ? `${alert.digestHour}:00 AM`
        : `${alert.digestHour - 12}:00 PM`;

  return (
    <section className="rounded-[14px] border border-[#E5E3DC] bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold -tracking-[0.03em]">
              {alert.name}
            </h2>
            <Toggle
              on={alert.status === "active"}
              onChange={onToggle}
              label={alert.status === "active" ? "Pause alert" : "Resume alert"}
            />
          </div>
          <p className="text-sm text-[#777773]">
            {alert.toolIds.length} tools monitored · {CADENCE_LABEL[alert.cadence] ?? alert.cadence} digest at{" "}
            {hourLabel} · Instant alerts at {alert.thresholdPct}% savings
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/alerts/new"
            className="rounded-md px-3 py-1.5 text-sm text-[#1D1D1F]"
          >
            Edit
          </Link>
          <button
            type="button"
            aria-label="More automation actions"
            className="rounded-md p-2"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-[#E5E3DC] pt-5">
        <div className="flex items-center gap-3">
          <Mail className="size-4 text-[#777773]" />
          <span className="text-sm font-medium">{alert.email}</span>
          <span className="rounded-[8px] bg-[#DDF4E2] px-2 py-1 text-xs font-medium text-[#41A85F]">
            Email connected
          </span>
        </div>
        <span className="text-sm text-[#777773]">
          Next digest at {hourLabel}
        </span>
      </div>
    </section>
  );
}

function MatchesPanel({ alertId }: { alertId: Id<"alerts"> }) {
  const matches = useQuery(api.alerts.matchesFor, { alertId });
  return (
    <section className="flex flex-col gap-5 rounded-[14px] border border-[#E5E3DC] bg-white p-6">
      <h2 className="text-lg font-semibold -tracking-[0.03em]">
        Recent matches
      </h2>
      <div className="flex flex-col gap-3">
        {matches === undefined ? (
          <p className="text-sm text-[#777773]">Loading…</p>
        ) : matches.length === 0 ? (
          <p className="text-sm text-[#777773]">
            No matches yet — Scout will list them here.
          </p>
        ) : (
          matches.map(
            (m: {
              _id: Id<"matches">;
              offer: {
                offerType: string;
                priceCents?: number | null;
                url: string;
              };
              tool: Doc<"tools">;
            }) => (
            <div
              key={m._id}
              className="flex items-center justify-between rounded-[8px] border border-[#E5E3DC] p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-[8px] bg-[#3F83F8]/10 text-sm font-semibold text-[#3F83F8]">
                  <ToolMark
                    slug={m.tool.slug}
                    mark={m.tool.mark}
                    name={m.tool.name}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{m.tool.name}</span>
                  <span className="text-sm text-[#777773]">
                    {m.offer.offerType.replace("_", " ")} ·{" "}
                    {fmt(m.offer.priceCents)}
                  </span>
                </div>
              </div>
              <a
                href={m.offer.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-[8px] border border-[#E5E3DC] px-3 py-1.5 text-sm text-[#1D1D1F]"
              >
                View deal
              </a>
            </div>
            ),
          )
        )}
      </div>
    </section>
  );
}
