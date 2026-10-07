/* Les dessins redessinés à la main : ce qu'on sait d'eux, sans rien d'autre
   (ce module n'importe rien, pour pouvoir être chargé AVANT le monde : le décor,
   la meute, le viking se construisent au chargement de leurs modules).

   Trois sources, de la plus forte à la plus faible :
   1. retouché dans l'éditeur du labo, gardé dans ce navigateur (localStorage) ;
   2. le fichier `assets/design/<nom>.png` du dépôt, listé dans
      `assets/design/index.json` (publié par Claude) ;
   3. le dessin d'origine, fait par le code.

   Un dessin est une liste de rangées de lettres : s neige, b ou k bleu nuit,
   r rouge, h ombre portée (bleu nuit à 30 %, viking seulement), . vide.
   Une image dont la taille n'est pas celle de l'original est ignorée. */

export const LOCAL_KEY = 'kingvi:designs';
// nom → rangées : ce qui est retouché ici (local), et ce que publie le dépôt
const local = new Map(), depot = new Map();
const pick = name => (local.has(name) ? { rows: local.get(name), from: 'local' } : depot.has(name) ? { rows: depot.get(name), from: 'depot' } : null);

export const designSource = name => pick(name)?.from || null;

// Le dessin à utiliser : celui qu'on a refait (de la même taille), ou l'original
export function designRows(name, original) {
  const o = pick(name);
  if (!o) return original;
  if (o.rows.length !== original.length || o.rows[0].length !== original[0].length) return original;
  return o.rows;
}
// Pareil pour une grille de caractères (null : vide) : les poses du viking, du loup, des cerfs
export function designGrid(name, grid) {
  const o = pick(name);
  if (!o || o.rows.length !== grid.length || o.rows[0].length !== grid[0].length) return grid;
  return o.rows.map(r => [...r].map(c => (c === '.' ? null : c)));
}
export const gridToRows = grid => grid.map(row => row.map(c => c || '.').join(''));

// ── Lecture des fichiers PNG, sans canevas (certaines extensions anti-pistage
// bloquent la relecture d'un canevas) ──
async function inflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function decodePng(buffer) {
  const u8 = new Uint8Array(buffer), dv = new DataView(buffer);
  if ([137, 80, 78, 71, 13, 10, 26, 10].some((v, i) => u8[i] !== v)) throw new Error('Ce fichier n\'est pas un PNG.');
  let p = 8, head = null, plte = null, trns = null;
  const idat = [];
  while (p + 8 <= u8.length) {
    const len = dv.getUint32(p), type = String.fromCharCode(...u8.subarray(p + 4, p + 8)), data = u8.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') head = { w: dv.getUint32(p + 8), h: dv.getUint32(p + 12), depth: u8[p + 16], type: u8[p + 17], interlace: u8[p + 20] };
    else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (!head || !idat.length) throw new Error('PNG illisible.');
  if (head.interlace) throw new Error('PNG entrelacé non pris en charge : exportez-le sans entrelacement.');
  const { w, h, depth, type } = head, channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  if (!channels) throw new Error('Type de PNG non pris en charge.');
  const raw = await inflate(idat.length === 1 ? idat[0] : Uint8Array.from(idat.flatMap(a => [...a])));
  const bits = channels * depth, bpp = Math.max(1, bits >> 3), stride = Math.ceil(w * bits / 8);
  const px = new Uint8Array(stride * h);
  for (let y = 0; y < h; y++) {                       // les filtres de chaque ligne
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let i = 0; i < stride; i++) {
      const x = raw[src + i], a = i >= bpp ? px[dst + i - bpp] : 0, b = y ? px[dst - stride + i] : 0, c = y && i >= bpp ? px[dst - stride + i - bpp] : 0;
      let v;
      if (f === 0) v = x;
      else if (f === 1) v = x + a;
      else if (f === 2) v = x + b;
      else if (f === 3) v = x + ((a + b) >> 1);
      else {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      px[dst + i] = v & 255;
    }
  }
  const out = new Uint8Array(w * h * 4), max = (1 << Math.min(depth, 8)) - 1;
  const sample = (y, idx) => {
    if (depth === 8) return px[y * stride + idx];
    if (depth === 16) return px[y * stride + idx * 2];
    const bit = idx * depth;
    return (px[y * stride + (bit >> 3)] >> (8 - depth - (bit & 7))) & max;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4;
    let r, g, b, a = 255;
    if (type === 6) { r = sample(y, x * 4); g = sample(y, x * 4 + 1); b = sample(y, x * 4 + 2); a = sample(y, x * 4 + 3); }
    else if (type === 2) { r = sample(y, x * 3); g = sample(y, x * 3 + 1); b = sample(y, x * 3 + 2); }
    else if (type === 4) { r = g = b = sample(y, x * 2); a = sample(y, x * 2 + 1); }
    else if (type === 0) { r = g = b = sample(y, x) * 255 / max; }
    else {
      const i = sample(y, x);
      r = plte?.[i * 3] ?? 0; g = plte?.[i * 3 + 1] ?? 0; b = plte?.[i * 3 + 2] ?? 0; a = trns?.[i] ?? 255;
    }
    out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = a;
  }
  return { w, h, data: out };
}

// Les trois couleurs du jeu, lues dans la feuille de style
export function gamePalette() {
  const css = getComputedStyle(document.documentElement);
  const read = v => {
    const n = parseInt(css.getPropertyValue(v).trim().slice(1), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  };
  return { s: read('--game-snow'), b: read('--game-night'), r: read('--accent') };
}

// ── Les assets créés dans l'atelier (une taille et des images au choix) ──
// { id, label, kind: 'decor' | 'animation' | 'relique' | 'autre', w, h, frames, fps } ;
// leurs images s'appellent `custom-<id>` (ou `custom-<id>-0`, `-1`… pour une animation).
// Le catalogue vit dans ce navigateur (`kingvi:custom`) et dans le dépôt (`assets/design/custom.json`).
export const CUSTOM_KEY = 'kingvi:custom';
let customDepot = [];
export function readCustom() {
  try { const o = JSON.parse(localStorage.getItem(CUSTOM_KEY)) || {}; return { defs: o.defs || [], deleted: o.deleted || [] }; } catch { return { defs: [], deleted: [] }; }
}
export function writeCustom(o) { try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(o)); } catch { /* rien */ } }
export const customDepotDefs = () => customDepot;
export const setCustomDepot = defs => { customDepot = defs; };
// Le catalogue : le dépôt, plus ce qui est créé ici, moins ce qui est supprimé ici
export function customDefs() {
  const { defs, deleted } = readCustom(), by = new Map();
  for (const d of customDepot) by.set(d.id, d);
  for (const d of defs) by.set(d.id, d);
  return [...by.values()].filter(d => !deleted.includes(d.id));
}
export const customNames = d => (d.frames > 1 ? Array.from({ length: d.frames }, (_, i) => `custom-${d.id}-${i}`) : [`custom-${d.id}`]);

