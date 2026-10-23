/**
 * Guía rápida de la Ruleta UTA (infografía en PDF, 3 páginas A4).
 *
 *   node docs/guia/build.mjs
 *
 * Arma guia.html con capturas reales (img/) e íconos de la app (icons.json) y,
 * si Playwright está instalado, la imprime a PDF con Chromium:
 *
 *   npm i --no-save playwright && npx playwright install chromium
 *
 * Contraseña: el repositorio es público, así que la contraseña NUNCA se guarda
 * aquí. Para la versión interna, ponla en docs/guia/password.txt (ignorado por
 * git) o en la variable GUIA_PASSWORD; sin ella sale la versión para compartir.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const icons = JSON.parse(readFileSync(join(here, 'icons.json'), 'utf8'));
const ic = (n, cls = '') => icons[n].replace('<svg', `<svg class="ic ${cls}"`);
const font = (f) =>
  readFileSync(join(root, 'node_modules/@fontsource-variable/montserrat/files', f)).toString('base64');

const SITE = 'ruleta-ut.inedito.digital';
const pwFile = join(here, 'password.txt');
const PASSWORD = (process.env.GUIA_PASSWORD ?? (existsSync(pwFile) ? readFileSync(pwFile, 'utf8') : '')).trim();
const OUT_PDF = join(here, PASSWORD ? 'Guia-Ruleta-UTA.pdf' : 'Guia-Ruleta-UTA-sin-contrasena.pdf');

/* --- Desarrollador ---------------------------------------------------------
 * Si existen img/inedito-logo-light.(svg|png) (para fondo oscuro) e
 * img/inedito-logo-dark.(svg|png) (para fondo claro) se usan; si no, el nombre
 * va como texto. Los colores se ajustan en dev.json.
 */
const DEV = {
  name: 'Inédito Digital',
  url: 'https://www.inedito.digital',
  urlLabel: 'www.inedito.digital',
  bg: '#0B0B0F',
  fg: '#FFFFFF',
  accent: '#E4A57B',
  gray: '#B7B7B7',
  short: 'Inédito',
  ...(existsSync(join(here, 'dev.json')) ? JSON.parse(readFileSync(join(here, 'dev.json'), 'utf8')) : {}),
};
const WA = { label: '<span class="nw">449 583 9229</span>', url: 'https://wa.me/524495839229' };

const findLogo = (tone) =>
  ['svg', 'png', 'webp'].map((ext) => `img/inedito-logo-${tone}.${ext}`).find((f) => existsSync(join(here, f)));
const devMark = (tone, h) => {
  const f = findLogo(tone);
  return f
    ? `<img class="devlogo" src="${f}" alt="${DEV.name}" style="height:${h}mm">`
    : `<span class="devword" style="font-size:${h * 2.1}pt">${DEV.name}</span>`;
};

const links = [
  ['MonitorPlay', 'Tótem', '/totem', 'La pantalla del juego. Ábrela en la computadora del tótem y presiona <b>F11</b> para pantalla completa.', 'Abierto'],
  ['LogIn', 'Panel', '/admin', 'Premios, textos, marca, leads y ajustes. Funciona en computadora o celular.', 'Contraseña'],
  ['MonitorSmartphone', 'Demo', '/demo', 'El tótem dentro de su marco, para presentar la experiencia en una junta.', 'Abierto'],
  ['RefreshCw', 'Restablecer', '/reset.html', 'Sólo si un equipo muestra textos o colores viejos. Limpia la copia de ese navegador.', 'Abierto'],
];

const steps = [
  ['k1-bienvenida.jpg', 'Bienvenida', 'El sello se arma en pantalla y a los 3 segundos pasa solo al registro.'],
  ['k2-registro.jpg', 'Registro', 'Nombre, correo, teléfono (10 dígitos) y la casilla del aviso de privacidad.'],
  ['k3-ruleta.jpg', 'Girar', 'Un toque en <b>Girar la ruleta</b>. Gira 5 segundos y se ilumina el gajo ganador.'],
  ['k4-premio.jpg', 'Resultado', 'Muestra el premio o <i>“Será a la próxima”</i>. A los 9 segundos vuelve al inicio.'],
];

