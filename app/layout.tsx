import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ConvexClientProvider from "./ConvexClientProvider";
import { SmoothScroll } from "@/components/smooth-scroll";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://ideal-seahorse-109.convex.site"),
  title: "Scrivo — Never overpay for AI subscriptions",
  description:
    "Scrivo monitors AI subscription pricing pages with Firecrawl and emails you the best deals, trials, and bundles.",
  openGraph: {
    siteName: "Scrivo",
    title: "Scrivo — Never overpay for AI subscriptions",
    description:
      "Discover the best deals for your most used AI subscriptions. Pricing pages scanned hourly, deals delivered to your inbox.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scrivo — Never overpay for AI subscriptions",
    description:
      "Discover the best deals for your most used AI subscriptions. Pricing pages scanned hourly, deals delivered to your inbox.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${inter.variable}`}>
        <ConvexClientProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
