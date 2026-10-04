/** Animated tick for `.check` boxes: the stroke draws itself each time it mounts. */
export function CheckMark({ size = 12 }: { size?: number }) {
  return (
    <svg className="check-mark" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
