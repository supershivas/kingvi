/* Le megamoth : un papillon de nuit géant, en haut de la falaise. Posé dans
   la neige, ailes repliées, on le prend pour une bosse de neige. Quand on
   approche, il s'éveille et vient à la lumière : il tourne autour de la
   torche, en vol erratique, de plus en plus près, puis plonge sur la flamme
   et l'éteint (le noir, quelques secondes). On ne l'atteint que quand il
   plonge : quatre coups l'abattent ; il tombe en tournoyant et reste sur la
   neige, ailes ouvertes. Si l'on s'éloigne, il retourne se poser.

   Les dessins sont des placeholders, à redessiner dans l'atelier du labo
   (dossier « Le megamoth ») : `megamoth-repos`, `megamoth-vol-0` → `-3`,
   `megamoth-mort`. Le module ne connaît la scène que par ce qu'on lui passe. */

export const MOTH_HP = 4;
const WAKE = 62;          // il s'éveille quand on approche à tant de pixels
const LEASH = 210;        // au-delà (de son nid), il y retourne
const FLY = 46;           // sa vitesse en vol (pixels/s) ; il plonge plus vite
const DIVE = 68;
const TORCH_ALT = 8;      // la flamme est à tant de pixels au-dessus des pieds

// ── Les dessins (placeholders, tailles à garder) ──
export const MOTH_SIZE = { vol: { w: 35, h: 21 }, repos: { w: 15, h: 9 }, mort: { w: 35, h: 13 } };

function grid(w, h) { return Array.from({ length: h }, () => Array(w).fill('.')); }
// Une aile : une tache ovale, cernée, une ocelle et une bande sombres
function wing(g, cx, cy, rx, ry, tilt, side, ocelle) {
  const H = g.length, W = g[0].length;
  const inside = (x, y) => {
    const dx = (x - cx) * side, dy = y - cy;
    const u = dx * Math.cos(tilt) + dy * Math.sin(tilt), v = -dx * Math.sin(tilt) + dy * Math.cos(tilt);
    // (le bord d'attaque plus droit, le bord de fuite festonné)
    const scallop = 1 + 0.12 * Math.sin(u * 1.7) * (v > 0 ? 1 : 0.3);
    return (u / rx) ** 2 + (v / ry) ** 2 <= scallop;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inside(x + 0.5, y + 0.5)) continue;
    const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5) || !inside(x + 0.5, y + 1.5);
    g[y][x] = edge ? 'b' : 's';
  }
  if (ocelle && rx > 3) {
    const ox = Math.round(cx + side * rx * 0.45), oy = Math.round(cy - ry * 0.05);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (g[oy + dy]?.[ox + dx] === 's') g[oy + dy][ox + dx] = 'b';
  }
  // Une bande sombre en travers, interrompue
  for (let k = -ry; k <= ry; k++) {
    const x = Math.round(cx + side * rx * 0.72 + k * 0.4 * side), y = Math.round(cy + k);
    if (g[y]?.[x] === 's' && k % 3) g[y][x] = 'b';
  }
}
function body(g, cx, top, len) {
  for (let y = top; y < top + len; y++) {
    const half = y < top + 2 ? 0 : y < top + 5 ? 1 : y < top + len - 2 ? 1 : 0;
    for (let x = cx - half; x <= cx + half; x++) if (g[y]?.[x] != null) g[y][x] = (y - top) % 2 && y > top + 4 && x === cx ? 's' : 'b';
  }
  // Les antennes, en plumes, vers l'avant
  for (let k = 1; k <= 4; k++) for (const s of [-1, 1]) {
    const x = cx + s * (1 + Math.round(k * 0.7)), y = top - k;
    if (g[y]?.[x] != null) g[y][x] = 'b';
    if (k > 1 && g[y + 1]?.[x + s] != null && g[y + 1][x + s] === '.') g[y + 1][x + s] = 'b';
  }
}
// En vol : quatre temps d'un battement (ailes hautes, à mi-course, à plat, basses)
function flightFrame(k) {
  const { w, h } = MOTH_SIZE.vol, g = grid(w, h), cx = 17;
  const spread = [0.5, 0.82, 1, 0.74][k], lift = [-4, -2, 0, 2][k];
  for (const side of [-1, 1]) {
    wing(g, cx + side * (2 + 5.8 * spread), 9 + lift * 0.6, 7.2 * spread + 1.5, 5.2 - (1 - spread) * 2, -0.35 + lift * 0.06, side, true);
    wing(g, cx + side * (2 + 4.5 * spread), 14 + lift * 0.3, 5 * spread + 1.2, 3.6, 0.45, side, false);
  }
  body(g, cx, 6, 12);
  return g.map(r => r.join(''));
}
// Posé : les ailes repliées en toit, comme une bosse de neige
function restFrame() {
  const { w, h } = MOTH_SIZE.repos, g = grid(w, h), cx = 7;
  for (let y = 2; y < h; y++) {
    const half = Math.min(7, Math.round((y - 1) * 1.25));
    for (let x = cx - half; x <= cx + half; x++) {
      const edge = Math.abs(x - cx) === half || y === h - 1;
      g[y][x] = edge ? 'b' : (x - cx) % 3 === 0 && y > 4 ? 'b' : 's';
    }
  }
  g[1][cx] = 'b'; g[0][cx - 2] = 'b'; g[0][cx + 2] = 'b'; g[1][cx - 1] = 'b'; g[1][cx + 1] = 'b';
  return g.map(r => r.join(''));
}
// Mort : à plat sur la neige, ailes ouvertes, l'une déchirée
function deadFrame() {
  const { w, h } = MOTH_SIZE.mort, g = grid(w, h), cx = 17;
  for (const side of [-1, 1]) {
    wing(g, cx + side * 8, 5, 7.5, 3.6, -0.2, side, true);
    wing(g, cx + side * 6, 9, 6, 2.6, 0.3, side, false);
  }
  for (let y = 2; y < 11; y++) g[y][cx] = 'b';
  // La déchirure
  for (let k = 0; k < 6; k++) { const x = 28 - k, y = 2 + Math.round(k * 0.8); if (g[y]?.[x]) g[y][x] = '.'; if (g[y + 1]?.[x]) g[y + 1][x] = '.'; }
  return g.map(r => r.join(''));
}
export const MOTH_FRAMES = {
  repos: restFrame(),
  'vol-0': flightFrame(0), 'vol-1': flightFrame(1), 'vol-2': flightFrame(2), 'vol-3': flightFrame(3),
  mort: deadFrame(),
};
export const mothKey = k => `megamoth-${k}`;

