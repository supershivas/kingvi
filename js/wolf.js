/* Loup, de profil (tourné vers la droite), d'après les silhouettes de
   référence : queue touffue qui pend, dos qui monte vers une épaisse
   collerette, oreilles pointues, long museau, pattes fines.
   Chaque image fait WOLF_W × WOLF_H ; les pattes touchent la ligne WOLF_GROUND.
   Sa tête arrive à la hauteur du casque du viking. */

export const WOLF_W = 20;
export const WOLF_H = 14;
export const WOLF_GROUND = 12;

function grid() { return Array.from({ length: WOLF_H }, () => Array(WOLF_W).fill(null)); }

function painter(g) {
  const put = (x, y) => {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && y >= 0 && x < WOLF_W && y < WOLF_H) g[y][x] = 'b';
  };
  const span = (x0, x1, y) => { for (let x = x0; x <= x1; x++) put(x, y); };
  return { put, span };
}

const TAILS = {
  // Pendante, touffue : elle s'épaissit puis s'effile
  down: [[4, -4], [3, -4], [2, -4], [2, -3], [1, -3], [2, -2], [1, -2], [0, -2], [1, -1], [0, -1]],
  sway: [[4, -4], [3, -4], [2, -4], [3, -3], [2, -3], [1, -3], [2, -2], [1, -2], [1, -1], [2, -1]],
  // Au galop : à l'horizontale, dans le prolongement du dos
  flat: [[3, -5], [2, -5], [1, -5], [0, -5], [3, -4], [2, -4], [1, -4], [0, -6]],
  // Assis ou en alerte : relevée
  up: [[4, -5], [3, -6], [2, -6], [2, -7], [1, -7]],
};

// Tête (position du crâne ; dy par rapport à la ligne du sol).
function head(put, span, G, pose, open) {
  if (pose === 'down') {
    // Il flaire : cou plongeant, museau au ras de la neige
    span(13, 14, G - 5); span(14, 15, G - 4); span(15, 16, G - 3);
    span(16, 17, G - 2); put(18, G - 1);
    put(14, G - 6);                                   // oreille
    return;
  }
  if (pose === 'howl') {
    // Cou tendu vers le ciel, museau pointé en haut
    span(12, 14, G - 7); span(13, 14, G - 8); span(13, 15, G - 9);
    span(14, 15, G - 10); put(15, G - 11); put(16, G - 12);
    put(12, G - 9);                                   // oreille couchée
    if (open) { put(17, G - 11); } else put(16, G - 11);
    return;
  }
  const up = pose === 'up' ? -1 : 0;
  span(13, 14, G - 7 + up);                           // cou, collerette
  span(14, 18, G - 8 + up);                           // crâne et long museau
  span(14, 16, G - 9 + up);
  put(14, G - 10 + up); put(16, G - 10 + up);         // deux oreilles pointues
}

