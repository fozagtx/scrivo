import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v } from "convex/values";

export async function currentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

/** Clerk-authed user, else the browser's guest user (created via identify). */
export async function resolveUser(ctx: QueryCtx, guestId?: string | null) {
  const auth = await currentUser(ctx);
  if (auth) return auth;
  if (!guestId) return null;
  return await ctx.db
    .query("users")
    .withIndex("tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", `guest:${guestId}`),
    )
    .unique();
}

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("users")
      .withIndex("tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    const fields = {
      name: identity.name ?? identity.nickname ?? "User",
      email: identity.email,
      pictureUrl: identity.pictureUrl,
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      ...fields,
    });
  },
});

/**
 * Captures name + email. Patches the Clerk user when signed in,
 * otherwise upserts a guest user keyed by the browser's guest id.
 */
export const identify = mutation({
  args: {
    guestId: v.optional(v.string()),
    name: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fields = {
      name: args.name,
      ...(args.email ? { email: args.email } : {}),
    };
    const auth = await currentUser(ctx);
    if (auth) {
      await ctx.db.patch(auth._id, fields);
      return auth._id;
    }
    if (!args.guestId) throw new Error("Missing guest id");
    const tokenIdentifier = `guest:${args.guestId}`;
    const existing = await ctx.db
      .query("users")
      .withIndex("tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("users", {
      tokenIdentifier,
      ...fields,
    });
  },
});

export const me = query({
  args: { guestId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.guestId);
    if (!user) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return { ...user, profile };
  },
});
