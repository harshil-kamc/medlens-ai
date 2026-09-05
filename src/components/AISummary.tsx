import { useState, useEffect, useCallback } from "react";
import { Sparkles, HelpCircle, Loader2, RefreshCw, Zap } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { isGeminiConfigured, generatePatientSummary } from "../services/gemini";
import type { IntakeData, LabTest } from "../types";

interface SummaryProps {
  summary: string;
  intake: IntakeData;
  tests: LabTest[];
  onAiQuestions?: (questions: string[] | null) => void;
}

export function AISummary({ summary, intake, tests, onAiQuestions }: SummaryProps) {
  const { mode } = useTheme();
  const dark = mode === "dark";
  const geminiReady = isGeminiConfigured();

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiQuestions, setAiQuestions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAiSummary = useCallback(async () => {
    if (!geminiReady || tests.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generatePatientSummary(intake, tests);
      setAiSummary(result.summary);
      setAiQuestions(result.questions);
      onAiQuestions?.(result.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI summary");
    } finally {
      setLoading(false);
    }
  }, [geminiReady, intake, tests, onAiQuestions]);

  // Auto-fetch when Gemini is configured and tests change
  useEffect(() => {
    if (geminiReady && tests.length > 0 && aiSummary === null) {
      fetchAiSummary();
    }
  }, [geminiReady, tests, aiSummary, fetchAiSummary]);

  const displaySummary = aiSummary || summary;

  if (!displaySummary) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Sparkles className="h-7 w-7 text-slate-600 mb-2" />
        <p className="text-sm text-slate-500">AI summary will appear here after lab data is processed</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 ${dark ? "border-cyan-500/20 bg-cyan-500/5" : "border-cyan-200 bg-cyan-50"}`}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-cyan-400" />
        <h3 className={`text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>Patient-Friendly Summary</h3>
        <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-300 border border-cyan-500/30">
          Non-Diagnostic
        </span>
        {aiSummary && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
            <Zap className="h-2.5 w-2.5" /> Gemini
          </span>
        )}
        {geminiReady && (
          <button
            onClick={fetchAiSummary}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-cyan-400 hover:bg-cyan-500/10 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            {loading ? "Generating..." : "Regenerate"}
          </button>
        )}
      </div>

      {loading && !aiSummary && (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
          <p className="text-xs text-slate-500">Gemini is generating a patient-friendly summary...</p>
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
          <p className="text-[11px] text-amber-400">AI summary unavailable: {error}. Showing local summary.</p>
        </div>
      )}

      <div className="space-y-2">
        {displaySummary.split("\n\n").map((para, i, arr) => (
          <p
            key={i}
            className={`text-sm leading-relaxed ${
              i === arr.length - 1 && para.toLowerCase().includes("disclaimer")
                ? "text-slate-400 text-xs italic border-t border-slate-700/50 pt-2 mt-2"
                : dark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}

interface QuestionsProps {
  questions: string[];
  aiQuestions?: string[] | null;
}

export function ClarificationQuestions({ questions, aiQuestions }: QuestionsProps) {
  const { mode } = useTheme();
  const dark = mode === "dark";
  const displayQuestions = aiQuestions && aiQuestions.length > 0 ? aiQuestions : questions;

  if (displayQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <HelpCircle className="h-6 w-6 text-slate-600 mb-2" />
        <p className="text-xs text-slate-500">Clarification questions will appear after processing</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {aiQuestions && aiQuestions.length > 0 && (
        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
          <Zap className="h-2.5 w-2.5" /> Generated by Gemini
        </div>
      )}
      {displayQuestions.map((q, i) => (
        <div
          key={i}
          className={`flex items-start gap-2.5 rounded-lg border p-3 animate-[fadeIn_0.3s_ease] ${
            dark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-300">
            {i + 1}
          </span>
          <p className={`text-xs leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>{q}</p>
        </div>
      ))}
    </div>
  );
}
