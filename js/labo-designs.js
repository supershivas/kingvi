/* Labo, onglet Dessins : l'atelier. Redessiner à la main le décor, les reliques,
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
} from './designs.js?v=1.53.0';
import { openPixelEditor } from './pixel-editor.js?v=1.53.0';
import { publish, pending, customChanged, getToken, setToken, TOKEN_URL, REPO } from './designs-publish.js?v=1.53.0';

const host = document.querySelector('#dessins .demos');
const rowsOf = name => designRows(name, originalRows(name));
const COL = { s: '#dfe6ee', b: '#1f2a44', k: '#1f2a44', r: '#c0392b', h: 'rgba(31,42,68,.3)' };
const byName = name => DESIGNS.find(d => d.name === name);

function paint(ctx, rows) {
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (COL[ch]) { ctx.fillStyle = COL[ch]; ctx.fillRect(x, y, 1, 1); } }));
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
    <button type="button" class="design-btn primary" data-publish><i class="ti ti-cloud-upload" aria-hidden="true"></i> Publier pour tous</button>
    <button type="button" class="design-btn" data-new><i class="ti ti-plus" aria-hidden="true"></i> Nouvel asset</button>
    <span class="dz-chip" data-chip role="status"></span>
    <span class="dz-spacer"></span>
    <details class="dz-menu">
      <summary class="design-btn" aria-label="Plus d'actions"><i class="ti ti-dots" aria-hidden="true"></i></summary>
      <div class="dz-menu-list">
        <label class="design-auto"><input type="checkbox" data-auto> Publier à la fermeture de l'éditeur</label>
        <button type="button" class="design-btn" data-key>Clé GitHub…</button>
        <button type="button" class="design-btn quiet" data-forget hidden>Oublier la clé</button>
        <button type="button" class="design-btn" data-copy>Copier mes modifications</button>
        <label class="design-btn">Importer plusieurs PNG<input type="file" accept="image/png" multiple hidden></label>
      </div>
    </details>
    <button type="button" class="design-btn" data-help aria-label="Aide"><i class="ti ti-help" aria-hidden="true"></i></button>
  </div>
  <p class="design-note" role="status"></p>
  <div class="dz-body">
    <section class="dz-main" aria-live="polite"></section>
    <aside class="dz-tree">
      <input type="search" class="design-input dz-search" name="filtre-dessins" placeholder="Chercher…" aria-label="Chercher un asset" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore data-form-type="other">
      <div class="dz-folders"></div>
    </aside>
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

const $ = sel => host.querySelector(sel);
const note = $('.design-note'), chip = $('[data-chip]');
const say = t => { note.textContent = t; };

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
function status() {
  const unpub = pending().length + (customChanged() ? 1 : 0);
  chip.textContent = unpub ? `${unpub} à publier` : 'Tout est publié';
  chip.classList.toggle('warn', unpub > 0);
  chip.title = unpub ? 'Invisible sur les autres appareils tant que vous n\'avez pas publié.' : '';
}
const AUTO_KEY = 'kingvi:autopublish';
const autoBox = $('[data-auto]');
try { autoBox.checked = localStorage.getItem(AUTO_KEY) === '1'; } catch { /* rien */ }
autoBox.addEventListener('change', () => {
  try { localStorage.setItem(AUTO_KEY, autoBox.checked ? '1' : '0'); } catch { /* rien */ }
  if (autoBox.checked && !getToken()) showToken();
});
const afterEditing = () => {
  status();
  if (autoBox.checked && (pending().length || customChanged())) { if (getToken()) runPublish(); else showToken(); }
};
async function runPublish() {
  if (!pending().length && !customChanged()) { say('Rien à publier : tout est déjà dans le jeu.'); return; }
  const btn = $('[data-publish]');
  btn.disabled = true;
  try {
    const done = await publish(t => say(t));
    say(`Publié. Dans le jeu sur tous les appareils d'ici une à dix minutes ; rechargez la page sur l'autre appareil.${done ? '' : ''}`);
  } catch (e) {
    say(e.message);
    if (/jeton|Jeton/.test(e.message)) { setToken(''); syncKey(); showToken(); }
  } finally { btn.disabled = false; status(); }
}
// La clé d'abord (même sans rien à publier : sur un autre appareil, on la colle avant de dessiner)
function showToken() { $('[data-menu]')?.removeAttribute('open'); keyDialog.showModal(); keyDialog.querySelector('input').focus(); }
$('[data-publish]').addEventListener('click', () => { if (!getToken()) { showToken(); return; } runPublish(); });
$('[data-key]').addEventListener('click', () => { $('.dz-menu').open = false; showToken(); });
$('[data-save-token]').addEventListener('click', () => {
  const input = keyDialog.querySelector('input');
  if (!/^(github_pat_|ghp_)/.test(input.value.trim())) { say('Cette clé ne ressemble pas à un jeton GitHub (elle commence par github_pat_).'); return; }
  setToken(input.value); input.value = ''; keyDialog.close(); syncKey();
  if (pending().length || customChanged()) runPublish(); else say('Clé enregistrée sur cet appareil.');
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
const thumbK = d => { const v = Math.min(32 / d.w, 32 / d.h); return v >= 1 ? Math.floor(v) : Math.max(0.2, v); };

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
    for (const d of list) items.append(item(d));
    foldersEl.append(el);
  }
  if (!foldersEl.children.length) foldersEl.textContent = 'Aucun résultat.';
}
function item(d) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'dz-item'; b.dataset.name = d.name;
  b.innerHTML = '<span class="dz-thumb"><canvas></canvas></span><span class="dz-name"></span><span class="dz-dot" aria-hidden="true"></span>';
  b.querySelector('.dz-name').textContent = d.label;
  b.addEventListener('click', () => select(d.name));
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

