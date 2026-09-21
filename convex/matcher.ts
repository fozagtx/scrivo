import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const activeTools = internalQuery({
  args: {},
  handler: async (ctx) =>
    (await ctx.db.query("tools").collect())
      .filter((t) => t.active)
      .map((t) => ({ _id: t._id, slug: t.slug, pricingUrl: t.pricingUrl })),
});

export const startScan = internalMutation({
  args: {},
  handler: async (ctx) =>
    await ctx.db.insert("scanRuns", {
      startedAt: Date.now(),
      pagesChecked: 0,
      offersFound: 0,
      status: "running",
    }),
});

export const finishScan = internalMutation({
  args: {
    runId: v.id("scanRuns"),
    pagesChecked: v.number(),
    offersFound: v.number(),
    status: v.union(v.literal("success"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      finishedAt: Date.now(),
      pagesChecked: args.pagesChecked,
      offersFound: args.offersFound,
      status: args.status,
      error: args.error,
    });
  },
});

export const upsertOffers = internalMutation({
  args: {
    toolId: v.id("tools"),
    sourceUrl: v.string(),
    offers: v.array(
      v.object({
        title: v.string(),
        summary: v.string(),
        offerType: v.union(
          v.literal("free_trial"),
          v.literal("discount"),
          v.literal("bundle"),
          v.literal("student"),
          v.literal("other"),
        ),
        priceCents: v.optional(v.number()),
        originalPriceCents: v.optional(v.number()),
        savingsPct: v.optional(v.number()),
        url: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("offers")
      .withIndex("by_tool", (q) => q.eq("toolId", args.toolId))
      .collect();
    const byKey = new Map(existing.map((o) => [`${o.title}|${o.url}`, o]));
    const seen = new Set<string>();
    for (const o of args.offers) {
      const key = `${o.title}|${o.url}`;
      seen.add(key);
      const prev = byKey.get(key);
      if (prev) {
        await ctx.db.patch(prev._id, {
          summary: o.summary,
          offerType: o.offerType,
          priceCents: o.priceCents,
          originalPriceCents: o.originalPriceCents,
          savingsPct: o.savingsPct,
          lastSeenAt: now,
          active: true,
        });
      } else {
        await ctx.db.insert("offers", {
          ...o,
          toolId: args.toolId,
          currency: "USD",
          firstSeenAt: now,
          lastSeenAt: now,
          active: true,
        });
      }
    }
    // Offers that disappeared from the page are retired, not deleted.
    for (const o of existing) {
      if (!seen.has(`${o.title}|${o.url}`) && o.active) {
        await ctx.db.patch(o._id, { active: false });
      }
    }
  },
});

/** Match all active offers against all active alerts. */
export const matchAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tools = new Map(
      (await ctx.db.query("tools").collect()).map((t) => [t._id, t]),
    );
    const offers = (await ctx.db.query("offers").collect()).filter(
      (o) => o.active,
    );
    const alerts = (await ctx.db.query("alerts").collect()).filter(
      (a) => a.status === "active",
    );
    let created = 0;
    for (const alert of alerts) {
      const existing = await ctx.db
        .query("matches")
        .withIndex("by_alert", (q) => q.eq("alertId", alert._id))
        .collect();
      const have = new Set(existing.map((m) => m.offerId));
      for (const offer of offers) {
        if (have.has(offer._id)) continue;
        const tool = tools.get(offer.toolId);
        if (!tool) continue;
        const categoryOk =
          !alert.categories.length ||
          alert.categories.includes(tool.category);
        const toolOk =
          !alert.toolIds.length || alert.toolIds.includes(offer.toolId);
        const budgetOk =
          offer.priceCents == null || offer.priceCents <= alert.budgetCents;
        if (categoryOk && toolOk && budgetOk) {
          await ctx.db.insert("matches", {
            alertId: alert._id,
            offerId: offer._id,
            foundAt: Date.now(),
          });
          created++;
        }
      }
    }
    return created;
  },
});

/** Alerts whose digest is due, with their unsent matches rendered for email. */
export const dueDigests = internalQuery({
  args: {},
  handler: async (ctx) => {
    const alerts = (await ctx.db.query("alerts").collect()).filter(
      (a) => a.status === "active",
    );
    const tools = new Map(
      (await ctx.db.query("tools").collect()).map((t) => [t._id, t]),
    );
    const now = Date.now();
    const intervalMs = (c: string) =>
      c === "hourly" ? 3_600_000 : c === "twice_daily" ? 43_200_000 : 86_400_000;
    const out: {
      alertId: Id<"alerts">;
      email: string;
      items: { name: string; offer: string; price: string; url: string }[];
    }[] = [];
    for (const alert of alerts) {
      const last = alert.lastDigestAt ?? alert.createdAt;
      if (now - last < intervalMs(alert.cadence)) continue;
      const matches = await ctx.db
        .query("matches")
        .withIndex("by_alert", (q) => q.eq("alertId", alert._id))
        .collect();
      const unsent = matches.filter((m) => m.emailedAt == null);
      if (!unsent.length) continue;
      const items = [];
      for (const m of unsent) {
        const offer = await ctx.db.get(m.offerId);
        const tool = offer && tools.get(offer.toolId);
        if (!offer || !tool) continue;
        items.push({
          name: tool.name,
          offer: offer.title,
          price:
            offer.priceCents != null
              ? `$${(offer.priceCents / 100).toFixed(0)}/mo`
              : "See site",
          url: offer.url,
        });
      }
      if (items.length) out.push({ alertId: alert._id, email: alert.email, items });
    }
    return out;
  },
});

export const markEmailed = internalMutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_alert", (q) => q.eq("alertId", args.alertId))
      .collect();
    const now = Date.now();
    for (const m of matches) {
      if (m.emailedAt == null) await ctx.db.patch(m._id, { emailedAt: now });
    }
    await ctx.db.patch(args.alertId, { lastDigestAt: now });
  },
});
