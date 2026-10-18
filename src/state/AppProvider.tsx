import { createContext, useCallback, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  clearToken,
  fetchState,
  flushPendingSpins,
  getToken,
  pushConfig,
  pushParticipants,
  recordSpin,
  resetServer,
  type PushResult,
} from "@/lib/api";
import { BRAND_VERSION, DEFAULT_CONFIG, DEFAULT_STATE, normalizeConfig, pickConfig } from "@/lib/defaults";
import { todayKey, type ThemeName } from "@/lib/brand";
import type {
  AppConfig,
  AppState,
  BrandConfig,
  CarouselConfig,
  DemoConfig,
  GameConfig,
  Messages,
  Participant,
  Prize,
  SyncStatus,
} from "@/lib/types";

const STORAGE_KEY = "utaRuletaState";
const VERSION_KEY = "utaRuletaBrandVersion";
const POLL_MS = 15000;
const PUSH_DEBOUNCE_MS = 700;

export type RestorableSection = "brand" | "messages" | "prizes" | "demo" | "carousel";

interface AppContextValue {
  state: AppState;
  sync: SyncStatus;
  /** true con sesión de administrador: sólo entonces se suben cambios al servidor. */
  isAdmin: boolean;
  sessionExpired: boolean;
  setAdminSession: (active: boolean) => void;
  updateBrand: (patch: Partial<BrandConfig>) => void;
  addPrize: (prize: Prize) => void;
  updatePrize: (id: string, patch: Partial<Prize>) => void;
  deletePrize: (id: string) => void;
  updateMessages: (patch: Partial<Messages>) => void;
  updateGameConfig: (patch: Partial<GameConfig>) => void;
  updateDemoConfig: (patch: Partial<DemoConfig>) => void;
  updateCarouselConfig: (patch: Partial<CarouselConfig>) => void;
  /** El tótem registra un giro: inventario y conteo locales + aviso al servidor. */
  registerSpin: (prize: Prize, participant: Participant | null) => void;
  updateParticipant: (id: string, patch: Partial<Participant>) => void;
  deleteParticipant: (id: string) => void;
  deleteAllParticipants: () => void;
  resetDailyCount: () => void;
  resetPrizeWins: (id: string) => void;
  restoreDefaults: (section: RestorableSection) => void;
  resetEverything: () => Promise<PushResult>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const snapshot = (s: AppConfig) => JSON.stringify(pickConfig(s as AppState));

function loadLocal(): AppState {
  try {
    if (localStorage.getItem(VERSION_KEY) !== BRAND_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, BRAND_VERSION);
      return DEFAULT_STATE;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...normalizeConfig(JSON.parse(raw)), participants: [] };
  } catch {
    return DEFAULT_STATE;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadLocal);
  const [sync, setSync] = useState<SyncStatus>("cargando");
  const [isAdmin, setIsAdmin] = useState(() => getToken() !== "");
  const [sessionExpired, setSessionExpired] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;
  /** Configuración que el servidor ya tiene: lo que coincide con esto no se reenvía. */
  const baseline = useRef(snapshot(state));
  /** Último updatedAt del servidor ya aplicado (segundos). */
  const seenAt = useRef(0);
  const pushing = useRef(false);
  const pushTimer = useRef(0);

