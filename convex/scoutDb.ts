import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { resolveUser } from "./users";

export const noop = internalMutation({ args: {}, handler: async () => null });

export const threads = query({
  args: { guestId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.guestId);
    if (!user) return [];
    const rows = await ctx.db
      .query("scoutThreads")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return rows.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const createThread = mutation({
  args: { title: v.string(), guestId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.guestId);
    if (!user) throw new Error("Identify yourself first");
    const now = Date.now();
    return await ctx.db.insert("scoutThreads", {
      userId: user._id,
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const messages = query({
  args: { threadId: v.id("scoutThreads"), guestId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.guestId);
    const thread = await ctx.db.get(args.threadId);
    if (!user || !thread || thread.userId !== user._id) return [];
    return await ctx.db
      .query("scoutMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
  },
});

export const postUser = mutation({
  args: {
    threadId: v.id("scoutThreads"),
    content: v.string(),
    guestId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.guestId);
    const thread = await ctx.db.get(args.threadId);
    if (!user || !thread || thread.userId !== user._id)
      throw new Error("Not found");
    await ctx.db.patch(args.threadId, { updatedAt: Date.now() });
    return await ctx.db.insert("scoutMessages", {
      threadId: args.threadId,
      role: "user",
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

export const history = internalQuery({
  args: { threadId: v.id("scoutThreads") },
  handler: async (ctx, args) =>
    (
      await ctx.db
        .query("scoutMessages")
        .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
        .collect()
    ).map((m) => ({ role: m.role, content: m.content })),
});

export const append = internalMutation({
  args: {
    threadId: v.id("scoutThreads"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.threadId, { updatedAt: Date.now() });
    return await ctx.db.insert("scoutMessages", {
      threadId: args.threadId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

export const liveOffers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const tools = new Map(
      (await ctx.db.query("tools").collect()).map((t) => [t._id, t]),
    );
    return (await ctx.db.query("offers").collect())
      .filter((o) => o.active)
      .map((o) => ({
        tool: tools.get(o.toolId)?.name,
        category: tools.get(o.toolId)?.category,
        title: o.title,
        offerType: o.offerType,
        priceMonthlyUsd:
          o.priceCents != null ? o.priceCents / 100 : null,
        originalPriceMonthlyUsd:
          o.originalPriceCents != null ? o.originalPriceCents / 100 : null,
        savingsPct: o.savingsPct ?? null,
        url: o.url,
      }));
  },
});
