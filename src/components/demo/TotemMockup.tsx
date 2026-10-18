import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DemoConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Posición de la pantalla dentro del tótem dibujado (cuando no hay foto del marco). */
const FALLBACK_SCREEN = { top: "2.73%", left: "6.5%", width: "87%", height: "69.55%", radius: "6px" };

/**
 * Tótem físico con la pantalla interactiva incrustada. Usa la foto del marco
 * configurada en el panel; si no hay o no carga, dibuja un tótem genérico para
 * que la demo nunca se quede en blanco.
 */
export default function TotemMockup({
  config,
  children,
  onScreenClick,
  className,
  height,
  screenOverlay,
}: {
  config: DemoConfig;
  children: ReactNode;
  onScreenClick?: () => void;
  className?: string;
  /** Alto del tótem en px (o cualquier valor CSS). */
  height: number | string;
  screenOverlay?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const url = config.frameImageUrl.trim();
  useEffect(() => setFailed(false), [url]);
  const drawn = !url || failed;

  const screen = drawn
    ? FALLBACK_SCREEN
    : {
        top: config.screenTop,
        left: config.screenLeft,
        width: config.screenWidth,
        height: config.screenHeight,
        radius: config.screenBorderRadius,
      };

  return (
    <div className={cn("relative", className)} style={{ height }}>
      {drawn ? (
        <DrawnTotem />
      ) : (
        <img
          src={url}
          alt="Marco del tótem"
          draggable={false}
          onError={() => setFailed(true)}
          className="pointer-events-none relative z-10 h-full w-auto select-none object-contain"
        />
      )}
      <div
        role={onScreenClick ? "button" : undefined}
        tabIndex={onScreenClick ? 0 : undefined}
        onClick={onScreenClick}
        onKeyDown={(e) => onScreenClick && (e.key === "Enter" || e.key === " ") && onScreenClick()}
        className={cn(
          "group absolute z-20 overflow-hidden bg-ut-ink",
          onScreenClick && "cursor-pointer outline-none ring-ut-copper transition-shadow hover:ring-4 focus-visible:ring-4",
        )}
        style={{ top: screen.top, left: screen.left, width: screen.width, height: screen.height, borderRadius: screen.radius }}
      >
        <ScaledScreen>{children}</ScaledScreen>
        {screenOverlay}
      </div>
    </div>
  );
}

/** Escala el lienzo de 1080×1920 del tótem al tamaño de la pantalla del marco. */
function ScaledScreen({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) setScale(Math.min(r.width / 1080, r.height / 1920));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="pointer-events-none absolute inset-0">
      <div
        className="absolute left-1/2 top-1/2"
        style={{ width: 1080, height: 1920, transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: "center" }}
      >
        {children}
      </div>
    </div>
  );
}

/** Tótem genérico: cuerpo grafito, filo cromado y base. Proporción 1 : 2.2. */
function DrawnTotem() {
  return (
    <svg viewBox="0 0 100 220" className="relative z-10 h-full w-auto drop-shadow-2xl" aria-label="Tótem" role="img">
      <defs>
        <linearGradient id="totem-body" x1="0" x2="1">
          <stop offset="0" stopColor="#2a313b" />
          <stop offset="0.5" stopColor="#3b4450" />
          <stop offset="1" stopColor="#1e242c" />
        </linearGradient>
        <linearGradient id="totem-edge" x1="0" x2="1">
          <stop offset="0" stopColor="#9aa3ae" />
          <stop offset="0.5" stopColor="#f2f4f7" />
          <stop offset="1" stopColor="#7d8692" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="99" height="196" rx="6" fill="url(#totem-edge)" />
      <rect x="2" y="2" width="96" height="193" rx="5" fill="url(#totem-body)" />
      <rect x="6.5" y="6" width="87" height="153" rx="2.5" fill="#04111f" />
      <rect x="30" y="171" width="40" height="10" rx="2" fill="#E4A57B" opacity="0.9" />
      <rect x="34" y="174.2" width="32" height="1.4" rx="0.7" fill="#071a2e" opacity="0.5" />
      <rect x="34" y="177" width="22" height="1.4" rx="0.7" fill="#071a2e" opacity="0.5" />
      <path d="M22 196 h56 l6 18 a4 4 0 0 1 -4 5 h-60 a4 4 0 0 1 -4 -5 z" fill="url(#totem-edge)" />
      <path d="M26 197 h48 l4.5 15 h-57 z" fill="#2a313b" />
    </svg>
  );
}
