import type { AppConfig, Participant, Prize } from "./types";

/**
 * Cliente del estado compartido (public/api/state.php).
 *
 * El servidor es la fuente de verdad: el panel guarda ahí la configuración y
 * los tótems registran cada giro. Si no hay red, el tótem guarda los leads en
 * una cola local y los reenvía en cuanto el servidor vuelve a responder.
 */

const ENDPOINT = "/api/state.php";
const TIMEOUT_MS = 8000;
const TOKEN_KEY = "utaAdminToken";
const PENDING_KEY = "utaRuletaPendingLeads";

export interface ServerState {
  updatedAt: number;
  config: Partial<AppConfig> | null;
  /** Sólo viene con sesión de administrador: los leads no son públicos. */
  participants?: Participant[];
  participantsCount?: number;
}

export type LoginResult = "ok" | "credenciales" | "sin-conexion";
export type PushResult = "ok" | "sesion-expirada" | "sin-conexion";

export const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
};

export const clearToken = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* sin almacenamiento: nada que borrar */
  }
};

async function request(init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(ENDPOINT, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const post = (body: Record<string, unknown>) =>
  request({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export async function login(password: string): Promise<LoginResult> {
  try {
    const res = await post({ action: "login", password });
    if (res.status === 401) return "credenciales";
    if (!res.ok) return "sin-conexion";
    const data = await res.json();
    if (!data.token) return "sin-conexion";
    sessionStorage.setItem(TOKEN_KEY, data.token);
    return "ok";
  } catch {
    return "sin-conexion";
  }
}

export async function logout(): Promise<void> {
  const token = getToken();
  clearToken();
  if (token) {
    try {
      await post({ action: "logout", token });
    } catch {
      /* la sesión caduca sola en el servidor */
    }
  }
}

export async function fetchState(): Promise<ServerState | null> {
  try {
    const token = getToken();
    const res = await request({
      method: "GET",
      cache: "no-store",
      headers: token ? { "X-Admin-Token": token } : undefined,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data === "object" ? (data as ServerState) : null;
  } catch {
    return null;
  }
}

const toPushResult = (res: Response): PushResult =>
  res.ok ? "ok" : res.status === 401 ? "sesion-expirada" : "sin-conexion";

export async function pushConfig(
  config: AppConfig,
  resetCounts = false,
  resetPrizeIds: string[] = [],
): Promise<PushResult> {
  try {
    return toPushResult(await post({ action: "config", token: getToken(), config, resetCounts, resetPrizeIds }));
  } catch {
    return "sin-conexion";
  }
}

export async function pushParticipants(
  participants: Participant[],
  prizes: Prize[],
  currentDailyCount: number,
): Promise<PushResult> {
  try {
    return toPushResult(
      await post({ action: "participants", token: getToken(), participants, prizes, currentDailyCount }),
    );
  } catch {
    return "sin-conexion";
  }
}

/** Borra leads y contadores y deja la configuración de fábrica en el servidor. */
export async function resetServer(config: AppConfig): Promise<PushResult> {
  try {
    return toPushResult(await post({ action: "reset", token: getToken(), config }));
  } catch {
    return "sin-conexion";
  }
}

/* --- Cola de giros del tótem ------------------------------------------------ */

interface PendingSpin {
  participant: Participant | null;
  prizeId: string | null;
}

const readQueue = (): PendingSpin[] => {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue: PendingSpin[]) => {
  try {
    if (queue.length) localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    /* sin almacenamiento: el lead se pierde sólo si además no hay red */
  }
};

async function sendSpin(spin: PendingSpin): Promise<boolean> {
  try {
    const res = await post({ action: "lead", participant: spin.participant, prizeId: spin.prizeId });
    // 4xx = el servidor rechaza el dato: reintentarlo no lo va a arreglar.
    return res.ok || (res.status >= 400 && res.status < 500);
  } catch {
    return false;
  }
}

/** Registra un giro (con o sin datos del participante). */
export async function recordSpin(participant: Participant | null, prizeId: string | null) {
  const spin = { participant, prizeId };
  if (await sendSpin(spin)) {
    void flushPendingSpins();
    return;
  }
  writeQueue([...readQueue(), spin]);
}

let flushing = false;
export async function flushPendingSpins() {
  if (flushing) return;
  const queue = readQueue();
  if (!queue.length) return;
  flushing = true;
  try {
    const failed: PendingSpin[] = [];
    for (const spin of queue) if (!(await sendSpin(spin))) failed.push(spin);
    // Si mientras tanto entraron giros nuevos a la cola, se conservan.
    const added = readQueue().slice(queue.length);
    writeQueue([...failed, ...added]);
  } finally {
    flushing = false;
  }
}

export const pendingSpinsCount = () => readQueue().length;
