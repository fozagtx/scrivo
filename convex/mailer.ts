
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const AGENTMAIL_API = "https://api.agentmail.to/v0";

/**
 * Sends an email through the AgentMail inbox.
 * Env: AGENTMAIL_API_KEY, AGENTMAIL_INBOX (e.g. alerts@scrivo.app)
 */
export const send = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    text: v.string(),
    html: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.AGENTMAIL_API_KEY;
    const inbox = process.env.AGENTMAIL_INBOX;
    if (!apiKey || !inbox) {
      console.warn("AgentMail not configured — skipping send", args.subject);
      return { sent: false, reason: "not_configured" };
    }
    const res = await fetch(
      `${AGENTMAIL_API}/inboxes/${encodeURIComponent(inbox)}/messages/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: [args.to],
          subject: args.subject,
          text: args.text,
          html: args.html,
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`AgentMail send failed: ${res.status} ${body}`);
    }
    return { sent: true };
  },
});

/**
 * Digest runner — called by cron. Collects unsent matches per active alert
 * whose cadence window has elapsed, sends one digest email per alert.
 */
export const sendDigests = internalAction({
  args: {},
  handler: async (ctx) => {
    const due: { alertId: string; email: string; items: { name: string; offer: string; price: string; url: string }[] }[] =
      await ctx.runQuery(internal.matcher.dueDigests, {});
    for (const d of due) {
      const lines = d.items
        .map((i) => `• ${i.name} — ${i.offer} (${i.price})\n  ${i.url}`)
        .join("\n\n");
      const result: { sent: boolean } = await ctx.runAction(
        internal.mailer.send,
        {
          to: d.email,
          subject: `${d.items.length} new AI deal${d.items.length === 1 ? "" : "s"} match your watchlist`,
          text: `Scrivo found new matches:\n\n${lines}\n\n— Scrivo`,
        },
      );
      if (result.sent) {
        await ctx.runMutation(internal.matcher.markEmailed, {
          alertId: d.alertId as never,
        });
      }
    }
    return { digestsSent: due.length };
  },
});
