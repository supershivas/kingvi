/* SNO 4, l'île Carrefour, telle qu'on la joue : Kári y vient en barque depuis
   la grève de SNO 7 (game.js : `voyage`). Comme la grotte, c'est une scène
   posée loin en mer (INTERIORS.sno4), mais en plein air : la neige tombe, le
   vent souffle, il fait nuit, la torche brûle.
   La forme suit la carte du labo (saga-sno4.js, PLACES_SNO4 : x, y en
   fractions) : une île de neige cabossée dans la banquise tramée, les quatre
   pistes du carrefour, les lieux. Ce qui est haut (mâts, Pilier, croix,
   cases, fromager, maison aux bouteilles) est posé à part et trié à son pied.
   Rien de géométrique : tout est tordu par le bruit.
   Couleurs : s neige, b bleu nuit, r le rouge (la forge). */

import { PLACES_SNO4 } from './saga-sno4.js?v=1.56.1';
import { makeGroveTree } from './grove.js?v=1.56.1';
import { CUBE_WHITE, CUBE_BLACK, CUBE_FOOT } from './cubes.js?v=1.56.1';

// Le cube blanc et le cube noir (cubes.js) : au nord-est de la source, et près du fromager
export const SNO4_CUBES = [{ kind: 'blanc', x: 598, y: 138 }, { kind: 'noir', x: 775, y: 316 }];

export const SNO4_W = 960;
export const SNO4_H = 600;
const MW = 200, MH = 120;                     // la carte du labo
const KX = SNO4_W / MW, KY = SNO4_H / MH;

function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// (les mêmes ondes que la carte du labo, à l'échelle de la scène)
const wave = (x, y) => Math.sin(x * 0.11 + Math.sin(y * 0.07) * 2) * 0.5 + Math.sin(y * 0.13 + x * 0.05) * 0.35 + Math.sin((x + y) * 0.21) * 0.15;
const mx = x => x / KX, my = y => y / KY;
const isLandAt = (x, y) => Math.hypot((mx(x) - MW * 0.48) / (MW * 0.4), (my(y) - MH * 0.5) / (MH * 0.36)) + wave(mx(x), my(y)) * 0.18 < 1;
const isIceAt = (x, y) => Math.hypot((mx(x) - MW * 0.5) / (MW * 0.5), (my(y) - MH * 0.52) / (MH * 0.5)) + wave(mx(x) + 40, my(y)) * 0.12 < 1.02;

// Les lieux, en pixels de la scène
export const SNO4_AT = Object.fromEntries(PLACES_SNO4.map(p => [p.id, { x: Math.round(p.x * SNO4_W), y: Math.round(p.y * SNO4_H) }]));
// La barque de Kári, tirée sur la glace à l'ouest, près de la Barrière ; on arrive à côté
export const SNO4_BOAT = { x: 46, y: 322 };
export const SNO4_ENTRY = { x: 92, y: 340 };

// ── Les accessoires debout (lignes de pixels), triés à leur pied ──
const blank = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
const toRows = g => g.map(r => r.join(''));
function put(g, x, y, c) { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }

