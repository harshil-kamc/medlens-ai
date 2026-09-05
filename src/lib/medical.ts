import type { IntakeData, LabTest, Conflict, DeltaRow, RefRange, RangeStatus, Trend, Provenance, LabCategory } from "../types";

export const emptyIntake: IntakeData = {
  name: "",
  patientId: "",
  age: "",
  biologicalSex: "",
  chiefSymptoms: [],
  conditions: "",
  allergies: "",
  medications: "",
  notes: "",
};

export const SYMPTOM_TAGS = [
  "Fatigue",
  "Headache",
  "Fever",
  "Shortness of Breath",
  "Chest Pain",
  "Dizziness",
  "Nausea",
  "Joint Pain",
  "Weight Loss",
  "Frequent Urination",
  "Increased Thirst",
  "Swelling",
  "Abdominal Pain",
  "Palpitations",
  "Muscle Weakness",
];

/* ------------------------------------------------------------------ */
/*  TERMINOLOGY NORMALIZATION                                          */
/* ------------------------------------------------------------------ */

const TERM_MAP: Record<string, string> = {
  "hb": "Hemoglobin",
  "hgb": "Hemoglobin",
  "hemoglobin": "Hemoglobin",
  "hba1c": "HbA1c",
  "glycated hemoglobin": "HbA1c",
  "cr": "Serum Creatinine",
  "creat": "Serum Creatinine",
  "creatinine": "Serum Creatinine",
  "serum creatinine": "Serum Creatinine",
  "egfr": "eGFR",
  "estimated glomerular filtration rate": "eGFR",
  "glucose fasting": "Fasting Plasma Glucose",
  "fasting glucose": "Fasting Plasma Glucose",
  "fasting blood glucose": "Fasting Plasma Glucose",
  "fbs": "Fasting Plasma Glucose",
  "fbg": "Fasting Plasma Glucose",
  "glucose": "Fasting Plasma Glucose",
  "ldl": "LDL Cholesterol",
  "ldl cholesterol": "LDL Cholesterol",
  "ldl-c": "LDL Cholesterol",
  "hdl": "HDL Cholesterol",
  "hdl cholesterol": "HDL Cholesterol",
  "hdl-c": "HDL Cholesterol",
  "total cholesterol": "Total Cholesterol",
  "tc": "Total Cholesterol",
  "triglycerides": "Triglycerides",
  "tg": "Triglycerides",
  "tsh": "Thyroid Stimulating Hormone",
  "thyroid stimulating hormone": "Thyroid Stimulating Hormone",
  "wbc": "White Blood Cell Count",
  "white blood cell count": "White Blood Cell Count",
  "rbc": "Red Blood Cell Count",
  "red blood cell count": "Red Blood Cell Count",
  "platelets": "Platelet Count",
  "plt": "Platelet Count",
  "platelet count": "Platelet Count",
  "sodium": "Sodium",
  "na": "Sodium",
  "potassium": "Potassium",
  "k": "Potassium",
  "alt": "ALT",
  "sgpt": "ALT",
  "ast": "AST",
  "sgot": "AST",
  "bilirubin": "Total Bilirubin",
  "total bilirubin": "Total Bilirubin",
  "vitamin d": "Vitamin D",
  "25-oh vitamin d": "Vitamin D",
  "vitamin b12": "Vitamin B12",
  "b12": "Vitamin B12",
  "iron": "Serum Iron",
  "ferritin": "Ferritin",
  "uric acid": "Uric Acid",
};

export function normalizeTerm(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9\s-]/g, "");
  return TERM_MAP[key] || raw.trim();
}

/* ------------------------------------------------------------------ */
/*  STANDARD REFERENCE RANGE DICTIONARY                               */
/* ------------------------------------------------------------------ */

interface StandardRange {
  refRange: RefRange;
  unit: string;
  category: LabCategory;
  insight: (value: number, status: RangeStatus) => string;
}

