export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
      <div className="min-w-0">
        {eyebrow && <p className="text-[13px] text-fg-faint font-medium mb-1.5">{eyebrow}</p>}
        <h1 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.03em] leading-tight">{title}</h1>
        {subtitle && <p className="text-fg-muted text-[14.5px] mt-1.5 max-w-xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
