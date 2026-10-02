/* La meute : dans la grande clairière du bosquet sacré, des loups sortent de
   la forêt noire quand le viking y entre. Ils l'encerclent, grondent, et
   bondissent l'un après l'autre pour mordre. Deux coups en abattent un ; s'il
   s'enfuit loin (ou s'il tombe), les survivants retournent sous les arbres.

   Comme foe.js, le module ne connaît la scène que par ce qu'on lui passe. */
import { WOLF_ANIMS, WOLF_W, WOLF_H, WOLF_GROUND } from './wolf.js?v=1.27.1';
import { paintFrames } from './viking.js?v=1.27.1';

export const WOLF_HP = 2;
const COUNT = 4;
const RING = { rx: 30, ry: 17 };      // ils tournent autour de lui, à distance
const TROT = 30, GALLOP = 58, LUNGE = 125;

export function createPack(scene, palette, { den, radius, isLand, onBite, bleed, dead = [] }) {
  // ── La planche ──
  const frames = [];
  for (const [key, anim] of Object.entries(WOLF_ANIMS)) anim.frames.forEach((g, i) => frames.push({ name: `${key}-${i}`, grid: g }));
  const sheet = document.createElement('canvas');
  const painted = paintFrames(sheet, frames, WOLF_W, WOLF_H, palette);
  const tex = scene.textures.addCanvas('wolf', sheet);
  painted.forEach(f => tex.add(f.name, 0, f.x, 0, WOLF_W, WOLF_H));
  for (const [key, anim] of Object.entries(WOLF_ANIMS)) {
    scene.anims.create({
      key: `wolf-${key}`, frameRate: anim.fps, repeat: key === 'hurle' ? 0 : -1,
      frames: anim.frames.map((_, i) => ({ key: 'wolf', frame: `${key}-${i}` })),
    });
  }

  // Chacun a son repaire, à la lisière, d'où il sort et où il retourne
  const wolves = Array.from({ length: COUNT }, (_, i) => {
    const a = (i / COUNT) * Math.PI * 2 + 0.6 + Math.sin(i * 7.3) * 0.4;
    const lair = { x: den.x + Math.cos(a) * (radius + 26), y: den.y + Math.sin(a) * (radius + 26) * 0.75 };
    const sprite = scene.add.sprite(lair.x, lair.y, 'wolf', 'arret-0')
      .setOrigin(0.5, (WOLF_GROUND + 1) / WOLF_H).setVisible(false);
    return {
      i, lair, sprite, pos: { ...lair }, hp: WOLF_HP, state: 'hidden', timer: 0,
      angle: a, spin: i % 2 ? 1 : -1, vx: 0, vy: 0, bitten: false,
    };
  });

  // scent : on s'est enfui en saignant ; si l'on revient, ils sortent plus tôt,
  // sur la piste de sang, et poursuivent plus loin
  const pack = { state: 'idle', wolves, lungeClock: 0, heard: false, scent: false };

  function play(w, key) {
    const k = `wolf-${key}`;
    if (w.sprite.anims.currentAnim?.key !== k || !w.sprite.anims.isPlaying) w.sprite.play(k);
  }
  function lie(w, dir) {
    w.state = 'dead'; w.dir = dir;
    w.sprite.stop();
    w.sprite.setVisible(true).setAlpha(1).setFrame('mort-0').setFlipX(dir < 0).setPosition(Math.round(w.pos.x) + 0.5, Math.round(w.pos.y) + 1).setDepth(w.pos.y - 1);
  }
  // Ceux qu'on a tués restent là où ils sont tombés
  for (const d of dead) {
    const w = wolves[d.i];
    if (!w) continue;
    w.pos = { x: d.x, y: d.y };
    lie(w, d.dir || 1);
  }
  const alive = () => wolves.filter(w => w.state !== 'dead');

  function moveToward(w, tx, ty, speed, dt) {
    const dx = tx - w.pos.x, dy = ty - w.pos.y, d = Math.hypot(dx, dy);
    if (d < 1) return d;
    const s = Math.min(d, speed * dt);
    const nx = w.pos.x + dx / d * s, ny = w.pos.y + dy / d * s;
    if (isLand(nx, ny)) { w.pos.x = nx; w.pos.y = ny; }
    if (Math.abs(dx) > 0.5) w.sprite.setFlipX(dx < 0);
    return d;
  }

  // Tous retournent sous les arbres (on s'est enfui, ou on est tombé)
  function scatter() {
    pack.state = 'leaving';
    for (const w of alive()) { w.state = 'leave'; w.hp = WOLF_HP; w.sprite.setAlpha(1); }
  }

  Object.defineProperty(pack, 'engaged', { get: () => pack.state === 'hunt' && alive().length > 0 });
  Object.defineProperty(pack, 'deadList', { get: () => wolves.filter(w => w.state === 'dead').map(w => ({ i: w.i, x: Math.round(w.pos.x), y: Math.round(w.pos.y), dir: w.dir })) });

  return Object.assign(pack, {
    // Le loup le plus proche de (x, y), s'il y en a un qui chasse
    nearest(x, y) {
      let best = null, bd = Infinity;
      for (const w of alive()) {
        if (w.state === 'hidden') continue;
        const d = Math.hypot(w.pos.x - x, w.pos.y - y);
        if (d < bd) { bd = d; best = w; }
      }
      return best && { wolf: best, d: bd };
    },

    // La lame touche (x, y) : un loup dessous ? `probe` : sans le blesser
    hitAt(x, y, dir, probe = false) {
      for (const w of alive()) {
        if (w.state === 'hidden' || w.state === 'leave') continue;
        if (Math.abs(x - w.pos.x) > 7 || Math.abs(y - (w.pos.y - 2)) > 5) continue;
        if (probe) return w;
        w.hp--;
        bleed(w.pos.x, w.pos.y, 4);
        if (w.hp <= 0) { lie(w, dir); return w; }
        w.state = 'hurt'; w.timer = 0.45;
        w.vx = dir * 60; w.vy = 0;
        w.sprite.stop(); w.sprite.setFrame('bond-1');
        scene.tweens.add({ targets: w.sprite, alpha: 0.2, duration: 70, yoyo: true, repeat: 2 });
        pack.lungeClock = Math.max(pack.lungeClock, 0.9);    // les autres hésitent
        return w;
      }
      return null;
    },

    reset() { if (pack.state === 'hunt') scatter(); },

    update(dt, player) {
      const p = player.pos;
      const dDen = Math.hypot(p.x - den.x, (p.y - den.y) * 1.3);
      const away = player.dead || player.inside || player.rowing;

      // On approche : un hurlement, au loin, avant de les voir
      if (!pack.heard && !away && dDen < radius + 150 && alive().length) { pack.heard = true; scene.onPackSound('howl', { n: 3 }); }
      if (dDen > radius + 400) pack.heard = false;

      const reach = pack.scent ? radius + 140 : radius * 0.8;
      if (pack.state === 'idle' && !away && dDen < reach && alive().length) {
        pack.state = 'hunt';
        pack.chase = pack.scent ? radius * 4 : radius * 2.6;
        pack.scent = false;
        pack.lungeClock = 2.4;
        scene.onPackSound('howl', { n: 2 });
        for (const w of alive()) {
          w.state = 'arrive'; w.timer = w.i * 0.35;
          w.pos = { ...w.lair };
          w.sprite.setVisible(true).setAlpha(1);
        }
      }
      if (pack.state === 'hunt' && (away || dDen > pack.chase)) {
        // Blessé, on laisse du sang derrière soi : ils s'en souviendront
        if (!player.dead && player.hp < player.maxHp) pack.scent = true;
        scatter();
      }

      // Un seul bondit à la fois ; les autres tournent
      if (pack.state === 'hunt') {
        pack.lungeClock -= dt;
        const busy = wolves.some(w => w.state === 'crouch' || w.state === 'lunge');
        if (pack.lungeClock <= 0 && !busy) {
          const ready = alive().filter(w => w.state === 'circle');
          if (ready.length) {
            // Celui qui est le plus près
            ready.sort((a, b) => Math.hypot(a.pos.x - p.x, a.pos.y - p.y) - Math.hypot(b.pos.x - p.x, b.pos.y - p.y));
            const w = ready[0];
            w.state = 'crouch'; w.timer = 0.6;
            w.sprite.setFlipX(p.x < w.pos.x);
            play(w, 'grogne');
            scene.onPackSound('growl');
          }
          const n = alive().length;
          pack.lungeClock = (n > 2 ? 1.9 : 2.4) + Math.random() * 1.2;
        }
      }

      for (const w of wolves) {
        if (w.state === 'dead' || w.state === 'hidden') continue;
        w.timer -= dt;
        switch (w.state) {
          case 'arrive': {
            if (w.timer > 0) break;
            const tx = p.x + Math.cos(w.angle) * RING.rx, ty = p.y + Math.sin(w.angle) * RING.ry;
            play(w, 'galop');
            if (moveToward(w, tx, ty, GALLOP, dt) < 4) w.state = 'circle';
            break;
          }
          case 'circle': {
            // Il tourne autour, lentement, sans jamais s'arrêter tout à fait
            w.angle += w.spin * dt * 0.55;
            const tx = p.x + Math.cos(w.angle) * RING.rx, ty = p.y + Math.sin(w.angle) * RING.ry;
            const far = Math.hypot(tx - w.pos.x, ty - w.pos.y);
            moveToward(w, tx, ty, far > 10 ? GALLOP : TROT, dt);
            play(w, far > 10 ? 'galop' : 'trot');
            // Il garde l'œil sur le viking
            if (far < 6) w.sprite.setFlipX(p.x < w.pos.x);
            break;
          }
          case 'crouch':
            if (w.timer <= 0) {
              // Il bondit là où était le viking, un peu au-delà
              const dx = p.x - w.pos.x, dy = p.y - w.pos.y, d = Math.hypot(dx, dy) || 1;
              w.vx = dx / d * LUNGE; w.vy = dy / d * LUNGE;
              w.timer = Math.min(0.5, (d + 8) / LUNGE);
              w.state = 'lunge'; w.bitten = false;
              w.sprite.setFlipX(dx < 0);
              play(w, 'bond');
            }
            break;
          case 'lunge': {
            const nx = w.pos.x + w.vx * dt, ny = w.pos.y + w.vy * dt;
            if (isLand(nx, ny)) { w.pos.x = nx; w.pos.y = ny; }
            if (!w.bitten && !player.dead && Math.abs(p.x - w.pos.x) < 6 && Math.abs(p.y - w.pos.y) < 4) {
              w.bitten = true;
              onBite(w.pos.x, w.pos.y, Math.sign(w.vx) || 1);
            }
            if (w.timer <= 0) {
              // Il file au-delà, puis reprend sa place dans le cercle
              w.state = 'arrive'; w.timer = 0.2;
              w.angle = Math.atan2((w.pos.y - p.y) / RING.ry, (w.pos.x - p.x) / RING.rx);
            }
            break;
          }
          case 'hurt': {
            const nx = w.pos.x + w.vx * dt;
            if (isLand(nx, w.pos.y)) w.pos.x = nx;
            w.vx *= 1 - 8 * dt;
            if (w.timer <= 0) {
              w.state = 'arrive'; w.timer = 0.3;
              w.angle = Math.atan2((w.pos.y - p.y) / RING.ry, (w.pos.x - p.x) / RING.rx);
            }
            break;
          }
          case 'leave': {
            play(w, 'galop');
            if (moveToward(w, w.lair.x, w.lair.y, GALLOP, dt) < 3) {
              w.state = 'hidden'; w.sprite.setVisible(false).stop();
            }
            break;
          }
        }
        w.sprite.setPosition(Math.round(w.pos.x) + 0.5, Math.round(w.pos.y) + 1).setDepth(w.pos.y);
      }
      if (pack.state === 'leaving' && alive().every(w => w.state === 'hidden')) pack.state = 'idle';
      if (pack.state === 'hunt' && !alive().length) pack.state = 'done';
    },
  });
}
