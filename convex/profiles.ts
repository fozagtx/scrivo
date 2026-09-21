import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { currentUser } from "./users";

export const upsert = mutation({
  args: {
    categories: v.array(v.string()),
    monthlyBudgetCents: v.number(),
    alertEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user) throw new Error("Sign in required");
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const patch = { ...args, updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("profiles", { userId: user._id, ...patch });
  },
});
