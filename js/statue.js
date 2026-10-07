/* Les statues cyclopéennes de Véla. La première, à mi-chemin : ensevelie,
   penchée, brisée. La seconde, au sortir de la forêt : droite, plus grande.
   Les pixels viennent d'une photo de statuette réduite aux couleurs du jeu :
   b sombre, m pierre en demi-teinte (tramée), . vide. Elle fait environ dix
   fois la taille du viking (une fois dégagée de la neige). Tout est déterministe. */

const FREYA = [
  '..................m..mmm..............',
  '.................mmmmmbm..............',
  '................mbmmbmmbmm............',
  '..............mmmbbbbmmbmmm...........',
  '............mmmmmmbbmmmbbmmmm.........',
  '...........mmbmmbmbmbbbbmmmmmmm.......',
  '..........mmmbbmmmbmmbbbbmmbmmm.......',
  '...........mmbbmmbbmmmbbbmbbmmm.......',
  '...........mmbbbmbbbbbbmmmbbbmm.......',
  '...........mmmmmmbbbbbbmmmmbbbm.......',
  '............mmmmmmmmbbbbbbbbbbm.......',
  '............m...mmmmbbbbbbbbbm........',
  '...............mmmmbbbbbmmmmmm........',
  '..............mmmmbbbbbbmmmbmm........',
  '............mbmbmmbbbbbbbmmmbbm.......',
  '...........mbmmbmmbbmbmbbmmbbmm.......',
  '..........mbmmmbmmbbbbbbbbmmbmm.......',
  '..........mmmbbbmmbbbbbbbbmmbmm.......',
  '..........mb.mbbbmbbbbmmbbmmbm........',
  '...........m.mbbbmbbmmbmmbmmmm........',
  '...........bmmbbbmbbbmbbmbmmmm........',
  '...........mmmmbbmbbbmmmmbmmm.........',
  '............mmbbmmbbbbbbbbmmm.........',
  '............mbbmmmbbbbbbbmmmm.........',
  '............mmmm.bbmbbmmmmmm..........',
  '............mmmmmmbbbbmmbmmm..........',
  '...........mmmmmmbbbbbbbbmmb..........',
  '...........mmmmmmmbbbbbbbmmm..........',
  '...........mmmmmmbbbbbmbbmbbm.........',
  '...........mmmmmmmmmbmmmbmbmbm........',
  '...........bbmmmmmmbbmmbbbbbbmm.......',
  '..........bbbmmmmmmmmmmbbbbbmmmm......',
  '.........mbbbbmmmmmmmbbbbbbbbmmm......',
  '......mbbbbbbbbbbbbbbbbbbbbbbbbbm.....',
  '.....mmbbbbbbbmbbbbbbbbbbbbbbbbbmm....',
  '....mmbbbbbbbbbbbbbbbbbbbbbbbbbbmmb...',
  '....mbbbbbmbbbbbbbbbbbbbbbbbbbbmbmbm..',
  '...mmbbbbbbmbmmbbbbbbbbbbbbbbbbbmmmmm.',
  '...mmbbbmbbbbbbbbmbbmbbbbbbbbbbbmmmmm.',
  '...mmbbbbmbbbbbbbbbbbbbbbbbbbbbbmmmmm.',
  '...mbbbbbmbbbbbbmbbbbbbbbbbbbbbbbmmb..',
  '..mbbbbbbmmbbbbbbbbbbbbbbbbbbbbbbbbm..',
  '..mbbbbbbmmbbbbbbbbmbbbbbbbbbbbbbbmmm.',
  '...bbbbbmmbmmbbbbbmmmmbmbbbbbbbbbmmmm.',
  '..mbbbbbbbbmmbbbbbmmmmbbbbbbbbbbbmmmm.',
  '..mmbbbbbbbbmmbbbbmmbmbbbbmbbbbbbmmmm.',
  '..bmbbbbbmbbmmmmbbmmbmbbbbbbbbbbbbmbm.',
  '.mbbbbbmbmbbbbmmbmbbbbbmbbbbbbbbmmmmm.',
  '.mbmbbbmmbbbbbbbmmbbbbbmbbbbbbbbmmmmm.',
  '.mmmbbmmmbmbbbbbmbbbbbbbbbbbbbbbmmbbm.',
  '.mbbbbmbmbbbmbbbbbbbbbbbbbbbbbbbbmbmm.',
  '.mmbbbbbmbbbbbbbbbbmbbbbbbbbbbbbbmbmm.',
  '..bbbbbbmbmbmbbbbbbmbmbbbbbbbbbbbbmm..',
  '.mmmbbbbbbmbmbmbbbbbbmbbbbbbbbbbbbbbm.',
  '.m.bbbbbbbbbmbbbbbbbbmbbbbbbbbbbbbbbm.',
  '.mmbbbbbbbbbbbmbbbbbbbbbbbmbbbbbbbbmm.',
  '.mmmbbbbbbbbbbbbbbbbbbbbbbbbbbbbmbbmm.',
  '.mmmbbbbbbbbmbbbmbbbbbbbbbbbbbbmmmbmm.',
  '.mmbbbbbbbbmbbbbbbbbbmbbbbbbbbbbmmmmb.',
  '.mmbmbbmbmbmmbbbbbbbbmbbbbbbbbbmmmmbb.',
  '.mmbbbbbbbmmmmmbbbbmmbbbbbbbbbbbbmmmm.',
  '.mmbbbbbbbmmmmbbbbmmbbbbbbbbbbbbmmbm..',
  '.mmmbbbbbbbmmmmmbbmmbbbbbbbbbbbbmmbmm.',
  '.mmmbbbbbbbbbmbbbbbmmmmbbbbbbbbbbbbbm.',
  '.mmbbbbbmbbmbbbbbbbbbbbbbbbbbbbbbbbbm.',
  '.mmbbbbbmbbbbbbbmbbbbbbbbbbbbbbmmmbbm.',
  '.mmbbbbmbmbmbbmbbbbbbbbbbbbbbbbmmbbbm.',
  '.mmbbbbbmbmmmbbbbbbbbbbbbbbbbbmmbmbbm.',
  '.mmmbbbbmbmbmbmbbbbbbbbbbbbbbbmmbbbbm.',
  '.mmmbbbbbbbmbbbmbbbbbbbbmbbbbbmmbbbbm.',
  '.mmmmbbbbmbmmbbmbmbbbbbbbbbbbbmmmbbbm.',
  '.mmmbbbbbmbbmbbmbmbbmbbbbbbbbbmmmbmmm.',
  '.mmbbbbbbbbmbbbmbbmbbbbbmbbbbbbmmbmmm.',
  '.mmbbbbbbmbbbbbbbbbbbmbbmbbbbbbmmbmm..',
  '.mmbbbbbbmbbmbbbbbbbbbbbmbbbbbbbbbmmm.',
  '.mmbbbbbmbbbbbbbbbbbbbbbmbbbbbbbbbbbm.',
  '.mbbbbbbmbbmbbbbbbbbbbbbbbbbbbbbbbbbm.',
  'mbbbbbbbbbbmbbmbbbbbbbbbbbbbbbbbmbbbm.',
  'mmbbbbbbbmmmbmmbbmmmbbbbbmbbbbbbmmmbm.',
  'mmmbbbbbmmmbbmbbmmbmbbmbbmbbbbbbmmbbm.',
  'mmmmbbmbmmbbbbbmmbbbbbmbbmbbbbbmmmbmm.',
  'mmmbbbmbbbbbbbbmbbmbbbbbbmbbbbbmmmbmm.',
  'mmmbbbmbbbmbbbmmbbbbbbbbbbbbbbbmmmbmm.',
  'mbmbbbbbbmbbmbmbbbbbbbbbbbbbbbbmmmbmm.',
  'mbmbbbbmbmbbmbbbbmbbmbbbbbbbbbbbmmbmm.',
  'mbbmbbbmbmbmmbbbbbmbmbbbmbbbbbbmmmbmm.',
  'mmbmbbbbmmbmbbbbbbmbbbbbmbbbbbbmbmbmm.',
  '.mmmbbbbbmbbbmbbbmbbbbbbmbbbbbbbbbmm..',
  '.mmmbmbbbbbbmmbbmbbbbbbbbbbbbbbbbbmm..',
  '.mmmbmbbbbbbmbbmbbbbbbbbbbbbbbbbbmmmm.',
  'mmbmbmbbbbmbmbmbbbbbmbmbbbbbbbbbmmbmmm',
  '.mbmbbmbmbmbmbmbbmbbmbmbbbbbbbbmmmbmmm',
  '.mbbbbbbmbbbbbmbbmbmbbbbbbbbbbbbbbbbmm',
  '.mbbbbbbbbbbbmbbbmmmbbbbbmbbbbbbbbbbmm',
  '.mmbbbmmmbbbbbbbbmbmbbbbbbbbbbbbbmbbmm',
  '...mmmmmmmmmbbbbbbbbbbbbbbbbbbbbbmbmmm',
  '.......mmmmmmmmmbbbbbbbbbmmmmmmmbbmmmm',
];

