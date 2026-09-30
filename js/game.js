/* La scène Phaser : sol par morceaux, arbres et rochers, viking et sa cape,
   empreintes, maison. Le vent et la neige sont dessinés sur un calque à part
   (canvas 2D au-dessus du jeu), avec la même simulation que le labo. */
import {
  paintSheet, paintFrames, capeFrames, smearPixels, IMPACT, ATTACK_VIEWS,
  FRAME_W, FRAME_H, CX, GROUND, ORIGIN_X, ORIGIN_Y, CAPE_W, CAPE_H, CAPE_PHASES,
} from './viking.js';
import {
  WORLD, WORLD_VERSION, CHUNK, isLand, landing, paintChunk, objectsInChunk, blocked,
  HOUSE, HOUSE_ART, HOUSE_DOOR_OUT, houseBlocked, houseFrontY, coast, trail,
  LAKE, inLake, STATUE3_DOOR_OUT,
} from './world.js';
import { BOAT_FRAMES, BOAT_W, BOAT_H, BOAT_WATERLINE, BOAT_BOW, BOAT_EDGE, ROWBOAT_FRAMES } from './boat.js';
import { CRYPT, CRYPT_W, CRYPT_H, CRYPT_ENTRY, CHEST, CHEST_FRAMES, cryptWalkable, atCryptDoor, nearChest } from './crypt.js';
import { daylightAt, torchLight, TORCH_SIZES } from './daylight.js';
import { ROOM, ROOM_W, ROOM_H, ROOM_ENTRY, roomWalkable, atRoomDoor, CORPSE } from './interior.js';
import { createFoe, drawPips, FOE_HP } from './foe.js';
import { createFauna } from './fauna.js';
import { createWeather } from './weather.js';
import { createSea } from './sea.js';
import { LEANS, LEAN_PAD, leanRows, treeWind, treeLean, treeFreq } from './trees.js';

const Phaser = window.Phaser;

const SPEED = 18;              // pixels du monde par seconde : on marche lentement
const RUN = 2.4;               // Maj enfoncée : il court
const WALK_FPS = 7;
const OWN_PRINTS_MAX = 500;
const OWN_PRINT_LIFE = 40000;  // la neige recouvre nos pas en 40 s
const TARGET_HEIGHT = 440;     // hauteur visée de l'écran, en pixels du jeu

// Profondeurs : le sol et ce qui y est tracé sont sous tout ; les objets
// debout (arbres, rochers, maison, viking) sont triés par la ligne de leurs pieds.
const DEPTH_GROUND = -1000, DEPTH_WAVES = -600, DEPTH_MARKS = -500, DEPTH_BOAT = -400, DEPTH_SKY = 1e6;
// La pièce (et le viking qui y entre) passe au-dessus de tout le dehors
const DEPTH_ROOM = 5e5;

// Taille interne et facteur d'agrandissement entier, pour des pixels nets.
// Le canevas a la taille de l'écran ; c'est la caméra qui agrandit, d'un
// facteur entier au repos (pixels nets). La molette et le combat changent ce
// facteur : on passe en douceur d'un entier à l'autre.
export function fitScreen(w, h) {
  const zoom = Math.max(1, Math.round(h / TARGET_HEIGHT));
  return { zoom, width: Math.ceil(w), height: Math.ceil(h) };
}

// Emprise de la maison (on ne la traverse pas)
// (vue de trois quarts : le toit représente la profondeur de la maison)
// Emprise de la barque échouée (posée dans create)
const boatRects = [];
const inBoat = (x, y) => boatRects.some(b => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1);
const walkable = (x, y) => isLand(x, y) && !houseBlocked(x, y) && !blocked(x, y) && !inBoat(x, y);

