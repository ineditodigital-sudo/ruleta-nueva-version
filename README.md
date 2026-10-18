# Ruleta UTA · Universidad Tecnológica de Aguascalientes

Ruleta de premios para tótem táctil (formato vertical 1080×1920) con registro de
participantes, panel de administración y demo para presentaciones. Es la versión
de la Universidad Tecnológica de Aguascalientes de la ruleta de GCPeasa, con la
misma experiencia y funciones, rediseñada con la identidad del sello UTA.

| Ruta          | Para qué sirve                                                                 |
| ------------- | ------------------------------------------------------------------------------ |
| `/totem`      | La experiencia del tótem: bienvenida → registro → ruleta → resultado.          |
| `/admin`      | Panel protegido con contraseña: gajos, marca, mensajes, leads, carrusel, demo y ajustes. |
| `/demo`       | El tótem dentro de la foto de su marco físico, para presentaciones.            |
| `/reset.html` | Borra la copia local de configuración de un equipo (no toca el servidor).     |

`/` redirige a `/totem`.

**En producción:** <https://ruleta-ut.inedito.digital> · Diseño y desarrollo:
[Inédito Agencia Digital](https://www.inedito.digital) · Soporte por WhatsApp:
[449 583 9229](https://wa.me/524495839229).

## Retomar el proyecto en otra computadora

Requisitos: [Git](https://git-scm.com), [Node.js 18+](https://nodejs.org) y
[PHP 8.1+](https://www.php.net/downloads) (en Windows, el zip "Non Thread Safe"
y agregar su carpeta al `PATH`).

```bash
git clone https://github.com/ineditodigital-sudo/ruleta-nueva-version.git
cd ruleta-nueva-version
npm install
```

Y para trabajar, en dos terminales:

```bash
php -S 127.0.0.1:8090 -t public   # 1) la API PHP
npm run dev                       # 2) la app en http://localhost:5173/totem
```

Vite manda `/api` al puerto 8090. Los datos de prueba (configuración, leads y
sesiones) se guardan en `ruleta-uta-datos/` dentro del proyecto, que está en
`.gitignore`. Para entrar al panel en local usa la misma contraseña de
producción: no está en el repositorio, pídela al equipo.

## Cómo funciona

- **Frontend:** React 18 + Vite + Tailwind CSS 4 + Framer Motion. Se compila a
  archivos estáticos (`dist/`).
- **Backend:** un solo archivo PHP, `api/state.php`, sin base de datos. Guarda la
  configuración, los leads y las sesiones en JSON **fuera de la carpeta pública**.
- El panel guarda en el servidor y todos los tótems lo leen cada 15 s, así que
  cualquier equipo ve la misma configuración.
- Cada giro se registra en el servidor. Si el tótem se queda sin red, los giros se
  guardan en una cola local y se reenvían solos al volver la conexión.

## Compilar y probar el build

```bash
npm run build        # genera dist/ (lo que va al servidor)
npm run serve:dist   # sirve dist/ en http://127.0.0.1:8090 como el Apache de producción
```

`dist/` contiene todo lo que va al servidor: `index.html`, `assets/`, `brand/`,
`api/state.php`, `reset.html` y los `.htaccess`. Para el despliegue, comprime
**el contenido** de `dist/` en un zip.

### Prueba de punta a punta

Con `serve:dist` corriendo, `scripts/e2e.mjs` juega en el tótem con un navegador
real y revisa que el lead llegue al servidor, que se sumen inventario y conteo,
que los leads no sean públicos y que la cola sin conexión se reenvíe.

```bash
npm i --no-save playwright && npx playwright install chromium   # una sola vez
ADMIN_PASSWORD="la-contraseña" npm run e2e                     # macOS / Linux
$env:ADMIN_PASSWORD="la-contraseña"; npm run e2e               # Windows PowerShell
```

Crea leads de prueba, así que sólo corre contra el servidor local.

## Producción

| Qué            | Dónde                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| Sitio          | <https://ruleta-ut.inedito.digital> (cPanel, carpeta del subdominio)            |
| DNS            | Cloudflare, zona `inedito.digital`: registro **A** `ruleta-ut` → `184.168.20.11`, *DNS only* |
| SSL            | AutoSSL de cPanel                                                              |
| Datos          | `ruleta-uta-datos/` junto a la carpeta del subdominio, fuera de lo público (ver abajo) |
| Código         | Este repositorio, rama `main`                                                  |

Para publicar un cambio: `npm run build`, comprime el contenido de `dist/` y en
el Administrador de archivos de cPanel súbelo a la carpeta del subdominio y
extráelo ahí (reemplaza los archivos). Borra el zip después: si se queda, se
puede descargar desde internet. Los datos no se tocan porque viven en otra
carpeta.

## Despliegue en cPanel (instalación nueva)

1. Crea el subdominio en cPanel y anota su carpeta raíz (por ejemplo
   `/home/USUARIO/ruleta-uta.midominio.com`).
2. Verifica en **MultiPHP Manager** que el subdominio use **PHP 8.1 o superior**.
3. Sube **el contenido** de `dist/` (no la carpeta) a la raíz del subdominio,
   incluidos los archivos ocultos `.htaccess` (actívalos en tu cliente FTP).
4. Abre `https://subdominio/admin`, entra con la contraseña y haz cualquier
   ajuste: en la primera sesión el panel crea la configuración en el servidor.
5. Abre `https://subdominio/totem` en el tótem, en pantalla completa.

**Datos.** `state.php` crea sola la carpeta `ruleta-uta-datos` dos niveles arriba
de `/api`, es decir, junto a la carpeta del subdominio y fuera de lo público
(`/home/USUARIO/ruleta-uta-datos`). Ahí viven `ruleta-uta.json` (configuración y
leads) y `sesiones.json`. Para usar otra ruta, copia
`api/config.example.php` como `api/config.php` en el servidor y define
`DATA_DIR`. Respáldala antes de cada evento.

## Contraseña del panel

La contraseña nunca viaja en el JavaScript ni está en este repositorio: el
servidor guarda sólo su hash bcrypt (en `api/state.php`). Para cambiarla:

```bash
php scripts/hash-password.php "nueva-contraseña"
```

y en el servidor crea (o edita) `api/config.php`:

```php
<?php
define('PASSWORD_HASH', 'EL_HASH_GENERADO');
```

Las sesiones duran 12 horas.

## Guía rápida en PDF

`docs/guia/` contiene la infografía de uso (3 páginas A4) y el script que la
genera con capturas reales de la app:

```bash
npm i --no-save playwright && npx playwright install chromium   # una sola vez
npm run guia
```

- Sin contraseña genera `Guia-Ruleta-UTA-sin-contrasena.pdf`, la versión para
  compartir (ya incluida en el repositorio).
- Con la contraseña en `docs/guia/password.txt` (o en `GUIA_PASSWORD`) genera
  `Guia-Ruleta-UTA.pdf`, la versión interna. Ambos archivos están en
  `.gitignore`: el repositorio es público y la contraseña no debe subirse.

Para actualizar las capturas, reemplaza las imágenes de `docs/guia/img/`
(`k*.jpg` son del tótem a 1080 px de ancho; `a-*.jpg` del panel).

## Marca

- `brand-src/ut-logo-original.jpg`: el logotipo UTA tal como se recibió.
- `scripts/brand/seal.py`: recorta el sello circular con fondo transparente y
  genera las versiones de `public/brand/` (`python3 scripts/brand/seal.py
  brand-src/ut-logo-original.jpg public/brand`).
- `public/brand/ut-mark.svg`: la marca "UT" vectorizada (se usa en el favicon).
- Paleta (en `src/lib/brand.ts` y `src/styles/index.css`): azul `#0060A0`,
  cobre `#E4A57B`, cromo `#D7DCE3`, tinta `#071A2E`.

## API (`api/state.php`)

| Petición                                        | Quién         | Efecto                                                     |
| ----------------------------------------------- | ------------- | ---------------------------------------------------------- |
| `GET`                                           | todos         | Configuración + número de leads                            |
| `GET` con cabecera `X-Admin-Token`              | panel         | Además, la lista de leads                                  |
| `POST {action:"login", password}`               | panel         | Devuelve un token de sesión                                |
| `POST {action:"config", token, config}`         | panel         | Reemplaza la configuración (respeta los contadores)        |
| `POST {action:"lead", participant, prizeId}`    | tótem         | Añade un giro; el servidor limpia y recorta los datos      |
| `POST {action:"participants", token, …}`        | panel         | Edita o borra leads y corrige inventario                   |
| `POST {action:"reset", token, config}`          | panel         | Borra leads y contadores y deja la configuración de fábrica |

## Qué cambió respecto a la ruleta original

- Identidad UTA completa: sello oficial con intro animada (el anillo entra
  girando, el disco cobre aparece y lo cruza un destello), encabezado con el
  nombre de la universidad y paleta azul / cobre / cromo tomada del sello.
- Ruleta rediseñada: bisel cromado con focos que corren al girar y parpadean al
  ganar, clavos con lengüeta que rebota, centro con el sello y medio segundo de
  "revelación" que ilumina el gajo ganador antes del resultado.
- Sonidos reales (sintetizados, sin archivos): clic de la lengüeta, arranque y
  fanfarria. El ajuste "Sonidos" del panel ya hace algo.
- Celebración con confeti en colores UTA, estallido desde la medalla y rayos.
- El límite diario ahora se aplica en el tótem y se reinicia solo cada día.
- Los gajos se pueden **editar** (antes sólo se podían borrar y volver a crear),
  con vista previa de la ruleta y probabilidad real de premio.
- Privacidad: los leads ya no se pueden descargar sin sesión (antes el `GET`
  público los devolvía), el tótem no guarda leads en el navegador, los datos que
  manda el tótem se limpian en el servidor, el CSV neutraliza fórmulas de Excel y
  el tótem vuelve solo al inicio tras 90 s sin uso para no dejar datos a la vista.
- Fuentes incluidas en el build (funciona sin depender de Google Fonts) y la demo
  dibuja un tótem genérico si la foto del marco no carga.

## Créditos

Diseño y desarrollo: **[Inédito Agencia Digital](https://www.inedito.digital)**.
Soporte por WhatsApp: [449 583 9229](https://wa.me/524495839229).
