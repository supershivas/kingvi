/* Sprite du viking : une masse, pas un détail. Casque sombre, lourde cape
   rouge qui tombe jusqu'aux chevilles, pas de visage. L'épée est cachée sous
   la cape ; elle n'apparaît que pendant l'attaque.
   Couleurs : b (bleu nuit), r (rouge), h (ombre au sol, bleu nuit transparent).
   Chaque image fait FRAME_W × FRAME_H ; les pieds touchent la ligne GROUND. */

export const FRAME_W = 32;
export const FRAME_H = 24;
export const CX = 15;      // colonne d'ancrage (le pied avant, de profil)
export const GROUND = 19;  // ligne des pieds

// Profil tourné vers la droite (la gauche s'obtient par miroir).
// Colonne 3 du motif = CX. Le haut du corps est décalé par `bob` (−1 : monte).
const SIDE_BODY = [
  '..bb...',
  '.bbbb..',
  'rrbbb..',
  'rrrrb..',
  'rrrrb..',
  'rrrrb..',
  'rrrrr..',
];
// Ourlet de la cape : il traîne en arrière et balance à chaque pas.
const SIDE_HEM = ['.rrrr..', 'rrrr...', '.rrrr..', 'rrrrr..'];
// Jambes (dernière ligne = sol), une variante par temps du cycle.
const SIDE_LEGS = {
  stand: ['..b.b..'],
  contact: ['.b...b.'],
  pass: ['...bb..', '...b...'],
  lunge: ['b....b.'],
  crouch: ['.b..bb.'],
};

const FRONT_BODY = [
  '..bbb..',
  '.rbbbr.',
  'rrbbbrr',
  'rrbbbrr',
  'rrbbbrr',
  'rrbbbrr',
];
const FRONT_HEM = ['.rbbbr.', 'rrbbbr.', '.rbbbr.', '.rbbbrr'];
const BACK_BODY = [
  '..bbb..',
  '.rbbbr.',
  'rrrrrrr',
  'rrrrrrr',
  'rrrrrrr',
  'rrrrrrr',
];
const BACK_HEM = ['.rrrrr.', 'rrrrrr.', '.rrrrr.', '.rrrrrr'];
const FACING_LEGS = {
  stand: ['..b.b..'],
  liftL: ['..b.b..', '....b..'],
  liftR: ['..b.b..', '..b....'],
};

function grid() {
  return Array.from({ length: FRAME_H }, () => Array(FRAME_W).fill(null));
}

function stamp(g, rows, x0, y0) {
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    const gx = x0 + x, gy = y0 + y;
    if (c === '.' || gx < 0 || gy < 0 || gx >= FRAME_W || gy >= FRAME_H) return;
    g[gy][gx] = c;
  }));
}

// Ombre au sol, sur la ligne même des pieds : il pèse sur la neige.
function shadow(g, from, to) {
  for (let x = from; x <= to; x++) if (!g[GROUND][x]) g[GROUND][x] = 'h';
  for (let x = from + 1; x < to; x++) if (!g[GROUND + 1][x]) g[GROUND + 1][x] = 'h';
}

// Corps + ourlet + jambes. `lean` décale le haut du corps horizontalement.
function figure(body, hem, legs, { bob = 0, lean = 0 } = {}) {
  const g = grid();
  const x0 = CX - 3;
  const bodyTop = GROUND - 1 - body.length + bob;
  stamp(g, body, x0 + lean, bodyTop);
  stamp(g, [hem], x0 + lean, bodyTop + body.length);
  // Les jambes en dernier : les pieds restent visibles même accroupi
  stamp(g, legs, x0, GROUND - legs.length + 1);
  shadow(g, CX - 4, CX + 3);
  return g;
}

// L'épée : une lame de 7 pixels, tracée de la main vers la pointe.
function blade(g, x0, y0, dx, dy, len = 7) {
  for (let i = 0; i <= len; i++) {
    const x = Math.round(x0 + dx * i), y = Math.round(y0 + dy * i);
    if (x < 0 || y < 0 || x >= FRAME_W || y >= FRAME_H) continue;
    g[y][x] = g[y][x] && g[y][x] !== 'h' ? 's' : 'b';
  }
}

function sideWalk(i) {
  const legs = [SIDE_LEGS.contact, SIDE_LEGS.pass, SIDE_LEGS.contact, SIDE_LEGS.pass][i];
  return figure(SIDE_BODY, SIDE_HEM[i], legs, { bob: i % 2 ? -1 : 0 });
}

function facingWalk(body, hems, i) {
  const legs = [FACING_LEGS.stand, FACING_LEGS.liftL, FACING_LEGS.stand, FACING_LEGS.liftR][i];
  return figure(body, hems[i], legs, { bob: i % 2 ? -1 : 0 });
}

// Attaque, de profil : on arme loin derrière, on frappe fort vers l'avant,
// la lame s'écrase dans la neige devant lui, puis retourne sous la cape.
function sideAttack(i) {
  if (i === 0) {
    // Armé : il se ramasse en arrière, la lame dressée derrière lui
    const g = figure(SIDE_BODY, SIDE_HEM[3], SIDE_LEGS.crouch, { bob: 1, lean: -1 });
    blade(g, CX - 2, GROUND - 5, -0.55, -1, 7);
    return g;
  }
  if (i === 1) {
    // Sommet du geste : la lame au-dessus de la tête
    const g = figure(SIDE_BODY, SIDE_HEM[0], SIDE_LEGS.stand, { bob: -1 });
    blade(g, CX, GROUND - 6, 0.35, -1, 7);
    return g;
  }
  if (i === 2) {
    // Impact : fente en avant, la pointe dans la neige
    const g = figure(SIDE_BODY, SIDE_HEM[1], SIDE_LEGS.lunge, { bob: 1, lean: 1 });
    blade(g, CX + 2, GROUND - 4, 1, 0.55, 7);
    return g;
  }
  // Retour : la lame remonte et disparaît sous la cape
  const g = figure(SIDE_BODY, SIDE_HEM[0], SIDE_LEGS.crouch, { bob: 1 });
  blade(g, CX + 1, GROUND - 3, 1, 0.4, 3);
  return g;
}

// Toutes les images, dans l'ordre de la planche.
export function vikingFrames() {
  const frames = [];
  frames.push({ name: 'side-idle', grid: figure(SIDE_BODY, SIDE_HEM[0], SIDE_LEGS.stand) });
  for (let i = 0; i < 4; i++) frames.push({ name: `side-walk-${i}`, grid: sideWalk(i) });
  for (let i = 0; i < 4; i++) frames.push({ name: `side-attack-${i}`, grid: sideAttack(i) });
  frames.push({ name: 'front-idle', grid: figure(FRONT_BODY, FRONT_HEM[0], FACING_LEGS.stand) });
  for (let i = 0; i < 4; i++) frames.push({ name: `front-walk-${i}`, grid: facingWalk(FRONT_BODY, FRONT_HEM, i) });
  frames.push({ name: 'back-idle', grid: figure(BACK_BODY, BACK_HEM[0], FACING_LEGS.stand) });
  for (let i = 0; i < 4; i++) frames.push({ name: `back-walk-${i}`, grid: facingWalk(BACK_BODY, BACK_HEM, i) });
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
      ctx.globalAlpha = c === 'h' ? 0.3 : 1;
      ctx.fillStyle = palette[c === 'h' ? 'b' : c];
      ctx.fillRect(i * FRAME_W + x, y, 1, 1);
    }));
  });
  ctx.globalAlpha = 1;
  return frames.map((f, i) => ({ name: f.name, x: i * FRAME_W }));
}