// Un mât tordu, avec sa vergue et un peu de givre
function mast(h, seed) {
  const g = blank(13, h + 2);
  let x = 6;
  for (let y = h; y >= 0; y--) {
    if (hash(y, seed, 3) < 0.12) x += hash(y, seed, 4) < 0.5 ? -1 : 1;
    x = Math.max(4, Math.min(8, x));
    put(g, x, y, 'b'); if (y > 4) put(g, x + 1, y, hash(x, y, seed) < 0.3 ? 's' : 'b');
    if (y === 6) for (let k = -5; k <= 5; k++) put(g, x + k, y + (Math.abs(k) > 3 ? 1 : 0), 'b');
  }
  for (let k = -2; k <= 3; k++) put(g, 6 + k, h + 1, 'b');
  return toRows(g);
}
// La Barrière de Clède : deux mâts plantés, une corde qui pend entre eux
function barrier() {
  const a = mast(34, 1), b = mast(31, 2), W = 30, H = 37;
  const g = blank(W, H);
  a.forEach((r, y) => [...r].forEach((c, x) => c !== '.' && put(g, x, y + 1, c)));
  b.forEach((r, y) => [...r].forEach((c, x) => c !== '.' && put(g, x + 16, y + 4, c)));
  for (let x = 8; x < 22; x++) put(g, x, 9 + Math.round(Math.sin((x - 8) / 14 * Math.PI) * 4), 'b');
  // le tonneau de Clède
  for (let y = 30; y < 36; y++) for (let x = 12; x < 17; x++) put(g, x, y, (x === 12 || x === 16 || y === 32) ? 'b' : 's');
  return toRows(g);
}
// Le Pilier : le grand mât de La Délivrance, planté dans la glace
function potoMitan() {
  const g = blank(9, 52);
  for (let y = 0; y < 52; y++) { put(g, 4, y, 'b'); put(g, 5, y, y % 7 === 3 ? 's' : 'b'); }
  for (let x = 1; x < 8; x++) put(g, x, 51, 'b');
  put(g, 3, 0, 'b'); put(g, 6, 1, 'b');
  return toRows(g);
}
// Une croix du cimetière, de travers, givrée en haut
function cross(h, w, seed) {
  const g = blank(w + 2, h + 1);
  const lean = hash(seed, 1, 5) < 0.5 ? 0 : 1;
  for (let y = 0; y <= h; y++) put(g, Math.floor(w / 2) + 1 + (y < h / 2 ? lean : 0), y, y === 0 ? 's' : 'b');
  for (let x = 1; x <= w; x++) put(g, x, Math.floor(h / 4) + (x === w && lean ? 1 : 0), 'b');
  put(g, 1, Math.floor(h / 4) - 1, 's');
  return toRows(g);
}
// Une case de la cour, en planches du navire : toit de neige, porte sombre
function hut(w, h, seed) {
  const g = blank(w, h);
  const roof = Math.floor(h * 0.45);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ry = roof - Math.round((1 - Math.abs(x - w / 2) / (w / 2)) * roof * 0.9) + (hash(x, seed, 7) < 0.2 ? 1 : 0);
    if (y < ry) continue;
    if (y < roof) { put(g, x, y, y === ry ? 'b' : 's'); continue; }      // le toit, couvert de neige
    const edge = x === 0 || x === w - 1 || y === h - 1 || y === roof;
    const door = x >= w / 2 - 2 && x <= w / 2 + 1 && y > h - 7;
    put(g, x, y, edge || door ? 'b' : (y - roof) % 3 === 0 && hash(x, y, seed) < 0.8 ? 'b' : 's');
  }
  return toRows(g);
}
// La maison aux bouteilles : une case plus large, et sous l'avant-toit des
// bouteilles qui pendent (elles tintent : game.js les fait briller)
function bottleHouse() {
  const g = hut(40, 24, 9).map(r => [...r]);
  const W = g[0].length;
  const out = blank(W + 8, g.length + 2);
  g.forEach((r, y) => r.forEach((c, x) => c !== '.' && put(out, x + 4, y + 2, c)));
  for (let x = 1; x < W + 7; x += 3) {
    const len = 2 + Math.floor(hash(x, 3, 11) * 4), y0 = 10 + Math.floor(hash(x, 4, 11) * 2);
    for (let k = 0; k < len; k++) put(out, x, y0 + k, 'b');
    put(out, x, y0 + len, 's');
  }
  return toRows(out);
}
// La forge : une case ouverte, le feu dedans (la flamme est posée par le jeu)
function forge() {
  const g = hut(24, 18, 5).map(r => [...r]);
  for (let y = 11; y < 17; y++) for (let x = 7; x < 17; x++) g[y][x] = y === 16 ? 'b' : '.';
  return toRows(g);
}