// legs : [arrière loin, arrière près, avant loin, avant près] → { dx, lift }
function wolf({ legs, bob = 0, tail = 'down', headPose = 'level', open = false, stretch = 0, breath = 0 }) {
  const g = grid();
  const { put, span } = painter(g);
  const G = WOLF_GROUND;
  const B = G + bob;                                  // le corps monte ou descend

  // Pattes fines, avec un pied tourné vers l'avant
  const hips = [5, 7, 12, 14];
  legs.forEach(({ dx, lift }, i) => {
    const hx = hips[i] + (i < 2 ? -stretch : stretch);
    const fx = hx + dx, fy = G - lift;
    const mid = { x: (hx + fx) / 2 + (i < 2 ? -0.5 : 0.3), y: B - 3 + (fy - (B - 3)) / 2 };
    const pts = [[hx, B - 4], [mid.x, mid.y], [fx, fy]];
    for (let k = 0; k < 2; k++) {
      const [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
      const n = Math.max(1, Math.abs(y1 - y0), Math.abs(x1 - x0));
      for (let j = 0; j <= n; j++) put(x0 + (x1 - x0) * j / n, y0 + (y1 - y0) * j / n);
    }
    if (!lift) put(fx + 1, fy);
  });

  // Corps : dos qui monte vers les épaules, poitrail profond, ventre rentré
  span(6 - stretch, 13 + stretch, B - 7);
  span(4 - stretch, 14 + stretch, B - 6);
  span(4 - stretch, 14 + stretch, B - 5);
  span(5 - stretch, 8, B - 4); span(12 + stretch - breath, 14 + stretch, B - 4);
  put(15 + stretch, B - 6); put(15 + stretch, B - 5);  // collerette

  for (const [x, y] of TAILS[tail]) put(x - stretch, B + y);
  head((x, y) => put(x + stretch, y + bob), (a, b, y) => span(a + stretch, b + stretch, y + bob), G, headPose, open);
  return g;
}

// Assis, d'après la silhouette de référence : croupe au sol, poitrail droit,
// queue enroulée devant les pattes.
function sitting({ headPose = 'level', open = false, tail = 0 }) {
  const g = grid();
  const { put, span } = painter(g);
  const G = WOLF_GROUND;
  for (let y = G - 6; y <= G; y++) {
    const back = Math.max(5, 9 - Math.round((G - y) * 0.7));
    span(back, 12, y);
  }
  span(4, 12, G);
  span(13, 16 + tail, G); put(15 + tail, G - 1);      // queue enroulée devant
  put(12, G - 1); put(13, G - 2);                     // patte avant
  if (headPose === 'howl') {
    span(10, 12, G - 7); span(11, 12, G - 8); span(11, 13, G - 9);
    span(12, 13, G - 10); put(13, G - 11); put(14, G - 12);
    put(10, G - 9);
    if (open) put(15, G - 11); else put(14, G - 11);
  } else {
    span(10, 12, G - 7);
    span(11, 15, G - 8); span(11, 13, G - 9);
    put(11, G - 10); put(13, G - 10);
  }
  return g;
}

const L = (dx, lift = 0) => ({ dx, lift });
const still = [L(0), L(1), L(0), L(1)];

export const WOLF_ANIMS = {
  trot: {
    label: 'Trot', fps: 9,
    frames: [
      wolf({ legs: [L(-1), L(1), L(1), L(-1)] }),
      wolf({ legs: [L(0), L(0, 1), L(0, 1), L(0)], bob: -1, tail: 'sway' }),
      wolf({ legs: [L(1), L(-1), L(-1), L(1)] }),
      wolf({ legs: [L(0, 1), L(0), L(0), L(0, 1)], bob: -1, tail: 'sway' }),
    ],
  },
  galop: {
    label: 'Galop', fps: 11,
    frames: [
      // Détente : pattes lancées loin devant et loin derrière (comme la référence)
      wolf({ legs: [L(-3, 1), L(-2), L(3, 1), L(4, 2)], tail: 'flat', stretch: 1 }),
      wolf({ legs: [L(-1, 2), L(-2, 1), L(2), L(1)], tail: 'flat', bob: 1 }),
      // Regroupé : pattes arrière sous le ventre
      wolf({ legs: [L(2, 1), L(3), L(-2, 1), L(-1, 1)], tail: 'flat' }),
      wolf({ legs: [L(1, 2), L(2, 2), L(0, 2), L(1, 2)], tail: 'flat', bob: -1 }),
    ],
  },
  arret: {
    label: 'À l\'arrêt', fps: 2,
    frames: [
      wolf({ legs: still }),
      wolf({ legs: still, breath: 1, tail: 'sway' }),
      wolf({ legs: still, headPose: 'up' }),
      wolf({ legs: still, breath: 1 }),
    ],
  },
  flaire: {
    label: 'Flaire le sol', fps: 4,
    frames: [
      wolf({ legs: [L(0), L(1), L(1), L(0)], headPose: 'down' }),
      wolf({ legs: [L(0), L(1), L(1), L(0)], headPose: 'down', bob: 1 }),
      wolf({ legs: [L(0), L(1), L(1), L(0)], headPose: 'down', tail: 'sway' }),
      wolf({ legs: [L(0), L(1), L(0), L(1)], headPose: 'down' }),
    ],
  },
  hurle: {
    label: 'Hurle', fps: 3,
    frames: [
      wolf({ legs: still }),
      wolf({ legs: still, headPose: 'up' }),
      wolf({ legs: still, headPose: 'howl' }),
      wolf({ legs: still, headPose: 'howl', open: true }),
      wolf({ legs: still, headPose: 'howl', open: true }),
      wolf({ legs: still, headPose: 'howl', open: true }),
      wolf({ legs: still, headPose: 'howl' }),
      wolf({ legs: still, headPose: 'up' }),
    ],
  },
  assis: {
    label: 'Assis', fps: 2,
    frames: [
      sitting({}), sitting({}), sitting({ tail: -1 }), sitting({ headPose: 'howl' }),
      sitting({ headPose: 'howl', open: true }), sitting({ headPose: 'howl', open: true }), sitting({}),
    ],
  },
};
