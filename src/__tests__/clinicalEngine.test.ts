import { describe, it, expect } from "vitest";

// 1. Deterministic Range Evaluator
export function evaluateReferenceRange(
  value: number,
  rangeStr: string
): "HIGH" | "LOW" | "NORMAL" | "UNKNOWN" {
  if (!rangeStr || rangeStr.trim() === "" || rangeStr.toLowerCase().includes("no reference")) {
    return "UNKNOWN";
  }

  const cleanRange = rangeStr.trim();

  // Single-sided inequality bounds: < X
  if (cleanRange.startsWith("<")) {
    const max = parseFloat(cleanRange.replace("<", "").trim());
    return value < max ? "NORMAL" : "HIGH";
  }

  // Single-sided inequality bounds: > X
  if (cleanRange.startsWith(">")) {
    const min = parseFloat(cleanRange.replace(">", "").trim());
    return value > min ? "NORMAL" : "LOW";
  }

  // Standard Range: Min - Max
  if (cleanRange.includes("-")) {
    const [minStr, maxStr] = cleanRange.split("-");
    const min = parseFloat(minStr.trim());
    const max = parseFloat(maxStr.trim());

    if (isNaN(min) || isNaN(max)) return "UNKNOWN";
    if (value < min) return "LOW";
    if (value > max) return "HIGH";
    return "NORMAL";
  }

  return "UNKNOWN";
}

// 2. Terminology Normalization Engine
export function normalizeTestName(rawName: string): string {
  const normalized = rawName.trim().toLowerCase();
  if (normalized === "hgb" || normalized === "hb") return "Hemoglobin";
  if (normalized === "cr" || normalized === "creat") return "Serum Creatinine";
  if (normalized.includes("glucose") || normalized === "fbg") return "Fasting Plasma Glucose";
  if (normalized === "a1c" || normalized.includes("hba1c")) return "Hemoglobin A1c";
  return rawName;
}

// 3. Heuristic Conflict Engine
export function detectGlycemicConflict(
  selfReportedNotes: string,
  glucoseVal?: number,
  hba1cVal?: number
): boolean {
  const claimsNoDiabetes =
    selfReportedNotes.toLowerCase().includes("no history of diabetes") ||
    selfReportedNotes.toLowerCase().includes("none");
  const hasElevatedGlucose =
    (glucoseVal !== undefined && glucoseVal > 100) ||
    (hba1cVal !== undefined && hba1cVal > 5.7);

  return claimsNoDiabetes && hasElevatedGlucose;
}

// ================================================================
// AUTOMATED TEST SUITE
// ================================================================
describe("MedLens Clinical Engine Unit Tests", () => {
  it("evaluates single-sided upper bounds (< 100) correctly", () => {
    expect(evaluateReferenceRange(128, "< 100")).toBe("HIGH");
    expect(evaluateReferenceRange(85, "< 100")).toBe("NORMAL");
  });

  it("evaluates single-sided lower bounds (> 60) correctly", () => {
    expect(evaluateReferenceRange(94, "> 60")).toBe("NORMAL");
    expect(evaluateReferenceRange(45, "> 60")).toBe("LOW");
  });

  it("evaluates standard ranges (4.0 - 5.6) correctly", () => {
    expect(evaluateReferenceRange(6.2, "4.0 - 5.6")).toBe("HIGH");
    expect(evaluateReferenceRange(4.8, "4.0 - 5.6")).toBe("NORMAL");
    expect(evaluateReferenceRange(3.2, "4.0 - 5.6")).toBe("LOW");
  });

  it("returns UNKNOWN for missing ranges without inventing bounds", () => {
    expect(evaluateReferenceRange(12, "")).toBe("UNKNOWN");
    expect(evaluateReferenceRange(12, "No reference range on source")).toBe("UNKNOWN");
  });

  it("normalizes clinical laboratory terminology", () => {
    expect(normalizeTestName("Hb")).toBe("Hemoglobin");
    expect(normalizeTestName("HGB")).toBe("Hemoglobin");
    expect(normalizeTestName("Cr")).toBe("Serum Creatinine");
    expect(normalizeTestName("FBG")).toBe("Fasting Plasma Glucose");
  });

  it("triggers conflict alert when intake claims No Diabetes but Glucose/HbA1c is high", () => {
    const intake =
      "None (Self-reports no history of diabetes, elevated blood sugar, thyroid dysfunction, or kidney disease).";
    expect(detectGlycemicConflict(intake, 114, 6.2)).toBe(true);
    expect(detectGlycemicConflict(intake, 85, 5.2)).toBe(false);
  });
});
