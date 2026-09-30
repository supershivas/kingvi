/* L'île : relief de la côte, traces à suivre, rares rochers et pierres levées.
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

function fbm(x, y, s, octaves = 4) {
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

// ── Point d'accostage : sur la côte sud ──
export function landing() {
  const x = CENTER + 180;
  let y = CENTER;
  while (coast(x, y) < 0) y += 2;
  return { x, shore: y };
}

// ── Les traces : une piste de pas qui s'enfonce dans l'île ──
const STRIDE = 7;
const TRAIL_STEPS = 1100;

function buildTrail() {
  const { x: lx, shore } = landing();
  const r = rng(SEED * 101);
  // Elles partent juste devant le drakkar, là où le viking pose le pied
  let x = lx - 4, y = shore - 44;
  let heading = -Math.PI / 2; // vers le nord
  const target = { x: CENTER - 900, y: CENTER - 1500 };
  const prints = [];
  for (let i = 0; i < TRAIL_STEPS; i++) {
    // Arrivées au but, les traces s'arrêtent net
    if (Math.hypot(target.x - x, target.y - y) < 40) break;
    const toTarget = Math.atan2(target.y - y, target.x - x);
    let diff = Math.atan2(Math.sin(toTarget - heading), Math.cos(toTarget - heading));
    // Errance lente, attirée de loin par le but
    heading += 0.09 * fbm(i / 40, 0, 42, 3) + 0.01 * diff + (r() - 0.5) * 0.03;
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
const CAIRN = ['.b.', 'bb.', '.bb', 'bbb'];
// Drakkar échoué, proue vers le large (sud)
export const DRAKKAR = [
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
  if (r() < 0.04) { const at = place(3, 4); if (at) stamp(ctx, CAIRN, at.x, at.y, pal); }

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
