import type { JobTableRow } from "@/components/job-table";
import type { JobStatus } from "@/lib/supabase/types";

/** The embedded shape PostgREST returns for the job history queries. */
export interface JobWithRelations {
  id: string;
  job_name: string;
  status: string;
  progress_pct: number;
  started_at: string;
  ended_at: string | null;
  failure_reason: string | null;
  printer_id: string;
  lots: { lot_number: string; product_code: string | null } | null;
  printers: { name: string } | null;
}

export const JOB_SELECT =
  "id, job_name, status, progress_pct, started_at, ended_at, failure_reason, printer_id, lots(lot_number, product_code), printers(name)";

export function toJobTableRows(
  rows: JobWithRelations[] | null | undefined,
): JobTableRow[] {
  return (rows ?? []).map((r) => ({
    id: r.id,
    job_name: r.job_name,
    status: r.status as JobStatus,
    progress_pct: Number(r.progress_pct),
    started_at: r.started_at,
    ended_at: r.ended_at,
    failure_reason: r.failure_reason,
    lot_number: r.lots?.lot_number ?? null,
    product_code: r.lots?.product_code ?? null,
    printer_id: r.printer_id,
    printer_name: r.printers?.name ?? "—",
  }));
}
