/* Le mode debug, pour le playtest (tools/playtest/) : chargé seulement avec
   `?debug=1` dans l'adresse (main.js). Sans ce paramètre, rien de tout ceci
   n'existe. Il ne change rien au jeu : il le regarde (état, journal), et
   offre quelques raccourcis (téléport, heure, météo, vitesse, graine).

   window.__kingvi : state(), events, trail, places, teleport(lieu),
   setTime(phase), setWeather(ambiance), eclair(près), timeScale(n), setSeed(n), enter(),
   reset(). Si la page a une fonction window.__kingviEvent (le harnais
   l'expose), chaque événement lui est passé aussitôt. */
import { DAY_CYCLE, DAY_LENGTH, daylightAt } from './daylight.js?v=1.55.0';
import { WEATHER_PRESETS } from './weather.js?v=1.55.0';
import { chapterById } from './chapters.js?v=1.55.0';
import { audio } from './audio.js?v=1.55.0';
import { THRONE, caveWalkable } from './cave.js?v=1.55.0';
import { CHEST } from './crypt.js?v=1.55.0';
import { ROOM_ENTRY } from './interior.js?v=1.55.0';
import {
  trail, isLand, blocked, houseBlocked, inLake, deepForest, forestDensity,
  HOUSE, HOUSE_DOOR_OUT, NECRO, CLIFF, CAVE_DOOR_OUT, STATUE_BASE, STATUE2_BASE,
  STATUE3_DOOR_OUT, WATCHER_AT, WOLF_DEN, GLADE, HVIT_AT, TEMPLE_DOOR_OUT, SIGRUN_AT, GROVE_TREE, CROWS, LAKE, ARCH, RUINS, PIER, LEDGE, MOTH_LAIR,
} from './world.js?v=1.55.0';

export const DEBUG_SAVE_KEY = 'kingvi:debug:save';
const params = new URLSearchParams(location.search);

// ── L'horloge : le jour, la nuit et le vent suivent Date.now ; en debug, on
// peut l'avancer (setTime) ou l'accélérer (timeScale) ──
const realNow = Date.now.bind(Date);
let clockBase = realNow(), clockVirtual = clockBase, clockScale = 1;
Date.now = () => {
  const r = realNow();
  clockVirtual += (r - clockBase) * clockScale;
  clockBase = r;
  return Math.round(clockVirtual);
};
const shiftClock = ms => { Date.now(); clockVirtual += ms; };

