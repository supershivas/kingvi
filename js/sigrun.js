/* Sigrún dans la glace, sur le plateau : un bloc de glace claire, taillé par
   le vent (rien de droit), une femme debout dedans, le bras levé, la torche
   éteinte au poing. Quand Kári allume sa torche à la sienne, la glace se
   fend, fond, et il ne reste qu'une flaque (game.js : `freeSigrun`).
   Couleurs : s glace claire, b la femme et les veines de la glace. */

const W = 15, H = 24;
function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// La femme : de face, le bras droit levé, la torche au poing (en haut à droite)
const WOMAN = [
  '.....b.',
  '.....b.',
  '.....b.',
  '..b..b.',
  '.bbb.b.',
  '.bbbbb.',
  'bbbbb..',
  'bbbbb..',
  'bbbbb..',
  '.bbb...',
  '.bbb...',
  'bbbbb..',
  'bbbbb..',
  'bbbbb..',
  '.b.b...',
  '.b.b...',
];
// Le bloc : chaque rangée a ses bords, rongés par le vent (`melt` : 0 entier → 1 fondu)
function block(melt, crack) {
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const top = Math.round(melt * 14);
  for (let y = top; y < H; y++) {
    const t = (y - top) / Math.max(1, H - top);
    const half = 4.5 + 2.6 * Math.sin(t * 2.4 + 0.3) + (hash(0, y, 3) - 0.5) * 1.6 - melt * 2;
    const cx = 7 + Math.sin(y * 0.5) * 0.6;
    for (let x = 0; x < W; x++) {
      const d = Math.abs(x - cx);
      if (d > half) continue;
      // Les bords et les veines de la glace : tramés
      const edge = d > half - 1;
      // (le bord plein, pour que la glace se lise sur la neige ; dedans, des veines obliques)
      const vein = (x + y * 2 + Math.round(hash(0, y >> 2, 5) * 4)) % 7 === 0 && hash(x, y, 9) < 0.6;
      g[y][x] = edge ? 'b' : vein ? 'b' : 's';
    }
  }
  // La femme, prise dedans (elle disparaît quand la glace a fondu)
  if (melt < 0.55) WOMAN.forEach((row, j) => [...row].forEach((c, i) => {
    const x = 4 + i, y = 6 + j;
    if (c === 'b' && g[y]?.[x] && g[y][x] !== '.') g[y][x] = 'b';
  }));
  // Les fentes : des éclairs de veines qui traversent le bloc
  if (crack) {
    let x = 9;
    for (let y = Math.max(top, 2); y < H - 2; y++) {
      x += hash(1, y, 17) < 0.5 ? -1 : 1;
      if (g[y]?.[x] && g[y][x] !== '.') g[y][x] = 'b';
    }
  }
  // La flaque au pied
  if (melt > 0.3) for (let x = 1; x < W - 1; x++) if (hash(x, 1, 21) < 0.4 + melt * 0.4) g[H - 1][x] = 'b';
  return g.map(r => r.join(''));
}
export const ICE_FRAMES = {
  whole: block(0, false),
  crack: block(0, true),
  melt1: block(0.35, true),
  melt2: block(0.7, false),
  gone: block(1, false),
};
export const ICE_W = W, ICE_H = H;
