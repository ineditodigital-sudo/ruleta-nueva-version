import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { RotateCw } from "lucide-react";
import { BrandLockup, HubLogo } from "@/components/brand/Brand";
import { THEMES } from "@/lib/brand";
import { playLose, playTick, playWhoosh, playWin, unlockAudio } from "@/lib/sound";
import type { Prize } from "@/lib/types";
import { pickWeighted } from "@/lib/utils";
import { useApp, useThemeName } from "@/state/AppProvider";
import LogoCarousel from "./LogoCarousel";

/* Medidas en px del lienzo del tótem (1080 de ancho). */
const WHEEL = 880;
const CHROME = 16;
const TRACK = 26;
const COPPER = 6;
const FACE_INSET = CHROME + TRACK + COPPER;
const LED_COUNT = 28;
const HUB = 250;
/** Tiempo que el gajo ganador se queda iluminado antes del resultado. */
export const REVEAL_MS = 1400;

type SpinPhase = "idle" | "spinning" | "reveal";

/** Parte un nombre largo en dos renglones para que quepa en el gajo. */
function splitLabel(text: string): string[] {
  if (text.length <= 13) return [text];
  const words = text.split(" ");
  const lines = ["", ""];
  const half = Math.ceil(text.length / 2);
  let line = 0;
  for (const w of words) {
    if (line === 0 && lines[0].length + w.length > half) line = 1;
    lines[line] += (lines[line] ? " " : "") + w;
  }
  return lines.filter(Boolean);
}

const polar = (deg: number, r: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [100 + Math.cos(rad) * r, 100 + Math.sin(rad) * r] as const;
};

