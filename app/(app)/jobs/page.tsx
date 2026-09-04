import { createClient } from "@/lib/supabase/server";
import { FilterBar } from "@/components/filter-bar";
import { JobTable } from "@/components/job-table";
import { ExportButton } from "./export-button";
import { JOB_STATUS } from "@/lib/status";
import { JOB_SELECT, toJobTableRows, type JobWithRelations } from "@/lib/jobs";
import { JOB_STATUSES } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Job history · Printer Floor" };

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; printer?: string }>;
}) {
  const { q, status, printer } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("print_jobs")
    .select(JOB_SELECT)
    .order("started_at", { ascending: false })
    .limit(200);

  const statusFilter = JOB_STATUSES.find((s) => s === status);
  if (statusFilter) query = query.eq("status", statusFilter);
  if (printer) query = query.eq("printer_id", printer);
  if (q) query = query.ilike("job_name", `%${q}%`);

  const [{ data: jobs }, { data: printers }] = await Promise.all([
    query,
    supabase.from("printers").select("id, name").order("sort_order"),
  ]);

  const rows = toJobTableRows(jobs as unknown as JobWithRelations[]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            Job history
          </h1>
          <p className="mt-0.5 text-xs text-ink-faint">
            Every print run across the floor, newest first
            {rows.length >= 200 && " · showing the latest 200"}
          </p>
        </div>
        <ExportButton rows={rows} />
      </header>

      <FilterBar
        searchPlaceholder="Search job file name"
        selects={[
          {
            key: "printer",
            label: "All printers",
            options: (printers ?? []).map((p) => ({
              value: p.id,
              label: p.name,
            })),
          },
          {
            key: "status",
            label: "All statuses",
            options: JOB_STATUSES.map((s) => ({
              value: s,
              label: JOB_STATUS[s].label,
            })),
          },
        ]}
      />

      <JobTable
        rows={rows}
        emptyMessage={
          q || status || printer
            ? "No jobs match these filters."
            : "No jobs have run yet."
        }
      />
    </div>
  );
}
