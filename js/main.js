import { startUpdateCheck, loadVersion, loadChangelog } from '../app-update.js?v=1.57.0';
import { loadDesigns, designRows, refreshLocal, LOCAL_KEY as DESIGNS_KEY } from './design-store.js?v=1.57.0';
import { TITLE_ART } from './title-art.js?v=1.57.0';
import { BELT, BELT_LEFT, BELT_SLOTS } from './relics.js?v=1.57.0';
import { showChapter } from './chapters.js?v=1.57.0';
import { createTitleSea } from './titlesea.js?v=1.57.0';
import { audio, TRACKS } from './audio.js?v=1.57.0';
import { WEATHER_PRESETS, CYCLE_LABEL, CYCLE_ABOUT } from './weather.js?v=1.57.0';
import { DAY_CYCLE, DAY_LABELS, DAY_LENGTH, daylightAt } from './daylight.js?v=1.57.0';

// Le mode debug du playtest (?debug=1, js/debug.js) : une sauvegarde à part,
// et les réglages ne sont jamais écrits (la vraie partie reste intacte)
const DEBUG = new URLSearchParams(location.search).get('debug') === '1';
// Une page servie en retard (GitHub Pages garde index.html dix minutes) charge
// l'ancien code, et la mise à jour automatique prend la version du jour pour
// référence : elle ne voit rien. Le code connaît sa version (`?v=` de ce
// module) : si version.json en dit une autre, on recharge une fois, l'adresse
// changée pour que la page vienne fraîche
{
  const mine = new URL(import.meta.url).searchParams.get('v');
  try {
    const live = (await (await fetch('version.json', { cache: 'no-store' })).json()).version;
    if (mine && live && live !== mine && sessionStorage.getItem('kingvi:fresh') !== live) {
      sessionStorage.setItem('kingvi:fresh', live);
      const url = new URL(location.href); url.searchParams.set('v', live);
      location.replace(url);
      await new Promise(() => {});
    }
  } catch { /* hors ligne : on joue avec ce qu'on a */ }
}
// Les dessins redessinés à la main (assets/design, ou retouchés dans le labo) se
// chargent AVANT le monde, la meute et le viking, qui se construisent à leur chargement
await loadDesigns();
const { createGame } = await import('./game.js?v=1.57.0');
const debug = DEBUG ? await import('./debug.js?v=1.57.0') : null;
const SAVE_KEY = DEBUG ? debug.DEBUG_SAVE_KEY : 'kingvi:save';
const PREFS_KEY = 'kingvi:prefs';
const $ = id => document.getElementById(id);

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function write(key, value) {
  if (DEBUG && key === PREFS_KEY) return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage plein ou bloqué */ }
}

// Les trois couleurs de l'écran. Le rouge est l'accent des tokens.
const css = getComputedStyle(document.documentElement);
const palette = {
  s: css.getPropertyValue('--game-snow').trim(),
  b: css.getPropertyValue('--game-night').trim(),
  r: css.getPropertyValue('--accent').trim(),
  k: css.getPropertyValue('--game-black').trim(),   // le noir du dehors, vu de l'intérieur
};

// Par défaut : la nuit, toujours, et la tempête
const prefs = { crt: true, tilt: true, wind: 'tempete', dayOffset: 0, dayNight: true, music: true, sfx: true, ...read(PREFS_KEY, {}) };
// Ancien réglage (moment figé) : on repart de ce moment-là, et le temps s'écoule
if (prefs.dayFixed != null) { prefs.dayOffset = prefs.dayFixed - Date.now() / 1000; delete prefs.dayFixed; write(PREFS_KEY, prefs); }
// L'heure du jeu : le milieu de la nuit (par défaut), ou l'horloge réelle,
// décalée si le joueur a choisi un autre moment
const MIDNIGHT = DAY_LENGTH - DAY_CYCLE.at(-1)[1] / 2;
const dayClock = () => prefs.dayNight ? MIDNIGHT : Date.now() / 1000 + (prefs.dayOffset || 0);
// Le vent suit désormais un cycle naturel : on y bascule une fois ceux qui
// avaient l'ancienne valeur par défaut (une ambiance fixe)
if (!prefs.windCycle) { prefs.wind = 'cycle'; prefs.windCycle = true; write(PREFS_KEY, prefs); }
// La nuit et la tempête deviennent le temps par défaut : une fois, pour tous
if (!prefs.nightStorm) { prefs.wind = 'tempete'; prefs.dayNight = true; prefs.nightStorm = true; write(PREFS_KEY, prefs); }
// La qualité de l'image (1 → 4) remplace les cases CRT et flou : on la
// déduit des anciennes cases, une fois
if (prefs.quality == null) { prefs.quality = prefs.crt === false && prefs.tilt === false ? 1 : prefs.crt === false || prefs.tilt === false ? 2 : 3; write(PREFS_KEY, prefs); }
// (l'ancien niveau 4, « tous les pixels de l'écran », n'existe plus : le jeu se
// dessine toujours en basse définition)
if (prefs.quality > 3) { prefs.quality = 3; write(PREFS_KEY, prefs); }
let save = read(SAVE_KEY, {});

