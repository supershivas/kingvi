/* Générateurs d'arbres et de gros rochers : chaque appel donne une forme
   unique, tirée du générateur `r` (fonction qui rend un nombre dans [0, 1[).
   Résultat : { rows, ax } — lignes de pixels (b sombre, k noir, s neige, . vide)
   et colonne d'ancrage ; la dernière ligne touche le sol. */
import { designRows } from './design-store.js?v=1.70.0';

function blank(w, h) { return Array.from({ length: h }, () => Array(w).fill('.')); }
const toRows = g => g.map(r => r.join(''));

// Sapin : hauteur, largeur, étages, inclinaison, tronc et neige variables.
export function makeFir(r, { big = false } = {}) {
  const H = Math.round(big ? 12 + r() * 16 : 6 + r() * 14);
  const W = Math.max(3, Math.round(H * (0.3 + r() * 0.4)));
  const tiers = 2 + Math.floor(r() * Math.max(1, H / 5));
  const trunk = 1 + Math.floor(r() * 3);
  const lean = (r() - 0.5) * 2.5;
  const snow = 0.15 + r() * 0.75;
  const ragged = r() * 0.5;
  const Wt = W + 4, cx = Math.floor(Wt / 2);
  const g = blank(Wt, H + trunk);
  for (let y = 0; y < H; y++) {
    const t = (y + 1) / H;
    const tier = (t * tiers) % 1;
    const half = (W / 2) * (0.15 + 0.85 * t) * (0.55 + 0.45 * tier);
    const off = lean * (1 - t);
    const jl = r() < ragged ? Math.round(r() * 2 - 1) : 0;
    const jr = r() < ragged ? Math.round(r() * 2 - 1) : 0;
    const left = Math.max(0, Math.round(cx + off - half) + jl);
    const right = Math.min(Wt - 1, Math.round(cx + off + half) + jr);
    for (let x = left; x <= right; x++) g[y][x] = 'b';
    // Neige posée sur le haut de chaque étage
    if (tier < 0.4 && y > 1) for (let x = left + 1; x < right; x++) if (r() < snow) g[y][x] = 's';
  }
  g[0][Math.round(cx + lean)] = 'b';
  const thick = W >= 10 ? 2 : 1;
  for (let y = H; y < H + trunk; y++) for (let k = 0; k < thick; k++) g[y][cx + k] = 'b';
  return { rows: toRows(g), ax: cx };
}

// Arbre mort : un tronc tordu et quelques branches nues.
export function makeDeadTree(r) {
  const H = Math.round(7 + r() * 12);
  const Wt = 13, cx = 6;
  const g = blank(Wt, H);
  let x = cx;
  for (let y = H - 1; y >= 0; y--) {
    g[y][x] = 'b';
    if (y < H - 3 && r() < 0.18) x += r() < 0.5 ? -1 : 1;
    x = Math.max(2, Math.min(Wt - 3, x));
    if (y < H - 3 && y > 0 && r() < 0.28) {
      const dir = r() < 0.5 ? -1 : 1, len = 2 + Math.floor(r() * 3);
      for (let k = 1; k <= len; k++) {
        const bx = x + dir * k, by = y - Math.floor(k * 0.8);
        if (bx >= 0 && bx < Wt && by >= 0) g[by][bx] = 'b';
      }
    }
  }
  return { rows: toRows(g), ax: cx };
}

export function makeTree(r, opts) {
  return r() < 0.1 ? makeDeadTree(r) : makeFir(r, opts);
}

