import { ExternalLink, MonitorSmartphone } from "lucide-react";
import TotemMockup from "@/components/demo/TotemMockup";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@/components/ui";
import type { DemoConfig } from "@/lib/types";
import { useApp } from "@/state/AppProvider";
import { ImageField, RestoreFooter } from "../shared";

const POSITION: Array<{ key: keyof DemoConfig; label: string; hint: string }> = [
  { key: "screenTop", label: "Arriba (top)", hint: "Distancia desde el borde superior del marco." },
  { key: "screenLeft", label: "Izquierda (left)", hint: "Distancia desde el borde izquierdo." },
  { key: "screenWidth", label: "Ancho (width)", hint: "Ancho de la pantalla dentro del marco." },
  { key: "screenHeight", label: "Alto (height)", hint: "Alto de la pantalla dentro del marco." },
  { key: "screenBorderRadius", label: "Redondeo (border-radius)", hint: "Esquinas de la pantalla (px)." },
];

export default function DemoSection() {
  const { state, updateDemoConfig } = useApp();
  const d = state.demoConfig;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader>
          <CardTitle>Marco del tótem para presentaciones</CardTitle>
          <CardDescription>
            La página /demo muestra el tótem dentro de la foto de su marco físico. Ajusta dónde cae la pantalla interactiva.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageField
            label="Foto del marco del tótem"
            value={d.frameImageUrl}
            onChange={(v) => updateDemoConfig({ frameImageUrl: v })}
            hint="PNG o WebP con la zona de pantalla visible. Si se deja vacío, la demo usa un tótem dibujado."
            maxSide={1600}
            allowUrl
          />

          <div className="space-y-3">
            <div>
              <h3 className="font-bold">Posición de la pantalla</h3>
              <p className="text-sm text-muted-foreground">Porcentajes relativos a la foto del marco.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {POSITION.map(({ key, label, hint }) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={`demo-${key}`}>{label}</Label>
                  <Input
                    id={`demo-${key}`}
                    value={d[key]}
                    onChange={(e) => updateDemoConfig({ [key]: e.target.value })}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
              ))}
            </div>
          </div>

          <Button asChild variant="copper">
            <a href="/demo" target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" /> Ver demo completa
            </a>
          </Button>

          <RestoreFooter section="demo" label="el marco de la demo" />
        </CardContent>
      </Card>

      <Card className="h-fit xl:sticky xl:top-[84px]">
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
          <CardDescription>El recuadro marca la pantalla interactiva.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center rounded-b-2xl bg-[#e9edf3] pt-6">
          <TotemMockup
            config={d}
            height={520}
            screenOverlay={
              <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-ut-copper bg-ut-copper/10">
                <span className="flex items-center gap-1.5 rounded-full bg-ut-ink/80 px-3 py-1 text-[11px] font-bold text-white">
                  <MonitorSmartphone className="size-3.5" /> Pantalla
                </span>
              </div>
            }
          >
            <div className="h-full w-full ut-field" />
          </TotemMockup>
        </CardContent>
      </Card>
    </div>
  );
}
