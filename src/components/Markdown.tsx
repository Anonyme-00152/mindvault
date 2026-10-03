import { Fragment } from "react";

/** Minimal, safe renderer for the assistant's output: **bold**, _italic_, bullets, line breaks. */
export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const isBullet = /^\s*[•\-*]\s+/.test(line);
        const content = isBullet ? line.replace(/^\s*[•\-*]\s+/, "") : line;
        if (!content.trim()) return <div key={i} className="h-1" />;
        return (
          <p key={i} className={isBullet ? "pl-4 relative before:content-['•'] before:absolute before:left-0 before:opacity-50" : ""}>
            {inline(content)}
          </p>
        );
      })}
    </div>
  );
}

function inline(s: string) {
  const parts = s.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-medium text-current">{p.slice(2, -2)}</strong>;
    if (p.startsWith("_") && p.endsWith("_") && p.length > 2) return <em key={i} className="opacity-70">{p.slice(1, -1)}</em>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}
