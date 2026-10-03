import { ImageResponse } from "next/og";

export const alt = "MindVault — Your mind, vaulted.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#050505",
          color: "#f4f4f2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, letterSpacing: -0.5 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 44V20l12 14 12-14v24" />
            </svg>
          </div>
          MindVault
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 132, letterSpacing: -7, lineHeight: 0.95, fontWeight: 500 }}>Your mind,</div>
          <div style={{ fontSize: 132, letterSpacing: -7, lineHeight: 0.95, fontWeight: 500 }}>vaulted.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "rgba(244,244,242,0.5)" }}>
          <span>Local-first · AI-assisted · Yours</span>
          <span>Nothing leaves your device.</span>
        </div>
      </div>
    ),
    size,
  );
}
