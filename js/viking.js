/* Sprite du viking : une masse noire, pas un détail. Casque, lourd manteau
   jusqu'aux chevilles, pas de visage. L'épée est cachée ; elle n'apparaît que
   pendant l'attaque. La cape est un calque à part (capeFrames), qui bat au vent.
   Couleurs : b (bleu nuit), s (neige, pour la lame sur le corps),
   h (ombre au sol, bleu nuit transparent).
   Chaque image fait FRAME_W × FRAME_H ; les pieds touchent la ligne GROUND.
   Le corps est centré sur la colonne CX : un retournement horizontal ne le
   décale pas (origine au milieu de la colonne CX). */

import { designGrid } from './design-store.js?v=1.65.0';

export const FRAME_W = 32;
export const FRAME_H = 26;
export const CX = 15;
export const GROUND = 20;
export const ORIGIN_X = (CX + 0.5) / FRAME_W;
export const ORIGIN_Y = (GROUND + 1) / FRAME_H;

// Profil tourné vers la droite (la gauche s'obtient par miroir). Colonne 3 = CX.
const SIDE_BODY = [
  '...bb..',
  '..bbbb.',
  '.bbbbb.',
  '.bbbbb.',
  '.bbbbb.',
  '.bbbbb.',
  '.bbbbb.',
];
const SIDE_HEM = ['..bbbb.', '.bbbb..', '..bbbb.', '.bbbbb.'];
const SIDE_LEGS = {
  stand: ['..b.b..'],
  contact: ['.b...b.'],
  pass: ['...bb..', '...b...'],
  lunge: ['b....b.'],
  crouch: ['.b..bb.'],
};

const FRONT_BODY = [
  '..bbb..',
  '.bbbbb.',
  'bbbbbbb',
  'bbbbbbb',
  'bbbbbbb',
  '.bbbbb.',
];
const FRONT_HEM = ['.bbbbb.', 'bbbbbb.', '.bbbbb.', '.bbbbbb'];
const BACK_BODY = FRONT_BODY;
const BACK_HEM = FRONT_HEM;
const FACING_LEGS = {
  stand: ['..b.b..'],
  liftL: ['..b.b..', '....b..'],
  liftR: ['..b.b..', '..b....'],
  wide: ['.b...b.'],
};

function grid() {
  return Array.from({ length: FRAME_H }, () => Array(FRAME_W).fill(null));
}

function stamp(g, rows, x0, y0, onlyEmpty = false) {
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    const gx = x0 + x, gy = y0 + y;
    if (c === '.' || gx < 0 || gy < 0 || gx >= FRAME_W || gy >= FRAME_H) return;
    if (onlyEmpty && g[gy][gx] && g[gy][gx] !== 'h') return;
    g[gy][gx] = c;
  }));
}

// Ombre au sol, sur la ligne même des pieds : il pèse sur la neige.
function shadow(g, from, to) {
  for (let x = from; x <= to; x++) if (!g[GROUND][x]) g[GROUND][x] = 'h';
  for (let x = from + 1; x < to; x++) if (!g[GROUND + 1][x]) g[GROUND + 1][x] = 'h';
}

// Corps + ourlet + jambes. `lean` décale le haut du corps horizontalement.
// Renvoie aussi les bords du haut du corps, pour y accrocher la cape.
function figure(body, hem, legs, { bob = 0, lean = 0 } = {}) {
  const g = grid();
  const x0 = CX - 3;
  const bodyTop = GROUND - 1 - body.length + bob;
  stamp(g, body, x0 + lean, bodyTop);
  stamp(g, [hem], x0 + lean, bodyTop + body.length);
  // Les jambes en dernier : les pieds restent visibles même accroupi
  stamp(g, legs, x0, GROUND - legs.length + 1);
  shadow(g, CX - 4, CX + 4);
  const row = body[2];
  const cape = {
    west: x0 + lean + row.indexOf('b'),
    east: x0 + lean + row.lastIndexOf('b'),
    y: bodyTop + 2,  // l'épaule, sous le casque
  };
  return { g, cape };
}

