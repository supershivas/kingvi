/* La scène Phaser : sol par morceaux, arbres et rochers, viking et sa cape,
   empreintes, maison. Le vent et la neige sont dessinés sur un calque à part
   (canvas 2D au-dessus du jeu), avec la même simulation que le labo. */
import {
  paintSheet, paintFrames, capeFrames, smearPixels, IMPACT,
  FRAME_W, FRAME_H, CX, GROUND, ORIGIN_X, ORIGIN_Y, CAPE_W, CAPE_H, CAPE_PHASES,
} from './viking.js';
import {
  WORLD, CHUNK, isLand, landing, paintChunk, objectsInChunk, blocked,
  HOUSE, HOUSE_ART, HOUSE_DOOR_OUT, houseBlocked, houseFrontY, coast,
} from './world.js';
import { BOAT_FRAMES, BOAT_W, BOAT_H, BOAT_WATERLINE, BOAT_BOW, BOAT_EDGE } from './boat.js';
import { daylightAt } from './daylight.js';
import { ROOM, ROOM_W, ROOM_H, ROOM_ENTRY, roomWalkable, atRoomDoor } from './interior.js';
import { createFauna } from './fauna.js';
import { createWeather } from './weather.js';
import { LEANS, LEAN_PAD, leanRows } from './trees.js';

const Phaser = window.Phaser;

// Version du monde : une sauvegarde faite sur une autre île repart du rivage.
const WORLD_VERSION = 6;
const SPEED = 18;              // pixels du monde par seconde : on marche lentement
const RUN = 2.4;               // Maj enfoncée : il court
const WALK_FPS = 7;
const OWN_PRINTS_MAX = 500;
const OWN_PRINT_LIFE = 40000;  // la neige recouvre nos pas en 40 s
const TARGET_HEIGHT = 440;     // hauteur visée de l'écran, en pixels du jeu

// Profondeurs : le sol et ce qui y est tracé sont sous tout ; les objets
// debout (arbres, rochers, maison, viking) sont triés par la ligne de leurs pieds.
const DEPTH_GROUND = -1000, DEPTH_MARKS = -500, DEPTH_BOAT = -400, DEPTH_SKY = 1e6;
// La pièce (et le viking qui y entre) passe au-dessus de tout le dehors
const DEPTH_ROOM = 5e5;

// Taille interne et facteur d'agrandissement entier, pour des pixels nets.
export function fitScreen(w, h) {
  const zoom = Math.max(1, Math.round(h / TARGET_HEIGHT));
  return { zoom, width: Math.ceil(w / zoom), height: Math.ceil(h / zoom) };
}

// Emprise de la maison (on ne la traverse pas)
// (vue de trois quarts : le toit représente la profondeur de la maison)
// Emprise de la barque échouée (posée dans create)
let boatRect = null;
const inBoat = (x, y) => boatRect && x >= boatRect.x0 && x <= boatRect.x1 && y >= boatRect.y0 && y <= boatRect.y1;
const walkable = (x, y) => isLand(x, y) && !houseBlocked(x, y) && !blocked(x, y) && !inBoat(x, y);

// L'intérieur de la maison est posé loin en mer, hors de l'île : quand on y
// entre, on y est téléporté ; tout autour, un fond noir cache la mer.
const ROOM_AT = { x: 700, y: 700 };
const walkableIn = (x, y) => roomWalkable(x - ROOM_AT.x, y - ROOM_AT.y);

// Le point praticable le plus proche (une sauvegarde ou une téléportation
// peut tomber sur un tronc ou dans la maison)
function nearestWalkable(x, y) {
  if (walkable(x, y)) return { x, y };
  for (let r = 2; r <= 60; r += 2) {
    for (let k = 0; k < 16; k++) {
      const a = k / 16 * Math.PI * 2, px = Math.round(x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r);
      if (walkable(px, py)) return { x: px, y: py };
    }
  }
  return null;
}

