"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/supabase/types";

interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: React.ReactNode;
  /** Roles allowed to see it; omitted means everyone. */
  roles?: UserRole[];
}

const icon = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden
  >
    <path d={d} />
  </svg>
);

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Floor",
    short: "Floor",
    icon: icon("M3 5h7v7H3zM14 5h7v4h-7zM14 13h7v6h-7zM3 16h7v3H3z"),
  },
  {
    href: "/lots",
    label: "Production lots",
    short: "Lots",
    icon: icon("M4 7h16M4 12h16M4 17h10"),
  },
  {
    href: "/lots/import",
    label: "Import lots",
    short: "Import",
    icon: icon("M12 16V4m0 0L8 8m4-4 4 4M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"),
    roles: ["admin", "operator"],
  },
  {
    href: "/jobs",
    label: "Job history",
    short: "History",
    icon: icon("M12 7v5l3 2M3 12a9 9 0 1 0 9-9 9 9 0 0 0-7.5 4M3 4v4h4"),
  },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => {
    // A printer detail page is still "the floor".
    if (href === "/") return pathname === "/" || pathname.startsWith("/printers");
    // /lots must not light up while we're on /lots/import.
    if (href === "/lots") return pathname === "/lots";
    return pathname === href || pathname.startsWith(`${href}/`);
  };
}

function visible(role: UserRole) {
  return NAV.filter((item) => !item.roles || item.roles.includes(role));
}

export function Sidebar({
  role,
  email,
  fullName,
}: {
  role: UserRole;
  email: string;
  fullName: string;
}) {
  const isActive = useIsActive();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface md:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/15 ring-1 ring-brand/30">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-brand"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M4 7 12 3l8 4v10l-8 4-8-4z" />
            <path d="M4 7l8 4 8-4M12 11v10" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">Printer Floor</p>
          <p className="truncate text-[11px] text-ink-faint">Production monitor</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {visible(role).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-brand/12 text-ink ring-1 ring-brand/25"
                  : "text-ink-dim hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <span className={active ? "text-brand" : "text-ink-faint"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <UserFooter role={role} email={email} fullName={fullName} />
    </aside>
  );
}

export function BottomNav({ role }: { role: UserRole }) {
  const isActive = useIsActive();
  const items = visible(role);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-surface/95 backdrop-blur md:hidden"
      style={{
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition ${
              active ? "text-brand" : "text-ink-faint"
            }`}
          >
            {item.icon}
            {item.short}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter({
  role,
  email,
  fullName,
}: {
  role: UserRole;
  email: string;
  fullName: string;
}) {
  return (
    <div className="border-t border-line-soft p-3">
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-ink-dim">
          {(fullName || email).slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{fullName || email}</p>
          <p className="truncate text-[11px] capitalize text-ink-faint">{role}</p>
        </div>
      </div>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs text-ink-faint transition hover:bg-surface-2 hover:text-ink"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
