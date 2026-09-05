import type { LabTest } from "../types";
import { parseLabText, normalizeTerm, parseRefRange, computeStatus } from "./medical";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiRequestBody {
  contents: { parts: GeminiPart[] }[];
  generationConfig: { temperature: number; maxOutputTokens: number };
}

const OCR_PROMPT = `You are a clinical lab report OCR assistant. Analyze the provided document image and extract ALL lab test results.

For each test result, extract:
- name: The test name as printed (e.g. "Hemoglobin", "HbA1c", "Fasting Glucose")
- value: The numeric observed value (number only, no unit)
- unit: The unit of measurement (e.g. "g/dL", "mg/dL", "%", "mmol/L")
- range: The reference range as printed (e.g. "12.0 - 15.5", "< 100", "> 60", or empty if not printed)
- date: The report date if visible (YYYY-MM-DD format), or null

Return ONLY a JSON array of objects with this exact shape:
[{"name":"Hemoglobin","value":10.2,"unit":"g/dL","range":"12.0 - 15.5","date":null}]

Do not include any commentary, markdown, or explanation — only the JSON array.
If no reference range is printed for a test, use an empty string for range.
Do not invent or estimate reference ranges.`;

function getApiKey(): string | null {
  const env = import.meta.env;
  const key =
    (env.VITE_GEMINI_API_KEY as string | undefined) ||
    (env.VITE_GOOGLE_AI_KEY as string | undefined) ||
    null;
  return key;
}

export function isGeminiConfigured(): boolean {
  return getApiKey() !== null;
}

/**
 * Read a File as base64 data string.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      // data URI format: "data:mime;base64,XXXX"
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Read a text file as a plain string.
 */
export function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read text file"));
    reader.readAsText(file);
  });
}

/**
 * Detect file kind from type/extension.
 */
export function detectFileKind(file: File): "text" | "pdf" | "image" {
  if (file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image") || /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(file.name)) return "image";
  return "text";
}

/**
 * Call Gemini 1.5 Flash with a multimodal (inlineData) payload to perform OCR on a PDF/image.
 * Returns the extracted text in a structured format ready for parseLabText.
 */
export async function geminiOCR(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("No Gemini API key configured");
  }

  const body: GeminiRequestBody = {
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: OCR_PROMPT },
        ],
      },
    ],
    generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
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
  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return text;
}

/**
 * Convert Gemini JSON OCR response into a text format that parseLabText can consume.
 * The Gemini response might be a JSON array like:
 * [{"name":"Hemoglobin","value":10.2,"unit":"g/dL","range":"12.0 - 15.5","date":null}]
 * We convert each entry to a tab-separated line: "Name\tValue\tUnit\tRange"
 */
export function geminiJsonToText(geminiOutput: string): string {
  // Try to extract a JSON array from the response
  let jsonStr = geminiOutput.trim();

  // Strip markdown code fences if present
  jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  // Find the first '[' and last ']' to extract the array
  const start = jsonStr.indexOf("[");
  const end = jsonStr.lastIndexOf("]");
  if (start === -1 || end === -1) {
    // Not JSON — treat as plain text
    return geminiOutput;
  }

  jsonStr = jsonStr.slice(start, end + 1);

  try {
    const items = JSON.parse(jsonStr) as Array<{
      name?: string;
      value?: string | number;
      unit?: string;
      range?: string;
      date?: string | null;
    }>;

    const lines = items
      .filter((it) => it.name && it.value !== undefined && it.value !== null)
      .map((it) => {
        const name = String(it.name).trim();
        const value = String(it.value).trim();
        const unit = (it.unit || "").trim();
        const range = (it.range || "").trim();
        return `${name}\t${value}\t${unit}\t${range}`;
      });

    return lines.join("\n");
  } catch {
    // JSON parse failed — return raw text as fallback
    return geminiOutput;
  }
}

/**
 * Full pipeline: takes a File, routes to the right reader, calls Gemini for PDF/image,
 * then parses the result into LabTest[].
 *
 * Returns an object with the parsed tests and the raw text for display.
 */
export interface ProcessedFile {
  tests: LabTest[];
  rawText: string;
  source: "gemini" | "text-parse" | "fallback";
}

export async function processFile(
  file: File,
  reportDate: string | null,
  kind: "current" | "previous"
): Promise<ProcessedFile> {
  const fileKind = detectFileKind(file);

  // Text files: parse directly
  if (fileKind === "text") {
    const text = await fileToText(file);
    const tests = parseLabText(text, reportDate).map((t) => ({ ...t, source: kind }));
    return { tests, rawText: text, source: "text-parse" };
  }

  // PDF or Image: try Gemini OCR
  const apiKey = getApiKey();
  if (apiKey) {
    try {
      const base64 = await fileToBase64(file);
      const mimeType = fileKind === "pdf" ? "application/pdf" : file.type || "image/png";
      const geminiResult = await geminiOCR(base64, mimeType);
      const textForParsing = geminiJsonToText(geminiResult);
      const tests = parseLabText(textForParsing, reportDate).map((t) => ({
        ...t,
        source: kind,
        sourceMeta: "Extracted via Gemini multimodal OCR",
      }));
      return { tests, rawText: textForParsing, source: "gemini" };
    } catch (err) {
      // Gemini failed — fall through to fallback
      console.warn("Gemini OCR failed, using fallback:", err);
    }
  }

  // Fallback: return empty with a notice
  return {
    tests: [],
    rawText: `[Binary file: ${file.name}] — OCR unavailable. Use a preset case or paste text to load lab data.`,
    source: "fallback",
  };
}

export { parseLabText, normalizeTerm, parseRefRange, computeStatus };
