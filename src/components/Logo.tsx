import { cn } from "@/lib/utils";

export function Logo({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-medium tracking-tight", className)}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
        <rect width="64" height="64" rx="14" fill="currentColor" opacity="0.08" />
        <rect x="0.5" y="0.5" width="63" height="63" rx="13.5" fill="none" stroke="currentColor" opacity="0.25" />
        <path
          d="M20 44V20l12 14 12-14v24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>MindVault</span>
    </span>
  );
}
