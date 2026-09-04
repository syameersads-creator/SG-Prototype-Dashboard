/** Formatting helpers shared by the cards, tables and charts. */

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(value >= 99.95 ? 0 : 1)}%`;
}

/** "2h 14m", "47m", "38s" — compact enough for a card. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;

  const minutes = Math.floor(s / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours < 24) return rem ? `${hours}h ${rem}m` : `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

/** Time remaining until an ETA, or null when there isn't one. */
export function remainingSeconds(
  estimatedEndAt: string | null | undefined,
  now: number = Date.now(),
): number | null {
  if (!estimatedEndAt) return null;
  const end = new Date(estimatedEndAt).getTime();
  if (Number.isNaN(end)) return null;
  return (end - now) / 1000;
}

export function formatEta(
  estimatedEndAt: string | null | undefined,
  now: number = Date.now(),
): string {
  const secs = remainingSeconds(estimatedEndAt, now);
  if (secs === null) return "—";
  if (secs <= 0) return "finishing";
  return formatDuration(secs);
}

export function formatClock(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Dates come back from Postgres as plain YYYY-MM-DD; keep them naive. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Whole days from today to a due date. Negative means overdue. */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const due = new Date(y, m - 1, d).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today.getTime()) / 86_400_000);
}

export function formatTemp(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value)}°`;
}

export function formatGrams(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value)} g`;
}

export function formatRelative(
  iso: string | null | undefined,
  now: number = Date.now(),
): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const secs = (now - then) / 1000;
  if (secs < 10) return "just now";
  return `${formatDuration(secs)} ago`;
}
