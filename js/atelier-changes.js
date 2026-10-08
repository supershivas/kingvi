/* L'atelier : ce qui a changé ici et n'est pas encore publié (v1.67.0). Une
   pastille dans la barre des onglets, visible partout (dessins, carte, textes,
   nombres) ; on la touche, la liste s'ouvre ; une ligne mène à l'élément, et
   « Publier pour tous » envoie tout d'un coup (designs-publish.js). */
import { DESIGNS, customDefs, customDepotDefs } from './designs.js?v=1.69.0';
import { pending } from './designs-publish.js?v=1.69.0';
import { readPlacements, placementsDepot, readTexts, textsDepot, readTuning, tuningDepotGet, readExtras, extrasDepotGet } from './design-store.js?v=1.69.0';
import { textEntries } from './texts.js?v=1.69.0';
import { TUNING_DEFS } from './tuning.js?v=1.69.0';

// Les lieux qu'on déplace sur la carte (atelier-map.js), et leur nom
export const PLACE_NAMES = {
  'cube-blanc': 'Le cube blanc', 'cube-noir': 'Le cube noir', 'statue-ensevelie': 'Véla ensevelie', 'statue-debout': 'La grande Véla',
  arche: 'L\'arche', colonne: 'La colonne couchée', socle: 'Le socle', ruine: 'L\'arche en ruine', bosquet: 'L\'arbre aux offrandes',
  guetteur: 'Le guetteur', louve: 'La louve blanche', meute: 'La tanière des loups', sigrun: 'Sigrún dans la glace',
  'pas-des-morts': 'Le pas des morts', mons: 'Le mons (là où il apparaît)',
};

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
// Les clés qui diffèrent entre ce navigateur et le dépôt (null ici : revenir au code)
const diffKeys = (mine, depot) => Object.keys(mine).filter(k => !same(mine[k], depot[k]));

// Le nom d'un dessin, d'une image d'animation, d'un asset créé
function designLabel(name) {
  const d = DESIGNS.find(x => x.name === name);
  if (d) return d.label;
  const id = name.replace(/^custom-/, '').replace(/-\d+$/, '');
  return customDefs().find(c => c.id === id)?.label || name;
}
// L'entrée à ouvrir dans l'onglet Dessins (la première image d'un asset créé)
function designTarget(name) {
  if (DESIGNS.some(x => x.name === name)) return name;
  return DESIGNS.find(x => x.name.startsWith(`${name}-`))?.name || name;
}

// Ce qui a changé : [{ tool, key, kind, label }]
export function listChanges() {
  const out = [];
  for (const { name } of pending()) out.push({ tool: 'dessins', key: name, kind: 'Dessin', label: designLabel(name) });
  const mine = customDefs(), depot = customDepotDefs();
  for (const d of mine) if (!depot.some(x => same(x, d))) out.push({ tool: 'dessins', key: designTarget(`custom-${d.id}`), kind: depot.some(x => x.id === d.id) ? 'Asset' : 'Nouvel asset', label: d.label });
  for (const d of depot) if (!mine.some(x => x.id === d.id)) out.push({ tool: 'dessins', key: null, kind: 'Asset supprimé', label: d.label });
  const ex = readExtras(), exDepot = extrasDepotGet();
  for (const [part, kind] of [['props', 'Dans le jeu'], ['pads', 'Canevas agrandi'], ['anims', 'Images ajoutées']]) {
    for (const k of diffKeys(ex[part] || {}, exDepot[part] || {})) out.push({ tool: 'dessins', key: designTarget(k), kind, label: designLabel(k) });
  }
  const objName = id => { const def = customDefs().find(d => d.id === id.split(':')[1]); return def ? `${def.label} (objet)` : id; };
  for (const k of diffKeys(readPlacements(), placementsDepot())) out.push({ tool: 'carte', key: k, kind: 'Carte', label: PLACE_NAMES[k] || objName(k) });
  const texts = textEntries();
  for (const k of diffKeys(readTexts(), textsDepot())) {
    const e = texts.find(x => x.key === k);
    out.push({ tool: 'textes', key: k, kind: 'Texte', label: e ? `${e.section} · ${e.label}` : k });
  }
  for (const k of diffKeys(readTuning(), tuningDepotGet())) out.push({ tool: 'nombres', key: k, kind: 'Nombre', label: TUNING_DEFS.find(t => t[0] === k)?.[2] || k });
  return out;
}

// La pastille et sa liste. `go(change)` : ouvrir l'élément ; `publish()` : tout envoyer
export function mountChanges(bar, { go, publish }) {
  const pill = document.createElement('button');
  pill.type = 'button'; pill.className = 'chg-pill';
  pill.setAttribute('aria-haspopup', 'true'); pill.setAttribute('aria-expanded', 'false');
  const panel = document.createElement('div');
  panel.className = 'chg-panel'; panel.hidden = true;
  panel.innerHTML = `
    <div class="chg-head"><b>À publier</b><button type="button" class="design-btn quiet" data-close aria-label="Fermer"><i class="ti ti-x" aria-hidden="true"></i></button></div>
    <p class="chg-note">Visible dans ce navigateur seulement, tant que ce n'est pas publié.</p>
    <ul class="chg-list"></ul>
    <button type="button" class="design-btn primary chg-publish"><i class="ti ti-cloud-upload" aria-hidden="true"></i> Publier pour tous</button>
    <p class="chg-status" role="status"></p>`;
  bar.append(pill);
  document.body.append(panel);
  const list = panel.querySelector('.chg-list'), statusEl = panel.querySelector('.chg-status');
  const open = on => {
    panel.hidden = !on; pill.setAttribute('aria-expanded', String(on));
    if (on) { const r = pill.getBoundingClientRect(); panel.style.top = `${r.bottom + 6}px`; }
  };
  pill.addEventListener('click', () => open(panel.hidden));
  panel.querySelector('[data-close]').addEventListener('click', () => open(false));
  document.addEventListener('pointerdown', e => { if (!panel.hidden && !panel.contains(e.target) && !pill.contains(e.target)) open(false); });
  panel.querySelector('.chg-publish').addEventListener('click', () => publish(t => { statusEl.textContent = t; }));

  function refresh() {
    const all = listChanges();
    pill.classList.toggle('warn', all.length > 0);
    pill.innerHTML = all.length
      ? `<i class="ti ti-cloud-upload" aria-hidden="true"></i> ${all.length} à publier`
      : '<i class="ti ti-cloud-check" aria-hidden="true"></i> Tout est publié';
    pill.title = all.length ? 'Ce qui a changé ici : touche pour voir et publier' : 'Rien à publier';
    list.replaceChildren(...all.map(c => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chg-item'; b.disabled = !c.key;
      b.innerHTML = '<span class="chg-kind"></span><span class="chg-label"></span><i class="ti ti-chevron-right" aria-hidden="true"></i>';
      b.querySelector('.chg-kind').textContent = c.kind;
      b.querySelector('.chg-label').textContent = c.label;
      b.addEventListener('click', () => { open(false); go(c); });
      li.append(b);
      return li;
    }));
    if (!all.length) list.innerHTML = '<li class="chg-empty">Tout est publié : le jeu est le même sur tous les appareils.</li>';
    panel.querySelector('.chg-publish').disabled = !all.length;
    return all.length;
  }
  refresh();
  return { refresh, say: t => { statusEl.textContent = t; }, open };
}