  // Copia local de la configuración (nunca los leads: son datos personales).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pickConfig(state)));
    } catch {
      /* almacenamiento lleno o bloqueado: el servidor sigue siendo la fuente */
    }
  }, [state]);

  const handlePush = useCallback((result: PushResult) => {
    if (result === "sesion-expirada") {
      clearToken();
      setIsAdmin(false);
      setSessionExpired(true);
      setState((s) => ({ ...s, participants: [] }));
    }
    setSync(result === "ok" ? "conectado" : "sin-conexion");
  }, []);

  const pull = useCallback(async () => {
    const remote = await fetchState();
    if (!remote) {
      setSync("sin-conexion");
      return;
    }
    setSync("conectado");
    void flushPendingSpins();
    // Instalación nueva: el servidor aún no tiene configuración. El panel la
    // siembra para que los contadores de premios y del día empiecen a llevarse.
    if (!remote.config && getToken()) {
      const seed = pickConfig(stateRef.current);
      void pushConfig(seed).then((r) => {
        if (r === "ok") baseline.current = snapshot(seed);
        handlePush(r);
      });
    }
    const hasNewConfig = !!remote.config && remote.updatedAt > seenAt.current;
    if (hasNewConfig) {
      seenAt.current = remote.updatedAt;
      const config = normalizeConfig(remote.config);
      baseline.current = snapshot(config);
      setState((prev) => ({ ...config, participants: remote.participants ?? prev.participants }));
    } else if (remote.participants) {
      setState((prev) => ({ ...prev, participants: remote.participants! }));
    }
  }, []);

  // Primera carga + sondeo periódico: cambios del panel y giros de otros tótems.
  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const loop = () => {
      timer = window.setTimeout(async () => {
        if (!document.hidden && !pushing.current) await pull();
        if (!cancelled) loop();
      }, POLL_MS);
    };
    void pull().then(() => !cancelled && loop());
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pull]);

  // Al iniciar sesión se traen los leads de inmediato.
  useEffect(() => {
    if (!isAdmin) return;
    seenAt.current = 0;
    void pull();
  }, [isAdmin, pull]);

  // Cambios del panel → servidor, agrupando tecleos.
  useEffect(() => {
    if (!isAdmin) return;
    const current = snapshot(state);
    if (current === baseline.current) return;
    pushing.current = true;
    window.clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(async () => {
      const result = await pushConfig(pickConfig(stateRef.current));
      if (result === "ok") {
        baseline.current = snapshot(stateRef.current);
        seenAt.current = Math.floor(Date.now() / 1000);
      }
      pushing.current = false;
      handlePush(result);
    }, PUSH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(pushTimer.current);
      pushing.current = false;
    };
  }, [state, isAdmin, handlePush]);

  const patch = <K extends keyof AppConfig>(key: K, value: Partial<AppConfig[K]>) =>
    setState((s) => ({ ...s, [key]: { ...s[key], ...value } }));

  /** Cambios de leads: el servidor recibe la lista y los contadores corregidos. */
  const commitLeads = (next: AppState) => {
    baseline.current = snapshot(next);
    setState(next);
    void pushParticipants(next.participants, next.prizes, next.gameConfig.currentDailyCount).then(handlePush);
  };

  const value: AppContextValue = {
    state,
    sync,
    isAdmin,
    sessionExpired,

    setAdminSession: useCallback((active: boolean) => {
      setIsAdmin(active);
      if (active) setSessionExpired(false);
      else setState((s) => ({ ...s, participants: [] }));
    }, []),

    updateBrand: (p) => patch("brand", p),
    updateMessages: (p) => patch("messages", p),
    updateGameConfig: (p) => patch("gameConfig", p),
    updateDemoConfig: (p) => patch("demoConfig", p),
    updateCarouselConfig: (p) => patch("carouselConfig", p),

    addPrize: (prize) => setState((s) => ({ ...s, prizes: [...s.prizes, prize] })),
    updatePrize: (id, p) =>
      setState((s) => ({ ...s, prizes: s.prizes.map((it) => (it.id === id ? { ...it, ...p } : it)) })),
    deletePrize: (id) => setState((s) => ({ ...s, prizes: s.prizes.filter((it) => it.id !== id) })),

    registerSpin: (prize, participant) => {
      setState((s) => {
        const sameDay = s.gameConfig.countDate === todayKey();
        return {
          ...s,
          prizes: s.prizes.map((p) => (p.id === prize.id ? { ...p, currentWins: p.currentWins + 1 } : p)),
          gameConfig: {
            ...s.gameConfig,
            countDate: todayKey(),
            currentDailyCount: (sameDay ? s.gameConfig.currentDailyCount : 0) + 1,
          },
        };
      });
      void recordSpin(participant, prize.id);
    },

    updateParticipant: (id, p) => {
      const s = stateRef.current;
      commitLeads({ ...s, participants: s.participants.map((it) => (it.id === id ? { ...it, ...p } : it)) });
    },

    deleteParticipant: (id) => {
      const s = stateRef.current;
      const lead = s.participants.find((it) => it.id === id);
      if (!lead) return;
      // El premio vuelve al inventario; el conteo del día sólo baja si el giro fue hoy.
      const wasToday = todayKey(new Date(lead.timestamp)) === s.gameConfig.countDate;
      commitLeads({
        ...s,
        participants: s.participants.filter((it) => it.id !== id),
        prizes: lead.prizeWon
          ? s.prizes.map((p) => (p.id === lead.prizeWon!.id ? { ...p, currentWins: Math.max(0, p.currentWins - 1) } : p))
          : s.prizes,
        gameConfig: {
          ...s.gameConfig,
          currentDailyCount: wasToday ? Math.max(0, s.gameConfig.currentDailyCount - 1) : s.gameConfig.currentDailyCount,
        },
      });
    },

    deleteAllParticipants: () => {
      const s = stateRef.current;
      commitLeads({
        ...s,
        participants: [],
        prizes: s.prizes.map((p) => ({ ...p, currentWins: 0 })),
        gameConfig: { ...s.gameConfig, currentDailyCount: 0, countDate: todayKey() },
      });
    },

    resetDailyCount: () => {
      const s = stateRef.current;
      const next = { ...s, gameConfig: { ...s.gameConfig, currentDailyCount: 0, countDate: todayKey() } };
      baseline.current = snapshot(next);
      setState(next);
      // El servidor protege sus contadores salvo que se le pida explícitamente.
      void pushConfig(pickConfig(next), true).then(handlePush);
    },

    resetPrizeWins: (id) => {
      const s = stateRef.current;
      const next = { ...s, prizes: s.prizes.map((p) => (p.id === id ? { ...p, currentWins: 0 } : p)) };
      baseline.current = snapshot(next);
      setState(next);
      void pushConfig(pickConfig(next), false, [id]).then(handlePush);
    },

    restoreDefaults: (section) =>
      setState((s) => {
        switch (section) {
          case "brand":
            return { ...s, brand: { ...DEFAULT_CONFIG.brand, theme: s.brand.theme } };
          case "messages":
            return { ...s, messages: { ...DEFAULT_CONFIG.messages } };
          case "demo":
            return { ...s, demoConfig: { ...DEFAULT_CONFIG.demoConfig } };
          case "carousel":
            return { ...s, carouselConfig: { ...DEFAULT_CONFIG.carouselConfig } };
          case "prizes":
            return {
              ...s,
              prizes: DEFAULT_CONFIG.prizes.map((p) => ({
                ...p,
                currentWins: s.prizes.find((old) => old.id === p.id)?.currentWins ?? 0,
              })),
            };
        }
      }),

    resetEverything: async () => {
      const fresh = normalizeConfig(DEFAULT_CONFIG);
      const result = await resetServer(fresh);
      if (result === "ok") {
        baseline.current = snapshot(fresh);
        seenAt.current = Math.floor(Date.now() / 1000);
        setState({ ...fresh, participants: [] });
      }
      handlePush(result);
      return result;
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}

export function useThemeName(): ThemeName {
  const { state } = useApp();
  return state.brand.theme === "light" ? "light" : "dark";
}

/** Variables CSS del tótem que dependen de la marca (fondo y resplandor en la versión oscura). */
export function useKioskStyle(): CSSProperties | undefined {
  const { state } = useApp();
  const { theme, backgroundColor, secondaryColor } = state.brand;
  if (theme === "light") return undefined;
  return {
    "--ut-field": backgroundColor || "var(--ut-ink)",
    "--ut-glow-top": `color-mix(in srgb, ${secondaryColor || "#0060a0"} 38%, transparent)`,
  } as CSSProperties;
}
