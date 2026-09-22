import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { resolveUser } from "./users";

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
  args: { offerId: v.id("offers"), guestId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.guestId);
    if (!user) throw new Error("Identify yourself to save deals");
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

/** Fingerprints of the one-time seed offers, for removal now that real scans run. */
const SEEDED_KEYS = new Set([
  "Claude Pro — annual billing|https://claude.ai/pricing",
  "ChatGPT Go|https://openai.com/chatgpt/pricing",
  "Codex bundled with ChatGPT Plus|https://openai.com/chatgpt/pricing",
  "Free Pro year for students|https://cursor.com/students",
  "Core plan at $20/mo|https://devin.ai/pricing",
  "Pro annual — ~$16.67/mo|https://www.perplexity.ai/pro",
  "Google AI Pro — 1 month free|https://one.google.com/about/google-ai-plans",
  "Annual billing — 20% off|https://www.midjourney.com/account",
  "Free tier with daily credits|https://pollo.ai/pricing",
  "Notion AI add-on — annual|https://www.notion.com/pricing",
  "7-day free trial|https://www.jasper.ai/pricing",
  "Free plan — 125 credits|https://runwayml.com/pricing",
  "Standard annual — $12/mo|https://runwayml.com/pricing",
]);

/** One-off cleanup: delete seeded placeholder offers and their dependent rows. */
export const removeSeeded = mutation({
  args: {},
  handler: async (ctx) => {
    const offers = await ctx.db.query("offers").collect();
    const seeded = offers.filter((o) =>
      SEEDED_KEYS.has(`${o.title}|${o.url}`),
    );
    const seededIds = new Set(seeded.map((o) => o._id));
    for (const m of await ctx.db.query("matches").collect()) {
      if (seededIds.has(m.offerId)) await ctx.db.delete(m._id);
    }
    for (const s of await ctx.db.query("savedOffers").collect()) {
      if (seededIds.has(s.offerId)) await ctx.db.delete(s._id);
    }
    for (const o of seeded) await ctx.db.delete(o._id);
    return seeded.length;
  },
});

export const saved = query({
  args: { guestId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.guestId);
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
