import { useRef, useState, useEffect } from "react";
import { FileText, X, Type, ScanLine, Loader2, AlertCircle } from "lucide-react";
import type { ParsedDocument } from "../types";
import { useTheme } from "./ThemeProvider";
import { processFile, detectFileKind } from "../utils/fileProcessor";
import { isGeminiConfigured } from "../services/gemini";

interface Props {
  label: string;
  kind: "current" | "previous";
  doc: ParsedDocument | null;
  onFile: (doc: ParsedDocument, rawText: string) => void;
  onPaste: (text: string) => void;
  onClear: () => void;
  accent: "indigo" | "cyan";
  scanning: boolean;
}

const ACCENT_STYLES = {
  indigo: {
    borderActive: "border-indigo-500/30 bg-indigo-500/5",
    icon: "text-indigo-400",
    dragging: "border-indigo-400 bg-indigo-500/10",
    hover: "hover:border-indigo-500/50",
    groupHoverIcon: "group-hover:text-indigo-400",
    pasteBtn: "hover:border-indigo-500/40",
    processBtn: "bg-indigo-600 hover:bg-indigo-500",
  },
  cyan: {
    borderActive: "border-cyan-500/30 bg-cyan-500/5",
    icon: "text-cyan-400",
    dragging: "border-cyan-400 bg-cyan-500/10",
    hover: "hover:border-cyan-500/50",
    groupHoverIcon: "group-hover:text-cyan-400",
    pasteBtn: "hover:border-cyan-500/40",
    processBtn: "bg-cyan-600 hover:bg-cyan-500",
  },
};

