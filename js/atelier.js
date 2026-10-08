/* L'atelier (atelier.html, v1.58.0) : une page à part, hors du labo. Le labo
   montre et compare ; l'atelier modifie le jeu. Redessiner à la main le décor, les reliques,
   les ruines et arches, les poses du viking, de sa cape, du loup, des cerfs et
   des biches (voir designs.js), ou créer un nouvel asset de la taille voulue,
   dans l'éditeur de pixels intégré (pixel-editor.js). Chaque trait est
   enregistré ; le jeu, s'il est ouvert dans un autre onglet, se redessine tout
   seul. Arbres et rochers restent générés.

   Mise en page : à gauche, l'asset choisi ; à droite, tous les assets rangés
   en dossiers. Le texte d'explication n'est que dans l'aide (bouton « ? »). */
import {
  DESIGNS, GROUPS, SEQUENCES, CUSTOM_KINDS, designRows, designSource, designsToText, rowsToPng, importDesign,
  setLocalDesign, applyLocal, loadDesigns, originalRows, refreshLocal, syncCustom, addCustom, removeCustom, customOf,
  setCustomFrames, customNames, setDesignFrames, growDesign, fixedFrames,
} from './designs.js?v=1.70.2';
import { openPixelEditor } from './pixel-editor.js?v=1.70.2';
import { publish, getToken, setToken, TOKEN_URL, REPO } from './designs-publish.js?v=1.70.2';
import { mountMap } from './atelier-map.js?v=1.70.2';
import { mountTuning } from './atelier-tuning.js?v=1.70.2';
import { mountTexts } from './atelier-texts.js?v=1.70.2';
import { readOld, restoreOld, padRows, setExtra, readExtras, extrasDepotGet, propsOf } from './design-store.js?v=1.70.2';
import { mountChanges, listChanges } from './atelier-changes.js?v=1.70.2';

const host = document.getElementById('atelier-host');
const rowsOf = name => designRows(name, originalRows(name));
const COL = { s: '#dfe6ee', b: '#1f2a44', k: '#1f2a44', r: '#c0392b', h: 'rgba(31,42,68,.3)' };
const byName = name => DESIGNS.find(d => d.name === name);

