/* Labo, onglet « La saga » : la bible du récit (saga.js), les arbres
   généalogiques (clic sur un personnage : sa fiche), les personnages dessinés
   d'après le héros (people.js), les lieux, les scénarios et leurs dialogues,
   et les propositions de phylactères (A, B, C…), jouées sur une scène aux
   pixels du jeu. */
import {
  BIBLE, FAMILIES, PEOPLE, PERSON, PLACES, SCENARIOS, VOICES, RARITY, speakerName, WORLDS, worldOf,
} from './saga.js?v=1.65.1';
import { personSprite } from './people.js?v=1.65.1';
import { brokenBox } from './dialogue.js?v=1.65.1';
import { paintSno4, SNO4_W, SNO4_H, SNO4_PROPS, SNO4_BOAT, VEVE } from './sno4.js?v=1.65.1';

const css = getComputedStyle(document.documentElement);
const COL = {
  s: css.getPropertyValue('--game-snow').trim(),
  b: css.getPropertyValue('--game-night').trim(),
  r: css.getPropertyValue('--accent').trim(),
};

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const demos = id => document.querySelector(`#${id} .demos`);

// ── Les dessins ──
const SPRITES = new Map();
const OTHER_SPRITES = {
  corbeau: { rows: ['..bb.', 'bbbbb', '.bbb.', '.b.b.'] },
  ombre: { spec: { corps: 'homme', tete: 'casque', blanc: true } },
  phersu: { spec: { corps: 'homme', tete: 'masque', objet: 'baton' } },
  nornes: { spec: { corps: 'vieille', tete: 'voile', objet: 'fuseau' } },
};
function spriteOf(id) {
  if (SPRITES.has(id)) return SPRITES.get(id);
  let s;
  if (PERSON[id]) s = personSprite(PERSON[id].sprite);
  else if (OTHER_SPRITES[id]?.spec) s = personSprite(OTHER_SPRITES[id].spec);
  else if (OTHER_SPRITES[id]?.rows) {
    const rows = OTHER_SPRITES[id].rows;
    s = { front: rows, walk: null, ground: rows.length - 1, cx: 2, w: rows[0].length, h: rows.length };
  } else s = null;
  SPRITES.set(id, s);
  return s;
}

function drawRows(ctx, rows, x0, y0, flip = false) {
  const w = rows[0].length;
  rows.forEach((row, y) => {
    for (let x = 0; x < w; x++) {
      const c = row[x];
      if (!c || c === '.') continue;
      ctx.globalAlpha = c === 'h' ? 0.3 : 1;
      ctx.fillStyle = COL[c === 'h' ? 'b' : c] || COL.b;
      ctx.fillRect(x0 + (flip ? w - 1 - x : x), y0 + y, 1, 1);
    }
  });
  ctx.globalAlpha = 1;
}

// Visible ou non (observé une fois l'élément posé dans la page)
function watch(target, set) {
  queueMicrotask(() => new IntersectionObserver(es => set(es[es.length - 1].isIntersecting)).observe(target));
}

// Un canevas qui montre un personnage (face, ou en marche), agrandi d'un facteur entier
const animated = new Set();
function spriteCanvas(id, { scale = 3, walk = false, pad = 2 } = {}) {
  const s = spriteOf(id);
  const c = el('canvas', 'saga-sprite');
  if (!s) { c.width = c.height = 1; return c; }
  c.width = s.w + pad * 2; c.height = s.h + pad * 2;
  c.style.width = `${c.width * scale}px`;
  c.style.height = `${c.height * scale}px`;
  const ctx = c.getContext('2d');
  const paint = i => {
    ctx.clearRect(0, 0, c.width, c.height);
    drawRows(ctx, walk && s.walk ? s.walk[i % 4] : s.front, pad, pad);
  };
  paint(0);
  if (walk && s.walk) {
    const item = { paint, visible: false };
    watch(c, v => { item.visible = v; });
    animated.add(item);
  }
  return c;
}
(function animate() {
  const i = Math.floor(performance.now() / 1000 * 6);
  for (const a of animated) if (a.visible) a.paint(i);
  requestAnimationFrame(animate);
})();

// ── La fiche d'un personnage (dialogue) ──
const STATUS = { vivant: 'Vivant', mort: 'Mort', 'mort-vivant': 'Ni mort ni vivant', immortel: 'Ne meurt pas', 'a-naitre': 'À naître', disparu: 'Disparu' };
const fiche = el('dialog', 'saga-fiche');
document.body.append(fiche);
fiche.addEventListener('click', e => { if (e.target === fiche) fiche.close(); });

const childrenOf = id => PEOPLE.filter(p => p.parents?.includes(id));
const spokenIn = id => SCENARIOS.filter(s => s.lignes.some(([w]) => w === id));

function personLink(id) {
  const b = el('button', 'saga-chip');
  b.type = 'button';
  b.append(spriteCanvas(id, { scale: 2, pad: 1 }), el('span', null, speakerName(id)));
  if (PERSON[id]) b.addEventListener('click', () => openFiche(id));
  else b.disabled = true;
  return b;
}

