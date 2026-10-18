/**
 * Sonidos sintetizados con Web Audio: sin archivos que descargar, funcionan
 * sin conexión y pesan cero. El navegador sólo deja sonar audio después de un
 * toque del usuario, así que el contexto se "despierta" con el botón de girar.
 */

type Ctx = AudioContext;
let ctx: Ctx | null = null;
let master: GainNode | null = null;

function audio(): Ctx | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export const unlockAudio = () => void audio();

function tone(
  c: Ctx,
  { freq, type = "sine", start, dur, peak, endFreq }: {
    freq: number;
    type?: OscillatorType;
    start: number;
    dur: number;
    peak: number;
    endFreq?: number;
  },
) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.012, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(master!);
  o.start(start);
  o.stop(start + dur + 0.02);
}

/** "Clac" de la lengüeta al pasar por un clavo de la ruleta. */
export function playTick(strength = 1) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  tone(c, { freq: 2100, endFreq: 900, type: "triangle", start: t, dur: 0.045, peak: 0.16 * strength });
  tone(c, { freq: 420, type: "sine", start: t, dur: 0.03, peak: 0.08 * strength });
}

/** Arranque del giro: barrido de ruido filtrado. */
export function playWhoosh() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const len = Math.floor(c.sampleRate * 0.7);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(500, t);
  f.frequency.exponentialRampToValueAtTime(2600, t + 0.6);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.22, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  src.connect(f).connect(g).connect(master!);
  src.start(t);
  src.stop(t + 0.72);
}

/** Fanfarria corta al ganar: arpegio mayor con brillo. */
export function playWin() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + 0.02;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    tone(c, { freq: f, type: "triangle", start: t + i * 0.11, dur: 0.42, peak: 0.2 });
    tone(c, { freq: f * 2, type: "sine", start: t + i * 0.11, dur: 0.3, peak: 0.05 });
  });
  // Acorde final sostenido
  [523.25, 659.25, 783.99, 1046.5].forEach((f) =>
    tone(c, { freq: f, type: "sine", start: t + 0.5, dur: 1.1, peak: 0.09 }),
  );
  for (let i = 0; i < 6; i++)
    tone(c, { freq: 2400 + Math.random() * 1600, type: "sine", start: t + 0.5 + i * 0.07, dur: 0.18, peak: 0.035 });
}

/** Cierre amable cuando no hay premio. */
export function playLose() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + 0.02;
  tone(c, { freq: 392, type: "triangle", start: t, dur: 0.32, peak: 0.14 });
  tone(c, { freq: 329.63, type: "triangle", start: t + 0.22, dur: 0.5, peak: 0.12 });
}

/** Toque suave para botones. */
export function playTap() {
  const c = audio();
  if (!c) return;
  tone(c, { freq: 880, endFreq: 660, type: "sine", start: c.currentTime, dur: 0.08, peak: 0.08 });
}
