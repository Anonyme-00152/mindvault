import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-bg-elev/60 px-6 py-10 text-center">
      <div className="w-11 h-11 mx-auto mb-4 rounded-xl bg-bg-elev border border-line shadow-[var(--shadow-card)] flex items-center justify-center text-fg-faint">
        {icon ?? <Inbox size={18} />}
      </div>
      <p className="text-[14.5px] font-semibold">{title}</p>
      {body && <p className="text-[13px] text-fg-muted mt-1 max-w-xs mx-auto">{body}</p>}
      {action && (
        <button className="btn btn-sm mt-5" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