// (en une image : la falaise entière fait deux cent mille pixels)
const RGBA = { s: [223, 230, 238, 255], b: [31, 42, 68, 255], k: [31, 42, 68, 255], r: [192, 57, 43, 255], h: [31, 42, 68, 77] };
function paint(ctx, rows) {
  const w = rows[0]?.length || 0, h = rows.length;
  if (!w) return;
  const img = ctx.createImageData(w, h), d = img.data;
  rows.forEach((row, y) => { for (let x = 0; x < w; x++) { const c = RGBA[row[x]]; if (c) d.set(c, (y * w + x) * 4); } });
  const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
  tmp.getContext('2d').putImageData(img, 0, 0);
  ctx.drawImage(tmp, 0, 0);
}
function drawTo(cv, d, rows, k) {
  cv.width = d.w; cv.height = d.h;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, d.w, d.h);
  paint(ctx, rows);
  cv.style.width = `${d.w * k}px`; cv.style.height = `${d.h * k}px`;
}
function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ── La page ──
host.innerHTML = `
<div class="dz">
  <div class="dz-bar">
    <button type="button" class="design-btn dz-open-tree" data-tree aria-label="Les dessins"><i class="ti ti-folders" aria-hidden="true"></i> Les dessins</button>
    <button type="button" class="design-btn" data-new><i class="ti ti-plus" aria-hidden="true"></i> Nouvel asset</button>
    <span class="dz-spacer"></span>
    <details class="dz-menu">
      <summary class="design-btn" aria-label="Plus d'actions"><i class="ti ti-dots" aria-hidden="true"></i></summary>
      <div class="dz-menu-list">
        <label class="design-auto"><input type="checkbox" data-auto> Publier à la fermeture de l'éditeur</label>
        <button type="button" class="design-btn" data-key>Clé GitHub…</button>
        <button type="button" class="design-btn quiet" data-forget hidden>Oublier la clé</button>
        <button type="button" class="design-btn" data-copy>Copier mes modifications</button>
        <button type="button" class="design-btn" data-old hidden></button>
        <label class="design-btn">Importer plusieurs PNG<input type="file" accept="image/png" multiple hidden></label>
      </div>
    </details>
    <button type="button" class="design-btn" data-help aria-label="Aide"><i class="ti ti-help" aria-hidden="true"></i></button>
  </div>
  <p class="design-note" role="status"></p>
  <div class="dz-body">
    <aside class="dz-tree" aria-label="Les dessins">
      <div class="dz-tree-head"><b>Les dessins</b><button type="button" class="design-btn quiet" data-tree-close aria-label="Fermer la liste"><i class="ti ti-x" aria-hidden="true"></i></button></div>
      <input type="search" class="design-input dz-search" name="filtre-dessins" placeholder="Chercher…" aria-label="Chercher un asset" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore data-form-type="other">
      <div class="dz-recent" hidden><span class="dz-recent-title">Derniers ouverts</span><div class="dz-recent-list"></div></div>
      <div class="dz-folders"></div>
    </aside>
    <div class="dz-scrim" data-tree-close aria-hidden="true"></div>
    <section class="dz-main" aria-live="polite"></section>
  </div>
</div>

<dialog class="dz-dialog" data-help-dialog>
  <div class="dz-dialog-box">
    <div class="dz-dialog-head"><h3>Aide de l'atelier</h3><button type="button" class="design-btn" data-close aria-label="Fermer"><i class="ti ti-x" aria-hidden="true"></i></button></div>
    <ol class="design-steps">
      <li><b>Dessiner</b> : choisissez un asset dans la colonne de droite, puis « Dessiner ». L'éditeur s'ouvre en plein écran (crayon, gomme, pot de peinture, formes, trame, taille de 1 à 5, symétries, annuler, zoom). Un viking à côté donne l'échelle. Pour une animation, il s'ouvre avec toutes ses images : la pelure d'oignon montre les voisines, « Modifier toutes les images ensemble » fait chaque trait partout à la fois, et la lecture la fait tourner.</li>
      <li><b>Voir</b> : chaque trait est enregistré aussitôt. Ouvrez le jeu dans un autre onglet <em>du même navigateur</em> : l'élément, les reliques, le viking, sa cape et le loup se repeignent tout seuls ; le reste (ruines, arches, cerfs) au prochain lancement.</li>
      <li><b>Publier pour tous</b> : écrit vos dessins dans le dépôt du jeu ; une à dix minutes plus tard, ils sont dans le jeu sur tous les appareils.</li>
      <li><b>Nouvel asset</b> : un nom, un type (décor, animation, relique, autre) et une taille au choix ; une animation a plusieurs images. Il est rangé dans « Mes … » et publié avec le reste.</li>
    </ol>
    <p>La taille d'une image du jeu ne change pas (les positions, les obstacles et les animations en dépendent). Les arbres, les rochers et les statues restent générés par le code. Les dossiers :</p>
    <ul class="design-steps" data-folders></ul>
    <h4>Clé GitHub, une seule fois</h4>
    <p>Elle autorise ce labo à écrire dans le dépôt du jeu, et rien d'autre. Elle reste dans ce navigateur et ne part que vers GitHub.</p>
    <ol class="design-steps">
      <li>Ouvrez <a href="${TOKEN_URL}" target="_blank" rel="noopener">la page de création d'un jeton GitHub</a>.</li>
      <li><b>Token name</b> : « kingvi dessins ». <b>Expiration</b> : un an. <b>Repository access</b> : « Only select repositories », puis <code>${REPO}</code>.</li>
      <li><b>Permissions</b> → <b>Contents</b> : « Read and write ». Rien d'autre.</li>
      <li>« Generate token », copiez le texte qui commence par <code>github_pat_</code> et collez-le dans « Clé GitHub… ».</li>
    </ol>
    <p>Autre éditeur : chaque image se télécharge en PNG 1 × 1 (un pixel du fichier = un pixel du jeu) et se réimporte (« Importer plusieurs PNG » : fichiers nommés comme l'image).</p>
  </div>
</dialog>

<dialog class="dz-dialog" data-key-dialog>
  <div class="dz-dialog-box">
    <div class="dz-dialog-head"><h3>Clé GitHub</h3><button type="button" class="design-btn" data-close aria-label="Fermer"><i class="ti ti-x" aria-hidden="true"></i></button></div>
    <input type="password" class="design-input" placeholder="github_pat_…" autocomplete="off" spellcheck="false">
    <div class="design-actions">
      <button type="button" class="design-btn primary" data-save-token>Enregistrer</button>
      <button type="button" class="design-link" data-key-help>Comment l'obtenir ?</button>
    </div>
  </div>
</dialog>

<dialog class="dz-dialog" data-new-dialog>
  <form class="dz-dialog-box dz-form" method="dialog">
    <div class="dz-dialog-head"><h3>Nouvel asset</h3><button type="button" class="design-btn" data-close aria-label="Fermer"><i class="ti ti-x" aria-hidden="true"></i></button></div>
    <label>Nom<input class="design-input" name="label" required maxlength="40" placeholder="Une lanterne…" autocomplete="off"></label>
    <label>Type
      <select class="design-input" name="kind">
        <option value="decor">Décor</option>
        <option value="animation">Animation</option>
        <option value="relique">Relique</option>
        <option value="autre">Autre</option>
      </select>
    </label>
    <label>Taille
      <select class="design-input" name="size"></select>
    </label>
    <div class="dz-row" data-custom-size hidden>
      <label>Largeur<input class="design-input" name="w" type="number" min="4" max="160" value="32"></label>
      <label>Hauteur<input class="design-input" name="h" type="number" min="4" max="160" value="32"></label>
    </div>
    <div class="dz-row" data-anim hidden>
      <label>Images<input class="design-input" name="frames" type="number" min="2" max="24" value="4"></label>
      <label>Vitesse (images/s)<input class="design-input" name="fps" type="number" min="1" max="30" value="6"></label>
    </div>
    <p class="design-note" data-new-error role="alert"></p>
    <div class="design-actions"><button type="submit" class="design-btn primary">Créer</button></div>
  </form>
</dialog>`;

// (les boîtes de dialogue vont au corps de la page : rangées dans une zone
// cachée, elles s'ouvraient invisibles et figeaient tout)
for (const d of host.querySelectorAll('dialog')) document.body.append(d);
const $ = sel => host.querySelector(sel) || document.body.querySelector(sel);
const note = $('.design-note');
const say = t => { note.textContent = t; if (host.hidden) toastSay(t); };

// ── Aide, clé, publication ──
const helpDialog = $('[data-help-dialog]'), keyDialog = $('[data-key-dialog]'), newDialog = $('[data-new-dialog]');
for (const dlg of host.querySelectorAll('dialog')) {
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
}
$('[data-folders]').append(...GROUPS.map(g => { const li = document.createElement('li'); li.innerHTML = '<b></b> : <span></span>'; li.querySelector('b').textContent = g.title; li.querySelector('span').textContent = g.about; return li; }));
$('[data-help]').addEventListener('click', () => helpDialog.showModal());
$('[data-key-help]').addEventListener('click', () => { keyDialog.close(); helpDialog.showModal(); });

