/* Loup, de profil (tourné vers la droite), d'après les silhouettes de
   référence : corps long et maigre, dos presque droit, tête portée en avant
   au niveau du dos, deux oreilles pointues, pattes fines et longues, queue
   touffue qui traîne bas et bat au rythme du pas.
   Petit : un loup arrive à la hanche d'un homme. Le garrot est à 4 pixels du
   sol, la pointe des oreilles à 6 (le viking en fait 9).
   Chaque image fait WOLF_W × WOLF_H ; les pattes touchent la ligne WOLF_GROUND. */

export const WOLF_W = 16;
export const WOLF_H = 10;
export const WOLF_GROUND = 8;

function grid() { return Array.from({ length: WOLF_H }, () => Array(WOLF_W).fill(null)); }

function painter(g) {
  const put = (x, y) => {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && y >= 0 && x < WOLF_W && y < WOLF_H) g[y][x] = 'b';
  };
  const line = (x0, y0, x1, y1) => {
    const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n);
  };
  return { put, line };
}

// Une patte : de la hanche (ou de l'épaule) au pied, pliée au genou quand le
// pied se lève. dx : où tombe le pied ; lift : pied levé (0, 1 ou 2).
function leg(line, hx, hy, dx, lift, back) {
  const G = WOLF_GROUND;
  const fx = hx + dx, fy = G - lift;
  // Le genou (ou le jarret, en arrière) sort du côté du mouvement
  const kx = (hx + fx) / 2 + (lift ? (back ? -1 : 1) : 0), ky = (hy + fy) / 2;
  line(hx, hy, kx, ky);
  line(kx, ky, fx, fy);
}

// La queue : touffue, elle part du bas du dos et traîne en arrière ; `wag`
// (−1 → 1) la balance de haut en bas, `raise` la relève (alerte, galop).
function tail(put, x, y, wag, raise) {
  const pts = [];
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const px = x - i * 0.85, py = y + t * (2.3 - raise * 2.2) + wag * t * t * 1.4;
    pts.push([px, py]);
    put(px, py);
    if (i >= 1 && i <= 3) put(px, py + 1);             // l'épaisseur du panache
  }
  return pts;
}

// Tête : dans le prolongement du dos, un peu plus haute ; le museau
// pointu file vers l'avant, l'oreille se dresse à l'arrière du crâne
function head(put, x, y, pose, open) {
  if (pose === 'down') {                               // flaire le sol : le cou plonge
    put(x, y + 1); put(x + 1, y + 2); put(x + 2, y + 2); put(x + 2, y + 3); put(x + 3, y + 4);
    put(x, y);                                          // l'oreille
    return;
  }
  if (pose === 'howl') {                               // le museau vers le ciel
    put(x, y); put(x, y - 1); put(x + 1, y - 2); put(x + 1, y - 3); put(x + 2, y - 4);
    if (open) put(x + 2, y - 2);
    put(x - 1, y - 2);                                  // l'oreille rabattue
    return;
  }
  const dy = pose === 'alert' ? -1 : 0;
  put(x, y + dy); put(x + 1, y + dy);                  // crâne
  put(x + 1, y + 1 + dy); put(x + 2, y + 1 + dy); put(x + 3, y + 1 + dy);   // museau, long
  if (open) put(x + 2, y + 2 + dy);                     // la mâchoire tombe
  put(x, y - 1 + dy);                                   // l'oreille, pointue
  if (pose === 'alert') put(x, y - 2 + dy);             // dressée haut
}

// legs : [arrière loin, arrière près, avant loin, avant près] → [dx, lift]
function wolf({ legs, bob = 0, wag = 0, raise = 0, headPose = 'level', open = false, stretch = 0 }) {
  const g = grid();
  const { put, line } = painter(g);
  const G = WOLF_GROUND;
  const back = G - 4 + bob;                            // la ligne du dos
  const hip = 4 - stretch, shoulder = 10 + stretch;
  // Corps : long, maigre ; les reins minces, le poitrail profond
  line(hip - 1, back, shoulder + 1, back);
  line(hip, back + 1, shoulder + 1, back + 1);
  put(shoulder, back + 2); put(shoulder + 1, back + 2); put(shoulder - 1, back + 2);   // le poitrail
  put(hip, back + 2);                                  // la cuisse
  // Pattes : fines, jusqu'au sol
  const hips = [[hip, 0], [hip + 1, 0], [shoulder, 1], [shoulder + 1, 1]];
  legs.forEach(([dx, lift], i) => leg(line, hips[i][0], back + 2, dx, lift, i < 2));
  // Le cou, puis la tête, en avant du garrot
  put(shoulder + 2, back);
  head(put, shoulder + 2, back - 1, headPose, open);
  tail(put, hip - 2, back + 0.6, wag, raise);
  return g;
}

// Assis : l'arrière-train au sol, pattes avant droites, tête haute
function sitting({ wag = 0, headPose = 'level', open = false }) {
  const g = grid();
  const { put, line } = painter(g);
  const G = WOLF_GROUND;
  // La croupe au sol, le dos qui monte en biais vers les épaules
  line(5, G, 8, G); line(5, G - 1, 8, G - 1); line(6, G - 2, 9, G - 2);
  line(7, G - 3, 9, G - 3); line(8, G - 4, 10, G - 4);
  line(10, G - 3, 10, G); put(9, G);                   // les pattes avant, droites
  head(put, 10, G - 5, headPose, open);
  // La queue posée devant les pattes arrière, le bout qui bouge
  put(4, G); put(3, G); put(2, G - (wag > 0 ? 1 : 0));
  return g;
}

