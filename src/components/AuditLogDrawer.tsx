import { X, History, Clock, User as UserIcon, Edit3, Plus, FileText } from "lucide-react";
import type { AuditEntry } from "../types";
import { useTheme } from "./ThemeProvider";

interface Props {
  open: boolean;
  onClose: () => void;
  log: AuditEntry[];
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function AuditLogDrawer({ open, onClose, log }: Props) {
  const { mode } = useTheme();
  const dark = mode === "dark";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      />

      <div className={`relative ml-auto flex h-full w-full max-w-lg flex-col shadow-2xl animate-[drawerIn_0.3s_ease] ${
        dark ? "bg-slate-950 border-l border-slate-800" : "bg-white border-l border-slate-200"
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-5 py-4 ${dark ? "border-slate-800" : "border-slate-200"}`}>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-brand-500" />
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Audit Log Timeline</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time record of all user edits and actions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 transition ${dark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100"}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-5">
          {log.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="h-8 w-8 text-slate-600 mb-3" />
              <p className="text-sm text-slate-500">No audit entries yet</p>
              <p className="text-xs text-slate-600 mt-1">Edit a lab value or verify a record to see activity here</p>
            </div>
          ) : (
            <div className="relative space-y-4">
              {/* Timeline line */}
              <div className={`absolute left-4 top-2 bottom-2 w-px ${dark ? "bg-slate-800" : "bg-slate-200"}`} />

              {log.map((entry) => (
                <div key={entry.id} className="relative flex gap-4 animate-[fadeIn_0.3s_ease]">
                  {/* Dot */}
                  <div className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                    dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
                  }`}>
                    <div className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                  </div>

                  {/* Content */}
                  <div className={`flex-1 rounded-xl border p-3 ${dark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono">{formatTime(entry.timestamp)}</span>
                      <span className="text-slate-400">·</span>
                      <span>{formatDate(entry.timestamp)}</span>
                    </div>
                    <p className={`mt-1.5 text-sm ${dark ? "text-slate-200" : "text-slate-800"}`}>
                      {entry.action}
                    </p>
                    {entry.field && (
                      <p className="mt-1 text-xs text-slate-500">
                        <span className="font-semibold">Field:</span> {entry.field}
                      </p>
                    )}
                    {entry.oldValue !== undefined && entry.newValue !== undefined && (
                      <div className="mt-1.5 flex items-center gap-2 text-xs">
                        <span className={`rounded px-1.5 py-0.5 font-mono ${dark ? "bg-rose-500/10 text-rose-300" : "bg-rose-50 text-rose-600"}`}>
                          {entry.oldValue}
                        </span>
                        <Edit3 className="h-3 w-3 text-slate-500" />
                        <span className={`rounded px-1.5 py-0.5 font-mono ${dark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-600"}`}>
                          {entry.newValue}
                        </span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                      <UserIcon className="h-3 w-3" />
                      <span>{entry.user}</span>
                      <span className="text-slate-400">·</span>
                      <span className="uppercase">{entry.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-2 border-t px-5 py-3 ${dark ? "border-slate-800 bg-slate-900/30" : "border-slate-200 bg-slate-50"}`}>
          <FileText className="h-4 w-4 text-slate-500" />
          <p className="text-xs text-slate-500">{log.length} entr{log.length === 1 ? "y" : "ies"} recorded</p>
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
