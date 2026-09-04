import Link from "next/link";
import { JOB_STATUS } from "@/lib/status";
import { StatusPill } from "@/components/status-pill";
import { ProgressBar } from "@/components/progress-bar";
import { formatDateTime, formatDuration, formatPct } from "@/lib/format";
import type { JobStatus } from "@/lib/supabase/types";

export interface JobTableRow {
  id: string;
  job_name: string;
  status: JobStatus;
  progress_pct: number;
  started_at: string;
  ended_at: string | null;
  failure_reason: string | null;
  lot_number: string | null;
  product_code: string | null;
  printer_id: string;
  printer_name: string;
}

function elapsed(row: JobTableRow): string {
  const end = row.ended_at ? new Date(row.ended_at).getTime() : Date.now();
  const start = new Date(row.started_at).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return "—";
  return formatDuration((end - start) / 1000);
}

/**
 * Job history. A real table on desktop, a card list on phones — a
 * six-column table inside a 390px viewport is unreadable however you
 * scroll it.
 */
export function JobTable({
  rows,
  showPrinter = true,
  emptyMessage = "No jobs recorded yet.",
}: {
  rows: JobTableRow[];
  showPrinter?: boolean;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface/40 px-6 py-10 text-center">
        <p className="text-sm text-ink-faint">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* ---- phones -------------------------------------------------- */}
      <ul className="space-y-2 md:hidden">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-line bg-surface p-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="tnum truncate font-mono text-sm font-semibold">
                  {r.lot_number ?? "Unassigned"}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-ink-faint">
                  {r.job_name}
                </p>
              </div>
              <StatusPill style={JOB_STATUS[r.status]} size="sm" />
            </div>

            <div className="mt-2.5">
              <ProgressBar
                value={r.progress_pct}
                color={JOB_STATUS[r.status].color}
                height={5}
              />
            </div>

            <dl className="mt-2.5 grid grid-cols-3 gap-2 text-[11px]">
              {showPrinter && (
                <div className="min-w-0">
                  <dt className="text-ink-faint">Printer</dt>
                  <dd className="mt-0.5 truncate">{r.printer_name}</dd>
                </div>
              )}
              <div className="min-w-0">
                <dt className="text-ink-faint">Progress</dt>
                <dd className="tnum mt-0.5">{formatPct(r.progress_pct)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-ink-faint">Duration</dt>
                <dd className="tnum mt-0.5">{elapsed(r)}</dd>
              </div>
            </dl>

            {r.failure_reason && (
              <p className="mt-2 truncate text-[11px] text-st-error">
                {r.failure_reason}
              </p>
            )}
          </li>
        ))}
      </ul>

      {/* ---- tablet and up ------------------------------------------- */}
      <div className="hidden overflow-x-auto rounded-xl border border-line md:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2/60 text-left text-[11px] uppercase tracking-wider text-ink-faint">
              <th scope="col" className="px-4 py-2.5 font-medium">Lot</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Job file</th>
              {showPrinter && (
                <th scope="col" className="px-4 py-2.5 font-medium">Printer</th>
              )}
              <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Progress</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Started</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-line-soft bg-surface last:border-0 hover:bg-surface-2/40"
              >
                <td className="px-4 py-2.5">
                  <span className="tnum font-mono text-[13px] font-medium">
                    {r.lot_number ?? "—"}
                  </span>
                  {r.product_code && (
                    <span className="ml-2 text-[11px] text-ink-faint">
                      {r.product_code}
                    </span>
                  )}
                </td>
                <td className="max-w-[240px] truncate px-4 py-2.5 text-[13px] text-ink-dim">
                  {r.job_name}
                </td>
                {showPrinter && (
                  <td className="whitespace-nowrap px-4 py-2.5 text-[13px]">
                    <Link
                      href={`/printers/${r.printer_id}`}
                      className="text-ink-dim underline-offset-2 hover:text-ink hover:underline"
                    >
                      {r.printer_name}
                    </Link>
                  </td>
                )}
                <td className="px-4 py-2.5">
                  <StatusPill style={JOB_STATUS[r.status]} size="sm" />
                  {r.failure_reason && (
                    <p className="mt-1 max-w-[200px] truncate text-[11px] text-st-error">
                      {r.failure_reason}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <ProgressBar
                      value={r.progress_pct}
                      color={JOB_STATUS[r.status].color}
                      height={5}
                      className="w-16"
                    />
                    <span className="tnum text-[12px] text-ink-dim">
                      {formatPct(r.progress_pct)}
                    </span>
                  </div>
                </td>
                <td className="tnum whitespace-nowrap px-4 py-2.5 text-[12px] text-ink-dim">
                  {formatDateTime(r.started_at)}
                </td>
                <td className="tnum whitespace-nowrap px-4 py-2.5 text-[12px] text-ink-dim">
                  {elapsed(r)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
