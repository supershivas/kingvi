/* Loup, de profil (tourné vers la droite) : une silhouette sombre, un œil clair.
   Premières animations pour le labo : trot, galop, arrêt, flaire, hurle.
   Chaque image fait WOLF_W × WOLF_H ; les pattes touchent la ligne WOLF_GROUND. */

export const WOLF_W = 18;
export const WOLF_H = 12;
export const WOLF_GROUND = 10;
// À l'échelle du viking (9 px de haut) : garrot à 4 px, 13 px du museau à la queue.

function grid() { return Array.from({ length: WOLF_H }, () => Array(WOLF_W).fill(null)); }

function makePut(g) {
  return (x, y, c = 'b') => {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && y >= 0 && x < WOLF_W && y < WOLF_H) g[y][x] = c;
  };
}

function line(put, x0, y0, x1, y1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n);
}

// Loup debout. legs : [arrière loin, arrière près, avant loin, avant près],
// chacune { dx, lift } (déplacement du pied, hauteur du pied levé).
function standing({ legs, bob = 0, head = 'level', tail = 'mid', breath = 0, arch = 0 }) {
  const g = grid();
  const put = makePut(g);
  const G = WOLF_GROUND;
  const y0 = G - 4 + bob;                        // ligne du dos

  const hips = [5, 6, 9, 10];
  legs.forEach(({ dx, lift }, i) => line(put, hips[i], y0 + 2, hips[i] + dx, G - lift));

  // Corps : dos (voûté au galop), ventre qui respire, poitrail
  for (let x = 4; x <= 10; x++) {
    if (arch && x > 5 && x < 9) put(x, y0 - arch);   // dos rond, sans trou dessous
    put(x, y0);
    put(x, y0 + 1);
  }
  for (let x = 6; x <= 9 - breath; x++) put(x, y0 + 2);
  put(11, y0 + 1);

  const tails = {
    low: [[3, y0 + 1], [2, y0 + 2]],
    mid: [[3, y0], [2, y0 + 1]],
    high: [[3, y0 - 1], [2, y0 - 2]],
    flat: [[3, y0], [2, y0]],
  };
  for (const [x, y] of tails[tail]) put(x, y);

  if (head === 'down') {
    // Museau au ras de la neige
    put(11, y0); put(12, y0 + 1); put(12, y0 + 2); put(13, y0 + 2);
    put(13, y0 + 3); put(14, y0 + 3);
    put(12, y0, 'b');
  } else {
    const hy = head === 'up' ? y0 - 3 : y0 - 2;
    put(11, y0); put(11, y0 - 1);
    put(12, hy); put(13, hy); put(12, hy + 1); put(13, hy + 1);
    put(14, hy + 1);                              // museau
    put(12, hy - 1);                              // oreille
    put(13, hy, 's');                             // œil
  }
  return g;
}

// Loup assis qui lève la tête vers le ciel. rise : 0 (regarde devant) → 2 (hurle).
function sitting(rise, open) {
  const g = grid();
  const put = makePut(g);
  const G = WOLF_GROUND;
  for (let x = 5; x <= 8; x++) {
    const top = Math.round(G - 1 - (x - 5) * 0.9);
    for (let y = top; y <= G; y++) put(x, y);
  }
  for (let y = G - 4; y <= G; y++) { put(9, y); }
  put(10, G); put(10, G - 1);                     // patte avant
  put(3, G); put(4, G);                           // queue posée
  if (rise === 0) { put(10, G - 5); put(11, G - 5); put(10, G - 4); put(11, G - 4); put(12, G - 4); put(10, G - 6); put(11, G - 5, 's'); }
  else if (rise === 1) { put(10, G - 5); put(10, G - 6); put(11, G - 6); put(11, G - 5); put(12, G - 6); put(10, G - 7); put(11, G - 6, 's'); }
  else {
    // Museau pointé vers le ciel, gueule ouverte ou fermée
    put(10, G - 5); put(10, G - 6); put(11, G - 6); put(11, G - 7); put(12, G - 8);
    put(9, G - 7);                                // oreille couchée en arrière
    if (open) put(12, G - 6);
    put(11, G - 6, 's');
  }
  return g;
}

const L = (dx, lift = 0) => ({ dx, lift });

export const WOLF_ANIMS = {
  trot: {
    label: 'Trot',
    fps: 9,
    frames: [
      standing({ legs: [L(-1), L(1), L(1), L(-1)], tail: 'mid' }),
      standing({ legs: [L(0), L(0, 1), L(0, 1), L(0)], tail: 'mid', bob: -1 }),
      standing({ legs: [L(1), L(-1), L(-1), L(1)], tail: 'mid' }),
      standing({ legs: [L(0, 1), L(0), L(0), L(0, 1)], tail: 'mid', bob: -1 }),
    ],
  },
  galop: {
    label: 'Galop',
    fps: 12,
    frames: [
      standing({ legs: [L(-2), L(-2), L(2, 1), L(3, 1)], tail: 'flat', head: 'level' }),
      standing({ legs: [L(-1, 1), L(-2), L(1), L(2)], tail: 'flat', bob: 1 }),
      standing({ legs: [L(1), L(2), L(-1), L(-1)], tail: 'flat', arch: 1 }),
      standing({ legs: [L(1, 1), L(2, 1), L(-2, 1), L(-1, 2)], tail: 'flat', bob: -1, arch: 1 }),
      standing({ legs: [L(-1, 2), L(0, 2), L(1, 2), L(2, 2)], tail: 'flat', bob: -2 }),
    ],
  },
  arret: {
    label: 'À l\'arrêt',
    fps: 3,
    frames: [
      standing({ legs: [L(0), L(0), L(0), L(0)], tail: 'low' }),
      standing({ legs: [L(0), L(0), L(0), L(0)], tail: 'low', breath: 1 }),
      standing({ legs: [L(0), L(0), L(0), L(0)], tail: 'mid', breath: 1 }),
      standing({ legs: [L(0), L(0), L(0), L(0)], tail: 'low' }),
      standing({ legs: [L(0), L(0), L(0), L(0)], tail: 'low', head: 'up' }),
      standing({ legs: [L(0), L(0), L(0), L(0)], tail: 'low', head: 'up', breath: 1 }),
    ],
  },
  flaire: {
    label: 'Flaire le sol',
    fps: 5,
    frames: [
      standing({ legs: [L(0), L(0), L(1), L(0)], head: 'down', tail: 'low' }),
      standing({ legs: [L(0), L(0), L(1), L(0)], head: 'down', tail: 'low', bob: 1 }),
      standing({ legs: [L(0), L(0), L(1), L(0)], head: 'down', tail: 'mid' }),
      standing({ legs: [L(0), L(0), L(0), L(1)], head: 'down', tail: 'mid', bob: 1 }),
    ],
  },
  hurle: {
    label: 'S\'assoit et hurle',
    fps: 3,
    frames: [
      sitting(0, false), sitting(0, false), sitting(1, false),
      sitting(2, false), sitting(2, true), sitting(2, true), sitting(2, true), sitting(2, false), sitting(1, false),
    ],
  },
};
