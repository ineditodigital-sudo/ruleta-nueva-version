/**
 * Reporte de participantes en PDF con identidad UTA.
 *
 * Se arma como HTML de páginas A4 fijas y se imprime desde un iframe oculto:
 * el navegador abre su diálogo con "Guardar como PDF". Así el PDF sale con
 * texto real (seleccionable y nítido) y el mismo diseño en cualquier equipo.
 */
import fontLatin from "@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2?url";
import fontLatinExt from "@fontsource-variable/montserrat/files/montserrat-latin-ext-wght-normal.woff2?url";
import { SEAL } from "./brand";
import { DOMAIN_TYPOS, type DayStats, type LeadRow, type LeadSummary } from "./leads";
import type { BrandConfig } from "./types";

const C = { blue: "#0060A0", copper: "#BF7B4A" };
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const fmt = (n: number) => n.toLocaleString("es-MX");
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const abs = (u: string) => new URL(u, window.location.origin).href;

/* --- Gráficas ------------------------------------------------------------------ */

function niceMax(v: number) {
  const step = v <= 10 ? 5 : v <= 40 ? 10 : v <= 100 ? 25 : v <= 400 ? 100 : 250;
  return { max: Math.max(step, Math.ceil((v * 1.12) / step) * step), step };
}

function barChart(opts: { title: string; note: string; labels: string[]; values: number[]; max: number; step: number; aria: string }) {
  const { labels, values, max, step } = opts;
  const W = 300, H = 132, L = 22, B = 20, T = 12, R = 4;
  const pw = W - L - R, ph = H - T - B;
  const slot = pw / labels.length, bw = Math.min(slot * 0.62, 26);
  const y = (v: number) => T + ph - (v / max) * ph;
  const peak = Math.max(...values);
  let grid = "";
  for (let g = step; g < max; g += step)
    grid += `<line x1="${L}" x2="${W - R}" y1="${y(g)}" y2="${y(g)}" stroke="#E6EBF2" stroke-width="1"/><text x="${L - 5}" y="${y(g) + 3}" text-anchor="end" class="ax">${g}</text>`;
  const fontSize = labels.length > 14 ? 6.5 : 8;
  const bars = values
    .map((v, i) => {
      const x = L + i * slot + (slot - bw) / 2;
      const top = y(v), h = T + ph - top;
      const r = Math.min(4, h / 2, bw / 2);
      const path = v
        ? `<path d="M${x},${T + ph} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${T + ph} Z" fill="${C.blue}"/>`
        : "";
      const lab = v && v === peak ? `<text x="${x + bw / 2}" y="${top - 4}" text-anchor="middle" class="pk">${v}</text>` : "";
      return `${path}${lab}<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" class="ax" style="font-size:${fontSize}px">${labels[i]}</text>`;
    })
    .join("");
  return `<figure class="chart">
    <figcaption><b>${esc(opts.title)}</b><span>${esc(opts.note)}</span></figcaption>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.aria)}">${grid}
      <line x1="${L}" x2="${W - R}" y1="${T + ph}" y2="${T + ph}" stroke="#B9C4D2" stroke-width="1"/>${bars}</svg>
    <div class="vals" style="grid-template-columns:repeat(${labels.length},1fr);margin-left:${(L / W) * 100}%;margin-right:${(R / W) * 100}%;font-size:${labels.length > 14 ? 5.4 : 6.6}pt">${values.map((v) => `<span>${v || "–"}</span>`).join("")}</div>
  </figure>`;
}

const hm = (t: string) => t.replace(/^0/, "");

/** Una sola línea por día: la pausa larga (si la hubo) dice más que la hora pico. */
function dayNote(d: DayStats) {
  const extra =
    d.gap && d.gap.minutes >= 60
      ? `pausa sin registros de ${hm(d.gap.from)} a ${hm(d.gap.to)}`
      : `la hora más concurrida fue de ${d.peakHour}:00 a ${d.peakHour + 1}:00 (${d.peakCount})`;
  return `De ${hm(d.first)} a ${hm(d.last)} · ${extra}`;
}