function openFiche(id) {
  const p = PERSON[id];
  if (!p) return;
  fiche.replaceChildren();
  const box = el('div', 'saga-fiche-box');
  const head = el('div', 'saga-fiche-head');
  const portrait = el('div', 'saga-portrait');
  const big = spriteOf(id)?.h > 30 ? 3 : spriteOf(id)?.h > 16 ? 4 : 6;
  portrait.append(spriteCanvas(id, { scale: big, walk: true }));
  const title = el('div', 'saga-fiche-title');
  title.append(el('h3', null, p.nom), el('p', 'saga-surnom', p.surnom || ''));
  const fam = FAMILIES.find(f => f.id === p.famille);
  const meta = el('p', 'saga-meta', [fam?.nom, p.vie && `${p.vie}`, STATUS[p.statut]].filter(Boolean).join(' · '));
  title.append(meta);
  const close = el('button', 'icon-btn icon-only saga-close');
  close.type = 'button'; close.setAttribute('aria-label', 'Fermer');
  close.innerHTML = '<i class="ti ti-x" aria-hidden="true"></i>';
  close.addEventListener('click', () => fiche.close());
  head.append(portrait, title, close);
  box.append(head);

  const facts = el('dl', 'saga-facts');
  for (const [k, v] of [['Rôle', p.role], ['Où', p.lieu], ['Magie', p.magie], ['Voix', p.voix], ['Origine', p.origine]]) {
    if (!v) continue;
    facts.append(el('dt', null, k), el('dd', null, v));
  }
  box.append(facts);
  const bio = el('div', 'saga-bio');
  for (const para of p.bio || []) bio.append(el('p', null, para));
  box.append(bio);

  const kin = [
    ['Parents', p.parents || []],
    ['Conjoints', p.conjoints || []],
    ['Enfants', childrenOf(id).map(c => c.id)],
    ['Frères et sœurs', PEOPLE.filter(o => o.id !== id && o.parents?.length && p.parents?.length && o.parents.some(x => p.parents.includes(x))).map(o => o.id)],
    ['Frères et sœurs de lait', p.lait || []],
  ].filter(([, ids]) => ids.length);
  if (kin.length) {
    const k = el('div', 'saga-kin');
    for (const [label, ids] of kin) {
      const row = el('div', 'saga-kin-row');
      row.append(el('span', 'saga-kin-label', label));
      const chips = el('div', 'saga-chips');
      ids.forEach(i => chips.append(personLink(i)));
      row.append(chips);
      k.append(row);
    }
    box.append(k);
  }

  if (p.veut) {
    box.append(el('h4', null, 'Ce qu\'il veut (touche E, dans le jeu)'));
    const q = el('div', 'saga-quotes');
    p.veut.lignes.forEach(l => q.append(el('blockquote', null, `« ${l} »`)));
    if (p.veut.don) {
      const NOMS = { sceau: 'le sceau de la crypte', poupee: 'la poupée de paille', viking: 'l\'anneau de l\'autre', boucle: 'la boucle du compagnon', rubis: 'le rubis du roi', medaillon: 'le médaillon', loup: 'la dent du loup' };
      q.append(el('p', null, `Si on lui donne ${NOMS[p.veut.don.relique] || p.veut.don.relique} (touche E) :`));
      p.veut.don.lignes.forEach(([who, l]) => q.append(el('blockquote', null, `${who} : « ${l} »`)));
    }
    if (p.veut.apres) [].concat(p.veut.apres).forEach(a => a.lignes.forEach(l => q.append(el('blockquote', null, `Après (${a.si}) : « ${l} »`))));
    box.append(q);
  }
  const lines = p.lignes?.length ? p.lignes : [];
  const scenes = spokenIn(id);
  if (lines.length || scenes.length) {
    box.append(el('h4', null, 'Ce qu\'il dit'));
    const q = el('div', 'saga-quotes');
    lines.forEach(l => q.append(el('blockquote', null, `« ${l} »`)));
    box.append(q);
    if (scenes.length) {
      const list = el('p', 'saga-meta', `Parle dans : ${scenes.map(s => s.titre).join(', ')}.`);
      box.append(list);
    }
  }
  fiche.append(box);
  if (!fiche.open) fiche.showModal();
  box.scrollTop = 0;
}

// Un titre entre les deux mondes de la saga (quand on passe de l'un à l'autre)
function worldBreak(root, item, state) {
  const w = worldOf(item);
  if (state.w === w) return;
  state.w = w;
  const h = el('h3', `saga-world saga-world-${w}`, WORLDS[w]);
  root.append(h);
}

// ══ La bible ══
(function bible() {
  const root = demos('saga-bible');
  const state = {};
  for (const page of BIBLE) {
    worldBreak(root, page, state);
    const card = el('article', 'demo saga-page' + (page.liste ? ' wide' : ''));
    card.append(el('h3', null, page.titre));
    if (page.texte) page.texte.forEach(t => card.append(el('p', 'saga-text', t)));
    if (page.liste) {
      const dl = el('dl', 'saga-chrono');
      page.liste.forEach(([d, t]) => dl.append(el('dt', null, d), el('dd', null, t)));
      card.append(dl);
    }
    root.append(card);
  }
})();

// ══ Les arbres ══
// Une famille : ses membres, leurs conjoints venus d'ailleurs (alliances) et,
// une génération plus bas, leurs enfants partis dans une autre famille.
const NODE_W = 112, NODE_H = 104, ROW_H = 150, GAP = 12;

function familyNodes(fid) {
  const nodes = new Map();
  const add = (p, gen, guest) => { if (!nodes.has(p.id)) nodes.set(p.id, { p, gen, guest }); };
  const members = PEOPLE.filter(p => p.famille === fid);
  members.forEach(p => add(p, p.gen, false));
  for (const p of members) {
    for (const s of p.conjoints || []) if (PERSON[s] && PERSON[s].famille !== fid) add(PERSON[s], p.gen, true);
    for (const c of childrenOf(p.id)) if (c.famille !== fid) add(c, p.gen + 1, true);
  }
  return nodes;
}

