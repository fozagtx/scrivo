/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alerts from "../alerts.js";
import type * as crons from "../crons.js";
import type * as firecrawl from "../firecrawl.js";
import type * as mailer from "../mailer.js";
import type * as matcher from "../matcher.js";
import type * as offers from "../offers.js";
import type * as profiles from "../profiles.js";
import type * as scout from "../scout.js";
import type * as scoutDb from "../scoutDb.js";
import type * as tools from "../tools.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  crons: typeof crons;
  firecrawl: typeof firecrawl;
  mailer: typeof mailer;
  matcher: typeof matcher;
  offers: typeof offers;
  profiles: typeof profiles;
  scout: typeof scout;
  scoutDb: typeof scoutDb;
  tools: typeof tools;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
};
