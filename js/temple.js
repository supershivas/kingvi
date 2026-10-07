/* Le temple de Nortia, sous l'arche : des marches qui descendent dans la
   roche, une salle basse, et au fond le mur des ans, hérissé de clous, un par
   hiver depuis l'arrivée des Rasna. Le dernier est planté à l'envers, la
   pointe vers l'année qui venait : rouge, à hauteur d'homme. L'arracher
   rend le temps à l'île (la fin de l'Aube, game.js : `pullNail`).
   Rien de droit : le sol est une flaque cabossée, le mur un front de roche
   mangé d'ombre, les marches usées au milieu.
   Couleurs : b pierre sombre, s pierre éclairée et têtes de clous, k noir,
   r le clou à l'envers. */

export const TEMPLE_W = 150;
export const TEMPLE_H = 112;
const C = { x: 75, y: 62, rx: 50, ry: 19 };            // le sol
const STAIR = { x0: 67, x1: 83, y0: 78, y1: 106 };      // les marches, du sol à la sortie
export const TEMPLE_ENTRY = { x: 75, y: 96 };
// Le clou à l'envers : au milieu du mur, à hauteur d'homme
export const NAIL = { x: 75, y: 34 };

function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function floorD(x, y) {
  const dx = (x - C.x) / C.rx, dy = (y - C.y) / C.ry, a = Math.atan2(dy, dx);
  return Math.hypot(dx, dy) / (1 + 0.09 * Math.sin(a * 3 + 2) + 0.06 * Math.sin(a * 7 + 1) + 0.03 * Math.sin(a * 13));
}
// Les marches : un boyau qui s'élargit en descendant, bords irréguliers
function inStair(x, y) {
  if (y < STAIR.y0 - 4 || y > STAIR.y1) return false;
  const t = (y - STAIR.y0) / (STAIR.y1 - STAIR.y0);
  const w = 7.5 - 2.5 * t + (hash(0, y >> 1, 41) - 0.5) * 1.5;
  return Math.abs(x - (STAIR.x0 + STAIR.x1) / 2 - Math.sin(y * 0.2) * 1.2) < w;
}

export function makeTemple() {
  const g = Array.from({ length: TEMPLE_H }, () => Array(TEMPLE_W).fill('k'));
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < TEMPLE_W && y < TEMPLE_H) g[y][x] = c; };
  // Le mur des ans : au-dessus du sol, haut et inégal, qui se perd dans le noir
  for (let x = 0; x < TEMPLE_W; x++) {
    let top = -1;
    for (let y = 0; y < TEMPLE_H; y++) if (floorD(x, y) < 1) { top = y; break; }
    if (top < 0) continue;
    const wall = 30 + Math.round(6 * Math.sin(x * 0.09 + 2) + 4 * hash(x >> 3, 0, 5));
    for (let y = top - wall; y < top; y++) {
      const fade = Math.max(0, (Math.abs(x - C.x) - C.rx * 0.7) / (C.rx * 0.35));
      if (hash(x, y, 9) < fade * 0.9 && (x + y) % 2) continue;
      put(x, y, y === top - wall && hash(x, 1, 3) < 0.6 ? 's' : 'b');
    }
    // Les clous : une tête claire, un pixel sur cinq ou six, en rangées qui ondulent
    for (let y = top - wall + 3; y < top - 2; y++) {
      const row = Math.round(y + Math.sin(x * 0.21) * 0.8);
      if (row % 3 !== 0) continue;
      if ((x + row / 3) % 2 === 0 && hash(x, row, 17) < 0.55 && g[y][x] === 'b') put(x, y, 's');
    }
  }
  // Le trou du clou (le clou lui-même est une image à part : NAIL_ART)
  put(NAIL.x, NAIL.y, 'k'); put(NAIL.x, NAIL.y + 1, 'k');
  // Autour, une auréole de clous arrachés jadis, plus sombre
  for (let j = -4; j <= 4; j++) for (let i = -5; i <= 5; i++) {
    const x = NAIL.x + i, y = NAIL.y + j;
    if ((i || j) && Math.hypot(i, j * 1.3) < 5 && g[y]?.[x] === 's' && hash(x, y, 23) < 0.5) put(x, y, 'b');
  }
  // Le sol : de grandes dalles usées, joints sombres, bord mangé d'ombre
  for (let y = 0; y < TEMPLE_H; y++) for (let x = 0; x < TEMPLE_W; x++) {
    const d = floorD(x, y), st = inStair(x, y);
    if (d >= 1 && !st) continue;
    if (st && y > STAIR.y0) {
      // Les marches : un nez clair tous les trois pixels, creusé au milieu
      const step = (y - STAIR.y0) % 3 === 0;
      const mid = Math.abs(x - (STAIR.x0 + STAIR.x1) / 2) < 3;
      put(x, y, step && !(mid && hash(x, y, 31) < 0.5) ? 's' : 'b');
      continue;
    }
    if (d > 0.88 && (x + y) % 2 === 0) { put(x, y, 'b'); continue; }
    const gx = Math.floor((x + Math.sin(y * 0.3) * 2) / 13), gy = Math.floor(y / 6);
    const joint = (x + Math.round(Math.sin(y * 0.3) * 2)) % 13 === 0 || y % 6 === 0;
    put(x, y, joint && hash(gx, gy, 37) < 0.8 ? 'b' : 's');
  }
  // Le bord du sol : une lèvre sombre
  for (let y = 1; y < TEMPLE_H - 1; y++) for (let x = 1; x < TEMPLE_W - 1; x++) {
    if (g[y][x] === 'k' || floorD(x, y) >= 1 || inStair(x, y)) continue;
    if ([[1, 0], [-1, 0], [0, 1]].some(([i, j]) => g[y + j][x + i] === 'k')) put(x, y, 'b');
  }
  // Le marteau des Rasna, posé au pied du mur ; des clous tombés
  for (const [x, y, c] of [[58, 45, 'b'], [59, 45, 'b'], [60, 45, 'b'], [61, 44, 'b'], [61, 46, 'b'], [62, 44, 'b'], [62, 45, 'b'], [62, 46, 'b'],
    [88, 49, 'b'], [91, 47, 'b'], [95, 52, 'b'], [52, 55, 'b'], [100, 58, 'b']]) put(x, y, c);
  return g.map(r => r.join(''));
}
export const TEMPLE = makeTemple();

// Le clou : la tête en bas, la pointe en l'air (planté à rebours)
export const NAIL_ART = ['r', 'r', 'r', 'rrr'];

// L'entrée, dehors, sous l'arche : une dalle (fermée par le sceau d'Aule) ou
// les marches qui descendent dans le noir
export const TEMPLE_SLAB = [
  '..bbbbbbbb...',
  '.bssssssssbb.',
  'bsbssbsssssb.',
  'bssssssbsssbb',
  '.bbbbbbbbbbb.',
];
export const TEMPLE_STAIRS = [
  '..bbbbbbbb...',
  '.bkkkkkkkkbb.',
  'bkssssssskkb.',
  'bkkkkkkkkkkbb',
  '.bksssssskb..',
  '..bbbbbbbb...',
];

export function templeWalkable(x, y) {
  if (inStair(x, y) && y > STAIR.y0 - 2) return Math.abs(x - (STAIR.x0 + STAIR.x1) / 2) < 5;
  if (floorD(x, y) > 0.86) return false;
  return true;
}
export const atTempleDoor = (x, y) => y > STAIR.y1 - 4;
export const nearNail = (x, y) => Math.abs(x - NAIL.x) < 12 && y < C.y - C.ry * 0.55 + 6;
