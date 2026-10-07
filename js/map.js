/* La carte qui se construit (touche M, ou la carte de l'en-tête) : l'île
   comme on l'a vue, rien de plus. Ce que le viking n'a pas vu reste dans le
   noir ; le bord de ce qu'il a vu est tramé, comme le cercle de vue. Trois
   couleurs : la neige, le bleu nuit (la mer, la forêt tramée, la forêt noire
   pleine, la piste en pointillés), le rouge (là où l'on est). Les lieux vus
   portent leur nom, dans la gothique du titre.
   Le jeu tient les cases vues (game.js, `markSeen`, `mapData`). */

import {
  WORLD, coast, deepForest, forestDensity, trail, landing, HOUSE, STATUE_BASE, STATUE2_BASE, ARCH, CLIFF, CAVE, LAKE, NECRO, WOLF_DEN, GROVE_TREE,
} from './world.js?v=1.49.0';

const S = 12;                   // pixels du monde par pixel de carte
const N = Math.ceil(WORLD / S);
export const MAP_N = N;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);

// Les lieux, avec le nom qu'on leur donne quand on les a vus
const L = landing();
export const MAP_PLACES = [
  ['La grève', L.shore + 30, L.y],
  ['La plaine des morts', NECRO.x + 100, NECRO.y + 35],
  ['L\'arche', ARCH.x, ARCH.y],
  ['La Freya ensevelie', STATUE_BASE.x, STATUE_BASE.y],
  ['Le bosquet', GROVE_TREE.x, GROVE_TREE.y],
  ['Les loups', WOLF_DEN.x, WOLF_DEN.y],
  ['La grande Freya', STATUE2_BASE.x, STATUE2_BASE.y],
  ['La maison', HOUSE.x, HOUSE.y],
  ['La falaise', CAVE.x, CLIFF.y],
  ['Le lac', LAKE.x, LAKE.y],
];

// Le fond : l'île entière, préparé une fois (en pixels de carte, 0 = neige,
// 1 = nuit), puis le relief qu'on garde
let base = null;
function terrain() {
  if (base) return base;
  base = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const wx = x * S + S / 2, wy = y * S + S / 2, b = BAYER[(y & 3) * 4 + (x & 3)];
    let v = 0;
    if (coast(wx, wy) >= 0) v = (x + y) % 3 ? 1 : 0;                        // la mer : nuit, à peine piquée
    else if (deepForest(wx, wy) > 0.5) v = b < 0.88 ? 1 : 0;               // la forêt noire
    else v = b < forestDensity(wx, wy) * 0.55 ? 1 : 0;                     // la forêt, tramée
    base[y * N + x] = v;
  }
  for (const p of trail) {
    const x = Math.floor(p.x / S), y = Math.floor(p.y / S);
    if ((x + y) % 2 === 0) base[y * N + x] = 1;
  }
  // La falaise : un trait à son pied
  for (let x = Math.floor(CLIFF.x0 / S); x < Math.ceil(CLIFF.x1 / S); x++) base[Math.floor(CLIFF.y / S) * N + x] = 1;
  return base;
}

