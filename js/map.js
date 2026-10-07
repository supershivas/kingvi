/* La carte qui se construit (touche M, ou la carte de l'en-tête) : l'île
   comme on l'a vue, rien de plus. Ce que le viking n'a pas vu reste dans le
   noir ; le bord de ce qu'il a vu est tramé, comme le cercle de vue. Trois
   couleurs : la neige, le bleu nuit (la mer, la forêt tramée, la forêt noire
   pleine, la piste en pointillés), le rouge (là où l'on est). Les lieux vus
   portent leur nom, dans la gothique du titre.
   Le jeu tient les cases vues (game.js, `markSeen`, `mapData`). */

import {
  WORLD, coast, deepForest, forestDensity, trail, landing, HOUSE, STATUE_BASE, STATUE2_BASE, ARCH, CLIFF, CAVE, LAKE, NECRO, WOLF_DEN, GROVE_TREE, HVIT_AT, MONS_AT,
} from './world.js?v=1.63.2';

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
  ['La Véla ensevelie', STATUE_BASE.x, STATUE_BASE.y],
  ['Le bosquet', GROVE_TREE.x, GROVE_TREE.y],
  ['La louve blanche', HVIT_AT.x, HVIT_AT.y],
  ['Les loups', WOLF_DEN.x, WOLF_DEN.y],
  ['La grande Véla', STATUE2_BASE.x, STATUE2_BASE.y],
  ['La maison', HOUSE.x, HOUSE.y],
  ['La falaise', CAVE.x, CLIFF.y],
  ['Le lac', LAKE.x, LAKE.y],
  ['Le creux du mons', MONS_AT.x, MONS_AT.y],
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
// L'agrandissement : entier quand il remplit presque la place (des pixels
// nets), sinon tout ce qu'elle permet (la carte ne reste pas minuscule)
function mapScale(kx, ky) {
  const fit = Math.min(kx, ky), whole = Math.floor(fit);
  return whole >= 1 && whole >= fit * 0.85 ? whole : Math.max(0.5, fit);
}
export function renderMap(view, data, palette, { maxW, maxH, t = 0, fresh = false }) {
  if (fresh || !off.dataset.drawn) { drawMap(off, data, palette); off.dataset.drawn = '1'; }
  const b = seenBounds(data) || { x0: 0, y0: 0, x1: N, y1: N };
  const w = b.x1 - b.x0, h = b.y1 - b.y0;
  const k = mapScale(maxW / w, maxH / h);
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
  const shown = [];                      // (pour le pas des morts : où cliquer, en pixels CSS)
  for (const [name, x, y] of MAP_PLACES) {
    if (!seenAt(x, y)) continue;
    const mx = Math.round(X(x)), my = Math.round(Y(y));
    shown.push({ name, x, y, cx: mx / dpr, cy: my / dpr });
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
  return { places: shown };
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

// ── La carte de SNO 4 (on y est) : la scène de l'île vue d'en haut, réduite
// au quart (sno4.js : le sol et ce qui est debout), ce qu'on n'a pas vu dans
// le noir, les tracés marchés, les lieux vus nommés, la croix rouge ──
const S4 = 4;
let sno4Base = null;
async function sno4Terrain(palette) {
  if (sno4Base) return sno4Base;
  const { paintSno4, SNO4_W, SNO4_H, SNO4_PROPS } = await import('./sno4.js?v=1.63.2');
  const full = document.createElement('canvas');
  full.width = SNO4_W; full.height = SNO4_H;
  const g = full.getContext('2d');
  paintSno4(g, palette);
  for (const p of SNO4_PROPS) p.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.' || !palette[ch]) return;
    g.fillStyle = palette[ch]; g.fillRect(p.at.x - p.ax + x, p.at.y - p.h + 1 + y, 1, 1);
  }));
  // Réduite au quart, au plus proche (des pixels nets)
  const small = document.createElement('canvas');
  small.width = Math.ceil(SNO4_W / S4); small.height = Math.ceil(SNO4_H / S4);
  const sg = small.getContext('2d');
  sg.imageSmoothingEnabled = false;
  sg.drawImage(full, 0, 0, small.width, small.height);
  sno4Base = small;
  return small;
}

