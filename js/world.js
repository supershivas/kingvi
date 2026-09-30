import { makeTree, makeBoulder, makeCairn, makeIceberg } from './trees.js';
import { buildStatue, buildStatueUpright } from './statue.js';

/* L'île : relief de la côte, traces à suivre, rochers, arbres puis forêt.
   Tout est déterministe (graine fixe) : l'île est la même à chaque partie.
   Le sol est peint par morceaux de CHUNK × CHUNK pixels, à la demande. */

export const WORLD = 6144;
export const CHUNK = 256;
export const CENTER = WORLD / 2;
const RADIUS = 2500;
const SEED = 7;

// ── Hasard déterministe ──
function hash(x, y, s = SEED) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smooth(t) { return t * t * (3 - 2 * t); }

function valueNoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = smooth(x - xi), yf = smooth(y - yi);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s);
  const c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

export function fbm(x, y, s, octaves = 4) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) {
    v += amp * (valueNoise(x * f, y * f, s + i * 17) - 0.5);
    f *= 2; amp *= 0.5;
  }
  return v; // environ [-0.5, 0.5]
}

// Négatif sur l'île, positif en mer ; 0 sur le rivage.
export function coast(x, y) {
  const dx = x - CENTER, dy = y - CENTER;
  const r = Math.sqrt(dx * dx + dy * dy) / RADIUS;
  return r - 1 + 0.55 * fbm(x / 900, y / 900, 3) + 0.1 * fbm(x / 140, y / 140, 5, 3);
}

export const isLand = (x, y) => coast(x, y) < 0;

// ── Point d'accostage : sur la côte ouest ; on part vers l'est ──
export function landing() {
  const y = CENTER + 200;
  let x = CENTER;
  while (coast(x, y) < 0) x -= 2;
  return { shore: x, y };
}

const LANDING = landing();
const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Distance au rivage d'accostage, déformée par un bruit lent : c'est elle qui
// dessine les bandes (arbres isolés, forêt, forêt noire) à lisière irrégulière.
export function forestDx(x, y) {
  return x - LANDING.shore + 2200 * fbm(x / 1500, y / 1500, 81, 3) + 300 * fbm(x / 300, y / 300, 83, 2);
}

// La forêt profonde, si dense qu'elle est noire : 0 (dehors) → 1 (cœur).
export function deepForest(x, y) {
  const dx = forestDx(x, y);
  return smoothstep(1880, 2000, dx) * (1 - smoothstep(2780, 2920, dx));
}

function rawForest(x, y) {
  const dx = forestDx(x, y);
  const sparse = dx > 300 ? 0.03 : 0;
  const core = 0.62 * smoothstep(1150, 1450, dx) * (1 - smoothstep(2850, 3150, dx));
  const patchy = 0.55 + 1.6 * fbm(x / 260, y / 260, 71, 3);
  return Math.max(sparse, core * Math.max(0, patchy), deepForest(x, y));
}

// ── La maison, vers le bout des traces ──
export const HOUSE = { x: CENTER + 1150, y: CENTER - 120 };
// La porte, au pied du mur de gauche (voir makeHouse) ; et juste devant elle, dehors
export const HOUSE_DOOR = { x: HOUSE.x - 6, y: HOUSE.y - 12 };
export const HOUSE_DOOR_OUT = { x: HOUSE.x - 8, y: HOUSE.y - 8 };

// ── Les traces : une piste de pas qui traverse l'île, passe devant la
// maison et continue plus loin vers l'est ──
const STRIDE = 7;
const TRAIL_STEPS = 2400;