// À terre, mort : couché sur le flanc, les pattes raides vers l'avant
function lying() {
  const g = grid();
  const { put, line } = painter(g);
  const G = WOLF_GROUND;
  line(3, G, 11, G); line(4, G - 1, 10, G - 1);        // le flanc
  put(12, G); put(13, G); put(13, G - 1);               // la tête, posée
  put(12, G - 1);                                       // l'oreille couchée
  line(8, G - 2, 10, G - 3); line(5, G - 2, 6, G - 3);  // les pattes, en l'air
  line(0, G, 2, G);                                     // la queue, à plat
  return g;
}

const T = (dx, lift = 0) => [dx, lift];

export const WOLF_ANIMS = {
  trot: {
    label: 'Trot', fps: 9,
    frames: [
      wolf({ legs: [T(1), T(-1), T(-1), T(1)], wag: 0 }),
      wolf({ legs: [T(0, 1), T(0), T(0), T(0, 1)], bob: -1, wag: 0.8 }),
      wolf({ legs: [T(-1), T(1), T(1), T(-1)], wag: 0 }),
      wolf({ legs: [T(0), T(0, 1), T(0, 1), T(0)], bob: -1, wag: -0.8 }),
    ],
  },
  galop: {
    label: 'Galop', fps: 12,
    frames: [
      // Détente : pattes lancées loin devant et loin derrière
      wolf({ legs: [T(-2), T(-3, 1), T(2, 1), T(3)], stretch: 1, raise: 0.8, wag: -0.5 }),
      wolf({ legs: [T(-1, 1), T(-2, 2), T(1, 2), T(2, 1)], bob: -1, stretch: 1, raise: 0.9, wag: 0.3 }),
      // Regroupé : les postérieurs passent sous le ventre
      wolf({ legs: [T(2, 1), T(1), T(-1, 1), T(-2, 1)], raise: 0.7, wag: 0.8 }),
      wolf({ legs: [T(1, 2), T(2, 1), T(0, 2), T(-1, 2)], bob: -1, raise: 0.8, wag: 0 }),
    ],
  },
  marche: {
    label: 'Marche', fps: 6,
    frames: [
      wolf({ legs: [T(1), T(-1, 1), T(0), T(1)], wag: 0.3 }),
      wolf({ legs: [T(0), T(0), T(-1), T(1, 1)], wag: 0.6 }),
      wolf({ legs: [T(-1, 1), T(1), T(1), T(0)], wag: 0.3 }),
      wolf({ legs: [T(0), T(0), T(1, 1), T(-1)], wag: 0 }),
    ],
  },
  arret: {
    label: 'À l\'arrêt', fps: 3,
    frames: [
      wolf({ legs: [T(0), T(1), T(0), T(1)], wag: 0 }),
      wolf({ legs: [T(0), T(1), T(0), T(1)], wag: 0.6 }),
      wolf({ legs: [T(0), T(1), T(0), T(1)], wag: 1, headPose: 'alert', raise: 0.4 }),
      wolf({ legs: [T(0), T(1), T(0), T(1)], wag: 0.3, headPose: 'alert', raise: 0.4 }),
      wolf({ legs: [T(0), T(1), T(0), T(1)], wag: -0.3 }),
    ],
  },
  flaire: {
    label: 'Flaire le sol', fps: 4,
    frames: [
      wolf({ legs: [T(0), T(1), T(0), T(1)], headPose: 'down', wag: 0 }),
      wolf({ legs: [T(0), T(1), T(1), T(0)], headPose: 'down', wag: 0.5 }),
      wolf({ legs: [T(0), T(1), T(1), T(0)], headPose: 'down', wag: 1 }),
      wolf({ legs: [T(0), T(1), T(0), T(1)], headPose: 'down', wag: 0.4 }),
    ],
  },
  hurle: {
    label: 'Hurle', fps: 3,
    frames: [
      wolf({ legs: [T(0), T(1), T(0), T(1)], headPose: 'alert' }),
      wolf({ legs: [T(0), T(1), T(0), T(1)], headPose: 'howl', raise: 0.3 }),
      wolf({ legs: [T(0), T(1), T(0), T(1)], headPose: 'howl', open: true, raise: 0.3 }),
      wolf({ legs: [T(0), T(1), T(0), T(1)], headPose: 'howl', open: true, raise: 0.3, wag: 0.3 }),
      wolf({ legs: [T(0), T(1), T(0), T(1)], headPose: 'howl', open: true, raise: 0.3 }),
      wolf({ legs: [T(0), T(1), T(0), T(1)], headPose: 'howl', raise: 0.3 }),
    ],
  },
  grogne: {
    label: 'Grogne (il va bondir)', fps: 8,
    frames: [
      // Ramassé : le dos bas, la tête basse en avant, les crocs
      wolf({ legs: [T(-1), T(0), T(1), T(2)], bob: 1, raise: -0.3, open: true }),
      wolf({ legs: [T(-1), T(0), T(1), T(2)], bob: 1, raise: -0.3 }),
    ],
  },
  bond: {
    label: 'Bondit', fps: 10,
    frames: [
      wolf({ legs: [T(-3, 1), T(-3, 2), T(3, 2), T(3, 1)], bob: -2, stretch: 1, raise: 0.6, open: true }),
      wolf({ legs: [T(-2, 2), T(-3, 2), T(2, 2), T(3, 2)], bob: -2, stretch: 1, raise: 0.8, open: true }),
    ],
  },
  mort: { label: 'À terre', fps: 1, frames: [lying()] },
  assis: {
    label: 'Assis', fps: 2,
    frames: [sitting({}), sitting({ wag: 1 }), sitting({ headPose: 'alert' }), sitting({ headPose: 'howl' }), sitting({ headPose: 'howl', open: true })],
  },
};
