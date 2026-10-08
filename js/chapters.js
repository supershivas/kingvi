/* Les chapitres : aux grands moments de l'aventure, un titre s'inscrit à
   l'écran, « Chapitre III » en petit, « La forêt » en grand (la gothique du
   titre), puis s'efface. Chacun ne paraît qu'une fois par partie. v1.65.0 :
   une seule aventure, d'ouest en est (le ravin est nouveau, le lac n'est plus
   un interlude, la forêt claire n'a plus de chapitre). Le jeu dit quand (game.js,
   `checkChapters`) ; ce module dit quoi et comment. */

export const CHAPTERS = [
  { id: 'greve', label: 'Chapitre I', title: 'La grève' },
  { id: 'ravin', label: 'Chapitre II', title: 'Le ravin' },
  { id: 'noire', label: 'Chapitre III', title: 'La forêt noire' },
  { id: 'louve', label: 'Chapitre IV', title: 'La louve blanche' },
  { id: 'maison', label: 'Chapitre V', title: 'La maison' },
  { id: 'incendie', label: 'Chapitre VI', title: 'L\'incendie' },
  { id: 'lac', label: 'Chapitre VII', title: 'Le lac' },
  { id: 'morts', label: 'Chapitre VIII', title: 'La plaine des morts' },
  { id: 'autre', label: 'Chapitre IX', title: 'L\'autre' },
  { id: 'falaise', label: 'Chapitre X', title: 'La falaise' },
  { id: 'roi', label: 'Chapitre XI', title: 'Le roi sous la roche' },
  { id: 'loups', label: 'Chapitre XII', title: 'Les loups' },
  { id: 'temple', label: 'Chapitre XIII', title: 'Le mur des ans' },
  { id: 'aube', label: 'Fin', title: 'L\'aube' },
  { id: 'carrefour', label: 'Ailleurs', title: 'L\'île Carrefour' },
];
export const chapterById = id => CHAPTERS.find(c => c.id === id);

// Le fond du chapitre : l'ombre ovale actuelle (A), ou une des propositions
// du labo (B → F), dessinées en pixels du jeu, tramées, aux bords rongés
// (rien de géométrique). `CHAPTER_STYLE` : celle du jeu.
export const CHAPTER_STYLES = [
  ['halo', 'A', 'L\'ombre ovale (l\'ancienne)', 'Un ovale sombre aux bords fondus derrière le texte.'],
  ['brume', 'B', 'Brume tramée', 'Une bande de nuit en pixels tramés, dense au centre, qui s\'effiloche en grain vers les bords : la même matière que le voile de nuit et les ombres.'],
  ['lambeau', 'C', 'Lambeau', 'Une bande de nuit aux bords déchirés, comme une peau tendue ou une écorce arrachée ; quelques trous, des fibres qui pendent.'],
  ['pixels', 'D', 'Lettres de neige', 'Pas de fond : le nom est tracé en pixels du jeu, comme le titre de l\'accueil (croûte de neige, ombre tramée), cerné de nuit pour se lire partout.'],
  ['voile', 'E', 'Voile du haut', 'La nuit descend du haut de l\'écran, tramée, et s\'arrête en franges inégales, comme des glaçons ; le titre s\'y inscrit.'],
  ['pierre', 'F', 'Pierre levée', 'Une dalle de pierre noire, taillée de travers, ébréchée, de la neige sur l\'arête : le nom y est gravé.'],
  ['sobre', 'G', 'Sobre (dans le jeu)', 'Pas de fond ni d\'effet : le texte clair, cerné d\'une ombre discrète pour se lire partout, apparaît et s\'efface en fondu.'],
];
export const CHAPTER_STYLE = 'sobre';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y, s) => 0.6 * noise(x, y, s) + 0.3 * noise(x * 2.1, y * 2.1, s + 1) + 0.1 * noise(x * 4.3, y * 4.3, s + 2);