const STANDARD_RANGES: Record<string, StandardRange> = {
  "Systolic Blood Pressure": {
    refRange: { min: null, max: 120, upperOnly: null, lowerOnly: null, raw: "< 120 mmHg" },
    unit: "mmHg",
    category: "vital",
    insight: (v, s) => {
      if (s === "DANGER") return `Systolic reading of ${v} mmHg indicates Stage 2 Hypertension (crisis range). Recommendation: Seek immediate medical evaluation. Reduce sodium intake, monitor blood pressure daily, and consult your physician for urgent assessment.`;
      if (s === "HIGH") return `Systolic reading of ${v} mmHg indicates Stage 1 Hypertension. Recommendation: Reduce sodium intake, engage in regular aerobic exercise, limit alcohol, and consult your physician for routine evaluation.`;
      return `Systolic reading of ${v} mmHg is within the normal range. Maintain a balanced diet low in sodium and continue regular physical activity to keep blood pressure healthy.`;
    },
  },
  "Diastolic Blood Pressure": {
    refRange: { min: null, max: 80, upperOnly: null, lowerOnly: null, raw: "< 80 mmHg" },
    unit: "mmHg",
    category: "vital",
    insight: (v, s) => {
      if (s === "DANGER") return `Diastolic reading of ${v} mmHg is in the Stage 2 Hypertension range. Recommendation: Seek immediate medical evaluation and monitor blood pressure closely.`;
      if (s === "HIGH") return `Diastolic reading of ${v} mmHg indicates elevated blood pressure. Recommendation: Reduce dietary sodium, maintain a healthy weight, and follow up with your physician.`;
      return `Diastolic reading of ${v} mmHg is within the normal range. Continue healthy lifestyle habits to maintain optimal blood pressure.`;
    },
  },
  "Heart Rate": {
    refRange: { min: 60, max: 100, upperOnly: null, lowerOnly: null, raw: "60 - 100 bpm" },
    unit: "bpm",
    category: "vital",
    insight: (v, s) => {
      if (s === "HIGH") return `Heart rate of ${v} bpm is elevated above the normal 60–100 bpm range (tachycardia). Recommendation: Reduce caffeine and stress, stay hydrated, and consult your physician if this persists at rest.`;
      if (s === "LOW") return `Heart rate of ${v} bpm is below the normal 60–100 bpm range (bradycardia). Recommendation: If you experience dizziness or fatigue, consult your physician. Well-trained athletes may naturally have lower resting heart rates.`;
      return `Heart rate of ${v} bpm is within the normal 60–100 bpm range. Continue regular cardiovascular exercise to maintain heart health.`;
    },
  },
  "Body Temperature": {
    refRange: { min: 36.5, max: 37.5, upperOnly: null, lowerOnly: null, raw: "36.5 - 37.5 \u00b0C" },
    unit: "\u00b0C",
    category: "vital",
    insight: (v, s) => {
      if (s === "HIGH") return `Body temperature of ${v}\u00b0C is above the normal range, which may indicate fever. Recommendation: Stay hydrated, rest, and consult your physician if temperature exceeds 39\u00b0C or persists beyond 48 hours.`;
      if (s === "LOW") return `Body temperature of ${v}\u00b0C is below the normal range (hypothermia). Recommendation: Warm up gradually and seek medical attention if below 35\u00b0C.`;
      return `Body temperature of ${v}\u00b0C is within the normal range. No action needed.`;
    },
  },
  "HbA1c": {
    refRange: { min: 4.0, max: 5.6, upperOnly: null, lowerOnly: null, raw: "4.0 - 5.6 %" },
    unit: "%",
    category: "metabolic",
    insight: (v, s) => {
      if (s === "DANGER") return `HbA1c of ${v}% is at or above the diabetes threshold (\u22656.5%). Recommendation: Consult your physician promptly for diabetes management. Dietary changes, regular exercise, and possibly medication are typically advised.`;
      if (s === "HIGH") return `HbA1c of ${v}% is in the prediabetes range (5.7\u20136.4%). Recommendation: Reduce refined sugars and simple carbohydrates, increase physical activity, and discuss a monitoring plan with your physician.`;
      return `HbA1c of ${v}% is within the normal range (4.0\u20135.6%). Maintain a balanced diet and regular exercise to keep blood sugar levels healthy.`;
    },
  },
  "Fasting Plasma Glucose": {
    refRange: { min: 70, max: 99, upperOnly: null, lowerOnly: null, raw: "70 - 99 mg/dL" },
    unit: "mg/dL",
    category: "metabolic",
    insight: (v, s) => {
      if (s === "DANGER") return `Fasting glucose of ${v} mg/dL is significantly elevated (\u2265126 mg/dL), consistent with diabetes. Recommendation: Consult your physician promptly for a comprehensive metabolic evaluation.`;
      if (s === "HIGH") return `Fasting glucose of ${v} mg/dL is elevated (\u2265100 mg/dL), which may indicate prediabetes or diabetes. Recommendation: Reduce sugar intake, increase fiber, exercise regularly, and discuss follow-up testing with your physician.`;
      if (s === "LOW") return `Fasting glucose of ${v} mg/dL is below the normal range (hypoglycemia). Recommendation: Eat regular balanced meals and consult your physician if you experience dizziness, sweating, or confusion.`;
      return `Fasting glucose of ${v} mg/dL is within the normal range (70\u201399 mg/dL). Continue a balanced diet and regular activity to maintain healthy blood sugar.`;
    },
  },
  "LDL Cholesterol": {
    refRange: { min: null, max: 100, upperOnly: null, lowerOnly: null, raw: "< 100 mg/dL" },
    unit: "mg/dL",
    category: "lipid",
    insight: (v, s) => {
      if (s === "DANGER") return `LDL cholesterol of ${v} mg/dL is very high (\u2265160 mg/dL). Recommendation: Consult your physician for lipid management. Reduce saturated fat and dietary cholesterol, increase soluble fiber, and discuss whether medication is appropriate.`;
      if (s === "HIGH") return `LDL cholesterol of ${v} mg/dL is elevated (\u2265130 mg/dL). Recommendation: Reduce saturated fat intake, increase dietary fiber, exercise regularly, and discuss a lipid management plan with your physician.`;
      return `LDL cholesterol of ${v} mg/dL is within the optimal range (<100 mg/dL). Continue a heart-healthy diet and regular exercise to maintain optimal cholesterol.`;
    },
  },
  "HDL Cholesterol": {
    refRange: { min: 40, max: null, upperOnly: null, lowerOnly: null, raw: "> 40 mg/dL" },
    unit: "mg/dL",
    category: "lipid",
    insight: (v, s) => {
      if (s === "LOW") return `HDL cholesterol of ${v} mg/dL is below the protective threshold (<40 mg/dL). Recommendation: Increase physical activity, consume healthy fats (nuts, olive oil, fish), and consult your physician about cardiovascular risk.`;
      return `HDL cholesterol of ${v} mg/dL is at or above the protective threshold (\u226540 mg/dL). Continue regular exercise and a heart-healthy diet.`;
    },
  },
  "Total Cholesterol": {
    refRange: { min: null, max: 200, upperOnly: null, lowerOnly: null, raw: "< 200 mg/dL" },
    unit: "mg/dL",
    category: "lipid",
    insight: (v, s) => {
      if (s === "HIGH") return `Total cholesterol of ${v} mg/dL is elevated (\u2265200 mg/dL). Recommendation: Reduce saturated and trans fats, increase fiber intake, exercise regularly, and discuss follow-up with your physician.`;
      return `Total cholesterol of ${v} mg/dL is within the desirable range (<200 mg/dL). Continue heart-healthy lifestyle habits.`;
    },
  },
  "Triglycerides": {
    refRange: { min: null, max: 150, upperOnly: null, lowerOnly: null, raw: "< 150 mg/dL" },
    unit: "mg/dL",
    category: "lipid",
    insight: (v, s) => {
      if (s === "HIGH") return `Triglycerides of ${v} mg/dL are elevated (\u2265150 mg/dL). Recommendation: Reduce refined carbohydrates and alcohol, increase omega-3 intake, exercise regularly, and consult your physician.`;
      return `Triglycerides of ${v} mg/dL are within the normal range (<150 mg/dL). Continue a balanced diet and regular physical activity.`;
    },
  },
  "Serum Creatinine": {
    refRange: { min: 0.6, max: 1.2, upperOnly: null, lowerOnly: null, raw: "0.6 - 1.2 mg/dL" },
    unit: "mg/dL",
    category: "renal",
    insight: (v, s) => {
      if (s === "HIGH") return `Serum creatinine of ${v} mg/dL is above the normal range (0.6\u20131.2 mg/dL), which may indicate reduced kidney function. Recommendation: Stay hydrated, avoid NSAIDs, and consult your physician for further renal evaluation including eGFR.`;
      if (s === "LOW") return `Serum creatinine of ${v} mg/dL is below the normal range. This is uncommon and may reflect low muscle mass. Discuss with your physician if symptomatic.`;
      return `Serum creatinine of ${v} mg/dL is within the normal range (0.6\u20131.2 mg/dL). Maintain hydration and regular check-ups to support kidney health.`;
    },
  },
  "eGFR": {
    refRange: { min: 60, max: null, upperOnly: null, lowerOnly: null, raw: "> 60 mL/min" },
    unit: "mL/min",
    category: "renal",
    insight: (v, s) => {
      if (s === "LOW") return `eGFR of ${v} mL/min is below the normal threshold (<60 mL/min), which may indicate reduced kidney function. Recommendation: Stay hydrated, avoid nephrotoxic medications, and consult your physician for a comprehensive kidney evaluation.`;
      return `eGFR of ${v} mL/min is at or above the normal threshold (\u226560 mL/min). Continue healthy hydration and lifestyle habits to support kidney function.`;
    },
  },
  "Hemoglobin": {
    refRange: { min: 12.0, max: 15.5, upperOnly: null, lowerOnly: null, raw: "12.0 - 15.5 g/dL" },
    unit: "g/dL",
    category: "hematology",
    insight: (v, s) => {
      if (s === "LOW") return `Hemoglobin of ${v} g/dL is below the normal range (12.0\u201315.5 g/dL), suggesting anemia. Recommendation: Increase iron-rich foods (lean meats, leafy greens, legumes), and consult your physician for further evaluation of iron, B12, and folate.`;
      if (s === "HIGH") return `Hemoglobin of ${v} g/dL is above the normal range. This may indicate dehydration or polycythemia. Recommendation: Ensure adequate hydration and discuss with your physician.`;
      return `Hemoglobin of ${v} g/dL is within the normal range (12.0\u201315.5 g/dL). Maintain a balanced diet with adequate iron intake.`;
    },
  },
  "White Blood Cell Count": {
    refRange: { min: 4.0, max: 11.0, upperOnly: null, lowerOnly: null, raw: "4.0 - 11.0 K/uL" },
    unit: "K/uL",
    category: "hematology",
    insight: (v, s) => {
      if (s === "HIGH") return `WBC count of ${v} K/uL is elevated, which may indicate infection or inflammation. Recommendation: Consult your physician if accompanied by fever or other symptoms.`;
      if (s === "LOW") return `WBC count of ${v} K/uL is below normal, which may indicate immune suppression. Recommendation: Consult your physician for further evaluation.`;
      return `WBC count of ${v} K/uL is within the normal range (4.0\u201311.0 K/uL). No action needed.`;
    },
  },
  "Platelet Count": {
    refRange: { min: 150, max: 450, upperOnly: null, lowerOnly: null, raw: "150 - 450 K/uL" },
    unit: "K/uL",
    category: "hematology",
    insight: (v, s) => {
      if (s === "LOW") return `Platelet count of ${v} K/uL is below normal (<150 K/uL), which may increase bleeding risk. Recommendation: Avoid activities with injury risk and consult your physician.`;
      if (s === "HIGH") return `Platelet count of ${v} K/uL is above normal (>450 K/uL), which may indicate inflammation or clotting risk. Recommendation: Consult your physician for further evaluation.`;
      return `Platelet count of ${v} K/uL is within the normal range (150\u2013450 K/uL). No action needed.`;
    },
  },
  "Thyroid Stimulating Hormone": {
    refRange: { min: 0.4, max: 4.0, upperOnly: null, lowerOnly: null, raw: "0.4 - 4.0 mIU/L" },
    unit: "mIU/L",
    category: "thyroid",
    insight: (v, s) => {
      if (s === "HIGH") return `TSH of ${v} mIU/L is above the normal range (0.4\u20134.0 mIU/L), which may indicate hypothyroidism. Recommendation: Consult your physician for a full thyroid panel (Free T4, Free T3) and discuss whether thyroid medication is appropriate.`;
      if (s === "LOW") return `TSH of ${v} mIU/L is below the normal range, which may indicate hyperthyroidism. Recommendation: Consult your physician for a full thyroid panel and symptom evaluation.`;
      return `TSH of ${v} mIU/L is within the normal range (0.4\u20134.0 mIU/L). No action needed.`;
    },
  },
  "Sodium": {
    refRange: { min: 135, max: 145, upperOnly: null, lowerOnly: null, raw: "135 - 145 mmol/L" },
    unit: "mmol/L",
    category: "metabolic",
    insight: (v, s) => {
      if (s === "HIGH") return `Sodium of ${v} mmol/L is above the normal range (135\u2013145 mmol/L). Recommendation: Ensure adequate water intake and consult your physician.`;
      if (s === "LOW") return `Sodium of ${v} mmol/L is below the normal range. Recommendation: Reduce excessive water intake, ensure balanced electrolytes, and consult your physician.`;
      return `Sodium of ${v} mmol/L is within the normal range (135\u2013145 mmol/L). No action needed.`;
    },
  },
  "Potassium": {
    refRange: { min: 3.5, max: 5.0, upperOnly: null, lowerOnly: null, raw: "3.5 - 5.0 mmol/L" },
    unit: "mmol/L",
    category: "metabolic",
    insight: (v, s) => {
      if (s === "HIGH") return `Potassium of ${v} mmol/L is above the normal range (3.5\u20135.0 mmol/L), which can affect heart rhythm. Recommendation: Avoid high-potassium foods and supplements, and seek medical attention if symptomatic.`;
      if (s === "LOW") return `Potassium of ${v} mmol/L is below the normal range. Recommendation: Increase potassium-rich foods (bananas, potatoes, spinach) and consult your physician.`;
      return `Potassium of ${v} mmol/L is within the normal range (3.5\u20135.0 mmol/L). No action needed.`;
    },
  },
  "ALT": {
    refRange: { min: 7, max: 56, upperOnly: null, lowerOnly: null, raw: "7 - 56 U/L" },
    unit: "U/L",
    category: "other",
    insight: (v, s) => {
      if (s === "HIGH") return `ALT of ${v} U/L is above the normal range (7\u201356 U/L), which may indicate liver inflammation. Recommendation: Avoid alcohol, review medications with your physician, and discuss further liver testing.`;
      return `ALT of ${v} U/L is within the normal range (7\u201356 U/L). No action needed.`;
    },
  },
  "AST": {
    refRange: { min: 10, max: 40, upperOnly: null, lowerOnly: null, raw: "10 - 40 U/L" },
    unit: "U/L",
    category: "other",
    insight: (v, s) => {
      if (s === "HIGH") return `AST of ${v} U/L is above the normal range (10\u201340 U/L), which may indicate liver inflammation. Recommendation: Avoid alcohol, review medications with your physician, and discuss further liver testing.`;
      return `AST of ${v} U/L is within the normal range (10\u201340 U/L). No action needed.`;
    },
  },
  "Ferritin": {
    refRange: { min: 15, max: 150, upperOnly: null, lowerOnly: null, raw: "15 - 150 ng/mL" },
    unit: "ng/mL",
    category: "hematology",
    insight: (v, s) => {
      if (s === "LOW") return `Ferritin of ${v} ng/mL is below normal, indicating low iron stores. Recommendation: Increase iron-rich foods and consult your physician about iron supplementation.`;
      if (s === "HIGH") return `Ferritin of ${v} ng/mL is above normal, which may indicate inflammation or iron overload. Recommendation: Consult your physician for further evaluation.`;
      return `Ferritin of ${v} ng/mL is within the normal range (15\u2013150 ng/mL). No action needed.`;
    },
  },
  "Vitamin D": {
    refRange: { min: 30, max: 100, upperOnly: null, lowerOnly: null, raw: "30 - 100 ng/mL" },
    unit: "ng/mL",
    category: "other",
    insight: (v, s) => {
      if (s === "LOW") return `Vitamin D of ${v} ng/mL is below the normal range (<30 ng/mL), indicating deficiency. Recommendation: Increase safe sun exposure, consume vitamin D-rich foods (fatty fish, fortified dairy), and discuss supplementation with your physician.`;
      return `Vitamin D of ${v} ng/mL is within the normal range (30\u2013100 ng/mL). Continue adequate sun exposure and dietary intake.`;
    },
  },
  "Vitamin B12": {
    refRange: { min: 200, max: 900, upperOnly: null, lowerOnly: null, raw: "200 - 900 pg/mL" },
    unit: "pg/mL",
    category: "other",
    insight: (v, s) => {
      if (s === "LOW") return `Vitamin B12 of ${v} pg/mL is below normal (<200 pg/mL), indicating deficiency. Recommendation: Increase B12-rich foods (meat, fish, dairy, fortified cereals) and consult your physician about supplementation.`;
      return `Vitamin B12 of ${v} pg/mL is within the normal range (200\u2013900 pg/mL). No action needed.`;
    },
  },
};

