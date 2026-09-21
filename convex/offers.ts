import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { currentUser } from "./users";

export const list = query({
  args: {
    categories: v.optional(v.array(v.string())),
    offerTypes: v.optional(v.array(v.string())),
    maxMonthlyCents: v.optional(v.number()),
    search: v.optional(v.string()),
    sort: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tools = new Map(
      (await ctx.db.query("tools").collect()).map((t) => [t._id, t]),
    );
    let offers = (await ctx.db.query("offers").collect()).filter(
      (o) => o.active,
    );

    offers = offers.filter((o) => {
      const tool = tools.get(o.toolId);
      if (!tool) return false;
      if (args.categories?.length && !args.categories.includes(tool.category))
        return false;
      if (args.offerTypes?.length && !args.offerTypes.includes(o.offerType))
        return false;
      if (
        args.maxMonthlyCents != null &&
        o.priceCents != null &&
        o.priceCents > args.maxMonthlyCents
      )
        return false;
      if (args.search) {
        const q = args.search.toLowerCase();
        const hay = `${tool.name} ${tool.category} ${o.title} ${o.summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sort = args.sort ?? "biggest-savings";
    offers.sort((a, b) => {
      if (sort === "lowest-price")
        return (a.priceCents ?? Infinity) - (b.priceCents ?? Infinity);
      if (sort === "newest") return b.firstSeenAt - a.firstSeenAt;
      return (b.savingsPct ?? 0) - (a.savingsPct ?? 0);
    });

    return offers.map((o) => ({ ...o, tool: tools.get(o.toolId)! }));
  },
});

export const count = query({
  args: {},
  handler: async (ctx) =>
    (await ctx.db.query("offers").collect()).filter((o) => o.active).length,
});

export const save = mutation({
  args: { offerId: v.id("offers") },
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user) throw new Error("Sign in to save deals");
    const existing = await ctx.db
      .query("savedOffers")
      .withIndex("by_user_offer", (q) =>
        q.eq("userId", user._id).eq("offerId", args.offerId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("savedOffers", {
      userId: user._id,
      offerId: args.offerId,
      createdAt: Date.now(),
    });
    return true;
  },
});

export const saved = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (!user) return [];
    const rows = await ctx.db
      .query("savedOffers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const tools = new Map(
      (await ctx.db.query("tools").collect()).map((t) => [t._id, t]),
    );
    const out = [];
    for (const r of rows) {
      const offer = await ctx.db.get(r.offerId);
      if (offer) out.push({ ...offer, tool: tools.get(offer.toolId)! });
    }
    return out;
  },
});
