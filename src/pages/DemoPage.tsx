import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MousePointerClick, X } from "lucide-react";
import { Seal } from "@/components/brand/Brand";
import TotemMockup from "@/components/demo/TotemMockup";
import Kiosk from "@/components/kiosk/Kiosk";
import { DEMO_BACKGROUND } from "@/lib/defaults";
import { useApp } from "@/state/AppProvider";

/**
 * Demostración para presentaciones: el tótem dentro de su marco físico. Al
 * hacer clic se abre la experiencia real (/totem) en tamaño de teléfono.
 */
export default function DemoPage() {
  const { state } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-auto px-4 py-8"
        style={{
          backgroundColor: "#dfe4ea",
          backgroundImage: `linear-gradient(rgba(7,26,46,0.25), rgba(7,26,46,0.25)), url(${DEMO_BACKGROUND})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mb-6 flex max-w-2xl items-center gap-5 rounded-2xl border border-white/60 bg-white/90 px-7 py-5 shadow-xl backdrop-blur-md">
          <Seal size={72} className="hidden shrink-0 sm:block" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ut-copper-deep">{state.brand.systemName}</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-ut-ink sm:text-3xl">Demostración interactiva</h1>
            <p className="mt-1 text-sm text-[#4e5f78]">Así se verá la experiencia en el tótem físico.</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-ut-blue">
              <MousePointerClick className="size-4" /> Haz clic en la pantalla para vivir la experiencia completa
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute bottom-0 left-1/2 h-16 w-[120%] -translate-x-1/2 translate-y-1/2 rounded-full bg-black/60 blur-3xl" />
          <TotemMockup
            config={state.demoConfig}
            height="min(75vh, 1100px)"
            onScreenClick={() => setOpen(true)}
            screenOverlay={
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                <span className="ut-copper rounded-full px-5 py-2.5 text-sm font-bold text-ut-ink opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  Clic para ver la experiencia completa
                </span>
              </div>
            }
          >
            <Kiosk isDemoMode />
          </TotemMockup>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ut-ink-deep/90 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mb-4 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 font-semibold text-ut-ink transition-colors hover:bg-[#eef2f7]"
              >
                <X className="size-5" /> Cerrar
              </button>
              <div className="ut-chrome rounded-[3rem] p-3 shadow-2xl">
                <div className="overflow-hidden rounded-[2.5rem] bg-ut-ink">
                  <iframe
                    src="/totem"
                    title="Vista del tótem"
                    className="block border-0"
                    style={{ width: 450, height: 800, maxWidth: "90vw", maxHeight: "80vh" }}
                  />
                </div>
              </div>
              <p className="mt-4 text-center text-sm font-semibold text-white">Vista del tótem interactivo (450×800)</p>
              <p className="text-center text-xs text-white/60">Formato vertical, la misma experiencia que en el tótem.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