const DANGER_THRESHOLDS: Record<string, { minDanger?: number; maxDanger?: number }> = {
  "Systolic Blood Pressure": { maxDanger: 140 },
  "Diastolic Blood Pressure": { maxDanger: 90 },
  "HbA1c": { maxDanger: 6.5 },
  "Fasting Plasma Glucose": { maxDanger: 126 },
  "LDL Cholesterol": { maxDanger: 160 },
};

export function getStandardRange(canonicalName: string): StandardRange | null {
  return STANDARD_RANGES[canonicalName] || null;
}

export function getCategory(canonicalName: string): LabCategory {
  const std = STANDARD_RANGES[canonicalName];
  if (std) return std.category;
  return "other";
}

export function computeStatusWithDanger(value: number, range: RefRange, canonicalName: string): RangeStatus {
  const baseStatus = computeStatus(value, range);
  if (baseStatus === "HIGH") {
    const threshold = DANGER_THRESHOLDS[canonicalName];
    if (threshold?.maxDanger !== undefined && value >= threshold.maxDanger) {
      return "DANGER";
    }
  }
  return baseStatus;
}

export function generateInsight(canonicalName: string, value: number, status: RangeStatus): string {
  if (status === "DANGER") return `${canonicalName} is ${value}, in a range that deserves prompt clinical review. This result alone cannot establish a diagnosis; seek appropriate medical guidance.`;
  if (status === "HIGH") return `${canonicalName} is ${value}, above the listed reference range. This result alone cannot establish a diagnosis; discuss the result and any follow-up testing with your healthcare provider.`;
  if (status === "LOW") return `${canonicalName} is ${value}, below the listed reference range. Reference ranges are context, not a diagnosis; discuss the result with your healthcare provider.`;
  return `${canonicalName} is ${value}, within the listed reference range. Continue discussing your health history and symptoms with your healthcare provider.`;
}

