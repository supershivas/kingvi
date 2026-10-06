/* Les personnages de la saga : des dessins tirés du héros (viking.js).
   Même gabarit (7 pixels de large, environ 9 de haut, une masse bleu nuit sans
   visage, l'ombre au sol sur la ligne des pieds). On change la silhouette :
   la tête (casque, capuche, couronne, bonnet étrusque, voile, masque…), le
   corps (homme, femme, enfant, vieillard…), ce qu'il tient, la taille.
   Placeholders, comme les autres : à redessiner dans l'atelier.
   Couleurs : b (bleu nuit), s (neige), r (rouge de l'accent), h (ombre). */

import { WOLF_ANIMS } from './wolf.js?v=1.46.0';

export const W = 15;          // largeur d'une image, à l'échelle 1
export const H = 26;
export const CX = 7;          // colonne du milieu du corps
export const GROUND = 22;     // ligne des pieds

// ── Les corps (sous la tête), face et profil (tourné vers la droite) ──
const BODIES = {
  homme: {
    front: ['.bbbbb.', 'bbbbbbb', 'bbbbbbb', 'bbbbbbb', '.bbbbb.', '.bbbbb.'],
    side: ['..bbbb.', '.bbbbb.', '.bbbbb.', '.bbbbb.', '.bbbbb.', '.bbbbb.'],
  },
  large: {
    front: ['bbbbbbb', 'bbbbbbb', 'bbbbbbb', 'bbbbbbb', 'bbbbbbb', '.bbbbb.', '.bbbbb.'],
    side: ['.bbbbb.', 'bbbbbb.', 'bbbbbb.', 'bbbbbb.', '.bbbbb.', '.bbbbb.', '.bbbbb.'],
  },
  femme: {
    front: ['..bbb..', '.bbbbb.', '.bbbbb.', '.bbbbb.', '.bbbbb.', 'bbbbbbb'],
    side: ['..bbb..', '.bbbbb.', '.bbbb..', '.bbbbb.', '.bbbbb.', 'bbbbbb.'],
    skirt: true,
  },
  ado: {
    front: ['.bbbbb.', 'bbbbbbb', 'bbbbbbb', '.bbbbb.', '.bbbbb.'],
    side: ['..bbbb.', '.bbbbb.', '.bbbbb.', '.bbbbb.', '.bbbbb.'],
  },
  enfant: {
    front: ['.bbbbb.', '.bbbbb.', '..bbb..'],
    side: ['..bbb..', '..bbbb.', '..bbb..'],
    small: true,
  },
  vieux: {
    front: ['.bbbbb.', 'bbbbbbb', 'bbbbbbb', '.bbbbb.', '.bbbbb.'],
    side: ['...bbb.', '..bbbbb', '.bbbbb.', '.bbbbb.', '.bbbbb.'],
    stoop: true,
  },
  vieille: {
    front: ['..bbb..', '.bbbbb.', '.bbbbb.', '.bbbbb.', 'bbbbbbb'],
    side: ['...bbb.', '..bbbbb', '.bbbbb.', '.bbbbb.', 'bbbbbb.'],
    skirt: true, stoop: true,
  },
  bebe: {
    front: ['..bbb..', '.bbbbb.', '.bbbbb.', '..bbb..'],
    side: ['..bbb..', '.bbbbb.', '.bbbbb.', '..bbb..'],
    still: true,
  },
};

// ── Les têtes : face, profil ──
const HEADS = {
  casque: { front: ['..bbb..'], side: ['...bb..'] },
  nue: { front: ['..b.b..', '..bbb..'], side: ['..b.b..', '...bb..'] },
  capuche: { front: ['...b...', '..bbb..'], side: ['.b.....', '..bbb..'] },
  'haute-capuche': { front: ['...b...', '...b...', '..bbb..', '.bbbbb.'], side: ['b......', '.b.....', '..bbb..', '.bbbbb.'] },
  couronne: { front: ['.b.b.b.', '.bbbbb.', '..bbb..'], side: ['..b.b.b', '..bbbbb', '...bb..'] },
  bonnet: { front: ['....b..', '...bb..', '..bbb..'], side: ['.b.....', '..bb...', '..bbb..'] },
  voile: { front: ['..bbb..', '.bbbbb.'], side: ['..bbb..', '.bbbb..'] },
  tresses: { front: ['..bbb..'], side: ['..bbb..'], braid: true },
  masque: { front: ['..bbb..', '.bsbsb.'], side: ['...bbb.', '...bbs.'] },
  cornes: { front: ['b.....b', '.b.b.b.', '..bbb..'], side: ['b...b..', '.b.bb..', '..bbb..'] },
};

