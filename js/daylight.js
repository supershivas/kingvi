/* Le jour et la nuit : aube, jour, crépuscule, nuit, en 20 minutes.
   Comme le vent, le cycle suit l'horloge réelle : il continue d'une session à
   l'autre. `night` va de 0 (plein jour) à 1 (nuit noire) ; `dusk` monte à
   l'aube et au crépuscule (lueur rasante). */

export const DAY_CYCLE = [
  ['aube', 90],
  ['jour', 660],
  ['crepuscule', 90],
  ['nuit', 360],
];
export const DAY_LABELS = { aube: 'Aube', jour: 'Jour', crepuscule: 'Crépuscule', nuit: 'Nuit' };
export const DAY_LENGTH = DAY_CYCLE.reduce((n, [, d]) => n + d, 0);

const smooth = k => k * k * (3 - 2 * k);

export function daylightAt(seconds) {
  let t = ((seconds % DAY_LENGTH) + DAY_LENGTH) % DAY_LENGTH;
  let i = 0;
  while (i < DAY_CYCLE.length - 1 && t >= DAY_CYCLE[i][1]) { t -= DAY_CYCLE[i][1]; i++; }
  const [phase, duration] = DAY_CYCLE[i];
  const k = t / duration;
  const night = phase === 'aube' ? 1 - smooth(k) : phase === 'crepuscule' ? smooth(k) : phase === 'nuit' ? 1 : 0;
  const dusk = phase === 'aube' || phase === 'crepuscule' ? Math.sin(Math.PI * k) : 0;
  return { phase, night, dusk, index: i, t };
}