const facts = [
  ['WifiOff', 'Si se cae el internet', 'No se pierde nada. Los registros se guardan en el tótem y se envían solos cuando vuelve la señal.'],
  ['Timer', 'Si alguien se va a medias', 'Tras 90 segundos sin tocar la pantalla, vuelve al inicio y borra lo que se había capturado.'],
  ['CircleSlash', '“Por hoy se acabaron…”', 'Se llegó al límite diario de participaciones o ya no quedan premios disponibles.'],
];

const checklist = [
  ['Maximize', `Abre <b>${SITE}/totem</b> en el tótem y pon pantalla completa con <b>F11</b>.`],
  ['LayoutGrid', 'En el panel, revisa en <b>Gajos</b> que los premios y las cantidades sean los del evento.'],
  ['Hand', 'Haz un giro de prueba y bórralo en <b>Leads</b>: el premio regresa al inventario.'],
  ['Volume2', 'Sube el volumen del tótem: la ruleta suena al girar y al ganar.'],
  ['Smartphone', 'Deja el panel abierto en tu celular o laptop para ver los registros en vivo.'],
  ['KeyRound', 'Ten a la mano la contraseña del panel, pero no la dejes a la vista.'],
];

const sections = [
  ['LayoutGrid', 'Gajos', 'Qué premios hay, cuántos y qué tan seguido salen.', 'El <b>máximo de veces</b> es tu inventario: al entregar el último, el gajo sale de la ruleta.'],
  ['Palette', 'Marca', 'Sello, nombre, color de los botones y logo del centro.', 'Deja vacío <b>Logotipo propio</b> para usar el sello oficial.'],
  ['MessageSquareText', 'Mensajes', 'Bienvenida, premio, “sin premio” y aviso de privacidad.', 'En <b>Mensaje cuando gana</b> di dónde se recoge el premio.'],
  ['Users', 'Leads', 'Participantes: buscar, filtrar, corregir datos y exportar.', 'Borrar un lead devuelve su premio al inventario.'],
  ['Images', 'Carrusel', 'Logos de aliados que desfilan bajo la ruleta.', 'Sólo aparece si subes al menos un logo.'],
  ['MonitorSmartphone', 'Demo', 'Marco del tótem para presentar en <b>/demo</b>.', 'Ajusta dónde cae la pantalla con los porcentajes.'],
  ['Settings', 'Ajustes', 'Límite diario, duración del giro, sonidos y reseteo.', 'Límite en <b>0</b> = sin límite. El conteo se reinicia cada día.'],
];

const weights = [
  ['Termo UTA', 10, '#0060A0', '#fff'],
  ['Libreta', 20, '#E4A57B', '#071A2E'],
  ['Suerte para la próxima', 70, '#C9D0D9', '#071A2E'],
];

const troubles = [
  ['El tótem dice <i>“Por hoy se acabaron las participaciones”</i>', 'Sube el límite en <b>Ajustes</b> o usa <b>Reiniciar conteo</b>.'],
  ['El tótem dice <i>“Por hoy se acabaron los premios”</i>', 'Todos los gajos están inactivos o agotados: revisa <b>Gajos</b>.'],
  ['Arriba del panel aparece <b>Sin conexión</b>', 'Revisa el internet. Los cambios y los giros se reintentan solos.'],
  ['Un equipo muestra textos o colores viejos', `Abre <b>${SITE}/reset.html</b> en ese equipo.`],
  ['El panel pide la contraseña otra vez', 'Pasaron 12 horas o se cerró la pestaña. Entra con la contraseña de la página 1.'],
  ['Aparece <i>“Contraseña incorrecta”</i>', 'Revisa mayúsculas, minúsculas y guiones, y que no se cuele un espacio al pegarla.'],
  ['Quieres cambiar la contraseña', `Se cambia en el servidor: pídelo por WhatsApp al <b>${WA.label}</b>.`],
  ['Nada de esto lo resuelve', `Escríbenos por WhatsApp al <b>${WA.label}</b> con una foto de la pantalla.`],
];

