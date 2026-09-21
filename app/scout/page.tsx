"use client";

import { useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { ArrowUp, Plus, ShieldCheck } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { ListedOffer } from "@/components/deal-explorer";
import { ToolMark } from "@/components/tool-mark";
import { AppHeader } from "@/components/app-header";
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
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

export default function ScoutPage() {
  const threads = useQuery(api.scoutDb.threads);
  const createThread = useMutation(api.scoutDb.createThread);
  const postUser = useMutation(api.scoutDb.postUser);
  const send = useAction(api.scout.send);

  const [threadId, setThreadId] = useState<Id<"scoutThreads"> | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messages = useQuery(
    api.scoutDb.messages,
    threadId ? { threadId } : "skip",
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
        });
        setThreadId(tid);
      }
      setInput("");
      await postUser({ threadId: tid, content });
      await send({ threadId: tid, message: content });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong sending that.",
      );
    } finally {
      setSending(false);
    }
  };

  const activeThread = threads?.find(
    (t: Doc<"scoutThreads">) => t._id === threadId,
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F7F3] font-sans text-[#1D1D1F]">
      <AppHeader />
      <main className="flex-1 px-6 py-9 md:px-12">
        <div className="mx-auto flex max-w-[1420px] flex-col gap-6">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-2">
              <div className="text-sm text-[#777773]">Scrivo / Scout chat</div>
              <h1 className="text-3xl font-medium -tracking-[0.06em]">
                Find the right AI stack in real time
              </h1>
              <p className="text-base text-[#777773]">
                Ask Scout to compare tools, test your budget, and surface live
                offers while you think.
              </p>
            </div>
            <div className="mb-1 flex items-center gap-2 rounded-full border border-[#BFE8C8] bg-[#DDF4E2] px-3 py-1.5 text-sm font-medium text-[#278348]">
              <span className="size-2 rounded-full bg-[#41A85F]" />
              <span>Scout is online</span>
            </div>
          </div>

          <div className="grid items-stretch justify-center gap-6 lg:grid-cols-[250px_minmax(0,620px)_320px]">
            {/* Conversations */}
            <aside className="flex min-h-[748px] flex-col rounded-[14px] border border-[#E5E3DC] bg-white p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Conversations</h2>
                  <button
                    type="button"
                    onClick={() => setThreadId(null)}
                    className="flex items-center gap-1 rounded-lg bg-[#3F83F8] px-3 py-2 text-xs font-semibold text-white"
                  >
                    <Plus className="size-4" />
                    <span>New chat</span>
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {(threads ?? []).map((t: Doc<"scoutThreads">) => (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => setThreadId(t._id)}
                      className={cn(
                        "flex flex-col gap-1 rounded-lg p-3 text-left",
                        t._id === threadId && "bg-[#EAF2FF]",
                      )}
                    >
                      <span className="text-sm font-medium">{t.title}</span>
                      <span className="text-xs text-[#777773]">
                        {new Date(t.updatedAt).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-auto border-t border-[#E5E3DC] pt-4 text-xs text-[#777773]">
                Live searches refresh as you chat
              </div>
            </aside>

            {/* Chat */}
            <section className="flex min-h-[748px] flex-col overflow-hidden rounded-[14px] border border-[#E5E3DC] bg-white">
              <div className="flex items-center justify-between border-b border-[#E5E3DC] px-6 py-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-semibold">
                    {activeThread?.title ?? "New conversation"}
                  </h2>
                  <p className="text-xs text-[#777773]">
                    Scout can browse current offers and compare monthly cost
                  </p>
                </div>
              </div>

              <ChatContainerRoot className="flex-1">
                <ChatContainerContent className="flex flex-col gap-6 px-6 py-6">
                  {(!messages || messages.length === 0) && (
                    <Message className="max-w-[92%]">
                      <MessageAvatar
                        src=""
                        alt="Scout"
                        fallback="S"
                        className="size-7 rounded-lg bg-[#EAF2FF] text-xs font-semibold text-[#3F83F8]"
                      />
                      <div className="flex flex-col gap-3">
                        <MessageContent className="bg-transparent p-0 text-sm leading-6 text-[#1D1D1F]">
                          Tell me your budget and the kind of AI tools you use.
                          I’ll compare live verified offers and find the best
                          value.
                        </MessageContent>
                        <div className="flex flex-wrap gap-2">
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
                    </Message>
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
                      <MessageAvatar
                        src=""
                        alt="Scout"
                        fallback="S"
                        className="size-7 rounded-lg bg-[#EAF2FF] text-xs font-semibold text-[#3F83F8]"
                      />
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

              <div className="border-t border-[#E5E3DC] bg-white p-4">
                <PromptInput
                  value={input}
                  onValueChange={setInput}
                  onSubmit={() => submit()}
                  isLoading={sending}
                  className="rounded-xl border-[#D2D0C8]"
                >
                  <PromptInputTextarea placeholder="Ask Scout to compare another option..." />
                  <PromptInputActions className="justify-end">
                    <PromptInputAction tooltip="Send">
                      <button
                        type="button"
                        aria-label="Send message"
                        onClick={() => submit()}
                        disabled={sending || !input.trim()}
                        className="flex size-9 items-center justify-center rounded-full bg-[#3F83F8] text-white transition-colors hover:bg-[#2563D6] disabled:opacity-50"
                      >
                        <ArrowUp className="size-4" />
                      </button>
                    </PromptInputAction>
                  </PromptInputActions>
                </PromptInput>
                {error && (
                  <p className="px-1 pt-2 text-xs text-red-600">{error}</p>
                )}
                <p className="px-1 pt-3 text-[11px] leading-4 text-[#777773]">
                  Scout uses Firecrawl to check public pricing and offer pages.
                  Verify availability before checkout.
                </p>
              </div>
            </section>

            {/* Live recommendations */}
            <aside className="flex min-h-[748px] flex-col gap-4 rounded-[14px] border border-[#E5E3DC] bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Live offers</h2>
                <span className="text-xs text-[#777773]">
                  {offers.length} verified
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {offers.slice(0, 6).map((o: ListedOffer) => (
                  <a
                    key={o._id}
                    href={o.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-[#E5E3DC] px-3 py-2 text-sm hover:bg-[#F8F7F3]"
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-md bg-[#F1F0EB] text-[10px] font-bold text-[#1D1D1F]">
                        <ToolMark
                          slug={o.tool.slug}
                          mark={o.tool.mark}
                          name={o.tool.name}
                          className="size-3.5"
                        />
                      </span>
                      {o.tool.name}
                    </span>
                    <span className="text-[#777773]">
                      {o.priceCents != null
                        ? `$${Math.round(o.priceCents / 100)}/mo`
                        : "—"}
                    </span>
                  </a>
                ))}
                {offers.length === 0 && (
                  <p className="text-sm text-[#777773]">
                    Offers appear here after the first Firecrawl scan.
                  </p>
                )}
              </div>
              <div className="mt-auto flex flex-col gap-4 border-t border-[#E5E3DC] pt-4">
                <div className="flex items-center gap-2 text-xs text-[#777773]">
                  <ShieldCheck className="size-4 text-[#3F83F8]" />
                  <span>Prices checked across public offer pages</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
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
      <MessageAvatar
        src=""
        alt="Scout"
        fallback="S"
        className="size-7 rounded-lg bg-[#EAF2FF] text-xs font-semibold text-[#3F83F8]"
      />
      <MessageContent
        markdown
        className="prose-sm bg-transparent p-0 text-sm leading-6 text-[#1D1D1F]"
      >
        {animate && !isComplete ? displayedText : m.content}
      </MessageContent>
    </Message>
  );
}
