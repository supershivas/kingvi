/* Les bêtes du jeu : cerfs et biches dans la forêt (toujours loin, ils
   s'enfuient à l'approche), un envol de corbeaux avant la forêt, et les
   charognards qui s'abattent sur un cadavre quand on s'en éloigne. */
import { STAG_ANIMS, DOE_ANIMS, DEER_W, DEER_H, DEER_GROUND } from './deer.js?v=1.27.0';
import { paintFrames } from './viking.js?v=1.27.0';
import { isLand, blocked, forestDensity, deepForest, CROWS } from './world.js?v=1.27.0';
import { audio } from './audio.js?v=1.27.0';

const DEER_ENABLED = false;
const DEER_MAX = 4;
const DEER_FLEE = 125;          // distance d'alerte (en marchant)
const DEER_FLEE_RUN = 175;      // … et en courant : on l'entend venir
const DEER_FAR = 430;           // au-delà, on les oublie

// Corbeau : posé (deux temps, il picore) et en vol (trois temps d'ailes)
const CROW_FRAMES = {
  sit0: ['.bb.', 'bbbb', '.b..'],
  sit1: ['....', 'bbb.', '..bb'],
  fly0: ['b...b', '.b.b.', '..b..'],
  fly1: ['.....', 'bbbbb', '..b..'],
  fly2: ['..b..', '.bbb.', 'b...b'],
};

