"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartShell, LegendKey } from "./chart-shell";
import type { PrinterTelemetryRow } from "@/lib/supabase/types";

const AXIS = "var(--color-ink-faint)";
const GRID = "var(--color-line-soft)";
const SERIES_1 = "var(--color-series-1)";
const SERIES_2 = "var(--color-series-2)";

interface Point {
  t: number;
  progress: number | null;
  nozzle: number | null;
  bed: number | null;
}

function toPoints(rows: PrinterTelemetryRow[]): Point[] {
  return rows
    .map((r) => ({
      t: new Date(r.recorded_at).getTime(),
      progress: r.progress_pct,
      nozzle: r.nozzle_temp,
      bed: r.bed_temp,
    }))
    .sort((a, b) => a.t - b.t);
}

const timeLabel = (t: number) =>
  new Date(t).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

function TooltipBox({
  active,
  label,
  rows,
}: {
  active?: boolean;
  label?: number;
  rows: { name: string; value: string; color: string }[];
}) {
  if (!active || !rows.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-2 shadow-xl shadow-black/40">
      <p className="tnum mb-1 text-[10px] text-ink-faint">
        {label ? timeLabel(label) : ""}
      </p>
      {rows.map((r) => (
        <p key={r.name} className="flex items-center gap-1.5 text-[11px]">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: r.color }}
            aria-hidden
          />
          <span className="text-ink-dim">{r.name}</span>
          <span className="tnum ml-auto pl-3 font-medium text-ink">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

export function TelemetryCharts({ rows }: { rows: PrinterTelemetryRow[] }) {
  const data = toPoints(rows);
  const hasProgress = data.some((d) => d.progress !== null);
  const hasTemps = data.some((d) => d.nozzle !== null || d.bed !== null);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Single series: the title names it, so no legend box. */}
      <ChartShell
        title="Print progress"
        subtitle="Percent complete over the last few hours"
        empty={!hasProgress}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_1} stopOpacity={0.35} />
                <stop offset="100%" stopColor={SERIES_1} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={timeLabel}
              stroke={AXIS}
              tick={{ fontSize: 10, fill: AXIS }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              tickFormatter={(v) => `${v}%`}
              stroke={AXIS}
              tick={{ fontSize: 10, fill: AXIS }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              cursor={{ stroke: AXIS, strokeDasharray: "3 3" }}
              content={({ active, label, payload }) => (
                <TooltipBox
                  active={active}
                  label={label as number}
                  rows={(payload ?? [])
                    .filter((p) => p.value !== null && p.value !== undefined)
                    .map((p) => ({
                      name: "Progress",
                      value: `${Number(p.value).toFixed(1)}%`,
                      color: SERIES_1,
                    }))}
                />
              )}
            />
            <Area
              type="monotone"
              dataKey="progress"
              stroke={SERIES_1}
              strokeWidth={2}
              fill="url(#progressFill)"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartShell>

      {/* Two series share one axis — never a second y-scale. */}
      <ChartShell
        title="Temperatures"
        subtitle="Nozzle and bed, degrees Celsius"
        empty={!hasTemps}
        legend={
          <LegendKey
            items={[
              { label: "Nozzle", color: SERIES_1 },
              { label: "Bed", color: SERIES_2 },
            ]}
          />
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={timeLabel}
              stroke={AXIS}
              tick={{ fontSize: 10, fill: AXIS }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={[0, 250]}
              ticks={[0, 100, 200]}
              tickFormatter={(v) => `${v}°`}
              stroke={AXIS}
              tick={{ fontSize: 10, fill: AXIS }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              cursor={{ stroke: AXIS, strokeDasharray: "3 3" }}
              content={({ active, label, payload }) => (
                <TooltipBox
                  active={active}
                  label={label as number}
                  rows={(payload ?? [])
                    .filter((p) => p.value !== null && p.value !== undefined)
                    .map((p) => ({
                      name: p.dataKey === "nozzle" ? "Nozzle" : "Bed",
                      value: `${Math.round(Number(p.value))}°C`,
                      color: p.dataKey === "nozzle" ? SERIES_1 : SERIES_2,
                    }))}
                />
              )}
            />
            <Line
              type="monotone"
              dataKey="nozzle"
              stroke={SERIES_1}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="bed"
              stroke={SERIES_2}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>
    </div>
  );
}