// ── La bulle de neige des phylactères, sous un élément d'interface (le cadre
// de la touche E, les consignes) : dessinée en pixels du jeu, à sa taille ──
async function snowBox(el, seed) {
  const { brokenBox } = await import('./dialogue.js?v=1.57.0');
  const canvas = el.querySelector('.snow-bg');
  if (!canvas || el.hidden) return;
  const unit = parseFloat(getComputedStyle($('screen')).getPropertyValue('--ui-px')) || 3;
  const bw = Math.ceil(el.offsetWidth / unit), bh = Math.ceil(el.offsetHeight / unit);
  if (!bw || !bh) return;
  canvas.width = bw; canvas.height = bh;
  canvas.style.width = `${bw * unit}px`; canvas.style.height = `${bh * unit}px`;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, bw, bh);
  brokenBox(ctx, 0, 0, bw, bh, palette.s, palette.b, seed);
}
// (une graine par texte : la même bulle pour le même message, sans scintiller)
const seedOf = text => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7);
// (la taille d'un pixel du jeu change avec l'écran : on redessine)
window.addEventListener('resize', () => setTimeout(() => {
  for (const id of ['act', 'hint']) { const el = $(id); if (!el.hidden) snowBox(el, seedOf(el.querySelector('span').textContent)); }
}, 120));

// ── Les messages du jeu : une bulle de neige comme les phylactères ──
let noteTimer, noteSeed = 7;
async function note(title, text) {
  const { brokenBox } = await import('./dialogue.js?v=1.57.0');
  const el = $('note'), box = el.querySelector('.note-text'), canvas = el.querySelector('.note-bubble');
  box.innerHTML = '';
  const b = document.createElement('b'); b.textContent = title;
  const t = document.createElement('span'); t.textContent = text;
  box.append(b, t);
  el.hidden = false;
  // (la bulle en pixels du jeu, autour du texte, avec une marge de 3 pixels)
  const unit = parseFloat(getComputedStyle($('screen')).getPropertyValue('--ui-px')) || 3, PAD = 3;
  const bw = Math.ceil(box.offsetWidth / unit) + PAD * 2, bh = Math.ceil(box.offsetHeight / unit) + PAD * 2;
  canvas.width = bw; canvas.height = bh;
  canvas.style.width = `${bw * unit}px`; canvas.style.height = `${bh * unit}px`;
  canvas.style.left = `${-PAD * unit}px`; canvas.style.top = `${-PAD * unit}px`;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, bw, bh);
  brokenBox(ctx, 0, 0, bw, bh, palette.s, palette.b, noteSeed++);
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => { el.hidden = true; }, 3800);
}

// ── Toast ──
let toastTimer;
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

// ── Jeu ──
let irisBusy = false, irisRun = 0, ending = false;     // (l'iris, plus bas)
const settings = $('settings'), inventory = $('inventory'), mapDialog = $('map'), wishes = $('wishes');
const game = createGame({
  parent: $('stage'),
  // (le zoom à la molette, gardé d'une visite à l'autre)
  zoom: prefs.zoom || 0,
  // (ce qu'on voit, cliqué : la bulle de neige des messages)
  onDescribe: d => note(d.title, d.text),
  onZoom: z => { prefs.zoom = z; write(PREFS_KEY, prefs); },
  palette,
  save,
  onSave: s => { save = s; write(SAVE_KEY, s); },
  // (et tant que le noir de l'iris n'est pas ouvert : rien ne se passe dans le noir)
  isPaused: () => settings.open || inventory.open || mapDialog.open || wishes.open || !$('title').hidden || irisBusy || ending,
  quality: prefs.quality,
  // À l'accueil, la musique a sa propre ambiance (sourde, sombre)
  isTitle: () => !$('title').hidden,
  wind: prefs.wind,
  // Moment de la journée : l'heure réelle, ou celui choisi dans les Réglages
  dayClock,
  // À un seul point de vie, l'écran se teinte de rouge
  onHealth: hp => $('screen').classList.toggle('hurt', hp === 1),
  // Aux grands moments de l'aventure, un chapitre s'inscrit à l'écran
  onChapter: ch => showChapter($('screen'), ch),
  // Mort : le noir se referme sur le corps, « Vous êtes mort », on se relève
  // près de la barque ; le noir ne se rouvre qu'une fois l'île prête autour
  onDeath: respawn => die(respawn),
  // Une fin : quelques lignes sur le noir, puis « Fin », et l'on continue de
  // jouer dans le monde changé (la fin vécue est gardée : `kingvi:fins`)
  onEnding: id => playEnding(id),
  // Ce qu'on peut faire ici (touche E) : « E · Parler à Clède »
  onAction: label => {
    const el = $('act');
    el.hidden = !label;
    if (label) { el.querySelector('span').textContent = label; snowBox(el, seedOf(label)); }
  },
  // La traversée en barque, entre SNO 7 et SNO 4
  onVoyage: (to, done) => voyage(to, done),
  // Le compteur d'arbres abattus et de rochers brisés (dès le premier)
  // Une relique ramassée : un mot discret, et elle entre dans l'inventaire
  onRelic: id => {
    const r = game.relics().find(x => x.id === id);
    if (r) note('Relique trouvée', r.name);
    $('open-inventory').classList.add('new');
  },
  onTally: (t, what) => {
    $('tally-trees').textContent = t.trees;
    $('tally-rocks').textContent = t.rocks;
    $('tally').hidden = !(t.trees || t.rocks);
    const item = what && $(`tally-${what}`).parentElement;
    if (item) { item.classList.add('bump'); setTimeout(() => item.classList.remove('bump'), 260); }
  },
});
let resetting = false;

