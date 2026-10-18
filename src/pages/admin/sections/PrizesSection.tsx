import { useId, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
} from "@/components/ui";
import { SEGMENT_SWATCHES } from "@/lib/defaults";
import { UT } from "@/lib/brand";
import type { Prize } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { useApp } from "@/state/AppProvider";
import { ColorField, MiniWheel, RestoreFooter } from "../shared";

type Draft = Omit<Prize, "id" | "currentWins">;

const EMPTY: Draft = {
  name: "",
  description: "",
  probability: 10,
  maxWins: 10,
  color: UT.blue,
  textColor: "#FFFFFF",
  isWin: true,
  active: true,
};

/** Texto legible sobre el color del gajo. */
function contrastText(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#FFFFFF";
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? UT.ink : "#FFFFFF";
}

const toInt = (v: string, min = 0) => Math.max(min, Number.parseInt(v, 10) || 0);

function PrizeForm({ draft, onChange }: { draft: Draft; onChange: (d: Draft) => void }) {
  const uidp = useId();
  const id = (name: string) => `${uidp}-${name}`;
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={id("p-name")}>Texto del gajo</Label>
        <Input id={id("p-name")} value={draft.name} maxLength={40} onChange={(e) => set("name", e.target.value)} placeholder="Ej: Termo UTA" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={id("p-desc")}>Descripción (opcional)</Label>
        <Input
          id={id("p-desc")}
          value={draft.description}
          maxLength={120}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Se muestra en la pantalla del premio"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={id("p-prob")}>Peso / probabilidad</Label>
        <Input id={id("p-prob")} type="number" min={0} value={draft.probability} onChange={(e) => set("probability", toInt(e.target.value))} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={id("p-max")}>Máximo de veces que puede salir</Label>
        <Input id={id("p-max")} type="number" min={1} value={draft.maxWins} onChange={(e) => set("maxWins", toInt(e.target.value, 1))} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Color del gajo</Label>
        <div className="flex flex-wrap gap-2">
          {SEGMENT_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...draft, color: c, textColor: contrastText(c) })}
              className={cn(
                "size-8 rounded-full border border-black/10 shadow-sm transition-transform hover:scale-110",
                draft.color.toLowerCase() === c.toLowerCase() && "ring-2 ring-ut-ink ring-offset-2",
              )}
              style={{ backgroundColor: c }}
              aria-label={`Usar color ${c}`}
            />
          ))}
        </div>
      </div>
      <ColorField label="Color personalizado" value={draft.color} onChange={(v) => set("color", v)} />
      <ColorField label="Color del texto" value={draft.textColor} onChange={(v) => set("textColor", v)} />
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 sm:col-span-2">
        <div>
          <Label htmlFor={id("p-win")}>Gajo premiado</Label>
          <p className="mt-1 text-xs text-muted-foreground">Apágalo para gajos tipo "Suerte para la próxima".</p>
        </div>
        <Switch id={id("p-win")} checked={draft.isWin} onCheckedChange={(v) => set("isWin", v)} />
      </div>
    </div>
  );
}

