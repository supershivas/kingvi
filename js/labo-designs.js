/* Labo, onglet Dessins : redessiner à la main les éléments uniques du décor
   (voir designs.js). Télécharger le PNG 1 × 1, le retoucher dans un éditeur de
   pixels, le réimporter : le jeu s'en sert. Arbres et rochers restent
   générés. */
import { DESIGNS, designRows, designSource, rowsToPng, importDesign, setLocalDesign, applyLocal, loadDesigns } from './designs.js?v=1.37.0';

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
  local: 'Importé dans ce navigateur : visible dans votre jeu seulement, tant que vous ne le publiez pas.',
  depot: 'Fichier du dépôt (assets/design) : visible par tout le monde.',
  none: 'Dessin d\'origine, fait par le code.',
};

// ── Mode d'emploi ──
const intro = document.createElement('article');
intro.className = 'demo wide';
intro.innerHTML = `
  <h3><span class="tag">Mode d'emploi</span><span>Redessiner un élément</span></h3>
  <ol class="design-steps">
    <li><b>Télécharger</b> le PNG de l'élément (à l'échelle 1 × 1, un pixel du fichier = un pixel du jeu).</li>
    <li><b>Le retoucher</b> dans votre éditeur de pixels. Trois couleurs seulement : neige, bleu nuit, rouge (le reste est ramené à la plus proche, le vide reste transparent). <b>Ne changez pas la taille</b> : la porte, les obstacles et les positions en dépendent.</li>
    <li><b>L'importer</b> ici : l'aperçu se met à jour et le jeu s'en sert la prochaine fois qu'on l'ouvre dans ce navigateur. Vous pouvez importer plusieurs PNG d'un coup : leur nom de fichier doit être celui de l'élément (<code>house.png</code>…).</li>
    <li><b>Publier</b> pour tout le monde : sur GitHub, dans le dépôt <code>supershivas/kingvi</code>, ouvrez le dossier <code>assets/design</code>, « Add file » puis « Upload files », glissez les PNG et validez (« Commit changes »). Ils sont visibles dans le jeu au bout de dix minutes environ.</li>
  </ol>
  <p>Les arbres et les rochers restent générés par le code : ils ne sont pas dans cette liste.</p>
  <div class="design-actions">
    <label class="design-btn">Importer plusieurs PNG<input type="file" accept="image/png" multiple hidden></label>
    <button type="button" class="design-btn" data-all>Tout télécharger</button>
    <span class="design-note" role="status"></span>
  </div>`;
host.append(intro);
const note = intro.querySelector('.design-note');

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
      <button type="button" class="design-btn" data-dl>Télécharger</button>
      <label class="design-btn">Importer<input type="file" accept="image/png" hidden></label>
      <button type="button" class="design-btn quiet" data-reset hidden>Retirer l'import</button>
    </div>
    <p class="design-note" role="status"></p>`;
  el.querySelector('h3 span:last-child').textContent = d.label;
  host.append(el);
  cards.set(d.name, el);
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
    el.querySelector('.design-note').textContent = 'Import retiré.';
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
