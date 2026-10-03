import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name}, ${siteConfig.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colours mirror the dark theme tokens (ImageResponse can't read CSS variables).
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "96px",
        background:
          "radial-gradient(ellipse at 20% 0%, rgba(124, 134, 255, 0.28), transparent 60%), #0e0f12",
        color: "#f3f4f6",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 80, fontWeight: 600, letterSpacing: "-0.03em" }}>
        {siteConfig.name}
      </div>
      <div style={{ marginTop: 20, fontSize: 40, color: "#a5abff" }}>
        {siteConfig.role}
      </div>
      <div
        style={{ marginTop: 32, fontSize: 28, color: "#9ca3af", maxWidth: 900 }}
      >
        Agentic AI systems and quantitative forecasting
      </div>
    </div>,
    size,
  );
}
