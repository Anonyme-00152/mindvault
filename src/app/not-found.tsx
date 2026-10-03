import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/site/Brand";

export default function NotFound() {
  return (
    <main className="site relative flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      <div className="absolute inset-0 s-grid-bg" aria-hidden />
      <div className="relative">
        <Wordmark className="justify-center" />
        <p className="mt-12 s-eyebrow">Error 404</p>
        <h1 className="s-h2 mt-4">
          Not in the <span className="s-serif s-grad-text">vault.</span>
        </h1>
        <p className="s-lead mt-4 max-w-sm mx-auto">This page doesn&apos;t exist — or it was never written down.</p>
        <Link href="/" className="s-btn s-btn-primary s-btn-lg mt-9">
          <ArrowLeft size={16} /> Back home
        </Link>
      </div>
    </main>
  );
}
