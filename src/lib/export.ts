import { analyzeLeads } from "./leads";
import type { BrandConfig, Participant } from "./types";

export const isWinner = (p: Participant) => !!p.prizeWon && p.prizeWon.isWin !== false;

export const fileStamp = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(),
  );

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export const CSV_HEADERS = [
  "#",
  "Fecha",
  "Día",
  "Hora",
  "Nombre",
  "Correo",
  "Teléfono",
  "Resultado",
  "Premio",
  "Contacto confiable",
  "Correo sugerido",
  "Observaciones",
];

/**
 * CSV limpio y anotado: orden cronológico, nombres con mayúsculas, teléfono en
 * 10 dígitos y columnas para filtrar los contactos confiables.
 *
 * Separado por comas y con BOM: Excel en español de México, Google Sheets,
 * Mailchimp y los CRM lo abren en columnas y con acentos correctos.
 */
export function exportLeadsCsv(participants: Participant[]) {
  const { rows } = analyzeLeads(participants);
  // Un valor que empieza con = + - @ se ejecutaría como fórmula en Excel.
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    CSV_HEADERS,
    ...rows.map((r) => [
      r.n,
      r.date,
      r.dayName,
      r.time,
      r.name,
      r.email,
      r.phone,
      r.win ? "Ganó" : "No ganó",
      r.prize,
      r.reliable ? "Sí" : "No",
      r.suggest,
      r.obs.join(" · "),
    ]),
  ].map((r) => r.map(cell).join(","));
  download(new Blob(["﻿" + lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" }), `leads-ruleta-uta-${fileStamp()}.csv`);
}

/** Excel con diseño UTA. La librería (≈860 KB) se descarga sólo al usarlo. */
export async function exportLeadsXlsx(participants: Participant[], brand: BrandConfig) {
  const { buildLeadsWorkbook } = await import("./exportXlsx");
  const blob = await buildLeadsWorkbook(analyzeLeads(participants), brand);
  download(blob, `leads-ruleta-uta-${fileStamp()}.xlsx`);
}

/** Reporte PDF: abre el diálogo de impresión con el reporte listo (Guardar como PDF). */
export async function exportLeadsPdf(participants: Participant[], brand: BrandConfig) {
  const { buildReportHtml, printHtml } = await import("./reportPdf");
  const title = `reporte-participantes-ruleta-uta-${fileStamp()}`;
  await printHtml(buildReportHtml(analyzeLeads(participants), brand, title), title);
}
