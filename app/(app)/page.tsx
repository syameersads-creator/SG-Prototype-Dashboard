import { createClient } from "@/lib/supabase/server";
import { FloorView } from "./floor-view";
import type { PrinterOverviewRow } from "@/lib/supabase/types";

// Live machine state; never serve this from a cache.
export const dynamic = "force-dynamic";

export const metadata = { title: "Floor · Printer Floor" };

export default async function DashboardPage() {
  const supabase = await createClient();

  const dueCutoff = new Date();
  dueCutoff.setDate(dueCutoff.getDate() + 2);

  const [{ data: rows }, { count: lotsDue }, { data: profile }] =
    await Promise.all([
      supabase
        .from("printer_overview")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        .from("lots")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "in_progress"])
        .lte("due_date", dueCutoff.toISOString().slice(0, 10)),
      supabase
        .from("profiles")
        .select("role")
        .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
        .maybeSingle(),
    ]);

  return (
    <FloorView
      initialRows={(rows ?? []) as PrinterOverviewRow[]}
      lotsDue={lotsDue ?? 0}
      isAdmin={profile?.role === "admin"}
    />
  );
}
