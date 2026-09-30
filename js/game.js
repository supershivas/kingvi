/* La scène Phaser : sol par morceaux, arbres et rochers, viking et sa cape,
   empreintes, maison. Le vent et la neige sont dessinés sur un calque à part
   (canvas 2D au-dessus du jeu), avec la même simulation que le labo. */
import {
  paintSheet, paintFrames, capeFrames, smearPixels, IMPACT,
  FRAME_W, FRAME_H, CX, GROUND, ORIGIN_X, ORIGIN_Y, CAPE_W, CAPE_H, CAPE_PHASES,
} from './viking.js';
import {
  WORLD, CHUNK, isLand, landing, paintChunk, objectsInChunk, blocked,
  DRAKKAR, HOUSE, HOUSE_ART, HOUSE_W, HOUSE_H, HOUSE_WINDOW, HOUSE_CHIMNEY,
} from './world.js';
import { createWeather } from './weather.js';

const Phaser = window.Phaser;

// Version du monde : une sauvegarde faite sur une autre île repart du rivage.
const WORLD_VERSION = 3;
const SPEED = 18;              // pixels du monde par seconde : on marche lentement
const WALK_FPS = 7;
const OWN_PRINTS_MAX = 500;
const OWN_PRINT_LIFE = 40000;  // la neige recouvre nos pas en 40 s
const TARGET_HEIGHT = 440;     // hauteur visée de l'écran, en pixels du jeu

// Profondeurs : le sol et ce qui y est tracé sont sous tout ; les objets
// debout (arbres, rochers, maison, viking) sont triés par la ligne de leurs pieds.
const DEPTH_GROUND = -1000, DEPTH_MARKS = -500, DEPTH_BOAT = -400, DEPTH_SKY = 1e6;

// Taille interne et facteur d'agrandissement entier, pour des pixels nets.
export function fitScreen(w, h) {
  const zoom = Math.max(1, Math.round(h / TARGET_HEIGHT));
  return { zoom, width: Math.ceil(w / zoom), height: Math.ceil(h / zoom) };
}

// Emprise de la maison (on ne la traverse pas)
// (vue de trois quarts : le toit représente la profondeur de la maison)
const inHouse = (x, y) =>
  Math.abs(x - HOUSE.x) <= HOUSE_W / 2 - 4 && y <= HOUSE.y + 1 && y >= HOUSE.y - 30;
const walkable = (x, y) => isLand(x, y) && !inHouse(x, y) && !blocked(x, y);

