import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SealIntro } from "@/components/brand/Brand";
import { todayKey } from "@/lib/brand";
import type { Participant, Prize } from "@/lib/types";
import { uid } from "@/lib/utils";
import { useApp, useKioskStyle, useThemeName } from "@/state/AppProvider";
import Registration, { EMPTY_FORM, type FormData } from "./Registration";
import Result from "./Result";
import Wheel from "./Wheel";

/** Duración de la bienvenida y de la pantalla de resultado (ms). */
export const SPLASH_MS = 2900;
export const RESULT_MS = 9000;
/** Sin tocar la pantalla este tiempo en registro/ruleta, se vuelve al inicio. */
const IDLE_MS = 90000;

type Phase = "splash" | "registration" | "wheel" | "result";

const ARRIVE = { duration: 0.42, ease: [0.16, 1, 0.3, 1] } as const;
const LEAVE = { duration: 0.24, ease: [0.23, 1, 0.32, 1] } as const;

/**
 * Flujo del tótem: bienvenida → registro (si se piden datos) → ruleta →
 * resultado → vuelta a la bienvenida.
 */
export default function Kiosk({ isDemoMode = false }: { isDemoMode?: boolean }) {
  const { state, registerSpin } = useApp();
  const theme = useThemeName();
  const vars = useKioskStyle();
  const reduced = useReducedMotion();
  const askData = state.gameConfig.requireRegistration;

  const [phase, setPhase] = useState<Phase>("splash");
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [won, setWon] = useState<Prize | null>(null);

  const { dailyLimit, currentDailyCount, countDate } = state.gameConfig;
  const todayCount = countDate === todayKey() ? currentDailyCount : 0;
  const limitReached = dailyLimit > 0 && todayCount >= dailyLimit;

  // Bienvenida → siguiente paso.
  useEffect(() => {
    if (phase !== "splash") return;
    const t = setTimeout(() => setPhase(askData && !limitReached ? "registration" : "wheel"), SPLASH_MS);
    return () => clearTimeout(t);
  }, [phase, askData, limitReached]);

  // Si el panel cambia "Pedir datos" a mitad de un turno, el tótem se acomoda.
  useEffect(() => {
    if (phase === "registration" && !askData) setPhase("wheel");
    else if (phase === "wheel" && askData && !form.name && !limitReached) setPhase("registration");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askData]);

  // Si alguien deja el registro o la ruleta a medias, el tótem vuelve solo al
  // inicio y borra lo capturado: el siguiente visitante no ve datos ajenos.
  useEffect(() => {
    if (isDemoMode || (phase !== "registration" && phase !== "wheel")) return;
    let t = 0;
    const arm = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        setPhase("splash");
        setForm(EMPTY_FORM);
      }, IDLE_MS);
    };
    arm();
    const events = ["pointerdown", "keydown", "input"] as const;
    events.forEach((e) => window.addEventListener(e, arm, true));
    return () => {
      window.clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, arm, true));
    };
  }, [phase, isDemoMode]);

  // Resultado → vuelta al inicio.
  useEffect(() => {
    if (phase !== "result") return;
    const t = setTimeout(() => {
      setPhase("splash");
      setForm(EMPTY_FORM);
      setWon(null);
    }, RESULT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const onSpinComplete = (prize: Prize) => {
    const participant: Participant | null = askData
      ? {
          id: uid(),
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          acceptedTerms: form.acceptedTerms,
          prizeWon: { id: prize.id, name: prize.name, description: prize.description, isWin: prize.isWin !== false },
          timestamp: new Date().toISOString(),
        }
      : null;
    registerSpin(prize, participant);
    setWon(prize);
    setPhase("result");
  };

  const enter = { opacity: 0, y: reduced ? 0 : 18 };

  return (
    <div data-ut-theme={theme} className="ut-kiosk ut-field relative h-full w-full overflow-hidden" style={vars}>
      <AnimatePresence>
        {phase === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: LEAVE }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-[76px]"
          >
            <SealIntro size={660} />
            <motion.p
              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, ...ARRIVE }}
              className="mt-[72px] text-[26px] font-semibold uppercase tracking-[0.42em] text-k-muted"
            >
              {state.brand.systemName}
            </motion.p>
            <div className="mt-[40px] h-[4px] w-[440px] overflow-hidden rounded-full bg-k-line">
              <motion.div
                className="ut-copper h-full w-full origin-left rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: SPLASH_MS / 1000, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}

        {phase === "registration" && (
          <motion.div
            key="registration"
            initial={enter}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: LEAVE }}
            transition={ARRIVE}
            className="absolute inset-0"
          >
            <Registration form={form} onChange={setForm} onSubmit={() => setPhase("wheel")} />
          </motion.div>
        )}

        {phase === "wheel" && (
          <motion.div
            key="wheel"
            initial={enter}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: LEAVE }}
            transition={ARRIVE}
            className="absolute inset-0"
          >
            <Wheel
              prizes={state.prizes}
              onSpinComplete={onSpinComplete}
              spinDuration={state.gameConfig.spinDuration}
              closed={limitReached}
              interactive={!isDemoMode}
            />
          </motion.div>
        )}

        {phase === "result" && won && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: LEAVE }}
            transition={ARRIVE}
            className="absolute inset-0"
          >
            <Result prize={won} durationMs={RESULT_MS} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