function layoutTree(fid) {
  const nodes = familyNodes(fid);
  const gens = [...new Set([...nodes.values()].map(n => n.gen))].sort((a, b) => a - b);
  const pos = new Map();
  let maxSlots = 0;
  const rows = [];
  for (const g of gens) {
    const inGen = [...nodes.values()].filter(n => n.gen === g);
    // Les enfants sous leurs parents : rang moyen des parents déjà placés
    const key = n => {
      const ps = (n.p.parents || []).filter(id => pos.has(id)).map(id => pos.get(id).slot);
      if (ps.length) return ps.reduce((a, b) => a + b, 0) / ps.length;
      const anchor = [...(n.p.lait || []), ...(n.p.conjoints || [])].find(id => pos.has(id));
      return anchor ? pos.get(anchor).slot + 0.5 : 999;
    };
    const order = [];
    const placed = new Set();
    const sorted = inGen.filter(n => !n.guest || !(n.p.conjoints || []).some(s => nodes.has(s) && nodes.get(s).gen === g))
      .sort((a, b) => key(a) - key(b));
    const put = n => { if (!placed.has(n.p.id)) { placed.add(n.p.id); order.push(n); } };
    for (const n of sorted) {
      // Un conjoint de la même génération, juste avant ou juste après
      const spouses = (n.p.conjoints || []).map(id => nodes.get(id)).filter(s => s && s.gen === g && !placed.has(s.p.id));
      if (spouses.length > 1) put(spouses.shift());
      put(n);
      spouses.forEach(put);
    }
    inGen.forEach(put);
    rows.push({ g, order });
    maxSlots = Math.max(maxSlots, order.length);
    order.forEach((n, i) => pos.set(n.p.id, { slot: i, row: rows.length - 1 }));
  }
  // Centrer chaque rangée
  const width = maxSlots * (NODE_W + GAP) + GAP;
  for (const r of rows) {
    const off = (width - r.order.length * (NODE_W + GAP) - GAP) / 2;
    r.order.forEach((n, i) => {
      const p = pos.get(n.p.id);
      p.x = off + GAP + i * (NODE_W + GAP);
      p.y = 16 + p.row * ROW_H;
    });
  }
  return { nodes, rows, pos, width, height: rows.length * ROW_H + 8 };
}

function drawTree(fid) {
  const { nodes, pos, width, height } = layoutTree(fid);
  const wrap = el('div', 'saga-tree');
  const inner = el('div', 'saga-tree-inner');
  inner.style.width = `${width}px`;
  inner.style.height = `${height}px`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width); svg.setAttribute('height', height);
  svg.classList.add('saga-lines');
  const line = (d, cls) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d); path.setAttribute('class', cls);
    svg.append(path);
  };
  const mid = id => ({ x: pos.get(id).x + NODE_W / 2, y: pos.get(id).y });
  // Les couples
  const couples = new Set();
  for (const { p } of nodes.values()) {
    for (const s of p.conjoints || []) {
      if (!pos.has(s) || !pos.has(p.id)) continue;
      const k = [p.id, s].sort().join('+');
      if (couples.has(k)) continue;
      couples.add(k);
      const a = mid(p.id), b = mid(s);
      const y = a.y + 40;
      line(`M${Math.min(a.x, b.x) + NODE_W / 2 - 8} ${y} H${Math.max(a.x, b.x) - NODE_W / 2 + 8}`, 'couple');
    }
    // Frères de lait : pointillés
    for (const s of p.lait || []) {
      if (!pos.has(s) || p.id > s) continue;
      const a = mid(p.id), b = mid(s);
      line(`M${a.x} ${a.y + NODE_H - 4} C${a.x} ${a.y + NODE_H + 18}, ${b.x} ${b.y + NODE_H + 18}, ${b.x} ${b.y + NODE_H - 4}`, 'lait');
    }
  }
  // Les enfants : un « peigne » par couple (ou parent seul), à sa propre
  // hauteur pour que deux fratries de la même rangée ne se confondent pas
  const broods = new Map();
  for (const { p } of nodes.values()) {
    const ps = (p.parents || []).filter(id => pos.has(id));
    if (!ps.length) continue;
    const k = ps.slice().sort().join('+');
    if (!broods.has(k)) broods.set(k, { ps, kids: [] });
    broods.get(k).kids.push(p.id);
  }
  const perRow = new Map();
  for (const { ps, kids } of broods.values()) {
    const xs = ps.map(id => mid(id).x);
    const px = xs.reduce((a, b) => a + b, 0) / xs.length;
    const py = mid(ps[0]).y + (ps.length > 1 ? 40 : NODE_H - 6);
    const row = pos.get(kids[0]).row;
    const n = perRow.get(row) || 0;
    perRow.set(row, n + 1);
    const bus = mid(kids[0]).y - 12 - (n % 4) * 7;
    const kx = kids.map(id => mid(id).x);
    line(`M${px} ${py} V${bus}`, 'descent');
    line(`M${Math.min(px, ...kx)} ${bus} H${Math.max(px, ...kx)}`, 'descent');
    kids.forEach(id => { const c = mid(id); line(`M${c.x} ${bus} V${c.y}`, 'descent'); });
  }
  inner.append(svg);
  for (const n of nodes.values()) {
    const { x, y } = pos.get(n.p.id);
    const b = el('button', 'saga-node' + (n.guest ? ' guest' : '') + ` st-${n.p.statut}`);
    b.type = 'button';
    b.style.left = `${x}px`; b.style.top = `${y}px`;
    b.style.width = `${NODE_W}px`; b.style.height = `${NODE_H}px`;
    const s = spriteOf(n.p.id);
    const k = s && s.h > 30 ? 1 : s && s.h > 16 ? 2 : 3;
    const pic = el('span', 'saga-node-pic');
    pic.append(spriteCanvas(n.p.id, { scale: k, pad: 1 }));
    b.append(pic, el('span', 'saga-node-name', n.p.nom), el('span', 'saga-node-sub', n.guest ? (FAMILIES.find(f => f.id === n.p.famille)?.nom || '') : n.p.surnom || ''));
    b.title = `${n.p.nom}, ${n.p.surnom || ''}`;
    b.addEventListener('click', () => openFiche(n.p.id));
    inner.append(b);
  }
  wrap.append(inner);
  return wrap;
}

