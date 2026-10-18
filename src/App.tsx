import { lazy, Suspense, useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { AppProvider } from "@/state/AppProvider";
import KioskPage from "@/pages/KioskPage";

// El panel y la demo no hacen falta en el tótem: se cargan aparte.
const AdminPage = lazy(() => import("@/pages/admin/AdminPage"));
const DemoPage = lazy(() => import("@/pages/DemoPage"));

/**
 * Tres rutas fijas, resueltas en el cliente. El .htaccess manda cualquier ruta
 * que no sea un archivo real a index.html.
 */
function route(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/admin") return "admin";
  if (path === "/demo") return "demo";
  return "totem";
}

export default function App() {
  const page = route(window.location.pathname);

  useEffect(() => {
    if (window.location.pathname === "/" || page === "totem" && window.location.pathname !== "/totem") {
      window.history.replaceState(null, "", "/totem" + window.location.search);
    }
    document.title =
      page === "admin" ? "Panel · Ruleta UTA" : page === "demo" ? "Demo · Ruleta UTA" : "Ruleta UTA";
  }, [page]);

  return (
    <AppProvider>
      <MotionConfig reducedMotion="user">
        <Suspense fallback={<div className="min-h-[100dvh] ut-gradient-ink" />}>
          {page === "admin" ? <AdminPage /> : page === "demo" ? <DemoPage /> : <KioskPage />}
        </Suspense>
      </MotionConfig>
    </AppProvider>
  );
}
