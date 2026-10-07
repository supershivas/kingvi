/* Le catalogue des dessins qu'on peut redessiner à la main dans l'éditeur du
   labo (onglet Dessins) : les éléments uniques du décor, les ruines et les
   arches, les poses du viking, de sa cape, du loup, des cerfs et des biches,
   l'incendie (maison en feu, ruine, flammes).
   Les arbres et les rochers restent générés par le code.

   Ce qu'on a refait est gardé par design-store.js (qui n'importe rien et se
   charge avant le monde) ; ce module-ci connaît les dessins d'origine, donc
   leurs tailles : une image doit avoir exactement celle de l'original (les
   positions, les portes, les obstacles en dépendent). Les couleurs sont
   ramenées aux trois du jeu (neige, bleu nuit, rouge) ; l'ombre portée du
   viking (bleu nuit translucide) est permise pour ses poses. */
import { BOAT_FRAMES, BOAT2, ROWBOAT_FRAMES } from './boat.js?v=1.57.0';
import { HOUSE_ART, FALLING_STONE } from './world.js?v=1.57.0';
import { FIRE_FRAMES, HOUSE_BURNING, HOUSE_RUIN } from './fire.js?v=1.57.0';
import { ROOM, CORPSE } from './interior.js?v=1.57.0';
import { CRYPT, CHEST_FRAMES } from './crypt.js?v=1.57.0';
import { CAVE_ROOM, THRONE_FRAMES } from './cave.js?v=1.57.0';
import { BUNDLE, WATCHER } from './grove.js?v=1.57.0';
import { RUIN_ART } from './ruins-art.js?v=1.57.0';
import { vikingFrames, capeFrames } from './viking.js?v=1.57.0';
import { WOLF_POSES_RAW, WOLF_LABELS } from './wolf.js?v=1.57.0';
import { STAG_RAW, DOE_RAW } from './deer.js?v=1.57.0';
import { RELICS, BELT } from './relics.js?v=1.57.0';
import { TITLE_ART } from './title-art.js?v=1.57.0';
import { CUBE_WHITE, CUBE_BLACK } from './cubes.js?v=1.57.0';
import { ICE_FRAMES } from './sigrun.js?v=1.57.0';
import { TEMPLE, NAIL_ART, TEMPLE_SLAB, TEMPLE_STAIRS } from './temple.js?v=1.57.0';
import { gridToRows, decodePng, imageToRows, gamePalette, customDefs, customNames, readCustom, writeCustom, customDepotDefs } from './design-store.js?v=1.57.0';

export { designRows, designGrid, designSource, setLocalDesign, applyLocal, readLocal, refreshLocal, loadDesigns, markSent, LOCAL_KEY, gamePalette, customDefs, customDepotDefs, readCustom, setCustomDepot } from './design-store.js?v=1.57.0';

export const GROUPS = [
  { id: 'titre', title: 'Le titre et la ceinture', about: 'Le nom du jeu sur l\'écran d\'accueil (la gothique sous la neige), et la ceinture où pendent les reliques dans l\'inventaire. Neige et bleu nuit ; la taille reste celle de l\'original.' },
  { id: 'mysteres', title: 'Les cubes, la glace, le temple', about: 'Le cube blanc et le cube noir (les deux seules choses parfaitement droites de l\'archipel), Sigrún dans sa glace et la glace qui fond, le temple de Sorne, sa dalle, ses marches et le clou à l\'envers.' },
  { id: 'decor', title: 'Éléments du décor', about: 'La maison, la pièce, les barques, le coffre, la crypte, la grotte, le roi sur son trône, le guetteur…' },
  { id: 'reliques', title: 'Reliques', about: 'Ce qu\'on ramasse en chemin et qui va dans l\'inventaire (touche I). Placeholders à redessiner : 10 × 10 pixels.' },
  { id: 'reliques-sol', title: 'Reliques sur l\'île', about: 'Les mêmes reliques vues à terre dans le jeu : de 1 à 4 pixels, 4 × 4 au plus. Celles de l\'inventaire sont dans « Reliques ».' },
  { id: 'incendie', title: 'L\'incendie', about: 'Placeholders : la maison qui brûle, sa ruine, et les quatre temps d\'une flamme (posée sur le toit, dans la pièce, dans la ruine).' },
  { id: 'ruines', title: 'Ruines et arches', about: 'L\'arche, la colonne couchée, le socle, l\'arche en ruine et le ponton du lac. Le dessin donne aussi la zone bloquée ; l\'endroit où l\'on monte (socle, ponton) reste celui d\'origine.' },
  { id: 'viking', title: 'Le viking : poses', about: 'Chaque image de la marche et des coups, de profil, de face, de dos et en diagonale. Une ombre au sol est possible (4e couleur).' },
  { id: 'cape', title: 'La cape du viking', about: 'Trois forces de vent, six temps chacune. Le coin d\'en haut à gauche est l\'épaule.' },
  { id: 'loup', title: 'Le loup : poses', about: 'Les neuf poses d\'où se montent la marche, le trot, le galop, le bond et le loup à terre.' },
  { id: 'cerfs', title: 'Cerfs et biches : poses', about: 'Codés, mais retirés du jeu pour le moment : on peut les redessiner d\'avance.' },
  // Les assets créés dans l'atelier, rangés par type
  { id: 'mes-decors', title: 'Mes décors', custom: 'decor', about: 'Des éléments de décor de la taille qu\'on veut.' },
  { id: 'mes-animations', title: 'Mes animations', custom: 'animation', about: 'Des animations de plusieurs images.' },
  { id: 'mes-reliques', title: 'Mes reliques', custom: 'relique', about: 'De nouvelles reliques.' },
  { id: 'mes-autres', title: 'Mes autres assets', custom: 'autre', about: 'Tout le reste.' },
];
export const CUSTOM_KINDS = { decor: 'mes-decors', animation: 'mes-animations', relique: 'mes-reliques', autre: 'mes-autres' };

