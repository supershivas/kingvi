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