// Gros rocher : bloc sombre, calotte de neige sur le dessus, contour marqué.
// Gros rocher : un bloc de roc noir, trapu, taillé en facettes nettes (des
// sommets tirés autour d'une forme presque carrée : arêtes vives, angles
// francs, jamais une pyramide). Les pans tournés vers la droite sont un peu
// moins noirs ; à peine de neige sur les replats ; quelques fissures.
function facetRock(r, w, H) {
  const cx = (w - 1) / 2, base = H - 0.5;
  // Le contour : du pied gauche au pied droit, par le haut
  const n = 3 + Math.floor(r() * 3), pts = [[0, base + 0.5]];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (1 - i / n) + (i > 0 && i < n ? (r() - 0.5) * 0.35 : 0);
    const k = 0.62 + r() * 0.38;
    // |cos|^0.5 et |sin|^0.45 : une forme carrée plutôt qu'une ellipse
    const px = cx + Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.5) * (w / 2) * (i === 0 || i === n ? 1 : k);
    const py = base - Math.pow(Math.abs(Math.sin(a)), 0.45) * H * k;
    pts.push([px, Math.max(0, py)]);
  }
  pts.push([w - 1, base + 0.5]);
  const inside = (x, y) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const g = blank(w, H);
  // Distance d'un point à un segment
  const segD = (x, y, [x0, y0], [x1, y1]) => {
    const dx = x1 - x0, dy = y1 - y0, t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(x - x0 - dx * t, y - y0 - dy * t);
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < w; x++) {
    if (!inside(x + 0.5, y + 0.5) && y < H - 1) continue;
    // La facette : le pan du contour le plus proche ; tourné vers la droite
    // (il descend vers la droite), il est un peu moins noir
    let best = Infinity, face = 1;
    for (let i = 1; i < pts.length - 2; i++) {
      const d = segD(x + 0.5, y + 0.5, pts[i], pts[i + 1]);
      if (d < best) { best = d; face = i; }
    }
    const [x0, y0] = pts[face], [x1, y1] = pts[face + 1];
    const len = Math.hypot(x1 - x0, y1 - y0) || 1, nx = (y1 - y0) / len;
    g[y][x] = nx > 0.35 && y < H - 1 ? 'b' : 'k';
  }
  // Un grain de neige sur les replats
  for (let x = 1; x < w - 1; x++) {
    const t = g.findIndex(row => row[x] !== '.');
    if (t > 0 && g[t][x - 1] !== '.' && g[t][x + 1] !== '.' && g[t - 1][x - 1] === '.' && g[t - 1][x + 1] === '.' && r() < 0.3) g[t][x] = 's';
  }
  // Quelques fissures
  for (let k = 0; k < 2; k++) {
    let x = Math.floor(r() * w), y = H - 2 - Math.floor(r() * 3);
    for (let m = 0; m < 4 && g[y]?.[x] && g[y][x] !== '.'; m++) { g[y][x] = 'k'; y--; x += r() < 0.5 ? 1 : -1; }
  }
  while (g.length > 1 && g[0].every(c => c === '.')) g.shift();
  return { rows: toRows(g), ax: Math.floor(w / 2) };
}

// ── Les rochers, faits de morceaux (v1.65.0) : huit morceaux qu'on redessine
// dans l'atelier (`rocher-1` … `rocher-8`, groupe « La falaise, les rochers,
// la souche ») ; le jeu en tire deux à quatre, les adosse ou les empile, et
// cuit le tout dans la planche du morceau de l'île, à la volée. Les morceaux
// d'origine sont taillés en facettes par le code (ci-dessus). ──
const PIECE_SIZES = [[7, 5], [9, 6], [11, 7], [13, 8], [6, 4], [10, 6], [8, 7], [12, 9]];
const lcg = seed => { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; };
export const ROCK_PIECES = PIECE_SIZES.map(([w, h], i) => {
  const { rows } = facetRock(lcg(9101 + i * 7919), w, h);
  // (la taille reste celle annoncée : les rangées vides du haut sont gardées)
  while (rows.length < h) rows.unshift('.'.repeat(w));
  return rows;
});
export const rockPiece = i => designRows(`rocher-${i + 1}`, ROCK_PIECES[i], { grow: true });

