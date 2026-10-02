import { startUpdateCheck, loadVersion, loadChangelog } from '../app-update.js?v=1.27.0';
import { createGame } from './game.js?v=1.27.0';
import { showChapter } from './chapters.js?v=1.27.0';
import { createTitleSea } from './titlesea.js?v=1.27.0';
import { audio } from './audio.js?v=1.27.0';
import { WEATHER_PRESETS, CYCLE_LABEL, CYCLE_ABOUT } from './weather.js?v=1.27.0';
import { DAY_CYCLE, DAY_LABELS, DAY_LENGTH, daylightAt } from './daylight.js?v=1.27.0';

// Le mode debug du playtest (?debug=1, js/debug.js) : une sauvegarde à part,
// et les réglages ne sont jamais écrits (la vraie partie reste intacte)
const DEBUG = new URLSearchParams(location.search).get('debug') === '1';
const debug = DEBUG ? await import('./debug.js?v=1.27.0') : null;
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

const prefs = { crt: true, tilt: true, wind: 'cycle', dayOffset: 0, music: true, sfx: true, ...read(PREFS_KEY, {}) };
// Ancien réglage (moment figé) : on repart de ce moment-là, et le temps s'écoule
if (prefs.dayFixed != null) { prefs.dayOffset = prefs.dayFixed - Date.now() / 1000; delete prefs.dayFixed; write(PREFS_KEY, prefs); }
// L'heure du jeu : l'horloge réelle, décalée si le joueur a choisi un autre moment
const dayClock = () => Date.now() / 1000 + (prefs.dayOffset || 0);
// Le vent suit désormais un cycle naturel : on y bascule une fois ceux qui
// avaient l'ancienne valeur par défaut (une ambiance fixe)
if (!prefs.windCycle) { prefs.wind = 'cycle'; prefs.windCycle = true; write(PREFS_KEY, prefs); }
// La qualité de l'image (1 → 4) remplace les cases CRT et flou : on la
// déduit des anciennes cases, une fois
if (prefs.quality == null) { prefs.quality = prefs.crt === false && prefs.tilt === false ? 1 : prefs.crt === false || prefs.tilt === false ? 2 : 3; write(PREFS_KEY, prefs); }
let save = read(SAVE_KEY, {});

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
const settings = $('settings');
const game = createGame({
  parent: $('stage'),
  palette,
  save,
  onSave: s => { save = s; write(SAVE_KEY, s); },
  isPaused: () => settings.open || !$('title').hidden,
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
  // Le compteur d'arbres abattus et de rochers brisés (dès le premier)
  onTally: (t, what) => {
    $('tally-trees').textContent = t.trees;
    $('tally-rocks').textContent = t.rocks;
    $('tally').hidden = !(t.trees || t.rocks);
    const item = what && $(`tally-${what}`).parentElement;
    if (item) { item.classList.add('bump'); setTimeout(() => item.classList.remove('bump'), 260); }
  },
});
let resetting = false;

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

// La consigne apparaît quand on entre dans le jeu, puis s'efface d'elle-même
// (ou dès le premier pas)
const hint = $('hint');
const hideHint = () => hint.classList.add('gone');
let hintShown = false;
function showHint() {
  if (hintShown) return;
  hintShown = true;
  if (touchScreen) hint.textContent = 'Croix pour marcher, au bord pour courir · touchez pour frapper';
  hint.classList.remove('gone');
  setTimeout(hideHint, 9000);
  window.addEventListener('keydown', hideHint, { once: true });
}