// ── Dans le jeu ──
// `scene` : la scène Phaser (textures `megamoth-…` déjà faites) ; `lair` : son nid ;
// `dead` : { x, y } s'il a été abattu ; callbacks : onWake, onSnuff, onHit(dir),
// onFall, onDie({ x, y })
export function createMoth(scene, { lair, dead, palette, onWake = () => {}, onSnuff = () => {}, onHit = () => {}, onFall = () => {}, onDie = () => {}, onFlap = () => {} }) {
  const hex = c => parseInt(c.slice(1), 16);
  const m = {
    pos: { x: lair.x, y: lair.y }, alt: 0, vx: 0, vy: 0, hp: MOTH_HP, state: 'rest', t: Math.random() * 10,
    timer: 0, theta: 0, flip: false, sleepy: false, beat: 0,
  };
  const sprite = scene.add.image(lair.x + 0.5, lair.y + 1, mothKey('repos')).setOrigin(0.5, 1).setDepth(lair.y);
  const shadow = scene.add.graphics().setDepth(-450);
  const scales = scene.add.particles(0, 0, 'snowdust', {
    lifespan: { min: 700, max: 1500 }, speedX: { min: -5, max: 5 }, speedY: { min: 3, max: 10 },
    gravityY: 8, alpha: { start: 0.9, end: 0 }, emitting: false,
  }).setDepth(1e6 - 3);

  if (dead) { m.state = 'dead'; m.pos = { x: dead.x, y: dead.y }; sprite.setTexture(mothKey('mort')).setPosition(dead.x + 0.5, dead.y + 1); }

  const steer = (tx, ty, talt, speed, dt) => {
    const dx = tx - m.pos.x, dy = ty - m.pos.y, d = Math.hypot(dx, dy);
    const v = Math.min(speed, d * 3.2);
    const ax = d > 0.01 ? dx / d * v : 0, ay = d > 0.01 ? dy / d * v : 0;
    // (un vol de papillon : jamais en ligne droite, des embardées)
    m.vx += (ax + Math.sin(m.t * 7.3) * 16 - m.vx) * Math.min(1, dt * 5);
    m.vy += (ay + Math.sin(m.t * 5.1 + 2) * 10 - m.vy) * Math.min(1, dt * 5);
    m.pos.x += m.vx * dt; m.pos.y += m.vy * dt;
    m.alt += (talt + Math.sin(m.t * 9.7) * 1.2 - m.alt) * Math.min(1, dt * 3.5);
    if (Math.abs(m.vx) > 4) m.flip = m.vx < 0;
  };
  const toOrbit = () => { m.state = 'orbit'; m.timer = 2.8 + Math.random() * 2.6; };

  // (des accesseurs : Object.assign en figerait la valeur)
  Object.defineProperty(m, 'engaged', { get: () => ['wake', 'orbit', 'dive', 'recoil'].includes(m.state) });
  Object.defineProperty(m, 'alive', { get: () => m.state !== 'dead' && m.state !== 'fall' });
  const api = Object.assign(m, {
    sprite,

    // `c` : { px, py } les pieds du viking, { tx, ty } sa flamme, lit (la torche
    // brûle), away (dedans, mort, en barque : il n'est pas là)
    update(dt, c) {
      m.t += dt;
      m.prev = { x: m.pos.x, y: m.pos.y, alt: m.alt };
      if (m.state === 'dead') return;
      if (m.state === 'fall') {
        m.vy += 30 * dt;
        m.alt = Math.max(0, m.alt - (12 + m.vy) * dt);
        m.pos.x += Math.sin(m.t * 6) * 10 * dt;
        m.flip = Math.sin(m.t * 9) > 0;
        if (!m.alt) {
          m.state = 'dead';
          sprite.setTexture(mothKey('mort')).setOrigin(0.5, 1).setAngle(0);
          scales.explode(24, m.pos.x, m.pos.y - 2);
          onDie({ x: Math.round(m.pos.x), y: Math.round(m.pos.y) });
        }
        return;
      }
      const dPlayer = Math.hypot(c.px - m.pos.x, c.py - m.pos.y);
      const dLair = Math.hypot(c.px - lair.x, c.py - lair.y);
      const here = !c.away && dLair < LEASH;
      if (m.state === 'rest') {
        m.alt = 0;
        if (m.sleepy && (dPlayer > WAKE + 30 || c.away)) m.sleepy = false;
        if (here && !m.sleepy && dPlayer < WAKE) { m.state = 'wake'; m.timer = 1.1; onWake(); }
        return;
      }
      if (!here && m.state !== 'home') m.state = 'home';
      if (m.state === 'wake') {
        steer(m.pos.x, m.pos.y, 9, 0, dt);
        if ((m.timer -= dt) <= 0) toOrbit();
      } else if (m.state === 'orbit') {
        // Autour de la flamme : plus près quand elle brûle, au large quand elle s'est éteinte
        m.theta += dt * (1.2 + 0.6 * Math.sin(m.t * 0.7));
        const R = c.lit ? 22 + 6 * Math.sin(m.t * 0.9) : 42;
        steer(c.px + Math.cos(m.theta) * R, c.py + Math.sin(m.theta) * R * 0.55, c.lit ? 17 + 4 * Math.sin(m.t * 1.3) : 26, FLY, dt);
        if ((m.timer -= dt) <= 0 && c.lit) { m.state = 'dive'; m.timer = 2.4; }
      } else if (m.state === 'dive') {
        steer(c.tx, c.py + 1, TORCH_ALT, DIVE, dt);
        if (Math.hypot(c.tx - m.pos.x, c.py + 1 - m.pos.y) < 4 && Math.abs(m.alt - TORCH_ALT) < 4) {
          if (c.lit) { onSnuff(); scales.explode(14, c.tx, c.ty); }
          m.state = 'recoil'; m.timer = 1.3;
        } else if ((m.timer -= dt) <= 0) toOrbit();
      } else if (m.state === 'recoil') {
        const ax = m.pos.x - c.px, ay = m.pos.y - c.py, d = Math.hypot(ax, ay) || 1;
        steer(m.pos.x + ax / d * 30, m.pos.y + ay / d * 18, 24, FLY, dt);
        if ((m.timer -= dt) <= 0) toOrbit();
      } else if (m.state === 'home') {
        const d = Math.hypot(lair.x - m.pos.x, lair.y - m.pos.y);
        steer(lair.x, lair.y, d < 6 ? 0 : 14, FLY * 0.7, dt);
        if (here && dPlayer < WAKE * 0.8) toOrbit();
        else if (d < 2 && m.alt < 0.6) {
          m.state = 'rest'; m.alt = 0; m.sleepy = true; m.pos = { x: lair.x, y: lair.y };
          sprite.setTexture(mothKey('repos')).setOrigin(0.5, 1);
        }
      }
      // Les battements : de la poudre d'écailles qui tombe, le bruit sourd des ailes
      m.beat += dt * 5;
      if (m.beat >= 1) { m.beat -= 1; onFlap(dPlayer); if (Math.random() < 0.7) scales.explode(1, m.pos.x + (Math.random() - 0.5) * 16, m.pos.y - m.alt - 2); }
    },

    // `alpha` : entre les deux derniers pas de logique
    render(alpha = 1) {
      const p = m.prev || { ...m.pos, alt: m.alt };
      const x = p.x + (m.pos.x - p.x) * alpha, y = p.y + (m.pos.y - p.y) * alpha, alt = p.alt + (m.alt - p.alt) * alpha;
      const gx = Math.round(x), gy = Math.round(y);
      shadow.clear();
      if (m.state === 'dead' || m.state === 'rest') {
        sprite.setPosition(gx + 0.5, gy + 1).setDepth(gy).setFlipX(m.flip);
        return;
      }
      // En vol : l'image du battement, l'ombre sur la neige (tramée, accrochée au monde)
      const frame = m.state === 'fall' ? 2 : Math.floor(m.t * 20) % 4;
      sprite.setTexture(mothKey(`vol-${frame}`)).setOrigin(0.5, 0.62)
        .setPosition(gx + 0.5, Math.round(y - alt) - 3).setDepth(gy + 0.3).setFlipX(m.flip);
      const rx = Math.max(3, 9 - alt / 4), ry = Math.max(1.5, 2.6 - alt / 20);
      shadow.fillStyle(hex(palette.b), 0.45);
      for (let py = Math.floor(gy - ry); py <= gy + ry; py++) for (let px = Math.floor(gx - rx); px <= gx + rx; px++) {
        if (((px - gx) / rx) ** 2 + ((py - gy) / ry) ** 2 > 1 || (px + py) & 1) continue;
        shadow.fillRect(px, py, 1, 1);
      }
    },

    // Un coup du héros, dont la lame touche (x, y) : on ne l'atteint qu'au plus
    // bas (posé, ou quand il plonge sur la flamme). `probe` : seulement savoir
    hitAt(x, y, dir, probe = false) {
      if (!api.alive || m.state === 'home') return false;
      const bx = m.pos.x, by = m.pos.y - m.alt - 3;
      if (Math.abs(x - bx) > 9 || Math.abs(y - by) > (m.alt > 3 ? 10 : 6)) return false;
      if (probe) return true;
      m.hp--;
      scales.explode(10, bx, by);
      onHit(dir);
      if (m.hp <= 0) {
        m.state = 'fall'; m.vy = 0;
        onFall();
        return true;
      }
      if (m.state === 'rest') onWake();
      m.vx = dir * 50; m.state = 'recoil'; m.timer = 1.2;
      return true;
    },

    // On est tombé : il retourne se poser (s'il vit)
    reset() {
      if (!api.alive) return;
      m.hp = MOTH_HP; m.state = 'rest'; m.alt = 0; m.pos = { x: lair.x, y: lair.y }; m.prev = null; m.sleepy = false;
      sprite.setTexture(mothKey('repos')).setOrigin(0.5, 1);
    },
    setVisible(v) { sprite.setVisible(v); shadow.setVisible(v); },
  });
  return api;
}
