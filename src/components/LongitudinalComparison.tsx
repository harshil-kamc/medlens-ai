import type { DeltaRow, RangeStatus } from "../types";
import { StatusBadge } from "./Badges";
import { TrendIcon } from "./MedicalRecord";
import { TrendingUp, LineChart } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface Props {
  rows: DeltaRow[];
}

const STATUS_COLOR: Record<RangeStatus, string> = {
  HIGH: "#f43f5e",
  DANGER: "#e11d48",
  LOW: "#f59e0b",
  NORMAL: "#10b981",
  UNKNOWN: "#64748b",
};

export function LongitudinalComparison({ rows }: Props) {
  const { mode } = useTheme();
  const dark = mode === "dark";

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <TrendingUp className="h-7 w-7 text-slate-600 mb-2" />
        <p className="text-sm text-slate-500">No previous report available</p>
        <p className="text-xs text-slate-600 mt-1">Upload a previous report to see trend comparisons</p>
      </div>
    );
  }

  const validRows = rows.filter((r) => r.currentValue !== null && r.previousValue !== null);
  const allValues = validRows.flatMap((r) => [r.previousValue!, r.currentValue!]);
  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 1;
  const range = maxVal - minVal || 1;
  const pad = range * 0.15;
  const chartMin = minVal - pad;
  const chartMax = maxVal + pad;
  const chartRange = chartMax - chartMin;

  const chartW = 720;
  const chartH = 280;
  const padL = 70;
  const padR = 30;
  const padT = 20;
  const padB = 60;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const labelAreaW = 50;

  const rowSpacing = validRows.length > 1 ? plotW / (validRows.length - 1) : 0;

  function yFor(val: number): number {
    return padT + plotH - ((val - chartMin) / chartRange) * plotH;
  }

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const v = chartMin + (chartRange * i) / (tickCount - 1);
    return { value: v, y: yFor(v) };
  });

  const pointX = (index: number) => padL + (validRows.length > 1 ? index * rowSpacing : plotW / 2);
  const previousPath = validRows
    .map((r, i) => `${i === 0 ? "M" : "L"} ${pointX(i)} ${yFor(r.previousValue!)}`)
    .join(" ");
  const currentPath = validRows
    .map((r, i) => `${i === 0 ? "M" : "L"} ${pointX(i)} ${yFor(r.currentValue!)}`)
    .join(" ");

  return (
    <div className="space-y-5">
      {/* Line chart */}
      <div className={`rounded-xl border p-4 ${dark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"}`}>
        <div className="flex items-center gap-2 mb-3">
          <LineChart className="h-4 w-4 text-cyan-400" />
          <h3 className={`text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>Trend Visualization</h3>
        </div>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${chartW + labelAreaW} ${chartH}`} className="w-full min-w-[600px]" style={{ height: chartH }}>
            {/* Y-axis grid lines + labels */}
            {ticks.map((t, i) => (
              <g key={i}>
                <line
                  x1={padL}
                  y1={t.y}
                  x2={chartW - padR}
                  y2={t.y}
                  stroke={dark ? "#1e293b" : "#e2e8f0"}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <text
                  x={padL - 8}
                  y={t.y + 4}
                  textAnchor="end"
                  fill={dark ? "#64748b" : "#94a3b8"}
                  fontSize={10}
                  fontFamily="monospace"
                >
                  {t.value >= 100 ? t.value.toFixed(0) : t.value.toFixed(1)}
                </text>
              </g>
            ))}

            {/* Trend lines and per-test deltas */}
            <path d={previousPath} fill="none" stroke={dark ? "#64748b" : "#94a3b8"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <path d={currentPath} fill="none" stroke={dark ? "#22d3ee" : "#0891b2"} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {validRows.map((r, i) => {
              const x = pointX(i);
              return <line key={`delta-${r.name}`} x1={x} y1={yFor(r.previousValue!)} x2={x} y2={yFor(r.currentValue!)} stroke={dark ? "#334155" : "#cbd5e1"} strokeWidth={1.5} strokeDasharray="4 3" />;
            })}

            {/* Data points */}
            {validRows.map((r, i) => {
              const x = pointX(i);
              const yPrev = yFor(r.previousValue!);
              const yCurr = yFor(r.currentValue!);
              const statusColor = STATUS_COLOR[r.status] || STATUS_COLOR.UNKNOWN;
              return (
                <g key={r.name}>
                  {/* Previous value point */}
                  <circle cx={x} cy={yPrev} r={5} fill={dark ? "#475569" : "#94a3b8"} stroke={dark ? "#1e293b" : "#fff"} strokeWidth={2} />
                  {/* Current value point */}
                  <circle cx={x} cy={yCurr} r={6} fill={statusColor} stroke={dark ? "#0f172a" : "#fff"} strokeWidth={2}>
                    <animate attributeName="r" values="6;7.5;6" dur="2s" repeatCount="indefinite" begin={`${i * 0.15}s`} />
                  </circle>
                  {/* Value labels */}
                  <text x={x} y={yPrev - 10} textAnchor="middle" fill={dark ? "#94a3b8" : "#64748b"} fontSize={10} fontFamily="monospace">
                    {r.previousValue}
                  </text>
                  <text x={x} y={yCurr - 12} textAnchor="middle" fill={statusColor} fontSize={11} fontFamily="monospace" fontWeight="bold">
                    {r.currentValue}
                  </text>
                  {/* X-axis label */}
                  <text
                    x={x}
                    y={chartH - padB + 18}
                    textAnchor="middle"
                    fill={dark ? "#94a3b8" : "#64748b"}
                    fontSize={9}
                  >
                    {r.name.length > 14 ? r.name.slice(0, 12) + "…" : r.name}
                  </text>
                  {r.unit && (
                    <text x={x} y={chartH - padB + 32} textAnchor="middle" fill={dark ? "#475569" : "#94a3b8"} fontSize={8}>
                      {r.unit}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Legend */}
            <g transform={`translate(${padL}, ${chartH - 18})`}>
              <circle cx={6} cy={0} r={4} fill={dark ? "#475569" : "#94a3b8"} />
              <text x={16} y={4} fill={dark ? "#64748b" : "#94a3b8"} fontSize={10}>Previous</text>
              <circle cx={90} cy={0} r={5} fill="#10b981" />
              <text x={100} y={4} fill={dark ? "#64748b" : "#94a3b8"} fontSize={10}>Current (color = status)</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Delta table */}
      <div className={`overflow-x-auto rounded-xl border ${dark ? "border-slate-800" : "border-slate-200"}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b text-left ${dark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-slate-50"}`}>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Test</th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Previous</th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current</th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Delta</th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Trend</th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.name}
                className={`border-b transition-colors ${dark ? "border-slate-800/50 hover:bg-slate-800/30" : "border-slate-100 hover:bg-slate-50"}`}
              >
                <td className={`px-3 py-2.5 font-medium ${dark ? "text-slate-200" : "text-slate-800"}`}>{row.name}</td>
                <td className="px-3 py-2.5">
                  <span className={`tabular-nums ${dark ? "text-slate-300" : "text-slate-700"}`}>{row.previousValue ?? "—"}</span>
                  {row.previousValue !== null && row.unit && <span className="text-[10px] text-slate-500 ml-1">{row.unit}</span>}
                  {row.previousDate && <div className="text-[10px] text-slate-500">{row.previousDate}</div>}
                </td>
                <td className="px-3 py-2.5">
                  <span className={`font-semibold tabular-nums ${dark ? "text-slate-100" : "text-slate-900"}`}>{row.currentValue ?? "—"}</span>
                  {row.currentValue !== null && row.unit && <span className="text-[10px] text-slate-500 ml-1">{row.unit}</span>}
                  {row.currentDate && <div className="text-[10px] text-slate-500">{row.currentDate}</div>}
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {row.delta !== null ? (
                    <span className={row.delta > 0 ? "text-orange-300" : row.delta < 0 ? "text-blue-300" : "text-slate-400"}>
                      {row.delta > 0 ? "+" : ""}{row.delta}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={row.trend} />
                    <span className="text-[10px] text-slate-500 uppercase">{row.trend !== "NONE" ? row.trend : ""}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
