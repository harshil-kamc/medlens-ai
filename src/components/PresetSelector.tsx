import { PRESET_CASES } from "../presetCases";
import { Layers } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface Props {
  activeCase: string | null;
  onSelect: (caseId: string) => void;
}

export function PresetSelector({ activeCase, onSelect }: Props) {
  const { mode } = useTheme();
  const dark = mode === "dark";

  return (
    <div
      className={`rounded-xl border p-4 ${dark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"}`}
      role="region"
      aria-label="Preset demo case selector"
    >
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-brand-500" />
        <h3 className={`text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>Demo Case</h3>
      </div>
      <div className="grid gap-2">
        {PRESET_CASES.map((c) => {
          const active = activeCase === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              aria-pressed={active}
              aria-label={`Load ${c.label}`}
              className={`text-left rounded-lg p-3 border transition-all duration-200 ${
                active
                  ? "border-brand-500/50 bg-brand-500/10"
                  : dark
                  ? "border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-800/40"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
              }`}
            >
              <p className={`text-xs font-semibold ${active ? (dark ? "text-brand-200" : "text-brand-700") : dark ? "text-slate-300" : "text-slate-700"}`}>{c.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{c.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