// Un nom de dessin : quelle lettre pour le bleu nuit, et l'ombre portée est-elle permise
const nightLetter = name => (name.startsWith('decor-') ? 'k' : 'b');
const allowsShade = name => name.startsWith('viking-');

// Une image → les rangées de lettres du jeu ; `off` : combien de pixels étaient
// d'une autre couleur (ramenés à la plus proche)
export function imageToRows(img, name) {
  const pal = gamePalette(), night = nightLetter(name);
  const letters = [['s', pal.s], [night, pal.b], ['r', pal.r]];
  const rows = [];
  let off = 0;
  for (let y = 0; y < img.h; y++) {
    let row = '';
    for (let x = 0; x < img.w; x++) {
      const o = (y * img.w + x) * 4, a = img.data[o + 3];
      if (a < (allowsShade(name) ? 20 : 128)) { row += '.'; continue; }
      if (allowsShade(name) && a < 200) { row += 'h'; continue; }       // l'ombre au sol, translucide
      let best = null, bd = Infinity;
      for (const [ch, c] of letters) {
        const d = (img.data[o] - c[0]) ** 2 + (img.data[o + 1] - c[1]) ** 2 + (img.data[o + 2] - c[2]) ** 2;
        if (d < bd) { bd = d; best = ch; }
      }
      if (bd > 40 * 40) off++;
      row += best;
    }
    rows.push(row);
  }
  return { rows, off };
}

// ── Ce qui vient d'être publié depuis ce navigateur ──
// Une fois publiée, une retouche n'est plus « à moi » : le navigateur suit le dépôt, pour
// voir aussi ce que publient les autres appareils. Mais GitHub Pages met un moment à
// republier : pendant quelques minutes, on garde ce qu'on vient d'envoyer.
const SENT_KEY = 'kingvi:designs-sent', SENT_TTL = 15 * 60 * 1000;
function readSent() { try { return JSON.parse(localStorage.getItem(SENT_KEY)) || {}; } catch { return {}; } }
function writeSent(o) { try { localStorage.setItem(SENT_KEY, JSON.stringify(o)); } catch { /* rien */ } }
export function markSent(map) {
  const all = readSent(), at = Date.now();
  for (const [name, rows] of Object.entries(map)) all[name] = { rows, at };
  writeSent(all);
}

