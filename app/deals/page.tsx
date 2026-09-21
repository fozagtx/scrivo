import { AppHeader } from "@/components/app-header";
import { DealExplorer } from "@/components/deal-explorer";

export default function DealsPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F3] font-sans text-[#1D1D1F]">
      <AppHeader />
      <main className="px-6 pt-10 md:px-8">
        <DealExplorer />
      </main>
    </div>
  );
}
