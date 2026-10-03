/* Labo, onglet Dessins : redessiner à la main le décor, les ruines et les
   arches, les poses du viking, de sa cape, du loup, des cerfs et des biches
   (voir designs.js) dans l'éditeur de pixels intégré (pixel-editor.js). Chaque
   trait est enregistré ; le jeu, s'il est ouvert dans un autre onglet, se
   redessine tout seul. Arbres et rochers restent générés. */
import {
  DESIGNS, GROUPS, SEQUENCES, designRows, designSource, designsToText, rowsToPng, importDesign,
  setLocalDesign, applyLocal, loadDesigns, originalRows, refreshLocal,
} from './designs.js?v=1.42.1';
import { openPixelEditor } from './pixel-editor.js?v=1.42.1';
import { publish, pending, getToken, setToken, TOKEN_URL, REPO } from './designs-publish.js?v=1.42.1';

const host = document.querySelector('#dessins .demos');
const cells = new Map();
const rowsOf = name => designRows(name, originalRows(name));
const COL = { s: '#dfe6ee', b: '#1f2a44', k: '#1f2a44', r: '#c0392b', h: 'rgba(31,42,68,.3)' };

function paint(ctx, rows, x0 = 0, y0 = 0) {
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (COL[ch]) { ctx.fillStyle = COL[ch]; ctx.fillRect(x0 + x, y0 + y, 1, 1); } }));
}
function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ── Mode d'emploi ──
const intro = document.createElement('article');
intro.className = 'demo wide';
intro.innerHTML = `
  <h3><span class="tag">Mode d'emploi</span><span>Redessiner le jeu</span></h3>
  <ol class="design-steps">
    <li><b>Dessiner</b> : ouvrez un groupe ci-dessous (décor, ruines et arches, poses du viking, de sa cape, du loup, des cerfs et des biches), puis « Dessiner » sur une image. L'éditeur s'ouvre en plein écran (crayon, gomme, pot de peinture, formes, trame, taille de 1 à 5, symétries, annuler, zoom). Un viking à côté donne l'échelle. Pour une animation (une marche, un galop, un coup), il s'ouvre avec toutes ses images : la pelure d'oignon montre les voisines, « Modifier toutes les images ensemble » fait chaque trait partout à la fois, et la lecture la fait tourner.</li>
    <li><b>Voir</b> : chaque trait est enregistré aussitôt, et les animations de chaque groupe tournent avec vos dessins. Ouvrez le jeu dans un autre onglet <em>du même navigateur</em> : l'élément, le viking, sa cape et le loup se repeignent tout seuls ; le reste (ruines, arches, cerfs) au prochain lancement.</li>
    <li><b>Publier pour tous</b> : le bouton ci-dessous écrit vos dessins dans le dépôt du jeu ; une à dix minutes plus tard, ils sont dans le jeu sur tous les appareils (la première fois, il demande une clé GitHub : le guide s'affiche).</li>
  </ol>
  <p>La taille d'une image ne change pas (la porte, les obstacles, les positions et les animations en dépendent). Les arbres, les rochers et les statues restent générés par le code.</p>
  <div class="design-actions">
    <button type="button" class="design-btn primary" data-publish>Publier pour tous</button>
    <button type="button" class="design-btn" data-key>Clé GitHub…</button>
    <label class="design-auto"><input type="checkbox" data-auto> Publier automatiquement à la fermeture de l'éditeur</label>
    <button type="button" class="design-btn" data-copy title="Pour les envoyer à Claude">Copier mes modifications</button>
    <span class="design-note" role="status"></span>
  </div>
  <div class="design-token" hidden>
    <p><b>Une clé GitHub, une seule fois.</b> Elle autorise ce labo à écrire dans le dépôt du jeu, et rien d'autre. Elle reste dans ce navigateur et ne part que vers GitHub.</p>
    <ol class="design-steps">
      <li>Ouvrez <a href="${TOKEN_URL}" target="_blank" rel="noopener">la page de création d'un jeton GitHub</a> (connectez-vous si besoin).</li>
      <li><b>Token name</b> : « kingvi dessins ». <b>Expiration</b> : un an. <b>Repository access</b> : « Only select repositories », puis <code>${REPO}</code>.</li>
      <li><b>Permissions</b> → « Repository permissions » → <b>Contents</b> : « Read and write ». Rien d'autre.</li>
      <li>« Generate token », copiez le texte qui commence par <code>github_pat_</code> et collez-le ici :</li>
    </ol>
    <div class="design-actions">
      <input type="password" class="design-input" placeholder="github_pat_…" autocomplete="off" spellcheck="false">
      <button type="button" class="design-btn primary" data-save-token>Enregistrer la clé et publier</button>
    </div>
  </div>
  <p class="design-status" role="status"></p>
  <p class="design-keyinfo" hidden>Clé GitHub enregistrée dans ce navigateur. <button type="button" class="design-link" data-forget>L'oublier</button></p>
  <details class="design-files">
    <summary>Préférer un autre éditeur ? PNG à télécharger et importer</summary>
    <p>Chaque image se télécharge en PNG 1 × 1 (un pixel du fichier = un pixel du jeu) et se réimporte ; plusieurs PNG d'un coup, nommés comme l'image (<code>house.png</code>…). Une fois importés, « Publier pour tous » les envoie dans le jeu.</p>
    <div class="design-actions">
      <label class="design-btn">Importer plusieurs PNG<input type="file" accept="image/png" multiple hidden></label>
    </div>
  </details>`;
