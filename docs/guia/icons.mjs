/**
 * Regenera icons.json con los íconos de lucide-react que usa la guía (los
 * mismos de la app). Sólo hace falta si cambias la lista de íconos.
 *
 *   node docs/guia/icons.mjs
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '..', '..', 'package.json'));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const L = require('lucide-react');

const names = ['LayoutGrid', 'Palette', 'MessageSquareText', 'Users', 'Images', 'MonitorSmartphone', 'Settings', 'WifiOff', 'Timer', 'CircleSlash', 'Maximize', 'Volume2', 'FileDown', 'FileSpreadsheet', 'FileText', 'Trash2', 'RotateCcw', 'UserRoundPen', 'Sun', 'KeyRound', 'MonitorPlay', 'Hand', 'ShieldCheck', 'RefreshCw', 'Trophy', 'Smartphone', 'LogIn', 'MessageCircle', 'Phone'];
const out = {};
for (const n of names) {
  if (!L[n]) throw new Error(`lucide-react no tiene el ícono ${n}`);
  out[n] = renderToStaticMarkup(React.createElement(L[n], { size: 24, strokeWidth: 1.9, color: 'currentColor', 'aria-hidden': true }));
}
writeFileSync(join(here, 'icons.json'), JSON.stringify(out));
console.log(Object.keys(out).length, 'íconos →', join(here, 'icons.json'));
