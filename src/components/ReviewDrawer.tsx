import { useRef, useState } from "react";
import { X, FileText, Check, AlertCircle } from "lucide-react";
import type { LabTest } from "../types";
import { StatusBadge, ProvenanceBadge, ConfidenceBadge } from "./Badges";
import { useTheme } from "./ThemeProvider";
import { useDialogA11y } from "./useDialogA11y";

interface Props {
  open: boolean;
  onClose: () => void;
  tests: LabTest[];
  rawText: string;
  user: { name: string; role: string };
  onConfirmOverride: (id: string, newValue: string) => void;
}

export function ReviewDrawer({ open, onClose, tests, rawText, user, onConfirmOverride }: Props) {
  const { mode } = useTheme();
  const dark = mode === "dark";
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(open, onClose, panelRef);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  if (!open) return null;

  function startEdit(test: LabTest) {
    setEditingId(test.id);
    setEditValue(test.value !== null ? String(test.value) : "");
  }

  function confirmOverride(test: LabTest) {
    onConfirmOverride(test.id, editValue);
    setEditingId(null);
  }

  // Highlight numbers in raw text
  function renderHighlightedText(text: string) {
    return text.split("\n").map((line, lineIdx) => {
      const parts = line.split(/(\d+\.?\d*)/g);
      return (
        <div key={lineIdx} className="whitespace-pre-wrap break-words leading-relaxed">
          {parts.map((part, i) =>
            /^\d+\.?\d*$/.test(part) ? (
              <mark
                key={i}
                className={`rounded bg-amber-300/30 px-0.5 border border-amber-400/20 ${dark ? "text-amber-200" : "text-amber-800"}`}
              >
                {part}
              </mark>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </div>
      );
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="review-drawer-title" className={`relative ml-auto flex h-full w-full max-w-5xl flex-col shadow-2xl animate-[drawerIn_0.3s_ease] ${
        dark ? "bg-slate-950 border-l border-slate-800" : "bg-white border-l border-slate-200"
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-5 py-4 ${dark ? "border-slate-800" : "border-slate-200"}`}>
          <div>
            <h2 id="review-drawer-title" className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-500" />
              Side-by-Side Source Inspection
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Compare raw document text with extracted values · override and verify</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close source inspection"
            className={`rounded-lg p-2 transition ${dark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100"}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Split view */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Document viewer */}
          <div className={`flex flex-col w-1/2 border-r ${dark ? "border-slate-800" : "border-slate-200"}`}>
            <div className={`px-4 py-2.5 border-b ${dark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Source Document</p>
              <p className="text-xs text-slate-400 mt-0.5">Yellow highlights = extracted numeric values</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {rawText ? (
                <div className={`rounded-xl border p-4 font-mono text-xs ${dark ? "border-slate-800 bg-slate-900/50 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                  {renderHighlightedText(rawText)}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No document loaded
                </div>
              )}
            </div>
          </div>

          {/* Right: Editable fields */}
          <div className="flex flex-col w-1/2">
            <div className={`px-4 py-2.5 border-b ${dark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Extracted Values — Human Override</p>
              <p className="text-xs text-slate-400 mt-0.5">Click a value to edit · confirm to mark HUMAN_VERIFIED</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {tests.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No tests extracted yet
                </div>
              ) : (
                tests.map((test) => (
                  <div
                    key={test.id}
                    className={`rounded-xl border p-3 transition-all ${dark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"} ${
                      editingId === test.id ? (dark ? "ring-1 ring-brand-500/40" : "ring-1 ring-brand-400/40") : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{test.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <StatusBadge status={test.status} />
                          {test.confidence && <ConfidenceBadge confidence={test.confidence} />}
                        </div>
                      </div>
                      <ProvenanceBadge provenance={test.provenance} />
                    </div>

                    <div className="mt-2.5 flex items-center gap-2">
                      {editingId === test.id ? (
                        <>
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                            className={`w-24 rounded-lg border px-2.5 py-1.5 text-sm font-semibold tabular-nums focus:outline-none ${
                              dark ? "bg-slate-800 border-slate-700 text-slate-100 focus:border-brand-500" : "bg-white border-slate-300 text-slate-800 focus:border-brand-500"
                            }`}
                          />
                          {test.unit && <span className="text-xs text-slate-500">{test.unit}</span>}
                          <button
                            onClick={() => confirmOverride(test)}
                            className="ml-auto inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 transition"
                          >
                            <Check className="h-3.5 w-3.5" /> Confirm Override
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className={`rounded-lg px-2 py-1.5 text-xs ${dark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"}`}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100">
                            {test.value !== null ? test.value : "—"}
                          </span>
                          {test.unit && <span className="text-xs text-slate-500">{test.unit}</span>}
                          <button
                            onClick={() => startEdit(test)}
                            className={`ml-auto rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                              dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Edit Value
                          </button>
                        </>
                      )}
                    </div>

                    {test.refRange.raw && (
                      <p className="mt-1.5 text-[10px] text-slate-500">
                        Ref range: <span className="font-mono">{test.refRange.raw}</span>
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-2 border-t px-5 py-3 ${dark ? "border-slate-800 bg-slate-900/30" : "border-slate-200 bg-slate-50"}`}>
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <p className="text-xs text-slate-500">
            Overrides by <span className="font-semibold text-slate-700 dark:text-slate-300">{user.name}</span> are logged in the audit trail.
          </p>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg px-4 py-2 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