// La nuit, le viking sort une torche. Sa lumière, à l'échelle du monde : une
// tache elliptique en paliers tramés (pas de dégradé lisse). L'opacité dit
// combien de nuit elle efface. `k` : taille (le jeu alterne trois tailles).
export const TORCH_SIZES = [0.93, 1, 1.07];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export function torchLight(k = 1) {
  const rx = Math.round(78 * k), ry = Math.round(52 * k);
  const c = document.createElement('canvas');
  c.width = rx * 2; c.height = ry * 2;
  const ctx = c.getContext('2d'), img = ctx.createImageData(c.width, c.height);
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    const d = Math.hypot((x + 0.5 - rx) / rx, (y + 0.5 - ry) / ry);
    const e = Math.max(0, Math.min(1, (1 - d) / 0.75));
    const q = Math.min(3, Math.floor(e * e * (3 - 2 * e) * 3 + (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16)) / 3;
    const i = (y * c.width + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.round(q * 255);
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// Une ombre portée par la torche : du pied de l'obstacle (x, y), à l'opposé de
// la flamme (lx, ly), aplatie par la vue de biais. Comme le halo : des paliers
// tramés (trois niveaux, ordonnés par la même trame), dense au pied, qui
// s'effiloche au bout. `put(px, py, a)` : un pixel d'ombre, a = 1/3, 2/3 ou 1.
export function castShadow(put, x, y, lx, ly, half, len, R = 90) {
  const dx = x - lx, dy = (y - ly) / 0.6, d = Math.hypot(dx, dy);
  if (d < 0.5 || d > R) return;
  let vx = dx / d, vy = dy / d * 0.6;
  const n = Math.hypot(vx, vy); vx /= n; vy /= n;
  const fade = Math.min(1, 1.6 * (1 - d / R));
  const reach = len + half * 2;
  for (let py = Math.floor(y - reach); py <= y + reach; py++) {
    for (let px = Math.floor(x - reach); px <= x + reach; px++) {
      const ax = px + 0.5 - x, ay = py + 0.5 - y;
      const along = ax * vx + ay * vy, across = Math.abs(-ax * vy + ay * vx);
      const wide = half * (1 + 0.5 * along / len);
      if (along < 0 || along > len || across > wide) continue;
      const e = Math.min(1, 1.3 * fade * (1 - 0.75 * along / len) * (1 - 0.3 * across / wide));
      const q = Math.min(3, Math.floor(e * e * (3 - 2 * e) * 3 + (BAYER[(py & 3) * 4 + (px & 3)] + 0.5) / 16));
      if (q > 0) put(px, py, q / 3);
    }
  }
}

// L'ombre d'un rocher (cairn, statue) : elle part de sa base, le segment
// entre ses deux coins inférieurs (x0 → x1, sur la ligne des pieds y), et
// s'allonge à l'opposé de la flamme en s'évasant un peu. Un pixel est dans
// l'ombre s'il est la base poussée de s le long du rayon (0 < s ≤ len) ; plus
// s est grand, plus l'ombre s'effiloche. Mêmes paliers tramés que le halo.
export function castShadowBase(put, x0, x1, y, lx, ly, len, R = 90) {
  const cx = (x0 + x1) / 2;
  const dx = cx - lx, dy = (y - ly) / 0.6, d = Math.hypot(dx, dy);
  if (d < 0.5 || d > R) return;
  let vx = dx / d, vy = dy / d * 0.6;
  const n = Math.hypot(vx, vy); vx /= n; vy /= n;
  const fade = Math.min(1, 1.6 * (1 - d / R));
  const spread = 0.22, depth = 1.5;                    // l'évasement ; l'épaisseur de la base au sol
  // Pour chaque inégalité lo ≤ p − s·v ± spread·s ≤ hi, l'intervalle des s
  const range = (p, v, lo, hi, out) => {
    // lo − spread·s ≤ p − v·s ≤ hi + spread·s
    // ⇔ (v − spread)·s ≤ p − lo  et  (v + spread)·s ≥ p − hi
    let a = 0, b = Infinity;
    const k1 = v - spread, r1 = p - lo, k2 = v + spread, r2 = p - hi;
    if (Math.abs(k1) < 1e-6) { if (r1 < 0) return false; } else if (k1 > 0) b = Math.min(b, r1 / k1); else a = Math.max(a, r1 / k1);
    if (Math.abs(k2) < 1e-6) { if (r2 > 0) return false; } else if (k2 > 0) a = Math.max(a, r2 / k2); else b = Math.min(b, r2 / k2);
    out[0] = Math.max(out[0], a); out[1] = Math.min(out[1], b);
    return out[0] <= out[1];
  };
  const reach = len * 1.2 * (1 + spread) + 2;
  const s = [0, 0];
  for (let py = Math.floor(y - depth - reach); py <= y + reach; py++) {
    for (let px = Math.floor(x0 - reach); px <= x1 + reach; px++) {
      s[0] = 0; s[1] = len * 1.15;
      if (!range(px + 0.5, vx, x0, x1, s) || !range(py + 0.5, vy, y - depth, y, s)) continue;
      const along = s[0];
      // Sous le rocher même, pas d'ombre ; sauf sur sa rangée du pied (toute
      // noire, ça ne s'y voit pas) quand l'ombre part vers le bas : si le voile
      // de nuit glisse d'une fraction de pixel au rendu, pas de jour entre eux
      if (along < 0.25) { if (vy > 0.15 && py === Math.ceil(y) - 1 && px >= x0 && px < x1) put(px, py, 1); continue; }
      // Le bout de l'ombre est rongé : sa longueur varie le long de la base
      // (rien de droit), et elle s'effiloche vers la fin
      const u = (px + 0.5) * -vy + (py + 0.5) * vx;
      const reachHere = len * (0.7 + 0.45 * wobble(u / 2.5, x0 * 7 + y));
      if (along > reachHere) continue;
      const e = Math.min(1, 1.35 * fade * (1 - 0.8 * along / reachHere));
      const q = Math.min(3, Math.floor(e * e * (3 - 2 * e) * 3 + (BAYER[(py & 3) * 4 + (px & 3)] + 0.5) / 16));
      if (q > 0) put(px, py, q / 3);
    }
  }
}

// Un bruit lisse sur une ligne (0 → 1)
function wobble(x, seed) {
  const h = i => { let v = (i * 374761393 + seed * 668265263) | 0; v = Math.imul(v ^ (v >>> 13), 1274126177); return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };
  const i = Math.floor(x), f = x - i, k = f * f * (3 - 2 * f);
  return h(i) + (h(i + 1) - h(i)) * k;
}

// Les deux coins inférieurs d'un dessin (rangées de pixels) : le premier et
// le dernier pixel de sa rangée de pierre la plus basse, une rangée pleine
// d'au moins quelques pixels d'affilée (les éclats posés autour ne comptent
// pas). `dy` : de combien cette rangée est au-dessus du pied (mis en cache)
export function artBase(art) {
  if (art.base) return art.base;
  const rows = art.rows, minRun = Math.min(6, Math.ceil(rows[0].length / 2));
  const cells = y => (typeof rows[y] === 'string' ? [...rows[y]] : rows[y]).map(c => !!c && c !== '.');
  for (let y = rows.length - 1; y >= 0; y--) {
    const row = cells(y);
    let best = null;
    for (let x = 0; x < row.length;) {
      if (!row[x]) { x++; continue; }
      let e = x; while (e < row.length && row[e]) e++;
      if (!best || e - x > best.x1 - best.x0) best = { x0: x, x1: e };
      x = e;
    }
    if (best && best.x1 - best.x0 >= minRun) return (art.base = { ...best, dy: rows.length - 1 - y });
  }
  // (rien d'assez large : la rangée du bas, telle quelle)
  for (let y = rows.length - 1; y >= 0; y--) {
    const row = cells(y), first = row.indexOf(true);
    if (first >= 0) return (art.base = { x0: first, x1: row.lastIndexOf(true) + 1, dy: rows.length - 1 - y });
  }
  return (art.base = { x0: 0, x1: rows[0].length, dy: 0 });
}