// ── L'asset choisi ──
const main = $('.dz-main');
let anim = null;
function select(name) {
  selected = name;
  for (const [n, b] of thumbs) b.classList.toggle('on', n === name);
  const g = byName(name)?.group, folder = foldersEl.querySelector(`details[data-group="${g}"]`);
  if (folder) folder.open = true;
  showMain();
}
function showMain() {
  anim?.stop(); anim = null;
  const d = byName(selected);
  if (!d) { main.textContent = ''; return; }
  const seq = (SEQUENCES[d.group] || []).find(sq => sq.names.includes(d.name));
  const custom = customOf(d.name);
  main.innerHTML = `
    <div class="dz-head"><h3></h3><span class="dz-meta"></span></div>
    <div class="dz-stage"><canvas></canvas></div>
    <div class="design-actions">
      <button type="button" class="design-btn primary" data-draw><i class="ti ti-pencil" aria-hidden="true"></i> Dessiner</button>
      <button type="button" class="design-btn" data-dl>Télécharger PNG</button>
      <label class="design-btn">Importer PNG<input type="file" accept="image/png" hidden></label>
      <button type="button" class="design-btn quiet" data-reset hidden>Retirer mes retouches</button>
      <button type="button" class="design-btn quiet" data-remove hidden>Supprimer l'asset</button>
    </div>
    <div class="dz-anim" hidden><canvas></canvas><span class="dz-meta"></span></div>`;
  main.querySelector('h3').textContent = d.label;
  main.querySelector('[data-remove]').hidden = !custom;
  if (seq) {
    const box = main.querySelector('.dz-anim');
    box.hidden = false;
    box.querySelector('.dz-meta').textContent = `${seq.label} · ${seq.fps} images/s`;
    anim = playSeq(box.querySelector('canvas'), seq);
  }
  main.querySelector('[data-draw]').addEventListener('click', () => {
    const names = seq ? [...new Set(seq.names)] : [d.name];
    openPixelEditor({
      frames: names.map(nm => ({ name: nm, label: byName(nm).label, original: originalRows(nm), rows: rowsOf(nm) })),
      index: names.indexOf(d.name),
      order: seq ? seq.names.map(nm => names.indexOf(nm)) : null,
      fps: seq?.fps || 8,
      // chaque trait : gardé ici, et le jeu ouvert ailleurs se redessine (événement « storage »)
      onSave: (nm, rows) => { setLocalDesign(nm, rows); applyLocal(nm, rows); refresh(nm); },
      onReset: async nm => { setLocalDesign(nm, null); applyLocal(nm, null); await loadDesigns(); syncCustom(); refresh(nm); },
      onClose: afterEditing,
    });
  });
  main.querySelector('[data-dl]').addEventListener('click', async () => download(d.name, await rowsToPng(rowsOf(d.name))));
  main.querySelector('input').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) say(await take(d.name, await f.arrayBuffer()));
  });
  main.querySelector('[data-reset]').addEventListener('click', async () => {
    setLocalDesign(d.name, null); applyLocal(d.name, null);
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
  const src = designSource(d.name);
  main.querySelector('.dz-meta').textContent = `${d.name} · ${d.w} × ${d.h}${src === 'local' ? ' · retouché ici' : src === 'depot' ? ' · publié' : ''}`;
  main.querySelector('[data-reset]').hidden = src !== 'local';
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
  if (name === selected) paintMain();
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
