import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, HelpCircle, Loader2, RefreshCw, Zap, CheckCircle2, ShieldAlert, Stethoscope } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { isGeminiConfigured, generatePatientSummary } from "../services/gemini";
import type { IntakeData, LabTest } from "../types";

interface SummaryProps {
  summary: string;
  intake: IntakeData;
  tests: LabTest[];
  onAiQuestions?: (questions: string[] | null) => void;
}

interface GuidanceProps {
  intake: IntakeData;
  tests: LabTest[];
}

function PatientGuidance({ intake, tests }: GuidanceProps) {
  const { mode } = useTheme();
  const dark = mode === "dark";
  const abnormal = tests.filter((test) => test.status === "HIGH" || test.status === "LOW" || test.status === "DANGER");
  const high = abnormal.filter((test) => test.status === "HIGH" || test.status === "DANGER");
  const low = abnormal.filter((test) => test.status === "LOW");
  const hasSymptoms = intake.chiefSymptoms.length > 0;

  const actions = [
    abnormal.length > 0
      ? `Book a review with your primary care clinician and bring this report. Discuss the ${abnormal.map((test) => test.name).join(", ")} results and whether repeat testing is appropriate.`
      : "Keep regular health visits and share these results with your primary care clinician, especially if symptoms continue.",
    hasSymptoms
      ? `Tell your clinician about your reported symptoms: ${intake.chiefSymptoms.join(", ")}. Include when they started and whether they are changing.`
      : "Keep a simple record of new or changing symptoms, medicines, supplements, and relevant family history.",
    "Use the reference range printed on the report as context; results should be interpreted with your history, examination, and other tests.",
  ];

  const avoid = [
    "Do not start, stop, or change medicines, supplements, or restrictive diets based on this report alone.",
    high.length > 0 || low.length > 0
      ? "Avoid assuming that a single high or low result confirms a diagnosis; temporary factors, collection conditions, and lab variation can affect results."
      : "Avoid ignoring persistent symptoms just because a result is within its listed range.",
    "Avoid sharing the report publicly; it contains personal health information.",
  ];

  return (
    <div className={`mt-4 grid gap-3 sm:grid-cols-2`}>
      <section className={`rounded-lg border p-3 ${dark ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-200 bg-emerald-50"}`} aria-labelledby="health-actions-title">
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <h4 id="health-actions-title" className={`text-xs font-semibold ${dark ? "text-emerald-300" : "text-emerald-800"}`}>What to do next</h4>
        </div>
        <ul className={`space-y-2 text-xs leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>
          {actions.map((action) => <li key={action} className="list-disc ml-4">{action}</li>)}
        </ul>
      </section>
      <section className={`rounded-lg border p-3 ${dark ? "border-amber-500/20 bg-amber-500/5" : "border-amber-200 bg-amber-50"}`} aria-labelledby="health-avoid-title">
        <div className="mb-2 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          <h4 id="health-avoid-title" className={`text-xs font-semibold ${dark ? "text-amber-300" : "text-amber-800"}`}>What to avoid and why</h4>
        </div>
        <ul className={`space-y-2 text-xs leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>
          {avoid.map((item) => <li key={item} className="list-disc ml-4">{item}</li>)}
        </ul>
      </section>
      <div className={`sm:col-span-2 flex items-start gap-2 rounded-lg border p-3 ${dark ? "border-cyan-500/20 bg-cyan-500/5" : "border-cyan-200 bg-cyan-50"}`}>
        <Stethoscope className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
        <p className={`text-xs leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>
          <strong className={dark ? "text-cyan-300" : "text-cyan-800"}>Who to consult:</strong> Start with your primary care clinician. They can decide whether you need a specialist based on your history, symptoms, examination, and trends. Seek urgent local medical help for severe or rapidly worsening symptoms; this report cannot assess emergencies.
        </p>
      </div>
    </div>
  );
}

export function AISummary({ summary, intake, tests, onAiQuestions }: SummaryProps) {
  const { mode } = useTheme();
  const dark = mode === "dark";
  const geminiReady = isGeminiConfigured();

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const fetchAiSummary = useCallback(async () => {
    if (!geminiReady || tests.length === 0) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await generatePatientSummary(intake, tests, controller.signal);
      setAiSummary(result.summary);
      onAiQuestions?.(result.questions);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to generate AI summary");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [geminiReady, intake, tests, onAiQuestions]);

  useEffect(() => () => requestRef.current?.abort(), []);

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
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`rounded-full bg-cyan-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider border border-cyan-500/30 ${dark ? "text-cyan-300" : "text-cyan-700"}`}>
          Non-Diagnostic
        </span>
        {aiSummary && (
          <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider border border-emerald-500/30 ${dark ? "text-emerald-300" : "text-emerald-700"}`}>
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
                ? `${dark ? "text-slate-400 border-slate-700/50" : "text-slate-600 border-slate-200"} text-xs italic border-t pt-2 mt-2`
                : dark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            {para}
          </p>
        ))}
      </div>
      <PatientGuidance intake={intake} tests={tests} />
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
        <div className={`mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider border border-emerald-500/30 ${dark ? "text-emerald-300" : "text-emerald-700"}`}>
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
