/* L'arche : une porte de pierre seule dans la plaine, d'après l'image de
   référence. Vue de haut et de biais comme la maison : la face avant (au sud)
   percée d'une voûte, le flanc droit dans l'ombre, le dessus enneigé. Environ
   dix fois la hauteur du viking. Objet fabriqué : quelques lignes, mais usées
   (arêtes ébréchées, joints de travers, fissures, un bloc tombé).

   Elle est découpée en trois tranches (pilier gauche, voûte, pilier droit),
   triées comme les autres objets par la ligne de leur pied : les piliers
   bloquent le passage, la voûte laisse passer dessous. */

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const ARCH_FW = 46;            // largeur de la face avant
export const ARCH_DEPTH = { x: 10, y: 7 };   // profondeur, vue de biais : vers la droite et le haut
const FH0 = 84;                       // hauteur de la face avant
export const ARCH_OPEN = { x0: 15, x1: 31, spring: 40, r: 8 };   // l'ouverture : bords, naissance de la voûte (depuis le pied), rayon

// `opts` : d'autres proportions (fw, fh, open, depth), et `ruin` : le haut
// droit effondré, bloc par bloc (l'arche en ruine)
export function makeArch(seed = 7, opts = {}) {
  const r = rng(seed);
  const D = opts.depth || ARCH_DEPTH, FW = opts.fw || ARCH_FW, FH = opts.fh || FH0, O = opts.open || ARCH_OPEN;
  const W = FW + D.x + 2, T = D.y, B = T + FH - 1, H = B + 1;
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? g[y][x] : '.');
  const springY = B - O.spring, cx = (O.x0 + O.x1 - 1) / 2;

  // L'ouverture, vue de face : droite jusqu'à la naissance, puis la voûte
  // (un demi-cercle un peu affaissé, cassé par le bruit)
  const inOpening = (x, y) => {
    if (x < O.x0 || x >= O.x1 || y > B) return false;
    if (y >= springY) return true;
    const dx = (x + 0.5 - cx - 0.5) / (O.r + 0.4), dy = (springY - y) / (O.r * 0.95);
    return dx * dx + dy * dy < 1;
  };

  // 1. Le flanc droit (dans l'ombre) : la face avant poussée de la profondeur
  for (let y = 0; y < H; y++) for (let x = FW; x < W; x++) {
    const k = Math.min(D.x, x - FW + 1) / D.x;               // 0 → 1 vers l'arrière
    const lift = Math.round(k * D.y);
    if (y >= T - lift && y <= B - lift) put(x, y, 'k');
  }
  // Joints du flanc : quelques assises
  for (let yy = T + 12; yy < B - 4; yy += 6) for (let x = FW; x < FW + D.x; x++) {
    const lift = Math.round(Math.min(D.x, x - FW + 1) / D.x * D.y);
    if (r() < 0.8) put(x, yy - lift, 'b');
  }
  // 2. Le dessus : la neige
  for (let y = 0; y <= T; y++) {
    const k = (T - y) / D.y, x0 = Math.round(k * D.x), x1 = FW - 1 + Math.round(k * D.x);
    for (let x = x0; x <= x1 + 1; x++) put(x, y, r() < 0.06 ? 'b' : 's');
  }
  // Le contour du dessus (sombre, usé), pour qu'il se détache de la neige
  for (let y = 0; y <= T; y++) {
    const k = (T - y) / D.y, x0 = Math.round(k * D.x);
    if (r() < 0.85) put(x0 - 1, y, 'b');
  }
  for (let x = D.x - 1; x <= FW + D.x; x++) if (r() < 0.85) put(x, 0, 'b');
  // 3. La face avant : assises de pierres sombres, joints noirs
  for (let y = T; y <= B; y++) for (let x = 0; x < FW; x++) put(x, y, 'b');
  // La corniche : une dalle qui déborde, puis la frise
  for (let x = 0; x < FW; x++) { put(x, T + 5, 'k'); put(x, T + 11, 'k'); }
  for (let y = T; y <= T + 4; y++) { put(-1, y, 'b'); }
  // Les assises du corps : blocs de largeurs inégales, décalés d'une assise à
  // l'autre ; chaque bloc s'est un peu tassé (son lit monte ou descend d'un
  // pixel), le mortier manque par endroits : pas de ligne droite d'un bout à l'autre
  let course = 0;
  for (let y0 = T + 12; y0 < B - 4; y0 += 6, course++) {
    let x = course % 2 ? -Math.floor(r() * 5) : 0;
    while (x < FW) {
      const w = 7 + Math.floor(r() * 6), sag = r() < 0.3 ? (r() < 0.5 ? -1 : 1) : 0;
      for (let k = 0; k < w; k++) if (r() > 0.08) put(x + k, y0 + sag, 'k');
      x += w;
      // Le joint montant, parfois de travers
      const tilt = r() < 0.25 ? 1 : 0;
      for (let y = y0 + 1; y < Math.min(y0 + 6, B - 3); y++) if (r() > 0.06) put(x + (y > y0 + 3 ? tilt : 0), y, 'k');
    }
  }
  // Blocs de la frise et de la corniche
  for (let x = 6 + Math.floor(r() * 5); x < FW; x += 12 + Math.floor(r() * 6)) for (let y = T + 6; y < T + 11; y++) put(x, y, 'k');
  for (let x = 9 + Math.floor(r() * 6); x < FW; x += 15 + Math.floor(r() * 8)) for (let y = T; y < T + 5; y++) put(x, y, 'k');
  // Le socle : une marche un peu plus large
  for (let x = -1; x <= FW; x++) { put(x, B - 3, 'k'); for (let y = B - 2; y <= B; y++) put(x, y, 'b'); }
  // L'arête du coin avant gauche et de la corniche, éclairées
  for (let y = T + 12; y < B - 3; y++) if (r() < 0.75) put(0, y, 's');
  for (let x = 0; x < FW; x++) if (r() < 0.7) put(x, T, 's');
  // 4. L'ouverture : on voit à travers ; dans l'épaisseur, la paroi gauche et
  // le dessous de la voûte, dans le noir
  for (let y = T; y <= B; y++) for (let x = O.x0 - 1; x <= O.x1; x++) if (inOpening(x, y)) put(x, y, '.');
  for (let y = T; y <= B; y++) for (let x = O.x0; x < O.x1; x++) {
    if (!inOpening(x, y)) continue;
    // La paroi gauche du passage, vue de biais : une bande noire qui monte vers la droite
    const wall = x - O.x0 < 3 + Math.round((B - y) / FH * 2);
    // Le dessous de la voûte : une bande noire sous l'arc
    const under = !inOpening(x, y - 3);
    if (wall || under) put(x, y, 'k');
  }
  // Les claveaux : un anneau de pierres autour de la voûte, joints rayonnants
  for (let y = T + 12; y < springY + 2; y++) for (let x = O.x0 - 4; x < O.x1 + 4; x++) {
    if (inOpening(x, y) || get(x, y) === '.') continue;
    let near = false;
    for (let k = 1; k <= 3 && !near; k++) if (inOpening(x, y + k) || inOpening(x + k, y) || inOpening(x - k, y)) near = true;
    if (!near) continue;
    const a = Math.atan2(springY - y, x + 0.5 - cx - 0.5);
    const joint = Math.abs(((a / Math.PI * 7) % 1 + 1) % 1 - 0.5) > 0.42;
    put(x, y, joint ? 'k' : (r() < 0.12 ? 's' : 'b'));
  }
  // L'arche en ruine : le haut droit s'est effondré, par blocs entiers (des
  // marches inégales, à la hauteur des assises), la neige s'est posée dessus
  if (opts.ruin) {
    const xa = Math.round(FW * 0.25);
    const steps = [];
    let level = T;
    for (let x = 0; x < FW; x += 3 + Math.floor(r() * 4)) {
      if (x > xa) level = Math.min(B - 16, level + 6 * (r() < 0.6 ? 1 : 2) - (r() < 0.15 ? 6 : 0));
      steps.push([x, level]);
    }
    const limit = x => { let l = T; for (const [sx, lv] of steps) if (x >= sx) l = lv; return l; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (get(x, y) === '.') continue;
      let front;
      if (y < T) front = x - Math.round((T - y) / D.y * D.x);           // le dessus
      else if (x >= FW) front = FW - 1;                                 // le flanc
      else front = x;
      const lift = x >= FW ? Math.round(Math.min(D.x, x - FW + 1) / D.x * D.y) : 0;
      if (front > xa && y + lift < limit(Math.min(front, FW - 1))) put(x, y, '.');
    }
    // La neige sur les marches de la cassure, un bord sombre dessous
    for (let x = 0; x < W; x++) {
      let y = 0;
      while (y < H && get(x, y) === '.') y++;
      if (y > T && y < B - 3) { if (r() < 0.8) put(x, y, 's'); if (get(x, y + 1) !== '.' && r() < 0.5) put(x, y + 1, 'k'); }
    }
  }
  // 5. L'usure : arêtes ébréchées, fissures, un bloc tombé, de la neige
  const edge = (x, y) => get(x, y) !== '.' && (get(x - 1, y) === '.' || get(x + 1, y) === '.' || get(x, y - 1) === '.');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (edge(x, y) && y < B - 3 && r() < 0.12) put(x, y, '.');
  // Le coin de la corniche, à droite : un bloc manque
  for (let y = T - 1; y < T + 4; y++) for (let x = FW - 5; x < FW + 2; x++) if (y < T + 3 - (x - FW + 5) * 0.4 && get(x, y) !== '.' && r() < 0.8) put(x, y, '.');
  for (let k = 0; k < 4; k++) {
    let x = 2 + Math.floor(r() * (FW - 4)), y = T + 14 + Math.floor(r() * (FH - 30));
    for (let m = 0; m < 6 + Math.floor(r() * 8); m++) {
      if (get(x, y) === 'b') put(x, y, 'k');
      y++; x += r() < 0.4 ? (r() < 0.5 ? -1 : 1) : 0;
    }
  }
  // La neige accrochée : sur la corniche, la frise, la marche du socle
  for (let x = 0; x < FW; x++) {
    if (get(x, T + 6) === 'b' && r() < 0.45) put(x, T + 6, 's');
    if (get(x, B - 2) === 'b' && r() < 0.55) put(x, B - 2, 's');
  }
  return { rows: g.map(row => row.join('')), foot: B, depth: D.y };
}

