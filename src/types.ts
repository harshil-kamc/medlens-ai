export type Provenance = "USER_PROVIDED" | "AI_EXTRACTED" | "SYSTEM_DERIVED" | "HUMAN_VERIFIED";

export type RangeStatus = "LOW" | "NORMAL" | "HIGH" | "UNKNOWN";

export type Trend = "UP" | "DOWN" | "STABLE" | "NONE";

export type ThemeMode = "dark" | "light";

export type Role = "clinician" | "patient";

export interface User {
  name: string;
  id: string;
  role: Role;
  email: string;
  avatar: string;
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  user: string;
  role: Role;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

export interface SavedProfile {
  id: string;
  savedAt: number;
  intake: IntakeData;
  testCount: number;
  label: string;
}

export interface RefRange {
  min: number | null;
  max: number | null;
  upperOnly: number | null;
  lowerOnly: number | null;
  raw: string | null;
}

export interface LabTest {
  id: string;
  name: string;
  rawName?: string;
  value: number | null;
  rawValue?: string;
  unit: string | null;
  refRange: RefRange;
  status: RangeStatus;
  reportDate: string | null;
  source: "current" | "previous";
  provenance: Provenance;
  sourceMeta?: string;
  confidence?: number;
}

export interface Conflict {
  id: string;
  type: "allergy" | "glycemic" | "renal" | "drug";
  title: string;
  detail: string;
  intakeStatement: string;
  labEvidence: string;
  severity: "critical" | "warning";
}

export interface IntakeData {
  name: string;
  patientId: string;
  age: string;
  biologicalSex: string;
  chiefSymptoms: string[];
  conditions: string;
  allergies: string;
  medications: string;
  notes: string;
}

export interface DeltaRow {
  name: string;
  previousValue: number | null;
  previousDate: string | null;
  currentValue: number | null;
  currentDate: string | null;
  unit: string | null;
  delta: number | null;
  trend: Trend;
  status: RangeStatus;
}

export interface ParsedDocument {
  filename: string;
  kind: "current" | "previous";
  format: "text" | "pdf" | "image";
  rawText: string;
}
