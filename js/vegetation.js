/* La végétation de l'ascension (v1.69.0) : un changement net à chaque étage
   (voir altitude.js). Ce sont des PLACEHOLDERS : des silhouettes tirées par
   famille (touffe, buisson, arbre rond, conifère, arbre tordu, au sol, tas,
   glace, fente, perche, dalle), à redessiner à la main dans l'atelier (groupe
   « La végétation »). Chaque type a plusieurs variantes (`veg-<id>-<n>`),
   tout est à l'échelle du viking (9 px). Lettres : k nuit, b demi-teinte,
   s neige, r rouge (baies, lambeaux).
   Pas encore posé dans le jeu : la v1.70 place chaque type dans son étage. */

const lcg = seed => { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; };
const grid = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
const rows = g => g.map(r => r.join(''));
const put = (g, x, y, c) => { x = Math.round(x); y = Math.round(y); if (g[y] && x >= 0 && x < g[0].length) g[y][x] = c; };

const FAMILIES = {
  // Des brins qui montent du pied, de longueurs inégales
  tuft(w, h, r) {
    const g = grid(w, h);
    for (let x = 0; x < w; x++) {
      if (r() < 0.2) continue;
      const len = Math.max(1, Math.round(h * (0.35 + 0.65 * r()) * (1 - Math.abs(x - (w - 1) / 2) / w)));
      let cx = x;
      for (let k = 0; k < len; k++) { put(g, cx, h - 1 - k, k > len - 2 && r() < 0.5 ? 'b' : 'k'); if (r() < 0.2) cx += r() < 0.5 ? 1 : -1; }
    }
    return rows(g);
  },
  // Un buisson : une masse cabossée, le pied plus sombre, quelques grains clairs
  shrub(w, h, r) {
    const g = grid(w, h), cx = (w - 1) / 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const d = Math.hypot((x - cx) / (w / 2), (y - (h - 1)) / h) + (r() - 0.5) * 0.35;
      if (d < 0.95 && !(y === h - 1 && r() < 0.15)) g[y][x] = y > h * 0.65 ? 'k' : 'b';
    }
    for (let i = 0; i < w * h * 0.06; i++) { const x = Math.floor(r() * w), y = Math.floor(r() * h * 0.6); if (g[y][x] !== '.') g[y][x] = 's'; }
    return rows(g);
  },
  // Un arbre à houppier rond : tronc pâle rayé de nuit, masse irrégulière ; baies si `berries`
  roundTree(w, h, r, o = {}) {
    const g = grid(w, h), cx = Math.floor(w / 2), crown = Math.round(h * 0.62), trunk = h - crown;
    for (let y = 0; y < crown; y++) for (let x = 0; x < w; x++) {
      const d = Math.hypot((x - cx) / (w / 2), (y - crown * 0.52) / (crown / 2)) + (r() - 0.5) * 0.5;
      if (d < 0.98) g[y][x] = r() < 0.12 ? 'k' : 'b';
    }
    for (let y = crown - 1; y < h; y++) {
      const lean = Math.round((r() - 0.5) * 0.8);
      put(g, cx + lean, y, y % 3 === 1 ? 'k' : 's');
      if (trunk > 8 && y < h - 2 && r() < 0.5) put(g, cx + lean + 1, y, 's');
    }
    if (o.berries) for (let i = 0; i < Math.max(3, w * 0.5); i++) { const x = Math.floor(r() * w), y = Math.floor(r() * crown); if (g[y][x] === 'b') g[y][x] = 'r'; }
    return rows(g);
  },
  // Un conifère : étages irréguliers ; `snow` 0 nu, 1 givré (grains clairs), 2 enneigé ; `bare` : mélèze clairsemé
  cone(w, h, r, o = {}) {
    const g = grid(w, h), cx = (w - 1) / 2, trunk = Math.max(1, Math.round(h * 0.1));
    const tiers = Math.max(2, Math.round(h / 6));
    for (let y = 0; y < h - trunk; y++) {
      const t = (y + 1) / (h - trunk), tier = (t * tiers) % 1;
      const half = (w / 2) * (0.12 + 0.88 * t) * (0.55 + 0.45 * tier) * (o.bare ? 0.7 : 1);
      for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
        if (o.bare && r() < 0.45) continue;
        const edge = tier < 0.18 && (o.snow || 0) > 0;
        put(g, x, y, edge && r() < (o.snow === 2 ? 0.9 : 0.4) ? 's' : r() < 0.1 ? 'k' : 'b');
      }
    }
    for (let y = h - trunk; y < h; y++) put(g, Math.floor(cx), y, 'k');
    return rows(g);
  },
  // Un arbre tordu par le vent : le tronc penche, le houppier file d'un seul côté
  twisted(w, h, r) {
    const g = grid(w, h), dir = r() < 0.5 ? 1 : -1;
    let x = dir > 0 ? 1 : w - 2;
    for (let y = h - 1; y >= 0; y--) {
      put(g, x, y, 'k');
      if (y < h * 0.55) for (let k = 1; k <= Math.round(w * 0.3 * (1 - y / h)) + 1; k++) { put(g, x + dir * k, y, r() < 0.8 ? 'b' : 'k'); if (r() < 0.5) put(g, x + dir * k, y - 1, 'b'); }
      if (r() < 0.5) x += dir;
      x = Math.max(0, Math.min(w - 1, x));
    }
    return rows(g);
  },
  // Quelque chose posé à plat : des grains épars (feuilles, branches, lichens, algues)
  litter(w, h, r, o = {}) {
    const g = grid(w, h);
    const n = Math.round(w * h * (o.dense || 0.35));
    for (let i = 0; i < n; i++) {
      const x = Math.floor(r() * w), y = Math.floor(r() * h);
      put(g, x, y, o.light ? (r() < 0.5 ? 's' : 'b') : r() < 0.7 ? 'k' : 'b');
      if (o.long && r() < 0.6) put(g, x + 1, y, 'k');
    }
    return rows(g);
  },
  // Un tas de pierres taillées en facettes
  pile(w, h, r, o = {}) {
    const g = grid(w, h);
    const stones = Math.max(1, Math.round(w / 4));
    for (let s = 0; s < stones; s++) {
      const sw = Math.max(2, Math.round(w / stones + (r() - 0.5) * 2)), sh = Math.max(2, Math.round(h * (0.5 + 0.5 * r())));
      const x0 = Math.round(s * (w - sw) / Math.max(1, stones - 1) || 0), top = h - sh;
      for (let y = top; y < h; y++) for (let x = x0; x < Math.min(w, x0 + sw); x++) {
        const inset = Math.round((1 - (y - top + 1) / sh) * sw * 0.3);
        if (x - x0 < inset || x0 + sw - 1 - x < inset) continue;
        g[y][x] = x > x0 + sw * 0.55 ? 'b' : 'k';
      }
      if (o.frost) for (let x = x0 + 1; x < Math.min(w, x0 + sw - 1); x++) if (r() < 0.6) put(g, x, top, 's');
    }
    return rows(g);
  },
  // De la glace : des blocs clairs aux pans sombres, arêtes brisées
  ice(w, h, r, o = {}) {
    const g = grid(w, h), spikes = o.spikes;
    const blocks = Math.max(1, Math.round(w / (spikes ? 3 : 9)));
    for (let b = 0; b < blocks; b++) {
      const bw = Math.max(2, Math.round(w / blocks)), x0 = Math.round(b * (w - bw) / Math.max(1, blocks - 1) || 0);
      const bh = Math.round(h * (spikes ? 0.4 + 0.6 * r() : 0.55 + 0.45 * r())), lean = (r() - 0.5) * bw * 0.6;
      for (let y = h - bh; y < h; y++) {
        const k = (y - (h - bh)) / bh, sh = spikes ? bw * (0.15 + 0.85 * k) : bw, off = lean * (1 - k);
        for (let x = 0; x < Math.max(1, Math.round(sh)); x++) {
          const px = Math.round(x0 + (bw - sh) / 2 + x + off);
          put(g, px, y, x > sh * 0.6 ? 'b' : x === 0 && r() < 0.85 ? 'k' : 's');
        }
      }
    }
    return rows(g);
  },
  // Le bord d'une crevasse : une bande sombre aux lèvres claires, irrégulières
  crack(w, h, r) {
    const g = grid(w, h);
    for (let x = 0; x < w; x++) {
      const mid = h / 2 + Math.sin(x * 0.5 + r()) * h * 0.18, half = h * (0.18 + 0.2 * r());
      for (let y = 0; y < h; y++) { const d = Math.abs(y - mid); if (d < half) g[y][x] = 'k'; else if (d < half + 1.2 && r() < 0.8) g[y][x] = 's'; }
    }
    return rows(g);
  },
  // Une perche plantée : un fût mince, une traverse, un lambeau rouge si `rag`
  pole(w, h, r, o = {}) {
    const g = grid(w, h), x = Math.floor(w / 2);
    for (let y = 0; y < h; y++) put(g, x, y, y % 4 === 3 ? 's' : 'b');
    if (o.tip) put(g, x, 0, 'r');
    if (!o.rag) { for (let k = 1; k < Math.min(4, w / 2); k++) { put(g, x - k, 2 + (k > 2 ? 1 : 0), 'b'); put(g, x + k, 2 + (k > 2 ? 1 : 0), 'b'); } }
    else for (let k = 1; k < w; k++) put(g, x + k, 1 + Math.round(Math.sin(k) * 0.6), 'r');
    return rows(g);
  },
  // Une dalle ou une corniche : large et basse, le dessus clair, le dessous sombre
  slab(w, h, r, o = {}) {
    const g = grid(w, h);
    for (let x = 0; x < w; x++) {
      const top = Math.round(h * 0.3 * (1 - Math.sin(Math.PI * (x + 0.5) / w)) + r() * 1.2);
      const bottom = o.overhang ? h - 1 - Math.round(Math.sin(Math.PI * (x + 0.5) / w) * h * 0.25 * r()) : h - 1;
      for (let y = top; y <= bottom; y++) g[y][x] = y < top + 2 ? 's' : y > bottom - 2 ? 'k' : 'b';
    }
    return rows(g);
  },
  // Une masse échouée, couchée : bois flotté, varech
  drift(w, h, r, o = {}) {
    const g = grid(w, h);
    let y = h / 2;
    for (let x = 0; x < w; x++) {
      y += (r() - 0.5) * (o.kelp ? 1.4 : 0.6); y = Math.max(0, Math.min(h - 1, y));
      put(g, x, y, 'k'); if (!o.kelp && r() < 0.3) put(g, x, y + 1, 'b');
      if (o.kelp && r() < 0.5) put(g, x, y + (r() < 0.5 ? 1 : -1), 'b');
    }
    return rows(g);
  },
};

