import { describe, expect, it } from "vitest";
import {
  computeDeltas,
  detectConflicts,
  generateSummary,
  generateInsight,
  normalizeTerm,
  parseLabText,
} from "../lib/medical";
import { MAX_UPLOAD_BYTES, processFile } from "../utils/fileProcessor";
import type { IntakeData, LabTest } from "../types";

const intake: IntakeData = {
  name: "Jordan Lee",
  patientId: "PT-00001",
  age: "45",
  biologicalSex: "Male",
  chiefSymptoms: [],
  conditions: "No history of diabetes",
  allergies: "No known allergies",
  medications: "None",
  notes: "",
};

function labTest(overrides: Partial<LabTest>): LabTest {
  return {
    id: "test-id",
    name: "Fasting Plasma Glucose",
    value: 114,
    unit: "mg/dL",
    refRange: { min: 70, max: 100, upperOnly: null, lowerOnly: null, raw: "70 - 100 mg/dL" },
    status: "HIGH",
    reportDate: "2025-01-01",
    source: "current",
    provenance: "SYSTEM_DERIVED",
    ...overrides,
  };
}

describe("production clinical engine", () => {
  it("normalizes common laboratory terminology", () => {
    expect(normalizeTerm("  fasting glucose ")).toBe("Fasting Plasma Glucose");
    expect(normalizeTerm("HbA1c")).toBe("HbA1c");
  });

  it("parses lab values, units, and reference ranges", () => {
    const tests = parseLabText("Hemoglobin  10.2  g/dL  12.0 - 15.5", "2025-01-01");

    expect(tests).toHaveLength(1);
    expect(tests[0]).toMatchObject({
      name: "Hemoglobin",
      value: 10.2,
      unit: "g/dL",
      status: "LOW",
      reportDate: "2025-01-01",
    });
  });

  it("detects a glycemic conflict from production data", () => {
    const conflicts = detectConflicts(intake, [labTest({ name: "Fasting Plasma Glucose" })]);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ type: "glycemic", severity: "warning" });
  });

  it("does not report a glycemic conflict for an in-range result", () => {
    const conflicts = detectConflicts(intake, [labTest({ value: 85, status: "NORMAL" })]);

    expect(conflicts).toHaveLength(0);
  });

  it("computes longitudinal deltas and trends", () => {
    const previous = labTest({ value: 90, source: "previous", reportDate: "2024-01-01" });
    const current = labTest({ value: 114, source: "current" });
    const [delta] = computeDeltas([current], [previous]);

    expect(delta).toMatchObject({ previousValue: 90, currentValue: 114, delta: 24, trend: "UP" });
  });

  it("keeps summaries informational and non-diagnostic", () => {
    const summary = generateSummary(intake, [labTest({ value: 85, status: "NORMAL" })]);

    expect(summary).toContain("not a medical diagnosis");
    expect(summary).toContain("healthcare provider");
  });

  it("keeps result insights informational", () => {
    const insight = generateInsight("Fasting Plasma Glucose", 126, "DANGER");

    expect(insight).toContain("cannot establish a diagnosis");
    expect(insight).not.toContain("Recommendation:");
  });

  it("rejects uploads larger than the processing limit", async () => {
    const largeFile = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "large.txt", { type: "text/plain" });

    await expect(processFile(largeFile, null, "current")).rejects.toThrow("too large");
  });
});
