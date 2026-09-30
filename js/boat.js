/* La barque du début, d'après l'image de référence : vue de haut et de biais,
   poupe à gauche, proue à droite (vers l'est, la terre). b coque sombre,
   s bancs, bordés clairs et neige posée. Elle mesure environ 46 × 18 pixels. */

const BOAT_RAW = [
  '................ssssssss..s....................',
  '..........bbb..sssssssss...s...................',
  '...bb....bbbbbbbbbbbbbbs...ss.s................',
  '..bbbbbbbssssbbbbbbbbbbbbbbbbssssss............',
  'bbsssssssbbbbbbbbbbbbssbbbbbbbbbbbss...........',
  '.bbbsssbbbbbbbbbbbbbsssssbsssbbbbbbb...s.......',
  '.bbbbbbbsssbbbbbsssssbbbbbbbbbbsssbbsbbb.......',
  '..bbbbbbbbbssssssssbbbbbbbbbbbbbbbbbsssbbb.s...',
  '...bbbbbbbbbbbbbsssssbbbbbbbbbbbbssssssssb...b.',
  '...bbbbbbbbbbbbbbbbbbbbbsssssssssssssssssbbbbb.',
  '..bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb...',
  '..bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb....',
  '..bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb...',
  '.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.b...',
  '..bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb......',
  '..bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.......',
  '........bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.......',
  '............bbbbbbbbbbbbbbbbbbbbbbbbbbbbb......',];
// Une marge vide d'un pixel tout autour de la coque (les repères ci-dessous
// en tiennent compte). Pas de liseré : la coque est noire (k), plus sombre que
// la mer, et s'en détache sans contour.
export const BOAT = (() => {
  const H = BOAT_RAW.length + 2, W = BOAT_RAW[0].length + 2;
  const at = (x, y) => BOAT_RAW[y - 1]?.[x - 1] && BOAT_RAW[y - 1][x - 1] !== '.';
  const rows = [];
  for (let y = 0; y < H; y++) {
    let row = '';
    for (let x = 0; x < W; x++) {
      if (at(x, y)) row += BOAT_RAW[y - 1][x - 1] === 'b' ? 'k' : 's';
      else row += '.';
    }
    rows.push(row);
  }
  return rows;
})();
export const BOAT_W = BOAT[0].length;
export const BOAT_H = BOAT.length;
// Ligne de flottaison (en pixels du motif) et pointe de la proue
export const BOAT_WATERLINE = 13;
export const BOAT_BOW = { x: 46, y: 10 };

// Pixels du bord de la coque, sous la flottaison : l'écume vient y battre.
export const BOAT_EDGE = (() => {
  const out = [];
  const at = (x, y) => BOAT[y]?.[x] === 'k';
  for (let y = 7; y < BOAT_H; y++) {
    for (let x = 0; x < BOAT_W; x++) {
      if (!at(x, y)) continue;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1]]) {
        if (!at(x + dx, y + dy)) out.push({ x: x + dx, y: y + dy });
      }
    }
  }
  return out;
})();

// Roulis : le haut de la coque (au-dessus de la flottaison) glisse d'un pixel
// d'un bord à l'autre. Trois images : droite, penchée à gauche, penchée à droite.
function roll(dir) {
  return BOAT.map((row, y) => {
    if (y >= BOAT_WATERLINE - 3) return row;
    const shift = y < 6 ? dir : 0;
    if (!shift) return row;
    return shift > 0 ? '.' + row.slice(0, -1) : row.slice(1) + '.';
  });
}
export const BOAT_FRAMES = { still: BOAT, left: roll(-1), right: roll(1) };

// ── La barque du lac : petite, vue de biais, proue vers la droite. Vide, ou
// le viking assis dedans qui rame (trois temps : rames devant, au milieu,
// derrière). k coque, s bancs enneigés, b le viking et les rames.
const ROWBOAT_HULL = [
  '...kkkkkkkkkkk...',
  '.kksssksssksssskk',
  'kkssssksssksssskk',
  '.kkkkkkkkkkkkkkk.',
  '...kkkkkkkkkkk...',
];
function rowboat(t) {
  const W = ROWBOAT_HULL[0].length + 4, H = ROWBOAT_HULL.length + 6;
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; };
  const line = (x0, y0, x1, y1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) put(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 'b');
  };
  ROWBOAT_HULL.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') put(x + 2, y + 4, c); }));
  if (t != null) {
    // Les rames : pelle loin derrière, au milieu, puis ramenée (la barque file vers la droite)
    const reach = [3, 5, 7][t], dip = t === 1 ? 1 : 0;
    line(10, 3, reach, 1 - dip + 1);                     // rame du fond
    line(10, 5, reach, 10 - dip);                        // rame de devant, par-dessus le bord
    // Le viking assis : une masse, le casque, les épaules
    for (const [x, y] of [[10, 0], [11, 0], [9, 1], [10, 1], [11, 1], [12, 1], [9, 2], [10, 2], [11, 2], [12, 2], [9, 3], [10, 3], [11, 3], [12, 3], [10, 4], [11, 4]]) put(x, y, 'b');
  }
  return g.map(r => r.join(''));
}
export const ROWBOAT_FRAMES = { empty: rowboat(null), row0: rowboat(0), row1: rowboat(1), row2: rowboat(2) };
export const ROWBOAT_W = ROWBOAT_FRAMES.empty[0].length;
export const ROWBOAT_H = ROWBOAT_FRAMES.empty.length;
