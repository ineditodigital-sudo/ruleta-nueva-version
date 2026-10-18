import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { HeartHandshake, Trophy } from "lucide-react";
import { BrandLockup } from "@/components/brand/Brand";
import { UT } from "@/lib/brand";
import type { Prize } from "@/lib/types";
import { useApp, useThemeName } from "@/state/AppProvider";

const ARRIVE = { duration: 0.42, ease: [0.16, 1, 0.3, 1] } as const;

export default function Result({ prize, durationMs }: { prize: Prize; durationMs: number }) {
  const { state } = useApp();
  const themeName = useThemeName();
  const reduced = useReducedMotion();
  const win = prize.isWin !== false;
  const celebrate = win && !reduced && state.gameConfig.enableAnimations;

  return (
    <div className="relative flex h-full w-full flex-col items-center px-[88px] pt-[120px] pb-[72px]">
      {celebrate && <Confetti />}

      <BrandLockup size={104} tone={themeName === "light" ? "dark" : "light"} className="relative z-10 h-[104px]" />

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          {win && celebrate && <div className="ut-rays absolute h-[620px] w-[620px] rounded-full" aria-hidden />}
          <motion.div
            initial={{ scale: reduced ? 1 : 0.6, opacity: 0, rotate: reduced ? 0 : -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", duration: 0.7, bounce: 0.35 }}
            className="relative flex h-[188px] w-[188px] items-center justify-center rounded-full"
            style={{
              background: win
                ? "radial-gradient(circle at 50% 30%, #12345a, #071a2e)"
                : "radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--ut-surface) 80%, white), var(--ut-surface))",
              boxShadow: win
                ? `0 0 0 6px ${UT.copper}, 0 0 0 9px rgba(4,17,31,0.5), 0 20px 50px rgba(228,165,123,0.35)`
                : "0 0 0 4px var(--ut-line), var(--ut-elev-2)",
            }}
          >
            {win ? (
              <Trophy className="h-[88px] w-[88px]" strokeWidth={1.9} style={{ color: UT.copperBright }} />
            ) : (
              <HeartHandshake className="h-[84px] w-[84px] text-k-muted" strokeWidth={1.7} />
            )}
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: reduced ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, ...ARRIVE }}
          className="mt-[56px] text-balance text-center text-[76px] font-extrabold leading-[1.04] tracking-[-0.035em] text-k-text"
        >
          {win ? state.messages.congratulations : state.messages.loseTitle}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...ARRIVE }}
          className="ut-panel mt-[56px] w-full px-[56px] py-[60px] text-center"
        >
          <p
            className={`text-balance text-[54px] font-extrabold leading-[1.1] tracking-[-0.03em] ${win ? "ut-copper-text" : "text-k-text"}`}
          >
            {win ? prize.name : "No hubo premio esta vez"}
          </p>
          {win && prize.description.trim() && (
            <p className="mt-[16px] text-[28px] font-semibold text-k-text">{prize.description}</p>
          )}
          <div
            className="mx-auto mt-[32px] h-[4px] w-[120px] rounded-full"
            style={{ background: win ? "linear-gradient(90deg, var(--ut-copper-bright), var(--ut-copper-deep))" : "var(--ut-line)" }}
          />
          <p className="mx-auto mt-[32px] max-w-[40ch] text-balance text-[29px] leading-[1.5] text-k-muted">
            {win ? state.messages.prizeMessage : state.messages.loseMessage}
          </p>
        </motion.div>
      </div>

      <div className="relative z-10 w-full pt-[40px]">
        <p className="mb-[18px] text-center text-[19px] font-semibold uppercase tracking-[0.22em] text-k-faint">
          Volviendo al inicio
        </p>
        <div className="mx-auto h-[4px] w-[420px] overflow-hidden rounded-full bg-k-line">
          <motion.div
            className="ut-copper h-full w-full origin-right rounded-full"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: durationMs / 1000, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}

/** Confeti con los colores del sello: lluvia desde arriba + estallido desde la medalla. */
function Confetti() {
  const colors = [UT.blue, UT.copper, UT.chrome, "#FFFFFF", UT.sky, UT.copperBright];
  const rain = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => {
        const shape = i % 3;
        const size = 10 + Math.random() * 10;
        return {
          id: i,
          x: Math.random() * 1080,
          drift: (Math.random() - 0.5) * 160,
          delay: Math.random() * 0.9,
          duration: 3.6 + Math.random() * 2.2,
          spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360),
          flip: 360 * (1 + Math.floor(Math.random() * 3)),
          w: shape === 2 ? size * 0.32 : size,
          h: shape === 0 ? size * 0.42 : shape === 1 ? size : size * 1.7,
          round: shape === 1,
          color: colors[i % colors.length],
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const burst = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2 + Math.random() * 0.2;
        const d = 260 + Math.random() * 220;
        return { id: i, dx: Math.cos(a) * d, dy: Math.sin(a) * d, size: 8 + Math.random() * 8, color: colors[i % colors.length] };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {burst.map((p) => (
        <motion.span
          key={`b${p.id}`}
          className="absolute rounded-full"
          style={{ left: 540, top: 700, width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ x: -p.size / 2, y: -p.size / 2, opacity: 1, scale: 1 }}
          animate={{ x: p.dx, y: p.dy + 120, opacity: 0, scale: 0.6 }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
        />
      ))}
      {rain.map((p) => (
        <motion.span
          key={p.id}
          className="absolute"
          style={{
            left: 0,
            top: 0,
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            borderRadius: p.round ? "50%" : 2,
            boxShadow: p.color === "#FFFFFF" ? "0 0 1px rgba(0,0,0,0.25)" : undefined,
          }}
          initial={{ x: p.x, y: -60, rotate: 0, rotateX: 0, opacity: 1 }}
          animate={{
            x: [p.x, p.x + p.drift, p.x - p.drift * 0.4, p.x + p.drift * 0.6],
            y: 1990,
            rotate: p.spin,
            rotateX: p.flip,
            opacity: [1, 1, 1, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "linear" }}
        />
      ))}
    </div>
  );
}