// ── L'inventaire (touche I) : la ceinture du viking, où pendent les reliques
// trouvées. On les déplace d'un crochet à l'autre : glisser-déposer, ou un
// clic pour la prendre et un clic sur le crochet voulu (clavier : Entrée) ──
let held = null, shown = null, dragDone = false;
const pixelCanvas = (rows, scale) => {
  const cv = document.createElement('canvas'), h = rows.length, w = rows[0].length;
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.' && palette[ch]) { ctx.fillStyle = palette[ch]; ctx.fillRect(x, y, 1, 1); } }));
  cv.style.width = `${w * scale}px`; cv.style.height = `${h * scale}px`;
  return cv;
};
function renderInventory() {
  const list = game.relics(), byId = new Map(list.map(r => [r.id, r])), belt = game.belt();
  const wrap = $('inv-belt'), rows = designRows('ceinture', BELT), W = rows[0].length;
  // (un facteur entier : des pixels nets)
  const k = Math.max(2, Math.min(5, Math.floor((wrap.clientWidth || 480) / W)));
  wrap.replaceChildren(pixelCanvas(rows, k));
  wrap.style.height = `${(rows.length - 2 + 10) * k + 8}px`;
  const show = r => {
    shown = r?.id || null;
    $('inv-name').textContent = r ? r.name : '';
    $('inv-about').textContent = r ? r.about : 'Rien n\'y pend encore.';
  };
  belt.forEach((id, i) => {
    const r = id && byId.get(id);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `belt-hook${r ? '' : ' free'}${held === i ? ' held' : ''}`;
    b.dataset.slot = i;
    b.style.left = `${(BELT_LEFT + i * 12) * k}px`; b.style.top = `${7 * k}px`;
    b.style.width = `${12 * k}px`; b.style.height = `${Math.max(44, 11 * k)}px`;
    b.setAttribute('aria-label', r ? `${r.name}, crochet ${i + 1}` : `Crochet ${i + 1}, libre`);
    if (r) b.append(pixelCanvas(r.rows, k));
    b.addEventListener('mouseenter', () => r && show(r));
    b.addEventListener('focus', () => r && show(r));
    b.addEventListener('click', () => {
      if (dragDone) { dragDone = false; return; }
      if (held == null) { if (r) { held = i; show(r); } }
      else { game.moveRelic(held, i); held = null; }
      renderInventory();
      wrap.querySelector(`[data-slot="${i}"]`)?.focus();
    });
    if (r) b.addEventListener('pointerdown', e => startDrag(e, i, b));
    wrap.append(b);
  });
  const found = list.filter(r => r.found).length;
  $('inv-count').textContent = `${found} relique${found > 1 ? 's' : ''} sur ${list.length} · ${BELT_SLOTS} crochets`;
  const pick = byId.get(shown) || (held != null && byId.get(belt[held])) || byId.get(belt.find(Boolean));
  show(pick?.found ? pick : null);
}
// Glisser une relique d'un crochet à l'autre (souris, doigt, stylet)
function startDrag(e, from, el) {
  if (e.button > 0) return;
  const x0 = e.clientX, y0 = e.clientY;
  let ghost = null;
  const move = ev => {
    if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return;
    if (!ghost) {
      ghost = el.querySelector('canvas').cloneNode();
      ghost.getContext('2d').drawImage(el.querySelector('canvas'), 0, 0);
      ghost.className = 'belt-ghost';
      el.classList.add('dragging');
      inventory.append(ghost);                 // (dans la modale : elle est au premier plan)
    }
    ghost.style.left = `${ev.clientX}px`; ghost.style.top = `${ev.clientY}px`;
    for (const h of document.querySelectorAll('.belt-hook')) h.classList.toggle('over', h === document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.belt-hook'));
  };
  const up = ev => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    if (!ghost) return;
    ghost.remove();
    dragDone = true;
    setTimeout(() => { dragDone = false; }, 0);
    const to = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.belt-hook');
    if (to && ev.type === 'pointerup') game.moveRelic(from, +to.dataset.slot);
    held = null;
    renderInventory();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}
function toggleInventory(force) {
  const open = force ?? !inventory.open;
  if (open === inventory.open) return;
  if (!open) { inventory.close(); return; }
  if (!$('title').hidden || irisBusy || settings.open) return;
  held = null;
  $('open-inventory').classList.remove('new');
  inventory.showModal();
  renderInventory();
}
$('open-inventory').addEventListener('click', () => toggleInventory());
$('close-inventory').addEventListener('click', () => inventory.close());
inventory.addEventListener('click', e => { if (e.target === inventory) inventory.close(); });
window.addEventListener('keydown', e => { if (e.code === 'KeyI' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat) { e.preventDefault(); toggleInventory(); } });

// ── Le carnet des vœux (touche J) : ce que veulent ceux qu'on a croisés ──
function toggleWishes(force) {
  const open = force ?? !wishes.open;
  if (open === wishes.open) return;
  if (!open) { wishes.close(); return; }
  if (!$('title').hidden || irisBusy || settings.open || inventory.open || mapDialog.open) return;
  const list = $('wishes-list');
  list.replaceChildren();
  const items = game.wishes();
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'wish-empty';
    li.textContent = 'Personne encore. Parle à ceux que tu croises (touche E).';
    list.append(li);
  }
  // (ce qui reste à faire d'abord)
  for (const w of items.sort((a, b) => a.done - b.done)) {
    const li = document.createElement('li');
    li.classList.toggle('done', w.done);
    const b = document.createElement('b');
    b.textContent = w.name;
    const t = document.createElement('span');
    t.textContent = w.voeu;
    li.append(b, t);
    list.append(li);
  }
  wishes.showModal();
}
$('open-wishes').addEventListener('click', () => toggleWishes());
$('close-wishes').addEventListener('click', () => wishes.close());
wishes.addEventListener('click', e => { if (e.target === wishes) wishes.close(); });
window.addEventListener('keydown', e => { if (e.code === 'KeyJ' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat) { e.preventDefault(); toggleWishes(); } });

