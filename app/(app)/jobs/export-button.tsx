"use client";

import type { JobTableRow } from "@/components/job-table";

function toCsv(rows: JobTableRow[]): string {
  const header = [
    "lot_number",
    "product_code",
    "printer",
    "job_file",
    "status",
    "progress_pct",
    "started_at",
    "ended_at",
    "failure_reason",
  ];

  // Quote everything and double any embedded quotes: lot numbers and
  // descriptions can legitimately contain commas.
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const lines = rows.map((r) =>
    [
      r.lot_number,
      r.product_code,
      r.printer_name,
      r.job_name,
      r.status,
      r.progress_pct,
      r.started_at,
      r.ended_at,
      r.failure_reason,
    ]
      .map(escape)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

export function ExportButton({ rows }: { rows: JobTableRow[] }) {
  function download() {
    const blob = new Blob([toCsv(rows)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `print-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={rows.length === 0}
      className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs text-ink-dim transition hover:border-brand/40 hover:text-ink disabled:opacity-50"
    >
      Export CSV
    </button>
  );
}
