import { BRAND_NAME, UT, todayKey } from "./brand";
import type {
  AppConfig,
  AppState,
  BrandConfig,
  CarouselConfig,
  DemoConfig,
  GameConfig,
  Messages,
  Prize,
} from "./types";

/**
 * Sube este valor cuando cambien los valores de fábrica de la marca: los
 * navegadores con una versión distinta descartan su copia local.
 */
export const BRAND_VERSION = "uta-1";

export const WIN_NAME = "¡Ganaste!";
export const LOSE_NAME = "Suerte para la próxima";

export const DEFAULT_BRAND: BrandConfig = {
  theme: "dark",
  logoUrl: "",
  companyName: BRAND_NAME,
  primaryColor: UT.copper,
  secondaryColor: UT.blue,
  backgroundColor: UT.ink,
  isWhiteLabel: false,
  systemName: "Ruleta UTA",
  centerLogoUrl: "",
  centerBgColor: UT.ink,
  centerBgSecondaryColor: UT.inkSoft,
  logoText: BRAND_NAME,
};

export const DEFAULT_MESSAGES: Messages = {
  welcome: "¡Gira la ruleta y gana!",
  formSubtitle: "Déjanos tus datos y la ruleta es tuya.",
  beforeSpin: "Presiona el botón para girar la ruleta",
  congratulations: "¡Felicidades!",
  prizeMessage: "Acércate al stand de la UTA para recoger tu premio.",
  loseTitle: "Será a la próxima",
  loseMessage: "Gracias por participar. ¡Te esperamos en la UTA!",
  termsText:
    "Acepto los términos y condiciones y el aviso de privacidad de la Universidad Tecnológica de Aguascalientes",
};

/** Gajos de fábrica: alternan premio / sin premio con los colores del sello. */
const SEGMENTS: Array<Pick<Prize, "isWin" | "color" | "textColor" | "probability">> = [
  { isWin: true, color: UT.blue, textColor: "#FFFFFF", probability: 17 },
  { isWin: false, color: UT.chrome, textColor: "#0B2440", probability: 17 },
  { isWin: true, color: UT.copper, textColor: UT.ink, probability: 17 },
  { isWin: false, color: "#143457", textColor: "#FFFFFF", probability: 16 },
  { isWin: true, color: "#1F7BC6", textColor: "#FFFFFF", probability: 16 },
  { isWin: false, color: UT.graphite, textColor: "#FFFFFF", probability: 17 },
];

export const DEFAULT_PRIZES: Prize[] = SEGMENTS.map((s, i) => ({
  id: String(i + 1),
  name: s.isWin ? WIN_NAME : LOSE_NAME,
  description: "",
  probability: s.probability,
  maxWins: 9999,
  currentWins: 0,
  color: s.color,
  textColor: s.textColor,
  isWin: s.isWin,
  active: true,
}));

/** Paleta sugerida en el panel para gajos nuevos. */
export const SEGMENT_SWATCHES = [
  UT.blue,
  "#1F7BC6",
  UT.sky,
  UT.copper,
  UT.copperDeep,
  UT.chrome,
  "#143457",
  UT.graphite,
];

export const DEFAULT_GAME: GameConfig = {
  dailyLimit: 1000,
  currentDailyCount: 0,
  countDate: todayKey(),
  requireRegistration: true,
  enableSounds: true,
  enableAnimations: true,
  spinDuration: 5000,
};

export const DEFAULT_DEMO: DemoConfig = {
  frameImageUrl: "https://imagenes.inedito.digital/INEDITO%20DIGITAL/marco-totem-front.webp",
  screenTop: "5.3%",
  screenLeft: "12.6%",
  screenWidth: "76.5%",
  screenHeight: "54%",
  screenBorderRadius: "8px",
};

export const DEMO_BACKGROUND = "https://imagenes.inedito.digital/INEDITO%20DIGITAL/fondo_expo.webp";

export const DEFAULT_CAROUSEL: CarouselConfig = {
  items: [],
  backgroundColor: "transparent",
  speed: 20,
  grayscale: false,
  active: true,
};

export const DEFAULT_CONFIG: AppConfig = {
  brand: DEFAULT_BRAND,
  messages: DEFAULT_MESSAGES,
  prizes: DEFAULT_PRIZES,
  gameConfig: DEFAULT_GAME,
  demoConfig: DEFAULT_DEMO,
  carouselConfig: DEFAULT_CAROUSEL,
};

export const DEFAULT_STATE: AppState = { ...DEFAULT_CONFIG, participants: [] };

/** Rellena con valores de fábrica cualquier clave que falte o venga vacía. */
function fill<T extends object>(value: Partial<T> | null | undefined, fallback: T): T {
  const out = { ...fallback, ...(value ?? {}) } as T;
  for (const key of Object.keys(fallback) as Array<keyof T>) {
    if (out[key] === undefined || out[key] === null) out[key] = fallback[key];
  }
  return out;
}

/** Normaliza un estado que viene del servidor o del navegador (versiones viejas incluidas). */
export function normalizeConfig(raw: Partial<AppConfig> | null | undefined): AppConfig {
  const r = raw ?? {};
  const game = fill(r.gameConfig, DEFAULT_GAME);
  // El conteo diario se reinicia solo al cambiar de día.
  if (game.countDate !== todayKey()) {
    game.currentDailyCount = 0;
    game.countDate = todayKey();
  }
  return {
    brand: fill(r.brand, DEFAULT_BRAND),
    messages: fill(r.messages, DEFAULT_MESSAGES),
    gameConfig: game,
    demoConfig: fill(r.demoConfig, DEFAULT_DEMO),
    carouselConfig: {
      ...fill(r.carouselConfig, DEFAULT_CAROUSEL),
      items: Array.isArray(r.carouselConfig?.items) ? r.carouselConfig!.items : [],
    },
    prizes:
      Array.isArray(r.prizes) && r.prizes.length
        ? r.prizes.map((p) => ({
            ...p,
            isWin: p.isWin ?? true,
            active: p.active ?? true,
            currentWins: p.currentWins ?? 0,
            maxWins: p.maxWins ?? 9999,
            probability: Number.isFinite(p.probability) ? p.probability : 10,
          }))
        : DEFAULT_PRIZES,
  };
}

export function pickConfig(state: AppState): AppConfig {
  return {
    brand: state.brand,
    messages: state.messages,
    prizes: state.prizes,
    gameConfig: state.gameConfig,
    demoConfig: state.demoConfig,
    carouselConfig: state.carouselConfig,
  };
}
