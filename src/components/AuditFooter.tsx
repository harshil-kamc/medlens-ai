import type { Provenance } from "../types";
import { PROVENANCE_META_DARK, PROVENANCE_META_LIGHT } from "./Badges";
import { BarChart3 } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface Props {
  counts: Record<Provenance, number>;
}

export function AuditFooter({ counts }: Props) {
  const { mode } = useTheme();
  const dark = mode === "dark";
  const total = counts.USER_PROVIDED + counts.AI_EXTRACTED + counts.SYSTEM_DERIVED + counts.HUMAN_VERIFIED;
  const keys: Provenance[] = ["USER_PROVIDED", "AI_EXTRACTED", "SYSTEM_DERIVED", "HUMAN_VERIFIED"];

  const meta = (k: Provenance) => (dark ? PROVENANCE_META_DARK[k] : PROVENANCE_META_LIGHT[k]);

  return (
    <div className={`rounded-xl border p-4 ${dark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-brand-500" />
        <h3 className={`text-sm font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>Provenance Audit Counter</h3>
        <span className="ml-auto text-xs text-slate-500">{total} fields tracked</span>
      </div>

      <div className={`flex h-2.5 w-full overflow-hidden rounded-full mb-3 ${dark ? "bg-slate-800" : "bg-slate-200"}`}>
        {keys.map((key) => {
          const m = meta(key);
          const pct = total > 0 ? (counts[key] / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className={`${m.dot} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${m.label}: ${counts[key]}`}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {keys.map((key) => {
          const m = meta(key);
          return (
            <div key={key} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${m.dot}`} />
              <span className="text-[10px] text-slate-500">{m.label}</span>
              <span className={`ml-auto text-sm font-semibold tabular-nums ${dark ? "text-slate-200" : "text-slate-800"}`}>{counts[key]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