// Même photo, réduite moins fort : pour la grande statue droite.
const FREYA_BIG = [
  '.........................mm....mm.....................',
  '........................mmmm..mmmm....................',
  '.......................mbbmmmmmmbmm...................',
  '......................mmbbmmbmmmbbmm..................',
  '....................mmmmbbmbbbmmbmmmmm................',
  '...................mmmmmbbbbbmmmmbmmmmm...............',
  '................mmmmmmmmmbbbbmmmmbbmmmmmmm............',
  '...............mmmmbmmmmmbbmbbbbbbbmmmbmmmm...........',
  '...............mmmbbbmmbmbbmmbbbbbmmmmmbmmmm..........',
  '...............mmmbbbmmmbbbmmbbbbbbbmmmbmmmm..........',
  '................mmbbbmbmbbbbmbmbbbmmmmbbmmmm..........',
  '................mmmbbmbmbbbbmbbbbbbmmbmbmmmm..........',
  '...............mmmmbbbbmbbbbbbbbbmmmmbmbbmmm..........',
  '...............mmmmmbmmbbbbbbbbbbmbmmmbbmbmm..........',
  '.................mbmmmmmmmmbbbbbbbbbbmbmbbm...........',
  '.................mmm..mmmmmmbbbbbbbbbbbbbbm...........',
  '...............m.m.....mmmmmmbbbbmbbbmbbbm............',
  '......................mmmmmbbbbbbbmmmmmmmm............',
  '....................mmmmmbbbbbbbbbmmmmbmmm............',
  '....................mmmmmbbbbbbbbbmmmmbmmmm...........',
  '..............m..b.bmmbmmbbbbbbbbbbmmmmmbbbm..........',
  '..............m.mmmbmbbmmbbbmbbmbbbbmmmbbmmm..........',
  '...............mmbbbmmbmmbbbbmbbmbbbbmmbbmmm..........',
  '..............mmbbmmmbbmmbbbbbbbbbbbbmmbmmm...........',
  '..............mmmmbbbmmmmbbbbbbbbbbbbmmmbmmm..........',
  '..............mmmbmbbbbmmbbbbbbbbbbmbmmmbmm...........',
  '...............mb..mbbbbmbbbbbbmmmbbbmmmbmm...........',
  '...............mm.mmbbbb.bbbbmmmbmmbbmmmmmm...........',
  '..................mbbbbb.bbbbmmbbbmmbmmmmm............',
  '................mmmmbbbb.bbbbmmmmmmmbmmmmm............',
  '................mmmmmbbb.bbbbbmmmmmbbmmmmm............',
  '................mmmmbbbm.bbbbbbbbbbbbmmmm.............',
  '.................mmbbbmmmbmbbbbbbbbbmmmmm.............',
  '................mmmbbmmm.bbbbbbbbbbmmmmm..............',
  '..................mmm.m.mbbmbbbmbmmmmmbm..............',
  '................mmmmmmmmbbbmbbbbmmmmmmbm..............',
  '................mmmm.mmmmbbbbbbbbmbmmmbm..............',
  '................mmmm.mmmbbbbbbbbbbbmmmbm..............',
  '................mmmmmm.mmbbbbbbbbbbbmmbm..............',
  '................mmmmmmmmmmbbbbbbbbbbmbbmm.............',
  '................mmmmmmmmbbbbbbbmbbbmmbbmmm............',
  '................mmmmmmmmmmmmmbmmbmbmmbbmbmm...........',
  '................mmmmmmmmmmmmbbmmbmbmbbbbmbm...........',
  '...............mbbmm.mmmmmmbbmmmbmbbbbbmbmmm..........',
  '..............mbbbbmmmmmmmmmmmmmbmbbbbbmmmbmm.........',
  '..............bbbbbbmmmmmmmmmmmmbbbbbbbbbmmbb.........',
  '..........mmmmbbbbbbbmmmmmmmmbbbbbbbbbbbbmmmmm........',
  '........mmmmbbbbbb.bbbbbbbbbbbbbbbbbmbbbmbmbbmm.......',
  '.......mmbbbbbbmbbbmmbbbbbbbbbbbbbbbbbbbbbbbbmmm......',
  '.......mmmmbbbbmbbbbbbbbbmbbbbbbbbbbbbmbbbbbbmmmm.....',
  '......mmmbbbbbbbbbmbbbbbbbbbbbbbbbbbbbbbbbbbbmmmbm....',
  '......mmbbbbbbmbbbbbbbmbmbbbbbbbbbbbbbbbbbbmmmbmbbm...',
  '.....mmbbbbbbbbmmmbbbbbbbbbbbbbbbbbbbbbmbbbbmmmmbmmm..',
  '.....mmbbbbbmbbbbbmmmmbbbbbbbbbbbbbbbbbbbbbbbmbmmmbm..',
  '....mmmmbbbmmbbbbbbbmbmbmbbbbmbbbbbbbbbbbbbbbmmmmmbm..',
  '....mmmbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbmmmmbmm..',
  '....mmmbbbbbmmbbbbbmbbbbbbbbbbbmbbbbbbbbbbbbbbmmmbmm..',
  '....mbmmbbbbbmmmbbbmbbmbbbbmbbbmbbbbbbbbbbbbbbmmmbbm..',
  '...mmbbmbbbbmmmbbbbmbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbm...',
  '....mbbbbbmbmbmmbbbmbbbbbbbbbbbbbbbmbmbmbbbbbbbbbmmm..',
  '....mbbbbbbbmmmmbbmbbbbbbbbmmmbbbbbbbbbbbbbbbbbbmmmm..',
  '...mmbbbbbbmbmbmmmbbbbbbbbmmmmmmmmbbmbbbbbbbbbbmmmmm..',
  '...mbbbbbbbbbbbbmmbmmbbbbbmmmbmbbbbbbbbbbbbbbbbmmmmmm.',
  '..mmmbbbbbmbbbbmbbmbbbbbbbmbmmmbbbmbbbbbbbbbbbmmmmbmm.',
  '...mmbbbbbbbbbbbbbmmbbbbbmmmmbmbbbbbbmmbbbbbbbmmbmbbm.',
  '..mbmmbbbbbbbmbbbmmbmbbbbbmmbbbbbbbmbbbbbbbbbbbbbmbmm.',
  '...bbbbbbbbbbmbbbbbbmmmbbmbmbbmbbbbbmbbbbbbbbbbmbmbmm.',
  '...bbbbbbmmbmmbbbbbbmmmbbmbbbbbbmmbbbbbbbbbbbbmmmmbmm.',
  '..mbbmbbbbmbmbmbbbmbmmbmmmbmmbbbbbmbmbbbbbbbbmmmmmbmm.',
  '..mmbmbbbmmbmbbbbbmbbbbmmbbbbmbbbmbbbbbbbbbbbbmmmbmmm.',
  '..mmbmbbbmmbmbmbbbbbbbbmbbbbbbbbbmbbbbbbbbbbbbmbmbbmm.',
  '..mbbbbbbmmmmbmbbmbbbbbbmbbbbbbbbbbbbmbbbbbbbbbmbbmm..',
  '..mmbbbbbbmmmbmbbmbbbbbmbbbbbbbbbbbbbbbbbbbbbbbmbmmm..',
  '...bbbbbbbmmmbmbbmbbbbbbbmbmbbbbbbbbbbbbbbbbbbbmbmmm..',
  '...bbbbbbbbbmbmbbmbbbbbbbmbmbbbbbbbbbbbbbbbbbbbmmmmm..',
  '..mmmbbbbbbbmbmbbmbbmbbmbmbbbbbbbbbbbbbbbbbbbbbbbmbm..',
  '..m.mbbbbbbbmbbbbmmbbbbbbbbbbbmbbbbbbbbmbbbbbbbbbbbm..',
  '..m.bbbbbbbbmbbmbbmbbbmmmbbbbbmbbbbbmbbmbbbbbmbmbbbmm.',
  '.mmmbbbbbbbbbbbmbbbbmmbbbmbbbbbbbbbbbmbbbbbbbbbbbbmmm.',
  '.mmmmbbbbbbbbbbbbbbmbbbmmbbbbbbbbmbbbbbbbbbbbbmbbbmmm.',
  '.mmmmbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbmbbbmmm.',
  '.mmmmbbbbbbbbbbbbmbbbbbmbbbbbbbbbbbbbbbbbbbbbmmmbbmmm.',
  '.mmmmbbbbbbbbbbbmmbbbbmbbbbbbbmbbbbbbbbbbbbbbmbmmbmbm.',
  '..mmbbbbbbbbbmbbmmbbbbbbmbmbbbmmbbbbbbbbbbbbbbmmmbmbm.',
  '.mmmbmbbbbmbbmbmmmmbbbbbbbbbbbmmbbbbbbbbbbbbmbmmmmmbm.',
  '.mmmmmbbbbbbbmbmmmmmbbbbbbbbmmbmbbbbbbbbbbbbbbmbmmmm..',
  '.mmmbbbbbbbbbbbmmmmmbbbbbbmmmbbbbbbbmbbbmbbbbbbmmbmm..',
  '.mmmmbbbbbbbbbbmmmmmbmbbbbmmmbbbbbbbbbbbbbbbbmmmbbm...',
  '.mmmmbbbbbbbbbbmmmmmmmbbbbmmmbbbmbbbbbbbbbbbbbmmbbmm..',
  '.mmmmbbbbbbbbbbbbmmmmmbbbbbmmmmmmbbbbbbbbbbbbbbbbbmm..',
  '..m.mbbbbbbbbmbbbbbbbbbbbbbbmmbbbbbbbbbbbbbbbbbbbbbmm.',
  '..m.mbbbbbbbmbbmbbbbbbbmbbbbbbbbbbbbbbbbbbbbbbbbbbbmm.',
  '..mmbbbbbbbmmbbmbbbbbbbmbbbbbbbbbbbbbbbbbbbbmmbmbbbbm.',
  '..mmmbbbbbbmbmbbbbmbmbbbbbmbbbbbbbbbbbbbbbbbmmbmmbbbm.',
  '..mmmbbbbbmbmmbmmbmbmbbbbbmbbbbmbbbbbbbbbbbmmmbmbmbmm.',
  '.mmmbbbbbbmbmbbmmbmbmbbbbbmbbbbbbbbbbbbbbbbmmmbmbmbmm.',
  '.mmmmbbbbbmbmbmmbmmbmbbbbbbmbmbbmbbbmbbmbbbmmbbmbmbmm.',
  '.mmmmbbbbbmbmbmbbmbbbmbbbmmbbbbbbmbbbbbmbbbmmbmbbbbmm.',
  '.mmmmmbbbbbbmbbbmbbbbmbbbmbbbbbbbbmbbbbmbbbmmbmbbbbbm.',
  '.mmmmmmbbbbbbmbmmbmbbmmbbmbbbbbbbbbbbbbmbbbmmbmbbmbmm.',
  '.mbmmmbbbbbbbmbbmmbbbmmbbmbbbbbbbbbbbbbbbbbmmbmbbmbmm.',
  '.mmmmmbbbbbbbmbbbmbbbmmbbmbbbmbbbbbbbbbbbbbmmmmbbmmm..',
  '.mmmmbbbbbbmbmbbmmbbbmbbbmbbbbbbbbmbbbbbbbbmmmmbmmmm..',
  '.mmbbbbbbbbmbbmbmbbbbbbbbbbbbbbbbbmmbbbbbbbbmmmbmmm...',
  '.mmmmbbbbbbmbmmbbmbbbbbbbbbbbbbbbbmbbbbbbbbbmmbbmmm...',
  '.mmmmbbbbbbmbmmbbmbbbbbbbbbbbmbbbbmbbbmbbbbbbbbbmmmm..',
  '..m.bbbbbbbmbbbbbbmbbbbbbbbbbbbbbbmbbbmbbbbbbbbbbbmm..',
  '.mmmbbbbbbbbbbbbbbbbbbmbbbbmbbbbbbmmbbbbbbbbbbbbbbmm..',
  '.mmmbbbbbbbbmbbbmbbmbbbbbbbbbbbbbbbbbbbbbbbbbbbbmbbmm.',
  'mmmbbbbbbbbbmbbmmbbbmbbmbbmbbbbbbbbbbbbbbbbbbbmbmbmmm.',
  'bbmbbbbbbbbbmmbmmbbmmbbmbbmmbbbbbbbbbbbbbbbbbbmmmbbbm.',
  'mbmmbbbbbbmbmmbmbbbmmbbbmbmmbbbmbbbmmbbbbbbbbbmmmbbbm.',
  'mbmmbbbbbmbbmmbmbbmmbbbmmbmmbbbmbbbmmbbbbbbbbbmmbbbbm.',
  'mbmmmbbbbmbbmmbmbbbbbbmmmbbbmbbmbbbmmbbbbbbbbbmmbbbbm.',
  'mbmmmbbbbmbbmbbmbbbbbbmmbbbbbbbbbbbmmbbbbbbbbbmmbmbbm.',
  'mmmmbbbbbmbbbbbbbbbbbmmbbbmmbbbbbbbbbbbbbbbbmmmmmmmmm.',
  'mmmmbbbbbmbbbbmbmbbbbmbbbbbbbbbbbbbbmbbmbbbbmmmmmbmmm.',
  'mmmmbbbbbmbbbbmbbmbbmmbbbbbbbbbbbbbbbbbmbbbbmmmmmbmbm.',
  'mmbmbbbbbmbbbmmbbmbbmmbbbbbbbbbbbbbbbbbbbbbbmbmmmbbmm.',
  'mmbmmbbbbbmbbmbbbmmbbmbbbbbbmmbbbbbbbbbmbbbbmmmmmbbmm.',
  'mmbbmbbbbbmmbmbbmmbbbbbbbmbbmmbbbmbbbbbmbbbbbmmmmbbmm.',
  'mmbbmmbbbbbmbmbmmmbbbbbbbmmbbmmbbbmbbbbbbbbbbmbmbbmbm.',
  '.mbbmmbbbbbmbmbmmbbbbbbbbmmbbbbmbbmbbbbbbbbbmbbmmbbb..',
  '.mbbmmbbbbbmbmbbbbbbbbbbmmbbbbbbbbmbbmbbbbbbbbbbmbmm..',
  '.mmbmbbbmbbmbmbbbbmbbbbmmmbbbbbbbbmbbmbbbbbmbbmbbmm...',
  '.mmmmmbbmbbmbbmbbbmbbbmmbbbbbbbbbmbbbmbbbbbbbbmmbmm...',
  '.mmmmmbbmbbbbbmbbmmbbmmbbbbbbbbbbbmbbbbbbbbbbbmmmmm...',
  '.mmbmbbmbbbbbbmbbmmbbmbbbbbbbbbbbbbbbbbbbbbmbmmmmmmmm.',
  '.mmbmbbbmbbbmbmmbmmbmmbbbbbbmbbmmbbbbbbbbbbmbmmmbmmmmm',
  '.mmbmbbbmbbbmbmmbmmbmbbbmbbbmbbmmbbbbbbbbbbmmmmmbmmmmm',
  '.mmbmbbbbbbbmbmbbbmbmbbbbbbbmbbbmmbbbbbbmbbbbbbbbbmmmm',
  '.mbbbbbbbbbbmbbbbbmbmbbbbmbmmbbbbbbbmbbbbbbbmbbbbbbbmm',
  '.mmbbbbbbbbbbbbbbbmbbmbbbmbmmbbbbbbbmbbbbbbbbbbbbbbmmm',
  '..mbbbbbbbbbmbbbbbmbbbbbmmbmbbbbbbbbbbbbbbbbbbmmbbbmmm',
  '..mmmmmmmmmmmmbbmbbbbbbbmmbbbbbbbbbbbbbbbbbbbbbmmbbmmm',
  '.....mmmmmmmmmmmmbbbbbmbbbbbbbbbbbbbbbbbbbbbbbmbbmmmmm',
  '.........mmmmmmmmmmmbbbbbbbbbbbbbbbbbbbbbbbbbbbbmmmmmm',
  '.............mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm.',
];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const toGrid = rows => rows.map(r => [...r].map(c => (c === '.' ? null : c)));

