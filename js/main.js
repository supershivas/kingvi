import { startUpdateCheck, loadVersion, loadChangelog } from '../app-update.js';
import { createGame } from './game.js';
import { WEATHER_PRESETS, CYCLE_LABEL, CYCLE_ABOUT } from './weather.js';

const SAVE_KEY = 'kingvi:save';
const PREFS_KEY = 'kingvi:prefs';
const $ = id => document.getElementById(id);

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage plein ou bloqué */ }
}

// Les trois couleurs de l'écran. Le rouge est l'accent des tokens.
const css = getComputedStyle(document.documentElement);
const palette = {
  s: css.getPropertyValue('--game-snow').trim(),
  b: css.getPropertyValue('--game-night').trim(),
  r: css.getPropertyValue('--accent').trim(),
};

const prefs = { crt: true, tilt: true, wind: 'cycle', ...read(PREFS_KEY, {}) };
// Le vent suit désormais un cycle naturel : on y bascule une fois ceux qui
// avaient l'ancienne valeur par défaut (une ambiance fixe)
if (!prefs.windCycle) { prefs.wind = 'cycle'; prefs.windCycle = true; write(PREFS_KEY, prefs); }
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
  isPaused: () => settings.open,
  wind: prefs.wind,
});
window.addEventListener('pagehide', () => game.save());

// La consigne s'efface d'elle-même, puis dès le premier pas
const hint = $('hint');
const hideHint = () => hint.classList.add('gone');
setTimeout(hideHint, 9000);
window.addEventListener('keydown', hideHint, { once: true });

// ── En-tête : le nom ramène au jeu et referme les réglages ──
$('home').addEventListener('click', e => {
  e.preventDefault();
  if (settings.open) settings.close();
  $('stage').querySelector('canvas')?.focus();
});

// ── Réglages ──
function applyCrt() {
  $('screen').classList.toggle('crt', prefs.crt);
  $('opt-crt').checked = prefs.crt;
}
applyCrt();
$('opt-crt').addEventListener('change', e => {
  prefs.crt = e.target.checked;
  write(PREFS_KEY, prefs);
  applyCrt();
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

function applyTilt() {
  $('screen').classList.toggle('tilt-on', prefs.tilt);
  $('opt-tilt').checked = prefs.tilt;
}
applyTilt();
$('opt-tilt').addEventListener('change', e => {
  prefs.tilt = e.target.checked;
  write(PREFS_KEY, prefs);
  applyTilt();
});

$('open-settings').addEventListener('click', async () => {
  game.save();
  $('stat-distance').textContent = (save.steps || 0).toLocaleString('fr-FR');
  $('wind-about').textContent = describeWind();
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