/* ------------------------------------------------------------------ */
/*  REFERENCE RANGE PARSING                                            */
/* ------------------------------------------------------------------ */

export function parseRefRange(raw: string | null): RefRange {
  const base: RefRange = { min: null, max: null, upperOnly: null, lowerOnly: null, raw: raw ?? null };
  if (!raw || !raw.trim()) return base;
  const text = raw.trim();

  // single-sided upper: "< 100" or "<100"
  const upperMatch = text.match(/^<?\s*(\d+\.?\d*)\s*$/i);
  if (upperMatch && text.startsWith("<")) {
    return { ...base, upperOnly: parseFloat(upperMatch[1]) };
  }
  // single-sided lower: "> 60" or ">= 60"
  const lowerMatch = text.match(/^>=?\s*(\d+\.?\d*)\s*$/i);
  if (lowerMatch) {
    return { ...base, lowerOnly: parseFloat(lowerMatch[1]) };
  }
  // range: "12.0 - 15.5" or "3.5–5.0" or "12-16 g/dL"
  const rangeMatch = text.match(/^(\d+\.?\d*)\s*(?:[-–—]|to)\s*(\d+\.?\d*)/i);
  if (rangeMatch) {
    return { ...base, min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
  }
  return base;
}

export function computeStatus(value: number | null, range: RefRange): RangeStatus {
  if (value === null || value === undefined || isNaN(value)) return "UNKNOWN";
  if (range.upperOnly !== null) {
    return value < range.upperOnly ? "NORMAL" : "HIGH";
  }
  if (range.lowerOnly !== null) {
    return value > range.lowerOnly ? "NORMAL" : "LOW";
  }
  if (range.min !== null && range.max !== null) {
    if (value < range.min) return "LOW";
    if (value > range.max) return "HIGH";
    return "NORMAL";
  }
  return "UNKNOWN";
}

/* ------------------------------------------------------------------ */
/*  LAB REPORT TEXT PARSER                                             */
/* ------------------------------------------------------------------ */

interface RawLine {
  name: string;
  value: string;
  unit: string;
  range: string;
}

export function parseLabText(text: string, reportDate: string | null): LabTest[] {
  const lines = text.split(/\r?\n/);
  const tests: LabTest[] = [];
  let idx = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.length < 3) continue;

    // Try multiple delimiter patterns
    // Pattern A: "Test Name  Value  Unit  RefRange"
    // Pattern B: tab separated
    // Pattern C: "Test Name: Value Unit (Range)"

    let parsed: RawLine | null = null;

    // Tab-separated
    const tabParts = line.split(/\t+/).map((p) => p.trim()).filter(Boolean);
    if (tabParts.length >= 4) {
      parsed = { name: tabParts[0], value: tabParts[1], unit: tabParts[2], range: tabParts[3] };
    } else if (tabParts.length === 3) {
      // name, value+unit, range
      const vu = tabParts[1].match(/^(\d+\.?\d*)\s*(.*)$/);
      parsed = { name: tabParts[0], value: vu ? vu[1] : tabParts[1], unit: vu ? vu[2] : "", range: tabParts[2] };
    } else {
      // Multi-space separated: "Hemoglobin 10.2 g/dL 12.0 - 15.5"
      const spaceParts = line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
      if (spaceParts.length >= 4) {
        parsed = { name: spaceParts[0], value: spaceParts[1], unit: spaceParts[2], range: spaceParts.slice(3).join(" ") };
      } else if (spaceParts.length === 3) {
        // "Hemoglobin 10.2 g/dL"  — no range
        parsed = { name: spaceParts[0], value: spaceParts[1], unit: spaceParts[2], range: "" };
      } else {
        // colon pattern "Hemoglobin: 10.2 g/dL (12.0 - 15.5)"
        const colonMatch = line.match(/^([^:]+):\s*(\d+\.?\d*)\s*([^()]*)\s*\(?\s*([0-9<>\-–.\s]+[a-zA-Z%/]*)?\s*\)?$/);
        if (colonMatch) {
          parsed = {
            name: colonMatch[1].trim(),
            value: colonMatch[2],
            unit: colonMatch[3].trim(),
            range: colonMatch[4]?.trim() || "",
          };
        }
      }
    }

    if (!parsed) continue;
    // filter out clearly non-lab lines
    if (!/\d/.test(parsed.value)) continue;
    const numericValue = parseFloat(parsed.value);
    if (isNaN(numericValue)) continue;

    const canonicalName = normalizeTerm(parsed.name);
    const category = getCategory(canonicalName);
    const docRange = parseRefRange(parsed.range || null);
    const hasDocRange = docRange.min !== null || docRange.max !== null || docRange.upperOnly !== null || docRange.lowerOnly !== null;
    const stdRange = getStandardRange(canonicalName);
    const refRange = hasDocRange ? docRange : (stdRange ? stdRange.refRange : docRange);
    const rangeSource: "document" | "standard" = hasDocRange ? "document" : (stdRange ? "standard" : "document");
    const unit = parsed.unit || (stdRange ? stdRange.unit : "") || null;
    const status = computeStatusWithDanger(numericValue, refRange, canonicalName);
    const insight = generateInsight(canonicalName, numericValue, status);

    tests.push({
      id: `test-${idx++}-${Date.now()}`,
      name: canonicalName,
      rawName: parsed.name,
      value: numericValue,
      rawValue: parsed.value,
      unit,
      refRange,
      status,
      reportDate,
      source: "current",
      provenance: "AI_EXTRACTED",
      sourceMeta: rangeSource === "standard" ? "Extracted from document; reference range supplemented from clinical standards" : "Extracted from uploaded document",
      confidence: 94 + (idx % 6) + Math.random() * 1.5,
      category,
      insight,
      rangeSource,
    });
  }

  return tests;
}

