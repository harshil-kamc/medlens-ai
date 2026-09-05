import type { LabTest } from "../types";
import { StatusBadge, ProvenanceBadge, ConfidenceBadge } from "./Badges";
import { Activity, ArrowUp, ArrowDown, Minus, Columns2, Check, Lightbulb } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface Props {
  tests: LabTest[];
  onEdit?: (id: string, value: string) => void;
  onVerify?: (id: string) => void;
  onOpenReview?: () => void;
  canReview?: boolean;
}

export function MedicalRecord({ tests, onEdit, onVerify, onOpenReview, canReview }: Props) {
  const { mode } = useTheme();
  const dark = mode === "dark";

  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-8 w-8 text-slate-600 mb-2" />
        <p className="text-sm text-slate-500">No lab data extracted yet</p>
        <p className="text-xs text-slate-600 mt-1">Upload or paste a lab report to begin analysis</p>
      </div>
    );
  }

  return (
    <div>
      {canReview && onOpenReview && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={onOpenReview}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-300 hover:bg-brand-500/20 transition"
          >
            <Columns2 className="h-3.5 w-3.5" />
            Open Side-by-Side Source Inspection
          </button>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {tests.map((test) => (
          <div
            key={test.id}
            className={`group rounded-xl border p-4 transition-all duration-200 ${
              dark
                ? "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className={`text-sm font-semibold truncate ${dark ? "text-slate-200" : "text-slate-800"}`}>{test.name}</h4>
                {test.rawName && test.rawName !== test.name && (
                  <p className="text-[10px] text-slate-500 italic">from "{test.rawName}"</p>
                )}
              </div>
              <StatusBadge status={test.status} />
            </div>

            <div className="mt-3 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-900"}`}>
                {test.value !== null ? test.value : "—"}
              </span>
              {test.unit && <span className="text-xs text-slate-500">{test.unit}</span>}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500">
                {test.refRange.raw ? (
                  <span>Ref: <span className="font-mono text-slate-400">{test.refRange.raw}</span>{test.rangeSource === "standard" && <span className="ml-1 text-[9px] text-amber-500/80">(standard)</span>}</span>
                ) : (
                  <span className="text-slate-500" title="No reference range was printed on the source document">No printed bounds</span>
                )}
              </div>
              <span className="text-[10px] text-slate-500">{test.reportDate || "No date"}</span>
            </div>

            {test.insight && (
              <div className={`mt-3 rounded-lg border p-2.5 ${
                dark
                  ? "border-slate-700/60 bg-slate-800/40"
                  : "border-slate-200 bg-slate-50"
              }`}>
                <div className="flex items-start gap-1.5">
                  <Lightbulb className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${
                    test.status === "DANGER" ? "text-rose-400" :
                    test.status === "HIGH" ? "text-rose-400" :
                    test.status === "LOW" ? "text-amber-400" :
                    "text-emerald-400"
                  }`} />
                  <p className={`text-[11px] leading-relaxed ${dark ? "text-slate-300" : "text-slate-600"}`}>
                    {test.insight}
                  </p>
                </div>
              </div>
            )}

            {test.sourceMeta && (
              <p className="mt-2 text-[10px] text-slate-500 italic">{test.sourceMeta}</p>
            )}

            {(test.status === "HIGH" || test.status === "LOW" || test.status === "DANGER") && (
              <details className={`mt-3 rounded-lg border px-2.5 py-2 ${dark ? "border-slate-700/60 bg-slate-800/30" : "border-slate-200 bg-slate-50"}`}>
                <summary className={`cursor-pointer text-[10px] font-semibold ${dark ? "text-cyan-300" : "text-cyan-700"}`}>Why this result is flagged</summary>
                <div className={`mt-2 space-y-1 text-[10px] leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>
                  <p><strong>Observed:</strong> {test.value ?? "Not available"}{test.unit ? ` ${test.unit}` : ""}</p>
                  <p><strong>Compared with:</strong> {test.refRange.raw || "No reference range printed on the source"}</p>
                  <p><strong>Source:</strong> {test.provenance.replace(/_/g, " ").toLowerCase()}</p>
                  {test.sourceMeta && <p><strong>Evidence note:</strong> {test.sourceMeta}</p>}
                </div>
              </details>
            )}

            <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <ProvenanceBadge provenance={test.provenance} />
                {test.confidence && <ConfidenceBadge confidence={test.confidence} />}
              </div>
              {onVerify && test.provenance !== "HUMAN_VERIFIED" && (
                <button
                  onClick={() => onVerify(test.id)}
                  className={`inline-flex items-center gap-1 text-[10px] font-medium transition opacity-0 group-hover:opacity-100 ${
                    dark ? "text-emerald-400/70 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-700"
                  }`}
                >
                  <Check className="h-3 w-3" /> Mark verified
                </button>
              )}
            </div>

            {onEdit && (
              <div className={`mt-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition`}>
                <input
                  type="text"
                  defaultValue={test.value !== null ? String(test.value) : ""}
                  onBlur={(e) => onEdit(test.id, e.target.value)}
                  className={`w-20 rounded border px-2 py-0.5 text-xs focus:outline-none ${
                    dark ? "bg-slate-800/60 border-slate-700 text-slate-300 focus:border-slate-500"
                    : "bg-slate-50 border-slate-300 text-slate-700 focus:border-slate-400"
                  }`}
                  placeholder="value"
                />
                <span className="text-[10px] text-slate-500">Click to edit value</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendIcon({ trend }: { trend: "UP" | "DOWN" | "STABLE" | "NONE" }) {
  if (trend === "UP") return <ArrowUp className="h-3.5 w-3.5 text-orange-400" />;
  if (trend === "DOWN") return <ArrowDown className="h-3.5 w-3.5 text-blue-400" />;
  if (trend === "STABLE") return <Minus className="h-3.5 w-3.5 text-slate-400" />;
  return null;
}