const foot = (n, total) => `<footer class="foot">
    <span><b>Ruleta UTA</b> · Guía rápida</span>
    <span class="fdev">Desarrollado por <a href="${DEV.url}"><b>${DEV.short}</b></a> · Soporte WhatsApp <a href="${WA.url}"><b>${WA.label}</b></a></span>
    <span>${n} / ${total}</span>
  </footer>`;

const mini = (kicker, title, aside = '') => `<header class="mini">
    <img src="img/ut-sello-512.png" alt="">
    <div><div class="kicker">${kicker}</div><h1>${title}</h1></div>
    ${aside}
  </header>`;

const sec = (n, t) => `<div class="sec"><span class="n">${n}</span><h2>${t}</h2><span class="rule"></span></div>`;

const TOTAL = 3;

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Ruleta UTA · Guía rápida</title>
<style>
@font-face { font-family: M; src: url(data:font/woff2;base64,${font('montserrat-latin-wght-normal.woff2')}) format('woff2'); font-weight: 100 900; }
@font-face { font-family: M; src: url(data:font/woff2;base64,${font('montserrat-latin-ext-wght-normal.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0100-024F, U+1E00-1EFF; }
@page { size: A4; margin: 0; }
:root {
  --ink: #071A2E; --ink-2: #0D2742; --ink-3: #1C3A5E;
  --blue: #0060A0; --copper: #E4A57B; --copper-d: #A9775A; --copper-l: #F6E3D5;
  --paper: #F5F7FA; --line: #DCE3EC; --text: #0B2440; --muted: #536179;
  --dev-bg: ${DEV.bg}; --dev-fg: ${DEV.fg}; --dev-accent: ${DEV.accent}; --dev-gray: ${DEV.gray};
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #fff; }
body { font-family: M, sans-serif; color: var(--text); font-size: 8.6pt; line-height: 1.42; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
b { font-weight: 700; }
a { color: inherit; text-decoration: none; }
.nw { white-space: nowrap; }
.page { width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; display: flex; flex-direction: column; }
.page:last-child { page-break-after: auto; }
.body { padding: 0 13mm; flex: 1; display: flex; flex-direction: column; }
.ic { width: 1em; height: 1em; flex: none; }
.kicker { font-size: 7pt; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; color: var(--copper); }

/* Cabecera página 1 */
.hero { background: var(--ink); color: #fff; padding: 10mm 13mm 9mm; display: flex; gap: 6mm; align-items: center; position: relative; }
.hero::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1.2mm; background: var(--copper); }
.hero > img { width: 29mm; height: 29mm; }
.hero .t { flex: 1; min-width: 0; }
.hero h1 { font-size: 27pt; line-height: 1; font-weight: 800; letter-spacing: -.02em; margin: 2mm 0 2.2mm; }
.hero p { color: #B8C7D9; font-size: 9.2pt; max-width: 78mm; }
.devcard { align-self: stretch; display: flex; flex-direction: column; justify-content: center; gap: 1.6mm; min-width: 46mm; padding: 3.4mm 4.2mm; border-radius: 2.4mm; background: var(--dev-bg); color: var(--dev-fg); border: .3mm solid rgba(255,255,255,.12); }
.devcard small { font-size: 6.4pt; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; opacity: .7; }
.devcard { border-top: 1mm solid var(--dev-accent); }
.devcard .u { font-size: 7pt; font-weight: 500; color: var(--dev-gray); }
.devcard .wa { display: flex; align-items: center; gap: 1.4mm; font-size: 7.2pt; color: #fff; margin-top: .6mm; }
.devcard .wa .ic { color: var(--dev-accent); font-size: 9pt; background: #fff; border-radius: 50%; padding: .5mm; width: 4.2mm; height: 4.2mm; }
.devlogo { display: block; width: auto; max-width: 100%; }
.devword { font-weight: 800; letter-spacing: -.01em; line-height: 1.05; }

/* Secciones */
.sec { display: flex; align-items: baseline; gap: 3mm; margin: 6.4mm 0 3.6mm; }
.sec .n { font-size: 7pt; font-weight: 800; letter-spacing: .18em; color: var(--copper-d); white-space: nowrap; }
.sec h2 { font-size: 14.5pt; font-weight: 800; letter-spacing: -.015em; white-space: nowrap; }
.sec .rule { flex: 1; height: .25mm; background: var(--line); align-self: center; }

/* Accesos */
.access { display: grid; grid-template-columns: 1.55fr 1fr; gap: 4.5mm; }
.links { display: grid; gap: 2.2mm; }
.lk { display: grid; grid-template-columns: 7.6mm 50mm 1fr; gap: 2.8mm; align-items: center; border: .3mm solid var(--line); border-radius: 2.4mm; padding: 2.4mm 3mm; }
.bubble { width: 7.6mm; height: 7.6mm; border-radius: 2mm; background: var(--ink); color: var(--copper); display: grid; place-items: center; font-size: 10.5pt; }
.lh { display: flex; align-items: center; gap: 2mm; }
.lh b { font-size: 9.4pt; }
.tag { font-size: 6.2pt; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: .45mm 1.6mm; border-radius: 5mm; background: #E6EDF5; color: var(--muted); white-space: nowrap; }
.tag.lock { background: var(--copper-l); color: #7A4E33; }
.lk a { display: block; margin-top: .7mm; font-size: 7.2pt; color: var(--blue); font-weight: 500; white-space: nowrap; }
.lk a b { font-weight: 800; }
.lk p { font-size: 7.4pt; color: var(--muted); line-height: 1.35; }
.pw { background: var(--ink); color: #fff; border-radius: 3mm; padding: 4mm 4.4mm 3.6mm 5.4mm; position: relative; overflow: hidden; display: flex; flex-direction: column; }
.pw::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 1.2mm; background: var(--copper); }
.pwph { font-size: 9.6pt; font-weight: 700; letter-spacing: 0; color: var(--muted); }
.pwbox { margin: 2mm 0 2.8mm; background: #fff; color: var(--ink); border-radius: 2mm; padding: 2.6mm 2mm; font-size: 12.6pt; font-weight: 800; letter-spacing: .03em; text-align: center; white-space: nowrap; }
.pw ol { padding-left: 4mm; display: grid; gap: .9mm; font-size: 7.7pt; color: #C9D6E5; }
.pw ol b { color: #fff; }
.pwnote { margin-top: auto; padding-top: 2.2mm; border-top: .25mm solid var(--ink-3); font-size: 7.1pt; color: #9FB2C8; display: grid; gap: 1mm; }
.pwnote div { display: flex; gap: 1.6mm; }
.pwnote .ic { color: var(--copper); font-size: 8.4pt; margin-top: .2mm; }
.pwnote b { color: #fff; }

/* Pasos */
.steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4.5mm; }
.step { position: relative; }
.shot { border-radius: 3mm; border: 1.2mm solid var(--ink); background: var(--ink); overflow: hidden; box-shadow: 0 1.2mm 3mm rgba(7,26,46,.18); }
.shot img { display: block; width: 100%; }
.num { position: absolute; top: -2.6mm; left: -2.2mm; width: 7.4mm; height: 7.4mm; border-radius: 50%; background: var(--copper); color: var(--ink); font-weight: 800; font-size: 10pt; display: grid; place-items: center; border: .8mm solid #fff; }
.step h3 { font-size: 10pt; font-weight: 800; margin: 2.8mm 0 .8mm; }
.step p { color: var(--muted); font-size: 7.9pt; }
.arrow { position: absolute; right: -4.1mm; top: 30%; width: 3.6mm; color: var(--copper-d); }

.facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; margin-top: 5.5mm; background: var(--paper); border-radius: 3mm; padding: 3.6mm 4mm; }
.fact { display: flex; gap: 3mm; }
.fact + .fact { border-left: .25mm solid var(--line); padding-left: 3mm; }
.fact .bubble { width: 7.6mm; height: 7.6mm; flex: none; }
.fact b { display: block; font-size: 8.6pt; margin-bottom: .4mm; }
.fact p { color: var(--muted); font-size: 7.8pt; }

/* Cabecera páginas 2-3 */
.mini { background: var(--ink); color: #fff; padding: 7mm 13mm 6.4mm; display: flex; align-items: center; gap: 5mm; position: relative; }
.mini::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1mm; background: var(--copper); }
.mini > img { width: 15mm; height: 15mm; }
.mini h1 { font-size: 17pt; font-weight: 800; letter-spacing: -.015em; margin-top: .8mm; white-space: nowrap; }
.mini .aside { margin-left: auto; max-width: 86mm; font-size: 7.7pt; color: #B8C7D9; display: flex; gap: 2.5mm; align-items: flex-start; background: var(--ink-2); border: .25mm solid var(--ink-3); border-radius: 2mm; padding: 2.4mm 3mm; }
.mini .aside .ic { color: var(--copper); font-size: 11pt; margin-top: .2mm; }
.mini .aside b { color: #fff; }

.checks { display: grid; grid-template-columns: 1fr 1fr; column-gap: 7mm; }
.check { display: flex; gap: 2.8mm; padding: 2mm 0; border-top: .25mm dashed var(--line); align-items: flex-start; }
.check:nth-child(-n+2) { border-top: 0; padding-top: 0; }
.box { width: 4.2mm; height: 4.2mm; border: .45mm solid var(--ink-3); border-radius: 1mm; flex: none; margin-top: .2mm; }
.check .ic { color: var(--blue); font-size: 10.5pt; margin-top: .1mm; }

.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2.8mm; }
.sect { display: flex; gap: 3mm; border: .3mm solid var(--line); border-radius: 2.6mm; padding: 3mm 3.4mm; }
.sect .bubble { color: #fff; flex: none; }
.sect h4 { font-size: 9.4pt; font-weight: 800; }
.sect p { font-size: 7.9pt; color: var(--muted); margin-top: .4mm; }
.sect .tip { margin-top: 1.2mm; font-size: 7.5pt; color: var(--copper-d); }
.sect.toggles { background: var(--paper); border-color: transparent; }
.tg { display: flex; align-items: center; gap: 2mm; font-size: 7.9pt; margin-top: 1.1mm; color: var(--muted); }
.tg .sw { width: 6.4mm; height: 3.6mm; border-radius: 2mm; background: var(--copper); position: relative; flex: none; }
.tg .sw::after { content: ""; position: absolute; right: .5mm; top: .5mm; width: 2.6mm; height: 2.6mm; border-radius: 50%; background: #fff; }
.tg .sw.off { background: #C3CCD8; }
.tg .sw.off::after { right: auto; left: .5mm; }
.tg b { color: var(--text); }

.prob { display: grid; grid-template-columns: 1fr 1.05fr; gap: 6mm; align-items: center; }
.bar { display: flex; height: 8.4mm; border-radius: 2mm; overflow: hidden; margin: 2.6mm 0 2mm; }
.bar div { display: flex; align-items: center; padding: 0 2.2mm; font-size: 7.4pt; font-weight: 700; white-space: nowrap; }
.legend { display: grid; gap: 1.1mm; font-size: 7.9pt; }
.legend div { display: flex; justify-content: space-between; border-bottom: .25mm dashed var(--line); padding-bottom: .9mm; }
.legend span:last-child { font-weight: 700; }
.note { font-size: 7.9pt; color: var(--muted); margin-top: 2.4mm; }
.panel-shot { border-radius: 2.6mm; overflow: hidden; border: .3mm solid var(--line); box-shadow: 0 1mm 3mm rgba(7,26,46,.14); }
.panel-shot img { display: block; width: 100%; }
.cap { font-size: 7pt; color: #8090A6; margin-top: 1.4mm; }

.after { display: grid; grid-template-columns: 2fr 1fr; gap: 4.5mm; align-items: start; }
.end-col { grid-template-columns: 1fr !important; gap: 2.4mm !important; }
.end-col .endc { padding: 2.8mm 3.4mm; }
.end { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
.endc { border-radius: 2.6mm; padding: 3.4mm 3.6mm; background: var(--paper); }
.endc .h { display: flex; align-items: center; gap: 2mm; font-weight: 800; font-size: 9.2pt; }
.endc .h .ic { font-size: 11pt; color: var(--blue); }
.endc.warn .h .ic { color: #C2334A; }
.endc p { font-size: 7.9pt; color: var(--muted); margin-top: 1.2mm; }

table { width: 100%; border-collapse: collapse; font-size: 8pt; }
td { padding: 1.8mm 2.4mm; vertical-align: top; border-bottom: .25mm solid var(--line); }
td:first-child { width: 50%; font-weight: 600; }
td:last-child { color: var(--muted); }
tr:last-child td { border-bottom: 0; }

/* Cierre: crédito del desarrollador */
.devband { margin-top: auto; background: var(--dev-bg); color: var(--dev-fg); border-radius: 3.4mm; padding: 6mm 7mm; display: grid; grid-template-columns: auto 1fr auto; gap: 7mm; align-items: center; position: relative; overflow: hidden; }
.devband::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 1.4mm; background: var(--dev-accent); }
.devband small { display: block; font-size: 6.6pt; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; opacity: .65; margin-bottom: 1.6mm; }
.devband p { font-size: 8.2pt; opacity: .85; max-width: 78mm; }
.devband .ctas { display: grid; gap: 2mm; justify-items: stretch; }
.devband .cta { display: flex; align-items: center; justify-content: center; gap: 1.6mm; font-size: 8.2pt; font-weight: 700; color: var(--dev-gray); border: .35mm solid var(--dev-gray); border-radius: 6mm; padding: 1.9mm 4mm; white-space: nowrap; }
.devband .cta.solid { background: var(--dev-accent); border-color: var(--dev-accent); color: #fff; }
.devband .cta .ic { font-size: 10pt; }

/* Pie */
.foot { margin-top: auto; padding: 4mm 13mm 7mm; display: flex; justify-content: space-between; align-items: center; gap: 4mm; font-size: 7pt; color: #8090A6; letter-spacing: .02em; }
.foot b { color: var(--text); }
.fdev a b { color: var(--dev-accent); }
.has-band .foot { margin-top: 0; }
</style></head>
<body>

<section class="page">
  <header class="hero">
    <img src="img/ut-sello-512.png" alt="">
    <div class="t">
      <div class="kicker">Universidad Tecnológica de Aguascalientes</div>
      <h1>Ruleta UTA</h1>
      <p>Guía rápida para operar el tótem en el stand y configurarlo desde el panel.</p>
    </div>
    <div class="devcard"><small>Desarrollado por</small><a href="${DEV.url}">${devMark('light', 7.4)}</a>
      <a class="wa" href="${WA.url}">${ic('MessageCircle')}<span>Soporte WhatsApp <b>${WA.label}</b></span></a>
      <a class="u" href="${DEV.url}">${DEV.urlLabel}</a></div>
  </header>

  <div class="body">
    ${sec('00 · ACCESOS', 'Enlaces y contraseña')}
    <div class="access">
      <div class="links">
        ${links
          .map(
            ([i, t, path, d, tag]) => `<div class="lk"><span class="bubble">${ic(i)}</span>
          <div><div class="lh"><b>${t}</b><span class="tag ${tag === 'Abierto' ? '' : 'lock'}">${tag === 'Abierto' ? 'Sin contraseña' : 'Con contraseña'}</span></div>
          <a href="https://${SITE}${path}">${SITE}<b>${path}</b></a></div>
          <p>${d}</p></div>`,
          )
          .join('')}
      </div>
      <div class="pw">
        <div class="kicker">Contraseña del panel</div>
        <div class="pwbox">${PASSWORD || '<span class="pwph">Se entrega por separado</span>'}</div>
        <ol>
          <li>Abre <b>${SITE}/admin</b>.</li>
          <li>Escríbela <b>tal cual</b>: distingue mayúsculas y minúsculas e incluye los guiones.</li>
          <li>Presiona <b>Entrar</b>.</li>
        </ol>
        <div class="pwnote">
          <div>${ic('Timer')}<span>La sesión dura 12 horas en esa pestaña. Si la cierras, te la vuelve a pedir.</span></div>
          ${PASSWORD ? `<div>${ic('ShieldCheck')}<span><b>Documento interno.</b> No lo publiques ni lo dejes a la vista en el stand.</span></div>` : ''}
          <div>${ic('MessageCircle')}<span>¿No puedes entrar? WhatsApp <a href="${WA.url}"><b>${WA.label}</b></a></span></div>
        </div>
      </div>
    </div>

    ${sec('01 · EN EL TÓTEM', 'Así juega cada participante')}
    <div class="steps">
      ${steps
        .map(
          ([img, t, d], i) => `<div class="step">
        <div class="num">${i + 1}</div>
        <div class="shot"><img src="img/${img}" alt=""></div>
        ${i < 3 ? `<svg class="arrow" viewBox="0 0 10 16" fill="none"><path d="M2 2l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
        <h3>${t}</h3><p>${d}</p></div>`,
        )
        .join('')}
    </div>

    <div class="facts">
      ${facts.map(([i, t, d]) => `<div class="fact"><span class="bubble">${ic(i)}</span><div><b>${t}</b><p>${d}</p></div></div>`).join('')}
    </div>
  </div>
  ${foot(1, TOTAL)}
</section>

<section class="page">
  ${mini('02 · En el panel', 'Configurar la ruleta', `<div class="aside">${ic('LogIn')}<div>Entra en <b>${SITE}/admin</b> con la contraseña de la página 1. <b>Todo se guarda solo</b> y llega a los tótems en unos 15 segundos.</div></div>`)}
  <div class="body">
    ${sec('ANTES DE ABRIR', 'Lista para el stand')}
    <div class="checks">
      ${checklist.map(([i, t]) => `<div class="check"><span class="box"></span>${ic(i)}<div>${t}</div></div>`).join('')}
    </div>

    ${sec('SECCIONES DEL PANEL', 'Qué se hace en cada una')}
    <div class="grid">
      ${sections
        .map(([i, t, d, tip]) => `<div class="sect"><span class="bubble">${ic(i)}</span><div><h4>${t}</h4><p>${d}</p><div class="tip">${tip}</div></div></div>`)
        .join('')}
      <div class="sect toggles"><span class="bubble">${ic('UserRoundPen')}</span><div><h4>Interruptores rápidos</h4>
        <div class="tg"><span class="sw"></span><div><b>Pedir datos</b>: apagado, el tótem va directo a la ruleta sin registro.</div></div>
        <div class="tg"><span class="sw off"></span><div><b>Versión clara</b>: fondo blanco para lugares con mucha luz.</div></div>
      </div></div>
    </div>

    ${sec('PROBABILIDADES', 'Cómo decide qué sale')}
    <div class="prob">
      <div>
        <div style="font-size:8.3pt">Cada gajo tiene un <b>peso</b>. Sale más seguido el que pesa más. Ejemplo con tres gajos:</div>
        <div class="bar">${weights.map(([, w, bg, fg]) => `<div style="width:${w}%;background:${bg};color:${fg}">${w >= 20 ? w : ''}</div>`).join('')}</div>
        <div class="legend">${weights.map(([n, w]) => `<div><span>${n} · peso ${w}</span><span>${w} de cada 100 giros</span></div>`).join('')}</div>
        <p class="note">Los pesos no tienen que sumar 100: si duplicas el de un gajo, sale el doble. El panel muestra la <b>probabilidad de premio</b> real.</p>
      </div>
      <div><div class="panel-shot"><img src="img/a-gajos.jpg" alt=""></div><div class="cap">Gajos: peso, entregados y vista previa de la ruleta.</div></div>
    </div>
  </div>
  ${foot(2, TOTAL)}
</section>

<section class="page has-band">
  ${mini('03 · Después del evento', 'Registros y soluciones')}
  <div class="body">
    ${sec('AL TERMINAR', 'Llévate los registros')}
    <div class="after">
    <div><div class="panel-shot"><img src="img/a-leads.jpg" alt=""></div>
    <div class="cap">Leads: búsqueda, filtro por resultado, edición y exportación.</div></div>
    <div class="end end-col">
      <div class="endc"><div class="h">${ic('FileSpreadsheet')} Excel y PDF</div><p>Con diseño UTA: resumen por día y hora, lista y contactos para revisar. El PDF abre la impresión: <b>Guardar como PDF</b>.</p></div>
      <div class="endc"><div class="h">${ic('FileDown')} CSV</div><p>Lista limpia para Mailchimp o un CRM. Filtra <b>Contacto confiable = Sí</b>.</p></div>
      <div class="endc warn"><div class="h">${ic('Trash2')} Vaciar</div><p>Borra los leads y reinicia inventario y conteo. <b>Exporta antes</b>: no se puede deshacer.</p></div>
    </div>
    </div>

    ${sec('SI ALGO FALLA', 'Soluciones rápidas')}
    <table>${troubles.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>

    <div class="devband" style="margin-top:auto;margin-bottom:2mm">
      <a href="${DEV.url}">${devMark('light', 9.5)}</a>
      <div><small>Diseño, desarrollo y soporte</small><p>La Ruleta UTA, su panel y esta guía fueron diseñados y desarrollados por <b>${DEV.name}</b>. Para soporte o ajustes durante el evento, escríbenos.</p></div>
      <div class="ctas">
        <a class="cta solid" href="${WA.url}">${ic('MessageCircle')} WhatsApp ${WA.label}</a>
        <a class="cta" href="${DEV.url}">${DEV.urlLabel}</a>
      </div>
    </div>
  </div>
  ${foot(3, TOTAL)}
</section>
</body></html>`;

const htmlPath = join(here, 'guia.html');
writeFileSync(htmlPath, html);
console.log('HTML:', htmlPath, PASSWORD ? '(con contraseña: documento interno)' : '(sin contraseña: para compartir)');

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.log('Playwright no está instalado: abre guia.html en Chrome y usa Imprimir → Guardar como PDF,');
  console.log('o instala con: npm i --no-save playwright && npx playwright install chromium');
  process.exit(0);
}
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
// Aviso si algo se sale de su página (el pie debe quedar dentro de 297 mm).
const overflow = await page.evaluate(() =>
  [...document.querySelectorAll('.page')]
    .map((pg, i) => ({ i: i + 1, top: pg.getBoundingClientRect().top, foot: pg.querySelector('.foot').getBoundingClientRect().bottom }))
    .filter((p) => p.foot - p.top > 1123.5)
    .map((p) => p.i),
);
if (overflow.length) console.warn('⚠ Contenido desbordado en la(s) página(s):', overflow.join(', '));
await page.pdf({ path: OUT_PDF, format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log('PDF:', OUT_PDF);
