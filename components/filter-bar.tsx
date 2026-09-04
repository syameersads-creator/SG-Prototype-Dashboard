"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Filters live in the URL, not component state: a filtered view is then
 * shareable, survives a refresh, and is rendered on the server.
 */
export function FilterBar({
  searchKey = "q",
  searchPlaceholder = "Search…",
  selects = [],
}: {
  searchKey?: string;
  searchPlaceholder?: string;
  selects?: { key: string; label: string; options: FilterOption[] }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [term, setTerm] = useState(params.get(searchKey) ?? "");

  function apply(next: URLSearchParams) {
    const query = next.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }

  // Debounced so a typed query doesn't fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (term) next.set(searchKey, term);
      else next.delete(searchKey);
      if (next.toString() !== params.toString()) apply(next);
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  function setSelect(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    apply(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-ink-faint/70 focus:border-brand/50"
        />
      </div>

      {selects.map((s) => (
        <select
          key={s.key}
          aria-label={s.label}
          value={params.get(s.key) ?? ""}
          onChange={(e) => setSelect(s.key, e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-dim outline-none transition focus:border-brand/50"
        >
          <option value="">{s.label}</option>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
