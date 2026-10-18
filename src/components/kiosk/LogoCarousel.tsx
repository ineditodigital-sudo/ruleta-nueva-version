import { motion } from "framer-motion";
import type { CarouselConfig } from "@/lib/types";

/** Cinta infinita de logotipos de aliados bajo la ruleta. */
export default function LogoCarousel({
  items,
  backgroundColor = "transparent",
  speed = 20,
  grayscale = false,
  compact = false,
}: Pick<CarouselConfig, "items" | "backgroundColor" | "speed" | "grayscale"> & { compact?: boolean }) {
  const visible = items.filter((it) => it.imageUrl);
  if (!visible.length) return null;
  // Tres copias para que el bucle no deje huecos al reiniciar.
  const loop = [...visible, ...visible, ...visible];
  return (
    <div
      className="relative w-full select-none overflow-hidden"
      style={{
        backgroundColor,
        padding: compact ? "10px 0" : "26px 0",
        maskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)",
      }}
    >
      <motion.div
        className="flex items-center"
        style={{ width: "max-content", gap: compact ? 32 : 88 }}
        animate={{ x: ["0%", "-33.333%"] }}
        transition={{ duration: Math.max(4, speed), repeat: Infinity, ease: "linear", repeatType: "loop" }}
      >
        {loop.map((item, i) => (
          <div key={`${item.id}-${i}`} className="flex shrink-0 items-center justify-center">
            <img
              src={item.imageUrl}
              alt={item.altText}
              draggable={false}
              className="w-auto object-contain"
              style={{ height: compact ? 28 : 72, filter: grayscale ? "grayscale(1)" : "none" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
