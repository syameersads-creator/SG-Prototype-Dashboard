export function ProgressBar({
  value,
  color = "var(--color-st-printing)",
  className = "",
  height = 8,
}: {
  /** 0–100. */
  value: number;
  color?: string;
  className?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-surface-3 ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