export function createGame({ parent, palette, save, onSave, isPaused, wind = 'cycle', dayClock = () => Date.now() / 1000 }) {
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
      this.stepCount = save.steps || 0;
      this.distance = save.distance || 0;
      this.attacking = false;
      this.facing = save.facing || 'side';
      this.flip = !!save.flip;
      this.capeClock = 0;

      this.makeTextures();

      const land = landing();
      this.spawn = { x: land.shore + 30, y: land.y };
      const start = (save.x != null && nearestWalkable(save.x, save.y)) || this.spawn;
      this.pos = { x: start.x, y: start.y };

      // La barque sur laquelle il a accosté : poupe dans l'eau, proue sur la grève
      this.boatRest = { x: land.shore + 8 - BOAT_BOW.x, y: land.y - BOAT_WATERLINE };
      boatRect = { x0: this.boatRest.x, x1: this.boatRest.x + BOAT_W - 2, y0: this.boatRest.y + 5, y1: this.boatRest.y + BOAT_H - 1 };
      this.boat = this.add.image(this.boatRest.x, this.boatRest.y, 'boat-still').setOrigin(0, 0).setDepth(this.boatRest.y + BOAT_H);
      this.foam = this.add.graphics().setDepth(this.boatRest.y + BOAT_H + 0.1);
      this.foamClock = 0;

      // La maison, vers le bout des traces
      this.house = this.add.image(HOUSE.x, HOUSE.y + 1, 'house').setOrigin(0.5, 1).setDepth(HOUSE.y);
      this.roomBlack = this.add.rectangle(ROOM_AT.x - 700, ROOM_AT.y - 500, ROOM_W + 1400, ROOM_H + 1000, 0x05070c)
        .setOrigin(0, 0).setDepth(DEPTH_ROOM - 2).setVisible(false);
      this.room = this.add.image(ROOM_AT.x, ROOM_AT.y, 'room').setOrigin(0, 0).setDepth(DEPTH_ROOM - 1).setVisible(false);
      this.doorArmed = true;

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

      this.fauna = createFauna(this, palette);

      window.addEventListener('keydown', e => {
        if (isPaused()) return;
        if (MOVE_CODES[e.code] || e.code === 'ShiftLeft' || e.code === 'ShiftRight') { this.keys.add(e.code); e.preventDefault(); }
      });
      window.addEventListener('keyup', e => this.keys.delete(e.code));
      window.addEventListener('blur', () => this.keys.clear());

      this.input.on('pointerdown', p => {
        if (!isPaused() && p.button === 0) this.attack(p.worldX, p.worldY);
      });

      this.time.addEvent({ delay: 4000, loop: true, callback: () => this.persist() });

      // Jour et nuit : un voile bleu nuit (multiplié) et, à l'aube et au
      // crépuscule, une lueur rouge ; la nuit, le feu s'allume à la fenêtre
      const cover = c => this.add.rectangle(-200, -200, 5000, 4000, hex(c)).setOrigin(0, 0).setScrollFactor(0);
      this.shade = cover(palette.b).setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(DEPTH_SKY + 5).setAlpha(0);
      this.tint = cover(palette.r).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH_SKY + 6).setAlpha(0);
      this.applyDaylight();
      this.time.addEvent({ delay: 250, loop: true, callback: () => this.applyDaylight() });

      this.updateChunks(true);
    }

    applyDaylight() {
      const d = daylightAt(dayClock());
      this.daylight = d;
      this.shade.setAlpha(d.night * 0.5);
      this.tint.setAlpha(d.dusk * 0.08);
      sky.style.filter = d.night > 0.01 ? `brightness(${(1 - 0.5 * d.night).toFixed(2)})` : '';
    }

    // ── La barque : échouée, elle flotte et dodine ; l'écume bat sa coque ──
    updateBoat(dt, time) {
      // Elle flotte : dodine d'un pixel et roule doucement d'un bord à l'autre
      const phase = time / 1000;
      const bob = Math.sin(phase * 1.3) > 0.35 ? 1 : 0;
      const r = Math.sin(phase * 0.8 + 1);
      this.boat.setTexture(r > 0.55 ? 'boat-right' : r < -0.55 ? 'boat-left' : 'boat-still');
      this.boat.setPosition(this.boatRest.x, this.boatRest.y + bob);
      // Écume qui bat la coque, là où elle est dans l'eau
      this.foamClock -= dt;
      if (this.foamClock <= 0) {
        this.foamClock = 0.18;
        this.foam.clear();
        this.foam.fillStyle(hex(palette.s), 0.85);
        const bx = this.boat.x, by = this.boat.y;
        for (const e of BOAT_EDGE) {
          if (e.y < BOAT_WATERLINE - 1) continue;
          if (coast(bx + e.x, by + e.y) <= 0) continue;
          if (Math.sin(time / 240 + e.x * 0.7 + e.y) > 0.15) this.foam.fillRect(bx + e.x, by + e.y, 1, 1);
        }
      }
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
      for (const [k, rows] of Object.entries(BOAT_FRAMES)) art(`boat-${k}`, rows);
      art('house', HOUSE_ART);
      art('room', ROOM);
      art('dust', ['b']);
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
      const depth = this.pos.y + (this.inside ? DEPTH_ROOM : 0);
      this.player.setPosition(px + 0.5, py).setDepth(depth);
      // La cape s'accroche à l'épaule côté est (le vent souffle vers l'est)
      const a = this.capeAnchor[this.player.frame.name];
      if (!a) return;
      const col = this.flip ? 2 * CX - a.west - 1 : a.east - 1;
      this.cape.setPosition(px + col - CX, py + a.y - GROUND - 1).setDepth(depth - 0.01);
    }

    updateCape(delta) {
      // Plus le vent est fort, plus la cape se couche et bat vite
      const force = Math.min(1, weather.wind / 140 + (this.running ? 0.45 : 0));
      const level = force < 0.22 ? 0 : force < 0.6 ? 1 : 2;
      this.capeClock += delta / 1000 * (3 + force * 14);
      this.cape.setFrame(`cape-${level}-${Math.floor(this.capeClock) % CAPE_PHASES}`);
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
      this.player.anims.timeScale = 1;
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
      this.updateBoat(delta / 1000, time);
      let mx = 0, my = 0;
      for (const code of this.keys) if (MOVE_CODES[code]) { mx += MOVE_CODES[code][0]; my += MOVE_CODES[code][1]; }
      this.running = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');

      if (!this.attacking) {
        if (mx || my) {
          const len = Math.hypot(mx, my);
          const step = SPEED * (this.running ? RUN : 1) * delta / 1000;
          const { x, y } = this.pos;
          const nx = x + mx / len * step, ny = y + my / len * step;
          // Ni la mer, ni la maison, ni les troncs : on glisse le long de l'obstacle
          const ok = this.inside ? walkableIn : walkable;
          if (ok(nx, ny)) { this.pos.x = nx; this.pos.y = ny; }
          else if (mx && ok(nx, y)) this.pos.x = nx;
          else if (my && ok(x, ny)) this.pos.y = ny;
          this.checkDoor(mx, my);
          this.distance += step;

          if (mx) { this.facing = 'side'; this.flip = mx < 0; }
          else this.facing = my < 0 ? 'back' : 'front';
          this.player.setFlipX(this.flip);
          const key = `${this.facing}-walk`;
          if (this.player.anims.currentAnim?.key !== key || !this.player.anims.isPlaying) this.player.play(key, true);
          this.player.anims.timeScale = this.running ? 1.9 : 1;
        } else if (this.player.anims.isPlaying) {
          this.player.stop();
          this.player.setFrame(`${this.facing}-idle`);
        }
      }
      this.placePlayer();
      this.updateCape(delta);
      if (!this.inside) this.fauna.update(delta / 1000, this.pos, this.running, weather.wind);
      // Devant ou derrière la maison, selon le pied de ses murs
      const front = houseFrontY(this.pos.x);
      this.house.setDepth(front == null ? HOUSE.y : this.pos.y > front ? this.pos.y - 0.5 : this.pos.y + 0.5);
      this.updateChunks();
      this.swayClock = (this.swayClock || 0) - delta;
      if (this.swayClock <= 0 && !this.inside) { this.swayClock = 90; this.swayTrees(time); }
      this.drawSky(delta / 1000);
    }

    // ── La maison : on entre par la porte, on ressort par la porte ──
    checkDoor(mx, my) {
      if (this.moving) return;
      if (!this.inside) {
        const d = Math.hypot(this.pos.x - HOUSE_DOOR_OUT.x, this.pos.y - HOUSE_DOOR_OUT.y);
        if (d > 12) this.doorArmed = true;
        // On y entre en marchant vers la porte
        const toward = mx * (HOUSE_DOOR_OUT.x - this.pos.x) + my * (HOUSE_DOOR_OUT.y - this.pos.y) > -0.5;
        if (this.doorArmed && d < 7 && toward) this.goInside();
      } else if (atRoomDoor(this.pos.x - ROOM_AT.x, this.pos.y - ROOM_AT.y)) {
        this.goOutside();
      }
    }

    teleport(x, y, then) {
      this.moving = true;
      const cam = this.cameras.main;
      cam.fadeOut(260, 0, 0, 0);
      cam.once('camerafadeoutcomplete', () => {
        this.pos = { x, y };
        then();
        this.placePlayer();
        cam.centerOn(x, y);
        this.updateChunks(true);
        cam.fadeIn(320, 0, 0, 0);
        this.moving = false;
      });
    }

    goInside() {
      this.teleport(ROOM_AT.x + ROOM_ENTRY.x, ROOM_AT.y + ROOM_ENTRY.y, () => {
        this.inside = true;
        this.room.setVisible(true); this.roomBlack.setVisible(true);
        this.cameras.main.setZoom(2);
        this.facing = 'side'; this.flip = false; this.player.setFlipX(false);
      });
    }

    goOutside() {
      this.teleport(HOUSE_DOOR_OUT.x - 7, HOUSE_DOOR_OUT.y + 9, () => {
        this.inside = false;
        this.doorArmed = false;
        this.room.setVisible(false); this.roomBlack.setVisible(false);
        this.cameras.main.setZoom(1);
        this.facing = 'front'; this.flip = false;
      });
    }

    drawSky(dt) {
      if (this.inside) {
        // Pas de neige qui tombe sous un toit
        skyCtx.setTransform(1, 0, 0, 1, 0, 0);
        skyCtx.clearRect(0, 0, sky.width, sky.height);
        return;
      }
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

      // Tous les objets du morceau dans une seule planche : un seul envoi à la
      // carte graphique. Les arbres y ont quatre images (penchés de −1 à +2
      // pixels à la cime) : le vent les fait passer de l'une à l'autre.
      const objs = objectsInChunk(cx, cy);
      const swayers = [];
      if (objs.length) {
        const ATLAS_W = 1024;
        const pieces = [];
        objs.forEach((o, i) => {
          const variants = o.type === 'tree' ? LEANS.map(l => leanRows(o.art.rows, l)) : [o.art.rows];
          variants.forEach((rows, v) => pieces.push({ i, v, rows, w: rows[0].length, h: rows.length }));
        });
        let x = 0, y = 0, rowH = 0;
        for (const p of pieces) {
          if (x + p.w > ATLAS_W) { x = 0; y += rowH + 1; rowH = 0; }
          p.x = x; p.y = y;
          x += p.w + 1; rowH = Math.max(rowH, p.h);
        }
        const atlas = document.createElement('canvas');
        atlas.width = ATLAS_W; atlas.height = y + rowH + 1;
        const ctx = atlas.getContext('2d');
        for (const p of pieces) p.rows.forEach((row, ry) => [...row].forEach((ch, rx) => {
          if (ch === '.') return;
          ctx.fillStyle = palette[ch];
          ctx.fillRect(p.x + rx, p.y + ry, 1, 1);
        }));
        const objKey = `objects-${key}`;
        const tex = this.textures.addCanvas(objKey, atlas);
        textures.push(objKey);
        for (const p of pieces) tex.add(`${p.i}-${p.v}`, 0, p.x, p.y, p.w, p.h);
        objs.forEach((o, i) => {
          const tree = o.type === 'tree';
          const rest = tree ? LEANS.indexOf(0) : 0;
          const img = this.add.image(o.x - o.art.ax - (tree ? LEAN_PAD : 0), o.y + 1, objKey, `${i}-${rest}`)
            .setOrigin(0, 1).setDepth(o.y);
          images.push(img);
          if (tree) {
            // Chaque arbre a sa cadence : les grands ploient plus lentement
            swayers.push({ img, i, x: o.x, y: o.y, phase: (o.seed % 628) / 100, freq: 1.6 + 30 / (o.h + 10) });
          }
        });
      }
      return { images, textures, swayers };
    }

    // Les arbres ploient sous le vent : penchés vers l'est d'autant plus qu'il
    // souffle fort, et ils oscillent, plus amplement dans les rafales.
    swayTrees(time) {
      const t = time / 1000;
      const force = Math.min(1, weather.wind / 150);
      const base = force * 1.5, amp = 0.35 + 1.1 * weather.gust + 0.4 * force;
      const v = this.cameras.main.worldView;
      for (const chunk of this.chunks.values()) {
        for (const s of chunk.swayers) {
          if (s.x < v.x - 30 || s.x > v.right + 30 || s.y < v.y - 10 || s.y > v.bottom + 60) continue;
          // Le souffle passe sur la forêt comme une vague, d'ouest en est
          const wave = Math.sin(t * s.freq + s.phase - s.x * 0.02);
          const lean = Math.max(-1, Math.min(2, Math.round(base + wave * amp)));
          const frame = `${s.i}-${LEANS.indexOf(lean)}`;
          if (s.frame !== frame) { s.frame = frame; s.img.setFrame(frame); }
        }
      }
    }

    persist() {
      onSave({
        world: WORLD_VERSION,
        // Dans la maison, on retient le seuil (la pièce est hors de l'île)
        x: Math.round(this.inside ? HOUSE_DOOR_OUT.x - 7 : this.pos.x),
        y: Math.round(this.inside ? HOUSE_DOOR_OUT.y + 9 : this.pos.y),
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
    windPhase: () => weather.phase,
    dayPhase: () => daylightAt(dayClock()).phase,
    refreshDaylight: () => game.scene.getScene('island')?.applyDaylight(),
  };
}

// Touches physiques : ZQSD sur un clavier AZERTY, WASD en QWERTY, et les flèches.
const MOVE_CODES = {
  KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0],
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
};
