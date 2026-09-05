import type { IntakeData, LabTest } from "../types";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiRequestBody {
  contents: { role: string; parts: GeminiPart[] }[];
  generationConfig: { temperature: number; maxOutputTokens: number };
  systemInstruction?: { parts: { text: string }[] };
}

function getApiKey(): string | null {
  const env = import.meta.env;
  const key =
    (env.VITE_GEMINI_API_KEY as string | undefined) ||
    (env.VITE_GOOGLE_AI_KEY as string | undefined) ||
    null;
  return key && key.trim().length > 0 ? key : null;
}

export function isGeminiConfigured(): boolean {
  return getApiKey() !== null;
}

export interface ClinicalReportResult {
  collectionDate: string | null;
  labId: string | null;
  results: Array<{
    testName: string;
    value: number | string;
    unit: string;
    referenceRange: string;
  }>;
}

const REPORT_SYSTEM_INSTRUCTION = `You are a clinical lab report OCR assistant integrated into a medical record system.
Your job is to extract structured data from clinical lab reports with maximum accuracy.
SAFETY: Do NOT invent, estimate, or fabricate reference ranges. If a range is not printed, return an empty string.
Do NOT interpret results or provide medical opinions.`;

const REPORT_OCR_PROMPT = `Analyze this clinical lab report and extract ALL test results.

Return ONLY a JSON object with this exact shape (no markdown, no commentary):
{
  "collectionDate": "YYYY-MM-DD or null",
  "labId": "Lab identifier or null",
  "results": [
    { "testName": "Hemoglobin", "value": 10.2, "unit": "g/dL", "referenceRange": "12.0 - 15.5" }
  ]
}

Rules:
- testName: The test name exactly as printed on the report.
- value: The numeric observed value (number only, no unit suffix).
- unit: The unit of measurement (e.g. "g/dL", "mg/dL", "%", "mmol/L"). Empty string if none.
- referenceRange: The reference range exactly as printed (e.g. "12.0 - 15.5", "< 100", "> 60"). Empty string if not printed.
- Do NOT invent or estimate reference ranges.`;

const SUMMARY_SYSTEM_INSTRUCTION = `You are a patient communication assistant for a medical record platform.
You write plain-language summaries of lab results at a 6th-grade reading level.

MANDATORY SAFETY GUARDRAILS:
- You MUST NOT diagnose diseases or conditions.
- You MUST NOT prescribe or recommend treatments, medications, or lifestyle changes.
- You MUST NOT use alarming language or predict risk.
- You MUST include the medical disclaimer in every response.
- You are NOT a doctor. You help patients prepare questions for their healthcare provider.`;

/**
 * Parse a clinical report — either from extracted text or from a Base64 image/PDF.
 * When isBase64 is true, sends inlineData to Gemini for multimodal vision OCR.
 * When isBase64 is false, sends the extracted text directly.
 */
export async function parseClinicalReport(
  content: string,
  isBase64: boolean,
  mimeType?: string
): Promise<ClinicalReportResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("No Gemini API key configured");
  }

  const parts: GeminiPart[] = [];
  if (isBase64 && mimeType) {
    parts.push({ inlineData: { mimeType, data: content } });
  }
  parts.push({ text: REPORT_OCR_PROMPT });
  if (!isBase64) {
    parts.unshift({ text: `Extract lab results from this report text:\n\n${content}` });
  }

  const body: GeminiRequestBody = {
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
    systemInstruction: { parts: [{ text: REPORT_SYSTEM_INSTRUCTION }] },
  };

  const resp = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`Gemini API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return parseReportJson(text);
}

function parseReportJson(raw: string): ClinicalReportResult {
  let jsonStr = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = jsonStr.indexOf("{");
  const end = jsonStr.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return { collectionDate: null, labId: null, results: [] };
  }
  jsonStr = jsonStr.slice(start, end + 1);
  try {
    const parsed = JSON.parse(jsonStr) as ClinicalReportResult;
    return {
      collectionDate: parsed.collectionDate || null,
      labId: parsed.labId || null,
      results: Array.isArray(parsed.results) ? parsed.results : [],
    };
  } catch {
    return { collectionDate: null, labId: null, results: [] };
  }
}

/**
 * Convert ClinicalReportResult into tab-separated text for the existing parser.
 */
export function reportResultToText(result: ClinicalReportResult): string {
  return result.results
    .filter((r) => r.testName && r.value !== undefined && r.value !== null)
    .map((r) => `${r.testName}\t${r.value}\t${r.unit || ""}\t${r.referenceRange || ""}`)
    .join("\n");
}

export interface PatientSummaryResult {
  summary: string;
  questions: string[];
}

/**
 * Generate a 6th-grade-level patient summary and 3-5 clarification questions.
 * Includes mandatory medical disclaimer. Does NOT diagnose or prescribe.
 */
export async function generatePatientSummary(
  intake: IntakeData,
  labs: LabTest[]
): Promise<PatientSummaryResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("No Gemini API key configured");
  }

  const labSummary = labs
    .map((t) => `- ${t.name}: ${t.value ?? "N/A"} ${t.unit || ""} (ref: ${t.refRange.raw || "N/A"}, status: ${t.status})`)
    .join("\n");

  const symptoms = intake.chiefSymptoms.length > 0
    ? intake.chiefSymptoms.join(", ")
    : "None reported";
  const conditions = intake.conditions || "None reported";
  const medications = intake.medications || "None reported";
  const allergies = intake.allergies || "None reported";

  const prompt = `Create a patient-friendly lab result summary and clarification questions.

Patient context:
- Name: ${intake.name || "Patient"}
- Age: ${intake.age || "Unknown"}
- Symptoms: ${symptoms}
- Known conditions: ${conditions}
- Medications: ${medications}
- Allergies: ${allergies}

Lab results:
${labSummary}

Return ONLY a JSON object (no markdown, no commentary):
{
  "summary": "A 2-3 paragraph plain-language summary at a 6th-grade reading level explaining what the tests show. Include the medical disclaimer.",
  "questions": ["3-5 practical questions the patient should ask their doctor at the next visit"]
}

The summary MUST end with this disclaimer:
"Disclaimer: This summary is for your information only. It is not a medical diagnosis or treatment recommendation. Please talk to your doctor before making any health decisions."`;

  const body: GeminiRequestBody = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    systemInstruction: { parts: [{ text: SUMMARY_SYSTEM_INSTRUCTION }] },
  };

  const resp = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`Gemini API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return parseSummaryJson(text);
}

function parseSummaryJson(raw: string): PatientSummaryResult {
  let jsonStr = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = jsonStr.indexOf("{");
  const end = jsonStr.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return { summary: raw, questions: [] };
  }
  jsonStr = jsonStr.slice(start, end + 1);
  try {
    const parsed = JSON.parse(jsonStr) as PatientSummaryResult;
    return {
      summary: parsed.summary || raw,
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
    };
  } catch {
    return { summary: raw, questions: [] };
  }
}
