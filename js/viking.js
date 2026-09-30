/* Sprite du viking, dessiné pixel par pixel à partir d'une pose.
   Trois couleurs seulement : b (bleu nuit), r (rouge), s (neige).
   Chaque image fait FRAME_W × FRAME_H ; les pieds touchent la ligne GROUND. */

export const FRAME_W = 24;
export const FRAME_H = 20;
export const CX = 11;      // colonne centrale du corps
export const GROUND = 16;  // ligne des pieds
const Y0 = GROUND - 8;     // haut du casque

// Cycle de marche en 4 temps : appui, passage, appui (autre jambe), passage.
const WALK = [
  { legs: 'apart', bob: 0, swing: 1, cape: 0 },
  { legs: 'liftL', bob: -1, swing: 0, cape: 1 },
  { legs: 'apart2', bob: 0, swing: -1, cape: 0 },
  { legs: 'liftR', bob: -1, swing: 0, cape: 1 },
];

// Attaque en 4 temps : armé, départ, coupe, fin de geste.
const ATTACK = ['windup', 'start', 'cut', 'follow'];

function grid() {
  return Array.from({ length: FRAME_H }, () => Array(FRAME_W).fill(null));
}

function makePainter(g) {
  const put = (x, y, c) => {
    if (x < 0 || y < 0 || x >= FRAME_W || y >= FRAME_H) return;
    g[y][x] = c;
  };
  // L'épée ressort toujours : sur le corps elle est claire, sur la neige sombre.
  const blade = (x, y) => {
    if (x < 0 || y < 0 || x >= FRAME_W || y >= FRAME_H) return;
    g[y][x] = g[y][x] ? 's' : 'b';
  };
  return { put, blade };
}

// ── Profil (tourné vers la droite ; la gauche est obtenue par miroir) ──
function side(pose) {
  const g = grid();
  const { put, blade } = makePainter(g);
  const bob = pose.bob || 0;
  const lean = pose.lean || 0;
  const x = CX + lean;
  const y = Y0 + bob;

  // Jambes
  const L = GROUND - 1;
  if (pose.legs === 'apart' || pose.legs === 'apart2') {
    put(CX - 1, L - 1, 'b'); put(CX - 2, L, 'b');
    put(CX + 1, L - 1, 'b'); put(CX + 2, L, 'b');
  } else if (pose.legs === 'liftL' || pose.legs === 'liftR') {
    put(CX, L - 1, 'b'); put(CX, L, 'b');
    put(CX + 1, L - 1, 'b');
  } else if (pose.legs === 'lunge') {
    put(CX + 1, L - 1, 'b'); put(CX + 2, L, 'b');
    put(CX - 1, L - 1, 'b'); put(CX - 2, L, 'b'); put(CX - 3, L, 'b');
  } else {
    put(CX - 1, L - 1, 'b'); put(CX - 1, L, 'b');
    put(CX + 1, L - 1, 'b'); put(CX + 1, L, 'b');
  }

  // Cape, derrière
  for (let i = 3; i <= 6; i++) put(x - 2, y + i, 'r');
  if (pose.cape) { put(x - 3, y + 5, 'r'); put(x - 3, y + 6, 'r'); }
  else put(x - 3, y + 6, 'r');

  // Buste
  for (let i = 3; i <= 6; i++) for (let dx = -1; dx <= 1; dx++) put(x + dx, y + i, 'b');

  // Tête : casque à corne, visage, barbe et cheveux roux
  put(x - 1, y, 'b'); put(x, y, 'b'); put(x + 1, y, 'b');
  put(x, y - 1, 'b');
  put(x - 2, y - 1, 'b');                // corne
  put(x - 1, y + 1, 'r'); put(x, y + 1, 's'); put(x + 1, y + 1, 's');
  put(x + 2, y + 1, 'b');                // nasal du casque
  put(x - 1, y + 2, 'r'); put(x, y + 2, 'r'); put(x + 1, y + 2, 'r');
  put(x + 1, y + 3, 'r');                // pointe de barbe

  // Bras et épée
  const sword = pose.sword || 'rest';
  if (sword === 'rest') {
    // Lame portée vers l'avant et vers le haut : pointée vers le sol,
    // on la confondait avec une troisième jambe.
    const hx = x + 1 + (pose.swing > 0 ? 1 : 0), hy = y + 5 + (pose.swing < 0 ? 1 : 0);
    put(hx, hy, 's');
    blade(hx + 1, hy - 1); blade(hx + 2, hy - 2); blade(hx + 3, hy - 3);
  } else if (sword === 'windup') {
    put(x, y + 4, 's');
    blade(x - 1, y + 5); blade(x - 2, y + 5); blade(x - 3, y + 6); blade(x - 4, y + 6);
  } else if (sword === 'start') {
    put(x + 1, y + 2, 's');
    blade(x + 1, y + 1); blade(x + 1, y); blade(x + 2, y - 1); blade(x + 2, y - 2); blade(x + 3, y - 3);
  } else if (sword === 'cut') {
    put(x + 2, y + 4, 's');
    for (let i = 1; i <= 5; i++) blade(x + 2 + i, y + 4 - (i > 3 ? 1 : 0));
  } else if (sword === 'follow') {
    put(x + 1, y + 5, 's');
    blade(x + 2, y + 6); blade(x + 3, y + 7); blade(x + 4, y + 8); blade(x + 5, y + 8);
  }
  return g;
}