(function trees() {
  const root = demos('saga-arbres');
  const legend = el('article', 'demo wide saga-legend');
  legend.innerHTML = `<h3>Lire les arbres</h3>
    <p>Un clic sur un personnage ouvre son histoire. Trait plein : un couple ; trait coudé : les enfants ; pointillés : frères et sœurs de lait. En gris, les alliés venus d'une autre famille. Contour rouge : mort ; double contour : ni mort ni vivant ; pointillés : immortel ou à naître.</p>`;
  root.append(legend);
  const state = {};
  for (const f of FAMILIES) {
    worldBreak(root, f, state);
    const card = el('article', 'demo wide saga-family');
    const h = el('h3');
    h.append(el('span', null, f.nom));
    if (f.devise) h.append(el('span', 'tag', `« ${f.devise} »`));
    card.append(h, el('p', null, f.about), drawTree(f.id));
    root.append(card);
  }
})();

// ══ Les personnages ══
(function cast() {
  const root = demos('saga-personnages');
  const intro = el('article', 'demo wide');
  intro.innerHTML = `<h3>D'après le héros</h3><p>Chaque personnage reprend la masse du viking (7 pixels de large, sans visage, l'ombre sur la ligne des pieds) et change la silhouette : tête (casque, capuche, couronne, bonnet orsène, voile, masque, cornes ; pour SNO 4, le haut-de-forme des Gisants, le chapeau de paille de Clède, le foulard des servantes), corps (homme, femme, enfant, vieillard), ce qu'il tient, sa taille (les géants ×2, les géants du froid ×3). Placeholders à redessiner dans l'atelier. Face, puis marche de profil.</p>`;
  root.append(intro);
  const state = {};
  for (const f of FAMILIES) {
    worldBreak(root, f, state);
    const card = el('article', 'demo wide');
    card.append(el('h3', null, f.nom));
    const grid = el('div', 'saga-cast');
    for (const p of PEOPLE.filter(q => q.famille === f.id)) {
      const b = el('button', 'saga-cast-item');
      b.type = 'button';
      const s = spriteOf(p.id);
      const k = s.h > 30 ? 2 : s.h > 16 ? 3 : 4;
      const pics = el('span', 'saga-cast-pics');
      pics.append(spriteCanvas(p.id, { scale: k }), spriteCanvas(p.id, { scale: k, walk: true }));
      b.append(pics, el('span', 'saga-node-name', p.nom), el('span', 'saga-node-sub', p.surnom || ''));
      b.addEventListener('click', () => openFiche(p.id));
      grid.append(b);
    }
    card.append(grid);
    root.append(card);
  }
})();

// ══ Les lieux ══
(function places() {
  const root = demos('saga-lieux');
  const byIsland = new Map();
  for (const pl of PLACES) {
    if (!byIsland.has(pl.ile)) byIsland.set(pl.ile, []);
    byIsland.get(pl.ile).push(pl);
  }
  for (const [ile, list] of byIsland) {
    const card = el('article', 'demo' + (list.length > 4 ? ' wide' : ''));
    card.append(el('h3', null, ile));
    const ul = el('ul', 'saga-places');
    for (const pl of list) {
      const li = el('li');
      const name = el('b', null, pl.nom);
      li.append(name);
      if (pl.nouveau) li.append(el('span', 'saga-new', 'nouveau'));
      li.append(el('span', null, ` — ${pl.about}`));
      ul.append(li);
    }
    card.append(ul);
    root.append(card);
    if (ile === 'SNO 4') root.append(sno4Map(list), sno4Scene());
  }
})();

// La carte de SNO 4 : une île de neige cabossée dans la banquise tramée, les
// quatre pistes du carrefour, et les lieux nommés (aux couleurs du jeu)
function sno4Map(list) {
  const card = el('article', 'demo wide');
  card.append(el('h3', null, 'Carte de SNO 4, l\'île Carrefour'), el('p', null, 'Esquisse, pas encore une île du jeu : la grève et l\'épave à l\'ouest, le carrefour au milieu, le cimetière au nord-est, la maison aux bouteilles sur la banquise à l\'est.'));
  const W = 200, H = 120, k = 4;
  const c = el('canvas', 'saga-map');
  c.width = W * k; c.height = H * k;
  c.style.maxWidth = '100%';
  const g = c.getContext('2d');
  const noise = (x, y) => Math.sin(x * 0.11 + Math.sin(y * 0.07) * 2) * 0.5 + Math.sin(y * 0.13 + x * 0.05) * 0.35 + Math.sin((x + y) * 0.21) * 0.15;
  const land = (x, y) => Math.hypot((x - W * 0.48) / (W * 0.4), (y - H * 0.5) / (H * 0.36)) + noise(x, y) * 0.18 < 1;
  const ice = (x, y) => Math.hypot((x - W * 0.5) / (W * 0.5), (y - H * 0.52) / (H * 0.5)) + noise(x + 40, y) * 0.12 < 1.02;
  const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let col = COL.b;
    if (land(x, y)) col = COL.s;
    else if (ice(x, y)) col = B[(y & 3) * 4 + (x & 3)] < 7 ? COL.s : COL.b;     // la banquise, tramée
    g.fillStyle = col; g.fillRect(x * k, y * k, k, k);
  }
  // Les quatre pistes du carrefour, en pointillés
  const K = list.find(p => p.id === 'kalfou');
  g.fillStyle = COL.b;
  for (const [dx, dy] of [[1, 0.05], [-1, 0.08], [0.1, 1], [-0.05, -1]]) {
    for (let i = 3; i < 70; i += 2) {
      const x = Math.round(K.x * W + dx * i + Math.sin(i * 0.3) * 1.5), y = Math.round(K.y * H + dy * i * 0.6);
      if (land(x, y)) g.fillRect(x * k, y * k, k, k);
    }
  }
  g.font = `500 ${15}px "Grenze Gotisch", serif`;
  g.textBaseline = 'middle';
  for (const p of list) {
    if (p.x == null) continue;
    const x = p.x * W * k, y = p.y * H * k;
    g.fillStyle = COL.b; g.fillRect(x - 6, y - 6, 12, 12);
    g.fillStyle = p.id === 'kalfou' ? COL.r : COL.s; g.fillRect(x - 3, y - 3, 6, 6);
    const tw = g.measureText(p.nom).width, lx = Math.min(W * k - tw - 4, x + 10);
    g.lineWidth = 4; g.lineJoin = 'round'; g.strokeStyle = COL.s; g.strokeText(p.nom, lx, y);
    g.fillStyle = COL.b; g.fillText(p.nom, lx, y);
  }
  card.append(c);
  return card;
}

