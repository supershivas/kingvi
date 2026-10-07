/* Un petit éditeur de pixels, dans le labo, pour redessiner un élément du décor
   ou une animation (voir designs.js), inspiré de Pixel Studio : crayon, gomme,
   pot de peinture, ligne, rectangle, ellipse, pipette, trame et dégradé tramé,
   taille des outils (1 à 5 pixels), symétries, annuler / rétablir, zoom,
   grille, plein écran, adapté au doigt et à l'Apple Pencil (pas de menu de
   sélection, deux doigts pour déplacer la vue). Trois couleurs (neige, bleu
   nuit, rouge) et le vide. Chaque trait est enregistré aussitôt : le jeu,
   s'il est ouvert dans un autre onglet, se redessine tout seul.

   Les animations : l'éditeur ouvre toutes les images d'un enchaînement (la
   marche, le galop…) ; une bande les montre, on passe de l'une à l'autre ; la
   pelure d'oignon montre les images voisines en transparence ; « Modifier
   toutes les images ensemble » fait chaque trait, chaque gomme, chaque décalage
   sur toutes les images à la fois ; la lecture fait tourner l'animation.

   `openPixelEditor({ frames, index, order, fps, onSave, onReset })` :
   `frames` : [{ name, label, original, rows }] (de la même taille) ;
   `order` : l'ordre de lecture (indices dans `frames`, avec répétitions) ;
   `onSave(name, rows)` est appelé pour chaque image modifiée, après chaque trait ;
   `onReset(name)` quand on revient au dessin d'origine. */
import { gamePalette } from './design-store.js?v=1.61.1';
import { paintSheet, FRAME_W, FRAME_H } from './viking.js?v=1.61.1';

const EMPTY = 0, SNOW = 1, NIGHT = 2, RED = 3, SHADE = 4;
const CODE = { '.': EMPTY, s: SNOW, b: NIGHT, k: NIGHT, r: RED, h: SHADE };
const TOOLS = [
  ['pencil', 'Crayon', 'b', 'pencil'], ['eraser', 'Gomme', 'e', 'eraser'], ['bucket', 'Pot de peinture', 'g', 'bucket'],
  ['line', 'Ligne', 'l', 'line'], ['rect', 'Rectangle', 'r', 'square'], ['ellipse', 'Ellipse', 'o', 'circle'],
  ['dither', 'Trame : pinceau tramé', 't', 'texture'], ['gradient', 'Dégradé tramé : glisser un rectangle', 'd', 'gradienter'],
  ['picker', 'Pipette', 'i', 'color-picker'],
];
// La trame du jeu (le halo de la torche, les ombres) : une trame ordonnée de Bayer 4 × 4,
// accrochée aux pixels de l'image ; une case est peinte si sa valeur est sous la densité
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const DENSITIES = [['25 %', 4], ['50 %', 8], ['75 %', 12]];
const HIST_MAX = 80;
// La pelure d'oignon : les images d'avant en rouge, celles d'après en bleu, de moins en moins visibles
const ONION = { prev: '229,72,77', next: '59,130,246', alpha: [0.7, 0.38] };

let dlg = null, vikingCanvas = null;

