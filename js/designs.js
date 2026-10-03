/* Le catalogue des dessins qu'on peut redessiner à la main dans l'éditeur du
   labo (onglet Dessins) : les éléments uniques du décor, les ruines et les
   arches, les poses du viking, de sa cape, du loup, des cerfs et des biches.
   Les arbres et les rochers restent générés par le code.

   Ce qu'on a refait est gardé par design-store.js (qui n'importe rien et se
   charge avant le monde) ; ce module-ci connaît les dessins d'origine, donc
   leurs tailles : une image doit avoir exactement celle de l'original (les
   positions, les portes, les obstacles en dépendent). Les couleurs sont
   ramenées aux trois du jeu (neige, bleu nuit, rouge) ; l'ombre portée du
   viking (bleu nuit translucide) est permise pour ses poses. */
import { BOAT_FRAMES, BOAT2, ROWBOAT_FRAMES } from './boat.js?v=1.42.1';
import { HOUSE_ART } from './world.js?v=1.42.1';
import { ROOM, CORPSE } from './interior.js?v=1.42.1';
import { CRYPT, CHEST_FRAMES } from './crypt.js?v=1.42.1';
import { CAVE_ROOM, THRONE_FRAMES } from './cave.js?v=1.42.1';
import { BUNDLE, WATCHER } from './grove.js?v=1.42.1';
import { RUIN_ART } from './ruins-art.js?v=1.42.1';
import { vikingFrames, capeFrames } from './viking.js?v=1.42.1';
import { WOLF_POSES_RAW, WOLF_LABELS } from './wolf.js?v=1.42.1';
import { STAG_RAW, DOE_RAW } from './deer.js?v=1.42.1';
import { gridToRows, decodePng, imageToRows, gamePalette } from './design-store.js?v=1.42.1';

export { designRows, designGrid, designSource, setLocalDesign, applyLocal, readLocal, refreshLocal, loadDesigns, markSent, LOCAL_KEY, gamePalette } from './design-store.js?v=1.42.1';

export const GROUPS = [
  { id: 'decor', title: 'Éléments du décor', about: 'La maison, la pièce, les barques, le coffre, la crypte, la grotte, le roi sur son trône, le guetteur…' },
  { id: 'ruines', title: 'Ruines et arches', about: 'L\'arche, la colonne couchée, le socle, l\'arche en ruine et le ponton du lac. Le dessin donne aussi la zone bloquée ; l\'endroit où l\'on monte (socle, ponton) reste celui d\'origine.' },
  { id: 'viking', title: 'Le viking : poses', about: 'Chaque image de la marche et des coups, de profil, de face, de dos et en diagonale. Une ombre au sol est possible (4e couleur).' },
  { id: 'cape', title: 'La cape du viking', about: 'Trois forces de vent, six temps chacune. Le coin d\'en haut à gauche est l\'épaule.' },
  { id: 'loup', title: 'Le loup : poses', about: 'Les neuf poses d\'où se montent la marche, le trot, le galop, le bond et le loup à terre.' },
  { id: 'cerfs', title: 'Cerfs et biches : poses', about: 'Codés, mais retirés du jeu pour le moment : on peut les redessiner d\'avance.' },
];

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
  ].map(([n, l, r]) => entry(n, l, r, 'decor')),
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
  cerfs: [['cerf', STAG_RAW], ['biche', DOE_RAW]].flatMap(([who, anims]) =>
    Object.entries(anims).map(([key, a]) => ({ label: `${who === 'cerf' ? 'Cerf' : 'Biche'} : ${a.label.toLowerCase()}`, names: a.frames.map((_, i) => `${who}-${key}-${i}`), fps: a.fps }))),
};

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
