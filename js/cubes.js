/* Le cube blanc et le cube noir. Dans l'archipel, rien n'est droit : ni la
   côte, ni les pierres, ni les maisons. Sauf eux. Deux cubes parfaits, d'une
   matière qu'on ne connaît pas, posés sur chaque île, toujours loin l'un de
   l'autre. Personne ne sait qui les a faits ; les Orsènes les comptaient déjà
   parmi les choses d'avant. La neige ne tient pas dessus. Le blanc est tiède
   et referme les blessures ; le noir ne renvoie aucun reflet, et qui le touche
   voit l'île d'en haut, un instant (game.js : `touchCube`).
   C'est la seule exception voulue à « rien de géométrique » : ils sont là pour
   qu'on sente qu'ils ne sont pas d'ici.
   Vus de trois quarts : le dessus en losange, deux faces, des arêtes d'un
   pixel. Couleurs : s neige, b bleu nuit, k le noir (le même bleu nuit), h l'ombre. */

const W = 15, C = 7, SIDE = 8;      // largeur, colonne du milieu, hauteur des faces
const H = Math.round(C) + SIDE + 1;  // jusqu'à la pointe basse

// Pour chaque colonne : le haut du losange (yu), son bas (yl), le pied (yb)
function column(x) {
  const d = Math.abs(x - C);
  const yu = Math.round(d * 0.5), yl = Math.round(C - d * 0.5);
  return { yu, yl, yb: yl + SIDE };
}
// Une case : 'top', 'left', 'right', 'edge' (les arêtes), ou rien
function part(x, y) {
  const { yu, yl, yb } = column(x);
  if (y < yu || y > yb) return null;
  if (y === yu || y === yb || x === 0 || x === W - 1) return 'edge';
  if (y < yl) return 'top';
  if (y === yl || x === C) return 'edge';
  return x < C ? 'left' : 'right';
}

function cube(paint) {
  const rows = [];
  for (let y = 0; y <= H; y++) {
    let row = '';
    for (let x = 0; x < W; x++) {
      const p = part(x, y);
      row += p ? paint(p, x, y) : '.';
    }
    rows.push(row);
  }
  // l'ombre au pied, posée sur la neige, un pixel sous les arêtes basses
  const shadow = [...rows[0]].map((_, x) => column(x).yb + 1);
  return rows.map((row, y) => [...row].map((c, x) => c === '.' && y === shadow[x] ? 'h' : c).join(''));
}

// Le blanc : le dessus et la face gauche pleins de neige, la droite tramée,
// des arêtes nettes
export const CUBE_WHITE = cube((p, x, y) => p === 'edge' ? 'b' : p === 'right' ? ((x + y) % 2 ? 'b' : 's') : 's');
// Le noir : bleu nuit plein ; le dessus tramé d'un quart de clair (la seule
// lumière qu'il prend), son rebord haut éclairé, les faces mates
export const CUBE_BLACK = cube((p, x, y) => {
  const { yu, yl } = column(x);
  if (p === 'top') return (x * 3 + y * 5) % 13 === 0 ? 's' : 'k';
  // les arêtes du dessus, claires (le négatif du blanc) ; l'arête du milieu, tramée
  if (p === 'edge' && (y === yu || y === yl) && x !== 0 && x !== W - 1) return 's';
  if (p === 'edge' && x === C && y > yl) return y % 2 ? 's' : 'k';
  return 'k';
});

export const CUBE_W = W, CUBE_H = H + 1;
// La profondeur du pied qui bloque le passage
export const CUBE_FOOT = 6;
