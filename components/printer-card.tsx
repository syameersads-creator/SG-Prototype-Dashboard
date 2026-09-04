"use client";

import Link from "next/link";
import { PRINTER_STATUS, needsAttention } from "@/lib/status";
import { StatusPill } from "@/components/status-pill";
import { ProgressBar } from "@/components/progress-bar";
import {
  formatEta,
  formatPct,
  formatTemp,
  formatRelative,
} from "@/lib/format";
import type { PrinterOverviewRow } from "@/lib/supabase/types";

export function PrinterCard({
  row,
  now,
}: {
  row: PrinterOverviewRow;
  now: number;
}) {
  const style = PRINTER_STATUS[row.printer_status];
  const running = row.job_id !== null;
  const progress = row.progress_pct ?? 0;

  return (
    <Link
      href={`/printers/${row.printer_id}`}
      className="group flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4 transition hover:border-line/80 hover:bg-surface-2/60 focus-visible:border-brand/50"
    >
      {/* ---- header -------------------------------------------------- */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{row.printer_name}</h3>
          <p className="mt-0.5 truncate text-[11px] text-ink-faint">
            {row.location ?? row.serial}
          </p>
        </div>
        <StatusPill style={style} size="sm" />
      </div>

      {/* ---- lot number: the reason this dashboard exists ------------- */}
      <div className="mt-4 min-h-[52px]">
        {row.lot_number ? (
          <>
            <p className="text-[10px] uppercase tracking-wider text-ink-faint">
              Production lot
            </p>
            <p className="tnum truncate font-mono text-[19px] font-semibold leading-tight tracking-tight text-ink">
              {row.lot_number}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-ink-dim">
              {row.product_code ? `${row.product_code} · ` : ""}
              {row.lot_description ?? "—"}
            </p>
          </>
        ) : (
          <div className="flex h-full flex-col justify-center">
            <p className="text-sm text-ink-faint">
              {row.printer_status === "maintenance"
                ? "Out of service"
                : "No active lot"}
            </p>
            {/* Error and offline notes get the dedicated banner below,
                so don't repeat them here. */}
            {row.status_note && !needsAttention(row.printer_status) && (
              <p className="mt-0.5 truncate text-[11px] text-ink-faint/80">
                {row.status_note}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ---- progress ------------------------------------------------ */}
      {running ? (
        <div className="mt-3">
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="tnum text-2xl font-semibold leading-none">
              {formatPct(progress)}
            </span>
            <span className="tnum text-[11px] text-ink-faint">
              layer {row.layer_current ?? 0}/{row.layer_total ?? 0}
            </span>
          </div>
          <ProgressBar value={progress} color={style.color} />
        </div>
      ) : (
        <div className="mt-3">
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="tnum text-2xl font-semibold leading-none text-ink-faint">
              —
            </span>
          </div>
          <ProgressBar value={0} />
        </div>
      )}

      {/* ---- footer -------------------------------------------------- */}
      <dl className="mt-3.5 grid grid-cols-3 gap-2 border-t border-line-soft pt-3 text-[11px]">
        <div className="min-w-0">
          <dt className="text-ink-faint">Remaining</dt>
          <dd className="tnum mt-0.5 truncate font-medium">
            {running ? formatEta(row.estimated_end_at, now) : "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-ink-faint">Nozzle</dt>
          <dd className="tnum mt-0.5 truncate font-medium">
            {running ? formatTemp(row.nozzle_temp) : "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-ink-faint">Bed</dt>
          <dd className="tnum mt-0.5 truncate font-medium">
            {running ? formatTemp(row.bed_temp) : "—"}
          </dd>
        </div>
      </dl>

      {/* An errored or offline machine is the one thing an operator must
          not have to hunt for, so it gets its own line. */}
      {needsAttention(row.printer_status) && row.status_note && (
        <p className="mt-3 truncate rounded-md bg-st-error/10 px-2 py-1.5 text-[11px] text-st-error ring-1 ring-st-error/20">
          {row.status_note}
        </p>
      )}

      {row.printer_status === "offline" && (
        <p className="mt-2 text-[11px] text-ink-faint">
          Last seen {formatRelative(row.last_seen_at, now)}
        </p>
      )}
    </Link>
  );
}
