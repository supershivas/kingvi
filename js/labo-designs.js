/* Labo, onglet Dessins : redessiner à la main les éléments uniques du décor
   (voir designs.js) dans l'éditeur de pixels intégré (pixel-editor.js) : chaque
   trait est enregistré, et le jeu, s'il est ouvert dans un autre onglet, se
   redessine tout seul. Les PNG 1 × 1 à télécharger / importer restent là pour
   qui préfère un autre éditeur. Arbres et rochers restent générés. */
import { DESIGNS, designRows, designSource, designsToText, rowsToPng, importDesign, setLocalDesign, applyLocal, loadDesigns } from './designs.js?v=1.38.0';
import { openPixelEditor } from './pixel-editor.js?v=1.38.0';

const host = document.querySelector('#dessins .demos');
const cards = new Map();

function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

const SOURCES = {
  local: 'Retouché ici : visible dans le jeu de ce navigateur ; « Copier mes modifications » pour le publier.',
  depot: 'Fichier du dépôt (assets/design) : visible par tout le monde.',
  none: 'Dessin d\'origine, fait par le code.',
};

// ── Mode d'emploi ──
const intro = document.createElement('article');
intro.className = 'demo wide';
intro.innerHTML = `
  <h3><span class="tag">Mode d'emploi</span><span>Redessiner le décor</span></h3>
  <ol class="design-steps">
    <li><b>Dessiner</b> : choisissez un élément ci-dessous. L'éditeur s'ouvre (crayon, gomme, pot de peinture, formes, symétries, annuler, zoom) avec trois couleurs et le vide. Un viking à côté donne l'échelle.</li>
    <li><b>Voir dans le jeu</b> : chaque trait est enregistré aussitôt. Ouvrez le jeu dans un autre onglet <em>du même navigateur</em> : il se redessine tout seul pendant que vous dessinez (ou à son prochain lancement).</li>
    <li><b>Publier</b> pour tous les appareils : « Copier mes modifications », puis collez le texte à Claude dans la conversation, qui les ajoute au jeu.</li>
  </ol>
  <p>La taille d'un élément ne change pas (la porte, les obstacles et les positions en dépendent). Les arbres et les rochers restent générés par le code.</p>
  <div class="design-actions">
    <button type="button" class="design-btn primary" data-copy>Copier mes modifications</button>
    <span class="design-note" role="status"></span>
  </div>
  <details class="design-files">
    <summary>Préférer un autre éditeur ? PNG à télécharger et importer</summary>
    <p>Chaque élément se télécharge en PNG 1 × 1 (un pixel du fichier = un pixel du jeu) et se réimporte ; plusieurs PNG d'un coup, nommés comme l'élément (<code>house.png</code>…). Pour publier ces PNG : dépôt <code>supershivas/kingvi</code> sur GitHub, dossier <code>assets/design</code>, « Add file » puis « Upload files ».</p>
    <div class="design-actions">
      <label class="design-btn">Importer plusieurs PNG<input type="file" accept="image/png" multiple hidden></label>
      <button type="button" class="design-btn" data-all>Tout télécharger</button>
    </div>
  </details>`;
host.append(intro);
const note = intro.querySelector('.design-note');
intro.querySelector('[data-copy]').addEventListener('click', async () => {
  const text = designsToText();
  if (!text) { note.textContent = 'Rien à copier : aucun dessin retouché.'; return; }
  try { await navigator.clipboard.writeText(text); note.textContent = `Copié (${text.split('\n').length - 1} dessin${text.includes('\n', text.indexOf('\n') + 1) ? 's' : ''}) : collez-le dans la conversation.`; }
  catch {
    const box = document.createElement('textarea');
    box.value = text; box.readOnly = true; box.className = 'design-paste';
    note.replaceChildren('Sélectionnez et copiez ce texte, puis collez-le dans la conversation :', box);
    box.select();
  }
});

