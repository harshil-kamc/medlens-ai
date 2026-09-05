import type { Provenance } from "../types";

export type ProvenanceMeta = { label: string; color: string; bg: string; border: string; dot: string };

export const PROVENANCE_META_DARK: Record<Provenance, ProvenanceMeta> = {
  USER_PROVIDED: { label: "USER_PROVIDED", color: "text-sky-300", bg: "bg-sky-500/10", border: "border-sky-500/30", dot: "bg-sky-400" },
  AI_EXTRACTED: { label: "AI_EXTRACTED", color: "text-purple-300", bg: "bg-purple-500/10", border: "border-purple-500/30", dot: "bg-purple-400" },
  SYSTEM_DERIVED: { label: "SYSTEM_DERIVED", color: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/30", dot: "bg-amber-400" },
  HUMAN_VERIFIED: { label: "HUMAN_VERIFIED", color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400" },
};

export const PROVENANCE_META_LIGHT: Record<Provenance, ProvenanceMeta> = {
  USER_PROVIDED: { label: "USER_PROVIDED", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", dot: "bg-sky-500" },
  AI_EXTRACTED: { label: "AI_EXTRACTED", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500" },
  SYSTEM_DERIVED: { label: "SYSTEM_DERIVED", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  HUMAN_VERIFIED: { label: "HUMAN_VERIFIED", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
};