// [id, libellé, étage, famille, hauteur, largeur ÷ hauteur, variantes, vent, options]
const TYPES = [
  ['oyats', 'Oyats (touffe de dune)', 'greve', 'tuft', 6, 1, 3, true],
  ['varech', 'Varech échoué', 'greve', 'drift', 3, 2, 2, false, { kelp: true }],
  ['bois-flotte', 'Bois flotté', 'greve', 'drift', 4, 3, 3, false],
  ['galets', 'Galets (tas)', 'greve', 'pile', 4, 1.3, 3, false],
  ['bruyere', 'Bruyère', 'landes', 'shrub', 5, 1.1, 3, true],
  ['ajonc', 'Ajonc épineux', 'landes', 'shrub', 8, 1, 2, true],
  ['fougere', 'Fougère brunie', 'landes', 'tuft', 7, 1, 2, true],
  ['herbe-couchee', 'Herbe couchée', 'landes', 'tuft', 4, 1.2, 3, true],
  ['linaigrette', 'Linaigrette (tourbière)', 'landes', 'tuft', 6, 0.8, 2, true],
  ['genevrier', 'Genévrier rampant', 'landes', 'shrub', 5, 2, 2, false],
  ['bouleau-nain', 'Bouleau nain tordu', 'landes', 'twisted', 14, 0.9, 3, true],
  ['bouleau', 'Bouleau', 'bois', 'roundTree', 32, 0.55, 3, true],
  ['sorbier', 'Sorbier à baies rouges', 'bois', 'roundTree', 24, 0.7, 2, true, { berries: true }],
  ['buisson-nu', 'Buisson nu', 'bois', 'shrub', 9, 1, 2, true],
  ['feuilles-mortes', 'Tapis de feuilles mortes (au sol)', 'bois', 'litter', 8, 1.2, 3, false, { dense: 0.3 }],
  ['souche-moussue', 'Souche moussue', 'bois', 'pile', 5, 1, 1, false],
  ['sapin-nu', 'Sapin sans neige', 'noire', 'cone', 46, 0.5, 3, true, { snow: 0 }],
  ['sapin-givre', 'Sapin givré', 'noire', 'cone', 46, 0.5, 3, true, { snow: 1 }],
  ['jeune-sapin', 'Jeune sapin', 'noire', 'cone', 12, 0.6, 2, true, { snow: 1 }],
  ['branches', 'Branches tombées (au sol)', 'noire', 'litter', 6, 1.5, 3, false, { long: true, dense: 0.25 }],
  ['pin-tordu', 'Pin tordu', 'haut', 'twisted', 16, 1, 3, true],
  ['meleze', 'Mélèze dépouillé', 'haut', 'cone', 28, 0.45, 2, true, { bare: true, snow: 1 }],
  ['airelles', 'Airelles', 'haut', 'shrub', 4, 1.2, 2, false, { berries: true }],
  ['herbe-jaune', 'Herbe jaune raide', 'haut', 'tuft', 5, 1, 3, true],
  ['lichen', 'Lichen sur roc (au sol)', 'plateau', 'litter', 6, 1.2, 3, false, { light: true, dense: 0.3 }],
  ['coussin', 'Coussin d\'altitude', 'plateau', 'shrub', 3, 1.3, 3, false],
  ['fleur', 'Fleur isolée', 'plateau', 'pole', 3, 1, 1, true, { tip: true }],
  ['pierrier', 'Pierrier (dalles plates)', 'eboulis', 'pile', 12, 1.4, 4, false],
  ['pierre-givree', 'Pierre givrée', 'eboulis', 'pile', 8, 1.2, 3, false, { frost: true }],
  ['serac', 'Sérac', 'glacier', 'ice', 30, 0.8, 4, false],
  ['bord-crevasse', 'Bord de crevasse', 'glacier', 'crack', 8, 3, 3, false],
  ['aiguilles-givre', 'Aiguilles de givre', 'glacier', 'ice', 10, 1, 3, false, { spikes: true }],
  ['pont-neige', 'Pont de neige', 'glacier', 'slab', 8, 2.5, 2, false],
  ['corniche', 'Corniche', 'arete', 'slab', 14, 2.8, 3, false, { overhang: true }],
  ['perche', 'Perche de bois givrée (balise)', 'arete', 'pole', 16, 0.5, 2, true],
  ['lambeau', 'Lambeau de tissu accroché', 'arete', 'pole', 6, 1, 1, true, { rag: true }],
  ['dalle-sommet', 'Dalle sommitale', 'sommet', 'slab', 14, 3, 1, false],
  ['givre-roc', 'Givre de roc', 'sommet', 'ice', 8, 1, 3, false, { spikes: true }],
];

