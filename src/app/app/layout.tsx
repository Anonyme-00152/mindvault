import type { Metadata } from "next";
import { Suspense } from "react";
import { Shell } from "@/components/app/Shell";

export const metadata: Metadata = {
  title: { default: "Vault", template: "%s · MindVault" },
  robots: { index: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="h-dvh bg-bg" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}