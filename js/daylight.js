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