// ── La carte qui se construit (touche M) : ce qu'on a vu de l'île ──
let mapModule = null, mapTimer = 0, mapPlaces = [];
async function toggleMap(force) {
  const open = force ?? !mapDialog.open;
  if (open === mapDialog.open) return;
  if (!open) { mapDialog.close(); return; }
  if (!$('title').hidden || irisBusy || settings.open || inventory.open) return;
  mapDialog.showModal();
  mapModule = mapModule || await import('./map.js?v=1.57.0');
  const data = game.mapData();
  if (!data || !mapDialog.open) return;
  const view = $('map-view'), t0 = performance.now();
  // (sur SNO 4, la carte de SNO 4)
  const sno4 = data.world === 'sno4';
  $('map-title').textContent = sno4 ? 'Carte de SNO 4' : 'Carte';
  const paint = (fresh = false) => {
    const d = game.mapData(), opts = { maxW: (view.clientWidth || 560) - 8, maxH: window.innerHeight * 0.78, t: (performance.now() - t0) / 1000, fresh };
    return d?.world === 'sno4' ? mapModule.renderSno4Map($('map-canvas'), d, palette, opts) : mapModule.renderMap($('map-canvas'), d, palette, opts);
  };
  const travel = !sno4 && game.canTravel();
  $('map-hint').textContent = travel ? 'Les morts te prêtent leur pas : touche un lieu nommé pour t\'y rendre.' : 'Ce que tu as vu de l\'île. Le reste est dans le noir.';
  $('map-canvas').classList.toggle('travel', travel);
  mapPlaces = travel ? paint(true)?.places || [] : (paint(true), []);
  // (la croix bat : on repeint deux fois par seconde)
  clearInterval(mapTimer);
  mapTimer = setInterval(() => { if (!mapDialog.open) return clearInterval(mapTimer); const r = paint(); if (mapPlaces.length) mapPlaces = r?.places || mapPlaces; }, 500);
}
$('open-map').addEventListener('click', () => toggleMap());
// (au doigt : toucher la consigne d'action fait comme la touche E)
$('act').addEventListener('click', () => game.act());
$('close-map').addEventListener('click', () => mapDialog.close());
// Le pas des morts (pris dans la plaine des morts) : un clic sur un lieu vu, et l'on y est
$('map-canvas').addEventListener('click', e => {
  if (!mapPlaces.length) return;
  const r = e.currentTarget.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  let best = null, bd = 30;
  for (const p of mapPlaces) { const d = Math.hypot(p.cx - x, p.cy - y); if (d < bd) { bd = d; best = p; } }
  // (le nom est écrit à droite du repère : un clic sur le nom compte aussi)
  if (!best) best = mapPlaces.find(p => x > p.cx && x < p.cx + 170 && Math.abs(y - p.cy) < 12) || null;
  if (!best) return;
  mapDialog.close();
  game.travel(best.x, best.y + 12);
});
mapDialog.addEventListener('click', e => { if (e.target === mapDialog) mapDialog.close(); });
window.addEventListener('keydown', e => { if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat) { e.preventDefault(); toggleMap(); } });

// ── Croix directionnelle, sur écran tactile ──
// Huit directions selon l'angle du pouce ; tout au bord de la croix, on court
const touchScreen = matchMedia('(hover: none), (pointer: coarse)').matches;
const dpad = $('dpad');
(function setupPad() {
  let id = null;
  const knob = (x, y) => { dpad.style.setProperty('--kx', `${x}px`); dpad.style.setProperty('--ky', `${y}px`); };
  const release = () => { id = null; knob(0, 0); dpad.classList.remove('run'); game.setPad(0, 0, false); };
  const aim = e => {
    const r = dpad.getBoundingClientRect(), R = r.width / 2;
    const dx = e.clientX - r.left - R, dy = e.clientY - r.top - R, d = Math.hypot(dx, dy);
    if (d < R * 0.22) { knob(dx, dy); dpad.classList.remove('run'); game.setPad(0, 0, false); return; }
    const k = Math.min(1, (R - 22) / d);
    knob(dx * k, dy * k);
    const oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    const a = oct * Math.PI / 4, run = d > R * 0.92;
    dpad.classList.toggle('run', run);
    game.setPad(Math.round(Math.cos(a)), Math.round(Math.sin(a)), run);
  };
  dpad.addEventListener('pointerdown', e => { id = e.pointerId; dpad.setPointerCapture(id); aim(e); hideHint(); e.preventDefault(); });
  dpad.addEventListener('pointermove', e => { if (e.pointerId === id) aim(e); });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) dpad.addEventListener(t, e => { if (e.pointerId === id) release(); });
  window.addEventListener('blur', release);
})();
window.addEventListener('pagehide', () => { if (!resetting) game.save(); });