const syncKey = () => { $('[data-forget]').hidden = !getToken(); status(); };
// La pastille des modifications, dans la barre des onglets : visible partout
let changes = null;
function status() { changes?.refresh(); }
const AUTO_KEY = 'kingvi:autopublish';
const autoBox = $('[data-auto]');
try { autoBox.checked = localStorage.getItem(AUTO_KEY) === '1'; } catch { /* rien */ }
autoBox.addEventListener('change', () => {
  try { localStorage.setItem(AUTO_KEY, autoBox.checked ? '1' : '0'); } catch { /* rien */ }
  if (autoBox.checked && !getToken()) showToken();
});
const afterEditing = () => {
  status();
  if (autoBox.checked && listChanges().length) { if (getToken()) runPublish(); else showToken(); }
};
let publishing = false;
async function runPublish(progress = t => say(t)) {
  if (!listChanges().length) { progress('Rien à publier : tout est déjà dans le jeu.'); return; }
  if (!getToken()) { showToken(); return; }
  if (publishing) return;
  publishing = true;
  const tell = t => { progress(t); changes?.say(t); };
  try {
    await publish(tell);
    tell('Publié. Dans le jeu sur tous les appareils d\'ici une à dix minutes ; rechargez la page sur l\'autre appareil.');
  } catch (e) {
    tell(e.message);
    if (/jeton|Jeton/.test(e.message)) { setToken(''); syncKey(); showToken(); }
  } finally { publishing = false; status(); }
}
// La clé d'abord (même sans rien à publier : sur un autre appareil, on la colle avant de dessiner)
function showToken() { $('[data-menu]')?.removeAttribute('open'); keyDialog.showModal(); keyDialog.querySelector('input').focus(); }
$('[data-key]').addEventListener('click', () => { $('.dz-menu').open = false; showToken(); });
$('[data-save-token]').addEventListener('click', () => {
  const input = keyDialog.querySelector('input');
  if (!/^(github_pat_|ghp_)/.test(input.value.trim())) { say('Cette clé ne ressemble pas à un jeton GitHub (elle commence par github_pat_).'); return; }
  setToken(input.value); input.value = ''; keyDialog.close(); syncKey();
  if (listChanges().length) runPublish(); else say('Clé enregistrée sur cet appareil.');
});
$('[data-forget]').addEventListener('click', () => { setToken(''); syncKey(); say('Clé oubliée.'); });
$('[data-copy]').addEventListener('click', async () => {
  $('.dz-menu').open = false;
  const text = designsToText();
  if (!text) { say('Rien à copier : aucun dessin retouché.'); return; }
  const n = text.split('\n').length - 1;
  try { await navigator.clipboard.writeText(text); say(`Copié (${n} dessin${n > 1 ? 's' : ''}) : collez-le dans la conversation.`); }
  catch {
    const box = document.createElement('textarea');
    box.value = text; box.readOnly = true; box.className = 'design-paste';
    note.replaceChildren('Sélectionnez et copiez ce texte, puis collez-le dans la conversation :', box);
    box.select();
  }
});
$('input[type=file]').addEventListener('change', async e => {
  const lines = [];
  for (const file of e.target.files) {
    const name = file.name.replace(/\.png$/i, '');
    lines.push(`${name} : ${await take(name, await file.arrayBuffer())}`);
  }
  e.target.value = '';
  $('.dz-menu').open = false;
  say(lines.join(' · '));
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

// ── Nouvel asset ──
const form = newDialog.querySelector('form');
const SIZES = [[10, 10, 'Relique : 10 × 10'], [8, 8], [16, 16], [24, 24], [32, 32], [48, 48], [64, 64], [96, 96], [128, 128]];
form.size.innerHTML = SIZES.map(([w, h, t], i) => `<option value="${i}">${t || `${w} × ${h}`}</option>`).join('') + '<option value="custom">Autre taille…</option>';
const DEFAULT_SIZE = { decor: 4, animation: 2, relique: 0, autre: 3 };
function syncForm() {
  form.querySelector('[data-custom-size]').hidden = form.size.value !== 'custom';
  form.querySelector('[data-anim]').hidden = form.kind.value !== 'animation';
}
form.kind.addEventListener('change', () => { form.size.value = String(DEFAULT_SIZE[form.kind.value]); syncForm(); });
form.size.addEventListener('change', syncForm);
$('[data-new]').addEventListener('click', () => {
  form.reset(); form.size.value = String(DEFAULT_SIZE.decor); syncForm();
  form.querySelector('[data-new-error]').textContent = '';
  newDialog.showModal(); form.label.focus();
});
form.addEventListener('submit', e => {
  e.preventDefault();
  const custom = form.size.value === 'custom', [w, h] = custom ? [+form.w.value, +form.h.value] : SIZES[+form.size.value];
  const def = addCustom({ label: form.label.value, kind: form.kind.value, w, h, frames: +form.frames.value, fps: +form.fps.value });
  if (def.error) { form.querySelector('[data-new-error]').textContent = def.error; return; }
  newDialog.close();
  buildTree();
  select(DESIGNS.find(d => d.group === CUSTOM_KINDS[def.kind] && (d.name === `custom-${def.id}` || d.name === `custom-${def.id}-0`)).name);
  status();
  say(`« ${def.label} » créé (${def.w} × ${def.h}${def.frames > 1 ? `, ${def.frames} images` : ''}). Cliquez sur « Dessiner ».`);
});

// ── La colonne de droite : les dossiers ──
const foldersEl = $('.dz-folders'), thumbs = new Map();
let selected = 'relique-poupee', filter = '';
// (la falaise entière, 1020 pixels de large : réduite elle aussi à la vignette)
const thumbK = d => { const v = Math.min(32 / d.w, 32 / d.h); return v >= 1 ? Math.floor(v) : v; };

function buildTree() {
  thumbs.clear();
  const open = new Set([...foldersEl.querySelectorAll('details[open]')].map(el => el.dataset.group));
  if (!foldersEl.children.length) open.add('reliques');
  open.add(byName(selected)?.group);
  foldersEl.replaceChildren();
  for (const g of GROUPS) {
    const list = DESIGNS.filter(d => d.group === g.id && (!filter || `${d.label} ${d.name}`.toLowerCase().includes(filter)));
    if (g.custom && !DESIGNS.some(d => d.group === g.id)) continue;       // (pas de dossier « Mes… » vide)
    if (filter && !list.length) continue;
    const el = document.createElement('details');
    el.className = 'dz-folder';
    el.dataset.group = g.id;
    el.open = filter ? true : open.has(g.id);
    el.innerHTML = '<summary><i class="ti ti-folder" aria-hidden="true"></i><b></b><span class="dz-count"></span></summary><div class="dz-items"></div>';
    el.querySelector('b').textContent = g.title;
    el.querySelector('.dz-count').textContent = DESIGNS.filter(d => d.group === g.id).length;
    el.querySelector('summary').title = g.about;
    const items = el.querySelector('.dz-items');
    // (une animation = une seule entrée, avec toutes ses images ; les dessins
    // qui n'appartiennent à aucune animation restent seuls)
    const seqs = (SEQUENCES[g.id] || []).filter(sq => !filter || `${sq.label} ${sq.names.join(' ')}`.toLowerCase().includes(filter));
    const inSeq = new Set((SEQUENCES[g.id] || []).flatMap(sq => sq.names));
    for (const sq of seqs) items.append(seqItem(sq));
    for (const d of list) if (!inSeq.has(d.name)) items.append(item(d));
    foldersEl.append(el);
  }
  if (!foldersEl.children.length) foldersEl.textContent = 'Aucun résultat.';
}
function seqItem(sq) {
  const d = byName(sq.names[0]), key = `seq:${sq.label}`;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'dz-item dz-seq'; b.dataset.name = key;
  b.innerHTML = '<span class="dz-thumb"><canvas></canvas></span><span class="dz-name"></span><span class="dz-dot" aria-hidden="true"></span>';
  b.querySelector('.dz-name').textContent = `${sq.label} · ${new Set(sq.names).size} images`;
  b.addEventListener('click', () => { selectedSeq = sq; select(sq.names[0]); closeTree(); });
  thumbs.set(key, b); b.seq = sq;
  drawTo(b.querySelector('canvas'), d, rowsOf(d.name), thumbK(d));
  b.classList.toggle('on', selectedSeq === sq && sq.names.includes(selected));
  b.classList.toggle('mine', sq.names.some(nm => designSource(nm) === 'local'));
  return b;
}
function item(d) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'dz-item'; b.dataset.name = d.name;
  b.innerHTML = '<span class="dz-thumb"><canvas></canvas></span><span class="dz-name"></span><span class="dz-dot" aria-hidden="true"></span>';
  b.querySelector('.dz-name').textContent = d.label;
  b.addEventListener('click', () => { select(d.name); closeTree(); });
  thumbs.set(d.name, b);
  drawTo(b.querySelector('canvas'), d, rowsOf(d.name), thumbK(d));
  b.classList.toggle('on', d.name === selected);
  b.classList.toggle('mine', designSource(d.name) === 'local');
  return b;
}
$('.dz-search').addEventListener('input', e => { filter = e.target.value.trim().toLowerCase(); buildTree(); });
// Le remplissage automatique du navigateur y mettait un e-mail enregistré :
// le champ reste vide tant qu'on n'y a pas tapé soi-même
{
  const box = $('.dz-search');
  let typed = false;
  box.addEventListener('keydown', () => { typed = true; });
  const clear = () => { if (!typed && box.value) { box.value = ''; filter = ''; buildTree(); } };
  clear();
  for (const ms of [200, 800, 2000]) setTimeout(clear, ms);
  box.addEventListener('focus', () => setTimeout(clear, 0));
}

// ── La liste en tiroir (iPad en portrait, téléphone) : le bouton « Les
// dessins » l'ouvre ; choisir un dessin, toucher à côté ou la croix la ferme ──
const dz = $('.dz');
const closeTree = () => dz.classList.remove('tree-open');
$('[data-tree]').addEventListener('click', () => dz.classList.add('tree-open'));
for (const b of host.querySelectorAll('[data-tree-close]')) b.addEventListener('click', closeTree);

// ── Les derniers ouverts, en tête de la liste (dans ce navigateur) ──
const RECENT_KEY = 'kingvi:atelier-recent';
const readRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } };
function pushRecent(name) {
  const list = [name, ...readRecent().filter(n => n !== name)].filter(n => byName(n)).slice(0, 8);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* rien */ }
  drawRecent();
}
function drawRecent() {
  const list = readRecent().filter(n => byName(n)), box = $('.dz-recent');
  box.hidden = !list.length;
  $('.dz-recent-list').replaceChildren(...list.map(nm => {
    const d = byName(nm), b = document.createElement('button');
    b.type = 'button'; b.className = 'dz-recent-item'; b.title = d.label;
    b.innerHTML = '<canvas></canvas>';
    drawTo(b.querySelector('canvas'), d, rowsOf(nm), Math.min(thumbK(d), 40 / Math.max(d.w, d.h)) * 1.2);
    b.addEventListener('click', () => { select(nm); closeTree(); });
    return b;
  }));
}