// Tourne une grille d'un angle (degrés) autour du pivot (px, py), plus proche voisin.
function rotate(g, deg, px, py) {
  const a = deg * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
  const H = g.length, W = g[0].length;
  const corners = [[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => [
    px + (x - px) * cos - (y - py) * sin, py + (x - px) * sin + (y - py) * cos,
  ]);
  const x0 = Math.floor(Math.min(...corners.map(c => c[0]))), x1 = Math.ceil(Math.max(...corners.map(c => c[0])));
  const y0 = Math.floor(Math.min(...corners.map(c => c[1]))), y1 = Math.ceil(Math.max(...corners.map(c => c[1])));
  const out = [];
  for (let y = y0; y < y1; y++) {
    const row = [];
    for (let x = x0; x < x1; x++) {
      const dx = x + 0.5 - px, dy = y + 0.5 - py;
      const sx = Math.floor(px + dx * cos + dy * sin), sy = Math.floor(py - dx * sin + dy * cos);
      row.push(sy >= 0 && sy < H && sx >= 0 && sx < W ? g[sy][sx] : null);
    }
    out.push(row);
  }
  // Nouvelle position du pivot dans la grille tournée
  return { g: out, px: px - x0, py: py - y0 };
}

// Enfouit le bas (sous une ligne de neige ondulée), pose de la neige sur les
// dessus, trame la demi-teinte, et rend des lignes de caractères (b, s, .).
function finish(g, groundY, r, snowOnTop = 0.55) {
  const H = g.length, W = g[0].length;
  const wave = r() * 6;
  for (let x = 0; x < W; x++) {
    const line = Math.round(groundY + Math.sin(x * 0.35 + wave) * 1.2 + (r() < 0.2 ? 1 : 0));
    for (let y = Math.max(0, line); y < H; y++) g[y][x] = null;
  }
  // Rogne les lignes et colonnes vides
  let top = 0, bottom = H - 1, left = W, right = 0;
  while (top < H && g[top].every(c => !c)) top++;
  while (bottom > top && g[bottom].every(c => !c)) bottom--;
  for (let y = top; y <= bottom; y++) g[y].forEach((c, x) => { if (c) { left = Math.min(left, x); right = Math.max(right, x); } });
  const out = [];
  for (let y = top; y <= bottom; y++) {
    let row = '';
    for (let x = left; x <= right; x++) {
      const c = g[y][x];
      if (!c) { row += '.'; continue; }
      const open = y === 0 || !g[y - 1][x];
      const edge = open || x === 0 || !g[y][x - 1] || x === W - 1 || !g[y][x + 1];
      if (open && y > top + 1 && r() < snowOnTop) row += 's';        // neige posée
      else if (edge) row += 'b';
      else if (c === 'm') row += 's';                                // pierre éclairée : ressort en clair
      else row += c;
    }
    out.push(row);
  }
  return { rows: out, left, top, bottom };
}

// Lisse le grain de la photo : chaque pixel prend la teinte majoritaire autour
// de lui. Les grandes masses (visage éclairé, corps sombre) ressortent.
function smooth(g) {
  return g.map((row, y) => row.map((c, x) => {
    if (!c) return c;
    let m = 0, b = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const n = g[y + j]?.[x + i];
      if (n === 'm') m++; else if (n === 'b') b++;
    }
    return m > b ? 'm' : 'b';
  }));
}

