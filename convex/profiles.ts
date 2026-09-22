import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { resolveUser } from "./users";

export const upsert = mutation({
  args: {
    guestId: v.optional(v.string()),
    categories: v.array(v.string()),
    monthlyBudgetCents: v.number(),
    alertEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.guestId);
    if (!user) throw new Error("Identify yourself first");
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const patch = {
      categories: args.categories,
      monthlyBudgetCents: args.monthlyBudgetCents,
      alertEmail: args.alertEmail,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("profiles", { userId: user._id, ...patch });
  },
});
