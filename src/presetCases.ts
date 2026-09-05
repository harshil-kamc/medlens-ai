import type { IntakeData, LabTest } from "./types";
import { parseLabText, computeStatus } from "./lib/medical";

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
    label: "Case 1: Glycemic Conflict",
    description: "Patient reports no diabetes history but lab shows elevated HbA1c and fasting glucose.",
    intake: {
      name: "Maria Gonzalez",
      patientId: "PT-00471",
      age: "54",
      biologicalSex: "Female",
      chiefSymptoms: ["Fatigue", "Increased Thirst", "Frequent Urination"],
      conditions: "No history of diabetes. Mild hypertension.",
      allergies: "No known allergies",
      medications: "Lisinopril 10mg daily",
      notes: "Patient reports increased thirst over the past month.",
    },
    currentReportDate: "2026-08-15",
    currentReportText: `HbA1c\t6.2\t%\t< 5.7
Fasting Plasma Glucose\t114\tmg/dL\t70 - 99
Hemoglobin\t11.8\tg/dL\t12.0 - 15.5
LDL Cholesterol\t142\tmg/dL\t< 100
Creatinine\t0.9\tmg/dL\t0.6 - 1.2
eGFR\t95\tmL/min\t> 60`,
    previousReportDate: null,
    previousReportText: null,
  },
  {
    id: "case2",
    label: "Case 2: Renal & Allergy Conflict",
    description: "Patient reports no kidney disease and no allergies, but labs show elevated creatinine and a penicillin allergy is noted.",
    intake: {
      name: "James O'Connor",
      patientId: "PT-00833",
      age: "67",
      biologicalSex: "Male",
      chiefSymptoms: ["Swelling", "Fatigue", "Shortness of Breath"],
      conditions: "No kidney disease. Hypertension diagnosed 2019.",
      allergies: "No known allergies",
      medications: "Amlodipine 5mg daily",
      notes: "Noted ankle swelling for 3 weeks. Penicillin allergy noted in prior records.",
    },
    currentReportDate: "2026-08-20",
    currentReportText: `Serum Creatinine\t1.4\tmg/dL\t0.7 - 1.3
eGFR\t54\tmL/min\t> 60
Hemoglobin\t10.2\tg/dL\t13.5 - 17.5
Sodium\t138\tmmol/L\t135 - 145
Potassium\t5.1\tmmol/L\t3.5 - 5.0
Uric Acid\t8.2\tmg/dL\t3.5 - 7.0
Notes: Penicillin allergy documented in chart review`,
    previousReportDate: null,
    previousReportText: null,
  },
  {
    id: "case3",
    label: "Case 3: Longitudinal Panel",
    description: "Two reports over time showing trend in cholesterol and glucose markers.",
    intake: {
      name: "Sarah Chen",
      patientId: "PT-01209",
      age: "45",
      biologicalSex: "Female",
      chiefSymptoms: ["Fatigue"],
      conditions: "Hyperlipidemia. Family history of cardiovascular disease.",
      allergies: "NKDA",
      medications: "Atorvastatin 20mg daily",
      notes: "Routine follow-up lipid panel and glucose check.",
    },
    currentReportDate: "2026-09-01",
    currentReportText: `Total Cholesterol\t195\tmg/dL\t< 200
LDL Cholesterol\t118\tmg/dL\t< 100
HDL Cholesterol\t52\tmg/dL\t> 40
Triglycerides\t148\tmg/dL\t< 150
Fasting Plasma Glucose\t102\tmg/dL\t70 - 99
Hemoglobin A1c\t5.8\t%\t< 5.7`,
    previousReportDate: "2026-03-15",
    previousReportText: `Total Cholesterol\t210\tmg/dL\t< 200
LDL Cholesterol\t135\tmg/dL\t< 100
HDL Cholesterol\t48\tmg/dL\t> 40
Triglycerides\t160\tmg/dL\t< 150
Fasting Plasma Glucose\t96\tmg/dL\t70 - 99
Hemoglobin A1c\t5.5\t%\t< 5.7`,
  },
  {
    id: "case4",
    label: "Case 4: Normal Wellness Check",
    description: "Routine wellness panel with all values in normal range.",
    intake: {
      name: "David Patel",
      patientId: "PT-01552",
      age: "32",
      biologicalSex: "Male",
      chiefSymptoms: [],
      conditions: "No significant medical history.",
      allergies: "No known allergies",
      medications: "None",
      notes: "Annual routine wellness check. No current concerns.",
    },
    currentReportDate: "2026-09-03",
    currentReportText: `Hemoglobin\t15.1\tg/dL\t13.5 - 17.5
White Blood Cell Count\t7.2\t10^3/uL\t4.0 - 11.0
Platelet Count\t250\t10^3/uL\t150 - 450
Sodium\t140\tmmol/L\t135 - 145
Potassium\t4.2\tmmol/L\t3.5 - 5.0
Total Cholesterol\t165\tmg/dL\t< 200
LDL Cholesterol\t88\tmg/dL\t< 100
Fasting Plasma Glucose\t85\tmg/dL\t70 - 99
Serum Creatinine\t0.9\tmg/dL\t0.7 - 1.3
TSH\t2.1\tmIU/L\t0.4 - 4.0`,
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

  const currentTests = parseLabText(preset.currentReportText, preset.currentReportDate).map((t) => ({
    ...t,
    source: "current" as const,
  }));
  const previousTests = preset.previousReportText
    ? parseLabText(preset.previousReportText, preset.previousReportDate).map((t) => ({
        ...t,
        source: "previous" as const,
      }))
    : [];

  return { intake: preset.intake, currentTests, previousTests };
}

export function parsePastedText(text: string, reportDate: string | null, kind: "current" | "previous"): LabTest[] {
  return parseLabText(text, reportDate).map((t) => ({
    ...t,
    source: kind,
  }));
}