function blank() { return Array.from({ length: H }, () => Array(W).fill(null)); }
function stamp(g, rows, x0, y0, { under = false } = {}) {
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    const gx = x0 + x, gy = y0 + y;
    if (c === '.' || gx < 0 || gy < 0 || gx >= W || gy >= H) return;
    if (under && g[gy][gx] && g[gy][gx] !== 'h') return;
    g[gy][gx] = c;
  }));
}
function dot(g, x, y, c = 'b', under = false) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  if (under && g[y][x] && g[y][x] !== 'h') return;
  g[y][x] = c;
}
function vline(g, x, y0, y1, c = 'b', under = false) { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) dot(g, x, y, c, under); }
function shadow(g, from, to) {
  for (let x = from; x <= to; x++) if (!g[GROUND][x]) g[GROUND][x] = 'h';
  for (let x = from + 1; x < to; x++) if (!g[GROUND + 1][x]) g[GROUND + 1][x] = 'h';
}

// Jambes et ourlet, selon le temps de la marche (comme le héros)
const LEGS = {
  front: { stand: ['..b.b..'] },
  side: [['.b...b.'], ['...bb..', '...b...'], ['.b...b.'], ['...bb..', '...b...']],
  skirtFront: ['.bbbbb.'],
  skirtSide: [['bbbbbb.'], ['.bbbbb.'], ['.bbbbbb'], ['.bbbbb.']],
};

// Ce qu'il tient. (hx, hy) : la main, à droite du corps ; top : le haut de la tête.
function holdItem(g, item, hx, hy, top, side) {
  switch (item) {
    case 'baton': vline(g, hx, GROUND, top - 1); dot(g, hx - 1, top - 1); break;
    case 'lance': vline(g, hx, GROUND - 1, top - 3); dot(g, hx, top - 4, 's'); dot(g, hx, top - 5); break;
    case 'hache': vline(g, hx, hy, top + 1); stamp(g, ['bb', 'bb', '.b'], hx, top); break;
    case 'marteau': vline(g, hx, hy + 1, top); stamp(g, ['bbb', 'bbb'], hx - 1, top - 2); break;
    case 'torche': vline(g, hx, hy, hy - 3); dot(g, hx, hy - 4, 'r'); dot(g, hx + (side ? 1 : 0), hy - 5, 'r'); break;
    case 'rame': vline(g, hx, GROUND, top - 2); stamp(g, ['b', 'bb', 'bb'], hx, GROUND - 2); break;
    case 'fuseau': vline(g, hx, hy - 1, hy + 2); dot(g, hx + 1, hy, 'b'); break;
    case 'foie': stamp(g, ['bb.', 'bbb', '.b.'], hx, hy - 1); break;
    case 'chope': stamp(g, ['bb', 'bb'], hx, hy - 1); dot(g, hx + 1, hy - 2, 's'); break;
    default: break;
  }
}

// Une image : corps, tête, jambes, objet, ailes, accent
function compose(spec, view, step = 0) {
  const g = blank();
  const kind = spec.large ? 'large' : spec.corps;
  const body = BODIES[kind] || BODIES.homme;
  const head = HEADS[spec.tete] || (body.still ? { front: [], side: [] } : HEADS.casque);
  const side = view === 'side';
  const x0 = CX - 3;
  const legs = body.still ? []
    : body.skirt ? (side ? LEGS.skirtSide[step] : LEGS.skirtFront)
      : side ? LEGS.side[step] : LEGS.front.stand;
  const bob = side && !body.skirt && !body.still && step % 2 ? -1 : 0;
  const rows = side ? body.side : body.front;
  const hrows = side ? head.side : head.front;
  const bodyTop = GROUND - rows.length + bob + (legs.length ? 0 : 1);
  const top = bodyTop - hrows.length;
  // Les jambes en dernier : les pieds restent visibles
  stamp(g, hrows, x0, top);
  stamp(g, rows, x0, bodyTop);
  stamp(g, legs, x0, GROUND - legs.length + 1);
  if (head.braid) {
    if (side) vline(g, x0 + 1, bodyTop - 1, bodyTop + 2);
    else { dot(g, x0, bodyTop + 1); dot(g, x0 + 6, bodyTop + 1); dot(g, x0, bodyTop + 2); dot(g, x0 + 6, bodyTop + 2); }
  }
  if (body.stoop && side) dot(g, x0 + 6, bodyTop, 'b');
  if (spec.ailes) {
    const L = ['bb..', '.bbb', 'bbbb', '.bbb', '..bb', '...b'];
    stamp(g, L, x0 - 4, bodyTop - 2, { under: true });
    if (!side) stamp(g, L.map(r => [...r].reverse().join('')), x0 + 7, bodyTop - 2, { under: true });
  }
  if (spec.accent === 'echarpe') {
    for (let x = x0 + 2; x <= x0 + 4; x++) dot(g, x, bodyTop, 'r');
    dot(g, side ? x0 + 1 : x0 + 2, bodyTop + 1, 'r');
  }
  if (spec.objet) holdItem(g, spec.objet, CX + 4, bodyTop + 2, top, side);
  if (spec.blanc) whiten(g);
  shadow(g, CX - 4, CX + 4);
  return g;
}

