"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Demo controls, admin only.
 *
 * These exist because a live walkthrough needs to answer "what happens
 * when one finishes?" without waiting twenty minutes for a real job to
 * end. They call SECURITY DEFINER functions that re-check the caller's
 * role in Postgres, so the browser never holds elevated credentials.
 *
 * Delete this component and the sim_* functions when real printers are
 * wired up — nothing else depends on it.
 */
export function SimControls({ onChanged }: { onChanged: () => void }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("sim_settings")
      .select("enabled")
      .maybeSingle()
      .then(({ data }) => setEnabled(data?.enabled ?? null));
  }, []);

  async function run(action: "toggle" | "reset") {
    setBusy(action);
    setError(null);
    const supabase = createClient();

    const { error: rpcError } =
      action === "toggle"
        ? await supabase.rpc("sim_set_enabled", { p_enabled: !enabled })
        : await supabase.rpc("sim_reset");

    if (rpcError) {
      setError(rpcError.message);
    } else {
      if (action === "toggle") setEnabled((v) => !v);
      onChanged();
    }
    setBusy(null);
  }

  return (
    <div className="rounded-xl border border-dashed border-line bg-surface/40 px-3.5 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-2 text-[11px] font-medium text-ink-dim transition hover:text-ink"
        >
          <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ink-faint">
            Prototype
          </span>
          Simulated printer feed
          <svg
            viewBox="0 0 24 24"
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => run("toggle")}
            disabled={busy !== null || enabled === null}
            className="rounded-md border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-ink-dim transition hover:border-brand/40 hover:text-ink disabled:opacity-50"
          >
            {busy === "toggle"
              ? "…"
              : enabled === false
                ? "Resume feed"
                : "Pause feed"}
          </button>
          <button
            type="button"
            onClick={() => run("reset")}
            disabled={busy !== null}
            className="rounded-md border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-ink-dim transition hover:border-brand/40 hover:text-ink disabled:opacity-50"
          >
            {busy === "reset" ? "Resetting…" : "Reset demo data"}
          </button>
        </div>
      </div>

      {open && (
        <p className="mt-2.5 border-t border-line-soft pt-2.5 text-[11px] leading-relaxed text-ink-faint">
          The eight machines are driven by a simulator running inside Postgres
          on a ten-second schedule. It writes through the same{" "}
          <code className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[10px]">
            ingest_printer_status()
          </code>{" "}
          contract a real shop-floor bridge will use, so nothing above this
          layer changes when the printers are connected for real.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-[11px] text-st-error">
          {error}
        </p>
      )}
    </div>
  );
}
