import { useId, useRef, useState } from "react";
import { ImageUp, RotateCcw, Trash2 } from "lucide-react";
import { Seal } from "@/components/brand/Brand";
import { Button, ConfirmDialog, Input, Label } from "@/components/ui";
import { fileToDataUrl } from "@/lib/image";
import type { Prize } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useApp, type RestorableSection } from "@/state/AppProvider";

/** Pie de cada sección: aviso de guardado automático + restaurar valores de fábrica. */
export function RestoreFooter({ section, label }: { section: RestorableSection; label: string }) {
  const { restoreDefaults } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">Los cambios se guardan solos y llegan a todos los tótems en segundos.</p>
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-muted-foreground">
          <RotateCcw className="size-4" /> Restaurar
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`¿Restaurar ${label} de fábrica?`}
        description="Se descarta lo que hayas configurado en esta sección y vuelven los valores de la UTA. No afecta a los leads capturados ni al resto de secciones, y no se puede deshacer."
        confirmLabel="Restaurar"
        onConfirm={() => restoreDefaults(section)}
      />
    </>
  );
}

/** Campo de color: muestra + valor hexadecimal editable. */
export function ColorField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const id = useId();
  const safe = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input id={id} type="color" value={safe} onChange={(e) => onChange(e.target.value)} className="w-14 shrink-0" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono uppercase"
          aria-label={`${label} (hexadecimal)`}
          maxLength={22}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Subida de imagen (se reduce y se guarda como data URL) con vista previa. */
export function ImageField({
  label,
  value,
  onChange,
  hint,
  maxSide = 800,
  previewClass,
  allowUrl = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  maxSide?: number;
  previewClass?: string;
  allowUrl?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onFile = async (file?: File) => {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      onChange(await fileToDataUrl(file, maxSide));
    } catch {
      setError("No se pudo leer la imagen. Prueba con PNG, JPG, WebP o SVG.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={cn(
            "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-input bg-[repeating-conic-gradient(#eef2f7_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]",
            previewClass,
          )}
        >
          {value ? (
            <img src={value} alt="" className="max-h-full max-w-full object-contain p-1" />
          ) : (
            <ImageUp className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()} disabled={busy}>
              <ImageUp className="size-4" /> {busy ? "Procesando…" : value ? "Cambiar" : "Subir imagen"}
            </Button>
            {value && (
              <Button type="button" variant="ghost-destructive" size="sm" onClick={() => onChange("")}>
                <Trash2 className="size-4" /> Quitar
              </Button>
            )}
          </div>
          <input
            ref={input}
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          {allowUrl && (
            <Input
              value={value.startsWith("data:") ? "" : value}
              placeholder={value.startsWith("data:") ? "Imagen subida desde este equipo" : "…o pega la URL de una imagen"}
              onChange={(e) => onChange(e.target.value.trim())}
            />
          )}
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}

/** Vista previa estática de la ruleta con los gajos activos. */
export function MiniWheel({ prizes, size = 220 }: { prizes: Prize[]; size?: number }) {
  const list = prizes.filter((p) => p.active && p.currentWins < p.maxWins);
  const n = list.length;
  const seg = n ? 360 / n : 360;
  const polar = (deg: number, r: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [100 + Math.cos(rad) * r, 100 + Math.sin(rad) * r] as const;
  };
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="ut-chrome absolute inset-0 rounded-full shadow-lg" />
      <div className="ut-copper absolute rounded-full" style={{ inset: size * 0.035 }} />
      <svg viewBox="0 0 200 200" className="absolute" style={{ inset: size * 0.045 }} aria-label="Vista previa de la ruleta">
        {n === 0 ? (
          <circle cx="100" cy="100" r="100" fill="#0d2742" />
        ) : (
          list.map((p, i) => {
            const [x1, y1] = polar(i * seg, 100);
            const [x2, y2] = polar((i + 1) * seg, 100);
            const d = n === 1 ? "M 100 0 A 100 100 0 1 1 99.99 0 Z" : `M 100 100 L ${x1} ${y1} A 100 100 0 ${seg > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
            return <path key={p.id} d={d} fill={p.color} stroke="#04111f" strokeWidth="0.8" />;
          })
        )}
      </svg>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md ring-2 ring-ut-copper">
        <Seal size={size * 0.3} />
      </div>
      <svg
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: -size * 0.04 }}
        width={size * 0.11}
        height={size * 0.14}
        viewBox="0 0 96 128"
        aria-hidden
      >
        <path d="M48 126 L16 58 A 36 36 0 1 1 80 58 Z" fill="#E4A57B" stroke="#04111F" strokeWidth="5" />
      </svg>
    </div>
  );
}
