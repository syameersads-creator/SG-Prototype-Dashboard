import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { ImportClient } from "./import-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Import lots · Printer Floor" };

export default async function ImportPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: imports }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id ?? "")
      .maybeSingle(),
    supabase
      .from("lot_imports")
      .select("id, filename, row_count, inserted_count, updated_count, error_count, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const canImport =
    profile?.role === "admin" || profile?.role === "operator";

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
          Import production lots
        </h1>
        <p className="mt-0.5 text-xs text-ink-faint">
          Upload the lot spreadsheet. Existing lot numbers are updated rather
          than duplicated, so a corrected file can be re-uploaded safely.
        </p>
      </header>

      <ImportClient canImport={canImport} />

      <section>
        <h2 className="mb-2.5 text-sm font-semibold">Recent imports</h2>
        {imports && imports.length > 0 ? (
          <ul className="divide-y divide-line-soft overflow-hidden rounded-xl border border-line bg-surface">
            {imports.map((imp) => (
              <li
                key={imp.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{imp.filename}</p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">
                    {formatDateTime(imp.created_at)}
                  </p>
                </div>
                <p className="tnum shrink-0 text-[11px] text-ink-dim">
                  <span className="text-st-completed">
                    {imp.inserted_count} new
                  </span>
                  {" · "}
                  {imp.updated_count} updated
                  {imp.error_count > 0 && (
                    <>
                      {" · "}
                      <span className="text-st-error">
                        {imp.error_count} skipped
                      </span>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-surface/40 px-6 py-8 text-center">
            <p className="text-xs text-ink-faint">No files imported yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
