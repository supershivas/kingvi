/* Propositions de décor, pour le labo (à choisir avant d'entrer dans le jeu) :
   la nécropole (relecture de Lindholm Høje : enceintes de pierres en forme de
   navire, triangles, cercles, tertres), le ponton de l'accostage et la seconde
   barque. Chaque générateur renvoie des lignes de pixels (b sombre, s neige,
   k noir, . vide). */

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const blank = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
const rows = g => g.map(r => r.join(''));
function put(g, x, y, c) { x = Math.round(x); y = Math.round(y); if (g[y] && x >= 0 && x < g[0].length) g[y][x] = c; }

// Une pierre levée : sombre, coiffée de neige, parfois penchée ou enfoncée
function stone(g, x, y, h, r) {
  const lean = r() < 0.3 ? (r() < 0.5 ? -1 : 1) : 0;
  const w = h > 4 ? 2 : 1 + (r() < 0.5 ? 1 : 0);
  for (let k = 0; k < h; k++) for (let i = 0; i < w; i++) put(g, x + i + (k > h / 2 ? 0 : lean), y - k, k === h - 1 ? 's' : 'b');
  put(g, x - 1, y, 's');                                   // la neige amassée au pied
}

// ── Nécropole ──
// A. Enceinte en forme de navire : un ovale aux deux bouts pointus, les
// pierres des étraves plus hautes
export function shipSetting(seed = 1, len = 64, beam = 16) {
  const r = rng(seed), W = len + 6, H = beam + 10, g = blank(W, H);
  const n = Math.round(len / 3.2), placed = [];
  for (let k = 0; k < n * 2; k++) {
    const t = (k % n) / (n - 1), side = k < n ? -1 : 1;
    const x = 3 + t * len, half = beam / 2 * Math.pow(Math.sin(Math.PI * t), 0.8);
    const y = H - 4 - beam / 2 + side * half;
    const stem = Math.abs(t - 0.5) > 0.44;
    if (!stem && r() < 0.12) continue;                       // pierre disparue
    placed.push([x, y, stem ? 6 + Math.round(r() * 2) : 2 + Math.round(r() * 2)]);
  }
  placed.sort((a, b) => a[1] - b[1]).forEach(([x, y, h]) => stone(g, x, y, h, r));
  return rows(g);
}

// B. Triangle de pierres (trois côtés, une pierre plus haute au sommet)
export function triangleSetting(seed = 2, size = 30) {
  const r = rng(seed), W = size + 8, H = Math.round(size * 0.55) + 10, g = blank(W, H);
  const A = [4, H - 3], B = [W - 4, H - 3], C = [W / 2, H - 3 - size * 0.45];
  const pts = [];
  for (const [P, Q] of [[A, B], [B, C], [C, A]]) {
    const n = Math.round(Math.hypot(Q[0] - P[0], Q[1] - P[1]) / 3.5);
    for (let k = 0; k < n; k++) pts.push([P[0] + (Q[0] - P[0]) * k / n, P[1] + (Q[1] - P[1]) * k / n, k === 0 && P === C ? 7 : 2 + Math.round(r() * 2)]);
  }
  pts.sort((a, b) => a[1] - b[1]).forEach(([x, y, h]) => stone(g, x, y, h, r));
  return rows(g);
}

// C. Cercle de pierres, une grande pierre au centre
export function stoneCircle(seed = 3, rad = 14) {
  const r = rng(seed), W = rad * 2 + 8, H = Math.round(rad * 1.1) + 12, g = blank(W, H);
  const cx = W / 2, cy = H - 4 - rad * 0.45, pts = [];
  const n = Math.round(rad * 0.9);
  for (let k = 0; k < n; k++) {
    const a = k / n * Math.PI * 2;
    if (r() < 0.1) continue;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.45, 2 + Math.round(r() * 2)]);
  }
  pts.push([cx, cy, 8]);
  pts.sort((a, b) => a[1] - b[1]).forEach(([x, y, h]) => stone(g, x, y, h, r));
  return rows(g);
}

// D. Tertre : un monticule enneigé, un anneau de pierres à sa base, une
// pierre runique devant
export function mound(seed = 4, w = 44) {
  const r = rng(seed), W = w + 8, H = 26, g = blank(W, H);
  const cx = W / 2, base = H - 5;
  for (let x = 0; x < W; x++) {
    const d = (x - cx) / (w / 2);
    if (Math.abs(d) > 1) continue;
    const top = base - Math.round(11 * Math.sqrt(1 - d * d));
    for (let y = top; y <= base; y++) {
      // neige ; un flanc à l'ombre, tramé, du côté opposé au jour
      const shade = d > 0.25 && (x + y) % 2 === 0 && y > top + 1;
      put(g, x, y, y === top || !shade ? 's' : 'b');
    }
    put(g, x, top - 1, '.');
    if (Math.abs(d) > 0.2 || r() < 0.3) put(g, x, top, 'b');   // l'arête, soulignée
  }
  const pts = [];
  for (let k = 0; k < 14; k++) {
    const a = Math.PI * (0.05 + 0.9 * k / 13);
    pts.push([cx - Math.cos(a) * (w / 2 + 1), base + 1 + Math.sin(a) * 2, 2]);
  }
  pts.forEach(([x, y, h]) => stone(g, x, y, h, r));
  // La pierre runique : haute, des entailles claires
  for (let k = 0; k < 9; k++) for (let i = 0; i < 3; i++) put(g, cx - 14 + i, H - 2 - k, k === 8 ? 's' : (k % 3 === 1 && i === 1) ? 's' : 'b');
  return rows(g);
}