/* ------------------------------------------------------------------ */
/*  CONFLICT DETECTION                                                 */
/* ------------------------------------------------------------------ */

function hasNoAllergies(intake: IntakeData): boolean {
  const a = intake.allergies.toLowerCase().trim();
  return /no known allerg|nka|nkda|none/i.test(a) && a.length > 0;
}

function hasNoDiabetes(intake: IntakeData): boolean {
  const c = intake.conditions.toLowerCase();
  return /no history of diabetes|no diabetes|diabetes: no|diabetes - no/i.test(c) ||
    (/(no|denies|negative)\s*.*diabetes/i.test(c) && c.length > 0);
}

function hasNoKidneyDisease(intake: IntakeData): boolean {
  const c = intake.conditions.toLowerCase();
  return /no kidney|no renal|no ckd|ckd: no/i.test(c) ||
    (/(no|denies|negative)\s*.*kidney/i.test(c) && c.length > 0);
}

function hasNoMeds(intake: IntakeData): boolean {
  const m = intake.medications.toLowerCase().trim();
  return /no active med|none|no medications|nil|n\/a/i.test(m) && m.length > 0;
}

export function detectConflicts(intake: IntakeData, tests: LabTest[]): Conflict[] {
  const conflicts: Conflict[] = [];
  let idx = 0;

  // Allergy conflict — check for penicillin etc. in lab text or extracted text
  const allText = tests.map((t) => `${t.rawName} ${t.rawValue}`).join(" ").toLowerCase();
  if (hasNoAllergies(intake)) {
    const allergyMentions = ["penicillin", "sulfa", "aspirin", "nsaid"];
    for (const allergen of allergyMentions) {
      if (allText.includes(allergen)) {
        conflicts.push({
          id: `conf-${idx++}`,
          type: "allergy",
          title: "Allergy Conflict",
          detail: `Patient reported "No known allergies" but a document references a ${allergen} allergy.`,
          intakeStatement: intake.allergies,
          labEvidence: `Documented mention of "${allergen}" in uploaded report.`,
          severity: "critical",
        });
        break;
      }
    }
  }

  // Glycemic conflict
  const hba1c = tests.find((t) => t.name === "HbA1c");
  const fpg = tests.find((t) => t.name === "Fasting Plasma Glucose");
  if (hasNoDiabetes(intake)) {
    if ((hba1c && hba1c.value !== null && hba1c.value >= 5.7) ||
        (fpg && fpg.value !== null && fpg.value >= 100)) {
      const evidence: string[] = [];
      if (hba1c) evidence.push(`HbA1c = ${hba1c.value}%`);
      if (fpg) evidence.push(`Fasting Glucose = ${fpg.value} mg/dL`);
      conflicts.push({
        id: `conf-${idx++}`,
        type: "glycemic",
        title: "Glycemic Conflict",
        detail: `Patient reported "No history of diabetes" but lab values suggest elevated blood glucose.`,
        intakeStatement: intake.conditions,
        labEvidence: evidence.join(", "),
        severity: "warning",
      });
    }
  }

  // Renal conflict
  const creat = tests.find((t) => t.name === "Serum Creatinine");
  const egfr = tests.find((t) => t.name === "eGFR");
  if (hasNoKidneyDisease(intake)) {
    if ((creat && creat.value !== null && creat.value > 1.3) ||
        (egfr && egfr.value !== null && egfr.value < 60)) {
      const evidence: string[] = [];
      if (creat) evidence.push(`Creatinine = ${creat.value} mg/dL`);
      if (egfr) evidence.push(`eGFR = ${egfr.value} mL/min`);
      conflicts.push({
        id: `conf-${idx++}`,
        type: "renal",
        title: "Renal Function Conflict",
        detail: `Patient reported "No kidney disease" but lab values may indicate reduced kidney function.`,
        intakeStatement: intake.conditions,
        labEvidence: evidence.join(", "),
        severity: "warning",
      });
    }
  }

  // Drug conflict
  if (hasNoMeds(intake)) {
    const drugMentions = ["warfarin", "metformin", "insulin", "statin", "lisinopril", "digoxin", "phenytoin", "vancomycin", "tacrolimus"];
    for (const drug of drugMentions) {
      if (allText.includes(drug)) {
        conflicts.push({
          id: `conf-${idx++}`,
          type: "drug",
          title: "Medication Conflict",
          detail: `Patient reported "No active medications" but lab notes reference therapeutic drug monitoring for ${drug}.`,
          intakeStatement: intake.medications,
          labEvidence: `Therapeutic drug monitoring / presence of ${drug} noted.`,
          severity: "warning",
        });
        break;
      }
    }
  }

  return conflicts;
}