export async function renderSno4Map(view, data, palette, { maxW, maxH, t = 0 }) {
  const base = await sno4Terrain(palette);
  const { PLACES_SNO4 } = await import('./saga-sno4.js?v=1.63.2');
  const { VEVE } = await import('./sno4.js?v=1.63.2');
  const { seen, cell, cols, rows, pos } = data;
  const W = base.width, H = base.height;
  const seenAt = (lx, ly) => { const c = Math.floor(lx / cell), r = Math.floor(ly / cell); return c >= 0 && r >= 0 && c < cols && r < rows && seen[r * cols + c]; };
  // Le cadrage : ce qu'on a vu, avec une marge
  let c0 = cols, c1 = -1, r0 = rows, r1 = -1;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (seen[r * cols + c]) { c0 = Math.min(c0, c); c1 = Math.max(c1, c); r0 = Math.min(r0, r); r1 = Math.max(r1, r); }
  if (c1 < 0) { c0 = 0; c1 = cols - 1; r0 = 0; r1 = rows - 1; }
  const m = 4;
  const bx0 = Math.max(0, (c0 - m) * cell / S4), by0 = Math.max(0, (r0 - m) * cell / S4);
  const bx1 = Math.min(W, (c1 + 1 + m) * cell / S4), by1 = Math.min(H, (r1 + 1 + m) * cell / S4);
  const w = bx1 - bx0, h = by1 - by0;
  const k = mapScale(maxW / w, maxH / h);
  const dpr = window.devicePixelRatio || 1;
  view.width = Math.round(w * k * dpr); view.height = Math.round(h * k * dpr);
  view.style.width = `${w * k}px`; view.style.height = `${h * k}px`;
  const ctx = view.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, bx0, by0, w, h, 0, 0, view.width, view.height);
  const z = k * dpr, X = x => (x / S4 - bx0) * z, Y = y => (y / S4 - by0) * z;
  // Le noir sur ce qu'on n'a pas vu, tramé au bord
  ctx.fillStyle = palette.b;
  for (let y = Math.floor(by0); y < by1; y++) for (let x = Math.floor(bx0); x < bx1; x++) {
    const lx = x * S4 + S4 / 2, ly = y * S4 + S4 / 2;
    if (seenAt(lx, ly)) continue;
    const hcell = cell * 0.5;
    const edge = seenAt(lx + hcell, ly) || seenAt(lx - hcell, ly) || seenAt(lx, ly + hcell) || seenAt(lx, ly - hcell);
    if (edge && BAYER[(y & 3) * 4 + (x & 3)] < 0.45) continue;
    ctx.fillRect(Math.floor((x - bx0) * z), Math.floor((y - by0) * z), Math.ceil(z), Math.ceil(z));
  }
  const u = Math.max(2, Math.round(z));
  // Les tracé marchés (une croix de cendre)
  for (const v of VEVE) {
    if (!data.veve?.includes(v.id) || !seenAt(v.at.x, v.at.y)) continue;
    const mx = Math.round(X(v.at.x)), my = Math.round(Y(v.at.y));
    ctx.fillStyle = palette.b;
    ctx.fillRect(mx - u * 2, my - u / 2, u * 4, u); ctx.fillRect(mx - u / 2, my - u * 2, u, u * 4);
  }
  // Les lieux vus, et leur nom
  ctx.font = `500 ${Math.round(15 * dpr)}px "Grenze Gotisch", serif`;
  ctx.textBaseline = 'middle';
  for (const p of PLACES_SNO4) {
    const lx = p.x * 960, ly = p.y * 600;
    if (!seenAt(lx, ly)) continue;
    const mx = Math.round(X(lx)), my = Math.round(Y(ly));
    ctx.fillStyle = palette.b; ctx.fillRect(mx - u * 1.5, my - u * 1.5, u * 3, u * 3);
    ctx.fillStyle = palette.s; ctx.fillRect(mx - u / 2, my - u / 2, u, u);
    const tw = ctx.measureText(p.nom).width, lx2 = Math.max(2, Math.min(view.width - tw - 4, mx + u * 2.5));
    ctx.lineWidth = 4 * dpr; ctx.strokeStyle = palette.s; ctx.lineJoin = 'round'; ctx.strokeText(p.nom, lx2, my);
    ctx.fillStyle = palette.b; ctx.fillText(p.nom, lx2, my);
  }
  if (pos) {
    const mx = Math.round(X(pos.x)), my = Math.round(Y(pos.y)), a = (Math.floor(t * 2) % 2 ? 4 : 3) * u / 2;
    ctx.fillStyle = palette.s;
    ctx.fillRect(mx - a - u, my - u, 2 * a + 2 * u, 2 * u); ctx.fillRect(mx - u, my - a - u, 2 * u, 2 * a + 2 * u);
    ctx.fillStyle = palette.r;
    ctx.fillRect(mx - a, my - u / 2, 2 * a, u); ctx.fillRect(mx - u / 2, my - a, u, 2 * a);
  }
}
