import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { LoginView } from "../components/LoginView";
import { ReportDownload } from "../components/ReportDownload";
import type { IntakeData } from "../types";

expect.extend(toHaveNoViolations);

const intake: IntakeData = {
  name: "Jordan Lee",
  patientId: "PT-00001",
  age: "45",
  biologicalSex: "Male",
  chiefSymptoms: [],
  conditions: "",
  allergies: "",
  medications: "",
  notes: "",
};

const testResult = {
  id: "test-1",
  name: "Hemoglobin",
  value: 10.2,
  unit: "g/dL",
  refRange: { min: 12, max: 15.5, upperOnly: null, lowerOnly: null, raw: "12.0 - 15.5" },
  status: "LOW" as const,
  reportDate: "2025-01-01",
  source: "current" as const,
  provenance: "SYSTEM_DERIVED" as const,
};

describe("accessible user workflows", () => {
  it("has no automated accessibility violations on the login view", async () => {
    const { container } = render(<LoginView onLogin={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("provides labeled login controls and keyboard-friendly role selection", () => {
    const onLogin = vi.fn();
    render(<LoginView onLogin={onLogin} />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("demo@medlens.local")).toBeInTheDocument();
    expect(screen.getByText("MedLens2026!")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "demo@medlens.local" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "MedLens2026!" } });

    fireEvent.submit(screen.getByRole("button", { name: /Sign In to Portal/i }).closest("form")!);
    expect(onLogin).toHaveBeenCalledOnce();
  });

  it("keeps report download disabled until lab data exists", () => {
    const { rerender } = render(<ReportDownload intake={intake} tests={[]} deltas={[]} conflicts={[]} summary="Summary" />);
    expect(screen.getByRole("button", { name: /Download Report/i })).toBeDisabled();

    rerender(<ReportDownload intake={intake} tests={[testResult]} deltas={[]} conflicts={[]} summary="Summary" />);
    expect(screen.getByRole("button", { name: /Download Report/i })).toBeEnabled();
  });
});
