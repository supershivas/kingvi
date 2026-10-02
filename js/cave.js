/* La grotte, au pied de la falaise : une galerie qui serpente vers le nord,
   s'élargit, se resserre, noire tout autour ; il y fait nuit, toujours (la
   torche est allumée). Des ossements de plus en plus nombreux, une mare gelée,
   des stalagmites. Au fond, dans la grande salle, un roi mort sur un trône de
   pierre, une épée sur les genoux, une couronne sur la tête : quand on
   s'approche, sa tête tombe et la couronne roule à ses pieds.
   Couleurs : b pierre sombre, s pierre éclairée, glace, os ; k noir. */

import { RUIN_ART } from './ruins-art.js?v=1.27.0';

export const CAVE_W = 200;
export const CAVE_H = 190;

function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// La galerie : des poches qui s'enchaînent du sud (l'entrée) au nord (la salle)
const POCKETS = [
  { x: 100, y: 176, rx: 7, ry: 6 },
  { x: 96, y: 164, rx: 10, ry: 7 },
  { x: 84, y: 150, rx: 16, ry: 9 },
  { x: 70, y: 135, rx: 20, ry: 11 },
  { x: 82, y: 120, rx: 13, ry: 7 },
  { x: 104, y: 110, rx: 22, ry: 11 },
  { x: 128, y: 97, rx: 18, ry: 9 },
  { x: 118, y: 84, rx: 11, ry: 6 },
  { x: 100, y: 66, rx: 62, ry: 26 },                   // la grande salle (le roi est immense)
];
const POOL = { x: 64, y: 136, rx: 9, ry: 4 };           // la mare gelée
export const THRONE = { x: 100, y: 70 };                // pied de l'estrade (au fond de la salle)
export const CAVE_ENTRY = { x: 100, y: 176 };

// Distance au bord : < 1 dans la galerie. Le bord est rongé par le bruit.
function caveD(x, y) {
  // Chaque poche est reliée à la suivante par un boyau (d'une taille à l'autre)
  let best = 9;
  for (let i = 0; i < POCKETS.length - 1; i++) {
    const p = POCKETS[i], q = POCKETS[i + 1];
    const sx = q.x - p.x, sy = q.y - p.y;
    const t = Math.max(0, Math.min(1, ((x - p.x) * sx + (y - p.y) * sy) / (sx * sx + sy * sy)));
    const cx = p.x + sx * t, cy = p.y + sy * t;
    const rx = p.rx + (q.rx - p.rx) * t, ry = p.ry + (q.ry - p.ry) * t;
    best = Math.min(best, Math.hypot((x - cx) / rx, (y - cy) / ry));
  }
  return best + (noise(x / 5, y / 4, 3) - 0.5) * 0.45 + (noise(x / 2, y / 2, 5) - 0.5) * 0.15;
}
const inPool = (x, y) => Math.hypot((x - POOL.x) / POOL.rx, (y - POOL.y) / POOL.ry) + (noise(x / 3, y / 3, 9) - 0.5) * 0.3 < 1;

// Stalagmites : de petites dents de pierre, là où le hasard les met
const SPIKES = [[55, 128], [88, 146], [118, 104], [140, 95], [109, 118]];