export function makeBoulder(r) {
  const n = 2 + Math.floor(r() * 3);
  const placed = [];
  // Le premier, posé au sol ; les autres adossés à gauche ou à droite (au sol,
  // à un pixel près), ou posés dessus, en retrait
  let left = 0, right = 0, top = 0;
  for (let k = 0; k < n; k++) {
    // (le premier, le plus gros de trois tirés : le cœur du tas)
    let pick = Math.floor(r() * PIECE_SIZES.length);
    if (!k) for (let t = 0; t < 2; t++) { const q = Math.floor(r() * PIECE_SIZES.length); if (PIECE_SIZES[q][0] * PIECE_SIZES[q][1] > PIECE_SIZES[pick][0] * PIECE_SIZES[pick][1]) pick = q; }
    const rows = rockPiece(pick);
    const w = rows[0].length, h = rows.length;
    let x, y, z = 1;
    if (!k) { x = 0; y = 0; right = w; top = h; }
    else if (k === n - 1 && n > 2 && w < right - left && r() < 0.6) {
      // Dessus : le pied dans le tiers haut du tas, derrière lui
      x = left + Math.floor(r() * (right - left - w + 1));
      y = top - Math.max(2, Math.floor(h * 0.45));
      z = 0;
    } else if (r() < 0.5) {
      x = left - Math.round(w * (0.3 + r() * 0.25)); y = r() < 0.4 ? 1 : 0;
    } else {
      x = right - Math.round(w * (0.45 + r() * 0.25)); y = r() < 0.4 ? 1 : 0;
    }
    if (z) { left = Math.min(left, x); right = Math.max(right, x + w); top = Math.max(top, y + h); }
    placed.push({ rows, x, y, z, w, h });
    if (right - left > 28) break;
  }
  // Le tas : du sol (y = 0) vers le haut ; on peint d'abord ce qui est derrière
  const x0 = Math.min(...placed.map(p => p.x)), x1 = Math.max(...placed.map(p => p.x + p.w));
  const yTop = Math.max(...placed.map(p => p.y + p.h)), yLow = Math.min(...placed.map(p => p.y));
  const W = x1 - x0, H = yTop - yLow;
  const g = blank(W, H);
  for (const p of placed.sort((a, b) => a.z - b.z || b.y - a.y)) {
    p.rows.forEach((row, ry) => [...row].forEach((c, rx) => {
      if (c === '.') return;
      const gy = H - 1 - (p.y - yLow) - (p.h - 1 - ry);
      if (gy >= 0 && gy < H) g[gy][p.x - x0 + rx] = c;
    }));
  }
  while (g.length > 1 && g[0].every(c => c === '.')) g.shift();
  // (la rangée du sol, pleine sous le tas : il pèse)
  return { rows: toRows(g), ax: Math.floor(W / 2) };
}

// La souche : ce qui reste d'un arbre abattu (`souche` dans l'atelier ; la
// colonne du milieu est le pied du tronc)
export const STUMP = ['.ss..', '.bbb.', 'bbbbb'];
export const stumpRows = () => designRows('souche', STUMP);

// Combien de coups pour en venir à bout : les gros résistent longtemps
export const boulderHits = (w, h) => Math.max(2, Math.round(w * h / 40));

// Le rocher ébréché : `n` éclats arrachés au contour, toujours les mêmes pour
// un même rocher (graine). La base reste : il s'effrite par le haut et les
// flancs. Rend aussi où chaque éclat est tombé (pour les morceaux au sol).
export function chipBoulder(rows, n, seed) {
  const g = rows.map(row => [...row]);
  const H = g.length, W = g[0].length;
  let a = seed >>> 0;
  const r = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
  const fell = [];
  for (let k = 0; k < n; k++) {
    // Un point du bord, en haut ou sur un flanc
    const edge = [];
    for (let y = 0; y < H - 2; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] === '.') continue;
      if (y === 0 || g[y - 1][x] === '.' || x === 0 || g[y][x - 1] === '.' || x === W - 1 || g[y][x + 1] === '.') edge.push([x, y]);
    }
    if (!edge.length) break;
    const [ex, ey] = edge[Math.floor(r() * edge.length)];
    const rad = 1 + r() * 1.6;
    for (let y = Math.max(0, Math.floor(ey - rad)); y <= Math.min(H - 3, ey + rad); y++) {
      for (let x = Math.max(0, Math.floor(ex - rad)); x <= Math.min(W - 1, ex + rad); x++) {
        if (Math.hypot((x - ex) * 0.9, y - ey) <= rad) g[y][x] = '.';
      }
    }
    // La cassure, plus claire (la pierre neuve)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] !== 'k' || Math.hypot(x - ex, y - ey) > rad + 1.2) continue;
      if ((g[y - 1]?.[x] === '.' || g[y][x - 1] === '.' || g[y][x + 1] === '.') && r() < 0.6) g[y][x] = 'b';
    }
    fell.push({ x: ex, y: ey, side: ex < W / 2 ? -1 : 1, size: rad });
  }
  return { rows: g.map(row => row.join('')), fell };
}