// ── L'asset choisi ──
const main = $('.dz-main');
let anim = null;
let selectedSeq = null;            // (l'animation choisie, quand une image en a plusieurs)
function seqOf(d) {
  const all = SEQUENCES[d.group] || [];
  return all.find(sq => sq === selectedSeq && sq.names.includes(d.name)) || all.find(sq => sq.names.includes(d.name));
}
function select(name) {
  selected = name;
  const d = byName(name), sq = d && seqOf(d);
  if (sq) selectedSeq = sq;
  for (const [n, b] of thumbs) b.classList.toggle('on', sq ? n === `seq:${sq.label}` : n === name);
  const g = byName(name)?.group, folder = foldersEl.querySelector(`details[data-group="${g}"]`);
  if (folder) folder.open = true;
  if (byName(name)) pushRecent(name);
  showMain();
}
function showMain() {
  anim?.stop(); anim = null;
  const d = byName(selected);
  if (!d) { main.textContent = ''; return; }
  const seq = seqOf(d);
  const custom = customOf(d.name);
  main.innerHTML = `
    <div class="dz-head"><h3></h3><span class="dz-meta"></span></div>
    <div class="dz-row"><div class="dz-stage"><canvas></canvas></div>
    <section class="dz-play" hidden>
      <h4>Dans le jeu</h4>
      <label class="dz-check"><input type="checkbox" data-p="light"> Il éclaire</label>
      <div class="dz-inline" data-light-opt>
        <button type="button" class="design-btn" data-arm="light"><i class="ti ti-flame" aria-hidden="true"></i> Placer la flamme</button>
        <label class="dz-inline">Portée <select class="design-input" data-p="big"><option value="">petite (une torche)</option><option value="1">grande (un feu)</option></select></label>
      </div>
      <p class="design-note" data-light-opt>« Placer la flamme », puis clique sur le dessin, là où est la lumière (la croix rouge).</p>
      <label class="dz-check"><input type="checkbox" data-p="block"> Bloque le passage</label>
      <div class="dz-inline" data-block-opt><button type="button" class="design-btn" data-arm="box"><i class="ti ti-square-dashed" aria-hidden="true"></i> Tracer la zone</button></div>
      <p class="design-note" data-block-opt>« Tracer la zone », puis glisse sur le dessin (en rouge pâle) : son pied, pas toute sa hauteur.</p>
      <label class="dz-check"><input type="checkbox" data-p="shadow"> Porte une ombre à la torche</label>
      <label class="dz-block">Ce qu'on en voit (clic droit)<input class="design-input" type="text" maxlength="160" data-p="desc" placeholder="Quelqu'un l'a posé là, il y a longtemps."></label>
      <p class="design-note" data-custom-note>Pour le poser sur l'île : onglet Carte, « Poser un objet ». Le jeu le prend à son lancement.</p>
      <p class="design-note" data-game-note>Vaut pour ce dessin là où le jeu le pose (le jeu ouvert le prend aussitôt).</p>
      <p class="design-note">Aussi dans l'éditeur (« Dessiner », puis « Dans le jeu ») : pour une animation, la flamme peut suivre chaque image.</p>
    </section>
    </div>
    <div class="design-actions">
      <button type="button" class="design-btn primary" data-draw><i class="ti ti-pencil" aria-hidden="true"></i> Dessiner</button>
      <button type="button" class="design-btn" data-dl>Télécharger PNG</button>
      <label class="design-btn">Importer PNG<input type="file" accept="image/png" hidden></label>
      <button type="button" class="design-btn quiet" data-reset hidden>Retirer mes retouches</button>
      <button type="button" class="design-btn quiet" data-remove hidden>Supprimer l'asset</button>
    </div>
    <div class="dz-anim" hidden><canvas></canvas><span class="dz-meta"></span></div>
`;
  main.querySelector('h3').textContent = seq ? `${seq.label} · ${new Set(seq.names).size} images` : d.label;
  main.querySelector('[data-remove]').hidden = !custom;
  if (seq) {
    const box = main.querySelector('.dz-anim');
    box.hidden = false;
    box.querySelector('.dz-meta').textContent = `${seq.label} · ${seq.fps} images/s`;
    anim = playSeq(box.querySelector('canvas'), seq);
  }
  main.querySelector('[data-draw]').addEventListener('click', () => openEditor(d.name));
  main.querySelector('[data-dl]').addEventListener('click', async () => download(d.name, await rowsToPng(rowsOf(d.name))));
  main.querySelector('input[type=file]').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) say(await take(d.name, await f.arrayBuffer()));
  });
  restOfMain(d, custom);
  const pk = propsKey(d);
  if (pk) playPanel(pk, custom ? custom.w : d.w, custom ? custom.h : d.h);
}
// La clé de « Dans le jeu » d'un dessin (null : il n'en a pas ; les poses du
// viking, du loup, des cerfs, les reliques, le titre, la falaise, les rochers…)
function propsKey(d) {
  const custom = customOf(d.name);
  if (custom) return `custom-${custom.id}`;
  const base = d.name.replace(/--\d+$/, '');
  return !fixedFrames(base) && !/^(viking|cape|loup|cerf|biche|relique|titre|ceinture|room|decor-roi|falaise|rocher-|souche|pont-tronc)/.test(base) ? base : null;
}
// Les mêmes réglages, pour l'éditeur (son calque « Dans le jeu ») : on n'y garde
// que ce qui est posé (rien de vide)
function gameProps(key) {
  return {
    get: () => ({ ...(propsOf(key) || {}) }),
    set: p => {
      const clean = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== '' && v !== false && v !== 0 && v !== null));
      setExtra('props', key, Object.keys(clean).length ? clean : null);
      status(); paintMain();
    },
  };
}
// Ce que fait un asset créé ici, une fois posé sur l'île : la lumière, le pied
// qui bloque, l'ombre, ce qu'on en dit (`props` des extras, sous `custom-<id>`)
function playPanel(key, W, H) {
  const box = main.querySelector('.dz-play'), custom = { w: W, h: H };
  box.hidden = false;
  const get = () => ({ ...(propsOf(key) || {}) });
  const save = p => { const clean = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== '' && v !== false && v !== 0 && v !== null)); setExtra('props', key, Object.keys(clean).length ? clean : null); status(); paintMain(); sync(); };
  const f = sel => box.querySelector(`[data-p="${sel}"]`);
  const sync = () => {
    const p = get();
    f('light').checked = !!p.light; f('big').value = p.light?.big ? '1' : '';
    for (const el of box.querySelectorAll('[data-light-opt]')) el.hidden = !p.light;
    f('block').checked = !!p.box;
    for (const el of box.querySelectorAll('[data-block-opt]')) el.hidden = !p.box;
    f('shadow').checked = !!p.shadow;
    if (document.activeElement !== f('desc')) f('desc').value = p.desc || '';
  };
  f('light').addEventListener('change', () => { const p = get(); p.light = f('light').checked ? (p.light || { x: Math.floor(custom.w / 2), y: Math.floor(custom.h / 2) }) : undefined; save(p); if (p.light) setArm('light'); });
  f('big').addEventListener('change', () => { const p = get(); if (p.light) p.light = { ...p.light, big: f('big').value ? 1 : undefined }; save(p); });
  f('block').addEventListener('change', () => { const p = get(); delete p.mask; p.box = f('block').checked ? (p.box || { x0: Math.floor(custom.w / 2) - 2, y0: custom.h - 3, x1: Math.floor(custom.w / 2) + 2, y1: custom.h - 1 }) : undefined; save(p); if (p.box) setArm('box'); });
  f('shadow').addEventListener('change', () => { const p = get(); p.shadow = f('shadow').checked || undefined; save(p); });
  let t = 0;
  f('desc').addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { const p = get(); p.desc = f('desc').value.trim() || undefined; save(p); }, 400); });
  box.querySelector('[data-custom-note]').hidden = !key.startsWith('custom-');
  box.querySelector('[data-game-note]').hidden = key.startsWith('custom-');
  // Sur le dessin : « Placer la flamme » puis un clic ; « Tracer la zone » puis glisser
  const cv = main.querySelector('.dz-stage canvas');
  let arm = null;
  const setArm = a => {
    arm = arm === a ? null : a;
    for (const b of box.querySelectorAll('[data-arm]')) b.classList.toggle('on', b.dataset.arm === arm);
    main.querySelector('.dz-stage').classList.toggle('armed', !!arm);
    if (arm) say(arm === 'light' ? 'Clique sur le dessin, là où est la flamme.' : 'Glisse sur le dessin pour tracer la zone qui bloque.');
  };
  for (const b of box.querySelectorAll('[data-arm]')) b.addEventListener('click', () => setArm(b.dataset.arm));
  const at = e => { const r = cv.getBoundingClientRect(); return { x: Math.max(0, Math.min(custom.w - 1, Math.floor((e.clientX - r.left) / r.width * custom.w))), y: Math.max(0, Math.min(custom.h - 1, Math.floor((e.clientY - r.top) / r.height * custom.h))) }; };
  let from = null;
  cv.addEventListener('pointerdown', e => { from = at(e); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointerup', e => {
    if (!from) return;
    const to = at(e), p = get();
    if (arm === 'box' && p.box) { p.box = { x0: Math.min(from.x, to.x), y0: Math.min(from.y, to.y), x1: Math.max(from.x, to.x), y1: Math.max(from.y, to.y) }; delete p.mask; }
    else if (arm === 'light' && p.light) p.light = { ...p.light, x: to.x, y: to.y };
    else { from = null; return; }
    from = null; save(p); setArm(null); say('Enregistré. Publie pour tout le monde.');
  });
  sync();
}
// L'éditeur, sur ce dessin (et toute son animation)
function openEditor(name) {
  const d = byName(name);
  const seq = seqOf(d);
  const custom = customOf(d.name);
  const names = seq ? [...new Set(seq.names)] : [d.name];
  // Ses images, et comment en changer le nombre : une animation créée ici
  // (`custom-<id>-<n>`), ou n'importe quel dessin seul, du code ou créé ici, à
  // qui l'on ajoute des images (`<nom>--<n>`) ; les animations figées par le
  // code (marche, loup, flamme…) gardent leur nombre d'images
  const multi = custom && custom.frames > 1;
  const base = multi ? null : (seq?.extra || (!fixedFrames(d.name) ? d.name : null));
  const editable = multi || !!base;
  const frameNames = () => multi ? customNames(customOf(`custom-${custom.id}-0`)) : base ? (seqOf(byName(base))?.names || [base]) : names;
  const setCount = n => multi ? setCustomFrames(custom.id, n) : setDesignFrames(base, n, seq?.fps || 6);
  const reopen = (show, msg) => { selected = show; buildTree(); select(show); status(); say(msg); openEditor(show); };
  const reshape = (delta) => (at, rows, move = 0, blank = false) => {
    const all = frameNames();
    const cur = all.map(nm => rowsOf(nm));
    cur[at] = rows;
    if (move) { [cur[at], cur[at + move]] = [cur[at + move], cur[at]]; }
    else if (delta > 0) cur.splice(at + 1, 0, blank ? rows.map(r => '.'.repeat(r.length)) : rows.slice()); else cur.splice(at, 1);
    setCount(cur.length);
    const next = frameNames();
    next.forEach((nm, i) => { setLocalDesign(nm, cur[i]); applyLocal(nm, cur[i]); });
    for (const nm of all.slice(next.length)) { setLocalDesign(nm, null); applyLocal(nm, null); }
    const show = next[Math.min(next.length - 1, move ? at + move : delta > 0 ? at + 1 : Math.max(0, at - 1))];
    reopen(show, move ? 'Image déplacée.' : delta > 0 ? `Image ajoutée (${next.length} images).` : next.length > 1 ? `Image retirée (${next.length} images).` : 'Image retirée : ce n\'est plus une animation.');
  };
  // Le canevas agrandi d'un côté : toutes les images de ce dessin ensemble
  const grow = (side, n, at, rows) => {
    const all = frameNames(), cur = all.map(nm => rowsOf(nm));
    cur[at] = rows;
    const owner = multi ? all[0] : base || d.name;
    if (!growDesign(owner, side, n)) { say('160 pixels au plus.'); openEditor(all[at]); return; }
    const p = { l: 0, r: 0, t: 0, b: 0, [side]: n };
    all.forEach((nm, i) => { const r = padRows(cur[i], p); setLocalDesign(nm, r); applyLocal(nm, r); });
    reopen(all[at], `Canevas agrandi : ${byName(all[0]).w} × ${byName(all[0]).h}.`);
  };
  const count = names.length;
  openPixelEditor({
    frames: names.map(nm => ({ name: nm, label: byName(nm).label, original: originalRows(nm), rows: rowsOf(nm) })),
    index: names.indexOf(d.name),
    onAddFrame: editable ? (at, rows, blank) => reshape(1)(at, rows, 0, blank) : null,
    onRemoveFrame: editable && count > (multi ? 2 : 1) ? reshape(-1) : null,
    onMoveFrame: editable && count > 1 ? (at, dir, rows) => reshape(0)(at, rows, dir) : null,
    onGrow: fixedFrames(d.name) ? null : grow,
    game: propsKey(d) ? gameProps(propsKey(d)) : null,
    order: seq ? seq.names.map(nm => names.indexOf(nm)) : null,
    fps: seq?.fps || 8,
    // chaque trait : gardé ici, et le jeu ouvert ailleurs se redessine (événement « storage »)
    onSave: (nm, rows) => { setLocalDesign(nm, rows); applyLocal(nm, rows); refresh(nm); },
    onReset: async nm => { setLocalDesign(nm, null); applyLocal(nm, null); await loadDesigns(); syncCustom(); refresh(nm); },
    onClose: afterEditing,
  });
}
function restOfMain(d, custom) {
  main.querySelector('[data-reset]').addEventListener('click', async () => {
    setLocalDesign(d.name, null); applyLocal(d.name, null);
    // (et ce qui s'y ajoutait : les marges, les images de plus)
    for (const nm of DESIGNS.filter(x => x.name.startsWith(`${d.name}--`)).map(x => x.name)) { setLocalDesign(nm, null); applyLocal(nm, null); }
    setExtra('pads', d.name, null); setExtra('anims', d.name, null);
    await loadDesigns(); syncCustom();            // (le fichier du dépôt, s'il y en a un, revient)
    refresh(d.name); say('Retouches retirées.');
  });
  main.querySelector('[data-remove]').addEventListener('click', e => {
    const b = e.currentTarget;
    if (!b.classList.contains('confirm')) { b.classList.add('confirm'); b.textContent = 'Supprimer vraiment ?'; setTimeout(() => { b.classList.remove('confirm'); b.textContent = 'Supprimer l\'asset'; }, 3500); return; }
    for (const nm of custom.frames > 1 ? DESIGNS.filter(x => x.name.startsWith(`custom-${custom.id}-`)).map(x => x.name) : [`custom-${custom.id}`]) { setLocalDesign(nm, null); applyLocal(nm, null); }
    removeCustom(custom.id);
    selected = 'relique-poupee';
    buildTree(); select(selected); status(); say(`« ${custom.label} » supprimé.`);
  });
  paintMain();
}
function paintMain() {
  const d = byName(selected);
  if (!d || !main.firstElementChild) return;
  const rows = rowsOf(d.name), cv = main.querySelector('.dz-stage canvas');
  const k = Math.max(1, Math.min(12, Math.floor(340 / d.w), Math.floor(300 / d.h)));
  drawTo(cv, d, rows, k);
  // Ce qu'il fait dans le jeu, par-dessus : la flamme (croix rouge), le pied qui bloque (rouge pâle)
  const custom = customOf(d.name), props = propsOf(custom ? `custom-${custom.id}` : d.name.replace(/--\d+$/, ''));
  if (props) {
    const ctx = cv.getContext('2d');
    if (props.box) {
      const b = props.box;
      ctx.fillStyle = 'rgba(192,57,43,.4)';
      if (props.mask) props.mask.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '#') ctx.fillRect(x, y, 1, 1); });
      else ctx.fillRect(b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1);
    }
    if (props.light) {
      const { x, y } = props.light;
      ctx.fillStyle = '#c0392b';
      for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [0, -2], [0, 2]]) ctx.fillRect(x + dx, y + dy, 1, 1);
    }
  }
  const src = designSource(d.name);
  main.querySelector('.dz-meta').textContent = `${d.name} · ${d.w} × ${d.h}${src === 'local' ? ' · retouché ici' : src === 'depot' ? ' · publié' : ''}`;
  const ex = readExtras();
  main.querySelector('[data-reset]').hidden = src !== 'local' && ex.pads[d.name] === undefined && ex.anims[d.name] === undefined;
}
function playSeq(cv, seq) {
  const first = byName(seq.names[0]);
  const k = Math.max(1, Math.min(6, Math.floor(150 / first.w), Math.floor(120 / first.h)));
  let i = 0;
  const draw = () => drawTo(cv, first, rowsOf(seq.names[i++ % seq.names.length]), k);
  draw();
  const t = setInterval(draw, 1000 / seq.fps);
  return { stop: () => clearInterval(t) };
}

