/* Générateurs d'arbres et de gros rochers : chaque appel donne une forme
   unique, tirée du générateur `r` (fonction qui rend un nombre dans [0, 1[).
   Résultat : { rows, ax } — lignes de pixels (b sombre, s neige, . vide)
   et colonne d'ancrage ; la dernière ligne touche le sol. */

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
export function makeBoulder(r) {
  const w = Math.round(9 + r() * 16);
  const h = Math.round(w * (0.45 + r() * 0.25));
  const bumps = [r() * 6, r() * 6, 0.1 + r() * 0.15];
  const inside = (x, y) => {
    const nx = (x + 0.5 - w / 2) / (w / 2);
    const ny = (y + 0.5 - h) / h;
    const n = bumps[2] * Math.sin(nx * 5 + bumps[0]) + 0.08 * Math.sin(nx * 11 + bumps[1]);
    return nx * nx + ny * ny < 1 + n && y < h;
  };
  const g = blank(w, h);
  const snowline = h * (0.35 + r() * 0.25);
  const snowWave = r() * 6;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || y === h - 1;
      const snowy = y < snowline + Math.sin(x * 0.7 + snowWave) * 1.2;
      g[y][x] = edge ? 'b' : snowy ? (r() < 0.04 ? 'b' : 's') : 'b';
    }
  }
  return { rows: toRows(g), ax: Math.floor(w / 2) };
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
