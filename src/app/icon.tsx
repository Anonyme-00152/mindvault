import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** 512×512 PNG app icon (Android / desktop install, notification badge). */
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0a0a0f 0%,#050505 100%)", borderRadius: 96 }}>
        <svg width="360" height="360" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8b7cff" />
              <stop offset="0.55" stopColor="#4fd1ff" />
              <stop offset="1" stopColor="#7cf7c8" />
            </linearGradient>
          </defs>
          <rect x="1.5" y="1.5" width="61" height="61" rx="14" stroke="url(#g)" strokeWidth="2" />
          <path d="M20 44V20l12 14 12-14v24" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}
