"use client";

import { ReactNode } from "react";
import { ConvexReactClient, ConvexProviderWithAuth } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/react";

import { HAS_CLERK } from "@/lib/clerk";
import EnsureUser from "./EnsureUser";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Used when no Clerk key is configured: everything renders, auth is simply off.
const noAuth = () => ({
  isLoading: false,
  isAuthenticated: false,
  fetchAccessToken: async () => null,
});

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  if (!HAS_CLERK) {
    return (
      <ConvexProviderWithAuth client={convex} useAuth={noAuth}>
        {children}
      </ConvexProviderWithAuth>
    );
  }
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <ConvexProviderWithClerk
        client={convex}
        useAuth={useAuth as unknown as Parameters<typeof ConvexProviderWithClerk>[0]["useAuth"]}
      >
        <EnsureUser />
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
