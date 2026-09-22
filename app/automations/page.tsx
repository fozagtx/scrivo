"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  CircleCheck,
  Mail,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { ToolMark } from "@/components/tool-mark";
import { Toggle } from "@/components/ui/toggle";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { AppShell, Page, PageHeader } from "@/components/app-shell";
import { CandyButton } from "@/components/ui/candy-button";
import { Checkbox } from "@/components/ui/checkbox";
import { NewAlertModal } from "@/components/new-alert-modal";
import { useGuestId } from "@/lib/guest";

const fmt = (cents?: number | null) =>
  cents == null ? "—" : `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}/mo`;

const CADENCE_LABEL: Record<string, string> = {
  hourly: "hourly",
  twice_daily: "twice daily",
  daily: "daily",
  every_2_days: "every 2 days",
};

const HOURS = [6, 7, 8, 9, 12, 17, 18, 20];

const hourLabel = (h: number) =>
  h === 12 ? "12:00 PM" : h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;

export default function AutomationsPage() {
  return (
    <Suspense>
      <AutomationsContent />
    </Suspense>
  );
}

function AutomationsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [created, setCreated] = useState(false);
  const justCreated = created || params.get("created") === "1";

  // Deep link: ?new=1 opens the wizard, then the URL is cleaned so a
  // refresh doesn't reopen it.
  useEffect(() => {
    if (params.get("new") !== "1") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- latch the deep link into state before stripping the param
    setWizardOpen(true);
    router.replace("/automations");
  }, [params, router]);

  const closeWizard = () => setWizardOpen(false);

  const guestId = useGuestId();
  const alerts = useQuery(
    api.alerts.mine,
    guestId === null ? "skip" : { guestId },
  );
  const lastScan = useQuery(api.alerts.lastScan);

  return (
    <AppShell>
      <Page className="max-w-[1180px]">
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

        <PageHeader
          title="Automations"
          description="Scheduled scans that email you when a deal matches."
          action={
            <CandyButton
              type="button"
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-2 rounded-full px-5 py-2 text-sm"
            >
              <Plus className="size-4" />
              New alert
            </CandyButton>
          }
        />

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
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="rounded-[8px] border border-[#E5E3DC] px-4 py-2 text-sm font-medium"
            >
              Create an alert
            </button>
          </div>
        ) : (
          alerts.map((a: Doc<"alerts">) => (
            <AlertCard key={a._id} alert={a} guestId={guestId} />
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
      </Page>
      <NewAlertModal
        open={wizardOpen}
        onClose={closeWizard}
        onCreated={() => {
          closeWizard();
          setCreated(true);
        }}
      />
    </AppShell>
  );
}

function AlertCard({
  alert,
  guestId,
}: {
  alert: Doc<"alerts">;
  guestId: string | null;
}) {
  const setStatus = useMutation(api.alerts.setStatus);
  const update = useMutation(api.alerts.update);
  const remove = useMutation(api.alerts.remove);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    name: alert.name,
    email: alert.email,
    cadence: alert.cadence,
    digestHour: alert.digestHour,
    budget: Math.round(alert.budgetCents / 100),
    immediateEnabled: alert.immediateEnabled,
    thresholdPct: alert.thresholdPct,
    thresholdCents: alert.thresholdCents,
  });

  const save = async () => {
    setSaving(true);
    try {
      await update({
        id: alert._id,
        guestId: guestId ?? undefined,
        name: draft.name,
        email: draft.email,
        cadence: draft.cadence,
        digestHour: draft.digestHour,
        budgetCents: draft.budget * 100,
        immediateEnabled: draft.immediateEnabled,
        thresholdPct: draft.thresholdPct,
        thresholdCents: draft.thresholdCents,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

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
              onChange={() =>
                setStatus({
                  id: alert._id,
                  guestId: guestId ?? undefined,
                  status: alert.status === "active" ? "paused" : "active",
                })
              }
              label={alert.status === "active" ? "Pause alert" : "Resume alert"}
            />
          </div>
          <p className="text-sm text-[#777773]">
            {alert.toolIds.length} tools monitored · {CADENCE_LABEL[alert.cadence] ?? alert.cadence} digest at{" "}
            {hourLabel(alert.digestHour)} · Instant alerts at {alert.thresholdPct}% savings
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setConfirmDelete(false);
              setEditing((v) => !v);
            }}
            aria-label="Edit automation"
            className="rounded-md p-2 text-[#777773] transition-colors hover:bg-[#F1F0EB] hover:text-[#1D1D1F]"
          >
            <Pencil className="size-4" />
          </button>
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  remove({ id: alert._id, guestId: guestId ?? undefined })
                }
                className="rounded-md bg-[#C96F5E] px-3 py-1.5 text-xs font-semibold text-white"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-md px-2 py-1.5 text-xs text-[#777773]"
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete automation"
              className="rounded-md p-2 text-[#777773] transition-colors hover:bg-[#FBEAE7] hover:text-[#C96F5E]"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-5 grid gap-4 rounded-[12px] border border-[#E5E3DC] bg-[#F8F7F3] p-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold">Name</span>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-9 rounded-lg border border-[#E5E3DC] bg-white px-3 text-sm outline-hidden focus:ring-2 focus:ring-[#3F83F8]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold">Send alerts to</span>
            <input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className="h-9 rounded-lg border border-[#E5E3DC] bg-white px-3 text-sm outline-hidden focus:ring-2 focus:ring-[#3F83F8]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold">Digest cadence</span>
            <select
              value={draft.cadence}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  cadence: e.target.value as Doc<"alerts">["cadence"],
                })
              }
              className="h-9 rounded-lg border border-[#E5E3DC] bg-white px-3 text-sm"
            >
              {Object.entries(CADENCE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold">Send digest at</span>
            <select
              value={draft.digestHour}
              onChange={(e) =>
                setDraft({ ...draft, digestHour: Number(e.target.value) })
              }
              className="h-9 rounded-lg border border-[#E5E3DC] bg-white px-3 text-sm"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold">
              Monthly budget cap: ${draft.budget}
            </span>
            <input
              type="range"
              min={5}
              max={100}
              value={draft.budget}
              onChange={(e) =>
                setDraft({ ...draft, budget: Number(e.target.value) })
              }
              className="accent-[#3F83F8]"
            />
          </label>
          <label className="flex items-center gap-2.5 self-end pb-1">
            <Checkbox
              checked={draft.immediateEnabled}
              onCheckedChange={(v) =>
                setDraft({ ...draft, immediateEnabled: v === true })
              }
            />
            <span className="text-sm">Instant alerts at {draft.thresholdPct}%+ savings</span>
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full px-4 py-2 text-sm font-medium text-[#777773]"
            >
              Cancel
            </button>
            <CandyButton
              type="button"
              onClick={save}
              disabled={saving || !draft.email}
              className="rounded-full px-5 py-2 text-sm disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </CandyButton>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-[#E5E3DC] pt-5">
        <div className="flex items-center gap-3">
          <Mail className="size-4 text-[#777773]" />
          <span className="text-sm font-medium">{alert.email}</span>
          <span className="rounded-[8px] bg-[#DDF4E2] px-2 py-1 text-xs font-medium text-[#41A85F]">
            Email connected
          </span>
        </div>
        <span className="text-sm text-[#777773]">
          Next digest at {hourLabel(alert.digestHour)}
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
            No matches yet. Scout will list them here.
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