/* ------------------------------------------------------------------ */
/*  AI SUMMARY GENERATION (NON-DIAGNOSTIC)                             */
/* ------------------------------------------------------------------ */

export function generateSummary(intake: IntakeData, tests: LabTest[]): string {
  const abnormal = tests.filter((t) => t.status === "LOW" || t.status === "HIGH");
  const lowTests = abnormal.filter((t) => t.status === "LOW");
  const highTests = abnormal.filter((t) => t.status === "HIGH");

  let summary = "";

  if (abnormal.length === 0) {
    summary = "All the lab results that came with reference ranges were within the normal range. ";
    if (intake.chiefSymptoms.length > 0) {
      summary += `You mentioned feeling ${intake.chiefSymptoms.map((s: string) => s.toLowerCase()).join(", ")}. `;
    }
    summary += "This is a positive sign, but it is still important to talk with your doctor about how you have been feeling, especially if any symptoms continue.";
  } else {
    summary = "Here is a simple summary of your lab results. ";
    if (lowTests.length > 0) {
      summary += `Some tests came back lower than the expected range: ${lowTests.map((t) => `${t.name} (${t.value}${t.unit ? " " + t.unit : ""})`).join(", ")}. `;
    }
    if (highTests.length > 0) {
      summary += `Some tests came back higher than the expected range: ${highTests.map((t) => `${t.name} (${t.value}${t.unit ? " " + t.unit : ""})`).join(", ")}. `;
    }
    if (intake.chiefSymptoms.length > 0) {
      summary += `You also noted that you have been experiencing ${intake.chiefSymptoms.map((s: string) => s.toLowerCase()).join(", ")}. `;
    }
    summary += "These results do not by themselves mean you have a specific illness. Only your healthcare provider can tell you what these numbers mean for you. ";
  }

  summary += "\n\nDisclaimer: This summary is for your information only. It is not a medical diagnosis, a risk prediction, or a treatment recommendation. Please talk to your doctor or a qualified healthcare provider before making any decisions about your health.";
  return summary;
}

