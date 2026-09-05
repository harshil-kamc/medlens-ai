import { Download } from "lucide-react";
import type { Conflict, DeltaRow, IntakeData, LabTest } from "../types";

interface Props {
  intake: IntakeData;
  tests: LabTest[];
  deltas: DeltaRow[];
  conflicts: Conflict[];
  summary: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

export function ReportDownload({ intake, tests, deltas, conflicts, summary }: Props) {
  function downloadReport() {
    const abnormal = tests.filter((test) => test.status === "HIGH" || test.status === "LOW" || test.status === "DANGER");
    const chartWidth = 760;
    const chartHeight = 260;
    const values = deltas.flatMap((row) => [row.previousValue, row.currentValue]).filter((value): value is number => value !== null);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    const range = max - min || 1;
    const points = deltas.map((row, index) => {
      const x = deltas.length > 1 ? 70 + index * ((chartWidth - 100) / (deltas.length - 1)) : chartWidth / 2;
      const y = (value: number | null) => value === null ? null : 25 + (chartHeight - 65) - ((value - min) / range) * (chartHeight - 65);
      return { row, x, previousY: y(row.previousValue), currentY: y(row.currentValue) };
    });
    const line = (key: "previousY" | "currentY") => points.filter((point) => point[key] !== null).map((point, index) => `${index ? "L" : "M"} ${point.x} ${point[key]}`).join(" ");
    const chart = `<svg viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-label="Longitudinal comparison chart" width="100%"><path d="${line("previousY")}" fill="none" stroke="#64748b" stroke-width="2"/><path d="${line("currentY")}" fill="none" stroke="#0891b2" stroke-width="3"/>${points.map((point) => `<line x1="${point.x}" y1="${point.previousY ?? point.currentY}" x2="${point.x}" y2="${point.currentY ?? point.previousY}" stroke="#cbd5e1" stroke-dasharray="4 3"/>`).join("")}${points.map((point) => `<text x="${point.x}" y="${chartHeight - 20}" text-anchor="middle" font-size="9">${escapeHtml(point.row.name.slice(0, 14))}</text>`).join("")}</svg>`;
    const cards = abnormal.length ? abnormal.map((test) => `<article class="card"><h3>${escapeHtml(test.name)} <span class="status ${test.status.toLowerCase()}">${test.status}</span></h3><p class="value">${test.value ?? "—"} ${escapeHtml(test.unit || "")}</p><p>Reference: ${escapeHtml(test.refRange.raw || "Not printed")}</p><p>${escapeHtml(test.insight || "Review this result with your clinician.")}</p></article>`).join("") : "<p>No high, low, or danger results were found.</p>";
    const conflictSection = conflicts.length ? conflicts.map((conflict) => `<article class="card"><h3>${escapeHtml(conflict.title)} <span class="status warning">${escapeHtml(conflict.severity)}</span></h3><p>${escapeHtml(conflict.detail)}</p><p><strong>Intake:</strong> ${escapeHtml(conflict.intakeStatement)}</p><p><strong>Evidence:</strong> ${escapeHtml(conflict.labEvidence)}</p></article>`).join("") : "<p>No conflicts detected.</p>";
    const deltaSection = deltas.length ? `<div class="chart">${chart}</div>` : "<p>No matched previous results are available for a trend chart.</p>";
    const guidance = `<h2>What to do next</h2><ul><li>Review abnormal results with your primary care clinician and ask whether repeat testing is needed.</li><li>Discuss symptoms, medicines, supplements, and relevant history with your clinician.</li><li>Do not start, stop, or change treatment based on this report alone.</li><li>Seek urgent local medical help for severe or rapidly worsening symptoms.</li></ul>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>MedLens Health Report</title><style>body{font:14px Arial,sans-serif;color:#172033;max-width:900px;margin:0 auto;padding:32px;line-height:1.5}h1{color:#075985;border-bottom:2px solid #06b6d4;padding-bottom:10px}h2{margin-top:28px;color:#075985}.meta,.card,.chart{border:1px solid #dbe4ee;border-radius:10px;padding:14px;margin:10px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}.card h3{margin:0 0 6px}.value{font-size:24px;font-weight:bold;margin:4px 0}.status{font-size:11px;padding:3px 7px;border-radius:999px;background:#e2e8f0}.high,.danger{background:#ffe4e6;color:#be123c}.low{background:#fef3c7;color:#92400e}.warning{background:#fef3c7;color:#92400e}small{color:#64748b}</style></head><body><h1>MedLens Health Report</h1><div class="meta"><strong>Patient:</strong> ${escapeHtml(intake.name || "Not provided")}<br><strong>Generated:</strong> ${new Date().toLocaleString()}<br><small>Informational report only. Not a diagnosis or treatment recommendation.</small></div><h2>Summary</h2><p>${escapeHtml(summary).replace(/\n/g, "<br>")}</p>${guidance}<h2>High and Low Results</h2><div class="grid">${cards}</div><h2>Longitudinal Chart</h2>${deltaSection}<h2>Conflicts</h2>${conflictSection}<footer><small>Consult a qualified healthcare provider for interpretation and decisions about your care.</small></footer></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medlens-report-${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <button type="button" onClick={downloadReport} disabled={tests.length === 0} className="inline-flex items-center gap-2 rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-2 text-xs font-semibold text-brand-700 dark:text-brand-300 hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-3.5 w-3.5" /> Download Report</button>;
}