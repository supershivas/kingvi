/* L'arche et les ruines de la plaine, d'après les dessins de assets/ (leurs
   pixels sont dans ruins-art.js, générés par scripts/import-art.py : on n'y
   touche pas ici). Ce module ne fait que les poser dans le monde :

   - le monument est la plus grande masse d'un seul tenant du dessin ; tout le
     reste (pierres et éclats tombés autour) devient des gravats, triés chacun
     à son pied, qu'on traverse ;
   - une arche est coupée en trois tranches : pilier gauche, passage, pilier
     droit. Chacune est triée par la ligne de son propre pied (vue de biais,
     un pilier est plus près que l'autre) ; les piliers bloquent, on passe
     par le milieu ;
   - la colonne couchée et le socle : un seul obstacle chacun. */
import { RUIN_ART } from './ruins-art.js?v=1.27.1';

// Le passage de chaque arche : les colonnes du dessin où l'on passe dessous
// (la partie claire de l'ouverture et l'intérieur sombre du passage)
const PASSAGES = { arche: [52, 75], ruine: [40, 52] };
// Profondeur au sol de ce qui bloque, en pixels du jeu
const FOOT = { arche: 12, ruine: 10, colonne: 12, socle: 16 };

// La plus grande masse d'un seul tenant : une grille de booléens
function mainMass(rows) {
  const H = rows.length, W = rows[0].length, id = new Int32Array(W * H).fill(-1);
  let best = -1, bestN = 0, n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (rows[y][x] === '.' || id[y * W + x] >= 0) continue;
    const stack = [y * W + x];
    id[y * W + x] = n;
    let count = 0;
    while (stack.length) {
      const i = stack.pop(), px = i % W, py = (i - px) / W;
      count++;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const u = px + dx, v = py + dy;
        if (u < 0 || v < 0 || u >= W || v >= H || rows[v][u] === '.' || id[v * W + u] >= 0) continue;
        id[v * W + u] = n;
        stack.push(v * W + u);
      }
    }
    if (count > bestN) { bestN = count; best = n; }
    n++;
  }
  return { inMain: (x, y) => id[y * W + x] === best, id, W, H };
}

// Les pixels d'une région (x0 → x1, et un test), rognés en bas à leur pied
function cut(rows, x0, x1, keep) {
  let foot = -1;
  const out = rows.map((row, y) => {
    let s = '';
    for (let x = x0; x < x1; x++) {
      const on = row[x] !== '.' && keep(x, y);
      if (on) foot = Math.max(foot, y);
      s += on ? row[x] : '.';
    }
    return s;
  });
  return foot < 0 ? null : { rows: out.slice(0, foot + 1), foot };
}

// Les pièces d'un monument posé au pied (x, y) : le milieu du bas de sa masse
export function monumentParts(key, x, y) {
  const rows = RUIN_ART[key], { inMain, id, W, H } = mainMass(rows);
  // Le pied et le milieu de la masse
  let bottom = 0, left = W, right = 0;
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) if (inMain(px, py)) { bottom = Math.max(bottom, py); left = Math.min(left, px); right = Math.max(right, px); }
  const ox = x - Math.round((left + right) / 2), oy = y - bottom;
  const parts = [];
  const add = (type, x0, x1, keep, foot, extra = {}) => {
    const c = cut(rows, x0, x1, keep);
    if (c) parts.push({ type, x: ox + x0, y: oy + c.foot, foot, art: { rows: c.rows, ax: 0 }, ...extra });
  };
  const pass = PASSAGES[key];
  if (pass) {
    add('arch', 0, pass[0], inMain, FOOT[key]);
    add('arch-vault', pass[0], pass[1], inMain, 0, { noShadow: true });
    add('arch', pass[1], W, inMain, FOOT[key]);
  } else add('ruin', 0, W, inMain, FOOT[key]);
  // Les gravats : chaque morceau détaché, à son pied, on marche dessus
  const seen = new Set();
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const k = id[py * W + px];
    if (k < 0 || inMain(px, py) || seen.has(k)) continue;
    seen.add(k);
    let x0 = W, x1 = 0;
    for (let i = 0; i < W * H; i++) if (id[i] === k) { x0 = Math.min(x0, i % W); x1 = Math.max(x1, i % W); }
    add('rubble', x0, x1 + 1, (u, v) => id[v * W + u] === k, 0);
  }
  return parts;
}

// La largeur et la hauteur d'un dessin (pour les emprises)
export const monumentSize = key => ({ w: RUIN_ART[key][0].length, h: RUIN_ART[key].length });