export function createGame({ parent, palette, save, onSave, isPaused, wind = 'rafales' }) {
  const hex = c => parseInt(c.slice(1), 16);
  const rect = parent.getBoundingClientRect();
  const fit = fitScreen(rect.width, rect.height);
  if (save.world !== WORLD_VERSION) save = { steps: save.steps };

  const weather = createWeather(wind);
  // Calque du vent et de la neige, posé sur le jeu, à la même échelle
  const sky = document.createElement('canvas');
  sky.className = 'sky';
  const skyCtx = sky.getContext('2d');

  class Island extends Phaser.Scene {
    constructor() { super('island'); }

    create() {
      this.chunks = new Map();
      this.keys = new Set();
      this.ownPrints = [];
      this.smoke = [];
      this.stepCount = save.steps || 0;
      this.distance = save.distance || 0;
      this.attacking = false;
      this.facing = save.facing || 'side';
      this.flip = !!save.flip;
      this.capeClock = 0;

      this.makeTextures();

      const land = landing();
      this.spawn = { x: land.shore + 30, y: land.y };
      const start = save.x != null && walkable(save.x, save.y) ? save : this.spawn;
      this.pos = { x: start.x, y: start.y };

      // Le drakkar sur lequel il a accosté, proue dans l'eau, à l'ouest
      this.add.image(land.shore - 4, land.y, 'drakkar').setDepth(DEPTH_BOAT);

      // La maison, au bout des traces, et la fumée de son feu
      this.add.image(HOUSE.x, HOUSE.y + 1, 'house').setOrigin(0.5, 1).setDepth(HOUSE.y);
      const left = HOUSE.x - HOUSE_W / 2, top = HOUSE.y + 1 - HOUSE_H;
      this.chimney = { x: left + HOUSE_CHIMNEY.x + 1.5, y: top + HOUSE_CHIMNEY.y };
      this.time.addEvent({ delay: 500, loop: true, callback: () => this.puff() });
      // Le feu derrière les deux carreaux de la fenêtre : il vacille
      const W = HOUSE_WINDOW;
      const panes = [0, 3].map(dx => this.add.rectangle(left + W.x + dx, top + W.y, 2, W.h, hex(palette.r))
        .setOrigin(0, 0).setDepth(HOUSE.y + 0.1));
      this.time.addEvent({ delay: 140, loop: true, callback: () => panes.forEach(p => p.setAlpha(0.5 + Math.random() * 0.5)) });

      this.cape = this.add.image(0, 0, 'cape', 'cape-0-0').setOrigin(0, 0);
      this.player = this.add.sprite(0, 0, 'viking', `${this.facing}-idle`)
        .setOrigin(ORIGIN_X, ORIGIN_Y)
        .setFlipX(this.flip);
      this.makeAnimations();
      this.player.on('animationupdate', (anim, frame) => this.onFrame(anim, frame));
      this.player.on('animationcomplete', anim => {
        if (anim.key.includes('attack')) {
          this.attacking = false;
          this.player.setFrame(`${this.facing}-idle`);
        }
      });
      this.placePlayer();

      const cam = this.cameras.main;
      cam.setBounds(0, 0, WORLD, WORLD);
      cam.setRoundPixels(true);
      cam.startFollow(this.player, true, 0.035, 0.035);
      cam.setBackgroundColor(palette.b);

      this.dust = this.add.particles(0, 0, 'dust', {
        lifespan: { min: 350, max: 900 }, speed: { min: 10, max: 45 },
        gravityY: 60, alpha: { start: 0.9, end: 0 }, emitting: false,
      }).setDepth(DEPTH_SKY - 1);

      window.addEventListener('keydown', e => {
        if (isPaused()) return;
        if (MOVE_CODES[e.code]) { this.keys.add(e.code); e.preventDefault(); }
      });
      window.addEventListener('keyup', e => this.keys.delete(e.code));
      window.addEventListener('blur', () => this.keys.clear());

      this.input.on('pointerdown', p => {
        if (!isPaused() && p.button === 0) this.attack(p.worldX, p.worldY);
      });

      this.time.addEvent({ delay: 4000, loop: true, callback: () => this.persist() });
      this.updateChunks(true);
    }

    makeTextures() {
      const sheet = document.createElement('canvas');
      const frames = paintSheet(sheet, palette);
      const tex = this.textures.addCanvas('viking', sheet);
      this.capeAnchor = {};
      frames.forEach(f => { tex.add(f.name, 0, f.x, 0, FRAME_W, FRAME_H); this.capeAnchor[f.name] = f.cape; });

      const capeSheet = document.createElement('canvas');
      const capes = paintFrames(capeSheet, capeFrames(), CAPE_W, CAPE_H, palette);
      const ctex = this.textures.addCanvas('cape', capeSheet);
      capes.forEach(f => ctex.add(f.name, 0, f.x, 0, CAPE_W, CAPE_H));

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
        // Armé long (on sent la charge), coup très bref, impact tenu, retour
        this.anims.create({
          key: `${view}-attack`,
          frames: [
            { key: 'viking', frame: `${view}-attack-0`, duration: 260 },
            { key: 'viking', frame: `${view}-attack-1`, duration: 55 },
            { key: 'viking', frame: `${view}-attack-2`, duration: 320 },
            { key: 'viking', frame: `${view}-attack-3`, duration: 160 },
          ],
          frameRate: 10, repeat: 0,
        });
      }
    }

    // Le sprite est posé sur un demi-pixel : son origine est au milieu d'une
    // colonne, ses bords tombent ainsi sur des pixels entiers.
    placePlayer() {
      const px = Math.round(this.pos.x), py = Math.round(this.pos.y);
      this.player.setPosition(px + 0.5, py).setDepth(this.pos.y);
      // La cape s'accroche à l'épaule côté est (le vent souffle vers l'est)
      const a = this.capeAnchor[this.player.frame.name];
      if (!a) return;
      const col = this.flip ? 2 * CX - a.west - 1 : a.east - 1;
      this.cape.setPosition(px + col - CX, py + a.y - GROUND - 1).setDepth(this.pos.y - 0.01);
    }

    updateCape(delta) {
      // Plus le vent est fort, plus la cape se couche et bat vite
      const force = Math.min(1, weather.wind / 140);
      const level = force < 0.22 ? 0 : force < 0.6 ? 1 : 2;
      this.capeClock += delta / 1000 * (3 + force * 14);
      this.cape.setFrame(`cape-${level}-${Math.floor(this.capeClock) % CAPE_PHASES}`);
    }

    puff() {
      const s = this.add.image(this.chimney.x + Math.random(), this.chimney.y, Math.random() < 0.5 ? 'puff' : 'dust')
        .setDepth(DEPTH_SKY - 2).setAlpha(0.45);
      s.life = 0;
      this.smoke.push(s);
    }

    updateSmoke(dt) {
      for (let i = this.smoke.length - 1; i >= 0; i--) {
        const s = this.smoke[i];
        s.life += dt;
        s.x += weather.wind * 0.5 * Math.min(1, s.life / 1.5) * dt;
        s.y -= Math.max(0, 5 - s.life * 0.8) * dt;
        s.setAlpha(Math.max(0, 0.45 * (1 - s.life / 5)));
        if (s.life > 5) { s.destroy(); this.smoke.splice(i, 1); }
      }
    }

    // ── Pas ──
    onFrame(anim, frame) {
      // Une empreinte à chaque pose de pied (temps 1 et 3 du cycle)
      if (anim.key.endsWith('walk') && (frame.index === 1 || frame.index === 3)) {
        this.leavePrint(frame.index === 1 ? -1 : 1);
      }
      if (anim.key.endsWith('attack')) {
        if (frame.index === 2) this.swing();
        if (frame.index === 3) this.impact();
      }
    }

    leavePrint(side) {
      const x = Math.round(this.pos.x), y = Math.round(this.pos.y);
      const horizontal = this.facing === 'side';
      const px = x + (horizontal ? 0 : side);
      const py = y - 1 + (horizontal ? (side > 0 ? 0 : -1) : 0);
      this.mark(px, py, horizontal ? 2 : 1, horizontal ? 1 : 2, OWN_PRINT_LIFE);
      this.stepCount++;
    }

    mark(x, y, w, h, life) {
      const m = this.add.rectangle(x, y, w, h, hex(palette.b), 0.9).setOrigin(0, 0).setDepth(DEPTH_MARKS);
      this.tweens.add({ targets: m, alpha: 0, duration: life, ease: 'Quad.easeIn', onComplete: () => m.destroy() });
      this.ownPrints.push(m);
      if (this.ownPrints.length > OWN_PRINTS_MAX) this.ownPrints.shift().destroy();
    }

    // ── Attaque : vers le pointeur, dans l'une des quatre directions ──
    attack(tx, ty) {
      if (this.attacking) return;
      const dx = tx - this.pos.x, dy = ty - (this.pos.y - 5);
      if (Math.abs(dx) >= Math.abs(dy)) { this.facing = 'side'; this.flip = dx < 0; }
      else this.facing = dy < 0 ? 'back' : 'front';
      this.player.setFlipX(this.flip);
      this.attacking = true;
      this.player.play(`${this.facing}-attack`);
    }

    swing() {
      const dir = this.flip ? -1 : 1;
      const x = Math.round(this.pos.x), y = Math.round(this.pos.y);
      const g = this.add.graphics().setDepth(this.pos.y + 0.5);
      for (const p of smearPixels(this.facing)) {
        g.fillStyle(hex(palette.b), p.a);
        g.fillRect(x + p.x * dir, y + p.y, 1, 1);
      }
      this.tweens.add({ targets: g, alpha: 0, duration: 260, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
    }

    // La lame s'écrase dans la neige : secousse, gerbe, entaille qui reste un moment
    impact() {
      const dir = this.flip ? -1 : 1;
      const off = IMPACT[this.facing];
      const x = Math.round(this.pos.x) + off.x * dir, y = Math.round(this.pos.y) + off.y;
      this.cameras.main.shake(140, 0.006);
      const up = this.facing === 'side' ? (dir > 0 ? { min: 200, max: 330 } : { min: 210, max: 340 }) : { min: 200, max: 340 };
      this.dust.setConfig({
        lifespan: { min: 350, max: 900 }, speed: { min: 10, max: 45 }, angle: up,
        gravityY: 60, alpha: { start: 0.9, end: 0 }, emitting: false,
      });
      this.dust.explode(16, x, y);
      if (this.facing === 'side') this.mark(dir > 0 ? x - 2 : x - 3, y, 6, 1, 25000);
      else this.mark(x, y - 2, 1, 5, 25000);
      this.mark(x + 3, y - 1, 1, 1, 12000);
      this.mark(x - 2, y + 1, 1, 1, 12000);
      const ring = this.add.ellipse(x, y, 4, 2).setStrokeStyle(1, hex(palette.b), 0.6).setDepth(DEPTH_MARKS + 1);
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
          const { x, y } = this.pos;
          const nx = x + mx / len * step, ny = y + my / len * step;
          // Ni la mer, ni la maison, ni les troncs : on glisse le long de l'obstacle
          if (walkable(nx, ny)) { this.pos.x = nx; this.pos.y = ny; }
          else if (mx && walkable(nx, y)) this.pos.x = nx;
          else if (my && walkable(x, ny)) this.pos.y = ny;
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
      this.placePlayer();
      this.updateCape(delta);
      this.updateSmoke(delta / 1000);
      this.updateChunks();
      this.drawSky(delta / 1000);
    }

    drawSky(dt) {
      const v = this.cameras.main.worldView;
      weather.update(dt, { x: v.x, y: v.y, width: v.width, height: v.height });
      skyCtx.setTransform(1, 0, 0, 1, 0, 0);
      skyCtx.clearRect(0, 0, sky.width, sky.height);
      skyCtx.setTransform(1, 0, 0, 1, -Math.round(v.x), -Math.round(v.y));
      weather.draw((x, y, w, h, c, a) => {
        skyCtx.globalAlpha = a;
        skyCtx.fillStyle = palette[c];
        skyCtx.fillRect(x, y, w, h);
      });
      skyCtx.globalAlpha = 1;
    }

    // Charge les morceaux de sol visibles (et leurs arbres), oublie ceux qui sont loin.
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
          this.chunks.set(key, this.loadChunk(cx, cy, key));
        }
      }
      if (this.chunks.size <= 48) return;
      for (const [key, chunk] of this.chunks) {
        if (wanted.has(key)) continue;
        chunk.images.forEach(i => i.destroy());
        chunk.textures.forEach(t => this.textures.remove(t));
        this.chunks.delete(key);
      }
    }

    loadChunk(cx, cy, key) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = CHUNK;
      paintChunk(canvas.getContext('2d'), cx, cy, palette);
      const groundKey = `chunk-${key}`;
      this.textures.addCanvas(groundKey, canvas);
      const images = [this.add.image(cx * CHUNK, cy * CHUNK, groundKey).setOrigin(0, 0).setDepth(DEPTH_GROUND)];
      const textures = [groundKey];

      // Tous les objets du morceau dans une seule planche : un seul envoi à la carte graphique
      const objs = objectsInChunk(cx, cy);
      if (objs.length) {
        let x = 0, y = 0, rowH = 0;
        const slots = objs.map(o => {
          if (x + o.w > CHUNK) { x = 0; y += rowH + 1; rowH = 0; }
          const slot = { x, y };
          x += o.w + 1; rowH = Math.max(rowH, o.h);
          return slot;
        });
        const atlas = document.createElement('canvas');
        atlas.width = CHUNK; atlas.height = y + rowH + 1;
        const ctx = atlas.getContext('2d');
        objs.forEach((o, i) => o.art.rows.forEach((row, ry) => [...row].forEach((ch, rx) => {
          if (ch === '.') return;
          ctx.fillStyle = palette[ch];
          ctx.fillRect(slots[i].x + rx, slots[i].y + ry, 1, 1);
        })));
        const objKey = `objects-${key}`;
        const tex = this.textures.addCanvas(objKey, atlas);
        textures.push(objKey);
        objs.forEach((o, i) => {
          tex.add(i, 0, slots[i].x, slots[i].y, o.w, o.h);
          images.push(this.add.image(o.x - o.art.ax, o.y + 1, objKey, i).setOrigin(0, 1).setDepth(o.y));
        });
      }
      return { images, textures };
    }

    persist() {
      onSave({
        world: WORLD_VERSION,
        x: Math.round(this.pos.x), y: Math.round(this.pos.y),
        facing: this.facing, flip: this.flip,
        steps: this.stepCount, distance: Math.round(this.distance),
      });
    }

    backToShore() {
      this.pos = { ...this.spawn };
      this.facing = 'side'; this.flip = false;
      this.player.stop();
      this.player.setFrame('side-idle').setFlipX(false);
      this.attacking = false;
      this.placePlayer();
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

  function sizeSky(f) {
    sky.width = f.width; sky.height = f.height;
    sky.style.width = `${f.width * f.zoom}px`;
    sky.style.height = `${f.height * f.zoom}px`;
  }
  sizeSky(fit);
  parent.append(sky);

  function resize() {
    const r = parent.getBoundingClientRect();
    const f = fitScreen(r.width, r.height);
    game.scale.setZoom(f.zoom);
    game.scale.resize(f.width, f.height);
    sizeSky(f);
    parent.style.setProperty('--px', `${f.zoom}px`);
  }
  window.addEventListener('resize', resize);
  parent.style.setProperty('--px', `${fit.zoom}px`);

  return {
    game,
    scene: () => game.scene.getScene('island'),
    save: () => game.scene.getScene('island')?.persist(),
    setWind: name => weather.setPreset(name),
  };
}

// Touches physiques : ZQSD sur un clavier AZERTY, WASD en QWERTY, et les flèches.
const MOVE_CODES = {
  KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0],
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
};