export default function PrizesSection() {
  const { state, addPrize, updatePrize, deletePrize, resetPrizeWins } = useApp();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<Prize | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY);
  const [toDelete, setToDelete] = useState<Prize | null>(null);

  const live = state.prizes.filter((p) => p.active && p.currentWins < p.maxWins);
  const totalWeight = live.reduce((s, p) => s + Math.max(0, p.probability), 0);
  const winChance = totalWeight
    ? Math.round((live.filter((p) => p.isWin !== false).reduce((s, p) => s + p.probability, 0) / totalWeight) * 100)
    : 0;

  const add = () => {
    if (!draft.name.trim()) return;
    addPrize({ ...draft, name: draft.name.trim(), id: uid(), currentWins: 0 });
    setDraft(EMPTY);
  };

  const openEdit = (p: Prize) => {
    const { id: _id, currentWins: _cw, ...rest } = p;
    setEditDraft(rest);
    setEditing(p);
  };

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Gajos de la ruleta</CardTitle>
            <CardDescription>
              Cada gajo sale según su peso relativo frente a los demás. Los gajos inactivos o agotados no aparecen en la ruleta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.prizes.map((p) => {
              const share = totalWeight && live.includes(p) ? Math.round((p.probability / totalWeight) * 100) : 0;
              const exhausted = p.currentWins >= p.maxWins;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex flex-col gap-4 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center",
                    !p.active && "opacity-60",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div
                      className="flex size-12 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold shadow-inner"
                      style={{ backgroundColor: p.color, color: p.textColor }}
                    >
                      {share}%
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-bold">{p.name}</h4>
                      {p.description && <p className="truncate text-sm text-muted-foreground">{p.description}</p>}
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge variant={p.isWin !== false ? "copper" : "secondary"}>{p.isWin !== false ? "Premiado" : "Sin premio"}</Badge>
                        <Badge variant="outline">Peso {p.probability}</Badge>
                        <Badge variant={exhausted ? "default" : "outline"}>
                          {p.currentWins}/{p.maxWins} {exhausted ? "· agotado" : "entregados"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 border-t border-border pt-3 sm:border-0 sm:pt-0">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      Activo
                      <Switch checked={p.active} onCheckedChange={(v) => updatePrize(p.id, { active: v })} aria-label={`${p.name} visible en la ruleta`} />
                    </label>
                    <Button variant="outline" size="icon" onClick={() => openEdit(p)} aria-label={`Editar ${p.name}`}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost-destructive" size="icon" onClick={() => setToDelete(p)} aria-label={`Eliminar ${p.name}`}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            <div className="mt-6 space-y-4 rounded-xl border border-dashed border-input bg-[#f8fafc] p-4">
              <h3 className="font-bold">Agregar gajo</h3>
              <PrizeForm draft={draft} onChange={setDraft} />
              <Button onClick={add} disabled={!draft.name.trim()} variant="copper" className="w-full">
                <Plus className="size-4" /> Agregar a la ruleta
              </Button>
            </div>

            <RestoreFooter section="prizes" label="los gajos" />
          </CardContent>
        </Card>

        <Card className="h-fit xl:sticky xl:top-[84px]">
          <CardHeader>
            <CardTitle>Vista previa</CardTitle>
            <CardDescription>Así se reparte la ruleta ahora mismo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5">
            <MiniWheel prizes={state.prizes} size={240} />
            <dl className="grid w-full grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-secondary p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gajos visibles</dt>
                <dd className="text-2xl font-extrabold">{live.length}</dd>
              </div>
              <div className="rounded-xl bg-secondary p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Prob. de premio</dt>
                <dd className="text-2xl font-extrabold text-ut-copper-deep">{winChance}%</dd>
              </div>
            </dl>
            {live.length === 0 && (
              <p className="text-center text-sm font-medium text-destructive">
                No hay gajos disponibles: el tótem mostrará "Por hoy se acabaron los premios".
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar gajo</DialogTitle>
            <DialogDescription>Los cambios se aplican en todos los tótems al guardar.</DialogDescription>
          </DialogHeader>
          <PrizeForm draft={editDraft} onChange={setEditDraft} />
          {editing && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary p-3 text-sm">
              <span>
                Entregados: <b>{editing.currentWins}</b> de {editDraft.maxWins}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={editing.currentWins === 0}
                onClick={() => {
                  resetPrizeWins(editing.id);
                  setEditing({ ...editing, currentWins: 0 });
                }}
              >
                Reiniciar entregados
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              variant="copper"
              disabled={!editDraft.name.trim()}
              onClick={() => {
                if (editing) updatePrize(editing.id, { ...editDraft, name: editDraft.name.trim() });
                setEditing(null);
              }}
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`¿Eliminar "${toDelete?.name ?? ""}"?`}
        description="El gajo desaparece de la ruleta en todos los tótems. Los leads que ya lo ganaron se conservan."
        confirmLabel="Eliminar"
        onConfirm={() => toDelete && deletePrize(toDelete.id)}
      />
    </>
  );
}
