/**
 * Análisis de calidad de los leads para las exportaciones (CSV, Excel y PDF).
 *
 * No modifica ni inventa datos: normaliza mayúsculas y espacios del nombre,
 * deja el teléfono en 10 dígitos cuando trae el prefijo 52, sugiere (sin
 * reemplazar) el dominio correcto de un correo mal escrito y anota por qué un
 * contacto no es confiable.
 */
import type { Participant } from "./types";

const TZ = "America/Mexico_City";
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const PARTICLES = new Set(["de", "del", "la", "las", "los", "y", "e"]);

/** Dominios mal escritos frecuentes → dominio sugerido. */
export const DOMAIN_TYPOS: Record<string, string> = {
  "gnail.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmqil.com": "gmail.com",
  "hmail.com": "gmail.com",
  "gimeil.com": "gmail.com",
  "gmail.xom": "gmail.com",
  "gmail..com": "gmail.com",
  "gmai.com.mx": "gmail.com",
  "gmial.com": "gmail.com",
  "gmail.co": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "outlok.com": "outlook.com",
  "icloud.com.": "icloud.com",
};

const EMAIL_RE = /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9_%+-])?@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/;

export interface LeadRow {
  n: number;
  /** Fecha local (Aguascalientes) como AAAA-MM-DD, para agrupar. */
  dayKey: string;
  /** dd/mm/aaaa */
  date: string;
  dayName: string;
  /** HH:MM, 24 h */
  time: string;
  hour: number;
  minutes: number;
  name: string;
  email: string;
  phoneDigits: string;
  /** "449 324 9118" si tiene 10 dígitos; si no, los dígitos tal cual. */
  phone: string;
  win: boolean;
  prize: string;
  reliable: boolean;
  /** Correo con el dominio corregido, sólo si el capturado parece mal escrito. */
  suggest: string;
  obs: string[];
}

export interface DayStats {
  key: string;
  date: string;
  dayName: string;
  /** "Lunes 19 de octubre" */
  label: string;
  count: number;
  first: string;
  last: string;
  byHour: Record<number, number>;
  peakHour: number;
  peakCount: number;
  /** Mayor tiempo sin registros dentro del día (minutos) y entre qué horas. */
  gap: { minutes: number; from: string; to: string } | null;
}

export interface LeadSummary {
  total: number;
  wins: number;
  reliable: number;
  reliableUniqueEmails: number;
  withObs: number;
  days: DayStats[];
  sharedEmails: Array<{ email: string; records: number; names: number }>;
  sharedPhones: Array<{ phone: string; records: number; names: number }>;
  repeat: Array<{ name: string; times: number; wins: number }>;
  typos: Array<{ domain: string; records: number; suggestion: string }>;
  typoCount: number;
  badPhone: number;
  invalidEmail: number;
  sharedEmailRecords: number;
  sharedPhoneRecords: number;
  /** "Lunes 19 y martes 20 de octubre de 2026" */
  dateRange: string;
}

export function cleanName(raw: string): string {
  const words = raw.trim().replace(/\s*\.\s+/g, " ").replace(/\s+/g, " ").split(" ");
  return words
    .map((w, i) => {
      const lw = w.toLowerCase();
      return i && PARTICLES.has(lw) ? lw : lw.charAt(0).toUpperCase() + lw.slice(1);
    })
    .join(" ");
}

export const formatPhone = (d: string) => (d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d);

const pad = (n: number) => String(n).padStart(2, "0");

function localParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const y = get("year"), m = get("month"), d = get("day"), h = get("hour") % 24, min = get("minute");
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, h, min, weekday };
}