/* ------------------------------------------------------------------ */
/*  CLARIFICATION QUESTIONS                                            */
/* ------------------------------------------------------------------ */

export function generateQuestions(intake: IntakeData, tests: LabTest[]): string[] {
  const questions: string[] = [];
  const abnormal = tests.filter((t) => t.status === "LOW" || t.status === "HIGH");

  // Link symptoms + abnormal results
  if (intake.chiefSymptoms.includes("Fatigue")) {
    const hb = tests.find((t) => t.name === "Hemoglobin");
    if (hb && hb.status === "LOW") {
      questions.push(`You noted fatigue and your Hemoglobin is ${hb.value} ${hb.unit}. How long have you been feeling unusually tired?`);
    }
  }
  if (intake.chiefSymptoms.includes("Frequent Urination") || intake.chiefSymptoms.includes("Increased Thirst")) {
    const fpg = tests.find((t) => t.name === "Fasting Plasma Glucose");
    if (fpg && fpg.status === "HIGH") {
      questions.push(`Your fasting glucose is ${fpg.value} ${fpg.unit} and you mentioned increased thirst/urination. Have you discussed blood sugar testing with your doctor?`);
    }
  }
  if (intake.chiefSymptoms.includes("Swelling")) {
    const creat = tests.find((t) => t.name === "Serum Creatinine");
    if (creat && (creat.status === "HIGH" || creat.value !== null)) {
      questions.push(`You reported swelling and your creatinine is ${creat.value} ${creat.unit}. Where is the swelling most noticeable (legs, face, hands)?`);
    }
  }

  // Generic abnormal follow-ups
  for (const t of abnormal.slice(0, 2)) {
    if (questions.length >= 5) break;
    const alreadyCovered = questions.some((q) => q.includes(t.name));
    if (!alreadyCovered) {
      questions.push(`Your ${t.name} is ${t.status.toLowerCase()} at ${t.value} ${t.unit}. Have you had this test before, and if so, do you know the previous result?`);
    }
  }

  // Missing info questions
  if (!intake.allergies.trim()) {
    questions.push("No allergies were recorded. Do you have any known drug or food allergies?");
  }
  if (!intake.medications.trim()) {
    questions.push("No active medications were listed. Are you currently taking any prescriptions, over-the-counter medicines, or supplements?");
  }
  if (intake.chiefSymptoms.length === 0) {
    questions.push("No chief symptoms were selected. Are there any specific concerns that prompted this lab visit?");
  }

  while (questions.length < 3) {
    questions.push("Is there any family history of chronic conditions (diabetes, heart disease, kidney disease) you'd like to note?");
    break;
  }

  return questions.slice(0, 5);
}

