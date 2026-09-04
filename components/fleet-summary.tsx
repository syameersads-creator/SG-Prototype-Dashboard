import { PRINTER_STATUS } from "@/lib/status";
import type { PrinterOverviewRow } from "@/lib/supabase/types";

/**
 * Four numbers an operator should be able to read from across the room.
 * Deliberately not a chart — the job here is a single magnitude each,
 * and a stat tile answers that better than any plot would.
 */
export function FleetSummary({
  rows,
  lotsDue,
}: {
  rows: PrinterOverviewRow[];
  lotsDue: number;
}) {
  const printing = rows.filter((r) => r.printer_status === "printing").length;
  const idle = rows.filter(
    (r) => r.printer_status === "idle" || r.printer_status === "paused",
  ).length;
  const attention = rows.filter(
    (r) =>
      r.printer_status === "error" ||
      r.printer_status === "offline" ||
      r.printer_status === "maintenance",
  ).length;

  const tiles = [
    {
      label: "Printing",
      value: printing,
      sub: `of ${rows.length} machines`,
      color: PRINTER_STATUS.printing.color,
    },
    {
      label: "Idle or paused",
      value: idle,
      sub: idle === 0 ? "fully loaded" : "available capacity",
      color: PRINTER_STATUS.idle.color,
    },
    {
      label: "Needs attention",
      value: attention,
      sub: attention === 0 ? "all clear" : "error, offline or in service",
      color:
        attention > 0
          ? PRINTER_STATUS.error.color
          : PRINTER_STATUS.idle.color,
    },
    {
      label: "Lots due ≤ 2 days",
      value: lotsDue,
      sub: "still open",
      color: PRINTER_STATUS.paused.color,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-xl border border-line bg-surface px-3.5 py-3 sm:px-4"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: t.color }}
              aria-hidden
            />
            <p className="truncate text-[11px] font-medium text-ink-dim">
              {t.label}
            </p>
          </div>
          <p className="tnum mt-1.5 text-3xl font-semibold leading-none">
            {t.value}
          </p>
          <p className="mt-1.5 truncate text-[11px] text-ink-faint">{t.sub}</p>
        </div>
      ))}
    </div>
  );
}
