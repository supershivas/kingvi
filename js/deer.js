/* Cerf et biche, de profil (tournés vers la droite) : ce sont nos premiers
   « loups », qui ressemblaient à des cerfs. Pattes fines, queue courte ; le cerf
   porte des bois. Chaque image fait DEER_W × DEER_H ; les sabots touchent DEER_GROUND. */

import { designGrid } from './design-store.js?v=1.69.0';

export const DEER_W = 18;
export const DEER_H = 14;
export const DEER_GROUND = 12;

function grid() { return Array.from({ length: DEER_H }, () => Array(DEER_W).fill(null)); }

function makePut(g) {
  return (x, y, c = 'b') => {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && y >= 0 && x < DEER_W && y < DEER_H) g[y][x] = c;
  };
}

function line(put, x0, y0, x1, y1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n);
}

// Loup debout. legs : [arrière loin, arrière près, avant loin, avant près],
// chacune { dx, lift } (déplacement du pied, hauteur du pied levé).
function standing({ legs, bob = 0, head = 'level', tail = 'low', breath = 0, arch = 0, stag = false, open = false }) {
  const g = grid();
  const put = makePut(g);
  const G = DEER_GROUND;
  const y0 = G - 5 + bob;                        // ligne du dos (pattes hautes)

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

  // Queue courte, relevée quand il fuit
  put(3, tail === 'high' ? y0 - 1 : y0);
  if (tail === 'high') put(3, y0);

  if (head === 'down') {
    // Museau au ras de la neige
    put(11, y0); put(12, y0 + 1); put(12, y0 + 2); put(13, y0 + 2);
    put(13, y0 + 3); put(14, y0 + 3);
    put(12, y0, 'b');
  } else {
    const hy = head === 'up' ? y0 - 3 : y0 - 2;
    put(11, y0); put(11, y0 - 1); if (head === 'up') put(11, y0 - 2);
    put(12, hy); put(13, hy); put(12, hy + 1); put(13, hy + 1);
    put(14, hy + 1);                              // museau
    if (open) put(14, hy + 2);                    // il brame
    put(13, hy, 's');                             // œil
    if (stag) {
      // Bois : deux perches ramifiées
      put(12, hy - 1); put(12, hy - 2); put(11, hy - 3); put(13, hy - 3);
      put(10, hy - 4); put(12, hy - 4); put(14, hy - 4); put(11, hy - 5); put(14, hy - 5);
    } else {
      put(12, hy - 1); put(11, hy - 1);           // grandes oreilles
    }
  }
  return g;
}

const L = (dx, lift = 0) => ({ dx, lift });

function deerAnims(stag) {
  const S = o => standing({ ...o, stag });
  const still = [L(0), L(0), L(0), L(0)];
  return {
    marche: {
      label: 'Marche', fps: 7,
      frames: [
        S({ legs: [L(-1), L(1), L(1), L(-1)] }),
        S({ legs: [L(0), L(0, 1), L(0, 1), L(0)], bob: -1 }),
        S({ legs: [L(1), L(-1), L(-1), L(1)] }),
        S({ legs: [L(0, 1), L(0), L(0), L(0, 1)], bob: -1 }),
      ],
    },
    bond: {
      label: 'Bondit', fps: 10,
      frames: [
        S({ legs: [L(-2), L(-2), L(2, 1), L(2, 1)], tail: 'high' }),
        S({ legs: [L(-1, 2), L(-1, 2), L(2, 2), L(3, 2)], tail: 'high', bob: -2 }),
        S({ legs: [L(1, 1), L(1, 1), L(-1, 1), L(-1, 1)], tail: 'high', bob: -1, arch: 1 }),
        S({ legs: [L(1), L(2), L(-1), L(0)], tail: 'high', arch: 1 }),
      ],
    },
    arret: {
      label: 'À l\'arrêt', fps: 2,
      frames: [S({ legs: still }), S({ legs: still, breath: 1 }), S({ legs: still, head: 'up' }), S({ legs: still, head: 'up', breath: 1 })],
    },
    broute: {
      label: 'Broute', fps: 4,
      frames: [
        S({ legs: [L(0), L(0), L(1), L(0)], head: 'down' }),
        S({ legs: [L(0), L(0), L(1), L(0)], head: 'down', bob: 1 }),
        S({ legs: [L(0), L(0), L(1), L(0)], head: 'down' }),
        S({ legs: [L(0), L(0), L(0), L(1)], head: 'down', breath: 1 }),
      ],
    },
    ...(stag ? {
      brame: {
        label: 'Brame', fps: 3,
        frames: [S({ legs: still }), S({ legs: still, head: 'up' }), S({ legs: still, head: 'up', open: true }),
          S({ legs: still, head: 'up', open: true }), S({ legs: still, head: 'up' })],
      },
    } : {
      alerte: {
        label: 'Alerte', fps: 3,
        frames: [S({ legs: still, head: 'down' }), S({ legs: still }), S({ legs: still, head: 'up' }),
          S({ legs: still, head: 'up', tail: 'high' }), S({ legs: still, head: 'up', tail: 'high' })],
      },
    }),
  };
}

// Les poses redessinées à la main (designs.js) remplacent celles du code
function withDesigns(anims, who) {
  for (const [key, anim] of Object.entries(anims)) anim.frames = anim.frames.map((g, i) => designGrid(`${who}-${key}-${i}`, g));
  return anims;
}

export const STAG_RAW = deerAnims(true);
export const DOE_RAW = deerAnims(false);
export const STAG_ANIMS = withDesigns(deerAnims(true), 'cerf');
export const DOE_ANIMS = withDesigns(deerAnims(false), 'biche');
