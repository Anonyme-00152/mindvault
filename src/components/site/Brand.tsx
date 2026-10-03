import { cn } from "@/lib/utils";

/** The MindVault mark on light surfaces: an ink tile with the M drawn in light. */
export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={cn("shrink-0", className)}>
      <defs>
        <linearGradient id="mv-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#23252c" />
          <stop offset="1" stopColor="#0d0e11" />
        </linearGradient>
        <linearGradient id="mv-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a69dff" />
          <stop offset="0.6" stopColor="#6fd3ff" />
          <stop offset="1" stopColor="#7cf2c4" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#mv-tile)" />
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="15.25" fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="1.5" />
      <path d="M19 45V20l13 15 13-15v25" fill="none" stroke="url(#mv-stroke)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-semibold tracking-[-0.02em] text-[16px] text-[var(--s-ink)]", className)}>
      <BrandMark size={size} />
      MindVault
    </span>
  );
}