function viking(pal) {
  if (vikingCanvas) return vikingCanvas;
  const sheet = document.createElement('canvas');
  const frames = paintSheet(sheet, { s: pal.sHex, b: pal.bHex, r: pal.rHex, k: pal.bHex });
  const f = frames.find(x => x.name === 'side-idle');
  vikingCanvas = document.createElement('canvas');
  vikingCanvas.width = FRAME_W; vikingCanvas.height = FRAME_H;
  vikingCanvas.getContext('2d').drawImage(sheet, f.x, 0, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
  return vikingCanvas;
}

function build() {
  const d = document.createElement('dialog');
  d.className = 'pxe';
  d.innerHTML = `
    <div class="pxe-bar">
      <strong class="pxe-title"></strong>
      <span class="pxe-sub"></span>
      <span class="pxe-grow"></span>
      <span class="pxe-saved" role="status"></span>
      <span class="pxe-nav" hidden>
        <button type="button" data-act="prevf" title="Image précédente ( , )"><i class="ti ti-chevron-left"></i></button>
        <span class="pxe-fnum"></span>
        <button type="button" data-act="nextf" title="Image suivante ( . )"><i class="ti ti-chevron-right"></i></button>
      </span>
      <button type="button" data-act="undo" title="Annuler (Ctrl+Z)"><i class="ti ti-arrow-back-up"></i></button>
      <button type="button" data-act="redo" title="Rétablir (Ctrl+Y)"><i class="ti ti-arrow-forward-up"></i></button>
      <button type="button" data-act="zoomout" title="Zoom arrière (−)"><i class="ti ti-zoom-out"></i></button>
      <span class="pxe-zoom"></span>
      <button type="button" data-act="zoomin" title="Zoom avant (+)"><i class="ti ti-zoom-in"></i></button>
      <button type="button" data-act="fit" title="Ajuster à l'écran (0)"><i class="ti ti-arrows-maximize"></i></button>
      <button type="button" data-act="close" class="pxe-close">Fermer</button>
    </div>
    <div class="pxe-body">
      <div class="pxe-tools"></div>
      <div class="pxe-center">
        <div class="pxe-stage"><canvas class="pxe-canvas"></canvas></div>
        <div class="pxe-frames" hidden></div>
      </div>
      <aside class="pxe-side">
        <div class="pxe-anim" hidden>
          <h4>Animation</h4>
          <label><input type="checkbox" data-opt="all"> Modifier toutes les images ensemble</label>
          <p class="pxe-hint">Coché : chaque trait, chaque gomme, chaque couleur et chaque décalage se fait sur toutes les images à la fois. Décoché : sur l'image en cours seulement.</p>
          <label><input type="checkbox" data-opt="onion"> Pelure d'oignon</label>
          <div class="pxe-onion-n">Images voisines :
            <button type="button" data-onion="1">1</button><button type="button" data-onion="2">2</button>
          </div>
          <p class="pxe-hint">Les images d'avant en rouge, celles d'après en bleu, en transparence.</p>
          <div class="pxe-nudge" title="Décaler le dessin d'un pixel (toutes les images si « ensemble » est coché)">
            <button type="button" data-nudge="-1,0"><i class="ti ti-arrow-left"></i></button>
            <button type="button" data-nudge="0,-1"><i class="ti ti-arrow-up"></i></button>
            <button type="button" data-nudge="0,1"><i class="ti ti-arrow-down"></i></button>
            <button type="button" data-nudge="1,0"><i class="ti ti-arrow-right"></i></button>
            <span>Décaler</span>
          </div>
          <div class="pxe-play">
            <button type="button" data-act="play" title="Lecture (P)"><i class="ti ti-player-play"></i></button>
            <button type="button" data-act="slower" title="Plus lent">−</button>
            <span class="pxe-fps"></span>
            <button type="button" data-act="faster" title="Plus vite">+</button>
          </div>
        </div>
        <h4>Couleur</h4>
        <div class="pxe-colors"></div>
        <h4>Taille de l'outil</h4>
        <div class="pxe-size">
          <button type="button" data-act="smaller" title="Plus petit ( [ )">−</button>
          <span class="pxe-size-n"></span>
          <button type="button" data-act="bigger" title="Plus grand ( ] )">+</button>
        </div>
        <div class="pxe-dens" hidden>
          <div class="pxe-dens-set">
            <h4>Densité de la trame</h4>
            <div class="pxe-dens-btns">${DENSITIES.map(([t], i) => `<button type="button" data-dens="${i}">${t}</button>`).join('')}</div>
          </div>
          <p class="pxe-hint">La trame du jeu : des points régulièrement espacés. « Dégradé tramé » : glissez un rectangle, la trame s'éclaircit du début vers la fin du geste.</p>
        </div>
        <h4>Options</h4>
        <label><input type="checkbox" data-opt="fill"> Formes pleines</label>
        <label><input type="checkbox" data-opt="mirrorH"> Symétrie gauche / droite</label>
        <label><input type="checkbox" data-opt="mirrorV"> Symétrie haut / bas</label>
        <label><input type="checkbox" data-opt="grid" checked> Grille</label>
        <h4>Aperçu en grandeur du jeu</h4>
        <div class="pxe-bgs">
          <button type="button" data-bg="snow">Neige</button><button type="button" data-bg="night">Nuit</button><button type="button" data-bg="mid">Gris</button>
        </div>
        <div class="pxe-preview"><canvas></canvas></div>
        <p class="pxe-hint">Le viking donne l'échelle. Le jeu se met à jour à chaque trait s'il est ouvert dans un autre onglet.</p>
        <button type="button" data-act="original" class="pxe-quiet">Revenir au dessin d'origine</button>
      </aside>
    </div>`;
  document.body.append(d);
  return d;
}

export function openPixelEditor({ frames, index = 0, order = null, fps = 8, onSave, onReset, onClose = () => {}, onAddFrame = null, onRemoveFrame = null, onMoveFrame = null }) {
  dlg?.remove();
  dlg = build();
  const pal = gamePalette();
  const hex = c => `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
  pal.sHex = hex(pal.s); pal.bHex = hex(pal.b); pal.rHex = hex(pal.r);
  // (l'ombre au sol du viking : le bleu nuit à 30 %, vu ici sur le gris de l'aperçu)
  const rgb = [null, pal.s, pal.b, pal.r, pal.b.map((v, i) => Math.round(v * 0.3 + [127, 138, 163][i] * 0.7))];
  const hasShade = frames.some(f => f.original.join('').includes('h') || f.rows.join('').includes('h'));
  const night = frames[0].original.join('').includes('k') ? 'k' : 'b';
  const letter = ['.', 's', night, 'r', 'h'];
  const w = frames[0].rows[0].length, h = frames[0].rows.length, n = frames.length;
  const playOrder = order || frames.map((_, i) => i);
  const $ = s => dlg.querySelector(s);

  const view = $('.pxe-canvas'), vctx = view.getContext('2d'), stage = $('.pxe-stage');
  const prevCv = $('.pxe-preview canvas'), pctx = prevCv.getContext('2d');
  const flat = document.createElement('canvas'); flat.width = w; flat.height = h;
  const fctx = flat.getContext('2d'), fimg = fctx.createImageData(w, h);
  const toGrid = rs => Uint8Array.from(rs.join('').split('').map(c => CODE[c] ?? EMPTY));
  const toRows = g => Array.from({ length: h }, (_, y) => Array.from(g.subarray(y * w, y * w + w), c => letter[c]).join(''));

  // Une grille par image ; `grid` : celle en cours (toujours modifiée sur place)
  const grids = frames.map(f => toGrid(f.rows));
  const allIdx = grids.map((_, i) => i);
  let fi = Math.max(0, Math.min(index, n - 1)), grid = grids[fi];
  const lastSaved = grids.map(g => toRows(g).join('|'));
  const dirty = new Set();
  const snapAll = () => grids.map(g => g.slice());
  const restore = snapshot => snapshot.forEach((s, i) => grids[i].set(s));
  let hist = [], hp = -1;
  const st = { tool: 'pencil', color: SNOW, size: 1, dens: 1, fill: false, mirrorH: false, mirrorV: false, grid: true, bg: 'mid', z: 4, all: false, onion: n > 1, onionN: 1 };
  let drag = null, saveTimer = 0, changed = false, spaceDown = false;
  let playing = false, pf = 0, pfps = fps, timer = 0;

  // ── Outils et couleurs ──
  $('.pxe-tools').innerHTML = TOOLS.map(([id, t, key, icon]) =>
    `<button type="button" data-tool="${id}" title="${t} (${key.toUpperCase()})"><i class="ti ti-${icon}"></i></button>`).join('');
  const swatches = [[SNOW, 'Neige', '1'], [NIGHT, 'Bleu nuit', '2'], [RED, 'Rouge', '3'], [EMPTY, 'Vide (transparent)', '4'], ...(hasShade ? [[SHADE, 'Ombre au sol (bleu nuit translucide)', '5']] : [])];
  $('.pxe-colors').innerHTML = swatches.map(([c, t, key]) =>
    `<button type="button" data-color="${c}" title="${t} (${key})" class="${c ? '' : 'empty'}" ${c ? `style="background:${hex(rgb[c])}"` : ''}></button>`).join('');

  // ── La bande des images (animations) ──
  const strip = $('.pxe-frames');
  if (n > 1) {
    strip.hidden = false; $('.pxe-anim').hidden = false; $('.pxe-nav').hidden = false;
    strip.innerHTML = frames.map((f, i) => `<button type="button" data-frame="${i}" title="${f.label}"><canvas></canvas><span>${i + 1}</span></button>`).join('') + `
      <div class="pxe-strip-tools">
        <button type="button" data-toggle="onion" title="Pelure d'oignon : les images voisines (N)"><i class="ti ti-layers-subtract"></i> Pelure d'oignon</button>
        <button type="button" data-toggle="all" title="Chaque trait sur toutes les images (A)"><i class="ti ti-link"></i> Toutes les images</button>
        <button type="button" data-act="play" title="Lecture (P)"><i class="ti ti-player-play"></i> Lecture</button>
        ${onMoveFrame ? '<button type="button" data-act="move-left" title="Déplacer cette image vers la gauche"><i class="ti ti-arrow-left"></i></button><button type="button" data-act="move-right" title="Déplacer cette image vers la droite"><i class="ti ti-arrow-right"></i></button>' : ''}
        ${onAddFrame ? '<button type="button" data-act="add-blank" title="Ajouter une image vide, juste après celle-ci"><i class="ti ti-plus"></i> Ajouter</button><button type="button" data-act="add-frame" title="Copier cette image : la copie vient juste après"><i class="ti ti-copy"></i> Copier</button>' : ''}
        ${onRemoveFrame && n > 2 ? '<button type="button" data-act="remove-frame" title="Retirer cette image"><i class="ti ti-minus"></i> Image</button>' : ''}
      </div>`;
  }
  const thumbK = Math.max(1, Math.min(8, Math.floor(110 / w), Math.floor(80 / h)));
  function drawThumbs() {
    if (n < 2) return;
    strip.querySelectorAll('button[data-frame]').forEach((b, i) => {
      const cv = b.querySelector('canvas'), c = cv.getContext('2d');
      cv.width = w; cv.height = h; cv.style.width = `${w * thumbK}px`; cv.style.height = `${h * thumbK}px`;
      c.fillStyle = '#7f8aa3'; c.fillRect(0, 0, w, h);
      const g = grids[i];
      for (let k = 0; k < w * h; k++) if (g[k]) { c.fillStyle = hex(g[k] === SHADE ? rgb[4] : rgb[g[k]]); c.fillRect(k % w, (k / w) | 0, 1, 1); }
      b.classList.toggle('on', playing ? i === playOrder[pf % playOrder.length] : i === fi);
    });
  }

  const sync = () => {
    for (const b of dlg.querySelectorAll('[data-tool]')) b.classList.toggle('on', b.dataset.tool === st.tool);
    for (const b of dlg.querySelectorAll('[data-color]')) b.classList.toggle('on', +b.dataset.color === st.color);
    for (const b of dlg.querySelectorAll('[data-bg]')) b.classList.toggle('on', b.dataset.bg === st.bg);
    for (const b of dlg.querySelectorAll('[data-dens]')) b.classList.toggle('on', +b.dataset.dens === st.dens);
    for (const b of dlg.querySelectorAll('[data-onion]')) b.classList.toggle('on', +b.dataset.onion === st.onionN);
    $('.pxe-dens').hidden = st.tool !== 'dither' && st.tool !== 'gradient';
    $('.pxe-dens-set').hidden = st.tool !== 'dither';
    $('.pxe-size-n').textContent = `${st.size} px`;
    $('[data-act="smaller"]').disabled = st.size <= 1; $('[data-act="bigger"]').disabled = st.size >= 5;
    $('[data-act="undo"]').disabled = hp <= 0; $('[data-act="redo"]').disabled = hp >= hist.length - 1;
    $('.pxe-zoom').textContent = `${st.z}×`;
    $('.pxe-title').textContent = frames[fi].label;
    $('.pxe-sub').textContent = `${frames[fi].name} · ${w} × ${h} pixels`;
    $('.pxe-fnum').textContent = `${fi + 1} / ${n}`;
    $('.pxe-fps').textContent = `${pfps} im/s`;
    for (const i of dlg.querySelectorAll('[data-act="play"] i')) i.className = `ti ti-player-${playing ? 'pause' : 'play'}`;
    for (const b of dlg.querySelectorAll('[data-toggle]')) b.classList.toggle('on', !!st[b.dataset.toggle]);
    $('[data-opt="all"]').checked = st.all; $('[data-opt="onion"]').checked = st.onion;
    $('.pxe-body').classList.toggle('all-frames', st.all && n > 1);
  };

  // ── Dessin ──
  const bgColor = () => ({ snow: hex(pal.s), night: hex(pal.b), mid: '#7f8aa3' })[st.bg];
  function render() {
    const d = fimg.data;
    // (en lecture, la grande image joue l'animation, sans pelure d'oignon)
    const shown = playing ? grids[playOrder[pf % playOrder.length]] : grid;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = shown[y * w + x], o = (y * w + x) * 4;
      // (le vide : un damier, pour le voir)
      const v = c ? rgb[c] : (x + y) & 1 ? [154, 166, 189] : [138, 150, 176];
      d[o] = v[0]; d[o + 1] = v[1]; d[o + 2] = v[2]; d[o + 3] = 255;
    }
    fctx.putImageData(fimg, 0, 0);
    view.width = w * st.z; view.height = h * st.z;
    vctx.imageSmoothingEnabled = false;
    vctx.drawImage(flat, 0, 0, view.width, view.height);
    if (st.grid && st.z >= 5) {
      vctx.fillStyle = 'rgba(31,42,68,.14)';
      for (let x = 1; x < w; x++) vctx.fillRect(x * st.z, 0, 1, view.height);
      for (let y = 1; y < h; y++) vctx.fillRect(0, y * st.z, view.width, 1);
    }
    if (st.onion && n > 1 && !playing) {
      // Les images voisines : là où le dessin en cours est vide, leur case est colorée ;
      // là où il est plein, un point (on voit ainsi ce qui bouge, partout)
      const dot = Math.max(2, Math.round(st.z / 3));
      for (let k = st.onionN; k >= 1; k--) {
        for (const [dir, col] of [[-1, ONION.prev], [1, ONION.next]]) {
          const g = grids[(((fi + dir * k) % n) + n) % n];
          if (g === grid) continue;
          vctx.fillStyle = `rgba(${col},${ONION.alpha[k - 1]})`;
          for (let i = 0; i < w * h; i++) {
            if (!g[i]) continue;
            const x = (i % w) * st.z, y = ((i / w) | 0) * st.z;
            if (grid[i]) vctx.fillRect(x + ((st.z - dot) >> 1), y + ((st.z - dot) >> 1), dot, dot);
            else vctx.fillRect(x, y, st.z, st.z);
          }
        }
      }
    }
    renderPreview();
    drawThumbs();
    sync();
  }
  function renderPreview() {
    const g = grids[playing ? playOrder[pf % playOrder.length] : fi];
    const k = Math.max(1, Math.min(6, Math.floor(300 / (w + FRAME_W + 6)), Math.floor(260 / Math.max(h, FRAME_H))));
    const pw = w + FRAME_W + 6, ph = Math.max(h, FRAME_H);
    prevCv.width = pw; prevCv.height = ph;
    prevCv.style.width = `${pw * k}px`; prevCv.style.height = `${ph * k}px`;
    pctx.fillStyle = bgColor(); pctx.fillRect(0, 0, pw, ph);
    pctx.drawImage(viking(pal), 0, ph - FRAME_H);
    const o = pctx.createImageData(w, h), d = o.data;
    for (let i = 0; i < w * h; i++) {
      const c = g[i]; if (!c) continue;
      const v = c === SHADE ? pal.b : rgb[c];
      d[i * 4] = v[0]; d[i * 4 + 1] = v[1]; d[i * 4 + 2] = v[2]; d[i * 4 + 3] = c === SHADE ? 77 : 255;
    }
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h; tmp.getContext('2d').putImageData(o, 0, 0);
    pctx.drawImage(tmp, FRAME_W + 6, ph - h);
  }
  function play(on) {
    clearInterval(timer);
    playing = on; pf = Math.max(0, playOrder.indexOf(fi));
    if (on) timer = setInterval(() => { pf = (pf + 1) % playOrder.length; render(); }, 1000 / pfps);
    render();
  }
  function goto(i) { fi = ((i % n) + n) % n; grid = grids[fi]; if (playing) play(false); else render(); }

  // Une case, sur l'image en cours ou sur toutes (les symétries comprises)
  function set(x, y, c) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    for (const i of st.all ? allIdx : [fi]) {
      const g = grids[i];
      g[y * w + x] = c;
      if (st.mirrorH) g[y * w + (w - 1 - x)] = c;
      if (st.mirrorV) g[(h - 1 - y) * w + x] = c;
      if (st.mirrorH && st.mirrorV) g[(h - 1 - y) * w + (w - 1 - x)] = c;
      dirty.add(i);
    }
  }
  function line(x0, y0, x1, y1, fn) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      fn(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  // Une touche du pinceau : un carré de `size` pixels de côté, centré sur la case
  // (avec la trame : seules les cases de la trame sont peintes)
  function stamp(x, y, c, dither = false) {
    const lo = -Math.floor((st.size - 1) / 2), hi = Math.floor(st.size / 2), level = DENSITIES[st.dens][1];
    for (let dy = lo; dy <= hi; dy++) for (let dx = lo; dx <= hi; dx++) {
      const px = x + dx, py = y + dy;
      if (!dither || BAYER[(py & 3) * 4 + (px & 3)] < level) set(px, py, c);
    }
  }
  function flood(x, y, c) {
    const from = grid[y * w + x];
    if (from === c) return;
    const stack = [[x, y]], seen = new Set();
    while (stack.length) {
      const [px, py] = stack.pop();
      if (px < 0 || py < 0 || px >= w || py >= h || grid[py * w + px] !== from) continue;
      if (seen.has(py * w + px)) continue;
      seen.add(py * w + px);
      set(px, py, c);
      stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
    }
  }
  function shape(kind, a, b, c) {
    const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y), sz = st.size;
    if (kind === 'line') { line(a.x, a.y, b.x, b.y, (x, y) => stamp(x, y, c)); return; }
    if (kind === 'rect') {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (st.fill || x - x0 < sz || x1 - x < sz || y - y0 < sz || y1 - y < sz) set(x, y, c);
      return;
    }
    if (kind === 'gradient') {
      // La trame se dégrade le long du côté le plus long du rectangle : pleine au début du geste, vide à la fin
      const horizontal = x1 - x0 >= y1 - y0, span = Math.max(1, (horizontal ? x1 - x0 : y1 - y0));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const t = horizontal ? (b.x >= a.x ? x - x0 : x1 - x) / span : (b.y >= a.y ? y - y0 : y1 - y) / span;
        if (BAYER[(y & 3) * 4 + (x & 3)] < (1 - t) * 16) set(x, y, c);
      }
      return;
    }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2 + 0.5, ry = (y1 - y0) / 2 + 0.5;
    const inside = (x, y, ax, ay) => ax > 0 && ay > 0 && ((x - cx) / ax) ** 2 + ((y - cy) / ay) ** 2 <= 1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (inside(x, y, rx, ry) && (st.fill || !inside(x, y, rx - sz, ry - sz))) set(x, y, c);
    }
  }
  // Décale le dessin d'un pixel (ce qui sort est perdu), sur l'image en cours ou sur toutes
  function nudge(dx, dy) {
    for (const i of st.all ? allIdx : [fi]) {
      const g = grids[i], out = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const sx = x - dx, sy = y - dy;
        if (sx >= 0 && sy >= 0 && sx < w && sy < h) out[y * w + x] = g[sy * w + sx];
      }
      g.set(out); dirty.add(i);
    }
    snap(); render(); save();
  }

  // ── Historique et enregistrement ──
  function snap() { hist = hist.slice(0, hp + 1); hist.push(snapAll()); if (hist.length > HIST_MAX) hist.shift(); hp = hist.length - 1; }
  // Écrit chaque image modifiée (seulement si elle a vraiment changé)
  function flush(final) {
    for (const i of dirty) {
      const rows = toRows(grids[i]), key = rows.join('|');
      if (key !== lastSaved[i]) { lastSaved[i] = key; onSave(frames[i].name, rows, final); }
    }
    dirty.clear();
  }
  // (rien n'est enregistré tant qu'on n'a pas touché au dessin)
  function save() {
    changed = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { flush(); $('.pxe-saved').textContent = 'Enregistré'; }, 200);
  }
  function undo(delta) {
    const to = hp + delta;
    if (to < 0 || to >= hist.length) return;
    hp = to; restore(hist[hp]);
    allIdx.forEach(i => dirty.add(i));
    render(); save();
  }
  snap();

  // ── Pointeur : souris, doigt, Apple Pencil ──
  // Un doigt dessine ; deux doigts déplacent la vue (le trait commencé est annulé).
  // Aucun menu de sélection ni loupe : on les coupe à la source.
  const cell = e => {
    const r = view.getBoundingClientRect();
    return { x: Math.floor((e.clientX - r.left) / st.z), y: Math.floor((e.clientY - r.top) / st.z) };
  };
  const touches = new Map();
  let panning = null;
  const centroid = () => {
    const t = [...touches.values()];
    return { x: t.reduce((a, p) => a + p.x, 0) / t.length, y: t.reduce((a, p) => a + p.y, 0) / t.length };
  };
  const paintAt = p => {
    if (st.tool === 'pencil' || st.tool === 'eraser' || st.tool === 'dither') {
      line(drag.last.x, drag.last.y, p.x, p.y, (x, y) => stamp(x, y, drag.c, st.tool === 'dither'));
      drag.last = p;
    } else { restore(drag.base); shape(st.tool, drag.start, p, drag.c); }
  };
  stage.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (e.pointerType === 'touch') {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size >= 2) {
        // le deuxième doigt : le trait du premier est annulé, on déplace la vue
        if (drag && !drag.pan) { restore(drag.base); drag = null; render(); }
        const c = centroid();
        panning = { x: c.x, y: c.y, sl: stage.scrollLeft, st: stage.scrollTop };
        return;
      }
    }
    if (e.button === 1 || spaceDown) { drag = { pan: true, x: e.clientX, y: e.clientY, sl: stage.scrollLeft, st: stage.scrollTop }; stage.setPointerCapture(e.pointerId); return; }
    if (e.button > 2) return;
    const p = cell(e);
    const erase = e.button === 2 || st.tool === 'eraser';
    const c = erase ? EMPTY : st.color;
    if (st.tool === 'picker') { if (p.x >= 0 && p.y >= 0 && p.x < w && p.y < h) { st.color = grid[p.y * w + p.x]; st.tool = 'pencil'; render(); } return; }
    stage.setPointerCapture(e.pointerId);
    if (st.tool === 'bucket') { if (p.x >= 0 && p.y >= 0 && p.x < w && p.y < h) { flood(p.x, p.y, c); snap(); render(); save(); } return; }
    drag = { start: p, last: p, base: snapAll(), c };
    if (st.tool === 'pencil' || st.tool === 'eraser' || st.tool === 'dither') { stamp(p.x, p.y, c, st.tool === 'dither'); render(); }
  });
  stage.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' && touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (panning) {
      const c = centroid();
      stage.scrollLeft = panning.sl - (c.x - panning.x); stage.scrollTop = panning.st - (c.y - panning.y);
      return;
    }
    if (!drag) return;
    if (drag.pan) { stage.scrollLeft = drag.sl - (e.clientX - drag.x); stage.scrollTop = drag.st - (e.clientY - drag.y); return; }
    paintAt(cell(e));
    render();
  });
  const end = e => {
    if (e.pointerType === 'touch') { touches.delete(e.pointerId); if (touches.size < 2) panning = null; }
    if (!drag) return;
    const was = drag; drag = null;
    if (was.pan) return;
    snap(); render(); save();
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  // Pas de menu contextuel, de loupe ni de sélection de texte, nulle part dans l'éditeur
  for (const type of ['contextmenu', 'selectstart', 'dragstart', 'gesturestart', 'gesturechange']) dlg.addEventListener(type, e => e.preventDefault());
  stage.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  stage.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  stage.addEventListener('wheel', e => {
    if (!e.ctrlKey) return;
    e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1);
  }, { passive: false });
  const zoom = d => { st.z = Math.max(1, Math.min(32, st.z + d)); render(); };
  // Le plus grand zoom entier qui montre tout le dessin dans la zone de travail
  const fit = () => {
    st.z = Math.max(1, Math.min(32, Math.floor(Math.min((stage.clientWidth - 32) / w, (stage.clientHeight - 32) / h))));
    render();
  };
  const setFps = d => { pfps = Math.max(1, Math.min(24, pfps + d)); if (playing) play(true); else render(); };

  // ── Boutons et clavier ──
  dlg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tool) st.tool = b.dataset.tool;
    else if (b.dataset.color) st.color = +b.dataset.color;
    else if (b.dataset.bg) st.bg = b.dataset.bg;
    else if (b.dataset.frame) return goto(+b.dataset.frame);
    else if (b.dataset.nudge) return nudge(...b.dataset.nudge.split(',').map(Number));
    else if (b.dataset.onion) st.onionN = +b.dataset.onion;
    else if (b.dataset.toggle) st[b.dataset.toggle] = !st[b.dataset.toggle];
    else if (b.dataset.act === 'undo') return undo(-1);
    else if (b.dataset.act === 'redo') return undo(1);
    else if (b.dataset.act === 'zoomin') return zoom(1);
    else if (b.dataset.act === 'zoomout') return zoom(-1);
    else if (b.dataset.act === 'fit') return fit();
    else if (b.dataset.act === 'prevf') return goto(fi - 1);
    else if (b.dataset.act === 'nextf') return goto(fi + 1);
    else if (b.dataset.act === 'play') return play(!playing);
    // (une image de plus ou de moins : on enregistre, puis l'atelier rouvre l'éditeur)
    else if (['add-frame', 'add-blank', 'remove-frame', 'move-left', 'move-right'].includes(b.dataset.act)) {
      const act = b.dataset.act, at = fi, rows = toRows(grid);
      // (retirer une image se confirme : un second clic dans les trois secondes)
      if (act === 'remove-frame' && !b.classList.contains('confirm')) {
        b.classList.add('confirm'); b.innerHTML = '<i class="ti ti-alert-triangle"></i> Retirer vraiment ?';
        setTimeout(() => { b.classList.remove('confirm'); b.innerHTML = '<i class="ti ti-minus"></i> Image'; }, 3000);
        return;
      }
      if (act === 'move-left' && at === 0) return;
      if (act === 'move-right' && at === n - 1) return;
      changed = true; dirty.add(fi);
      dlg.addEventListener('close', () => act === 'add-frame' ? onAddFrame(at, rows) : act === 'add-blank' ? onAddFrame(at, rows, true) : act === 'remove-frame' ? onRemoveFrame(at, rows) : onMoveFrame(at, act === 'move-left' ? -1 : 1, rows), { once: true });
      return dlg.close();
    }
    else if (b.dataset.act === 'slower') return setFps(-1);
    else if (b.dataset.act === 'faster') return setFps(1);
    else if (b.dataset.act === 'smaller') st.size = Math.max(1, st.size - 1);
    else if (b.dataset.act === 'bigger') st.size = Math.min(5, st.size + 1);
    else if (b.dataset.dens) st.dens = +b.dataset.dens;
    else if (b.dataset.act === 'close') return dlg.close();
    else if (b.dataset.act === 'original') {
      const what = st.all && n > 1 ? 'toutes les images' : 'cette image';
      if (!b.classList.toggle('confirm')) {
        for (const i of st.all ? allIdx : [fi]) {
          grids[i].set(toGrid(frames[i].original)); lastSaved[i] = toRows(grids[i]).join('|'); dirty.delete(i);
          onReset(frames[i].name);
        }
        snap(); clearTimeout(saveTimer);
        b.textContent = 'Revenir au dessin d\'origine'; $('.pxe-saved').textContent = `Dessin d'origine rétabli (${what})`;
        render();
        return;
      }
      b.textContent = `Effacer mes retouches (${what}) ?`;
      setTimeout(() => { b.classList.remove('confirm'); b.textContent = 'Revenir au dessin d\'origine'; }, 3000);
      return;
    }
    render();
  });
  for (const inp of dlg.querySelectorAll('[data-opt]')) {
    inp.checked = !!st[inp.dataset.opt];
    inp.addEventListener('change', () => { st[inp.dataset.opt] = inp.checked; render(); });
  }
  const onKey = e => {
    if (!dlg.open) return;
    if (e.code === 'Space') { spaceDown = e.type === 'keydown'; if (e.type === 'keydown') e.preventDefault(); return; }
    if (e.type !== 'keydown') return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); return undo(e.shiftKey ? 1 : -1); }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); return undo(1); }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = TOOLS.find(x => x[2] === k);
    if (t) st.tool = t[0];
    else if (k >= '1' && k <= '5') st.color = [SNOW, NIGHT, RED, EMPTY, SHADE][+k - 1];
    else if (k === '[') st.size = Math.max(1, st.size - 1);
    else if (k === ']') st.size = Math.min(5, st.size + 1);
    else if (k === ',' && n > 1) return goto(fi - 1);
    else if (k === '.' && n > 1) return goto(fi + 1);
    else if (k === 'p' && n > 1) return play(!playing);
    else if (k === 'a' && n > 1) st.all = !st.all;
    else if (k === 'n' && n > 1) st.onion = !st.onion;
    else if (k === '0') return fit();
    else if (k === '+' || k === '=') return zoom(1);
    else if (k === '-') return zoom(-1);
    else if (k === 'x') { st.grid = !st.grid; dlg.querySelector('[data-opt="grid"]').checked = st.grid; }
    else return;
    render();
  };
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);
  dlg.addEventListener('close', () => {
    document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKey);
    document.documentElement.classList.remove('pxe-open');
    clearInterval(timer); clearTimeout(saveTimer);
    if (changed) flush(true);
    onClose(changed);
  }, { once: true });

  document.documentElement.classList.add('pxe-open');      // (la page derrière ne défile plus)
  render();
  dlg.showModal();
  fit();                                                    // (la zone de travail n'a sa taille qu'une fois ouverte)
}