// ── Ce qui est retouché ici, dans ce navigateur ──
export function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {}; } catch { return {}; }
}
export function setLocalDesign(name, rows) {
  const all = readLocal();
  if (rows) all[name] = rows; else delete all[name];
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(all)); } catch { return false; }
  // (la date de chaque retouche : plus vieille que la dernière publication du
  // même dessin, elle s'efface devant le dépôt, voir `loadDesigns`)
  const at = readJson(LOCAL_AT_KEY);
  if (rows) at[name] = Date.now(); else delete at[name];
  writeJson(LOCAL_AT_KEY, at);
  return true;
}
// Les dates : retouches d'ici (`kingvi:designs-at`), publications
// (`assets/design/published.json`, écrit par designs-publish.js) ; les
// retouches qui s'effacent sont mises de côté (`kingvi:designs-old`) :
// l'atelier propose de les retrouver
export const LOCAL_AT_KEY = 'kingvi:designs-at', OLD_KEY = 'kingvi:designs-old';
function readJson(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } }
function writeJson(key, o) { try { Object.keys(o).length ? localStorage.setItem(key, JSON.stringify(o)) : localStorage.removeItem(key); } catch { /* rien */ } }
let published = {};
export const publishedTimes = () => published;
export const setPublishedTimes = o => { published = o || {}; };
export const readOld = () => readJson(OLD_KEY);
// Les retouches mises de côté reviennent (datées de maintenant : elles passent devant)
export function restoreOld() {
  const old = readOld(), names = Object.keys(old);
  for (const name of names) { setLocalDesign(name, old[name]); local.set(name, old[name]); }
  writeJson(OLD_KEY, {});
  return names;
}
export function applyLocal(name, rows) {
  if (rows) local.set(name, rows); else local.delete(name);
}

// Au lancement : les fichiers du dépôt (ceux de `assets/design/index.json`),
// puis ce qui est retouché ici par-dessus. Rien n'est demandé au réseau pour
// les dessins qui n'existent pas.
// ── Où sont posées les choses (v1.59.0) : l'atelier déplace les lieux de l'île
// sur la carte. `assets/design/placements.json` (publié) puis ce navigateur
// (`kingvi:placements` ; null : revenir au code). world.js les lit en se
// construisant (`placed`), après `loadDesigns` ──
export const PLACEMENTS_KEY = 'kingvi:placements';
let placeDepot = {};
export function readPlacements() { try { return JSON.parse(localStorage.getItem(PLACEMENTS_KEY)) || {}; } catch { return {}; } }
export function writePlacements(o) { try { Object.keys(o).length ? localStorage.setItem(PLACEMENTS_KEY, JSON.stringify(o)) : localStorage.removeItem(PLACEMENTS_KEY); } catch { /* rien */ } }
export const placementsDepot = () => placeDepot;
export const setPlacementsDepot = o => { placeDepot = o || {}; };
export const placements = () => {
  const all = { ...placeDepot, ...readPlacements() };
  for (const k of Object.keys(all)) if (!all[k]) delete all[k];
  return all;
};
export function placed(id, def) {
  const p = placements()[id];
  return p && Number.isFinite(p.x) && Number.isFinite(p.y) ? { ...def, x: Math.round(p.x), y: Math.round(p.y) } : def;
}

// ── Les textes (v1.61.0) : l'atelier réécrit les textes du jeu (texts.js).
// `assets/design/texts.json` (publié) puis ce navigateur (`kingvi:texts` ;
// null : revenir au texte du code) ; appliqués par main.js avant le jeu ──
export const TEXTS_KEY = 'kingvi:texts';
let textDepot = {};
export function readTexts() { try { return JSON.parse(localStorage.getItem(TEXTS_KEY)) || {}; } catch { return {}; } }
export function writeTexts(o) { try { Object.keys(o).length ? localStorage.setItem(TEXTS_KEY, JSON.stringify(o)) : localStorage.removeItem(TEXTS_KEY); } catch { /* rien */ } }
export const textsDepot = () => textDepot;
export const setTextsDepot = o => { textDepot = o || {}; };
export const textOverrides = () => {
  const all = { ...textDepot, ...readTexts() };
  for (const k of Object.keys(all)) if (typeof all[k] !== 'string') delete all[k];
  return all;
};

