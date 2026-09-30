/* Loup, de profil (tourné vers la droite) : pas un chien de dessin animé,
   une bête. Petit et trapu, voûté : le dos monte de la queue au garrot, puis
   le cou replonge et la tête pend plus bas que l'échine, en avant, prête à
   mordre. Pattes courtes et épaisses, queue lourde qui pend. Une masse.
   Chaque image fait WOLF_W × WOLF_H ; les pattes touchent la ligne WOLF_GROUND.
   Son garrot arrive à l'épaule du viking (il est plus bas que lui). */

export const WOLF_W = 17;
export const WOLF_H = 11;
export const WOLF_GROUND = 9;

// Le corps, sans la tête ni les pattes (6 rangs, du garrot au ventre)
const BODY = [
  '.......bb.......',
  '.....bbbbbb.....',
  '...bbbbbbbbb....',
  '..bbbbbbbbbb....',
  '.bbbbbbbbbbb....',
  '.b.bbbb..bbb....',
];
// Queue : lourde, pendante ; à plat au galop
const TAILS = {
  low: [[1, 3], [0, 4], [0, 5]],
  sway: [[1, 3], [1, 4], [0, 5]],
  flat: [[1, 2], [0, 2], [0, 3]],
};
// Têtes (points [x, y] relatifs au haut du corps), gueule fermée ou ouverte
const HEADS = {
  // Portée bas, en avant du garrot, le mufle lourd
  level: { ear: [[12, 2]], skull: [[12, 3], [13, 3], [14, 3], [12, 4], [13, 4], [14, 4], [15, 4], [16, 4], [13, 5], [14, 5], [15, 5]] },
  // Gueule ouverte : la mâchoire tombe
  levelOpen: { ear: [[12, 2]], skull: [[12, 3], [13, 3], [14, 3], [12, 4], [13, 4], [14, 4], [15, 4], [16, 4], [13, 5], [13, 6], [14, 6], [15, 6]] },
  // Flaire : le mufle au ras de la neige
  down: { ear: [[12, 3]], skull: [[12, 4], [13, 4], [13, 5], [14, 5], [14, 6], [15, 6], [15, 7]] },
  // En alerte : la tête relevée à hauteur du garrot
  alert: { ear: [[12, 0]], skull: [[11, 1], [12, 1], [13, 1], [12, 2], [13, 2], [14, 2], [15, 2], [13, 3], [14, 3]] },
  // Hurle : le cou tendu vers le ciel
  howl: { ear: [[11, 1]], skull: [[11, 2], [12, 2], [12, 1], [13, 1], [13, 0], [14, 0], [14, -1]] },
  howlOpen: { ear: [[11, 1]], skull: [[11, 2], [12, 2], [12, 1], [13, 1], [13, 0], [14, -1], [15, -2], [15, 0]] },
};
// Pattes : deux rangs sous le ventre (courtes, épaisses)
const LEGS = {
  stand: ['...bb....bb.....', '...b.b...b.b....'],
  trotA: ['..bb.....bbb....', '.b...b..b....b..'],
  trotB: ['...bbb...bb.....', '....bb....bb....'],
  trotC: ['..bbb....bb.....', '..b..b..b...b...'],
  trotD: ['...bb...bbb.....', '...bb.....bb....'],
  galopA: ['.bb.........bb..', 'b.............b.'],
  galopB: ['..bbb....bbb....', '.b...b..b...b...'],
  galopC: ['....bbbbbb......', '.....b..b.......'],
  crouch: ['..bbb....bbb....', '..b..b...b..b...'],
};

