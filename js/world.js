import { makeTree, makeBoulder, makeCairn } from './trees.js';

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

// ── La maison, au bout des traces ──
export const HOUSE = { x: CENTER + 650, y: CENTER - 120 };
// Devant la porte (voir HOUSE_DOOR_ART) : là où les traces s'arrêtent
export const HOUSE_DOOR = { x: HOUSE.x + 9, y: HOUSE.y + 4 };

// ── Les traces : une piste de pas qui traverse l'île jusqu'à la maison ──
const STRIDE = 7;
const TRAIL_STEPS = 1100;

function buildTrail() {
  const { shore, y: ly } = landing();
  const r = rng(SEED * 101);
  // Elles partent juste devant le drakkar, là où le viking pose le pied
  let x = shore + 40, y = ly - 4;
  let heading = 0; // vers l'est
  const target = HOUSE_DOOR;
  const prints = [];
  for (let i = 0; i < TRAIL_STEPS; i++) {
    // Arrivées au but, les traces s'arrêtent net
    if (Math.hypot(target.x - x, target.y - y) < 10) break;
    const toTarget = Math.atan2(target.y - y, target.x - x);
    let diff = Math.atan2(Math.sin(toTarget - heading), Math.cos(toTarget - heading));
    // Errance lente, attirée de loin par le but
    // Plus on approche, plus l'attraction l'emporte sur l'errance
    const pull = Math.hypot(target.x - x, target.y - y) < 400 ? 0.08 : 0.012;
    heading += 0.09 * fbm(i / 40, 0, 42, 3) + pull * diff + (r() - 0.5) * 0.03;
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
  // Les premiers pas sont les plus anciens : la neige les a en partie recouverts
  return prints.filter((p, i) => {
    const age = 1 - i / prints.length;
    p.faint = p.faintness < 0.35 * age;
    return p.gone >= 0.3 * age * age;
  });
}

export const trail = buildTrail();

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
// Drakkar échoué, dessiné debout puis couché : proue vers le large (ouest)
const DRAKKAR_UPRIGHT = [
  '...b...',
  '..bbb..',
  '..bsb..',
  '.bs.sb.',
  'bbs.sbb',
  '.bs.sb.',
  'bbs.sbb',
  '.bs.sb.',
  'bbsrsbb',
  '.bsrsb.',
  'bbsrsbb',
  '.bs.sb.',
  'bbs.sbb',
  '.bs.sb.',
  'bbs.sbb',
  '.bs.sb.',
  '..bsb..',
  '..bbb..',
  '...b...',
  '...b...',
];

export const DRAKKAR = [...DRAKKAR_UPRIGHT[0]].map((_, x) => DRAKKAR_UPRIGHT.map(row => row[x]).join(''));

// La maison : à l'échelle du viking (sa porte fait à peu près sa taille).
// Vue de trois quarts : un grand toit enneigé en pente, des murs sombres,
// une fenêtre où brûle un feu, une cheminée. HOUSE est le bas du motif, au milieu.
export const HOUSE_W = 72;
export const HOUSE_H = 46;
export const HOUSE_WALL = 24;                              // hauteur des murs
export const HOUSE_WINDOW = { x: 15, y: 31, w: 5, h: 4 };  // en pixels du motif
export const HOUSE_DOOR_ART = { x: 42, y: 33, w: 6, h: 13 };
export const HOUSE_CHIMNEY = { x: 55, y: 0 };

function makeHouse() {
  const W = HOUSE_W, H = HOUSE_H, r = rng(SEED * 313);
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; };
  const eave = H - HOUSE_WALL;                  // ligne du bas du toit
  // Murs : un bloc sombre, un peu en retrait sous le débord du toit
  for (let y = eave; y < H; y++) for (let x = 5; x < W - 5; x++) put(x, y, 'b');
  // Toit : pan en pente vers nous, du faîtage (haut) à l'égout (bas), qui déborde
  const ridge = 5;
  for (let y = ridge; y <= eave + 1; y++) {
    const t = (y - ridge) / (eave + 1 - ridge);
    const left = Math.round(14 - 13 * t), right = Math.round(W - 12 + 11 * t);
    for (let x = left; x <= right; x++) {
      const edge = x === left || x === right || y === ridge || y === eave + 1;
      // Neige tassée : quelques pixels sombres, plus nombreux vers l'égout
      const speck = r() < 0.05 + 0.18 * t * t;
      put(x, y, edge || speck ? 'b' : 's');
    }
  }
  // Cheminée qui perce le toit
  for (let y = 0; y < ridge + 4; y++) for (let x = HOUSE_CHIMNEY.x - 1; x <= HOUSE_CHIMNEY.x + 2; x++) put(x, y, 'b');
  put(HOUSE_CHIMNEY.x, ridge + 1, 's'); put(HOUSE_CHIMNEY.x + 1, ridge + 1, 's');
  // Fenêtre (le feu y est ajouté par le jeu) et porte, cadres clairs
  const { x: wx, y: wy, w: ww, h: wh } = HOUSE_WINDOW;
  for (let x = wx - 1; x <= wx + ww; x++) { put(x, wy - 1, 's'); put(x, wy + wh, 's'); }
  for (let y = wy - 1; y <= wy + wh; y++) { put(wx - 1, y, 's'); put(wx + ww, y, 's'); }
  for (let y = wy; y < wy + wh; y++) for (let x = wx; x < wx + ww; x++) put(x, y, 'r');
  put(wx + 2, wy, 'b'); put(wx + 2, wy + 1, 'b'); put(wx + 2, wy + 2, 'b'); put(wx + 2, wy + 3, 'b');
  const { x: dx, y: dy, w: dw, h: dh } = HOUSE_DOOR_ART;
  for (let y = dy - 1; y < dy + dh; y++) { put(dx - 1, y, 's'); put(dx + dw, y, 's'); }
  for (let x = dx - 1; x <= dx + dw; x++) put(x, dy - 1, 's');
  put(dx + dw - 2, dy + 6, 's');                // poignée
  // Congère contre le mur, côté ouest (le vent vient de là)
  for (let y = H - 4; y < H; y++) for (let x = 5; x < 5 + (y - (H - 5)) * 4; x++) put(x, y, 's');
  return g.map(row => row.join(''));
}
export const HOUSE_ART = makeHouse();

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
const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Quelques arbres isolés, puis la forêt, puis de nouveau clairsemés avant la maison.
export function forestDensity(x, y) {
  // Lisière irrégulière : la distance au rivage est déformée par un bruit lent
  const dx = x - LANDING.shore + 2200 * fbm(x / 1500, y / 1500, 81, 3) + 300 * fbm(x / 300, y / 300, 83, 2);
  if (Math.hypot(x - HOUSE.x, y - HOUSE.y) < 150) return 0;
  const sparse = dx > 300 ? 0.03 : 0;
  const core = 0.62 * smoothstep(1150, 1450, dx) * (1 - smoothstep(2350, 2700, dx));
  const patchy = 0.55 + 1.6 * fbm(x / 260, y / 260, 71, 3);
  return Math.max(sparse, core * Math.max(0, patchy));
}