const grove = makeGroveTree(17);
export const SNO4_PROPS = [
  ...SNO4_CUBES.map(c => ({ key: `sno4-cube-${c.kind}`, rows: c.kind === 'blanc' ? CUBE_WHITE : CUBE_BLACK, at: { x: c.x, y: c.y }, foot: CUBE_FOOT })),
  { key: 'sno4-barriere', rows: barrier(), at: SNO4_AT.barriere, foot: 3 },
  { key: 'sno4-poto', rows: potoMitan(), at: SNO4_AT.peristil, foot: 2 },
  { key: 'sno4-forge', rows: forge(), at: SNO4_AT.forge, foot: 6 },
  { key: 'sno4-bouteilles', rows: bottleHouse(), at: SNO4_AT.bouteilles, foot: 8 },
  { key: 'sno4-mapou', rows: grove.rows, at: SNO4_AT.mapou, foot: 3, ax: grove.ax },
  ...[[-34, -6, 7], [-22, 10, 8], [26, 6, 9], [38, -8, 10]].map(([dx, dy, s]) => ({ key: `sno4-case-${s}`, rows: hut(22 + (s % 3) * 2, 16, s), at: { x: SNO4_AT.lakou.x + dx, y: SNO4_AT.lakou.y + dy }, foot: 5 })),
  // La tonnelle : quatre poteaux autour du Pilier
  ...[[-26, -18], [26, -20], [-24, 18], [25, 17]].map(([dx, dy], i) => ({ key: `sno4-poteau-${i}`, rows: mast(20 + i, 30 + i).map(r => r.slice(3, 10)), at: { x: SNO4_AT.peristil.x + dx, y: SNO4_AT.peristil.y + dy }, foot: 1 })),
  // Le cimetière : la croix du Baron, celle de Rosine, et les autres
  { key: 'sno4-croix-baron', rows: cross(22, 13, 1), at: SNO4_AT.cimetiere, foot: 1 },
  { key: 'sno4-croix-brigitte', rows: cross(16, 9, 2), at: { x: SNO4_AT.cimetiere.x + 20, y: SNO4_AT.cimetiere.y + 6 }, foot: 1 },
  ...Array.from({ length: 16 }, (_, i) => {
    const a = i * 2.4, r = 28 + (i % 4) * 11;
    return { key: `sno4-croix-${i}`, rows: cross(8 + (i % 3) * 2, 5 + (i % 2) * 2, 10 + i), at: { x: Math.round(SNO4_AT.cimetiere.x + Math.cos(a) * r * 1.4), y: Math.round(SNO4_AT.cimetiere.y + Math.sin(a) * r * 0.7) }, foot: 1 };
  }),
];
for (const p of SNO4_PROPS) {
  p.w = p.rows[0].length; p.h = p.rows.length;
  p.ax = p.ax ?? Math.floor(p.w / 2);
}

// Le pied de chaque accessoire bloque, là où son dessin est plein
const solid = new Set();
for (const p of SNO4_PROPS) {
  const x0 = p.at.x - p.ax, y0 = p.at.y - p.h + 1;
  for (let y = p.h - p.foot; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.rows[y][x] !== '.') solid.add((y0 + y) * SNO4_W + x0 + x);
}
export function sno4Walkable(x, y) {
  x = Math.round(x); y = Math.round(y);
  if (x < 4 || y < 4 || x >= SNO4_W - 4 || y >= SNO4_H - 4) return false;
  if (!isIceAt(x, y)) return false;
  for (let k = -1; k <= 1; k++) if (solid.has(y * SNO4_W + x + k)) return false;
  // (la barque, sur la glace)
  if (Math.abs(x - SNO4_BOAT.x) < 16 && y > SNO4_BOAT.y - 4 && y < SNO4_BOAT.y + 14) return false;
  return true;
}
// On reprend la barque en marchant vers elle (game.js : `checkVoyage`)
export const nearSno4Boat = (x, y) => Math.hypot(x - (SNO4_BOAT.x + 10), y - (SNO4_BOAT.y + 8)) < 22;

