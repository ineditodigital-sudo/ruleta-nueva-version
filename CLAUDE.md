# Ruleta UTA

Ruleta de premios para tótem (Universidad Tecnológica de Aguascalientes),
desarrollada por Inédito Agencia Digital. Producción: https://ruleta-ut.inedito.digital
(cPanel + PHP, DNS en Cloudflare). Ver README.md para despliegue y operación.

## Comandos

- `php -S 127.0.0.1:8090 -t public` + `npm run dev`: desarrollo (Vite manda `/api` a 8090).
- `npm run build`: typecheck + build a `dist/` (lo que se sube al servidor).
- `npm run serve:dist`: sirve `dist/` como el Apache de producción.
- `ADMIN_PASSWORD=… npm run e2e`: prueba de punta a punta (necesita Playwright y `serve:dist`).
- `npm run guia`: regenera la guía en PDF (`docs/guia/`).

## Arquitectura

- SPA React 18 + Vite + Tailwind 4 + Framer Motion, sin router: `src/App.tsx`
  elige `/totem`, `/admin` o `/demo` por `location.pathname`. El `.htaccess`
  manda toda ruta inexistente a `index.html`.
- Backend: un solo archivo, `public/api/state.php`, que guarda JSON en
  `ruleta-uta-datos/` fuera de la carpeta pública (con bloqueo y escritura atómica).
- `src/state/AppProvider.tsx` es el estado global. Hace sondeo al servidor cada
  15 s y sube la configuración sólo con sesión de admin, comparando contra
  `baseline` (snapshot de lo que el servidor ya tiene) para no reenviar lo que
  vino del servidor.
- Los contadores (`currentWins`, `currentDailyCount`) los lleva el servidor: la
  acción `config` los conserva salvo `resetCounts` o `resetPrizeIds`.
- El tótem registra giros con `recordSpin` (`src/lib/api.ts`); sin red quedan en
  una cola de `localStorage` que se reenvía sola.
- El tótem se diseña en un lienzo fijo de 1080×1920 px escalado (`KioskPage`),
  por eso sus clases usan px literales (`text-[64px]`, etc.).

## Convenciones

- Interfaz, comentarios y mensajes de commit en español.
- Colores de marca en `src/lib/brand.ts` y como variables `--ut-*` en
  `src/styles/index.css`. Si cambian los valores de fábrica de la marca, sube
  `BRAND_VERSION` en `src/lib/defaults.ts` para que los navegadores descarten su copia.
- Cualquier dato que mande el tótem se limpia en `cleanParticipant` (PHP).

## Cuidado

- El repositorio es **público**: nunca subas la contraseña del panel, leads,
  `ruleta-uta-datos/`, `public/api/config.php` ni la guía con contraseña
  (`docs/guia/Guia-Ruleta-UTA.pdf`). En `state.php` sólo vive el hash bcrypt.
- Los leads son datos personales: el `GET` público nunca debe devolverlos.
- Prueba en el lienzo del tótem con un viewport de 540×960 (escala 0.5).
