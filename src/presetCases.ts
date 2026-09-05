import type { IntakeData, LabTest } from "./types";
import { parseLabText } from "./lib/medical";

export interface PresetCase {
  id: string;
  label: string;
  description: string;
  intake: IntakeData;
  currentReportText: string;
  previousReportText: string | null;
  currentReportDate: string;
  previousReportDate: string | null;
}

export const PRESET_CASES: PresetCase[] = [
  {
    id: "case1",
    label: "Demo Case: Glycemic Conflict",
    description:
      "Patient Jordan Lee (45, Male) self-reports no diabetes, but labs show elevated HbA1c, fasting glucose, LDL, and TSH.",
    intake: {
      name: "Jordan Lee",
      patientId: "PT-00001",
      age: "45",
      biologicalSex: "Male",
      chiefSymptoms: ["Increased Thirst", "Fatigue", "Frequent Urination"],
      conditions:
        "None (Self-reports no history of diabetes, elevated blood sugar, thyroid dysfunction, or kidney disease).",
      allergies: "No known allergies",
      medications: "None",
      notes: "Patient reports increased thirst and fatigue over the past several weeks.",
    },
    currentReportDate: "2026-09-01",
    currentReportText: `HbA1c\t6.2\t%\t4.0 - 5.6
Fasting Plasma Glucose\t114\tmg/dL\t70 - 99
LDL Cholesterol\t128\tmg/dL\t< 100
Serum Creatinine\t0.9\tmg/dL\t0.6 - 1.2
eGFR\t94\tmL/min\t> 60
TSH\t5.8\tuIU/mL\t0.4 - 4.5`,
    previousReportDate: null,
    previousReportText: null,
  },
];

export function loadPresetCase(caseId: string): {
  intake: IntakeData;
  currentTests: LabTest[];
  previousTests: LabTest[];
} | null {
  const preset = PRESET_CASES.find((c) => c.id === caseId);
  if (!preset) return null;

  const currentTests = parseLabText(preset.currentReportText, preset.currentReportDate).map(
    (t) => ({ ...t, source: "current" as const })
  );
  const previousTests = preset.previousReportText
    ? parseLabText(preset.previousReportText, preset.previousReportDate).map((t) => ({
        ...t,
        source: "previous" as const,
      }))
    : [];

  return { intake: preset.intake, currentTests, previousTests };
}

export function parsePastedText(
  text: string,
  reportDate: string | null,
  kind: "current" | "previous"
): LabTest[] {
  return parseLabText(text, reportDate).map((t) => ({ ...t, source: kind }));
}