// E. Le champ des morts : plusieurs navires de pierre sur une pente, de
// tailles diverses, quelques cercles, des pierres à moitié ensevelies
export function necropolis(seed = 5) {
  const r = rng(seed), W = 200, H = 70, g = blank(W, H);
  const stamp = (src, x0, y0) => src.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') put(g, x0 + x, y0 + y, c); }));
  const items = [
    [shipSetting(11, 58, 14), 6, 8], [shipSetting(12, 40, 11), 104, 2], [stoneCircle(13, 9), 70, 26],
    [shipSetting(14, 70, 18), 110, 34], [triangleSetting(15, 22), 22, 40], [stoneCircle(16, 7), 170, 12],
  ];
  items.sort((a, b) => a[2] - b[2]).forEach(([src, x, y]) => stamp(src, x, y));
  for (let k = 0; k < 18; k++) put(g, Math.floor(r() * W), 10 + Math.floor(r() * (H - 12)), 'b');   // pierres isolées
  return rows(g);
}

// ── Pontons (à l'accostage, sur la grève ouest) ──
// Tous dessinés la terre à droite, la mer à gauche ; `shore` : colonne du bord.
// A. Un ponton de planches sur pilotis
export function jetty(len = 60) {
  const W = len + 4, H = 16, g = blank(W, H);
  for (let x = 0; x < len; x++) {
    for (let y = 5; y <= 8; y++) put(g, x + 2, y, x % 4 === 3 ? 'b' : 's');   // planches, joints sombres
    put(g, x + 2, 9, 'b');                                                      // la tranche, dans l'ombre
    if (x % 12 === 2) for (let y = 10; y <= 13; y++) put(g, x + 2, y, 'k');    // pieux
  }
  return rows(g);
}
// B. Le même, rompu : planches manquantes, pieux penchés au bout
export function brokenJetty(len = 60, seed = 6) {
  const r = rng(seed), W = len + 4, H = 18, g = blank(W, H);
  for (let x = 0; x < len; x++) {
    const gone = x < len * 0.35 ? r() < 0.55 : r() < 0.08;
    if (!gone) { for (let y = 5; y <= 8; y++) put(g, x + 2, y, x % 4 === 3 ? 'b' : 's'); put(g, x + 2, 9, 'b'); }
    if (x % 12 === 2) {
      const lean = x < len * 0.35 ? Math.round((r() - 0.5) * 4) : 0;
      for (let y = gone ? 6 : 10; y <= 14; y++) put(g, x + 2 + Math.round(lean * (14 - y) / 8), y, 'k');
    }
  }
  return rows(g);
}
// C. Un môle de pierres entassées, la neige sur le dessus
export function stonePier(len = 56, seed = 7) {
  const r = rng(seed), W = len + 4, H = 16, g = blank(W, H);
  // Des blocs de 3 à 6 pixels, sombres, la neige sur le dessus de chacun
  for (let x = 0; x < len;) {
    const w = 3 + Math.floor(r() * 4), top = 4 + Math.floor(r() * 3);
    for (let i = 0; i < w && x + i < len; i++) {
      for (let y = top; y <= 12; y++) put(g, x + 2 + i, y, y <= top + (i > 0 && i < w - 1 ? 1 : 0) ? 's' : 'b');
      if (r() < 0.2) put(g, x + 2 + i, top + 3 + Math.floor(r() * 5), 'k');
    }
    x += w;
  }
  return rows(g);
}
// D. Des pieux d'amarrage dans l'eau, une corde jusqu'à la barque
export function mooringPosts(len = 50) {
  const W = len + 4, H = 18, g = blank(W, H);
  const posts = [4, len * 0.45, len - 6];
  for (const p of posts) for (let y = 3; y <= 14; y++) put(g, p, y, y === 3 ? 's' : 'k');
  for (let x = posts[0]; x <= posts[2]; x++) {
    const t = (x - posts[0]) / (posts[2] - posts[0]);
    put(g, x, 5 + Math.round(3 * Math.sin(t * Math.PI * 2) ** 2), 's');           // la corde qui pend
  }
  return rows(g);
}

// ── La seconde barque ──
// A. Une jumelle, tirée plus haut sur la grève (la coque de la première)
export const twinBoat = boat => boat;
// B. Retournée sur la neige, quille en l'air, la neige sur le ventre
export function overturned(boat) {
  const H = boat.length;
  const flipped = boat.slice().reverse().map(r => r.replace(/s/g, 'k'));
  // La neige sur le dessus : le premier pixel plein de chaque colonne
  const g = flipped.map(r => [...r]);
  for (let x = 0; x < g[0].length; x++) {
    for (let y = 0; y < H; y++) if (g[y][x] !== '.') {
      // Deux ou trois rangs de neige sur le ventre de la coque, qui s'effilochent
      const depth = 2 + (x % 4 === 0 ? 1 : 0) - (x % 7 === 0 ? 1 : 0);
      for (let k = 0; k < depth; k++) if (g[y + k]?.[x] && g[y + k][x] !== '.') g[y + k][x] = 's';
      break;
    }
  }
  return rows(g);
}
// C. À demi coulée : seules l'étrave et la poupe crèvent l'eau
export function sunken(boat, waterline) {
  const W = boat[0].length;
  return boat.map((r, y) => [...r].map((c, x) => {
    if (c === '.') return '.';
    const end = x < W * 0.22 || x > W * 0.8;
    return y < waterline - (end ? 0 : 6) ? c : '.';
  }).join(''));
}
// D. La petite barque (celle du lac), tirée sur la grève, vide
export const skiff = small => small;
