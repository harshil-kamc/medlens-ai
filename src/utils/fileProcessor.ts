import type { LabTest } from "../types";
import { parseLabText } from "../lib/medical";
import { isGeminiConfigured } from "../services/gemini";
import { fileToBase64, geminiOCR, geminiJsonToText } from "../lib/geminiOCR";

export type FileKind = "text" | "pdf" | "image";

export function detectFileKind(file: File): FileKind {
  if (file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image") || /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(file.name)) return "image";
  return "text";
}

async function fileToTextDirect(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read text file"));
    reader.readAsText(file);
  });
}

/**
 * Extract text from PDF using pdfjs-dist page iteration.
 * Returns empty string if the PDF has no text layer (scanned PDF).
 */
async function extractPdfText(file: File): Promise<string> {
  try {
    const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const textParts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: { str?: string }) => item.str || "")
        .join(" ");
      textParts.push(pageText);
    }
    return textParts.join("\n");
  } catch {
    return "";
  }
}

/**
 * Client-side OCR using Tesseract.js.
 * Extracts text directly from image files without any external API.
 */
async function tesseractOCR(file: File): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const result = await Tesseract.recognize(file, "eng");
  return result.data.text || "";
}

export interface ProcessedFile {
  tests: LabTest[];
  rawText: string;
  source: "text-parse" | "pdf-text" | "gemini" | "tesseract" | "empty";
  collectionDate: string | null;
  labId: string | null;
}

export interface ProcessCallbacks {
  onStatus?: (message: string) => void;
}

/**
 * Full file processing pipeline — NO dummy preset fallbacks:
 * 1. Text files -> read and parse directly
 * 2. PDFs -> try local pdfjs text extraction, then Gemini if text is thin, then Tesseract
 * 3. Images -> Base64 + Gemini multimodal OCR, then Tesseract.js fallback
 * 4. If all extraction fails, return empty result with an honest message
 */
export async function processFile(
  file: File,
  reportDate: string | null,
  kind: "current" | "previous",
  callbacks?: ProcessCallbacks
): Promise<ProcessedFile> {
  const fileKind = detectFileKind(file);
  const date = reportDate || new Date().toISOString().slice(0, 10);

  // 1. Text files: read and parse directly
  if (fileKind === "text") {
    const text = await fileToTextDirect(file);
    if (!text.trim()) {
      return {
        tests: [],
        rawText: `[${file.name}] — File appears to be empty. Please paste lab report text manually.`,
        source: "empty",
        collectionDate: date,
        labId: null,
      };
    }
    const tests = parseLabText(text, date).map((t) => ({ ...t, source: kind }));
    return { tests, rawText: text, source: "text-parse", collectionDate: date, labId: null };
  }

  // 2. PDF: try local text extraction first
  if (fileKind === "pdf") {
    callbacks?.onStatus?.("Extracting text from PDF...");
    const pdfText = await extractPdfText(file);
    if (pdfText.trim().length > 50) {
      const tests = parseLabText(pdfText, date).map((t) => ({ ...t, source: kind }));
      return { tests, rawText: pdfText, source: "pdf-text", collectionDate: date, labId: null };
    }
    // PDF has no text layer (scanned) — fall through to Gemini
  }

  // 3. PDF (scanned) or Image: Gemini multimodal OCR
  if (fileKind === "image") {
    callbacks?.onStatus?.("Running Optical Character Recognition (OCR) on uploaded image...");
  } else {
    callbacks?.onStatus?.("Running Gemini multimodal OCR on scanned PDF...");
  }

  if (isGeminiConfigured()) {
    try {
      const base64 = await fileToBase64(file);
      const mimeType = fileKind === "pdf" ? "application/pdf" : file.type || "image/png";
      const geminiResult = await geminiOCR(base64, mimeType);
      const textForParsing = geminiJsonToText(geminiResult);
      const tests = parseLabText(textForParsing, date).map((t) => ({
        ...t,
        source: kind,
        sourceMeta: "Extracted via Gemini multimodal OCR",
      }));
      if (tests.length > 0 || textForParsing.trim().length > 0) {
        return { tests, rawText: textForParsing, source: "gemini", collectionDate: date, labId: null };
      }
    } catch (err) {
      console.warn("Gemini OCR failed, falling back to Tesseract:", err);
    }
  }

  // 4. Tesseract.js fallback for images and scanned PDFs
  callbacks?.onStatus?.("Running local OCR engine (Tesseract.js)...");
  try {
    const ocrText = await tesseractOCR(file);
    if (ocrText.trim().length > 0) {
      const tests = parseLabText(ocrText, date).map((t) => ({
        ...t,
        source: kind,
        sourceMeta: "Extracted via Tesseract.js OCR",
      }));
      return { tests, rawText: ocrText, source: "tesseract", collectionDate: date, labId: null };
    }
  } catch (err) {
    console.warn("Tesseract OCR failed:", err);
  }

  // 5. All extraction methods failed — return honest empty result
  return {
    tests: [],
    rawText: `[${file.name}] — No text could be extracted from this file. The image may be unclear or the PDF may have no selectable text. Try uploading a clearer scan or paste the report text manually.`,
    source: "empty",
    collectionDate: date,
    labId: null,
  };
}