// ── Le hasard du combat et des bêtes (l'île a sa propre graine, fixe) ──
const realRandom = Math.random;
let seed = null;
function setSeed(n) {
  seed = n >>> 0;
  let s = seed;
  // mulberry32
  Math.random = () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
if (params.has('seed')) setSeed(Number(params.get('seed')));

const INSIDE_NAMES = { house: 'maison', crypt: 'crypte', cave: 'grotte', temple: 'temple' };
// Où sont posées les pièces, loin en mer (game.js, INTERIORS)
const ROOMS = { house: { x: 700, y: 700 }, crypt: { x: 400, y: 400 }, cave: { x: 300, y: 1000 }, temple: { x: 150, y: 150 } };
const t0 = performance.now();

export function attachDebug({ game, dayClock, enter, freeTime = () => {} }) {
  const events = [];
  let gameTime = 0, speed = 1, sc = null;

  const zoneOf = () => {
    if (sc.inside) return `interieur:${INSIDE_NAMES[sc.inside] || sc.inside}`;
    if (sc.rowing) return 'lac';
    if (sc.climb) return 'sente';
    if (Math.hypot(sc.pos.x - MOTH_LAIR.x, sc.pos.y - MOTH_LAIR.y) < 220 && sc.pos.y < LEDGE.top.y + 4) return 'plateau';
    const { x, y } = sc.pos, end = trail.at(-1);
    if (x > CLIFF.x0 - 60 && x < CLIFF.x1 + 60 && y > CLIFF.y - 40 && y < CLIFF.y + 110) return 'falaise';
    if (Math.hypot(x - end.x, y - end.y) < 160) return 'autre';
    if (Math.hypot(x - HOUSE.x, y - HOUSE.y) < 90) return 'maison';
    if (Math.hypot(x - GLADE.x, y - GLADE.y) < GLADE.r + 20) return 'clairiere';
    if (((x - LAKE.x) / (LAKE.rx + 50)) ** 2 + ((y - LAKE.y) / (LAKE.ry + 50)) ** 2 < 1) return 'lac';
    if (deepForest(x, y) > 0.6) return 'noire';
    if (forestDensity(x, y) > 0.12) return 'foret';
    if (x > NECRO.x - 30 && x < NECRO.x + 260 && y > NECRO.y - 30 && y < NECRO.y + 200) return 'morts';
    if (x < sc.spawn.x + 250) return 'greve';
    return 'plaine';
  };

  function log(type, data = {}) {
    const e = {
      t: Math.round(performance.now() - t0), jeu: Math.round(gameTime * 10) / 10, type, ...data,
      zone: sc?.pos ? zoneOf() : null, x: sc?.pos ? Math.round(sc.pos.x) : null, y: sc?.pos ? Math.round(sc.pos.y) : null,
    };
    events.push(e);
    try { window.__kingviEvent?.(e); } catch { /* le harnais est parti */ }
  }

  // ── Les sons : les captures sont muettes, le journal dit ce qu'on entend ──
  let tickSounds = null;
  const play = audio.play.bind(audio), hush = audio.hush.bind(audio), setMood = audio.setMood.bind(audio);
  let crowsGone = false, lastMusic = null;
  audio.play = (name, opts) => {
    tickSounds?.push(name);
    if (name !== 'swing') log('son', { son: name, n: opts?.n });
    if (name === 'caw' && opts?.n === 3 && sc?.pos) {
      const near = Math.hypot(sc.pos.x - CROWS.x, sc.pos.y - CROWS.y) < 160;
      if (near && !crowsGone) { crowsGone = true; log('corbeaux-envoles'); } else if (!near) log('charognards-fuient');
    }
    return play(name, opts);
  };
  audio.hush = s => { log('silence', { secondes: s }); return hush(s); };
  audio.setMood = m => {
    const e = m.energy;
    const music = e >= 0.95 ? 'combat' : e >= 0.55 ? 'tendue' : e <= 0.1 ? 'presque muette' : m.muffled ? 'étouffée' : m.dark > 0.5 ? 'sourde' : 'calme';
    if (sc && !sc.dead && music !== lastMusic) { lastMusic = music; log('musique', { humeur: music }); }
    return setMood(m);
  };

  // ── Les lieux où se téléporter : juste avant chaque repère, sur la piste ──
  const nearestTrail = p => trail.reduce((best, q) => (Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(best.x - p.x, best.y - p.y) ? q : best), trail[0]);
  const before = (p, d) => { let i = nearestTrail(p).i; while (i > 0 && Math.hypot(trail[i].x - p.x, trail[i].y - p.y) < d) i--; return trail[i]; };
  const firstOnTrail = test => trail.find(p => test(p.x, p.y)) || trail[0];
  const free = (x, y) => isLand(x, y) && !houseBlocked(x, y) && !blocked(x, y);
  const nearFree = ({ x, y }) => {
    for (let r = 0; r <= 60; r += 2) for (let k = 0; k < (r ? 16 : 1); k++) {
      const a = k / 16 * Math.PI * 2, px = Math.round(x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r);
      if (free(px, py)) return { x: px, y: py };
    }
    return { x: Math.round(x), y: Math.round(y) };
  };
  const lakeShore = () => {
    const b = sc.rowboat;
    for (let d = 4; d < 120; d++) if (free(Math.round(b.x), Math.round(b.y - d)) && !inLake(b.x, b.y - d)) return { x: Math.round(b.x), y: Math.round(b.y - d - 3) };
    return nearFree(b);
  };
  const PLACES = {
    barque: () => sc.spawn,
    morts: () => firstOnTrail((x, y) => x > NECRO.x - 30 && y > NECRO.y - 30 && y < NECRO.y + 200),
    // Au sud de l'arche, face à son ouverture (on passe dessous en montant)
    arche: () => nearFree({ x: ARCH.x, y: ARCH.y + 30 }),
    colonne: () => nearFree({ x: RUINS.colonne.x, y: RUINS.colonne.y + 30 }),
    socle: () => nearFree({ x: RUINS.socle.x, y: RUINS.socle.y + 30 }),
    pont: () => nearFree({ x: PIER.x + 72, y: PIER.y - 68 }),
    ruine: () => nearFree({ x: RUINS.arche.x, y: RUINS.arche.y + 30 }),
    foret: () => firstOnTrail((x, y) => forestDensity(x, y) > 0.12),
    'freya-ensevelie': () => before(STATUE_BASE, 70),
    'foret-noire': () => firstOnTrail((x, y) => deepForest(x, y) > 0.6),
    arbre: () => before(GROVE_TREE, 120),
    bosquet: () => before(GLADE, GLADE.r + 170),
    louve: () => nearFree({ x: HVIT_AT.x + 12, y: HVIT_AT.y + 4 }),
    loups: () => nearFree({ x: LEDGE.top.x, y: LEDGE.top.y - 6 }),
    sigrun: () => nearFree({ x: SIGRUN_AT.x - 10, y: SIGRUN_AT.y + 6 }),
    temple: () => nearFree({ x: TEMPLE_DOOR_OUT.x, y: TEMPLE_DOOR_OUT.y + 14 }),
    guetteur: () => before(WATCHER_AT, 110),
    'freya-debout': () => before(STATUE2_BASE, 70),
    maison: () => before(HOUSE_DOOR_OUT, 50),
    interieur: () => before(HOUSE_DOOR_OUT, 14),
    viking: () => before(trail.at(-1), 170),
    falaise: () => nearFree({ x: CAVE_DOOR_OUT.x, y: CAVE_DOOR_OUT.y + 60 }),
    grotte: () => nearFree({ x: CAVE_DOOR_OUT.x, y: CAVE_DOOR_OUT.y + 14 }),
    // Au pied de la sente, et en haut, sur le plateau ; le megamoth un peu plus loin
    sente: () => nearFree({ x: LEDGE.bottom.x, y: LEDGE.bottom.y + 10 }),
    plateau: () => ({ ...LEDGE.top }),
    megamoth: () => nearFree({ x: MOTH_LAIR.x, y: MOTH_LAIR.y + 80 }),
    roi: () => nearFree({ x: CAVE_DOOR_OUT.x, y: CAVE_DOOR_OUT.y + 14 }),
    lac: () => lakeShore(),
    ilot: () => nearFree({ x: STATUE3_DOOR_OUT.x, y: STATUE3_DOOR_OUT.y + 6 }),
    crypte: () => nearFree({ x: STATUE3_DOOR_OUT.x, y: STATUE3_DOOR_OUT.y + 6 }),
  };
  const GO_IN = { interieur: 'house', grotte: 'cave', roi: 'cave', crypte: 'crypt' };
  const wait = ms => new Promise(r => setTimeout(r, ms / Math.max(1, speed)));
  // Les morceaux de l'île autour de la vue : tous prêts (ou 15 s au plus)
  const loaded = async () => {
    const t = performance.now();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    sc.updateChunks(true);
    while (sc.jobs?.size && performance.now() - t < 15000) await new Promise(r => setTimeout(r, 50));
  };
  const settle = async () => { while (sc.moving) await new Promise(r => setTimeout(r, 30)); };

  async function teleport(where) {
    const p = typeof where === 'string' ? PLACES[where]?.() : where;
    if (!p) throw new Error(`Lieu inconnu : ${where}. Lieux : ${Object.keys(PLACES).join(', ')}`);
    await settle();
    log('teleport', { vers: typeof where === 'string' ? where : 'point' });
    teleporting = true;
    try { await go(where, p); } finally { teleporting = false; }
    return state();
  }
  async function go(where, p) {
    if (sc.inside || sc.rowing) sc.backToShore();
    sc.keys.clear();
    await new Promise(resolve => sc.teleport(Math.round(p.x), Math.round(p.y), resolve));
    await settle();
    await loaded();
    const key = GO_IN[where];
    if (key) {
      sc.goInside(key);
      await wait(100); await settle(); await loaded();
      if (where === 'roi') {
        // Dans la grotte, quelques pas devant le trône (on s'en approche à pied)
        const at = ROOMS.cave;
        // le premier point praticable devant l'estrade, à une vingtaine de pas
        let spot = { x: THRONE.x, y: THRONE.y + 24 };
        search: for (let dy = 18; dy < 40; dy++) for (let dx = 0; dx < 40; dx++) for (const sx of [1, -1]) {
          if (caveWalkable(THRONE.x + dx * sx, THRONE.y + dy)) { spot = { x: THRONE.x + dx * sx, y: THRONE.y + dy }; break search; }
        }
        sc.pos = { x: at.x + spot.x, y: at.y + spot.y };
        sc.placePlayer();
        sc.cameras.main.centerOn(sc.pos.x, sc.pos.y);
      }
    }
  }

  // ── Le jour et le vent ──
  function setTime(phase) {
    freeTime();
    let start = 0;
    for (const [name, d] of DAY_CYCLE) {
      if (name === phase) {
        const now = ((dayClock() % DAY_LENGTH) + DAY_LENGTH) % DAY_LENGTH;
        const target = start + d * 0.5;
        shiftClock((((target - now) % DAY_LENGTH) + DAY_LENGTH) % DAY_LENGTH * 1000);
        sc?.applyDaylight();
        log('heure-forcee', { phase });
        return daylightAt(dayClock()).phase;
      }
      start += d;
    }
    throw new Error(`Phase inconnue : ${phase} (${DAY_CYCLE.map(([n]) => n).join(', ')})`);
  }
  function setWeather(name) {
    if (name !== 'cycle' && !WEATHER_PRESETS[name]) throw new Error(`Ambiance inconnue : ${name} (cycle, ${Object.keys(WEATHER_PRESETS).join(', ')})`);
    game.setWind(name);
    log('meteo-forcee', { ambiance: name });
    return name;
  }
  function timeScale(n) {
    speed = Math.max(0.1, Math.min(20, Number(n) || 1));
    Date.now(); clockScale = speed;
    if (sc) { sc.time.timeScale = speed; sc.tweens.timeScale = speed; }
    game.game.anims.globalTimeScale = speed;
    log('vitesse', { facteur: speed });
    return speed;
  }

  // ── L'état, d'un coup d'œil ──
  function state() {
    if (!sc?.pos) return { pret: false };
    const d = daylightAt(dayClock()), f = sc.foe, p = sc.pack;
    return {
      pret: true,
      accueil: !document.getElementById('title').hidden,
      x: Math.round(sc.pos.x * 10) / 10, y: Math.round(sc.pos.y * 10) / 10, zone: zoneOf(),
      dedans: sc.inside ? INSIDE_NAMES[sc.inside] : null, enBarque: !!sc.rowing,
      pv: sc.dead ? 0 : sc.hp, pvMax: sc.maxHp, endurance: Math.round(sc.stamina * 100) / 100,
      sente: sc.climb ? Math.round(sc.climb.t) : null,
      incendie: sc.fire == null ? null : Math.round(sc.fire * 10) / 10,
      megamoth: { etat: sc.moth.state, pv: sc.moth.hp, haut: Math.round(sc.moth.alt), x: Math.round(sc.moth.pos.x), y: Math.round(sc.moth.pos.y) },
      ceinture: [...(sc.belt || [])],
      mort: !!sc.dead, attaque: !!sc.attacking, court: !!sc.running,
      ennemi: { pv: f.hp, etat: f.state, vivant: f.alive, engage: !!f.engaged, x: Math.round(f.pos.x), y: Math.round(f.pos.y),
        distance: Math.round(Math.hypot(f.pos.x - sc.pos.x, f.pos.y - sc.pos.y)) },
      meute: { etat: p.state, engagee: p.engaged, vivants: p.wolves.filter(w => w.state !== 'dead').length, morts: p.deadList.length,
        loups: p.wolves.map(w => ({ etat: w.state, x: Math.round(w.pos.x), y: Math.round(w.pos.y) })) },
      vent: game.windPhase() || 'cycle',
      jour: d.phase, nuit: Math.round(d.night * 100) / 100, heureCycle: Math.round(((dayClock() % DAY_LENGTH) + DAY_LENGTH) % DAY_LENGTH),
      torche: (sc.torchOn || 0) > 0.5, torcheSoufflee: (sc.torchOut || 0) > 0,
      chapitres: [...sc.chapters], compteur: { ...sc.tally },
      drapeaux: { foeDead: !f.alive, chestOpen: !!sc.chestOpen, watcherGone: !!sc.watcherGone, kingBowed: !!sc.kingBowed },
      distance: Math.round(sc.distance), tempsJeu: Math.round(gameTime * 10) / 10,
      fps: Math.round(game.game.loop.actualFps * 10) / 10, vitesse: speed, graine: seed,
      zoom: Math.round(sc.cameras.main.zoom * 100) / 100, morceauxEnAttente: sc.jobs?.size || 0,
      derniereErreur: localStorage.getItem('kingvi:lastError'),
    };
  }

  // ── Le journal : on compare l'état d'une image à l'autre ──
  let prev = null, teleporting = false, zoneSeen = null, zoneSince = 0;
  // Une zone ne compte qu'après 1,2 s de jeu (sinon, à une lisière, elle clignote)
  const steadyZone = () => {
    const z = zoneOf();
    if (z !== zoneSeen) { zoneSeen = z; zoneSince = gameTime; }
    return !prev || z.startsWith('interieur') || gameTime - zoneSince > 1.2 ? z : prev.zone;
  };
  function watch() {
    // (pendant un téléport, les états de passage ne comptent pas)
    if (teleporting) return;
    const s = {
      zone: steadyZone(), inside: sc.inside, rowing: !!sc.rowing, dead: !!sc.dead,
      foeAlive: sc.foe.alive, foeEngaged: !!sc.foe.engaged, packEngaged: sc.pack.engaged, wolvesDead: sc.pack.deadList.length,
      watcher: !!(sc.watcherGone || sc.watcher?.fading), chest: !!sc.chestOpen, king: !!sc.kingBowed,
      torch: (sc.torchOn || 0) > 0.5, chapters: sc.chapters.size, trees: sc.tally.trees, rocks: sc.tally.rocks,
      day: sc.daylight?.phase, wind: game.windPhase(), flash: (sc.staminaFlash || 0) > 0.3,
      climb: !!sc.climb, fire: sc.fire == null ? -1 : sc.fire >= 70 ? 2 : 1, moth: sc.moth.state, snuffed: (sc.torchOut || 0) > 0,
      title: !document.getElementById('title').hidden,
    };
    if (!prev) { prev = s; log('debut', { zone: s.zone, jour: s.day, vent: s.wind }); return; }
    const was = prev; prev = s;
    if (s.title !== was.title) log(s.title ? 'accueil' : 'entree-en-jeu');
    if (s.climb !== was.climb) log(s.climb ? 'sente-montee' : 'sente-quittee');
    if (s.fire !== was.fire) log(s.fire === 1 ? 'incendie' : s.fire === 2 ? 'toit-effondre' : 'feu');
    if (s.moth !== was.moth) log('megamoth', { etat: s.moth });
    if (s.snuffed && !was.snuffed) log('torche-soufflee');
    if (s.zone !== was.zone) log('zone', { de: was.zone, vers: s.zone });
    if (s.inside !== was.inside) {
      if (was.inside) log('sortie', { lieu: INSIDE_NAMES[was.inside] });
      if (s.inside) log('entree', { lieu: INSIDE_NAMES[s.inside] });
    }
    if (s.rowing !== was.rowing) log(s.rowing ? 'barque-montee' : 'barque-quittee');
    if (!s.dead && was.dead) log('reveil', { zone: s.zone });
    if (!s.foeAlive && was.foeAlive) log('ennemi-abattu');
    if (s.foeEngaged && !was.foeEngaged && s.foeAlive) log('ennemi-engage');
    if (s.packEngaged !== was.packEngaged) log(s.packEngaged ? 'meute-attaque' : 'meute-fin');
    if (s.wolvesDead > was.wolvesDead) log('loup-abattu', { morts: s.wolvesDead });
    if (s.watcher && !was.watcher) log('guetteur-efface');
    if (s.chest && !was.chest) log('coffre-ouvert');
    if (s.king && !was.king) log('roi-incline');
    if (s.torch !== was.torch) log(s.torch ? 'torche-allumee' : 'torche-eteinte');
    if (s.chapters > was.chapters) {
      const id = [...sc.chapters].at(-1), ch = chapterById(id);
      log('chapitre', { id, titre: ch ? `${ch.label} — ${ch.title}` : id });
    }
    if (s.trees > was.trees) log('arbre-abattu', { total: s.trees });
    if (s.rocks > was.rocks) log('rocher-brise', { total: s.rocks });
    if (s.day !== was.day) log('jour', { phase: s.day });
    if (s.wind !== was.wind) log('vent', { phase: s.wind });
    if (s.flash && !was.flash) log('essouffle');
  }

  function wrap(name, after) {
    const fn = sc[name].bind(sc);
    sc[name] = (...args) => after(() => fn(...args), ...args);
  }

  function hook() {
    sc = game.scene();
    if (!sc?.pos || !sc.foe || !sc.pack) { requestAnimationFrame(hook); return; }
    // Le temps du jeu, accéléré ou non
    const update = sc.sys.sceneUpdate;
    sc.sys.sceneUpdate = function (time, delta) {
      gameTime += delta * speed / 1000;
      update.call(this, time, delta * speed);
    };
    sc.events.on('postupdate', watch);
    // Le coup donné : ce que la lame a rencontré, d'après ce qu'on entend
    wrap('impact', run => {
      tickSounds = [];
      const foeHp = sc.foe.hp;
      try { return run(); } finally {
        const s = tickSounds; tickSounds = null;
        const cible = sc.foe.hp < foeHp ? 'ennemi' : s.includes('yelp') ? 'loup' : s.includes('wood') ? 'arbre'
          : s.includes('clang') ? 'pierre' : 'air';
        log('coup-donne', { cible, ennemiPv: cible === 'ennemi' ? sc.foe.hp : undefined });
      }
    });
    // Le coup tourbillonnant : tout ce qu'il a touché autour
    wrap('whirlStrike', run => {
      tickSounds = [];
      const foeHp = sc.foe.hp;
      try { return run(); } finally {
        const s = tickSounds; tickSounds = null;
        log('tourbillon', { ennemi: sc.foe.hp < foeHp, loups: s.filter(n => n === 'yelp').length, arbres: s.filter(n => n === 'wood').length });
      }
    });
    // (la mort arrive au milieu de la blessure : on la note après elle)
    let hurting = false, fell = false;
    wrap('hurt', run => {
      const hp = sc.hp, wolves = sc.pack.engaged;
      hurting = true; fell = false;
      try { return run(); } finally {
        hurting = false;
        if (sc.hp < hp) log('coup-recu', { pv: Math.max(0, sc.hp), source: wolves ? 'loup' : 'autre viking' });
        if (fell) log('mort');
      }
    });
    wrap('fall', run => { if (hurting) fell = true; else log('mort'); return run(); });
    wrap('attack', run => { const a = sc.attacking; const r = run(); if (!a && sc.attacking) log('frappe', { vue: sc.swingView }); return r; });
  }
  hook();

  const api = {
    events,
    get trail() { return trail.map(p => ({ i: p.i, x: Math.round(p.x), y: Math.round(p.y), sang: !!p.blood })); },
    get places() { return Object.fromEntries(Object.keys(PLACES).map(k => [k, PLACES[k]()])); },
    lieux: Object.keys(PLACES),
    // La scène Phaser elle-même (pour les scripts de test)
    get scene() { return sc; },
    // Des points utiles au harnais, en coordonnées du monde
    get cibles() {
      return {
        barqueDuLac: { x: Math.round(sc.rowboat.x), y: Math.round(sc.rowboat.y) }, ilot: STATUE3_DOOR_OUT,
        porteMaison: HOUSE_DOOR_OUT, porteGrotte: CAVE_DOOR_OUT, ennemi: { x: Math.round(sc.foe.pos.x), y: Math.round(sc.foe.pos.y) },
        entreeMaison: { x: ROOMS.house.x + ROOM_ENTRY.x, y: ROOMS.house.y + ROOM_ENTRY.y },
        coffre: { x: ROOMS.crypt.x + CHEST.x, y: ROOMS.crypt.y + CHEST.y }, trone: { x: ROOMS.cave.x + THRONE.x, y: ROOMS.cave.y + THRONE.y },
        tanière: { x: WOLF_DEN.x, y: WOLF_DEN.y }, guetteur: WATCHER_AT,
      };
    },
    // Un point du monde → la position du pointeur dans la page
    toScreen(x, y) {
      const cam = sc.cameras.main, canvas = game.game.canvas, r = canvas.getBoundingClientRect();
      const k = r.width / canvas.width;
      return { x: r.left + (x - cam.worldView.x) * cam.zoom * k, y: r.top + (y - cam.worldView.y) * cam.zoom * k };
    },
    state, teleport, setTime, setWeather, timeScale,
    eclair: (near = 1) => { game.strike(near); log('eclair', { pres: near }); },
    setSeed: n => { setSeed(n); log('graine', { graine: seed }); return seed; },
    unseed: () => { Math.random = realRandom; seed = null; },
    enter: () => { enter(); },
    reset: () => {
      localStorage.removeItem(DEBUG_SAVE_KEY);
      sessionStorage.setItem('kingvi:start', '1');
      sc?.events.off('postupdate', watch);
      location.reload();
    },
    log: (type, data) => log(type, data),
  };
  window.__kingvi = api;
  return api;
}
