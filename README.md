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

## Cómo funciona

- **Frontend:** React 18 + Vite + Tailwind CSS 4 + Framer Motion. Se compila a
  archivos estáticos (`dist/`).
- **Backend:** un solo archivo PHP, `api/state.php`, sin base de datos. Guarda la
  configuración, los leads y las sesiones en JSON **fuera de la carpeta pública**.
- El panel guarda en el servidor y todos los tótems lo leen cada 15 s, así que
  cualquier equipo ve la misma configuración.
- Cada giro se registra en el servidor. Si el tótem se queda sin red, los giros se
  guardan en una cola local y se reenvían solos al volver la conexión.

## Desarrollo local

Requisitos: Node 18+ y PHP 8.1+.

```bash
npm install

# Terminal 1: la API PHP (los datos de prueba van a .datos-dev/)
mkdir -p .datos-dev
printf "<?php\ndefine('DATA_DIR', '%s/.datos-dev');\n" "$PWD" > public/api/config.php
php -S 127.0.0.1:8090 -t public

# Terminal 2: la app con recarga en caliente (el proxy manda /api al puerto 8090)
npm run dev
```

> `public/api/config.php` es sólo para tu equipo: está en `.gitignore` y no
> debe subirse al servidor con esa ruta.

## Compilar

```bash
npm run build      # genera dist/
```

`dist/` contiene todo lo que va al servidor: `index.html`, `assets/`, `brand/`,
`api/state.php`, `reset.html` y los `.htaccess`.

## Despliegue en cPanel (FTP)

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

La contraseña nunca viaja en el JavaScript: el servidor guarda sólo su hash
bcrypt. Para cambiarla:

```bash
php scripts/hash-password.php "nueva-contraseña"
```

y en el servidor crea (o edita) `api/config.php`:

```php
<?php
define('PASSWORD_HASH', 'EL_HASH_GENERADO');
```

Las sesiones duran 12 horas.

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