const ETAGE_NOM = { greve: 'Grève', landes: 'Landes', bois: 'Bois clair', noire: 'Forêt noire', haut: 'Haut-pays', plateau: 'Plateau', eboulis: 'Éboulis', glacier: 'Glacier', arete: 'Arête', sommet: 'Sommet' };

// Le catalogue : [{ id, label, etage, wind, variants: [{ name, label, rows }] }]
export const VEGETATION = TYPES.map(([id, label, etage, family, h, aspect, n, wind, opt = {}], t) => ({
  id, label, etage, wind, family,
  variants: Array.from({ length: n }, (_, i) => {
    // (la taille varie d'une variante à l'autre, autour de celle annoncée)
    const k = n > 1 ? 1 + 0.16 * (i - (n - 1) / 2) : 1;
    const H = Math.max(2, Math.round(h * k)), W = Math.max(2, Math.round(H * aspect));
    const r = lcg(7001 + t * 131 + i * 17);
    return { name: `veg-${id}-${i + 1}`, label: `${ETAGE_NOM[etage]} · ${label}${n > 1 ? ` (${i + 1})` : ''}`, rows: FAMILIES[family](W, H, r, opt) };
  }),
}));
export const VEGETATION_IMAGES = VEGETATION.flatMap(v => v.variants);
// Par étage : ce qui y pousse (pour la pose dans le monde, v1.70.0)
export const VEGETATION_BY_ETAGE = VEGETATION.reduce((m, v) => ((m[v.etage] = m[v.etage] || []).push(v.id), m), {});
