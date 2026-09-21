import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Scout sweep: pull every watched pricing page through Firecrawl hourly.
crons.interval("scan offers", { hours: 1 }, internal.firecrawl.scanAll);

// Deliver due digests through AgentMail.
crons.interval("send digests", { minutes: 15 }, internal.mailer.sendDigests);

export default crons;
