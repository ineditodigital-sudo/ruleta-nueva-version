import { SEAL, UT } from "./brand";
import type { Participant } from "./types";

const HEADERS = ["Nombre", "Correo", "Teléfono", "Resultado", "Premio", "Fecha", "Hora"];

const dateFmt = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" });

export const isWinner = (p: Participant) => !!p.prizeWon && p.prizeWon.isWin !== false;

const resultLabel = (p: Participant) => (p.prizeWon ? (isWinner(p) ? "Ganó" : "No ganó") : "Sin resultado");

const row = (p: Participant) => {
  const d = new Date(p.timestamp);
  return [
    p.name,
    p.email,
    p.phone,
    resultLabel(p),
    isWinner(p) ? (p.prizeWon?.name ?? "") : "",
    dateFmt.format(d),
    timeFmt.format(d),
  ];
};

const stamp = () => new Date().toISOString().slice(0, 10);

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * CSV con punto y coma y BOM: Excel en español lo abre con columnas y acentos
 * correctos sin pasar por el asistente de importación.
 */
export function exportLeadsCsv(participants: Participant[]) {
  // Un valor que empieza con = + - @ se ejecutaría como fórmula en Excel.
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [HEADERS, ...participants.map(row)].map((r) => r.map(cell).join(";"));
  download(
    new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }),
    `leads-ruleta-uta-${stamp()}.csv`,
  );
}

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

async function sealDataUrl(): Promise<string> {
  try {
    const res = await fetch(SEAL.png);
    if (!res.ok) return "";
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

/** Reporte imprimible (HTML autocontenido; Ctrl+P → Guardar como PDF). */
export async function exportLeadsReport(participants: Participant[], title: string) {
  const seal = await sealDataUrl();
  const winners = participants.filter(isWinner).length;
  const now = new Date();
  const body = participants
    .map((p) => {
      const cells = row(p);
      return `<tr>${cells
        .map((c, i) =>
          i === 3
            ? `<td><span class="tag ${c === "Ganó" ? "win" : "lose"}">${esc(c)}</span></td>`
            : `<td${i >= 5 ? ' class="num"' : ""}>${esc(c)}</td>`,
        )
        .join("")}</tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<title>Leads ${esc(title)} — ${stamp()}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 14mm; }
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 18px; background: #fff; font-family: 'Montserrat', system-ui, sans-serif; color: ${UT.ink};
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @media print { body { padding: 0; } }
  header { background: linear-gradient(120deg, ${UT.ink}, ${UT.inkSoft}); color: ${UT.paper}; padding: 18px 24px; border-radius: 14px;
    display: flex; align-items: center; gap: 18px; border-bottom: 3px solid ${UT.copper}; }
  header img { width: 64px; height: 64px; }
  header .who { flex: 1; line-height: 1.25; }
  header .who b { display: block; font-size: 15px; letter-spacing: .04em; }
  header .who span { font-size: 11px; color: ${UT.copperBright}; letter-spacing: .14em; text-transform: uppercase; }
  .meta { text-align: right; font-size: 11px; line-height: 1.6; opacity: .8; }
  h1 { font-size: 19px; margin: 26px 0 2px; letter-spacing: -.02em; }
  .sub { font-size: 12px; color: #5b667f; margin: 0 0 18px; }
  .stats { display: flex; gap: 10px; margin: 0 0 20px; }
  .stat { flex: 1; border: 1px solid #dfe4ee; border-top: 3px solid ${UT.blue}; border-radius: 9px; padding: 12px 14px; }
  .stat:nth-child(2) { border-top-color: ${UT.copper}; }
  .stat b { display: block; font-size: 24px; letter-spacing: -.03em; }
  .stat span { font-size: 10px; text-transform: uppercase; letter-spacing: .12em; color: #6b7690; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th { background: ${UT.ink}; color: ${UT.paper}; text-align: left; padding: 9px 10px; font-size: 9px;
    text-transform: uppercase; letter-spacing: .1em; }
  thead th:first-child { border-radius: 7px 0 0 0; }
  thead th:last-child { border-radius: 0 7px 0 0; }
  tbody td { padding: 8px 10px; border-bottom: 1px solid #e8ecf4; }
  tbody tr:nth-child(even) { background: #f6f8fc; }
  td.num { font-variant-numeric: tabular-nums; white-space: nowrap; }
  .tag { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 10px; font-weight: 700; }
  .tag.win { background: ${UT.copper}; color: ${UT.ink}; }
  .tag.lose { background: #e4e9f2; color: #5b667f; }
  .empty { padding: 40px; text-align: center; color: #6b7690; font-size: 13px; }
  footer { margin-top: 18px; font-size: 9.5px; color: #8590a6; text-align: center; }
  .hint { margin-top: 22px; padding: 9px; border: 1px dashed #c8d0e0; border-radius: 7px; font-size: 10.5px; color: #5b667f; }
  @media print { .hint { display: none; } }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
</style></head>
<body>
  <header>
    ${seal ? `<img src="${seal}" alt="">` : ""}
    <div class="who"><b>UNIVERSIDAD TECNOLÓGICA DE AGUASCALIENTES</b><span>${esc(title)}</span></div>
    <div class="meta">Reporte de participantes<br>${dateFmt.format(now)} · ${timeFmt.format(now)}</div>
  </header>
  <h1>Participantes de la ruleta</h1>
  <p class="sub">${esc(title)}</p>
  <div class="stats">
    <div class="stat"><b>${participants.length}</b><span>Participantes</span></div>
    <div class="stat"><b>${winners}</b><span>Ganadores</span></div>
    <div class="stat"><b>${participants.length - winners}</b><span>Sin premio</span></div>
  </div>
  ${
    participants.length
      ? `<table><thead><tr>${HEADERS.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>`
      : '<div class="empty">Todavía no hay participantes registrados.</div>'
  }
  <footer class="hint">Para guardarlo en PDF: Ctrl+P (⌘+P en Mac) → Destino: Guardar como PDF</footer>
  <footer>Generado por ${esc(title)} · Documento interno con datos personales: trátalo conforme al aviso de privacidad.</footer>
</body></html>`;

  download(new Blob([html], { type: "text/html;charset=utf-8" }), `reporte-leads-uta-${stamp()}.html`);
}