export function makeCave() {
  const g = Array.from({ length: CAVE_H }, () => Array(CAVE_W).fill('k'));
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < CAVE_W && y < CAVE_H) g[y][x] = c; };
  const floor = Array.from({ length: CAVE_H }, (_, y) => Array.from({ length: CAVE_W }, (_, x) => caveD(x, y) < 1 || (y > 176 && Math.abs(x - 100 + (y - 176) * 0.2) < 5)));
  // Le sol : de la pierre claire, grenue ; plus sombre à mesure qu'on s'enfonce
  for (let y = 0; y < CAVE_H; y++) for (let x = 0; x < CAVE_W; x++) {
    if (!floor[y][x]) continue;
    const deep = 1 - y / CAVE_H;
    const grain = hash(x, y, 11) < 0.03 + 0.08 * deep || noise(x / 4, y / 2, 13) < 0.1;
    put(x, y, grain ? 'b' : 's');
    // Le bord, mangé d'ombre (tramé)
    if (caveD(x, y) > 0.93 && (x + y) % 2) put(x, y, 'b');
  }
  // La paroi : au-dessus de chaque bord nord du sol, un mur plus ou moins haut,
  // des strates, des éclats de glace qui pendent
  for (let x = 0; x < CAVE_W; x++) for (let y = 1; y < CAVE_H; y++) {
    if (!floor[y][x] || floor[y - 1][x]) continue;
    const h = 7 + Math.round(6 * noise(x / 9, y / 7, 17) + 3 * hash(x >> 1, y, 19));
    for (let k = 1; k <= h; k++) {
      const yy = y - k;
      if (yy < 0 || floor[yy][x]) break;
      const seam = noise(x / 6, yy / 1.7, 23) > 0.72;
      put(x, yy, k === h ? 's' : seam ? 's' : 'b');
      // la paroi s'efface dans le noir, en haut
      if (k > h - 3 && (x + yy) % 2) put(x, yy, 'k');
    }
    // Des glaçons, au pied de la paroi
    if (hash(x, y, 29) < 0.08) { put(x, y - 1, 's'); put(x, y - 2, 's'); }
  }
  // Le bord sud du sol : une lèvre sombre
  for (let y = 0; y < CAVE_H - 1; y++) for (let x = 0; x < CAVE_W; x++) {
    if (floor[y][x] && !floor[y + 1][x] && y < 176) put(x, y, 'b');
  }
  // La mare gelée : noire, des reflets
  for (let y = 0; y < CAVE_H; y++) for (let x = 0; x < CAVE_W; x++) {
    if (!inPool(x, y)) continue;
    put(x, y, hash(x, y, 31) < 0.08 || (y === POOL.y - 2 && hash(x, 0, 33) < 0.5) ? 's' : 'k');
  }
  // Stalagmites
  for (const [x, y] of SPIKES) {
    const h = 3 + (x % 3);
    for (let k = 0; k < h; k++) { put(x, y - k, k === h - 1 ? 's' : 'b'); if (k < h - 2) put(x + 1, y - k, 'b'); }
    put(x - 1, y, 'b');
  }
  // Ossements : épars à l'entrée, en tas dans la salle
  let a = 77;
  const r = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
  for (let i = 0; i < 90; i++) {
    const p = POCKETS[Math.floor(Math.pow(r(), 0.6) * POCKETS.length)];
    const x = Math.round(p.x + (r() - 0.5) * p.rx * 1.6), y = Math.round(p.y + (r() - 0.5) * p.ry * 1.4);
    if (caveD(x, y) > 0.8 || inPool(x, y)) continue;
    const c = g[y][x] === 's' ? 'b' : 's';
    if (r() < 0.3) { put(x, y, c); put(x + 1, y, c); put(x + 2, y, c); }          // un os long
    else if (r() < 0.5) { put(x, y, c); put(x + 1, y, c); put(x, y - 1, c); put(x + 1, y - 1, c); }   // un crâne
    else put(x, y, c);
  }
  return g.map(row => row.join(''));
}
export const CAVE_ROOM = makeCave();

// Le roi squelette sur son trône, immense, d'après le dessin fourni
// (assets/roi.png → ruins-art.js) : assis, puis la tête tombée, la couronne
// roulée au pied de l'estrade. L'image a son pied (le bas de l'estrade) à la
// ligne THRONE_FOOT. On ne retouche pas le dessin : pour « la tête tombée »,
// la couronne quitte la tête (CROWN) et se pose devant, le crâne s'affaisse.
const ROI = RUIN_ART.roi;
const CROWN = { x0: 45, x1: 55, y0: 9, y1: 16 };          // la couronne, dans le dessin
const SKULL = { x0: 37, x1: 51, y0: 16, y1: 30 };         // le crâne
const CROWN_AT = { x: 60, y: ROI.length - 12 };           // où elle roule
function bowedKing() {
  const g = ROI.map(r => [...r]);
  const at = (x, y) => ROI[y]?.[x] ?? '.';
  // La couronne quitte la tête
  for (let y = CROWN.y0; y < CROWN.y1; y++) for (let x = CROWN.x0; x < CROWN.x1; x++) g[y][x] = '.';
  // Le crâne s'affaisse de deux pixels
  for (let y = SKULL.y1 - 1; y >= SKULL.y0; y--) for (let x = SKULL.x0; x < SKULL.x1; x++) g[y + 2][x] = at(x, y);
  for (let y = SKULL.y0; y < SKULL.y0 + 2; y++) for (let x = SKULL.x0; x < SKULL.x1; x++) g[y][x] = 'k';
  // Elle roule au pied de l'estrade, couchée
  for (let y = CROWN.y0; y < CROWN.y1; y++) for (let x = CROWN.x0; x < CROWN.x1; x++) {
    const c = at(x, y);
    if (c === '.') continue;
    const X = CROWN_AT.x + (y - CROWN.y0), Y = CROWN_AT.y + (x - CROWN.x0) - 4;
    if (g[Y] && X < g[Y].length) g[Y][X] = c;
  }
  return g.map(r => r.join(''));
}
export const THRONE_FRAMES = { seated: ROI, bowed: bowedKing() };
export const THRONE_FOOT = ROI.length - 1;               // la ligne du bas de l'estrade

export function caveWalkable(x, y) {
  // Le couloir de l'entrée, jusqu'au seuil
  if (y > 172 && y < 190 && Math.abs(x - 100 + Math.max(0, y - 176) * 0.2) < 4) return true;
  if (y > 182) return false;
  if (caveD(x, y) > 0.78 || inPool(x, y)) return false;
  // L'estrade et le trône : on n'y monte pas
  if (Math.abs(x - THRONE.x) < ROI[0].length / 2 - 4 && y < THRONE.y + 1) return false;
  return !SPIKES.some(([sx, sy]) => Math.abs(x - sx - 0.5) < 2 && Math.abs(y - sy) < 2);
}
export const atCaveDoor = (x, y) => y > 184;
export const nearThrone = (x, y) => Math.hypot(x - THRONE.x, (y - THRONE.y) * 1.5) < 40;
