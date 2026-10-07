/* L'atelier, onglet Textes (v1.61.0) : réécrire les textes du jeu. Chaque
   texte s'enregistre en tapant (dans ce navigateur, `kingvi:texts`), le jeu
   ouvert dans un autre onglet le prend aussitôt, et « Publier pour tous »
   l'envoie dans `assets/design/texts.json`. Les textes vivent dans leurs
   données (texts.js : `textEntries`, `applyTexts`). */
import { readTexts, writeTexts, textsDepot, textOverrides, designsReady } from './design-store.js?v=1.61.0';
import { textEntries, TEXT_GROUPS, whoName } from './texts.js?v=1.61.0';

export async function mountTexts(host, { onChange = () => {}, onPublish = null } = {}) {
  await designsReady;
  const all = textEntries();
  let group = 'gens', filter = '';
  host.innerHTML = `
    <div class="at">
      <div class="at-bar">
        <nav class="at-groups"></nav>
        <input class="design-input at-search" type="search" placeholder="Chercher un texte…" autocomplete="off" aria-label="Chercher un texte">
        <span class="dz-spacer"></span>
        <button type="button" class="design-btn primary" data-publish-texts><i class="ti ti-cloud-upload" aria-hidden="true"></i> Publier pour tous</button>
      </div>
      <p class="design-note">Chaque texte s'enregistre en tapant ; le jeu ouvert dans un autre onglet le prend aussitôt. Un texte vidé revient à celui d'origine.</p>
      <div class="at-list"></div>
    </div>`;
  const list = host.querySelector('.at-list'), groupsEl = host.querySelector('.at-groups');
  const current = key => textOverrides()[key];

  function store(e, value) {
    const mine = readTexts(), depot = textsDepot();
    const v = value.trim() ? value : '';
    if (!v || v === e.original) { if (depot[e.key] != null) mine[e.key] = null; else delete mine[e.key]; }
    else mine[e.key] = v;
    writeTexts(mine);
    onChange();
  }

  function render() {
    for (const b of groupsEl.children) b.classList.toggle('on', b.dataset.group === group);
    const over = textOverrides();
    const shown = all.filter(e => filter ? `${e.section} ${e.label} ${e.get()} ${e.original}`.toLowerCase().includes(filter) : e.group === group);
    const sections = new Map();
    for (const e of shown) { if (!sections.has(e.section)) sections.set(e.section, []); sections.get(e.section).push(e); }
    list.replaceChildren();
    if (!shown.length) { list.textContent = 'Aucun texte.'; return; }
    for (const [title, items] of sections) {
      const box = document.createElement('details');
      box.className = 'at-section';
      box.open = !!filter || sections.size <= 3 || items.some(e => over[e.key] != null);
      box.innerHTML = '<summary><b></b><span class="dz-count"></span></summary>';
      box.querySelector('b').textContent = title;
      const changed = items.filter(e => over[e.key] != null).length;
      box.querySelector('.dz-count').textContent = changed ? `${changed} réécrit${changed > 1 ? 's' : ''}` : items.length;
      for (const e of items) box.append(row(e, over[e.key]));
      list.append(box);
    }
  }
  function row(e, value) {
    const el = document.createElement('div');
    el.className = 'at-row';
    el.classList.toggle('changed', value != null);
    el.innerHTML = '<div class="at-head"><span class="at-label"></span><span class="at-who"></span><button type="button" class="design-btn quiet" data-reset>Remettre l\'original</button></div><textarea class="design-input" rows="2"></textarea><p class="at-orig"></p>';
    el.querySelector('.at-label').textContent = e.label;
    el.querySelector('.at-who').textContent = e.who ? `— ${whoName(e.who)}` : '';
    const ta = el.querySelector('textarea');
    ta.value = value ?? e.original;
    const fit = () => { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight + 2}px`; };
    const orig = el.querySelector('.at-orig');
    const mark = () => {
      const on = current(e.key) != null;
      el.classList.toggle('changed', on);
      el.querySelector('[data-reset]').hidden = !on;
      orig.textContent = on ? `Original : ${e.original}` : '';
    };
    let t = 0;
    ta.addEventListener('input', () => { fit(); clearTimeout(t); t = setTimeout(() => { store(e, ta.value); mark(); }, 300); });
    el.querySelector('[data-reset]').addEventListener('click', () => { ta.value = e.original; store(e, ''); mark(); fit(); });
    requestAnimationFrame(fit);
    mark();
    return el;
  }

  for (const [id, title] of TEXT_GROUPS) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'at-group'; b.dataset.group = id; b.textContent = title;
    b.addEventListener('click', () => { group = id; filter = ''; host.querySelector('.at-search').value = ''; render(); });
    groupsEl.append(b);
  }
  let ft = 0;
  host.querySelector('.at-search').addEventListener('input', ev => { clearTimeout(ft); ft = setTimeout(() => { filter = ev.target.value.trim().toLowerCase(); render(); }, 200); });
  host.querySelector('[data-publish-texts]').addEventListener('click', () => onPublish?.());
  render();
}
