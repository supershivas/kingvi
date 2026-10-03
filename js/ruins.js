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
import { RUIN_ART } from './ruins-art.js?v=1.44.2';
import { designRows } from './design-store.js?v=1.44.2';

// Le passage de chaque arche : les colonnes du dessin où l'on passe dessous
// (la partie claire de l'ouverture et l'intérieur sombre du passage)
const PASSAGES = { arche: [52, 75], ruine: [40, 52] };
// Profondeur au sol de ce qui bloque, en pixels du jeu
const FOOT = { arche: 12, ruine: 10, colonne: 12, socle: 16 };
// Ce sur quoi l'on monte (le dessus du socle, le tablier du ponton) : son
// contour sur le dessin (pixels de l'écran, `poly`) et sa hauteur (`lift`).
// Au sol, l'emprise est ce contour descendu de `lift` ; dessus, le viking est
// dessiné `lift` pixels plus haut. `columns` : les colonnes debout dessus
// (x de début et de fin ; le bas à la ligne `top`), découpées et triées à
// part, elles bloquent
const DECKS = {
  socle: {
    lift: 20, top: 49, columns: [[22, 39], [54, 79]],
    poly: [[4, 56], [14, 49], [22, 46], [39, 46], [40, 51], [53, 51], [54, 46], [79, 46], [80, 51], [88, 56], [86, 60], [70, 61], [56, 63], [40, 64], [20, 61], [5, 61]],
  },
  pont: {
    lift: 9, columns: [],
    poly: [[3, 52], [104, 8], [118, 6], [130, 14], [126, 24], [10, 66], [3, 62]],
  },
};

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
  // (un monument redessiné à la main remplace celui du dessin importé : designs.js)
  const art = designRows(`decor-${key}`, RUIN_ART[key]);
  const rows = TEXTURED[key] ? texture(art, hashKey(key)) : art;
  const { inMain, id, W, H } = mainMass(rows);
  // Le pied et le milieu de la masse
  let bottom = 0, left = W, right = 0;
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) if (inMain(px, py)) { bottom = Math.max(bottom, py); left = Math.min(left, px); right = Math.max(right, px); }
  const ox = x - Math.round((left + right) / 2), oy = y - bottom;
  const parts = [];
  const add = (type, x0, x1, keep, foot, extra = {}) => {
    const c = cut(rows, x0, x1, keep);
    if (c) parts.push({ type, x: ox + x0, y: oy + c.foot, foot, art: { rows: c.rows, ax: 0 }, ...extra });
  };
  const pass = PASSAGES[key], deck = DECKS[key];
  if (deck) {
    // Les colonnes, chacune triée au sol par son pied (le pied posé sur le
    // dessus : `lift` plus bas au sol), et tout le reste : le dessus, où l'on monte
    const inCol = (px, py) => py <= deck.top && deck.columns.some(([a, b]) => px >= a && px <= b);
    for (const [a, b] of deck.columns) {
      const c = cut(rows, a, b + 1, (px, py) => inMain(px, py) && py <= deck.top);
      if (!c) continue;
      const pad = Array(deck.lift).fill('.'.repeat(c.rows[0].length));
      parts.push({ type: 'ruin', x: ox + a, y: oy + c.foot + deck.lift, foot: 3, art: { rows: [...c.rows, ...pad], ax: 0 } });
    }
    const c = cut(rows, 0, W, (px, py) => inMain(px, py) && !inCol(px, py));
    const top = Math.min(...deck.poly.map(p => p[1]));
    parts.push({
      type: 'ruin', x: ox, y: oy + c.foot, foot: 0, art: { rows: c.rows, ax: 0 },
      // (trié au bord arrière du dessus, au sol : on y passe devant les colonnes)
      depthY: oy + top + deck.lift - 1,
      deck: { lift: deck.lift, poly: deck.poly.map(([px, py]) => [ox + px, oy + py]) },
    });
  } else if (pass) {
    add('arch', 0, pass[0], inMain, FOOT[key]);
    add('arch-vault', pass[0], pass[1], inMain, 0, { noShadow: true });
    add('arch', pass[1], W, inMain, FOOT[key]);
  } else add('ruin', 0, W, inMain, FOOT[key]);
  // Pas de gravats (les morceaux détachés du dessin sont laissés de côté) :
  // autour, des rochers cernés, posés au hasard (toujours le même)
  const r = rng(hashKey(key)), cx = ox + (left + right) / 2, half = (right - left) / 2;
  const n = key === 'pont' ? 0 : 4 + Math.floor(r() * 3);                 // (le ponton est dans l'eau)
  for (let k = 0, tries = 0; k < n && tries < 40; tries++) {
    const a = r() * Math.PI * 2, d = half + 5 + r() * 12;
    const px = Math.round(cx + Math.cos(a) * d), py = Math.round(y + 3 + Math.sin(a) * 11);
    // Ni sur le monument, ni devant le passage d'une arche
    if (px > ox + left - 3 && px < ox + right + 3 && py < y + 3) continue;
    if (pass && px > ox + pass[0] - 5 && px < ox + pass[1] + 5 && py > y - 14) continue;
    if (parts.some(o => o.type === 'stone' && Math.abs(o.x - px) < 12 && Math.abs(o.y - py) < 6)) continue;
    const art = makeOutlinedRock(r);
    const w = art.rows[0].length, h = art.rows.length;
    parts.push({ type: 'stone', x: px - (w >> 1), y: py, foot: Math.max(1, Math.round(h * 0.5)), art: { rows: art.rows, ax: 0 } });
    k++;
  }
  // Toutes les pièces dans le morceau de terrain du pied : le monument se
  // charge d'un bloc (sinon on le voyait un moment coupé en deux)
  for (const o of parts) o.home = { x, y };
  return parts;
}

