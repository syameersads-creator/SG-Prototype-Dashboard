import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JOB_SELECT, toJobTableRows, type JobWithRelations } from "@/lib/jobs";
import { PrinterDetail } from "./printer-detail";
import type {
  PrinterOverviewRow,
  PrinterTelemetryRow,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function PrinterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const since = new Date(Date.now() - 6 * 3600_000).toISOString();

  const [{ data: overview }, { data: telemetry }, { data: jobs }, { data: profile }] =
    await Promise.all([
      supabase
        .from("printer_overview")
        .select("*")
        .eq("printer_id", id)
        .maybeSingle(),
      supabase
        .from("printer_telemetry")
        .select("*")
        .eq("printer_id", id)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true })
        .limit(600),
      supabase
        .from("print_jobs")
        .select(JOB_SELECT)
        .eq("printer_id", id)
        .order("started_at", { ascending: false })
        .limit(25),
      supabase
        .from("profiles")
        .select("role")
        .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
        .maybeSingle(),
    ]);

  if (!overview) notFound();

  return (
    <PrinterDetail
      initialOverview={overview as PrinterOverviewRow}
      initialTelemetry={(telemetry ?? []) as PrinterTelemetryRow[]}
      jobs={toJobTableRows(jobs as unknown as JobWithRelations[])}
      isAdmin={profile?.role === "admin"}
    />
  );
}
