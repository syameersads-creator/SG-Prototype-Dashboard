import type { StatusStyle } from "@/lib/status";

export function StatusPill({
  style,
  size = "md",
}: {
  style: StatusStyle;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium ${style.pill} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      {/* The dot is decoration; the label carries the meaning, so status
          is never communicated by colour alone. */}
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {style.label}
    </span>
  );
}