function wolf({ legs = 'stand', bob = 0, tail = 'low', headPose = 'level', stretch = 0, breath = 0 }) {
  const g = Array.from({ length: WOLF_H }, () => Array(WOLF_W).fill(null));
  const put = (x, y) => { if (x >= 0 && y >= 0 && x < WOLF_W && y < WOLF_H) g[y][x] = 'b'; };
  const top = WOLF_GROUND - 8 + bob;                   // haut du corps
  BODY.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== 'b') return;
    // Au galop, le corps s'allonge : l'avant file d'un pixel
    put(x + (x > 7 ? stretch : 0), top + y);
    if (stretch && x === 7) put(8, top + y);
  }));
  if (breath) put(9 + stretch, top + 5);               // le flanc qui se gonfle
  for (const [x, y] of TAILS[tail]) put(x, top + y);
  const h = HEADS[headPose];
  for (const [x, y] of [...h.ear, ...h.skull]) put(x + stretch, top + y);
  // Les pattes : attachées au ventre, jusqu'au sol (le corps baissé les plie)
  // Les cuisses, épaisses, puis les deux rangs de la pose
  const rows = [legs.startsWith('galop') ? '..bbb....bbb....' : '...bbb...bbb....', ...LEGS[legs]];
  const leg = [...Array(Math.max(0, -bob)).fill(rows[0]), ...rows];   // corps levé : pattes plus longues
  leg.forEach((row, i) => [...row].forEach((c, x) => {
    if (c === 'b') put(x + (x > 7 ? stretch : 0), WOLF_GROUND - leg.length + 1 + i);
  }));
  return g;
}

// Assis, voûté : l'arrière-train au sol, les épaules hautes, la tête basse
const SIT = [
  '.........b......',
  '........bbb.....',
  '.......bbbbbb...',
  '......bbbbb.....',
  '.....bbbbbb.....',
  '....bbbbbbb.....',
  '...bbbbbbbb.....',
  '..bbbbbbbbb.....',
  '.bbbbbbb.bb.....',
];
const SIT_HOWL = [
  '...........b....',
  '..........bb....',
  '........bbb.....',
  '.......bbbb.....',
  '.....bbbbbb.....',
  '....bbbbbbb.....',
  '...bbbbbbbb.....',
  '..bbbbbbbbb.....',
  '.bbbbbbb.bb.....',
];
function sitting(rows) {
  const g = Array.from({ length: WOLF_H }, () => Array(WOLF_W).fill(null));
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'b') g[WOLF_GROUND - rows.length + 1 + y][x] = 'b'; }));
  return g;
}

export const WOLF_ANIMS = {
  trot: {
    label: 'Trot', fps: 9,
    frames: [
      wolf({ legs: 'trotA' }),
      wolf({ legs: 'trotB', bob: -1, tail: 'sway' }),
      wolf({ legs: 'trotC' }),
      wolf({ legs: 'trotD', bob: -1, tail: 'sway' }),
    ],
  },
  galop: {
    label: 'Galop', fps: 11,
    frames: [
      wolf({ legs: 'galopA', tail: 'flat', stretch: 1 }),
      wolf({ legs: 'galopB', tail: 'flat', bob: -1 }),
      wolf({ legs: 'galopC', tail: 'flat', bob: -1 }),
      wolf({ legs: 'galopB', tail: 'flat' }),
    ],
  },
  arret: {
    label: 'À l\'arrêt', fps: 2,
    frames: [
      wolf({}),
      wolf({ breath: 1, tail: 'sway' }),
      wolf({ headPose: 'alert' }),
      wolf({ breath: 1 }),
    ],
  },
  grogne: {
    label: 'Grogne', fps: 4,
    frames: [
      wolf({ legs: 'crouch', bob: 1 }),
      wolf({ legs: 'crouch', bob: 1, headPose: 'levelOpen' }),
      wolf({ legs: 'crouch', bob: 1, headPose: 'levelOpen', breath: 1 }),
      wolf({ legs: 'crouch', bob: 1 }),
    ],
  },
  flaire: {
    label: 'Flaire le sol', fps: 4,
    frames: [
      wolf({ headPose: 'down' }),
      wolf({ headPose: 'down', bob: 1, legs: 'crouch' }),
      wolf({ headPose: 'down', tail: 'sway' }),
      wolf({ headPose: 'down', legs: 'trotB' }),
    ],
  },
  hurle: {
    label: 'Hurle', fps: 3,
    frames: [
      wolf({}), wolf({ headPose: 'alert' }), wolf({ headPose: 'howl' }),
      wolf({ headPose: 'howlOpen' }), wolf({ headPose: 'howlOpen' }), wolf({ headPose: 'howlOpen' }),
      wolf({ headPose: 'howl' }), wolf({ headPose: 'alert' }),
    ],
  },
  assis: {
    label: 'Assis', fps: 2,
    frames: [sitting(SIT), sitting(SIT), sitting(SIT_HOWL), sitting(SIT_HOWL), sitting(SIT)],
  },
};
