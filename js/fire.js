/* L'incendie : la maison brûle. Quand l'autre est mort, on peut y revenir et
   mettre le feu au corps du compagnon (clic près de lui, dans la pièce) : un
   bûcher. Le feu prend dans la pièce, il faut sortir ; dehors, les flammes
   gagnent le toit, la fumée part avec le vent, la nuit s'ouvre autour ; le
   toit s'effondre, il reste une ruine qui fume, et dans les cendres, la
   boucle de ceinture du mort. Le jeu dit quand (game.js, `updateFire`) ; ce
   module dit quoi : les durées, les dessins (placeholders à redessiner dans
   l'atelier du labo : `feu-0` → `feu-3`, `house-burning`, `house-ruin`) et où
   poser les flammes. */
import { HOUSE_ART } from './world.js?v=1.48.0';
import { floorPoint } from './interior.js?v=1.48.0';

// Les temps du feu, en secondes de jeu depuis qu'il a pris
export const FIRE = {
  roof: 8,          // les flammes sortent du toit
  spread: 30,       // le toit est tout en feu (la maison se troue)
  collapse: 70,     // le toit s'effondre : la ruine
  out: 190,         // plus de flammes, des braises seulement
  smoke: 14,        // dans la pièce, la fumée : au-delà, elle blesse (toutes les 3 s)
};

// Une flamme : 7 × 10, quatre temps (r rouge, s cœur clair, b bois qui brûle)
export const FIRE_FRAMES = [
  [
    '...r...',
    '..rr...',
    '..rr.r.',
    '.rrr.r.',
    '.rrsrr.',
    'rrssrr.',
    'rrsssrr',
    '.rsssr.',
    '.rrsrr.',
    '..bbb..',
  ],
  [
    '....r..',
    '...rr..',
    '.r.rr..',
    '.r.rrr.',
    '.rrsrr.',
    '.rrssrr',
    'rrsssrr',
    '.rsssr.',
    '.rrsrr.',
    '..bbb..',
  ],
  [
    '..r....',
    '..rr...',
    '..rrr..',
    '.rrrr.r',
    '.rrsrrr',
    'rrssrr.',
    'rrssrrr',
    '.rsssr.',
    '.rrsrr.',
    '..bbb..',
  ],
  [
    '.......',
    '...r...',
    '..rrr..',
    '..rsr..',
    '.rrsrr.',
    'rrssrr.',
    '.rsssrr',
    '.rsssr.',
    '.rrsrr.',
    '..bbb..',
  ],
];
export const FIRE_W = 7, FIRE_H = 10;

// ── Hasard fixe, bruit ──
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

const H = HOUSE_ART.length, W = HOUSE_ART[0].length;
// Le haut de chaque colonne du dessin (le faîte, ou rien)
const topOf = x => { for (let y = 0; y < H; y++) if (HOUSE_ART[y][x] !== '.') return y; return H; };
const bottomOf = x => { for (let y = H - 1; y >= 0; y--) if (HOUSE_ART[y][x] !== '.') return y; return -1; };

// La maison en feu : le toit troué, le feu qu'on voit par les trous
export const HOUSE_BURNING = HOUSE_ART.map((row, y) => [...row].map((c, x) => {
  if (c === '.') return c;
  const depth = (y - topOf(x)) / Math.max(1, bottomOf(x) - topOf(x));
  if (depth > 0.62) return c;                                     // les murs tiennent encore
  const n = noise(x / 7, y / 5, 31) + 0.25 * noise(x / 2, y / 2, 33);
  if (n > 0.86) return 'r';
  if (n > 0.8) return 'k';
  if (n > 0.74 && (x + y) % 2) return 'k';
  return c;
}).join(''));

// La ruine : des pans de mur bas, rongés, noircis, deux poutres qui pendent,
// des braises ; la même emprise que la maison
export const HOUSE_RUIN = (() => {
  const g = HOUSE_ART.map(r => [...r].map(() => '.'));
  for (let x = 0; x < W; x++) {
    const b = bottomOf(x), t = topOf(x);
    if (b < 0) continue;
    const keep = Math.round(3 + 9 * noise(x / 9, 0, 41) + 3 * noise(x / 2.5, 0, 43));
    for (let y = Math.max(t, b - keep); y <= b; y++) {
      const c = HOUSE_ART[y][x];
      if (c === '.') continue;
      const ash = hash(x, y, 45);
      g[y][x] = ash < 0.04 ? 'r' : ash < 0.3 && y < b ? 's' : 'b';
    }
  }
  // Deux poutres tombées en travers, de biais (pas droites : elles ont ployé)
  for (const [x0, x1, y0, y1] of [[18, 52, H - 12, H - 22], [60, 84, H - 18, H - 10]]) {
    for (let x = x0; x <= x1; x++) {
      const k = (x - x0) / (x1 - x0), y = Math.round(y0 + (y1 - y0) * k + Math.sin(k * 3.1) * 1.5);
      if (y >= 0 && y < H && x < W) { g[y][x] = 'b'; if (hash(x, y, 47) < 0.2 && y + 1 < H) g[y + 1][x] = 'b'; }
    }
  }
  return g.map(r => r.join(''));
})();

// Où poser les flammes sur le toit (coordonnées du dessin, pied de la flamme),
// dans l'ordre où le feu gagne : de la porte (à gauche) vers le fond
export const ROOF_FLAMES = (() => {
  const out = [];
  for (let x = 6; x < W - 6; x += 5) {
    const t = topOf(x), b = bottomOf(x);
    if (b < 0 || b - t < 8) continue;
    const y = Math.round(t + 2 + (b - t) * 0.35 * noise(x / 4, 1, 51));
    out.push({ x: x + Math.round((noise(x, 2, 53) - 0.5) * 3), y, order: x + 30 * noise(x / 10, 3, 55) });
  }
  return out.sort((a, b) => a.order - b.order);
})();
// Les flammes qui restent dans la ruine (moins nombreuses, plus basses)
export const RUIN_FLAMES = ROOF_FLAMES.filter((_, i) => i % 3 === 1).map(f => ({ x: f.x, y: Math.min(H - 2, bottomOf(f.x) - 2) }));

// Dans la pièce : le bûcher autour du corps, puis le plancher (u, v du sol)
export const ROOM_FLAMES = [[0.5, 0.36], [0.44, 0.3], [0.56, 0.42], [0.62, 0.3], [0.38, 0.44], [0.7, 0.5], [0.3, 0.26], [0.55, 0.62], [0.82, 0.36], [0.2, 0.5]]
  .map(([u, v]) => { const [x, y] = floorPoint(u, v); return { x: Math.round(x), y: Math.round(y) }; });
// Le corps, dans la pièce : c'est là qu'on met le feu (clic tout près)
export const PYRE = (() => { const [x, y] = floorPoint(0.5, 0.34); return { x: Math.round(x), y: Math.round(y) }; })();
export const nearPyre = (x, y) => Math.hypot(x - PYRE.x, (y - PYRE.y) * 1.4) < 18;
