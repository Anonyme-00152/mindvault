import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "MindVault — Your mind, vaulted.", template: "%s · MindVault" },
  description:
    "A private, local-first vault for notes, tasks and files — with an assistant that only knows what you tell it. Nothing leaves your device.",
  openGraph: {
    title: "MindVault — Your mind, vaulted.",
    description: "A private, local-first vault for your thoughts. Nothing leaves your device.",
    url: siteUrl,
    siteName: "MindVault",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "MindVault" },
  applicationName: "MindVault",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fafaf9",
  width: "device-width",
  initialScale: 1,
  // App-like on phones: no pinch/auto zoom on inputs; the keyboard resizes the layout instead of covering it.
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

const themeInit = `(function(){try{var t=localStorage.getItem('mv-theme-v2');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
