import type { LiveState } from "@/hooks/use-printer-overview";
import { formatRelative } from "@/lib/format";

export function LiveIndicator({
  state,
  updatedAt,
  now,
}: {
  state: LiveState;
  updatedAt: number;
  now: number;
}) {
  const config = {
    live: { text: "Live", dot: "bg-st-completed", pulse: true },
    connecting: { text: "Connecting", dot: "bg-st-paused", pulse: true },
    offline: { text: "Reconnecting", dot: "bg-st-error", pulse: false },
  }[state];

  return (
    <span className="inline-flex items-center gap-2 text-[11px] text-ink-faint">
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot} ${
          config.pulse ? "pulse-dot" : ""
        }`}
        aria-hidden
      />
      <span className="font-medium text-ink-dim">{config.text}</span>
      <span className="hidden sm:inline">
        · updated {formatRelative(new Date(updatedAt).toISOString(), now)}
      </span>
    </span>
  );
}