export function Dropzone({ label, kind, doc, onFile, onPaste, onClear, accent, scanning }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [scanVisible, setScanVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const processingRef = useRef<AbortController | null>(null);
  const { mode } = useTheme();
  const dark = mode === "dark";

  useEffect(() => {
    if (scanning) {
      setScanVisible(true);
      const timer = setTimeout(() => setScanVisible(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [scanning]);

  useEffect(() => () => processingRef.current?.abort(), []);

  const s = ACCENT_STYLES[accent];
  const geminiReady = isGeminiConfigured();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const fileKind = detectFileKind(file);
    processingRef.current?.abort();
    const controller = new AbortController();
    processingRef.current = controller;

    setProcessing(true);
    setProcessError(null);
    setStatusMsg(null);

    try {
      const dateEl = document.getElementById(`${kind}-date`) as HTMLInputElement | null;
      const date = dateEl?.value || null;

      const result = await processFile(file, date, kind, {
        onStatus: (msg) => setStatusMsg(msg),
        signal: controller.signal,
      });
      const format: "text" | "pdf" | "image" =
        fileKind === "pdf" ? "pdf" : fileKind === "image" ? "image" : "text";

      onFile(
        { filename: file.name, kind, format, rawText: result.rawText },
        result.rawText
      );

      if (result.source === "empty" && result.tests.length === 0) {
        setProcessError(result.rawText);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setProcessError(
        err instanceof Error ? err.message : "Failed to process file"
      );
    } finally {
      setProcessing(false);
      setStatusMsg(null);
    }
  }

  if (doc) {
    return (
      <div className={`relative overflow-hidden rounded-xl border ${s.borderActive} p-3`}>
        {scanVisible && (
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
            <div
              className="absolute left-0 right-0 h-0.5"
              style={{
                background: "linear-gradient(90deg, transparent, #22d3ee, transparent)",
                boxShadow: "0 0 12px 2px rgba(34,211,238,0.6)",
                animation: "laserScan 1.8s ease-in-out",
              }}
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className={`h-4 w-4 flex-shrink-0 ${s.icon}`} />
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${dark ? "text-slate-200" : "text-slate-800"}`}>{doc.filename}</p>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">{doc.format} · {kind} report</p>
            </div>
          </div>
          <button
            onClick={onClear}
            aria-label={`Remove ${kind} report`}
            className={`rounded-lg p-1 transition ${dark ? "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-200"}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {doc.rawText && (
          <div className={`mt-2 max-h-24 overflow-y-auto rounded-lg p-2 ${dark ? "bg-slate-900/60" : "bg-slate-100"}`}>
            <pre className={`text-[11px] whitespace-pre-wrap font-mono ${dark ? "text-slate-400" : "text-slate-600"}`}>
              {doc.rawText.slice(0, 500)}
              {doc.rawText.length > 500 ? "..." : ""}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={processing ? -1 : 0}
        aria-label={`${label}: choose a file or drop one here`}
        aria-busy={processing}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => !processing && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!processing && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`group relative cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all duration-200 ${
          processing ? "cursor-wait opacity-70" : ""
        } ${
          dragging
            ? `${s.dragging} scale-[1.01]`
            : dark
            ? `border-slate-700 ${s.hover} hover:bg-slate-800/30`
            : `border-slate-300 ${s.hover} hover:bg-slate-50`
        }`}
      >
        {scanVisible && (
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xl">
            <div
              className="absolute left-0 right-0 h-0.5"
              style={{
                background: "linear-gradient(90deg, transparent, #22d3ee, transparent)",
                boxShadow: "0 0 12px 2px rgba(34,211,238,0.6)",
                animation: "laserScan 1.8s ease-in-out",
              }}
            />
            <div className="absolute inset-0 bg-cyan-500/5" />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.pdf,.png,.jpg,.jpeg"
          className="hidden"
          aria-label={`Choose ${kind} report file`}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={processing}
        />
        {processing ? (
          <>
            <Loader2 className={`mx-auto h-6 w-6 mb-2 ${s.icon} animate-spin`} />
            <p className={`text-sm font-medium ${dark ? "text-slate-300" : "text-slate-700"}`}>
              {statusMsg || (geminiReady ? "Running Gemini OCR..." : "Processing file...")}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Extracting lab data from your document</p>
          </>
        ) : (
          <>
            <ScanLine className={`mx-auto h-6 w-6 mb-2 ${dark ? "text-slate-500" : "text-slate-400"} ${s.groupHoverIcon} transition`} />
            <p className={`text-sm font-medium ${dark ? "text-slate-300" : "text-slate-700"}`}>{label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Drop a file or click to browse · TXT, PDF, Image</p>
          </>
        )}
      </div>

      {/* Processing error / empty result */}
      {processError && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 animate-[fadeIn_0.2s_ease]">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className={`text-xs font-medium ${dark ? "text-amber-300" : "text-amber-700"}`}>Extraction Notice</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{processError}</p>
          </div>
          <button
            onClick={() => setProcessError(null)}
            aria-label="Dismiss extraction notice"
            className={`ml-auto rounded p-0.5 ${dark ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-600"}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Gemini status indicator */}
      {!doc && !processing && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
          <span className={`h-1.5 w-1.5 rounded-full ${geminiReady ? "bg-emerald-400" : "bg-slate-500"}`} />
          <span className={geminiReady ? "text-emerald-400/70" : "text-slate-500"}>
            {geminiReady ? "Gemini multimodal OCR ready" : "No API key — Tesseract local OCR available"}
          </span>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => setShowPaste(!showPaste)}
          aria-expanded={showPaste}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium border transition ${
            dark ? "text-slate-300 border-slate-700" : "text-slate-600 border-slate-300"
          } ${s.pasteBtn} hover:bg-slate-800/40`}
        >
          <Type className="h-3 w-3" /> Paste text
        </button>
      </div>

      {showPaste && (
        <div className="mt-2 space-y-2 animate-[fadeIn_0.2s_ease]">
          <textarea
            aria-label={`Paste ${kind} report text`}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste lab report text here (e.g. Hemoglobin 10.2 g/dL 12.0 - 15.5)..."
            className={`w-full h-24 rounded-lg border p-2.5 text-xs font-mono focus:outline-none resize-none ${
              dark ? "bg-slate-900/60 border-slate-700 text-slate-200 placeholder:text-slate-600 focus:border-slate-500"
              : "bg-white border-slate-300 text-slate-700 placeholder:text-slate-400 focus:border-slate-400"
            }`}
          />
          <div className="flex gap-2">
            <input
              aria-label={`${kind} report date`}
              type="date"
              className={`rounded-lg border px-2 py-1 text-xs focus:outline-none ${
                dark ? "bg-slate-900/60 border-slate-700 text-slate-300 focus:border-slate-500"
                : "bg-white border-slate-300 text-slate-700 focus:border-slate-400"
              }`}
              id={`${kind}-date`}
            />
            <button
              onClick={() => {
                if (pasteText.trim()) {
                  onPaste(pasteText.trim());
                  setPasteText("");
                  setShowPaste(false);
                }
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium text-white ${s.processBtn} transition`}
            >
              Process Text
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
