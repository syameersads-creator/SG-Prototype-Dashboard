"use client";

import { usePrinterOverview } from "@/hooks/use-printer-overview";
import { useNow } from "@/hooks/use-now";
import { PrinterCard } from "@/components/printer-card";
import { FleetSummary } from "@/components/fleet-summary";
import { LiveIndicator } from "@/components/live-indicator";
import { SimControls } from "@/components/sim-controls";
import type { PrinterOverviewRow } from "@/lib/supabase/types";

export function FloorView({
  initialRows,
  lotsDue,
  isAdmin,
}: {
  initialRows: PrinterOverviewRow[];
  lotsDue: number;
  isAdmin: boolean;
}) {
  const { rows, live, updatedAt, refetch } = usePrinterOverview(initialRows);
  const now = useNow();

  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            Printer floor
          </h1>
          <p className="mt-0.5 text-xs text-ink-faint">
            Production lot and progress across all {rows.length} machines
          </p>
        </div>
        <LiveIndicator state={live} updatedAt={updatedAt} now={now} />
      </header>

      <FleetSummary rows={rows} lotsDue={lotsDue} />

      {isAdmin && <SimControls onChanged={refetch} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {rows.map((row) => (
          <PrinterCard key={row.printer_id} row={row} now={now} />
        ))}
      </div>

      {rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-line bg-surface/50 px-6 py-12 text-center">
          <p className="text-sm font-medium">No printers registered</p>
          <p className="mt-1 text-xs text-ink-faint">
            Seed the floor, or point a printer bridge at ingest_printer_status().
          </p>
        </div>
      )}
    </div>
  );
}