// L'île telle qu'on la joue (sno4.js) : le sol et ce qui est debout, à l'échelle du jeu
function sno4Scene() {
  const card = el('article', 'demo wide');
  card.append(el('h3', null, 'SNO 4 dans le jeu'), el('p', null, 'L\'île où Kári arrive en barque (la barque, à l\'ouest, près de la Barrière). Le sol, les mâts, le Pilier, les cases, la forge, les croix du cimetière, le fromager, la maison aux bouteilles ; les personnages sont posés par le jeu. En rouge : la barque, et les trois tracés qu\'on marche (Clède près de la Barrière, Lazul sous le fromager, le Baron au sud du cimetière).'));
  const c = el('canvas', 'saga-map');
  c.width = SNO4_W; c.height = SNO4_H;
  c.style.maxWidth = '100%';
  const g = c.getContext('2d');
  paintSno4(g, COL);
  for (const p of SNO4_PROPS) drawRows(g, p.rows, p.at.x - p.ax, p.at.y - p.h + 1);
  g.fillStyle = COL.r; g.fillRect(SNO4_BOAT.x, SNO4_BOAT.y, 30, 10);
  // Les tracé à marcher : leurs points et leurs traits, en rouge pour les voir
  g.fillStyle = COL.r;
  for (const v of VEVE) {
    for (const [a, b] of v.links) {
      const [ax, ay] = v.nodes[a], [bx, by] = v.nodes[b], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
      for (let k = 0; k <= n; k += 2) g.fillRect(Math.round(v.at.x + ax + (bx - ax) * k / n), Math.round(v.at.y + ay + (by - ay) * k / n), 1, 1);
    }
    for (const [dx, dy] of v.nodes) g.fillRect(v.at.x + dx - 1, v.at.y + dy - 1, 3, 3);
  }
  card.append(c);
  return card;
}

// ══ Les scénarios ══
let playScene = () => {};
(function scenarios() {
  const root = demos('saga-scenarios');
  const head = el('article', 'demo wide');
  head.innerHTML = `<h3>${SCENARIOS.length} scénarios</h3><p>La trame est toujours là ; chaque partie tire quatre scénarios « souvent » et, une fois sur trois, un « rare » ; une fin parmi celles de son monde. Deux mondes : SNO 7 (le roi, le Nord, les Orsènes, et le roi qui ne voulait pas mourir) et SNO 4 (l'île Carrefour, un culte des esprits venu du sud). Les dialogues suivent la règle de la parole (bible). « Phylactères » rejoue n'importe quelle scène.</p>`;
  const filters = el('div', 'saga-filters');
  const all = [['tout', 'Tout'], ...Object.entries(RARITY)];
  head.append(filters);
  root.append(head);
  const list = el('div', 'saga-scenes');
  head.append(list);
  let current = 'tout', world = 'tout';
  const worlds = el('div', 'saga-filters');
  for (const [k, label] of [['tout', 'Les deux mondes'], ...Object.entries(WORLDS)]) {
    const b = el('button', 'btn-ghost', label);
    b.type = 'button';
    if (k === 'tout') b.classList.add('on');
    b.addEventListener('click', () => { world = k; worlds.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); render(); });
    worlds.append(b);
  }
  head.append(worlds);
  function render() {
    list.replaceChildren();
    for (const s of SCENARIOS.filter(x => (current === 'tout' || x.rarete === current) && (world === 'tout' || worldOf(x) === world))) {
      const card = el('article', 'demo saga-scene');
      const h = el('h3');
      h.append(el('span', 'tag', `${s.ile || 'SNO 7'} · ${s.rarete}`), el('span', null, s.titre));
      card.append(h);
      const place = PLACES.find(p => p.id === s.lieu);
      card.append(el('p', 'saga-meta', [place?.nom, s.quand, s.mythe && `mythe : ${s.mythe}`, s.magie && `magie : ${s.magie}`].filter(Boolean).join(' · ')));
      card.append(el('p', 'saga-text', s.recit));
      const who = [...new Set(s.lignes.map(([w]) => w))];
      const chips = el('div', 'saga-chips');
      who.forEach(w => chips.append(personLink(w)));
      card.append(chips);
      const script = el('ol', 'saga-script');
      for (const [w, t] of s.lignes) {
        const li = el('li');
        li.append(el('b', null, speakerName(w)), el('span', null, t));
        script.append(li);
      }
      card.append(script);
      const play = el('button', 'btn-ghost');
      play.type = 'button';
      play.innerHTML = '<i class="ti ti-message-circle" aria-hidden="true"></i> Jouer dans les phylactères';
      play.addEventListener('click', () => { playScene(s.id); location.hash = '#saga-phylacteres'; });
      card.append(play);
      list.append(card);
    }
  }
  for (const [k, label] of all) {
    const b = el('button', 'btn-ghost', label);
    b.type = 'button';
    b.addEventListener('click', () => {
      current = k;
      filters.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      render();
    });
    if (k === 'tout') b.classList.add('on');
    filters.append(b);
  }
  render();
})();

// ══ Les phylactères ══
// Une scène aux pixels du jeu (192 × 84), agrandie d'un facteur entier ; le
// texte est en HTML par-dessus, placé au pixel du jeu près.
const SW = 192, SH = 84, FLOOR = 70, HERO_X = 64, OTHER_X = 124;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);

