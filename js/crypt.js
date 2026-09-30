/* La crypte, dans la statue de l'îlot : une petite salle de pierre, noire tout
   autour, et au fond, un coffre. On entre par le bas (la porte de la statue).
   Couleurs : b pierre sombre, s joints et pierre éclairée, k noir, r rubis. */

export const CRYPT_W = 120;
export const CRYPT_H = 90;
const X0 = 22, X1 = 98, WALL_TOP = 12, FLOOR_TOP = 36, FLOOR_BOTTOM = 76;
const DOOR = { x0: 56, x1: 64 };
export const CHEST = { x: 60, y: 47 };
export const CRYPT_ENTRY = { x: 60, y: 71 };

export function makeCrypt() {
  const g = Array.from({ length: CRYPT_H }, () => Array(CRYPT_W).fill('k'));
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < CRYPT_W && y < CRYPT_H) g[y][x] = c; };
  // Mur du fond : blocs appareillés
  for (let y = WALL_TOP; y < FLOOR_TOP; y++) for (let x = X0; x <= X1; x++) {
    const course = Math.floor((y - WALL_TOP) / 6), off = course % 2 ? 5 : 0;
    const joint = (y - WALL_TOP) % 6 === 5 || (x + off - X0) % 10 === 0;
    put(x, y, joint && (x + y) % 3 ? 's' : 'b');
  }
  for (let x = X0; x <= X1; x++) put(x, WALL_TOP, 's');
  // Runes gravées au-dessus du coffre
  const RUNES = ['s.s.sss.s..s', 's.s..s..ss.s', '.s...s..s.ss', '.s...s..s..s'];
  RUNES.forEach((row, y) => [...row].forEach((c, x) => { if (c === 's') put(CHEST.x - 6 + x, WALL_TOP + 5 + y, 'k'); }));
  // Sol : dalles claires, joints sombres pointillés, un peu de neige entrée par la porte
  for (let y = FLOOR_TOP; y <= FLOOR_BOTTOM; y++) for (let x = X0; x <= X1; x++) {
    const joint = (y - FLOOR_TOP) % 8 === 0 || (x - X0 + (Math.floor((y - FLOOR_TOP) / 8) % 2) * 6) % 12 === 0;
    put(x, y, joint && (x + y) % 2 ? 'b' : 's');
  }
  // Murs de côté, épais, et le bord de devant, coupé par la porte
  for (let y = WALL_TOP; y <= FLOOR_BOTTOM + 1; y++) for (const x of [X0 - 3, X0 - 2, X0 - 1, X1 + 1, X1 + 2, X1 + 3]) put(x, y, 'b');
  for (let x = X0 - 3; x <= X1 + 3; x++) {
    if (x > DOOR.x0 && x < DOOR.x1) continue;
    put(x, FLOOR_BOTTOM + 1, 'b'); put(x, FLOOR_BOTTOM + 2, 'b');
  }
  // Ossements épars, dans les coins
  for (const [x, y] of [[28, 66], [29, 66], [30, 67], [88, 44], [89, 45], [91, 45], [33, 42], [34, 42]]) put(x, y, 'b');
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
    'bbbsbbsbbsbbb',
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
  const inDoor = x > DOOR.x0 + 1 && x < DOOR.x1 - 1;
  if (x < X0 + 2 || x > X1 - 2 || y < FLOOR_TOP + 5 || y > (inDoor ? FLOOR_BOTTOM + 4 : FLOOR_BOTTOM - 1)) return false;
  return !(Math.abs(x - CHEST.x) < 8 && y < CHEST.y + 2);
}
export const atCryptDoor = (x, y) => y > FLOOR_BOTTOM + 2 && x > DOOR.x0 && x < DOOR.x1;
export const nearChest = (x, y) => Math.abs(x - CHEST.x) < 10 && y < CHEST.y + 8;
