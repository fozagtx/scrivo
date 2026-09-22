
import { action, internalAction } from "./_generated/server";
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function scrapeOffers(
  pricingUrl: string,
  attempt = 0,
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
      formats: ["json"],
      jsonOptions: {
        schema: EXTRACT_SCHEMA,
        prompt:
          "List every subscription offer, plan discount, free trial, bundle, or student deal on this pricing page. For each, give a short title, one-line summary, the monthly price in USD when billed or discounted, the undiscounted monthly price, the percent savings if stated or computable, and the checkout/signup URL.",
      },
    }),
  });
  if (!res.ok) {
    // Free tier is ~10 req/min — back off once and retry rather than
    // skipping the tool until the next hourly run.
    if (res.status === 429 && attempt < 1) {
      await sleep(30_000);
      return scrapeOffers(pricingUrl, attempt + 1);
    }
    throw new Error(`Firecrawl ${pricingUrl}: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const json = data?.data?.json ?? data?.json ?? {};
  return Array.isArray(json.offers) ? json.offers : [];
}

type SearchResult = { url: string; title?: string; description?: string };

/** Firecrawl web search — find the public pricing page for a tool name. */
async function searchPricingPages(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not set");
  const res = await fetch(`${FIRECRAWL_API}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit: 6 }),
  });
  if (!res.ok) {
    throw new Error(`Firecrawl search: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const rows = data?.data?.web ?? data?.data ?? data?.web ?? [];
  return Array.isArray(rows) ? rows : [];
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const pickPricingUrl = (results: SearchResult[]) => {
  const scored = [...results].sort((a, b) => {
    const score = (u: string) =>
      /pricing|plans|billing|subscribe/i.test(u) ? 0 : 1;
    return score(a.url) - score(b.url);
  });
  return scored[0]?.url;
};

/**
 * User-driven discovery: given a tool name, search the web for its
 * pricing page, register the tool, scrape its offers, and merge them
 * into the cached catalog. Existing offers are kept; new ones are added.
 */
export const findAndTrackTool = action({
  args: { name: v.string(), category: v.string() },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Tool name required");

    const results = await searchPricingPages(`${name} pricing`);
    const pricingUrl = pickPricingUrl(results);
    if (!pricingUrl) throw new Error(`No pricing page found for ${name}`);

    const home = new URL(pricingUrl);
    const vendor =
      home.hostname.replace(/^www\./, "").split(".")[0] || name;
    const toolId: string = await ctx.runMutation(
      internal.tools.upsertInternal,
      {
        slug: slugify(name),
        name,
        vendor: vendor.charAt(0).toUpperCase() + vendor.slice(1),
        category: args.category,
        mark: name.charAt(0).toUpperCase(),
        pricingUrl,
        homepageUrl: home.origin,
      },
    );

    let offersFound = 0;
    try {
      const offers = await scrapeOffers(pricingUrl);
      await ctx.runMutation(internal.matcher.upsertOffers, {
        toolId: toolId as never,
        sourceUrl: pricingUrl,
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
          url: o.url ?? pricingUrl,
        })),
      });
      offersFound = offers.length;
    } catch (e) {
      console.error(`scrape failed for ${name}`, e);
    }
    await ctx.runMutation(internal.matcher.matchAll, {});
    return { toolId, pricingUrl, offersFound };
  },
});

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
      // Pace requests under the Firecrawl plan's per-minute limit.
      await sleep(6500);
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
