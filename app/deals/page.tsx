"use client";

import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { AppShell, Page, PageHeader } from "@/components/app-shell";
import { DealExplorer } from "@/components/deal-explorer";

export default function DealsPage() {
  const count = useQuery(api.offers.count, {});

  return (
    <AppShell>
      <Page>
        <PageHeader
          title="Deals"
          description="Live offers scraped from vendor pricing pages."
          action={
            <span className="rounded-full bg-[#3F83F8] px-3 py-1.5 text-xs font-semibold text-white">
              {count ?? 0} live offers
            </span>
          }
        />
        <DealExplorer variant="page" />
      </Page>
    </AppShell>
  );
}
