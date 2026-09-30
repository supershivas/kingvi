/* La scène Phaser : sol par morceaux, viking, empreintes, vent et neige,
   maison au bout des traces. */
import { paintSheet, FRAME_W, FRAME_H, CX, GROUND } from './viking.js';
import { WORLD, CHUNK, isLand, landing, paintChunk, DRAKKAR, HOUSE, HOUSE_ART } from './world.js';

const Phaser = window.Phaser;

// Version du monde : une sauvegarde faite sur une autre île repart du rivage.
const WORLD_VERSION = 2;
const SPEED = 18;              // pixels du monde par seconde : on marche lentement
const WALK_FPS = 7;
const OWN_PRINTS_MAX = 500;
const OWN_PRINT_LIFE = 40000;  // la neige recouvre nos pas en 40 s
const TARGET_HEIGHT = 440;     // hauteur visée de l'écran, en pixels du jeu
const FLAKES = 220;
const DRIFTS = 60;

// Taille interne et facteur d'agrandissement entier, pour des pixels nets.
export function fitScreen(w, h) {
  const zoom = Math.max(1, Math.round(h / TARGET_HEIGHT));
  return { zoom, width: Math.ceil(w / zoom), height: Math.ceil(h / zoom) };
}

// Emprise de la maison (on ne la traverse pas)
const HOUSE_W = HOUSE_ART[0].length, HOUSE_H = HOUSE_ART.length;
const inHouse = (x, y) =>
  Math.abs(x - HOUSE.x) <= HOUSE_W / 2 + 1 && y <= HOUSE.y + 1 && y >= HOUSE.y - HOUSE_H + 4;
const walkable = (x, y) => isLand(x, y) && !inHouse(x, y);