export default function Wheel({
  prizes,
  onSpinComplete,
  spinDuration = 5000,
  closed = false,
  interactive = true,
}: {
  prizes: Prize[];
  onSpinComplete: (prize: Prize) => void;
  spinDuration?: number;
  /** Se alcanzó el límite diario de participaciones. */
  closed?: boolean;
  interactive?: boolean;
}) {
  const { state } = useApp();
  const themeName = useThemeName();
  const theme = THEMES[themeName];
  const reduced = useReducedMotion();
  const { enableSounds, enableAnimations } = state.gameConfig;

  const available = useMemo(() => prizes.filter((p) => p.active && p.currentWins < p.maxWins), [prizes]);
  const n = available.length;
  const seg = n ? 360 / n : 360;
  const fontSize = n > 9 ? 4.8 : n > 7 ? 5.4 : n > 5 ? 6.4 : 7.2;
  const pegStep = n < 10 ? seg / 2 : seg;

  const [phase, setPhase] = useState<SpinPhase>("idle");
  const [hitId, setHitId] = useState<string | null>(null);
  const rotation = useMotionValue(0);
  const pointer = useMotionValue(0);
  const lastPeg = useRef(0);
  const lastTick = useRef(0);
  const live = useRef({ enableSounds, reduced, phase });
  live.current = { enableSounds, reduced, phase };
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Cada clavo que pasa bajo la lengüeta: "clac" y rebote del puntero.
  useEffect(
    () =>
      rotation.on("change", (deg) => {
        const peg = Math.floor(deg / pegStep);
        if (peg === lastPeg.current) return;
        lastPeg.current = peg;
        const { phase, enableSounds, reduced } = live.current;
        if (phase !== "spinning") return;
        if (!reduced) {
          pointer.set(-16);
          animate(pointer, 0, { type: "spring", stiffness: 560, damping: 12 });
        }
        const now = performance.now();
        if (enableSounds && now - lastTick.current > 22) {
          lastTick.current = now;
          playTick();
        }
      }),
    [rotation, pointer, pegStep],
  );

  const spin = () => {
    if (!interactive || phase !== "idle" || closed || n === 0) return;
    unlockAudio();
    if (enableSounds) playWhoosh();

    const prize = pickWeighted(available);
    const index = available.findIndex((p) => p.id === prize.id);
    const center = index * seg + seg / 2;
    const current = rotation.get();
    const turns = (5 + Math.floor(Math.random() * 4)) * 360;
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const target = current + turns + (360 - center) - (current % 360) + jitter;

    lastPeg.current = Math.floor(current / pegStep);
    setPhase("spinning");
    live.current.phase = "spinning";

    animate(rotation, target, {
      duration: reduced ? 0.4 : spinDuration / 1000,
      ease: [0.16, 1, 0.3, 1],
    }).then(() => {
      setPhase("reveal");
      setHitId(prize.id);
      if (enableSounds) (prize.isWin !== false ? playWin : playLose)();
      timers.current.push(window.setTimeout(() => onSpinComplete(prize), reduced ? 500 : REVEAL_MS));
    });
  };

  const hit = available.find((p) => p.id === hitId);
  const ledMode = !enableAnimations
    ? "still"
    : phase === "spinning"
      ? "spin"
      : phase === "reveal" && hit?.isWin !== false
        ? "win"
        : "idle";

  const lockupTone = themeName === "light" ? "dark" : "light";

  if (n === 0 || closed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center px-[120px] text-center">
        <BrandLockup size={120} tone={lockupTone} />
        <p className="mt-[88px] text-balance text-[48px] font-extrabold leading-[1.15] tracking-[-0.02em] text-k-text">
          {closed ? "Por hoy se acabaron las participaciones" : "Por hoy se acabaron los premios"}
        </p>
        <p className="mt-[24px] text-[28px] leading-[1.5] text-k-muted">
          Vuelve mañana o pregunta en el stand de la UTA.
        </p>
      </div>
    );
  }

  const title = phase === "idle" ? "Tu turno" : phase === "spinning" ? "Girando…" : (hit?.name ?? "");
  const showCarousel = state.carouselConfig.active && state.carouselConfig.items.length > 0;

  return (
    <div className="flex h-full w-full flex-col items-center px-[72px] pt-[96px] pb-[56px]">
      <BrandLockup size={104} tone={lockupTone} className="h-[104px]" />

      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <h1
          className="min-h-[72px] text-center text-[64px] font-extrabold leading-[1.1] tracking-[-0.03em]"
          style={{ color: phase === "reveal" && hit?.isWin !== false ? "var(--ut-win)" : "var(--ut-text)" }}
        >
          {title}
        </h1>

        <div className="relative mt-[60px] shrink-0" style={{ width: WHEEL, height: WHEEL }}>
          {/* Anillo cromado exterior, como el del sello */}
          <div
            className="ut-chrome absolute inset-0 rounded-full"
            style={{
              boxShadow: `var(--ut-elev-3), inset 0 2px 3px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.35)`,
            }}
          />
          {/* Pista oscura con focos */}
          <div
            className="absolute rounded-full"
            style={{
              inset: CHROME,
              background: "radial-gradient(circle, #0a2038 60%, #04111f 100%)",
              boxShadow: "inset 0 4px 10px rgba(0,0,0,0.65), inset 0 -2px 4px rgba(255,255,255,0.06)",
            }}
          />
          <div className="ut-leds absolute inset-0" data-mode={ledMode} aria-hidden>
            {Array.from({ length: LED_COUNT }, (_, i) => {
              const r = WHEEL / 2 - CHROME - TRACK / 2;
              const a = ((i * 360) / LED_COUNT - 90) * (Math.PI / 180);
              const size = 13;
              return (
                <span
                  key={i}
                  className="ut-led absolute rounded-full"
                  style={{
                    width: size,
                    height: size,
                    left: WHEEL / 2 + Math.cos(a) * r - size / 2,
                    top: WHEEL / 2 + Math.sin(a) * r - size / 2,
                    animationDelay: `${(-(LED_COUNT - i) / LED_COUNT) * (ledMode === "spin" ? 0.55 : 2.4)}s`,
                  }}
                />
              );
            })}
          </div>
          {/* Filo cobre */}
          <div
            className="ut-copper absolute rounded-full"
            style={{ inset: CHROME + TRACK, boxShadow: "0 0 0 1px rgba(0,0,0,0.35)" }}
          />

          {/* Cara giratoria */}
          <motion.div
            className="absolute overflow-hidden rounded-full"
            style={{ inset: FACE_INSET, rotate: rotation }}
          >
            <svg className="h-full w-full" viewBox="0 0 200 200" aria-hidden>
              {available.map((p, i) => {
                const [x1, y1] = polar(i * seg, 100);
                const [x2, y2] = polar((i + 1) * seg, 100);
                const large = seg > 180 ? 1 : 0;
                const d =
                  n === 1
                    ? "M 100 0 A 100 100 0 1 1 99.99 0 Z"
                    : `M 100 100 L ${x1} ${y1} A 100 100 0 ${large} 1 ${x2} ${y2} Z`;
                const mid = i * seg + seg / 2;
                const [tx, ty] = polar(mid, 63);
                const [sx, sy] = polar(mid, 86);
                const upright = mid > 90 && mid < 270 ? mid + 180 : mid;
                const lines = splitLabel(p.name);
                const isHit = phase === "reveal" && p.id === hitId;
                const dim = phase === "reveal" && !isHit;
                return (
                  <g
                    key={p.id}
                    className={isHit && enableAnimations ? "ut-segment-hit" : undefined}
                    style={{
                      filter: dim ? "brightness(0.42) saturate(0.7)" : undefined,
                      transition: "filter 300ms var(--ut-ease-out)",
                    }}
                  >
                    <path d={d} fill={p.color} stroke={theme.segmentStroke} strokeWidth="0.6" />
                    {/* Brillo sutil del gajo */}
                    <path d={d} fill="url(#ut-seg-shade)" />
                    {p.isWin !== false && (
                      <path
                        d="M0 -3.6 L0.9 -0.9 L3.6 0 L0.9 0.9 L0 3.6 L-0.9 0.9 L-3.6 0 L-0.9 -0.9 Z"
                        transform={`translate(${sx} ${sy}) rotate(${upright})`}
                        fill={p.textColor || "#fff"}
                        opacity="0.85"
                      />
                    )}
                    <text
                      x={tx}
                      y={ty}
                      fill={p.textColor || theme.text}
                      fontSize={fontSize}
                      fontWeight={800}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${upright} ${tx} ${ty})`}
                      style={{ letterSpacing: "-0.02em", fontFamily: "var(--font-sans)" }}
                    >
                      {lines.map((line, j) => (
                        <tspan key={line + j} x={tx} dy={j === 0 ? `${-((lines.length - 1) * 0.55)}em` : "1.1em"}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                );
              })}
              {/* Clavos en los bordes de los gajos */}
              {Array.from({ length: Math.round(360 / pegStep) }, (_, i) => {
                const [px, py] = polar(i * pegStep, 95.6);
                const major = Math.abs((i * pegStep) % seg) < 0.01;
                return (
                  <circle
                    key={i}
                    cx={px}
                    cy={py}
                    r={major ? 1.75 : 1.2}
                    fill="url(#ut-peg)"
                    stroke="rgba(4,17,31,0.55)"
                    strokeWidth="0.35"
                  />
                );
              })}
              <defs>
                <radialGradient id="ut-seg-shade" cx="50%" cy="50%" r="50%">
                  <stop offset="30%" stopColor="#000" stopOpacity="0.16" />
                  <stop offset="62%" stopColor="#000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
                </radialGradient>
                <radialGradient id="ut-peg" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="55%" stopColor="#c9cfd7" />
                  <stop offset="100%" stopColor="#6b7480" />
                </radialGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Reflejo fijo sobre la cara (no gira) */}
          <div
            className="pointer-events-none absolute rounded-full"
            style={{
              inset: FACE_INSET,
              background:
                "radial-gradient(120% 80% at 30% 12%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 42%), radial-gradient(circle, transparent 62%, rgba(0,0,0,0.22) 100%)",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)",
            }}
          />

          {/* Centro con el sello */}
          <div
            className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
            style={{
              width: HUB + 16,
              height: HUB + 16,
              background:
                state.brand.centerLogoUrl || state.brand.logoUrl
                  ? `radial-gradient(circle at 50% 30%, ${state.brand.centerBgSecondaryColor}, ${state.brand.centerBgColor})`
                  : "var(--ut-ink-deep)",
              boxShadow: "0 10px 28px rgba(2,8,16,0.55), 0 0 0 5px var(--ut-copper), 0 0 0 7px rgba(4,17,31,0.6)",
            }}
          >
            <HubLogo size={HUB} />
          </div>

          {/* Puntero con lengüeta */}
          <motion.div
            className="absolute left-1/2 z-30"
            style={{
              top: -40,
              marginLeft: -48,
              rotate: pointer,
              transformOrigin: "48px 40px",
              filter: "drop-shadow(0 8px 10px rgba(2,8,16,0.55))",
            }}
            aria-hidden
          >
            <svg width="96" height="128" viewBox="0 0 96 128" fill="none">
              <defs>
                <linearGradient id="ut-pointer" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F7D3B3" />
                  <stop offset="45%" stopColor="#E4A57B" />
                  <stop offset="100%" stopColor="#9C6A4E" />
                </linearGradient>
                <radialGradient id="ut-pin" cx="40%" cy="35%" r="70%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#c9cfd7" />
                  <stop offset="100%" stopColor="#5d6672" />
                </radialGradient>
              </defs>
              <path
                d="M48 126 L16 58 A 36 36 0 1 1 80 58 Z"
                fill="url(#ut-pointer)"
                stroke="#04111F"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path d="M48 112 L26 62" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="48" cy="40" r="15" fill="url(#ut-pin)" stroke="#04111F" strokeWidth="2.5" />
              <circle cx="48" cy="40" r="5" fill="#04111F" />
            </svg>
          </motion.div>
        </div>

        <button
          type="button"
          onClick={spin}
          disabled={phase !== "idle"}
          className="ut-press ut-cta mt-[72px] flex h-[128px] w-[640px] items-center justify-center gap-[20px] rounded-[var(--ut-radius-sm)] text-[34px] font-extrabold tracking-[-0.01em] text-ut-ink"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${state.brand.primaryColor} 70%, white), ${state.brand.primaryColor} 45%, color-mix(in srgb, ${state.brand.primaryColor} 78%, black))`,
            boxShadow: "var(--ut-elev-2)",
          }}
        >
          <RotateCw className={`h-[36px] w-[36px] ${phase === "spinning" ? "ut-spin" : ""}`} strokeWidth={2.5} />
          {phase === "idle" ? "Girar la ruleta" : "Girando"}
        </button>
        <p className="mt-[28px] h-[32px] text-[24px] text-k-muted">{phase === "idle" ? state.messages.beforeSpin : ""}</p>
      </div>

      {showCarousel && (
        <div className="w-full pt-[24px]">
          <LogoCarousel {...state.carouselConfig} />
        </div>
      )}
    </div>
  );
}