function sentenceDate(days: DayStats[]): string {
  if (!days.length) return "";
  const parsed = days.map((d) => {
    const [y, m, dd] = d.key.split("-").map(Number);
    return { y, m, d: dd, wd: d.dayName.toLowerCase() };
  });
  const sameMonth = parsed.every((p) => p.m === parsed[0].m && p.y === parsed[0].y);
  const join = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);
  let text: string;
  if (parsed.length > 4) {
    const a = parsed[0], b = parsed[parsed.length - 1];
    text = `del ${a.wd} ${a.d} de ${MESES[a.m - 1]} al ${b.wd} ${b.d} de ${MESES[b.m - 1]} de ${b.y}`;
  } else if (sameMonth) {
    text = `${join(parsed.map((p) => `${p.wd} ${p.d}`))} de ${MESES[parsed[0].m - 1]} de ${parsed[0].y}`;
  } else {
    text = `${join(parsed.map((p) => `${p.wd} ${p.d} de ${MESES[p.m - 1]}`))} de ${parsed[parsed.length - 1].y}`;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function analyzeLeads(participants: Participant[]): { rows: LeadRow[]; summary: LeadSummary } {
  type Rec = LeadRow & { orig: number; ts: number; dom: string };
  const recs: Rec[] = participants.map((p, i) => {
    const t = localParts(p.timestamp);
    const email = (p.email ?? "").trim().toLowerCase();
    const at = email.lastIndexOf("@");
    let digits = (p.phone ?? "").replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("52")) digits = digits.slice(2);
    const win = !!p.prizeWon && p.prizeWon.isWin !== false;
    return {
      orig: i,
      ts: new Date(p.timestamp).getTime(),
      dom: at >= 0 ? email.slice(at + 1) : email,
      n: 0,
      dayKey: `${t.y}-${pad(t.m)}-${pad(t.d)}`,
      date: `${pad(t.d)}/${pad(t.m)}/${t.y}`,
      dayName: DIAS[t.weekday],
      time: `${pad(t.h)}:${pad(t.min)}`,
      hour: t.h,
      minutes: t.h * 60 + t.min,
      name: cleanName(p.name ?? ""),
      email,
      phoneDigits: digits,
      phone: formatPhone(digits),
      win,
      prize: win ? (p.prizeWon?.name ?? "") : "",
      reliable: false,
      suggest: "",
      obs: [],
    };
  });

  const group = (key: (r: Rec) => string) => {
    const m = new Map<string, Rec[]>();
    for (const r of recs) m.set(key(r), [...(m.get(key(r)) ?? []), r]);
    return m;
  };
  const byEmail = group((r) => r.email);
  const byPhone = group((r) => r.phoneDigits);
  const byPerson = group((r) => `${r.name.toLowerCase()}|${r.email}|${r.phoneDigits}`);
  const distinctNames = (rs: Rec[]) => new Set(rs.map((x) => x.name.toLowerCase())).size;
  const chrono = (a: Rec, b: Rec) => a.ts - b.ts || a.orig - b.orig;

  for (const r of recs) {
    const obs: string[] = [];
    const typo = DOMAIN_TYPOS[r.dom];
    if (typo) {
      r.suggest = `${r.email.slice(0, r.email.lastIndexOf("@"))}@${typo}`;
      obs.push(`Dominio con error (${r.dom})`);
    } else if (!EMAIL_RE.test(r.email)) {
      obs.push("Correo con formato inválido");
    }
    const namesE = distinctNames(byEmail.get(r.email)!);
    if (namesE > 1) obs.push(`Correo usado por ${namesE} nombres distintos`);
    if (r.phoneDigits.length !== 10) obs.push(`Teléfono de ${r.phoneDigits.length} dígitos`);
    const namesP = distinctNames(byPhone.get(r.phoneDigits)!);
    if (namesP > 1) obs.push(`Teléfono usado por ${namesP} nombres distintos`);
    const same = byPerson.get(`${r.name.toLowerCase()}|${r.email}|${r.phoneDigits}`)!;
    if (same.length > 1) obs.push(`Participación ${[...same].sort(chrono).indexOf(r) + 1} de ${same.length}`);
    r.obs = obs;
    r.reliable = !typo && EMAIL_RE.test(r.email) && namesE === 1 && r.phoneDigits.length === 10 && namesP === 1;
  }

  recs.sort(chrono);
  recs.forEach((r, i) => (r.n = i + 1));

  // --- Resumen por día
  const dayMap = new Map<string, Rec[]>();
  for (const r of recs) dayMap.set(r.dayKey, [...(dayMap.get(r.dayKey) ?? []), r]);
  const days: DayStats[] = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rs]) => {
      const byHour: Record<number, number> = {};
      for (const r of rs) byHour[r.hour] = (byHour[r.hour] ?? 0) + 1;
      const [peakHour, peakCount] = Object.entries(byHour)
        .map(([h, c]) => [Number(h), c] as const)
        .sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
      let gap: DayStats["gap"] = null;
      for (let i = 1; i < rs.length; i++) {
        const g = rs[i].minutes - rs[i - 1].minutes;
        if (!gap || g > gap.minutes) gap = { minutes: g, from: rs[i - 1].time, to: rs[i].time };
      }
      const [, m, d] = key.split("-").map(Number);
      return {
        key,
        date: rs[0].date,
        dayName: rs[0].dayName,
        label: `${rs[0].dayName} ${d} de ${MESES[m - 1]}`,
        count: rs.length,
        first: rs[0].time,
        last: rs[rs.length - 1].time,
        byHour,
        peakHour,
        peakCount,
        gap,
      };
    });

  const desc = <T extends { records: number }>(a: T, b: T) => b.records - a.records;
  const sharedEmails = [...byEmail.entries()]
    .filter(([, rs]) => distinctNames(rs) > 1)
    .map(([email, rs]) => ({ email, records: rs.length, names: distinctNames(rs) }))
    .sort(desc);
  const sharedPhones = [...byPhone.entries()]
    .filter(([, rs]) => distinctNames(rs) > 1)
    .map(([d, rs]) => ({ phone: formatPhone(d), records: rs.length, names: distinctNames(rs) }))
    .sort(desc);
  const repeat = [...byPerson.values()]
    .filter((rs) => rs.length > 1)
    .map((rs) => ({ name: rs[0].name, times: rs.length, wins: rs.filter((x) => x.win).length }))
    .sort((a, b) => b.times - a.times);
  const typoCounts = new Map<string, number>();
  for (const r of recs) if (DOMAIN_TYPOS[r.dom]) typoCounts.set(r.dom, (typoCounts.get(r.dom) ?? 0) + 1);
  const typos = [...typoCounts.entries()]
    .map(([domain, records]) => ({ domain, records, suggestion: DOMAIN_TYPOS[domain] }))
    .sort(desc);

  const rows: LeadRow[] = recs.map(({ orig: _o, ts: _t, dom: _d, ...row }) => row);
  const summary: LeadSummary = {
    total: rows.length,
    wins: rows.filter((r) => r.win).length,
    reliable: rows.filter((r) => r.reliable).length,
    reliableUniqueEmails: new Set(rows.filter((r) => r.reliable).map((r) => r.email)).size,
    withObs: rows.filter((r) => r.obs.length).length,
    days,
    sharedEmails,
    sharedPhones,
    repeat,
    typos,
    typoCount: typos.reduce((s, t) => s + t.records, 0),
    badPhone: rows.filter((r) => r.phoneDigits.length !== 10).length,
    invalidEmail: rows.filter((r) => r.obs.includes("Correo con formato inválido")).length,
    sharedEmailRecords: rows.filter((r) => r.obs.some((o) => o.startsWith("Correo usado"))).length,
    sharedPhoneRecords: rows.filter((r) => r.obs.some((o) => o.startsWith("Teléfono usado"))).length,
    dateRange: sentenceDate(days),
  };
  return { rows, summary };
}
