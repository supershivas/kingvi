/* Ruines dans la plaine, d'après les images de référence : une colonne
   cannelée couchée dans la neige, et un socle à degrés où restent debout un
   pilier brisé et un bloc. Pierre sombre (b), faces à l'ombre (k), neige sur
   les dessus (s). Objets fabriqués : quelques lignes, usées, ébréchées.
   (L'arche en ruine est dans arch.js.) */

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function grid(W, H) {
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? g[y][x] : '.');
  return { g, put, get, rows: () => g.map(row => row.join('')) };
}
// Arêtes ébréchées : quelques pixels du contour tombent
function chip(G, r, p = 0.1) {
  const { g, get, put } = G;
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
    if (get(x, y) === '.') continue;
    if ((get(x - 1, y) === '.' || get(x + 1, y) === '.' || get(x, y - 1) === '.') && r() < p) put(x, y, '.');
  }
}
// Les dessus enneigés se fondraient dans la neige : un liseré sombre (usé)
// partout où la pierre claire touche le vide
function rim(G, r) {
  const { g, get, put } = G, mark = [];
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
    if (get(x, y) !== 's') continue;
    if ((get(x - 1, y) === '.' || get(x + 1, y) === '.' || get(x, y - 1) === '.' || get(x, y + 1) === '.') && r() < 0.9) mark.push([x, y]);
  }
  for (const [x, y] of mark) put(x, y, 'b');
}
// Rognure : le haut et la droite vides retirés, pour que le pied soit la dernière rangée
function trim(rows) {
  while (rows.length > 1 && /^\.*$/.test(rows[0])) rows.shift();
  return rows;
}

// ── La colonne couchée : le fût cannelé en travers, du chapiteau (en haut à
// gauche) à la cassure (en bas à droite) ; environ quatre fois le viking ──
export function makeColumn(seed = 3) {
  const r = rng(seed);
  const L = 40, R = 6.2, W = 56, H = 40;
  const G = grid(W, H);
  const ux = 0.9, uy = 0.42, n = Math.hypot(ux, uy), u = [ux / n, uy / n], v = [-u[1], u[0]];   // axe ; travers (vers le bas)
  const A = [7, 9];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const px = x + 0.5 - A[0], py = y + 0.5 - A[1];
    const t = px * u[0] + py * u[1], s = px * v[0] + py * v[1];
    // Le fût : cannelures parallèles à l'axe ; le dessus enneigé, le dessous dans l'ombre
    if (t >= 3 && t <= L && Math.abs(s) <= R) {
      const flute = ((s + R) % 2.1 + 2.1) % 2.1 < 0.75;
      let c = s > R * 0.45 ? 'k' : flute ? 'k' : 'b';
      if (s < -R + 1.4 && r() < 0.75) c = 's';
      G.put(x, y, c);
    }
    // Le chapiteau : un bourrelet plus large, deux anneaux
    if (t >= 0 && t < 4 && Math.abs(s) <= R + 1.6) G.put(x, y, t < 1 || (t > 2 && t < 3) ? 'k' : s < -R ? 's' : 'b');
  }
  // La cassure, au bout : la section ovale, claire au bord, sombre au cœur
  const E = [A[0] + u[0] * L, A[1] + u[1] * L];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const px = x + 0.5 - E[0], py = y + 0.5 - E[1];
    const a = (px * u[0] + py * u[1]) / (R * 0.5), b = (px * v[0] + py * v[1]) / R;
    const d = a * a + b * b;
    if (d <= 1 && a >= -0.2) G.put(x, y, d > 0.65 ? 's' : d > 0.3 ? 'b' : 'k');
  }
  chip(G, r, 0.1);
  rim(G, r);
  // Les éclats tombés autour
  for (const [x, y] of [[3, 28], [9, 33], [20, 36], [46, 35], [52, 27]]) {
    const w = 2 + Math.floor(r() * 3);
    for (let i = 0; i < w; i++) { G.put(x + i, y, i && i < w - 1 ? 's' : 'b'); G.put(x + i, y + 1, 'b'); }
  }
  return { rows: trim(G.rows()), ax: 0 };
}

