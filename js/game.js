/* La scène Phaser : sol par morceaux, arbres et rochers, viking et sa cape,
   empreintes, maison. Le vent et la neige sont dessinés sur un calque à part
   (canvas 2D au-dessus du jeu), avec la même simulation que le labo. */
import { HINTS } from './story.js?v=1.63.3';
import { T as TUNE } from './tuning.js?v=1.63.3';
import {
  paintSheet, paintFrames, capeFrames, smearPixels, whirlArc, blastRing, IMPACT, ATTACK_VIEWS,
  FRAME_W, FRAME_H, CX, GROUND, ORIGIN_X, ORIGIN_Y, CAPE_W, CAPE_H, CAPE_PHASES,
} from './viking.js?v=1.63.3';
import {
  WORLD, WORLD_VERSION, ISLAND, CHUNK, isLand, landing, objectsInChunk, blocked,
  HOUSE, HOUSE_ART, HOUSE_DOOR_OUT, houseBlocked, houseFrontY, coast, trail,
  LAKE, inLake, STATUE3_DOOR_OUT, deepForest, GROVE_TREE, GROVE_HOOKS, WATCHER_AT, WOLF_DEN, DEN_OPEN, CAVE_DOOR_OUT, NECRO, CLIFF, forestDensity,
  deckLift, PIER_MOOR, LEDGE, ledgeAt, MOTH_LAIR, cliffFoot, cliffHeight, FALLING_STONE, ARCH, STATUE_BASE, snowDepth,
  GLADE, HVIT_AT, TEMPLE_DOOR_OUT, SIGRUN_AT, SNO7_CUBES, cubeBlocked, MONS_AT, monsBlocked,
  PASSAGE_AT, STATUE2_BASE, STATUE3_BASE, RUINS, PIER,
} from './world.js?v=1.63.3';
import { ICE_FRAMES } from './sigrun.js?v=1.63.3';
import { CUBE_WHITE, CUBE_BLACK } from './cubes.js?v=1.63.3';
import { createPack, makeWhiteWolf } from './pack.js?v=1.63.3';
import { TEMPLE, TEMPLE_W, TEMPLE_H, TEMPLE_ENTRY, NAIL, NAIL_ART, TEMPLE_SLAB, TEMPLE_STAIRS, templeWalkable, atTempleDoor, nearNail } from './temple.js?v=1.63.3';
import { createGround } from './ground.js?v=1.63.3';
import { designRows, designFrames, padOf, animOf, propsOf, placements, refreshLocal, customDefs, customNames, EXTRAS_KEY as EXTRAS_STORAGE_KEY, LOCAL_KEY as DESIGNS_STORAGE_KEY } from './design-store.js?v=1.63.3';

// Les objets posés dans l'atelier (onglet Carte) : leur pied bloque s'il le faut
// (`props.box` : la zone tracée sur le dessin dans l'atelier, en pixels du dessin)
const PLACED = [];
const placedBlocked = (x, y) => PLACED.some(p => {
  const b = p.props.box;
  if (!b) return false;
  const px = Math.floor(x) - p.x0, py = Math.floor(y) - p.top;
  return px >= b.x0 && px <= b.x1 && py >= b.y0 && py <= b.y1;
});
// Les dessins agrandis dans l'atelier (des marges autour) : une image qui s'en
// sert garde le même point d'ancrage dans le monde (l'origine demandée par le
// code, sur le dessin d'origine, est reportée sur le dessin agrandi)
const GROWN = new Map();
{
  const base = window.Phaser.GameObjects.Image.prototype.setOrigin;
  window.Phaser.GameObjects.Image.prototype.setOrigin = function (x = 0.5, y = x) {
    const g = this.texture && GROWN.get(this.texture.key);
    if (g) { x = (x * g.w + g.l) / (g.w + g.l + g.r); y = (y * g.h + g.t) / (g.h + g.t + g.b); }
    return base.call(this, x, y);
  };
}
import { chapterById } from './chapters.js?v=1.63.3';
import { CAVE_ROOM, CAVE_W, CAVE_H, CAVE_ENTRY, THRONE, THRONE_FRAMES, THRONE_FOOT, caveWalkable, atCaveDoor, nearThrone } from './cave.js?v=1.63.3';
import { BUNDLE, WATCHER } from './grove.js?v=1.63.3';
import { BOAT_FRAMES, rollBoat, BOAT_W, BOAT_H, BOAT_WATERLINE, BOAT_BOW, BOAT_EDGE, ROWBOAT_FRAMES, BOAT2, BOAT2_KEEL } from './boat.js?v=1.63.3';
import { CRYPT, CRYPT_W, CRYPT_H, CRYPT_ENTRY, CHEST, CHEST_FRAMES, cryptWalkable, atCryptDoor, nearChest } from './crypt.js?v=1.63.3';
import { daylightAt, torchLight, castShadow, castShadowBase, artBase } from './daylight.js?v=1.63.3';
import { ROOM, ROOM_W, ROOM_H, ROOM_ENTRY, roomWalkable, atRoomDoor, CORPSE, floorPoint } from './interior.js?v=1.63.3';
import { RELICS, RELIC_GROUND_SIZE, BELT_SLOTS, relicDesign, relicGround, relicById } from './relics.js?v=1.63.3';
import { FIRE, FIRE_FRAMES, FIRE_W, FIRE_H, HOUSE_BURNING, HOUSE_RUIN, burnHouse, ROOF_FLAMES, RUIN_FLAMES, ROOM_FLAMES, PYRE, nearPyre } from './fire.js?v=1.63.3';
import { createMoth, MOTH_FRAMES, mothKey } from './moth.js?v=1.63.3';
import { createFoe, drawPips } from './foe.js?v=1.63.3';
import { createFauna } from './fauna.js?v=1.63.3';
import { createWeather } from './weather.js?v=1.63.3';
import { createTalk } from './dialogue.js?v=1.63.3';
import { SNO4_W, SNO4_H, SNO4_AT, SNO4_BOAT, SNO4_ENTRY, SNO4_PROPS, SNO4_CUBES, SNO4_SOULS, CLOTILDE_PATH, paintSno4, sno4Walkable, nearSno4Boat, VEVE, VEVE_NODE, VEVE_TIME } from './sno4.js?v=1.63.3';
import { NECRO_W, NECRO_H } from './props.js?v=1.63.3';
import { SCENARIOS, PERSON, speakerName } from './saga.js?v=1.63.3';
import { describe } from './describe.js?v=1.63.3';
import { personSprite } from './people.js?v=1.63.3';
import { createSea } from './sea.js?v=1.63.3';
import { audio } from './audio.js?v=1.63.3';
import { LEANS, LEAN_PAD, leanRows, treeWind, treeLean, treeFreq, boulderHits, chipBoulder } from './trees.js?v=1.63.3';