function cut(g, keep) {
  const piece = g.map((row, y) => row.map((c, x) => (c && !keep(x, y) ? c : null)));
  g.forEach((row, y) => row.forEach((c, x) => { if (c && !keep(x, y)) row[x] = null; }));
  return piece;
}

// Construit la statue et ses éclats. `base` : point où elle sort de la neige.
export function buildStatue(base, seed = 7) {
  const r = rng(seed * 977);
  const g = smooth(toGrid(FREYA));
  const H = g.length, W = g[0].length;

  // La coiffe s'est détachée selon une cassure en dents de scie
  const crestLine = x => Math.round(H * 0.1 + Math.sin(x * 1.3) * 1.5);
  const crest = cut(g, (x, y) => y >= crestLine(x));
  // Un éclat d'épaule, côté droit
  const sx = W * 0.64, sy0 = H * 0.28, sy1 = H * 0.45;
  const shoulder = cut(g, (x, y) => !(x > sx && y > sy0 && y < sy1 && x - sx > (y - sy0) * 0.5));

  // Penchée vers l'ouest, enfouie jusqu'à un tiers de sa hauteur
  const pivotX = W / 2, pivotY = H * 0.68;
  const tilted = rotate(g, -24, pivotX, pivotY);
  const body = finish(tilted.g, tilted.py + 2, r, 0.5);
  const objects = [{
    type: 'statue',
    x: base.x, y: base.y,
    art: { rows: body.rows, ax: Math.round(tilted.px - body.left) },
    foot: 16,
  }];

  // Éclats couchés dans la neige, à demi enfouis
  const pieces = [
    { g: crest, deg: 104, dx: -46, dy: 12 },
    { g: shoulder, deg: 38, dx: 34, dy: 8 },
  ];
  for (const p of pieces) {
    const rot = rotate(p.g, p.deg, W / 2, H / 2);
    const rowsWith = rot.g.map((row, y) => (row.some(Boolean) ? y : -1)).filter(y => y >= 0);
    const ground = rowsWith[0] + (rowsWith.at(-1) - rowsWith[0]) * 0.7;
    const f = finish(rot.g, ground, r, 0.4);
    if (!f.rows.length) continue;
    objects.push({
      type: 'fragment', x: base.x + p.dx, y: base.y + p.dy,
      art: { rows: f.rows, ax: Math.floor(f.rows[0].length / 2) },
      foot: Math.max(2, Math.round(f.rows.length * 0.6)),
    });
  }
  // Menus débris
  for (let i = 0; i < 7; i++) {
    const w = 2 + Math.floor(r() * 3), h = 1 + Math.floor(r() * 2);
    const rows = [...Array(h)].map((_, y) => [...Array(w)].map((_, x) => (y === 0 && (x === 0 || x === w - 1) && r() < 0.5 ? '.' : 'b')).join(''));
    const a = r() * Math.PI * 2, d = 28 + r() * 36;
    objects.push({
      type: 'rubble', x: Math.round(base.x + Math.cos(a) * d), y: Math.round(base.y + Math.sin(a) * d * 0.5 + 4),
      art: { rows, ax: 0 }, foot: 0,
    });
  }
  return objects;
}