// Un dessin a changé : sa vignette, l'aperçu, l'état
function refresh(name) {
  const d = byName(name), b = thumbs.get(name);
  if (b && d) {
    drawTo(b.querySelector('canvas'), d, rowsOf(name), thumbK(d));
    b.classList.toggle('mine', designSource(name) === 'local');
  }
  // (les animations où paraît cette image : leur vignette, leur pastille)
  for (const sb of thumbs.values()) {
    if (!sb.seq?.names.includes(name)) continue;
    const f = byName(sb.seq.names[0]);
    drawTo(sb.querySelector('canvas'), f, rowsOf(f.name), thumbK(f));
    sb.classList.toggle('mine', sb.seq.names.some(nm => designSource(nm) === 'local'));
  }
  if (name === selected || seqOf(byName(selected) || {})?.names.includes(name)) paintMain();
  status();
}

// Un autre onglet a changé des retouches : mettre les aperçus à jour
window.addEventListener('storage', e => {
  if (e.key === 'kingvi:custom') { syncCustom(); buildTree(); showMain(); status(); return; }
  if (e.key !== 'kingvi:designs') return;
  for (const name of refreshLocal()) refresh(name);
});

syncKey();
buildTree();
select(selected);
// Ce qui était déjà redessiné ou créé au chargement de la page
loadDesigns().then(() => {
  syncCustom();
  if (!byName(selected)) selected = 'relique-poupee';
  buildTree(); select(selected); status();
});