// ── Le tutoriel : des consignes, une à la fois, chacune jusqu'à ce qu'on
// l'ait faite (ou qu'elle ait assez duré) ; une seule fois par navigateur
// (`prefs.tuto` : combien sont faites). Rien en debug. ──
const hint = $('hint');
const hideHint = () => hint.classList.add('gone');
const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const TUTO = [
  { text: () => touchScreen ? 'La croix, en bas, pour marcher' : 'ZQSD ou les flèches pour marcher', done: e => e.type === 'keydown' && MOVE_KEYS.has(e.code) || e.type === 'pad', wait: 30 },
  { text: () => 'Suis les traces dans la neige', wait: 7 },
  { text: () => touchScreen ? 'Tout au bord de la croix, on court' : 'Maj pour courir', done: e => e.type === 'keydown' && e.key === 'Shift', wait: touchScreen ? 7 : 25 },
  { text: () => touchScreen ? 'Touche l\'écran pour frapper' : 'Clic pour frapper, vers le pointeur', done: e => e.type === 'pointerdown', wait: 25 },
  { text: () => touchScreen ? 'Doigt tenu deux secondes : le coup tourbillonnant' : 'Bouton tenu deux secondes : le coup tourbillonnant', wait: 8 },
  { text: () => 'M : la carte · I : l\'inventaire · J : le carnet des vœux', done: e => e.type === 'keydown' && (e.code === 'KeyM' || e.code === 'KeyI' || e.code === 'KeyJ'), wait: 12 },
];
let tutoStep = -1, tutoTimer = 0;
function tutoShow(i) {
  clearTimeout(tutoTimer);
  if (i >= TUTO.length) { hideHint(); return; }
  tutoStep = i;
  const text = TUTO[i].text();
  hint.querySelector('span').textContent = text;
  hint.classList.remove('gone');
  snowBox(hint, seedOf(text));
  tutoTimer = setTimeout(() => tutoDone(i), TUTO[i].wait * 1000);
}
function tutoDone(i) {
  if (i !== tutoStep) return;
  tutoStep = -1;
  hideHint();
  prefs.tuto = i + 1;
  write(PREFS_KEY, prefs);
  tutoTimer = setTimeout(() => tutoShow(i + 1), 2600);
}
function tutoEvent(e) {
  const step = TUTO[tutoStep];
  if (step?.done?.(e)) setTimeout(() => tutoDone(tutoStep), 900);
}
window.addEventListener('keydown', tutoEvent);
$('stage').addEventListener('pointerdown', tutoEvent);
$('dpad').addEventListener('pointerdown', () => tutoEvent({ type: 'pad' }));
function showHint() {
  if (DEBUG || tutoStep >= 0 || (prefs.tuto || 0) >= TUTO.length) return;
  tutoShow(prefs.tuto || 0);
}

// ── Le prologue : l'état du monde, en trois lignes sur le noir, au début
// d'une partie neuve (un clic ou une touche le passe) ──
const PROLOGUE = [
  'Sur SNO 7, septième île de l\'Archipel des Neuf, il fait nuit depuis dix-neuf hivers.',
  'Un rêve t\'a rappelé sur l\'île où tu es né. Eyvind, ton frère de lait, est parti avant toi.',
  'Sur la grève, deux pistes s\'en vont dans la neige.',
];
let freshGame = !DEBUG && save.x == null;
// Les fins : ce qui se dit sur le noir quand on en vit une
const ENDINGS = {
  aube: [
    'Le clou est sorti du mur. Sous la roche, un vieil homme a fermé les yeux.',
    'Sur SNO 7, pour la première fois depuis dix-neuf hivers, le ciel a pâli à l\'est.',
    'Le temps reprend. Ce qui devait vieillir vieillira. Ce qui devait mourir mourra.',
  ],
};
async function playEnding(id) {
  if (ending || !ENDINGS[id]) return;
  ending = true;
  try {
    const fins = new Set(JSON.parse(localStorage.getItem('kingvi:fins') || '[]'));
    fins.add(id);
    localStorage.setItem('kingvi:fins', JSON.stringify([...fins]));
  } catch { /* (stockage refusé : la fin reste vécue dans la partie) */ }
  await playPrologue(ENDINGS[id]);
  ending = false;
  showChapter($('screen'), { id, label: 'Fin', title: id === 'aube' ? 'L\'aube' : id }, { hold: 4200 });
}
function playPrologue(text = PROLOGUE) {
  const el = $('prologue'), lines = [...el.querySelectorAll('p')];
  lines.forEach((p, i) => { p.textContent = text[i] || ''; p.classList.remove('in'); });
  el.classList.remove('out');
  el.hidden = false;
  return new Promise(resolve => {
    const timers = [];
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      timers.forEach(clearTimeout);
      lines.forEach(p => p.classList.add('in'));
      el.classList.add('out');
      window.removeEventListener('keydown', end);
      setTimeout(() => { el.hidden = true; resolve(); }, 1200);
    };
    lines.forEach((p, i) => timers.push(setTimeout(() => p.classList.add('in'), 600 + i * 3400)));
    timers.push(setTimeout(end, 600 + text.length * 3400 + 2200));
    el.addEventListener('click', end, { once: true });
    window.addEventListener('keydown', end);
  });
}

// ── Le titre, en pixels : un dessin de l'atelier (title-art.js), tiré de la
// gothique du jeu puis travaillé comme de la pierre sous la neige ; on le
// redessine à la main dans le labo (dessin « titre ») ──
function drawTitle() {
  const canvas = $('title-art'), rows = designRows('titre', TITLE_ART);
  canvas.width = rows[0].length; canvas.height = rows.length;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.' || !palette[ch]) return;
    ctx.fillStyle = palette[ch]; ctx.fillRect(x, y, 1, 1);
  }));
  sizeTitle();
}
// (retouché dans l'atelier, dans un autre onglet : repeint sur place)
window.addEventListener('storage', e => { if (e.key === DESIGNS_KEY) { refreshLocal(); drawTitle(); } });
// Agrandi d'un facteur entier de pixels de l'écran : net
function sizeTitle() {
  const canvas = $('title-art');
  if (!canvas.width) return;
  const dpr = window.devicePixelRatio || 1;
  const k = Math.max(1, Math.floor(Math.min(innerWidth * 0.86 / canvas.width, innerHeight * 0.3 / canvas.height) * dpr));
  canvas.style.width = `${canvas.width * k / dpr}px`;
  canvas.style.height = `${canvas.height * k / dpr}px`;
}
window.addEventListener('resize', sizeTitle);
drawTitle();

