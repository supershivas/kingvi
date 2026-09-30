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
  while (t >= DAY_CYCLE[i][1]) { t -= DAY_CYCLE[i][1]; i++; }
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
