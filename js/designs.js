/* Les dessins uniques du décor (la maison, les barques, le coffre, le roi sur
   son trône, la crypte…) qu'on peut redessiner à la main : on télécharge le
   PNG à l'échelle 1 × 1 dans le labo (onglet Dessins), on le retouche dans un
   éditeur de pixels, on le réimporte, et le jeu s'en sert à la place du dessin
   fait par le code.

   Trois sources, de la plus forte à la plus faible :
   1. importé dans ce navigateur (localStorage : pour essayer chez soi) ;
   2. le fichier `assets/design/<nom>.png` du dépôt (pour tout le monde) ;
   3. le dessin d'origine, fait par le code.

   Les arbres et les rochers restent générés : ils n'en font pas partie.
   Une image importée doit avoir exactement la taille de l'original (les
   positions, la porte, les obstacles en dépendent) ; ses couleurs sont
   ramenées aux trois du jeu (neige, bleu nuit, rouge), le reste est
   transparent. Le décodage du PNG est fait ici, sans relire un canevas
   (certaines extensions anti-pistage le bloquent). */
import { BOAT_FRAMES, BOAT2, ROWBOAT_FRAMES } from './boat.js?v=1.37.0';
import { HOUSE_ART } from './world.js?v=1.37.0';
import { ROOM, CORPSE } from './interior.js?v=1.37.0';
import { CRYPT, CHEST_FRAMES } from './crypt.js?v=1.37.0';
import { CAVE_ROOM, THRONE_FRAMES } from './cave.js?v=1.37.0';
import { BUNDLE, WATCHER } from './grove.js?v=1.37.0';

const entries = (prefix, frames) => Object.entries(frames).map(([k, rows]) => [`${prefix}-${k}`, rows]);

// nom → [libellé, dessin d'origine] ; le nom est celui de la texture du jeu
export const DESIGNS = [
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
  ...entries('chest', CHEST_FRAMES).map(([n, rows]) => [n, `Le coffre (${n.slice(6)})`, rows]),
  ['cave', 'La grotte', CAVE_ROOM],
  ...entries('throne', THRONE_FRAMES).map(([n, rows]) => [n, `Le roi sur son trône (${n.slice(7)})`, rows]),
  ['bundle', 'Une offrande pendue', BUNDLE],
  ['watcher', 'Le guetteur', WATCHER],
].map(([name, label, rows]) => ({ name, label, rows, w: rows[0].length, h: rows.length }));

const BY_NAME = new Map(DESIGNS.map(d => [d.name, d]));
const LOCAL_KEY = 'kingvi:designs';
// nom → { rows, from: 'local' | 'depot' }
const overrides = new Map();

// Les trois couleurs du jeu, lues dans la feuille de style
export function gamePalette() {
  const css = getComputedStyle(document.documentElement);
  const read = v => {
    const n = parseInt(css.getPropertyValue(v).trim().slice(1), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  };
  return { s: read('--game-snow'), b: read('--game-night'), r: read('--accent') };
}
const hex = c => `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;

// Le dessin à utiliser pour cette texture : celui qu'on a remplacé, ou l'original
export function designRows(name, original) {
  return overrides.get(name)?.rows || original;
}
// D'où vient le dessin : 'local', 'depot', ou null (celui du code)
export const designSource = name => overrides.get(name)?.from || null;

// ── Décodage d'un PNG (sans canevas) ──
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
  // Les filtres de chaque ligne
  const px = new Uint8Array(stride * h);
  for (let y = 0; y < h; y++) {
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
  // En RGBA 8 bits
  const out = new Uint8Array(w * h * 4), max = (1 << Math.min(depth, 8)) - 1;
  const sample = (y, idx) => {                    // l'échantillon n° idx de la ligne y
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

// Une image → les rangées de lettres du jeu (s neige, b/k bleu nuit, r rouge, . vide).
// `off` : combien de pixels étaient d'une autre couleur (ramenés à la plus proche)
export function imageToRows(img, original) {
  const pal = gamePalette(), night = original.join('').includes('k') ? 'k' : 'b';
  const letters = [['s', pal.s], [night, pal.b], ['r', pal.r]];
  const rows = [];
  let off = 0;
  for (let y = 0; y < img.h; y++) {
    let row = '';
    for (let x = 0; x < img.w; x++) {
      const o = (y * img.w + x) * 4;
      if (img.data[o + 3] < 128) { row += '.'; continue; }
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

// Un fichier PNG → rangées, vérifiées contre l'original ; { rows, off } ou { error }
export async function importDesign(name, buffer) {
  const d = BY_NAME.get(name);
  if (!d) return { error: `« ${name} » n'est pas un dessin du jeu.` };
  try {
    const img = await decodePng(buffer);
    if (img.w !== d.w || img.h !== d.h) return { error: `Taille ${img.w} × ${img.h} : il faut exactement ${d.w} × ${d.h}.` };
    return imageToRows(img, d.rows);
  } catch (e) { return { error: e.message || 'Fichier illisible.' }; }
}

// Des rangées → un PNG à l'échelle 1 × 1 (fond transparent)
export function rowsToPng(rows) {
  const pal = gamePalette(), color = { s: hex(pal.s), b: hex(pal.b), k: hex(pal.b), r: hex(pal.r) };
  const c = document.createElement('canvas');
  c.width = rows[0].length; c.height = rows.length;
  const ctx = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (!color[ch]) return;
    ctx.fillStyle = color[ch]; ctx.fillRect(x, y, 1, 1);
  }));
  return new Promise(resolve => c.toBlob(resolve, 'image/png'));
}

// ── Ce qui est importé ici, dans ce navigateur ──
function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {}; } catch { return {}; }
}
export function setLocalDesign(name, rows) {
  const all = readLocal();
  if (rows) all[name] = rows; else delete all[name];
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(all)); } catch { return false; }
  return true;
}

// Au lancement : les fichiers du dépôt, puis ce qui est importé ici par-dessus.
// Un fichier absent est le cas normal (le dessin d'origine reste).
export async function loadDesigns() {
  await Promise.all(DESIGNS.map(async d => {
    try {
      const res = await fetch(`assets/design/${d.name}.png`, { cache: 'no-cache' });
      if (!res.ok || !(res.headers.get('content-type') || '').includes('image/png')) return;
      const out = await importDesign(d.name, await res.arrayBuffer());
      if (out.rows) overrides.set(d.name, { rows: out.rows, from: 'depot' });
    } catch { /* hors ligne, extension : le dessin d'origine */ }
  }));
  for (const [name, rows] of Object.entries(readLocal())) {
    const d = BY_NAME.get(name);
    if (d && rows.length === d.h && rows[0].length === d.w) overrides.set(name, { rows, from: 'local' });
  }
}

// Pour le labo : relire après un import, sans recharger
export function applyLocal(name, rows) {
  if (rows) overrides.set(name, { rows, from: 'local' });
  else overrides.delete(name);
}
