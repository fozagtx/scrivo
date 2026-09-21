"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import {
  Check,
  ChevronRight,
  Mail,
  Plus,
  Sparkles,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { ToolMark } from "@/components/tool-mark";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { AppHeader } from "@/components/app-header";
import { Checkbox } from "@/components/ui/checkbox";
import { HAS_CLERK } from "@/lib/clerk";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Writing",
  "Coding",
  "Design",
  "Research",
  "Video",
  "Productivity",
];

const CADENCES = [
  { value: "hourly", label: "Every hour" },
  { value: "twice_daily", label: "Twice a day" },
  { value: "daily", label: "Daily" },
] as const;

const THRESHOLDS = [
  { label: "10% or $3/month", pct: 10, cents: 300 },
  { label: "20% or $5/month", pct: 20, cents: 500 },
  { label: "30% or $10/month", pct: 30, cents: 1000 },
];

const fmt = (cents: number) => `$${Math.round(cents / 100)}`;

export default function NewAlertPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me);
  const tools = useQuery(api.tools.list) ?? [];
  const create = useMutation(api.alerts.create);

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [toolIds, setToolIds] = useState<Id<"tools">[]>([]);
  const [budget, setBudget] = useState(20);
  const [cadence, setCadence] =
    useState<(typeof CADENCES)[number]["value"]>("daily");
  const [digestHour, setDigestHour] = useState(8);
  const [immediate, setImmediate] = useState(true);
  const [threshold, setThreshold] = useState(THRESHOLDS[1]);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const resolvedEmail = email || me?.email || "";
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const selectedTools = useMemo(
    () => tools.filter((t: Doc<"tools">) => toolIds.includes(t._id)),
    [tools, toolIds],
  );

  const name = `${categories[0] ?? "AI"} deals under $${budget}/mo`;

  const toggleCategory = (c: string) =>
    setCategories((l) =>
      l.includes(c) ? l.filter((v) => v !== c) : [...l, c],
    );
  const toggleTool = (id: Id<"tools">) =>
    setToolIds((l) =>
      l.includes(id) ? l.filter((v) => v !== id) : [...l, id],
    );

  const submit = async () => {
    if (!isAuthenticated) return;
    setSaving(true);
    try {
      await create({
        name,
        categories,
        toolIds,
        budgetCents: budget * 100,
        cadence,
        digestHour,
        timezone,
        immediateEnabled: immediate,
        thresholdPct: threshold.pct,
        thresholdCents: threshold.cents,
        email: resolvedEmail,
      });
      router.push("/automations?created=1");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] font-sans text-[#1D1D1F]">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-6 py-12 md:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-[#777773]">
            <span>Automations</span>
            <ChevronRight className="size-4" />
            <span className="text-[#1D1D1F]">New alert</span>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-medium -tracking-[0.06em]">
              {step === 0 && "Never miss a better price."}
              {step === 1 && "When should we send it?"}
              {step === 2 && "Review your deal alert"}
            </h1>
            <p className="max-w-2xl text-base -tracking-[0.01em] text-[#777773]">
              {step === 0 &&
                "Set the rules once. Scrivo will monitor offers and email you when a match is found."}
              {step === 1 &&
                "Choose how often we check and when an email is worth your attention."}
              {step === 2 &&
                "Everything looks good. You can edit these settings anytime."}
            </p>
          </div>
        </div>

        <Stepper step={step} />

        <div className="t-page-slide" data-page={step + 1}>
          <div className="t-page" data-page-id="1">
            <StepWatch
              categories={categories}
              toggleCategory={toggleCategory}
              tools={tools}
              toolIds={toolIds}
              toggleTool={toggleTool}
              budget={budget}
              setBudget={setBudget}
              name={name}
            />
          </div>
          <div className="t-page" data-page-id="2">
            <StepSchedule
              cadence={cadence}
              setCadence={setCadence}
              digestHour={digestHour}
              setDigestHour={setDigestHour}
              timezone={timezone}
              immediate={immediate}
              setImmediate={setImmediate}
              threshold={threshold}
              setThreshold={setThreshold}
              email={resolvedEmail}
            />
          </div>
          <div className="t-page" data-page-id="3">
            <StepReview
              categories={categories}
              selectedTools={selectedTools.map((t) => t.name)}
              budget={budget}
              cadence={cadence}
              digestHour={digestHour}
              timezone={timezone}
              immediate={immediate}
              threshold={threshold}
              email={resolvedEmail}
              onEdit={setStep}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#E5E3DC] pt-6">
          <button
            type="button"
            onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
            className="rounded-lg bg-[#F1F0EB] px-5 py-2.5 text-sm font-medium text-[#1D1D1F]"
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="rounded-lg bg-[#3F83F8] px-5 py-2.5 text-sm font-medium text-white"
            >
              {step === 0 ? "Save and continue" : "Review alert"}
            </button>
          ) : (
            <div className="flex flex-col items-end gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={saving || !isAuthenticated}
                className="rounded-lg bg-[#3F83F8] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Turning on…" : "Turn on alert"}
              </button>
              <p className="text-xs text-[#777773]">
                {isAuthenticated
                  ? "By turning this on, you agree to receive Scrivo deal alerts."
                  : HAS_CLERK
                    ? "Sign in to activate this alert."
                    : "Connect Clerk to enable alerts."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["What to watch", "When to send", "Review"];
  return (
    <div className="flex items-center gap-4">
      {labels.map((label, i) => (
        <div key={label} className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-sm",
              i < step && "bg-[#3F83F8] text-white",
              i === step && "bg-[#3F83F8] font-semibold text-white",
              i > step &&
                "border border-[#E5E3DC] bg-white font-medium text-[#777773]",
            )}
          >
            {i < step ? <Check className="size-4" /> : i + 1}
          </div>
          <span
            className={cn(
              "text-sm",
              i === step
                ? "font-semibold text-[#1D1D1F]"
                : "text-[#777773]",
            )}
          >
            {label}
          </span>
          {i < labels.length - 1 && (
            <div
              className={cn(
                "h-px flex-1",
                i < step ? "bg-[#3F83F8]" : "bg-[#E5E3DC]",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function StepWatch({
  categories,
  toggleCategory,
  tools,
  toolIds,
  toggleTool,
  budget,
  setBudget,
  name,
}: {
  categories: string[];
  toggleCategory: (c: string) => void;
  tools: Doc<"tools">[];
  toolIds: Id<"tools">[];
  toggleTool: (id: Id<"tools">) => void;
  budget: number;
  setBudget: (v: number) => void;
  name: string;
}) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
      <section className="flex flex-col gap-6 rounded-[14px] border border-[#E5E3DC] bg-white p-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold -tracking-[0.02em]">
            Choose what to monitor
          </h2>
          <p className="text-sm text-[#777773]">
            Select the categories and tools you want Scrivo to watch.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold">Categories</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCategory(c)}
                className={cn(
                  "rounded-full border border-[#E5E3DC] px-3 py-1.5 text-sm text-[#1D1D1F]",
                  categories.includes(c) &&
                    "border-transparent bg-[#3F83F8]/10 font-medium text-[#2563D6]",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold">Tools</span>
          <div className="flex flex-col divide-y divide-[#E5E3DC] rounded-lg border border-[#E5E3DC]">
            {tools.length === 0 && (
              <p className="p-4 text-sm text-[#777773]">
                Loading tool catalog…
              </p>
            )}
            {tools.map((t: Doc<"tools">) => {
              const on = toolIds.includes(t._id);
              return (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => toggleTool(t._id)}
                  className="flex items-center gap-4 p-4 text-left"
                >
                  <Checkbox checked={on} />
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#F1F0EB] text-sm font-semibold">
                    <ToolMark slug={t.slug} mark={t.mark} name={t.name} />
                  </div>
                  <span className="text-sm font-medium">{t.name}</span>
                  {on && <Check className="ml-auto size-4 text-[#3F83F8]" />}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="flex w-fit items-center gap-2 rounded-lg border border-[#E5E3DC] px-4 py-2 text-sm font-medium"
          >
            <Plus className="size-4" />
            Add another tool
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Monthly budget</span>
            <span className="text-sm font-semibold text-[#3F83F8]">
              ${budget}/mo
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={100}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full accent-[#3F83F8]"
          />
        </div>
      </section>
      <section className="flex flex-col gap-6 rounded-[14px] border border-[#E5E3DC] bg-white p-6">
        <div className="flex flex-col gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#3F83F8]/10 text-[#3F83F8]">
            <Sparkles className="size-5" />
          </div>
          <h2 className="text-lg font-semibold -tracking-[0.02em]">
            Alert preview
          </h2>
        </div>
        <div className="rounded-lg bg-[#F1F0EB] p-4">
          <p className="text-base font-semibold">{name}</p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#777773]">
              {toolIds.length} tools monitored
            </span>
            <Check className="size-4 text-[#3F83F8]" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#777773]">
              Budget limit: ${budget}/mo
            </span>
            <Check className="size-4 text-[#3F83F8]" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#777773]">Delivery: Email</span>
            <Check className="size-4 text-[#3F83F8]" />
          </div>
        </div>
      </section>
    </div>
  );
}

function StepSchedule({
  cadence,
  setCadence,
  digestHour,
  setDigestHour,
  timezone,
  immediate,
  setImmediate,
  threshold,
  setThreshold,
  email,
}: {
  cadence: string;
  setCadence: (v: "hourly" | "twice_daily" | "daily") => void;
  digestHour: number;
  setDigestHour: (v: number) => void;
  timezone: string;
  immediate: boolean;
  setImmediate: (v: boolean) => void;
  threshold: (typeof THRESHOLDS)[number];
  setThreshold: (v: (typeof THRESHOLDS)[number]) => void;
  email: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="flex flex-col gap-6 rounded-[22px] border border-[#E5E3DC] bg-white p-8">
        <h2 className="text-xl font-medium -tracking-[0.03em]">
          Delivery preferences
        </h2>
        <div className="flex flex-col gap-3">
          <span className="text-[13px] font-semibold tracking-[0.02em]">
            Check for new deals
          </span>
          <div className="grid h-11 grid-cols-3 rounded-[14px] border border-[#E5E3DC] bg-[#F1F0EB] p-1">
            {CADENCES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCadence(c.value)}
                className={cn(
                  "rounded-[8px] text-sm text-[#777773]",
                  cadence === c.value &&
                    "bg-white font-medium text-[#1D1D1F] shadow-xs",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="digest-time"
              className="text-[13px] font-semibold tracking-[0.02em]"
            >
              Send digest at
            </label>
            <select
              id="digest-time"
              value={digestHour}
              onChange={(e) => setDigestHour(Number(e.target.value))}
              className="h-10 rounded-[8px] border border-[#E5E3DC] bg-white px-3 text-sm"
            >
              {[6, 7, 8, 9, 12, 17, 18, 20].map((h) => (
                <option key={h} value={h}>
                  {h === 12 ? "12:00 PM" : h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold tracking-[0.02em]">
              Timezone
            </span>
            <div className="flex h-10 items-center rounded-[8px] border border-[#E5E3DC] bg-[#F1F0EB] px-3 text-sm text-[#777773]">
              {timezone}
            </div>
          </div>
        </div>
        <label className="flex items-center gap-3">
          <Checkbox
            checked={immediate}
            onCheckedChange={(v) => setImmediate(v === true)}
          />
          <span className="text-sm">Send immediately when a deal beats my target</span>
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold tracking-[0.02em]">
            Minimum savings
          </span>
          <div className="flex gap-2">
            {THRESHOLDS.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setThreshold(t)}
                className={cn(
                  "rounded-[8px] border border-[#E5E3DC] px-3 py-2 text-sm",
                  threshold === t &&
                    "border-[#3F83F8] bg-[#3F83F8]/10 text-[#2563D6]",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-[14px] border border-[#E5E3DC] bg-[#F1F0EB] p-4 text-sm text-[#777773]">
          <Mail className="mt-0.5 size-4 shrink-0 text-[#3F83F8]" />
          <p>
            Scrivo will send from alerts@scrivo.app
            {email ? ` to ${email}` : ""}.
          </p>
        </div>
      </section>
      <section className="flex flex-col gap-6 rounded-[22px] border border-[#E5E3DC] bg-white p-8">
        <h2 className="text-xl font-medium -tracking-[0.03em]">
          Your alert will look like
        </h2>
        <div className="flex flex-col gap-5 rounded-[22px] border border-[#E5E3DC] bg-white p-6">
          <div className="flex items-center gap-3 border-b border-[#E5E3DC] pb-5">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#3F83F8]/10">
              <Mail className="size-4 text-[#3F83F8]" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold">Scrivo Alerts</span>
              <span className="text-xs text-[#777773]">
                to {email || "you"}
              </span>
            </div>
          </div>
          <span className="text-sm font-semibold">
            New AI deals match your watchlist
          </span>
          <p className="text-xs text-[#777773]">
            Matched deals land here as Scout verifies them.
          </p>
        </div>
      </section>
    </div>
  );
}

function StepReview({
  categories,
  selectedTools,
  budget,
  cadence,
  digestHour,
  timezone,
  immediate,
  threshold,
  email,
  onEdit,
}: {
  categories: string[];
  selectedTools: string[];
  budget: number;
  cadence: string;
  digestHour: number;
  timezone: string;
  immediate: boolean;
  threshold: { label: string };
  email: string;
  onEdit: (step: number) => void;
}) {
  const hourLabel =
    digestHour === 12
      ? "12:00 PM"
      : digestHour < 12
        ? `${digestHour}:00 AM`
        : `${digestHour - 12}:00 PM`;
  const cadenceLabel =
    CADENCES.find((c) => c.value === cadence)?.label ?? cadence;

  return (
    <div className="flex w-full max-w-[820px] flex-col gap-6">
      <div className="rounded-[14px] border border-[#E5E3DC] bg-white p-6">
        <ReviewRow
          title="Watch"
          sub="What to monitor"
          onEdit={() => onEdit(0)}
        >
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {categories.map((c) => (
              <span
                key={c}
                className="rounded-full bg-[#F1F0EB] px-3 py-1 text-sm"
              >
                {c}
              </span>
            ))}
            <span className="text-sm text-[#777773]">
              {selectedTools.length > 0
                ? selectedTools.join(", ")
                : "All tools in selected categories"}
            </span>
          </div>
        </ReviewRow>
        <ReviewRow
          title="Budget"
          sub="Price threshold"
          onEdit={() => onEdit(0)}
        >
          <span className="flex-1 text-sm">Under ${budget}/mo</span>
        </ReviewRow>
        <ReviewRow
          title="Schedule"
          sub="When to check"
          onEdit={() => onEdit(1)}
        >
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-sm">
              {cadenceLabel} · digest at {hourLabel}
            </span>
            <span className="text-sm text-[#777773]">{timezone}</span>
          </div>
        </ReviewRow>
        <ReviewRow
          title="Delivery"
          sub="How to notify you"
          onEdit={() => onEdit(1)}
          last
        >
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-sm">
              {immediate
                ? `Immediate alerts when savings reach ${threshold.label}`
                : "Digest only"}
            </span>
            <span className="text-sm text-[#777773]">
              Sent to {email || "your email"}
            </span>
          </div>
        </ReviewRow>
      </div>
      <div className="flex gap-4 rounded-[14px] border border-[#3F83F8]/25 bg-[#EEF6FF] p-6">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-[#3F83F8]" />
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">How we find deals</h2>
          <p className="text-sm leading-6 text-[#777773]">
            Scrivo uses Firecrawl to check public offer pages, pricing
            changes, and limited-time promotions before matching them to your
            alert.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({
  title,
  sub,
  onEdit,
  last,
  children,
}: {
  title: string;
  sub: string;
  onEdit: () => void;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-6 py-5 first:pt-0",
        !last && "border-b border-[#E5E3DC]",
        last && "pb-0",
      )}
    >
      <div className="flex w-32 shrink-0 flex-col gap-1">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-[#777773]">{sub}</span>
      </div>
      {children}
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-sm font-medium text-[#3F83F8]"
      >
        Edit
      </button>
    </div>
  );
}