const RUNES = {
  a: 'ᚨ', b: 'ᛒ', c: 'ᚲ', d: 'ᛞ', e: 'ᛖ', f: 'ᚠ', g: 'ᚷ', h: 'ᚺ', i: 'ᛁ', j: 'ᛃ', k: 'ᚲ', l: 'ᛚ', m: 'ᛗ',
  n: 'ᚾ', o: 'ᛟ', p: 'ᛈ', q: 'ᚲ', r: 'ᚱ', s: 'ᛊ', t: 'ᛏ', u: 'ᚢ', v: 'ᚹ', w: 'ᚹ', x: 'ᛉ', y: 'ᛇ', z: 'ᛉ',
};
const toRune = ch => RUNES[ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()] || (/\s/.test(ch) ? ' ' : '᛫');

const PH_STYLES = [
  { key: 'A', titre: 'Sobre', about: 'Comme les chapitres : rien que le texte clair, cerné d\'une ombre bleu nuit, au-dessus de celui qui parle. Apparaît et s\'efface en fondu. Aucun fond.' },
  { key: 'B', titre: 'Lambeau de neige (retenue, dans le jeu)', about: 'Une bulle de neige aux bords cassés, cernée d\'un pixel bleu nuit, avec une pointe en zigzag vers la bouche. Le nom en gothique, en petit. Comme les boutons de l\'accueil.' },
  { key: 'C', titre: 'Pierre levée', about: 'Une dalle bleu nuit, bords éclatés, posée au-dessus de la tête comme une stèle ; le texte en neige, des encoches runiques en haut et en bas.' },
  { key: 'D', titre: 'Souffle', about: 'La parole est une buée tramée qui sort de la bouche et file au vent ; les lettres s\'y inscrivent une à une, puis la buée se défait.' },
  { key: 'E', titre: 'Bandeau du bas', about: 'Comme au cinéma : une bande de nuit en bas de l\'écran, le personnage en grand à gauche, son nom en gothique, la ligne qui s\'écrit.' },
  { key: 'F', titre: 'Runes qui se traduisent', about: 'La ligne apparaît d\'abord en runes (futhark), puis chaque rune se change en lettre. La magie de la parole sur une île où le temps est arrêté.' },
  { key: 'G', titre: 'Hors champ', about: 'Quand celui qui parle est au-delà de la vue (dans le noir), le texte s\'accroche au bord du cercle de vue, du côté de la voix, avec une flèche de pixels. Pour Ása qui suit de loin, le guetteur, les voix.' },
];

const stages = [];
let sceneId = 'roi';

function makeStage(style) {
  const card = el('article', 'demo wide saga-ph');
  const h = el('h3');
  h.append(el('span', 'tag', style.key), el('span', null, style.titre));
  card.append(h, el('p', null, style.about));
  const stage = el('div', `ph-stage ph-${style.key}`);
  const canvas = el('canvas', 'ph-canvas');
  canvas.width = SW; canvas.height = SH;
  const fx = el('canvas', 'ph-fx');      // bulles, buée, pierre : aux pixels du jeu
  fx.width = SW; fx.height = SH;
  const text = el('div', 'ph-text');
  stage.append(canvas, fx, text);
  const scroll = el('div', 'ph-scroll');
  scroll.append(stage);
  card.append(scroll);
  const st = {
    style, card, stage, canvas, fx, text, ctx: canvas.getContext('2d'), fxc: fx.getContext('2d'),
    k: 3, line: 0, t0: performance.now(), visible: false, box: null, seed: 1,
  };
  watch(card, v => { st.visible = v; });
  stages.push(st);
  return card;
}

function fitStages() {
  for (const st of stages) {
    const w = st.card.clientWidth - 28;
    st.k = Math.max(2, Math.min(5, Math.floor(w / SW)));
    st.stage.style.width = `${SW * st.k}px`;
    st.stage.style.height = `${SH * st.k}px`;
    st.stage.style.setProperty('--k', `${st.k}px`);
    st.box = null;
  }
}

const scene = () => SCENARIOS.find(s => s.id === sceneId) || SCENARIOS[0];
// Le héros de la scène : Kári sur SNO 7, Anaïse sur SNO 4 (sauf s'ils se croisent)
const heroOf = s => s.hero || (s.ile === 'SNO 4' && !s.lignes.some(([w]) => w === 'kari') ? 'anaise' : 'kari');
function otherOf(s, upTo) {
  const me = heroOf(s);
  for (let i = upTo; i >= 0; i--) if (s.lignes[i][0] !== me) return s.lignes[i][0];
  return s.lignes.find(([w]) => w !== me)?.[0] || null;
}
const lineTime = t => 0.9 + t.length * 0.055;   // temps de lecture

function drawGround(ctx, t) {
  ctx.fillStyle = COL.s; ctx.fillRect(0, 0, SW, SH);
  // Quelques traces et sillons de neige tramés, accrochés à la scène
  ctx.fillStyle = COL.b;
  for (let x = 0; x < SW; x++) {
    const y = FLOOR + 3 + Math.round(Math.sin(x * 0.13) * 1.2);
    if ((x * 7) % 11 < 2) ctx.fillRect(x, y, 1, 1);
    if ((x * 13) % 29 === 0) ctx.fillRect(x, FLOOR - 30 + ((x * 5) % 9), 1, 1);
  }
  // Pas de Kári, venus de la gauche
  for (let x = 6; x < HERO_X - 8; x += 7) { ctx.fillRect(x, FLOOR + 1, 1, 1); ctx.fillRect(x + 3, FLOOR - 1, 1, 1); }
  // Neige qui tombe
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 40; i++) {
    const x = ((i * 47 + t * (14 + (i % 5) * 3)) % (SW + 20)) - 10;
    const y = ((i * 31 + t * (9 + (i % 3) * 4)) % SH);
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  ctx.globalAlpha = 1;
}

