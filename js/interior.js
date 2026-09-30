/* L'intérieur de la maison : une pièce vue de haut et de biais, comme la
   maison, murs du fond relevés, murs de devant coupés. Tout autour, le noir.
   Sur le plancher, un cadavre, une flaque de sang, des traînées jusqu'à la
   porte. Couleurs : b sombre, s clair, r sang, k noir du dehors.

   Le sol est repéré en (u, v) : u le long du mur du fond gauche (L → T),
   v le long du mur de devant gauche (L → B, où s'ouvre la porte). */

export const ROOM_W = 150;
export const ROOM_H = 100;
const WALL = 22;
const L = [10, 52], A = [60, -30], B = [70, 36];            // coin gauche, axes u et v
// La porte : sur le bord u = 0, entre v0 et v1
export const ROOM_DOOR = { v0: 0.52, v1: 0.72 };

export const floorPoint = (u, v) => [L[0] + A[0] * u + B[0] * v, L[1] + A[1] * u + B[1] * v];
const DET = A[0] * B[1] - A[1] * B[0];
export function floorUV(x, y) {
  const dx = x - L[0], dy = y - L[1];
  return { u: (dx * B[1] - dy * B[0]) / DET, v: (A[0] * dy - A[1] * dx) / DET };
}

// Meubles : rectangles du sol (u0, u1, v0, v1) qu'on ne traverse pas
export const ROOM_BLOCKS = [
  { name: 'âtre', u0: 0.82, u1: 1, v0: 0, v1: 0.2, h: 8 },
  { name: 'lit', u0: 0.74, u1: 0.98, v0: 0.5, v1: 0.84, h: 3 },
  { name: 'table', u0: 0.28, u1: 0.44, v0: 0.62, v1: 0.8, h: 6 },
];
// Le corps, au milieu de la pièce
const BODY = { u: 0.5, v: 0.34 };

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inPoly(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function makeRoom() {
  const r = rng(4242);
  const g = Array.from({ length: ROOM_H }, () => Array(ROOM_W).fill('k'));
  const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < ROOM_W && y < ROOM_H) g[y][x] = c; };
  const line = ([x0, y0], [x1, y1], c, dotted = 0) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) if (!dotted || i % dotted) put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
  };
  const up = ([x, y], h) => [x, y - h];
  const P = floorPoint;
  const Lp = P(0, 0), Tp = P(1, 0), Rp = P(1, 1), Bp = P(0, 1);

  // Murs du fond : planches sombres, joints clairs, arête haute claire
  const walls = [[Lp, Tp, up(Tp, WALL), up(Lp, WALL)], [Tp, Rp, up(Rp, WALL), up(Tp, WALL)]];
  for (let y = 0; y < ROOM_H; y++) for (let x = 0; x < ROOM_W; x++) {
    if (walls.some(w => inPoly(w, x + 0.5, y + 0.5))) g[y][x] = 'b';
  }
  for (let k = 0.08; k < 1; k += 0.08) {
    line(P(k, 0), up(P(k, 0), WALL), 's', 3);
    line(P(1, k), up(P(1, k), WALL), 's', 3);
  }
  line(up(Lp, WALL), up(Tp, WALL), 's'); line(up(Tp, WALL), up(Rp, WALL), 's');
  line(Tp, up(Tp, WALL), 's');
  // Une fenêtre sur le mur du fond gauche : un carreau noir, comme la nuit dehors
  for (let k = 0.28; k <= 0.4; k += 0.01) for (let h = 9; h <= 15; h++) put(...up(P(k, 0), h), 'k');
  for (let k = 0.27; k <= 0.41; k += 0.01) { put(...up(P(k, 0), 8), 's'); put(...up(P(k, 0), 16), 's'); }

  // Plancher : clair, lames sombres en pointillé
  const floor = [Lp, Tp, Rp, Bp];
  for (let y = 0; y < ROOM_H; y++) for (let x = 0; x < ROOM_W; x++) if (inPoly(floor, x + 0.5, y + 0.5)) g[y][x] = 's';
  for (let k = 0.1; k < 1; k += 0.1) line(P(0, k), P(1, k), 'b', 4);

  // Murs de devant, coupés : un liseré sombre, interrompu par la porte
  for (let k = 0; k <= 1; k += 0.005) {
    if (k < ROOM_DOOR.v0 || k > ROOM_DOOR.v1) { put(...P(0, k), 'b'); put(...P(0, k).map((c, i) => c + [-1, 1][i]), 'b'); }
    put(...P(k, 1), 'b'); put(...P(k, 1).map((c, i) => c + [0, 1][i]), 'b');
  }
  // Neige soufflée par la porte
  for (let i = 0; i < 40; i++) {
    const v = ROOM_DOOR.v0 + r() * (ROOM_DOOR.v1 - ROOM_DOOR.v0), u = r() * r() * 0.12;
    put(...P(u, v), 's');
  }

  // Meubles : dessus clair cerné de sombre, faces avant sombres
  for (const m of ROOM_BLOCKS) {
    const base = [P(m.u0, m.v0), P(m.u1, m.v0), P(m.u1, m.v1), P(m.u0, m.v1)];
    const top = base.map(p => up(p, m.h));
    for (let y = 0; y < ROOM_H; y++) for (let x = 0; x < ROOM_W; x++) {
      const fx = x + 0.5, fy = y + 0.5;
      // faces avant (côté v1 et côté u0) : du bas au dessus
      if (inPoly([base[3], base[2], top[2], top[3]], fx, fy) || inPoly([base[0], base[3], top[3], top[0]], fx, fy)) g[y][x] = 'b';
    }
    for (let y = 0; y < ROOM_H; y++) for (let x = 0; x < ROOM_W; x++) if (inPoly(top, x + 0.5, y + 0.5)) g[y][x] = m.name === 'âtre' ? 'b' : 's';
    for (let i = 0; i < 4; i++) line(top[i], top[(i + 1) % 4], 'b');
    if (m.name === 'âtre') {
      // Pierres de l'âtre, cendres froides
      for (let i = 0; i < 18; i++) put(...up(P(m.u0 + r() * (m.u1 - m.u0), m.v0 + r() * (m.v1 - m.v0)), m.h), 's');
    }
    if (m.name === 'lit') {
      // Couverture repoussée : quelques plis sombres
      for (let k = 0; k < 6; k++) line(up(P(m.u0 + 0.02, m.v0 + 0.05 * k + 0.05), m.h), up(P(m.u1 - 0.06, m.v0 + 0.05 * k + 0.08), m.h), 'b', 2);
    }
  }
  // Tabouret renversé, près de la table
  const st = P(0.5, 0.72);
  for (const [dx, dy] of [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [1, -1]]) put(st[0] + dx, st[1] + dy, 'b');

  // Le sang : une flaque sous le corps, des éclaboussures, une traînée vers la porte
  const [bx, by] = P(BODY.u, BODY.v);
  for (let y = -6; y <= 6; y++) for (let x = -10; x <= 10; x++) {
    const a = Math.atan2(y, x), d = Math.hypot(x / 1.6, y);
    if (d < 4.2 + 1.3 * Math.sin(a * 3 + 1) + 0.8 * Math.sin(a * 7)) put(bx + x + 2, by + y + 3, 'r');
  }
  for (let i = 0; i < 22; i++) {
    const a = r() * Math.PI * 2, d = 7 + r() * 9;
    put(bx + Math.cos(a) * d * 1.5, by + Math.sin(a) * d, 'r');
  }
  const door = P(0.02, (ROOM_DOOR.v0 + ROOM_DOOR.v1) / 2);
  for (let k = 0.1; k < 1; k += 0.035) {
    const x = bx + (door[0] - bx) * k + (r() - 0.5) * 3, y = by + 4 + (door[1] - by - 4) * k + (r() - 0.5) * 3;
    if (r() < 0.7) put(x, y, 'r');
    // Pas ensanglantés, par paires
    if (Math.round(k * 100) % 7 === 0) { put(x + 2, y - 1, 'r'); put(x + 3, y - 1, 'r'); }
  }

  // Le corps : couché de tout son long, un bras jeté de côté
  const CORPSE = [
    '...bb.........',
    '..bbbb....b...',
    '..bbbbbbbbbbb.',
    '.bbbbbbbbbbbbb',
    '..bbbbbbbbb.bb',
    '...bb....b....',
    '..bb......bb..',
  ];
  CORPSE.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'b') put(bx - 7 + x, by - 3 + y, 'b'); }));
  put(bx - 5, by - 2, 's');                                  // un reflet sur le casque

  return g.map(row => row.join(''));
}

export const ROOM = makeRoom();

// Peut-on marcher là (coordonnées locales de la pièce) ?
export function roomWalkable(x, y) {
  const { u, v } = floorUV(x, y);
  // Dans l'embrasure de la porte, on peut aller jusqu'au seuil
  const inDoor = v > ROOM_DOOR.v0 + 0.02 && v < ROOM_DOOR.v1 - 0.02;
  if (u < (inDoor ? -0.04 : 0.03) || u > 0.97 || v < 0.03 || v > 0.97) return false;
  return !ROOM_BLOCKS.some(m => u > m.u0 - 0.02 && u < m.u1 + 0.02 && v > m.v0 - 0.02 && v < m.v1 + 0.02);
}

// Est-on dans l'embrasure de la porte (pour ressortir) ?
export function atRoomDoor(x, y) {
  const { u, v } = floorUV(x, y);
  return u < -0.01 && v > ROOM_DOOR.v0 && v < ROOM_DOOR.v1;
}

// Là où l'on se tient en entrant
export const ROOM_ENTRY = (() => {
  const [x, y] = floorPoint(0.08, (ROOM_DOOR.v0 + ROOM_DOOR.v1) / 2);
  return { x: Math.round(x), y: Math.round(y) };
})();
