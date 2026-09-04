import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FilterBar } from "@/components/filter-bar";
import { StatusPill } from "@/components/status-pill";
import { ProgressBar } from "@/components/progress-bar";
import { LOT_STATUS } from "@/lib/status";
import { daysUntil, formatDate } from "@/lib/format";
import { LOT_STATUSES, type LotRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Lots · Printer Floor" };

interface ActiveJob {
  lot_id: string | null;
  printer_id: string;
  printers: { name: string } | null;
}

function DueCell({ due }: { due: string | null }) {
  const days = daysUntil(due);
  const tone =
    days === null
      ? "text-ink-faint"
      : days < 0
        ? "text-st-error"
        : days <= 1
          ? "text-st-paused"
          : "text-ink-dim";

  return (
    <span className={`tnum text-[12px] ${tone}`}>
      {formatDate(due)}
      {days !== null && days < 0 && " · overdue"}
    </span>
  );
}

export default async function LotsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("lots")
    .select("*")
    .order("status", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: true })
    .limit(300);

  if (q) {
    const term = `%${q}%`;
    query = query.or(
      `lot_number.ilike.${term},product_code.ilike.${term},description.ilike.${term}`,
    );
  }
  const statusFilter = LOT_STATUSES.find((s) => s === status);
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const [{ data: lots }, { data: activeJobs }] = await Promise.all([
    query,
    supabase
      .from("print_jobs")
      .select("lot_id, printer_id, printers(name)")
      .in("status", ["queued", "printing", "paused"]),
  ]);

  // Which machine is on which lot right now.
  const running = new Map<string, { id: string; name: string }[]>();
  for (const job of (activeJobs ?? []) as unknown as ActiveJob[]) {
    if (!job.lot_id) continue;
    const list = running.get(job.lot_id) ?? [];
    list.push({ id: job.printer_id, name: job.printers?.name ?? "—" });
    running.set(job.lot_id, list);
  }

  const rows = (lots ?? []) as LotRow[];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            Production lots
          </h1>
          <p className="mt-0.5 text-xs text-ink-faint">
            {rows.length} {rows.length === 1 ? "lot" : "lots"}
            {q || status ? " matching your filters" : ""}
          </p>
        </div>
        <Link
          href="/lots/import"
          className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs text-ink-dim transition hover:border-brand/40 hover:text-ink"
        >
          Import from spreadsheet
        </Link>
      </header>

      <FilterBar
        searchPlaceholder="Search lot, product or description"
        selects={[
          {
            key: "status",
            label: "All statuses",
            options: LOT_STATUSES.map((s) => ({
              value: s,
              label: LOT_STATUS[s].label,
            })),
          },
        ]}
      />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm font-medium">No lots found</p>
          <p className="mt-1 text-xs text-ink-faint">
            {q || status
              ? "Try clearing the filters."
              : "Import a lot spreadsheet to get started."}
          </p>
        </div>
      ) : (
        <>
          {/* ---- phones ---------------------------------------------- */}
          <ul className="space-y-2 md:hidden">
            {rows.map((lot) => {
              const pct = (lot.quantity_done / lot.quantity_target) * 100;
              const machines = running.get(lot.id) ?? [];
              return (
                <li
                  key={lot.id}
                  className="rounded-xl border border-line bg-surface p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="tnum truncate font-mono text-sm font-semibold">
                        {lot.lot_number}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-ink-dim">
                        {lot.product_code ? `${lot.product_code} · ` : ""}
                        {lot.description ?? "—"}
                      </p>
                    </div>
                    <StatusPill style={LOT_STATUS[lot.status]} size="sm" />
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    <ProgressBar
                      value={pct}
                      color={LOT_STATUS[lot.status].color}
                      height={5}
                    />
                    <span className="tnum shrink-0 text-[11px] text-ink-dim">
                      {lot.quantity_done}/{lot.quantity_target}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <DueCell due={lot.due_date} />
                    {machines.length > 0 && (
                      <span className="text-[11px] text-ink-faint">
                        on {machines.map((m) => m.name).join(", ")}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* ---- tablet and up --------------------------------------- */}
          <div className="hidden overflow-x-auto rounded-xl border border-line md:block">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2/60 text-left text-[11px] uppercase tracking-wider text-ink-faint">
                  <th scope="col" className="px-4 py-2.5 font-medium">Lot number</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Product</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Description</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Completed</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Running on</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((lot) => {
                  const pct = (lot.quantity_done / lot.quantity_target) * 100;
                  const machines = running.get(lot.id) ?? [];
                  return (
                    <tr
                      key={lot.id}
                      className="border-b border-line-soft bg-surface last:border-0 hover:bg-surface-2/40"
                    >
                      <td className="tnum whitespace-nowrap px-4 py-2.5 font-mono text-[13px] font-medium">
                        {lot.lot_number}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[13px] text-ink-dim">
                        {lot.product_code ?? "—"}
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-2.5 text-[13px] text-ink-dim">
                        {lot.description ?? "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <ProgressBar
                            value={pct}
                            color={LOT_STATUS[lot.status].color}
                            height={5}
                            className="w-16"
                          />
                          <span className="tnum text-[12px] text-ink-dim">
                            {lot.quantity_done}/{lot.quantity_target}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusPill style={LOT_STATUS[lot.status]} size="sm" />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[12px]">
                        {machines.length === 0 ? (
                          <span className="text-ink-faint">—</span>
                        ) : (
                          machines.map((m, i) => (
                            <span key={m.id}>
                              {i > 0 && ", "}
                              <Link
                                href={`/printers/${m.id}`}
                                className="text-ink-dim underline-offset-2 hover:text-ink hover:underline"
                              >
                                {m.name}
                              </Link>
                            </span>
                          ))
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <DueCell due={lot.due_date} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