function drawFigure(ctx, id, x, flip, t, walking = false) {
  const s = spriteOf(id);
  if (!s) return null;
  const rows = walking && s.walk ? s.walk[Math.floor(t * 6) % 4] : (s.walk ? s.walk[0] : s.front);
  const x0 = flip ? x - (s.w - 1 - s.cx) : x - s.cx;
  drawRows(ctx, rows, x0, FLOOR - s.ground, flip);
  return { top: FLOOR - s.ground + rows.findIndex(r => /[^.h]/.test(r)), x, mouth: FLOOR - s.ground + Math.min(s.ground - 6, 4) };
}

// Le voile de nuit et le cercle de vue (pour G) : tramé par paliers
function drawSight(ctx, cx, cy, r) {
  ctx.fillStyle = COL.b;
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    const d = Math.hypot((x - cx) / 1.5, y - cy) / r;
    const shade = Math.min(1, Math.max(0, (d - 0.75) * 2.2));
    if (shade > BAYER[(y & 3) * 4 + (x & 3)]) ctx.fillRect(x, y, 1, 1);
  }
}

function renderStage(st, now) {
  const s = scene();
  const elapsed = (now - st.t0) / 1000;
  let line = st.line;
  const [who, txt] = s.lignes[line] || s.lignes[0];
  const dur = lineTime(txt);
  const total = dur + 0.6;
  if (elapsed > total) {
    st.line = (line + 1) % (s.lignes.length + 1);
    st.t0 = now; st.box = null; st.seed++;
    if (st.line === s.lignes.length) { st.line = 0; st.t0 = now + 1600; }
    return;
  }
  const t = now / 1000;
  const key = st.style.key;
  const other = otherOf(s, line);
  const offscreen = key === 'G' || who === 'siduri-echo';
  drawGround(st.ctx, t);
  const hero = drawFigure(st.ctx, heroOf(s), HERO_X, false, t);
  const them = other && !offscreen ? drawFigure(st.ctx, other, OTHER_X, true, t) : null;
  if (key === 'G') drawSight(st.ctx, HERO_X, FLOOR - 6, 52);
  const speaker = who === heroOf(s) ? hero : them;
  const fade = Math.min(1, elapsed / 0.35, Math.max(0, (total - elapsed) / 0.45));
  const shown = Math.min(txt.length, Math.floor(elapsed * 38));
  st.fxc.clearRect(0, 0, SW, SH);
  STYLE_RENDER[key](st, { who, txt, shown, fade, elapsed, dur, speaker, t, hero, other });
}

// Place le texte (CSS) au pixel du jeu près ; renvoie sa boîte en pixels du jeu
function placeText(st, html, { cx, bottom, maxW = 120, cls = '' }) {
  if (st.text.dataset.html !== html || st.text.dataset.cls !== cls) {
    st.text.innerHTML = html;
    st.text.dataset.html = html;
    st.text.dataset.cls = cls;
    st.text.className = `ph-text ${cls}`;
  }
  st.text.style.maxWidth = `${maxW * st.k}px`;
  const w = Math.ceil(st.text.offsetWidth / st.k), h = Math.ceil(st.text.offsetHeight / st.k);
  const x = Math.max(3, Math.min(SW - w - 3, Math.round(cx - w / 2)));
  const y = Math.max(2, bottom - h);
  st.text.style.left = `${x * st.k}px`;
  st.text.style.top = `${y * st.k}px`;
  return { x, y, w, h };
}

const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const typed = (txt, shown) => `${esc(txt.slice(0, shown))}<span class="ph-rest">${esc(txt.slice(shown))}</span>`;
const sayer = who => esc(speakerName(who));

