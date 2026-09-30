/* La crypte, dans la statue de l'îlot : une salle creusée plus que bâtie, noire
   tout autour. Rien de droit : le sol est une flaque de dalles inégales, le mur
   du fond un appareil de pierres brutes, le bord mangé d'ombre. Au fond, un
   coffre. On entre par le bas (la porte de la statue).
   Couleurs : b pierre sombre, s joints et pierre éclairée, k noir, r rubis. */

export const CRYPT_W = 120;
export const CRYPT_H = 90;
const C = { x: 60, y: 58, rx: 36, ry: 17 };            // le sol, une ellipse cabossée
const DOOR = { x0: 56, x1: 64, y: 80 };
export const CHEST = { x: 60, y: 47 };
export const CRYPT_ENTRY = { x: 60, y: 72 };

function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// Distance au bord du sol : < 1 dedans (bord bosselé, jamais une ellipse nette)
function floorD(x, y) {
  const dx = (x - C.x) / C.rx, dy = (y - C.y) / C.ry, a = Math.atan2(dy, dx);
  return Math.hypot(dx, dy) / (1 + 0.1 * Math.sin(a * 3 + 1) + 0.06 * Math.sin(a * 5 + 2) + 0.04 * Math.sin(a * 11));
}
// Cellules irrégulières (Voronoï) : `edge` petit près d'un joint
function cells(x, y, cw, ch, seed) {
  const gx = Math.floor(x / cw), gy = Math.floor(y / ch);
  let d1 = 1e9, d2 = 1e9;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = (gx + i + hash(gx + i, gy + j, seed)) * cw, cy = (gy + j + hash(gx + i, gy + j, seed + 1)) * ch;
    const d = Math.hypot((x - cx) / cw, (y - cy) / ch);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return d2 - d1;
}

export function makeCrypt() {
  const g = Array.from({ length: CRYPT_H }, () => Array(CRYPT_W).fill('k'));
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < CRYPT_W && y < CRYPT_H) g[y][x] = c; };
  // Pour chaque colonne : le haut du sol, et la hauteur (inégale) du mur au-dessus
  for (let x = 0; x < CRYPT_W; x++) {
    let top = -1;
    for (let y = 0; y < CRYPT_H; y++) if (floorD(x, y) < 1) { top = y; break; }
    if (top < 0) continue;
    const wall = 18 + Math.round(5 * Math.sin(x * 0.13 + 1) + 3 * hash(x >> 2, 0, 7));
    for (let y = top - wall; y < top; y++) {
      const e = cells(x, y, 8, 6, 11);
      put(x, y, y === top - wall ? 's' : e < 0.12 && (x + y) % 3 ? 's' : 'b');
    }
    // Le mur s'efface dans le noir sur les côtés
    if (Math.abs(x - C.x) > C.rx * 0.8) for (let y = top - wall; y < top; y++) if ((x + y) % 2 && hash(x, y, 13) < (Math.abs(x - C.x) - C.rx * 0.8) / (C.rx * 0.3)) put(x, y, 'k');
  }
  // Runes gravées au-dessus du coffre
  const RUNES = ['s.s.sss.s..s', 's.s..s..ss.s', '.s...s..s.ss', '.s...s..s..s'];
  RUNES.forEach((row, y) => [...row].forEach((c, x) => { if (c === 's') put(CHEST.x - 6 + x, CHEST.y - 16 + y, 'k'); }));
  // Sol : dalles de tailles inégales, joints sombres ; le bord mangé d'ombre
  for (let y = 0; y < CRYPT_H; y++) for (let x = 0; x < CRYPT_W; x++) {
    const d = floorD(x, y);
    const corridor = x > DOOR.x0 + (y - 70) * 0.2 && x < DOOR.x1 - (y - 70) * 0.1 && y > C.y && y <= DOOR.y;
    if (d >= 1 && !corridor) continue;
    if (d > 0.9 && !corridor && (x + y) % 2 === 0) { put(x, y, 'b'); continue; }
    const e = cells(x, y, 11, 7, 21);
    put(x, y, e < 0.1 ? 'b' : 's');
  }
  // Le bord : une lèvre de pierre sombre, interrompue par la porte
  for (let y = 1; y < CRYPT_H - 1; y++) for (let x = 1; x < CRYPT_W - 1; x++) {
    if (g[y][x] === 'k' || floorD(x, y) >= 1) continue;
    if (y > C.y && x > DOOR.x0 - 1 && x < DOOR.x1 + 1) continue;
    if ([[1, 0], [-1, 0], [0, 1]].some(([i, j]) => g[y + j][x + i] === 'k')) put(x, y, 'b');
  }
  // Ossements épars
  for (const [x, y] of [[33, 60], [34, 60], [35, 61], [85, 52], [86, 53], [88, 53], [40, 49], [41, 49], [74, 66]]) put(x, y, 'b');
  return g.map(r => r.join(''));
}
export const CRYPT = makeCrypt();

// Le coffre : fermé, entrouvert, ouvert (le fond noir, un éclat rouge)
export const CHEST_FRAMES = {
  closed: [
    '..bbbbbbbbb..',
    '.bbsbbbbbsbb.',
    'bbbsbbbbbsbbb',
    'sssssssssssss',
    'bbbsbbbbbsbbb',
    'bbbsbssbbsbbb',
    'bbbsbbbbbsbbb',
  ],
  ajar: [
    '..bbbbbbbbb..',
    '.bbsbbbbbsbb.',
    'bbbsbbbbbsbbb',
    'bkkkkkkkkkkkb',
    'sssssssssssss',
    'bbbsbbbbbsbbb',
    'bbbsbbbbbsbbb',
  ],
  open: [
    '.bbbbbbbbbbb.',
    '.bsbbbbbbbsb.',
    '..bbbbbbbbb..',
    'sssssssssssss',
    'bkkskkrkkskkb',
    'bbbsbbbbbsbbb',
    'bbbsbbbbbsbbb',
  ],
};

export function cryptWalkable(x, y) {
  const corridor = x > DOOR.x0 + 1 && x < DOOR.x1 - 1 && y > C.y && y <= DOOR.y + 2;
  if (!corridor && floorD(x, y) > 0.86) return false;
  return !(Math.abs(x - CHEST.x) < 8 && y < CHEST.y + 2);
}
export const atCryptDoor = (x, y) => y > DOOR.y && x > DOOR.x0 && x < DOOR.x1;
export const nearChest = (x, y) => Math.abs(x - CHEST.x) < 10 && y < CHEST.y + 8;