// ── Écran d'accueil : nouveau jeu, reprendre, réglages ──
const title = $('title');
const hasSave = () => save.x != null;
const titleSea = createTitleSea($('title-sea'), palette);
// Le chargement s'efface quand tout est là : le titre dessiné, la mer qui
// tourne (deux images), les polices (au plus quatre secondes d'attente)
function hideLoader() {
  const el = $('loader');
  if (!el || el.classList.contains('gone')) return;
  el.classList.add('gone');
  setTimeout(() => el.remove(), 700);
}
Promise.race([document.fonts?.ready || Promise.resolve(), new Promise(r => setTimeout(r, 4000))])
  .then(() => requestAnimationFrame(() => requestAnimationFrame(hideLoader)));
function openTitle() {
  if (settings.open) settings.close();
  titleSea.start();
  $('title-resume').hidden = !hasSave();
  title.hidden = false;
  dpad.hidden = true;
  ($('title-resume').hidden ? $('title-new') : $('title-resume')).focus();
}
// L'iris : le noir s'ouvre depuis le centre (ou s'y referme). Tant qu'il
// bouge ou couvre l'écran, le jeu attend (`irisBusy`)
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function animateIris(from, to, dur, ease) {
  const iris = $('iris'), screen = $('screen'), run = ++irisRun;
  const max = Math.hypot(screen.clientWidth, screen.clientHeight) / 2 + 100;
  const at = k => `${Math.round(k * max - 90)}px`;
  iris.hidden = false;
  iris.style.setProperty('--r', at(from));
  return new Promise(resolve => {
    if (still()) { iris.style.setProperty('--r', at(to)); resolve(); return; }
    const t0 = performance.now();
    const step = now => {
      if (run !== irisRun) { resolve(); return; }
      const k = Math.min(1, (now - t0) / dur);
      iris.style.setProperty('--r', at(from + (to - from) * ease(k)));
      if (k < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}
// S'ouvre lentement d'abord, puis d'un coup
async function openIris() {
  await animateIris(0, 1, 1800, k => k < 0.25 ? k * 0.4 : 0.1 + Math.pow((k - 0.25) / 0.75, 2) * 0.9);
  $('iris').hidden = true;
  irisBusy = false;
}
// Le noir, tout de suite (en attendant que le jeu soit prêt)
function closeIris() {
  irisRun++;
  irisBusy = true;
  $('iris').hidden = false;
  $('iris').style.setProperty('--r', '-90px');
}
// Se referme : vite d'abord, puis lentement sur le centre
function shutIris() {
  irisBusy = true;
  return animateIris(1, 0, 1600, k => 1 - Math.pow(1 - k, 2.2));
}
// L'île prête autour du viking (morceaux chargés, flocons en place), au plus
// quelques secondes
function whenReady(limit = 4000) {
  const t0 = performance.now();
  return new Promise(resolve => {
    const check = () => (game.ready() || performance.now() - t0 > limit) ? resolve() : requestAnimationFrame(check);
    requestAnimationFrame(check);
  });
}
async function die(respawn) {
  await shutIris();
  closeIris();
  const title = showChapter($('screen'), { id: 'mort', label: '', title: 'Vous êtes mort' }, { hold: 1800 });
  respawn();
  game.focus();
  await Promise.all([title, whenReady()]);
  openIris();
}
// La traversée : le noir se referme, la barque vogue sur la mer de nuit (un
// chapitre s'inscrit), puis le noir se rouvre sur l'autre île. Un clic passe.
let voyageSea = null;
async function voyage(to, done) {
  await shutIris();
  closeIris();
  const el = $('voyage');
  el.hidden = false;
  voyageSea = voyageSea || createTitleSea($('voyage-sea'), palette);
  voyageSea.start();
  audio.hush(2);
  const title = showChapter(el, to === 'sno4' ? { id: 'traversee', label: 'Interlude', title: 'La traversée' } : { id: 'retour', label: 'Interlude', title: 'Le retour' }, { hold: 3200 });
  await Promise.race([title, new Promise(r => { el.addEventListener('click', r, { once: true }); window.addEventListener('keydown', r, { once: true }); })]);
  done();
  game.focus();
  await whenReady();
  voyageSea.stop();
  el.hidden = true;
  el.querySelector('.chapter')?.remove();
  openIris();
}
function closeTitle() {
  // La musique de l'accueil s'arrête : un silence, puis celle du jeu
  if (!title.hidden) audio.hush(2.5);
  titleSea.stop();
  title.hidden = true;
  // La caméra d'abord sur le viking, l'île chargée autour de lui ; puis l'iris
  closeIris();
  game.focus();
  // Une partie neuve : le prologue d'abord, sur le noir
  const prologue = freshGame ? playPrologue() : Promise.resolve();
  freshGame = false;
  Promise.all([whenReady(), prologue]).then(openIris).then(showHint);
  dpad.hidden = !touchScreen;
  $('stage').querySelector('canvas')?.focus();
}
// Nouveau jeu : s'il y a une partie, un second clic confirme (elle est effacée)
function armNewGame(button) {
  let armed = null;
  button.addEventListener('click', () => {
    if (!hasSave() || armed) { newGame(); return; }
    const label = button.querySelector('span'), before = label.textContent;
    label.textContent = 'Effacer la partie en cours ?';
    button.classList.add('confirm');
    armed = setTimeout(() => { label.textContent = before; button.classList.remove('confirm'); armed = null; }, 4000);
  });
}
function newGame() {
  resetting = true;
  try { if (!DEBUG) localStorage.setItem('kingvi:island', String(1 + Math.floor(Math.random() * 99999))); localStorage.removeItem(SAVE_KEY); sessionStorage.setItem('kingvi:start', '1'); } catch { /* rien */ }
  location.reload();
}
armNewGame($('title-new'));
armNewGame($('new-game'));
$('title-resume').addEventListener('click', closeTitle);
$('title-settings').addEventListener('click', () => $('open-settings').click());
title.addEventListener('keydown', e => { if (e.key === 'Escape' && hasSave()) closeTitle(); });
// Après « Nouveau jeu », on entre directement dans la partie
let startNow = false;
try { startNow = sessionStorage.getItem('kingvi:start') === '1'; sessionStorage.removeItem('kingvi:start'); } catch { /* rien */ }
if (startNow) closeTitle(); else openTitle();
// (le harnais qui règle l'heure sort de la nuit perpétuelle)
debug?.attachDebug({ game, dayClock, enter: closeTitle, freeTime: () => { prefs.dayNight = false; } });

// ── En-tête : le nom ramène à l'écran d'accueil et referme les réglages ──
$('home').addEventListener('click', e => {
  e.preventDefault();
  game.save();
  openTitle();
});

// ── Le son : il ne peut démarrer qu'après un geste du joueur ──
// Les niveaux (0 → 100) ; les anciens réglages (musique / bruitages
// coupés) deviennent un niveau nul
if (prefs.musicVol == null) prefs.musicVol = prefs.music === false ? 0 : 70;
if (prefs.sfxVol == null) prefs.sfxVol = prefs.sfx === false ? 0 : 80;
if (prefs.windVol == null) prefs.windVol = prefs.sfx === false ? 0 : 35;
const LEVELS = [['opt-music', 'musicVol', 'music'], ['opt-sfx', 'sfxVol', 'sfx'], ['opt-windvol', 'windVol', 'wind']];
for (const [, key, kind] of LEVELS) audio.setVolume(kind, prefs[key] / 100);
// Le morceau : la playlist (les morceaux s'enchaînent), ou un seul
const trackSelect = $('opt-track');
const TRACK_CHOICES = [['playlist', 'Tous, l\'un après l\'autre', 'Les morceaux s\'enchaînent en fondu ; la forêt noire, les loups et l\'aube ont le leur, qui vient de lui-même.'], ...Object.entries(TRACKS).map(([id, t]) => [id, t.nom, t.about])];
for (const [id, nom] of TRACK_CHOICES) trackSelect.append(new Option(nom, id));
if (!TRACK_CHOICES.some(c => c[0] === prefs.track)) prefs.track = 'playlist';
trackSelect.value = prefs.track;
const trackAbout = () => { $('track-about').textContent = TRACK_CHOICES.find(c => c[0] === prefs.track)[2]; };
trackAbout();
audio.setTrack(prefs.track);
trackSelect.addEventListener('change', () => { prefs.track = trackSelect.value; write(PREFS_KEY, prefs); audio.setTrack(prefs.track); trackAbout(); unlockAudio(); });
const unlockAudio = () => { if (!audio.silent) audio.unlock(); };
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);
for (const [id, key, kind] of LEVELS) {
  $(id).value = String(prefs[key]);
  $(id).addEventListener('input', e => {
    prefs[key] = Number(e.target.value);
    write(PREFS_KEY, prefs);
    audio.setVolume(kind, prefs[key] / 100);
    unlockAudio();
  });
}

// ── Réglages ──
// Les curseurs se lisent par crans : des pierres posées sous le curseur
// (invisible, il reste le vrai contrôle). Qualité : un cran par niveau ;
// les volumes et l'heure : de 0 à tout, en dix ou douze crans.
const notched = [];
for (const input of settings.querySelectorAll('input[type="range"]')) {
  const steps = input.id === 'opt-quality';
  const count = steps ? Number(input.max) - Number(input.min) + 1 : input.id === 'opt-daytime' ? 12 : 10;
  const box = document.createElement('div');
  box.className = 'notches';
  input.replaceWith(box);
  box.append(...Array.from({ length: count }, () => document.createElement('span')), input);
  const cells = [...box.querySelectorAll('span')];
  const paint = () => {
    const min = Number(input.min) || 0, max = Number(input.max) || 100, v = Number(input.value);
    const lit = steps ? v - min + 1 : Math.ceil(((v - min) / (max - min)) * count);
    cells.forEach((c, i) => { c.classList.toggle('on', i < lit); c.classList.toggle('tip', i === lit - 1); });
  };
  input.addEventListener('input', paint);
  notched.push(paint);
}
const paintNotches = () => notched.forEach(paint => paint());
// La qualité de l'image : un seul curseur, du plus fluide au plus fin
const QUALITIES = {
  1: ['Légère', 'Pour les ordinateurs anciens : sans effet cathodique ni flou, moitié moins de flocons. Le plus fluide.'],
  2: ['Économe', 'L\'effet cathodique, sans le flou de maquette.'],
  3: ['Complète', 'L\'effet cathodique et le flou de maquette.'],
};
function applyQuality() {
  const q = prefs.quality;
  $('screen').classList.toggle('crt', q >= 2);
  $('screen').classList.toggle('tilt-on', q >= 3);
  $('opt-quality').value = String(q);
  $('quality-label').textContent = QUALITIES[q][0];
  $('quality-about').textContent = QUALITIES[q][1];
}
applyQuality();
$('opt-quality').addEventListener('input', e => {
  prefs.quality = Number(e.target.value);
  write(PREFS_KEY, prefs);
  applyQuality();
  game.setQuality(prefs.quality);
});

// Vent : les ambiances à comparer (voir aussi le labo)
const windSelect = $('opt-wind');
for (const [key, label] of [['cycle', CYCLE_LABEL], ...Object.entries(WEATHER_PRESETS).map(([k, p]) => [k, `Toujours : ${p.label.toLowerCase()}`])]) {
  const o = document.createElement('option');
  o.value = key; o.textContent = label;
  windSelect.append(o);
}
function describeWind() {
  if (prefs.wind !== 'cycle') return WEATHER_PRESETS[prefs.wind]?.about || '';
  const now = WEATHER_PRESETS[game.windPhase()]?.label;
  return now ? `${CYCLE_ABOUT} En ce moment : ${now.toLowerCase()}.` : CYCLE_ABOUT;
}
function applyWind() {
  windSelect.value = prefs.wind;
  game.setWind(prefs.wind);
  $('wind-about').textContent = describeWind();
}
applyWind();
windSelect.addEventListener('change', e => {
  prefs.wind = e.target.value;
  write(PREFS_KEY, prefs);
  applyWind();
});

// Moment de la journée : un curseur sur le cycle (aube, jour, crépuscule, nuit).
// Il change l'heure du jeu, qui continue ensuite de s'écouler.
const daySlider = $('opt-daytime');
daySlider.max = String(DAY_LENGTH - 1);
const dayNow = () => ((dayClock() % DAY_LENGTH) + DAY_LENGTH) % DAY_LENGTH;
// Heure affichée : le cycle ramené à 24 h (aube de 5 h à 7 h, jour jusqu'à 19 h,
// crépuscule jusqu'à 21 h, nuit jusqu'à 5 h)
const HOURS = { aube: [5, 2], jour: [7, 12], crepuscule: [19, 2], nuit: [21, 8] };
function clockText(d) {
  const [start, span] = HOURS[d.phase];
  const len = DAY_CYCLE[d.index][1];
  const minutes = Math.floor(((start + span * d.t / len) % 24) * 60);
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}
function syncDaytime() {
  if (document.activeElement !== daySlider) daySlider.value = String(Math.floor(dayNow()));
  const real = !prefs.dayOffset && !prefs.dayNight;
  $('opt-dayauto').checked = real;
  $('opt-daynight').checked = !!prefs.dayNight;
  const d = daylightAt(dayNow());
  paintNotches();
  $('daytime-label').textContent = prefs.dayNight ? 'Nuit, toujours'
    : `${DAY_LABELS[d.phase]}, ${clockText(d)}` +
    (real ? ' — suit l\'heure réelle (un jour dure 20 minutes)' : ' — le temps s\'écoule depuis le moment choisi');
}
daySlider.addEventListener('input', () => {
  const now = Date.now() / 1000;
  prefs.dayNight = false;
  prefs.dayOffset = Number(daySlider.value) - (now % DAY_LENGTH);
  write(PREFS_KEY, prefs);
  syncDaytime();
  game.refreshDaylight();
});
$('opt-dayauto').addEventListener('change', e => {
  prefs.dayOffset = e.target.checked ? 0 : prefs.dayOffset || 0.001;
  prefs.dayNight = false;
  write(PREFS_KEY, prefs);
  syncDaytime();
  game.refreshDaylight();
});
$('opt-daynight').addEventListener('change', e => {
  prefs.dayNight = e.target.checked;
  // (en la quittant, on reprend la nuit là où elle était, et le temps s'écoule)
  if (!prefs.dayNight) prefs.dayOffset = MIDNIGHT - (Date.now() / 1000 % DAY_LENGTH);
  write(PREFS_KEY, prefs);
  syncDaytime();
  game.refreshDaylight();
});
// L'heure avance sous les yeux quand les réglages sont ouverts
setInterval(() => { if (settings.open) syncDaytime(); }, 1000);
syncDaytime();


$('open-settings').addEventListener('click', async () => {
  game.save();
  $('stat-distance').textContent = (save.steps || 0).toLocaleString('fr-FR');
  $('wind-about').textContent = describeWind();
  syncDaytime();
  paintNotches();
  settings.showModal();
  renderVersions();
});
if (location.hash === '#reglages') {
  history.replaceState(null, '', location.pathname);
  setTimeout(() => $('open-settings').click(), 300);
}
$('close-settings').addEventListener('click', () => settings.close());
settings.addEventListener('click', e => { if (e.target === settings) settings.close(); });

$('back-to-shore').addEventListener('click', () => {
  game.scene()?.backToShore();
  settings.close();
});

async function renderVersions() {
  const [version, entries] = await Promise.all([loadVersion(), loadChangelog()]);
  $('version').textContent = version ? `v${version}` : '';
  const list = $('changelog');
  list.replaceChildren(...entries.map(e => {
    const li = document.createElement('li');
    const head = document.createElement('p');
    head.className = 'changelog-head';
    head.textContent = `v${e.version}${e.date ? ' — ' + e.date : ''}`;
    const ul = document.createElement('ul');
    e.changes.forEach(c => { const item = document.createElement('li'); item.textContent = c; ul.append(item); });
    li.append(head, ul);
    return li;
  }));
}

$('export').addEventListener('click', async () => {
  game.save();
  const data = {
    app: 'kingvi',
    version: await loadVersion(),
    exportedAt: new Date().toISOString(),
    save,
    prefs,
    fins: (() => { try { return JSON.parse(localStorage.getItem('kingvi:fins') || '[]'); } catch { return []; } })(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kingvi-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Données exportées');
});

// ── App prévue pour ordinateur : bandeau discret sur petit écran tactile ──
if (matchMedia('(max-width: 768px), (hover: none)').matches && !read('kingvi:desktop-only-closed', false)) {
  $('desktop-only').hidden = false;
}
$('desktop-only-close').addEventListener('click', () => {
  $('desktop-only').hidden = true;
  write('kingvi:desktop-only-closed', true);
  window.dispatchEvent(new Event('resize'));
});

// ── Mise à jour automatique ──
startUpdateCheck({
  onUpdated: v => toast(`Mis à jour en v${v}`),
});
