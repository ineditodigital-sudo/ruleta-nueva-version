import { Images, Plus, Trash2 } from "lucide-react";
import LogoCarousel from "@/components/kiosk/LogoCarousel";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, SwitchRow } from "@/components/ui";
import type { CarouselItem } from "@/lib/types";
import { uid } from "@/lib/utils";
import { useApp } from "@/state/AppProvider";
import { ColorField, ImageField, RestoreFooter } from "../shared";

export default function CarouselSection() {
  const { state, updateCarouselConfig } = useApp();
  const c = state.carouselConfig;

  const setItem = (id: string, patch: Partial<CarouselItem>) =>
    updateCarouselConfig({ items: c.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carrusel de logotipos</CardTitle>
        <CardDescription>Logotipos de aliados, patrocinadores o carreras que desfilan bajo la ruleta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SwitchRow
            id="car-active"
            label="Mostrar carrusel"
            hint="Aparece sólo si hay al menos un logotipo con imagen."
            checked={c.active}
            onCheckedChange={(v) => updateCarouselConfig({ active: v })}
          />
          <SwitchRow
            id="car-gray"
            label="Blanco y negro"
            hint="Unifica logotipos de colores distintos."
            checked={c.grayscale}
            onCheckedChange={(v) => updateCarouselConfig({ grayscale: v })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ColorField
            label="Fondo de la cinta"
            value={c.backgroundColor === "transparent" ? "" : c.backgroundColor}
            onChange={(v) => updateCarouselConfig({ backgroundColor: v || "transparent" })}
            hint="Vacío = transparente."
          />
          <div className="space-y-2">
            <Label htmlFor="car-speed">Vuelta completa en (segundos)</Label>
            <Input
              id="car-speed"
              type="number"
              min={4}
              max={120}
              value={c.speed}
              onChange={(e) => updateCarouselConfig({ speed: Math.min(120, Math.max(4, Number(e.target.value) || 20)) })}
            />
            <p className="text-xs text-muted-foreground">Menos segundos = más rápido.</p>
          </div>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">Logotipos ({c.items.length})</h3>
            <Button
              variant="copper"
              size="sm"
              onClick={() => updateCarouselConfig({ items: [...c.items, { id: uid(), imageUrl: "", altText: "Nuevo logotipo" }] })}
            >
              <Plus className="size-4" /> Agregar logotipo
            </Button>
          </div>

          {c.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-input py-10 text-center">
              <Images className="mx-auto mb-2 size-8 text-muted-foreground/50" />
              <p className="font-semibold">Aún no hay logotipos</p>
              <p className="text-sm text-muted-foreground">Agrega marcas o aliados para mostrarlos bajo la ruleta.</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {c.items.map((it) => (
                <div key={it.id} className="space-y-3 rounded-xl border border-border p-4">
                  <ImageField label="Imagen" value={it.imageUrl} onChange={(v) => setItem(it.id, { imageUrl: v })} maxSide={500} allowUrl />
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor={`alt-${it.id}`}>Nombre (texto alternativo)</Label>
                      <Input id={`alt-${it.id}`} value={it.altText} onChange={(e) => setItem(it.id, { altText: e.target.value })} />
                    </div>
                    <Button
                      variant="ghost-destructive"
                      size="icon"
                      onClick={() => updateCarouselConfig({ items: c.items.filter((x) => x.id !== it.id) })}
                      aria-label={`Quitar ${it.altText}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {c.items.some((it) => it.imageUrl) && (
            <div className="overflow-hidden rounded-xl bg-ut-ink p-2">
              <LogoCarousel items={c.items} backgroundColor={c.backgroundColor} speed={c.speed} grayscale={c.grayscale} compact />
            </div>
          )}
        </div>

        <RestoreFooter section="carousel" label="el carrusel" />
      </CardContent>
    </Card>
  );
}
