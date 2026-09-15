// Renders the app icon in every size and variant the app and the Play Store need.
//
// The drawing lives only here, as SVG on Android's adaptive icon grid: a 108 dp layer, of which
// launchers show the central 72 dp cut to their own shape, with anything important inside the
// central 66 dp circle. Edit the shapes below and run `npm run icons` to regenerate every PNG.

import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// The app's notebook palette (src/theme/index.ts).
const NAVY = '#1F3A5F';
const PAPER = '#FFFBF2';
const RULE = '#D9C9A8';
const MARGIN = '#C8553D';

const LAYER = '0 0 108 108';
const VISIBLE = '18 18 72 72';

const SHEET = { x: 36, y: 30, width: 36, height: 48, rx: 5 };
const RULE_Y = [44, 54, 64];
const MARGIN_X = 44;
// The first word, handwritten on the middle ruled line.
const INK_PATH =
  'M48 52.6 C49.8 47.4 52.8 47.2 52.6 52.4 C53.8 48.6 56.8 48.4 57 52.6 C58.2 50.4 61 50.1 66 51.2';

const sheetRect = (fill, extra = '') =>
  `<rect x="${SHEET.x}" y="${SHEET.y}" width="${SHEET.width}" height="${SHEET.height}" rx="${SHEET.rx}" fill="${fill}" ${extra}/>`;

const rules = (stroke) =>
  RULE_Y.map(
    (y) => `<line x1="${SHEET.x}" y1="${y}" x2="${SHEET.x + SHEET.width}" y2="${y}" stroke="${stroke}" stroke-width="2.4"/>`
  ).join('');

const marginLine = (stroke) =>
  `<line x1="${MARGIN_X}" y1="${SHEET.y}" x2="${MARGIN_X}" y2="${SHEET.y + SHEET.height}" stroke="${stroke}" stroke-width="2"/>`;

const ink = (stroke) =>
  `<path d="${INK_PATH}" fill="none" stroke="${stroke}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;

const background = `<rect width="108" height="108" fill="${NAVY}"/>`;
const foreground = sheetRect(PAPER) + rules(RULE) + marginLine(MARGIN) + ink(NAVY);

// Android themed icons only read the alpha of this layer, so the lines are cut out of the sheet.
const monochrome =
  `<defs><mask id="cut" maskUnits="userSpaceOnUse" x="0" y="0" width="108" height="108">` +
  `<rect width="108" height="108" fill="white"/>${rules('black')}${marginLine('black')}${ink('black')}` +
  `</mask></defs>` +
  sheetRect('white', 'mask="url(#cut)"');

const circle = (body) =>
  `<defs><clipPath id="circle"><circle cx="54" cy="54" r="36"/></clipPath></defs><g clip-path="url(#circle)">${body}</g>`;

const svg = (viewBox, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`;

const outputs = [
  // Whole visible square, uncropped: stores and platforms apply their own mask.
  { file: 'assets/images/icon.png', size: 1024, svg: svg(VISIBLE, background + foreground) },
  { file: 'assets/store/play-store-icon.png', size: 512, svg: svg(VISIBLE, background + foreground) },
  // Adaptive icon layers, on the full 108 dp grid.
  { file: 'assets/images/android-icon-background.png', size: 1024, svg: svg(LAYER, background) },
  { file: 'assets/images/android-icon-foreground.png', size: 1024, svg: svg(LAYER, foreground) },
  { file: 'assets/images/android-icon-monochrome.png', size: 1024, svg: svg(LAYER, monochrome) },
  // Already round, so it looks the same on the splash screen and in a browser tab.
  { file: 'assets/images/splash-icon.png', size: 512, svg: svg(VISIBLE, circle(background + foreground)) },
  { file: 'assets/images/favicon.png', size: 48, svg: svg(VISIBLE, circle(background + foreground)) },
];

for (const output of outputs) {
  const png = new Resvg(output.svg, { fitTo: { mode: 'width', value: output.size } }).render().asPng();
  const target = join(root, output.file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, png);
  console.log(`${output.file} (${output.size}x${output.size})`);
}