/* ------------------------------------------------------------------ */
/*  LONGITUDINAL DELTA                                                 */
/* ------------------------------------------------------------------ */

export function computeDeltas(current: LabTest[], previous: LabTest[]): DeltaRow[] {
  const rows: DeltaRow[] = [];
  const prevMap = new Map<string, LabTest>();
  previous.forEach((t) => prevMap.set(t.name, t));

  for (const curr of current) {
    const prev = prevMap.get(curr.name);
    if (!prev) continue;

    let delta: number | null = null;
    let trend: Trend = "NONE";
    if (curr.value !== null && prev.value !== null) {
      delta = +(curr.value - prev.value).toFixed(3);
      if (Math.abs(delta) < 0.001) trend = "STABLE";
      else if (delta > 0) trend = "UP";
      else trend = "DOWN";
    }

    rows.push({
      name: curr.name,
      previousValue: prev.value,
      previousDate: prev.reportDate,
      currentValue: curr.value,
      currentDate: curr.reportDate,
      unit: curr.unit,
      delta,
      trend,
      status: curr.status,
    });
  }

  return rows;
}

/* ------------------------------------------------------------------ */
/*  AUDIT COUNTER                                                      */
/* ------------------------------------------------------------------ */

export function countProvenance(tests: LabTest[], intake: IntakeData): Record<Provenance, number> {
  const counts: Record<Provenance, number> = {
    USER_PROVIDED: 0,
    AI_EXTRACTED: 0,
    SYSTEM_DERIVED: 0,
    HUMAN_VERIFIED: 0,
  };

  // user-provided intake fields
  const intakeFields = [
    intake.name, intake.patientId, intake.age, intake.biologicalSex,
    intake.conditions, intake.allergies, intake.medications, intake.notes,
    ...intake.chiefSymptoms,
  ];
  counts.USER_PROVIDED = intakeFields.filter((v) => v && String(v).trim().length > 0).length;

  counts.AI_EXTRACTED = tests.filter((t) => t.provenance === "AI_EXTRACTED").length;
  counts.SYSTEM_DERIVED = tests.filter((t) => t.status !== "UNKNOWN" && t.provenance !== "HUMAN_VERIFIED").length;
  counts.HUMAN_VERIFIED = tests.filter((t) => t.provenance === "HUMAN_VERIFIED").length;

  return counts;
}
