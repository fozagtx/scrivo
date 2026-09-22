import { AppShell } from "@/components/app-shell";
import { DealExplorer } from "@/components/deal-explorer";

export default function DealsPage() {
  return (
    <AppShell>
      <main className="px-6 pt-10 md:px-8">
        <DealExplorer />
      </main>
    </AppShell>
  );
}
