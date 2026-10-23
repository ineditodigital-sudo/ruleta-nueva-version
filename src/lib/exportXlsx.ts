/**
 * Excel con diseño UTA: Resumen (fórmulas vivas), Leads (filtros y colores) y
 * Para revisar. Las fórmulas llevan además su resultado calculado, así que se
 * ven bien aunque el programa no recalcule al abrir.
 */
import ExcelJS from "exceljs";
import { SEAL } from "./brand";
import { CSV_HEADERS } from "./export";
import type { LeadRow, LeadSummary } from "./leads";
import type { BrandConfig } from "./types";

const INK = "FF071A2E", BLUE = "FF0060A0", COPPER = "FFE4A57B", COPPER_L = "FFF6E3D5", LINE = "FFDCE3EC";
const MUTED = "FF536179", TEXT = "FF0B2440", AMBER = "FF8A5A00", AMBER_L = "FFFFF4E0", ZEBRA = "FFF7F9FC";

const font = (o: Partial<ExcelJS.Font> = {}): Partial<ExcelJS.Font> => ({ name: "Arial", size: 10, color: { argb: TEXT }, ...o });
const fill = (argb: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const bottom = (argb = LINE, style: ExcelJS.BorderStyle = "thin"): Partial<ExcelJS.Borders> => ({ bottom: { style, color: { argb } } });
const colLetter = (n: number) => {
  let s = "";
  for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

async function sealBase64(brand: BrandConfig): Promise<{ base64: string; extension: "png" | "jpeg" } | null> {
  // Logo propio sólo si es PNG/JPEG en data URL; si no, el sello oficial.
  const custom = brand.logoUrl?.trim();
  if (custom?.startsWith("data:image/png") || custom?.startsWith("data:image/jpeg")) {
    return { base64: custom, extension: custom.startsWith("data:image/png") ? "png" : "jpeg" };
  }
  try {
    const res = await fetch(SEAL.png);
    const buf = new Uint8Array(await res.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return { base64: `data:image/png;base64,${btoa(bin)}`, extension: "png" };
  } catch {
    return null;
  }
}

export async function buildLeadsWorkbook({ rows, summary: S }: { rows: LeadRow[]; summary: LeadSummary }, brand: BrandConfig) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Inédito Agencia Digital";
  wb.title = `${brand.systemName} · Participantes`;
  wb.calcProperties.fullCalcOnLoad = true;

  const rs = wb.addWorksheet("Resumen", { views: [{ showGridLines: false }] });
  const ws = wb.addWorksheet("Leads", { views: [{ state: "frozen", xSplit: 4, ySplit: 4, showGridLines: false }] });
  const pr = wb.addWorksheet("Para revisar", { views: [{ showGridLines: false }] });

  /* ------------------------------------------------------------- Leads */
  const TOP = 4;
  const widths = [6, 12, 11, 8, 36, 40, 15, 12, 18, 12, 32, 60];
  const center = new Set([1, 2, 3, 4, 7, 8, 10]);
  const last = TOP + rows.length;
  const nCols = CSV_HEADERS.length;
  ws.mergeCells(1, 1, 2, nCols);
  const t = ws.getCell(1, 1);
  t.value = `${brand.systemName} · Participantes y leads`;
  t.font = font({ bold: true, size: 16, color: { argb: "FFFFFFFF" } });
  t.fill = fill(INK);
  t.alignment = { vertical: "middle", indent: 1 };
  ws.mergeCells(3, 1, 3, nCols);
  const s3 = ws.getCell(3, 1);
  s3.value = `${brand.companyName} · ${S.dateRange} · Documento confidencial: contiene datos personales. "Contacto confiable" = correo y teléfono válidos que no comparte con otros nombres.`;
  s3.font = font({ size: 9, italic: true, color: { argb: MUTED } });
  s3.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 22;
  ws.getRow(2).height = 22;
  ws.getRow(3).height = 20;
  CSV_HEADERS.forEach((h, i) => {
    const c = ws.getCell(TOP, i + 1);
    c.value = h;
    c.font = font({ bold: true, color: { argb: "FFFFFFFF" } });
    c.fill = fill(BLUE);
    c.alignment = { vertical: "middle", horizontal: center.has(i + 1) ? "center" : "left", wrapText: true };
    ws.getColumn(i + 1).width = widths[i];
  });
  ws.getRow(TOP).height = 30;
  rows.forEach((r, i) => {
    const row = ws.getRow(TOP + 1 + i);
    const [d, m, y] = r.date.split("/").map(Number);
    const values = [
      r.n,
      new Date(Date.UTC(y, m - 1, d)),
      r.dayName,
      r.minutes / 1440,
      r.name,
      r.email,
      r.phone,
      r.win ? "Ganó" : "No ganó",
      r.prize || null,
      r.reliable ? "Sí" : "No",
      r.suggest || null,
      r.obs.join(" · ") || null,
    ];
    values.forEach((v, j) => {
      const c = row.getCell(j + 1);
      c.value = v as ExcelJS.CellValue;
      c.font = font();
      c.alignment = { vertical: "middle", horizontal: center.has(j + 1) ? "center" : "left" };
      c.border = bottom();
      if (i % 2) c.fill = fill(ZEBRA);
    });
    row.getCell(2).numFmt = "dd/mm/yyyy";
    row.getCell(4).numFmt = "hh:mm";
    row.getCell(11).font = font({ color: { argb: AMBER } });
    row.getCell(12).font = font({ size: 9, color: { argb: MUTED } });
  });
  if (rows.length) {
    ws.autoFilter = { from: { row: TOP, column: 1 }, to: { row: last, column: nCols } };
    ws.addConditionalFormatting({
      ref: `H${TOP + 1}:H${last}`,
      rules: [
        {
          type: "expression",
          priority: 1,
          formulae: [`$H${TOP + 1}="Ganó"`],
          style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COPPER_L } }, font: { bold: true, color: { argb: "FF7A4E33" } } },
        },
      ],
    });
    ws.addConditionalFormatting({
      ref: `J${TOP + 1}:J${last}`,
      rules: [
        {
          type: "expression",
          priority: 2,
          formulae: [`$J${TOP + 1}="No"`],
          style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: AMBER_L } }, font: { color: { argb: AMBER } } },
        },
        { type: "expression", priority: 3, formulae: [`$J${TOP + 1}="Sí"`], style: { font: { bold: true, color: { argb: BLUE } } } },
      ],
    });
  }
  ws.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: `${TOP}:${TOP}` };

  const end = Math.max(last, TOP + 1);
  const R = (col: string) => `Leads!$${col}$${TOP + 1}:$${col}$${end}`;
  const LD = R("B"), LT = R("D"), LE = R("F"), LP = R("G"), LR = R("H"), LC = R("J"), LS = R("K"), LO = R("L");

  /* ----------------------------------------------------------- Resumen */
  const dayCols = S.days.length;
  const widthsR = [3, 30, ...Array(Math.max(2, dayCols)).fill(14), 3, 34, 14];
  widthsR.forEach((w, i) => (rs.getColumn(i + 1).width = w));
  const qCol = 3 + Math.max(2, dayCols) + 1; // columna de "Calidad de los datos"
  const lastCol = qCol + 1;
  for (let r = 1; r <= 6; r++) for (let c = 1; c <= lastCol; c++) rs.getCell(r, c).fill = fill(INK);
  for (let c = 1; c <= lastCol; c++) rs.getCell(7, c).fill = fill(COPPER);
  rs.getRow(7).height = 4;
  const img = await sealBase64(brand);
  if (img) rs.addImage(wb.addImage(img), { tl: { col: 1, row: 1 }, ext: { width: 92, height: 92 } });
  const head = (r: number, v: string, f: Partial<ExcelJS.Font>) => {
    const c = rs.getCell(r, 3);
    c.value = v;
    c.font = font(f);
    c.alignment = { indent: 6 };
  };
  head(2, brand.companyName.toUpperCase(), { bold: true, size: 9, color: { argb: COPPER } });
  head(3, "Reporte de participantes", { bold: true, size: 20, color: { argb: "FFFFFFFF" } });
  head(4, `${brand.systemName} · ${S.dateRange}`, { size: 11, color: { argb: "FFB8C7D9" } });
  head(5, "Documento confidencial: contiene datos personales.", { size: 9, italic: true, color: { argb: "FF9FB2C8" } });
  rs.getRow(3).height = 28;

  const section = (r: number, c: number, title: string) => {
    const a = rs.getCell(r, c);
    a.value = title;
    a.font = font({ bold: true, size: 12, color: { argb: INK } });
    a.border = bottom(COPPER, "medium");
    rs.getCell(r, c + 1).border = bottom(COPPER, "medium");
  };
  const kv = (r: number, c: number, label: string, formula: string, result: number, fmt = "#,##0", strong = false) => {
    const a = rs.getCell(r, c);
    a.value = label;
    a.font = font({ color: { argb: strong ? INK : MUTED }, bold: strong });
    const b = rs.getCell(r, c + 1);
    b.value = { formula, result };
    b.numFmt = fmt;
    b.font = font({ bold: true, size: strong ? 12 : 11, color: { argb: INK } });
    b.alignment = { horizontal: "right" };
    a.border = b.border = bottom();
  };
  const pct = (a: number, b: number) => (b ? a / b : 0);

  section(9, 2, "Participación");
  kv(10, 2, "Registros totales", `COUNTA(${LR})`, S.total, "#,##0", true);
  kv(11, 2, "Ganaron", `COUNTIF(${LR},"Ganó")`, S.wins);
  kv(12, 2, "% que ganó", "IF(C10=0,0,C11/C10)", pct(S.wins, S.total), "0.0%");
  kv(13, 2, "No ganaron", `COUNTIF(${LR},"No ganó")`, S.total - S.wins);
  S.days.forEach((d, k) => {
    const [y, m, dd] = d.key.split("-").map(Number);
    kv(14 + k, 2, d.label, `COUNTIF(${LD},DATE(${y},${m},${dd}))`, d.count);
  });

  const Q = qCol;
  const qRef = (r: number) => `${colLetter(Q + 1)}${r}`;
  section(9, Q, "Calidad de los datos");
  kv(10, Q, "Contactos confiables", `COUNTIF(${LC},"Sí")`, S.reliable, "#,##0", true);
  kv(11, Q, "% confiables", `IF(C10=0,0,${qRef(10)}/C10)`, pct(S.reliable, S.total), "0.0%");
  kv(12, Q, "Correos con dominio mal escrito", `COUNTIF(${LS},"*@*")`, S.typoCount);
  kv(13, Q, "Teléfonos que no tienen 10 dígitos", `COUNTIF(${LO},"*Teléfono de *dígitos*")`, S.badPhone);
  kv(14, Q, "Registros con correo compartido", `COUNTIF(${LO},"*Correo usado por*")`, S.sharedEmailRecords);
  kv(15, Q, "Registros con teléfono compartido", `COUNTIF(${LO},"*Teléfono usado por*")`, S.sharedPhoneRecords);

  // Registros por hora (una columna por día)
  const r0 = Math.max(17, 14 + S.days.length + 2);
  section(r0, 2, "Registros por hora");
  const hours = rows.length ? range(Math.min(...rows.map((r) => r.hour)), Math.max(...rows.map((r) => r.hour))) : [];
  const hdr = (c: number, v: string) => {
    const x = rs.getCell(r0 + 1, c);
    x.value = v;
    x.font = font({ bold: true, color: { argb: "FFFFFFFF" } });
    x.fill = fill(BLUE);
    x.alignment = { horizontal: "center" };
  };
  hdr(2, "Hora");
  S.days.forEach((d, k) => hdr(3 + k, `${d.dayName} ${Number(d.key.slice(8))}`));
  hours.forEach((h, j) => {
    const r = r0 + 2 + j;
    const a = rs.getCell(r, 2);
    a.value = `${h}:00 – ${h}:59`;
    a.alignment = { horizontal: "center" };
    a.font = font();
    a.border = bottom();
    S.days.forEach((d, k) => {
      const [y, m, dd] = d.key.split("-").map(Number);
      const c = rs.getCell(r, 3 + k);
      c.value = {
        formula: `COUNTIFS(${LD},DATE(${y},${m},${dd}),${LT},">="&TIME(${h},0,0),${LT},"<"&TIME(${h + 1},0,0))`,
        result: d.byHour[h] ?? 0,
      };
      c.font = font();
      c.alignment = { horizontal: "center" };
      c.border = bottom();
    });
  });
  const tot = r0 + 2 + hours.length;
  rs.getCell(tot, 2).value = "Total";
  rs.getCell(tot, 2).font = font({ bold: true });
  S.days.forEach((d, k) => {
    const col = colLetter(3 + k);
    const c = rs.getCell(tot, 3 + k);
    c.value = { formula: `SUM(${col}${r0 + 2}:${col}${tot - 1})`, result: d.count };
    c.font = font({ bold: true });
    c.alignment = { horizontal: "center" };
  });
  if (hours.length && dayCols) {
    rs.addConditionalFormatting({
      ref: `C${r0 + 2}:${colLetter(2 + dayCols)}${tot - 1}`,
      rules: [
        {
          type: "colorScale",
          priority: 4,
          cfvo: [{ type: "num", value: 0 }, { type: "max" }],
          color: [{ argb: "FFFFFFFF" }, { argb: "FF9CC3E6" }],
        },
      ],
    });
  }
  rs.getCell(tot + 2, 2).value = 'Las cifras se calculan con fórmulas sobre la hoja "Leads": si filtras o corriges datos ahí, este resumen se actualiza.';
  rs.getCell(tot + 2, 2).font = font({ size: 8, italic: true, color: { argb: MUTED } });
  rs.getCell(tot + 3, 2).value = "Preparado por Inédito Agencia Digital · www.inedito.digital";
  rs.getCell(tot + 3, 2).font = font({ size: 8, color: { argb: MUTED } });
  rs.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 1 };

  /* ------------------------------------------------------ Para revisar */
  [3, 40, 14, 18].forEach((w, i) => (pr.getColumn(i + 1).width = w));
  pr.getCell("B1").value = "Datos para revisar";
  pr.getCell("B1").font = font({ bold: true, size: 16, color: { argb: INK } });
  pr.getCell("B2").value = "Registros que conviene revisar antes de usar la base para campañas de correo o WhatsApp. No se borró nada.";
  pr.getCell("B2").font = font({ color: { argb: MUTED } });
  let row = 4;
  const block = (title: string, note: string, cols: string[], items: ExcelJS.CellValue[][]) => {
    pr.getCell(row, 2).value = title;
    pr.getCell(row, 2).font = font({ bold: true, size: 12, color: { argb: INK } });
    pr.getCell(row + 1, 2).value = note;
    pr.getCell(row + 1, 2).font = font({ size: 9, italic: true, color: { argb: MUTED } });
    row += 2;
    cols.forEach((h, i) => {
      const c = pr.getCell(row, 2 + i);
      c.value = h;
      c.font = font({ bold: true, color: { argb: "FFFFFFFF" } });
      c.fill = fill(BLUE);
    });
    row++;
    if (!items.length) {
      pr.getCell(row, 2).value = "Sin casos";
      pr.getCell(row, 2).font = font({ italic: true, color: { argb: MUTED } });
      row++;
    }
    for (const it of items) {
      it.forEach((v, i) => {
        const c = pr.getCell(row, 2 + i);
        c.value = v;
        c.font = font();
        c.border = bottom();
      });
      row++;
    }
    row += 2;
  };
  const q = (s: string) => s.replace(/"/g, '""');
  block(
    "Correos usados por varios nombres",
    "Probablemente correos inventados o prestados: no sirven para contactar a todas esas personas.",
    ["Correo", "Registros", "Nombres distintos"],
    S.sharedEmails.map((e) => [e.email, { formula: `COUNTIF(${LE},"${q(e.email)}")`, result: e.records }, e.names]),
  );
  block(
    "Teléfonos usados por varios nombres",
    "Mismo número capturado por personas distintas.",
    ["Teléfono", "Registros", "Nombres distintos"],
    S.sharedPhones.map((p) => [p.phone, { formula: `COUNTIF(${LP},"${q(p.phone)}")`, result: p.records }, p.names]),
  );
  block(
    "Dominios con error de escritura",
    'En la hoja Leads, la columna "Correo sugerido" trae el correo con el dominio corregido. Es una sugerencia: confírmala.',
    ["Dominio capturado", "Registros", "Sugerencia"],
    S.typos.map((t) => [t.domain, { formula: `COUNTIF(${LE},"*@${q(t.domain)}")`, result: t.records }, t.suggestion]),
  );
  block(
    "Personas que jugaron más de una vez",
    "Mismo nombre, correo y teléfono en varias participaciones.",
    ["Nombre", "Veces", "Veces que ganó"],
    S.repeat.map((p) => [p.name, p.times, p.wins]),
  );
  pr.pageSetup = { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function range(a: number, b: number) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}