// ── Les onglets de l'atelier : les dessins, la carte (placer les lieux) ──
// (chaque outil se monte la première fois qu'on l'ouvre ; il rend de quoi
// aller à un de ses éléments : `focus(clé)`)
const tools = {};
function showTool() {
  const tool = location.hash === '#carte' ? 'carte' : location.hash === '#textes' ? 'textes' : location.hash === '#nombres' ? 'nombres' : 'dessins';
  for (const a of document.querySelectorAll('.atelier-tabs a')) a.classList.toggle('on', a.dataset.tool === tool);
  for (const p of document.querySelectorAll('[data-panel]')) p.hidden = p.dataset.panel !== tool;
  if (tool === 'nombres' && !tools.nombres) tools.nombres = mountTuning(document.getElementById('atelier-tuning'), { onChange: status });
  if (tool === 'textes' && !tools.textes) tools.textes = mountTexts(document.getElementById('atelier-texts'), { onChange: status });
  if (tool === 'carte' && !tools.carte) tools.carte = mountMap(document.getElementById('atelier-map'), { say: t => toastSay(t), onChange: status });
  return tool;
}
// Une ligne de la liste des modifications : son onglet, puis l'élément
async function goTo(c) {
  if (location.hash !== `#${c.tool}`) history.replaceState(null, '', `#${c.tool}`);
  showTool();
  if (c.tool === 'dessins') { if (byName(c.key)) { select(c.key); closeTree(); main.scrollIntoView({ block: 'start' }); } return; }
  (await tools[c.tool])?.focus?.(c.key);
}
changes = mountChanges(document.querySelector('.atelier-tabs'), { go: goTo, publish: progress => runPublish(progress) });
window.addEventListener('storage', () => status());
function toastSay(t) {
  const el = document.getElementById('toast');
  el.textContent = t; el.hidden = false;
  clearTimeout(toastSay.t); toastSay.t = setTimeout(() => { el.hidden = true; }, 3200);
}
window.addEventListener('hashchange', showTool);
showTool();

// Des retouches d'ici, plus vieilles qu'une publication du même dessin, ont
// été mises de côté (le dépôt passe devant) : on peut les retrouver
{
  const b = $('[data-old]'), n = Object.keys(readOld()).length;
  b.hidden = !n;
  b.textContent = `Retrouver ${n} retouche${n > 1 ? 's' : ''} mise${n > 1 ? 's' : ''} de côté`;
  b.addEventListener('click', () => {
    const names = restoreOld();
    b.hidden = true;
    buildTree(); showMain(); status();
    say(`${names.length} retouche${names.length > 1 ? 's' : ''} revenue${names.length > 1 ? 's' : ''} (${names.join(', ')}). Publie-les pour qu'elles passent devant.`);
  });
}