function buildTrail() {
  const { shore, y: ly } = landing();
  const r = rng(SEED * 101);
  // Elles partent juste devant le drakkar, là où le viking pose le pied
  let x = shore + 40, y = ly - 4;
  let heading = 0; // vers l'est
  // Points de passage : devant la maison (sud-ouest, sud, sud-est), puis au loin
  // Elles vont jusqu'à la porte de la maison, puis en ressortent vers l'est
  const waypoints = [
    { x: HOUSE_DOOR_OUT.x - 28, y: HOUSE_DOOR_OUT.y + 16 },
    { x: HOUSE_DOOR_OUT.x, y: HOUSE_DOOR_OUT.y, door: true, reach: 7 },
    { x: HOUSE.x + 14, y: HOUSE.y + 12 },
    { x: HOUSE.x + 62, y: HOUSE.y - 2 },
    { x: HOUSE.x + 950, y: HOUSE.y - 320, last: true },
  ];
  let doorIndex = Infinity;
  let w = 0;
  const prints = [];
  for (let i = 0; i < TRAIL_STEPS; i++) {
    const target = waypoints[w];
    const dist = Math.hypot(target.x - x, target.y - y);
    if (dist < (target.reach || 16)) {
      if (target.last) break;       // au bout, les traces s'arrêtent net
      if (target.door) doorIndex = prints.length;
      w++;
      continue;
    }
    const toTarget = Math.atan2(target.y - y, target.x - x);
    let diff = Math.atan2(Math.sin(toTarget - heading), Math.cos(toTarget - heading));
    // Errance lente, attirée de loin par le but ; près d'un point de passage,
    // l'attraction l'emporte sur l'errance
    // Dans la forêt noire, la piste hésite un peu (sans trop serpenter)
    const lost = deepForest(x, y);
    const pull = w > 0 && !target.last ? 0.35 : dist < 400 ? 0.1 : 0.012 * (1 - 0.5 * lost);
    heading += 0.09 * (1 + 1.0 * lost) * fbm(i / (40 - 8 * lost), 0, 42, 3) + pull * diff + (r() - 0.5) * (0.03 + 0.02 * lost);
    // Ne jamais marcher vers la mer
    if (coast(x + Math.cos(heading) * 120, y + Math.sin(heading) * 120) > -0.04) {
      const toCenter = Math.atan2(CENTER - y, CENTER - x);
      diff = Math.atan2(Math.sin(toCenter - heading), Math.cos(toCenter - heading));
      heading += diff * 0.15;
    }
    x += Math.cos(heading) * STRIDE;
    y += Math.sin(heading) * STRIDE;
    const side = i % 2 ? 1 : -1;
    const px = x + Math.cos(heading + Math.PI / 2) * side * 1.6;
    const py = y + Math.sin(heading + Math.PI / 2) * side * 1.6;
    prints.push({ x: Math.round(px), y: Math.round(py), heading, gone: r(), faintness: r() });
  }
  // En sortant de la maison, il saigne : gouttes de sang le long des traces
  prints.forEach((p, i) => { if (i >= doorIndex) p.blood = true; });
  // Les premiers pas sont les plus anciens : la neige les a en partie recouverts
  return prints.filter((p, i) => {
    const age = 1 - i / prints.length;
    p.faint = p.faintness < 0.35 * age;
    return p.gone >= 0.3 * age * age;
  });
}

export const trail = buildTrail();
const BLOOD_FROM = trail.findIndex(p => p.blood);
// Largeur de la sente autour de chaque pas : elle s'élargit et se resserre
trail.forEach((p, i) => { p.i = i; p.lane = 2 + 3.5 * Math.max(0, 0.5 + 1.6 * fbm(i / 14, 3, 91, 2)); });

// ── Clairières semées le long de la piste, dans la forêt noire ──
export const CLEARINGS = (() => {
  const r = rng(SEED * 211), out = [];
  let next = 0;
  trail.forEach((p, i) => {
    if (i < next || deepForest(p.x, p.y) < 0.6) return;
    const side = (r() - 0.5) * 24;
    out.push({ x: Math.round(p.x + Math.sin(p.heading) * side), y: Math.round(p.y - Math.cos(p.heading) * side), r: 12 + r() * 24, seed: r() * 100 });
    next = i + 12 + Math.floor(r() * 16);
  });
  return out;
})();
const inClearing = (x, y, margin = 0) => CLEARINGS.some(c => Math.hypot(x - c.x, y - c.y) < c.r + margin);

const off = (p, d) => ({ x: Math.round(p.x + Math.sin(p.heading) * d), y: Math.round(p.y - Math.cos(p.heading) * d) });

// ── La statue brisée : dans la forêt, au bord nord de la piste ──
const STATUE_AT = trail.find(p => p.x > LANDING.shore + 1830) || trail[Math.floor(trail.length / 2)];
export const STATUE_BASE = off(STATUE_AT, 26);
const STATUE_PARTS = buildStatue(STATUE_BASE, SEED);

