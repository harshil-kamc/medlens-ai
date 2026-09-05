import type { DeltaRow } from "../types";
import { StatusBadge } from "./Badges";
import { TrendIcon } from "./MedicalRecord";
import { TrendingUp } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface Props {
  rows: DeltaRow[];
}

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

  return (
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
  );
}