// ── Face (vers le bas de l'écran) ──
function front(pose) {
  const g = grid();
  const { put, blade } = makePainter(g);
  const y = Y0 + (pose.bob || 0);
  const x = CX;
  const L = GROUND - 1;

  // Jambes : celle qui se lève n'a plus que son pixel du haut
  const left = pose.legs !== 'liftL', right = pose.legs !== 'liftR';
  put(x - 1, L - 1, 'b'); if (left) put(x - 1, L, 'b');
  put(x + 1, L - 1, 'b'); if (right) put(x + 1, L, 'b');

  // Buste, épaules couvertes par la cape
  for (let i = 3; i <= 6; i++) for (let dx = -1; dx <= 1; dx++) put(x + dx, y + i, 'b');
  put(x - 2, y + 3, 'r'); put(x + 2, y + 3, 'r');
  if (pose.cape) { put(x - 2, y + 6, 'r'); put(x + 2, y + 6, 'r'); }

  // Tête
  put(x - 1, y, 'b'); put(x, y, 'b'); put(x + 1, y, 'b');
  put(x - 2, y - 1, 'b'); put(x + 2, y - 1, 'b');   // cornes
  put(x - 1, y + 1, 's'); put(x, y + 1, 'b'); put(x + 1, y + 1, 's');  // nasal
  put(x - 1, y + 2, 'r'); put(x, y + 2, 'r'); put(x + 1, y + 2, 'r');
  put(x, y + 3, 'r');

  attackArms(pose, put, blade, x, y, 'front');
  return g;
}

// ── Dos (vers le haut de l'écran) ──
function back(pose) {
  const g = grid();
  const { put, blade } = makePainter(g);
  const y = Y0 + (pose.bob || 0);
  const x = CX;
  const L = GROUND - 1;

  const left = pose.legs !== 'liftL', right = pose.legs !== 'liftR';
  put(x - 1, L - 1, 'b'); if (left) put(x - 1, L, 'b');
  put(x + 1, L - 1, 'b'); if (right) put(x + 1, L, 'b');

  // Épée d'abord : vue de dos, le corps la masque en partie
  attackArms(pose, put, blade, x, y, 'back');

  // Cape rouge qui couvre le dos, et s'évase quand il marche
  for (let i = 3; i <= 6; i++) for (let dx = -1; dx <= 1; dx++) put(x + dx, y + i, 'r');
  put(x - 2, y + 3, 'b'); put(x + 2, y + 3, 'b');
  if (pose.cape) { put(x - 2, y + 6, 'r'); put(x + 2, y + 6, 'r'); }
  else { put(x + (pose.swing > 0 ? 2 : -2), y + 6, 'r'); }

  put(x - 1, y, 'b'); put(x, y, 'b'); put(x + 1, y, 'b');
  put(x - 2, y - 1, 'b'); put(x + 2, y - 1, 'b');
  put(x - 1, y + 1, 'b'); put(x, y + 1, 'b'); put(x + 1, y + 1, 'b');
  put(x - 1, y + 2, 'r'); put(x, y + 2, 'r'); put(x + 1, y + 2, 'r');
  return g;
}