// Les intérieurs (la maison, la crypte de la statue du lac) sont posés loin en
// mer, hors de l'île : quand on y entre, on y est téléporté ; tout autour, un
// fond noir cache la mer. `door` : le seuil, dehors ; `exit` : où l'on ressort.
const INTERIORS = {
  house: {
    at: { x: 700, y: 700 }, key: 'room', w: ROOM_W, h: ROOM_H, entry: ROOM_ENTRY,
    walk: roomWalkable, atDoor: atRoomDoor, door: HOUSE_DOOR_OUT, radius: 7,
    exit: { x: HOUSE_DOOR_OUT.x - 7, y: HOUSE_DOOR_OUT.y + 9 }, enterFacing: 'side',
  },
  crypt: {
    at: { x: 400, y: 400 }, key: 'crypt', w: CRYPT_W, h: CRYPT_H, entry: CRYPT_ENTRY,
    walk: cryptWalkable, atDoor: atCryptDoor, door: STATUE3_DOOR_OUT, radius: 5,
    exit: { x: STATUE3_DOOR_OUT.x, y: STATUE3_DOOR_OUT.y + 6 }, enterFacing: 'back',
  },
};
// La barque du lac flotte là où l'eau est assez profonde pour sa coque
const afloat = (x, y) => inLake(x, y) && coast(x, y) > 0.0035 && inLake(x - 7, y) && inLake(x + 7, y);

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
      boatRects.length = 0;
      boatRects.push({ x0: this.boatRest.x, x1: this.boatRest.x + BOAT_W - 2, y0: this.boatRest.y + 5, y1: this.boatRest.y + BOAT_H - 1 });
      // L'autre barque (ils étaient deux) : tirée plus haut sur la grève, au
      // nord, immobile (proposition A du labo)
      let sx = land.shore;
      const sy = land.y - 26;
      while (isLand(sx, sy)) sx -= 2;
      while (!isLand(sx, sy)) sx += 2;
      const b2 = { x: sx + 14 - BOAT_BOW.x, y: sy - BOAT_WATERLINE };
      this.add.image(b2.x, b2.y, 'boat-still').setOrigin(0, 0).setDepth(b2.y + BOAT_H);
      boatRects.push({ x0: b2.x, x1: b2.x + BOAT_W - 2, y0: b2.y + 5, y1: b2.y + BOAT_H - 1 });
      this.boat = this.add.image(this.boatRest.x, this.boatRest.y, 'boat-still').setOrigin(0, 0).setDepth(this.boatRest.y + BOAT_H);
      this.foam = this.add.graphics().setDepth(this.boatRest.y + BOAT_H + 0.1);
      this.foamClock = 0;
      // Les vagues : rouleaux sur la grève, moutons au large
      this.sea = createSea(coast);
      this.waves = this.add.graphics().setDepth(DEPTH_WAVES);
      this.wavesClock = 0;

      // La maison, vers le bout des traces
      this.house = this.add.image(HOUSE.x, HOUSE.y + 1, 'house').setOrigin(0.5, 1).setDepth(HOUSE.y);
      for (const I of Object.values(INTERIORS)) {
        I.black = this.add.rectangle(I.at.x - 700, I.at.y - 500, I.w + 1400, I.h + 1000, hex(palette.k))
          .setOrigin(0, 0).setDepth(DEPTH_ROOM - 2).setVisible(false);
        I.image = this.add.image(I.at.x, I.at.y, I.key).setOrigin(0, 0).setDepth(DEPTH_ROOM - 1).setVisible(false);
      }
      this.doorArmed = true;
      // Le coffre de la crypte
      const C = INTERIORS.crypt;
      this.chestOpen = !!save.chestOpen;
      this.chest = this.add.image(C.at.x + CHEST.x, C.at.y + CHEST.y + 1, this.chestOpen ? 'chest-open' : 'chest-closed')
        .setOrigin(0.5, 1).setDepth(DEPTH_ROOM + C.at.y + CHEST.y).setVisible(false);

      // La barque du lac : on y monte en marchant dessus, on rame, on en
      // descend en abordant une rive
      this.rowing = false;
      this.boardArmed = true;
      const rb = save.rowboat && afloat(save.rowboat.x, save.rowboat.y) ? save.rowboat : (() => {
        for (let y = LAKE.y - LAKE.ry - 20; y < LAKE.y; y++) if (afloat(LAKE.x - 40, y + 3)) return { x: LAKE.x - 40, y: y + 3 };
        return { x: LAKE.x, y: LAKE.y - 40 };
      })();
      this.rowboat = { x: rb.x, y: rb.y, flip: false, clock: 0 };
      this.rowboatSprite = this.add.image(rb.x, rb.y, 'rowboat-empty').setOrigin(0.5, 0.7).setDepth(rb.y);

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
      // Zoom : base (taille de l'écran), molette (±), combat, intérieur (×2)
      this.zoom = { base: fit.zoom, wheel: 0, fight: 0, current: fit.zoom };
      cam.setZoom(fit.zoom);
      this.input.on('wheel', (p, over, dx, dy) => {
        if (isPaused()) return;
        const z = this.zoom;
        z.wheel = Math.max(Math.max(1, z.base - 1) - z.base, Math.min(2, z.wheel + (dy > 0 ? -1 : 1)));
      });
      cam.setBackgroundColor(palette.b);

      this.dust = this.add.particles(0, 0, 'dust', {
        lifespan: { min: 350, max: 900 }, speed: { min: 10, max: 45 },
        gravityY: 60, alpha: { start: 0.9, end: 0 }, emitting: false,
      }).setDepth(DEPTH_SKY - 1);

      // Le sang qui gicle quand une lame porte
      this.gore = this.add.particles(0, 0, 'blood', {
        lifespan: { min: 300, max: 800 }, speed: { min: 20, max: 70 },
        gravityY: 140, alpha: { start: 1, end: 0.3 }, emitting: false,
      }).setDepth(DEPTH_SKY - 1);

      this.fauna = createFauna(this, palette);

      window.addEventListener('keydown', e => {
        if (isPaused()) return;
        if (MOVE_CODES[e.code] || e.code === 'ShiftLeft' || e.code === 'ShiftRight') { this.keys.add(e.code); e.preventDefault(); }
      });
      window.addEventListener('keyup', e => this.keys.delete(e.code));
      window.addEventListener('blur', () => this.keys.clear());

      this.input.on('pointerdown', p => {
        if (isPaused() || this.dead || this.rowing || p.button !== 0) return;
        // Dans la crypte, un clic près du coffre l'ouvre
        if (this.inside === 'crypt' && !this.chestOpen && this.nearChest()) { this.openChest(); return; }
        this.attack(p.worldX, p.worldY);
      });

      // ── L'autre viking, au bout des traces ──
      this.art('fallen', CORPSE);
      const end = trail.at(-1);
      const post = nearestWalkable(Math.round(end.x + Math.cos(end.heading) * 18), Math.round(end.y + Math.sin(end.heading) * 18)) || { x: end.x, y: end.y };
      this.hp = FOE_HP;
      this.invuln = 0;
      this.playerPips = this.add.graphics();
      this.foe = createFoe(this, {
        post, walkable, capeAnchor: this.capeAnchor, dead: !!save.foeDead,
        onStrike: (x, y, dir) => this.struckAt(x, y, dir),
        bleed: (x, y, n) => this.bleed(x, y, n),
      });

      this.time.addEvent({ delay: 4000, loop: true, callback: () => this.persist() });

      // Jour et nuit : un voile bleu nuit (multiplié) et, à l'aube et au
      // crépuscule, une lueur rouge ; la nuit, le feu s'allume à la fenêtre
      const cover = c => this.add.rectangle(-200, -200, 5000, 4000, hex(c)).setOrigin(0, 0).setScrollFactor(0);
      // Le voile de nuit est une texture (posée sur la vue) : la torche y
      // creuse un halo de lumière
      this.shade = this.add.renderTexture(0, 0, 2800, 1700).setOrigin(0, 0)
        .setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(DEPTH_SKY + 5);
      this.lightStamp = this.make.image({ key: 'torchlight1' }, false).setOrigin(0.5);
      this.glow = this.add.image(0, 0, 'torchglow').setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH_SKY + 7).setAlpha(0);
      this.torchOn = 0;
      this.flame = this.add.graphics();
      this.shadows = this.add.graphics().setDepth(DEPTH_MARKS + 2);
      this.shadowClock = 0;
      this.tint = cover(palette.r).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH_SKY + 6).setAlpha(0);
      this.applyDaylight();
      this.time.addEvent({ delay: 250, loop: true, callback: () => this.applyDaylight() });

      this.updateChunks(true);
    }

    applyDaylight() {
      const d = daylightAt(dayClock());
      this.daylight = d;
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
          if (e.y < BOAT_WATERLINE + 1) continue;
          if (coast(bx + e.x, by + e.y) <= 0) continue;
          if (Math.sin(time / 300 + e.x * 1.3 + e.y * 2.1) > 0.9) this.foam.fillRect(bx + e.x, by + e.y, 1, 1);
        }
      }
    }

    // Zoom de la caméra : on vise un facteur entier et l'on y glisse. En combat,
    // la caméra se rapproche (zoom d'action) ; dans la maison, ×2.
    updateZoom(dt) {
      const z = this.zoom, cam = this.cameras.main;
      const f = this.foe;
      const fighting = !this.inside && !this.dead && f.engaged && f.alive &&
        Math.hypot(f.pos.x - this.pos.x, f.pos.y - this.pos.y) < 70;
      z.fight += ((fighting ? 1 : 0) - z.fight) * Math.min(1, dt * (fighting ? 2.5 : 1.2));
      if (Math.abs(z.fight - (fighting ? 1 : 0)) < 0.005) z.fight = fighting ? 1 : 0;
      const rest = z.base + z.wheel;
      const target = (rest + z.fight * Math.max(1, Math.round(rest * 0.5))) * (this.inside ? 2 : 1);
      // En passant la porte (sous le fondu), pas de glissé
      const k = Math.abs(target - z.current) < 0.01 || z.inside !== this.inside ? 1 : Math.min(1, dt * 6);
      z.inside = this.inside;
      z.current += (target - z.current) * k;
      if (cam.zoom !== z.current) cam.setZoom(z.current);
      const px = `${Math.max(1, Math.round(z.current))}px`;
      if (px !== this.lastPx) { this.lastPx = px; parent.style.setProperty('--px', px); }
    }

    updateWaves(dt, time) {
      this.wavesClock -= dt;
      if (this.wavesClock > 0) return;
      this.wavesClock = 0.12;
      this.waves.clear();
      if (this.inside) return;
      const v = this.cameras.main.worldView, g = this.waves, snow = hex(palette.s);
      this.sea.draw({ x: Math.floor(v.x) - 2, y: Math.floor(v.y) - 2, w: Math.ceil(v.width) + 4, h: Math.ceil(v.height) + 4 }, time / 1000,
        (x, y, a) => { g.fillStyle(snow, a); g.fillRect(x, y, 1, 1); }, 0.6 + weather.wind / 120);
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

      const art = this.art = (key, rows) => {
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
      art('crypt', CRYPT);
      for (const [k, rows] of Object.entries(CHEST_FRAMES)) art(`chest-${k}`, rows);
      for (const [k, rows] of Object.entries(ROWBOAT_FRAMES)) art(`rowboat-${k}`, rows);
      art('blood', ['r']);
      // Halo de la torche : une tache ronde, pleine au centre, qui s'efface
      const halo = (key, rgb, size) => {
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d'), h = size / 2;
        const grad = ctx.createRadialGradient(h, h, 0, h, h, h);
        grad.addColorStop(0, `rgba(${rgb},1)`); grad.addColorStop(0.35, `rgba(${rgb},0.85)`);
        grad.addColorStop(0.7, `rgba(${rgb},0.3)`); grad.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = grad; ctx.fillRect(0, 0, size, size);
        this.textures.addCanvas(key, c);
      };
      const rgbOf = h => { const n = parseInt(h.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };
      halo('torchglow', rgbOf(palette.r), 128);
      // La lumière de la torche : trois tailles, pour le vacillement
      TORCH_SIZES.forEach((k, n) => this.textures.addCanvas(`torchlight${n}`, torchLight(k)));
      art('dust', ['b']);
    }

    makeAnimations() {
      for (const view of ['side', 'front', 'back']) {
        this.anims.create({
          key: `${view}-walk`,
          frames: [0, 1, 2, 3].map(i => ({ key: 'viking', frame: `${view}-walk-${i}` })),
          frameRate: WALK_FPS, repeat: -1,
        });
      }
      for (const view of ATTACK_VIEWS) {
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

    mark(x, y, w, h, life, color = palette.b) {
      const m = this.add.rectangle(x, y, w, h, hex(color), 0.9).setOrigin(0, 0).setDepth(DEPTH_MARKS);
      this.tweens.add({ targets: m, alpha: 0, duration: life, ease: 'Quad.easeIn', onComplete: () => m.destroy() });
      this.ownPrints.push(m);
      if (this.ownPrints.length > OWN_PRINTS_MAX) this.ownPrints.shift().destroy();
    }

    // ── Attaque : vers le pointeur, dans l'une des quatre directions ──
    attack(tx, ty) {
      if (this.attacking) return;
      // Huit directions : profil, face, dos, et les quatre diagonales (jouées
      // de profil, la lame en travers)
      const dx = tx - this.pos.x, dy = ty - (this.pos.y - 5);
      const a = Math.atan2(dy, Math.abs(dx)) * 180 / Math.PI;   // -90 (haut) → 90 (bas)
      if (a < -67.5) { this.facing = 'back'; this.swingView = 'back'; }
      else if (a > 67.5) { this.facing = 'front'; this.swingView = 'front'; }
      else {
        this.facing = 'side'; this.flip = dx < 0;
        this.swingView = a < -22.5 ? 'diagup' : a > 22.5 ? 'diagdown' : 'side';
      }
      this.player.setFlipX(this.flip);
      this.attacking = true;
      this.player.anims.timeScale = 1;
      this.player.play(`${this.swingView}-attack`);
    }

    swing() {
      const dir = this.flip ? -1 : 1;
      const x = Math.round(this.pos.x), y = Math.round(this.pos.y);
      const g = this.add.graphics().setDepth(this.pos.y + 0.5);
      for (const p of smearPixels(this.swingView)) {
        g.fillStyle(hex(palette.b), p.a);
        g.fillRect(x + p.x * dir, y + p.y, 1, 1);
      }
      this.tweens.add({ targets: g, alpha: 0, duration: 260, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
    }

    // La lame s'écrase dans la neige : secousse, gerbe, entaille qui reste un moment
    impact() {
      const dir = this.flip ? -1 : 1;
      const view = this.swingView, off = IMPACT[view];
      const x = Math.round(this.pos.x) + off.x * dir, y = Math.round(this.pos.y) + off.y;
      this.cameras.main.shake(140, 0.006);
      const up = view !== 'front' && view !== 'back' ? (dir > 0 ? { min: 200, max: 330 } : { min: 210, max: 340 }) : { min: 200, max: 340 };
      this.dust.setConfig({
        lifespan: { min: 350, max: 900 }, speed: { min: 10, max: 45 }, angle: up,
        gravityY: 60, alpha: { start: 0.9, end: 0 }, emitting: false,
      });
      this.dust.explode(16, x, y);
      if (view === 'side') this.mark(dir > 0 ? x - 2 : x - 3, y, 6, 1, 25000);
      else if (view === 'diagdown' || view === 'diagup') {
        // Entaille en biais, dans le sens du coup
        const sy = view === 'diagdown' ? 1 : -1;
        for (let k = -2; k <= 2; k++) this.mark(x + k * dir, y + Math.round(k * 0.7) * sy, 1, 1, 25000);
      }
      else this.mark(x, y - 2, 1, 5, 25000);
      this.mark(x + 3, y - 1, 1, 1, 12000);
      this.mark(x - 2, y + 1, 1, 1, 12000);
      const ring = this.add.ellipse(x, y, 4, 2).setStrokeStyle(1, hex(palette.b), 0.6).setDepth(DEPTH_MARKS + 1);
      this.tweens.add({ targets: ring, scaleX: 4, scaleY: 3, alpha: 0, duration: 420, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
      // L'autre viking est-il sous la lame ?
      if (this.foe.hitAt(x, y, dir || 1)) {
        this.cameras.main.shake(180, 0.01);
        this.spurt(this.foe.pos.x, this.foe.pos.y - 5, dir || 1, this.foe.alive ? 18 : 30);
        if (!this.foe.alive) this.pool(this.foe.pos.x, this.foe.pos.y);
      }
    }

    // ── Le combat ──
    // Du sang sur la neige : des gouttes autour de (x, y), qui restent
    bleed(x, y, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.random() * (2 + n * 0.4);
        this.mark(Math.round(x + Math.cos(a) * d * 1.5), Math.round(y - 1 + Math.sin(a) * d * 0.7), Math.random() < 0.3 ? 2 : 1, 1, 600000, palette.r);
      }
    }

    // Une gerbe de sang qui part dans le sens du coup, et retombe en gouttes
    spurt(x, y, dir, n = 18) {
      this.gore.setConfig({
        lifespan: { min: 300, max: 800 }, speed: { min: 20, max: 75 },
        angle: dir > 0 ? { min: -70, max: 20 } : { min: 160, max: 250 },
        gravityY: 150, alpha: { start: 1, end: 0.3 }, emitting: false,
      });
      this.gore.explode(n, x, y);
      // Là où elle retombe : une traînée de gouttes dans le sens du coup
      for (let i = 0; i < n * 0.8; i++) {
        const d = 2 + Math.random() * 14;
        this.mark(Math.round(x + dir * d), Math.round(y + 5 + (Math.random() - 0.5) * 5), Math.random() < 0.25 ? 2 : 1, 1, 600000, palette.r);
      }
    }

    // Une flaque sous un corps, qui s'étale un moment
    pool(x, y) {
      let k = 0;
      this.time.addEvent({ delay: 180, repeat: 14, callback: () => {
        k++;
        for (let i = 0; i < 6; i++) {
          const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * (2 + k * 0.45);
          this.mark(Math.round(x + Math.cos(a) * d * 1.6), Math.round(y - 1 + Math.sin(a) * d * 0.6), 2, 1, 900000, palette.r);
        }
      } });
    }

    // Blessé, on saigne en marchant : des gouttes sur la neige
    drip(x, y, dt, hp) {
      if (hp >= FOE_HP || Math.random() > dt * (FOE_HP - hp) * 2.2) return;
      this.mark(Math.round(x + (Math.random() - 0.5) * 4), Math.round(y + (Math.random() - 0.5) * 2), 1, 1, 300000, palette.r);
    }

    // La lame de l'autre touche (x, y) : sommes-nous dessous ?
    struckAt(x, y, dir) {
      if (this.dead || this.invuln > 0) return;
      if (Math.abs(this.pos.x - x) > 6 || Math.abs(this.pos.y - y) > 5) return;
      this.hp--;
      this.invuln = 0.8;
      this.bleed(this.pos.x, this.pos.y, 8);
      this.spurt(this.pos.x, this.pos.y - 5, dir, this.hp > 0 ? 18 : 30);
      this.cameras.main.shake(200, 0.012);
      if (this.hp <= 0) { this.pool(this.pos.x, this.pos.y); this.fall(dir); return; }
      // Recul, et on clignote
      for (let k = 0; k < 6; k++) {
        const nx = this.pos.x + dir;
        if (walkable(nx, this.pos.y)) this.pos.x = nx;
      }
      this.tweens.add({ targets: [this.player, this.cape], alpha: 0.2, duration: 70, yoyo: true, repeat: 2 });
    }

    // Nous tombons ; un temps, puis on se réveille près de la barque
    fall(dir) {
      this.dead = true;
      this.attacking = false;
      this.player.stop();
      this.player.setTexture('fallen').setOrigin(0.5, 1).setFlipX(dir < 0).setAlpha(1);
      this.cape.setVisible(false);
      this.bleed(this.pos.x, this.pos.y, 14);
      this.time.delayedCall(2600, () => {
        const cam = this.cameras.main;
        cam.fadeOut(900, 0, 0, 0);
        cam.once('camerafadeoutcomplete', () => {
          this.dead = false;
          this.hp = FOE_HP;
          this.player.setTexture('viking', 'side-idle').setOrigin(ORIGIN_X, ORIGIN_Y).setFlipX(false);
          this.cape.setVisible(true);
          this.foe.reset();
          this.pos = { ...this.spawn };
          this.facing = 'side'; this.flip = false;
          this.placePlayer();
          cam.centerOn(this.spawn.x, this.spawn.y);
          this.updateChunks(true);
          this.persist();
          cam.fadeIn(1200, 0, 0, 0);
        });
      });
    }

    update(time, delta) {
      if (isPaused() || this.dead) this.keys.clear();
      this.invuln = Math.max(0, this.invuln - delta / 1000);
      // Hors du combat, les blessures se referment peu à peu
      if (this.hp < FOE_HP && !this.dead && !(this.foe.engaged && this.foe.alive)) {
        this.healClock = (this.healClock || 0) + delta / 1000;
        if (this.healClock > 25) { this.healClock = 0; this.hp++; }
      } else this.healClock = 0;
      this.updateBoat(delta / 1000, time);
      this.updateWaves(delta / 1000, time);
      this.updateZoom(delta / 1000);
      let mx = 0, my = 0;
      for (const code of this.keys) if (MOVE_CODES[code]) { mx += MOVE_CODES[code][0]; my += MOVE_CODES[code][1]; }
      this.running = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');

      if (this.rowing) this.row(mx, my, delta / 1000);
      else if (!this.attacking && !this.dead) {
        if (mx || my) {
          const len = Math.hypot(mx, my);
          const step = SPEED * (this.running ? RUN : 1) * delta / 1000;
          const { x, y } = this.pos;
          const nx = x + mx / len * step, ny = y + my / len * step;
          // Ni la mer, ni la maison, ni les troncs : on glisse le long de l'obstacle
          const I = INTERIORS[this.inside];
          const ok = I ? (px, py) => I.walk(px - I.at.x, py - I.at.y) : walkable;
          if (ok(nx, ny)) { this.pos.x = nx; this.pos.y = ny; }
          else if (mx && ok(nx, y)) this.pos.x = nx;
          else if (my && ok(x, ny)) this.pos.y = ny;
          this.checkDoor(mx, my);
          this.checkBoat(mx, my);
          if (this.inside === 'crypt' && my < 0 && !this.chestOpen && this.nearChest()) this.openChest();
          this.drip(this.pos.x, this.pos.y, delta / 1000, this.hp);
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
      if (!this.dead) this.placePlayer();
      this.updateCape(delta);
      this.foe.update(delta / 1000, this, this.cape.frame.name);
      if (this.foe.alive && this.foe.state === 'engage') this.drip(this.foe.pos.x, this.foe.pos.y, delta / 1000, this.foe.hp);
      drawPips(this.playerPips, this.pos.x, this.pos.y, this.hp, this.foe.engaged && this.foe.alive && !this.dead);
      if (!this.inside) this.fauna.update(delta / 1000, this.pos, this.running, weather.wind, this.foe.alive ? null : this.foe.pos);
      // Devant ou derrière la maison, selon le pied de ses murs
      const front = houseFrontY(this.pos.x);
      this.house.setDepth(front == null ? HOUSE.y : this.pos.y > front ? this.pos.y - 0.5 : this.pos.y + 0.5);
      this.updateChunks();
      this.swayClock = (this.swayClock || 0) - delta;
      if (this.swayClock <= 0 && !this.inside) { this.swayClock = 45; this.swayTrees(time); }
      this.updateNight(delta / 1000, time);
      this.drawSky(delta / 1000);
    }

    // ── La nuit : le voile, et la torche qu'il sort quand il fait noir ──
    // Où brûle la torche (la main libre, du côté où il regarde)
    torchPoint() {
      const x = Math.round(this.pos.x), y = Math.round(this.pos.y);
      if (this.rowing) return { x: x + (this.rowboat.flip ? 3 : -3), y: y - 10, behind: false };
      const dir = this.flip ? -1 : 1;
      if (this.facing === 'side') return { x: x + dir * 3, y: y - 8, behind: false };
      if (this.facing === 'front') return { x: x + 4, y: y - 7, behind: false };
      return { x: x - 4, y: y - 8, behind: true };
    }

    updateNight(dt, time) {
      const night = this.daylight?.night || 0, t = time / 1000;
      const want = night > 0.4 && !this.dead ? 1 : 0;
      this.torchOn += (want - this.torchOn) * Math.min(1, dt * 1.5);
      if (Math.abs(this.torchOn - want) < 0.01) this.torchOn = want;
      const lit = this.torchOn * night;
      const flick = 1 + 0.07 * Math.sin(t * 11) * Math.sin(t * 5.3 + 1) + 0.03 * Math.sin(t * 23);
      const tp = this.torchPoint();
      // Le voile de nuit, percé autour de la torche
      const v = this.cameras.main.worldView, rt = this.shade;
      rt.setPosition(Math.floor(v.x) - 300, Math.floor(v.y) - 300);
      rt.clear();
      const veil = night * 0.62;
      if (veil > 0.005) {
        rt.fill(hex(palette.b), veil);
        if (lit > 0.01) {
          const size = flick > 1.04 ? 2 : flick < 0.96 ? 0 : 1;
          this.lightStamp.setTexture(`torchlight${size}`).setPosition(Math.round(tp.x - rt.x), Math.round(tp.y + 4 - rt.y)).setAlpha(Math.min(1, this.torchOn * 1.1));
          rt.erase(this.lightStamp);
        }
      }
      this.glow.setPosition(tp.x, tp.y + 3).setScale(0.55 * flick, 0.38 * flick).setAlpha(0.1 * lit);
      // La flamme : un manche sombre, un cœur clair, des langues rouges
      const g = this.flame;
      g.clear();
      if (this.torchOn > 0.05 && !this.dead) {
        g.setDepth(this.pos.y + (this.inside ? DEPTH_ROOM : 0) + (tp.behind ? -0.02 : 0.02));
        g.fillStyle(hex(palette.b), 1);
        g.fillRect(tp.x, tp.y + 1, 1, 3);
        const k = Math.floor(t * 12);
        g.fillStyle(hex(palette.r), this.torchOn);
        g.fillRect(tp.x - (k % 2), tp.y - 1, 2, 1);
        g.fillRect(tp.x + ((k >> 1) % 2 ? 1 : -1) * (k % 3 === 0 ? 1 : 0), tp.y - 2 - (k % 2), 1, 1);
        g.fillStyle(hex(palette.s), this.torchOn);
        g.fillRect(tp.x, tp.y, 1, 1);
        // Une escarbille, de temps en temps
        if (k % 7 === 0) { g.fillStyle(hex(palette.r), 0.7 * this.torchOn); g.fillRect(tp.x + (k % 3) - 1, tp.y - 4 - (k % 4), 1, 1); }
      }
      // Les ombres, portées à l'opposé de la flamme
      this.shadowClock -= dt;
      if (this.shadowClock > 0) return;
      this.shadowClock = 0.06;
      const sg = this.shadows;
      sg.clear();
      if (lit < 0.05) return;
      sg.setDepth((this.inside ? DEPTH_ROOM : 0) + DEPTH_MARKS + 2);
      const lx = tp.x, ly = this.pos.y + 1, R = 95;
      const cast = (x, y, half, height, alpha = 1, fixed = 0) => {
        const dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy);
        if (d < 0.5 || d > R) return;
        const ux = dx / d, uy = dy / d, len = fixed || Math.max(6, Math.min(60, height * 24 / d)) * flick;
        const a = 0.55 * lit * Math.min(1, 1.4 * (1 - d / R)) * alpha;
        sg.fillStyle(hex(palette.b), Math.min(0.6, a));
        sg.fillPoints([
          { x: x - uy * half, y: y + ux * half * 0.6 },
          { x: x + uy * half, y: y - ux * half * 0.6 },
          { x: x + ux * len + uy * half * 1.5, y: y + uy * len * 0.6 - ux * half },
          { x: x + ux * len - uy * half * 1.5, y: y + uy * len * 0.6 + ux * half },
        ], true);
      };
      // Sa propre ombre : courte, du côté opposé à la torche
      if (!this.rowing) cast(this.pos.x, this.pos.y + 0.5, 1.5, 0, 1, 6);
      if (this.inside) return;
      if (Math.hypot(this.foe.pos.x - lx, this.foe.pos.y - ly) < R && this.foe.alive) cast(this.foe.pos.x, this.foe.pos.y, 2, 9);
      const cx = Math.floor(this.pos.x / CHUNK), cy = Math.floor(this.pos.y / CHUNK);
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        for (const o of objectsInChunk(cx + i, cy + j)) {
          if (o.type === 'iceberg' || o.type === 'cliff' || o.type === 'rubble') continue;
          if (Math.abs(o.x - lx) > R || Math.abs(o.y - ly) > R) continue;
          const half = o.type === 'tree' ? 1.5 : Math.min(8, (o.w || 6) * 0.3);
          cast(o.x + (o.type === 'tree' ? 0 : (o.w || 0) / 2 - (o.art?.ax || 0)), o.y, half, o.h || 10);
        }
      }
    }

    // ── La maison : on entre par la porte, on ressort par la porte ──
    checkDoor(mx, my) {
      if (this.moving) return;
      if (!this.inside) {
        for (const [key, I] of Object.entries(INTERIORS)) {
          const d = Math.hypot(this.pos.x - I.door.x, this.pos.y - I.door.y);
          if (d > 12) I.armed = true;
          // On y entre en marchant vers la porte
          const toward = mx * (I.door.x - this.pos.x) + my * (I.door.y - this.pos.y) > -0.5;
          if (I.armed !== false && d < I.radius && toward) { this.goInside(key); return; }
        }
      } else {
        const I = INTERIORS[this.inside];
        if (I.atDoor(this.pos.x - I.at.x, this.pos.y - I.at.y)) this.goOutside();
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

    goInside(key) {
      const I = INTERIORS[key];
      this.teleport(I.at.x + I.entry.x, I.at.y + I.entry.y, () => {
        this.inside = key;
        I.image.setVisible(true); I.black.setVisible(true);
        if (key === 'crypt') this.chest.setVisible(true);
        this.facing = I.enterFacing; this.flip = false; this.player.setFlipX(false);
        this.player.setFrame(`${this.facing}-idle`);
      });
    }

    goOutside() {
      const I = INTERIORS[this.inside];
      this.teleport(I.exit.x, I.exit.y, () => {
        this.inside = null;
        I.armed = false;
        I.image.setVisible(false); I.black.setVisible(false);
        this.chest.setVisible(false);
        this.facing = 'front'; this.flip = false;
      });
    }

    // ── La crypte : le coffre ──
    nearChest() {
      const C = INTERIORS.crypt.at;
      return nearChest(this.pos.x - C.x, this.pos.y - C.y);
    }

    openChest() {
      if (this.chestOpen) return;
      this.chestOpen = true;
      this.facing = 'back'; this.player.setFrame('back-idle');
      this.chest.setTexture('chest-ajar');
      this.time.delayedCall(380, () => {
        this.chest.setTexture('chest-open');
        this.cameras.main.shake(120, 0.004);
        // Des éclats montent du coffre
        const x = this.chest.x, y = this.chest.y - 4;
        for (let i = 0; i < 14; i++) {
          const p = this.add.image(x + Math.round((Math.random() - 0.5) * 8), y, i % 4 ? 'dust' : 'blood')
            .setDepth(this.chest.depth + 1).setTintFill(i % 4 ? hex(palette.s) : hex(palette.r));
          this.tweens.add({
            targets: p, y: y - 8 - Math.random() * 14, alpha: 0, delay: i * 60,
            duration: 900 + Math.random() * 600, ease: 'Sine.easeOut', onComplete: () => p.destroy(),
          });
        }
        this.persist();
      });
    }

    // ── La barque du lac ──
    checkBoat() {
      if (this.inside || this.moving) return;
      const b = this.rowboat, d = Math.hypot(this.pos.x - b.x, this.pos.y - b.y);
      if (d > 16) this.boardArmed = true;
      if (!this.boardArmed || d > 9) return;
      // On monte à bord : le viking s'assoit, prend les rames
      this.rowing = true;
      this.player.stop();
      this.player.setVisible(false); this.cape.setVisible(false);
      this.pos = { x: b.x, y: b.y };
      this.rowboatSprite.setTexture('rowboat-row1');
    }

    row(mx, my, dt) {
      const b = this.rowboat;
      if (mx || my) {
        const len = Math.hypot(mx, my), step = 13 * (this.running ? 1.6 : 1) * dt;
        const nx = b.x + mx / len * step, ny = b.y + my / len * step;
        if (afloat(nx, ny)) { b.x = nx; b.y = ny; }
        else if (mx && afloat(nx, b.y)) b.x = nx;
        else if (my && afloat(b.x, ny)) b.y = ny;
        else {
          // Une rive devant : on descend
          for (let k = 6; k <= 16; k++) {
            const lx = Math.round(b.x + mx / len * k), ly = Math.round(b.y + my / len * k);
            if (walkable(lx, ly)) { this.landAt(lx, ly, mx, my); return; }
          }
        }
        if (mx) b.flip = mx < 0;
        b.clock += dt * (this.running ? 7 : 4.5);
        this.distance += step;
      }
      const t = [0, 1, 2, 1][Math.floor(b.clock) % 4];
      this.rowboatSprite.setTexture(`rowboat-row${t}`).setFlipX(b.flip).setPosition(Math.round(b.x) + 0.5, Math.round(b.y)).setDepth(b.y);
      this.pos = { x: b.x, y: b.y };
    }

    landAt(x, y, mx, my) {
      this.rowing = false;
      this.boardArmed = false;
      this.rowboatSprite.setTexture('rowboat-empty');
      this.pos = { x, y };
      this.player.setVisible(true); this.cape.setVisible(true);
      if (Math.abs(mx) >= Math.abs(my)) { this.facing = 'side'; this.flip = mx < 0; }
      else this.facing = my < 0 ? 'back' : 'front';
      this.player.setFlipX(this.flip).setFrame(`${this.facing}-idle`);
      this.persist();
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
      const z = this.cameras.main.zoom;
      skyCtx.setTransform(z, 0, 0, z, -Math.round(v.x * z), -Math.round(v.y * z));
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
            swayers.push({ img, i, x: o.x, y: o.y, phase: (o.seed % 628) / 100, freq: treeFreq(o.h) });
          }
        });
      }
      return { images, textures, swayers };
    }

    // Les arbres ploient sous le vent : penchés vers l'est d'autant plus qu'il
    // souffle fort, et ils oscillent, plus amplement dans les rafales.
    swayTrees(time) {
      const t = time / 1000;
      const { base, amp } = treeWind(weather.wind, weather.gust);
      const v = this.cameras.main.worldView;
      for (const chunk of this.chunks.values()) {
        for (const s of chunk.swayers) {
          if (s.x < v.x - 30 || s.x > v.right + 30 || s.y < v.y - 10 || s.y > v.bottom + 60) continue;
          const lean = treeLean(t, s, base, amp);
          const frame = `${s.i}-${LEANS.indexOf(lean)}`;
          if (s.frame !== frame) { s.frame = frame; s.img.setFrame(frame); }
        }
      }
    }

    persist() {
      onSave({
        world: WORLD_VERSION,
        // Dedans, on retient le seuil (la pièce est hors de l'île)
        x: Math.round(this.inside ? INTERIORS[this.inside].exit.x : this.pos.x),
        y: Math.round(this.inside ? INTERIORS[this.inside].exit.y : this.pos.y),
        rowboat: { x: Math.round(this.rowboat.x), y: Math.round(this.rowboat.y) },
        chestOpen: this.chestOpen,
        facing: this.facing, flip: this.flip,
        steps: this.stepCount, distance: Math.round(this.distance),
        foeDead: this.foe ? !this.foe.alive : false,
      });
    }

    backToShore() {
      if (this.rowing) { this.rowing = false; this.rowboatSprite.setTexture('rowboat-empty'); this.player.setVisible(true); this.cape.setVisible(true); }
      if (this.inside) {
        const I = INTERIORS[this.inside];
        I.image.setVisible(false); I.black.setVisible(false); this.chest.setVisible(false);
        this.inside = null;
      }
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
    scale: { mode: Phaser.Scale.NONE },
    scene: Island,
    banner: false,
    input: { mouse: { preventDefaultWheel: false } },
    disableContextMenu: true,
  });

  function sizeSky(f) {
    sky.width = f.width; sky.height = f.height;
    sky.style.width = `${f.width}px`;
    sky.style.height = `${f.height}px`;
  }
  sizeSky(fit);
  parent.append(sky);

  function resize() {
    const r = parent.getBoundingClientRect();
    const f = fitScreen(r.width, r.height);
    game.scale.resize(f.width, f.height);
    sizeSky(f);
    const scene = game.scene.getScene('island');
    if (scene?.zoom) scene.zoom.base = f.zoom;
  }
  window.addEventListener('resize', resize);

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