function chartsHtml(S: LeadSummary, rows: LeadRow[]) {
  if (!rows.length) return "";
  const minH = Math.min(...rows.map((r) => r.hour));
  const maxH = Math.max(...rows.map((r) => r.hour));
  const hours = Array.from({ length: maxH - minH + 1 }, (_, i) => minH + i);
  if (S.days.length <= 2) {
    const { max, step } = niceMax(Math.max(...S.days.flatMap((d) => Object.values(d.byHour))));
    return S.days
      .map((d) =>
        barChart({
          title: `${d.dayName} ${Number(d.key.slice(8))}`,
          note: dayNote(d),
          labels: hours.map(String),
          values: hours.map((h) => d.byHour[h] ?? 0),
          max,
          step,
          aria: `Registros por hora, ${d.label}`,
        }),
      )
      .join("");
  }
  // Más de dos días: una gráfica por hora (todos los días) y otra por día.
  const byHour = hours.map((h) => S.days.reduce((s, d) => s + (d.byHour[h] ?? 0), 0));
  const peakIdx = byHour.indexOf(Math.max(...byHour));
  const a = niceMax(Math.max(...byHour));
  const b = niceMax(Math.max(...S.days.map((d) => d.count)));
  const busiest = [...S.days].sort((x, y) => y.count - x.count)[0];
  return (
    barChart({
      title: "Por hora (todos los días)",
      note: `Hora más concurrida: ${hours[peakIdx]}:00 a ${hours[peakIdx] + 1}:00 (${byHour[peakIdx]})`,
      labels: hours.map(String),
      values: byHour,
      ...a,
      aria: "Registros por hora, todos los días",
    }) +
    barChart({
      title: "Por día",
      note: `Día con más registros: ${busiest.label} (${busiest.count})`,
      labels: S.days.map((d) => String(Number(d.key.slice(8)))),
      values: S.days.map((d) => d.count),
      ...b,
      aria: "Registros por día",
    })
  );
}

/* --- Tabla ---------------------------------------------------------------------- */

const REASONS: Array<[RegExp, string | ((m: RegExpMatchArray) => string)]> = [
  [/^Dominio con error/, "Dominio con error"],
  [/^Correo con formato/, "Correo inválido"],
  [/^Correo usado por/, "Correo compartido"],
  [/^Teléfono de (\d+)/, (m) => (m[1] === "0" ? "Sin teléfono" : `Tel. de ${m[1]} dígitos`)],
  [/^Teléfono usado por/, "Tel. compartido"],
];

function contactCell(r: LeadRow) {
  if (r.reliable) return '<span class="ok">✓ Confiable</span>';
  const tags: string[] = [];
  for (const [re, label] of REASONS) {
    const o = r.obs.find((x) => re.test(x));
    if (o) tags.push(typeof label === "function" ? label(o.match(re)!) : label);
  }
  const more = tags.length > 1 ? `<span class="more">+${tags.length - 1}</span>` : "";
  return `<span class="warn">${tags[0] ?? "Revisar"}</span>${more}`;
}

function emailCell(e: string) {
  const at = e.lastIndexOf("@");
  const dom = e.slice(at + 1);
  return at >= 0 && DOMAIN_TYPOS[dom] ? `${esc(e.slice(0, at + 1))}<mark>${esc(dom)}</mark>` : esc(e);
}

