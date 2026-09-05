import type { IntakeData } from "../types";
import { SYMPTOM_TAGS } from "../lib/medical";
import { User, ArrowRight } from "lucide-react";
import { ProvenanceBadge } from "./Badges";
import { useTheme } from "./ThemeProvider";

interface Props {
  data: IntakeData;
  onChange: (data: IntakeData) => void;
  onContinue?: () => void;
}

export function IntakeForm({ data, onChange, onContinue }: Props) {
  const { mode } = useTheme();
  const dark = mode === "dark";

  function update<K extends keyof IntakeData>(key: K, value: IntakeData[K]) {
    onChange({ ...data, [key]: value });
  }

  function toggleSymptom(symptom: string) {
    const has = data.chiefSymptoms.includes(symptom);
    update("chiefSymptoms", has
      ? data.chiefSymptoms.filter((s) => s !== symptom)
      : [...data.chiefSymptoms, symptom]);
  }

  const inputCls = dark
    ? "w-full rounded-lg bg-slate-900/50 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-brand-500/50 focus:outline-none transition"
    : "w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none transition";

  const labelCls = "mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-brand-500" />
          <h3 className={`text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>Patient Intake</h3>
        </div>
        <ProvenanceBadge provenance="USER_PROVIDED" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Patient Name</label>
          <input value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="Full name" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Patient ID</label>
          <input value={data.patientId} onChange={(e) => update("patientId", e.target.value)} placeholder="e.g. PT-00001" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Age</label>
          <input value={data.age} onChange={(e) => update("age", e.target.value)} placeholder="Years" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Biological Sex</label>
          <select value={data.biologicalSex} onChange={(e) => update("biologicalSex", e.target.value)} className={inputCls}>
            <option value="">Select...</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Chief Symptoms</label>
        <div className="flex flex-wrap gap-1.5">
          {SYMPTOM_TAGS.map((symptom) => {
            const active = data.chiefSymptoms.includes(symptom);
            return (
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
                  active
                    ? "bg-brand-500/20 text-brand-200 border border-brand-500/40"
                    : dark
                    ? "bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300"
                    : "bg-slate-100 text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {symptom}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelCls}>Self-Reported Conditions</label>
        <textarea value={data.conditions} onChange={(e) => update("conditions", e.target.value)} placeholder="e.g. Hypertension, no history of diabetes..." className={`${inputCls} h-16 resize-none`} />
      </div>

      <div>
        <label className={labelCls}>Known Allergies</label>
        <input value={data.allergies} onChange={(e) => update("allergies", e.target.value)} placeholder="e.g. Penicillin, No known allergies" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Active Medications</label>
        <input value={data.medications} onChange={(e) => update("medications", e.target.value)} placeholder="e.g. Metformin 500mg, None" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Additional Notes</label>
        <textarea value={data.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Any other relevant information..." className={`${inputCls} h-16 resize-none`} />
      </div>

      {onContinue && (
        <div className="sticky bottom-0 pt-3">
          <button
            onClick={onContinue}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 px-6 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-cyan-500/30"
          >
            Save & Continue to Document Ingestion
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}
    </div>
  );
}
