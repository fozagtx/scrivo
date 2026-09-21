
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const SYSTEM_PROMPT = `You are Scout, the Scrivo assistant. You help users pick AI subscription tools and find the best current deal.

You are given the live offers Scrivo has verified via Firecrawl as JSON. Ground every recommendation in that data — quote real prices, intro terms, and savings. If the offer list is empty, say so and give general guidance with clearly-labeled typical list prices.

Style: concise, specific, calm. Compare monthly cost first, then intro savings, then fit for the stated workflow. When you recommend a stack, give the total monthly cost and the savings vs list price.`;

export const send = action({
  args: { threadId: v.id("scoutThreads"), message: v.string() },
  handler: async (ctx, args): Promise<string> => {
    const history: { role: "user" | "assistant"; content: string }[] =
      await ctx.runQuery(internal.scoutDb.history, { threadId: args.threadId });
    const offers: unknown[] = await ctx.runQuery(
      internal.scoutDb.liveOffers,
      {},
    );

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      // optional — Azure/proxy compatible; must be omitted (not undefined) when unset
      ...(process.env.OPENAI_BASE_URL
        ? { baseURL: process.env.OPENAI_BASE_URL }
        : {}),
    });
    const model = openai(process.env.SCOUT_MODEL ?? "gpt-4o-mini");

    const { text } = await generateText({
      model,
      system: `${SYSTEM_PROMPT}\n\nLive verified offers (JSON):\n${JSON.stringify(offers)}`,
      messages: [
        ...history.slice(-20).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user" as const, content: args.message },
      ],
    });
    const reply: string = text || "I could not generate a reply.";
    await ctx.runMutation(internal.scoutDb.append, {
      threadId: args.threadId,
      role: "assistant",
      content: reply,
    });
    return reply;
  },
});