function rowHtml(r: LeadRow) {
  const rep = r.obs.find((o) => o.startsWith("Participación"));
  const repTag = rep ? ` <span class="rep">${rep.replace("Participación ", "").replace(" de ", "ª de ")}</span>` : "";
  const prize = r.win && r.prize && r.prize !== "¡Ganaste!" ? ` title="${esc(r.prize)}"` : "";
  return `<tr><td class="n">${r.n}</td><td class="t">${r.time}</td>
    <td class="pp"><div class="nm">${esc(r.name) || "—"}${repTag}</div><div class="em">${emailCell(r.email) || "—"}</div></td><td class="ph">${esc(r.phone) || "—"}</td>
    <td class="rs">${r.win ? `<span class="g"${prize}>Ganó</span>` : '<span class="l">No ganó</span>'}</td><td class="ct">${contactCell(r)}</td></tr>`;
}

/* --- Documento ------------------------------------------------------------------ */

export function buildReportHtml({ rows, summary: S }: { rows: LeadRow[]; summary: LeadSummary }, brand: BrandConfig, title: string) {
  const logo = brand.logoUrl?.trim() || abs(SEAL.png);
  const total = S.total, wins = S.wins;
  const PER_PAGE = 33;
  type Item = { day: DayStats; cont?: boolean } | { r: LeadRow };
  const dayByKey = new Map(S.days.map((d) => [d.key, d]));
  const items: Item[] = [];
  let prev = "";
  for (const r of rows) {
    if (r.dayKey !== prev) items.push({ day: dayByKey.get(r.dayKey)! });
    prev = r.dayKey;
    items.push({ r });
  }
  const pages: Item[][] = [];
  let cur: Item[] = [];
  let curDay: DayStats | null = null;
  for (const it of items) {
    if (cur.length >= PER_PAGE || ("day" in it && cur.length >= PER_PAGE - 3)) {
      pages.push(cur);
      cur = [];
      if (!("day" in it) && curDay) cur.push({ day: curDay, cont: true });
    }
    if ("day" in it) curDay = it.day;
    cur.push(it);
  }
  if (cur.length) pages.push(cur);

  const TOTAL = 1 + pages.length + 1;
  const foot = (n: number) => `<footer class="foot"><span><b>${esc(brand.systemName)}</b> · Reporte de participantes</span>
    <span>Confidencial · Preparado por <b>Inédito Agencia Digital</b></span><span>Página ${n} de ${TOTAL}</span></footer>`;
  const head = (t: string, sub: string) =>
    `<header class="mini"><img src="${esc(logo)}" alt=""><div><div class="kicker">${esc(brand.companyName)}</div><h1>${t}</h1></div><div class="sub">${sub}</div></header>`;
  const dayRow = (d: DayStats, cont?: boolean) =>
    `<tr class="dayrow"><td colspan="6"><b>${esc(d.label)}</b><span>${cont ? "continúa" : `${fmt(d.count)} registros`}</span></td></tr>`;

  const perDay =
    S.days.length <= 3
      ? `<b>${S.days.map((d) => fmt(d.count)).join(" <i>/</i> ")}</b><small>${S.days.map((d) => d.dayName.toLowerCase()).join(" / ")}</small>`
      : `<b>${S.days.length}</b><small>días con registros</small>`;
  const topEmail = S.sharedEmails[0];
  const topPhone = S.sharedPhones[0];
  const typoExamples = S.typos.slice(0, 2).map((t) => `<i>${esc(t.domain)}</i>`).join(" o ");
  // Textos más precisos cuando todos los casos son iguales (p. ej. "Teléfonos de 11 dígitos").
  const badLens = [...new Set(rows.filter((r) => r.phoneDigits.length !== 10).map((r) => r.phoneDigits.length))];
  const badLen = badLens.length === 1 && badLens[0] > 0 ? badLens[0] : 0;
  const phoneTitle = badLen ? `Teléfonos de ${badLen} dígitos` : "Teléfonos que no tienen 10 dígitos";
  const phoneText =
    badLen === 11 ? "Les sobra un número" : badLen === 9 ? "Les falta un número" : badLen > 10 ? "Les sobran números" : badLen ? "Les faltan números" : "Les falta o les sobra un número";
  const twice = S.repeat.length > 0 && S.repeat.every((p) => p.times === 2);
  const repeatTitle = twice ? "Jugaron dos veces" : "Jugaron más de una vez";
  const ruleta = /^ruleta\b/i.test(brand.systemName.trim());

  const page1 = `<section class="page">
  <header class="hero">
    <img src="${esc(logo)}" alt="">
    <div class="t"><div class="kicker">${esc(brand.companyName)}</div>
      <h1>${ruleta ? `Participantes de la ${esc(brand.systemName.trim())}` : "Participantes"}</h1>
      <p>${ruleta ? "" : `${esc(brand.systemName)} · `}${esc(S.dateRange)} · ${fmt(total)} registros en el tótem</p></div>
    <div class="conf"><b>Confidencial</b>Contiene datos personales. Úsalo sólo para dar seguimiento a los participantes y no lo compartas fuera del equipo.</div>
  </header>
  <div class="body">
    <div class="kpis">
      <div class="kpi"><span>Registros</span><b>${fmt(total)}</b><small>en ${S.days.length} ${S.days.length === 1 ? "día" : "días"} de evento</small></div>
      <div class="kpi"><span>Ganaron</span><b>${fmt(wins)}</b><small>${pct(wins, total)}% de los registros</small></div>
      <div class="kpi accent"><span>Contactos confiables</span><b>${fmt(S.reliable)}</b><small>${pct(S.reliable, total)}% · ${fmt(S.reliableUniqueEmails)} correos distintos</small></div>
      <div class="kpi"><span>Por día</span>${perDay}</div>
    </div>

    <h2 class="sec"><span>01</span>Registros por ${S.days.length <= 2 ? "hora" : "hora y por día"}</h2>
    <div class="charts">${chartsHtml(S, rows)}</div>
    <p class="axnote">Eje horizontal: ${S.days.length <= 2 ? "hora del día (24 h)" : "hora del día (24 h) y día del mes"}. Debajo de cada barra, el número de registros${S.days.length <= 2 ? " de esa hora" : ""}.</p>

    <h2 class="sec"><span>02</span>Resultado de la ruleta</h2>
    <div class="split">
      <div class="bar">${wins ? `<div style="width:${(wins / total) * 100}%;background:${C.copper}"></div>` : ""}${total - wins ? `<div style="width:${((total - wins) / total) * 100}%;background:${C.blue}"></div>` : ""}</div>
      <div class="legend">
        <span><i style="background:${C.copper}"></i><b>${fmt(wins)}</b> ganaron (${pct(wins, total)}%)</span>
        <span><i style="background:${C.blue}"></i><b>${fmt(total - wins)}</b> no ganaron (${total ? 100 - pct(wins, total) : 0}%)</span>
      </div>
    </div>

    <h2 class="sec"><span>03</span>Calidad de los datos</h2>
    <div class="quality">
      <div class="q main"><b>${fmt(S.reliable)}</b><div><h4>Contactos confiables</h4><p>Correo y teléfono con formato válido que no aparecen con otros nombres. <b>Son la base recomendada para campañas</b> de correo o WhatsApp.</p></div></div>
      <div class="q"><b>${fmt(S.sharedEmailRecords)}</b><div><h4>Registros con correo compartido</h4><p>${topEmail ? `El mismo correo con nombres distintos. <i>${esc(topEmail.email)}</i> aparece en ${topEmail.records} registros.` : "Ningún correo se repite con nombres distintos."}</p></div></div>
      <div class="q"><b>${fmt(S.sharedPhoneRecords)}</b><div><h4>Registros con teléfono compartido</h4><p>${topPhone ? `El mismo número con nombres distintos. Uno aparece ${topPhone.records} veces.` : "Ningún teléfono se repite con nombres distintos."}</p></div></div>
      <div class="q"><b>${fmt(S.typoCount)}</b><div><h4>Correos con error en el dominio</h4><p>${S.typoCount ? `Como ${typoExamples}. El CSV y el Excel traen el correo corregido como sugerencia.` : "No se encontraron dominios mal escritos."}</p></div></div>
      <div class="q"><b>${fmt(S.badPhone)}</b><div><h4>${phoneTitle}</h4><p>${phoneText}: no se pueden marcar tal cual.</p></div></div>
      <div class="q"><b>${fmt(S.repeat.length)}</b><div><h4>Personas que ${repeatTitle.toLowerCase()}</h4><p>Mismo nombre, correo y teléfono en ${twice ? "dos" : "varias"} participaciones.</p></div></div>
    </div>
  </div>
  ${foot(1)}
</section>`;

  const tables = pages
    .map(
      (its, i) => `<section class="page">
  ${head("Lista de participantes", `Orden cronológico · ${fmt(total)} registros`)}
  <div class="body">
    ${i === 0 ? `<div class="keys"><span><span class="ok">✓ Confiable</span> correo y teléfono válidos y no compartidos</span><span><span class="warn">Motivo</span> por qué no es confiable (<span class="more">+n</span> = otros motivos)</span><span><mark>dominio</mark> con error de escritura</span><span><span class="rep">2ª de 2</span> volvió a jugar</span></div>` : ""}
    <table class="leads">
      <colgroup><col style="width:8.5mm"><col style="width:11.5mm"><col style="width:91mm"><col style="width:23mm"><col style="width:17mm"><col style="width:33mm"></colgroup>
      <thead><tr><th>#</th><th>Hora</th><th>Participante · correo</th><th>Teléfono</th><th>Resultado</th><th>Contacto</th></tr></thead>
      <tbody>${its.map((it) => ("day" in it ? dayRow(it.day, it.cont) : rowHtml(it.r))).join("")}</tbody>
    </table>
  </div>
  ${foot(i + 2)}
</section>`,
    )
    .join("");

  const LIMIT = 10;
  const list = (t: string, note: string, cols: string[], data: Array<Array<string | number>>, lastWidth = "") => {
    const shown = data.slice(0, LIMIT);
    const body = shown.length
      ? shown.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("")
      : `<tr><td colspan="${cols.length}" class="none">Sin casos</td></tr>`;
    const more = data.length > LIMIT ? `<p class="moreRows">y ${data.length - LIMIT} más: la lista completa está en el Excel.</p>` : "";
    return `<div class="rev"><h3>${t}</h3><p>${note}</p>
      <table class="mini-t"><thead><tr>${cols.map((c, i) => `<th${lastWidth && i === cols.length - 1 ? ` style="width:${lastWidth}"` : ""}>${c}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>${more}</div>`;
  };
  const pageRev = `<section class="page">
  ${head("Datos para revisar", "Antes de usar la base en campañas")}
  <div class="body">
    <p class="lead">Estos son los casos que bajan la calidad de la base. No se borró nada: todos los registros siguen en la lista y en los archivos CSV y Excel, marcados para que puedas filtrarlos.</p>
    <div class="revgrid">
      ${list("Correos usados por varios nombres", "Probablemente inventados o prestados.", ["Correo", "Registros", "Nombres"], S.sharedEmails.map((e) => [esc(e.email), e.records, e.names]))}
      ${list("Teléfonos usados por varios nombres", "El mismo número capturado por personas distintas.", ["Teléfono", "Registros", "Nombres"], S.sharedPhones.map((p) => [esc(p.phone), p.records, p.names]))}
      ${list("Dominios con error de escritura", "Sugerencia incluida en la columna “Correo sugerido”.", ["Capturado", "Registros", "Sugerencia"], S.typos.map((t) => [`<mark>${esc(t.domain)}</mark>`, t.records, esc(t.suggestion)]), "25mm")}
      ${list(repeatTitle, "Mismo nombre, correo y teléfono.", ["Nombre", "Veces", "Ganó"], S.repeat.map((p) => [esc(p.name), p.times, p.wins]))}
    </div>
    <div class="how">
      <h3>Cómo usar los archivos</h3>
      <div class="howgrid">
        <div><b>Excel (.xlsx)</b><p>Para revisar y filtrar: resumen con fórmulas, tabla con filtros y la lista completa de revisión.</p></div>
        <div><b>CSV</b><p>Para importar a Mailchimp, un CRM o Google Sheets. Filtra <i>Contacto confiable = Sí</i> antes de enviar campañas.</p></div>
        <div><b>Este PDF</b><p>Para presentar resultados o imprimir. Contiene datos personales: compártelo sólo con el equipo responsable.</p></div>
      </div>
    </div>
  </div>
  ${foot(TOTAL)}
</section>`;

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>${page1}${tables}${pageRev}</body></html>`;
}

/** Imprime el HTML desde un iframe oculto; el navegador ofrece "Guardar como PDF". */
export async function printHtml(html: string, title: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(iframe);
  const win = iframe.contentWindow!;
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  doc.title = title;
  await Promise.all(
    [...doc.images].map((img) =>
      img.complete
        ? null
        : new Promise((r) => {
            img.addEventListener("load", r);
            img.addEventListener("error", r);
          }),
    ),
  );
  // Las fuentes sólo se descargan al usarse; se piden antes de imprimir para no salir con la de sistema.
  const faces: Promise<unknown>[] = [];
  doc.fonts.forEach((f) => faces.push(f.load().catch(() => null)));
  await Promise.all(faces);
  await doc.fonts.ready;
  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  win.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(() => iframe.isConnected && iframe.remove(), 5 * 60 * 1000);
  win.focus();
  win.print();
}

const CSS = `
@font-face { font-family: M; src: url(${abs(fontLatin)}) format('woff2'); font-weight: 100 900; }
@font-face { font-family: M; src: url(${abs(fontLatinExt)}) format('woff2'); font-weight: 100 900; unicode-range: U+0100-024F, U+1E00-1EFF; }
@page { size: A4; margin: 0; }
:root { --ink:#071A2E; --ink2:#0D2742; --ink3:#1C3A5E; --blue:#0060A0; --copper:#E4A57B; --copperD:#A9775A; --copperL:#F6E3D5; --paper:#F5F7FA; --line:#DCE3EC; --text:#0B2440; --muted:#536179; --amber:#8A5A00; --amberL:#FFF1DC; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #fff; }
body { font-family: M, Arial, sans-serif; color: var(--text); font-size: 8.4pt; line-height: 1.4; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; position: relative; overflow: hidden; display: flex; flex-direction: column; page-break-after: always; break-after: page; }
.page:last-child { page-break-after: auto; break-after: auto; }
.body { padding: 0 13mm; flex: 1; display: flex; flex-direction: column; }
.kicker { font-size: 6.8pt; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; color: var(--copper); }
b { font-weight: 700; }
.hero { background: var(--ink); color: #fff; padding: 10mm 13mm 9mm; display: flex; gap: 6mm; align-items: center; position: relative; }
.hero::after, .mini::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1.1mm; background: var(--copper); }
.hero img { width: 28mm; height: 28mm; object-fit: contain; }
.hero .t { flex: 1; }
.hero h1 { font-size: 22pt; line-height: 1.05; font-weight: 800; letter-spacing: -.02em; margin: 1.8mm 0 1.8mm; }
.hero p { color: #B8C7D9; font-size: 9pt; }
.conf { max-width: 56mm; font-size: 7.2pt; color: #B8C7D9; background: var(--ink2); border: .25mm solid var(--ink3); border-radius: 2mm; padding: 2.6mm 3mm; }
.conf b { display: block; color: var(--copper); font-size: 7.6pt; letter-spacing: .12em; text-transform: uppercase; margin-bottom: .6mm; }
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin-top: 7mm; }
.kpi { border: .3mm solid var(--line); border-radius: 2.6mm; padding: 3.4mm 3.8mm; border-top: 1mm solid var(--blue); }
.kpi.accent { border-top-color: var(--copper); background: #FFFBF7; }
.kpi span { font-size: 6.8pt; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-weight: 700; }
.kpi b { display: block; font-size: 22pt; font-weight: 800; letter-spacing: -.03em; line-height: 1.1; margin: 1mm 0 .4mm; }
.kpi b i { font-style: normal; color: #A8B4C4; font-weight: 600; }
.kpi small { font-size: 7.4pt; color: var(--muted); }
.sec { display: flex; align-items: center; gap: 2.6mm; font-size: 12pt; font-weight: 800; letter-spacing: -.01em; margin: 7mm 0 3.4mm; }
.sec span { font-size: 7pt; color: var(--copperD); letter-spacing: .14em; border: .3mm solid var(--copper); border-radius: 4mm; padding: .4mm 2mm; }
.charts { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.chart { border: .3mm solid var(--line); border-radius: 2.6mm; padding: 3mm 3.4mm 2.6mm; }
.chart:only-child { grid-column: span 2; }
.chart figcaption { display: flex; flex-direction: column; margin-bottom: 1.6mm; }
.chart figcaption b { font-size: 9.6pt; }
.chart figcaption span { font-size: 7.2pt; color: var(--muted); }
.chart svg { width: 100%; display: block; }
.chart .ax { font-family: M, Arial, sans-serif; font-size: 8px; fill: #6B7690; }
.chart .pk { font-family: M, Arial, sans-serif; font-size: 9px; font-weight: 800; fill: var(--ink); }
.vals { display: grid; color: var(--muted); text-align: center; border-top: .25mm dashed var(--line); padding-top: .8mm; }
.axnote { font-size: 6.8pt; color: #8090A6; margin-top: 1.6mm; }
.split .bar { display: flex; gap: .7mm; height: 7mm; }
.split .bar div:first-child { border-radius: 1.4mm 0 0 1.4mm; }
.split .bar div:last-child { border-radius: 0 1.4mm 1.4mm 0; }
.split .bar div:only-child { border-radius: 1.4mm; }
.legend { display: flex; gap: 7mm; margin-top: 2.2mm; font-size: 8.4pt; }
.legend i { display: inline-block; width: 3mm; height: 3mm; border-radius: .8mm; margin-right: 1.6mm; vertical-align: -.3mm; }
.quality { display: grid; grid-template-columns: 1fr 1fr; gap: 2.6mm; }
.q { display: flex; gap: 3.4mm; align-items: flex-start; border: .3mm solid var(--line); border-radius: 2.4mm; padding: 2.8mm 3.4mm; }
.q > b { font-size: 15pt; font-weight: 800; min-width: 12mm; color: var(--ink); line-height: 1.1; }
.q.main { grid-column: span 2; background: #F2F7FC; border-color: #CFE0F0; }
.q.main > b { color: var(--blue); font-size: 19pt; }
.q h4 { font-size: 8.8pt; margin-bottom: .4mm; }
.q p { font-size: 7.6pt; color: var(--muted); }
.q p i { font-style: normal; font-weight: 600; color: var(--text); }
.mini { background: var(--ink); color: #fff; padding: 6mm 13mm 5.4mm; display: flex; align-items: center; gap: 4.4mm; position: relative; margin-bottom: 5mm; }
.mini img { width: 13mm; height: 13mm; object-fit: contain; }
.mini h1 { font-size: 15pt; font-weight: 800; letter-spacing: -.015em; margin-top: .6mm; }
.mini .sub { margin-left: auto; font-size: 7.6pt; color: #B8C7D9; }
.keys { display: flex; flex-wrap: wrap; gap: 2mm 5mm; font-size: 6.8pt; color: var(--muted); margin-bottom: 3mm; }
table.leads { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 7.1pt; }
.leads th { background: var(--blue); color: #fff; font-size: 6.1pt; letter-spacing: .06em; text-transform: uppercase; text-align: left; padding: 1.8mm 1.2mm; font-weight: 700; white-space: nowrap; overflow: hidden; }
.leads th:first-child { border-radius: 1.6mm 0 0 0; } .leads th:last-child { border-radius: 0 1.6mm 0 0; }
.leads td { height: 7.3mm; padding: 0 1.2mm; border-bottom: .2mm solid #E8EDF3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; }
.leads tr:nth-child(even) td { background: #FAFBFD; }
.leads td.n, .leads td.t { color: #7B879B; font-variant-numeric: tabular-nums; }
.leads td.ph { font-variant-numeric: tabular-nums; }
.pp div { overflow: hidden; text-overflow: ellipsis; line-height: 1.22; }
.pp .nm { font-weight: 600; font-size: 7.4pt; }
.pp .em { color: #536179; font-size: 6.8pt; }
.dayrow td { background: var(--paper) !important; height: 6.2mm; border-bottom: .3mm solid var(--copper); }
.dayrow b { font-size: 8.2pt; margin-right: 2.4mm; }
.dayrow span { font-size: 7pt; color: var(--muted); }
.g { background: var(--copperL); color: #7A4E33; font-weight: 700; padding: .3mm 1.8mm; border-radius: 3mm; font-size: 6.8pt; }
.l { color: #7B879B; font-size: 6.8pt; }
.ok { color: var(--blue); font-weight: 700; font-size: 6.8pt; }
.warn { background: var(--amberL); color: var(--amber); font-weight: 600; padding: .3mm 1.3mm; border-radius: 1mm; font-size: 6.3pt; }
.more { color: var(--amber); font-size: 6.4pt; font-weight: 700; margin-left: .8mm; }
.rep { font-size: 6.2pt; font-weight: 600; color: var(--copperD); border: .2mm solid var(--copper); border-radius: 2mm; padding: 0 1.2mm; margin-left: .6mm; }
mark { background: var(--amberL); color: var(--amber); font-weight: 700; border-radius: .6mm; padding: 0 .4mm; }
.lead { font-size: 8.6pt; color: var(--muted); max-width: 165mm; margin-bottom: 4mm; }
.revgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 6mm; }
.rev h3 { font-size: 10pt; font-weight: 800; }
.rev > p { font-size: 7.4pt; color: var(--muted); margin: .4mm 0 1.8mm; }
.rev .moreRows { font-size: 7pt; color: var(--muted); margin-top: 1.2mm; font-style: italic; }
table.mini-t { width: 100%; border-collapse: collapse; font-size: 7.6pt; table-layout: fixed; }
.mini-t th { text-align: left; font-size: 6.4pt; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); border-bottom: .4mm solid var(--blue); padding: 1.2mm 1.4mm; }
.mini-t td { padding: 1.2mm 1.4mm; border-bottom: .2mm solid #E8EDF3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mini-t td:not(:first-child), .mini-t th:not(:first-child) { text-align: right; width: 17mm; }
.mini-t td.none { text-align: left !important; color: var(--muted); font-style: italic; }
.how { margin-top: auto; margin-bottom: 3mm; background: var(--ink); color: #fff; border-radius: 3mm; padding: 4.4mm 5mm; position: relative; overflow: hidden; }
.how::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 1.2mm; background: var(--copper); }
.how h3 { font-size: 10pt; margin-bottom: 2.4mm; }
.howgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; }
.howgrid b { color: var(--copper); font-size: 8.6pt; }
.howgrid p { font-size: 7.4pt; color: #B8C7D9; margin-top: .6mm; }
.howgrid i { font-style: normal; color: #fff; font-weight: 600; }
.foot { margin-top: auto; padding: 3.4mm 13mm 6mm; display: flex; justify-content: space-between; font-size: 6.8pt; color: #8090A6; }
.foot b { color: var(--text); }
`;
