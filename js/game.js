/* La scène Phaser : sol par morceaux, arbres et rochers, viking et sa cape,
   empreintes, maison. Le vent et la neige sont dessinés sur un calque à part
   (canvas 2D au-dessus du jeu), avec la même simulation que le labo. */
import {
  paintSheet, paintFrames, capeFrames, smearPixels, IMPACT, ATTACK_VIEWS,
  FRAME_W, FRAME_H, CX, GROUND, ORIGIN_X, ORIGIN_Y, CAPE_W, CAPE_H, CAPE_PHASES,
} from './viking.js';
import {
  WORLD, WORLD_VERSION, CHUNK, isLand, landing, paintChunkSteps, objectsInChunk, blocked,
  HOUSE, HOUSE_ART, HOUSE_DOOR_OUT, houseBlocked, houseFrontY, coast, trail,
  LAKE, inLake, STATUE3_DOOR_OUT, deepForest, GROVE_TREE, GROVE_HOOKS, WATCHER_AT, WOLF_DEN, CAVE_DOOR_OUT,
} from './world.js';
import { createPack } from './pack.js';
import { CAVE_ROOM, CAVE_W, CAVE_H, CAVE_ENTRY, THRONE, THRONE_FRAMES, THRONE_FOOT, caveWalkable, atCaveDoor, nearThrone } from './cave.js';
import { BUNDLE, WATCHER } from './grove.js';
import { BOAT_FRAMES, BOAT_W, BOAT_H, BOAT_WATERLINE, BOAT_BOW, BOAT_EDGE, ROWBOAT_FRAMES, BOAT2, BOAT2_KEEL } from './boat.js';
import { CRYPT, CRYPT_W, CRYPT_H, CRYPT_ENTRY, CHEST, CHEST_FRAMES, cryptWalkable, atCryptDoor, nearChest } from './crypt.js';
import { daylightAt, torchLight, TORCH_SIZES, castShadow } from './daylight.js';
import { ROOM, ROOM_W, ROOM_H, ROOM_ENTRY, roomWalkable, atRoomDoor, CORPSE } from './interior.js';
import { createFoe, drawPips, FOE_HP } from './foe.js';
import { createFauna } from './fauna.js';
import { createWeather } from './weather.js';
import { createSea } from './sea.js';
import { audio } from './audio.js';
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
// L'endurance (0 → 1) : ce que coûtent un coup, une seconde de course ; ce
// que rend une seconde de repos
const STAMINA = { attack: 0.2, run: 0.16, regen: 0.3 };

