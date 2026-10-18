import { useState } from "react";
import { KeyRound, RotateCcw, ShieldAlert, Volume2 } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ConfirmDialog, Input, Label, SwitchRow } from "@/components/ui";
import { todayKey } from "@/lib/brand";
import { playTick, playWin, unlockAudio } from "@/lib/sound";
import { useApp } from "@/state/AppProvider";

export default function SettingsSection() {
  const { state, updateGameConfig, resetDailyCount, resetEverything } = useApp();
  const g = state.gameConfig;
  const [confirmDaily, setConfirmDaily] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const today = g.countDate === todayKey() ? g.currentDailyCount : 0;

  const testSound = () => {
    unlockAudio();
    [0, 90, 190, 300, 430].forEach((ms) => setTimeout(() => playTick(), ms));
    setTimeout(playWin, 650);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Juego</CardTitle>
          <CardDescription>Ritmo de la ruleta y experiencia en el tótem.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cfg-limit">Límite de participaciones por día</Label>
              <Input
                id="cfg-limit"
                type="number"
                min={0}
                value={g.dailyLimit}
                onChange={(e) => updateGameConfig({ dailyLimit: Math.max(0, Number.parseInt(e.target.value, 10) || 0) })}
              />
              <p className="text-xs text-muted-foreground">
                Hoy van <b>{today}</b>. Al llegar al límite el tótem muestra "Por hoy se acabaron las participaciones". El conteo se
                reinicia solo cada día. 0 = sin límite.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cfg-spin">Duración del giro: {(g.spinDuration / 1000).toFixed(1)} s</Label>
              <input
                id="cfg-spin"
                type="range"
                min={3000}
                max={10000}
                step={500}
                value={g.spinDuration}
                onChange={(e) => updateGameConfig({ spinDuration: Number(e.target.value) })}
                className="mt-3 w-full accent-[var(--ut-copper-deep)]"
              />
              <p className="text-xs text-muted-foreground">Entre 3 y 10 segundos. 5 s es el ritmo original.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SwitchRow
              id="cfg-sound"
              label="Sonidos"
              hint="Clic de la lengüeta al girar y fanfarria al ganar."
              checked={g.enableSounds}
              onCheckedChange={(v) => updateGameConfig({ enableSounds: v })}
            />
            <SwitchRow
              id="cfg-anim"
              label="Animaciones de celebración"
              hint="Confeti, rayos y focos del bisel."
              checked={g.enableAnimations}
              onCheckedChange={(v) => updateGameConfig({ enableAnimations: v })}
            />
          </div>
          <Button variant="outline" size="sm" onClick={testSound}>
            <Volume2 className="size-4" /> Probar sonido en este equipo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contadores y reseteo</CardTitle>
          <CardDescription>Acciones de mantenimiento para antes o después de un evento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Reiniciar conteo de hoy</p>
              <p className="text-sm text-muted-foreground">Vuelve a cero las participaciones de hoy ({today}). No borra leads.</p>
            </div>
            <Button variant="outline" onClick={() => setConfirmDaily(true)}>
              <RotateCcw className="size-4" /> Reiniciar conteo
            </Button>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 font-semibold text-destructive">
                <ShieldAlert className="size-4" /> Resetear todo el sistema
              </p>
              <p className="text-sm text-muted-foreground">
                Borra todos los leads, contadores y personalizaciones del servidor y vuelve a la configuración de fábrica de la UTA.
              </p>
              {resetMsg && <p className="mt-1 text-sm font-semibold">{resetMsg}</p>}
            </div>
            <Button variant="destructive" onClick={() => setConfirmAll(true)}>
              Resetear todo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-ut-copper-deep" /> Contraseña del panel
          </CardTitle>
          <CardDescription>
            La contraseña no viaja en la página: el servidor guarda sólo su hash. Para cambiarla, genera un hash nuevo con
            <code className="mx-1 rounded bg-secondary px-1.5 py-0.5 text-xs">php scripts/hash-password.php "nueva"</code>
            y colócalo en <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">api/config.php</code> (ver README).
          </CardDescription>
        </CardHeader>
      </Card>

      <ConfirmDialog
        open={confirmDaily}
        onOpenChange={setConfirmDaily}
        title="¿Reiniciar el conteo de hoy?"
        description="Las participaciones de hoy vuelven a cero en todos los tótems. Los leads y los premios entregados no cambian."
        confirmLabel="Reiniciar"
        destructive={false}
        onConfirm={resetDailyCount}
      />
      <ConfirmDialog
        open={confirmAll}
        onOpenChange={setConfirmAll}
        title="¿Resetear todo el sistema?"
        description="Se borran del servidor todos los leads, los premios entregados, los contadores y la personalización (gajos, marca, mensajes, carrusel y demo). Exporta los leads antes: esta acción no se puede deshacer."
        confirmLabel="Sí, borrar todo"
        onConfirm={async () => {
          const r = await resetEverything();
          setResetMsg(
            r === "ok" ? "Sistema restablecido." : r === "sesion-expirada" ? "La sesión venció: vuelve a entrar." : "No se pudo contactar con el servidor.",
          );
        }}
      />
    </div>
  );
}
