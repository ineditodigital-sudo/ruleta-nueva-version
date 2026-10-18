import { useEffect, useState, type ReactNode } from "react";
import Kiosk from "@/components/kiosk/Kiosk";
import { useKioskStyle, useThemeName } from "@/state/AppProvider";

const W = 1080;
const H = 1920;
/** Margen entre el campo enfocado y el teclado en pantalla. */
const KEYBOARD_GAP = 16;

const isTextField = (el: Element | null): el is HTMLElement =>
  !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el as HTMLElement).isContentEditable);

/**
 * El tótem se diseña en un lienzo fijo de 1080×1920 y se escala para llenar la
 * pantalla sin deformarse. En pantallas más anchas que 9:16 queda centrado como
 * una tarjeta. Cuando aparece el teclado en pantalla, el lienzo sube lo justo
 * para que el campo activo siga visible.
 */
function KioskFrame({ children }: { children: ReactNode }) {
  const theme = useThemeName();
  const vars = useKioskStyle();
  const [view, setView] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const onResize = () =>
      setView((prev) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        // Si sólo encoge el alto con un campo enfocado, es el teclado: no se reescala.
        if (w === prev.w && h < prev.h && isTextField(document.activeElement)) return prev;
        return { w, h };
      });
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    let timer = 0;
    const measure = () => {
      const el = document.activeElement;
      if (!isTextField(el)) return setLift(0);
      const visible = vv ? vv.height : window.innerHeight;
      const overlap = el.getBoundingClientRect().bottom - (visible - KEYBOARD_GAP);
      setLift(overlap > 0 ? Math.round(overlap) : 0);
    };
    const onFocusIn = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 260);
    };
    const onFocusOut = () => {
      window.clearTimeout(timer);
      setLift(0);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    vv?.addEventListener("resize", measure);
    vv?.addEventListener("scroll", measure);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      vv?.removeEventListener("resize", measure);
      vv?.removeEventListener("scroll", measure);
    };
  }, []);

  const scale = Math.min(view.w / W, view.h / H);
  const framed = view.w > W * scale + 48;

  return (
    <div data-ut-theme={theme} className="ut-field relative h-[100dvh] w-screen overflow-hidden" style={vars}>
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: W,
          height: H,
          transform: `translate(-50%, calc(-50% - ${lift}px)) scale(${scale})`,
          transformOrigin: "center center",
          transition: "transform 220ms var(--ut-ease-out)",
          borderRadius: framed ? 28 / scale : 0,
          overflow: "hidden",
          boxShadow: framed
            ? `0 ${40 / scale}px ${120 / scale}px ${theme === "light" ? "rgba(11,36,64,0.22)" : "rgba(2,8,16,0.65)"}`
            : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function KioskPage() {
  return (
    <KioskFrame>
      <Kiosk />
    </KioskFrame>
  );
}
