import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { LoginScreen } from "@/components/auth/LoginScreen";

export const metadata: Metadata = { title: "Sign in" };
export const viewport: Viewport = { themeColor: "#fbfbfa" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginScreen
        demo={
          process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === "true"
            ? { user: process.env.AUTH_USER ?? "", password: process.env.AUTH_PASSWORD ?? "" }
            : null
        }
      />
    </Suspense>
  );
}
