/* Un petit éditeur de pixels, dans le labo, pour redessiner un élément du décor
   (voir designs.js), inspiré de Pixel Studio : crayon, gomme, pot de peinture,
   ligne, rectangle, ellipse, pipette, symétries, annuler / rétablir, zoom,
   grille. Trois couleurs (neige, bleu nuit, rouge) et le vide. Chaque trait est
   enregistré aussitôt : le jeu, s'il est ouvert dans un autre onglet, se
   redessine tout seul.

   `openPixelEditor({ name, label, original, rows, onSave, onReset })` ouvre
   l'éditeur ; `onSave(rows)` est appelé après chaque trait. */
import { gamePalette } from './designs.js?v=1.38.0';
import { paintSheet, FRAME_W, FRAME_H } from './viking.js?v=1.38.0';

const EMPTY = 0, SNOW = 1, NIGHT = 2, RED = 3;
const CODE = { '.': EMPTY, s: SNOW, b: NIGHT, k: NIGHT, r: RED };
const TOOLS = [
  ['pencil', 'Crayon', 'b', 'pencil'], ['eraser', 'Gomme', 'e', 'eraser'], ['bucket', 'Pot de peinture', 'g', 'bucket'],
  ['line', 'Ligne', 'l', 'line'], ['rect', 'Rectangle', 'r', 'square'], ['ellipse', 'Ellipse', 'o', 'circle'],
  ['picker', 'Pipette', 'i', 'color-picker'],
];
const HIST_MAX = 80;

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
      <button type="button" data-act="undo" title="Annuler (Ctrl+Z)"><i class="ti ti-arrow-back-up"></i></button>
      <button type="button" data-act="redo" title="Rétablir (Ctrl+Y)"><i class="ti ti-arrow-forward-up"></i></button>
      <button type="button" data-act="zoomout" title="Zoom arrière (−)"><i class="ti ti-zoom-out"></i></button>
      <span class="pxe-zoom"></span>
      <button type="button" data-act="zoomin" title="Zoom avant (+)"><i class="ti ti-zoom-in"></i></button>
      <button type="button" data-act="close" class="pxe-close">Fermer</button>
    </div>
    <div class="pxe-body">
      <div class="pxe-tools"></div>
      <div class="pxe-stage"><canvas class="pxe-canvas"></canvas></div>
      <aside class="pxe-side">
        <h4>Couleur</h4>
        <div class="pxe-colors"></div>
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

