"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PrinterOverviewRow } from "@/lib/supabase/types";

export type LiveState = "connecting" | "live" | "offline";

/**
 * Keeps the floor view in sync.
 *
 * Realtime carries the *signal* that something changed; the row set is
 * then re-read from the printer_overview view. Reading the view back is
 * deliberate — a change on print_jobs alone doesn't carry the joined lot
 * number, and a card without its lot number is the one thing this
 * dashboard exists to show.
 *
 * Writes are bursty (eight machines on a ten-second tick), so refetches
 * are coalesced, with a slow poll underneath as a safety net for a
 * dropped socket.
 */
export function usePrinterOverview(initial: PrinterOverviewRow[]) {
  const [rows, setRows] = useState<PrinterOverviewRow[]>(initial);
  const [live, setLive] = useState<LiveState>("connecting");
  const [updatedAt, setUpdatedAt] = useState<number>(() => Date.now());
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("printer_overview")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setRows(data as PrinterOverviewRow[]);
      setUpdatedAt(Date.now());
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const coalesce = () => {
      if (pending.current) return;
      pending.current = setTimeout(() => {
        pending.current = null;
        if (!cancelled) void refetch();
      }, 700);
    };

    const channel = supabase
      .channel("floor-overview")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "printers" },
        coalesce,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "print_jobs" },
        coalesce,
      )
      .subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") setLive("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setLive("offline");
      });

    const safetyNet = setInterval(() => void refetch(), 30_000);

    return () => {
      cancelled = true;
      clearInterval(safetyNet);
      if (pending.current) clearTimeout(pending.current);
      void supabase.removeChannel(channel);
    };
  }, [refetch]);

  return { rows, live, updatedAt, refetch };
}
