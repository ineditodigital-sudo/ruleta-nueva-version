import { useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Cloud, CloudOff, ExternalLink, LogOut, Menu, RefreshCw, Sun, UserRoundPen, type LucideIcon } from "lucide-react";
import { Seal } from "@/components/brand/Brand";
import { Button, Label, SheetContent, Switch } from "@/components/ui";
import type { SyncStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
  hint: string;
}

interface Stats {
  today: number;
  dailyLimit: number;
  total: number;
  winners: number;
}

export default function AdminShell({
  sections,
  active,
  onSelect,
  asksForData,
  onAsksForDataChange,
  lightTheme,
  onLightThemeChange,
  stats,
  sync,
  onLogout,
  children,
}: {
  sections: Section[];
  active: string;
  onSelect: (id: string) => void;
  asksForData: boolean;
  onAsksForDataChange: (v: boolean) => void;
  lightTheme: boolean;
  onLightThemeChange: (v: boolean) => void;
  stats: Stats;
  sync: SyncStatus;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  const current = sections.find((s) => s.id === active);

  const select = (id: string) => {
    onSelect(id);
    setDrawer(false);
  };

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Secciones del panel">
      {sections.map(({ id, label, icon: Icon, hint }) => {
        const on = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => select(id)}
            aria-current={on ? "page" : undefined}
            className={cn(
              "ut-press flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
              on ? "ut-copper text-ut-ink shadow-[0_8px_20px_rgba(228,165,123,0.25)]" : "hover:bg-white/5",
            )}
          >
            <Icon className={cn("mt-0.5 size-[18px] shrink-0", on ? "" : "text-white/45")} strokeWidth={1.8} />
            <span className="min-w-0">
              <span className={cn("block text-sm font-bold", on ? "" : "text-white")}>{label}</span>
              <span className={cn("block text-xs leading-snug", on ? "text-ut-ink/70" : "text-white/40")}>{hint}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );

  const quickSettings = (key: string) => (
    <div className="flex flex-col gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-inset ring-white/10">
      <QuickToggle id={`ask-${key}`} icon={UserRoundPen} label="Pedir datos" checked={asksForData} onChange={onAsksForDataChange} />
      <QuickToggle id={`light-${key}`} icon={Sun} label="Versión clara" checked={lightTheme} onChange={onLightThemeChange} />
      <p className="text-xs leading-snug text-white/45">
        {asksForData
          ? "El tótem pide nombre, correo y teléfono antes de jugar."
          : "El tótem va directo a la ruleta y no captura leads."}
      </p>
    </div>
  );

  const links = (
    <div className="flex flex-col gap-1 text-sm">
      <a href="/totem" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/70 hover:bg-white/5 hover:text-white">
        <ExternalLink className="size-4" /> Abrir tótem
      </a>
      <a href="/demo" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/70 hover:bg-white/5 hover:text-white">
        <ExternalLink className="size-4" /> Abrir demo
      </a>
      <button type="button" onClick={onLogout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-white/70 hover:bg-white/5 hover:text-white">
        <LogOut className="size-4" /> Cerrar sesión
      </button>
    </div>
  );

  return (
    <div className="ut-gradient-ink min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ut-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
          <DialogPrimitive.Root open={drawer} onOpenChange={setDrawer}>
            <DialogPrimitive.Trigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 text-white hover:bg-white/10 lg:hidden" aria-label="Abrir menú de secciones">
                <Menu className="size-5" />
              </Button>
            </DialogPrimitive.Trigger>
            <SheetContent className="border-r border-white/10 bg-ut-ink text-white">
              <DialogPrimitive.Title className="sr-only">Secciones del panel</DialogPrimitive.Title>
              <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
                <Brandmark />
                {nav}
                <div className="mt-auto flex flex-col gap-3">
                  {quickSettings("drawer")}
                  {links}
                </div>
              </div>
            </SheetContent>
          </DialogPrimitive.Root>

          <Brandmark />

          <div className="ml-auto flex items-center gap-4">
            <dl className="hidden items-center gap-5 sm:flex">
              <Stat label="Hoy" value={stats.dailyLimit > 0 ? `${stats.today}/${stats.dailyLimit}` : stats.today} />
              <Stat label="Total" value={stats.total} />
              <Stat label="Ganadores" value={stats.winners} accent />
            </dl>
            <SyncBadge sync={sync} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-[272px] shrink-0 lg:block">
          <div className="sticky top-[84px] flex flex-col gap-4">
            {nav}
            {quickSettings("sidebar")}
            {links}
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mb-5">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{current?.label}</h1>
            <p className="mt-1 text-sm text-white/55">{current?.hint}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function Brandmark() {
  return (
    <div className="flex min-w-0 items-center gap-3 pr-8 lg:pr-0">
      <Seal size={40} className="shrink-0" />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-extrabold tracking-wide text-white">Ruleta UTA</p>
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-ut-copper">Panel de administración</p>
      </div>
    </div>
  );
}

function QuickToggle({
  id,
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  id: string;
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id} className="font-medium text-white">
        <Icon className="size-4 text-white/45" strokeWidth={1.8} />
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-ut-copper data-[state=unchecked]:bg-white/20" />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="text-right">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</dt>
      <dd className={cn("text-lg font-extrabold leading-tight tabular-nums", accent ? "text-ut-copper" : "text-white")}>{value}</dd>
    </div>
  );
}

function SyncBadge({ sync }: { sync: SyncStatus }) {
  const map = {
    cargando: { Icon: RefreshCw, text: "Sincronizando", cls: "text-white/50", spin: true },
    conectado: { Icon: Cloud, text: "Sincronizado", cls: "text-white/65", spin: false },
    "sin-conexion": { Icon: CloudOff, text: "Sin conexión", cls: "text-amber-300", spin: false },
  } as const;
  const { Icon, text, cls, spin } = map[sync];
  return (
    <span
      className={cn("flex shrink-0 items-center gap-1.5 text-xs font-semibold", cls)}
      title={
        sync === "sin-conexion"
          ? "No se pudo contactar con el servidor: los cambios se reintentarán al volver la conexión."
          : "La configuración se guarda en el servidor y la ven todos los tótems."
      }
    >
      <Icon className={cn("size-4", spin && "animate-spin")} strokeWidth={1.8} />
      <span className="hidden md:inline">{text}</span>
    </span>
  );
}