// Un bloc vu de biais : face avant (x, pied y, largeur w, hauteur h), dessus
// et flanc droit poussés de la profondeur d ; `top(x)` : le haut, s'il est cassé
function block(G, r, x0, yb, w, h, d, { top = null, joints = 6 } = {}) {
  const yt = yb - h + 1;
  const hAt = x => (top ? top(x) : 0);
  // Le flanc droit
  for (let i = 1; i <= d.x; i++) {
    const lift = Math.round(i / d.x * d.y);
    for (let y = yt + hAt(w - 1) - lift; y <= yb - lift; y++) G.put(x0 + w - 1 + i, y, 'k');
  }
  // Le dessus : la neige, bord sombre
  for (let j = 0; j <= d.y; j++) {
    const sx = Math.round(j / d.y * d.x);
    for (let i = 0; i < w; i++) {
      const y = yt + hAt(i) - j;
      G.put(x0 + i + sx, y, j === d.y || i === 0 ? 'b' : r() < 0.07 ? 'b' : 's');
    }
  }
  // La face avant : la pierre, joints noirs, bloc par bloc
  for (let i = 0; i < w; i++) for (let y = yt + hAt(i) + 1; y <= yb; y++) G.put(x0 + i, y, 'b');
  for (let y = yb - joints; y > yt; y -= joints) {
    const sag = r() < 0.3 ? 1 : 0;
    for (let i = 0; i < w; i++) if (y + sag > yt + hAt(i) + 1 && r() > 0.08) G.put(x0 + i, y + sag, 'k');
    for (let i = 4 + Math.floor(r() * 5); i < w - 1; i += 6 + Math.floor(r() * 6)) for (let k = 1; k < joints; k++) if (y + k <= yb && y + k > yt + hAt(i) + 1) G.put(x0 + i, y + k, 'k');
  }
  // L'arête du coin avant gauche, éclairée
  for (let y = yt + hAt(0) + 1; y <= yb; y++) if (r() < 0.6) G.put(x0, y, 's');
}

// ── Le socle en ruine : deux degrés de pierre, un pilier brisé au fond à
// droite, un bloc renversé devant ; environ cinq fois le viking ──
export function makePlinth(seed = 5) {
  const r = rng(seed);
  const W = 62, H = 56, G = grid(W, H), d = { x: 10, y: 7 };
  const yb = H - 1;
  // Les deux degrés
  block(G, r, 0, yb, 46, 5, d, { joints: 5 });
  block(G, r, 5, yb - 5 - 2, 34, 4, { x: 7, y: 5 }, { joints: 4 });
  // Le pilier brisé, au fond à droite : le haut cassé en marches
  const steps = [0, 0, 2, 2, 5, 5, 9];
  block(G, r, 27, yb - 12, 8, 34, { x: 5, y: 4 }, { top: i => steps[Math.min(steps.length - 1, i)] + (r() < 0.2 ? 1 : 0), joints: 6 });
  // Un tronçon plus court, à côté
  block(G, r, 17, yb - 11, 7, 15, { x: 4, y: 3 }, { top: i => (i > 4 ? 3 : 0), joints: 5 });
  // Un bloc tombé, devant sur la marche
  block(G, r, 7, yb - 8, 7, 5, { x: 4, y: 3 }, { joints: 9 });
  chip(G, r, 0.08);
  rim(G, r);
  // Des fissures
  for (let k = 0; k < 4; k++) {
    let x = 2 + Math.floor(r() * 40), y = yb - 2 - Math.floor(r() * 30);
    for (let m = 0; m < 6; m++) { if (G.get(x, y) === 'b') G.put(x, y, 'k'); y++; x += r() < 0.4 ? (r() < 0.5 ? -1 : 1) : 0; }
  }
  // Gravats autour
  for (const [x, y] of [[49, yb - 1], [53, yb - 3], [57, yb], [-1, yb]]) { G.put(x, y, 'b'); G.put(x + 1, y, 's'); G.put(x + 1, y + 1, 'b'); }
  return { rows: trim(G.rows()), ax: 0 };
}