host.append(intro);
const note = intro.querySelector('.design-note');
const tokenBox = intro.querySelector('.design-token'), keyInfo = intro.querySelector('.design-keyinfo');
const syncKey = () => { keyInfo.hidden = !getToken(); status(); };
// Où en sont les dessins : ce que le dépôt publie (donc tous les appareils), ce qui n'est que ici
function status() {
  const src = DESIGNS.map(d => designSource(d.name));
  const unpub = pending().length, pub = src.filter(s => s === 'depot').length + src.filter(s => s === 'local').length - unpub;
  const el = intro.querySelector('.design-status');
  el.textContent =
    `Publiés dans le jeu (visibles partout) : ${pub} · Retouchés ici, PAS ENCORE publiés : ${unpub}${unpub ? ' (invisibles sur les autres appareils : « Publier pour tous »)' : ''} · ` +
    (getToken() ? 'Clé GitHub enregistrée sur cet appareil.' : 'Pas de clé GitHub sur cet appareil (inutile pour voir, nécessaire pour publier).');
  el.classList.toggle('warn', unpub > 0);
}
// Publier tout seul à la fermeture de l'éditeur (réglage de cet appareil, désactivé par défaut)
const AUTO_KEY = 'kingvi:autopublish';
const autoBox = intro.querySelector('[data-auto]');
try { autoBox.checked = localStorage.getItem(AUTO_KEY) === '1'; } catch { /* rien */ }
autoBox.addEventListener('change', () => {
  try { localStorage.setItem(AUTO_KEY, autoBox.checked ? '1' : '0'); } catch { /* rien */ }
  if (autoBox.checked && !getToken()) showToken();
});
const afterEditing = () => {
  status();
  if (autoBox.checked && pending().length) { if (getToken()) runPublish(); else showToken(); }
};
syncKey();
async function runPublish() {
  const n = pending().length;
  if (!n) { note.textContent = 'Rien à publier : aucun dessin retouché dans ce navigateur.'; return; }
  const btn = intro.querySelector('[data-publish]');
  btn.disabled = true;
  try {
    const done = await publish(t => { note.textContent = t; });
    note.textContent = `Publié : ${done} dessin${done > 1 ? 's' : ''}. Dans le jeu sur tous les appareils d'ici une à dix minutes (le temps que GitHub republie le site) ; rechargez la page sur l'autre appareil.`;
  } catch (e) {
    note.textContent = e.message;
    if (/jeton|Jeton/.test(e.message)) { setToken(''); syncKey(); tokenBox.hidden = false; }
  } finally { btn.disabled = false; status(); }
}
// La clé d'abord (même sans rien à publier : sur un autre appareil, on la colle avant de dessiner)
const showToken = () => { tokenBox.hidden = false; tokenBox.scrollIntoView({ block: 'nearest' }); tokenBox.querySelector('input').focus(); };
intro.querySelector('[data-publish]').addEventListener('click', () => {
  if (!getToken()) { showToken(); return; }
  runPublish();
});
intro.querySelector('[data-key]').addEventListener('click', showToken);
intro.querySelector('[data-save-token]').addEventListener('click', () => {
  const input = tokenBox.querySelector('input');
  if (!/^(github_pat_|ghp_)/.test(input.value.trim())) { note.textContent = 'Cette clé ne ressemble pas à un jeton GitHub (elle commence par github_pat_).'; return; }
  setToken(input.value); input.value = ''; tokenBox.hidden = true; syncKey();
  if (pending().length) runPublish(); else note.textContent = 'Clé enregistrée sur cet appareil. Dessinez, puis « Publier pour tous ».';
});
intro.querySelector('[data-forget]').addEventListener('click', () => { setToken(''); syncKey(); note.textContent = 'Clé oubliée.'; });
intro.querySelector('[data-copy]').addEventListener('click', async () => {
  const text = designsToText();
  if (!text) { note.textContent = 'Rien à copier : aucun dessin retouché.'; return; }
  const n = text.split('\n').length - 1;
  try { await navigator.clipboard.writeText(text); note.textContent = `Copié (${n} dessin${n > 1 ? 's' : ''}) : collez-le dans la conversation.`; }
  catch {
    const box = document.createElement('textarea');
    box.value = text; box.readOnly = true; box.className = 'design-paste';
    note.replaceChildren('Sélectionnez et copiez ce texte, puis collez-le dans la conversation :', box);
    box.select();
  }
});
intro.querySelector('input[type=file]').addEventListener('change', async e => {
  const lines = [];
  for (const file of e.target.files) {
    const name = file.name.replace(/\.png$/i, '');
    lines.push(`${name} : ${await take(name, await file.arrayBuffer())}`);
  }
  e.target.value = '';
  note.textContent = lines.join(' · ');
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

// ── Les groupes ──
const timers = [];
for (const g of GROUPS) {
  const el = document.createElement('article');
  el.className = 'demo wide design-group';
  el.innerHTML = `<details><summary><span class="tag"></span><b></b></summary><p class="design-about"></p><div class="design-anims"></div><div class="design-grid"></div></details>`;
  el.querySelector('.tag').textContent = `${DESIGNS.filter(d => d.group === g.id).length} images`;
  el.querySelector('b').textContent = g.title;
  el.querySelector('.design-about').textContent = g.about;
  host.append(el);
  const grid = el.querySelector('.design-grid');
  for (const d of DESIGNS.filter(x => x.group === g.id)) grid.append(cell(d, g.id));
  for (const seq of SEQUENCES[g.id] || []) el.querySelector('.design-anims').append(animation(seq));
  // (les animations ne tournent que dans un groupe ouvert)
  el.querySelector('details').addEventListener('toggle', e => {
    for (const a of el.querySelectorAll('.design-anim')) a.run(e.target.open);
  });
}
// Le premier groupe est ouvert
host.querySelector('.design-group details').open = true;

function cell(d, group) {
  const el = document.createElement('div');
  el.className = 'design-cell';
  el.innerHTML = `
    <div class="design-view"><canvas></canvas></div>
    <b class="design-label"></b>
    <span class="design-meta"><code>${d.name}</code> · ${d.w} × ${d.h}</span>
    <span class="design-src"></span>
    <div class="design-actions">
      <button type="button" class="design-btn primary" data-draw>Dessiner</button>
      <details class="design-more"><summary title="Fichier PNG">PNG</summary>
        <button type="button" class="design-btn" data-dl>Télécharger</button>
        <label class="design-btn">Importer<input type="file" accept="image/png" hidden></label>
        <button type="button" class="design-btn quiet" data-reset hidden>Retirer mes retouches</button>
      </details>
    </div>
    <span class="design-note" role="status"></span>`;
  el.querySelector('.design-label').textContent = d.label;
  cells.set(d.name, el);
  const say = t => { el.querySelector('.design-note').textContent = t; };
  el.querySelector('[data-draw]').addEventListener('click', () => {
    // Une animation s'ouvre avec toutes ses images : pelure d'oignon, modification d'ensemble, lecture
    const seq = (SEQUENCES[group] || []).find(sq => sq.names.includes(d.name));
    const names = seq ? [...new Set(seq.names)] : [d.name];
    openPixelEditor({
      frames: names.map(nm => ({ name: nm, label: DESIGNS.find(x => x.name === nm).label, original: originalRows(nm), rows: rowsOf(nm) })),
      index: names.indexOf(d.name),
      order: seq ? seq.names.map(nm => names.indexOf(nm)) : null,
      fps: seq?.fps || 8,
      // chaque trait : gardé ici, et le jeu ouvert ailleurs se redessine (événement « storage »)
      onSave: (name, rows) => { setLocalDesign(name, rows); applyLocal(name, rows); refresh(name); },
      onReset: async name => { setLocalDesign(name, null); applyLocal(name, null); await loadDesigns(); refresh(name); },
      onClose: afterEditing,
    });
  });
  el.querySelector('[data-dl]').addEventListener('click', async () => download(d.name, await rowsToPng(rowsOf(d.name))));
  el.querySelector('input').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) say(await take(d.name, await f.arrayBuffer()));
  });
  el.querySelector('[data-reset]').addEventListener('click', async () => {
    setLocalDesign(d.name, null); applyLocal(d.name, null);
    await loadDesigns();                     // (le fichier du dépôt, s'il y en a un, revient)
    refresh(d.name); say('Retouches retirées.');
  });
  refresh(d.name, el);
  return el;
}

