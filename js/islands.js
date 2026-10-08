/* L'Archipel des Neuf : les îles qu'on ne joue pas (encore). SNO 7 (l'île du
   roi) et SNO 4 (l'île Carrefour) ont leur vraie carte, tirée du jeu ; les
   sept autres sont dessinées ici d'après la saga, pour le labo : une côte
   tordue par le bruit (rien de géométrique), la forêt tramée, les monts en
   hachures, la banquise, des sentes entre les lieux.
   On compte les îles d'est en ouest. Pas d'import : partagé, sans état. */

// Les îles. `lieux` : nom, position (0 → 1 sur la carte), `forme` : ce qui
// fait le relief (allongement, angle, forêt, monts, banquise, îlots…)
export const ARCHIPEL = [
  {
    n: 1, nom: 'l\'île du Premier feu', graine: 11,
    about: 'La plus à l\'est. Un volcan dort sous la glace ; c\'est de là que vient la braise des forges de tout l\'archipel. La neige y est grise, les sources fument.',
    forme: { long: 1.1, angle: 0.4, foret: 0.15, monts: 0.6, banquise: 0.5, ilots: 2, cratere: { x: 0.52, y: 0.45 } },
    lieux: [['Le cratère qui fume', 0.52, 0.45], ['Les sources chaudes', 0.36, 0.62], ['Le village des fondeurs', 0.62, 0.7], ['Le chemin de cendre', 0.44, 0.3]],
  },
  {
    n: 2, nom: 'l\'île des Phoques', graine: 23,
    about: 'Basse, plate, mangée par la mer. Une colonie de phoques sur la grève, la cabane d\'un chasseur, une arche de glace, et des os de baleine plantés comme des portes.',
    forme: { long: 1.7, angle: -0.3, foret: 0, monts: 0.05, banquise: 0.9, ilots: 5 },
    lieux: [['La grande colonie', 0.3, 0.55], ['La cabane du chasseur', 0.58, 0.48], ['L\'arche de glace', 0.76, 0.38], ['Les os de baleine', 0.45, 0.68]],
  },
  {
    n: 3, nom: 'l\'île des Pêcheurs', graine: 37,
    about: 'Là où Kári a grandi. Le port, les séchoirs à poisson, la maison d\'Ingunn qui tisse les voiles, et au nord la forêt où vivait l\'homme sauvage, Eyvind.',
    forme: { long: 1.25, angle: 0.15, foret: 0.55, monts: 0.25, banquise: 0.3, ilots: 3, port: { x: 0.5, y: 0.78 } },
    lieux: [['Le port', 0.5, 0.78], ['Les séchoirs', 0.36, 0.7], ['La maison d\'Ingunn', 0.6, 0.64], ['La forêt de l\'homme sauvage', 0.46, 0.3], ['Le phare', 0.78, 0.6]],
  },
  {
    n: 4, nom: 'l\'île Carrefour', joue: true,
    about: 'Celle des esprits venus du sud : sa vraie carte est plus haut.',
  },
  {
    n: 5, nom: 'l\'île des Guetteurs', graine: 53,
    about: 'Un plateau sans arbres, battu par le vent. Des tours de pierre sèche, une sur chaque cap : on y allumait des feux pour annoncer les navires. Au milieu, un monastère vide.',
    forme: { long: 1.05, angle: 1.1, foret: 0.05, monts: 0.45, banquise: 0.4, ilots: 1, caps: 5 },
    lieux: [['La tour du nord', 0.5, 0.18], ['La tour aux corbeaux', 0.8, 0.5], ['Le monastère vide', 0.5, 0.5], ['La tour brisée', 0.24, 0.62], ['Le feu du sud', 0.56, 0.84]],
  },
  {
    n: 6, nom: 'l\'île Noyée', graine: 67,
    about: 'La mer est montée, puis elle a gelé. Les toits d\'un village dépassent de la glace, une cloche sonne dessous quand le vent tourne, et une digue tient encore, à moitié.',
    forme: { long: 1.4, angle: 0.7, foret: 0.2, monts: 0.1, banquise: 1, ilots: 7, noyee: true },
    lieux: [['Les toits sous la glace', 0.48, 0.5], ['La cloche', 0.6, 0.42], ['La digue', 0.3, 0.64], ['La colline sèche', 0.72, 0.62]],
  },
  {
    n: 7, nom: 'le continent du roi', joue: true,
    about: 'Celle de Kingvi, où la nuit ne finit pas : sa vraie carte est plus haut.',
  },
  {
    n: 8, nom: 'l\'île de la Brasseuse', graine: 89,
    about: 'Le bord du monde habité. Sidrún y tient la taverne ; Ásdís chante près du feu ; en bas, sur le rivage, le passeur et ses rameurs de pierre attendent ceux qui veulent aller plus loin.',
    forme: { long: 1.2, angle: -0.6, foret: 0.35, monts: 0.5, banquise: 0.2, ilots: 2, falaise: true },
    lieux: [['La taverne au bord du monde', 0.46, 0.46], ['Le rivage du passeur', 0.2, 0.6], ['Les rameurs de pierre', 0.16, 0.7], ['La falaise du bout', 0.78, 0.3]],
  },
  {
    n: 9, nom: 'l\'île du Survivant', graine: 97,
    about: 'Derrière les Eaux de la Mort, une mer immobile et noire. Une maison, un four, un vieux couple qui ne meurt pas ; au fond d\'un puits, la fleur de givre.',
    forme: { long: 0.8, angle: 0, foret: 0.3, monts: 0.15, banquise: 0, ilots: 0, eauxMortes: true },
    lieux: [['La maison et le four', 0.5, 0.46], ['Le puits de la fleur de givre', 0.6, 0.6], ['Le ponton des Eaux de la Mort', 0.24, 0.5]],
  },
];