// Les trois tranches, posées au pied (x, y) : le coin avant gauche du socle
export function archParts(x, y, seed, opts = {}) {
  const art = makeArch(seed, opts), O = opts.open || ARCH_OPEN, D = opts.depth || ARCH_DEPTH;
  const cut = [[0, O.x0, 'arch', D.y], [O.x0, O.x1, 'arch-vault', 0], [O.x1, art.rows[0].length, 'arch', D.y]];
  return cut.map(([a, b, type, foot]) => ({
    type, x: x + a, y, foot, noShadow: type === 'arch-vault',
    art: { rows: art.rows.map(row => row.slice(a, b)), ax: 0 },
  })).concat(rubble(x, y, seed, (opts.fw || ARCH_FW) / ARCH_FW));
}

// Des pierres tombées de la corniche, au pied (on marche dessus)
export function rubble(x, y, seed, scale = 1) {
  const r = rng(seed * 3 + 1), out = [];
  const spots = [[-8, 4], [-4, 9], [6, 12], [20, 10], [40, 6], [52, 1], [58, 8], [-12, -3]];
  for (const [sx, sy] of spots) {
    const dx = Math.round(sx * scale), dy = Math.round(sy * scale);
    if (r() < 0.25) continue;
    const w = 2 + Math.floor(r() * 4), h = 1 + Math.floor(r() * 2);
    const rows = Array.from({ length: h + 1 }, (_, j) => Array.from({ length: w }, (_, i) =>
      j === 0 ? (i === 0 || i === w - 1 ? '.' : 's') : (r() < 0.15 ? 'k' : 'b')).join(''));
    out.push({ type: 'rubble', x: x + dx + Math.floor(r() * 3), y: y + dy, foot: 0, art: { rows, ax: 0 } });
  }
  // Et des éclats d'un pixel
  for (let k = 0; k < 7; k++) out.push({ type: 'rubble', x: x - 10 + Math.floor(r() * 75 * scale), y: y + 1 + Math.floor(r() * 14 * scale), foot: 0, art: { rows: ['b'], ax: 0 } });
  return out;
}

// L'arche en ruine : plus petite (six ou sept fois le viking), le haut droit effondré
export const RUIN_ARCH = { fw: 34, fh: 58, depth: { x: 8, y: 5 }, open: { x0: 11, x1: 23, spring: 27, r: 6 }, ruin: true };