const entry = (name, label, rows, group) => ({ name, label, rows, w: rows[0].length, h: rows.length, group });
const frameEntries = (prefix, frames, label, group) => frames.map(f => entry(`${prefix}${f.name}`, label(f.name), gridToRows(f.grid), group));

// ── Libellés ──
const VIEWS = { side: 'de profil', front: 'de face', back: 'de dos', diagdown: 'en diagonale basse', diagup: 'en diagonale haute' };
const ACTS = { idle: 'immobile', walk: 'marche', attack: 'coup' };
const vikingLabel = n => {
  const [view, act, i] = n.split('-');
  return `Viking ${VIEWS[view]}, ${ACTS[act]}${i != null ? ` ${+i + 1}` : ''}`;
};

export const DESIGNS = [
  entry('titre', 'Le titre du jeu (écran d\'accueil)', TITLE_ART, 'titre'),
  entry('ceinture', 'La ceinture (inventaire, touche I)', BELT, 'titre'),
  entry('cube-blanc', 'Le cube blanc', CUBE_WHITE, 'mysteres'),
  entry('cube-noir', 'Le cube noir', CUBE_BLACK, 'mysteres'),
  ...Object.entries(ICE_FRAMES).map(([k, rows], i) => entry(`glace-${k}`, `Sigrún dans la glace (${['entière', 'fendue', 'qui fond', 'presque fondue', 'une flaque'][i]})`, rows, 'mysteres')),
  entry('temple', 'Le temple de Sorne', TEMPLE, 'mysteres'),
  entry('nail', 'Le clou à l\'envers', NAIL_ART, 'mysteres'),
  entry('temple-slab', 'La dalle sous l\'arche (fermée)', TEMPLE_SLAB, 'mysteres'),
  entry('temple-stairs', 'Les marches sous l\'arche (ouvertes)', TEMPLE_STAIRS, 'mysteres'),
  ...[
    ['house', 'La maison, vue de dehors', HOUSE_ART],
    ['room', 'La pièce de la maison', ROOM],
    ['fallen', 'Un corps à terre', CORPSE],
    ['boat-still', 'La barque échouée (calme)', BOAT_FRAMES.still],
    ['boat-left', 'La barque échouée (roule à gauche)', BOAT_FRAMES.left],
    ['boat-right', 'La barque échouée (roule à droite)', BOAT_FRAMES.right],
    ['boat2', 'La seconde barque, halée sur la grève', BOAT2],
    ['rowboat-empty', 'La barque du lac, vide', ROWBOAT_FRAMES.empty],
    ['rowboat-row0', 'La barque du lac, rame 1', ROWBOAT_FRAMES.row0],
    ['rowboat-row1', 'La barque du lac, rame 2', ROWBOAT_FRAMES.row1],
    ['rowboat-row2', 'La barque du lac, rame 3', ROWBOAT_FRAMES.row2],
    ['crypt', 'La crypte', CRYPT],
    ...Object.entries(CHEST_FRAMES).map(([k, rows]) => [`chest-${k}`, `Le coffre (${k})`, rows]),
    ['cave', 'La grotte', CAVE_ROOM],
    ...Object.entries(THRONE_FRAMES).map(([k, rows]) => [`throne-${k}`, `Le roi sur son trône (${k})`, rows]),
    ['bundle', 'Une offrande pendue', BUNDLE],
    ['watcher', 'Le guetteur', WATCHER],
    ['pierre-chute', 'Une pierre qui tombe de la falaise', FALLING_STONE],
  ].map(([n, l, r]) => entry(n, l, r, 'decor')),
  ...[
    ['house-burning', 'La maison en feu', HOUSE_BURNING],
    ['house-ruin', 'La maison en ruine, calcinée', HOUSE_RUIN],
    ...FIRE_FRAMES.map((rows, i) => [`feu-${i}`, `Une flamme, temps ${i + 1}`, rows]),
  ].map(([n, l, r]) => entry(n, l, r, 'incendie')),
  ...RELICS.map(r => entry(`relique-${r.id}`, r.name, r.rows, 'reliques')),
  ...RELICS.map(r => entry(`relique-${r.id}-sol`, `${r.name}, à terre`, r.ground, 'reliques-sol')),
  ...[
    ['decor-pont', 'Le ponton du lac', RUIN_ART.pont],
    ['decor-arche', 'L\'arche', RUIN_ART.arche],
    ['decor-ruine', 'L\'arche en ruine', RUIN_ART.ruine],
    ['decor-colonne', 'La colonne couchée', RUIN_ART.colonne],
    ['decor-socle', 'Le socle', RUIN_ART.socle],
  ].map(([n, l, r]) => entry(n, l, r, 'ruines')),
  ...frameEntries('viking-', vikingFrames(true), vikingLabel, 'viking'),
  ...frameEntries('', capeFrames(true), n => { const [, l, p] = n.split('-'); return `Cape, vent ${['faible', 'moyen', 'fort'][l]}, temps ${+p + 1}`; }, 'cape'),
  ...Object.entries(WOLF_POSES_RAW).map(([k, g]) => entry(`loup-${k}`, `Loup : ${WOLF_LABELS[k]}`, gridToRows(g), 'loup')),
  ...[['cerf', 'Cerf', STAG_RAW], ['biche', 'Biche', DOE_RAW]].flatMap(([who, name, anims]) =>
    Object.entries(anims).flatMap(([key, anim]) => anim.frames.map((g, i) => entry(`${who}-${key}-${i}`, `${name} : ${anim.label.toLowerCase()} ${i + 1}`, gridToRows(g), 'cerfs')))),
];

