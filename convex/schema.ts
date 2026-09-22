import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    pictureUrl: v.optional(v.string()),
    nameKey: v.optional(v.string()),
  })
    .index("tokenIdentifier", ["tokenIdentifier"])
    .index("by_nameKey", ["nameKey"]),

  // AI subscription tools Scrivo watches (reference catalog, seeded)
  tools: defineTable({
    slug: v.string(),
    name: v.string(),
    vendor: v.string(),
    category: v.string(),
    mark: v.string(), // short logo mark / glyph
    pricingUrl: v.string(),
    homepageUrl: v.string(),
    active: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"]),

  // Offers discovered by the Firecrawl scout
  offers: defineTable({
    toolId: v.id("tools"),
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
    currency: v.string(),
    url: v.string(),
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    active: v.boolean(),
  })
    .index("by_tool", ["toolId"])
    .index("by_active", ["active"])
    .index("by_lastSeen", ["lastSeenAt"]),

  // Onboarding preferences
  profiles: defineTable({
    userId: v.id("users"),
    categories: v.array(v.string()),
    monthlyBudgetCents: v.number(),
    alertEmail: v.string(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // User-configured deal alerts ("automations")
  alerts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    categories: v.array(v.string()),
    toolIds: v.array(v.id("tools")),
    budgetCents: v.number(),
    cadence: v.union(
      v.literal("hourly"),
      v.literal("twice_daily"),
      v.literal("daily"),
      v.literal("every_2_days"),
    ),
    digestHour: v.number(), // 0-23 local to timezone
    timezone: v.string(),
    immediateEnabled: v.boolean(),
    thresholdPct: v.number(),
    thresholdCents: v.number(),
    email: v.string(),
    status: v.union(v.literal("active"), v.literal("paused")),
    createdAt: v.number(),
    lastDigestAt: v.optional(v.number()),
    welcomeSentAt: v.optional(v.number()),
    welcomeError: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Offers that matched an alert (drives Recent matches + digests)
  matches: defineTable({
    alertId: v.id("alerts"),
    offerId: v.id("offers"),
    foundAt: v.number(),
    emailedAt: v.optional(v.number()),
  })
    .index("by_alert", ["alertId"])
    .index("by_alert_unsent", ["alertId", "emailedAt"]),

  // Scout chat threads + messages
  scoutThreads: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  scoutMessages: defineTable({
    threadId: v.id("scoutThreads"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_thread", ["threadId"]),

  savedOffers: defineTable({
    userId: v.id("users"),
    offerId: v.id("offers"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_offer", ["userId", "offerId"]),

  // Telemetry for the Scout activity card
  scanRuns: defineTable({
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    pagesChecked: v.number(),
    offersFound: v.number(),
    status: v.union(
      v.literal("running"),
      v.literal("success"),
      v.literal("failed"),
    ),
    error: v.optional(v.string()),
  }).index("by_started", ["startedAt"]),
});
