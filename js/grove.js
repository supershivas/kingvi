/* Au milieu de la forêt noire, dans une clairière : le bosquet sacré. Un
   arbre mort immense, noueux, chargé d'offrandes qui pendent et tournent au
   vent ; et, de l'autre côté, une silhouette qui regarde passer le viking,
   puis s'efface quand il approche. b sombre, s neige. */

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// L'arbre : un tronc épais et tordu, des branches qui se divisent en
// s'amincissant, jamais droites. `hooks` : là où pendent les offrandes.
export function makeGroveTree(seed = 9) {
  const r = rng(seed), W = 92, H = 72;
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const put = (x, y, c = 'b') => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; };
  const hooks = [];
  function branch(x, y, angle, len, width, depth) {
    for (let i = 0; i < len; i++) {
      angle += (r() - 0.5) * 0.5;                      // la branche se tord
      x += Math.cos(angle); y += Math.sin(angle);
      for (let k = 0; k < width; k++) put(x + k * Math.sin(angle) * 0.9, y - k * Math.cos(angle) * 0.2);
      if (width <= 1 && i === len - 1 && depth > 0) put(x, y - 1, 's');   // de la neige au bout
    }
    // La neige posée sur le dessus des grosses branches
    if (width >= 2 && Math.sin(angle) > -0.6) put(x, y - 1, 's');
    if (depth <= 0) {
      if (y < H - 18 && x > 2 && x < W - 3 && r() < 0.7) hooks.push({ x: Math.round(x), y: Math.round(y) + 1 });
      return;
    }
    const n = 2 + (r() < 0.4 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      branch(x, y, angle + (k - (n - 1) / 2) * (0.5 + r() * 0.5), Math.max(2, len * (0.55 + r() * 0.25)), Math.max(1, width - 1), depth - 1);
    }
  }
  // Le tronc, penché, avec ses racines qui mordent la neige
  const bx = W / 2, by = H - 1;
  for (const [dx, a] of [[-3, Math.PI * 0.95], [3, Math.PI * 0.05], [-1, Math.PI * 0.7]]) {
    let x = bx + dx, y = by;
    for (let i = 0; i < 6; i++) { x += Math.cos(a) + (r() - 0.5) * 0.6; y -= 0.3; put(x, y); }
  }
  branch(bx, by, -Math.PI / 2 - 0.12, 24, 5, 4);
  // Les offrandes pendent aux branches les plus basses, bien réparties
  hooks.sort((a, b) => b.y - a.y);
  const picked = [];
  for (const h of hooks) if (picked.length < 4 && picked.every(p => Math.abs(p.x - h.x) >= 4)) picked.push(h);
  return { rows: g.map(row => row.join('')), ax: Math.round(bx), hooks: picked };
}

// Les offrandes : des ballots enveloppés, pendus à une corde
export const BUNDLE = ['.b.', 'bbb', 'bbb', '.bb', '.b.'];

// Le guetteur : plus grand que le viking, maigre, encapuchonné ; le bas de
// son manteau s'effiloche (tramé)
export const WATCHER = [
  '..bb..',
  '.bbbb.',
  '.bbbb.',
  '..bb..',
  '.bbbb.',
  'bbbbbb',
  '.bbbb.',
  '.bbbb.',
  '.bbbb.',
  '.bbbbb',
  'bbbbb.',
  '.b.bb.',
  'b.b.b.',
];
