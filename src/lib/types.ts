import type { ThemeName } from "./brand";

export interface Prize {
  id: string;
  name: string;
  description: string;
  /** Peso relativo: 20 cae el doble que 10. No tiene que sumar 100. */
  probability: number;
  maxWins: number;
  currentWins: number;
  color: string;
  textColor: string;
  /** false = gajo "sin premio" (cuenta como participación, no como ganador). */
  isWin: boolean;
  active: boolean;
}

/** Lo que se guarda del gajo junto al lead: suficiente para reportes. */
export interface PrizeSnapshot {
  id: string;
  name: string;
  description: string;
  isWin: boolean;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  acceptedTerms: boolean;
  prizeWon: PrizeSnapshot | null;
  timestamp: string;
}

export interface BrandConfig {
  theme: ThemeName;
  logoUrl: string;
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  isWhiteLabel: boolean;
  systemName: string;
  centerLogoUrl: string;
  centerBgColor: string;
  centerBgSecondaryColor: string;
  logoText: string;
}

export interface Messages {
  welcome: string;
  formSubtitle: string;
  beforeSpin: string;
  congratulations: string;
  prizeMessage: string;
  loseTitle: string;
  loseMessage: string;
  termsText: string;
}

export interface GameConfig {
  dailyLimit: number;
  currentDailyCount: number;
  /** Día (AAAA-MM-DD) al que corresponde currentDailyCount. */
  countDate: string;
  requireRegistration: boolean;
  enableSounds: boolean;
  enableAnimations: boolean;
  spinDuration: number;
}

export interface DemoConfig {
  frameImageUrl: string;
  screenTop: string;
  screenLeft: string;
  screenWidth: string;
  screenHeight: string;
  screenBorderRadius: string;
}

export interface CarouselItem {
  id: string;
  imageUrl: string;
  altText: string;
}

export interface CarouselConfig {
  items: CarouselItem[];
  backgroundColor: string;
  speed: number;
  grayscale: boolean;
  active: boolean;
}

/** Todo lo que el panel edita y el servidor comparte con los tótems. */
export interface AppConfig {
  brand: BrandConfig;
  messages: Messages;
  prizes: Prize[];
  gameConfig: GameConfig;
  demoConfig: DemoConfig;
  carouselConfig: CarouselConfig;
}

export interface AppState extends AppConfig {
  /** Sólo llegan del servidor con sesión de administrador. */
  participants: Participant[];
}

export type SyncStatus = "cargando" | "conectado" | "sin-conexion";