// ── La grande statue droite : au sortir de la forêt, au bord sud de la piste ──
function forestExit() {
  const start = trail.indexOf(STATUE_AT);
  let run = 0;
  for (let i = start; i < trail.length; i++) {
    run = rawForest(trail[i].x, trail[i].y) < 0.05 ? run + 1 : 0;
    if (run === 12) return trail[i - 6];
  }
  return trail[Math.floor(trail.length * 0.8)];
}
const EXIT = forestExit();
export const STATUE2_BASE = off(EXIT, -40);
const STATUE2_PARTS = buildStatueUpright(STATUE2_BASE, SEED);

// ── Les corbeaux : posés près de la piste, avant la forêt ──
const CROW_AT = trail.find(p => forestDx(p.x, p.y) > 880) || trail[Math.floor(trail.length * 0.25)];
export const CROWS = off(CROW_AT, 14);

const trailByChunk = new Map();
for (const p of trail) {
  const key = `${Math.floor(p.x / CHUNK)},${Math.floor(p.y / CHUNK)}`;
  if (!trailByChunk.has(key)) trailByChunk.set(key, []);
  trailByChunk.get(key).push(p);
}

// ── Petits motifs (b = sombre, s = neige, r = rouge) ──
const ROCKS = [
  ['.bb.', 'bbbb'],
  ['..b..', '.bbb.', 'bbbbb'],
  ['.bb', 'bbb'],
  ['..bb...', '.bbbb.b', 'bbbbbbb'],
];
const STONE = ['.b.', 'bsb', 'bbb', 'bsb', 'bbb', 'bsb', 'bbb']; // pierre levée gravée

// La maison, vue de haut et de biais (d'après l'image de référence) : un grand
// toit enneigé en losange, dont le faîtage court en diagonale, et sous lui
// deux murs sombres. Pas de cheminée qui fume. HOUSE est le bas du motif, au milieu.
export const HOUSE_W = 100;
export const HOUSE_H = 60;
const WALL = 15;                                           // hauteur des murs
// Coins du toit (en pixels du motif) : gauche, haut, droite, bas
const ROOF = { L: [14, 14], T: [50, 3], R: [95, 25], B: [58, 40] };
// Emprise au sol : le toit abaissé de la hauteur des murs
export const HOUSE_FOOT = [ROOF.L, ROOF.T, ROOF.R, ROOF.B].map(([x, y]) => [x, y + WALL]);

