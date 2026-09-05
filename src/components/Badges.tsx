import type { Provenance, RangeStatus } from "../types";
import { useTheme } from "./ThemeProvider";

export const PROVENANCE_META_DARK: Record<Provenance, { label: string; color: string; bg: string; border: string; dot: string }> = {
  USER_PROVIDED: { label: "USER_PROVIDED", color: "text-sky-300", bg: "bg-sky-500/10", border: "border-sky-500/30", dot: "bg-sky-400" },
  AI_EXTRACTED: { label: "AI_EXTRACTED", color: "text-purple-300", bg: "bg-purple-500/10", border: "border-purple-500/30", dot: "bg-purple-400" },
  SYSTEM_DERIVED: { label: "SYSTEM_DERIVED", color: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/30", dot: "bg-amber-400" },
  HUMAN_VERIFIED: { label: "HUMAN_VERIFIED", color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400" },
};

export const PROVENANCE_META_LIGHT: Record<Provenance, { label: string; color: string; bg: string; border: string; dot: string }> = {
  USER_PROVIDED: { label: "USER_PROVIDED", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", dot: "bg-sky-500" },
  AI_EXTRACTED: { label: "AI_EXTRACTED", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500" },
  SYSTEM_DERIVED: { label: "SYSTEM_DERIVED", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  HUMAN_VERIFIED: { label: "HUMAN_VERIFIED", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
};

function getProvenanceMeta(provenance: Provenance, dark: boolean) {
  return dark ? PROVENANCE_META_DARK[provenance] : PROVENANCE_META_LIGHT[provenance];
}

export function ProvenanceBadge({ provenance }: { provenance: Provenance }) {
  const { mode } = useTheme();
  const meta = getProvenanceMeta(provenance, mode === "dark");
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.bg} ${meta.color} ${meta.border} border`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: RangeStatus }) {
  const { mode } = useTheme();
  const dark = mode === "dark";

  if (status === "HIGH" || status === "LOW") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border"
        style={{
          color: "#f43f5e",
          borderColor: dark ? "rgba(244,63,94,0.4)" : "rgba(244,63,94,0.3)",
          background: dark ? "rgba(244,63,94,0.12)" : "rgba(244,63,94,0.08)",
          animation: "pulseGlow 2s ease-in-out infinite",
        }}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
        {status}
      </span>
    );
  }

  if (status === "NORMAL") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border"
        style={{
          color: "#10b981",
          borderColor: dark ? "rgba(16,185,129,0.4)" : "rgba(16,185,129,0.3)",
          background: dark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
          animation: "pulseGlowGreen 3s ease-in-out infinite",
        }}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {status}
      </span>
    );
  }

  // UNKNOWN
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border cursor-help ${dark ? "text-slate-400 bg-slate-500/10 border-slate-500/30" : "text-slate-500 bg-slate-100 border-slate-300"}`}
      title="No reference range was printed on the source document"
    >
      {status}
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (confidence === undefined || confidence === null) return null;
  const pct = confidence.toFixed(1);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2 py-0.5 text-[9px] font-semibold text-purple-300 border border-purple-500/25">
      <span className="h-1 w-1 rounded-full bg-purple-400" />
      {pct}% Confidence
    </span>
  );
}