// Taille interne et facteur d'agrandissement entier, pour des pixels nets.
// Le canevas a la taille de l'écran en pixels physiques (densité comprise :
// 125 %, Retina…) ; c'est la caméra qui agrandit, d'un facteur entier de
// pixels physiques au repos : pixels nets, lignes du CRT alignées, pas de
// moiré. La molette et le combat changent ce facteur, en douceur.
export function fitScreen(w, h) {
  const dpr = window.devicePixelRatio || 1;
  const zoom = Math.max(1, Math.round(h * dpr / TARGET_HEIGHT));
  return { zoom, dpr, width: Math.ceil(w * dpr), height: Math.ceil(h * dpr) };
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
  // La grotte, au pied de la falaise : il y fait toujours nuit
  cave: {
    at: { x: 300, y: 1000 }, key: 'cave', w: CAVE_W, h: CAVE_H, entry: CAVE_ENTRY,
    walk: caveWalkable, atDoor: atCaveDoor, door: CAVE_DOOR_OUT, radius: 5, dark: true,
    exit: { x: CAVE_DOOR_OUT.x, y: CAVE_DOOR_OUT.y + 6 }, enterFacing: 'back',
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

export function createGame({ parent, palette, save, onSave, isPaused, wind = 'cycle', dayClock = () => Date.now() / 1000, onHealth = () => {} }) {
  const hex = c => parseInt(c.slice(1), 16);
  const rect = parent.getBoundingClientRect();
  const fit = fitScreen(rect.width, rect.height);
  if (save.world !== WORLD_VERSION) save = { steps: save.steps };

  const weather = createWeather(wind);
  // La palette en octets, pour écrire les pixels d'un bloc
  const RGB = Object.fromEntries(Object.entries(palette).map(([k, h]) => {
    const n = parseInt(h.slice(1), 16);
    return [k, [n >> 16, (n >> 8) & 255, n & 255]];
  }));
  // Calque du vent et de la neige, posé sur le jeu, à la même échelle
  const sky = document.createElement('canvas');
  sky.className = 'sky';
  const skyCtx = sky.getContext('2d');

  class Island extends Phaser.Scene {
    constructor() { super('island'); }

    create() {
      this.chunks = new Map();
      this.keys = new Set();
      this.pad = { x: 0, y: 0, run: false };   // la croix, sur écran tactile
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
      // L'autre barque (ils étaient deux) : un mât sans voile, un autre angle ;
      // tirée tout entière sur la grève, au nord. Le sillon de sa quille court
      // jusqu'à l'eau, des pas l'accompagnent.
      let sx = land.shore;
      const sy = land.y - 30;
      while (isLand(sx, sy)) sx -= 2;
      while (!isLand(sx, sy)) sx += 2;
      const b2 = { x: sx + 16, y: sy - BOAT2.length + 4 };
      this.add.image(b2.x, b2.y, 'boat2').setOrigin(0, 0).setDepth(b2.y + BOAT2.length - 2);
      boatRects.push({ x0: b2.x + 4, x1: b2.x + BOAT2[0].length - 6, y0: b2.y + BOAT2.length - 12, y1: b2.y + BOAT2.length - 2 });
      const keel = this.add.graphics().setDepth(DEPTH_MARKS);
      const kx = b2.x + BOAT2_KEEL.x + 2, ky = b2.y + BOAT2_KEEL.y;
      for (let x = sx - 4; x < kx; x++) {
        const y = Math.round(ky + (x - kx) * 0.12);
        // Deux lèvres de neige repoussée, le creux entre elles
        keel.fillStyle(hex(palette.b), 0.55); keel.fillRect(x, y - 1, 1, 1);
        keel.fillStyle(hex(palette.b), 0.35); if ((x * 7) % 5) keel.fillRect(x, y + 1, 1, 1);
        // Les pas de ceux qui la halaient, de part et d'autre
        if (x % 5 === 0) { keel.fillStyle(hex(palette.b), 0.7); keel.fillRect(x, y + (x % 10 ? 4 : -4), 1, 1); }
      }
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

      // Le roi mort, au fond de la grotte
      const V = INTERIORS.cave;
      this.kingBowed = !!save.kingBowed;
      this.throne = this.add.image(V.at.x + THRONE.x + 0.5, V.at.y + THRONE.y + 1, this.kingBowed ? 'throne-bowed' : 'throne-seated')
        .setOrigin(0.5, (THRONE_FOOT + 1) / THRONE_FRAMES.seated.length).setDepth(DEPTH_ROOM + V.at.y + THRONE.y).setVisible(false);

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
      cam.centerOn(this.pos.x, this.pos.y);          // pas de long travelling au lancement
      // Zoom : base (taille de l'écran), molette (±), combat, intérieur (×2)
      this.zoom = { base: fit.zoom, dpr: fit.dpr, wheel: 0, fight: 0, current: fit.zoom };
      cam.setZoom(fit.zoom);
      this.input.on('wheel', (p, over, dx, dy) => {
        if (isPaused()) return;
        // Un léger zoom : de 90 à 110 %, par crans de 5 % (à 100 %, les pixels
        // restent nets ; entre deux, ils sont un peu inégaux)
        const z = this.zoom;
        z.wheel = Math.max(-2, Math.min(2, z.wheel + (dy > 0 ? -1 : 1)));
      });
      cam.setBackgroundColor(palette.b);

      // La neige qui tombe d'un arbre qu'on frappe ; les étincelles sur la pierre
      this.snowfall = this.add.particles(0, 0, 'snowdust', {
        lifespan: { min: 600, max: 1400 }, speedX: { min: -6, max: 6 }, speedY: { min: 4, max: 16 },
        gravityY: 22, alpha: { start: 1, end: 0 }, emitting: false,
      }).setDepth(DEPTH_SKY - 2);
      this.sparks = this.add.particles(0, 0, 'snowdust', {
        lifespan: { min: 120, max: 380 }, speed: { min: 40, max: 110 }, gravityY: 180,
        alpha: { start: 1, end: 0 }, emitting: false,
      }).setDepth(DEPTH_SKY - 1);
      this.embers = this.add.particles(0, 0, 'blood', {
        lifespan: { min: 80, max: 220 }, speed: { min: 30, max: 80 }, gravityY: 180,
        alpha: { start: 1, end: 0 }, emitting: false,
      }).setDepth(DEPTH_SKY - 1);
      this.dust = this.add.particles(0, 0, 'dust', {
        lifespan: { min: 350, max: 900 }, speed: { min: 10, max: 45 },
        gravityY: 60, alpha: { start: 0.9, end: 0 }, emitting: false,
      }).setDepth(DEPTH_SKY - 1);

      // ── Le bosquet sacré : les offrandes pendues, le guetteur ──
      this.ropes = this.add.graphics().setDepth(GROVE_TREE.y + 0.4);
      this.bundles = GROVE_HOOKS.map((h, i) => ({
        h, len: 3 + (i * 7) % 5, phase: i * 1.7,
        img: this.add.image(h.x, h.y, 'bundle').setOrigin(0.5, 0).setDepth(GROVE_TREE.y + 0.5),
      }));
      // Ses pas : trois empreintes qui arrivent jusqu'à lui, et plus rien
      const prints = this.add.graphics().setDepth(DEPTH_MARKS).fillStyle(hex(palette.b), 0.8);
      for (let k = 1; k <= 4; k++) prints.fillRect(WATCHER_AT.x - 1 + (k % 2) * 2, WATCHER_AT.y - k * 6 + 2, 1, 2);
      this.watcherGone = !!save.watcherGone;
      this.watcher = this.watcherGone ? null
        : this.add.image(WATCHER_AT.x + 0.5, WATCHER_AT.y + 1, 'watcher').setOrigin(0.5, 1).setDepth(WATCHER_AT.y);

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
      this.maxHp = FOE_HP;
      this.invuln = 0;
      this.stamina = 1;
      // Arbres abattus, rochers brisés : « x,y » → sens de la chute
      this.wrecked = new Map(Object.entries(save.wrecked || {}));
      this.staminaBar = this.add.graphics();
      this.playerPips = this.add.graphics();
      this.foe = createFoe(this, {
        post, walkable, capeAnchor: this.capeAnchor, dead: !!save.foeDead,
        onStrike: (x, y, dir) => { audio.play('swing'); this.struckAt(x, y, dir); },
        bleed: (x, y, n) => this.bleed(x, y, n),
      });
      // ── La meute, dans la grande clairière du bosquet ──
      this.wolfTracks();
      this.onPackSound = (name, opts) => audio.play(name, opts);
      this.pack = createPack(this, palette, {
        den: WOLF_DEN, radius: WOLF_DEN.r, isLand, dead: save.wolvesDead || [],
        onBite: (x, y, dir) => { audio.play('bite'); this.hurt(dir); },
        bleed: (x, y, n) => this.bleed(x, y, n),
      });

      this.time.addEvent({ delay: 4000, loop: true, callback: () => this.persist() });

      // Jour et nuit : un voile bleu nuit (multiplié) et, à l'aube et au
      // crépuscule, une lueur rouge ; la nuit, le feu s'allume à la fenêtre
      const cover = c => this.add.rectangle(-200, -200, 5000, 4000, hex(c)).setOrigin(0, 0).setScrollFactor(0);
      // Le voile de nuit est une texture (posée sur la vue) : la torche y
      // creuse un halo de lumière
      this.shade = this.add.renderTexture(0, 0, 256, 256).setOrigin(0, 0)
        .setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(DEPTH_SKY + 5);
      this.lightStamp = this.make.image({ key: 'torchlight1' }, false).setOrigin(0.5);
      this.glow = this.add.image(0, 0, 'torchglow').setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH_SKY + 7).setAlpha(0);
      this.torchOn = 0;
      this.flame = this.add.graphics();
      // Les ombres portées ne sont pas affichées telles quelles : elles sont
      // redessinées dans le voile de nuit (la lumière n'y passe pas)
      this.shadows = this.make.graphics({}, false);
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
      const fighting = !this.inside && !this.dead && ((f.engaged && f.alive &&
        Math.hypot(f.pos.x - this.pos.x, f.pos.y - this.pos.y) < 70) || this.pack.engaged);
      z.fight += ((fighting ? 1 : 0) - z.fight) * Math.min(1, dt * (fighting ? 2.5 : 1.2));
      if (Math.abs(z.fight - (fighting ? 1 : 0)) < 0.005) z.fight = fighting ? 1 : 0;
      const rest = z.base * (1 + 0.05 * z.wheel);
      const target = (rest + z.fight * Math.max(1, Math.round(z.base * 0.5))) * (this.inside ? 2 : 1);
      // En passant la porte (sous le fondu), pas de glissé
      const k = Math.abs(target - z.current) < 0.01 || z.inside !== this.inside ? 1 : Math.min(1, dt * 6);
      z.inside = this.inside;
      z.current += (target - z.current) * k;
      if (cam.zoom !== z.current) { cam.setZoom(z.current); this.cullClock = 0; }
      // Les lignes du CRT : une par pixel du jeu, en pixels physiques
      const px = `${Math.max(1, Math.round(z.current)) / z.dpr}px`;
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
      art('boat2', BOAT2);
      art('house', HOUSE_ART);
      art('room', ROOM);
      art('crypt', CRYPT);
      art('cave', CAVE_ROOM);
      for (const [k, rows] of Object.entries(THRONE_FRAMES)) art(`throne-${k}`, rows);
      for (const [k, rows] of Object.entries(CHEST_FRAMES)) art(`chest-${k}`, rows);
      for (const [k, rows] of Object.entries(ROWBOAT_FRAMES)) art(`rowboat-${k}`, rows);
      art('blood', ['r']);
      art('bundle', BUNDLE);
      art('watcher', WATCHER);
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
      art('snowdust', ['s']);
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
      // Plus le vent est fort, plus la cape se couche et bat vite ; à
      // l'intérieur, pas de vent : elle pend, immobile
      if (this.inside) { this.cape.setFrame('cape-0-0'); return; }
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

    // ── L'endurance : courir et frapper la vident ; elle revient au pas ──
    useStamina(k) { this.stamina = Math.max(0, this.stamina - k); this.staminaRest = 0.8; }
    updateStamina(dt) {
      if (this.running && (this.moved || this.rowing)) this.useStamina(STAMINA.run * dt);
      this.staminaRest = Math.max(0, (this.staminaRest || 0) - dt);
      if (!this.staminaRest) this.stamina = Math.min(1, this.stamina + STAMINA.regen * dt);
      this.staminaFlash = Math.max(0, (this.staminaFlash || 0) - dt);
      // La barre : sous les marques de vie, seulement quand elle n'est pas pleine
      const g = this.staminaBar, show = (this.stamina < 0.999 || this.staminaFlash) && !this.dead && !this.rowing;
      g.clear();
      if (!show) return;
      const x = Math.round(this.pos.x) - 4, y = Math.round(this.pos.y) - 12;
      g.setDepth(this.pos.y + 0.03 + (this.inside ? DEPTH_ROOM : 0));
      g.fillStyle(hex(palette.b), 0.22); g.fillRect(x, y, 9, 1);
      g.fillStyle(hex(this.staminaFlash > 0 && Math.floor(this.staminaFlash * 8) % 2 ? palette.r : palette.b), 0.9);
      g.fillRect(x, y, Math.round(9 * this.stamina), 1);
    }

    // ── Attaque : vers le pointeur, dans l'une des quatre directions ──
    attack(tx, ty) {
      if (this.attacking) return;
      // Trop essoufflé pour lever l'épée
      if (this.stamina < STAMINA.attack * 0.6) { this.staminaFlash = 0.6; return; }
      this.useStamina(STAMINA.attack);
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
      audio.play('swing');
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
    // Ce que la lame rencontre en (x, y) : un tronc, une pierre, ou rien
    struckObject(x, y) {
      const cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK);
      for (let j = 0; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        for (const o of objectsInChunk(cx + i, cy + j)) {
          if (o.type === 'iceberg' || o.fallen || o.broken) continue;
          if (o.type === 'tree' || o.type === 'grove') {
            if (Math.abs(x - o.x) <= 3 && y >= o.y - 5 && y <= o.y + 3) return { o, kind: 'tree' };
            continue;
          }
          const left = o.x - o.art.ax, right = left + o.w;
          const depth = Math.max(3, o.foot ?? o.h * 0.55);
          if (x >= left && x <= right && y >= o.y - depth - 2 && y <= o.y + 2) return { o, kind: 'rock' };
        }
      }
      return null;
    }

    // ── Arbres abattus, rochers brisés : ils le restent (sauvegardés) ──
    wreck(o, dir) {
      this.wrecked.set(`${o.x},${o.y}`, dir);
      this.persist();
    }

    // L'arbre bascule, loin du coup, et s'abat dans la neige
    fellTree(o, dir) {
      o.fallen = true;
      audio.play('wood');
      this.layTree(o, dir, false);
      this.wreck(o, dir);
    }

    layTree(o, dir, now) {
      const im = o.img;
      if (!im) return;
      for (const chunk of this.chunks.values()) {
        const s = chunk.swayers.find(w => w.x === o.x && w.y === o.y);
        if (s) { chunk.swayers.splice(chunk.swayers.indexOf(s), 1); break; }
      }
      // Pivoter au pied du tronc (et non au coin de l'image)
      im.setFrame(`${im.frame.name.split('-')[0]}-${LEANS.indexOf(0)}`);
      im.setOrigin((o.art.ax + LEAN_PAD + 0.5) / im.width, 1).setPosition(o.x + 0.5, o.y + 1);
      const angle = dir > 0 ? 90 : -90;
      if (now) { im.setAngle(angle); return; }
      this.tweens.add({
        targets: im, angle, duration: 900, ease: 'Quad.easeIn',
        onComplete: () => {
          audio.play('snow');
          this.cameras.main.shake(90, 0.002);
          // La neige soulevée tout le long du tronc
          for (let k = 2; k < o.h; k += 3) this.snowfall.explode(2, o.x + dir * k, o.y - 1);
          this.dust.setConfig({ lifespan: { min: 300, max: 800 }, speed: { min: 6, max: 30 }, angle: { min: 200, max: 340 }, gravityY: 50, alpha: { start: 0.8, end: 0 }, emitting: false });
          for (let k = 2; k < o.h; k += 4) this.dust.explode(2, o.x + dir * k, o.y);
        },
      });
    }

    // Le rocher éclate : des morceaux restent au sol
    breakRock(o, dir) {
      o.broken = true;
      audio.play('clang'); audio.play('snow');
      this.cameras.main.shake(100, 0.003);
      const cx = o.x - o.art.ax + o.w / 2;
      this.dust.setConfig({ lifespan: { min: 300, max: 900 }, speed: { min: 15, max: 55 }, angle: { min: 190, max: 350 }, gravityY: 90, alpha: { start: 0.9, end: 0 }, emitting: false });
      this.dust.explode(22, cx, o.y - 3);
      this.embers.explode(6, cx, o.y - 3);
      if (o.img) { o.img.setVisible(false); o.img.hiddenForGood = true; }
      const pieces = this.rockPieces(o);
      for (const chunk of this.chunks.values()) if (chunk.images.includes(o.img)) { chunk.images.push(...pieces); break; }
      this.wreck(o, dir);
    }

    // Les éclats d'un rocher : quelques blocs, la neige sur le dessus
    rockPieces(o) {
      let a = o.seed >>> 0;
      const r = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
      const out = [], left = o.x - o.art.ax;
      const n = 4 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        const w = 2 + Math.floor(r() * 3), h = 1 + Math.floor(r() * 2);
        const key = `rockpiece-${w}-${h}`;
        if (!this.textures.exists(key)) this.art(key, Array.from({ length: h + 1 }, (_, y) => (y === 0 ? '.' + 'b'.repeat(w - 1) : 'k'.repeat(w))));
        const x = Math.round(left + r() * (o.w - w)), y = Math.round(o.y - r() * 4 + 1);
        out.push(this.add.image(x, y, key).setOrigin(0, 1).setDepth(y));
      }
      return out;
    }

    // Autour de la grande clairière, des pistes de loups : elles sortent de la
    // forêt noire, errent, se croisent, et vont toutes vers le milieu
    wolfTracks() {
      let a = 4242;
      const r = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
      const g = this.add.graphics().setDepth(DEPTH_MARKS).fillStyle(hex(palette.b), 0.7);
      const D = WOLF_DEN;
      for (let k = 0; k < 6; k++) {
        const a0 = r() * Math.PI * 2, a1 = a0 + (r() - 0.5) * 2.2;
        const p0 = { x: D.x + Math.cos(a0) * (D.r + 70 + r() * 60), y: D.y + Math.sin(a0) * (D.r + 50 + r() * 40) };
        const p1 = { x: D.x + Math.cos(a1) * D.r * 0.25 * r(), y: D.y + Math.sin(a1) * D.r * 0.2 * r() };
        const len = Math.hypot(p1.x - p0.x, p1.y - p0.y), n = Math.floor(len / 3);
        const wob = 6 + r() * 10, ph = r() * 6, nx = -(p1.y - p0.y) / len, ny = (p1.x - p0.x) / len;
        for (let i = 0; i < n; i++) {
          const t = i / n, w = Math.sin(t * 7 + ph) * wob * Math.sin(t * Math.PI);
          const side = i % 2 ? 1 : -1;
          const x = Math.round(p0.x + (p1.x - p0.x) * t + nx * (w + side * 0.8));
          const y = Math.round(p0.y + (p1.y - p0.y) * t + ny * (w + side * 0.8));
          if (r() < 0.12 || !isLand(x, y)) continue;         // effacée par le vent
          g.fillRect(x, y, 1, 1);
        }
      }
    }

    // Un arbre frappé tremble, et sa neige tombe
    shakeTree(o, dir) {
      for (const chunk of this.chunks.values()) {
        const s = chunk.swayers.find(w => w.x === o.x && w.y === o.y);
        if (s) { s.shake = this.time.now + 750; s.shakeDir = dir; break; }
      }
      for (let k = 0; k < 4; k++) {
        this.snowfall.explode(4, o.x + Math.round((Math.random() - 0.5) * 8), o.y - Math.round(o.h * (0.35 + Math.random() * 0.5)));
      }
    }

    // La lame sur la pierre : étincelles, et le coup s'arrête net
    strikeRock(x, y, dir, view) {
      audio.play('clang');
      this.cameras.main.shake(70, 0.003);
      const back = dir > 0 ? { min: 150, max: 250 } : { min: -70, max: 30 };
      this.sparks.setConfig({ lifespan: { min: 120, max: 380 }, speed: { min: 40, max: 110 }, gravityY: 180, angle: back, alpha: { start: 1, end: 0 }, emitting: false });
      this.sparks.explode(5, x, y - 1);
      this.embers.setConfig({ lifespan: { min: 80, max: 220 }, speed: { min: 30, max: 80 }, gravityY: 180, angle: back, alpha: { start: 1, end: 0 }, emitting: false });
      this.embers.explode(11, x, y - 1);
      // Le bras est arrêté, la lame rebondit : on reste figé un instant, un
      // pixel en arrière, puis on se remet en garde
      this.player.anims.stop();
      this.player.setFrame(`${view}-attack-2`);
      if (walkable(this.pos.x - dir, this.pos.y)) this.pos.x -= dir;
      this.time.delayedCall(170, () => {
        this.attacking = false;
        this.player.setFrame(`${this.facing}-idle`);
      });
    }

    impact() {
      const dir = this.flip ? -1 : 1;
      const view = this.swingView, off = IMPACT[view];
      const x = Math.round(this.pos.x) + off.x * dir, y = Math.round(this.pos.y) + off.y;
      // L'autre viking d'abord ; sinon, un arbre ou une pierre sous la lame ?
      if (!this.foe.hitAt(x, y, dir || 1, true) && !this.pack.hitAt(x, y, dir || 1, true) && !this.inside) {
        const struck = this.struckObject(x, y);
        if (struck?.kind === 'rock') {
          const o = struck.o;
          // Certains rochers sont fendus : au second coup, ils éclatent
          if (o.type === 'boulder' && o.seed % 3 === 0 && (o.hits = (o.hits || 0) + 1) >= 2) { this.breakRock(o, dir); return; }
          this.strikeRock(x, y, dir, view);
          return;
        }
        if (struck?.kind === 'tree') {
          const o = struck.o;
          // Certains arbres sont pourris : au second coup, ils s'effondrent
          if (o.type === 'tree' && o.seed % 4 === 0 && (o.hits = (o.hits || 0) + 1) >= 2) { this.fellTree(o, dir); return; }
          audio.play('wood');
          this.cameras.main.shake(60, 0.0015);
          this.shakeTree(struck.o, dir);
          this.mark(x - dir, y - 2, 1, 2, 30000);             // l'entaille dans l'écorce
          return;
        }
      }
      this.cameras.main.shake(80, 0.002);
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
      const hit = this.foe.hitAt(x, y, dir || 1);
      const wolf = !hit && !this.inside && this.pack.hitAt(x, y, dir || 1);
      audio.play(hit || wolf ? 'flesh' : 'snow');
      if (hit) {
        this.cameras.main.shake(110, 0.004);
        this.spurt(this.foe.pos.x, this.foe.pos.y - 5, dir || 1, this.foe.alive ? 18 : 30);
        if (!this.foe.alive) this.pool(this.foe.pos.x, this.foe.pos.y);
      }
      if (wolf) {
        audio.play('yelp');
        this.cameras.main.shake(90, 0.003);
        const down = wolf.state === 'dead';
        this.spurt(wolf.pos.x, wolf.pos.y - 3, dir || 1, down ? 22 : 12);
        if (down) { this.pool(wolf.pos.x, wolf.pos.y); this.persist(); }
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
      this.hurt(dir);
    }

    // Une blessure (lame ou crocs) : un point de vie de moins
    hurt(dir) {
      if (this.dead || this.invuln > 0) return;
      this.hp--;
      this.invuln = 0.8;
      this.bleed(this.pos.x, this.pos.y, 8);
      audio.play('flesh');
      this.spurt(this.pos.x, this.pos.y - 5, dir, this.hp > 0 ? 18 : 30);
      this.cameras.main.shake(130, 0.005);
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
          this.pack.reset();
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
      if (isPaused() || this.dead) { this.keys.clear(); this.pad = { x: 0, y: 0, run: false }; }
      this.invuln = Math.max(0, this.invuln - delta / 1000);
      // Hors du combat, les blessures se referment peu à peu
      if (this.hp < FOE_HP && !this.dead && !(this.foe.engaged && this.foe.alive) && !this.pack.engaged) {
        this.healClock = (this.healClock || 0) + delta / 1000;
        if (this.healClock > 25) { this.healClock = 0; this.hp++; }
      } else this.healClock = 0;
      this.updateBoat(delta / 1000, time);
      this.updateWaves(delta / 1000, time);
      this.updateZoom(delta / 1000);
      // Le vent qu'on entend suit celui qu'on voit ; à l'abri, il s'étouffe
      this.windSound = (this.windSound || 0) - delta;
      if (this.windSound <= 0) {
        this.windSound = 200;
        audio.wind(weather.wind, weather.gust, this.inside ? 1 : deepForest(this.pos.x, this.pos.y) * 0.7);
        audio.setMood(this.musicMood());
      }
      let mx = 0, my = 0;
      for (const code of this.keys) if (MOVE_CODES[code]) { mx += MOVE_CODES[code][0]; my += MOVE_CODES[code][1]; }
      mx += this.pad.x; my += this.pad.y;
      this.running = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.pad.run) && this.stamina > 0.02;
      this.moved = !!(mx || my) && !this.attacking && !this.dead;
      // La vie, pour l'interface (à un point, l'écran rougit)
      const life = this.dead ? 0 : this.hp;
      if (life !== this.lastLife) { this.lastLife = life; onHealth(life); }
      this.updateStamina(delta / 1000);

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
          if (this.inside === 'cave' && !this.kingBowed && this.nearKing()) this.bowKing();
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
      if (!this.inside) this.pack.update(delta / 1000, this);
      drawPips(this.playerPips, this.pos.x, this.pos.y, this.hp, ((this.foe.engaged && this.foe.alive) || this.pack.engaged) && !this.dead);
      if (!this.inside) {
        const corpses = this.pack.deadList.map(w => ({ x: w.x, y: w.y, small: true }));
        if (!this.foe.alive) corpses.push(this.foe.pos);
        this.fauna.update(delta / 1000, this.pos, this.running, weather.wind, corpses);
      }
      // Devant ou derrière la maison, selon le pied de ses murs
      const front = houseFrontY(this.pos.x);
      this.house.setDepth(front == null ? HOUSE.y : this.pos.y > front ? this.pos.y - 0.5 : this.pos.y + 0.5);
      this.updateChunks();
      // Ne dessiner que ce qui est à l'écran : dans la forêt noire, des milliers
      // d'arbres sont chargés autour de la vue
      this.cullClock = (this.cullClock || 0) - delta;
      if (this.cullClock <= 0) { this.cullClock = 120; this.cull(); }
      this.swayClock = (this.swayClock || 0) - delta;
      if (this.swayClock <= 0 && !this.inside) { this.swayClock = 45; this.swayTrees(time); }
      this.updateGrove(time);
      this.updateNight(delta / 1000, time);
      this.drawSky(delta / 1000);
    }

    // La musique suit le moment : le lieu, la nuit, le danger
    musicMood() {
      const f = this.foe, now = this.time.now;
      const dFoe = Math.hypot(f.pos.x - this.pos.x, f.pos.y - this.pos.y);
      const deep = this.inside ? 0 : deepForest(this.pos.x, this.pos.y);
      const night = this.daylight?.night || 0;
      // (le silence d'après ne vaut que pour un combat de cette partie-ci)
      if (f.alive) { this.foeSeenAlive = true; this.foeDownAt = null; } else if (this.foeSeenAlive && this.foeDownAt == null) this.foeDownAt = now;
      let energy;
      if (this.dead) energy = 0.05;                                         // on est tombé
      else if ((f.alive && f.engaged && dFoe < 140) || this.pack.engaged) energy = 1;   // le combat
      else if (f.alive && dFoe < 320) energy = 0.55 + 0.4 * (1 - dFoe / 320);   // il est là, on le sent
      else if (this.foeDownAt != null && now - this.foeDownAt < 25000) energy = 0.12;   // après : le silence
      else if (this.inside) energy = 0.15;
      else if (deep > 0.3) energy = 0.2 + 0.1 * (1 - deep);                 // la forêt noire : sourde
      else energy = 0.4 + (this.running ? 0.12 : 0) + (this.rowing ? -0.15 : 0);
      energy *= 1 - 0.25 * night;
      return { energy, dark: Math.min(1, deep + 0.4 * night), muffled: this.inside ? 1 : 0 };
    }

    // Les offrandes tournent au vent ; le guetteur s'efface quand on approche
    updateGrove(time) {
      if (Math.abs(this.pos.x - GROVE_TREE.x) > 400 || Math.abs(this.pos.y - GROVE_TREE.y) > 300) return;
      const t = time / 1000, force = Math.min(1, weather.wind / 140);
      const g = this.ropes;
      g.clear(); g.fillStyle(hex(palette.b), 1);
      for (const b of this.bundles) {
        const sway = Math.round(Math.sin(t * (1.1 + force) + b.phase) * (0.4 + 1.3 * force) + force);
        for (let k = 0; k < b.len; k++) g.fillRect(b.h.x + Math.round(sway * k / b.len), b.h.y + k, 1, 1);
        b.img.setPosition(b.h.x + sway + 0.5, b.h.y + b.len);
      }
      const w = this.watcher;
      if (!w || w.fading) return;
      if (Math.hypot(this.pos.x - WATCHER_AT.x, this.pos.y - WATCHER_AT.y) < 64 && !this.inside) {
        w.fading = true;
        audio.play('presence');
        audio.hush(6);                                     // la musique retient son souffle
        // Il vacille, revient, et n'est plus là
        const steps = [0.2, 1, 0.1, 0.7, 0.05, 0.3, 0];
        steps.forEach((a, i) => this.time.delayedCall(90 + i * 170 + Math.random() * 60, () => w.setAlpha(a)));
        this.time.delayedCall(1400, () => { w.destroy(); this.watcher = null; this.watcherGone = true; this.persist(); });
      }
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
      // Dans la grotte, il fait toujours nuit (la torche est allumée)
      const dark = INTERIORS[this.inside]?.dark, night = dark ? 1 : this.daylight?.night || 0, t = time / 1000;
      const want = night > 0.4 && !this.dead ? 1 : 0;
      this.torchOn += (want - this.torchOn) * Math.min(1, dt * 1.5);
      if (Math.abs(this.torchOn - want) < 0.01) this.torchOn = want;
      const lit = this.torchOn * night;
      const flick = 1 + 0.07 * Math.sin(t * 11) * Math.sin(t * 5.3 + 1) + 0.03 * Math.sin(t * 23);
      const tp = this.torchPoint();
      // Le voile de nuit, percé autour de la torche
      const v = this.cameras.main.worldView, rt = this.shade;
      const veil = night * (dark ? 0.72 : 0.62);
      // En plein jour, le voile est vide : on ne le touche pas (il coûte cher)
      rt.setVisible(veil > 0.005);
      if (veil > 0.005) {
        // Le voile couvre la vue, à peine plus : le remplir coûte cher
        const w = Math.ceil(v.width) + 64, h = Math.ceil(v.height) + 64;
        if (Math.abs(rt.width - w) > 16 || Math.abs(rt.height - h) > 16 || rt.width < w || rt.height < h) rt.resize(w + 32, h + 32);
        rt.setPosition(Math.floor(v.x) - 32, Math.floor(v.y) - 32);
        rt.clear();
        rt.fill(hex(palette.b), veil);
        if (lit > 0.01) {
          const size = flick > 1.04 ? 2 : flick < 0.96 ? 0 : 1;
          this.lightStamp.setTexture(`torchlight${size}`).setPosition(Math.round(tp.x - rt.x), Math.round(tp.y + 4 - rt.y)).setAlpha(Math.min(1, this.torchOn * 1.1));
          rt.erase(this.lightStamp);
          // Là où un obstacle arrête la lumière, la nuit revient : jamais plus
          // sombre qu'hors du halo
          this.shadows.setAlpha(veil);
          rt.draw(this.shadows, -rt.x, -rt.y);
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
      // Les ombres, portées à l'opposé de la flamme : des pixels tramés, plus
      // denses au pied de l'obstacle, qui s'effilochent au bout
      this.shadowClock -= dt;
      if (this.shadowClock > 0) return;
      this.shadowClock = 0.06;
      const sg = this.shadows;
      sg.clear();
      if (lit < 0.05) return;
      sg.fillStyle(hex(palette.b), 1);
      const lx = tp.x, ly = this.pos.y + 1, R = 90;
      // Les pixels d'ombre, par paliers (comme le halo de la torche)
      let alpha = -1;
      const put = (px, py, a) => { if (a !== alpha) { alpha = a; sg.fillStyle(hex(palette.b), a); } sg.fillRect(px, py, 1, 1); };
      const cast = (x, y, half, len) => castShadow(put, x, y, lx, ly, half, len, R);
      // Sa propre ombre : courte, du côté opposé à la torche
      if (!this.rowing) cast(this.pos.x, this.pos.y + 0.5, 1.5, 5);
      if (this.inside) return;
      if (this.foe.alive && Math.hypot(this.foe.pos.x - lx, this.foe.pos.y - ly) < R) cast(this.foe.pos.x, this.foe.pos.y, 1.5, 8);
      const cx = Math.floor(this.pos.x / CHUNK), cy = Math.floor(this.pos.y / CHUNK);
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        for (const o of objectsInChunk(cx + i, cy + j)) {
          if (o.type === 'iceberg' || o.type === 'cliff' || o.type === 'rubble' || o.fallen || o.broken) continue;
          if (Math.abs(o.x - lx) > R || Math.abs(o.y - ly) > R) continue;
          const d = Math.max(4, Math.hypot(o.x - lx, o.y - ly));
          if (o.type === 'tree') cast(o.x, o.y, 1.2, Math.max(5, Math.min(40, (o.h || 10) * 18 / d)));
          else {
            // Rochers, cairns, statues : une ombre courte et discrète, à leur pied
            const w = o.w || 6, mid = o.x + w / 2 - (o.art?.ax || 0);
            cast(mid, o.y, Math.min(4, w * 0.22), Math.max(3, Math.min(10, (o.h || 8) * 6 / d)));
          }
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
        if (key === 'cave') this.throne.setVisible(true);
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
        this.throne.setVisible(false);
        this.facing = 'front'; this.flip = false;
      });
    }

    // ── La grotte : le roi mort ──
    nearKing() {
      const C = INTERIORS.cave.at;
      return nearThrone(this.pos.x - C.x, this.pos.y - C.y);
    }

    // On s'approche : un souffle, la musique se tait, sa tête tombe et la
    // couronne roule à ses pieds
    bowKing() {
      this.kingBowed = true;
      audio.play('presence');
      audio.hush(9);
      this.time.delayedCall(1300, () => {
        this.throne.setTexture('throne-bowed');
        audio.play('clang');
        this.cameras.main.shake(60, 0.0015);
        this.persist();
      });
    }

    // ── La crypte : le coffre ──
    nearChest() {
      const C = INTERIORS.crypt.at;
      return nearChest(this.pos.x - C.x, this.pos.y - C.y);
    }

    openChest() {
      if (this.chestOpen) return;
      audio.play('creak');
      this.chestOpen = true;
      this.facing = 'back'; this.player.setFrame('back-idle');
      this.chest.setTexture('chest-ajar');
      this.time.delayedCall(380, () => {
        this.chest.setTexture('chest-open');
        this.cameras.main.shake(80, 0.002);
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

    cull() {
      const v = this.cameras.main.worldView, m = 24;
      const x0 = v.x - m, x1 = v.right + m, y0 = v.y - m, y1 = v.bottom + m;
      for (const chunk of this.chunks.values()) {
        for (const img of chunk.images) {
          const top = img.originY ? img.y - img.height : img.y;
          if (img.hiddenForGood) continue;
          const w = img.displayWidth, h = img.displayHeight;
          img.setVisible(img.x - w < x1 && img.x + w > x0 && top - h < y1 && top + img.height > y0);
        }
      }
    }

    // Charge les morceaux de sol visibles (et leurs arbres), oublie ceux qui
    // sont loin. Un morceau se prépare en plusieurs temps (sol, objets, planche,
    // images), sur quelques images d'affilée et avec un budget de temps : pas
    // d'à-coup en entrant dans la forêt noire. On prépare en avance, au-delà
    // du bord de la vue ; `force` (arrivée, téléportation) charge tout d'un coup.
    updateChunks(force) {
      const v = this.cameras.main.worldView;
      const range = m => [
        Math.max(0, Math.floor((v.x - m) / CHUNK)), Math.min(WORLD / CHUNK - 1, Math.floor((v.right + m) / CHUNK)),
        Math.max(0, Math.floor((v.y - m) / CHUNK)), Math.min(WORLD / CHUNK - 1, Math.floor((v.bottom + m) / CHUNK)),
      ];
      const [c0, c1, r0, r1] = range(CHUNK * 0.75);
      const key0 = `${c0},${c1},${r0},${r1}`;
      this.jobs = this.jobs || new Map();
      if (force || this.lastRange !== key0) {
        this.lastRange = key0;
        const wanted = new Set();
        for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
          const key = `${cx},${cy}`;
          wanted.add(key);
          if (!this.chunks.has(key) && !this.jobs.has(key)) this.jobs.set(key, { cx, cy, it: this.loadChunk(cx, cy, key) });
        }
        // On oublie ce qui est loin (et les préparations devenues inutiles)
        const [k0, k1, q0, q1] = range(CHUNK * 1.5);
        for (const [key, job] of this.jobs) if (!wanted.has(key)) job.it.return?.(), this.jobs.delete(key);
        for (const [key, chunk] of this.chunks) {
          const [cx, cy] = key.split(',').map(Number);
          if (cx >= k0 && cx <= k1 && cy >= q0 && cy <= q1) continue;
          chunk.images.forEach(i => i.destroy());
          chunk.textures.forEach(t => this.dropTexture(t));
          this.chunks.delete(key);
        }
      }
      if (!this.jobs.size) return;
      // Les plus proches du centre de la vue d'abord ; budget de 5 ms par image
      const mx = (v.x + v.right) / 2 / CHUNK - 0.5, my = (v.y + v.bottom) / 2 / CHUNK - 0.5;
      const queue = [...this.jobs.entries()].sort((a, b) => Math.hypot(a[1].cx - mx, a[1].cy - my) - Math.hypot(b[1].cx - mx, b[1].cy - my));
      const t0 = performance.now();
      for (const [key, job] of queue) {
        while (force || performance.now() - t0 < 5) {
          const step = job.it.next();
          if (step.done) { this.chunks.set(key, step.value); this.jobs.delete(key); break; }
        }
        if (!force && performance.now() - t0 >= 5) break;
      }
    }

    // Un morceau, en plusieurs temps (générateur : chaque `yield` rend la main)
    // Abandonnée en route (on s'est éloigné vite), la préparation défait ce
    // qu'elle a déjà posé : une image restée sans sa texture fait planter le
    // rendu, et le jeu se fige (écran noir, flocons immobiles)
    *loadChunk(cx, cy, key) {
      const made = { images: [], textures: [] };
      let done = false;
      try {
        const out = yield* this.buildChunk(cx, cy, key, made);
        done = true;
        return out;
      } finally {
        if (!done) {
          made.images.forEach(i => i.destroy());
          made.textures.forEach(t => this.dropTexture(t));
        }
      }
    }

    // Retire une texture, et d'abord toute image qui s'en sert encore
    dropTexture(key) {
      if (!this.textures.exists(key)) return;
      for (const o of [...this.children.list]) if (o.texture?.key === key) o.destroy();
      this.textures.remove(key);
    }

    *buildChunk(cx, cy, key, made) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = CHUNK;
      yield* paintChunkSteps(canvas.getContext('2d'), cx, cy, palette);
      const groundKey = `chunk-${key}`;
      // (une préparation abandonnée a pu laisser ses textures)
      for (const k of [groundKey, `objects-${key}`]) this.dropTexture(k);
      this.textures.addCanvas(groundKey, canvas);
      const images = made.images, textures = made.textures;
      textures.push(groundKey);
      images.push(this.add.image(cx * CHUNK, cy * CHUNK, groundKey).setOrigin(0, 0).setDepth(DEPTH_GROUND));

      // Tous les objets du morceau dans une seule planche : un seul envoi à la
      // carte graphique. Les arbres y ont quatre images (penchés de −1 à +2
      // pixels à la cime) : le vent les fait passer de l'une à l'autre.
      const objs = objectsInChunk(cx, cy);
      yield;
      const swayers = [];
      if (objs.length) {
        const ATLAS_W = 1024;
        const pieces = [];
        for (let i = 0; i < objs.length; i++) {
          const o = objs[i];
          const variants = o.type === 'tree' ? LEANS.map(l => leanRows(o.art.rows, l)) : [o.art.rows];
          variants.forEach((rows, v) => pieces.push({ i, v, rows, w: rows[0].length, h: rows.length }));
          if (i % 60 === 59) yield;
        }
        let x = 0, y = 0, rowH = 0;
        for (const p of pieces) {
          if (x + p.w > ATLAS_W) { x = 0; y += rowH + 1; rowH = 0; }
          p.x = x; p.y = y;
          x += p.w + 1; rowH = Math.max(rowH, p.h);
        }
        // Les pixels écrits d'un bloc (un appel de dessin par pixel coûtait cher)
        const atlas = document.createElement('canvas');
        atlas.width = ATLAS_W; atlas.height = y + rowH + 1;
        const ctx = atlas.getContext('2d');
        const img = ctx.createImageData(atlas.width, atlas.height), d = img.data;
        for (let n = 0; n < pieces.length; n++) {
          const p = pieces[n];
          for (let ry = 0; ry < p.h; ry++) {
            const row = p.rows[ry];
            for (let rx = 0; rx < p.w; rx++) {
              const c = RGB[row[rx]];
              if (!c) continue;
              const k = ((p.y + ry) * ATLAS_W + p.x + rx) * 4;
              d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
            }
          }
          if (n % 400 === 399) yield;
        }
        ctx.putImageData(img, 0, 0);
        yield;
        const objKey = `objects-${key}`;
        const tex = this.textures.addCanvas(objKey, atlas);
        textures.push(objKey);
        for (const p of pieces) tex.add(`${p.i}-${p.v}`, 0, p.x, p.y, p.w, p.h);
        for (let i = 0; i < objs.length; i++) {
          const o = objs[i];
          const tree = o.type === 'tree';
          const rest = tree ? LEANS.indexOf(0) : 0;
          const im = this.add.image(o.x - o.art.ax - (tree ? LEAN_PAD : 0), o.y + 1, objKey, `${i}-${rest}`)
            .setOrigin(0, 1).setDepth(o.y);
          images.push(im);
          o.img = im;
          // Abattu ou brisé lors d'une partie précédente : on le montre tel quel
          const k = `${o.x},${o.y}`;
          if (this.wrecked.has(k)) {
            const w = this.wrecked.get(k);
            if (tree) { o.fallen = true; this.layTree(o, w, true); continue; }
            o.broken = true; im.setVisible(false); im.hiddenForGood = true;
            for (const f of this.rockPieces(o)) images.push(f);
            continue;
          }
          if (tree) {
            // Chaque arbre a sa cadence : les grands ploient plus lentement
            swayers.push({ img: im, i, x: o.x, y: o.y, phase: (o.seed % 628) / 100, freq: treeFreq(o.h) });
          }
          if (i % 80 === 79) yield;
        }
      }
      this.cullClock = 0;
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
          let lean = treeLean(t, s, base, amp);
          // Frappé : il tremble d'un bord à l'autre, de moins en moins
          if (s.shake > this.time.now) {
            const k = (s.shake - this.time.now) / 750;
            lean = Math.max(-1, Math.min(2, Math.round(Math.sin((1 - k) * 34) * 2.2 * k * (s.shakeDir || 1) + 0.5 * k)));
          }
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
        watcherGone: this.watcherGone,
        kingBowed: this.kingBowed,
        wrecked: Object.fromEntries(this.wrecked),
        facing: this.facing, flip: this.flip,
        steps: this.stepCount, distance: Math.round(this.distance),
        foeDead: this.foe ? !this.foe.alive : false,
        wolvesDead: this.pack ? this.pack.deadList : [],
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
    scale: { mode: Phaser.Scale.NONE, zoom: 1 / fit.dpr },
    scene: Island,
    banner: false,
    input: { mouse: { preventDefaultWheel: false } },
    disableContextMenu: true,
  });
  // Filet de sécurité : une erreur dans une image ne doit pas arrêter la
  // boucle du jeu (sinon tout se fige). On la note (kingvi:lastError) et
  // l'image suivante repart.
  game.events.once('ready', () => {
    const step = game.loop.callback;
    let reported = 0;
    game.loop.callback = (time, delta) => {
      try { step(time, delta); } catch (e) {
        if (reported++ < 3) {
          console.error(e);
          try { localStorage.setItem('kingvi:lastError', JSON.stringify({ at: new Date().toISOString(), message: String(e?.message || e), stack: String(e?.stack || '').slice(0, 1500) })); } catch { /* rien */ }
        }
      }
    };
  });

  function sizeSky(f) {
    sky.width = f.width; sky.height = f.height;
    sky.style.width = `${f.width / f.dpr}px`;
    sky.style.height = `${f.height / f.dpr}px`;
  }
  sizeSky(fit);
  parent.append(sky);

  function resize() {
    const r = parent.getBoundingClientRect();
    const f = fitScreen(r.width, r.height);
    game.scale.setZoom(1 / f.dpr);
    game.scale.resize(f.width, f.height);
    sizeSky(f);
    const scene = game.scene.getScene('island');
    if (scene?.zoom) { scene.zoom.base = f.zoom; scene.zoom.dpr = f.dpr; }
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
    // La croix directionnelle : une direction (−1, 0, 1 sur chaque axe), courir ou non
    setPad(x, y, run) { const sc = game.scene.getScene('island'); if (sc?.pad) sc.pad = { x, y, run }; },
  };
}

// Touches physiques : ZQSD sur un clavier AZERTY, WASD en QWERTY, et les flèches.
const MOVE_CODES = {
  KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0],
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
};
