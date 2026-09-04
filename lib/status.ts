import type { JobStatus, LotStatus, PrinterStatus } from "@/lib/supabase/types";

export interface StatusStyle {
  label: string;
  /** Tailwind classes for a filled pill. */
  pill: string;
  /** Tailwind class for a solid dot / bar in the status colour. */
  dot: string;
  /** Raw CSS colour, for SVG and inline chart use. */
  color: string;
}

export const PRINTER_STATUS: Record<PrinterStatus, StatusStyle> = {
  printing: {
    label: "Printing",
    pill: "bg-st-printing/15 text-st-printing ring-1 ring-st-printing/30",
    dot: "bg-st-printing",
    color: "var(--color-st-printing)",
  },
  idle: {
    label: "Idle",
    pill: "bg-st-idle/15 text-st-idle ring-1 ring-st-idle/30",
    dot: "bg-st-idle",
    color: "var(--color-st-idle)",
  },
  paused: {
    label: "Paused",
    pill: "bg-st-paused/15 text-st-paused ring-1 ring-st-paused/30",
    dot: "bg-st-paused",
    color: "var(--color-st-paused)",
  },
  error: {
    label: "Error",
    pill: "bg-st-error/15 text-st-error ring-1 ring-st-error/40",
    dot: "bg-st-error",
    color: "var(--color-st-error)",
  },
  offline: {
    label: "Offline",
    pill: "bg-st-offline/20 text-st-offline ring-1 ring-st-offline/40",
    dot: "bg-st-offline",
    color: "var(--color-st-offline)",
  },
  maintenance: {
    label: "Maintenance",
    pill: "bg-st-maintenance/15 text-st-maintenance ring-1 ring-st-maintenance/30",
    dot: "bg-st-maintenance",
    color: "var(--color-st-maintenance)",
  },
};

export const JOB_STATUS: Record<JobStatus, StatusStyle> = {
  queued: PRINTER_STATUS.idle,
  printing: PRINTER_STATUS.printing,
  paused: PRINTER_STATUS.paused,
  completed: {
    label: "Completed",
    pill: "bg-st-completed/15 text-st-completed ring-1 ring-st-completed/30",
    dot: "bg-st-completed",
    color: "var(--color-st-completed)",
  },
  failed: { ...PRINTER_STATUS.error, label: "Failed" },
  cancelled: { ...PRINTER_STATUS.offline, label: "Cancelled" },
};

export const LOT_STATUS: Record<LotStatus, StatusStyle> = {
  pending: { ...PRINTER_STATUS.idle, label: "Pending" },
  in_progress: { ...PRINTER_STATUS.printing, label: "In progress" },
  completed: { ...JOB_STATUS.completed, label: "Completed" },
  cancelled: { ...PRINTER_STATUS.offline, label: "Cancelled" },
};

/** A machine is "working" when it is actually consuming a lot. */
export function isActive(status: PrinterStatus): boolean {
  return status === "printing" || status === "paused";
}

/** Needs a human to walk over to it. */
export function needsAttention(status: PrinterStatus): boolean {
  return status === "error" || status === "offline";
}
