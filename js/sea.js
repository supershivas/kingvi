/* La mer bouge : des rouleaux arrivent sur la grève (une ligne d'écume qui
   avance, s'amincit, s'étale en nappe puis se retire), et au large de rares
   moutons naissent, filent avec le vent et s'éteignent.
   Partagé jeu/labo : on passe la fonction de côte (négative sur terre,
   positive en mer, ~0.0007 par pixel près du rivage) et une fonction qui pose
   un pixel clair (x, y, opacité). */

const PER_PX = 0.0007;      // pente de la côte : c / PER_PX ≈ distance au rivage
const SURF_REACH = 14;      // les rouleaux se forment à ~14 px du bord
const PERIOD = 5.5;         // secondes entre deux rouleaux
const TILE = 128;           // cache des pixels du rivage, par carreau
const CAP = { w: 36, h: 14 }; // une cellule du large = au plus un mouton

function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function smooth(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// `caps` : part des cellules du large qui ont leur mouton (l'accueil, en pleine
// mer, en veut davantage)
export function createSea(coast, { caps = 0.42 } = {}) {
  const tiles = new Map();
  const open = new Map();

  // Pixels de mer près du rivage d'un carreau : [x, y, distance, retard]
  function shore(tx, ty) {
    const key = `${tx},${ty}`;
    let list = tiles.get(key);
    if (list) return list;
    list = [];
    const x0 = tx * TILE, y0 = ty * TILE;
    // Un carreau loin de toute côte : rien (test grossier sur une grille)
    let near = false;
    for (let y = 0; y <= TILE && !near; y += 16) for (let x = 0; x <= TILE; x += 16) {
      if (Math.abs(coast(x0 + x, y0 + y)) < 0.02) { near = true; break; }
    }
    if (near) {
      for (let y = y0; y < y0 + TILE; y++) for (let x = x0; x < x0 + TILE; x++) {
        const c = coast(x, y);
        if (c > 0 && c < (SURF_REACH + 1) * PER_PX) {
          // Le retard varie le long de la côte : les rouleaux n'arrivent pas partout ensemble
          list.push(x, y, c / PER_PX, smooth(x / 46, y / 46, 5) * 1.6 + hash(x >> 3, y >> 2, 6) * 0.08);
        }
      }
    }
    list = Float32Array.from(list);
    tiles.set(key, list);
    return list;
  }

  // Au large : une cellule a-t-elle son mouton, et où ?
  function cap(cx, cy) {
    const key = `${cx},${cy}`;
    if (open.has(key)) return open.get(key);
    let m = null;
    if (hash(cx, cy, 11) < caps) {
      const x = cx * CAP.w + Math.floor(hash(cx, cy, 12) * CAP.w), y = cy * CAP.h + Math.floor(hash(cx, cy, 13) * CAP.h);
      if (coast(x, y) > (SURF_REACH + 4) * PER_PX) m = { x, y, period: 4 + hash(cx, cy, 14) * 4, phase: hash(cx, cy, 15) * 10, len: 2 + Math.floor(hash(cx, cy, 16) * 3) };
    }
    open.set(key, m);
    return m;
  }

  // Dessine la vue (x, y, w, h) au temps t (secondes). drift : poussée du vent.
  function draw(view, t, put, drift = 1) {
    const x1 = view.x + view.w, y1 = view.y + view.h;
    // Rouleaux et nappes, sur la grève
    for (let ty = Math.floor(view.y / TILE); ty * TILE < y1; ty++) {
      for (let tx = Math.floor(view.x / TILE); tx * TILE < x1; tx++) {
        const L = shore(tx, ty);
        for (let i = 0; i < L.length; i += 4) {
          const x = L[i], y = L[i + 1];
          if (x < view.x || y < view.y || x >= x1 || y >= y1) continue;
          const d = L[i + 2];
          const k = ((t / PERIOD + L[i + 3]) % 1 + 1) % 1;   // 0 → 1 : vie d'un rouleau
          if (k < 0.62) {
            // Le rouleau avance vers le bord, en ralentissant ; ligne brisée
            const front = SURF_REACH * (1 - Math.sqrt(k / 0.62));
            const gap = Math.abs(d - front);
            if (gap < 0.7 && hash(x, y >> 1, Math.floor(t / PERIOD + L[i + 3])) < 0.92 - k * 0.4) put(x, y, 0.9);
            else if (gap < 1.6 && d > front && hash(x, y, 9) < 0.18) put(x, y, 0.45);   // l'écume qu'il traîne
          } else {
            // Il s'est brisé : une nappe mince qui se retire en s'effilochant
            const w = (k - 0.62) / 0.38;
            const reach = 2.4 * (1 - w);
            if (d < reach && hash(x, y, 17 + Math.floor(t * 3)) < 0.55 * (1 - w)) put(x, y, 0.8);
          }
        }
      }
    }
    // Moutons au large : une crête qui s'allonge, glisse avec le vent, s'éteint
    for (let cy = Math.floor(view.y / CAP.h); cy * CAP.h < y1; cy++) {
      for (let cx = Math.floor((view.x - 20) / CAP.w); cx * CAP.w < x1; cx++) {
        const m = cap(cx, cy);
        if (!m) continue;
        const k = ((t + m.phase) / m.period) % 1;
        if (k > 0.45) continue;
        const life = Math.sin(k / 0.45 * Math.PI);            // 0 → 1 → 0
        const len = Math.max(1, Math.round(m.len * life));
        const x = Math.round(m.x + k * 8 * drift), y = m.y;
        if (coast(x, y) <= (SURF_REACH + 2) * PER_PX) continue;
        for (let j = 0; j < len; j++) put(x + j, y, 0.35 + 0.55 * life);
        if (life > 0.7 && m.len > 3) put(x + 1, y - 1, 0.5);   // la crête se soulève
      }
    }
  }

  return { draw };
}
