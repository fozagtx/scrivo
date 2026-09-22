import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { resolveUser } from "./users";

const cadence = v.union(
  v.literal("hourly"),
  v.literal("twice_daily"),
  v.literal("daily"),
  v.literal("every_2_days"),
);

export const create = mutation({
  args: {
    guestId: v.optional(v.string()),
    name: v.string(),
    categories: v.array(v.string()),
    toolIds: v.array(v.id("tools")),
    budgetCents: v.number(),
    cadence,
    digestHour: v.number(),
    timezone: v.string(),
    immediateEnabled: v.boolean(),
    thresholdPct: v.number(),
    thresholdCents: v.number(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.guestId);
    if (!user) throw new Error("Identify yourself first");
    const { guestId: _guestId, ...fields } = args;
    return await ctx.db.insert("alerts", {
      ...fields,
      userId: user._id,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const mine = query({
  args: { guestId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.guestId);
    if (!user) return [];
    return await ctx.db
      .query("alerts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const setStatus = mutation({
  args: {
    id: v.id("alerts"),
    guestId: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("paused")),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.guestId);
    const alert = await ctx.db.get(args.id);
    if (!user || !alert || alert.userId !== user._id)
      throw new Error("Not found");
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const update = mutation({
  args: {
    id: v.id("alerts"),
    guestId: v.optional(v.string()),
    name: v.string(),
    email: v.string(),
    cadence,
    digestHour: v.number(),
    budgetCents: v.number(),
    immediateEnabled: v.boolean(),
    thresholdPct: v.number(),
    thresholdCents: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.guestId);
    const alert = await ctx.db.get(args.id);
    if (!user || !alert || alert.userId !== user._id)
      throw new Error("Not found");
    const { id, guestId: _guestId, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("alerts"), guestId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.guestId);
    const alert = await ctx.db.get(args.id);
    if (!user || !alert || alert.userId !== user._id)
      throw new Error("Not found");
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_alert", (q) => q.eq("alertId", args.id))
      .collect();
    for (const m of matches) await ctx.db.delete(m._id);
    await ctx.db.delete(args.id);
  },
});

export const matchesFor = query({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("matches")
      .withIndex("by_alert", (q) => q.eq("alertId", args.alertId))
      .order("desc")
      .take(20);
    const tools = new Map(
      (await ctx.db.query("tools").collect()).map((t) => [t._id, t]),
    );
    const out = [];
    for (const r of rows) {
      const offer = await ctx.db.get(r.offerId);
      if (offer)
        out.push({ ...r, offer, tool: tools.get(offer.toolId)! });
    }
    return out;
  },
});

export const lastScan = query({
  args: {},
  handler: async (ctx) => {
    const runs = await ctx.db
      .query("scanRuns")
      .withIndex("by_started")
      .order("desc")
      .take(1);
    return runs[0] ?? null;
  },
});