// La carte, sur un canevas de N × N pixels de carte (affiché agrandi)
export function drawMap(canvas, { seen, cell, n, pos }, palette, t = 0) {
  const T = terrain();
  canvas.width = N; canvas.height = N;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(N, N), d = img.data;
  const rgb = h => { const v = parseInt(h.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; };
  const SNOW = rgb(palette.s), NIGHT = rgb(palette.b);
  // Vu ou non : la distance (en cases) à une case vue, pour tramer le bord
  const seenAt = (wx, wy) => {
    const c = Math.floor(wx / cell), r = Math.floor(wy / cell);
    return c >= 0 && r >= 0 && c < n && r < n && seen[r * n + c];
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const wx = x * S + S / 2, wy = y * S + S / 2, i = (y * N + x) * 4;
    let lit = seenAt(wx, wy) ? 1 : 0;
    if (!lit) {
      // à une demi-case d'une case vue : la trame du bord
      const h = cell * 0.5;
      const near = seenAt(wx + h, wy) || seenAt(wx - h, wy) || seenAt(wx, wy + h) || seenAt(wx, wy - h);
      if (near && BAYER[(y & 3) * 4 + (x & 3)] < 0.4) lit = 1;
    }
    const c = lit && !T[y * N + x] ? SNOW : NIGHT;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

// La carte à l'écran : le morceau vu de l'île, agrandi d'un facteur entier
// pour tenir dans maxW × maxH pixels CSS ; les noms et la croix par-dessus,
// à la taille de l'écran
const off = typeof document !== 'undefined' ? document.createElement('canvas') : null;
export function renderMap(view, data, palette, { maxW, maxH, t = 0, fresh = false }) {
  if (fresh || !off.dataset.drawn) { drawMap(off, data, palette); off.dataset.drawn = '1'; }
  const b = seenBounds(data) || { x0: 0, y0: 0, x1: N, y1: N };
  const w = b.x1 - b.x0, h = b.y1 - b.y0;
  const k = Math.max(1, Math.floor(Math.min(maxW / w, maxH / h)));
  const dpr = window.devicePixelRatio || 1;
  view.width = Math.round(w * k * dpr); view.height = Math.round(h * k * dpr);
  view.style.width = `${w * k}px`; view.style.height = `${h * k}px`;
  const ctx = view.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, b.x0, b.y0, w, h, 0, 0, view.width, view.height);
  const z = k * dpr, X = x => (x / S - b.x0) * z, Y = y => (y / S - b.y0) * z;
  const { seen, cell, n, pos } = data;
  const seenAt = (wx, wy) => { const c = Math.floor(wx / cell), r = Math.floor(wy / cell); return c >= 0 && r >= 0 && c < n && r < n && seen[r * n + c]; };
  // Les lieux vus, et leur nom
  ctx.font = `500 ${Math.round(15 * dpr)}px "Grenze Gotisch", serif`;
  ctx.textBaseline = 'middle';
  const u = Math.max(2, Math.round(z));
  for (const [name, x, y] of MAP_PLACES) {
    if (!seenAt(x, y)) continue;
    const mx = Math.round(X(x)), my = Math.round(Y(y));
    ctx.fillStyle = palette.b; ctx.fillRect(mx - u * 1.5, my - u * 1.5, u * 3, u * 3);
    ctx.fillStyle = palette.s; ctx.fillRect(mx - u / 2, my - u / 2, u, u);
    const tw = ctx.measureText(name).width, lx = Math.max(2, Math.min(view.width - tw - 4, mx + u * 2.5));
    ctx.lineWidth = 4 * dpr; ctx.strokeStyle = palette.s; ctx.lineJoin = 'round'; ctx.strokeText(name, lx, my);
    ctx.fillStyle = palette.b; ctx.fillText(name, lx, my);
  }
  // Là où l'on est : une croix rouge qui bat
  if (pos) {
    const mx = Math.round(X(pos.x)), my = Math.round(Y(pos.y)), a = (Math.floor(t * 2) % 2 ? 4 : 3) * u / 2;
    ctx.fillStyle = palette.s;
    ctx.fillRect(mx - a - u, my - u, 2 * a + 2 * u, 2 * u); ctx.fillRect(mx - u, my - a - u, 2 * u, 2 * a + 2 * u);
    ctx.fillStyle = palette.r;
    ctx.fillRect(mx - a, my - u / 2, 2 * a, u); ctx.fillRect(mx - u / 2, my - a, u, 2 * a);
  }
}

// Le cadrage : la partie vue de l'île (avec une marge), pour l'agrandir
export function seenBounds({ seen, cell, n }) {
  let c0 = n, c1 = -1, r0 = n, r1 = -1;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (seen[r * n + c]) {
    c0 = Math.min(c0, c); c1 = Math.max(c1, c); r0 = Math.min(r0, r); r1 = Math.max(r1, r);
  }
  if (c1 < 0) return null;
  const m = 6;
  return { x0: Math.max(0, (c0 - m) * cell / S), y0: Math.max(0, (r0 - m) * cell / S), x1: Math.min(N, (c1 + 1 + m) * cell / S), y1: Math.min(N, (r1 + 1 + m) * cell / S) };
}