// Les âmes du carrefour : debout dans la neige, autour du croisement
export const SNO4_SOULS = Array.from({ length: 46 }, (_, i) => {
  const a = hash(i, 1, 21) * Math.PI * 2, r = 12 + hash(i, 2, 21) * 46;
  return { x: Math.round(SNO4_AT.kalfou.x + Math.cos(a) * r * 1.5), y: Math.round(SNO4_AT.kalfou.y + Math.sin(a) * r * 0.8), f: hash(i, 3, 21) < 0.45, k: hash(i, 4, 21) < 0.2 };
});
// Clotilde marche de l'épave à la maison aux bouteilles et retour
export const CLOTILDE_PATH = [SNO4_AT.delivrance, { x: 240, y: 470 }, { x: 520, y: 430 }, { x: 760, y: 380 }, { x: SNO4_AT.bouteilles.x - 30, y: SNO4_AT.bouteilles.y + 16 }];

// ── Le sol : neige, banquise, pistes, tracé, tombes, l'épave, la source ──
export function paintSno4(ctx, palette) {
  const W = SNO4_W, H = SNO4_H;
  const img = ctx.createImageData(W, H), d = img.data;
  const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const C = { s: rgb(palette.s), b: rgb(palette.b), r: rgb(palette.r) };
  const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const set = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; [d[i], d[i + 1], d[i + 2]] = C[c]; d[i + 3] = 255; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = 'b';
    if (isLandAt(x, y)) c = hash(x, y, 1) < 0.012 ? 'b' : 's';                       // la neige, un grain
    else if (isIceAt(x, y)) c = B[(y & 3) * 4 + (x & 3)] < 4 + Math.floor(hash(x >> 3, y >> 3, 2) * 4) ? 'b' : 's';   // la banquise, tramée
    set(x, y, c);
  }
  // Les quatre pistes du carrefour, en pas tassés
  const K = SNO4_AT.kalfou;
  for (const [dx, dy] of [[1, 0.06], [-1, 0.09], [0.12, 1], [-0.06, -1]]) {
    for (let i = 6; i < 420; i += 3) {
      const x = Math.round(K.x + dx * i + Math.sin(i * 0.07) * 4), y = Math.round(K.y + dy * i * 0.62 + Math.cos(i * 0.05) * 2);
      if (isLandAt(x, y)) { set(x, y, 'b'); if (i % 6 === 0) set(x + 1, y + 1, 'b'); }
    }
  }
  // Des sentes vers les lieux
  const path = (a, b) => {
    const n = Math.hypot(b.x - a.x, b.y - a.y);
    for (let i = 0; i < n; i += 4) {
      const t = i / n, x = Math.round(a.x + (b.x - a.x) * t + Math.sin(t * 9) * 5), y = Math.round(a.y + (b.y - a.y) * t + Math.cos(t * 7) * 3);
      if (isIceAt(x, y)) set(x, y, 'b');
    }
  };
  const A = SNO4_AT;
  path(SNO4_ENTRY, A.barriere); path(A.barriere, A.lakou); path(A.lakou, A.forge); path(A.lakou, A.peristil); path(A.forge, A.marche); path(A.cimetiere, A.source);
  // Le tracé de Clède, tracé à la cendre dans la cour de la cour : une croix, une canne
  const V = { x: A.lakou.x, y: A.lakou.y + 4 };
  for (let k = -9; k <= 9; k++) { set(V.x + k, V.y + Math.round(k * 0.05), 'b'); set(V.x + Math.round(k * 0.05), V.y + Math.round(k * 0.55), 'b'); }
  for (let k = 0; k < 6; k++) { set(V.x + 9 + (k > 3 ? 1 : 0), V.y - k, 'b'); set(V.x - 9 - (k > 3 ? 1 : 0), V.y - k, 'b'); }
  for (let a = 0; a < 6.28; a += 0.25) set(V.x + Math.round(Math.cos(a) * 3), V.y - 7 + Math.round(Math.sin(a) * 2), 'b');
  // Les tombes : des bosses de neige tassée, tramées d'ombre au sud
  for (let i = 0; i < 26; i++) {
    const a = i * 1.9, r = 20 + (i % 5) * 9, gx = Math.round(A.cimetiere.x + Math.cos(a) * r * 1.5), gy = Math.round(A.cimetiere.y + 4 + Math.sin(a) * r * 0.7);
    for (let y = 0; y < 3; y++) for (let x = -4; x <= 4; x++) if (Math.abs(x) + y < 5 && B[((gy + y) & 3) * 4 + ((gx + x) & 3)] < 6 + y * 3) set(gx + x, gy + y, 'b');
  }
  // L'épave de La Délivrance, couchée dans la glace
  const D = A.delivrance;
  for (let y = -16; y <= 16; y++) for (let x = -44; x <= 44; x++) {
    const hull = Math.abs(y + x * 0.18) <= 12 - Math.pow(Math.abs(x) / 44, 3) * 12;
    if (!hull) continue;
    const edge = Math.abs(y + x * 0.18) > 10 - Math.pow(Math.abs(x) / 44, 3) * 12;
    set(D.x + x, D.y + y, edge || (x % 6 === 0) ? 'b' : B[((D.y + y) & 3) * 4 + ((D.x + x) & 3)] < 5 ? 'b' : 's');
  }
  // La source de Sibelle : un trou d'eau noire, et sa buée tramée
  const S = A.source;
  for (let y = -10; y <= 10; y++) for (let x = -16; x <= 16; x++) {
    const r = Math.hypot(x / 16, y / 10) + (hash(x, y, 31) - 0.5) * 0.15;
    if (r < 0.6) set(S.x + x, S.y + y, 'b');
    else if (r < 1 && B[((S.y + y) & 3) * 4 + ((S.x + x) & 3)] < (1 - r) * 18) set(S.x + x, S.y + y, 'b');
  }
  // Le marché de Palme : des étals de planches sur la glace
  for (let i = 0; i < 6; i++) {
    const sx = A.marche.x - 40 + i * 15, sy = A.marche.y + (i % 2) * 8;
    for (let x = 0; x < 10; x++) { set(sx + x, sy, 'b'); set(sx + x, sy + 4, 'b'); }
    set(sx, sy + 1, 'b'); set(sx, sy + 2, 'b'); set(sx + 9, sy + 1, 'b'); set(sx + 9, sy + 2, 'b'); set(sx + 9, sy + 3, 'b');
  }
  ctx.putImageData(img, 0, 0);
}