export function createFauna(scene, palette) {
  const grid = rows => rows.map(r => [...r].map(c => (c === '.' ? null : c)));

  // ── Planches ──
  const deerFrames = [];
  for (const [who, anims] of [['stag', STAG_ANIMS], ['doe', DOE_ANIMS]]) {
    for (const [key, anim] of Object.entries(anims)) {
      anim.frames.forEach((g, i) => deerFrames.push({ name: `${who}-${key}-${i}`, grid: g }));
    }
  }
  const deerSheet = document.createElement('canvas');
  const painted = paintFrames(deerSheet, deerFrames, DEER_W, DEER_H, palette);
  const tex = scene.textures.addCanvas('deer', deerSheet);
  painted.forEach(f => tex.add(f.name, 0, f.x, 0, DEER_W, DEER_H));
  for (const [who, anims] of [['stag', STAG_ANIMS], ['doe', DOE_ANIMS]]) {
    for (const [key, anim] of Object.entries(anims)) {
      scene.anims.create({
        key: `${who}-${key}`,
        frames: anim.frames.map((_, i) => ({ key: 'deer', frame: `${who}-${key}-${i}` })),
        frameRate: anim.fps, repeat: -1,
      });
    }
  }

  const crowList = Object.entries(CROW_FRAMES).map(([name, rows]) => {
    const g = grid(rows);
    // Toutes les images du corbeau font 5 × 3
    const pad = g.map(r => [...r, ...Array(5 - r.length).fill(null)]);
    return { name, grid: pad };
  });
  const crowSheet = document.createElement('canvas');
  const crowPainted = paintFrames(crowSheet, crowList, 5, 3, palette);
  const ctex = scene.textures.addCanvas('crow', crowSheet);
  crowPainted.forEach(f => ctex.add(f.name, 0, f.x, 0, 5, 3));
  scene.anims.create({ key: 'crow-peck', frames: [{ key: 'crow', frame: 'sit0', duration: 900 }, { key: 'crow', frame: 'sit1', duration: 220 }], repeat: -1 });
  scene.anims.create({
    key: 'crow-fly',
    frames: ['fly0', 'fly1', 'fly2', 'fly1'].map(f => ({ key: 'crow', frame: f })),
    frameRate: 12, repeat: -1,
  });

  // ── Cerfs et biches ──
  const deer = [];
  let cooldown = 0;

  function spawnGroup(px, py) {
    for (let tries = 0; tries < 12; tries++) {
      const a = Math.random() * Math.PI * 2, d = 175 + Math.random() * 70;
      const x = px + Math.cos(a) * d, y = py + Math.sin(a) * d * 0.8;
      if (!isLand(x, y) || blocked(x, y) || deepForest(x, y) > 0.25 || forestDensity(x, y) < 0.02) continue;
      const n = 1 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n && deer.length < DEER_MAX; k++) {
        const who = k === 0 && Math.random() < 0.45 ? 'stag' : 'doe';
        const sprite = scene.add.sprite(x + k * 9 - 6, y + (k % 2) * 5, 'deer', `${who}-arret-0`)
          .setOrigin(0.5, (DEER_GROUND + 1) / DEER_H);
        deer.push({ sprite, who, state: 'idle', timer: Math.random() * 3, vx: 0, vy: 0 });
        setState(deer.at(-1), Math.random() < 0.6 ? 'graze' : 'idle');
      }
      return;
    }
  }

  function setState(d, state) {
    d.state = state;
    d.timer = 2 + Math.random() * 5;
    if (state === 'walk') {
      const a = Math.random() * Math.PI * 2;
      d.vx = Math.cos(a) * 5; d.vy = Math.sin(a) * 3;
      d.sprite.setFlipX(d.vx < 0);
    } else if (state !== 'flee') { d.vx = d.vy = 0; }
    const anim = { idle: 'arret', graze: 'broute', walk: 'marche', flee: 'bond' }[state];
    d.sprite.play(`${d.who}-${anim}`, true);
  }

  function updateDeer(dt, player, running) {
    const inForest = forestDensity(player.x, player.y) > 0.02 || forestDensity(player.x + 150, player.y) > 0.05;
    cooldown -= dt;
    if (inForest && cooldown <= 0 && deer.length < DEER_MAX) {
      spawnGroup(player.x, player.y);
      cooldown = 6 + Math.random() * 8;
    }
    for (let i = deer.length - 1; i >= 0; i--) {
      const d = deer[i], s = d.sprite;
      const dx = s.x - player.x, dy = s.y - player.y, dist = Math.hypot(dx, dy);
      if (d.state !== 'flee' && dist < (running ? DEER_FLEE_RUN : DEER_FLEE)) {
        // Ils détalent, loin du viking, en bondissant
        const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.6;
        d.vx = Math.cos(a) * (95 + Math.random() * 30);
        d.vy = Math.sin(a) * (70 + Math.random() * 20);
        d.sprite.setFlipX(d.vx < 0);
        setState(d, 'flee');
        d.timer = 3;
        // Toute la harde s'enfuit ensemble
        for (const o of deer) if (o !== d && o.state !== 'flee' && Math.hypot(o.sprite.x - s.x, o.sprite.y - s.y) < 40) {
          o.vx = d.vx * (0.9 + Math.random() * 0.2); o.vy = d.vy; o.sprite.setFlipX(o.vx < 0);
          setState(o, 'flee'); o.timer = 3;
        }
      }
      d.timer -= dt;
      s.x += d.vx * dt; s.y += d.vy * dt;
      if (d.state === 'walk' && !isLand(s.x, s.y)) setState(d, 'idle');
      if (d.timer <= 0 && d.state !== 'flee') setState(d, ['idle', 'graze', 'walk'][Math.floor(Math.random() * 3)]);
      s.setDepth(s.y);
      if ((d.state === 'flee' && (d.timer <= 0 || dist > 340)) || dist > DEER_FAR) {
        s.destroy();
        deer.splice(i, 1);
      }
    }
  }

  // ── Corbeaux : une volée posée près de la piste, qui s'envole à l'approche ──
  const crows = [];
  for (let i = 0; i < 16; i++) {
    const x = CROWS.x + Math.round((Math.random() - 0.5) * 50), y = CROWS.y + Math.round((Math.random() - 0.5) * 18);
    const sprite = scene.add.sprite(x, y, 'crow', 'sit0').setOrigin(0.5, 1).setDepth(y).setFlipX(Math.random() < 0.5);
    sprite.anims.play({ key: 'crow-peck', startFrame: Math.floor(Math.random() * 2) });
    sprite.anims.timeScale = 0.6 + Math.random() * 0.8;
    crows.push({ sprite, state: 'sit', delay: 0, vx: 0, vy: 0, life: 0 });
  }
  let scattered = false;

  function updateCrows(dt, player, running, wind) {
    if (!scattered && Math.hypot(CROWS.x - player.x, CROWS.y - player.y) < (running ? 120 : 80)) {
      scattered = true;
      // L'envol : une clameur, puis quelques cris qui s'éloignent
      audio.play('caw', { n: 3 });
      scene.time.delayedCall(700, () => audio.play('caw', { n: 2, pan: 0.4 }));
      scene.time.delayedCall(1600, () => audio.play('caw', { n: 1, pan: 0.7 }));
      for (const c of crows) {
        const away = Math.sign(c.sprite.x - player.x) || 1;
        c.state = 'wait';
        c.delay = Math.random() * 0.7;
        c.vx = away * (45 + Math.random() * 40);
        c.vy = -(55 + Math.random() * 35);
      }
    }
    for (let i = crows.length - 1; i >= 0; i--) {
      const c = crows[i], s = c.sprite;
      if (c.state === 'wait') {
        c.delay -= dt;
        if (c.delay <= 0) {
          c.state = 'fly';
          s.play('crow-fly'); s.anims.timeScale = 0.8 + Math.random() * 0.5;
          s.setDepth(1e6 - 3);
        }
      } else if (c.state === 'fly') {
        c.life += dt;
        // Ils montent en battant des ailes, puis filent avec le vent
        // Ils prennent de la vitesse et filent jusqu'à sortir de l'écran
        c.vy *= 1 - 0.2 * dt;
        c.vx += (Math.sign(c.vx) * 90 + wind * 0.5 - c.vx) * 0.5 * dt;
        s.x += c.vx * dt;
        s.y += c.vy * dt + Math.sin(c.life * 9 + i) * 0.3;
        const v = scene.cameras.main.worldView;
        const gone = s.x < v.x - 20 || s.x > v.right + 20 || s.y < v.y - 20 || s.y > v.bottom + 20;
        if (gone || c.life > 30) { s.destroy(); crows.splice(i, 1); }
      }
    }
  }

  // ── Charognards : quand on s'éloigne d'un cadavre, des corbeaux s'y
  // abattent ; ils repartent si l'on revient. Une volée par cadavre (l'autre
  // viking, les loups : `small`, moins de corbeaux, plus serrés) ──
  const flocks = new Map();
  function flockFor(corpse) {
    const key = `${Math.round(corpse.x)},${Math.round(corpse.y)}`;
    if (!flocks.has(key)) flocks.set(key, { carrion: [], wait: 3 + Math.random() * 4 });
    return flocks.get(key);
  }

  function updateCarrion(dt, player, running, corpse, flock) {
    const carrion = flock.carrion;
    flock.wait -= dt;
    const d = corpse ? Math.hypot(corpse.x - player.x, corpse.y - player.y) : Infinity;
    const spread = corpse?.small ? 10 : 22;
    if (corpse && !carrion.length && flock.wait <= 0 && d > 85 && d < 330) {
      // Ils arrivent de loin, du côté opposé au viking, un par un
      const n = corpse.small ? 2 + Math.floor(Math.random() * 3) : 4 + Math.floor(Math.random() * 4);
      const from = Math.sign(corpse.x - player.x) || 1;
      for (let k = 0; k < n; k++) {
        const land = { x: corpse.x + Math.round((Math.random() - 0.5) * spread), y: corpse.y + Math.round((Math.random() - 0.5) * 8) };
        const sx = corpse.x + from * (220 + Math.random() * 120), sy = corpse.y - 160 - Math.random() * 80;
        const sprite = scene.add.sprite(sx, sy, 'crow', 'fly0').setOrigin(0.5, 1).setDepth(1e6 - 3).setFlipX(from > 0);
        sprite.play('crow-fly'); sprite.anims.timeScale = 0.7 + Math.random() * 0.4;
        carrion.push({ sprite, land, state: 'come', delay: k * (0.5 + Math.random() * 0.9), speed: 55 + Math.random() * 25, vx: 0, vy: 0, life: 0 });
        sprite.setVisible(false);
      }
    }
    const scare = d < (running ? 70 : 45);
    for (let i = carrion.length - 1; i >= 0; i--) {
      const c = carrion[i], s = c.sprite;
      if (scare && c.state !== 'flee') {
        if (i === carrion.length - 1) audio.play('caw', { n: 3 });
        c.state = 'flee'; c.delay = Math.random() * 0.4; c.life = 0;
        c.vx = (Math.sign(s.x - player.x) || 1) * (50 + Math.random() * 40); c.vy = -(60 + Math.random() * 30);
        s.setVisible(true);
        if (s.anims.currentAnim?.key !== 'crow-fly') s.play('crow-fly');
        s.setFlipX(c.vx < 0).setDepth(1e6 - 3);
        flock.wait = 12;
      }
      if (c.state === 'come') {
        c.delay -= dt;
        if (c.delay > 0) continue;
        s.setVisible(true);
        const dx = c.land.x - s.x, dy = c.land.y - s.y, dist = Math.hypot(dx, dy);
        // Il plane en cercle un peu, puis se pose
        const step = Math.min(dist, c.speed * dt * Math.min(1, 0.3 + dist / 60));
        s.x += dx / (dist || 1) * step + Math.sin(c.life * 3) * 0.4;
        s.y += dy / (dist || 1) * step;
        c.life += dt;
        s.setFlipX(dx < 0);
        if (dist < 1.5) {
          c.state = 'eat';
          if (Math.random() < 0.5) audio.play('caw', { n: 1, pan: Math.max(-1, Math.min(1, (s.x - player.x) / 150)) });
          s.setPosition(c.land.x, c.land.y).setDepth(c.land.y);
          s.anims.play({ key: 'crow-peck', startFrame: Math.floor(Math.random() * 2) });
          s.anims.timeScale = 0.9 + Math.random() * 1.1;
          s.setFlipX(corpse ? c.land.x > corpse.x : false);
        }
      } else if (c.state === 'eat') {
        // Ils se chamaillent : un cri, de temps en temps
        if (Math.random() < dt * 0.05) audio.play('caw', { n: 1 + Math.floor(Math.random() * 2), pan: Math.max(-1, Math.min(1, (s.x - player.x) / 150)) });
        // De temps en temps, il sautille autour du corps
        if (Math.random() < dt * 0.25) {
          const nx = s.x + (Math.random() < 0.5 ? -2 : 2);
          if (corpse && Math.abs(nx - corpse.x) < spread * 0.6) { s.x = nx; s.setFlipX(nx > corpse.x); }
        }
      } else if (c.state === 'flee') {
        c.delay -= dt;
        if (c.delay > 0) continue;
        c.life += dt;
        c.vy *= 1 - 0.2 * dt;
        s.x += c.vx * dt; s.y += c.vy * dt;
        const v = scene.cameras.main.worldView;
        if (s.x < v.x - 20 || s.x > v.right + 20 || s.y < v.y - 20 || c.life > 12) { s.destroy(); carrion.splice(i, 1); }
      }
    }
  }

  return {
    // corpses : [{ x, y, small }]
    update(dt, player, running, wind, corpses = []) {
      // Cerfs et biches : retirés du jeu pour le moment (ils restent dans le labo)
      if (DEER_ENABLED) updateDeer(dt, player, running);
      updateCrows(dt, player, running, wind);
      for (const c of corpses) updateCarrion(dt, player, running, c, flockFor(c));
    },
  };
}
