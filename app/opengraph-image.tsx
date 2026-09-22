import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const alt = "Scrivo — never overpay for AI subscriptions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F8F7F3",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 13,
              background: "#3F83F8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
              <circle cx="7.5" cy="7.5" r=".5" fill="white" />
            </svg>
          </div>
          <span
            style={{ fontSize: 34, fontWeight: 600, color: "#1D1D1F", letterSpacing: -1 }}
          >
            Scrivo
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 74,
              fontWeight: 600,
              letterSpacing: -4,
              lineHeight: 1.02,
              color: "#1D1D1F",
              maxWidth: 1000,
            }}
          >
            <span>Discover the&nbsp;</span>
            <span style={{ color: "#3F83F8" }}>best deals&nbsp;</span>
            <span>for your most used AI subscriptions.</span>
          </div>
          <span style={{ marginTop: 28, fontSize: 26, color: "#55534D" }}>
            Pricing pages scanned hourly. Deals delivered to your inbox.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 28,
            fontSize: 18,
            fontWeight: 600,
            color: "#9B988E",
            letterSpacing: 3,
          }}
        >
          <span>12 TOOLS WATCHED</span>
          <span>EMAIL DIGESTS</span>
          <span>INSTANT ALERTS</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