function refresh(name, el = cells.get(name)) {
  const d = DESIGNS.find(x => x.name === name), rows = rowsOf(name);
  const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
  cv.width = d.w; cv.height = d.h;
  paint(ctx, rows);
  // (l'aperçu est agrandi en entiers, sans lissage, de façon à tenir dans la cellule)
  const k = Math.max(1, Math.min(8, Math.floor(180 / d.w), Math.floor(150 / d.h)));
  cv.style.width = `${d.w * k}px`; cv.style.height = `${d.h * k}px`;
  const src = designSource(name);
  el.querySelector('.design-src').textContent = src === 'local' ? 'Retouché ici' : src === 'depot' ? 'Publié dans le jeu' : '';
  el.classList.toggle('mine', src === 'local');
  if (typeof status === 'function' && intro.isConnected) status();
  el.querySelector('[data-reset]').hidden = src !== 'local';
}

// Une animation qui tourne avec les dessins du moment
function animation(seq) {
  const el = document.createElement('figure');
  el.className = 'design-anim';
  const first = DESIGNS.find(x => x.name === seq.names[0]);
  const cv = document.createElement('canvas'); cv.width = first.w; cv.height = first.h;
  const k = Math.max(1, Math.min(6, Math.floor(130 / first.w), Math.floor(110 / first.h)));
  cv.style.width = `${first.w * k}px`; cv.style.height = `${first.h * k}px`;
  const cap = document.createElement('figcaption'); cap.textContent = seq.label;
  el.append(cv, cap);
  const ctx = cv.getContext('2d');
  let t = null, i = 0;
  el.run = on => {
    clearInterval(t);
    if (!on) return;
    t = setInterval(() => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      paint(ctx, rowsOf(seq.names[i++ % seq.names.length]));
    }, 1000 / seq.fps);
  };
  return el;
}

// Un autre onglet a changé des retouches : mettre les aperçus à jour
window.addEventListener('storage', e => {
  if (e.key !== 'kingvi:designs') return;
  for (const name of refreshLocal()) if (cells.has(name)) refresh(name);
});
// Ce qui était déjà redessiné au chargement de la page
loadDesigns().then(() => { for (const d of DESIGNS) refresh(d.name); });
