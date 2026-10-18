import type { CSSProperties } from "react";
import { BrandLockup, HubLogo } from "@/components/brand/Brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, SwitchRow } from "@/components/ui";
import { useApp } from "@/state/AppProvider";
import { ColorField, ImageField, RestoreFooter } from "../shared";

export default function BrandSection() {
  const { state, updateBrand } = useApp();
  const b = state.brand;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Identidad visual</CardTitle>
          <CardDescription>Por defecto el tótem usa el sello oficial de la UTA. Aquí puedes ajustarlo para un evento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SwitchRow
            id="white-label"
            label="Modo marca blanca"
            hint="Oculta el sello de la UTA y muestra sólo el nombre o el logotipo que subas."
            checked={b.isWhiteLabel}
            onCheckedChange={(v) => updateBrand({ isWhiteLabel: v })}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="b-company">Nombre de la institución</Label>
              <Input id="b-company" value={b.companyName} onChange={(e) => updateBrand({ companyName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-system">Nombre del sistema</Label>
              <Input id="b-system" value={b.systemName} onChange={(e) => updateBrand({ systemName: e.target.value })} />
              <p className="text-xs text-muted-foreground">Aparece en la bienvenida y en el reporte de leads.</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="b-logotext">Texto junto al sello</Label>
              <Input id="b-logotext" value={b.logoText} onChange={(e) => updateBrand({ logoText: e.target.value })} />
              <p className="text-xs text-muted-foreground">Se divide solo en dos renglones en el encabezado del tótem.</p>
            </div>
          </div>

          <ImageField
            label="Logotipo propio (reemplaza al sello)"
            value={b.logoUrl}
            onChange={(v) => updateBrand({ logoUrl: v })}
            hint="Opcional. PNG o WebP con fondo transparente. Déjalo vacío para usar el sello oficial."
            maxSide={900}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ColorField label="Botones" value={b.primaryColor} onChange={(v) => updateBrand({ primaryColor: v })} hint="Girar y participar." />
            <ColorField label="Resplandor" value={b.secondaryColor} onChange={(v) => updateBrand({ secondaryColor: v })} hint="Brillo superior del fondo." />
            <ColorField label="Fondo (versión oscura)" value={b.backgroundColor} onChange={(v) => updateBrand({ backgroundColor: v })} />
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <div>
              <h3 className="font-bold">Centro de la ruleta</h3>
              <p className="text-sm text-muted-foreground">Por defecto muestra el sello. Puedes poner el logo de un patrocinador o de la carrera.</p>
            </div>
            <ImageField
              label="Logotipo central"
              value={b.centerLogoUrl}
              onChange={(v) => updateBrand({ centerLogoUrl: v })}
              maxSide={600}
              previewClass="rounded-full"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ColorField label="Fondo central" value={b.centerBgColor} onChange={(v) => updateBrand({ centerBgColor: v })} />
              <ColorField label="Fondo central (brillo)" value={b.centerBgSecondaryColor} onChange={(v) => updateBrand({ centerBgSecondaryColor: v })} />
            </div>
          </div>

          <RestoreFooter section="brand" label="la marca" />
        </CardContent>
      </Card>

      <Card className="h-fit xl:sticky xl:top-[84px]">
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
          <CardDescription>Encabezado, centro y botón del tótem.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            data-ut-theme={b.theme}
            className="ut-kiosk ut-field flex flex-col items-center gap-6 overflow-hidden rounded-2xl px-5 py-8"
            style={
              b.theme === "dark"
                ? ({ "--ut-field": b.backgroundColor, "--ut-glow-top": `color-mix(in srgb, ${b.secondaryColor} 38%, transparent)` } as CSSProperties)
                : undefined
            }
          >
            <BrandLockup size={52} tone={b.theme === "light" ? "dark" : "light"} className="h-[52px] max-w-full" />
            <div
              className="flex items-center justify-center rounded-full p-1.5"
              style={{
                background:
                  b.centerLogoUrl || b.logoUrl ? `radial-gradient(circle at 50% 30%, ${b.centerBgSecondaryColor}, ${b.centerBgColor})` : "var(--ut-ink-deep)",
                boxShadow: "0 0 0 3px var(--ut-copper)",
              }}
            >
              <HubLogo size={110} />
            </div>
            <div
              className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-extrabold text-ut-ink shadow-lg"
              style={{ background: b.primaryColor }}
            >
              Girar la ruleta
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