// L'épée : une lame tracée de la main vers la pointe.
// `behind` : cachée par le corps (on ne dessine que hors de la silhouette).
function blade(g, x0, y0, dx, dy, len = 7, behind = false) {
  for (let i = 0; i <= len; i++) {
    const x = Math.round(x0 + dx * i), y = Math.round(y0 + dy * i);
    if (x < 0 || y < 0 || x >= FRAME_W || y >= FRAME_H) continue;
    const under = g[y][x] && g[y][x] !== 'h';
    if (under && behind) continue;
    g[y][x] = under ? 's' : 'b';
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

// ── Attaques : on arme loin derrière, on frappe fort, la lame s'écrase ──
// Profil (vers la droite) : la pointe finit dans la neige devant lui.
function sideAttack(i) {
  if (i === 0) {
    const f = figure(SIDE_BODY, SIDE_HEM[3], SIDE_LEGS.crouch, { bob: 1, lean: -1 });
    blade(f.g, CX - 1, GROUND - 5, -0.55, -1, 7);
    return f;
  }
  if (i === 1) {
    const f = figure(SIDE_BODY, SIDE_HEM[0], SIDE_LEGS.stand, { bob: -1 });
    blade(f.g, CX + 1, GROUND - 7, 0.35, -1, 7);
    return f;
  }
  if (i === 2) {
    const f = figure(SIDE_BODY, SIDE_HEM[1], SIDE_LEGS.lunge, { bob: 1, lean: 1 });
    blade(f.g, CX + 3, GROUND - 4, 1, 0.55, 7);
    return f;
  }
  const f = figure(SIDE_BODY, SIDE_HEM[0], SIDE_LEGS.crouch, { bob: 1 });
  blade(f.g, CX + 2, GROUND - 3, 1, 0.4, 3);
  return f;
}

// Face (vers le bas de l'écran) : lame levée derrière la tête, passage sur le
// côté, puis elle plonge vers nous et se plante devant ses pieds.
function frontAttack(i) {
  if (i === 0) {
    const f = figure(FRONT_BODY, FRONT_HEM[3], FACING_LEGS.wide, { bob: 1 });
    blade(f.g, CX + 2, GROUND - 7, 0.25, -1, 7, true);
    return f;
  }
  if (i === 1) {
    const f = figure(FRONT_BODY, FRONT_HEM[0], FACING_LEGS.stand, { bob: -1 });
    blade(f.g, CX + 4, GROUND - 6, 1, 0.1, 6);
    return f;
  }
  if (i === 2) {
    const f = figure(FRONT_BODY, FRONT_HEM[1], FACING_LEGS.wide, { bob: 1 });
    blade(f.g, CX, GROUND - 4, 0, 1, 8);
    return f;
  }
  const f = figure(FRONT_BODY, FRONT_HEM[0], FACING_LEGS.wide, { bob: 1 });
  blade(f.g, CX + 1, GROUND - 3, 0.3, 1, 4);
  return f;
}

// Dos (vers le haut de l'écran) : lame basse derrière lui (vers nous),
// passage sur le côté, puis elle s'abat devant lui, au-delà de sa tête.
function backAttack(i) {
  if (i === 0) {
    const f = figure(BACK_BODY, BACK_HEM[3], FACING_LEGS.wide, { bob: 1 });
    blade(f.g, CX + 3, GROUND - 4, 0.3, 1, 5);
    return f;
  }
  if (i === 1) {
    const f = figure(BACK_BODY, BACK_HEM[0], FACING_LEGS.stand, { bob: -1 });
    blade(f.g, CX + 4, GROUND - 7, 1, -0.15, 6);
    return f;
  }
  if (i === 2) {
    const f = figure(BACK_BODY, BACK_HEM[1], FACING_LEGS.wide, { bob: 1 });
    blade(f.g, CX, GROUND - 5, 0, -1, 11, true);
    return f;
  }
  const f = figure(BACK_BODY, BACK_HEM[0], FACING_LEGS.wide, { bob: 1 });
  blade(f.g, CX + 1, GROUND - 7, 0.2, -1, 4, true);
  return f;
}

// Diagonales (de profil, vers la droite) : vers le bas, on arme au-dessus de
// l'épaule et l'on abat la lame en travers devant soi ; vers le haut, on arme
// bas derrière et l'on fauche en remontant, la pointe au loin.
function diagDownAttack(i) {
  if (i === 0) {
    const f = figure(SIDE_BODY, SIDE_HEM[3], SIDE_LEGS.crouch, { bob: 1, lean: -1 });
    blade(f.g, CX - 1, GROUND - 6, -0.8, -0.8, 7);
    return f;
  }
  if (i === 1) {
    const f = figure(SIDE_BODY, SIDE_HEM[0], SIDE_LEGS.stand, { bob: -1 });
    blade(f.g, CX, GROUND - 8, 0.2, -1, 7);
    return f;
  }
  if (i === 2) {
    const f = figure(SIDE_BODY, SIDE_HEM[1], SIDE_LEGS.lunge, { bob: 1, lean: 1 });
    blade(f.g, CX + 3, GROUND - 5, 0.75, 1, 8);
    return f;
  }
  const f = figure(SIDE_BODY, SIDE_HEM[0], SIDE_LEGS.crouch, { bob: 1 });
  blade(f.g, CX + 2, GROUND - 3, 0.6, 1, 4);
  return f;
}

function diagUpAttack(i) {
  if (i === 0) {
    const f = figure(SIDE_BODY, SIDE_HEM[3], SIDE_LEGS.crouch, { bob: 1, lean: -1 });
    blade(f.g, CX - 1, GROUND - 4, -1, 0.45, 6);
    return f;
  }
  if (i === 1) {
    const f = figure(SIDE_BODY, SIDE_HEM[0], SIDE_LEGS.stand, { bob: -1 });
    blade(f.g, CX + 2, GROUND - 4, 1, 0.25, 6);
    return f;
  }
  if (i === 2) {
    const f = figure(SIDE_BODY, SIDE_HEM[1], SIDE_LEGS.lunge, { bob: 1, lean: 1 });
    blade(f.g, CX + 3, GROUND - 7, 0.75, -1, 9);
    return f;
  }
  const f = figure(SIDE_BODY, SIDE_HEM[0], SIDE_LEGS.crouch, { bob: 1 });
  blade(f.g, CX + 2, GROUND - 7, 0.5, -1, 4);
  return f;
}

// Où la lame touche la neige, par rapport aux pieds (profil : vers la droite).
export const IMPACT = {
  side: { x: 10, y: -1 },
  front: { x: 0, y: 4 },
  back: { x: 0, y: -16 },
  diagdown: { x: 8, y: 4 },
  diagup: { x: 8, y: -12 },
};
// Les diagonales se jouent de profil : marche et repos restent ceux du profil
export const ATTACK_VIEWS = ['side', 'front', 'back', 'diagdown', 'diagup'];

// Traînée du coup, en pixels relatifs aux pieds : { x, y, a (opacité) }.
// Profil : un arc qui part de derrière, passe au-dessus et plonge devant.
// Face et dos : un arc vertical qui passe par le côté droit.
// ── Le tourbillon ──
// L'anneau que trace la lame, de l'angle a0 à a1 (radians, 0 à droite, le
// sens des aiguilles d'une montre à l'écran) : un trait épais, ovale (vu de
// biais), bosselé, jamais un cercle parfait. Pixels { x, y, a, front }
// relatifs au centre (les pieds, 3 pixels plus haut) ; `front` : devant le
// viking (la moitié basse de l'ovale)
export function whirlArc(a0, a1, R = 12) {
  const out = [], seen = new Set();
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) * R * 1.6));
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n;
    const wob = Math.sin(a * 3 + 1) * 0.9 + Math.sin(a * 7 + 2) * 0.5;
    for (const [dr, al] of [[0, 1], [1, 0.75], [-1, 0.45]]) {
      const r = R + wob + dr;
      const x = Math.round(Math.cos(a) * r), y = Math.round(Math.sin(a) * r * 0.55);
      const k = `${x},${y}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ x, y, a: al, front: Math.sin(a) > 0 });
    }
  }
  return out;
}
// Le souffle : une onde qui s'élargit (rayon r) et se déchire en s'éloignant
export function blastRing(r, seed = 1) {
  const out = [], n = Math.ceil(r * 5);
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    const h = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
    const tear = h - Math.floor(h);
    if (tear < Math.min(0.75, r / 60)) continue;                                // des trous, de plus en plus
    const rr = r + Math.sin(a * 5 + seed) * r * 0.06;
    out.push({ x: Math.round(Math.cos(a) * rr), y: Math.round(Math.sin(a) * rr * 0.55) });
  }
  return out;
}

export function smearPixels(view) {
  const out = [];
  const arc = (cx, cy, rx0, rx1, ry0, ry1, from, to) => {
    for (let a = from; from < to ? a <= to : a >= to; a += from < to ? 3 : -3) {
      const t = Math.abs(a - from) / Math.abs(to - from);
      const rad = a * Math.PI / 180;
      const steps = 4;
      for (let k = 0; k <= steps; k++) {
        // Bords pleins, cœur en pointillé : l'arc a l'air de vibrer
        if (k > 0 && k < steps && (k + Math.round(a / 3)) % 2) continue;
        const rx = rx0 + (rx1 - rx0) * k / steps, ry = ry0 + (ry1 - ry0) * k / steps;
        out.push({ x: Math.round(cx + Math.cos(rad) * rx), y: Math.round(cy + Math.sin(rad) * ry), a: 0.15 + 0.65 * t });
      }
    }
  };
  if (view === 'side') arc(2, -7, 5, 10, 5, 10, -150, 40);
  else if (view === 'diagdown') arc(2, -6, 5, 10, 5, 10, -175, 70);
  else if (view === 'diagup') arc(2, -7, 5, 10, 5, 9, 160, -65);
  else if (view === 'front') arc(0, -6, 3, 6, 7, 11, -95, 95);
  else arc(0, -8, 3, 6, 6, 10, 95, -95);
  return out;
}

// Toutes les images, dans l'ordre de la planche.
// (`raw` : sans les poses redessinées à la main, designs.js)
export function vikingFrames(raw = false) {
  const frames = [];
  const push = (name, f) => frames.push({ name, grid: raw ? f.g : designGrid(`viking-${name}`, f.g), cape: f.cape });
  push('side-idle', figure(SIDE_BODY, SIDE_HEM[0], SIDE_LEGS.stand));
  for (let i = 0; i < 4; i++) push(`side-walk-${i}`, sideWalk(i));
  for (let i = 0; i < 4; i++) push(`side-attack-${i}`, sideAttack(i));
  push('front-idle', figure(FRONT_BODY, FRONT_HEM[0], FACING_LEGS.stand));
  for (let i = 0; i < 4; i++) push(`front-walk-${i}`, facingWalk(FRONT_BODY, FRONT_HEM, i));
  for (let i = 0; i < 4; i++) push(`front-attack-${i}`, frontAttack(i));
  push('back-idle', figure(BACK_BODY, BACK_HEM[0], FACING_LEGS.stand));
  for (let i = 0; i < 4; i++) push(`back-walk-${i}`, facingWalk(BACK_BODY, BACK_HEM, i));
  for (let i = 0; i < 4; i++) push(`back-attack-${i}`, backAttack(i));
  for (let i = 0; i < 4; i++) push(`diagdown-attack-${i}`, diagDownAttack(i));
  for (let i = 0; i < 4; i++) push(`diagup-attack-${i}`, diagUpAttack(i));
  return frames;
}

// ── La cape, calque à part, qui flotte toujours sous le vent (vers l'est) ──
// Trois forces de vent × CAPE_PHASES temps. Le pixel (0, 0) est l'épaule.
export const CAPE_W = 14;
export const CAPE_H = 12;
export const CAPE_PHASES = 6;
export const CAPE_LEVELS = [0.15, 0.55, 1];

export function capeGrid(strength, phase) {
  const g = Array.from({ length: CAPE_H }, () => Array(CAPE_W).fill(null));
  const p = phase / CAPE_PHASES * Math.PI * 2;
  // Une cape courte, pas une cape de héros : au calme elle se confond avec le
  // dos (à peine un pli qui dépasse) ; quand le vent forcit, elle se soulève
  // de quelques pixels et claque.
  const len = 0.6 + strength * 3.2;
  const slope = 3.5 * (1 - strength) + 0.5;
  const norm = Math.sqrt(1 + slope * slope);
  for (let u = 0; u <= len; u += 0.25) {
    const t = u / len;
    const wave = Math.sin(u * 1.4 - p) * (0.15 + 0.8 * strength) * t;
    const cx = u / norm, cy = u * slope / norm + wave;
    const thick = 4 - t * 1.5;
    for (let k = 0; k < thick; k++) {
      const x = Math.round(cx), y = Math.round(cy + k);
      if (x >= 0 && y >= 0 && x < CAPE_W && y < CAPE_H) g[y][x] = 'b';
    }
  }
  // Un coin qui claque, un temps sur deux, par grand vent
  if (strength > 0.5 && phase % 2 === 0) {
    const x = Math.round(len / norm) + 1, y = Math.round(len * slope / norm) + 1;
    if (x < CAPE_W && y < CAPE_H) g[y][x] = 'b';
  }
  return g;
}

export function capeFrames(raw = false) {
  const frames = [];
  CAPE_LEVELS.forEach((s, level) => {
    for (let i = 0; i < CAPE_PHASES; i++) {
      const name = `cape-${level}-${i}`, g = capeGrid(s, i);
      frames.push({ name, grid: raw ? g : designGrid(name, g) });
    }
  });
  return frames;
}

// Peint une planche : les images côte à côte, chacune de w × h.
export function paintFrames(canvas, frames, w, h, palette) {
  canvas.width = w * frames.length;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  frames.forEach((f, i) => {
    f.grid.forEach((row, y) => row.forEach((c, x) => {
      if (!c) return;
      ctx.globalAlpha = c === 'h' ? 0.3 : 1;
      ctx.fillStyle = palette[c === 'h' ? 'b' : c];
      ctx.fillRect(i * w + x, y, 1, 1);
    }));
  });
  ctx.globalAlpha = 1;
  return frames.map((f, i) => ({ ...f, x: i * w }));
}

export function paintSheet(canvas, palette) {
  return paintFrames(canvas, vikingFrames(), FRAME_W, FRAME_H, palette);
}
