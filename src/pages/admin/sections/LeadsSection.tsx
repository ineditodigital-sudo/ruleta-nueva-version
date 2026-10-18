import { useMemo, useState } from "react";
import { FileDown, FileText, Pencil, Search, Trash2, Users } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { exportLeadsCsv, exportLeadsReport, isWinner } from "@/lib/export";
import type { Participant } from "@/lib/types";
import { useApp } from "@/state/AppProvider";

const when = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function LeadsSection() {
  const { state, updateParticipant, deleteParticipant, deleteAllParticipants } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "win" | "lose">("all");
  const [editing, setEditing] = useState<Participant | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [toDelete, setToDelete] = useState<Participant | null>(null);
  const [clearAll, setClearAll] = useState(false);

  const leads = state.participants;
  const winners = leads.filter(isWinner).length;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads
      .slice()
      .reverse()
      .filter((p) => (filter === "all" ? true : filter === "win" ? isWinner(p) : !isWinner(p)))
      .filter((p) => !q || [p.name, p.email, p.phone].some((v) => v?.toLowerCase().includes(q)));
  }, [leads, query, filter]);

  const openEdit = (p: Participant) => {
    setForm({ name: p.name, email: p.email, phone: p.phone });
    setEditing(p);
  };

  const canSave = form.name.trim() !== "" && form.email.trim() !== "";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>Participantes y leads</CardTitle>
              <CardDescription>
                {leads.length} en total · {winners} ganadores · {leads.length - winners} sin premio
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="copper" onClick={() => exportLeadsCsv(leads)} disabled={leads.length === 0}>
                <FileDown className="size-4" /> Exportar CSV
              </Button>
              <Button variant="outline" onClick={() => void exportLeadsReport(leads, state.brand.systemName)} disabled={leads.length === 0}>
                <FileText className="size-4" /> Reporte
              </Button>
              <Button variant="ghost-destructive" onClick={() => setClearAll(true)} disabled={leads.length === 0}>
                <Trash2 className="size-4" /> Vaciar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, correo o teléfono"
                className="pl-9"
                aria-label="Buscar leads"
              />
            </div>
            <div className="inline-flex rounded-lg border border-border bg-secondary p-1 text-sm font-semibold" role="group" aria-label="Filtrar por resultado">
              {(
                [
                  ["all", "Todos"],
                  ["win", "Ganadores"],
                  ["lose", "Sin premio"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  aria-pressed={filter === id}
                  className={`rounded-md px-3 py-1.5 transition-colors ${filter === id ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-[104px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-14 text-center">
                    <Users className="mx-auto mb-3 size-8 text-muted-foreground/50" />
                    <p className="font-semibold">{leads.length === 0 ? "Todavía no hay participantes" : "Ningún lead coincide con la búsqueda"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {leads.length === 0
                        ? "Los datos aparecerán aquí en cuanto alguien juegue en el tótem."
                        : "Prueba con otro nombre, correo o teléfono."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((p) => {
                  const win = isWinner(p);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold">{p.name || "—"}</TableCell>
                      <TableCell>{p.email || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">{p.phone || "—"}</TableCell>
                      <TableCell>
                        {p.prizeWon ? (
                          <Badge variant={win ? "copper" : "secondary"} title={p.prizeWon.name}>
                            {win ? `Ganó · ${p.prizeWon.name}` : "No ganó"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Sin resultado</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{when.format(new Date(p.timestamp))}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label={`Editar ${p.name || "lead"}`}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost-destructive" size="icon" onClick={() => setToDelete(p)} aria-label={`Borrar ${p.name || "lead"}`}>
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar lead</DialogTitle>
            <DialogDescription>Corrige los datos capturados en el tótem. El resultado de la ruleta no se puede cambiar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(
              [
                ["name", "Nombre", "text"],
                ["email", "Correo", "email"],
                ["phone", "Teléfono", "tel"],
              ] as const
            ).map(([key, label, type]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`lead-${key}`}>{label}</Label>
                <Input id={`lead-${key}`} type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              variant="copper"
              disabled={!canSave}
              onClick={() => {
                if (editing) updateParticipant(editing.id, { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
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
        title={`¿Borrar el lead de ${toDelete?.name || "este participante"}?`}
        description="Se elimina el registro y su premio vuelve al inventario. No se puede deshacer."
        confirmLabel="Borrar"
        onConfirm={() => toDelete && deleteParticipant(toDelete.id)}
      />
      <ConfirmDialog
        open={clearAll}
        onOpenChange={setClearAll}
        title={`¿Borrar los ${leads.length} leads?`}
        description="Se borra toda la lista, se reinician los premios entregados y el conteo del día vuelve a cero. No se puede deshacer: exporta el CSV antes si quieres conservarlos."
        confirmLabel="Borrar todo"
        onConfirm={deleteAllParticipants}
      />
    </>
  );
}
