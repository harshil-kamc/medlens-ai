import type { Conflict } from "../types";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface Props {
  conflicts: Conflict[];
}

export function ConflictPanel({ conflicts }: Props) {
  const { mode } = useTheme();
  const dark = mode === "dark";

  if (conflicts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ShieldAlert className="h-7 w-7 text-emerald-500/60 mb-2" />
        <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>No conflicts detected</p>
        <p className="text-xs text-slate-500 mt-1">Intake statements and lab findings appear consistent</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conflicts.map((conflict) => (
        <div
          key={conflict.id}
          className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 animate-[fadeIn_0.3s_ease]"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-rose-500/15 p-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-rose-200">{conflict.title}</h4>
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    conflict.severity === "critical"
                      ? "bg-rose-600/30 text-rose-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {conflict.severity}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{conflict.detail}</p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className={`rounded-lg p-2 ${dark ? "bg-slate-900/50" : "bg-slate-100"}`}>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Intake Statement</p>
                  <p className="text-xs text-slate-300">"{conflict.intakeStatement || "(empty)"}"</p>
                </div>
                <div className={`rounded-lg p-2 ${dark ? "bg-slate-900/50" : "bg-slate-100"}`}>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Lab Evidence</p>
                  <p className="text-xs text-slate-300">{conflict.labEvidence}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