function inPoly(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function makeHouse() {
  const W = HOUSE_W, H = HOUSE_H, r = rng(SEED * 313);
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; };
  const line = ([x0, y0], [x1, y1], c) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
  };
  const { L, T, R, B } = ROOF;
  const down = ([x, y]) => [x, y + WALL];

  // Ombre portée sur la neige, au sud-est (tramée)
  const shadow = [down(B), down(R), [R[0] + 4, R[1] + WALL + 5], [B[0] + 6, B[1] + WALL + 5]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inPoly(shadow, x + 0.5, y + 0.5) && (x + y) % 2 === 0) g[y][x] = 'b';
  // Murs : face gauche (L→B) pleine, face droite (B→R) aux planches usées
  const left = [L, B, down(B), down(L)], right = [B, R, down(R), down(B)];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (inPoly(left, x + 0.5, y + 0.5)) g[y][x] = 'b';
    else if (inPoly(right, x + 0.5, y + 0.5)) g[y][x] = x % 5 === 0 && r() < 0.5 ? 's' : 'b';
  }
  line(B, down(B), 's');                                   // arête éclairée du coin
  // Toit : neige, tachée de sombre vers les bords, contour et faîtage sombres
  const roof = [L, T, R, B];
  const ridgeA = [(L[0] + T[0]) / 2, (L[1] + T[1]) / 2], ridgeB = [(B[0] + R[0]) / 2, (B[1] + R[1]) / 2];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inPoly(roof, x + 0.5, y + 0.5)) continue;
    // Distance au faîtage : la neige se tasse et se salit vers l'égout
    const t = Math.abs((ridgeB[1] - ridgeA[1]) * x - (ridgeB[0] - ridgeA[0]) * y + ridgeB[0] * ridgeA[1] - ridgeB[1] * ridgeA[0])
      / Math.hypot(ridgeB[1] - ridgeA[1], ridgeB[0] - ridgeA[0]) / 14;
    g[y][x] = r() < 0.04 + 0.22 * t * t ? 'b' : 's';
  }
  for (const [a, b] of [[L, T], [T, R], [R, B], [B, L]]) line(a, b, 'b');
  for (let i = 0; i <= 40; i += 2) {
    const k = i / 40;
    put(ridgeA[0] + (ridgeB[0] - ridgeA[0]) * k, ridgeA[1] + (ridgeB[1] - ridgeA[1]) * k, 'b');
  }
  // Porte et fenêtre sur la face gauche, cadres clairs
  const along = (t, h) => [L[0] + (B[0] - L[0]) * t, L[1] + (B[1] - L[1]) * t + h];
  const frame = (t0, t1, h0, h1) => {
    line(along(t0, h0), along(t1, h0), 's'); line(along(t0, h1), along(t1, h1), 's');
    line(along(t0, h0), along(t0, h1), 's'); line(along(t1, h0), along(t1, h1), 's');
  };
  frame(0.62, 0.74, 4, WALL);                                // porte
  frame(0.2, 0.3, 5, 9);                                     // fenêtre
  // Vitre : sombre le jour, le feu s'y allume la nuit (calque HOUSE_GLOW)
  for (let t = 0.215; t < 0.29; t += 0.01) for (let h = 6; h <= 8; h++) put(...along(t, h), 'w');
  return g.map(row => row.join(''));
}
const HOUSE_RAW = makeHouse();
export const HOUSE_ART = HOUSE_RAW.map(r => r.replace(/w/g, 'b'));
export const HOUSE_GLOW = HOUSE_RAW.map(r => r.replace(/[^w]/g, '.').replace(/w/g, 'r'));

const HOUSE_LEFT = HOUSE.x - HOUSE_W / 2, HOUSE_TOP = HOUSE.y + 1 - HOUSE_H;
// On ne traverse pas la maison
export const houseBlocked = (x, y) => inPoly(HOUSE_FOOT, x - HOUSE_LEFT, y - HOUSE_TOP);
// Ligne du pied des murs, vue d'en face : devant elle on passe devant la maison
export function houseFrontY(x) {
  const ax = x - HOUSE_LEFT;
  const [L, , R, B] = HOUSE_FOOT;
  if (ax < L[0] || ax > R[0]) return null;
  const [a, b] = ax <= B[0] ? [L, B] : [B, R];
  return HOUSE_TOP + a[1] + (b[1] - a[1]) * (ax - a[0]) / (b[0] - a[0]);
}

function stamp(ctx, pat, ox, oy, pal) {
  pat.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '.') return;
    ctx.fillStyle = pal[c];
    ctx.fillRect(ox + x, oy + y, 1, 1);
  }));
}

