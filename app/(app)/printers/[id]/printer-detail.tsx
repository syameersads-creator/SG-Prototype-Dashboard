"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useNow } from "@/hooks/use-now";
import { PRINTER_STATUS } from "@/lib/status";
import { StatusPill } from "@/components/status-pill";
import { ProgressBar } from "@/components/progress-bar";
import { TelemetryCharts } from "@/components/charts/telemetry-charts";
import { JobTable, type JobTableRow } from "@/components/job-table";
import {
  formatDateTime,
  formatEta,
  formatGrams,
  formatPct,
  formatRelative,
  formatTemp,
} from "@/lib/format";
import type {
  PrinterOverviewRow,
  PrinterTelemetryRow,
} from "@/lib/supabase/types";

export function PrinterDetail({
  initialOverview,
  initialTelemetry,
  jobs,
  isAdmin,
}: {
  initialOverview: PrinterOverviewRow;
  initialTelemetry: PrinterTelemetryRow[];
  jobs: JobTableRow[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const now = useNow();
  const [row, setRow] = useState(initialOverview);
  const [telemetry, setTelemetry] = useState(initialTelemetry);
  const [completing, setCompleting] = useState(false);
  const printerId = initialOverview.printer_id;
  const lastJobId = useRef(initialOverview.job_id);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const since = new Date(Date.now() - 6 * 3600_000).toISOString();

    const [{ data: overview }, { data: points }] = await Promise.all([
      supabase
        .from("printer_overview")
        .select("*")
        .eq("printer_id", printerId)
        .maybeSingle(),
      supabase
        .from("printer_telemetry")
        .select("*")
        .eq("printer_id", printerId)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true })
        .limit(600),
    ]);

    if (overview) {
      const next = overview as PrinterOverviewRow;
      setRow(next);
      // A new job means the history table below is stale; re-render the
      // server component rather than patching rows by hand.
      if (next.job_id !== lastJobId.current) {
        lastJobId.current = next.job_id;
        router.refresh();
      }
    }
    if (points) setTelemetry(points as PrinterTelemetryRow[]);
  }, [printerId, router]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`printer-${printerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "print_jobs",
          filter: `printer_id=eq.${printerId}`,
        },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "printers",
          filter: `id=eq.${printerId}`,
        },
        () => void refresh(),
      )
      .subscribe();

    // Telemetry isn't published over Realtime (too chatty), so the charts
    // pull on a slow interval of their own.
    const poll = setInterval(() => void refresh(), 12_000);

    return () => {
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [printerId, refresh]);

  async function forceComplete() {
    setCompleting(true);
    const supabase = createClient();
    await supabase.rpc("sim_force_complete", { p_printer_id: printerId });
    await refresh();
    router.refresh();
    setCompleting(false);
  }

  const style = PRINTER_STATUS[row.printer_status];
  const running = row.job_id !== null;

  return (
    <div className="space-y-4 sm:space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-ink-faint transition hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        All printers
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              {row.printer_name}
            </h1>
            <StatusPill style={style} />
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            {row.manufacturer} {row.model} · {row.serial}
            {row.location ? ` · ${row.location}` : ""} · seen{" "}
            {formatRelative(row.last_seen_at, now)}
          </p>
        </div>

        {isAdmin && running && (
          <button
            type="button"
            onClick={forceComplete}
            disabled={completing}
            className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs text-ink-dim transition hover:border-brand/40 hover:text-ink disabled:opacity-50"
          >
            {completing ? "Completing…" : "Force complete (demo)"}
          </button>
        )}
      </header>

      {/* ---- current job ---------------------------------------------- */}
      <section className="rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5">
        {running ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-ink-faint">
                Production lot
              </p>
              <p className="tnum mt-1 break-all font-mono text-2xl font-semibold leading-tight sm:text-3xl">
                {row.lot_number ?? "Unassigned"}
              </p>
              <p className="mt-1.5 text-sm text-ink-dim">
                {row.lot_description ?? "—"}
              </p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {row.product_code ?? "—"}
                {row.quantity_target !== null &&
                  ` · unit ${(row.quantity_done ?? 0) + 1} of ${row.quantity_target}`}
              </p>
              <p className="mt-3 truncate font-mono text-[11px] text-ink-faint">
                {row.job_name}
              </p>
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="tnum text-4xl font-semibold leading-none">
                  {formatPct(row.progress_pct)}
                </span>
                <span className="tnum text-xs text-ink-faint">
                  layer {row.layer_current ?? 0} / {row.layer_total ?? 0}
                </span>
              </div>
              <ProgressBar
                value={row.progress_pct ?? 0}
                color={style.color}
                height={10}
              />

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                <Stat label="Remaining" value={formatEta(row.estimated_end_at, now)} />
                <Stat label="Started" value={formatDateTime(row.started_at)} />
                <Stat label="Nozzle" value={formatTemp(row.nozzle_temp)} />
                <Stat label="Bed" value={formatTemp(row.bed_temp)} />
                <Stat label="Filament" value={formatGrams(row.filament_used_g)} />
                <Stat
                  label="Est. finish"
                  value={formatDateTime(row.estimated_end_at)}
                />
              </dl>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm font-medium">
              {row.printer_status === "maintenance"
                ? "Machine is out of service"
                : "No job running"}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {row.status_note ??
                "The next queued lot is picked up automatically."}
            </p>
          </div>
        )}
      </section>

      <TelemetryCharts rows={telemetry} />

      <section>
        <h2 className="mb-2.5 text-sm font-semibold">Recent jobs</h2>
        <JobTable
          rows={jobs}
          showPrinter={false}
          emptyMessage="This printer has not run a job yet."
        />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-ink-faint">{label}</dt>
      <dd className="tnum mt-0.5 truncate text-sm font-medium">{value}</dd>
    </div>
  );
}