// Cairn : pierres plates empilées d'un seul tenant, de guingois — jamais
// symétrique (il penche d'un côté, chaque pierre est décalée et de largeur propre).
export function makeCairn(r) {
  const lean = (r() < 0.5 ? -1 : 1) * (0.3 + r() * 0.45);
  const stones = [];
  let w = 5 + Math.floor(r() * 3), c = 0;
  const layers = 3 + Math.floor(r() * 3);
  for (let i = 0; i < layers; i++) {
    stones.push({ w, h: 1 + (r() < 0.35 ? 1 : 0), c });
    w = Math.max(3, w - Math.floor(r() * 2.2));
    c += lean + (r() - 0.5) * 1.2;
  }
  // Une pierre de faîte, petite, posée de travers
  stones.push({ w: 1 + Math.floor(r() * 2), h: 1, c: c + lean });
  const minX = Math.floor(Math.min(...stones.map(s => s.c - s.w / 2))) - 1;
  const maxX = Math.ceil(Math.max(...stones.map(s => s.c + s.w / 2))) + 1;
  const W = maxX - minX + 1;
  const rows = [];
  stones.forEach((s, i) => {
    const left = Math.round(s.c - s.w / 2) - minX;
    for (let k = 0; k < s.h; k++) {
      const row = Array(W).fill('.');
      for (let x = left; x < left + s.w; x++) row[x] = 'b';
      // Joint entre deux pierres : une encoche au bord, pas une fente
      if (k === 0 && i > 0 && s.w > 3) row[r() < 0.5 ? left : left + s.w - 1] = '.';
      rows.unshift(row.join(''));
    }
  });
  return { rows, ax: Math.round(-minX) };
}

// Iceberg tabulaire, plat : un plateau de glace (clair) au contour
// irrégulier, une falaise tramée dessous, de l'écume au ras de l'eau.
export function makeIceberg(r) {
  const w = Math.round(10 + r() * 30);
  const top = Math.max(3, Math.round(w * (0.22 + r() * 0.12)));
  const cliff = 2 + Math.floor(r() * 2);
  const H = top + cliff + 1;
  const g = Array.from({ length: H }, () => Array(w).fill('.'));
  const wobble = [r() * 6, r() * 6];
  const inside = (x, y) => {
    const nx = (x + 0.5 - w / 2) / (w / 2), ny = (y + 0.5 - top / 2) / (top / 2);
    return nx * nx + ny * ny < 1 + 0.18 * Math.sin(nx * 4 + wobble[0]) + 0.1 * Math.sin(nx * 9 + wobble[1]);
  };
  for (let y = 0; y < top; y++) for (let x = 0; x < w; x++) {
    if (!inside(x, y)) continue;
    const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1);
    g[y][x] = edge && y < top / 2 ? 'b' : r() < 0.03 ? 'b' : 's';
  }
  // Falaise : sous le bord avant du plateau, tramée ; puis l'écume
  for (let x = 0; x < w; x++) {
    let low = -1;
    for (let y = top - 1; y >= 0; y--) if (g[y][x] !== '.') { low = y; break; }
    if (low < 0 || low < top / 2) continue;
    for (let k = 1; k <= cliff; k++) g[low + k][x] = (x + k) % 2 ? 's' : 'b';
    if (r() < 0.7) g[low + cliff + 1][x] = 's';
  }
  return { rows: g.map(row => row.join('')), ax: Math.floor(w / 2) };
}

// Un arbre qui ploie : la cime glisse de `lean` pixels (négatif : contre le
// vent), le pied ne bouge pas, et l'écart croît vers le haut. Toutes les
// inclinaisons ont la même taille : une colonne de marge à gauche, deux à droite.
export const LEANS = [-1, 0, 1, 2];
export const LEAN_PAD = 1;
export function leanRows(rows, lean) {
  const H = rows.length;
  return rows.map((row, y) => {
    const k = H > 1 ? (H - 1 - y) / (H - 1) : 0;
    const shift = Math.round(lean * Math.pow(k, 1.6));
    const padded = '.'.repeat(LEAN_PAD + shift) + row + '.'.repeat(2 - shift + 0);
    return padded.slice(0, row.length + LEAN_PAD + 2);
  });
}

// ── Le vent dans les arbres (partagé jeu et labo) ──
// Par bise, presque rien ; ils ne ploient vraiment qu'au-delà d'un vent moyen.
// `base` : inclinaison moyenne (vers l'est), `amp` : ampleur du ploiement.
export function treeWind(wind, gust) {
  const force = Math.min(1, wind / 150);
  const strong = Math.max(0, force - 0.3) / 0.7;
  return { base: strong * 1.4, amp: strong * (0.7 + 1.2 * gust) };
}
// Cadence propre à chaque arbre : vive, un peu plus lente pour les grands
export const treeFreq = h => 6 + 40 / (h + 10);
// Inclinaison à l'instant t : un ploiement rapide, parcouru par une vague
// d'ouest en est, et un frémissement plus vif par-dessus.
export function treeLean(t, tree, base, amp) {
  const wave = Math.sin(t * tree.freq + tree.phase - tree.x * 0.03) + 0.35 * Math.sin(t * tree.freq * 2.3 + tree.phase * 1.7);
  return Math.max(-1, Math.min(2, Math.round(base + wave * amp)));
}