// ── La pierre usée : sur les faces claires, du grain (des pixels isolés,
// en taches irrégulières), des fissures courtes, et la pierre plus rongée
// au pied ; jamais sur les traits ni contre eux ──
const TEXTURED = { arche: true };
function texture(src, seed) {
  const g = src.map(r => [...r]), H = g.length, W = g[0].length, r = rng(seed);
  const at = (x, y) => g[y]?.[x] ?? '.';
  const clear = (x, y) => {
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (at(x + i, y + j) !== 's') return false;
    return true;
  };
  const h = (x, y) => { let v = (x * 374761393 + y * 668265263 + seed) | 0; v = Math.imul(v ^ (v >>> 13), 1274126177); return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };
  const smooth = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  const marks = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (!clear(x, y)) continue;
    const patch = smooth(x / 7, y / 5) * 0.7 + smooth(x / 3, y / 3) * 0.3;    // des taches, pas un semis
    const foot = Math.max(0, (y - H * 0.7) / (H * 0.3));                        // plus rongée en bas
    const p = Math.max(0, patch - 0.45) * 0.8 + foot * 0.08 + 0.015;
    if (h(x + 7, y + 3) < p) marks.push([x, y]);
  }
  for (const [x, y] of marks) if (at(x - 1, y) !== 'b' && at(x, y - 1) !== 'b' && at(x - 1, y - 1) !== 'b') g[y][x] = 'b';
  // Des fissures : quelques pixels qui descendent en biais, depuis un trait
  for (let n = 0, tries = 0; n < 9 && tries < 400; tries++) {
    let x = 1 + Math.floor(r() * (W - 2)), y = 1 + Math.floor(r() * (H - 2));
    if (at(x, y) !== 's' || ![at(x - 1, y), at(x + 1, y), at(x, y - 1)].includes('k')) continue;
    const dir = r() < 0.5 ? -1 : 1, len = 3 + Math.floor(r() * 4);
    for (let k = 0; k < len; k++) {
      y++; if (r() < 0.6) x += dir;
      if (at(x, y) !== 's' || at(x, y + 1) === '.') break;
      g[y][x] = 'b';
    }
    n++;
  }
  return g.map(row => row.join(''));
}

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hashKey = key => [...key].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

// ── Un rocher cerné, dans le style des dessins : un trait fin (un pixel, bleu
// nuit), l'intérieur clair (neige) ; un polygone simple mais irrégulier, assis
// sur sa base, parfois une fissure ──
export function makeOutlinedRock(r) {
  const W = 6 + Math.floor(r() * 6), H = 4 + Math.floor(r() * 3);
  const cx = (W - 1) / 2, cy = (H - 1) / 2, n = 5 + Math.floor(r() * 3), a0 = r() * Math.PI;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + i / n * Math.PI * 2 + (r() - 0.5) * 0.7, k = 0.78 + r() * 0.22;
    // (le bas aplati : il pose sur la neige)
    pts.push([cx + Math.cos(a) * (W / 2) * k, Math.min(H - 0.6, cy + Math.sin(a) * (H / 2 + 0.4) * k)]);
  }
  const inside = (x, y) => {
    let c = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const g = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => inside(x + 0.5, y + 0.5)));
  const at = (x, y) => g[y]?.[x] || false;
  const rows = g.map((row, y) => row.map((on, x) => !on ? '.'
    : (!at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1)) ? 'k' : 's'));
  // Une fissure, parfois : quelques pixels sombres en biais
  if (r() < 0.6 && W > 7) {
    let x = 2 + Math.floor(r() * (W - 5)), y = 1 + Math.floor(r() * Math.max(1, H - 3));
    for (let m = 0; m < 3 && rows[y]?.[x] === 's'; m++) { rows[y][x] = 'k'; x++; y += r() < 0.5 ? 1 : 0; }
  }
  // Rognure du haut et du bas vides
  let out = rows.map(row => row.join('')).filter(row => /[^.]/.test(row));
  const l = Math.min(...out.map(row => row.length - row.replace(/^\.+/, '').length));
  const rgt = Math.max(...out.map(row => row.replace(/\.+$/, '').length));
  out = out.map(row => row.slice(l, rgt));
  return { rows: out };
}

// La largeur et la hauteur d'un dessin (pour les emprises)
export const monumentSize = key => { const r = designRows(`decor-${key}`, RUIN_ART[key]); return { w: r[0].length, h: r.length }; };