// ── Les tracé qu'on marche : des points de cendre dans la neige. Passer sur
// chacun (dans n'importe quel ordre, sans trop traîner) referme le dessin, et
// le esprit vient (game.js : `checkVeve`). Dessins inspirés des vrais tracé,
// simplifiés (à faire relire). `at` : le milieu ; `nodes` : les points ;
// `links` : les traits entre eux (rangs dans `nodes`).
export const VEVE = [
  {
    id: 'legba', lwa: 'legba', at: { x: SNO4_AT.barriere.x + 46, y: SNO4_AT.barriere.y + 26 },
    // une croix, et la canne de Clède accrochée aux deux bras
    nodes: [[0, -18], [0, 0], [0, 18], [-24, 0], [24, 0], [24, -12], [-24, -12]],
    links: [[0, 1], [1, 2], [3, 1], [1, 4], [4, 5], [3, 6]],
  },
  {
    id: 'damballah', lwa: 'damballah', at: { x: SNO4_AT.mapou.x - 6, y: SNO4_AT.mapou.y + 46 },
    // le serpent qui ondule, et l'œuf
    nodes: [[-30, 0], [-19, -8], [-8, 0], [3, 8], [14, 0], [25, -8], [33, 4]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
  },
  {
    id: 'baron', lwa: 'baron', at: { x: SNO4_AT.cimetiere.x - 4, y: SNO4_AT.cimetiere.y + 86 },
    // la croix du Baron sur son tombeau à degrés
    nodes: [[0, -20], [0, -6], [-12, -12], [12, -12], [0, 8], [-16, 14], [16, 14]],
    links: [[0, 1], [2, 3], [1, 4], [4, 5], [4, 6], [5, 6]],
  },
];
export const VEVE_NODE = 6;      // on passe sur un point à moins de tant de pixels
export const VEVE_TIME = 45;     // secondes pour le refermer
