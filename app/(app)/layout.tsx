import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav, Sidebar } from "@/components/nav";
import type { UserRole } from "@/lib/supabase/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The middleware already gates this, but a server component must never
  // assume that and render signed-out data.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role ?? "viewer") as UserRole;

  return (
    <div className="min-h-dvh">
      <Sidebar
        role={role}
        email={profile?.email ?? user.email ?? ""}
        fullName={profile?.full_name ?? ""}
      />
      <div className="md:pl-60">
        <main className="mx-auto max-w-[1600px] px-4 pb-24 pt-4 sm:px-6 md:pb-10 md:pt-6">
          {children}
        </main>
      </div>
      <BottomNav role={role} />
    </div>
  );
}