// Bras (face et dos) : l'épée est dans la main droite du viking,
// c'est-à-dire à gauche de l'écran vu de face, à droite vu de dos.
function attackArms(pose, put, blade, x, y, view) {
  const m = view === 'front' ? -1 : 1;  // côté de l'épée à l'écran
  const sword = pose.sword || 'rest';
  const sw = pose.swing || 0;
  // Main libre
  put(x - 2 * m, y + 4, 'b');
  put(x - 2 * m, y + 5 - (sword === 'rest' ? sw * m : 0), 's');

  if (sword === 'rest') {
    put(x + 2 * m, y + 4, 'b');
    const hy = y + 5 + sw * m;
    put(x + 2 * m, hy, 's');
    blade(x + 3 * m, hy + 1); blade(x + 3 * m, hy + 2); blade(x + 4 * m, hy + 3);
  } else if (sword === 'windup') {
    put(x + 2 * m, y + 3, 's');
    blade(x + 3 * m, y + 2); blade(x + 3 * m, y + 1); blade(x + 4 * m, y); blade(x + 4 * m, y - 1);
  } else if (sword === 'start') {
    put(x + 2 * m, y + 4, 's');
    for (let i = 1; i <= 4; i++) blade(x + (2 + i) * m, y + 4 - (i > 2 ? 1 : 0));
  } else if (sword === 'cut') {
    put(x, y + 5, 's');
    for (let i = 1; i <= 5; i++) blade(x - i * m, y + 6);
  } else if (sword === 'follow') {
    put(x - 2 * m, y + 5, 's');
    blade(x - 3 * m, y + 6); blade(x - 4 * m, y + 7); blade(x - 4 * m, y + 8);
  }
}

const DRAW = { side, front, back };

function attackPose(phase) {
  return {
    windup: { legs: 'stand', bob: 0, sword: 'windup', lean: -0 },
    start: { legs: 'stand', bob: -1, sword: 'start' },
    cut: { legs: 'lunge', bob: 0, sword: 'cut', lean: 1, cape: 1 },
    follow: { legs: 'lunge', bob: 0, sword: 'follow', lean: 1 },
  }[phase];
}

// Toutes les images, dans l'ordre de la planche.
// Noms : `${vue}-idle`, `${vue}-walk-${i}`, `${vue}-attack-${i}`.
export function vikingFrames() {
  const frames = [];
  for (const view of ['side', 'front', 'back']) {
    const draw = DRAW[view];
    frames.push({ name: `${view}-idle`, grid: draw({ legs: 'stand', bob: 0, swing: 0 }) });
    WALK.forEach((p, i) => frames.push({ name: `${view}-walk-${i}`, grid: draw(p) }));
    ATTACK.forEach((phase, i) => {
      const pose = attackPose(phase);
      // En profil, la fente n'a de sens que vers l'avant ; de face/dos on reste planté
      if (view !== 'side') { pose.legs = 'stand'; pose.lean = 0; }
      frames.push({ name: `${view}-attack-${i}`, grid: draw(pose) });
    });
  }
  return frames;
}

// Peint la planche dans un canvas : une ligne de FRAME_W × FRAME_H par image.
export function paintSheet(canvas, palette) {
  const frames = vikingFrames();
  canvas.width = FRAME_W * frames.length;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  frames.forEach((f, i) => {
    f.grid.forEach((row, y) => row.forEach((c, x) => {
      if (!c) return;
      ctx.fillStyle = palette[c];
      ctx.fillRect(i * FRAME_W + x, y, 1, 1);
    }));
  });
  return frames.map((f, i) => ({ name: f.name, x: i * FRAME_W }));
}