// ── Le bruit (le même genre que l'île du jeu) ──
function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function value(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s, oct = 4) {
  let t = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { t += amp * value(x * f, y * f, s + i * 31); amp *= 0.5; f *= 2; }
  return t;
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// La terre en (u, v) ∈ [0, 1]² : > 0 dedans
export function islandLand(I, u, v) {
  const F = I.forme, s = I.graine;
  const ca = Math.cos(F.angle), sa = Math.sin(F.angle);
  let x = (u - 0.5) * 2, y = (v - 0.5) * 2;
  [x, y] = [x * ca + y * sa, -x * sa + y * ca];
  x /= F.long;
  const a = Math.atan2(y, x), r = Math.hypot(x, y);
  // le rivage : un rayon qui ondule (caps, baies), puis le grain du bruit
  let edge = 0.62 + 0.12 * Math.sin(a * 3 + s) + 0.08 * Math.sin(a * 5 + s * 2);
  if (F.caps) edge += 0.1 * Math.max(0, Math.sin(a * F.caps + s));
  let land = edge - r + (fbm(u * 5, v * 5, s, 4) - 0.5) * 0.55;
  if (F.port) land -= Math.max(0, 0.13 - Math.hypot(u - F.port.x, v - F.port.y - 0.04)) * 2.4;
  if (F.noyee) land -= 0.16 + (fbm(u * 9, v * 9, s + 5, 3) - 0.5) * 0.4;
  // des îlots autour
  for (let k = 0; k < (F.ilots || 0); k++) {
    const ia = hash(k, 1, s) * Math.PI * 2, ir = 0.36 + hash(k, 2, s) * 0.1;
    const ix = 0.5 + Math.cos(ia) * ir, iy = 0.5 + Math.sin(ia) * ir;
    land = Math.max(land, 0.035 + hash(k, 3, s) * 0.03 - Math.hypot(u - ix, v - iy) + (fbm(u * 14, v * 14, s + k, 2) - 0.5) * 0.05);
  }
  return land;
}

// Dessine la carte d'une île (w × h, en pixels de carte) : ImageData d'abord
// (jamais de relecture des pixels), puis les sentes, les lieux et leurs noms
export function paintIsland(ctx, I, w, h, C) {
  const F = I.forme, s = I.graine;
  const img = new ImageData(w, h);
  const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const P = { snow: rgb(C.snow), night: rgb(C.night), mid: rgb(C.mid), deep: rgb(C.deep), ice: rgb(C.ice), red: rgb(C.red) };
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const u = px / w, v = py / h, i = (py * w + px) * 4, b = (BAYER[(py & 3) * 4 + (px & 3)] + 0.5) / 16;
    const land = islandLand(I, u, v);
    let c;
    if (land < 0) {
      // la banquise, tramée, qui s'éloigne du rivage ; les Eaux de la Mort : rien, que du noir
      const ice = F.eauxMortes ? 0 : (F.banquise || 0) * (0.5 - Math.min(0.5, -land * 3.2)) * 2 * (0.6 + 0.6 * fbm(u * 7, v * 7, s + 9, 3));
      c = b < ice * 0.55 ? P.ice : P.night;
    } else {
      const f = (fbm(u * 6, v * 6, s + 17, 4) - 0.5) * 2 + (F.foret || 0) * 1.2 - 0.6;
      const m = (fbm(u * 4, v * 4, s + 29, 4) - 0.5) * 2 + (F.monts || 0) * 1.3 - 0.75 - Math.max(0, 0.05 - land) * 6;
      if (F.noyee && fbm(u * 18, v * 18, s + 41, 2) > 0.66) c = (px + py) % 3 ? P.ice : P.night;   // les toits sous la glace
      else if (m > 0 && ((px + py * 2) % 5 === 0 || (px - py) % 7 === 0)) c = P.deep;              // les monts : hachures
      else if (f > 0.35) c = P.deep;
      else if (f > 0 && b < f * 1.6) c = P.mid;
      else c = P.snow;
      if (land < 0.012) c = P.night;                                                              // le trait de côte
    }
    img.data.set([...c, 255], i);
  }
  if (F.cratere) {
    const cx = F.cratere.x * w, cy = F.cratere.y * h;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const d = Math.hypot(px - cx, (py - cy) * 1.2) / (w * 0.07) + (fbm(px / 9, py / 9, s + 3, 2) - 0.5) * 0.5;
      if (d < 1 && d > 0.62) img.data.set([...P.night, 255], (py * w + px) * 4);
      else if (d <= 0.62 && (px + py) % 2) img.data.set([...P.red, 255], (py * w + px) * 4);
    }
  }
  ctx.putImageData(img, 0, 0);
  // Les sentes : d'un lieu au suivant, en serpentant
  ctx.fillStyle = C.night;
  const L = I.lieux;
  for (let k = 1; k < L.length; k++) {
    const [, x0, y0] = L[k - 1], [, x1, y1] = L[k];
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * w / 2);
    for (let j = 0; j <= n; j++) {
      const t = j / n, wob = Math.sin(t * Math.PI) * (fbm(t * 3, k, s + 51, 2) - 0.5) * 0.12;
      const x = (x0 + (x1 - x0) * t - (y1 - y0) * wob) * w, y = (y0 + (y1 - y0) * t + (x1 - x0) * wob) * h;
      if (j % 3 !== 2 && islandLand(I, x / w, y / h) > 0) ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }
  // Les deux cubes (cubes.js) : sur chaque île, toujours loin l'un de l'autre
  for (const [kind, u0, v0] of [['blanc', 0.3, 0.32], ['noir', 0.7, 0.68]]) {
    let at = null;
    for (let r = 0; r < 0.4 && !at; r += 0.01) for (let a = 0; a < 6.3; a += 0.4) {
      const u = u0 + Math.cos(a + s) * r, v = v0 + Math.sin(a + s) * r;
      if (islandLand(I, u, v) > 0.05 && !L.some(([, x, y]) => Math.hypot(x - u, y - v) < 0.08)) { at = [u, v]; break; }
    }
    if (!at) continue;
    const X = Math.round(at[0] * w), Y = Math.round(at[1] * h), k = Math.round(w / 128);
    ctx.fillStyle = C.night; ctx.fillRect(X - 3 * k, Y - 3 * k, 6 * k, 6 * k);
    ctx.fillStyle = kind === 'blanc' ? C.snow : C.night; ctx.fillRect(X - 2 * k, Y - 2 * k, 4 * k, 4 * k);
    if (kind === 'noir') { ctx.strokeStyle = C.snow; ctx.lineWidth = 1; ctx.strokeRect(X - 3 * k - 0.5, Y - 3 * k - 0.5, 6 * k + 1, 6 * k + 1); }
  }
  // Les lieux : un repère, et leur nom dans la gothique du jeu
  ctx.textBaseline = 'middle';
  ctx.font = `500 ${Math.round(w / 28)}px "Grenze Gotisch", serif`;
  for (const [nom, x, y] of L) {
    const X = Math.round(x * w), Y = Math.round(y * h);
    ctx.fillStyle = C.night; ctx.fillRect(X - 3, Y - 3, 7, 7);
    ctx.fillStyle = C.red; ctx.fillRect(X - 2, Y - 2, 5, 5);
    ctx.lineWidth = 4; ctx.strokeStyle = C.snow; ctx.strokeText(nom, X + 8, Y);
    ctx.fillStyle = C.night; ctx.fillText(nom, X + 8, Y);
  }
}
