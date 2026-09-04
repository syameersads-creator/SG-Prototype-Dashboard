export function ChartShell({
  title,
  subtitle,
  legend,
  children,
  empty,
}: {
  title: string;
  subtitle?: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-ink-faint">{subtitle}</p>
          )}
        </div>
        {legend}
      </div>
      {empty ? (
        <div className="grid h-[180px] place-items-center rounded-lg border border-dashed border-line-soft">
          <p className="text-xs text-ink-faint">No readings yet</p>
        </div>
      ) : (
        <div className="h-[180px] w-full">{children}</div>
      )}
    </section>
  );
}

/** A legend entry: coloured mark beside text-token label, never coloured text. */
export function LegendKey({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5 text-[11px] text-ink-dim">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: i.color }}
            aria-hidden
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