// La grande statue, droite, au sortir de la forêt : intacte, à peine enfoncée,
// de la neige posée sur la coiffe et les épaules.
export function buildStatueUpright(base, seed = 7) {
  const r = rng(seed * 1409);
  const g = smooth(toGrid(FREYA_BIG));
  const H = g.length, W = g[0].length;
  const tilted = rotate(g, 3, W / 2, H * 0.85);
  const body = finish(tilted.g, tilted.py + 1, r, 0.7);
  const objects = [{
    type: 'statue',
    x: base.x, y: base.y,
    art: { rows: body.rows, ax: Math.round(tilted.px - body.left) },
    foot: 18,
  }];
  // Quelques pierres tombées à son pied
  for (let i = 0; i < 5; i++) {
    const w = 2 + Math.floor(r() * 3);
    const a = Math.PI * (0.1 + r() * 0.8), d = 26 + r() * 20;
    objects.push({
      type: 'rubble', x: Math.round(base.x + Math.cos(a) * d * (r() < 0.5 ? -1 : 1)), y: Math.round(base.y + 3 + Math.sin(a) * 6),
      art: { rows: ['b'.repeat(w)], ax: 0 }, foot: 0,
    });
  }
  return objects;
}

// La statue de l'îlot : Véla debout, plus petite (≈ 70 px), une porte
// taillée dans le bas de sa robe, à la taille du viking. Noir derrière.
export const DOOR = { w: 5, h: 9 };
export function buildStatueDoor(base, seed = 7) {
  const r = rng(seed * 2311);
  const src = toGrid(FREYA_BIG);
  const k = 0.6, H = Math.round(src.length * k), W = Math.round(src[0].length * k);
  const scaled = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => src[Math.floor(y / k)]?.[Math.floor(x / k)] ?? null));
  // Un socle plein sous la robe : la porte y est taillée
  for (let y = H - 12; y < H; y++) {
    const row = scaled[y];
    const l = row.findIndex(c => c), rr = W - 1 - [...row].reverse().findIndex(c => c);
    if (l < 0) continue;
    for (let x = Math.max(0, l - 1); x <= Math.min(W - 1, rr + 1); x++) row[x] = row[x] || 'b';
  }
  const body = finish(smooth(scaled), H, r, 0.7);
  const rows = body.rows.map(row => [...row]);
  const h = rows.length, cx = Math.round(W / 2 - body.left);
  // La porte : une arche noire, un linteau clair, le seuil enneigé
  for (let y = h - DOOR.h; y < h; y++) {
    for (let x = cx - 2; x <= cx + 2; x++) {
      const top = y === h - DOOR.h;
      if (top && Math.abs(x - cx) === 2) continue;       // arrondi de l'arche
      if (rows[y]?.[x] !== undefined) rows[y][x] = 'k';
    }
  }
  for (let x = cx - 3; x <= cx + 3; x++) if (rows[h - DOOR.h - 1]?.[x] !== undefined) rows[h - DOOR.h - 1][x] = 's';
  if (rows[h - DOOR.h]) { rows[h - DOOR.h][cx - 3] = 's'; rows[h - DOOR.h][cx + 3] = 's'; }
  return [{
    type: 'statue', x: base.x, y: base.y,
    art: { rows: rows.map(r => r.join('')), ax: cx },
    foot: 10,
    door: true,
  }];
}
