"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  Check,
  ChevronRight,
  Loader2,
  Mail,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { ToolMark } from "@/components/tool-mark";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Checkbox } from "@/components/ui/checkbox";
import { CandyButton } from "@/components/ui/candy-button";
import { useGuestId } from "@/lib/guest";
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
  { value: "every_2_days", label: "Every 2 days" },
] as const;

const THRESHOLDS = [
  { label: "10% or $3/month", pct: 10, cents: 300 },
  { label: "20% or $5/month", pct: 20, cents: 500 },
  { label: "30% or $10/month", pct: 30, cents: 1000 },
];

export function NewAlertWizard({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const guestId = useGuestId();
  const me = useQuery(
    api.users.me,
    guestId === null ? "skip" : { guestId },
  );
  const tools = useQuery(api.tools.list) ?? [];
  const create = useMutation(api.alerts.create);
  const identify = useMutation(api.users.identify);
  const findAndTrack = useAction(api.firecrawl.findAndTrackTool);

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [toolIds, setToolIds] = useState<Id<"tools">[]>([]);
  const [budget, setBudget] = useState(20);
  const [cadence, setCadence] =
    useState<(typeof CADENCES)[number]["value"]>("daily");
  const [digestHour, setDigestHour] = useState(8);
  const [immediate, setImmediate] = useState(true);
  const [threshold, setThreshold] = useState(THRESHOLDS[1]);
  const [emailOverride, setEmailOverride] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingTool, setAddingTool] = useState(false);
  const [toolName, setToolName] = useState("");
  const [toolCategory, setToolCategory] = useState("Coding");
  const [toolSearching, setToolSearching] = useState(false);
  const [toolError, setToolError] = useState<string | null>(null);

  const email = emailOverride ?? me?.profile?.alertEmail ?? me?.email ?? "";
  const resolvedEmail = email.trim();
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const selectedTools = useMemo(
    () => tools.filter((t: Doc<"tools">) => toolIds.includes(t._id)),
    [tools, toolIds],
  );

  const name = `${categories[0] ?? "AI"} deals under $${budget}/mo`;

  // The steps grid-stack to the tallest page — jump back to the top on
  // step change so a short step isn't rendered above the fold.
  useEffect(() => {
    rootRef.current?.scrollIntoView({
      block: "start",
      behavior: "instant" as ScrollBehavior,
    });
  }, [step]);

  const toggleCategory = (c: string) =>
    setCategories((l) =>
      l.includes(c) ? l.filter((v) => v !== c) : [...l, c],
    );
  const toggleTool = (id: Id<"tools">) =>
    setToolIds((l) =>
      l.includes(id) ? l.filter((v) => v !== id) : [...l, id],
    );

  const addTool = async () => {
    const name = toolName.trim();
    if (!name || toolSearching) return;
    setToolSearching(true);
    setToolError(null);
    try {
      const res = await findAndTrack({ name, category: toolCategory });
      setToolIds((l) =>
        l.includes(res.toolId as Id<"tools">)
          ? l
          : [...l, res.toolId as Id<"tools">],
      );
      setToolName("");
      setAddingTool(false);
    } catch (e) {
      setToolError(
        e instanceof Error ? e.message : "Could not find that tool.",
      );
    } finally {
      setToolSearching(false);
    }
  };

  const submit = async () => {
    if (!resolvedEmail) return;
    setSaving(true);
    try {
      await identify({
        guestId: guestId ?? undefined,
        name: me?.name || "Friend",
        email: resolvedEmail,
      });
      await create({
        guestId: guestId ?? undefined,
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
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-6">
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
              addingTool={addingTool}
              setAddingTool={setAddingTool}
              toolName={toolName}
              setToolName={setToolName}
              toolCategory={toolCategory}
              setToolCategory={setToolCategory}
              toolSearching={toolSearching}
              toolError={toolError}
              setToolError={setToolError}
              addTool={addTool}
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
              email={email}
              setEmail={setEmailOverride}
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
            onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}
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
              <CandyButton
                type="button"
                onClick={submit}
                disabled={saving || !resolvedEmail}
                className="rounded-full px-6 py-2.5 text-sm disabled:opacity-50"
              >
                {saving ? "Turning on…" : "Turn on alert"}
              </CandyButton>
              <p className="text-xs text-[#777773]">
                {resolvedEmail
                  ? `Digests go to ${resolvedEmail}.`
                  : "Add your email on onboarding to activate alerts."}
              </p>
            </div>
          )}
        </div>
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
  addingTool,
  setAddingTool,
  toolName,
  setToolName,
  toolCategory,
  setToolCategory,
  toolSearching,
  toolError,
  setToolError,
  addTool,
}: {
  categories: string[];
  toggleCategory: (c: string) => void;
  tools: Doc<"tools">[];
  toolIds: Id<"tools">[];
  toggleTool: (id: Id<"tools">) => void;
  budget: number;
  setBudget: (v: number) => void;
  name: string;
  addingTool: boolean;
  setAddingTool: (v: boolean) => void;
  toolName: string;
  setToolName: (v: string) => void;
  toolCategory: string;
  setToolCategory: (v: string) => void;
  toolSearching: boolean;
  toolError: string | null;
  setToolError: (v: string | null) => void;
  addTool: () => void;
}) {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
      <section className="flex flex-col gap-5 rounded-[14px] border border-[#E5E3DC] bg-white p-5">
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
          {tools.length === 0 && (
            <p className="text-sm text-[#777773]">Loading tool catalog…</p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {tools.map((t: Doc<"tools">) => {
              const on = toolIds.includes(t._id);
              return (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => toggleTool(t._id)}
                  aria-pressed={on}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-lg border border-[#E5E3DC] px-3 py-2.5 text-left transition-colors hover:bg-[#F8F7F3]",
                    on && "border-[#3F83F8] bg-[#3F83F8]/5",
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#F1F0EB] text-xs font-semibold">
                    <ToolMark
                      slug={t.slug}
                      mark={t.mark}
                      name={t.name}
                      className="size-4"
                    />
                  </span>
                  <span className="min-w-0 truncate text-[13px] font-medium">
                    {t.name}
                  </span>
                  {on && (
                    <Check className="ml-auto size-3.5 shrink-0 text-[#3F83F8]" />
                  )}
                </button>
              );
            })}
          </div>
          {!addingTool ? (
            <button
              type="button"
              onClick={() => setAddingTool(true)}
              className="flex w-fit items-center gap-2 rounded-lg border border-[#E5E3DC] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#F8F7F3]"
            >
              <Plus className="size-4" />
              Add another tool
            </button>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border border-[#3F83F8]/25 bg-[#F6FAFF] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Track a new tool</p>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => {
                    setAddingTool(false);
                    setToolError(null);
                  }}
                  className="text-[#777773] hover:text-[#1D1D1F]"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="text-xs leading-5 text-[#777773]">
                Name any AI subscription. Scrivo finds its pricing page with
                Firecrawl, scrapes the live offers, and merges them into your
                deal feed.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTool()}
                  placeholder="e.g. Linear, Raycast, Figma AI"
                  autoFocus
                  className="h-10 flex-1 rounded-[8px] border border-[#E5E3DC] bg-white px-3 text-sm outline-hidden focus:ring-2 focus:ring-[#3F83F8]"
                />
                <CandyButton
                  type="button"
                  onClick={addTool}
                  disabled={toolSearching || !toolName.trim()}
                  className="flex items-center gap-1.5 rounded-[8px] px-4 text-sm disabled:opacity-50"
                >
                  {toolSearching ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Searching…
                    </>
                  ) : (
                    <>
                      <Search className="size-4" />
                      Find &amp; track
                    </>
                  )}
                </CandyButton>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-[#777773]">Category:</span>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setToolCategory(c)}
                    className={cn(
                      "rounded-full border border-[#E5E3DC] bg-white px-2.5 py-1 text-xs text-[#1D1D1F]",
                      toolCategory === c &&
                        "border-transparent bg-[#3F83F8]/10 font-medium text-[#2563D6]",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {toolError && (
                <p className="text-xs text-red-600">{toolError}</p>
              )}
            </div>
          )}
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
      <section className="flex flex-col gap-5 rounded-[14px] border border-[#E5E3DC] bg-white p-5">
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
  setEmail,
}: {
  cadence: string;
  setCadence: (v: (typeof CADENCES)[number]["value"]) => void;
  digestHour: number;
  setDigestHour: (v: number) => void;
  timezone: string;
  immediate: boolean;
  setImmediate: (v: boolean) => void;
  threshold: (typeof THRESHOLDS)[number];
  setThreshold: (v: (typeof THRESHOLDS)[number]) => void;
  email: string;
  setEmail: (v: string) => void;
}) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1.55fr_1fr]">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-10">
        <FieldCard className="col-span-2 md:col-span-10" label="Check for new deals">
          <div className="grid h-10 grid-cols-4 rounded-[10px] border border-[#E5E3DC] bg-[#F1F0EB] p-1">
            {CADENCES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCadence(c.value)}
                className={cn(
                  "rounded-[8px] text-[13px] text-[#777773]",
                  cadence === c.value &&
                    "bg-white font-medium text-[#1D1D1F] shadow-xs",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </FieldCard>
        <FieldCard className="col-span-2 md:col-span-4" label="Send alerts to">
          <input
            id="alert-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-9 rounded-[8px] border border-[#E5E3DC] bg-white px-3 text-sm outline-hidden focus:ring-2 focus:ring-[#3F83F8]"
          />
          <p className="text-[11px] text-[#9B988E]">
            Sent from scrivo@agentmail.to. Each automation can use its own inbox.
          </p>
        </FieldCard>
        <FieldCard className="md:col-span-4" label="Send digest at">
          <select
            id="digest-time"
            value={digestHour}
            onChange={(e) => setDigestHour(Number(e.target.value))}
            className="h-9 rounded-[8px] border border-[#E5E3DC] bg-white px-3 text-sm"
          >
            {[6, 7, 8, 9, 12, 17, 18, 20].map((h) => (
              <option key={h} value={h}>
                {h === 12 ? "12:00 PM" : h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`}
              </option>
            ))}
          </select>
        </FieldCard>
        <FieldCard className="md:col-span-2" label="Timezone">
          <div className="flex h-9 items-center rounded-[8px] border border-[#E5E3DC] bg-[#F1F0EB] px-3 text-xs text-[#777773]">
            {timezone.split("/").pop()?.replace("_", " ") ?? timezone}
          </div>
        </FieldCard>
        <FieldCard className="col-span-2 md:col-span-4" label="Instant alerts">
          <label className="flex h-9 items-center gap-2.5">
            <Checkbox
              checked={immediate}
              onCheckedChange={(v) => setImmediate(v === true)}
            />
            <span className="text-[13px]">
              Email me the moment a deal beats my target
            </span>
          </label>
        </FieldCard>
        <FieldCard className="col-span-2 md:col-span-6" label="Minimum savings">
          <div className="flex h-9 items-center gap-2">
            {THRESHOLDS.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setThreshold(t)}
                className={cn(
                  "flex-1 rounded-[8px] border border-[#E5E3DC] px-3 py-2 text-[13px]",
                  threshold === t &&
                    "border-[#3F83F8] bg-[#3F83F8]/10 text-[#2563D6]",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </FieldCard>
      </div>
      <section className="flex flex-col gap-5 rounded-[14px] border border-[#E5E3DC] bg-white p-6">
        <h2 className="text-lg font-semibold -tracking-[0.02em]">
          Your alert will look like
        </h2>
        <div className="flex flex-col gap-4 rounded-[14px] border border-[#E5E3DC] p-5">
          <div className="flex items-center gap-3 border-b border-[#E5E3DC] pb-4">
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

function FieldCard({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-2.5 rounded-[14px] border border-[#E5E3DC] bg-white p-4",
        className,
      )}
    >
      <span className="text-[12px] font-semibold tracking-[0.02em] text-[#55534D]">
        {label}
      </span>
      {children}
    </section>
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