// Blanche sur la neige : seul le contour reste bleu nuit
function whiten(g) {
  const filled = (x, y) => y >= 0 && y < H && x >= 0 && x < W && g[y][x] && g[y][x] !== 'h';
  const inner = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y][x] === 'b' && filled(x - 1, y) && filled(x + 1, y) && filled(x, y - 1) && filled(x, y + 1)) inner.push([x, y]);
  }
  for (const [x, y] of inner) g[y][x] = 's';
}

// Agrandir d'un facteur entier, l'ombre au sol reste d'un pixel de haut
function scale(g, n) {
  if (n === 1) return g;
  const out = [];
  g.forEach((row, y) => {
    const r = row.flatMap(c => Array(n).fill(c));
    const times = y > GROUND ? 1 : n;
    for (let i = 0; i < times; i++) out.push(r);
  });
  return out;
}

const toRows = g => g.map(r => r.map(c => c || '.').join(''));

// Rogner le vide en haut (les grands n'ont pas tous une lance)
function trim(rows) {
  let t = 0;
  while (t < rows.length - 1 && !/[^.]/.test(rows[t])) t++;
  return { rows: rows.slice(t), cut: t };
}

// ── Les bêtes et le serpent, à part ──
function wolfGrid(frame, white) {
  const g = frame.map(r => [...r]);
  const h = g.length, w = g[0].length;
  const filled = (x, y) => y >= 0 && y < h && x >= 0 && x < w && g[y][x];
  const out = g.map((row, y) => row.map((c, x) => {
    if (!c) return null;
    if (white && filled(x - 1, y) && filled(x + 1, y) && filled(x, y - 1) && filled(x, y + 1)) return 's';
    return 'b';
  }));
  return out.map(r => r.map(c => c || '.').join(''));
}
const SERPENT = [
  '.................bbb.',
  '..bb......bbb....b.bb',
  '.b..b....b...b..b....',
  'b....b..b.....bb.....',
  '......bb.............',
];

// Le dessin d'un personnage : face, et quatre temps de marche de profil.
// ground : la ligne des pieds dans les images rendues ; cx : la colonne du milieu.
export function personSprite(spec = {}) {
  if (spec.corps === 'loup') {
    const walk = WOLF_ANIMS.trot.frames.map(f => wolfGrid(f, true));
    return { front: walk[0], walk: [walk[0], walk[1], walk[0], walk[1]], ground: 7, cx: 8, w: walk[0][0].length, h: walk[0].length };
  }
  if (spec.corps === 'serpent') {
    return { front: SERPENT, walk: null, ground: SERPENT.length - 1, cx: 10, w: SERPENT[0].length, h: SERPENT.length };
  }
  const n = spec.echelle || ({ geant: 2, colosse: 3 }[spec.corps] || 1);
  const base = { ...spec, corps: spec.corps === 'geant' || spec.corps === 'colosse' ? 'homme' : spec.corps };
  if ((spec.corps === 'geant' || spec.corps === 'colosse') && spec.tete === 'voile') base.corps = 'femme';
  const front = scale(compose(base, 'front'), n);
  const still = BODIES[base.corps]?.still;
  const walk = still ? null : [0, 1, 2, 3].map(i => scale(compose(base, 'side', i), n));
  // Même coupe en haut pour toutes les images, pour qu'elles restent alignées
  const all = [front, ...(walk || [])].map(toRows);
  const cut = Math.min(...all.map(r => trim(r).cut));
  const rows = all.map(r => r.slice(cut));
  return {
    front: rows[0], walk: walk ? rows.slice(1) : null,
    ground: GROUND * n + (n - 1) - cut, cx: CX * n + Math.floor(n / 2),
    w: rows[0][0].length, h: rows[0].length,
  };
}
