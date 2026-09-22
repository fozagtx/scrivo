import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Reference catalog of AI subscription tools, seeded once. */
const SEED_TOOLS = [
  { slug: "claude", name: "Claude", vendor: "Anthropic", category: "Coding", mark: "✳", pricingUrl: "https://claude.ai/pricing", homepageUrl: "https://claude.ai" },
  { slug: "chatgpt", name: "ChatGPT", vendor: "OpenAI", category: "Writing", mark: "◐", pricingUrl: "https://openai.com/chatgpt/pricing", homepageUrl: "https://chatgpt.com" },
  { slug: "codex", name: "OpenAI Codex", vendor: "OpenAI", category: "Coding", mark: "✦", pricingUrl: "https://openai.com/chatgpt/pricing", homepageUrl: "https://openai.com/codex" },
  { slug: "cursor", name: "Cursor", vendor: "Anysphere", category: "Coding", mark: "➤", pricingUrl: "https://cursor.com/pricing", homepageUrl: "https://cursor.com" },
  { slug: "devin", name: "Devin", vendor: "Cognition", category: "Coding", mark: "{}", pricingUrl: "https://devin.ai/pricing", homepageUrl: "https://devin.ai" },
  { slug: "perplexity", name: "Perplexity", vendor: "Perplexity AI", category: "Research", mark: "⌕", pricingUrl: "https://www.perplexity.ai/pro", homepageUrl: "https://www.perplexity.ai" },
  { slug: "gemini", name: "Gemini Advanced", vendor: "Google", category: "Research", mark: "✧", pricingUrl: "https://one.google.com/about/google-ai-plans", homepageUrl: "https://gemini.google.com" },
  { slug: "midjourney", name: "Midjourney", vendor: "Midjourney", category: "Design", mark: "⛵", pricingUrl: "https://www.midjourney.com/account", homepageUrl: "https://www.midjourney.com" },
  { slug: "pollo", name: "Pollo AI", vendor: "Pollo", category: "Video", mark: "▶", pricingUrl: "https://pollo.ai/pricing", homepageUrl: "https://pollo.ai" },
  { slug: "notion-ai", name: "Notion AI", vendor: "Notion", category: "Productivity", mark: "N", pricingUrl: "https://www.notion.com/pricing", homepageUrl: "https://www.notion.com" },
  { slug: "jasper", name: "Jasper", vendor: "Jasper", category: "Writing", mark: "J", pricingUrl: "https://www.jasper.ai/pricing", homepageUrl: "https://www.jasper.ai" },
  { slug: "runway", name: "Runway", vendor: "Runway", category: "Video", mark: "R", pricingUrl: "https://runwayml.com/pricing", homepageUrl: "https://runwayml.com" },
];

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("tools").collect();
    const have = new Set(existing.map((t) => t.slug));
    for (const t of SEED_TOOLS) {
      if (!have.has(t.slug)) {
        await ctx.db.insert("tools", { ...t, active: true });
      }
    }
  },
});

/** Insert a discovered tool (or return the existing one for its slug). */
export const upsertInternal = internalMutation({
  args: {
    slug: v.string(),
    name: v.string(),
    vendor: v.string(),
    category: v.string(),
    mark: v.string(),
    pricingUrl: v.string(),
    homepageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tools")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("tools", { ...args, active: true });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) =>
    (await ctx.db.query("tools").collect()).filter((t) => t.active),
});

/** One-off helper: call from the dashboard CLI to populate the catalog. */
export const ensureSeeded = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("tools").collect();
    const have = new Set(existing.map((t) => t.slug));
    let added = 0;
    for (const t of SEED_TOOLS) {
      if (!have.has(t.slug)) {
        await ctx.db.insert("tools", { ...t, active: true });
        added++;
      }
    }
    return added;
  },
});