const BUILTIN = DESIGNS.length;
const BY_NAME = new Map(DESIGNS.map(d => [d.name, d]));
export const originalRows = name => BY_NAME.get(name)?.rows;

// Les enchaînements d'images, pour voir l'animation tourner : { label, names, fps }
export const SEQUENCES = {
  viking: [
    ...['side', 'front', 'back'].map(v => ({ label: `Marche ${VIEWS[v]}`, names: [0, 1, 2, 3].map(i => `viking-${v}-walk-${i}`), fps: 7 })),
    ...Object.keys(VIEWS).map(v => ({ label: `Coup ${VIEWS[v]}`, names: [0, 1, 2, 3].map(i => `viking-${v}-attack-${i}`), fps: 5 })),
  ],
  cape: [0, 1, 2].map(l => ({ label: `Cape, vent ${['faible', 'moyen', 'fort'][l]}`, names: [0, 1, 2, 3, 4, 5].map(p => `cape-${l}-${p}`), fps: 8 })),
  loup: [
    { label: 'Marche', names: ['marche-0', 'marche-1'].map(n => `loup-${n}`), fps: 4 },
    { label: 'Galop', names: ['course-0', 'course-rassemble', 'course-1', 'course-rassemble'].map(n => `loup-${n}`), fps: 13 },
    { label: 'Bond', names: ['bond-0', 'bond-1', 'bond-2'].map(n => `loup-${n}`), fps: 8 },
  ],
  incendie: [{ label: 'Une flamme', names: [0, 1, 2, 3].map(i => `feu-${i}`), fps: 9 }],
  cerfs: [['cerf', STAG_RAW], ['biche', DOE_RAW]].flatMap(([who, anims]) =>
    Object.entries(anims).map(([key, a]) => ({ label: `${who === 'cerf' ? 'Cerf' : 'Biche'} : ${a.label.toLowerCase()}`, names: a.frames.map((_, i) => `${who}-${key}-${i}`), fps: a.fps }))),
};

