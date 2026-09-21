
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const FIRECRAWL_API = "https://api.firecrawl.dev/v1";

type ExtractedOffer = {
  title?: string;
  summary?: string;
  offerType?: string;
  priceMonthlyUsd?: number | null;
  originalPriceMonthlyUsd?: number | null;
  savingsPct?: number | null;
  url?: string;
};

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    offers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          offerType: {
            type: "string",
            enum: ["free_trial", "discount", "bundle", "student", "other"],
          },
          priceMonthlyUsd: { type: ["number", "null"] },
          originalPriceMonthlyUsd: { type: ["number", "null"] },
          savingsPct: { type: ["number", "null"] },
          url: { type: "string" },
        },
      },
    },
  },
};

async function scrapeOffers(
  pricingUrl: string,
): Promise<ExtractedOffer[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not set");
  const res = await fetch(`${FIRECRAWL_API}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: pricingUrl,
      formats: [
        {
          type: "json",
          schema: EXTRACT_SCHEMA,
          prompt:
            "List every subscription offer, plan discount, free trial, bundle, or student deal on this pricing page. For each, give a short title, one-line summary, the monthly price in USD when billed or discounted, the undiscounted monthly price, the percent savings if stated or computable, and the checkout/signup URL.",
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`Firecrawl ${pricingUrl}: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const json = data?.data?.json ?? data?.json ?? {};
  return Array.isArray(json.offers) ? json.offers : [];
}

/**
 * Hourly scout: scrape every active tool's pricing page, upsert offers,
 * then run the matcher so alerts pick up fresh deals.
 */
export const scanAll = internalAction({
  args: {},
  handler: async (ctx) => {
    const runId = await ctx.runMutation(internal.matcher.startScan, {});
    const tools: { _id: string; slug: string; pricingUrl: string }[] =
      await ctx.runQuery(internal.matcher.activeTools, {});
    let found = 0;
    for (const tool of tools) {
      try {
        const offers = await scrapeOffers(tool.pricingUrl);
        await ctx.runMutation(internal.matcher.upsertOffers, {
          toolId: tool._id as never,
          sourceUrl: tool.pricingUrl,
          offers: offers.map((o) => ({
            title: o.title ?? "Offer",
            summary: o.summary ?? "",
            offerType: (o.offerType as never) ?? "other",
            priceCents:
              o.priceMonthlyUsd != null
                ? Math.round(o.priceMonthlyUsd * 100)
                : undefined,
            originalPriceCents:
              o.originalPriceMonthlyUsd != null
                ? Math.round(o.originalPriceMonthlyUsd * 100)
                : undefined,
            savingsPct: o.savingsPct ?? undefined,
            url: o.url ?? tool.pricingUrl,
          })),
        });
        found += offers.length;
      } catch (e) {
        console.error(`scan failed for ${tool.slug}`, e);
      }
    }
    await ctx.runMutation(internal.matcher.finishScan, {
      runId: runId as never,
      pagesChecked: tools.length,
      offersFound: found,
      status: "success",
    });
    await ctx.runMutation(internal.matcher.matchAll, {});
    return { pagesChecked: tools.length, offersFound: found };
  },
});