// ── Le titre, en pixels : la gothique tracée petit, seuillée en un seul ton,
// puis travaillée comme de la pierre sous la neige : croûte de neige sur le
// haut des lettres, bas tramé d'ombre, éclats, glaçons qui pendent ──
const TITLE = 'Kingvi Sno 7';
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function hashTitle(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
async function drawTitle() {
  const canvas = $('title-art');
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-game-title').trim() || 'serif';
  const font = `800 30px ${family}`;
  try { await Promise.race([document.fonts.load(font, TITLE), new Promise(r => setTimeout(r, 1500))]); } catch { /* police de secours */ }
  // 1. La silhouette des lettres, en un seul ton
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const W = Math.ceil(probe.measureText(TITLE).width) + 8, H = 44;
  const src = document.createElement('canvas');
  src.width = W; src.height = H;
  const sctx = src.getContext('2d');
  sctx.font = font; sctx.fillStyle = '#000'; sctx.textBaseline = 'alphabetic';
  sctx.fillText(TITLE, 4, 32);
  const alpha = sctx.getImageData(0, 0, W, H).data;
  const on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && alpha[(y * W + x) * 4 + 3] > 110;
  // 2. Les textures, pixel par pixel
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const C = { s: rgb(palette.s), b: rgb(palette.b), k: rgb(palette.k) };
  const set = (x, y, c) => { const i = (y * W + x) * 4; [img.data[i], img.data[i + 1], img.data[i + 2]] = C[c]; img.data[i + 3] = 255; };
  // Hauteur de chaque pixel dans sa lettre (0 en haut de la colonne pleine)
  for (let x = 0; x < W; x++) {
    let depth = -1, run = 0;
    for (let y = 0; y < H; y++) {
      if (!on(x, y)) { depth = -1; continue; }
      depth++;
      run = 0; while (on(x, y + run)) run++;
      const t = depth / (depth + run);                        // 0 haut → 1 bas du trait
      let c = 's';
      if (depth === 0 && hashTitle(x, y) < 0.85) c = 's';     // la croûte de neige
      else if (t > 0.55 && (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 < (t - 0.55) * 1.6) c = 'b';   // l'ombre, tramée
      if (depth > 0 && hashTitle(x * 3, y * 7) < 0.06) c = 'b';                                        // éclats
      set(x, y, c);
    }
  }
  // Ombre portée, un pixel en dessous à droite, noire
  for (let y = H - 2; y >= 0; y--) for (let x = W - 2; x >= 0; x--) {
    if (on(x, y) && !on(x + 1, y + 1)) { const i = ((y + 1) * W + x + 1) * 4; if (!img.data[i + 3]) set(x + 1, y + 1, 'k'); }
  }
  // Glaçons : sous le bas des traits, de longueurs inégales
  for (let x = 0; x < W; x++) for (let y = 0; y < H - 1; y++) {
    if (!on(x, y) || on(x, y + 1) || hashTitle(x, y + 99) > 0.3) continue;
    const len = 1 + Math.floor(hashTitle(x + 7, y) * 4);
    for (let k = 1; k <= len && y + k < H; k++) if (!on(x, y + k)) set(x, y + k, k === len ? 'b' : 's');
  }
  ctx.putImageData(img, 0, 0);
  sizeTitle();
}
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
function openTitle() {
  if (settings.open) settings.close();
  titleSea.start();
  $('title-resume').hidden = !hasSave();
  title.hidden = false;
  dpad.hidden = true;
  ($('title-resume').hidden ? $('title-new') : $('title-resume')).focus();
}
// Le noir s'ouvre depuis le centre, lentement d'abord, puis d'un coup
function openIris() {
  const iris = $('iris'), screen = $('screen');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const max = Math.hypot(screen.clientWidth, screen.clientHeight) / 2 + 100;
  iris.hidden = false;
  const t0 = performance.now(), dur = 1800;
  const step = now => {
    const k = Math.min(1, (now - t0) / dur);
    const e = k < 0.25 ? k * 0.4 : 0.1 + Math.pow((k - 0.25) / 0.75, 2) * 0.9;
    iris.style.setProperty('--r', `${Math.round(e * max - 90)}px`);
    if (k < 1) requestAnimationFrame(step); else iris.hidden = true;
  };
  iris.style.setProperty('--r', '-90px');
  requestAnimationFrame(step);
}
// Le noir, tout de suite (en attendant que le jeu soit prêt)
function closeIris() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  $('iris').hidden = false;
  $('iris').style.setProperty('--r', '-90px');
}
function closeTitle() {
  // La musique de l'accueil s'arrête : un silence, puis celle du jeu
  if (!title.hidden) audio.hush(2.5);
  titleSea.stop();
  title.hidden = true;
  // La caméra d'abord sur le viking, l'île chargée autour de lui ; puis l'iris
  closeIris();
  const t0 = performance.now();
  const ready = () => {
    if (game.focus() || performance.now() - t0 > 4000) openIris();
    else requestAnimationFrame(ready);
  };
  requestAnimationFrame(ready);
  dpad.hidden = !touchScreen;
  $('stage').querySelector('canvas')?.focus();
  showHint();
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
  try { localStorage.removeItem(SAVE_KEY); sessionStorage.setItem('kingvi:start', '1'); } catch { /* rien */ }
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
debug?.attachDebug({ game, dayClock, enter: closeTitle });

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
// La qualité de l'image : un seul curseur, du plus fluide au plus fin
const QUALITIES = {
  1: ['Légère', 'Pour les ordinateurs anciens : l\'image en gros pixels, sans effet cathodique ni flou, moitié moins de flocons. Le plus fluide.'],
  2: ['Économe', 'L\'image en gros pixels, l\'effet cathodique, sans le flou de maquette.'],
  3: ['Équilibrée', 'L\'effet cathodique et le flou de maquette ; sur un écran Retina, l\'image est peinte en demi-résolution (elle n\'y perd rien).'],
  4: ['Haute', 'Pour les ordinateurs récents : tous les pixels de l\'écran, l\'effet cathodique et le flou de maquette.'],
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
  const real = !prefs.dayOffset;
  $('opt-dayauto').checked = real;
  const d = daylightAt(dayNow());
  $('daytime-label').textContent = `${DAY_LABELS[d.phase]}, ${clockText(d)}` +
    (real ? ' — suit l\'heure réelle (un jour dure 20 minutes)' : ' — le temps s\'écoule depuis le moment choisi');
}
daySlider.addEventListener('input', () => {
  const now = Date.now() / 1000;
  prefs.dayOffset = Number(daySlider.value) - (now % DAY_LENGTH);
  write(PREFS_KEY, prefs);
  syncDaytime();
  game.refreshDaylight();
});
$('opt-dayauto').addEventListener('change', e => {
  prefs.dayOffset = e.target.checked ? 0 : prefs.dayOffset || 0.001;
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
