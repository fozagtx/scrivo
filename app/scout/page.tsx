"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  ArrowUp,
  ChevronDown,
  Plus,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { ListedOffer } from "@/components/deal-explorer";
import { ToolMark } from "@/components/tool-mark";
import { AppShell, Page, PageHeader } from "@/components/app-shell";
import { useGuestId } from "@/lib/guest";
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";
import {
  Message,
  MessageContent,
} from "@/components/ui/message";
import { ScoutAvatar, ScoutMascot } from "@/components/scout-mascot";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Loader } from "@/components/ui/loader";
import { useTextStream } from "@/components/ui/response-stream";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Best coding stack under $40/month?",
  "Compare Claude vs ChatGPT plans",
  "Any free trials for design tools?",
];

const THREAD_KEY = "scrivo.scout.thread";

const CADENCE_LABEL: Record<string, string> = {
  hourly: "Hourly",
  twice_daily: "Twice daily",
  daily: "Daily",
  every_2_days: "Every 2 days",
};

export default function ScoutPage() {
  const guestId = useGuestId();
  const threads = useQuery(
    api.scoutDb.threads,
    guestId === null ? "skip" : { guestId },
  );
  const createThread = useMutation(api.scoutDb.createThread);
  const postUser = useMutation(api.scoutDb.postUser);
  const send = useAction(api.scout.send);

  // undefined = nothing chosen yet (resolve to most recent thread);
  // null = explicit "New conversation".
  const [chosen, setChosen] = useState<
    Id<"scoutThreads"> | null | undefined
  >(() => {
    if (typeof window === "undefined") return undefined;
    const v = window.localStorage.getItem(THREAD_KEY);
    return v === null
      ? undefined
      : v === "new"
        ? null
        : (v as Id<"scoutThreads">);
  });
  const setThreadId = useCallback((id: Id<"scoutThreads"> | null) => {
    setChosen(id);
    window.localStorage.setItem(THREAD_KEY, id ?? "new");
  }, []);
  const threadId: Id<"scoutThreads"> | null =
    chosen === undefined
      ? (threads?.[0]?._id ?? null)
      : chosen !== null && threads && !threads.some((t) => t._id === chosen)
        ? (threads[0]?._id ?? null) // stored id no longer exists
        : chosen;
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"offers" | "automations">("offers");
  const [resultsOpen, setResultsOpen] = useState(false);

  const messages = useQuery(
    api.scoutDb.messages,
    threadId && guestId !== null
      ? { threadId, guestId }
      : "skip",
  );

  // Mark history as already-seen on thread load so only genuinely new
  // assistant replies stream in via useTextStream.
  const [seenIds] = useState(() => new Set<string>());
  const initThread = useRef<Id<"scoutThreads"> | null>(null);
  useEffect(() => {
    if (messages && initThread.current !== threadId) {
      initThread.current = threadId;
      messages.forEach((m) => seenIds.add(m._id));
    }
  }, [messages, threadId, seenIds]);
  const offers = useQuery(api.offers.list, {}) ?? [];
  const alerts = useQuery(
    api.alerts.mine,
    guestId === null ? "skip" : { guestId },
  ) ?? [];

  // The results pane mirrors what the chat is about — offers for tools
  // mentioned in the thread first, then the biggest savings — kept short.
  const panelOffers = useMemo(() => {
    const text = (messages ?? [])
      .map((m) => m.content.toLowerCase())
      .join(" ");
    const mentioned = (o: ListedOffer) =>
      o.tool.name.length > 2 && text.includes(o.tool.name.toLowerCase());
    const bySavings = (a: ListedOffer, b: ListedOffer) =>
      (b.savingsPct ?? 0) - (a.savingsPct ?? 0);
    const relevant = offers.filter(mentioned).sort(bySavings);
    const rest = offers.filter((o) => !mentioned(o)).sort(bySavings);
    return [...relevant, ...rest].slice(0, 7);
  }, [offers, messages]);

  const trackedTools = useMemo(
    () => [...new Map(offers.map((o) => [o.tool.name, o.tool])).values()],
    [offers],
  );

  const submit = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    try {
      let tid = threadId;
      if (!tid) {
        tid = await createThread({
          title: content.slice(0, 48),
          guestId: guestId ?? undefined,
        });
        setThreadId(tid);
      }
      setInput("");
      await postUser({ threadId: tid, content, guestId: guestId ?? undefined });
      await send({ threadId: tid, message: content });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong sending that.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell>
      <Page className="min-h-0 flex-1">
        <PageHeader
          eyebrow="Scout"
          title="Find the right AI stack in real time"
          action={
            <div className="flex items-center gap-2 rounded-full border border-[#BFE8C8] bg-[#DDF4E2] px-3 py-1.5 text-xs font-medium text-[#278348]">
              <span className="size-1.5 rounded-full bg-[#41A85F]" />
              <span>Scout is online</span>
            </div>
          }
        />

        {/* Workspace: chat pane left, live results pane right */}
        <div
          data-workspace
          className="grid flex-1 grid-cols-1 overflow-hidden rounded-[14px] border border-[#E5E3DC] bg-white lg:h-[calc(100dvh-200px)] lg:min-h-[560px] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
        >
          {/* Chat pane */}
          <section className="flex h-[70dvh] min-h-[480px] min-w-0 flex-col border-b border-[#E5E3DC] lg:h-auto lg:min-h-0 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between gap-3 border-b border-[#E5E3DC] px-4 py-3">
                <div className="relative min-w-0 flex-1">
                  <select
                    value={threadId ?? ""}
                    onChange={(e) =>
                      setThreadId(
                        e.target.value === ""
                          ? null
                          : (e.target.value as Id<"scoutThreads">),
                      )
                    }
                    className="w-full max-w-full cursor-pointer appearance-none truncate rounded-lg border border-transparent bg-transparent py-1.5 pl-2 pr-8 text-sm font-medium outline-hidden hover:border-[#E5E3DC] focus:border-[#E5E3DC]"
                  >
                    <option value="">New conversation</option>
                    {(threads ?? []).map((t: Doc<"scoutThreads">) => (
                      <option key={t._id} value={t._id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#777773]" />
                </div>
                <button
                  type="button"
                  onClick={() => setThreadId(null)}
                  title="New chat"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#E5E3DC] text-[#55534D] transition-colors hover:bg-[#F8F7F3]"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <ChatContainerRoot className="min-h-0 flex-1">
                <ChatContainerContent className="flex min-h-full flex-col gap-5 px-5 py-5">
                  {(!messages || messages.length === 0) && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
                      <ScoutMascot size={128} />
                      <div className="flex flex-col gap-1.5">
                        <p className="text-base font-semibold -tracking-[0.02em]">
                          Hi, I’m Scout.
                        </p>
                        <p className="max-w-[360px] text-sm leading-6 text-[#777773]">
                          Tell me your budget and the kind of AI tools you use.
                          I’ll compare live verified offers and find the best
                          value.
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {SUGGESTIONS.map((s) => (
                          <PromptSuggestion
                            key={s}
                            onClick={() => submit(s)}
                          >
                            {s}
                          </PromptSuggestion>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages?.map((m: Doc<"scoutMessages">) =>
                    m.role === "user" ? (
                      <div key={m._id} className="t-msg-in flex justify-end">
                        <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-[#3F83F8] px-4 py-3 text-sm leading-6 text-white">
                          {m.content}
                        </div>
                      </div>
                    ) : (
                      <AssistantMessage
                        key={m._id}
                        m={m}
                        seenIds={seenIds}
                      />
                    ),
                  )}

                  {sending && (
                    <Message className="max-w-[92%]">
                      <ScoutAvatar />
                      <div className="flex items-center gap-2.5">
                        <Loader variant="typing" size="sm" />
                        <TextShimmer className="text-sm" duration={1.2}>
                          Scanning live offers…
                        </TextShimmer>
                      </div>
                    </Message>
                  )}
                  <ChatContainerScrollAnchor />
                </ChatContainerContent>
              </ChatContainerRoot>

              <div className="border-t border-[#E5E3DC] bg-white p-3">
                <div className="flex items-end gap-2 rounded-full border border-[#D2D0C8] bg-white py-1.5 pl-4 pr-1.5 transition-shadow focus-within:border-[#3F83F8] focus-within:ring-2 focus-within:ring-[#3F83F8]/15">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit();
                      }
                    }}
                    rows={1}
                    placeholder="Ask Scout to compare another option..."
                    className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm outline-hidden placeholder:text-[#9B988E]"
                  />
                  <button
                    type="button"
                    aria-label="Send message"
                    onClick={() => submit()}
                    disabled={sending || !input.trim()}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#3F83F8] text-white transition-colors hover:bg-[#2563D6] disabled:opacity-50"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                </div>
                {error && (
                  <p className="px-2 pt-2 text-xs text-red-600">{error}</p>
                )}
              </div>
            </section>

            {/* Results pane */}
            <section className="flex min-h-0 min-w-0 flex-col bg-[#FBFAF7]">
              <div className="flex items-center justify-between gap-2 border-b border-[#E5E3DC] bg-white px-4 py-2">
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: "offers", label: "Live offers" },
                      { id: "automations", label: "Automations" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-[13px] text-[#777773] transition-colors",
                        tab === t.id &&
                          "bg-[#F1F0EB] font-medium text-[#1D1D1F]",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#777773]">
                    {tab === "offers"
                      ? `${offers.length} verified`
                      : `${alerts.length} active`}
                  </span>
                  <button
                    type="button"
                    aria-label={resultsOpen ? "Hide results" : "Show results"}
                    aria-expanded={resultsOpen}
                    onClick={() => setResultsOpen((v) => !v)}
                    className="flex size-7 items-center justify-center rounded-lg text-[#777773] transition-colors hover:bg-[#F1F0EB] lg:hidden"
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        resultsOpen && "rotate-180",
                      )}
                    />
                  </button>
                </div>
              </div>

              <div
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto",
                  !resultsOpen && "hidden lg:block",
                )}
              >
                {tab === "offers" ? (
                  <>
                  <ul className="divide-y divide-[#EFEDE6]">
                    {panelOffers.map((o: ListedOffer) => (
                      <li key={o._id}>
                        <a
                          href={o.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#EFEDE6] bg-white">
                            <ToolMark
                              slug={o.tool.slug}
                              mark={o.tool.mark}
                              name={o.tool.name}
                              className="size-4"
                            />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-[13px] font-medium text-[#1D1D1F]">
                              {o.title}
                            </span>
                            <span className="truncate text-xs text-[#9B988E]">
                              {o.tool.name} · {o.tool.category}
                            </span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end">
                            <span className="text-[13px] font-semibold text-[#1D1D1F]">
                              {o.priceCents != null
                                ? `$${(o.priceCents / 100).toFixed(o.priceCents % 100 === 0 ? 0 : 2)}/mo`
                                : "Free tier"}
                            </span>
                            {o.savingsPct != null && o.savingsPct > 0 && (
                              <span className="text-[11px] font-medium text-[#278348]">
                                Save {o.savingsPct}%
                              </span>
                            )}
                          </span>
                        </a>
                      </li>
                    ))}
                    {offers.length === 0 && (
                      <li className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                        <Zap className="size-5 text-[#C4C1B6]" />
                        <p className="max-w-[260px] text-sm text-[#777773]">
                          No verified offers yet. Add a tool from the alert
                          wizard and Firecrawl will scan its pricing page.
                        </p>
                      </li>
                    )}
                  </ul>
                  {offers.length > 0 && (
                    <div className="border-t border-[#E5E3DC] px-4 py-3">
                      <p className="text-xs text-[#777773]">Also tracking</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {trackedTools.slice(0, 10).map((t) => (
                          <span
                            key={t.name}
                            title={t.name}
                            className="flex size-8 items-center justify-center rounded-lg border border-[#EFEDE6] bg-white"
                          >
                            <ToolMark
                              slug={t.slug}
                              mark={t.mark}
                              name={t.name}
                              className="size-5"
                            />
                          </span>
                        ))}
                        {trackedTools.length > 10 && (
                          <span className="flex size-8 items-center justify-center rounded-lg border border-[#EFEDE6] bg-white text-[11px] text-[#777773]">
                            +{trackedTools.length - 10}
                          </span>
                        )}
                      </div>
                      <Link
                        href="/deals"
                        className="mt-2 inline-block text-xs font-medium text-[#3F83F8]"
                      >
                        Browse all {offers.length} offers →
                      </Link>
                    </div>
                  )}
                  </>
                ) : (
                  <ul className="divide-y divide-[#EFEDE6]">
                    {alerts.map((a: Doc<"alerts">) => (
                      <li
                        key={a._id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            a.status === "active"
                              ? "bg-[#41A85F]"
                              : "bg-[#C4C1B6]",
                          )}
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[13px] font-medium text-[#1D1D1F]">
                            {a.name}
                          </span>
                          <span className="truncate text-xs text-[#9B988E]">
                            {a.email} · ${Math.round(a.budgetCents / 100)}/mo
                            budget
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full border border-[#EFEDE6] bg-white px-2.5 py-1 text-[11px] font-medium text-[#55534D]">
                          {CADENCE_LABEL[a.cadence] ?? a.cadence}
                        </span>
                      </li>
                    ))}
                    {alerts.length === 0 && (
                      <li className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                        <Zap className="size-5 text-[#C4C1B6]" />
                        <p className="max-w-[260px] text-sm text-[#777773]">
                          No automations yet. Create an alert and matched deals
                          will land in your inbox on schedule.
                        </p>
                      </li>
                    )}
                  </ul>
                )}
              </div>

              <div
                className={cn(
                  "flex items-center gap-2 border-t border-[#E5E3DC] bg-white px-4 py-3 text-xs text-[#777773]",
                  !resultsOpen && "hidden lg:flex",
                )}
              >
                <ShieldCheck className="size-4 shrink-0 text-[#3F83F8]" />
                <span>
                  Prices checked across public offer pages with Firecrawl
                </span>
              </div>
            </section>
          </div>
      </Page>
    </AppShell>
  );
}

function AssistantMessage({
  m,
  seenIds,
}: {
  m: Doc<"scoutMessages">;
  seenIds: Set<string>;
}) {
  // Stream the reply only if it arrived after the thread loaded — history
  // renders instantly. Decided once per mounted message.
  const [animate] = useState(() => {
    if (seenIds.has(m._id)) return false;
    seenIds.add(m._id);
    return true;
  });
  const { displayedText, isComplete } = useTextStream({
    textStream: animate ? m.content : "",
    mode: "typewriter",
    speed: 60,
    characterChunkSize: 3,
  });

  return (
    <Message className="t-msg-in max-w-[92%]">
      <ScoutAvatar />
      <MessageContent
        markdown
        className="prose-sm bg-transparent p-0 text-sm leading-6 text-[#1D1D1F]"
      >
        {animate && !isComplete ? displayedText : m.content}
      </MessageContent>
    </Message>
  );
}