function nearTrail(x, y, dist) {
  const cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    for (const p of trailByChunk.get(`${cx + i},${cy + j}`) || []) {
      if (Math.abs(p.x - x) < dist && Math.abs(p.y - y) < dist) return true;
    }
  }
  return false;
}

const LANDING = landing();
const objectCache = new Map();

export function objectsInChunk(cx, cy) {
  const key = `${cx},${cy}`;
  if (objectCache.has(key)) return objectCache.get(key);
  const list = [];
  const x0 = cx * CHUNK, y0 = cy * CHUNK;
  const free = (x, y, trail) =>
    coast(x, y) < -0.03 && !nearTrail(x, y, trail) &&
    Math.hypot(x - LANDING.shore, y - LANDING.y) > 60;

  for (let gy = 0; gy < CHUNK; gy += CELL) {
    for (let gx = 0; gx < CHUNK; gx += CELL) {
      const r = rng(hash(x0 + gx, y0 + gy, 77) * 4294967296);
      const x = x0 + gx + Math.floor(r() * CELL), y = y0 + gy + Math.floor(r() * CELL);
      const d = forestDensity(x, y);
      if (r() < d && free(x, y, 8)) {
        list.push({ type: 'tree', x, y, seed: Math.floor(r() * 1e9), big: d > 0.2 });
        continue;
      }
      // Gros rochers : rares, un peu plus fréquents hors de la forêt
      if (r() < 0.012 && free(x, y, 16)) list.push({ type: 'boulder', x, y, seed: Math.floor(r() * 1e9) });
      else if (r() < 0.004 && free(x, y, 10)) list.push({ type: 'cairn', x, y, seed: Math.floor(r() * 1e9) });
    }
  }
  for (const o of list) {
    const r = rng(o.seed);
    o.art = o.type === 'tree' ? makeTree(r, { big: o.big }) : o.type === 'boulder' ? makeBoulder(r) : makeCairn(r);
    o.w = o.art.rows[0].length;
    o.h = o.art.rows.length;
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
      if (o.type === 'tree') { if (Math.abs(dx) <= 1.5 && dy <= 0.5 && dy >= -1.5) return true; }
      else if (Math.abs(dx) < o.w / 2 - 0.5 && dy <= 0.5 && dy >= -o.h * 0.55) return true;
    }
  }
  return false;
}