const STYLE_RENDER = {
  A(st, { txt, shown, fade, speaker }) {
    if (!speaker) return;
    placeText(st, typed(txt, txt.length), { cx: speaker.x, bottom: speaker.top - 5, maxW: 110, cls: 'ph-sobre' });
    st.text.style.opacity = fade;
  },
  B(st, { who, txt, shown, fade, speaker }) {
    if (!speaker) return;
    const box = placeText(st, `<span class="ph-name">${sayer(who)}</span>${typed(txt, shown)}`, { cx: speaker.x + 6, bottom: speaker.top - 9, maxW: 100, cls: 'ph-bulle' });
    st.text.style.opacity = fade > 0.5 ? 1 : 0;
    if (fade > 0.5) {
      const pad = 3;
      brokenBox(st.fxc, box.x - pad, box.y - pad, box.w + pad * 2, box.h + pad * 2, COL.s, COL.b, st.seed, {
        tail: { x: Math.max(box.x + 2, Math.min(box.x + box.w - 2, speaker.x + 2)), y: box.y + box.h + pad - 1, len: speaker.top - (box.y + box.h + pad) - 1, dir: -1 },
      });
    }
  },
  C(st, { who, txt, shown, fade, speaker }) {
    if (!speaker) return;
    const box = placeText(st, `${typed(txt, shown)}`, { cx: speaker.x, bottom: speaker.top - 8, maxW: 96, cls: 'ph-pierre' });
    st.text.style.opacity = fade > 0.4 ? 1 : 0;
    if (fade > 0.4) {
      const pad = 4;
      brokenBox(st.fxc, box.x - pad, box.y - pad, box.w + pad * 2, box.h + pad * 2, COL.b, COL.b, st.seed + 7, { chunky: true });
      // Encoches runiques et un pied qui descend vers la tête
      st.fxc.fillStyle = COL.s;
      for (let x = box.x; x < box.x + box.w; x += 4) {
        st.fxc.fillRect(x, box.y - 2, 1, 1);
        st.fxc.fillRect(x + 2, box.y + box.h + 1, 1, 1);
      }
      st.fxc.fillStyle = COL.b;
      for (let y = box.y + box.h + pad; y < speaker.top - 2; y++) st.fxc.fillRect(speaker.x + ((y & 1) ? 0 : 1), y, 1, 1);
    }
  },
  D(st, { txt, shown, fade, speaker, elapsed, t }) {
    if (!speaker) return;
    const drift = elapsed * 5;
    const box = placeText(st, typed(txt, shown), { cx: speaker.x + 16 + drift, bottom: speaker.top - 8 - elapsed * 1.2, maxW: 104, cls: 'ph-souffle' });
    st.text.style.opacity = fade;
    // La buée : une traînée tramée de la bouche vers le texte, qui file au vent
    const g = st.fxc;
    g.fillStyle = COL.b;
    const mx = speaker.x + 3, my = speaker.top + 2;
    const tx = box.x + 4, ty = box.y + box.h;
    for (let i = 0; i < 9; i++) {
      const f = i / 8;
      const bx = mx + (tx - mx) * f + Math.sin(t * 3 + i) * 1.2, by = my + (ty - my) * f;
      const r = 1.5 + f * 3;
      for (let y = Math.floor(by - r); y <= by + r; y++) for (let x = Math.floor(bx - r * 1.4); x <= bx + r * 1.4; x++) {
        const d = Math.hypot((x - bx) / 1.4, y - by) / r;
        if (d <= 1 && (1 - d) * 0.55 * fade * (1 - f * 0.5) > BAYER[(y & 3) * 4 + (x & 3)]) g.fillRect(x, y, 1, 1);
      }
    }
  },
  E(st, { who, txt, shown, fade }) {
    const g = st.fxc;
    g.fillStyle = COL.b;
    g.globalAlpha = 0.92 * Math.min(1, fade * 2);
    const top = SH - 24;
    for (let x = 0; x < SW; x++) g.fillRect(x, top + ((x * 7) % 5 === 0 ? 1 : 0), 1, SH - top);
    g.globalAlpha = 1;
    // Le portrait, en grand
    const s = spriteOf(who);
    if (s) {
      const k = s.h > 16 ? 1 : 2;
      const rows = s.front;
      const off = document.createElement('canvas');
      off.width = s.w; off.height = s.h;
      const oc = off.getContext('2d');
      drawRows(oc, rows.map(r => r.replace(/b/g, 's').replace(/h/g, '.')), 0, 0);
      g.imageSmoothingEnabled = false;
      const ph = Math.min(22, s.h * k), pw = Math.round(s.w * ph / s.h);
      g.drawImage(off, 6, SH - ph - 1, pw, ph);
    }
    placeText(st, `<span class="ph-name">${sayer(who)}</span>${typed(txt, shown)}`, { cx: 34 + 72, bottom: SH - 3, maxW: 150, cls: 'ph-bandeau' });
    st.text.style.left = `${34 * st.k}px`;
    st.text.style.opacity = Math.min(1, fade * 2);
  },
  F(st, { txt, fade, speaker, elapsed }) {
    if (!speaker) return;
    const turned = Math.max(0, Math.floor((elapsed - 0.7) * 30));
    const html = [...txt].map((ch, i) => i < turned ? esc(ch) : `<span class="ph-rune">${toRune(ch)}</span>`).join('');
    placeText(st, html, { cx: speaker.x, bottom: speaker.top - 5, maxW: 112, cls: 'ph-runes' });
    st.text.style.opacity = fade;
  },
  G(st, { who, txt, shown, fade }) {
    // La voix vient de la droite, au-delà du cercle de vue
    const box = placeText(st, `<span class="ph-name">${sayer(who)}</span>${typed(txt, shown)}`, { cx: 150, bottom: 38, maxW: 72, cls: 'ph-hors' });
    st.text.style.opacity = fade;
    const g = st.fxc;
    g.fillStyle = COL.s;
    const ax = Math.min(SW - 3, box.x + box.w + 3), ay = box.y + Math.round(box.h / 2);
    for (let i = 0; i < 3; i++) { g.fillRect(ax + i, ay - i, 1, 1); g.fillRect(ax + i, ay + i, 1, 1); }
  },
};

(function phylacteres() {
  const root = demos('saga-phylacteres');
  const head = el('article', 'demo wide');
  head.innerHTML = `<h3>La même scène, sept façons de parler</h3><p>Choisir une scène : elle se joue dans toutes les propositions. Le texte s'écrit au rythme de la lecture, la ligne suivante vient seule. Proposition à retenir (lettre), puis à brancher dans le jeu.</p>`;
  const sel = el('select', 'design-input saga-select');
  sel.setAttribute('aria-label', 'Scène');
  for (const [w, wl] of Object.entries(WORLDS)) for (const [r, label] of Object.entries(RARITY)) {
    const og = el('optgroup');
    og.label = `${wl.split(',')[0]} · ${label}`;
    SCENARIOS.filter(s => s.rarete === r && worldOf(s) === w).forEach(s => {
      const o = el('option', null, s.titre);
      o.value = s.id;
      og.append(o);
    });
    sel.append(og);
  }
  sel.value = sceneId;
  sel.addEventListener('change', () => playScene(sel.value));
  head.append(sel);
  root.append(head);
  PH_STYLES.forEach(s => root.append(makeStage(s)));
  playScene = id => {
    sceneId = id;
    sel.value = id;
    const now = performance.now();
    for (const st of stages) { st.line = 0; st.t0 = now; st.box = null; }
  };
  fitStages();
  new ResizeObserver(fitStages).observe(root);
  (function loop(now) {
    for (const st of stages) if (st.visible && !st.card.closest('[hidden]')) {
      if (now < st.t0) { st.text.style.opacity = 0; st.fxc.clearRect(0, 0, SW, SH); continue; }
      renderStage(st, now);
    }
    requestAnimationFrame(loop);
  })(performance.now());
})();
