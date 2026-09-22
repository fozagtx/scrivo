
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const AGENTMAIL_API = "https://api.agentmail.to/v0";

/**
 * Sends an email through the AgentMail inbox.
 * Env: AGENTMAIL_API_KEY, AGENTMAIL_INBOX (e.g. scrivo@agentmail.to)
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

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const CADENCE_LABEL: Record<string, string> = {
  hourly: "hourly",
  twice_daily: "twice daily",
  daily: "daily",
  every_2_days: "every 2 days",
};

const hourLabel = (h: number) =>
  h === 12 ? "12:00 PM" : h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;

type WelcomeItem = {
  name: string;
  offer: string;
  price: string;
  url: string;
  savings: string | null;
};

function welcomeHtml(alertName: string, rules: string, items: WelcomeItem[]) {
  const rows = items
    .map(
      (i) => `
    <tr>
      <td style="padding:14px 20px;border-top:1px solid #E5E3DC;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="font-weight:600;color:#1D1D1F;">${esc(i.name)}</div>
              <div style="font-size:13px;color:#777773;margin-top:2px;">${esc(i.offer)}</div>
            </td>
            <td align="right" style="white-space:nowrap;vertical-align:top;">
              <div style="font-weight:600;color:#1D1D1F;">${esc(i.price)}</div>
              ${
                i.savings
                  ? `<div style="font-size:12px;font-weight:600;color:#278348;margin-top:2px;">${esc(i.savings)}</div>`
                  : ""
              }
            </td>
            <td align="right" width="70" style="vertical-align:middle;">
              <a href="${esc(i.url)}" style="font-size:12px;font-weight:600;color:#3F83F8;text-decoration:none;">View deal</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`,
    )
    .join("");
  const dealsBlock = items.length
    ? `<p style="margin:18px 0 8px;font-size:13px;color:#777773;">Here&rsquo;s a taste of what we&rsquo;re tracking right now:</p>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:none;">${rows}
       </table>`
    : `<p style="margin:18px 0 0;font-size:13px;color:#777773;">We&rsquo;re scanning pricing pages now; your first deals will land in your next digest.</p>`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /></head><body style="margin:0;padding:24px;background:#F8F7F3;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #E5E3DC;border-radius:14px;">
  <tr><td style="padding:24px 28px 0;">
    <div style="font-size:18px;font-weight:700;color:#1D1D1F;letter-spacing:-0.02em;">Scrivo</div>
  </td></tr>
  <tr><td style="padding:16px 28px 24px;">
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#1D1D1F;letter-spacing:-0.02em;">Your alert is live</h1>
    <p style="margin:0;font-size:14px;color:#1D1D1F;"><strong>${esc(alertName)}</strong></p>
    <p style="margin:8px 0 0;font-size:13px;color:#777773;line-height:1.5;">${esc(rules)}</p>
    ${dealsBlock}
    <p style="margin:22px 0 0;font-size:12px;color:#777773;line-height:1.6;border-top:1px solid #E5E3DC;padding-top:16px;">
      This is your first email from Scrivo &mdash; your digests count from now.
      Reply to this email if anything looks off.<br/>Sent by scrivo@agentmail.to
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/**
 * Welcome/test email sent the moment an alert is created — proves the
 * address works and starts the digest cadence clock (lastDigestAt = now).
 * Never throws: a bad address must not poison the scheduler with retries.
 */
export const sendWelcome = internalAction({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    const data: {
      alert: {
        name: string;
        email: string;
        categories: string[];
        budgetCents: number;
        cadence: string;
        digestHour: number;
        timezone: string;
        thresholdPct: number;
      };
      items: WelcomeItem[];
    } | null = await ctx.runQuery(internal.matcher.welcomeSample, {
      alertId: args.alertId,
    });
    if (!data) return;
    const { alert, items } = data;
    const cadence = CADENCE_LABEL[alert.cadence] ?? alert.cadence;
    const rules = `Watching ${alert.categories.join(", ") || "all categories"} under $${Math.round(alert.budgetCents / 100)}/mo · ${cadence} digest at ${hourLabel(alert.digestHour)} ${alert.timezone} · instant alerts at ${alert.thresholdPct}%+ savings`;
    const subject = `Your Scrivo alert is live: ${alert.name}`;
    const itemsText = items.length
      ? `Here's a taste of what we're tracking right now:\n\n${items
          .map(
            (i) =>
              `• ${i.name} — ${i.offer} (${i.price}${i.savings ? `, ${i.savings}` : ""})\n  ${i.url}`,
          )
          .join("\n\n")}`
      : "We're scanning pricing pages now; your first deals will land in your next digest.";
    const text = `Hi! ${alert.name} is live.\n\n${rules}\n\n${itemsText}\n\nThis is your first email from Scrivo — your ${cadence} digests count from now. Reply to this email if anything looks off.\n\n— Scrivo`;
    const html = welcomeHtml(alert.name, rules, items);
    try {
      const result: { sent: boolean } = await ctx.runAction(
        internal.mailer.send,
        { to: alert.email, subject, text, html },
      );
      if (result.sent) {
        await ctx.runMutation(internal.matcher.markWelcomed, {
          alertId: args.alertId,
        });
      } else {
        await ctx.runMutation(internal.matcher.markWelcomed, {
          alertId: args.alertId,
          error: "Email not configured",
        });
      }
    } catch (e) {
      const message = (e instanceof Error ? e.message : String(e)).slice(0, 200);
      await ctx.runMutation(internal.matcher.markWelcomed, {
        alertId: args.alertId,
        error: message,
      });
    }
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