// Peint un morceau de sol dans `ctx` (canvas CHUNK × CHUNK).
export function paintChunk(ctx, cx, cy, pal) {
  const x0 = cx * CHUNK, y0 = cy * CHUNK;
  const img = ctx.createImageData(CHUNK, CHUNK);
  const d = img.data;
  const rgb = {};
  for (const k of ['b', 's']) {
    const n = parseInt(pal[k].slice(1), 16);
    rgb[k] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const set = (i, c) => { const v = rgb[c]; d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = 255; };

  // Un morceau loin de la côte est entièrement terre ou mer : pas de calcul fin
  const mid = coast(x0 + CHUNK / 2, y0 + CHUNK / 2);
  const uniform = mid < -0.35 ? 'land' : mid > 0.35 ? 'sea' : null;

  // Forêt noire : sol tramé de plus en plus sombre sous les arbres.
  // La piste y reste claire (couloir de 3 pixels autour de chaque pas).
  let deep = null, corridor = null;
  const corners = [[0, 0], [CHUNK, 0], [0, CHUNK], [CHUNK, CHUNK], [CHUNK / 2, CHUNK / 2]];
  if (corners.some(([x, y]) => deepForest(x0 + x, y0 + y) > 0)) {
    deep = new Float32Array((CHUNK / 4 + 1) ** 2);
    for (let j = 0; j <= CHUNK / 4; j++) for (let i = 0; i <= CHUNK / 4; i++) deep[j * (CHUNK / 4 + 1) + i] = deepForest(x0 + i * 4, y0 + j * 4);
    // Couloir : pour chaque pixel, son « ouverture » (1 au milieu de la sente,
    // 0 à distance). Le bord est ensuite déchiqueté par du bruit.
    corridor = new Float32Array(CHUNK * CHUNK);
    const mark = (x, y, lane) => {
      const R = Math.ceil(lane + 3);
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const d = Math.hypot(dx, dy);
        if (d > lane + 3) continue;
        const lx = Math.round(x) - x0 + dx, ly = Math.round(y) - y0 + dy;
        if (lx < 0 || ly < 0 || lx >= CHUNK || ly >= CHUNK) continue;
        const v = 1 - d / (lane + 3);
        if (corridor[ly * CHUNK + lx] < v) corridor[ly * CHUNK + lx] = v;
      }
    };
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      for (const p of trailByChunk.get(`${cx + i},${cy + j}`) || []) {
        const q = trail[p.i + 1] || p;
        const n = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / 2));
        for (let k = 0; k <= n; k++) mark(p.x + (q.x - p.x) * k / n, p.y + (q.y - p.y) * k / n, p.lane + (q.lane - p.lane) * k / n);
      }
    }
    // Clairières : bord déchiqueté (le rayon varie avec l'angle)
    for (const c of CLEARINGS) {
      if (c.x + c.r + 8 < x0 || c.x - c.r - 8 > x0 + CHUNK || c.y + c.r + 8 < y0 || c.y - c.r - 8 > y0 + CHUNK) continue;
      const R = Math.ceil(c.r + 8);
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const lx = c.x - x0 + dx, ly = c.y - y0 + dy;
        if (lx < 0 || ly < 0 || lx >= CHUNK || ly >= CHUNK) continue;
        const a = Math.atan2(dy, dx);
        const edge = c.r * (1 + 0.22 * Math.sin(a * 3 + c.seed) + 0.12 * Math.sin(a * 7 + c.seed * 2));
        const d = Math.hypot(dx, dy);
        const v = Math.max(0, Math.min(1, 1 - (d - edge * 0.6) / (edge * 0.4 + 6)));
        if (corridor[ly * CHUNK + lx] < v) corridor[ly * CHUNK + lx] = v;
      }
    }
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  for (let y = 0; y < CHUNK; y++) {
    for (let x = 0; x < CHUNK; x++) {
      const wx = x0 + x, wy = y0 + y, i = (y * CHUNK + x) * 4;
      const c = uniform === 'land' ? -1 : uniform === 'sea' ? 1 : coast(wx, wy);
      if (c < 0) {
        // Neige ; de rares grains sombres, en longues rides couchées par le vent
        let dark = false;
        if (c > -0.0016) dark = (wx + wy) % 2 === 0;                    // rive mouillée
        else if (c > -0.0035) dark = (wx % 2 === 0 && wy % 2 === 0);
        else {
          const ridge = fbm(wx / 70, wy / 9, 11, 3);
          dark = ridge > 0.3 && hash(wx, wy, 9) < 0.06;
          if (!dark) dark = hash(wx, wy, 13) < 0.00012;
        }
        // Ouverture bruitée : bords de sente déchiquetés, trouées irrégulières
        let lane = 0;
        if (deep && corridor[y * CHUNK + x] > 0) {
          const n = valueNoise(wx / 5, wy / 5, 57) + 0.5 * valueNoise(wx / 2, wy / 2, 59);
          const o = corridor[y * CHUNK + x] * 1.35 + (n - 0.75) * 0.9;
          lane = o > 0.72 ? 2 : o > 0.45 ? 1 : 0;
          if (lane === 2 && hash(wx, wy, 61) < 0.05) lane = 0;   // aiguilles tombées
        }
        if (deep && lane < 2) {
          const k = deep[(y >> 2) * (CHUNK / 4 + 1) + (x >> 2)] * (lane ? 0.45 : 1);
          if (k > 0 && (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 < k * 1.15) dark = true;
        }
        set(i, dark ? 'b' : 's');
      } else {
        // Mer : écume le long du rivage, rares crêtes au large
        let light = false;
        if (c < 0.0015) light = hash(wx >> 1, wy, 21) < 0.55;
        else if (c < 0.004) light = (wx + wy) % 3 === 0 && hash(wx, wy, 23) < 0.5;
        else light = hash(wx >> 2, wy, 31) < 0.004 * (1 + fbm(wx / 300, wy / 300, 33) * 2);
        set(i, light ? 's' : 'b');
      }
    }
  }
  ctx.putImageData(img, 0, 0);

  // Objets rares, jamais dans l'eau
  const r = rng(cx * 7919 + cy * 104729 + SEED);
  const place = (w, h) => {
    const x = Math.floor(r() * (CHUNK - w)), y = Math.floor(r() * (CHUNK - h));
    return coast(x0 + x, y0 + y + h) < -0.02 && coast(x0 + x + w, y0 + y) < -0.02 ? { x, y } : null;
  };
  const rocks = r() < 0.55 ? 1 + Math.floor(r() * 2) : 0;
  for (let k = 0; k < rocks; k++) {
    const pat = ROCKS[Math.floor(r() * ROCKS.length)];
    const at = place(pat[0].length, pat.length);
    if (at) stamp(ctx, pat, at.x, at.y, pal);
  }
  if (r() < 0.035) { const at = place(3, 7); if (at) stamp(ctx, STONE, at.x, at.y, pal); }

  // Les traces
  const prints = trailByChunk.get(`${cx},${cy}`) || [];
  ctx.fillStyle = pal.b;
  for (const p of prints) {
    const lx = p.x - x0, ly = p.y - y0;
    if (p.blood) {
      // Gouttes de sang : à côté du pas, parfois une traînée ; plus rares au loin
      const fade = Math.max(0.15, 1 - (p.i - BLOOD_FROM) / 160);
      ctx.fillStyle = pal.r;
      if (hash(p.x, p.y, 71) < 0.65 * fade) ctx.fillRect(lx + Math.round(hash(p.x, p.y, 72) * 4 - 2), ly + Math.round(hash(p.x, p.y, 73) * 4 - 2), 1, 1);
      if (hash(p.x, p.y, 74) < 0.25 * fade) ctx.fillRect(lx + 1, ly + 2, 2, 1);
      ctx.fillStyle = pal.b;
    }
    ctx.fillRect(lx, ly, 1, 1);
    if (!p.faint) {
      // Deuxième pixel dans le sens de la marche : l'empreinte s'allonge
      const dx = Math.round(Math.cos(p.heading)), dy = Math.round(Math.sin(p.heading));
      ctx.fillRect(lx + dx, ly + dy, 1, 1);
    }
  }
}

