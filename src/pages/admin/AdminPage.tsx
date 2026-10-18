import { useState } from "react";
import { Images, LayoutGrid, MessageSquareText, MonitorSmartphone, Palette, Settings, Users } from "lucide-react";
import { Seal } from "@/components/brand/Brand";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";
import { login, logout } from "@/lib/api";
import { isWinner } from "@/lib/export";
import { todayKey } from "@/lib/brand";
import { useApp } from "@/state/AppProvider";
import AdminShell, { type Section } from "./AdminShell";
import BrandSection from "./sections/BrandSection";
import CarouselSection from "./sections/CarouselSection";
import DemoSection from "./sections/DemoSection";
import LeadsSection from "./sections/LeadsSection";
import MessagesSection from "./sections/MessagesSection";
import PrizesSection from "./sections/PrizesSection";
import SettingsSection from "./sections/SettingsSection";

const TAB_KEY = "utaAdminTab";

const SECTIONS: Section[] = [
  { id: "prizes", label: "Gajos", icon: LayoutGrid, hint: "Qué sale en la ruleta y con qué probabilidad" },
  { id: "branding", label: "Marca", icon: Palette, hint: "Sello, logotipos, colores y nombre" },
  { id: "messages", label: "Mensajes", icon: MessageSquareText, hint: "Los textos que lee el participante" },
  { id: "leads", label: "Leads", icon: Users, hint: "Datos capturados y exportación" },
  { id: "carousel", label: "Carrusel", icon: Images, hint: "Logotipos que desfilan bajo la ruleta" },
  { id: "demo", label: "Demo", icon: MonitorSmartphone, hint: "Marco del tótem para presentaciones" },
  { id: "config", label: "Ajustes", icon: Settings, hint: "Límite diario, sonidos y reseteo" },
];

const SECTION_VIEWS: Record<string, () => JSX.Element> = {
  prizes: PrizesSection,
  branding: BrandSection,
  messages: MessagesSection,
  leads: LeadsSection,
  carousel: CarouselSection,
  demo: DemoSection,
  config: SettingsSection,
};

function readTab() {
  try {
    const t = localStorage.getItem(TAB_KEY);
    return t && t in SECTION_VIEWS ? t : "prizes";
  } catch {
    return "prizes";
  }
}

function Login({ expired, onSuccess }: { expired: boolean; onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(expired ? "Tu sesión venció. Vuelve a entrar para seguir editando." : "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!password || busy) return;
    setBusy(true);
    const result = await login(password);
    setBusy(false);
    if (result === "ok") return onSuccess();
    if (result === "sin-conexion") return setError("No se pudo contactar con el servidor. Revisa la conexión.");
    setError("Contraseña incorrecta. Revisa mayúsculas y símbolos.");
    setPassword("");
  };

  return (
    <div className="ut-gradient-ink flex min-h-[100dvh] items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="ut-copper h-1.5 w-full" />
        <CardHeader className="items-center text-center">
          <Seal size={96} className="mb-2 drop-shadow-lg" />
          <CardTitle className="text-2xl">Panel de administración</CardTitle>
          <CardDescription>Ruleta UTA · Ingresa la contraseña para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <Input
              type="password"
              placeholder="Contraseña"
              autoFocus
              autoComplete="current-password"
              value={password}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              className="h-11"
            />
            <p id="login-error" role={error ? "alert" : undefined} className="min-h-5 text-sm font-medium text-destructive">
              {error}
            </p>
            <Button type="submit" variant="copper" size="lg" className="w-full" disabled={!password || busy}>
              {busy ? "Comprobando…" : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  const { state, sync, isAdmin, sessionExpired, setAdminSession, updateGameConfig, updateBrand } = useApp();
  const [tab, setTab] = useState(readTab);

  if (!isAdmin) return <Login expired={sessionExpired} onSuccess={() => setAdminSession(true)} />;

  const selectTab = (id: string) => {
    setTab(id);
    try {
      localStorage.setItem(TAB_KEY, id);
    } catch {
      /* sin almacenamiento: no se recuerda la pestaña */
    }
    window.scrollTo({ top: 0 });
  };

  const g = state.gameConfig;
  const View = SECTION_VIEWS[tab] ?? PrizesSection;

  return (
    <AdminShell
      sections={SECTIONS}
      active={tab}
      onSelect={selectTab}
      asksForData={g.requireRegistration}
      onAsksForDataChange={(v) => updateGameConfig({ requireRegistration: v })}
      lightTheme={state.brand.theme === "light"}
      onLightThemeChange={(v) => updateBrand({ theme: v ? "light" : "dark" })}
      sync={sync}
      onLogout={() => {
        void logout();
        setAdminSession(false);
      }}
      stats={{
        today: g.countDate === todayKey() ? g.currentDailyCount : 0,
        dailyLimit: g.dailyLimit,
        total: state.participants.length,
        winners: state.participants.filter(isWinner).length,
      }}
    >
      <View />
    </AdminShell>
  );
}