const Phaser = window.Phaser;
// La trame 4 × 4 (fumée de l'incendie), accrochée au monde
const DITHER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// (la vitesse de marche, la course : TUNE.kariVitesse, TUNE.kariCourse, tuning.js)
const WALK_FPS = 7;
const OWN_PRINT_LIFE = 40000;  // la neige recouvre nos pas en 40 s
// La neige profonde (snowDepth : 0 tassée, 1 aux mollets, 2 jusqu'à la taille) :
// la vitesse, et de combien de pixels le viking s'enfonce
const SNOW_SPEED = [1, 0.9, 0.8];
const SNOW_SINK = [0, 1, 3];
// Un hasard fixe, accroché au monde (la collerette et le sillon de la neige profonde)
const noise = (x, y, s) => {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const TARGET_HEIGHT = 280;     // hauteur visée de l'écran, en pixels du jeu (près du viking)

// Profondeurs : le sol et ce qui y est tracé sont sous tout ; les objets
// debout (arbres, rochers, maison, viking) sont triés par la ligne de leurs pieds.
const DEPTH_GROUND = -1000, DEPTH_WAVES = -600, DEPTH_MARKS = -500, DEPTH_BOAT = -400, DEPTH_SKY = 1e6;
// La pièce (et le viking qui y entre) passe au-dessus de tout le dehors
const DEPTH_ROOM = 5e5;
// L'endurance (0 → 1) : ce que coûtent un coup, une seconde de course ; ce
// que rend une seconde de repos ; le temps avant qu'elle revienne ; à bout
// de souffle, ce qu'il faut retrouver avant de pouvoir courir de nouveau
const STAMINA = { attack: 0.12, whirl: 0.3, run: 0.09, regen: 0.45, rest: 0.5, second: 0.35 };
// L'endurance est retirée pour le moment : courir et frapper ne coûtent rien,
// la barre ne s'affiche plus (le code reste, prêt à revenir)
const STAMINA_ON = false;
// La sente de la falaise : on y monte moins vite ; les pierres qui tombent
// (une toutes les `every` secondes environ, annoncée par un filet de neige)
const CLIMB = { speed: 0.55, every: [3.5, 7], warn: 1.1 };
// La logique avance par pas fixes ; au-delà d'une demi-seconde d'un coup
// (onglet revenu, gel), le temps est perdu plutôt que rattrapé
const STEP = 1 / 60, MAX_FRAME = 0.5;
// Le cercle de vue, en hauteurs d'écran : ses rayons, et où le noir commence
// à monter (fraction du rayon) ; au-delà, tout est noir
const LOOK_UP = 62;     // de combien la vue monte devant le roi (pixels du jeu)
// (v1.53.0 : plus grand, et presque une ellipse : le décor ne l'échancre plus
// qu'un peu, une lente respiration la garde organique)
const SIGHT = { rx: 0.86, ry: 0.70, fade: 0.74 };
// La carte qui se construit : l'île en cases de SEEN_CELL pixels ; on voit
// à SEEN_R pixels autour de soi. Gardé en bits, en base64, dans la sauvegarde.
const SEEN_CELL = 48, SEEN_N = Math.ceil(WORLD / SEEN_CELL), SEEN_R = 110;
// (SNO 4 a sa propre carte : des cases de 24 px sur sa scène)
const SEEN4_CELL = 24, SEEN4_COLS = Math.ceil(SNO4_W / SEEN4_CELL), SEEN4_ROWS = Math.ceil(SNO4_H / SEEN4_CELL);
function decodeSeen(text, len = SEEN_N * SEEN_N) {
  const out = new Uint8Array(len);
  if (typeof text !== 'string') return out;
  try {
    const bin = atob(text);
    for (let i = 0; i < out.length; i++) out[i] = (bin.charCodeAt(i >> 3) >> (i & 7)) & 1;
  } catch { /* rien : une carte vierge */ }
  return out;
}
function encodeSeen(seen) {
  const bytes = new Uint8Array(Math.ceil(seen.length / 8));
  for (let i = 0; i < seen.length; i++) if (seen[i]) bytes[i >> 3] |= 1 << (i & 7);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

// L'éclair est blanc pur (Jérôme, v1.51.0) : la seule couleur hors des trois
const WHITE = '#ffffff';

// Le megamoth est retiré (Jérôme, v1.47.0) : son code reste, endormi
const MOTH_ENABLED = false;
const NO_MOTH = {
  engaged: false, alive: false, state: 'absent', hp: 0, alt: 0, pos: { x: 0, y: 0 },
  hitAt: () => false, update() {}, render() {}, setVisible() {}, reset() {},
};
// Le flou garde l'échelle d'avant l'élargissement de la vue (le noir est plus loin)
const BLUR_SCALE = { rx: 0.56, ry: 0.46 };
// La caméra est fixée sur le viking : elle avance du même pixel que lui, au
// même instant. Elle le rattrapait en douceur, mais à son propre rythme : le
// viking et toutes les trames du monde tremblaient d'un pixel à l'écran
const FOLLOW = 1;
// Le coup tourbillonnant : le bouton maintenu tant de secondes
// (le temps de tenir le bouton : TUNE.tourbillon, tuning.js)
// Le tour : les huit directions, une image de lame chacune (vue, retourné)
const WHIRL_TURN = [['side', false], ['diagdown', false], ['front', false], ['diagdown', true], ['side', true], ['diagup', true], ['back', false], ['diagup', false]];

// Vraie basse définition : le jeu se dessine dans un canevas d'un pixel par
// pixel du jeu (environ 280 de haut), que le navigateur agrandit sans lissage
// d'un facteur entier de pixels physiques (densité comprise : 125 %, Retina…).
// Pixels nets, lignes du CRT posées sur les pixels, et le moins de pixels
// possible à peindre. Pas de zoom de caméra, ni en combat ni dedans : le
// facteur ne change qu'avec la taille de l'écran.
// La qualité (Réglages, 1 → 3) ne choisit que les effets : 1 sans CRT
// ni flou, moitié moins de flocons ; 2 le CRT ; 3 le CRT et le flou.
export const QUALITY = { min: 1, max: 3, initial: 3 };
export function fitScreen(w, h) {
  const dpr = window.devicePixelRatio || 1;
  const factor = Math.max(1, Math.round(h * dpr / TARGET_HEIGHT));
  return { factor, dpr, ...canvasSize(w, h, factor, dpr) };
}
// La taille du canevas pour couvrir l'écran à ce facteur
const canvasSize = (w, h, factor, dpr) => ({ width: Math.max(1, Math.ceil(w * dpr / factor)), height: Math.max(1, Math.ceil(h * dpr / factor)) });

// Emprise de la maison (on ne la traverse pas)
// (vue de trois quarts : le toit représente la profondeur de la maison)
// Emprise de la barque échouée (posée dans create)
const boatRects = [];
const inBoat = (x, y) => boatRects.some(b => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1);
// (sur le ponton, on marche au-dessus de l'eau)
const walkable = (x, y) => (isLand(x, y) || deckLift(x, y) > 0) && !houseBlocked(x, y) && !blocked(x, y) && !inBoat(x, y) && !cubeBlocked(x, y) && !monsBlocked(x, y) && !placedBlocked(x, y);

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
  // Le temple de Sorne, sous l'arche (temple.js) : fermé par une dalle tant
  // que Tavé n'a pas le sceau d'Aule (`templeOpen`) ; toujours la nuit
  temple: {
    at: { x: 150, y: 150 }, key: 'temple', w: TEMPLE_W, h: TEMPLE_H, entry: TEMPLE_ENTRY,
    walk: templeWalkable, atDoor: atTempleDoor, door: TEMPLE_DOOR_OUT, radius: 5, dark: true,
    exit: { x: TEMPLE_DOOR_OUT.x, y: TEMPLE_DOOR_OUT.y + 9 }, enterFacing: 'back',
  },
  // SNO 4, l'île Carrefour (sno4.js) : on y vient en barque depuis la grève,
  // pas par une porte (`voyage`) ; en plein air : la neige, le vent, la nuit
  sno4: {
    at: { x: 80, y: 5400 }, key: 'sno4', w: SNO4_W, h: SNO4_H, entry: SNO4_ENTRY,
    walk: sno4Walkable, atDoor: () => false, door: { x: -9999, y: -9999 }, radius: 0, outdoor: true, byBoat: true,
    exit: { x: 0, y: 0 }, enterFacing: 'side',
  },
};
// Sous un toit (la maison, la crypte, la grotte) : ni neige, ni vent, ni cape
const roofed = key => !!key && !INTERIORS[key].outdoor;
// La barque du lac flotte là où l'eau est assez profonde pour sa coque
const afloat = (x, y) => inLake(x, y) && coast(x, y) > 0.0035 && inLake(x - 7, y) && inLake(x + 7, y) && !deckLift(x, y);

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

export function createGame({ onEnding = () => {}, onAction = () => {}, onVoyage = (to, done) => done(), parent, palette, save, onSave, isPaused, quality = QUALITY.initial, wind = 'cycle', dayClock = () => Date.now() / 1000, onHealth = () => {}, onChapter = () => {}, onDeath = respawn => respawn(), isTitle = () => false, onTally = () => {}, onRelic = () => {}, zoom = 0, onZoom = () => {}, onDescribe = () => {} }) {
  const hex = c => parseInt(c.slice(1), 16);
  const rect = parent.getBoundingClientRect();
  const fit = fitScreen(rect.width, rect.height);
  if (save.world !== WORLD_VERSION || (save.island || 0) !== ISLAND) save = { steps: save.steps };

  const weather = createWeather(wind);
  // Le tonnerre suit l'éclair, d'autant plus tard qu'il est loin
  weather.onStrike = near => {
    setTimeout(() => audio.play('thunder', { near }), (1 - near) * 2600 + 120);
    if (near > 0.8) setTimeout(() => game?.scene?.getScene('island')?.jolt?.(0.0015), 150);
  };
  // Le sol en tuiles peintes une fois ; les pas et le sang s'y écrivent
  const ground = createGround(palette);
  // La forme du cercle de vue : sa portée dans chaque direction, de 0,4 à 1
  // fois l'ellipse de base (la scène la calcule, `updateSight` ; le calque
  // `#sight` la dessine, `paintSight`). `rx`, `ry` : l'ellipse de base, en
  // pixels du jeu (posés au dessin).
  const SIGHT_N = 72;
  const sightShape = { f: new Float32Array(SIGHT_N).fill(1), drawn: new Float32Array(SIGHT_N).fill(-1), rx: 0, ry: 0, clock: 0 };
  // En qualité légère, moitié moins de flocons
  weather.density = quality <= 1 ? 0.5 : 1;
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
      this.boat2At = { x: b2.x + BOAT2[0].length / 2, y: b2.y + BOAT2.length - 6 };
      boatRects.push({ x0: b2.x + 4, x1: b2.x + BOAT2[0].length - 6, y0: b2.y + BOAT2.length - 12, y1: b2.y + BOAT2.length - 2 });
      // (peint dans la neige des tuiles, comme les pas)
      const kx = b2.x + BOAT2_KEEL.x + 2, ky = b2.y + BOAT2_KEEL.y;
      for (let x = sx - 4; x < kx; x++) {
        const y = Math.round(ky + (x - kx) * 0.12);
        // Deux lèvres de neige repoussée, le creux entre elles
        ground.decal(x, y - 1, 1, 1, 'b', 0.55);
        if ((x * 7) % 5) ground.decal(x, y + 1, 1, 1, 'b', 0.35);
        // Les pas de ceux qui la halaient, de part et d'autre
        if (x % 5 === 0) ground.decal(x, y + (x % 10 ? 4 : -4), 1, 1, 'b', 0.7);
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
      // ── L'incendie : `save.fire`, les secondes de feu depuis qu'il a pris (null : jamais) ──
      this.fire = typeof save.fire === 'number' ? save.fire : null;
      const HL = HOUSE.x - HOUSE_ART[0].length / 2, HT = HOUSE.y + 1 - HOUSE_ART.length;
      const flame = f => this.add.image(HL + f.x + 0.5, HT + f.y + 1, 'feu-0').setOrigin(0.5, 1).setVisible(false);
      this.roofFlames = ROOF_FLAMES.map(flame);
      this.ruinFlames = RUIN_FLAMES.map(flame);
      this.smokePuffs = [];
      this.smokeG = this.add.graphics().setDepth(DEPTH_SKY - 3);
      this.fireSparks = this.add.particles(0, 0, 'blood', {
        lifespan: { min: 700, max: 1600 }, speedX: { min: 2, max: 18 }, speedY: { min: -38, max: -14 },
        gravityY: -6, alpha: { start: 1, end: 0 }, emitting: false,
      }).setDepth(DEPTH_SKY - 2);
      if (this.fire != null && this.fire >= FIRE.collapse) this.meltSnow();
      for (const I of Object.values(INTERIORS)) {
        if (I.byBoat) continue;     // (SNO 4 : préparée au premier voyage, `ensureSno4`)
        I.black = this.add.rectangle(I.at.x - 700, I.at.y - 500, I.w + 1400, I.h + 1000, hex(palette.k))
          .setOrigin(0, 0).setDepth(DEPTH_ROOM - 2).setVisible(false);
        I.image = this.add.image(I.at.x, I.at.y, I.key).setOrigin(0, 0).setDepth(DEPTH_ROOM - 1).setVisible(false);
      }
      this.doorArmed = true;
      // Le feu dans la pièce, autour du corps
      const RA = INTERIORS.house.at;
      this.roomFlames = ROOM_FLAMES.map(f => this.add.image(RA.x + f.x + 0.5, RA.y + f.y + 1, 'feu-0').setOrigin(0.5, 1).setDepth(DEPTH_ROOM + RA.y + f.y + 0.5).setVisible(false));
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
      const rb = save.rowboat && afloat(save.rowboat.x, save.rowboat.y) ? save.rowboat : afloat(PIER_MOOR.x, PIER_MOOR.y) ? PIER_MOOR : (() => {
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
      cam.startFollow(this.player, true, FOLLOW, FOLLOW);
      cam.centerOn(this.pos.x, this.pos.y);          // pas de long travelling au lancement
      // Le facteur d'agrandissement, en pixels physiques par pixel du jeu
      this.zoom = { canvas: fit.factor };
      cam.setZoom(1);
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

      // ── Les reliques : trouvées (inventaire) ou tombées et pas encore ramassées ──
      this.relics = new Set(save.relics || []);
      // Ce qu'on a donné (touche E) : personne → relique ; la relique quitte la ceinture
      this.given = new Map(Object.entries(save.given || {}));
      this.hvitFree = !!save.hvitFree;
      this.wolvesSpared = !!save.wolvesSpared;
      this.templeOpen = !!save.templeOpen;
      this.aube = !!save.aube;
      this.aubeAt = null;
      this.sigrunFree = !!save.sigrunFree;
      // Ceux qu'on a rencontrés (le carnet des vœux)
      this.met = new Set(save.met || []);
      this.relicDrops = { ...(save.relicDrops || {}) };
      // Ce qu'on a trouvé pend à la ceinture (un crochet chacun ; on les déplace dans l'inventaire)
      this.belt = this.normalBelt(save.belt);
      this.drops = [];

      // ── Le bosquet sacré : les offrandes pendues, le guetteur ──
      this.ropes = this.add.graphics().setDepth(GROVE_TREE.y + 0.4);
      this.bundles = GROVE_HOOKS.map((h, i) => ({
        h, len: 3 + (i * 7) % 5, phase: i * 1.7,
        img: this.add.image(h.x, h.y, 'bundle').setOrigin(0.5, 0).setDepth(GROVE_TREE.y + 0.5),
      }));
      // (la poupée est tombée : plus rien à sa place)
      this.poupeeBundle = this.bundles[Math.min(2, this.bundles.length - 1)];
      if (this.relics.has('poupee') || this.relicDrops.poupee) { this.poupeeBundle.gone = true; this.poupeeBundle.img.setVisible(false); }
      // Les reliques posées : celles qui sont tombées plus tôt, et le médaillon sur la table
      for (const [id, at] of Object.entries(this.relicDrops)) if (relicById(id)) this.spawnDrop(id, at.x, at.y, at.where);
      if (!this.relics.has('medaillon')) {
        const [fx, fy] = floorPoint(0.36, 0.7), H = INTERIORS.house.at;
        this.spawnDrop('medaillon', H.x + fx, H.y + fy - 2, 'house');
      }

      // Ses pas : trois empreintes qui arrivent jusqu'à lui, et plus rien
      for (let k = 1; k <= 4; k++) ground.decal(WATCHER_AT.x - 1 + (k % 2) * 2, WATCHER_AT.y - k * 6 + 2, 1, 2, 'b', 0.8);
      this.watcherGone = !!save.watcherGone;
      this.chapters = new Set(save.chapters || []);
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
      // E : la touche d'action (parler, ouvrir, allumer, prendre la barque)
      window.addEventListener('keydown', e => {
        if (e.code !== 'KeyE' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || isPaused()) return;
        e.preventDefault();
        this.act();
      });
      window.addEventListener('keyup', e => this.keys.delete(e.code));
      window.addEventListener('blur', () => this.keys.clear());

      // (le clic droit décrit ; pas de menu du navigateur sur le jeu)
      this.input.mouse?.disableContextMenu();
      this.input.on('pointerdown', p => {
        if (isPaused() || this.dead) return;
        // Ce qu'on voit (v1.57.0) : un clic droit sur n'importe quoi, ou un clic
        // sur une chose hors de portée de la lame, hors combat, la décrit
        if (p.button === 2) { const d = this.describeAt(p.worldX, p.worldY, true); if (d) onDescribe(d); return; }
        if (this.rowing || p.button !== 0) return;
        const far = Math.hypot(p.worldX - this.pos.x, p.worldY - (this.pos.y - 5)) > 28;
        if (far && !this.fighting()) {
          const d = this.describeAt(p.worldX, p.worldY, false);
          if (d) { onDescribe(d); this.charge = { t: 0 }; return; }
        }
        // Dans la crypte, un clic près du coffre l'ouvre
        if (this.inside === 'crypt' && !this.chestOpen && this.nearChest()) { this.openChest(); return; }
        // Dans la maison, l'autre mort, un clic près du corps : le bûcher
        if (this.inside === 'house' && this.fire == null && !this.foe.alive && this.nearBody()) { this.lightPyre(); return; }
        this.attack(p.worldX, p.worldY);
        // Maintenu, le bouton arme le coup tourbillonnant
        this.charge = { t: 0 };
      });
      this.input.on('pointerup', () => { this.charge = null; });
      this.input.on('gameout', () => { this.charge = null; });

      // ── L'autre viking, au bout des traces ──
      this.art('fallen', CORPSE);
      const end = trail.at(-1);
      const post = nearestWalkable(Math.round(end.x + Math.cos(end.heading) * 18), Math.round(end.y + Math.sin(end.heading) * 18)) || { x: end.x, y: end.y };
      // (Véla garde celui qui lui a rendu la poupée : un coup de plus)
      this.maxHp = TUNE.kariPv + (this.given?.has('freya') ? 1 : 0);
      this.hp = this.maxHp;
      this.invuln = 0;
      this.stamina = 1;
      // Arbres abattus, rochers brisés : « x,y » → sens de la chute
      this.wrecked = new Map(Object.entries(save.wrecked || {}));
      // Rochers ébréchés : « x,y » → nombre d'éclats arrachés
      this.chips = new Map(Object.entries(save.chips || {}));
      // Le compteur : arbres abattus, rochers brisés
      this.tally = { trees: 0, rocks: 0, ...(save.tally || {}) };
      this.staminaBar = this.add.graphics();
      this.playerPips = this.add.graphics();
      this.foe = createFoe(this, {
        post, walkable, capeAnchor: this.capeAnchor, dead: !!save.foeDead,
        onStrike: (x, y, dir) => { audio.play('swing'); this.struckAt(x, y, dir); },
        bleed: (x, y, n) => this.bleed(x, y, n),
      });
      // ── La meute, sur le plateau au-dessus de la falaise ──
      this.wolfTracks();
      this.onPackSound = (name, opts) => audio.play(name, opts);
      this.pack = createPack(this, palette, {
        den: WOLF_DEN, radius: WOLF_DEN.r, open: DEN_OPEN,
        // (ni la falaise, ni les rochers : ils ne descendent pas la paroi)
        isLand: (x, y) => isLand(x, y) && !blocked(x, y),
        // (ceux d'une ancienne partie, tombés dans la forêt, n'y sont plus)
        dead: (save.wolvesDead || []).filter(d => Math.hypot(d.x - WOLF_DEN.x, d.y - WOLF_DEN.y) < WOLF_DEN.r * 3),
        tame: () => this.hvitFree, spared: this.wolvesSpared,
        onSpared: () => { this.wolvesSpared = true; this.persist(); },
        onBite: (x, y, dir) => { audio.play('bite'); this.hurt(dir); },
        bleed: (x, y, n) => this.bleed(x, y, n),
        print: (x, y) => this.wolfPrint(x, y),
      });
      // ── Le megamoth, sur le plateau en haut de la falaise : retiré pour le
      // moment (MOTH_ENABLED) ; à sa place, une bête absente qui ne fait rien ──
      this.mothDead = save.mothDead || null;
      this.moth = !MOTH_ENABLED ? NO_MOTH : createMoth(this, {
        lair: MOTH_LAIR, dead: this.mothDead, palette,
        onWake: () => { audio.play('presence'); audio.hush(5); },
        onSnuff: () => this.snuffTorch(),
        onHit: dir => { audio.play('flesh'); audio.play('rustle'); this.jolt(0.003); },
        onFall: () => audio.play('rustle'),
        onDie: at => { this.mothDead = at; audio.play('snow'); this.persist(); },
        onFlap: d => { if (d < 150) audio.play('flap', { v: 1 - d / 150 }); },
      });

      // ── SNO 4 : on revient à côté de la barque ; on y a déjà réveillé Clotilde ? ──
      INTERIORS.sno4.exit = { ...this.spawn };
      this.salt = !!save.salt;
      this.clotildeFree = !!save.clotildeFree;
      this.leftShore = false;

      // ── Un rendez-vous laissé par la carte de SNO 4 du labo : on y est ──
      let goto = null;
      try { goto = JSON.parse(sessionStorage.getItem('kingvi:goto') || 'null'); sessionStorage.removeItem('kingvi:goto'); } catch { /* rien */ }
      if (goto?.world === 'sno4') {
        this.time.delayedCall(0, () => {
          this.arrive('sno4');
          const A = INTERIORS.sno4.at;
          if (sno4Walkable(goto.x, goto.y)) { this.pos = { x: A.x + goto.x, y: A.y + goto.y }; this.prevPos = { ...this.pos }; this.placePlayer(); this.cameras.main.centerOn(this.pos.x, this.pos.y); this.updateChunks(true); }
        });
      }

      // ── La carte qui se construit : ce que le viking a vu, par cases ──
      this.seen = decodeSeen(save.seen);
      this.seen4 = decodeSeen(save.seen4, SEEN4_COLS * SEEN4_ROWS);
      this.veveDone = new Set(save.veve || []);

      // ── La parole : des scènes de la saga, chacune une fois par partie ──
      this.said = new Set(save.said || []);
      this.deaths = save.deaths || 0;
      this.talk = createTalk(screenEl, palette);
      this.foeAlive = this.foe.alive;
      this.wolvesDown = this.pack.deadList.length;
      // Tavé, l'enfant au visage de vieillard, assis contre un pilier de l'arche
      const tagesAt = nearestWalkable(ARCH.x + 18, ARCH.y + 22) || { x: ARCH.x + 18, y: ARCH.y + 22 };
      this.tages = { ...tagesAt, img: this.personImage('tages', tagesAt.x, tagesAt.y) };

      // ── La louve blanche, prise dans un collet, dans la clairière à la sortie du noir ──
      makeWhiteWolf(this, palette);
      const hv = nearestWalkable(HVIT_AT.x, HVIT_AT.y) || HVIT_AT;
      this.hvit = { x: hv.x, y: hv.y, state: this.hvitFree ? 'gone' : 'snared', t: 0 };
      this.hvit.sprite = this.add.sprite(hv.x + 0.5, hv.y + 1, 'hvit', 'mort-0').setOrigin(0.5, 1).setDepth(hv.y).setVisible(!this.hvitFree);
      this.hvitRope = this.add.graphics().setDepth(hv.y - 0.5).setVisible(!this.hvitFree);
      // le collet : une corde tendue jusqu'à un piquet
      this.hvitRope.fillStyle(hex(palette.b), 1);
      for (let k = 0; k <= 6; k++) this.hvitRope.fillRect(hv.x - 3 - k, hv.y - 2 + Math.round(k * 0.3), 1, 1);
      this.hvitRope.fillStyle(hex(palette.k), 1).fillRect(hv.x - 10, hv.y - 3, 1, 4);

      // ── Le cube blanc et le cube noir ──
      this.cubes = SNO7_CUBES.map(c => ({ ...c, img: this.add.image(c.x + 0.5, c.y + 2, `cube-${c.kind}`).setOrigin(0.5, 1).setDepth(c.y) }));
      this.cubesTouched = new Set(save.cubes || []);
      // Le pas des morts : aller d'un lieu vu à l'autre par la carte (`travel`)
      this.passage = !!save.passage;

      // ── Sigrún, debout dans la glace sur le plateau ──
      const sg = nearestWalkable(SIGRUN_AT.x, SIGRUN_AT.y) || SIGRUN_AT;
      this.sigrun = { x: sg.x, y: sg.y };
      this.ice = this.add.image(sg.x + 0.5, sg.y + 1, this.sigrunFree ? 'glace-gone' : 'glace-whole').setOrigin(0.5, 1).setDepth(sg.y);

      // ── Le temple de Sorne : sous l'arche, une dalle, puis des marches ──
      const T = TEMPLE_DOOR_OUT;
      this.templeDoor = this.add.image(T.x + 0.5, T.y + 2, this.templeOpen ? 'temple-stairs' : 'temple-slab').setOrigin(0.5, 1).setDepth(DEPTH_MARKS + 1);
      const TI = INTERIORS.temple.at;
      this.nail = this.add.image(TI.x + NAIL.x + 0.5, TI.y + NAIL.y + 2, 'nail').setOrigin(0.5, 1).setDepth(DEPTH_ROOM + TI.y + 40).setVisible(false);
      if (this.aube) { this.nail.setAlpha(0); weather.setPreset('bise'); }

      this.time.addEvent({ delay: 4000, loop: true, callback: () => this.persist() });

      // Jour et nuit : un voile bleu nuit (multiplié) et, à l'aube et au
      // crépuscule, une lueur rouge ; la nuit, le feu s'allume à la fenêtre
      const cover = c => this.add.rectangle(-200, -200, 5000, 4000, hex(c)).setOrigin(0, 0).setScrollFactor(0);
      // Le voile de nuit est une texture (posée sur la vue) : la torche y
      // creuse un halo de lumière
      this.makeShade(256, 256);
      this.lightStamp = this.make.image({ key: 'torchlight-0-0' }, false).setOrigin(0.5);
      this.fireStamp = this.make.image({ key: 'firelight-0-0' }, false).setOrigin(0.5);
      this.fireGlow = this.add.image(HOUSE.x, HOUSE.y - 14, 'torchglow').setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH_SKY + 7).setScale(2.4, 1.5).setAlpha(0);
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
      onTally(this.tally, null);
    }

    applyDaylight() {
      let d = daylightAt(dayClock());
      // Le clou arraché : la nuit pâlit en une minute, une lueur d'aube, puis le jour
      if (this.aube) {
        const k = this.aubeAt == null ? 1 : Math.min(1, (this.clock - this.aubeAt) / 60000);
        d = { ...d, night: d.night * (1 - k), dusk: Math.max(d.dusk * (1 - k), Math.sin(k * Math.PI) * 0.9) };
      }
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

      const originals = new Map();                  // les dessins d'origine, pour revenir en arrière
      // Les images qui s'animent (des images ajoutées dans l'atelier) : la
      // texture est repeinte sur place à chaque image (`animateArt`)
      this.artAnims = new Map();
      this.artRows = new Map();            // (le dessin de chaque image, pour son ombre)
      const art = this.art = (key, rows) => {
        // (un dessin du décor redessiné à la main remplace celui du code : designs.js ;
        // agrandi dans l'atelier, il garde son point d'ancrage : `GROWN`)
        originals.set(key, rows);
        const frames = designFrames(key, rows);
        this.artRows.set(key, frames[0]);
        rows = frames[0];
        const p = padOf(key);
        const orig = originals.get(key);
        if (p && (rows.length !== orig.length || rows[0].length !== orig[0].length)) GROWN.set(key, { ...p, w: orig[0].length, h: orig.length });
        else GROWN.delete(key);
        const c = document.createElement('canvas');
        c.width = rows[0].length; c.height = rows.length;
        paintRows(c.getContext('2d'), rows);
        if (this.textures.exists(key)) this.textures.remove(key);
        this.textures.addCanvas(key, c);
        if (frames.length > 1) this.artAnims.set(key, { frames, fps: animOf(key)?.fps || 6, shown: 0 });
        else this.artAnims.delete(key);
      };
      const paintRows = (ctx, rows) => rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === '.') return;
        ctx.fillStyle = palette[ch]; ctx.fillRect(x, y, 1, 1);
      }));
      // Un dessin du décor retouché dans l'éditeur du labo, dans un autre onglet :
      // la texture est repeinte sur place (même taille), sans recharger
      this.redrawArt = name => {
        const tex = this.textures.exists(name) && this.textures.get(name);
        const frames = originals.has(name) && designFrames(name, originals.get(name));
        const rows = frames && frames[0];
        if (!tex || !rows) return;
        // (de taille changée : l'image se refait au prochain lancement)
        if (rows.length !== tex.getSourceImage().height || rows[0].length !== tex.getSourceImage().width) return;
        if (frames.length > 1) this.artAnims.set(name, { frames, fps: animOf(name)?.fps || 6, shown: 0 });
        else this.artAnims.delete(name);
        const c = tex.getSourceImage(), ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        paintRows(ctx, rows);
        tex.refresh();
      };
      window.addEventListener('storage', e => {
        if (e.key !== DESIGNS_STORAGE_KEY && e.key !== null) return;
        const names = refreshLocal();
        // (la maison retouchée : la maison en feu et la ruine s'en tirent de nouveau)
        if (names.includes('house')) {
          const b = burnHouse(designRows('house', HOUSE_ART));
          originals.set('house-burning', b.burning); originals.set('house-ruin', b.ruin);
          names.push('house-burning', 'house-ruin');
        }
        // (la barque échouée retouchée : son roulis s'en tire de nouveau)
        if (names.includes('boat-still')) {
          const still = designFrames('boat-still', BOAT_FRAMES.still)[0];
          originals.set('boat-left', rollBoat(-1, still)); originals.set('boat-right', rollBoat(1, still));
          names.push('boat-left', 'boat-right');
        }
        for (const name of names) this.redrawArt(name);
        // Les poses du viking, de sa cape, du loup : les planches sont repeintes sur place
        if (names.some(n => n.startsWith('viking-'))) { paintSheet(sheet, palette); tex.refresh(); }
        if (names.some(n => n.startsWith('cape-'))) { paintFrames(capeSheet, capeFrames(), CAPE_W, CAPE_H, palette); ctex.refresh(); }
        if (names.some(n => n.startsWith('loup-'))) this.pack?.repaint();
      });
      // La barque échouée : un seul dessin (l'atelier) ; son roulis s'en tire ici
      art('boat-still', BOAT_FRAMES.still);
      {
        const still = designFrames('boat-still', BOAT_FRAMES.still)[0];
        for (const [k, dir] of [['left', -1], ['right', 1]]) {
          originals.set(`boat-${k}`, rollBoat(dir, still));
          const c = document.createElement('canvas');
          c.width = still[0].length; c.height = still.length;
          paintRows(c.getContext('2d'), rollBoat(dir, still));
          this.textures.addCanvas(`boat-${k}`, c);
          if (GROWN.has('boat-still')) GROWN.set(`boat-${k}`, GROWN.get('boat-still'));
        }
      }
      art('boat2', BOAT2);
      art('house', HOUSE_ART);
      art('house-burning', HOUSE_BURNING);
      art('house-ruin', HOUSE_RUIN);
      FIRE_FRAMES.forEach((rows, i) => art(`feu-${i}`, rows));
      // ── Les objets posés dans l'atelier (v1.62.0, onglet Carte : « obj:<id>:<n> »),
      // un asset créé dans l'atelier ; ce qu'il fait dans le jeu : `propsOf`
      // (une lumière, un pied qui bloque, une ombre, ce qu'on en dit) ──
      PLACED.length = 0;
      this.placed = [];
      for (const [k, at] of Object.entries(placements())) {
        const m = k.match(/^obj:([a-z0-9-]+):\d+$/), def = m && customDefs().find(c => c.id === m[1]);
        if (!def) continue;
        const blank = Array.from({ length: def.h }, () => '.'.repeat(def.w)), name = `custom-${def.id}`;
        const frames = def.frames > 1 ? customNames(def).map(nm => designRows(nm, blank)) : designFrames(name, blank, { grow: false });
        const key = `obj-${def.id}`;
        if (!this.textures.exists(key)) {
          const c = document.createElement('canvas');
          c.width = def.w; c.height = def.h;
          paintRows(c.getContext('2d'), frames[0]);
          this.textures.addCanvas(key, c);
          if (frames.length > 1) this.artAnims.set(key, { frames, fps: def.frames > 1 ? def.fps || 6 : animOf(name)?.fps || 6, shown: 0 });
        }
        const props = propsOf(name) || {};
        const o = { id: def.id, label: def.label, x: at.x, y: at.y, w: def.w, h: def.h, x0: at.x - Math.floor(def.w / 2), top: at.y - def.h + 1, rows: frames[0], props };
        o.img = this.add.image(at.x + 0.5, at.y + 1, key).setOrigin(0.5, 1).setDepth(at.y);
        this.placed.push(o); PLACED.push(o);
      }
      this.objStamp = this.make.image({ key: 'torchlight-0-0' }, false).setOrigin(0.5);
      this.walkable = walkable;                    // (le debug, le harnais)
      // Les dessins du jeu posés tels quels (maison, barques, cubes, coffre…) qui
      // ont reçu, dans l'atelier, une lumière, une zone qui bloque, une ombre ou
      // une description : recensés une fois la scène montée, et de nouveau quand
      // l'atelier les change (événement « storage »)
      this.artProps = [];
      this.time.delayedCall(0, () => this.registerArtProps());
      window.addEventListener('storage', e => { if (e.key === EXTRAS_STORAGE_KEY || e.key === null) this.registerArtProps(); });
      // ── Le mons (v1.60.0) : au creux du sud, loin des traces. Son animation est
      // celle de l'atelier (« Un mons », custom-un-mons-0…) ; s'il n'y en a pas,
      // une masse de nuit. Il apparaît quand on le découvre ; il a perdu son œil
      {
        const def = customDefs().find(c => c.id === 'un-mons');
        const blank = def ? Array.from({ length: def.h }, () => '.'.repeat(def.w)) : null;
        const frames = def ? customNames(def).map(nm => designRows(nm, blank)) : [];
        const fallback = Array.from({ length: 22 }, (_, y) => Array.from({ length: 16 }, (_, x) => Math.hypot((x - 7.5) / 7.5, (y - 12) / 10) < 1 ? 'b' : '.').join(''));
        const list = frames.length ? frames : [fallback];
        list.forEach((rows, i) => art(`mons-${i}`, rows));
        const met = this.met?.has('mons');
        this.mons = {
          x: MONS_AT.x, y: MONS_AT.y, n: list.length, fps: def?.fps || 6, shown: !!met,
          img: this.add.image(MONS_AT.x + 0.5, MONS_AT.y + 1, 'mons-0').setOrigin(0.5, 1).setDepth(MONS_AT.y).setAlpha(met ? 1 : 0),
        };
      }
      for (const [k, rows] of Object.entries(MOTH_FRAMES)) art(mothKey(k), rows);
      art('pierre-chute', FALLING_STONE);
      art('room', ROOM);
      art('crypt', CRYPT);
      art('cave', CAVE_ROOM);
      art('temple', TEMPLE);
      art('nail', NAIL_ART);
      art('temple-slab', TEMPLE_SLAB);
      art('temple-stairs', TEMPLE_STAIRS);
      for (const [k, rows] of Object.entries(ICE_FRAMES)) art(`glace-${k}`, rows);
      art('cube-blanc', CUBE_WHITE);
      art('cube-noir', CUBE_BLACK);
      for (const [k, rows] of Object.entries(THRONE_FRAMES)) art(`throne-${k}`, rows);
      for (const [k, rows] of Object.entries(CHEST_FRAMES)) art(`chest-${k}`, rows);
      for (const [k, rows] of Object.entries(ROWBOAT_FRAMES)) art(`rowboat-${k}`, rows);
      art('blood', ['r']);
      for (const r of RELICS) { art(relicDesign(r.id), r.rows); art(relicGround(r.id), r.ground); }
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
      // La lumière de la torche, sa trame calée sur les 4 × 4 positions
      // possibles du monde (elle ne glisse pas quand on marche)
      for (let oy = 0; oy < 4; oy++) for (let ox = 0; ox < 4; ox++) this.textures.addCanvas(`torchlight-${ox}-${oy}`, torchLight(1, ox, oy));
      // La lumière de l'incendie : la même, en bien plus grand
      for (let oy = 0; oy < 4; oy++) for (let ox = 0; ox < 4; ox++) this.textures.addCanvas(`firelight-${ox}-${oy}`, torchLight(1.9, ox, oy));
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
    // Sur le socle ou le ponton, on est dessiné plus haut (`lift`, qui suit
    // la hauteur du dessus en un instant : on y monte, on en descend)
    // `alpha` (0 → 1) : où l'on en est entre les deux derniers pas de logique ;
    // sans lui (téléportation, tour sur soi), on se pose là où l'on est
    // La profondeur du viking : celle de ses pieds ; dans une pièce, au-dessus
    // du dehors ; sur la sente, devant toute la falaise
    baseDepth() { return this.climb ? CLIFF.y + 60 : this.pos.y + (this.inside ? DEPTH_ROOM : 0); }

    placePlayer(alpha) {
      let { x, y } = this.pos;
      const p = this.prevPos;
      if (alpha == null || !p || Math.abs(p.x - x) > 12 || Math.abs(p.y - y) > 12) this.prevPos = { x, y };
      else { x = p.x + (x - p.x) * alpha; y = p.y + (y - p.y) * alpha; }
      this.drawPos = { x, y };
      const px = Math.round(x), py = Math.round(y) - Math.round(this.lift || 0);
      const depth = this.baseDepth();
      // Dans la neige profonde, il s'enfonce : le bas du dessin passe sous la
      // ligne de la neige (rogné), l'ombre disparaît avec
      const sink = Math.round(this.sink || 0);
      this.player.setPosition(px + 0.5, py + sink).setDepth(depth);
      if (sink !== this.cropped) {
        this.cropped = sink;
        if (sink) this.player.setCrop(0, 0, this.player.frame.width, GROUND + 1 - sink); else this.player.setCrop();
      }
      // Autour de lui, la neige remuée : une collerette bosselée, jamais une
      // ligne droite (le hasard est accroché au monde : elle roule quand il avance)
      if (!this.collar) this.collar = this.add.graphics();
      const c = this.collar;
      c.clear();
      if (sink > 0) {
        c.setDepth(depth + 0.02).fillStyle(hex(palette.s), 1);
        // (un pixel de haut au plus, sur la ligne de la neige : elle ronge le
        // bas du corps sans l'ensevelir)
        const half = 3;
        for (let dx = -half; dx <= half; dx++) {
          const n = noise(px + dx, Math.round(y / 3), 7);
          if (n > (Math.abs(dx) === half ? 0.7 : 0.4)) c.fillRect(px + dx, py, 1, 1);
        }
        c.fillStyle(hex(palette.b), 0.45);
        for (let dx = -half; dx <= half; dx++) if (noise(px + dx, Math.round(y), 11) < 0.2) c.fillRect(px + dx, py + 1, 1, 1);
      }
      // La cape s'accroche à l'épaule côté est (le vent souffle vers l'est)
      const a = this.capeAnchor[this.player.frame.name];
      if (!a) return;
      const col = this.flip ? 2 * CX - a.west - 1 : a.east - 1;
      const capeY = py + a.y - GROUND - 1 + sink;
      this.cape.setPosition(px + col - CX, capeY).setDepth(depth - 0.01);
      if (sink) this.cape.setCrop(0, 0, this.cape.frame.width, Math.max(0, py - capeY)); else if (this.cape.isCropped) this.cape.setCrop();
    }

    updateCape(delta) {
      // Plus le vent est fort, plus la cape se couche et bat vite ; à
      // l'intérieur, pas de vent : elle pend, immobile
      if (roofed(this.inside)) { this.cape.setFrame('cape-0-0'); return; }
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

    // La neige sous les pieds : son niveau (relu dix fois par seconde),
    // l'enfoncement qui suit en douceur, et jusqu'à la taille, un sillon
    // continu à la place des pas
    updateSnow(dt) {
      this.snowClock = (this.snowClock || 0) - dt;
      if (this.snowClock <= 0) {
        this.snowClock = 0.1;
        this.snowLevel = this.inside || this.rowing || this.climb || this.dead ? 0 : snowDepth(this.pos.x, this.pos.y);
      }
      const want = SNOW_SINK[this.snowLevel || 0];
      this.sink = (this.sink || 0) + Math.max(-dt * 14, Math.min(dt * 10, want - (this.sink || 0)));
      if (this.snowLevel === 2 && this.moved) {
        const x = Math.round(this.pos.x), y = Math.round(this.pos.y);
        const f = this.furrowAt;
        if (!f || Math.abs(f.x - x) + Math.abs(f.y - y) >= 1) {
          this.furrowAt = { x, y };
          // (le sillon : deux lèvres serrées contre le corps, la neige rejetée
          // de part et d'autre ; celle de derrière plus nette, celle de devant
          // en morceaux ; leur écart bouge d'un pixel, des trous les coupent,
          // une motte déborde parfois : rien de droit)
          const life = OWN_PRINT_LIFE * 1.5, side = this.facing === 'side';
          for (const k of [-1, 1]) {
            const n = noise(x, y, k > 0 ? 3 : 5);
            if (n < (k > 0 ? 0.5 : 0.18)) continue;              // un trou
            const off = 1 + (noise(x >> 1, y >> 1, k > 0 ? 9 : 11) > 0.65 ? 1 : 0);
            const [mx, my] = side ? [x, k < 0 ? y - 1 - off : y + off - 1] : [x + k * (off + 1), y];
            this.mark(mx, my, 1, 1, life);
            // une motte qui déborde
            if (n > 0.92) ground.mark(mx + (side ? 1 : k), my + (side ? k : 0), 1, 1, life, 'b', 0.45, this.clock || 0);
          }
        }
      }
    }

    leavePrint(side) {
      // (jusqu'à la taille, pas de pas : le sillon ; aux mollets, des trous plus larges)
      if (this.snowLevel === 2) { this.stepCount++; return; }
      const x = Math.round(this.pos.x), y = Math.round(this.pos.y) - Math.round(this.lift || 0);
      const horizontal = this.facing === 'side';
      const px = x + (horizontal ? 0 : side);
      const py = y - 1 + (horizontal ? (side > 0 ? 0 : -1) : 0);
      this.mark(px, py, horizontal ? 2 : 1, horizontal ? 1 : 2, OWN_PRINT_LIFE);
      // Aux mollets : le même pas, et la neige qu'il soulève, une ou deux
      // mottes pâles posées au hasard autour (le hasard accroché au monde)
      if (this.snowLevel === 1) {
        for (let k = 0; k < 2; k++) {
          const n = noise(px, py, 13 + k);
          if (n < 0.35) continue;
          const dx = Math.round(noise(px, py, 17 + k) * 4 - 2), dy = Math.round(noise(px, py, 19 + k) * 2 - 1);
          ground.mark(px + dx + (horizontal ? 0 : side), py + dy + (horizontal ? side : 0), 1, 1, OWN_PRINT_LIFE, 'b', 0.4, this.clock || 0);
        }
      }
      this.stepCount++;
    }

    // Les pas des loups : un pixel, plus pâle que les nôtres
    wolfPrint(x, y) {
      ground.mark(Math.round(x), Math.round(y), 1, 1, OWN_PRINT_LIFE, 'b', 0.45, this.clock || 0);
    }

    // Une marque dans la neige (pas, entaille, sang) : écrite dans la tuile du
    // sol, elle pâlit et disparaît en `life` ms
    mark(x, y, w, h, life, color = palette.b) {
      ground.mark(x, y, w, h, life, color, 0.9, this.clock || 0);
    }

    // ── L'endurance : courir et frapper la vident ; elle revient au pas ──
    useStamina(k) { if (!STAMINA_ON) return; this.stamina = Math.max(0, this.stamina - k); this.staminaRest = STAMINA.rest; }
    updateStamina(dt) {
      if (this.running && (this.moved || this.rowing)) this.useStamina(STAMINA.run * dt);
      this.staminaRest = Math.max(0, (this.staminaRest || 0) - dt);
      if (!this.staminaRest) this.stamina = Math.min(1, this.stamina + STAMINA.regen * dt);
      this.staminaFlash = Math.max(0, (this.staminaFlash || 0) - dt);
    }
    // La barre : sous les marques de vie, seulement quand elle n'est pas pleine
    drawStamina() {
      const g = this.staminaBar, show = STAMINA_ON && (this.stamina < 0.999 || this.staminaFlash) && !this.dead && !this.rowing;
      g.clear();
      if (!show) return;
      const at = this.drawPos || this.pos;
      const x = Math.round(at.x) - 4, y = Math.round(at.y - (this.lift || 0)) - 12;
      g.setDepth(this.baseDepth() + 0.03);
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
      const dx = tx - this.pos.x, dy = ty - (this.pos.y - (this.lift || 0) - 5);
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

    // Les secousses d'écran, au plus juste : rien pour la neige, le bois ou la
    // pierre ; pour un vrai coup, un pixel du jeu tout au plus, un instant
    jolt(k) {
      if (k < 0.003) return;
      const cam = this.cameras.main;
      cam.shake(k >= 0.004 ? 60 : 40, { x: 0.9 / cam.width, y: 0.45 / cam.height });
    }

    // ── Le coup tourbillonnant : bouton maintenu TUNE.tourbillon secondes ──
    // En attendant, la neige se met à tourner autour des pieds, de plus en plus
    updateCharge(dt) {
      const c = this.charge;
      if (!c || isPaused() || this.dead || this.rowing || this.inside === 'crypt' && this.nearChest()) { if (c && (this.dead || this.rowing)) this.charge = null; return; }
      c.t += dt;
      if (c.t >= TUNE.tourbillon && !this.whirling) { this.charge = null; this.whirl(); }
    }
    drawCharge() {
      const g = this.chargeG || (this.chargeG = this.add.graphics());
      g.clear();
      const c = this.charge;
      if (!c || isPaused() || this.dead || this.rowing || this.inside === 'crypt' && this.nearChest()) return;
      const k = Math.max(0, (c.t - 0.35) / (TUNE.tourbillon - 0.35));
      if (!k) return;
      const at = this.drawPos || this.pos;
      const x = at.x, y = at.y - (this.lift || 0);
      const n = Math.round(3 + k * 14), spin = c.t * (3 + k * 9);
      g.setDepth(this.baseDepth() + 0.6);
      for (let i = 0; i < n; i++) {
        const a = spin + i / n * Math.PI * 2, wob = Math.sin(i * 12.9898) * 2;   // pas un cercle : un remous
        const px = Math.round(x + Math.cos(a) * (9 + wob)), py = Math.round(y - 2 + Math.sin(a) * (5 + wob * 0.5));
        g.fillStyle(hex(i % 3 ? palette.s : palette.b), 0.35 + 0.5 * k);
        g.fillRect(px, py, 1, 1);
      }
    }

    whirl() {
      if (this.whirling || this.dead || this.rowing) return;
      if (this.stamina < STAMINA.whirl * 0.6) { this.staminaFlash = 0.6; return; }
      this.useStamina(STAMINA.whirl);
      this.whirling = true;
      this.attacking = true;
      this.player.stop();
      this.player.anims.timeScale = 1;
      audio.play('swing');
      // L'anneau de la lame se trace pendant le tour : la moitié du fond
      // derrière le viking, celle de devant devant lui
      const cx = Math.round(this.pos.x), cy = Math.round(this.pos.y - (this.lift || 0)) - 3;
      const back = this.add.graphics().setPosition(cx, cy).setDepth(this.baseDepth() - 0.2);
      const front = this.add.graphics().setPosition(cx, cy).setDepth(this.baseDepth() + 0.6);
      const steps = [...WHIRL_TURN, WHIRL_TURN[0]], STEP = 48;
      steps.forEach(([view, flip], i) => this.time.delayedCall(i * STEP, () => {
        if (this.dead) return;
        this.flip = flip;
        this.player.setFlipX(flip).setFrame(`${view}-attack-2`);
        this.placePlayer();
        if (i > 0) for (const p of whirlArc((i - 1) * Math.PI / 4, i * Math.PI / 4)) {
          const g = p.front ? front : back;
          g.fillStyle(hex(palette.b), p.a);
          g.fillRect(p.x, p.y, 1, 1);
        }
        if (i === 4) audio.play('swing');
        if (i === steps.length - 1) this.whirlStrike();
      }));
      // L'anneau reste un instant, puis s'efface en s'élargissant à peine
      this.time.delayedCall(steps.length * STEP + 60, () => {
        this.tweens.add({ targets: [back, front], alpha: 0, duration: 520, ease: 'Quad.easeIn', onComplete: () => { back.destroy(); front.destroy(); } });
      });
      this.time.delayedCall(steps.length * STEP + 140, () => {
        this.whirling = false;
        this.attacking = false;
        if (this.dead) return;
        this.facing = 'side';
        this.player.setFlipX(this.flip).setFrame('side-idle');
      });
    }

    // Tout ce qui est autour, à portée de lame, est touché une fois
    whirlStrike() {
      const x = Math.round(this.pos.x), y = Math.round(this.pos.y - (this.lift || 0));
      // Le souffle : une onde qui part de lui et se déchire en s'élargissant,
      // la neige du sol soufflée tout autour, les flocons chassés
      const wave = this.add.graphics().setPosition(x, y - 1).setDepth(this.baseDepth() + 0.7);
      const seed = Math.random() * 10;
      this.tweens.addCounter({
        from: 12, to: 46, duration: 520, ease: 'Quad.easeOut',
        onUpdate: tw => {
          const r = tw.getValue(), fade = 1 - (r - 12) / 34;
          wave.clear();
          for (const p of blastRing(r, seed)) { wave.fillStyle(hex(palette.b), 0.15 + 0.7 * fade); wave.fillRect(p.x, p.y, 1, 1); }
          for (const p of blastRing(r - 3, seed + 1)) { wave.fillStyle(hex(palette.s), 0.6 * fade); wave.fillRect(p.x, p.y, 1, 1); }
        },
        onComplete: () => wave.destroy(),
      });
      this.dust.setConfig({
        lifespan: { min: 400, max: 1000 }, speed: { min: 30, max: 90 }, angle: { min: 0, max: 360 },
        gravityY: 40, alpha: { start: 0.9, end: 0 }, emitting: false,
      });
      this.dust.explode(48, x, y);
      if (!roofed(this.inside)) weather.blast(x, y - 3, 70, 260);
      this.jolt(0.004);
      // Les points de la lame tout autour : chacun ne prend qu'un coup
      const hits = new Set();
      let flesh = false;
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2, bx = x + Math.cos(a) * 11, by = this.pos.y + Math.sin(a) * 6;
        const dir = Math.cos(a) >= 0 ? 1 : -1;
        if (!hits.has('foe') && this.foe.hitAt(bx, by, dir, true)) {
          hits.add('foe'); flesh = true;
          this.foe.hitAt(this.foe.pos.x, this.foe.pos.y - 2, dir);
          this.spurt(this.foe.pos.x, this.foe.pos.y - 5, dir, this.foe.alive ? 18 : 30);
          if (!this.foe.alive) this.pool(this.foe.pos.x, this.foe.pos.y);
        }
        const w = !this.inside && this.pack.hitAt(bx, by, dir, true);
        if (w && !hits.has(w)) {
          hits.add(w); flesh = true;
          this.pack.hitAt(w.pos.x, w.pos.y - 2, dir);
          audio.play('yelp');
          const down = w.state === 'dead';
          this.spurt(w.pos.x, w.pos.y - 3, dir, down ? 22 : 12);
          if (down) { this.pool(w.pos.x, w.pos.y); this.persist(); }
        }
        // Le megamoth, s'il plonge tout près
        if (!hits.has('moth') && !this.inside && this.moth.hitAt(bx, by - 8, dir, true)) {
          hits.add('moth'); flesh = true;
          this.moth.hitAt(this.moth.pos.x, this.moth.pos.y - this.moth.alt - 3, dir);
        }
        // Les arbres tout près tremblent et perdent leur neige
        const s = !this.inside && this.struckObject(bx, by);
        if (s?.kind === 'tree' && !hits.has(s.o)) { hits.add(s.o); this.shakeTree(s.o, dir); audio.play('wood'); }
      }
      audio.play(flesh ? 'flesh' : 'snow');
      // Le cercle reste dans la neige, effrité
      for (let i = 0; i < 26; i++) {
        if (Math.random() < 0.3) continue;
        const a = i / 26 * Math.PI * 2;
        this.mark(Math.round(x + Math.cos(a) * 9), Math.round(this.pos.y + Math.sin(a) * 5), 1, 1, 20000);
      }
    }

    swing() {
      audio.play('swing');
      const dir = this.flip ? -1 : 1;
      const x = Math.round(this.pos.x), y = Math.round(this.pos.y - (this.lift || 0));
      const g = this.add.graphics().setDepth(this.baseDepth() + 0.5);
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
      this.tally.trees++; onTally(this.tally, 'trees');
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
          this.jolt(0.002);
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
      this.tally.rocks++; onTally(this.tally, 'rocks');
      audio.play('clang'); audio.play('snow');
      this.jolt(0.002);
      const cx = o.x - o.art.ax + o.w / 2;
      this.dust.setConfig({ lifespan: { min: 300, max: 900 }, speed: { min: 15, max: 55 }, angle: { min: 190, max: 350 }, gravityY: 90, alpha: { start: 0.9, end: 0 }, emitting: false });
      this.dust.explode(22, cx, o.y - 3);
      this.embers.explode(6, cx, o.y - 3);
      if (o.img) { o.img.setVisible(false); o.img.hiddenForGood = true; }
      if (o.chipImg) { o.chipImg.setVisible(false); o.chipImg.hiddenForGood = true; }
      const pieces = this.rockPieces(o);
      for (const chunk of this.chunks.values()) if (chunk.images.includes(o.img)) { chunk.images.push(...pieces); break; }
      this.wreck(o, dir);
    }

    // Le rocher ébréché de `n` éclats : une image à lui (à la place de celle de
    // la planche), et les éclats tombés à son pied. `fresh` : le dernier éclat
    // vient de sauter (poussière). Rend les images et textures créées.
    chipRock(o, n, fresh = false, chunk = null) {
      chunk = chunk || [...this.chunks.values()].find(c => c.images.includes(o.img));
      const { rows, fell } = chipBoulder(o.art.rows, n, o.seed);
      const key = `chipped-${o.x}-${o.y}-${n}`;
      if (o.chipImg) {
        // L'image précédente sort de la liste de son morceau, puis disparaît
        for (const c of this.chunks.values()) { const i = c.images.indexOf(o.chipImg); if (i >= 0) c.images.splice(i, 1); }
        o.chipImg.destroy(); this.dropTexture(o.chipTex);
      }
      this.dropTexture(key);
      this.art(key, rows);
      const left = o.x - o.art.ax;
      o.chipImg = this.add.image(left, o.y + 1, key).setOrigin(0, 1).setDepth(o.y);
      o.chipTex = key;
      if (o.img) { o.img.setVisible(false); o.img.hiddenForGood = true; }
      const made = [o.chipImg];
      // Les éclats au sol : un par coup, du côté où il a sauté
      const show = fresh ? fell.slice(-1) : fell;
      show.forEach((f, i) => {
        const k = fresh ? fell.length - 1 : i;
        const w = f.size > 1.8 ? 2 : 1, pk = `rockpiece-${w}-1`;
        if (!this.textures.exists(pk)) this.art(pk, w > 1 ? ['.b', 'kk'] : ['k']);
        const px = Math.round(left + f.x + f.side * (2 + ((o.seed >> k) & 3))), py = o.y + 1 + ((o.seed >> (k + 3)) & 3);
        made.push(this.add.image(px, py, pk).setOrigin(0, 1).setDepth(py));
      });
      if (fresh) {
        const f = fell.at(-1);
        this.dust.setConfig({ lifespan: { min: 250, max: 600 }, speed: { min: 8, max: 30 }, angle: { min: 200, max: 340 }, gravityY: 80, alpha: { start: 0.8, end: 0 }, emitting: false });
        if (f) this.dust.explode(6, left + f.x, o.y + 1 - rows.length + f.y);
      }
      if (chunk) { chunk.images.push(...made); chunk.textures.push(key); }
      return { images: made, textures: [key] };
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
          if (r() < 0.12 || !isLand(x, y) || blocked(x, y) || y > D.y + 75) continue;   // effacée par le vent ; pas sur la paroi
          ground.decal(x, y, 1, 1, 'b', 0.7);
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
      this.jolt(0.002);
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
      const x = Math.round(this.pos.x) + off.x * dir, y = Math.round(this.pos.y - (this.lift || 0)) + off.y;
      // Le roi mort, dans la grotte : sa poitrine rend le rubis
      if (this.inside === 'cave' && this.knockKing(x, y, dir, view)) return;
      // L'autre viking d'abord ; sinon, un arbre ou une pierre sous la lame ?
      if (!this.foe.hitAt(x, y, dir || 1, true) && !this.pack.hitAt(x, y, dir || 1, true) && !this.inside && !this.moth.hitAt(x, y, dir || 1, true)) {
        const struck = this.struckObject(x, y);
        if (struck?.kind === 'rock') {
          const o = struck.o;
          // Tous les rochers finissent par céder : chaque coup en arrache un
          // éclat ; les gros résistent longtemps
          if (o.type === 'boulder') {
            const k = `${o.x},${o.y}`, n = (this.chips.get(k) || 0) + 1;
            if (n >= boulderHits(o.w, o.h)) { this.chips.delete(k); this.breakRock(o, dir); return; }
            this.chips.set(k, n);
            this.chipRock(o, n, true);
            this.persist();
          }
          this.strikeRock(x, y, dir, view);
          return;
        }
        if (struck?.kind === 'tree') {
          const o = struck.o;
          // Tous les arbres finissent par tomber : les petits en deux coups,
          // les grands en bien plus (les entailles restent, comptées)
          if (o.type === 'tree') {
            const k = `${o.x},${o.y}`, n = (this.chips.get(k) || 0) + 1;
            if (n >= Math.max(2, Math.round((o.h || 10) / 4))) { this.chips.delete(k); this.fellTree(o, dir); return; }
            this.chips.set(k, n);
            this.persist();
          }
          if (o.type === 'grove') this.knockGrove();
          audio.play('wood');
          this.jolt(0.0015);
          this.shakeTree(struck.o, dir);
          this.mark(x - dir, y - 2, 1, 2, 30000);             // l'entaille dans l'écorce
          return;
        }
      }
      this.jolt(0.002);
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
      const moth = !hit && !wolf && !this.inside && this.moth.hitAt(x, y, dir || 1);
      audio.play(hit || wolf || moth ? 'flesh' : 'snow');
      if (hit) {
        this.jolt(0.004);
        this.spurt(this.foe.pos.x, this.foe.pos.y - 5, dir || 1, this.foe.alive ? 18 : 30);
        if (!this.foe.alive) this.pool(this.foe.pos.x, this.foe.pos.y);
      }
      if (wolf) {
        audio.play('yelp');
        this.jolt(0.003);
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
      if (hp >= this.maxHp || Math.random() > dt * (this.maxHp - hp) * 2.2) return;
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
      this.jolt(0.005);
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
      // Vaïne se penche sur le corps : une ligne, chaque fois une autre
      const vanth = SCENARIOS.find(x => x.id === 'vanth').lignes;
      const body = { x: this.pos.x, y: this.pos.y - 8 };
      this.talk.say([{ who: 'vanth', name: speakerName('vanth'), text: vanth[this.deaths % vanth.length][1], at: () => body }], { interrupt: true });
      this.deaths++;
      // (le noir se referme, puis on se relève : main.js, `onDeath`)
      this.time.delayedCall(2600, () => onDeath(() => this.respawn()));
    }

    // On se relève près de la barque, la partie reprend ; les chapitres
    // s'inscriront de nouveau
    respawn() {
      const cam = this.cameras.main;
      this.dead = false;
      this.hp = this.maxHp;
      this.player.setTexture('viking', 'side-idle').setOrigin(ORIGIN_X, ORIGIN_Y).setFlipX(false);
      this.cape.setVisible(true);
      this.foe.reset();
      this.pack.reset();
      this.moth.reset();
      this.climb = null; this.torchOut = 0;
      // (tombé dans une pièce : la maison en feu)
      if (this.inside === 'sno4') this.showSno4(false);
      if (this.inside) {
        const I = INTERIORS[this.inside];
        I.image.setVisible(false); I.black.setVisible(false); I.armed = false;
        this.chest.setVisible(false); this.throne.setVisible(false); this.nail.setVisible(false);
        this.inside = null;
      }
      this.pos = { ...this.spawn };
      this.facing = 'side'; this.flip = false;
      this.placePlayer();
      cam.centerOn(this.spawn.x, this.spawn.y);
      this.updateChunks(true);
      this.chapters.clear();
      this.calm = 0;
      this.persist();
    }

    // La boucle : la logique avance par pas fixes de 1/60 s (les loups, les
    // coups, la marche se jouent pareil à 8 ou à 144 images par seconde), et
    // chaque image dessine l'état interpolé entre les deux derniers pas
    update(time, delta) {
      const dt = Math.min(MAX_FRAME, delta / 1000);
      // (l'horloge du jeu, en ms : celle des marques dans la neige)
      this.clock = (this.clock || 0) + dt * 1000;
      this.acc = (this.acc || 0) + dt;
      while (this.acc >= STEP) { this.acc -= STEP; this.tick(STEP); }
      this.frame(time, dt, this.acc / STEP);
    }

    // ── Un pas de logique ──
    tick(dt) {
      // (là où l'on était au pas précédent : le rendu interpole depuis là)
      this.prevPos = { x: this.pos.x, y: this.pos.y };
      if (this.rowing) this.rowboat.prev = { x: this.rowboat.x, y: this.rowboat.y };
      if (isPaused() || this.dead) { this.keys.clear(); this.pad = { x: 0, y: 0, run: false }; }
      // (le temps passé à jouer depuis l'arrivée ; quelques images pour poser la scène)
      else this.calm = (this.calm || 0) + dt;
      if (!isPaused()) this.talk.update(dt);
      this.seenClock = (this.seenClock || 0) - dt;
      if (this.seenClock <= 0) { this.seenClock = 0.5; this.markSeen(); }
      this.talkClock = (this.talkClock || 0) - dt;
      if (this.talkClock <= 0) { this.talkClock = 0.25; this.checkTalk(); this.checkGoal(); }
      const lift = this.inside || this.rowing ? 0 : deckLift(this.pos.x, this.pos.y);
      this.lift = this.lift == null || Math.abs(lift - this.lift) > 30 ? lift
        : this.lift + Math.max(-1, Math.min(1, lift - this.lift)) * Math.min(Math.abs(lift - this.lift), 90 * dt);
      this.invuln = Math.max(0, this.invuln - dt);
      this.torchOut = Math.max(0, (this.torchOut || 0) - dt);
      // Hors du combat, les blessures se referment peu à peu
      if (this.hp < this.maxHp && !this.dead && !(this.foe.engaged && this.foe.alive) && !this.pack.engaged) {
        this.healClock = (this.healClock || 0) + dt;
        if (this.healClock > TUNE.guerison) { this.healClock = 0; this.hp++; }
      } else this.healClock = 0;
      let mx = 0, my = 0;
      for (const code of this.keys) if (MOVE_CODES[code]) { mx += MOVE_CODES[code][0]; my += MOVE_CODES[code][1]; }
      mx += this.pad.x; my += this.pad.y;
      if (!isPaused()) this.checkVoyage(mx, my, dt);
      if (!isPaused()) this.checkVeve(dt);
      this.updateSnow(dt);
      this.updateAction(dt);
      if (this.ridden > 0 && !isPaused()) {
        this.ridden -= dt;
        const k = this.clock / 1000;
        // (le pas du Gisant : il tangue, s'arrête, repart)
        if (mx || my) mx += Math.sin(k * 7) * 0.9;
        else if (Math.sin(k * 1.3) > 0.4) mx = Math.sin(k * 5) * 0.5;
      }
      // À bout de souffle, on ne court plus, même Maj tenue, tant que
      // l'endurance n'est pas un peu revenue (elle revient au pas)
      if (this.stamina <= 0.02 && !this.winded) { this.winded = true; this.staminaFlash = 0.6; }
      else if (this.stamina >= STAMINA.second) this.winded = false;
      this.running = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.pad.run) && !this.winded;
      this.moved = !!(mx || my) && !this.attacking && !this.dead;
      this.updateStamina(dt);
      this.updateCharge(dt);

      if (this.rowing) this.row(mx, my, dt);
      else if (this.climb) { if (!this.dead) this.climbStep(mx, my, dt); }
      else if (!this.attacking && !this.dead) {
        if (mx || my) {
          const len = Math.hypot(mx, my);
          const step = TUNE.kariVitesse * (this.running ? TUNE.kariCourse : 1) * SNOW_SPEED[this.snowLevel || 0] * dt;
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
          this.checkLedge(mx, my);
          if (this.inside === 'crypt' && my < 0 && !this.chestOpen && this.nearChest()) this.openChest();
          if (this.inside === 'cave' && !this.kingBowed && this.nearKing()) this.bowKing();
          this.drip(this.pos.x, this.pos.y, dt, this.hp);
          // (la distance marchée, pas le temps passé à pousser contre un tronc)
          this.distance += Math.hypot(this.pos.x - x, this.pos.y - y);

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
      this.foe.update(dt, this, this.cape.frame.name);
      if (this.foe.alive && this.foe.state === 'engage') this.drip(this.foe.pos.x, this.foe.pos.y, dt, this.foe.hp);
      if (!this.inside) this.pack.update(dt, this);
      const tp = this.torchPoint();
      this.moth.update(dt, { px: this.pos.x, py: this.pos.y, tx: tp.x, ty: tp.y, lit: this.torchOn > 0.5 && !this.torchOut, away: !!this.inside || this.dead || this.rowing || isPaused() });
      this.updateRockfall(dt);
    }

    // ── Une image : ce qu'on voit, à l'instant `alpha` entre deux pas ──
    frame(time, dt, alpha) {
      // La vie, pour l'interface (à un point, l'écran rougit)
      const life = this.dead ? 0 : this.hp;
      if (life !== this.lastLife) { this.lastLife = life; onHealth(life); }
      this.settle = Math.max(0, (this.settle || 0) - 1);
      this.updateBoat(dt, time);
      this.updateWaves(dt, time);
      this.updateSno4(dt, time);
      // Le vent qu'on entend suit celui qu'on voit ; à l'abri, il s'étouffe
      this.windSound = (this.windSound || 0) - dt * 1000;
      if (this.windSound <= 0) {
        this.windSound = 200;
        audio.wind(weather.wind, weather.gust, roofed(this.inside) ? 1 : this.inside ? 0 : deepForest(this.pos.x, this.pos.y) * 0.7);
        audio.fire(this.fireHeard());
        audio.setMood(this.musicMood());
      }
      if (!this.dead) this.placePlayer(alpha);
      this.updateLook(dt);
      if (this.talk.busy) {
        const cam = this.cameras.main, cv = this.game.canvas, r = cv.getBoundingClientRect(), hr = screenEl.getBoundingClientRect();
        const unit = cam.zoom * r.width / cv.width, v = cam.worldView;
        this.talk.place((x, y) => ({ x: r.left - hr.left + (x - v.x) * unit, y: r.top - hr.top + (y - v.y) * unit }), unit, hr);
      }
      if (this.rowing) this.placeRowboat(alpha);
      this.updateCape(dt * 1000);
      this.drawStamina();
      this.drawCharge();
      this.foe.render(alpha);
      if (!this.inside) this.pack.render(alpha);
      this.moth.setVisible(!this.inside);
      if (!this.inside) this.moth.render(alpha);
      const at = this.drawPos || this.pos;
      drawPips(this.playerPips, at.x, at.y - (this.lift || 0), this.hp, ((this.foe.engaged && this.foe.alive) || this.pack.engaged) && !this.dead);
      if (!this.inside) {
        const corpses = this.pack.deadList.map(w => ({ x: w.x, y: w.y, small: true }));
        if (!this.foe.alive) corpses.push(this.foe.pos);
        this.fauna.update(dt, this.pos, this.running, weather.wind, corpses);
      }
      // Devant ou derrière la maison, selon le pied de ses murs
      const front = houseFrontY(this.pos.x);
      this.house.setDepth(front == null ? HOUSE.y : this.pos.y > front ? this.pos.y - 0.5 : this.pos.y + 0.5);
      this.updateChunks();
      // Ne dessiner que ce qui est à l'écran : dans la forêt noire, des milliers
      // d'arbres sont chargés autour de la vue
      this.cullClock = (this.cullClock || 0) - dt * 1000;
      if (this.cullClock <= 0) { this.cullClock = 120; this.cull(); }
      this.swayClock = (this.swayClock || 0) - dt * 1000;
      if (this.swayClock <= 0 && !this.inside) { this.swayClock = 45; this.swayTrees(time); }
      this.updateGrove(time);
      // (les points de vie réglés dans l'atelier : pris en cours de partie)
      { const want = TUNE.kariPv + (this.given?.has('freya') ? 1 : 0); if (this.maxHp !== want) { this.maxHp = want; this.hp = Math.min(this.hp, want); } }
      this.updateHvit(dt);
      this.updateMons(dt);
      this.animateArt();
      this.updateFire(dt, time);
      this.updateRelics();
      this.chapterClock = (this.chapterClock || 0) - dt * 1000;
      if (this.chapterClock <= 0) { this.chapterClock = 400; this.checkChapters(); }
      this.updateNight(dt, time);
      this.updateSight(dt);
      this.drawSky(dt);
      this.updateGround(dt);
    }

    // ── Le cercle de vue : sa forme n'est pas définie, elle vit avec le décor ──
    // Dans chaque direction, la vue file jusqu'à ce que les arbres, les
    // rochers, les pierres, les statues la bouchent (chacun laisse passer un
    // peu de vue, les troncs bien plus que la pierre) ; la forme est lissée
    // d'un angle à l'autre, suit le décor en glissant, et une lente dérive la
    // fait respirer (la même au même endroit : elle ne tire pas au sort).
    updateSight(dt) {
      const S = sightShape, f = S.f, N = SIGHT_N;
      if (!S.rx) return;
      S.clock += dt;
      const ease = Math.min(1, dt * 2.2);
      // Les cibles, recalculées dix fois par seconde (le décor change peu)
      this.sightClock = (this.sightClock || 0) - dt;
      if (this.sightClock <= 0 || !this.sightTarget) {
        this.sightClock = 0.1;
        this.sightTarget = this.sightTarget || new Float32Array(N).fill(1);
        this.castSight(this.sightTarget);
      }
      const t = S.clock;
      for (let i = 0; i < N; i++) {
        const a = i / N * Math.PI * 2;
        // La dérive : trois ondes lentes qui ne se répètent pas
        const drift = 1 + 0.035 * Math.sin(a * 2 + t * 0.21 + 1.3) + 0.03 * Math.sin(a * 3 - t * 0.17 + 4.1) + 0.02 * Math.sin(a * 5 + t * 0.33 + 0.7) + 0.012 * Math.sin(a * 9 - t * 0.11 + 2.2);
        // (le brouillard referme la vue ; l'éclair la rouvre un instant)
        const fog = roofed(this.inside) ? 0 : weather.fog * 0.42;
        const want = Math.max(0.3, Math.min(1.04, this.sightTarget[i] * drift * (1 - fog)));
        f[i] += (want - f[i]) * ease;
      }
    }

    // La portée de la vue dans chaque direction (0,4 → 1 de l'ellipse de base)
    castSight(out) {
      const S = sightShape, N = SIGHT_N, { rx, ry } = S;
      if (this.inside || this.dead || this.climb) { out.fill(1); return; }
      const px = this.pos.x, py = this.pos.y - 3, CELL = 3;
      const reach = Math.max(rx, ry) + 8, gx0 = Math.floor(px - reach), gy0 = Math.floor(py - reach);
      const gw = Math.ceil(reach * 2 / CELL) + 1, grid = this.sightGrid && this.sightGrid.length === gw * gw ? this.sightGrid : (this.sightGrid = new Float32Array(gw * gw));
      grid.fill(0);
      const cx0 = Math.floor(px / CHUNK), cy0 = Math.floor(py / CHUNK);
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        for (const o of objectsInChunk(cx0 + i, cy0 + j)) {
          if (o.fallen || o.broken || o.type === 'iceberg' || o.type === 'rubble' || o.type === 'arch-vault') continue;
          let x0, x1, up, c;
          if (o.type === 'tree') { x0 = o.x - 3; x1 = o.x + 3; up = 6; c = 0.35; }
          else {
            const left = o.x - o.art.ax;
            x0 = left; x1 = left + o.w; up = Math.min(o.h * 0.6, o.type === 'cliff' ? 12 : 18); c = o.type === 'cliff' ? 0.9 : 0.8;
            if (o.type === 'grove') { x0 = o.x - 5; x1 = o.x + 5; c = 0.5; }
          }
          const y0 = o.y - up, y1 = o.y + 1;
          if (x1 < gx0 || x0 > gx0 + gw * CELL || y1 < gy0 || y0 > gy0 + gw * CELL) continue;
          for (let gy = Math.max(0, Math.floor((y0 - gy0) / CELL)); gy <= Math.min(gw - 1, Math.floor((y1 - gy0) / CELL)); gy++) {
            for (let gx = Math.max(0, Math.floor((x0 - gx0) / CELL)); gx <= Math.min(gw - 1, Math.floor((x1 - gx0) / CELL)); gx++) {
              if (grid[gy * gw + gx] < c) grid[gy * gw + gx] = c;
            }
          }
        }
      }
      // Les rayons : la vue file tant qu'il en reste assez
      for (let n = 0; n < N; n++) {
        const a = n / N * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const R = 1 / Math.hypot(ca / rx, sa / ry);
        let T = 1, d = 8;
        for (; d < R; d += CELL) {
          const gx = Math.floor((px + ca * d - gx0) / CELL), gy = Math.floor((py + sa * d - gy0) / CELL);
          if (gx < 0 || gy < 0 || gx >= gw || gy >= gw) break;
          const c = grid[gy * gw + gx];
          if (c) { T *= 1 - c * 0.5; if (T < 0.25) break; }
        }
        // (le décor ne mord plus qu'un quart de la vue : elle reste ellipsoïdale)
        out[n] = 0.75 + 0.25 * Math.max(0.4, Math.min(1, d / R));
      }
      // Lissée d'un angle à l'autre (quatre passes) : une ondulation douce, jamais une dent
      const tmp = this.sightTmp || (this.sightTmp = new Float32Array(N));
      for (let pass = 0; pass < 4; pass++) {
        for (let i = 0; i < N; i++) tmp[i] = (out[(i + N - 2) % N] + 2 * out[(i + N - 1) % N] + 3 * out[i] + 2 * out[(i + 1) % N] + out[(i + 2) % N]) / 9;
        out.set(tmp);
      }
    }

    // Les marques du sol pâlissent ; les tuiles retouchées repartent à la
    // carte graphique
    updateGround(dt) {
      this.fadeClock = (this.fadeClock || 0) - dt;
      if (this.fadeClock <= 0) { this.fadeClock = 0.25; ground.fade(this.clock); }
      for (const key of ground.takeDirty()) {
        const k = `chunk-${key}`;
        if (this.textures.exists(k)) this.textures.get(k).refresh();
      }
    }

    // La musique suit le moment : le lieu, la nuit, le danger
    musicMood() {
      // L'écran d'accueil : une nappe sourde et sombre, presque immobile
      if (isTitle()) return { energy: 0.08, dark: 0.85, muffled: 0.45, place: null };
      const f = this.foe, now = this.time.now;
      const dFoe = Math.hypot(f.pos.x - this.pos.x, f.pos.y - this.pos.y);
      const deep = this.inside ? 0 : deepForest(this.pos.x, this.pos.y);
      const night = this.daylight?.night || 0;
      // (le silence d'après ne vaut que pour un combat de cette partie-ci)
      if (f.alive) { this.foeSeenAlive = true; this.foeDownAt = null; } else if (this.foeSeenAlive && this.foeDownAt == null) this.foeDownAt = now;
      let energy;
      if (this.dead) energy = 0.05;                                         // on est tombé
      else if ((f.alive && f.engaged && dFoe < 140) || this.pack.engaged) energy = 1;   // le combat
      else if (this.moth.engaged) energy = 0.7;                             // le megamoth tourne autour de la flamme
      else if (f.alive && dFoe < 320) energy = 0.55 + 0.4 * (1 - dFoe / 320);   // il est là, on le sent
      else if (this.foeDownAt != null && now - this.foeDownAt < 25000) energy = 0.12;   // après : le silence
      else if (this.inside) energy = 0.15;
      else if (deep > 0.3) energy = 0.2 + 0.1 * (1 - deep);                 // la forêt noire : sourde
      else energy = 0.4 + (this.running ? 0.12 : 0) + (this.rowing ? -0.15 : 0);
      energy *= 1 - 0.25 * night;
      // Les lieux qui ont leur morceau (audio.js, `lieu`) : on y passe en fondu
      const place = this.aubeAt != null && this.clock - this.aubeAt < 240000 ? 'aube'
        : this.pack.engaged || this.pack.state === 'hunt' ? 'loups'
        : deep > 0.5 ? 'foret-noire' : null;
      return { energy, dark: Math.min(1, deep + 0.4 * night + (this.inside === 'sno4' ? 0.3 : 0)), muffled: roofed(this.inside) ? 1 : 0, place };
    }

    // Les chapitres : aux grands moments, un titre à l'écran (une fois chacun)
    checkChapters() {
      if (isPaused() || this.dead || this.moving) return;
      const { x, y } = this.pos, near = (p, d) => Math.hypot(x - p.x, y - p.y) < d;
      const seen = id => this.chapters.has(id);
      let id = null;
      if (this.inside === 'cave') id = 'roi';
      else if (this.inside === 'temple') id = 'temple';
      else if (this.inside === 'sno4') id = 'carrefour';
      else if (this.inside) id = null;
      else if (!seen('greve') && this.calm > 2.5) id = 'greve';
      else if (this.pack.engaged) id = 'loups';
      else if (this.foe.alive && this.foe.engaged) id = 'autre';
      else if (this.rowing) id = 'lac';
      else if (this.moth.engaged) id = 'megamoth';
      else if (this.climb) id = 'falaise';
      else if (this.fire != null && this.fire < FIRE.out && near(HOUSE, 220)) id = 'incendie';
      // (la falaise, après la rencontre au bout des traces)
      else if ((seen('autre') || !this.foe.alive) && x > CLIFF.x0 - 60 && x < CLIFF.x1 + 60 && y > CLIFF.y - 40 && y < CLIFF.y + 110) id = 'falaise';
      else if (near(HOUSE, 90)) id = 'maison';
      else if (this.hvit.state === 'snared' && near(this.hvit, 80)) id = 'louve';
      else if (Math.hypot(x - WOLF_DEN.x, y - WOLF_DEN.y) < WOLF_DEN.r + 30 && y < LEDGE.top.y + 6) id = 'loups';
      else if (deepForest(x, y) > 0.6) id = 'noire';
      else if (forestDensity(x, y) > 0.12) id = 'foret';
      else if (x > NECRO.x - 30 && x < NECRO.x + 260 && y > NECRO.y - 30 && y < NECRO.y + 200) id = 'morts';
      if (!id || seen(id)) return;
      this.chapters.add(id);
      this.persist();
      const ch = chapterById(id);
      // Hors des combats, la musique retient son souffle un instant
      if (id !== 'loups' && id !== 'autre') audio.hush(4);
      onChapter(ch);
    }

    // Les offrandes tournent au vent ; le guetteur s'efface quand on approche
    updateGrove(time) {
      if (Math.abs(this.pos.x - GROVE_TREE.x) > 400 || Math.abs(this.pos.y - GROVE_TREE.y) > 300) return;
      const t = time / 1000, force = Math.min(1, weather.wind / 140);
      const g = this.ropes;
      g.clear(); g.fillStyle(hex(palette.b), 1);
      for (const b of this.bundles) {
        if (b.gone) continue;
        const sway = Math.round(Math.sin(t * (1.1 + force) + b.phase) * (0.4 + 1.3 * force) + force);
        for (let k = 0; k < b.len; k++) g.fillRect(b.h.x + Math.round(sway * k / b.len), b.h.y + k, 1, 1);
        b.img.setPosition(b.h.x + sway + 0.5, b.h.y + b.len);
      }
      const w = this.watcher;
      if (!w || w.fading) return;
      // Pas pendant un combat : il attend que les loups soient partis, et
      // son silence ne tombe pas au milieu de la musique de combat
      if (this.pack.engaged || (this.foe.engaged && this.foe.alive)) return;
      if (Math.hypot(this.pos.x - WATCHER_AT.x, this.pos.y - WATCHER_AT.y) < 64 && !this.inside) {
        w.fading = true;
        this.speak('guetteur', [['hallveig', 'Pas encore.', { x: WATCHER_AT.x, y: WATCHER_AT.y - 22 }]]);
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
      // (là où le viking est dessiné, entre deux pas de logique)
      const at = this.drawPos || this.pos;
      const x = Math.round(at.x), y = Math.round(at.y - (this.lift || 0));
      if (this.rowing) return { x: x + (this.rowboat.flip ? 3 : -3), y: y - 10, behind: false };
      const dir = this.flip ? -1 : 1;
      if (this.facing === 'side') return { x: x + dir * 3, y: y - 8, behind: false };
      if (this.facing === 'front') return { x: x + 4, y: y - 7, behind: false };
      return { x: x - 4, y: y - 8, behind: true };
    }

    // Le voile de nuit : une texture posée sur la vue, multipliée sur la scène.
    // Agrandi par la caméra, il reste en pixels nets (lissé, il fondait les
    // paliers tramés du halo et des ombres)
    makeShade(w, h) {
      const visible = this.shade ? this.shade.visible : false;
      this.shade?.destroy();
      this.shade = this.add.renderTexture(0, 0, w, h).setOrigin(0, 0)
        .setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(DEPTH_SKY + 5).setVisible(visible);
      this.shade.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      return this.shade;
    }

    updateNight(dt, time) {
      // Dans la grotte, il fait toujours nuit (la torche est allumée)
      const dark = INTERIORS[this.inside]?.dark, night = dark ? 1 : this.daylight?.night || 0, t = time / 1000;
      // (le megamoth l'a soufflée : elle se rallume après quelques secondes)
      const want = night > 0.4 && !this.dead && !this.torchOut ? 1 : 0;
      this.torchOn += (want - this.torchOn) * Math.min(1, dt * 1.5);
      if (Math.abs(this.torchOn - want) < 0.01) this.torchOn = want;
      const lit = this.torchOn * night;
      const flick = 1 + 0.07 * Math.sin(t * 11) * Math.sin(t * 5.3 + 1) + 0.03 * Math.sin(t * 23);
      const tp = this.torchPoint();
      // Le voile de nuit, percé autour de la torche
      const v = this.cameras.main.worldView;
      let rt = this.shade;
      // L'éclair ouvre la nuit un instant (dehors)
      const veil = night * (dark ? 0.72 : 0.62) * (roofed(this.inside) ? 1 : 1 - 0.85 * weather.flash);
      // En plein jour, le voile est vide : on ne le touche pas (il coûte cher)
      rt.setVisible(veil > 0.005);
      if (veil > 0.005) {
        // Le voile couvre la vue, à peine plus : le remplir coûte cher
        const w = Math.ceil(v.width) + 64, h = Math.ceil(v.height) + 64;
        // (recréé à la bonne taille : `resize` ne redimensionne pas sa surface de
        // dessin, le voile restait rempli dans son coin et le trou de la torche,
        // hors de ce coin, ne se voyait pas)
        if (Math.abs(rt.width - w) > 16 || Math.abs(rt.height - h) > 16 || rt.width < w || rt.height < h) rt = this.makeShade(w + 32, h + 32);
        rt.setPosition(Math.floor(v.x) - 32, Math.floor(v.y) - 32);
        rt.clear();
        rt.fill(hex(palette.b), veil);
        if (lit > 0.01) {
          // Centrée sur le viking (pas sur la main : elle sauterait quand il
          // se retourne) ; la flamme vacille en intensité, pas en taille
          // (changer de taille rebattait toute la trame)
          const at = this.drawPos || this.pos;
          const lx = Math.round(at.x), ly = tp.y + 4, src = this.textures.get('torchlight-0-0').source[0];
          const ox = ((lx - src.width / 2) % 4 + 4) % 4, oy = ((ly - src.height / 2) % 4 + 4) % 4;
          const glow = 0.9 + 0.1 * Math.max(0, Math.min(1, (flick - 0.9) / 0.2));
          this.lightStamp.setTexture(`torchlight-${ox}-${oy}`).setPosition(lx - rt.x, ly - rt.y).setAlpha(Math.min(1, this.torchOn * 1.1) * glow);
          rt.erase(this.lightStamp);
          // Là où un obstacle arrête la lumière, la nuit revient : jamais plus
          // sombre qu'hors du halo
          this.shadows.setAlpha(veil);
          rt.draw(this.shadows, -rt.x, -rt.y);
        }
        // L'incendie ouvre la nuit autour de la maison (ou, dedans, autour du bûcher)
        const fl = this.fireLevel || 0, room = this.inside === 'house';
        if (fl > 0.01 && (!this.inside || room)) {
          const R = INTERIORS.house.at;
          const fx = room ? R.x + PYRE.x : HOUSE.x, fy = room ? R.y + PYRE.y : HOUSE.y - 14;
          // (dans la pièce, une lumière de la taille de la torche ; la trame reste accrochée au monde)
          const kind = room ? 'torchlight' : 'firelight', src = this.textures.get(`${kind}-0-0`).source[0];
          if (fx > v.x - src.width && fx < v.right + src.width && fy > v.y - src.height && fy < v.bottom + src.height) {
            const ox = ((Math.round(fx - src.width / 2) % 4) + 4) % 4, oy = ((Math.round(fy - src.height / 2) % 4) + 4) % 4;
            this.fireStamp.setTexture(`${kind}-${ox}-${oy}`).setPosition(Math.round(fx) - rt.x, Math.round(fy) - rt.y)
              .setAlpha(Math.min(1, fl * (0.88 + 0.12 * flick)));
            rt.erase(this.fireStamp);
          }
        }
      }
      // L'étrave du grand navire de pierres luit à peine, la nuit, tant qu'on n'y
      // a pas posé la main (l'indice du pas des morts)
      if (rt.visible && !this.inside && !this.passage) {
        const fx = PASSAGE_AT.x, fy = PASSAGE_AT.y - 3, src = this.textures.get('torchlight-0-0').source[0];
        if (fx > v.x - src.width && fx < v.right + src.width && fy > v.y - src.height && fy < v.bottom + src.height) {
          const ox = ((Math.round(fx - src.width / 2) % 4) + 4) % 4, oy = ((Math.round(fy - src.height / 2) % 4) + 4) % 4;
          this.objStamp.setTexture(`torchlight-${ox}-${oy}`).setPosition(Math.round(fx) - rt.x, Math.round(fy) - rt.y)
            .setAlpha(0.28 + 0.14 * (0.5 + 0.5 * Math.sin(t * 1.3)));
          rt.erase(this.objStamp);
        }
      }
      // Les objets posés qui éclairent (une lanterne…) : la nuit s'ouvre autour
      if (rt.visible && !this.inside) {
        for (const o of [...this.placed, ...this.artProps]) {
          const L = o.props.light;
          if (!L || !o.img.visible) continue;
          const fx = o.x0 + L.x, fy = o.top + L.y, kind = L.big ? 'firelight' : 'torchlight', src = this.textures.get(`${kind}-0-0`).source[0];
          if (fx < v.x - src.width || fx > v.right + src.width || fy < v.y - src.height || fy > v.bottom + src.height) continue;
          const ox = ((Math.round(fx - src.width / 2) % 4) + 4) % 4, oy = ((Math.round(fy - src.height / 2) % 4) + 4) % 4;
          this.objStamp.setTexture(`${kind}-${ox}-${oy}`).setPosition(Math.round(fx) - rt.x, Math.round(fy) - rt.y)
            .setAlpha(Math.min(1, 0.85 + 0.15 * flick * (0.9 + 0.1 * Math.sin(t * 3 + o.x))));
          rt.erase(this.objStamp);
        }
      }
      // Sur SNO 4, la forge de Ferraud ouvre la nuit autour d'elle
      if (this.inside === 'sno4' && rt.visible) {
        const A = INTERIORS.sno4.at, F = SNO4_AT.forge, src = this.textures.get('firelight-0-0').source[0];
        const fx = A.x + F.x, fy = A.y + F.y - 4;
        if (fx > v.x - src.width && fx < v.right + src.width && fy > v.y - src.height && fy < v.bottom + src.height) {
          const ox = ((Math.round(fx - src.width / 2) % 4) + 4) % 4, oy = ((Math.round(fy - src.height / 2) % 4) + 4) % 4;
          this.fireStamp.setTexture(`firelight-${ox}-${oy}`).setPosition(Math.round(fx) - rt.x, Math.round(fy) - rt.y).setAlpha(0.75 + 0.2 * flick);
          rt.erase(this.fireStamp);
        }
      }
      this.glow.setPosition(tp.x, tp.y + 3).setScale(0.55, 0.38).setAlpha(0.1 * lit * flick);
      this.fireGlow.setAlpha(this.inside ? 0 : 0.14 * (this.fireLevel || 0) * flick);
      // La flamme : un manche sombre, un cœur clair, des langues rouges
      const g = this.flame;
      g.clear();
      if (this.torchOn > 0.05 && !this.dead) {
        g.setDepth(this.baseDepth() + (tp.behind ? -0.02 : 0.02));
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
      const lx = tp.x, ly = this.pos.y - (this.lift || 0) + 1, R = 90;
      // Les pixels d'ombre, par paliers (comme le halo de la torche)
      let alpha = -1;
      const put = (px, py, a) => { if (a !== alpha) { alpha = a; sg.fillStyle(hex(palette.b), a); } sg.fillRect(px, py, 1, 1); };
      const cast = (x, y, half, len) => castShadow(put, x, y, lx, ly, half, len, R);
      // Sa propre ombre : courte, du côté opposé à la torche
      if (!this.rowing) cast(this.pos.x, this.pos.y - (this.lift || 0) + 0.5, 1.5, 5);
      if (this.inside) return;
      if (this.foe.alive && Math.hypot(this.foe.pos.x - lx, this.foe.pos.y - ly) < R) cast(this.foe.pos.x, this.foe.pos.y, 1.5, 8);
      const cx = Math.floor(this.pos.x / CHUNK), cy = Math.floor(this.pos.y / CHUNK);
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        for (const o of objectsInChunk(cx + i, cy + j)) {
          if (o.type === 'iceberg' || o.type === 'cliff' || o.type === 'rubble' || o.noShadow || o.fallen || o.broken) continue;
          // Pas d'ombre sans l'objet : seulement s'il est dessiné (un morceau pas
          // encore chargé, un arbre abattu pas encore relu de la sauvegarde…)
          if (!(o.img?.scene && (o.img.visible || o.chipImg?.visible))) continue;
          if (Math.abs(o.x - lx) > R || Math.abs(o.y - ly) > R) continue;
          const d = Math.max(4, Math.hypot(o.x - lx, o.y - ly));
          if (o.type === 'tree') cast(o.x, o.y, 1.2, Math.max(5, Math.min(40, (o.h || 10) * 18 / d)));
          else {
            // Rochers, cairns, statues : l'ombre part de leur base, d'un coin
            // inférieur à l'autre
            const left = o.x - (o.art?.ax || 0), b = o.art ? artBase(o.art) : { x0: 0, x1: o.w || 6 };
            castShadowBase(put, left + b.x0, left + b.x1, o.y + 1 - b.dy, lx, ly, Math.max(4, Math.min(14, (o.h || 8) * 9 / d)), R);
          }
        }
      }
      // Les objets posés dans l'atelier qui portent une ombre
      for (const o of [...this.placed, ...this.artProps]) {
        if (!o.props.shadow || !o.img.visible || Math.abs(o.x - lx) > R || Math.abs(o.y - ly) > R) continue;
        const d = Math.max(4, Math.hypot(o.x - lx, o.y - ly)), b = artBase({ rows: o.rows, ax: 0 });
        castShadowBase(put, o.x0 + b.x0, o.x0 + b.x1, o.y + 1 - b.dy, lx, ly, Math.max(4, Math.min(14, o.h * 9 / d)), R);
      }
    }

    // ── La maison : on entre par la porte, on ressort par la porte ──
    checkDoor(mx, my) {
      if (this.moving) return;
      if (!this.inside) {
        for (const [key, I] of Object.entries(INTERIORS)) {
          if (I.byBoat) continue;
          // (la maison brûle, ou n'est plus qu'une ruine : on n'y entre plus)
          if (key === 'house' && this.fire != null) continue;
          // (le temple : scellé tant que Tavé n'a pas le sceau)
          if (key === 'temple' && !this.templeOpen) continue;
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
      cam.fadeOut(260, 31, 42, 68);
      cam.once('camerafadeoutcomplete', () => {
        this.pos = { x, y };
        this.climb = null;
        then();
        this.placePlayer();
        cam.centerOn(x, y);
        this.updateChunks(true);
        cam.fadeIn(320, 31, 42, 68);
        this.moving = false;
      });
    }

    goInside(key) {
      const I = INTERIORS[key];
      this.talk.clear();
      this.teleport(I.at.x + I.entry.x, I.at.y + I.entry.y, () => {
        this.inside = key;
        I.image.setVisible(true); I.black.setVisible(true);
        if (key === 'crypt') this.chest.setVisible(true);
        if (key === 'cave') this.throne.setVisible(true);
        if (key === 'temple') this.nail.setVisible(true);
        this.facing = I.enterFacing; this.flip = false; this.player.setFlipX(false);
        this.player.setFrame(`${this.facing}-idle`);
      });
    }

    goOutside() {
      const I = INTERIORS[this.inside];
      this.talk.clear();
      this.teleport(I.exit.x, I.exit.y, () => {
        this.inside = null;
        I.armed = false;
        I.image.setVisible(false); I.black.setVisible(false);
        this.chest.setVisible(false);
        this.throne.setVisible(false);
        this.nail.setVisible(false);
        this.facing = 'front'; this.flip = false;
      });
    }

    // ── Les reliques ──
    // (un dessin de largeur paire se pose sur un bord de pixel, pas au milieu)
    dropX(x) { return Math.round(x) + (RELIC_GROUND_SIZE.w % 2 ? 0.5 : 0); }

    spawnDrop(id, x, y, where) {
      const img = this.add.image(this.dropX(x), Math.round(y), relicGround(id)).setOrigin(0.5, 1).setVisible(false);
      const d = { id, x, y, where, img, ready: true };
      img.setDepth(where ? DEPTH_ROOM + y : y + 1);
      this.drops.push(d);
      return d;
    }

    // Une relique tombe de `from` jusqu'à `to` (elle y reste jusqu'à ce qu'on la ramasse)
    dropRelic(id, from, to, where, sound) {
      if (this.relics.has(id) || this.relicDrops[id]) return;
      this.relicDrops[id] = { x: Math.round(to.x), y: Math.round(to.y), where };
      // (pas de chute si elle était déjà tombée avant le chargement : elle est simplement là)
      if (!from) { this.spawnDrop(id, to.x, to.y, where); this.persist(); return; }
      const d = this.spawnDrop(id, from.x, from.y, where);
      // (on la ramasse là où elle tombe, pas là d'où elle part : le rubis partait
      // de la poitrine du roi, hors d'atteinte)
      d.x = Math.round(to.x); d.y = Math.round(to.y);
      d.ready = false;
      d.img.setDepth(where ? DEPTH_ROOM + to.y + 1 : to.y + 1);
      audio.play(sound);
      this.tweens.add({ targets: d.img, x: this.dropX(to.x), duration: 480, ease: 'Quad.easeOut' });
      this.tweens.add({ targets: d.img, y: Math.round(to.y), duration: 480, ease: 'Bounce.easeOut', onComplete: () => { d.ready = true; } });
      this.persist();
    }

    // La poupée pendue à l'arbre sacré tombe quand on le frappe
    knockGrove() {
      const b = this.poupeeBundle;
      if (!b || b.gone || this.relics.has('poupee') || this.relicDrops.poupee) return;
      b.gone = true; b.img.setVisible(false);
      const at = nearestWalkable(GROVE_TREE.x + 9, GROVE_TREE.y + 7) || { x: GROVE_TREE.x + 9, y: GROVE_TREE.y + 7 };
      this.dropRelic('poupee', { x: b.img.x, y: b.img.y + 8 }, at, null, 'wood');
    }

    // Le roi mort, frappé sur son trône : étincelles, la lame rebondit, et son rubis roule à terre
    knockKing(x, y, dir, view) {
      const V = INTERIORS.cave.at, lx = x - V.x, ly = y - V.y;
      if (Math.abs(lx - THRONE.x) > 30 || ly > THRONE.y + 4 || ly < THRONE.y - 40) return false;
      this.strikeRock(x, y, dir, view);
      if (!this.relics.has('rubis') && !this.relicDrops.rubis) {
        let spot = { x: THRONE.x + 6, y: THRONE.y + 8 };
        search: for (let r = 0; r < 18; r++) for (const [dx, dy] of [[9, 6], [-9, 6], [0, 9]]) {
          const px = THRONE.x + dx + Math.sign(dx || 1) * r * 0.4, py = THRONE.y + dy + r * 0.5;
          if (caveWalkable(px, py)) { spot = { x: Math.round(px), y: Math.round(py) }; break search; }
        }
        this.dropRelic('rubis', { x: V.x + THRONE.x + 2, y: V.y + THRONE.y - 24 }, { x: V.x + spot.x, y: V.y + spot.y }, 'cave', 'clang');
      }
      return true;
    }

    // Le point praticable le plus proche d'un corps, pour y poser ce qui en tombe
    bodySpot(x, y) {
      const spot = nearestWalkable(Math.round(x + 5), Math.round(y + 3));
      return spot || { x: Math.round(x), y: Math.round(y) };
    }

    // Les reliques qui tombent d'un corps (l'autre viking, le premier loup), y compris
    // quand c'était déjà fait avant le chargement de la partie
    checkBodyRelics() {
      const was = this.bodiesAtLoad || (this.bodiesAtLoad = { foe: !this.foe.alive, wolf: this.pack.deadList.length > 0, chest: this.chestOpen, moth: !!this.mothDead, ruin: this.fire != null && this.fire >= FIRE.collapse });
      // Le megamoth abattu : une écaille de son aile
      const md = MOTH_ENABLED && this.mothDead;
      if (md && !this.relics.has('ecaille') && !this.relicDrops.ecaille) {
        this.dropRelic('ecaille', was.moth ? null : { x: md.x, y: md.y - 4 }, this.bodySpot(md.x, md.y), null, 'snow');
      }
      // La maison effondrée : dans les cendres, devant la porte, la boucle du compagnon
      if (this.fire != null && this.fire >= FIRE.collapse && !this.relics.has('boucle') && !this.relicDrops.boucle) {
        const spot = nearestWalkable(HOUSE_DOOR_OUT.x + 4, HOUSE_DOOR_OUT.y + 7) || { x: HOUSE_DOOR_OUT.x, y: HOUSE_DOOR_OUT.y + 8 };
        this.dropRelic('boucle', was.ruin ? null : { x: HOUSE.x - 8, y: HOUSE.y - 14 }, spot, null, 'clang');
      }
      if (!this.foe.alive && !this.relics.has('viking') && !this.relicDrops.viking && !this.dead) {
        const p = this.foe.pos;
        this.dropRelic('viking', was.foe ? null : { x: p.x, y: p.y - 5 }, this.bodySpot(p.x, p.y), null, 'clang');
      }
      const w = this.pack.deadList[0];
      if (w && !this.relics.has('loup') && !this.relicDrops.loup) {
        this.dropRelic('loup', was.wolf ? null : { x: w.x, y: w.y - 3 }, this.bodySpot(w.x, w.y), null, 'clang');
      }
      // Le coffre de la crypte, ouvert (et son sceau pas encore pris)
      if (this.chestOpen && !this.chestBusy && !this.relics.has('sceau') && !this.relicDrops.sceau) {
        const C = INTERIORS.crypt.at;
        let spot = { x: CHEST.x, y: CHEST.y + 9 };
        search: for (let r = 7; r < 20; r++) for (const dx of [0, -8, 8]) if (cryptWalkable(CHEST.x + dx, CHEST.y + r)) { spot = { x: CHEST.x + dx, y: CHEST.y + r }; break search; }
        this.dropRelic('sceau', was.chest ? null : { x: this.chest.x, y: this.chest.y - 6 }, { x: C.x + spot.x, y: C.y + spot.y }, 'crypt', 'clang');
      }
    }

    // Les reliques à terre se montrent là où l'on est ; on les ramasse en marchant dessus
    updateRelics() {
      this.checkBodyRelics();
      const here = this.inside || null;
      for (const d of this.drops) {
        if (d.taken) continue;
        d.img.setVisible(d.where === here);
        if (!d.ready || d.where !== here || this.dead || this.rowing) continue;
        if (Math.hypot(this.pos.x - d.x, this.pos.y - d.y) < 10) this.collectRelic(d);
      }
    }

    collectRelic(d) {
      d.taken = true; d.ready = false;
      this.relics.add(d.id);
      delete this.relicDrops[d.id];
      // (au premier crochet libre de la ceinture)
      const hook = this.belt.indexOf(null);
      if (hook >= 0 && !this.belt.includes(d.id)) this.belt[hook] = d.id;
      audio.play('clang');
      this.tweens.add({ targets: d.img, y: d.img.y - 10, alpha: 0, duration: 520, ease: 'Quad.easeOut', onComplete: () => d.img.destroy() });
      this.persist();
      onRelic(d.id, [...this.relics]);
    }

    // La ceinture : un id ou rien par crochet ; ce qui a été trouvé y pend
    // toujours (une ancienne partie sans ceinture : au premier crochet libre)
    normalBelt(saved) {
      const seen = new Set();
      const belt = Array.from({ length: BELT_SLOTS }, (_, i) => {
        const id = Array.isArray(saved) ? saved[i] : null;
        if (!id || seen.has(id) || !relicById(id) || !this.relics.has(id) || this.isGiven(id)) return null;
        seen.add(id);
        return id;
      });
      for (const id of this.relics) if (!seen.has(id) && relicById(id) && !this.isGiven(id)) { const i = belt.indexOf(null); if (i >= 0) { belt[i] = id; seen.add(id); } }
      return belt;
    }

    // ── L'incendie : le bûcher du compagnon, la maison qui brûle ──
    nearBody() {
      const H = INTERIORS.house.at;
      return nearPyre(this.pos.x - H.x, this.pos.y - H.y);
    }

    // Il met le feu au corps : la torche, la paille, le plancher
    // La carte : les cases autour du viking (dans un intérieur, sa porte)
    markSeen() {
      if (this.inside === 'sno4') {
        // (SNO 4 a sa propre carte, en coordonnées de sa scène)
        const A = INTERIORS.sno4.at, lx = this.pos.x - A.x, ly = this.pos.y - A.y, R = SEEN_R * (1 - 0.35 * weather.fog);
        for (let r = 0; r < SEEN4_ROWS; r++) for (let c = 0; c < SEEN4_COLS; c++) {
          if (Math.hypot((c + 0.5) * SEEN4_CELL - lx, (r + 0.5) * SEEN4_CELL - ly) < R) this.seen4[r * SEEN4_COLS + c] = 1;
        }
        return;
      }
      const at = this.inside ? INTERIORS[this.inside].door : this.pos;
      const R = this.inside ? 40 : SEEN_R * (1 - 0.35 * weather.fog);
      const c0 = Math.floor((at.x - R) / SEEN_CELL), c1 = Math.floor((at.x + R) / SEEN_CELL);
      const r0 = Math.floor((at.y - R) / SEEN_CELL), r1 = Math.floor((at.y + R) / SEEN_CELL);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        if (c < 0 || r < 0 || c >= SEEN_N || r >= SEEN_N) continue;
        if (Math.hypot((c + 0.5) * SEEN_CELL - at.x, (r + 0.5) * SEEN_CELL - at.y) < R) this.seen[r * SEEN_N + c] = 1;
      }
    }

    // ── La touche d'action (E) : ce qu'on peut faire ici, le plus proche d'abord ──
    actionTarget() {
      if (this.dead || this.moving || this.voyaging || this.rowing || this.climb) return null;
      const P = this.pos, d = o => Math.hypot(P.x - o.x, P.y - o.y);
      if (this.inside === 'crypt' && !this.chestOpen && this.nearChest()) return { label: 'Ouvrir le coffre', run: () => this.openChest() };
      if (this.inside === 'house' && this.fire == null && !this.foe.alive && this.nearBody()) return { label: 'Mettre le feu au bûcher', run: () => this.lightPyre() };
      // Le clou à l'envers, au mur des ans
      if (this.inside === 'temple' && !this.aube) {
        const T = INTERIORS.temple.at;
        if (nearNail(P.x - T.x, P.y - T.y)) return { label: 'Arracher le clou', run: () => this.pullNail() };
      }
      // Le grand navire de pierres de la plaine des morts : le pas des morts
      if (!this.inside && !this.passage && d(PASSAGE_AT) < 24) return { label: 'Poser la main sur l\'étrave', run: () => this.takePassage() };
      // Les cubes (sur SNO 7, et ceux de SNO 4 dans sa scène)
      {
        const A = this.inside === 'sno4' ? INTERIORS.sno4.at : null;
        const list = this.inside === 'sno4' ? SNO4_CUBES.map(c => ({ ...c, x: A.x + c.x, y: A.y + c.y })) : this.inside ? [] : this.cubes;
        // (près du losange de son pied, de n'importe quel côté)
        for (const c of list) if (Math.abs(P.x - c.x) / 29 + Math.abs(P.y - (c.y - 14.5)) / 14.5 < 1.8) return { label: `Toucher le cube ${c.kind}`, run: () => this.touchCube(c) };
      }
      // Sigrún : la glace, la torche éteinte au poing
      if (!this.inside && !this.sigrunFree && d(this.sigrun) < 16) {
        const lit = this.torchOn > 0.5 && !this.torchOut;
        return lit ? { label: 'Allumer ta torche à la sienne', run: () => this.freeSigrun() }
          : { label: 'Toucher la glace', run: () => this.talk.say([{ who: 'kari', name: speakerName('kari'), text: 'Froide. Il faudrait une flamme.', at: () => this.heroHead() }], { interrupt: true }) };
      }
      // La louve blanche, la patte prise
      if (!this.inside && this.hvit.state === 'snared' && d(this.hvit) < 18 && !this.pack.engaged) return { label: 'Défaire le collet', run: () => this.freeHvit() };
      if (this.inside === 'cave' && this.nearKing()) return { label: 'Parler au roi', run: () => this.talkTo('kingvi', () => ({ x: INTERIORS.cave.at.x + THRONE.x, y: INTERIORS.cave.at.y + THRONE.y - 70 })) };
      // La barque : vers SNO 4, ou le retour
      if (this.inside === 'sno4') {
        const A = INTERIORS.sno4.at;
        if (nearSno4Boat(P.x - A.x, P.y - A.y)) return { label: 'Reprendre la barque, vers SNO 7', run: () => this.voyage('sno7') };
      } else if (!this.inside && d({ x: this.boatRest.x + BOAT_W / 2, y: this.boatRest.y + BOAT_H - 4 }) < 46) {
        return { label: 'Prendre la barque, vers SNO 4', run: () => this.voyage('sno4') };
      }
      // Les gens : le plus proche, à portée de voix
      const people = [];
      if (!this.inside && this.tages) people.push(['tages', this.tages, 9]);
      if (!this.inside && d(STATUE_BASE) < 90) people.push(['freya', { x: STATUE_BASE.x, y: STATUE_BASE.y }, 40, 90]);
      if (!this.inside && this.foe.alive && !this.foe.engaged) people.push(['thorgrim', this.foe.pos, 11]);
      if (!this.inside && this.mons?.shown) people.push(['mons', this.mons, 30, 40]);
      if (this.inside === 'sno4' && this.sno4People) {
        for (const [id, w] of Object.entries(this.sno4People)) if (!(id === 'eyvind' && this.given.has('kalfou'))) people.push([id, w, id === 'kalfou' ? 24 : id === 'damballah' ? 5 : 11, id === 'kalfou' ? 34 : 24]);
        if (!this.clotildeFree) people.push(['clotilde', this.clotilde, 11]);
      }
      let best = null;
      for (const [id, at, up, reach = 24] of people) {
        const dist = d(at);
        if (dist < reach && (!best || dist < best.dist)) best = { id, at, up, dist };
      }
      if (best) {
        const head = () => ({ x: best.at.x, y: best.at.y - best.up });
        // Une relique qu'il attend pend à la ceinture : on peut la lui donner
        const don = PERSON[best.id]?.veut?.don;
        if (don && !this.given.has(best.id) && this.belt.includes(don.relique)) {
          const name = relicById(don.relique).name;
          return { label: `Donner ${name[0].toLowerCase() + name.slice(1)}`, run: () => this.give(best.id, head) };
        }
        // (« à Le mons » → « au mons », « à Les… » → « aux… »)
        const who = speakerName(best.id).replace(/^Le /, 'au ').replace(/^Les /, 'aux ').replace(/^(?!au |aux )/, 'à ');
        return { label: `Parler ${who}`, run: () => this.talkTo(best.id, head) };
      }
      return null;
    }
    isGiven(relic) { for (const r of this.given?.values() || []) if (r === relic) return true; return false; }
    // Donner : la relique quitte la ceinture, il dit ce qu'il en fait, et ça agit
    give(id, head) {
      const don = PERSON[id].veut.don;
      this.met.add(id);
      this.given.set(id, don.relique);
      const slot = this.belt.indexOf(don.relique);
      if (slot >= 0) this.belt[slot] = null;
      const W = this.sno4People, at = who => who === id ? head : who === 'kari' ? () => this.heroHead() : W?.[who] ? () => ({ x: W[who].x, y: W[who].y - 11 }) : head;
      this.talk.say(don.lignes.map(([who, text]) => ({ who, name: speakerName(who), text, at: at(who) })), { interrupt: true });
      audio.play('presence');
      if (don.effet === 'garde') {
        // Véla : un point de vie de plus, pour toujours, et les blessures refermées
        this.maxHp = TUNE.kariPv + 1; this.hp = this.maxHp;
      } else if (don.effet === 'temple') {
        // Tavé : la dalle glisse, les marches descendent dans le noir
        this.time.delayedCall(2400, () => {
          this.templeOpen = true;
          audio.play('clang'); audio.play('snow');
          this.jolt(0.003);
          this.templeDoor.setTexture('temple-stairs');
          this.persist();
        });
      } else if (don.effet === 'griffe') {
        // Le mons : il arrache une griffe et la jette aux pieds de Kári
        const M = this.mons, to = nearestWalkable(Math.round(this.pos.x + (M.x < this.pos.x ? 6 : -6)), Math.round(this.pos.y + 4)) || this.pos;
        this.time.delayedCall(4200, () => { audio.play('flesh'); this.dropRelic('griffe', { x: M.x, y: M.y - 18 }, to, null, 'clang'); });
      } else if (don.effet === 'passage' && W?.eyvind) {
        // Croisée : l'âme d'Eyvind passe
        this.time.delayedCall(7000, () => this.tweens.add({ targets: W.eyvind.img, alpha: 0, y: W.eyvind.img.y - 12, duration: 3000, onComplete: () => W.eyvind.img.setVisible(false) }));
      }
      this.persist();
    }

    // ── Sigrún : la glace se fend, fond, et elle s'en va avec celle qui vient chercher les morts ──
    freeSigrun() {
      if (this.sigrunFree) return;
      this.sigrunFree = true;
      this.met.add('sigrun');
      const S = this.sigrun, ice = this.ice;
      audio.play('clang');
      const steps = [['crack', 0], ['melt1', 1600], ['melt2', 3200], ['gone', 4800]];
      for (const [k, t] of steps) this.time.delayedCall(t, () => { ice.setTexture(`glace-${k}`); audio.play('snow'); });
      // Elle, debout dans la flaque, puis plus rien
      this.time.delayedCall(4800, () => {
        const img = this.personImage('sigrun', S.x, S.y);
        img.setDepth(S.y + 0.5);
        const head = () => ({ x: S.x, y: S.y - 12 });
        this.speak('sigrun-libre', [['sigrun', 'Chaud. Enfin chaud.', head], ['vanth', 'Tu as tenu ma torche assez longtemps. Viens.', () => ({ x: S.x + 10, y: S.y - 26 })], ['sigrun', 'Kári. Dis à Ása que je cherchais du feu.', head]], { interrupt: true });
        this.time.delayedCall(11000, () => this.tweens.add({ targets: img, alpha: 0, y: img.y - 14, duration: 3200, onComplete: () => img.destroy() }));
      });
      for (let k = -5; k <= 5; k++) ground.decal(S.x + k, S.y + (k % 3 ? 0 : 1), 1, 1, 'b', 0.35);
      this.persist();
    }

    // ── Les cubes : le blanc est tiède et referme les blessures ; le noir ne
    // renvoie aucun reflet, et qui le touche voit l'île d'en haut ──
    // ── Ce qu'on voit, sous le pointeur ──
    fighting() { return !!(this.pack.engaged || (this.foe.alive && this.foe.engaged)); }
    // `ground` : le sol aussi (clic droit) ; sinon, seulement les choses posées
    describeAt(wx, wy, ground) {
      const seedOf = (x, y) => ((Math.round(x) * 73856093) ^ (Math.round(y) * 19349663)) >>> 0;
      let best = null;
      for (const im of this.children.list) {
        if (!im.visible || im.alpha < 0.1 || !im.frame || im.rotation || (best && im.depth <= best.depth)) continue;
        const key = im.texture.key;
        if (/^(chunk-|feu-|torchglow|cape|dust|blood|__)/.test(key)) continue;
        const w = im.frame.width, h = im.frame.height;
        const left = im.x - im.originX * w * im.scaleX, top = im.y - im.originY * h * im.scaleY;
        let px = Math.floor((wx - left) / im.scaleX), py = Math.floor((wy - top) / im.scaleY);
        if (px < 0 || py < 0 || px >= w || py >= h) continue;
        if (im.flipX) px = w - 1 - px;
        if (!(this.textures.getPixelAlpha(px, py, key, im.frame.name) > 0)) continue;
        const what = this.whatIs(im);
        if (what) best = { depth: im.depth, img: im, ...what };
      }
      if (best) {
        const d = best.title ? { title: best.title, text: best.text } : describe(best.kind, best.seed ?? seedOf(wx, wy));
        // (une description écrite dans l'atelier, « Dans le jeu », passe devant)
        const a = this.artProps.find(p => p.img === best.img && p.props.desc);
        return a && d ? { title: d.title, text: a.props.desc } : d;
      }
      if (!ground) return null;
      // Le sol
      if (this.inside) return describe(`room-${this.inside}`, 0);
      const kind = coast(wx, wy) > 0 ? (inLake(wx, wy) ? 'lake' : 'sea')
        : deepForest(wx, wy) > 0.5 ? 'forest'
        : trail.some(t => Math.abs(t.x - wx) < 6 && Math.abs(t.y - wy) < 6) ? 'trail'
        : ['snow', 'snow-calf', 'snow-waist'][snowDepth(wx, wy)] || 'snow';
      return describe(kind, seedOf(wx, wy));
    }
    // Une image du jeu → ce que c'est ({ kind, seed } ou { title, text })
    whatIs(im) {
      const key = im.texture.key, o = im.obj, seed = o ? ((o.x * 31 + o.y * 17) >>> 0) : undefined;
      if (o) {
        const near = (list) => list.reduce((a, b) => Math.hypot(o.x - a[1].x, o.y - a[1].y) <= Math.hypot(o.x - b[1].x, o.y - b[1].y) ? a : b)[0];
        if (o.type === 'tree') return { kind: o.fallen ? 'tree-fallen' : deepForest(o.x, o.y) > 0.5 ? 'tree-dark' : o.big ? 'tree' : 'tree-small', seed };
        if (o.type === 'statue') return { kind: near([['statue-ensevelie', STATUE_BASE], ['statue-debout', STATUE2_BASE], ['statue-ilot', STATUE3_BASE]]), seed };
        if (o.type === 'ruin' || o.type === 'arch-vault') return { kind: near([['arche', ARCH], ['colonne', RUINS.colonne], ['socle', RUINS.socle], ['ruine', RUINS.arche], ['pont', PIER]]), seed };
        if (o.type === 'stone') return { kind: o.x >= NECRO.x - 4 && o.x <= NECRO.x + NECRO_W + 4 && o.y >= NECRO.y - 4 && o.y <= NECRO.y + NECRO_H + 8 ? 'necro' : 'stone', seed };
        return { kind: o.type, seed };
      }
      if (im === this.player) return { kind: 'kari', seed: Math.floor(this.clock / 4000) };
      for (const [k, I] of Object.entries(INTERIORS)) if (I.image === im) return { kind: `room-${k}`, seed: 0 };
      if (key === 'viking') return { kind: 'foe', seed: Math.floor(this.clock / 4000) };
      if (key === 'fallen') return { kind: 'foe-dead', seed: 0 };
      if (key === 'wolf') { const w = this.pack.wolves?.find(v => v.sprite === im); return { kind: w && w.hp <= 0 ? 'wolf-dead' : 'wolf', seed: 0 }; }
      if (key.startsWith('obj-')) { const o = this.placed.find(p => p.img === im); if (o) return { title: o.label, text: o.props.desc || 'Quelqu\'un l\'a posé là, il y a longtemps.' }; }
      if (key.startsWith('mons-')) return { kind: this.given.has('mons') ? 'mons-seeing' : 'mons', seed: Math.floor(this.clock / 4000) };
      if (key === 'hvit') return { kind: this.hvitFree ? 'hvit-free' : 'hvit', seed: 0 };
      if (key.startsWith('house')) return { kind: key, seed: 0 };
      if (key.startsWith('boat-')) return { kind: 'boat', seed: Math.floor(this.clock / 4000) };
      if (key.startsWith('rowboat-')) return { kind: 'rowboat', seed: 0 };
      if (key.startsWith('cube-')) return { kind: key, seed: Math.floor(this.clock / 4000) };
      if (key.startsWith('rockpiece')) return { kind: 'chip', seed: 0 };
      const map = { boat2: 'boat2', watcher: 'watcher', crow: 'crow', bundle: 'bundle', deer: 'deer', nail: 'nail', 'temple-slab': 'temple-slab', 'temple-stairs': 'temple-stairs',
        'glace-whole': 'ice', 'glace-gone': 'ice-gone', 'throne-seated': 'throne', 'throne-bowed': 'throne-bowed', 'chest-closed': 'chest', 'chest-open': 'chest-open', 'pierre-chute': 'falling-stone' };
      if (map[key]) return { kind: map[key], seed: Math.floor(this.clock / 4000) };
      const person = key.match(/^person-(.+?)(-ame)?$/);
      if (person) {
        const P = PERSON[person[1]];
        return { title: P ? `${P.nom}${P.surnom ? `, ${P.surnom}` : ''}` : speakerName(person[1]), text: P?.role || 'Quelqu\'un, ici, dans le froid.' };
      }
      const drop = this.drops?.find(d => d.img === im && !d.taken);
      if (drop) { const r = relicById(drop.id); return r && { title: r.name, text: 'À terre. Marche dessus pour la prendre.' }; }
      return null;
    }

    // La plaine des morts prête son pas : désormais, la carte (M) mène d'un
    // lieu vu à l'autre (main.js : un clic sur un nom)
    takePassage() {
      const hero = () => this.heroHead();
      this.passage = true;
      audio.play('presence');
      this.talk.say([
        { who: 'kari', name: speakerName('kari'), text: 'La pierre est tiède. Ceux de ce navire marchent encore.', at: hero },
        { who: 'kari', name: speakerName('kari'), text: 'Ils me prêtent leur pas : d\'un lieu que j\'ai vu à l\'autre. (M : la carte, puis un lieu)', at: hero },
      ], { interrupt: true });
      this.persist();
    }
    canTravel() {
      return !!this.passage && !this.inside && !this.dead && !this.moving && !this.voyaging && !this.rowing && !this.climb
        && !this.pack.engaged && !(this.foe.alive && this.foe.engaged);
    }
    travel(x, y) {
      if (!this.canTravel()) return false;
      const to = nearestWalkable(Math.round(x), Math.round(y));
      if (!to) return false;
      this.talk.clear();
      audio.play('presence');
      this.teleport(to.x, to.y, () => {});
      return true;
    }

    touchCube(c) {
      const hero = () => this.heroHead(), first = !this.cubesTouched.has(`${this.inside === 'sno4' ? 'sno4' : 'sno7'}-${c.kind}`);
      this.cubesTouched.add(`${this.inside === 'sno4' ? 'sno4' : 'sno7'}-${c.kind}`);
      audio.play('presence');
      if (c.kind === 'blanc') {
        this.hp = this.maxHp;
        this.talk.say([
          { who: 'kari', name: speakerName('kari'), text: 'Tiède. Rien n\'y colle, pas même la neige.', at: hero },
          ...(first ? [{ who: 'kari', name: speakerName('kari'), text: 'Mes blessures se sont fermées. Je n\'ai rien senti.', at: hero }] : []),
        ], { interrupt: true });
      } else {
        // (l'île d'en haut : la carte se découvre loin autour du cube)
        if (this.inside === 'sno4') { const all = this.seen4; if (all) all.fill(1); }
        else {
          const R = 900, c0 = Math.floor((c.x - R) / SEEN_CELL), c1 = Math.floor((c.x + R) / SEEN_CELL), r0 = Math.floor((c.y - R) / SEEN_CELL), r1 = Math.floor((c.y + R) / SEEN_CELL);
          for (let r = r0; r <= r1; r++) for (let q = c0; q <= c1; q++) {
            if (q < 0 || r < 0 || q >= SEEN_N || r >= SEEN_N) continue;
            if (Math.hypot((q + 0.5) * SEEN_CELL - c.x, (r + 0.5) * SEEN_CELL - c.y) < R) this.seen[r * SEEN_N + q] = 1;
          }
        }
        this.talk.say([
          { who: 'kari', name: speakerName('kari'), text: 'Froid. Pas un reflet dedans, pas même le mien.', at: hero },
          { who: 'kari', name: speakerName('kari'), text: 'Un instant, j\'ai vu l\'île d\'en haut. (M : la carte)', at: hero },
        ], { interrupt: true });
      }
      this.persist();
    }

    // ── Le carnet des vœux : ce qui est fait, d'après le jeu ──
    facts() {
      const f = {
        'veve-legba': this.veveDone?.has('legba'), 'veve-baron': this.veveDone?.has('baron'), 'veve-damballah': this.veveDone?.has('damballah'),
        clotildeFree: this.clotildeFree, hvitFree: this.hvitFree, aube: this.aube, sigrunFree: this.sigrunFree,
        templeOpen: this.templeOpen, kingBowed: this.kingBowed, brule: this.fire != null,
      };
      for (const who of this.given.keys()) f[`don-${who}`] = true;
      return f;
    }
    // Ce que Kári pense devoir faire maintenant : le fil de l'histoire, d'un
    // grand moment au suivant (il le dit quand le but change, et quand il
    // traîne longtemps ; c'est aussi la première ligne du carnet des vœux)
    goal() {
      if (this.inside === 'sno4') return this.aube ? 'Tout est dit, ici. La barque me ramènera à SNO 7.' : 'Le carrefour, les esprits, les signes dans la neige. Et rentrer, la barque attend.';
      if (this.foe.alive) return 'Les traces vont vers l\'est. Quelqu\'un les a faites. Les suivre jusqu\'au bout.';
      if (this.fire == null) return 'Eyvind est resté dans la maison. Je dois revenir le brûler (E, près de lui).';
      if (!this.kingBowed) return 'La falaise, plus à l\'est. Une sente monte dans la roche, une grotte s\'ouvre au pied. Le roi y attend.';
      if (!this.templeOpen && !this.given.has('tages')) {
        if (this.relics.has('sceau') && !this.isGiven('sceau')) return 'J\'ai le sceau de la crypte. Tavé l\'attend, sous l\'arche, à l\'ouest.';
        return this.met.has('tages') ? 'Le sceau de la crypte : dans la petite Véla du lac, sur l\'îlot. La barque est au ponton.' : 'Le roi a parlé d\'un clou, sous l\'arche, à l\'ouest. L\'enfant-vieillard, Tavé, y est assis.';
      }
      if (!this.aube) return 'Les marches, sous l\'arche. Le mur des ans, et le clou planté à l\'envers.';
      if (!this.sigrunFree) return 'Il fait jour. Sur le plateau, ma sœur attend dans la glace. Il lui faut une flamme.';
      return 'Il fait jour. La barque de la grève pourrait m\'emmener plus loin : SNO 4, l\'île Carrefour.';
    }
    checkGoal() {
      if (this.dead || isPaused() || this.talk.busy || this.pack.engaged || (this.foe.engaged && this.foe.alive) || this.voyaging) { this.goalIdle = 0; return; }
      const g = this.goal();
      this.goalIdle = (this.goalIdle || 0) + 0.25;
      // (le but a changé : il le dit après un temps ; sinon, toutes les deux minutes)
      const changed = g !== this.goalSaid;
      if ((changed && this.goalIdle > 6 && this.goalSaid !== undefined) || this.goalIdle > 120) {
        this.goalSaid = g; this.goalIdle = 0;
        this.talk.say([{ who: 'kari', name: speakerName('kari'), text: g, at: () => this.heroHead() }]);
      }
      if (this.goalSaid === undefined) this.goalSaid = g;     // (au chargement : rien à dire tout de suite)
    }
    wishes() {
      const f = this.facts();
      const list = [{ id: 'kari', name: 'Kári', voeu: this.goal(), done: false }];
      for (const id of this.met) {
        const v = PERSON[id]?.veut;
        if (!v?.voeu) continue;
        list.push({ id, name: speakerName(id), voeu: v.voeu, done: [].concat(v.fait || []).some(k => f[k]) });
      }
      return list;
    }

    // ── La louve blanche : on défait le collet, elle se relève, parle, et s'en va ──
    freeHvit() {
      const h = this.hvit;
      if (h.state !== 'snared') return;
      h.state = 'free'; h.t = 0;
      this.hvitFree = true;
      this.met.add('hvit');
      this.hvitRope.setVisible(false);
      audio.play('wood');
      h.sprite.play('hvit-hurle');
      this.time.delayedCall(700, () => audio.play('howl', { n: 1 }));
      const head = () => ({ x: h.x, y: h.y - 10 });
      this.speak('hvit-libre', [['hvit', 'Tu m\'as déliée, petit d\'homme.', head], ['hvit', 'Là-haut, sur la roche, mes petits ont faim.', head], ['hvit', 'Ils te laisseront passer. Ne lève pas la lame sur eux.', head]], { interrupt: true });
      this.persist();
    }
    registerArtProps() {
      for (const o of this.artProps) { const i = PLACED.indexOf(o); if (i >= 0) PLACED.splice(i, 1); }
      this.artProps = [];
      for (const img of this.children.list) {
        const key = img.texture?.key;
        if (!key || key.startsWith('obj-') || !img.frame || !this.artRows.has(key)) continue;
        const props = propsOf(key);
        if (!props) continue;
        const rows = this.artRows.get(key);
        // (la place de l'image se relit à chaque fois : une barque bouge)
        const o = { img, key, props, rows, w: rows[0].length, h: rows.length,
          get x0() { return Math.round(img.x - img.displayOriginX); }, get top() { return Math.round(img.y - img.displayOriginY); },
          get x() { return img.x; }, get y() { return img.y; } };
        this.artProps.push(o);
        if (props.box) PLACED.push(o);
      }
    }
    // Les dessins du décor animés dans l'atelier : la texture change d'image
    animateArt() {
      for (const [key, a] of this.artAnims) {
        const i = Math.floor(this.clock / 1000 * a.fps) % a.frames.length;
        if (i === a.shown || !this.textures.exists(key)) continue;
        a.shown = i;
        const tex = this.textures.get(key), c = tex.getSourceImage(), ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        a.frames[i].forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.' && palette[ch]) { ctx.fillStyle = palette[ch]; ctx.fillRect(x, y, 1, 1); } }));
        tex.refresh();
      }
    }
    // Le mons : il remue (l'animation de l'atelier) ; découvert, il apparaît
    // dans un souffle et parle le premier
    updateMons() {
      const M = this.mons;
      if (!M) return;
      const vis = !this.inside;
      M.img.setVisible(vis);
      if (!vis) return;
      M.img.setTexture(`mons-${Math.floor(this.clock / 1000 * M.fps) % M.n}`);
      if (!M.shown && Math.hypot(this.pos.x - M.x, this.pos.y - M.y) < 110 && !this.dead) {
        M.shown = true;
        audio.play('presence'); audio.hush(4);
        this.tweens.add({ targets: M.img, alpha: 1, duration: 1800 });
        this.time.delayedCall(1600, () => this.talkTo('mons', () => ({ x: M.x, y: M.y - 30 })));
      }
    }
    updateHvit(dt) {
      const h = this.hvit;
      if (!h || h.state === 'gone') return;
      h.t += dt;
      if (h.state === 'snared') {
        // Elle tire sur la corde, de temps en temps
        const tug = Math.sin(h.t * 1.7) > 0.93;
        h.sprite.setFrame(tug ? 'grogne-0' : 'mort-0').setFlipX(true);
        // (un grognement sourd, de près seulement, et pas à chaque secousse)
        const dist = Math.hypot(this.pos.x - h.x, this.pos.y - h.y);
        if (tug && !h.tugged && dist < 70 && h.t - (h.growled ?? -99) > 12) { h.tugged = true; h.growled = h.t; audio.play('growl', { v: 0.3 * (1 - dist / 70) + 0.1 }); }
        if (!tug) h.tugged = false;
        return;
      }
      // Libre : elle attend que les mots soient dits, puis file vers la forêt
      if (h.t < 9) return;
      if (h.sprite.anims.currentAnim?.key !== 'hvit-trot') h.sprite.play('hvit-trot');
      h.x -= 26 * dt; h.y -= 6 * dt;
      h.sprite.setFlipX(true).setPosition(Math.round(h.x) + 0.5, Math.round(h.y) + 1).setDepth(h.y);
      if (h.t > 11) h.sprite.setAlpha(Math.max(0, 1 - (h.t - 11) / 2));
      if (h.t > 13) { h.state = 'gone'; h.sprite.setVisible(false); }
    }

    // ── Le clou de Sorne : on l'arrache, le jour revient (la fin de l'Aube) ──
    pullNail() {
      if (this.aube) return;
      this.aube = true;
      this.aubeAt = this.clock;
      audio.play('clang');
      this.jolt(0.006);
      this.tweens.add({ targets: this.nail, y: this.nail.y + 6, alpha: 0, duration: 900, ease: 'Quad.easeIn' });
      this.time.delayedCall(900, () => audio.play('thunder', { near: 0.3 }));
      const wall = () => ({ x: INTERIORS.temple.at.x + NAIL.x, y: INTERIORS.temple.at.y + NAIL.y - 4 });
      this.speak('aube-clou', [['kari', 'Il vient.', () => this.heroHead()], ['nortia', 'Un. Clou. Arraché.', wall], ['nortia', 'Le. Fil. Reprend.', wall]], { interrupt: true });
      weather.setPreset('bise');
      this.persist();
      this.time.delayedCall(6500, () => onEnding('aube'));
    }
    act() {
      const a = this.actionTarget();
      if (a) a.run();
    }
    // Ce que veut un personnage (saga.js, `veut`) ; « après », si la chose est faite
    talkTo(id, head) {
      const v = PERSON[id]?.veut;
      if (!v) return;
      this.met.add(id);
      const done = this.facts();
      const after = [].concat(v.apres || []).filter(a => done[a.si]).at(-1);
      const lines = after ? after.lignes : v.lignes;
      this.talk.say(lines.map(text => ({ who: id, name: speakerName(id), text, at: head })), { interrupt: true });
    }
    // Annoncer ce qu'on peut faire (main.js l'affiche : « E · Parler à Clède »)
    updateAction(dt) {
      this.actionClock = (this.actionClock || 0) - dt;
      if (this.actionClock > 0) return;
      this.actionClock = 0.15;
      const label = isPaused() ? null : this.actionTarget()?.label || null;
      if (label !== this.actionLabel) { this.actionLabel = label; onAction(label); }
    }

    // ── La parole ──
    // Un personnage de la saga, dessiné d'après le héros, posé dans le monde
    personImage(id, x, y, { alpha = 1, soul = false, flip = false } = {}) {
      const key = `person-${id}${soul ? '-ame' : ''}`;
      const spec = { ...({ tages: { corps: 'enfant', tete: 'bonnet' }, hjalti: { corps: 'enfant', tete: 'nue' } }[id] || PERSON[id]?.sprite || { corps: id }) };
      if (soul) spec.blanc = true;
      const s = personSprite(spec);
      if (!this.textures.exists(key)) {
        const c = document.createElement('canvas');
        c.width = s.w; c.height = s.h;
        const g = c.getContext('2d');
        s.front.forEach((row, ry) => [...row].forEach((ch, rx) => {
          if (ch === '.') return;
          g.globalAlpha = ch === 'h' ? 0.3 : 1;
          g.fillStyle = palette[ch === 'h' ? 'b' : ch] || palette.b;
          g.fillRect(rx, ry, 1, 1);
        }));
        this.textures.addCanvas(key, c);
      }
      return this.add.image(Math.round(x) - s.cx, Math.round(y) - s.ground, key).setOrigin(0, 0).setDepth(y).setAlpha(alpha).setFlipX(flip);
    }

    // ── SNO 4, l'île Carrefour : préparée au premier voyage ──
    ensureSno4() {
      if (this.sno4) return this.sno4;
      const I = INTERIORS.sno4, A = I.at, D = DEPTH_ROOM;
      const c = document.createElement('canvas');
      c.width = SNO4_W; c.height = SNO4_H;
      paintSno4(c.getContext('2d'), palette);
      this.textures.addCanvas('sno4', c);
      I.black = this.add.rectangle(A.x - 700, A.y - 500, I.w + 1400, I.h + 1000, hex(palette.k)).setOrigin(0, 0).setDepth(D - 2).setVisible(false);
      I.image = this.add.image(A.x, A.y, 'sno4').setOrigin(0, 0).setDepth(D - 1).setVisible(false);
      const objs = [];
      const at = (p, img) => { img.setDepth(D + A.y + p.y); objs.push(img); return img; };
      // Ce qui est debout, trié à son pied
      for (const p of SNO4_PROPS) {
        this.art(p.key, p.rows);
        at(p.at, this.add.image(A.x + p.at.x - p.ax, A.y + p.at.y - p.h + 1, p.key).setOrigin(0, 0));
      }
      // La barque de Kári, tirée sur la glace
      at({ y: SNO4_BOAT.y + BOAT_H }, this.add.image(A.x + SNO4_BOAT.x, A.y + SNO4_BOAT.y, 'boat-still').setOrigin(0, 0));
      // Le feu de la forge
      const F = SNO4_AT.forge;
      this.forgeFlame = at({ y: F.y + 1 }, this.add.image(A.x + F.x + 0.5, A.y + F.y - 1, 'feu-0').setOrigin(0.5, 1));
      // Les gens et les esprits
      const who = (id, dx, dy, place, o = {}) => {
        const P = SNO4_AT[place], x = A.x + P.x + dx, y = A.y + P.y + dy;
        const img = this.personImage(id, x, y, o);
        img.setDepth(D + y);
        objs.push(img);
        return { img, x, y };
      };
      this.sno4People = {
        legba: who('legba', 6, 4, 'barriere'),
        anaise: who('anaise', 6, 12, 'lakou', { flip: true }),
        tijo: who('tijo', -10, 16, 'lakou'),
        kalfou: who('kalfou', 0, 0, 'kalfou'),
        eyvind: who('eyvind', -18, 8, 'kalfou', { soul: true, alpha: 0.6 }),
        anisse: who('anisse', 16, 10, 'kalfou', { soul: true, alpha: 0.6, flip: true }),
        baron: who('baron', -4, 3, 'cimetiere'),
        brigitte: who('brigitte', 22, 9, 'cimetiere', { flip: true }),
        lucien: who('lucien', -6, 4, 'bouteilles'),
        damballah: who('damballah', -18, -4, 'mapou'),
      };
      // (son âme est passée : Croisée a eu l'anneau)
      if (this.given.has('kalfou')) this.sno4People.eyvind.img.setVisible(false);
      // Les âmes qui attendent au carrefour
      this.souls = SNO4_SOULS.map((p, i) => {
        const img = this.personImage(p.k ? 'hjalti' : 'ame', A.x + p.x, A.y + p.y, { soul: true, alpha: 0.4, flip: p.f });
        img.setDepth(D + A.y + p.y);
        objs.push(img);
        return { img, y0: img.y, ph: i * 0.7 };
      });
      // Clotilde, qui marche de l'épave à la maison aux bouteilles
      const c0 = CLOTILDE_PATH[0];
      this.clotilde = { img: this.personImage('clotilde', A.x + c0.x, A.y + c0.y), t: 0, x: A.x + c0.x, y: A.y + c0.y };
      objs.push(this.clotilde.img);
      if (this.clotildeFree) this.clotilde.img.setVisible(false);
      // Les tracé : des points de cendre reliés par des traits pâles, au ras du sol
      this.veves = VEVE.map(v => {
        const g = this.add.graphics().setDepth(D);
        objs.push(g);
        const st = { v, g, seen: new Set(), t0: 0 };
        this.drawVeve(st);
        return st;
      });
      this.sno4 = { objs };
      objs.forEach(o => o.setVisible(false));
      return this.sno4;
    }
    // Un tracé : pâle et pointillé tant qu'il n'est pas marché ; les points
    // marchés se noircissent, les traits entre deux points marchés deviennent pleins
    drawVeve(st) {
      const { v, g } = st, A = INTERIORS.sno4.at, done = this.veveDone.has(v.id);
      const P = i => ({ x: A.x + v.at.x + v.nodes[i][0], y: A.y + v.at.y + v.nodes[i][1] });
      const on = i => done || st.seen.has(i);
      g.clear();
      for (const [a, b] of v.links) {
        const p = P(a), q = P(b), n = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y)), full = on(a) && on(b);
        g.fillStyle(hex(palette.b), full ? 0.9 : 0.35);
        for (let k = 0; k <= n; k++) {
          if (!full && k % 3) continue;
          // (le trait tremble d'un pixel : rien de géométrique)
          const wob = Math.round(Math.sin((k + a * 7) * 0.9) * 0.6);
          g.fillRect(Math.round(p.x + (q.x - p.x) * k / n), Math.round(p.y + (q.y - p.y) * k / n) + wob, 1, 1);
        }
      }
      for (let i = 0; i < v.nodes.length; i++) {
        const p = P(i);
        g.fillStyle(hex(palette.b), on(i) ? 1 : 0.55);
        if (on(i)) g.fillRect(p.x - 1, p.y - 1, 3, 3);
        else { g.fillRect(p.x - 1, p.y - 2, 3, 1); g.fillRect(p.x - 2, p.y - 1, 1, 3); g.fillRect(p.x + 2, p.y - 1, 1, 3); g.fillRect(p.x - 1, p.y + 2, 3, 1); }
      }
    }
    // Marcher les tracés (sur SNO 4) : chaque point foulé compte ; tous en moins
    // de VEVE_TIME secondes, le dessin se referme et le esprit vient
    checkVeve(dt) {
      if (this.inside !== 'sno4' || !this.veves || this.dead) return;
      const A = INTERIORS.sno4.at, t = this.clock / 1000;
      for (const st of this.veves) {
        const { v } = st;
        if (this.veveDone.has(v.id)) continue;
        if (st.seen.size && t - st.t0 > VEVE_TIME) { st.seen.clear(); this.drawVeve(st); }
        v.nodes.forEach(([dx, dy], i) => {
          if (st.seen.has(i) || Math.hypot(this.pos.x - (A.x + v.at.x + dx), this.pos.y - (A.y + v.at.y + dy)) > VEVE_NODE) return;
          if (!st.seen.size) st.t0 = t;
          st.seen.add(i);
          audio.play('snow');
          this.drawVeve(st);
          const guide = this.said.has('kari-lakou') ? 'anaise' : 'legba';
          if (!this.said.has('kari-veve-aide')) this.speak('kari-veve-aide', this.sceneLines('kari-veve-aide', null, () => () => ({ x: this.pos.x + 26, y: this.pos.y - 16 })).map(([, text, at]) => [guide, text, at]));
        });
        if (st.seen.size === v.nodes.length) this.veveClosed(st);
      }
    }
    veveClosed(st) {
      const { v } = st, W = this.sno4People;
      this.veveDone.add(v.id);
      this.drawVeve(st);
      audio.play('presence');
      audio.hush(4);
      this.jolt(0.0015);
      const hero = () => this.heroHead();
      const head = (k, up = 11) => () => ({ x: W[k].x, y: W[k].y - up });
      if (v.id === 'legba') {
        this.seen4.fill(1);                                    // Clède ouvre les chemins : toute la carte
        this.speak('kari-veve-legba', this.sceneLines('kari-veve-legba', null, w => w === 'kari' ? hero : head('legba')), { interrupt: true });
      } else if (v.id === 'damballah') {
        // Le vent tombe une minute sur toute l'île ; le serpent blanc descend
        const before = weather.preset;
        weather.setPreset('calme');
        this.time.delayedCall(60000, () => { if (weather.preset === 'calme') weather.setPreset(before); });
        this.tweens.add({ targets: W.damballah.img, y: W.damballah.img.y + 8, duration: 2600, ease: 'Sine.easeInOut' });
        this.speak('kari-veve-damballah', this.sceneLines('kari-veve-damballah', null, w => w === 'kari' ? hero : head('damballah', 4)), { interrupt: true });
      } else if (v.id === 'baron') {
        // Baron monte Kári : il se déhanche, rit, salue les morts, puis le rend
        this.ridden = 16;
        this.speak('kari-veve-baron', this.sceneLines('kari-veve-baron', null, w => w === 'baron' ? head('baron', 14) : hero), { interrupt: true });
      }
      this.persist();
    }

    showSno4(on) {
      const I = INTERIORS.sno4;
      if (!this.sno4) return;
      I.image.setVisible(on); I.black.setVisible(on);
      for (const o of this.sno4.objs) o.setVisible(on);
      if (on && this.clotildeFree) this.clotilde.img.setVisible(false);
    }
    // Ce qui bouge sur SNO 4 : les âmes respirent, Clotilde marche, le feu brûle
    updateSno4(dt, time) {
      if (this.inside !== 'sno4' || !this.sno4) return;
      const t = time / 1000;
      for (const s of this.souls) s.img.y = s.y0 - (Math.sin(t * 0.8 + s.ph) > 0.6 ? 1 : 0);
      this.forgeFlame.setTexture(`feu-${Math.floor(t * 8) % FIRE_FRAMES.length}`);
      const C = this.clotilde, A = INTERIORS.sno4.at;
      if (!this.clotildeFree) {
        // aller et retour, lentement, sur son chemin
        const n = CLOTILDE_PATH.length - 1;
        C.t = (C.t + dt * 0.012) % (2 * n);
        const u = C.t < n ? C.t : 2 * n - C.t, i = Math.min(n - 1, Math.floor(u)), f = u - i;
        const a = CLOTILDE_PATH[i], b = CLOTILDE_PATH[i + 1];
        C.x = A.x + a.x + (b.x - a.x) * f; C.y = A.y + a.y + (b.y - a.y) * f;
        const s = personSprite(PERSON.clotilde.sprite);
        C.img.setPosition(Math.round(C.x) - s.cx, Math.round(C.y) - s.ground).setDepth(DEPTH_ROOM + C.y).setFlipX((C.t < n) === (b.x < a.x));
      }
    }

    // ── La traversée : on part de la grève de SNO 7 vers SNO 4, et retour, en
    // poussant vers sa barque (après s'en être éloigné une fois) ──
    checkVoyage(mx, my, dt) {
      if (this.moving || this.dead || this.rowing || this.voyaging || (this.inside && this.inside !== 'sno4')) { this.voyageHold = 0; return; }
      let near, toward;
      if (this.inside === 'sno4') {
        const A = INTERIORS.sno4.at, lx = this.pos.x - A.x, ly = this.pos.y - A.y;
        near = nearSno4Boat(lx, ly);
        toward = mx * (SNO4_BOAT.x + 10 - lx) + my * (SNO4_BOAT.y + 8 - ly) > 0;
      } else {
        const b = { x: this.boatRest.x + BOAT_W / 2, y: this.boatRest.y + BOAT_H - 4 };
        const d = Math.hypot(this.pos.x - b.x, this.pos.y - b.y);
        if (d > 140) this.leftShore = true;
        near = this.leftShore && d < 30;
        toward = mx * (b.x - this.pos.x) + my * (b.y - this.pos.y) > 0;
      }
      if (!near || !toward) { this.voyageHold = 0; this.voyageAsked = near && this.voyageAsked; return; }
      if (!this.voyageAsked) {
        this.voyageAsked = true;
        this.talk.say([{ who: 'kari', name: speakerName('kari'), text: this.inside === 'sno4' ? 'Rentrer. Vers le nord.' : 'Au sud, l\'île Carrefour…', at: () => this.heroHead() }], { interrupt: true });
      }
      this.voyageHold = (this.voyageHold || 0) + dt;
      if (this.voyageHold > 1.4) this.voyage(this.inside === 'sno4' ? 'sno7' : 'sno4');
    }
    voyage(to) {
      this.voyaging = true;
      this.voyageHold = 0; this.voyageAsked = false;
      this.talk.clear();
      this.keys.clear();
      onVoyage(to, () => this.arrive(to));
    }
    arrive(to) {
      const I = INTERIORS.sno4;
      if (to === 'sno4') {
        this.ensureSno4();
        this.pos = { x: I.at.x + I.entry.x, y: I.at.y + I.entry.y };
        this.inside = 'sno4';
        this.showSno4(true);
      } else {
        this.inside = null;
        this.showSno4(false);
        this.pos = { ...this.spawn };
        this.leftShore = false;
      }
      this.prevPos = { ...this.pos };
      this.climb = null;
      this.facing = 'side'; this.flip = to !== 'sno4'; this.player.setFlipX(this.flip);
      this.player.setFrame('side-idle');
      this.placePlayer();
      this.cameras.main.centerOn(this.pos.x, this.pos.y);
      this.updateChunks(true);
      this.voyaging = false;
      this.persist();
    }

    // Les lignes d'une scène de la saga (`picks` : leurs rangs), ancrées :
    // `at(who)` → le haut de la tête de celui qui parle, dans le monde
    sceneLines(id, picks, at) {
      const lines = SCENARIOS.find(x => x.id === id)?.lignes || [];
      return (picks || lines.map((_, i) => i)).map(i => lines[i]).filter(Boolean)
        .map(([who, text]) => [who, text.replace(/^\([^)]*\)\s*/, ''), at(who)]);
    }
    heroHead() {
      const a = this.drawPos || this.pos;
      return { x: a.x, y: a.y - 11 - (this.lift || 0) };
    }
    speak(id, lines, { once = true, interrupt = false } = {}) {
      if (once && this.said.has(id)) return false;
      this.said.add(id);
      for (const [who] of lines) if (who !== 'kari') this.met.add(who);
      this.talk.say(lines.map(([who, text, at]) => ({ who, name: speakerName(who), text, at: typeof at === 'function' ? at : () => at })), { interrupt });
      this.persist();
      return true;
    }

    // Qui parle, quand : regardé quatre fois par seconde
    checkTalk() {
      if (this.dead || isPaused() || this.rowing) return;
      const P = this.pos, near = (o, r) => Math.hypot(P.x - o.x, P.y - o.y) < r;
      const hero = () => this.heroHead();
      // L'indice du pas des morts : près du grand navire, une fois, tant qu'il
      // n'y a pas posé la main (story.js, `HINTS`)
      if (!this.inside && !this.passage && near(PASSAGE_AT, 70) && !this.fighting()) this.speak('indice-passage', HINTS.passage.map(text => ['kari', text, hero]));
      const fixed = (x, y) => () => ({ x, y });
      if (!this.inside) {
        // La grève : la barque mâtée, vide ; deux pistes
        if (this.boat2At && this.calm > 8 && near(this.boat2At, 46)) this.speak('greve', [['kari', 'Eyvind ?', hero], ['kari', 'Sa barque. Vide.', hero], ['kari', 'Deux pistes.', hero]]);
        // Le grand navire de pierres : Hrólf se redresse
        const ship = { x: NECRO.x + NECRO_W / 2, y: NECRO.y + NECRO_H / 2 };
        if (P.x > NECRO.x - 40 && P.x < NECRO.x + NECRO_W + 40 && P.y > NECRO.y - 30 && P.y < NECRO.y + NECRO_H + 80) this.speak('draugr', this.sceneLines('draugr', [0, 1, 2, 3, 4, 5], w => w === 'kari' ? hero : fixed(ship.x, ship.y - 10)));
        // Sigrún : la glace pleure quand la flamme approche
        if (!this.sigrunFree && near(this.sigrun, 44) && this.torchOn > 0.5 && !this.torchOut) {
          const sh = () => ({ x: this.sigrun.x, y: this.sigrun.y - 22 });
          this.speak('glace', this.sceneLines('glace', null, w => w === 'kari' ? hero : sh));
        }
        // La louve blanche, prise dans un collet
        if (this.hvit.state === 'snared' && near(this.hvit, 60)) this.speak('hvit-collet', [['kari', 'Une louve. Blanche.', hero], ['kari', 'La patte prise dans un collet.', hero]]);
        // Tavé, sous l'arche
        if (near(this.tages, 64)) this.speak('tages', this.sceneLines('tages', [0, 1], () => fixed(this.tages.x, this.tages.y - 9)).concat([
          ['tages', 'Une qui pend à un arbre.', fixed(this.tages.x, this.tages.y - 9)],
          ['tages', 'Un qui attend au bout.', fixed(this.tages.x, this.tages.y - 9)],
          ['tages', 'Un qui dort sous la roche, assis.', fixed(this.tages.x, this.tages.y - 9)],
          ['tages', 'Hé hé. Tu n\'as rien compris. C\'est normal.', fixed(this.tages.x, this.tages.y - 9)],
        ]));
        // La Véla ensevelie : deux voix
        if (near(STATUE_BASE, 96)) this.speak('freya-ensevelie', this.sceneLines('freya-ensevelie', null, w => w === 'kari' ? hero : fixed(STATUE_BASE.x, STATUE_BASE.y - 40)));
        // Le bosquet : un enfant pâle joue sous l'arbre
        if (near(GROVE_TREE, 96) && !this.said.has('hjalti')) {
          const at = nearestWalkable(GROVE_TREE.x - 16, GROVE_TREE.y + 6) || GROVE_TREE;
          const ghost = this.personImage('hjalti', at.x, at.y, { alpha: 0 });
          this.tweens.add({ targets: ghost, alpha: 0.55, duration: 900 });
          const lines = this.sceneLines('hjalti', null, w => w === 'kari' ? hero : fixed(at.x, at.y - 7));
          this.speak('hjalti', lines);
          const dur = lines.reduce((n, [, t]) => n + 1.65 + t.length * 0.055, 0);
          this.time.delayedCall(dur * 1000, () => this.tweens.add({ targets: ghost, alpha: 0, duration: 1600, onComplete: () => ghost.destroy() }));
        }
        // Le premier loup tombé : la louve blanche parle depuis la lisière
        if (this.pack.deadList.length > this.wolvesDown && !this.pack.engaged) {
          const w = this.pack.deadList[0];
          this.speak('meute', this.sceneLines('meute', null, who => who === 'kari' ? hero : fixed(w.x + 40, w.y - 30)));
        }
        this.wolvesDown = this.pack.deadList.length;
      }
      // SNO 4 : la visite de Kári, lieu par lieu
      if (this.inside === 'sno4' && this.sno4) {
        const A = INTERIORS.sno4.at, W = this.sno4People;
        const headOf = (k, up = 11) => () => ({ x: W[k].x, y: W[k].y - up });
        const nearPlace = (id, r) => near({ x: A.x + SNO4_AT[id].x, y: A.y + SNO4_AT[id].y }, r);
        const cast = map => w => w === 'kari' ? hero : map[w] || hero;
        if (nearPlace('barriere', 64)) this.speak('kari-barriere', this.sceneLines('kari-barriere', null, cast({ legba: headOf('legba') })));
        if (nearPlace('lakou', 64) && this.speak('kari-lakou', this.sceneLines('kari-lakou', null, cast({ anaise: headOf('anaise'), tijo: headOf('tijo', 8) })))) this.salt = true;
        if (nearPlace('kalfou', 76)) this.speak('kari-carrefour', this.sceneLines('kari-carrefour', null, cast({ kalfou: headOf('kalfou', 24), eyvind: headOf('eyvind'), anisse: headOf('anisse') })));
        if (nearPlace('cimetiere', 76)) this.speak('kari-cimetiere', this.sceneLines('kari-cimetiere', null, cast({ baron: headOf('baron', 14), brigitte: headOf('brigitte') })));
        if (nearPlace('bouteilles', 70)) this.speak('kari-bouteilles', this.sceneLines('kari-bouteilles', null, cast({ lucien: headOf('lucien') })));
        if (nearPlace('mapou', 70)) this.speak('kari-mapou', this.sceneLines('kari-mapou', null, cast({ damballah: headOf('damballah', 6) })));
        // Clotilde : sans sel, elle passe ; avec le sel de Ti-Jo, elle se réveille
        const C = this.clotilde;
        if (!this.clotildeFree && Math.hypot(P.x - C.x, P.y - C.y) < 24) {
          const head = () => ({ x: C.x, y: C.y - 11 });
          if (this.salt && this.speak('kari-clotilde', this.sceneLines('kari-clotilde', null, cast({ clotilde: head })))) {
            this.clotildeFree = true;
            this.time.delayedCall(9000, () => this.tweens.add({ targets: C.img, alpha: 0, duration: 1800, onComplete: () => C.img.setVisible(false) }));
          } else if (!this.salt) this.speak('kari-zonbi', this.sceneLines('kari-zonbi', null, cast({ clotilde: head })));
        }
      }
      // La maison : la fylgja d'Eyvind, au-dessus du corps
      if (this.inside === 'house' && this.fire == null) {
        const H = INTERIORS.house.at, b = { x: H.x + PYRE.x, y: H.y + PYRE.y - 8 };
        this.speak('maison', this.sceneLines('maison', null, w => w === 'kari' ? hero : w === 'thordis' ? fixed(b.x - 26, b.y - 4) : fixed(b.x, b.y)));
      }
      // L'autre : il parle en marchant vers nous ; à terre, deux mots
      const foeHead = () => ({ x: this.foe.pos.x, y: this.foe.pos.y - 11 });
      if (this.foe.alive && this.foe.engaged) this.speak('autre', this.sceneLines('autre', [0, 1, 2, 3], w => w === 'kari' ? hero : foeHead), { interrupt: true });
      if (this.foeAlive && !this.foe.alive) this.speak('autre-mort', this.sceneLines('autre', [4, 5], () => foeHead), { interrupt: true });
      this.foeAlive = this.foe.alive;
    }

    lightPyre() {
      this.speak('bucher', this.sceneLines('bucher', null, w => w === 'kari' ? () => this.heroHead() : () => ({ x: this.pos.x + 22, y: this.pos.y - 14 })));
      this.fire = 0;
      this.smokeIn = 0;
      audio.play('ignite');
      this.jolt(0.0015);
      const H = INTERIORS.house.at;
      this.embers.setConfig({ lifespan: { min: 200, max: 600 }, speed: { min: 10, max: 40 }, angle: { min: 220, max: 320 }, gravityY: -20, alpha: { start: 1, end: 0 }, emitting: false });
      this.embers.explode(14, H.x + PYRE.x, H.y + PYRE.y - 2);
      this.persist();
    }

    // Combien on entend le feu (0 → 1) : selon sa force et la distance
    fireHeard() {
      const fl = this.fireLevel || 0;
      if (!fl) return 0;
      if (this.inside === 'house') return fl;
      if (this.inside) return 0;
      return fl * Math.max(0, 1 - Math.hypot(this.pos.x - HOUSE.x, this.pos.y - HOUSE.y) / 360);
    }

    updateFire(dt, time) {
      if (this.fire == null) { this.fireLevel = 0; return; }
      const before = this.fire;
      if (!isPaused()) this.fire += dt;
      const t = this.fire, k = Math.floor(time / 110), outside = !this.inside;
      // La maison : intacte, trouée par le feu, puis la ruine
      const tex = t >= FIRE.collapse ? 'house-ruin' : t >= FIRE.spread * 0.6 ? 'house-burning' : 'house';
      if (this.house.texture.key !== tex) this.house.setTexture(tex);
      if (before < FIRE.collapse && t >= FIRE.collapse) this.collapseHouse();
      // Les flammes gagnent le toit de la porte vers le fond ; dans la ruine, elles baissent
      const ruinK = t < FIRE.collapse ? 0 : Math.max(0, 1 - (t - FIRE.collapse) / (FIRE.out - FIRE.collapse));
      const nRoof = t < FIRE.roof || t >= FIRE.collapse ? 0 : Math.ceil(this.roofFlames.length * Math.min(1, (t - FIRE.roof + 1) / (FIRE.spread - FIRE.roof)));
      const nRuin = Math.ceil(this.ruinFlames.length * ruinK);
      const depth = this.house.depth + 0.05;
      const show = (list, n, on) => list.forEach((im, i) => {
        const v = on && i < n;
        im.setVisible(v);
        if (v) im.setTexture(`feu-${(k + i * 3) % 4}`).setDepth(depth);
      });
      show(this.roofFlames, nRoof, outside);
      show(this.ruinFlames, nRuin, outside);
      const nRoom = Math.min(this.roomFlames.length, 1 + Math.floor(t / 1.6));
      this.roomFlames.forEach((im, i) => {
        const v = this.inside === 'house' && t < FIRE.collapse && i < nRoom;
        im.setVisible(v);
        if (v) im.setTexture(`feu-${(k + i) % 4}`);
      });
      // Sa force (0 → 1) : la lumière, la fumée, le bruit ; des braises, à la fin
      this.fireLevel = t < FIRE.roof ? 0.3 + 0.5 * t / FIRE.roof : t < FIRE.collapse ? 1 : 0.18 + 0.82 * ruinK;
      // La fumée et les escarbilles, que le vent emporte
      this.smokeClock = (this.smokeClock || 0) + dt;
      if (this.smokeClock >= 0.066) {
        const step = this.smokeClock;
        this.smokeClock = 0;
        const near = outside && Math.hypot(this.pos.x - HOUSE.x, this.pos.y - HOUSE.y) < 460;
        const HL = HOUSE.x - HOUSE_ART[0].length / 2, HT = HOUSE.y + 1 - HOUSE_ART.length;
        if (near) {
          const spots = t < FIRE.collapse ? this.roofFlames.slice(0, Math.max(2, nRoof)) : this.ruinFlames;
          const rate = 9 * this.fireLevel * step;
          for (let n = rate + Math.random(); n >= 1; n--) {
            const im = spots[Math.floor(Math.random() * spots.length)];
            this.smokePuffs.push({ x: im.x + (Math.random() - 0.5) * 4, y: im.y - FIRE_H, age: 0, life: 3 + Math.random() * 2.5, a: 0.5 + 0.5 * this.fireLevel, v: Math.random() * 6 });
          }
          if (t < FIRE.out && Math.random() < 8 * this.fireLevel * step) this.fireSparks.explode(1, HL + 10 + Math.random() * (HOUSE_ART[0].length - 20), HT + 10 + Math.random() * 20);
        }
        if (this.inside === 'house' && t < FIRE.collapse) {
          for (let n = 6 * step + Math.random(); n >= 1; n--) {
            const im = this.roomFlames[Math.floor(Math.random() * nRoom)];
            this.smokePuffs.push({ x: im.x, y: im.y - FIRE_H, age: 0, life: 2.5 + Math.random() * 2, a: 0.8, v: Math.random() * 4 });
          }
        }
        this.drawSmoke(step);
      }
      // Dans la pièce, la fumée : il faut sortir ; et le toit s'effondre
      if (this.inside === 'house' && !this.dead && !this.moving) {
        if (!isPaused()) this.smokeIn = (this.smokeIn || 0) + dt;
        if (this.smokeIn > FIRE.smoke) {
          this.smokeHurt = (this.smokeHurt || 0) - dt;
          if (this.smokeHurt <= 0) { this.smokeHurt = 3; this.hurt(this.flip ? 1 : -1); }
        }
        if (t >= FIRE.collapse) this.goOutside();
      } else { this.smokeIn = this.inside === 'house' ? this.smokeIn : 0; this.smokeHurt = 0; }
    }

    // La fumée : des bouffées tramées (la trame accrochée au monde) qui
    // montent, s'élargissent, pâlissent et filent vers l'est avec le vent
    drawSmoke(dt) {
      const g = this.smokeG, list = this.smokePuffs;
      g.clear();
      const drift = 3 + weather.wind * 0.09;
      for (const p of list) { p.age += dt; p.y -= (8 + p.v) * dt; p.x += drift * dt * Math.min(1, p.age / 1.2); }
      this.smokePuffs = list.filter(p => p.age < p.life);
      g.fillStyle(hex(palette.b), 0.9);
      for (const p of this.smokePuffs) {
        const k = p.age / p.life, r = 1 + k * 4.5, dens = (1 - k) * (1 - k) * p.a * 0.85;
        const cx = Math.round(p.x), cy = Math.round(p.y);
        for (let y = Math.floor(-r); y <= r; y++) for (let x = Math.floor(-r * 1.3); x <= r * 1.3; x++) {
          if ((x / 1.3) ** 2 + y * y > r * r) continue;
          const px = cx + x, py = cy + y;
          if (dens * 16 > DITHER[(py & 3) * 4 + (px & 3)] + 0.5) g.fillRect(px, py, 1, 1);
        }
      }
    }

    // Le toit s'effondre : un fracas, une gerbe d'escarbilles, la neige fond autour
    collapseHouse() {
      audio.play('collapse');
      this.jolt(0.003);
      this.fireSparks.explode(40, HOUSE.x, HOUSE.y - 18);
      this.dust.setConfig({ lifespan: { min: 600, max: 1400 }, speed: { min: 10, max: 40 }, angle: { min: 200, max: 340 }, gravityY: 20, alpha: { start: 0.9, end: 0 }, emitting: false });
      this.dust.explode(40, HOUSE.x, HOUSE.y - 6);
      this.meltSnow();
      this.persist();
    }

    // Autour de la ruine, la neige a fondu par plaques (marques permanentes)
    meltSnow() {
      let a = 9173;
      const r = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
      for (let i = 0; i < 160; i++) {
        const ang = r() * Math.PI * 2, d = 0.7 + r() * 0.55;
        const x = Math.round(HOUSE.x + Math.cos(ang) * 64 * d), y = Math.round(HOUSE.y - 16 + Math.sin(ang) * 36 * d);
        if (!isLand(x, y)) continue;
        ground.decal(x, y, 1 + Math.floor(r() * 3), 1, 'b', 0.15 + r() * 0.2);
      }
    }

    // ── Le megamoth souffle la torche : le noir, quelques secondes ──
    snuffTorch() {
      this.torchOut = 7;
      this.torchOn = 0;
      audio.play('snuff');
      const tp = this.torchPoint();
      this.dust.setConfig({ lifespan: { min: 400, max: 1000 }, speed: { min: 4, max: 18 }, angle: { min: 230, max: 310 }, gravityY: -10, alpha: { start: 0.8, end: 0 }, emitting: false });
      this.dust.explode(10, tp.x, tp.y);
    }

    // ── La sente de la falaise ──
    // Au pied, en marchant vers la roche ; en haut, en marchant vers le bord
    checkLedge(mx, my) {
      if (this.inside || this.moving || this.rowing) return;
      const b = LEDGE.bottom, t = LEDGE.top;
      if (my < 0 && Math.hypot(this.pos.x - b.x, this.pos.y - b.y) < 7) this.startClimb(0);
      else if (my > 0 && Math.hypot(this.pos.x - t.x, this.pos.y - t.y) < 7) this.startClimb(LEDGE.len);
    }

    startClimb(t) {
      this.climb = { t, dir: t ? -1 : 1, rock: 2 + Math.random() * 2 };
      const p = ledgeAt(t);
      this.pos = { x: p.x, y: p.y };
      this.prevPos = { ...this.pos };
    }

    // Sur la sente, on ne fait qu'avancer ou reculer : la touche qui va dans
    // le sens du lacet fait monter ; haut monte toujours, bas descend
    climbStep(mx, my, dt) {
      const c = this.climb;
      if (this.attacking) return;
      const at = ledgeAt(c.t), len = Math.hypot(mx, my);
      let dir = 0;
      if (len) {
        const along = (mx * at.ux + my * at.uy) / len;
        dir = Math.abs(along) > 0.2 ? Math.sign(along) : my < 0 ? 1 : my > 0 ? -1 : 0;
      }
      if (!dir) {
        if (this.player.anims.isPlaying) { this.player.stop(); this.player.setFrame(`${this.facing}-idle`); }
        return;
      }
      const step = TUNE.kariVitesse * CLIMB.speed * dt;
      c.t += dir * step; c.dir = dir;
      this.distance += step;
      if (c.t < 0) { this.leaveLedge(LEDGE.bottom, 'front'); return; }
      if (c.t > LEDGE.len) { this.leaveLedge(LEDGE.top, 'back'); return; }
      const p = ledgeAt(c.t);
      this.pos = { x: p.x, y: p.y };
      this.facing = 'side'; this.flip = p.ux * dir < 0;
      this.player.setFlipX(this.flip);
      if (this.player.anims.currentAnim?.key !== 'side-walk' || !this.player.anims.isPlaying) this.player.play('side-walk', true);
      this.player.anims.timeScale = 0.75;
      this.drip(this.pos.x, this.pos.y, dt, this.hp);
    }

    leaveLedge(at, facing) {
      this.climb = null;
      this.pos = { x: at.x, y: at.y };
      this.prevPos = { ...this.pos };
      this.facing = facing;
      this.player.play(`${facing}-walk`, true);
    }

    // Des pierres se détachent du rebord et tombent le long de la face : un
    // filet de neige d'abord, puis la pierre ; sur la sente, elle blesse
    updateRockfall(dt) {
      const c = this.climb;
      this.rocks = this.rocks || [];
      if (c && !this.dead && !isPaused()) {
        c.rock -= dt;
        if (c.rock <= 0) {
          c.rock = TUNE.chutePierres * (0.7 + Math.random() * 0.7);
          const p = ledgeAt(c.t + (Math.random() * 24 - 6) * c.dir);
          const x = Math.round(p.x), top = cliffFoot(x) - cliffHeight(x) + 2;
          this.rocks.push({ x, y: top, ledge: Math.round(p.y), foot: cliffFoot(x) + 3, warn: CLIMB.warn, vy: 0 });
        }
      }
      for (const r of this.rocks) {
        if (r.warn > 0) {
          r.warn -= dt;
          if (Math.random() < dt * 16) this.snowfall.explode(1, r.x + Math.round((Math.random() - 0.5) * 3), r.y + Math.random() * 4);
          if (r.warn <= 0) { r.img = this.add.image(r.x + 0.5, Math.round(r.y), 'pierre-chute').setOrigin(0.5, 1).setDepth(CLIFF.y + 61); audio.play('snow'); }
          continue;
        }
        r.vy += 240 * dt; r.y += r.vy * dt;
        if (!r.passed && r.y >= r.ledge - 1) {
          r.passed = true;
          this.dust.setConfig({ lifespan: { min: 250, max: 600 }, speed: { min: 8, max: 30 }, angle: { min: 200, max: 340 }, gravityY: 80, alpha: { start: 0.8, end: 0 }, emitting: false });
          this.dust.explode(5, r.x, r.ledge);
          if (this.climb && !this.dead && Math.abs(this.pos.x - r.x) < 3 && Math.abs(this.pos.y - r.ledge) < 5) { audio.play('clang'); this.hurt(this.pos.x >= r.x ? 1 : -1); }
          r.vy *= 0.35;
        }
        if (r.y >= r.foot) { r.done = true; r.img?.destroy(); this.dust.explode(4, r.x, r.foot); }
        else r.img?.setY(Math.round(r.y));
      }
      this.rocks = this.rocks.filter(r => !r.done);
    }

    // ── La grotte : le roi mort ──
    // Près du trône, la vue monte pour que le roi tienne en entier à l'écran
    updateLook(dt) {
      const cam = this.cameras.main;
      let want = 0;
      if (this.inside === 'cave') {
        const C = INTERIORS.cave.at, d = Math.hypot(this.pos.x - C.x - THRONE.x, this.pos.y - C.y - THRONE.y);
        want = Math.max(0, Math.min(1, (130 - d) / 60)) * LOOK_UP;
      }
      this.look = (this.look || 0) + (want - (this.look || 0)) * Math.min(1, dt * 2.5);
      cam.setFollowOffset(0, Math.round(this.look));
    }

    nearKing() {
      const C = INTERIORS.cave.at;
      return nearThrone(this.pos.x - C.x, this.pos.y - C.y);
    }

    // On s'approche : un souffle, la musique se tait, sa tête tombe et la
    // couronne roule à ses pieds
    bowKing() {
      this.kingBowed = true;
      const C = INTERIORS.cave.at, head = { x: C.x + THRONE.x, y: C.y + THRONE.y - 70 };
      this.speak('roi', this.sceneLines('roi', [0, 1, 2, 3, 4, 5, 6, 7], w => w === 'kari' ? () => this.heroHead() : () => head));
      audio.play('presence');
      audio.hush(9);
      this.time.delayedCall(1300, () => {
        this.throne.setTexture('throne-bowed');
        audio.play('clang');
        this.jolt(0.0015);
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
      { const C = INTERIORS.crypt.at, at = { x: this.chest.x - 10, y: this.chest.y - 10 };
        this.speak('crypte', this.sceneLines('crypte', null, w => w === 'kari' ? () => this.heroHead() : () => at)); }
      this.chestOpen = true; this.chestBusy = true;
      this.facing = 'back'; this.player.setFrame('back-idle');
      this.chest.setTexture('chest-ajar');
      this.time.delayedCall(380, () => {
        this.chest.setTexture('chest-open');
        this.chestBusy = false;                      // (le sceau en jaillit : checkBodyRelics)
        this.jolt(0.002);
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
      b.prev = { x: b.x, y: b.y };
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
      this.rowboatSprite.setTexture(`rowboat-row${t}`).setFlipX(b.flip);
      this.pos = { x: b.x, y: b.y };
    }

    placeRowboat(alpha) {
      const b = this.rowboat, p = b.prev || b;
      const x = p.x + (b.x - p.x) * alpha, y = p.y + (b.y - p.y) * alpha;
      this.rowboatSprite.setPosition(Math.round(x) + 0.5, Math.round(y)).setDepth(b.y);
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
      // L'éclair : le noir autour de la vue s'efface un instant
      if (sightCanvas) sightCanvas.style.opacity = roofed(this.inside) || weather.flash < 0.01 ? '' : (1 - 0.8 * weather.flash).toFixed(2);
      if (roofed(this.inside)) {
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
        skyCtx.fillStyle = c === 'w' ? WHITE : palette[c];
        skyCtx.fillRect(x, y, w, h);
      });
      // Le flash : toute la vue blanchit un instant
      if (weather.flash > 0.02) {
        skyCtx.globalAlpha = 0.38 * weather.flash;
        skyCtx.fillStyle = WHITE;
        skyCtx.fillRect(v.x - 2, v.y - 2, v.width + 4, v.height + 4);
      }
      skyCtx.globalAlpha = 1;
    }

    cull() {
      const v = this.cameras.main.worldView, m = 24;
      const x0 = v.x - m, x1 = v.right + m, y0 = v.y - m, y1 = v.bottom + m;
      for (const chunk of this.chunks.values()) {
        for (const img of chunk.images) {
          if (img.hiddenForGood || !img.scene) continue;   // (détruite : on l'ignore)
          const top = img.originY ? img.y - img.height : img.y;
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
          ground.setLive(cx, cy, false);
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
          if (made.live) ground.setLive(cx, cy, false);
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
      // La tuile du sol : peinte une fois, puis gardée en réserve
      const tile = yield* ground.tile(cx, cy);
      ground.setLive(cx, cy, true);
      made.live = true;
      const groundKey = `chunk-${key}`;
      // (une préparation abandonnée a pu laisser ses textures)
      for (const k of [groundKey, `objects-${key}`]) this.dropTexture(k);
      this.textures.addCanvas(groundKey, tile.canvas);
      const images = made.images, textures = made.textures;
      textures.push(groundKey);
      images.push(this.add.image(cx * CHUNK, cy * CHUNK, groundKey).setOrigin(0, 0).setDepth(DEPTH_GROUND));

      // Tous les objets du morceau dans une seule planche : un seul envoi à la
      // carte graphique. Les arbres y ont quatre images (penchés de −1 à +2
      // pixels à la cime) : le vent les fait passer de l'une à l'autre. La
      // planche est gardée avec la tuile : elle n'est faite qu'une fois.
      const objs = objectsInChunk(cx, cy);
      yield;
      const swayers = [];
      if (objs.length) {
        let atlas = tile.atlas;
        if (!atlas) {
          atlas = yield* this.paintAtlas(objs);
          ground.keepAtlas(cx, cy, atlas);
        }
        const pieces = atlas.pieces;
        const objKey = `objects-${key}`;
        const tex = this.textures.addCanvas(objKey, atlas.canvas);
        textures.push(objKey);
        for (const p of pieces) tex.add(`${p.i}-${p.v}`, 0, p.x, p.y, p.w, p.h);
        for (let i = 0; i < objs.length; i++) {
          const o = objs[i];
          const tree = o.type === 'tree';
          const rest = tree ? LEANS.indexOf(0) : 0;
          const im = this.add.image(o.x - o.art.ax - (tree ? LEAN_PAD : 0), o.y + 1, objKey, `${i}-${rest}`)
            .setOrigin(0, 1).setDepth(o.depthY ?? o.y);
          images.push(im);
          o.img = im; im.obj = o;
          // Abattu ou brisé lors d'une partie précédente : on le montre tel quel
          const k = `${o.x},${o.y}`;
          if (this.wrecked.has(k)) {
            const w = this.wrecked.get(k);
            if (tree) { o.fallen = true; this.layTree(o, w, true); continue; }
            o.broken = true; im.setVisible(false); im.hiddenForGood = true;
            for (const f of this.rockPieces(o)) images.push(f);
            continue;
          }
          // Ébréché lors d'une partie précédente
          const nChips = o.type === 'boulder' ? this.chips.get(k) : 0;
          if (nChips) {
            const c = this.chipRock(o, nChips, false, { images: [], textures: [] });
            images.push(...c.images); textures.push(...c.textures);
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

    // La planche des objets d'un morceau (générateur)
    *paintAtlas(objs) {
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
      const canvas = document.createElement('canvas');
      canvas.width = ATLAS_W; canvas.height = y + rowH + 1;
      const ctx = canvas.getContext('2d');
      const img = ctx.createImageData(canvas.width, canvas.height), d = img.data;
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
      // (les lignes de pixels ne servent plus : on ne garde que leur place)
      return { canvas, pieces: pieces.map(({ i, v, x, y, w, h }) => ({ i, v, x, y, w, h })) };
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
        world: WORLD_VERSION, island: ISLAND,
        // Dedans, on retient le seuil (la pièce est hors de l'île)
        // (sur la sente, au pied de la falaise)
        x: Math.round(this.inside ? INTERIORS[this.inside].exit.x : this.climb ? LEDGE.bottom.x : this.pos.x),
        y: Math.round(this.inside ? INTERIORS[this.inside].exit.y : this.climb ? LEDGE.bottom.y : this.pos.y),
        rowboat: { x: Math.round(this.rowboat.x), y: Math.round(this.rowboat.y) },
        chestOpen: this.chestOpen,
        watcherGone: this.watcherGone,
        said: [...this.said], deaths: this.deaths, salt: this.salt, clotildeFree: this.clotildeFree,
        seen4: encodeSeen(this.seen4), veve: [...this.veveDone], seen: encodeSeen(this.seen),
        chapters: [...this.chapters],
        kingBowed: this.kingBowed,
        relics: [...this.relics], relicDrops: this.relicDrops, belt: this.belt,
        fire: this.fire == null ? null : Math.round(this.fire * 10) / 10,
        mothDead: this.mothDead,
        wrecked: Object.fromEntries(this.wrecked),
        chips: Object.fromEntries(this.chips),
        tally: this.tally,
        facing: this.facing, flip: this.flip,
        steps: this.stepCount, distance: Math.round(this.distance),
        foeDead: this.foe ? !this.foe.alive : false,
        wolvesDead: this.pack ? this.pack.deadList : [],
        sigrunFree: this.sigrunFree, met: [...this.met], cubes: [...(this.cubesTouched || [])], passage: !!this.passage,
        hvitFree: this.hvitFree, wolvesSpared: this.wolvesSpared, templeOpen: this.templeOpen, aube: this.aube,
        given: Object.fromEntries(this.given),
      });
    }

    backToShore() {
      this.climb = null;
      if (this.rowing) { this.rowing = false; this.rowboatSprite.setTexture('rowboat-empty'); this.player.setVisible(true); this.cape.setVisible(true); }
      if (this.inside === 'sno4') this.showSno4(false);
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
    scale: { mode: Phaser.Scale.NONE, zoom: fit.factor / fit.dpr },
    // (le pas fixe de la scène fait foi : pas de lissage du temps par Phaser,
    // qui ralentissait tout aux faibles cadences)
    fps: { smoothStep: false },
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

  // Le flou de maquette : chaque image, une copie en tout petit (un pixel pour
  // 3 ou 6 pixels d'écran, légèrement floutée à cette taille), que le
  // navigateur agrandit en douceur sous un masque radial (style.css, .tilt).
  // Faite juste après le rendu, tant que l'image du jeu est encore là.
  const screenEl = parent.parentElement;
  const blurLayers = [...screenEl.querySelectorAll('.tilt canvas')].map((c, i) => ({ c, ctx: c.getContext('2d'), k: i ? 6 : 3, blur: i ? 1.5 : 1 }));
  function blurCopy() {
    if (!screenEl.classList.contains('tilt-on') || !blurLayers.length || isTitle()) return;
    const src = game.canvas, w = src.clientWidth, h = src.clientHeight;
    for (const L of blurLayers) {
      const W = Math.max(1, Math.round(w / L.k)), H = Math.max(1, Math.round(h / L.k));
      if (L.c.width !== W || L.c.height !== H) { L.c.width = W; L.c.height = H; }
      L.ctx.filter = `blur(${L.blur}px)`;
      L.ctx.drawImage(src, 0, 0, W, H);
      L.ctx.drawImage(sky, 0, 0, W, H);
    }
  }
  game.events.on('postrender', blurCopy);

  // Le calque de la neige a la taille du canevas, agrandi de même
  function sizeSky() {
    const c = game.canvas;
    sky.width = c.width; sky.height = c.height;
    sky.style.width = c.style.width;
    sky.style.height = c.style.height;
  }

  // Le canevas à un facteur d'agrandissement (pixels physiques par pixel du
  // canevas) : sa taille couvre l'écran, la vue garde son centre
  function setFactor(f) {
    const r = parent.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const { width, height } = canvasSize(r.width, r.height, f, dpr);
    const sc = game.scene.getScene('island'), cam = sc?.cameras?.main;
    const mid = cam && { x: cam.midPoint.x, y: cam.midPoint.y };
    if (game.scale.width !== width || game.scale.height !== height) game.scale.resize(width, height);
    // (après resize : setZoom pose la taille affichée ; dans l'autre ordre, le
    // canevas gardait l'ancienne taille affichée)
    game.scale.setZoom(f / dpr);
    sizeSky();
    if (sc?.zoom) {
      sc.zoom.canvas = f;
      if (mid) cam.centerOn(mid.x, mid.y);
      sc.cullClock = 0;
    }
    drawSight();
    // Les lignes du CRT : une par pixel du canevas, d'un pixel physique
    screenEl.style.setProperty('--px', `${f / dpr}px`);
    screenEl.style.setProperty('--line', `${1 / dpr}px`);
    // (l'interface — cadre de la touche E, consignes, messages — garde la
    // taille du plan large : elle ne suit pas le zoom)
    screenEl.style.setProperty('--ui-px', `${baseFactor() / dpr}px`);
  }

  // Le cercle de vue : net autour du viking, flou vers son bord (les masques
  // des calques flous, style.css, lisent sa taille), puis le noir, le plus
  // sombre du jeu (le bleu nuit), tramé par paliers comme le halo de la torche.
  // Sa forme est celle de `sightShape` (elle vit avec le décor). En pixels du
  // canevas : il a la taille et l'agrandissement du jeu. Sa trame est accrochée
  // au monde (comme celle de la torche) : elle ne fait pas grille fixe devant
  // le paysage qui défile (`placeSight`, à chaque pixel de défilement).
  const sightCanvas = screenEl.querySelector('#sight');
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const sight = { img: null, ctx: null, W: 0, H: 0, norm: null, ang: null, band: null, n: 0, ox: -1, oy: -1, at: 0 };
  // La géométrie : à chaque pixel, sa distance à l'ellipse de base (1 = le
  // bord) et son angle ; refaite quand la taille du canevas change
  function drawSight() {
    if (!sightCanvas) return;
    const c = game.canvas, W = c.width, H = c.height;
    sightCanvas.width = W; sightCanvas.height = H;
    sightCanvas.style.width = c.style.width; sightCanvas.style.height = c.style.height;
    // (le centre de l'écran, pas celui du canevas qui déborde un peu)
    const r = parent.getBoundingClientRect(), k = W / (parseFloat(c.style.width) || W);
    const cx = r.width * k / 2, cy = r.height * k / 2;
    const ry = SIGHT.ry * cy * 2, rx = SIGHT.rx * cy * 2;
    sightShape.rx = rx; sightShape.ry = ry; sightShape.drawn.fill(-1);
    const norm = new Float32Array(W * H), ang = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, i = y * W + x;
      norm[i] = Math.hypot(dx / rx, dy / ry);
      // (l'angle ne sert que dans la zone où le bord peut passer)
      ang[i] = norm[i] > 0.3 && norm[i] < 1.6 ? (Math.atan2(dy, dx) / (Math.PI * 2) + 1) % 1 * SIGHT_N : 0;
    }
    Object.assign(sight, {
      ctx: sightCanvas.getContext('2d'), W, H, norm, ang, ox: -1, oy: -1,
      img: sightCanvas.getContext('2d').createImageData(W, H), band: new Int32Array(W * H * 3), n: 0,
    });
    paintSight();
    // La taille du cercle, en pixels CSS, pour les masques du flou
    screenEl.style.setProperty('--sight-rx', `${(BLUR_SCALE.rx * cy * 2 / k).toFixed(1)}px`);
    screenEl.style.setProperty('--sight-ry', `${(BLUR_SCALE.ry * cy * 2 / k).toFixed(1)}px`);
  }
  // La forme : le noir plein, et la bande tramée autour (pixel, niveau × 16)
  function paintSight() {
    if (!sight.img) return;
    const { img, W, H, norm, ang, band } = sight, d = img.data, f = sightShape.f, N = SIGHT_N, rgb = RGB.k;
    d.fill(0);
    let n = 0;
    for (let i = 0; i < W * H; i++) {
      const nd = norm[i];
      if (nd < 0.3) continue;                                  // bien dedans : transparent
      // La portée dans cette direction (interpolée entre deux rayons)
      const a = ang[i], i0 = a | 0, k = a - i0, fa = f[i0 % N] * (1 - k) + f[(i0 + 1) % N] * k;
      const t = (nd / fa - SIGHT.fade) / (1 - SIGHT.fade);
      if (t <= 0) continue;
      const j = i * 4;
      d[j] = rgb[0]; d[j + 1] = rgb[1]; d[j + 2] = rgb[2]; d[j + 3] = 255;
      if (t < 1) { band[n++] = i; band[n++] = Math.round(t * 16); n++; }
    }
    sight.n = n; sight.ox = -1;
    sightShape.drawn.set(f);
    placeSight();
  }
  // La trame du bord suit le défilement de la vue (modulo 4)
  function placeSight() {
    if (!sight.img) return;
    const v = game.scene.getScene('island')?.cameras?.main?.worldView;
    const ox = v ? ((Math.floor(v.x) % 4) + 4) % 4 : 0, oy = v ? ((Math.floor(v.y) % 4) + 4) % 4 : 0;
    if (ox === sight.ox && oy === sight.oy) return;
    sight.ox = ox; sight.oy = oy;
    const { band, img, W, n } = sight, d = img.data;
    for (let m = 0; m < n; m += 3) {
      const i = band[m], x = i % W, y = (i / W) | 0;
      d[i * 4 + 3] = band[m + 1] > BAYER[((y + oy) & 3) * 4 + ((x + ox) & 3)] ? 255 : 0;
    }
    sight.ctx.putImageData(img, 0, 0);
  }
  // Après chaque image : la forme a changé ? (dix fois par seconde au plus) ;
  // sinon, la trame suit le défilement
  game.events.on('postrender', () => {
    const f = sightShape.f, dr = sightShape.drawn;
    if (sight.img && performance.now() - sight.at > 90) {
      let moved = 0;
      for (let i = 0; i < SIGHT_N; i++) moved = Math.max(moved, Math.abs(f[i] - dr[i]));
      if (moved > 0.008) { sight.at = performance.now(); paintSight(); return; }
    }
    placeSight();
  });

  // Le zoom à la molette (v1.53.5) : par défaut le plan le plus large (le
  // facteur de base) ; on rapproche d'un cran entier à la fois, jusqu'au
  // double (on ne voit plus que la moitié de la largeur). Toujours des pixels
  // entiers : c'est le facteur qui change, la caméra reste à 1.
  // Le cran choisi est gardé (`prefs.zoom`, `onZoom`) et rendu au rechargement ;
  // borné à l'écran du moment sans être oublié (un écran plus petit le réduit)
  let zoomSteps = Math.max(0, Math.round(+zoom) || 0), wheelAcc = 0;
  const baseFactor = () => { const r = parent.getBoundingClientRect(); return r.width && r.height ? fitScreen(r.width, r.height).factor : 1; };
  const zoomedFactor = () => { const b = baseFactor(); return b + Math.min(b, zoomSteps); };
  screenEl.addEventListener('wheel', e => {
    if (isTitle()) return;
    e.preventDefault();                                    // (ni défilement ni zoom de la page)
    wheelAcc += e.deltaY * (e.deltaMode === 1 ? 33 : 1);
    if (Math.abs(wheelAcc) < 60) return;
    const step = wheelAcc < 0 ? 1 : -1;                    // vers le haut : on rapproche
    wheelAcc = 0;
    const before = zoomSteps;
    const b = baseFactor();
    zoomSteps = Math.max(0, Math.min(b, Math.min(b, zoomSteps) + step));
    if (zoomSteps !== before) { setFactor(zoomedFactor()); onZoom(zoomSteps); }
  }, { passive: false });

  // L'écran change de taille (fenêtre, bandeau, densité) : nouveau facteur de
  // base, et le zoom choisi par-dessus
  function resize() {
    const r = parent.getBoundingClientRect();
    if (!r.width || !r.height) return;
    setFactor(zoomedFactor());
  }
  game.events.once('ready', () => {
    setFactor(fit.factor);
    parent.append(sky);
    new ResizeObserver(() => resize()).observe(parent);
  });
  window.addEventListener('resize', resize);

  return {
    game,
    scene: () => game.scene.getScene('island'),
    // Caméra sur le viking, l'île chargée autour de lui : vrai quand c'est prêt
    focus() {
      const sc = game.scene.getScene('island');
      if (!sc?.pos || !sc.chunks) return false;
      sc.cameras.main.centerOn(sc.pos.x, sc.pos.y);
      sc.updateChunks(true);
      sc.cull();
      sc.settle = 8;
      sc.focused = true;
      return true;
    },
    // Prêt à être vu : les morceaux autour chargés, la scène posée quelques images
    ready() {
      const sc = game.scene.getScene('island');
      if (!sc?.pos || !sc.chunks) return false;
      if (!sc.focused) this.focus();
      return !sc.jobs?.size && sc.settle <= 0;
    },
    save: () => game.scene.getScene('island')?.persist(),
    // L'inventaire : les reliques et celles déjà trouvées
    relics: () => RELICS.map(r => ({ id: r.id, name: r.name, about: r.about, rows: designRows(relicDesign(r.id), r.rows), found: !!game.scene.getScene('island')?.relics?.has(r.id) })),
    // La ceinture : un id ou null par crochet ; déplacer une relique d'un crochet à un autre (échange)
    belt: () => [...(game.scene.getScene('island')?.belt || [])],
    moveRelic(from, to) {
      const sc = game.scene.getScene('island'), b = sc?.belt;
      if (!b || from === to || from < 0 || to < 0 || from >= b.length || to >= b.length) return;
      [b[from], b[to]] = [b[to], b[from]];
      sc.persist();
    },
    setWind: name => weather.setPreset(name),
    // La touche d'action (E), aussi au doigt (main.js : le bouton « E · … »)
    act: () => game.scene.getScene('island')?.act(),
    wishes: () => game.scene.getScene('island')?.wishes() || [],
    // Un éclair, tout de suite (debug, harnais)
    strike: (near = 1) => weather.strike(near),
    // Le pas des morts : un lieu vu de la carte, et l'on y est
    canTravel: () => !!game.scene.getScene('island')?.canTravel(),
    travel: (x, y) => !!game.scene.getScene('island')?.travel(x, y),
    // La carte : les cases vues, et où l'on est
    mapData() {
      const sc = game.scene.getScene('island');
      if (!sc?.seen) return null;
      if (sc.inside === 'sno4') {
        const A = INTERIORS.sno4.at;
        return { world: 'sno4', veve: [...sc.veveDone], seen: sc.seen4, cell: SEEN4_CELL, cols: SEEN4_COLS, rows: SEEN4_ROWS, pos: { x: sc.pos.x - A.x, y: sc.pos.y - A.y } };
      }
      const inside = sc.inside && INTERIORS[sc.inside];
      return { world: 'sno7', seen: sc.seen, cell: SEEN_CELL, n: SEEN_N, pos: inside ? inside.door : { ...sc.pos } };
    },
    // La qualité de l'image (Réglages) : les flocons (CRT et flou : main.js)
    setQuality(q) { quality = q; weather.density = q <= 1 ? 0.5 : 1; },
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