// Un pixel du jeu, en pixels physiques (comme le jeu : ~440 de haut)
const scaleFor = host => Math.max(2, Math.round(host.clientHeight * (window.devicePixelRatio || 1) / 440));
function colors() {
  const css = getComputedStyle(document.documentElement);
  const rgb = v => { const n = parseInt(css.getPropertyValue(v).trim().slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  return { s: rgb('--game-snow'), b: rgb('--game-night'), k: rgb('--game-black') };
}

// Peint le fond (w × h pixels du jeu) : `at(x, y)` rend [couleur, opacité] ou null
function paint(W, H, at) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d'), img = ctx.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = at(x, y);
    if (!p) continue;
    const i = (y * W + x) * 4;
    d[i] = p[0][0]; d[i + 1] = p[0][1]; d[i + 2] = p[0][2]; d[i + 3] = Math.round(p[1] * 255);
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
const dither = (x, y, v) => v * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5;

const BACKDROPS = {
  brume(W, H, C, seed) {
    return paint(W, H, (x, y) => {
      const dx = Math.abs(x - W / 2) / (W / 2), dy = Math.abs(y - H / 2) / (H / 2);
      const n = fbm(x / 9, y / 4, seed) - 0.5;
      const v = (1 - Math.pow(dy, 1.5)) * (1 - Math.pow(dx, 3)) * 1.25 + n * 0.55;
      return dither(x, y, Math.min(1, v)) ? [C.k, 0.72] : null;
    });
  },
  lambeau(W, H, C, seed) {
    return paint(W, H, (x, y) => {
      const top = H * 0.16 + fbm(x / 13, 0, seed) * H * 0.16 + noise(x / 2.5, 1, seed + 3) * H * 0.05;
      const bottom = H * 0.86 - fbm(x / 11, 5, seed + 5) * H * 0.18 - noise(x / 2.2, 7, seed + 6) * H * 0.05;
      const fiber = hash(x, 0, seed + 7) < 0.08 ? H * 0.06 + hash(x, 1, seed + 8) * H * 0.1 : 0;   // des fibres qui pendent
      const end = W * (0.08 + 0.1 * fbm(y / 6, 9, seed + 9)), endR = W * (0.92 - 0.1 * fbm(y / 6, 11, seed + 10));
      if (y < top || y > bottom + fiber || x < end || x > endR) return null;
      if (y > bottom) return hash(x, 3, seed) > 0.5 ? [C.k, 0.85] : null;
      if (hash(x >> 1, y >> 1, seed + 11) < 0.012) return null;                                   // de petits trous
      return hash(x, y, seed + 12) < 0.08 ? [C.b, 0.9] : [C.k, 0.86];
    });
  },
  voile(W, H, C, seed) {
    return paint(W, H, (x, y) => {
      const drip = hash(x >> 1, 0, seed) < 0.2 ? hash(x >> 1, 1, seed) * H * 0.22 : 0;              // des glaçons
      const edge = H * 0.7 + (fbm(x / 10, 0, seed + 1) - 0.5) * H * 0.3 + drip;
      if (y > edge) return null;
      const v = Math.min(1, (edge - y) / (H * 0.45)) * 1.1;
      return dither(x, y, v) ? [C.k, 0.74] : null;
    });
  },
  pierre(W, H, C, seed) {
    const cx = W / 2 + (hash(1, 1, seed) - 0.5) * 4, cy = H / 2, rx = W * 0.4, ry = H * 0.36, tilt = (hash(2, 2, seed) - 0.5) * 0.12;
    return paint(W, H, (x, y) => {
      const yy = y - (x - cx) * tilt;
      const dx = Math.abs(x - cx) / rx, dy = Math.abs(yy - cy) / ry;
      const r = Math.pow(dx, 5) + Math.pow(dy, 3);                                                 // une dalle trapue, pas un ovale
      const chip = fbm(x / 5, yy / 3, seed + 4) * 0.55 + (hash(x >> 2, yy >> 2, seed + 5) < 0.04 ? 0.4 : 0);
      if (r + chip * 0.6 > 1) return null;
      // La neige sur l'arête du haut ; quelques grains clairs dans la pierre
      if (r + chip * 0.6 > 0.8 && yy < cy - ry * 0.55) return [C.s, 0.85];
      if (hash(x, y, seed + 6) < 0.03) return [C.s, 0.25];
      return [hash(x, y, seed + 7) < 0.35 ? C.b : C.k, 0.92];
    });
  },
};

// Le nom en pixels de neige, cerné de nuit et ombré en trame (style D)
async function pixelTitle(text, S) {
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-game-title').trim() || 'serif';
  const size = Math.max(14, Math.round(30 / Math.max(1, S / 3)));
  const font = `800 ${size}px ${family}`;
  try { await Promise.race([document.fonts.load(font, text), new Promise(r => setTimeout(r, 1200))]); } catch { /* police de secours */ }
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const W = Math.ceil(probe.measureText(text).width) + 8, H = Math.round(size * 1.5);
  const src = document.createElement('canvas'); src.width = W; src.height = H;
  const sctx = src.getContext('2d');
  sctx.font = font; sctx.fillStyle = '#000'; sctx.fillText(text, 4, Math.round(size * 1.05));
  const a = sctx.getImageData(0, 0, W, H).data, on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && a[(y * W + x) * 4 + 3] > 110;
  const C = colors();
  return paint(W, H, (x, y) => {
    if (on(x, y)) return [C.s, 1];
    if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) return [C.k, 0.95];                   // le cerne
    if ((on(x - 1, y - 1) || on(x - 2, y - 2) || on(x, y - 2)) && (x + y) % 2) return [C.k, 0.7];           // l'ombre tramée
    return null;
  });
}

// Affiche le chapitre dans `host` (un conteneur en position relative) :
// il monte, reste quelques secondes, s'efface. Rend une promesse.
export function showChapter(host, ch, { hold = 3800, style = CHAPTER_STYLE } = {}) {
  host.querySelector('.chapter')?.remove();
  const el = document.createElement('div');
  el.className = `chapter chapter--${style}`;
  el.setAttribute('role', 'status');
  el.innerHTML = '<span class="chapter-label"></span><span class="chapter-title"></span>';
  el.querySelector('.chapter-label').textContent = ch.label;
  el.querySelector('.chapter-title').textContent = ch.title;
  host.append(el);
  const S = scaleFor(host), dpr = window.devicePixelRatio || 1, seed = ch.id.length * 97 + ch.title.length;
  const ready = (async () => {
    if (BACKDROPS[style]) {
      // Le fond déborde du texte ; le voile part du haut de l'écran
      const box = el.getBoundingClientRect(), hostBox = host.getBoundingClientRect();
      const top = style === 'voile' ? hostBox.top - box.top : -box.height * 0.15;
      const cssW = style === 'voile' ? hostBox.width : Math.min(hostBox.width, el.querySelector('.chapter-title').getBoundingClientRect().width + 260);
      // (le voile descend toujours au moins jusque sous le titre, même si la
      // police n'est pas encore là quand on mesure)
      const cssH = style === 'voile'
        ? Math.max(box.bottom - hostBox.top, hostBox.height * 0.16 + 190) * 1.3
        : box.height * 1.3;
      const W = Math.ceil(cssW * dpr / S), H = Math.ceil(cssH * dpr / S);
      const art = BACKDROPS[style](W, H, colors(), seed);
      art.className = 'chapter-art';
      Object.assign(art.style, { width: `${W * S / dpr}px`, height: `${H * S / dpr}px`, top: `${top}px` });
      el.prepend(art);
    }
    if (style === 'pixels') {
      const art = await pixelTitle(ch.title, S);
      art.className = 'chapter-pixels';
      Object.assign(art.style, { width: `${art.width * S / dpr}px`, height: `${art.height * S / dpr}px` });
      el.querySelector('.chapter-title').replaceWith(art);
      art.setAttribute('aria-label', ch.title);
    }
  })();
  return new Promise(resolve => {
    ready.finally(() => requestAnimationFrame(() => el.classList.add('in')));
    setTimeout(() => {
      el.classList.remove('in'); el.classList.add('out');
      setTimeout(() => { el.remove(); resolve(); }, 1600);
    }, 1400 + hold);
  });
}