export function openPixelEditor({ name, label, original, rows, onSave, onReset }) {
  dlg?.remove();
  dlg = build();
  const pal = gamePalette();
  const hex = c => `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
  pal.sHex = hex(pal.s); pal.bHex = hex(pal.b); pal.rHex = hex(pal.r);
  const rgb = [null, pal.s, pal.b, pal.r];
  const night = original.join('').includes('k') ? 'k' : 'b';
  const letter = ['.', 's', night, 'r'];
  const w = rows[0].length, h = rows.length;
  return start();

  function start() {
    const $ = s => dlg.querySelector(s);
    const view = $('.pxe-canvas'), vctx = view.getContext('2d'), stage = $('.pxe-stage');
    const prevCv = $('.pxe-preview canvas'), pctx = prevCv.getContext('2d');
    const flat = document.createElement('canvas'); flat.width = w; flat.height = h;
    const fctx = flat.getContext('2d'), fimg = fctx.createImageData(w, h);
    const toGrid = rs => Uint8Array.from(rs.join('').split('').map(c => CODE[c] ?? EMPTY));
    const toRows = g => Array.from({ length: h }, (_, y) => Array.from(g.subarray(y * w, y * w + w), c => letter[c]).join(''));
    let grid = toGrid(rows), hist = [], hp = -1;
    const st = { tool: 'pencil', color: SNOW, fill: false, mirrorH: false, mirrorV: false, grid: true, bg: 'mid', z: Math.max(2, Math.min(32, Math.floor(Math.min(760 / w, 560 / h)))) };
    let drag = null, saveTimer = 0, changed = false;

    $('.pxe-title').textContent = label;
    $('.pxe-sub').textContent = `${name} · ${w} × ${h} pixels`;

    // ── Outils et couleurs ──
    $('.pxe-tools').innerHTML = TOOLS.map(([id, t, key, icon]) =>
      `<button type="button" data-tool="${id}" title="${t} (${key.toUpperCase()})"><i class="ti ti-${icon}"></i></button>`).join('');
    const swatches = [[SNOW, 'Neige', '1'], [NIGHT, 'Bleu nuit', '2'], [RED, 'Rouge', '3'], [EMPTY, 'Vide (transparent)', '4']];
    $('.pxe-colors').innerHTML = swatches.map(([c, t, key]) =>
      `<button type="button" data-color="${c}" title="${t} (${key})" class="${c ? '' : 'empty'}" ${c ? `style="background:${hex(rgb[c])}"` : ''}></button>`).join('');
    const sync = () => {
      for (const b of dlg.querySelectorAll('[data-tool]')) b.classList.toggle('on', b.dataset.tool === st.tool);
      for (const b of dlg.querySelectorAll('[data-color]')) b.classList.toggle('on', +b.dataset.color === st.color);
      for (const b of dlg.querySelectorAll('[data-bg]')) b.classList.toggle('on', b.dataset.bg === st.bg);
      $('[data-act="undo"]').disabled = hp <= 0; $('[data-act="redo"]').disabled = hp >= hist.length - 1;
      $('.pxe-zoom').textContent = `${st.z}×`;
    };

    // ── Dessin ──
    const bgColor = () => ({ snow: hex(pal.s), night: hex(pal.b), mid: '#7f8aa3' })[st.bg];
    function render() {
      const d = fimg.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const c = grid[y * w + x], o = (y * w + x) * 4;
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
      renderPreview();
      sync();
    }
    function renderPreview() {
      const k = Math.max(1, Math.min(4, Math.floor(300 / (w + FRAME_W + 6)), Math.floor(260 / Math.max(h, FRAME_H))));
      const pw = w + FRAME_W + 6, ph = Math.max(h, FRAME_H);
      prevCv.width = pw; prevCv.height = ph;
      prevCv.style.width = `${pw * k}px`; prevCv.style.height = `${ph * k}px`;
      pctx.fillStyle = bgColor(); pctx.fillRect(0, 0, pw, ph);
      pctx.drawImage(viking(pal), 0, ph - FRAME_H);
      const o = pctx.createImageData(w, h), d = o.data;
      for (let i = 0; i < w * h; i++) { const c = grid[i]; if (!c) continue; d[i * 4] = rgb[c][0]; d[i * 4 + 1] = rgb[c][1]; d[i * 4 + 2] = rgb[c][2]; d[i * 4 + 3] = 255; }
      const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h; tmp.getContext('2d').putImageData(o, 0, 0);
      pctx.drawImage(tmp, FRAME_W + 6, ph - h);
    }

    function set(x, y, c) {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      grid[y * w + x] = c;
      if (st.mirrorH && w - 1 - x >= 0) grid[y * w + (w - 1 - x)] = c;
      if (st.mirrorV) grid[(h - 1 - y) * w + x] = c;
      if (st.mirrorH && st.mirrorV) grid[(h - 1 - y) * w + (w - 1 - x)] = c;
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
    function flood(x, y, c) {
      const from = grid[y * w + x];
      if (from === c) return;
      const stack = [[x, y]];
      while (stack.length) {
        const [px, py] = stack.pop();
        if (px < 0 || py < 0 || px >= w || py >= h || grid[py * w + px] !== from) continue;
        set(px, py, c);
        stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
      }
    }
    function shape(kind, a, b, c) {
      const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
      if (kind === 'line') { line(a.x, a.y, b.x, b.y, (x, y) => set(x, y, c)); return; }
      if (kind === 'rect') {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (st.fill || x === x0 || x === x1 || y === y0 || y === y1) set(x, y, c);
        return;
      }
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2 + 0.5, ry = (y1 - y0) / 2 + 0.5;
      const inside = (x, y, ax, ay) => ax > 0 && ay > 0 && ((x - cx) / ax) ** 2 + ((y - cy) / ay) ** 2 <= 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (inside(x, y, rx, ry) && (st.fill || !inside(x, y, rx - 1, ry - 1))) set(x, y, c);
      }
    }

    // ── Historique et enregistrement ──
    function snap() { hist = hist.slice(0, hp + 1); hist.push(grid.slice()); if (hist.length > HIST_MAX) hist.shift(); hp = hist.length - 1; }
    // (rien n'est enregistré tant qu'on n'a pas touché au dessin)
    function save() {
      changed = true;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { onSave(toRows(grid)); $('.pxe-saved').textContent = 'Enregistré'; }, 200);
    }
    function undo(delta) {
      const n = hp + delta;
      if (n < 0 || n >= hist.length) return;
      hp = n; grid = hist[hp].slice(); render(); save();
    }
    snap();

    // ── Pointeur ──
    const cell = e => {
      const r = view.getBoundingClientRect();
      return { x: Math.floor((e.clientX - r.left) / st.z), y: Math.floor((e.clientY - r.top) / st.z) };
    };
    view.addEventListener('contextmenu', e => e.preventDefault());
    view.addEventListener('pointerdown', e => {
      if (e.button === 1 || spaceDown) { drag = { pan: true, x: e.clientX, y: e.clientY, sl: stage.scrollLeft, st: stage.scrollTop }; view.setPointerCapture(e.pointerId); return; }
      if (e.button > 2) return;
      const p = cell(e);
      const erase = e.button === 2 || st.tool === 'eraser';
      const c = erase ? EMPTY : st.color;
      if (st.tool === 'picker') { if (p.x >= 0 && p.y >= 0 && p.x < w && p.y < h) { st.color = grid[p.y * w + p.x]; if (st.tool === 'picker') st.tool = 'pencil'; render(); } return; }
      view.setPointerCapture(e.pointerId);
      if (st.tool === 'bucket') { if (p.x >= 0 && p.y >= 0 && p.x < w && p.y < h) { flood(p.x, p.y, c); snap(); render(); save(); } return; }
      drag = { start: p, last: p, base: grid.slice(), c };
      if (st.tool === 'pencil' || st.tool === 'eraser') { set(p.x, p.y, c); render(); }
    });
    view.addEventListener('pointermove', e => {
      if (!drag) return;
      if (drag.pan) { stage.scrollLeft = drag.sl - (e.clientX - drag.x); stage.scrollTop = drag.st - (e.clientY - drag.y); return; }
      const p = cell(e);
      if (st.tool === 'pencil' || st.tool === 'eraser') { line(drag.last.x, drag.last.y, p.x, p.y, (x, y) => set(x, y, drag.c)); drag.last = p; }
      else { grid = drag.base.slice(); shape(st.tool, drag.start, p, drag.c); }
      render();
    });
    const end = e => {
      if (!drag) return;
      const was = drag; drag = null;
      if (was.pan) return;
      snap(); render(); save();
    };
    view.addEventListener('pointerup', end);
    view.addEventListener('pointercancel', end);
    stage.addEventListener('wheel', e => {
      if (!e.ctrlKey) return;
      e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1);
    }, { passive: false });
    const zoom = d => { st.z = Math.max(1, Math.min(32, st.z + d)); render(); };

    // ── Boutons et clavier ──
    let spaceDown = false;
    dlg.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tool) st.tool = b.dataset.tool;
      else if (b.dataset.color) st.color = +b.dataset.color;
      else if (b.dataset.bg) st.bg = b.dataset.bg;
      else if (b.dataset.act === 'undo') return undo(-1);
      else if (b.dataset.act === 'redo') return undo(1);
      else if (b.dataset.act === 'zoomin') return zoom(1);
      else if (b.dataset.act === 'zoomout') return zoom(-1);
      else if (b.dataset.act === 'close') return dlg.close();
      else if (b.dataset.act === 'original') {
        if (!b.classList.toggle('confirm')) {
          grid = toGrid(original); snap(); render();
          clearTimeout(saveTimer); changed = false; onReset();
          b.textContent = 'Revenir au dessin d\'origine'; $('.pxe-saved').textContent = 'Dessin d\'origine rétabli';
          return;
        }
        b.textContent = 'Effacer mes retouches ?';
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
      else if (k >= '1' && k <= '4') st.color = [SNOW, NIGHT, RED, EMPTY][+k - 1];
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
      clearTimeout(saveTimer);
      if (changed) onSave(toRows(grid), true);
    }, { once: true });

    render();
    dlg.showModal();
  }
}
