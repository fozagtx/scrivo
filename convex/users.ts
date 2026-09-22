import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
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

/** Normalised account key: the name IS the login. */
export const nameKeyOf = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Captures name + email. Patches the Clerk user when signed in.
 * Otherwise the normalised name is the account key: an existing guest
 * user with that name is re-linked to this browser (returns its stored
 * guest id so the client can rebind); a new name creates a new user.
 */
export const identify = mutation({
  args: {
    guestId: v.optional(v.string()),
    name: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const key = nameKeyOf(args.name);
    if (!key) throw new Error("Name required");
    const fields = {
      name: args.name.trim(),
      nameKey: key,
      ...(args.email ? { email: args.email } : {}),
    };
    const auth = await currentUser(ctx);
    if (auth) {
      await ctx.db.patch(auth._id, fields);
      return {
        userId: auth._id,
        guestId: args.guestId ?? null,
        returning: false,
      };
    }
    if (!args.guestId) throw new Error("Missing guest id");
    const byName = await ctx.db
      .query("users")
      .withIndex("by_nameKey", (q) => q.eq("nameKey", key))
      .first();
    // Only relink guest accounts — a Clerk user's name must not hand
    // their data to a guest typing the same name.
    if (byName && byName.tokenIdentifier.startsWith("guest:")) {
      // Keep the original display casing; only attach a new email.
      if (args.email) await ctx.db.patch(byName._id, { email: args.email });
      return {
        userId: byName._id,
        guestId: byName.tokenIdentifier.slice(6),
        returning: true,
      };
    }
    const tokenIdentifier = `guest:${args.guestId}`;
    const existing = await ctx.db
      .query("users")
      .withIndex("tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return { userId: existing._id, guestId: args.guestId, returning: false };
    }
    const userId = await ctx.db.insert("users", {
      tokenIdentifier,
      ...fields,
    });
    return { userId, guestId: args.guestId, returning: false };
  },
});

/** One-off: stamp nameKey on existing users (run on each deployment). */
export const backfillNameKeys = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let updated = 0;
    for (const user of users) {
      if (user.nameKey == null) {
        await ctx.db.patch(user._id, { nameKey: nameKeyOf(user.name) });
        updated++;
      }
    }
    return { updated };
  },
});

/** Deletes a user and every row they own. Returns per-table counts. */
async function deleteUserCascade(ctx: MutationCtx, userId: Id<"users">) {
  const counts = {
    alerts: 0,
    matches: 0,
    savedOffers: 0,
    profiles: 0,
    threads: 0,
    messages: 0,
  };
  const alerts = await ctx.db
    .query("alerts")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const alert of alerts) {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_alert", (q) => q.eq("alertId", alert._id))
      .collect();
    for (const m of matches) {
      await ctx.db.delete(m._id);
      counts.matches++;
    }
    await ctx.db.delete(alert._id);
    counts.alerts++;
  }
  const saved = await ctx.db
    .query("savedOffers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const s of saved) {
    await ctx.db.delete(s._id);
    counts.savedOffers++;
  }
  const profiles = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const p of profiles) {
    await ctx.db.delete(p._id);
    counts.profiles++;
  }
  const threads = await ctx.db
    .query("scoutThreads")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const t of threads) {
    const messages = await ctx.db
      .query("scoutMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", t._id))
      .collect();
    for (const m of messages) {
      await ctx.db.delete(m._id);
      counts.messages++;
    }
    await ctx.db.delete(t._id);
    counts.threads++;
  }
  await ctx.db.delete(userId);
  return counts;
}

export const removeUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return {
        alerts: 0,
        matches: 0,
        savedOffers: 0,
        profiles: 0,
        threads: 0,
        messages: 0,
      };
    }
    return await deleteUserCascade(ctx, args.userId);
  },
});

export const purgeUsers = internalMutation({
  args: {
    ids: v.optional(v.array(v.id("users"))),
    all: v.optional(v.boolean()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let targets: Id<"users">[];
    if (args.all) {
      targets = (await ctx.db.query("users").collect()).map((u) => u._id);
    } else if (args.ids?.length) {
      targets = args.ids;
    } else {
      throw new Error("Pass ids or all:true");
    }
    if (args.dryRun ?? true) {
      const users = [];
      for (const id of targets) {
        const user = await ctx.db.get(id);
        if (!user) continue;
        users.push({
          _id: id,
          name: user.name,
          email: user.email ?? null,
          alerts: (
            await ctx.db
              .query("alerts")
              .withIndex("by_user", (q) => q.eq("userId", id))
              .collect()
          ).length,
          threads: (
            await ctx.db
              .query("scoutThreads")
              .withIndex("by_user", (q) => q.eq("userId", id))
              .collect()
          ).length,
          saved: (
            await ctx.db
              .query("savedOffers")
              .withIndex("by_user", (q) => q.eq("userId", id))
              .collect()
          ).length,
        });
      }
      return { dryRun: true as const, users };
    }
    const totals = {
      alerts: 0,
      matches: 0,
      savedOffers: 0,
      profiles: 0,
      threads: 0,
      messages: 0,
    };
    for (const id of targets) {
      if (!(await ctx.db.get(id))) continue;
      const c = await deleteUserCascade(ctx, id);
      for (const k of Object.keys(totals) as (keyof typeof totals)[]) {
        totals[k] += c[k];
      }
    }
    return { dryRun: false as const, deleted: targets, ...totals };
  },
});

/** Self-service account deletion. Not wired into the UI yet. */
export const deleteAccount = mutation({
  args: { guestId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.guestId);
    if (!user) return { deleted: false };
    await deleteUserCascade(ctx, user._id);
    return { deleted: true };
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
