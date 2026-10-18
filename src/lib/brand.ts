/**
 * Identidad visual de la Universidad Tecnológica de Aguascalientes (UTA).
 *
 * Los tonos salen del sello oficial: el azul de la cara de la marca "UT", el
 * celeste de su bisel, el cobre del disco central y el cromo del anillo.
 */
export const UT = {
  ink: "#071A2E",
  inkDeep: "#04111F",
  inkSoft: "#0D2742",
  inkLine: "#1C3A5E",
  blue: "#0060A0",
  blueBright: "#2E8BD8",
  sky: "#6FB2EC",
  copper: "#E4A57B",
  copperBright: "#F3C29C",
  copperDeep: "#A9775A",
  chrome: "#D7DCE3",
  chromeDark: "#7D8692",
  graphite: "#3E4652",
  paper: "#F7F8FA",
  textMuted: "#A3B6CE",
  textFaint: "#7088A6",
  danger: "#FF8A95",
} as const;

export type ThemeName = "dark" | "light";

export interface ThemeTokens {
  field: string;
  fieldEdge: string;
  surface: string;
  surfaceDeep: string;
  line: string;
  text: string;
  textMuted: string;
  textFaint: string;
  placeholder: string;
  logoTone: "light" | "dark";
  danger: string;
  segmentStroke: string;
  winText: string;
}

export const THEMES: Record<ThemeName, ThemeTokens> = {
  dark: {
    field: UT.ink,
    fieldEdge: UT.inkDeep,
    surface: UT.inkSoft,
    surfaceDeep: "#0A2038",
    line: UT.inkLine,
    text: UT.paper,
    textMuted: UT.textMuted,
    textFaint: UT.textFaint,
    placeholder: "#8BA2BF",
    logoTone: "light",
    danger: UT.danger,
    segmentStroke: UT.inkDeep,
    winText: UT.copperBright,
  },
  light: {
    field: "#F3F5F9",
    fieldEdge: "#DCE3EC",
    surface: "#FFFFFF",
    surfaceDeep: "#EEF2F7",
    line: "#D5DDE8",
    text: "#0B2440",
    textMuted: "#4E5F78",
    textFaint: "#66768E",
    placeholder: "#7A8AA0",
    logoTone: "dark",
    danger: "#C2334A",
    segmentStroke: "#FFFFFF",
    winText: UT.copperDeep,
  },
};

/** Rutas del sello oficial (recortado del logotipo, fondo transparente). */
export const SEAL = {
  sm: "/brand/ut-sello-256.webp",
  md: "/brand/ut-sello-512.webp",
  lg: "/brand/ut-sello-1024.webp",
  png: "/brand/ut-sello-512.png",
} as const;

export const BRAND_NAME = "Universidad Tecnológica de Aguascalientes";
export const BRAND_SHORT = "UTA";

/** Fecha local de Aguascalientes en formato AAAA-MM-DD (para el límite diario). */
export function todayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Divide un texto en dos líneas lo más parejas posible, cortando sólo entre
 * palabras: "Universidad Tecnológica / de Aguascalientes".
 */
export function splitBalanced(text: string): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return [text.trim()];
  let best: string[] = [text.trim()];
  let bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const score = Math.max(a.length, b.length);
    if (score < bestScore) {
      bestScore = score;
      best = [a, b];
    }
  }
  return best;
}
