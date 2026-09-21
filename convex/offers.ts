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

/** Seed realistic current offers so the explorer isn't empty while scans ramp up. */
const SEED_OFFERS: Record<
  string,
  {
    title: string;
    summary: string;
    offerType: "free_trial" | "discount" | "bundle" | "student" | "other";
    priceCents?: number;
    originalPriceCents?: number;
    savingsPct?: number;
    url: string;
  }[]
> = {
  claude: [
    {
      title: "Claude Pro — annual billing",
      summary: "Pro drops to $17/mo when billed annually instead of $20 monthly.",
      offerType: "discount",
      priceCents: 1700,
      originalPriceCents: 2000,
      savingsPct: 15,
      url: "https://claude.ai/pricing",
    },
  ],
  chatgpt: [
    {
      title: "ChatGPT Go",
      summary: "Entry tier at $8/mo in supported regions — cheaper than Plus for lighter use.",
      offerType: "other",
      priceCents: 800,
      originalPriceCents: 2000,
      savingsPct: 60,
      url: "https://openai.com/chatgpt/pricing",
    },
  ],
  codex: [
    {
      title: "Codex bundled with ChatGPT Plus",
      summary: "Codex coding agent is included in the $20/mo Plus plan — no separate seat.",
      offerType: "bundle",
      priceCents: 2000,
      url: "https://openai.com/chatgpt/pricing",
    },
  ],
  cursor: [
    {
      title: "Free Pro year for students",
      summary: "Verified students get 12 months of Cursor Pro free (normally $20/mo).",
      offerType: "student",
      priceCents: 0,
      originalPriceCents: 2000,
      savingsPct: 100,
      url: "https://cursor.com/students",
    },
  ],
  devin: [
    {
      title: "Core plan at $20/mo",
      summary: "Devin's self-serve Core tier starts at $20/mo with pay-as-you-go ACUs.",
      offerType: "other",
      priceCents: 2000,
      url: "https://devin.ai/pricing",
    },
  ],
  perplexity: [
    {
      title: "Pro annual — ~$16.67/mo",
      summary: "Perplexity Pro is ~17% cheaper billed annually vs $20/mo monthly.",
      offerType: "discount",
      priceCents: 1667,
      originalPriceCents: 2000,
      savingsPct: 17,
      url: "https://www.perplexity.ai/pro",
    },
  ],
  gemini: [
    {
      title: "Google AI Pro — 1 month free",
      summary: "First month of Google AI Pro (Gemini Advanced) free, then $19.99/mo.",
      offerType: "free_trial",
      priceCents: 1999,
      url: "https://one.google.com/about/google-ai-plans",
    },
  ],
  midjourney: [
    {
      title: "Annual billing — 20% off",
      summary: "All Midjourney tiers are 20% off annually: Basic $8/mo, Standard $24/mo.",
      offerType: "discount",
      priceCents: 800,
      originalPriceCents: 1000,
      savingsPct: 20,
      url: "https://www.midjourney.com/account",
    },
  ],
  pollo: [
    {
      title: "Free tier with daily credits",
      summary: "Free plan includes daily generation credits across video/image models.",
      offerType: "free_trial",
      priceCents: 0,
      url: "https://pollo.ai/pricing",
    },
  ],
  "notion-ai": [
    {
      title: "Notion AI add-on — annual",
      summary: "AI add-on is $8/member/mo on annual plans instead of $10 monthly.",
      offerType: "discount",
      priceCents: 800,
      originalPriceCents: 1000,
      savingsPct: 20,
      url: "https://www.notion.com/pricing",
    },
  ],
  jasper: [
    {
      title: "7-day free trial",
      summary: "Jasper offers a 7-day trial on Creator and Pro plans before billing starts.",
      offerType: "free_trial",
      priceCents: 3900,
      url: "https://www.jasper.ai/pricing",
    },
  ],
  runway: [
    {
      title: "Free plan — 125 credits",
      summary: "Runway's free tier includes 125 one-time generation credits.",
      offerType: "free_trial",
      priceCents: 0,
      url: "https://runwayml.com/pricing",
    },
    {
      title: "Standard annual — $12/mo",
      summary: "Standard tier drops to $12/mo billed annually vs $15 monthly.",
      offerType: "discount",
      priceCents: 1200,
      originalPriceCents: 1500,
      savingsPct: 20,
      url: "https://runwayml.com/pricing",
    },
  ],
};

/** One-off helper: populate example offers keyed by tool slug. */
export const seedOffers = mutation({
  args: {},
  handler: async (ctx) => {
    const tools = await ctx.db.query("tools").collect();
    const bySlug = new Map(tools.map((t) => [t.slug, t._id]));
    const now = Date.now();
    let added = 0;
    for (const [slug, rows] of Object.entries(SEED_OFFERS)) {
      const toolId = bySlug.get(slug);
      if (!toolId) continue;
      const existing = await ctx.db
        .query("offers")
        .withIndex("by_tool", (q) => q.eq("toolId", toolId))
        .collect();
      const have = new Set(existing.map((o) => `${o.title}|${o.url}`));
      for (const o of rows) {
        if (have.has(`${o.title}|${o.url}`)) continue;
        await ctx.db.insert("offers", {
          ...o,
          toolId,
          currency: "USD",
          firstSeenAt: now,
          lastSeenAt: now,
          active: true,
        });
        added++;
      }
    }
    return added;
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
