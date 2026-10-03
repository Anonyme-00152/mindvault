export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="glass p-8 text-center">
      <div className="w-10 h-10 mx-auto mb-4 rounded-xl border border-line-strong flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-fg-faint" />
      </div>
      <p className="text-[15px] font-medium">{title}</p>
      {body && <p className="text-[13px] text-fg-muted mt-1">{body}</p>}
      {action && (
        <button className="btn btn-ghost btn-sm mt-5" onClick={action.onClick} data-cursor="hover">
          {action.label}
        </button>
      )}
    </div>
  );
}
