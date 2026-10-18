import { BRAND_NAME, SEAL, splitBalanced } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { useApp } from "@/state/AppProvider";

const SEAL_ALT = "Sello de la Universidad Tecnológica de Aguascalientes";

/** Sello oficial (anillo cromado + disco cobre con la marca UT). */
export function Seal({ size, className }: { size: number; className?: string }) {
  const src = size > 360 ? SEAL.lg : size > 140 ? SEAL.md : SEAL.sm;
  return (
    <img
      src={src}
      alt={SEAL_ALT}
      width={size}
      height={size}
      draggable={false}
      className={cn("select-none", className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Logotipo que subió el administrador (si lo hay). Si falla al cargar, se oculta. */
function CustomLogo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={cn("object-contain", className)}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

/**
 * Encabezado de marca: sello + "Universidad Tecnológica / de Aguascalientes".
 * `size` es el alto del sello en px del lienzo del tótem (1080 de ancho).
 */
export function BrandLockup({
  size = 112,
  className,
  tone = "light",
}: {
  size?: number;
  className?: string;
  tone?: "light" | "dark";
}) {
  const { state } = useApp();
  const { logoUrl, logoText, companyName, isWhiteLabel } = state.brand;
  const custom = logoUrl?.trim();
  if (custom) return <CustomLogo src={custom} alt={companyName} className={cn("w-auto", className)} />;

  const text = (logoText || companyName || BRAND_NAME).trim();
  const [first, second] = splitBalanced(text);
  const textColor = tone === "light" ? "text-ut-paper" : "text-ut-ink";

  if (isWhiteLabel) {
    return (
      <p className={cn("text-center font-extrabold tracking-tight", textColor, className)} style={{ fontSize: size * 0.42 }}>
        {companyName}
      </p>
    );
  }

  return (
    <div className={cn("flex items-center", className)} style={{ gap: size * 0.22 }}>
      <Seal size={size} className="shrink-0 drop-shadow-[0_6px_14px_rgba(2,8,16,0.35)]" />
      <span
        aria-hidden
        className="self-stretch"
        style={{
          width: Math.max(2, size * 0.022),
          margin: `${size * 0.12}px 0`,
          background: "linear-gradient(to bottom, transparent, var(--ut-copper), transparent)",
        }}
      />
      <div className="leading-none" style={{ fontSize: size * 0.23 }}>
        <p className={cn("font-extrabold uppercase", textColor)} style={{ letterSpacing: "0.06em" }}>
          {first}
        </p>
        {second && (
          <p
            className="ut-copper-text font-bold uppercase"
            style={{ letterSpacing: "0.16em", marginTop: size * 0.09, fontSize: "0.86em" }}
          >
            {second}
          </p>
        )}
      </div>
    </div>
  );
}

/** Logotipo del centro de la ruleta: logo central → logo de marca → sello. */
export function HubLogo({ size }: { size: number }) {
  const { state } = useApp();
  const custom = state.brand.centerLogoUrl?.trim() || state.brand.logoUrl?.trim();
  if (custom) {
    return (
      <div className="flex items-center justify-center rounded-full" style={{ width: size, height: size, padding: size * 0.16 }}>
        <CustomLogo src={custom} alt={state.brand.companyName} className="h-full w-full" />
      </div>
    );
  }
  return <Seal size={size} />;
}

/**
 * Intro animada del sello para la pantalla de bienvenida: el anillo con el
 * nombre entra girando, el disco cobre con la marca UT aparece desde el centro
 * y un destello lo cruza. Las dos capas salen de la misma imagen oficial.
 */
export function SealIntro({ size }: { size: number }) {
  const { state } = useApp();
  const custom = state.brand.logoUrl?.trim();
  if (custom) {
    return (
      <div className="ut-seal-intro flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="ut-seal-core h-full w-full">
          <CustomLogo src={custom} alt={state.brand.companyName} className="h-full w-full" />
        </div>
      </div>
    );
  }

  const CORE = 76; // % del radio donde termina el disco cobre (con su filo cromado)
  const ringMask = `radial-gradient(circle closest-side, transparent calc(${CORE}% - 1px), #000 ${CORE}%)`;
  const coreMask = `radial-gradient(circle closest-side, #000 calc(${CORE}% - 1px), transparent ${CORE}%)`;

  return (
    <div className="ut-seal-intro relative" style={{ width: size, height: size }} role="img" aria-label={SEAL_ALT}>
      <div
        className="ut-seal-halo absolute rounded-full"
        style={{
          inset: -size * 0.12,
          background:
            "radial-gradient(circle, rgba(46,139,216,0.35) 0%, rgba(46,139,216,0.12) 45%, transparent 70%)",
        }}
      />
      <img
        src={SEAL.lg}
        alt=""
        draggable={false}
        className="ut-seal-ring absolute inset-0 h-full w-full"
        style={{ maskImage: ringMask, WebkitMaskImage: ringMask }}
      />
      <div
        className="ut-seal-core absolute inset-0 overflow-hidden rounded-full"
        style={{ maskImage: coreMask, WebkitMaskImage: coreMask }}
      >
        <img src={SEAL.lg} alt="" draggable={false} className="h-full w-full" />
        <div
          className="ut-seal-shine absolute inset-y-0"
          style={{
            left: 0,
            width: "38%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
            mixBlendMode: "soft-light",
          }}
        />
      </div>
    </div>
  );
}