export function createGame({ parent, palette, save, onSave, isPaused }) {
  const hex = c => parseInt(c.slice(1), 16);
  const rect = parent.getBoundingClientRect();
  const fit = fitScreen(rect.width, rect.height);
  if (save.world !== WORLD_VERSION) save = { steps: save.steps };

  class Island extends Phaser.Scene {
    constructor() { super('island'); }

    create() {
      this.chunks = new Map();
      this.keys = new Set();
      this.ownPrints = [];
      this.stepCount = save.steps || 0;
      this.distance = save.distance || 0;
      this.attacking = false;
      this.facing = save.facing || 'side';
      this.flip = !!save.flip;
      this.wind = 10;

      this.makeTextures();

      const land = landing();
      this.spawn = { x: land.shore + 30, y: land.y };
      const start = save.x != null && walkable(save.x, save.y) ? save : this.spawn;

      // Le drakkar sur lequel il a accosté, proue dans l'eau, à l'ouest
      this.add.image(land.shore - 4, land.y, 'drakkar').setDepth(1);

      // La maison, au bout des traces, et la fumée de son feu
      this.house = this.add.image(HOUSE.x, HOUSE.y + 1, 'house').setOrigin(0.5, 1);
      this.chimney = { x: HOUSE.x - HOUSE_W / 2 + 11.5, y: HOUSE.y - HOUSE_H };
      this.time.addEvent({ delay: 650, loop: true, callback: () => this.puff() });
      this.windowGlow = this.add.rectangle(HOUSE.x - HOUSE_W / 2 + 3, HOUSE.y, 2, 2, hex(palette.r))
        .setOrigin(0, 1);
      this.time.addEvent({ delay: 140, loop: true, callback: () => this.windowGlow.setAlpha(0.55 + Math.random() * 0.45) });

      this.player = this.add.sprite(start.x, start.y, 'viking', `${this.facing}-idle`)
        .setOrigin(CX / FRAME_W, (GROUND + 1) / FRAME_H)
        .setFlipX(this.flip)
        .setDepth(5);
      this.makeAnimations();
      this.player.on('animationupdate', (anim, frame) => this.onFrame(anim, frame));
      this.player.on('animationcomplete', anim => {
        if (anim.key.includes('attack')) {
          this.attacking = false;
          this.player.setFrame('side-idle');
        }
      });

      const cam = this.cameras.main;
      cam.setBounds(0, 0, WORLD, WORLD);
      cam.setRoundPixels(true);
      cam.startFollow(this.player, true, 0.035, 0.035);
      cam.setBackgroundColor(palette.b);

      this.makeWeather();

      window.addEventListener('keydown', e => {
        if (isPaused()) return;
        if (MOVE_CODES[e.code]) { this.keys.add(e.code); e.preventDefault(); }
      });
      window.addEventListener('keyup', e => this.keys.delete(e.code));
      window.addEventListener('blur', () => this.keys.clear());

      this.input.on('pointerdown', p => {
        if (!isPaused() && p.button === 0) this.attack(p.worldX);
      });

      this.time.addEvent({ delay: 4000, loop: true, callback: () => this.persist() });
      this.updateChunks(true);
    }

    makeTextures() {
      const sheet = document.createElement('canvas');
      const frames = paintSheet(sheet, palette);
      const tex = this.textures.addCanvas('viking', sheet);
      frames.forEach(f => tex.add(f.name, 0, f.x, 0, FRAME_W, FRAME_H));

      const art = (key, rows) => {
        const c = document.createElement('canvas');
        c.width = rows[0].length; c.height = rows.length;
        const ctx = c.getContext('2d');
        rows.forEach((row, y) => [...row].forEach((ch, x) => {
          if (ch === '.') return;
          ctx.fillStyle = palette[ch]; ctx.fillRect(x, y, 1, 1);
        }));
        this.textures.addCanvas(key, c);
      };
      art('drakkar', DRAKKAR);
      art('house', HOUSE_ART);
      art('flake', ['s']);
      art('dust', ['b']);
      art('puff', ['bb', 'bb']);
    }

    makeAnimations() {
      for (const view of ['side', 'front', 'back']) {
        this.anims.create({
          key: `${view}-walk`,
          frames: [0, 1, 2, 3].map(i => ({ key: 'viking', frame: `${view}-walk-${i}` })),
          frameRate: WALK_FPS, repeat: -1,
        });
      }
      // Armé long (on sent la charge), coup très bref, impact tenu, retour
      this.anims.create({
        key: 'side-attack',
        frames: [
          { key: 'viking', frame: 'side-attack-0', duration: 260 },
          { key: 'viking', frame: 'side-attack-1', duration: 55 },
          { key: 'viking', frame: 'side-attack-2', duration: 320 },
          { key: 'viking', frame: 'side-attack-3', duration: 160 },
        ],
        frameRate: 10, repeat: 0,
      });
    }

    // ── Vent et neige ──
    makeWeather() {
      // Deux sortes de flocons : clairs (vus sur la mer et le viking)
      // et ombrés (vus sur la neige). Ils vivent dans le monde et défilent quand on marche.
      this.flakes = [];
      for (let i = 0; i < FLAKES; i++) {
        const dark = i % 2 === 0;
        const f = this.add.image(0, 0, dark ? 'dust' : 'flake').setDepth(10);
        f.dark = dark;
        this.placeFlake(f, 'anywhere');
        this.flakes.push(f);
      }
      // Poudrerie : longues traînées de neige soufflée au ras du sol
      this.drifts = [];
      for (let i = 0; i < DRIFTS; i++) {
        const d = this.add.rectangle(0, 0, 3 + Math.floor(Math.random() * 14), 1, hex(palette.b)).setOrigin(0, 0).setDepth(3);
        this.placeDrift(d, true);
        this.drifts.push(d);
      }
      this.dust = this.add.particles(0, 0, 'dust', {
        lifespan: { min: 350, max: 900 },
        speed: { min: 10, max: 45 },
        angle: { min: 200, max: 340 },
        gravityY: 60,
        alpha: { start: 0.9, end: 0 },
        emitting: false,
      }).setDepth(6);
      this.smoke = [];
    }

    view() {
      const v = this.cameras.main.worldView;
      if (v.width) return v;
      const w = this.scale.width, h = this.scale.height;
      return { x: this.player.x - w / 2, y: this.player.y - h / 2, width: w, height: h, right: this.player.x + w / 2, bottom: this.player.y + h / 2 };
    }

    placeFlake(f, from) {
      const v = this.view();
      if (from === 'top') { f.x = v.x - 40 + Math.random() * (v.width + 40); f.y = v.y - 4; }
      else if (from === 'left') { f.x = v.x - 4; f.y = v.y + Math.random() * v.height; }
      else { f.x = v.x + Math.random() * v.width; f.y = v.y + Math.random() * v.height; }
      f.gust = 0.6 + Math.random() * 0.7;
      f.vy = 5 + Math.random() * 8;
      f.phase = Math.random() * 6.28;
      f.setAlpha(f.dark ? 0.18 + Math.random() * 0.22 : 0.6 + Math.random() * 0.4);
    }

    placeDrift(d, anywhere) {
      const v = this.view();
      d.x = anywhere ? v.x + Math.random() * v.width : v.x - d.width - Math.random() * 40;
      d.y = v.y + Math.random() * v.height;
      d.speed = 1.6 + Math.random() * 1.2;
      d.base = 0.05 + Math.random() * 0.12;
      d.phase = Math.random() * 6.28;
    }

    updateWeather(time, delta) {
      const dt = delta / 1000;
      // Rafales : un vent d'ouest qui enfle et retombe
      const g = (Math.sin(time / 5300) + 0.5 * Math.sin(time / 2100 + 1) + 1.5) / 3;
      this.gust = g * g;
      this.wind = 5 + 34 * this.gust;
      const v = this.cameras.main.worldView;

      for (const f of this.flakes) {
        f.x += (this.wind * f.gust + Math.sin(time / 800 + f.phase) * 3) * dt;
        f.y += (f.vy + Math.sin(time / 1300 + f.phase) * 2) * dt;
        if (f.y > v.bottom + 4) this.placeFlake(f, 'top');
        else if (f.x > v.right + 4) this.placeFlake(f, 'left');
        else if (f.x < v.x - 60 || f.y < v.y - 60) this.placeFlake(f, 'anywhere');
      }
      for (const d of this.drifts) {
        d.x += this.wind * d.speed * dt;
        d.y += Math.sin(time / 600 + d.phase) * 2 * dt;
        d.setAlpha(d.base * (0.15 + 1.6 * this.gust));
        if (d.x > v.right + 4) this.placeDrift(d, false);
        else if (d.x + d.width < v.x - 80 || d.y < v.y - 20 || d.y > v.bottom + 20) this.placeDrift(d, true);
      }
      for (let i = this.smoke.length - 1; i >= 0; i--) {
        const s = this.smoke[i];
        s.life += dt;
        s.x += (this.wind * 0.35 * Math.min(1, s.life / 2)) * dt;
        s.y -= (5 - s.life * 0.4) * dt;
        s.setAlpha(Math.max(0, 0.45 * (1 - s.life / 7)));
        if (s.life > 7) { s.destroy(); this.smoke.splice(i, 1); }
      }
    }

    puff() {
      const s = this.add.image(this.chimney.x + Math.random(), this.chimney.y, Math.random() < 0.5 ? 'puff' : 'dust')
        .setDepth(7).setAlpha(0.45);
      s.life = 0;
      this.smoke.push(s);
    }

    // ── Pas ──
    onFrame(anim, frame) {
      // Une empreinte à chaque pose de pied (temps 1 et 3 du cycle)
      if (anim.key.endsWith('walk') && (frame.index === 1 || frame.index === 3)) {
        this.leavePrint(frame.index === 1 ? -1 : 1);
      }
      if (anim.key === 'side-attack') {
        if (frame.index === 2) this.swing();
        if (frame.index === 3) this.impact();
      }
    }

    leavePrint(side) {
      const { x, y } = this.player;
      const horizontal = this.facing === 'side';
      const px = Math.round(x + (horizontal ? 0 : side));
      const py = Math.round(y - 1 + (horizontal ? (side > 0 ? 0 : -1) : 0));
      this.mark(px, py, horizontal ? 2 : 1, horizontal ? 1 : 2, OWN_PRINT_LIFE);
      this.stepCount++;
    }

    mark(x, y, w, h, life) {
      const m = this.add.rectangle(x, y, w, h, hex(palette.b), 0.9).setOrigin(0, 0).setDepth(2);
      this.tweens.add({ targets: m, alpha: 0, duration: life, ease: 'Quad.easeIn', onComplete: () => m.destroy() });
      this.ownPrints.push(m);
      if (this.ownPrints.length > OWN_PRINTS_MAX) this.ownPrints.shift().destroy();
    }

    // ── Attaque : toujours de profil, vers le côté du pointeur ──
    attack(tx) {
      if (this.attacking) return;
      this.facing = 'side';
      this.flip = tx < this.player.x;
      this.player.setFlipX(this.flip);
      this.attacking = true;
      this.player.play('side-attack');
    }

    // Traînée du coup : un arc qui part de derrière, passe au-dessus et plonge devant
    swing() {
      const dir = this.flip ? -1 : 1;
      const cx = Math.round(this.player.x), cy = Math.round(this.player.y) - 7;
      const g = this.add.graphics().setDepth(6);
      g.fillStyle(hex(palette.b), 1);
      const from = -150, to = 40;
      for (let a = from; a <= to; a += 3) {
        const t = (a - from) / (to - from);
        const rad = a * Math.PI / 180;
        const r0 = 5 + Math.round(t * 2), r1 = 9 + Math.round(t * 1);
        g.fillStyle(hex(palette.b), 0.15 + 0.6 * t);
        for (let r = r0; r <= r1; r++) {
          if (r > r0 && r < r1 && Math.random() < 0.5) continue;
          g.fillRect(Math.round(cx + dir * Math.cos(rad) * r), Math.round(cy + Math.sin(rad) * r), 1, 1);
        }
      }
      this.tweens.add({ targets: g, alpha: 0, duration: 260, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
    }

    // La lame s'écrase dans la neige : secousse, gerbe, entaille qui reste un moment
    impact() {
      const dir = this.flip ? -1 : 1;
      const x = Math.round(this.player.x) + dir * 9, y = Math.round(this.player.y) - 1;
      this.cameras.main.shake(140, 0.006);
      this.dust.setConfig({
        lifespan: { min: 350, max: 900 }, speed: { min: 10, max: 45 },
        angle: dir > 0 ? { min: 200, max: 330 } : { min: 210, max: 340 },
        gravityY: 60, alpha: { start: 0.9, end: 0 }, emitting: false,
      });
      this.dust.explode(16, x, y);
      // Entaille : un trait dans le sens du coup et deux éclats
      this.mark(dir > 0 ? x - 2 : x - 3, y, 6, 1, 25000);
      this.mark(x + dir * 4, y - 1, 1, 1, 12000);
      this.mark(x - dir * 1, y + 1, 1, 1, 12000);
      const ring = this.add.ellipse(x, y, 4, 2).setStrokeStyle(1, hex(palette.b), 0.6).setDepth(2);
      this.tweens.add({ targets: ring, scaleX: 4, scaleY: 3, alpha: 0, duration: 420, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
    }

    update(time, delta) {
      if (isPaused()) this.keys.clear();
      let mx = 0, my = 0;
      for (const code of this.keys) { mx += MOVE_CODES[code][0]; my += MOVE_CODES[code][1]; }

      if (!this.attacking) {
        if (mx || my) {
          const len = Math.hypot(mx, my);
          const step = SPEED * delta / 1000;
          const nx = this.player.x + mx / len * step, ny = this.player.y + my / len * step;
          // Ni la mer ni la maison : on glisse le long de l'obstacle si possible
          if (walkable(nx, ny)) { this.player.x = nx; this.player.y = ny; }
          else if (mx && walkable(nx, this.player.y)) this.player.x = nx;
          else if (my && walkable(this.player.x, ny)) this.player.y = ny;
          this.distance += step;

          if (mx) { this.facing = 'side'; this.flip = mx < 0; }
          else this.facing = my < 0 ? 'back' : 'front';
          this.player.setFlipX(this.flip);
          const key = `${this.facing}-walk`;
          if (this.player.anims.currentAnim?.key !== key || !this.player.anims.isPlaying) this.player.play(key, true);
        } else if (this.player.anims.isPlaying) {
          this.player.stop();
          this.player.setFrame(`${this.facing}-idle`);
        }
      }
      // Devant ou derrière la maison selon qu'il est plus bas ou plus haut qu'elle
      this.house.setDepth(this.player.y > HOUSE.y ? 4 : 6);
      this.windowGlow.setDepth(this.house.depth + 0.1);
      this.updateWeather(time, delta);
      this.updateChunks();
    }

    // Charge les morceaux de sol visibles, oublie ceux qui sont loin.
    updateChunks(force) {
      const v = this.cameras.main.worldView;
      const margin = CHUNK / 2;
      const c0 = Math.max(0, Math.floor((v.x - margin) / CHUNK));
      const c1 = Math.min(WORLD / CHUNK - 1, Math.floor((v.right + margin) / CHUNK));
      const r0 = Math.max(0, Math.floor((v.y - margin) / CHUNK));
      const r1 = Math.min(WORLD / CHUNK - 1, Math.floor((v.bottom + margin) / CHUNK));
      if (!force && this.lastRange === `${c0},${c1},${r0},${r1}`) return;
      this.lastRange = `${c0},${c1},${r0},${r1}`;

      const wanted = new Set();
      let painted = 0;
      for (let cy = r0; cy <= r1; cy++) {
        for (let cx = c0; cx <= c1; cx++) {
          const key = `${cx},${cy}`;
          wanted.add(key);
          if (this.chunks.has(key)) continue;
          // Au plus deux morceaux peints par image, pour ne pas saccader
          if (!force && painted >= 2) { this.lastRange = null; continue; }
          painted++;
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = CHUNK;
          paintChunk(canvas.getContext('2d'), cx, cy, palette);
          const texKey = `chunk-${key}`;
          this.textures.addCanvas(texKey, canvas);
          const img = this.add.image(cx * CHUNK, cy * CHUNK, texKey).setOrigin(0, 0).setDepth(0);
          this.chunks.set(key, img);
        }
      }
      if (this.chunks.size <= 48) return;
      for (const [key, img] of this.chunks) {
        if (wanted.has(key)) continue;
        img.destroy();
        this.textures.remove(`chunk-${key}`);
        this.chunks.delete(key);
      }
    }

    persist() {
      onSave({
        world: WORLD_VERSION,
        x: Math.round(this.player.x), y: Math.round(this.player.y),
        facing: this.facing, flip: this.flip,
        steps: this.stepCount, distance: Math.round(this.distance),
      });
    }

    backToShore() {
      this.player.setPosition(this.spawn.x, this.spawn.y);
      this.facing = 'side'; this.flip = false;
      this.player.stop();
      this.player.setFrame('side-idle').setFlipX(false);
      this.attacking = false;
      this.cameras.main.centerOn(this.spawn.x, this.spawn.y);
      this.updateChunks(true);
      this.persist();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: fit.width,
    height: fit.height,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: palette.b,
    scale: { mode: Phaser.Scale.NONE, zoom: fit.zoom },
    scene: Island,
    banner: false,
    input: { mouse: { preventDefaultWheel: false } },
    disableContextMenu: true,
  });

  function resize() {
    const r = parent.getBoundingClientRect();
    const f = fitScreen(r.width, r.height);
    game.scale.setZoom(f.zoom);
    game.scale.resize(f.width, f.height);
    parent.style.setProperty('--px', `${f.zoom}px`);
  }
  window.addEventListener('resize', resize);
  parent.style.setProperty('--px', `${fit.zoom}px`);

  return {
    game,
    scene: () => game.scene.getScene('island'),
    save: () => game.scene.getScene('island')?.persist(),
  };
}

// Touches physiques : ZQSD sur un clavier AZERTY, WASD en QWERTY, et les flèches.
const MOVE_CODES = {
  KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0],
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
};