// (résolue au premier chargement des dessins : le labo peut attendre la maison publiée)
let readyResolve;
export const designsReady = new Promise(r => { readyResolve = r; });
export async function loadDesigns() {
  try {
    const res = await fetch('assets/design/index.json', { cache: 'no-cache' });
    const names = res.ok ? await res.json() : [];
    await Promise.all(names.filter(n => /^[a-z0-9-]+$/.test(n)).map(async name => {
      try {
        const png = await fetch(`assets/design/${name}.png`, { cache: 'no-cache' });
        if (!png.ok) return;
        depot.set(name, imageToRows(await decodePng(await png.arrayBuffer()), name).rows);
      } catch { /* un fichier illisible : le dessin d'origine */ }
    }));
  } catch { /* hors ligne : les dessins d'origine */ }
  try {
    const res = await fetch('assets/design/custom.json', { cache: 'no-cache' });
    const list = res.ok ? await res.json() : [];
    customDepot = Array.isArray(list) ? list.filter(d => d && /^[a-z0-9-]+$/.test(d.id) && d.w > 0 && d.h > 0) : [];
  } catch { /* hors ligne */ }
  try {
    const res = await fetch('assets/design/placements.json', { cache: 'no-cache' });
    placeDepot = res.ok ? await res.json() : {};
  } catch { placeDepot = {}; }
  try {
    const res = await fetch('assets/design/texts.json', { cache: 'no-cache' });
    textDepot = res.ok ? await res.json() : {};
  } catch { textDepot = {}; }
  {
    const mine = readTexts();
    for (const [k, v] of Object.entries(mine)) if ((textDepot[k] ?? null) === v) delete mine[k];
    writeTexts(mine);
  }
  {
    // (un placement d'ici que le dépôt publie à l'identique : ce navigateur suit le dépôt)
    const mine = readPlacements();
    for (const [k, v] of Object.entries(mine)) if (JSON.stringify(placeDepot[k] ?? null) === JSON.stringify(v)) delete mine[k];
    writePlacements(mine);
  }
  // (les suppressions que le dépôt a prises en compte n'ont plus à être retenues)
  const cu = readCustom();
  if (cu.deleted.some(id => !customDepot.some(d => d.id === id))) writeCustom({ ...cu, deleted: cu.deleted.filter(id => customDepot.some(d => d.id === id)) });
  // Ce qui est retouché ici et que le dépôt publie désormais à l'identique n'a plus
  // besoin d'être gardé ici : ce navigateur suit alors le dépôt, comme les autres
  local.clear();
  const sent = readSent(), now = Date.now();
  let sentChanged = false;
  for (const [name, e] of Object.entries(sent)) {
    if (now - e.at > SENT_TTL || depot.get(name)?.join('\n') === e.rows.join('\n')) { delete sent[name]; sentChanged = true; continue; }
    local.set(name, e.rows);          // (publié il y a peu : le site n'a pas forcément fini de se mettre à jour)
  }
  if (sentChanged) writeSent(sent);
  try {
    const res = await fetch('assets/design/published.json', { cache: 'no-cache' });
    published = res.ok ? await res.json() : {};
  } catch { published = {}; }
  const mine = readLocal(), at = readJson(LOCAL_AT_KEY), old = readJson(OLD_KEY);
  let dropped = false;
  for (const [name, rows] of Object.entries(mine)) {
    if (depot.get(name)?.join('\n') === rows.join('\n')) { delete mine[name]; delete at[name]; dropped = true; continue; }
    // Publiée depuis (ici ou sur un autre appareil) : la retouche d'ici est plus
    // vieille, le dépôt passe devant ; elle est mise de côté, pas perdue
    if (depot.has(name) && published[name] && (at[name] || 0) < published[name]) {
      old[name] = rows; delete mine[name]; delete at[name]; dropped = true; continue;
    }
    local.set(name, rows);
  }
  if (dropped) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(mine)); } catch { /* rien */ } writeJson(LOCAL_AT_KEY, at); writeJson(OLD_KEY, old); }
  readyResolve();
}

// Un autre onglet (l'éditeur du labo) a changé ce qui est gardé ici : relire, et
// dire quels dessins ont changé (le jeu ouvert les redessine aussitôt)
export function refreshLocal() {
  // (ce qui vient d'être publié compte comme retouché ici, le temps que le site se mette à jour)
  const changed = [], now = Date.now(), merged = {};
  for (const [name, e] of Object.entries(readSent())) if (now - e.at <= SENT_TTL) merged[name] = e.rows;
  Object.assign(merged, readLocal());
  for (const name of new Set([...Object.keys(merged), ...local.keys()])) {
    const rows = merged[name], was = local.get(name);
    if (rows && was?.join('') === rows.join('')) continue;
    if (!rows && !was) continue;
    if (rows) local.set(name, rows); else local.delete(name);
    changed.push(name);
  }
  return changed;
}