// ── Objets debout (arbres, gros rochers, cairns) ──
// Ils sont triés en profondeur avec le viking et le bloquent : le jeu les
// affiche un par un. Tout est tiré d'un hasard propre à chaque cellule.
const CELL = 16;

// Quelques arbres isolés, puis la forêt, de plus en plus serrée jusqu'au
// noir, puis de nouveau clairsemée. Clairières autour des statues et de la maison.
export function forestDensity(x, y) {
  if (Math.hypot(x - HOUSE.x, y - HOUSE.y) < 150) return 0;
  if (Math.hypot(x - STATUE_BASE.x, y - STATUE_BASE.y) < 110) return 0;
  if (Math.hypot(x - STATUE2_BASE.x, y - STATUE2_BASE.y) < 120) return 0;
  if (inClearing(x, y, 3)) return 0;
  return rawForest(x, y);
}

function nearTrail(x, y, dist) {
  const cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    for (const p of trailByChunk.get(`${cx + i},${cy + j}`) || []) {
      // La sente est plus ou moins large : les arbres s'écartent d'autant
      const d = Math.max(dist, (p.lane || 0) + 4);
      if (Math.abs(p.x - x) < d && Math.abs(p.y - y) < d) return true;
    }
  }
  return false;
}

const objectCache = new Map();