// ── Les assets créés dans l'atelier : ajoutés au catalogue (même tableaux, mis à jour sur place) ──
const blank = (w, h) => Array.from({ length: h }, () => '.'.repeat(w));
export function syncCustom() {
  DESIGNS.length = BUILTIN;
  for (const g of Object.values(CUSTOM_KINDS)) delete SEQUENCES[g];
  for (const def of customDefs()) {
    const group = CUSTOM_KINDS[def.kind] || 'mes-autres', names = customNames(def);
    names.forEach((n, i) => DESIGNS.push(entry(n, def.frames > 1 ? `${def.label} ${i + 1}` : def.label, blank(def.w, def.h), group)));
    if (def.frames > 1) (SEQUENCES[group] = SEQUENCES[group] || []).push({ label: def.label, names, fps: def.fps || 6 });
  }
  BY_NAME.clear();
  for (const d of DESIGNS) BY_NAME.set(d.name, d);
}
export const customOf = name => customDefs().find(d => customNames(d).includes(name));
const slug = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'asset';
// Un nouvel asset ; rend sa définition (ou { error })
export function addCustom({ label, kind, w, h, frames = 1, fps = 6 }) {
  w = Math.round(w); h = Math.round(h); frames = Math.max(1, Math.min(24, Math.round(frames) || 1));
  if (!(w >= 4 && w <= 160 && h >= 4 && h <= 160)) return { error: 'La taille doit être entre 4 et 160 pixels.' };
  const taken = new Set([...customDefs().map(d => d.id), ...DESIGNS.map(d => d.name)]);
  let id = slug(label), n = 2;
  while (taken.has(id) || taken.has(`custom-${id}`)) id = `${slug(label)}-${n++}`;
  const def = { id, label: label.trim() || id, kind, w, h, frames: kind === 'animation' ? Math.max(2, frames) : 1, fps };
  const cu = readCustom();
  writeCustom({ defs: [...cu.defs.filter(d => d.id !== id), def], deleted: cu.deleted.filter(x => x !== id) });
  syncCustom();
  return def;
}
// Retire un asset créé ici (et ses retouches ; le dépôt l'oubliera à la prochaine publication)
export function removeCustom(id) {
  const cu = readCustom(), inDepot = customDepotDefs().some(d => d.id === id);
  writeCustom({ defs: cu.defs.filter(d => d.id !== id), deleted: inDepot ? [...new Set([...cu.deleted, id])] : cu.deleted });
  syncCustom();
}
syncCustom();

// Un fichier PNG → rangées, vérifiées contre l'original ; { rows, off } ou { error }
export async function importDesign(name, buffer) {
  const d = BY_NAME.get(name);
  if (!d) return { error: `« ${name} » n'est pas un dessin du jeu.` };
  try {
    const img = await decodePng(buffer);
    if (img.w !== d.w || img.h !== d.h) return { error: `Taille ${img.w} × ${img.h} : il faut exactement ${d.w} × ${d.h}.` };
    return imageToRows(img, name);
  } catch (e) { return { error: e.message || 'Fichier illisible.' }; }
}

// Des rangées → un PNG à l'échelle 1 × 1 (fond transparent ; h : ombre translucide)
export function rowsToPng(rows) {
  const pal = gamePalette(), rgba = c => `rgb(${c.join(',')})`;
  const color = { s: rgba(pal.s), b: rgba(pal.b), k: rgba(pal.b), r: rgba(pal.r), h: `rgba(${pal.b.join(',')},.3)` };
  const c = document.createElement('canvas');
  c.width = rows[0].length; c.height = rows.length;
  const ctx = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (!color[ch]) return;
    ctx.fillStyle = color[ch]; ctx.fillRect(x, y, 1, 1);
  }));
  return new Promise(resolve => c.toBlob(resolve, 'image/png'));
}

// Les retouches gardées ici, en une ligne de texte par dessin (lignes séparées
// par « | », une suite de caractères répétés écrite « s12 ») : à coller dans la
// conversation, d'où elles sont transformées en PNG du dépôt
// (scripts/designs-vers-png.mjs)
export function designsToText() {
  const now = JSON.parse(localStorage.getItem('kingvi:designs') || '{}'), out = ['KINGVI-DESSINS 1'];
  for (const d of DESIGNS) {
    const rows = now[d.name];
    if (!rows || rows.length !== d.h) continue;
    out.push(`${d.name} ${d.w}x${d.h} ` + rows.map(r => r.replace(/(.)\1*/g, m => m[0] + m.length)).join('|'));
  }
  return out.length > 1 ? out.join('\n') : '';
}
