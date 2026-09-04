"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PreviewRow {
  rowNumber: number;
  lot_number: string;
  product_code: string | null;
  description: string | null;
  quantity_target: number;
  due_date: string | null;
  exists: boolean;
}

interface RowError {
  rowNumber: number;
  field: string;
  message: string;
  value?: string;
}

interface Preview {
  filename: string;
  sheetName: string | null;
  otherSheets: string[];
  headers: string[];
  mapping: Record<string, string | null>;
  totalDataRows: number;
  validCount: number;
  errorCount: number;
  newCount: number;
  updateCount: number;
  rows: PreviewRow[];
  truncated: boolean;
  errors: RowError[];
}

interface CommitResult {
  inserted_count: number;
  updated_count: number;
  error_count: number;
  row_count: number;
}

const FIELD_LABELS: Record<string, string> = {
  lot_number: "Lot number",
  product_code: "Product code",
  description: "Description",
  quantity_target: "Quantity",
  due_date: "Due date",
};

export function ImportClient({ canImport }: { canImport: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<CommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(next: File) {
    reset();
    setFile(next);
    setBusy(true);

    const body = new FormData();
    body.append("file", next);

    const response = await fetch("/api/lots/import/preview", {
      method: "POST",
      body,
    });
    const json = await response.json();

    if (!response.ok) {
      setError(json.error ?? "That file could not be read.");
      setFile(null);
    } else {
      setPreview(json as Preview);
    }
    setBusy(false);
  }

  async function commit() {
    if (!file) return;
    setBusy(true);
    setError(null);

    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/lots/import/commit", {
      method: "POST",
      body,
    });
    const json = await response.json();

    if (!response.ok) {
      setError(json.error ?? "The import failed.");
    } else {
      setResult(json as CommitResult);
      setPreview(null);
      setFile(null);
      // Bring the import-history list underneath back in step.
      router.refresh();
    }
    setBusy(false);
  }

  if (!canImport) {
    return (
      <div className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
        <p className="text-sm font-medium">Import is restricted</p>
        <p className="mt-1 text-xs text-ink-faint">
          Your account has view-only access. Ask an administrator for the
          operator role to upload lot files.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ---- result banner ------------------------------------------- */}
      {result && (
        <div className="rounded-xl border border-st-completed/30 bg-st-completed/8 p-4">
          <p className="text-sm font-semibold text-st-completed">
            Import complete
          </p>
          <p className="mt-1 text-xs text-ink-dim">
            {result.inserted_count} new {result.inserted_count === 1 ? "lot" : "lots"} added
            {result.updated_count > 0 && `, ${result.updated_count} updated`}
            {result.error_count > 0 &&
              `, ${result.error_count} ${result.error_count === 1 ? "row" : "rows"} skipped`}
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/lots"
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand/90"
            >
              View production lots
            </Link>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs text-ink-dim transition hover:text-ink"
            >
              Import another file
            </button>
          </div>
        </div>
      )}

      {/* ---- dropzone ------------------------------------------------- */}
      {!preview && !result && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) void handleFile(dropped);
          }}
          className={`rounded-[var(--radius-card)] border-2 border-dashed p-8 text-center transition sm:p-12 ${
            dragging
              ? "border-brand/60 bg-brand/5"
              : "border-line bg-surface/50"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="mx-auto h-9 w-9 text-ink-faint"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 16V4m0 0L8 8m4-4 4 4M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
          </svg>

          <p className="mt-3 text-sm font-medium">
            {busy ? "Reading file…" : "Drop your lot spreadsheet here"}
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            .xlsx or .csv, up to 5 MB · nothing is saved until you confirm
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand/90 disabled:opacity-60"
            >
              Choose file
            </button>
            <a
              href="/templates/lot-import-template.xlsx"
              download
              className="rounded-lg border border-line bg-surface-2 px-4 py-2 text-xs text-ink-dim transition hover:text-ink"
            >
              Download template
            </a>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xlsm,.csv,.txt"
            className="sr-only"
            onChange={(e) => {
              const picked = e.target.files?.[0];
              if (picked) void handleFile(picked);
            }}
          />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-st-error/10 px-4 py-3 text-sm text-st-error ring-1 ring-st-error/25"
        >
          {error}
        </div>
      )}

      {/* ---- preview -------------------------------------------------- */}
      {preview && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{preview.filename}</p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {preview.totalDataRows} data{" "}
                {preview.totalDataRows === 1 ? "row" : "rows"} read
                {preview.sheetName && (
                  <> from sheet &ldquo;{preview.sheetName}&rdquo;</>
                )}
                {preview.otherSheets.length > 0 && (
                  <> · ignored: {preview.otherSheets.join(", ")}</>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs text-ink-dim transition hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commit}
                disabled={busy || preview.validCount === 0}
                className="rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50"
              >
                {busy
                  ? "Importing…"
                  : `Import ${preview.validCount} ${preview.validCount === 1 ? "lot" : "lots"}`}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <Tile label="New lots" value={preview.newCount} tone="good" />
            <Tile label="Updates" value={preview.updateCount} tone="info" />
            <Tile label="Ready to import" value={preview.validCount} tone="info" />
            <Tile
              label="Rows skipped"
              value={preview.errorCount}
              tone={preview.errorCount > 0 ? "bad" : "muted"}
            />
          </div>

          <ColumnMapping mapping={preview.mapping} headers={preview.headers} />

          {preview.errors.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold">
                Rows that will be skipped
              </h3>
              <ul className="divide-y divide-line-soft overflow-hidden rounded-xl border border-line bg-surface">
                {preview.errors.map((e) => (
                  <li
                    key={`${e.rowNumber}-${e.field}`}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 py-2.5 text-xs"
                  >
                    <span className="tnum font-medium text-st-error">
                      Row {e.rowNumber}
                    </span>
                    <span className="text-ink-faint">
                      {FIELD_LABELS[e.field] ?? e.field}
                    </span>
                    <span className="text-ink-dim">— {e.message}</span>
                    {e.value && (
                      <code className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] text-ink-dim">
                        {e.value}
                      </code>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {preview.rows.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold">
                Preview
                {preview.truncated && (
                  <span className="ml-2 text-xs font-normal text-ink-faint">
                    first {preview.rows.length} of {preview.validCount}
                  </span>
                )}
              </h3>
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-2/60 text-left text-[11px] uppercase tracking-wider text-ink-faint">
                      <th scope="col" className="px-4 py-2.5 font-medium">Row</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Lot number</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Product</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Description</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Qty</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Due</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((r) => (
                      <tr
                        key={r.rowNumber}
                        className="border-b border-line-soft bg-surface last:border-0"
                      >
                        <td className="tnum px-4 py-2 text-[12px] text-ink-faint">
                          {r.rowNumber}
                        </td>
                        <td className="tnum px-4 py-2 font-mono text-[13px] font-medium">
                          {r.lot_number}
                        </td>
                        <td className="px-4 py-2 text-[13px] text-ink-dim">
                          {r.product_code ?? "—"}
                        </td>
                        <td className="max-w-[240px] truncate px-4 py-2 text-[13px] text-ink-dim">
                          {r.description ?? "—"}
                        </td>
                        <td className="tnum px-4 py-2 text-[13px]">
                          {r.quantity_target}
                        </td>
                        <td className="tnum px-4 py-2 text-[13px] text-ink-dim">
                          {r.due_date ?? "—"}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] ${
                              r.exists
                                ? "bg-st-paused/15 text-st-paused"
                                : "bg-st-completed/15 text-st-completed"
                            }`}
                          >
                            {r.exists ? "Update" : "New"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "bad" | "info" | "muted";
}) {
  const color = {
    good: "var(--color-st-completed)",
    bad: "var(--color-st-error)",
    info: "var(--color-st-printing)",
    muted: "var(--color-st-idle)",
  }[tone];

  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
        <p className="truncate text-[11px] font-medium text-ink-dim">{label}</p>
      </div>
      <p className="tnum mt-1.5 text-2xl font-semibold leading-none">{value}</p>
    </div>
  );
}

/** Shows the client exactly how their headers were interpreted. */
function ColumnMapping({
  mapping,
  headers,
}: {
  mapping: Record<string, string | null>;
  headers: string[];
}) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <h3 className="text-sm font-semibold">Column mapping</h3>
      <p className="mt-0.5 text-xs text-ink-faint">
        Matched from your header row. Unmatched columns are ignored.
      </p>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(FIELD_LABELS).map(([field, label]) => (
          <div key={field} className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-ink-dim">{label}</dt>
            <dd className="min-w-0 truncate text-xs">
              {mapping[field] ? (
                <code className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11px]">
                  {mapping[field]}
                </code>
              ) : (
                <span className="text-ink-faint">not found</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {headers.length > 0 && (
        <p className="mt-3 truncate border-t border-line-soft pt-2.5 text-[11px] text-ink-faint">
          Headers read: {headers.filter(Boolean).join(" · ")}
        </p>
      )}
    </section>
  );
}