intro.querySelector('input').addEventListener('change', async e => {
  const lines = [];
  for (const file of e.target.files) {
    const name = file.name.replace(/\.png$/i, '');
    lines.push(`${name} : ${await take(name, await file.arrayBuffer())}`);
  }
  e.target.value = '';
  note.textContent = lines.join(' · ');
});
intro.querySelector('[data-all]').addEventListener('click', async () => {
  for (const d of DESIGNS) { download(d.name, await rowsToPng(designRows(d.name, d.rows))); await new Promise(r => setTimeout(r, 180)); }
});

// Un fichier importé : vérifié, gardé, l'aperçu rafraîchi. Rend un texte pour l'utilisateur.
async function take(name, buffer) {
  const out = await importDesign(name, buffer);
  if (out.error) return out.error;
  if (!setLocalDesign(name, out.rows)) return 'Le navigateur n\'a plus de place pour le garder.';
  applyLocal(name, out.rows);
  refresh(name);
  return out.off ? `importé (${out.off} pixels d'une autre couleur ramenés aux trois du jeu)` : 'importé';
}

// ── Un élément ──
for (const d of DESIGNS) {
  const el = document.createElement('article');
  el.className = 'demo design-card';
  el.innerHTML = `
    <h3><span class="tag">${d.name}</span><span></span></h3>
    <div class="design-view"><canvas></canvas></div>
    <p class="design-size">${d.w} × ${d.h} pixels</p>
    <p class="design-src"></p>
    <div class="design-actions">
      <button type="button" class="design-btn primary" data-draw>Dessiner</button>
      <button type="button" class="design-btn" data-dl title="PNG 1 × 1">Télécharger</button>
      <label class="design-btn" title="PNG 1 × 1">Importer<input type="file" accept="image/png" hidden></label>
      <button type="button" class="design-btn quiet" data-reset hidden>Retirer mes retouches</button>
    </div>
    <p class="design-note" role="status"></p>`;
  el.querySelector('h3 span:last-child').textContent = d.label;
  host.append(el);
  cards.set(d.name, el);
  el.querySelector('[data-draw]').addEventListener('click', () => openPixelEditor({
    name: d.name, label: d.label, original: d.rows, rows: designRows(d.name, d.rows),
    // chaque trait : gardé ici, et le jeu ouvert ailleurs se redessine (événement « storage »)
    onSave: (rows, done) => { setLocalDesign(d.name, rows); applyLocal(d.name, rows); refresh(d.name); },
    onReset: async () => { setLocalDesign(d.name, null); applyLocal(d.name, null); await loadDesigns(); refresh(d.name); },
  }));
  el.querySelector('[data-dl]').addEventListener('click', async () => download(d.name, await rowsToPng(designRows(d.name, d.rows))));
  el.querySelector('input').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) el.querySelector('.design-note').textContent = await take(d.name, await f.arrayBuffer());
  });
  el.querySelector('[data-reset]').addEventListener('click', async () => {
    setLocalDesign(d.name, null);
    applyLocal(d.name, null);
    await loadDesigns();                     // (le fichier du dépôt, s'il y en a un, revient)
    refresh(d.name);
    el.querySelector('.design-note').textContent = 'Retouches retirées.';
  });
  refresh(d.name);
}

function refresh(name) {
  const d = DESIGNS.find(x => x.name === name), el = cards.get(name), rows = designRows(name, d.rows);
  const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
  cv.width = d.w; cv.height = d.h;
  const col = { s: '#dfe6ee', b: '#1f2a44', k: '#1f2a44', r: '#c0392b' };
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (col[ch]) { ctx.fillStyle = col[ch]; ctx.fillRect(x, y, 1, 1); } }));
  // (l'aperçu est agrandi en entiers, sans lissage, de façon à tenir dans la carte)
  const k = Math.max(1, Math.min(6, Math.floor(340 / d.w), Math.floor(300 / d.h)));
  cv.style.width = `${d.w * k}px`; cv.style.height = `${d.h * k}px`;
  const src = designSource(name);
  el.querySelector('.design-src').textContent = SOURCES[src || 'none'];
  el.querySelector('[data-reset]').hidden = src !== 'local';
}

// Ce qui était déjà redessiné au chargement de la page
loadDesigns().then(() => { for (const d of DESIGNS) refresh(d.name); });