export function objectsInChunk(cx, cy) {
  const key = `${cx},${cy}`;
  if (objectCache.has(key)) return objectCache.get(key);
  const list = [];
  const x0 = cx * CHUNK, y0 = cy * CHUNK;
  const free = (x, y, trail) =>
    coast(x, y) < -0.03 && !nearTrail(x, y, trail) &&
    Math.hypot(x - LANDING.shore, y - LANDING.y) > 60 &&
    Math.hypot(x - STATUE_BASE.x, y - STATUE_BASE.y) > 80 &&
    Math.hypot(x - STATUE2_BASE.x, y - STATUE2_BASE.y) > 80 &&
    Math.hypot(x - HOUSE.x, y - HOUSE.y) > 110;

  for (let gy = 0; gy < CHUNK; gy += CELL) {
    for (let gx = 0; gx < CHUNK; gx += CELL) {
      const r = rng(hash(x0 + gx, y0 + gy, 77) * 4294967296);
      const x = x0 + gx + Math.floor(r() * CELL), y = y0 + gy + Math.floor(r() * CELL);
      // En mer, pas trop loin des côtes : de rares icebergs plats
      const sea = coast(x, y);
      if (sea > 0.012) {
        if (sea < 0.3 && r() < 0.0011 && coast(x - 22, y) > 0.01 && coast(x + 22, y) > 0.01 && coast(x, y - 12) > 0.01) {
          list.push({ type: 'iceberg', x, y, seed: Math.floor(r() * 1e9) });
        }
        continue;
      }
      const d = forestDensity(x, y);
      if (r() < d && free(x, y, 8)) {
        list.push({ type: 'tree', x, y, seed: Math.floor(r() * 1e9), big: d > 0.2 });
        // Au cœur de la forêt noire, un second arbre serré contre le premier
        if (d > 0.8 && r() < 0.6) {
          const x2 = x + Math.floor(r() * 9) - 4, y2 = y + Math.floor(r() * 7) - 3;
          if (free(x2, y2, 7)) list.push({ type: 'tree', x: x2, y: y2, seed: Math.floor(r() * 1e9), big: true });
        }
        continue;
      }
      // Gros rochers : rares, un peu plus fréquents hors de la forêt
      if (r() < 0.012 && free(x, y, 16)) list.push({ type: 'boulder', x, y, seed: Math.floor(r() * 1e9) });
      else if (r() < 0.004 && free(x, y, 10)) list.push({ type: 'cairn', x, y, seed: Math.floor(r() * 1e9) });
    }
  }
  for (const o of list) {
    if (o.art) continue;
    const r = rng(o.seed);
    o.art = o.type === 'tree' ? makeTree(r, { big: o.big }) : o.type === 'boulder' ? makeBoulder(r)
      : o.type === 'iceberg' ? makeIceberg(r) : makeCairn(r);
    o.w = o.art.rows[0].length;
    o.h = o.art.rows.length;
  }
  // La statue et ses éclats, dans le morceau où tombe leur pied
  for (const o of [...STATUE_PARTS, ...STATUE2_PARTS]) {
    if (Math.floor(o.x / CHUNK) === cx && Math.floor(o.y / CHUNK) === cy) {
      list.push({ ...o, w: o.art.rows[0].length, h: o.art.rows.length });
    }
  }
  objectCache.set(key, list);
  return list;
}

// Un objet bloque-t-il le passage en (x, y) ? Arbres : le tronc.
// Rochers et cairns : la moitié basse de leur silhouette.
export function blocked(x, y) {
  const cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK);
  for (let j = 0; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    for (const o of objectsInChunk(cx + i, cy + j)) {
      const dx = x - o.x, dy = y - o.y;
      if (o.type === 'tree') { if (Math.abs(dx) <= 1.5 && dy <= 0.5 && dy >= -1.5) return true; continue; }
      const foot = o.foot ?? o.h * 0.55;               // profondeur au sol ; 0 : on passe dessus
      if (!foot) continue;
      const left = -o.art.ax, right = o.w - o.art.ax;
      if (dx > left + 0.5 && dx < right - 0.5 && dy <= 0.5 && dy >= -foot) return true;
    }
  }
  return false;
}
