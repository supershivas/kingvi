/* L'atelier, onglet Carte (v1.59.0) : placer les lieux de l'île. On fait
   glisser un repère sur la carte ; la place est gardée dans ce navigateur
   (`kingvi:placements`) puis publiée avec les dessins
   (`assets/design/placements.json`). Le jeu les lit en construisant l'île
   (`placed` dans world.js) : il faut le relancer pour voir le changement.
   Un repère ne se pose que sur la terre (ni la mer ni le lac). */
import { designsReady, readPlacements, writePlacements, placementsDepot, placements } from './design-store.js?v=1.61.0';

const PAL = { s: '#dfe6ee', b: '#1f2a44', r: '#c0392b' };

export async function mountMap(host, { say = () => {}, onChange = () => {}, onPublish = null } = {}) {
  host.innerHTML = '<p class="design-note">Chargement de l\'île…</p>';
  await designsReady;
  // (le monde se construit ici, avec les placements déjà connus)
  const W = await import('./world.js?v=1.61.0');
  const M = await import('./map.js?v=1.61.0');
  const PLACES = [
    ['cube-blanc', 'Le cube blanc', W.SNO7_CUBES[0]],
    ['cube-noir', 'Le cube noir', W.SNO7_CUBES[1]],
    ['statue-ensevelie', 'Véla ensevelie', W.STATUE_BASE],
    ['statue-debout', 'La grande Véla', W.STATUE2_BASE],
    ['arche', 'L\'arche', W.ARCH],
    ['colonne', 'La colonne couchée', W.RUINS.colonne],
    ['socle', 'Le socle', W.RUINS.socle],
    ['ruine', 'L\'arche en ruine', W.RUINS.arche],
    ['bosquet', 'L\'arbre aux offrandes', W.GROVE_TREE],
    ['guetteur', 'Le guetteur', W.WATCHER_AT],
    ['louve', 'La louve blanche', W.HVIT_AT],
    ['meute', 'La tanière des loups', W.WOLF_DEN],
    ['sigrun', 'Sigrún dans la glace', W.SIGRUN_AT],
    ['pas-des-morts', 'Le pas des morts', W.PASSAGE_AT],
    ['mons', 'Le mons', W.MONS_AT],
  ];
  // (le monde a pu se construire avant que les placements publiés soient lus :
  // ceux-ci passent par-dessus)
  const known = placements();
  const pos = Object.fromEntries(PLACES.map(([id, , p]) => [id, { x: known[id]?.x ?? p.x, y: known[id]?.y ?? p.y }]));
  const moved = id => readPlacements()[id] !== undefined;

  host.innerHTML = `
    <div class="am">
      <div class="am-map">
        <div class="am-bar">
          <button type="button" class="design-btn" data-z="-1" aria-label="Dézoomer"><i class="ti ti-zoom-out" aria-hidden="true"></i></button>
          <button type="button" class="design-btn" data-z="1" aria-label="Zoomer"><i class="ti ti-zoom-in" aria-hidden="true"></i></button>
          <span class="dz-chip am-coords" role="status"></span>
          <span class="dz-spacer"></span>
          <button type="button" class="design-btn primary" data-publish-map><i class="ti ti-cloud-upload" aria-hidden="true"></i> Publier pour tous</button>
        </div>
        <div class="am-scroll"><div class="am-board"><canvas></canvas></div></div>
      </div>
      <aside class="am-list"><h3>Les lieux</h3><p class="design-note">Fais glisser un repère sur la carte. Relance le jeu pour voir le changement ; publie pour tout le monde.</p><ul></ul></aside>
    </div>`;
  const board = host.querySelector('.am-board'), cv = board.querySelector('canvas');
  const coordsEl = host.querySelector('.am-coords'), list = host.querySelector('.am-list ul');
  const N = M.MAP_N, S = W.WORLD / N;
  M.drawMap(cv, { seen: [1], cell: W.WORLD, n: 1, pos: null }, PAL);
  let k = Math.max(1, Math.floor(Math.min(host.clientWidth - 320, window.innerHeight - 220) / N)) || 1;
  const markers = new Map();
  let sel = null;

  const onLand = (x, y) => W.coast(x, y) < -0.02 && !W.inLake(x, y);
  function layout() {
    cv.style.width = `${N * k}px`; cv.style.height = `${N * k}px`;
    board.style.width = `${N * k}px`; board.style.height = `${N * k}px`;
    for (const [id, m] of markers) { m.style.left = `${pos[id].x / S * k}px`; m.style.top = `${pos[id].y / S * k}px`; }
    host.querySelector('[data-publish-map]').addEventListener('click', () => onPublish?.());
  host.querySelectorAll('[data-z]').forEach(b => { b.disabled = (+b.dataset.z < 0 && k <= 1) || (+b.dataset.z > 0 && k >= 6); });
  }
  function select(id, scroll = false) {
    sel = id;
    for (const [mid, m] of markers) m.classList.toggle('on', mid === id);
    for (const li of list.children) li.classList.toggle('on', li.dataset.id === id);
    if (scroll && markers.get(id)) markers.get(id).scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    showCoords(id);
  }
  const showCoords = id => { coordsEl.textContent = id ? `${PLACES.find(p => p[0] === id)[1]} : ${pos[id].x}, ${pos[id].y}` : ''; };
  function store(id, value) {
    const mine = readPlacements();
    if (value === undefined) delete mine[id]; else mine[id] = value;
    writePlacements(mine);
    renderList(); onChange();
  }

  for (const [id, label] of PLACES) {
    const m = document.createElement('button');
    m.type = 'button'; m.className = 'am-marker'; m.title = label; m.dataset.id = id;
    m.innerHTML = '<i></i><span></span>';
    m.querySelector('span').textContent = label;
    board.append(m);
    markers.set(id, m);
    m.addEventListener('pointerdown', e => {
      e.preventDefault(); m.setPointerCapture(e.pointerId); select(id);
      const r = board.getBoundingClientRect(), from = { ...pos[id] };
      const at = ev => ({ x: Math.round((ev.clientX - r.left) / k * S), y: Math.round((ev.clientY - r.top) / k * S) });
      const move = ev => { pos[id] = at(ev); m.classList.toggle('bad', !onLand(pos[id].x, pos[id].y)); layout(); showCoords(id); };
      const up = ev => {
        m.removeEventListener('pointermove', move); m.removeEventListener('pointerup', up); m.removeEventListener('pointercancel', up);
        m.classList.remove('bad');
        const to = at(ev);
        if (Math.hypot(to.x - from.x, to.y - from.y) < 3) { pos[id] = from; layout(); return; }
        if (!onLand(to.x, to.y)) { pos[id] = from; layout(); showCoords(id); say('Pas dans l\'eau : un lieu se pose sur la terre.'); return; }
        pos[id] = to; layout();
        store(id, to);
        say(`${label} déplacé. Relance le jeu pour le voir ; publie pour tout le monde.`);
      };
      m.addEventListener('pointermove', move); m.addEventListener('pointerup', up); m.addEventListener('pointercancel', up);
    });
  }

  function renderList() {
    const mine = readPlacements(), depot = placementsDepot();
    list.replaceChildren(...PLACES.map(([id, label]) => {
      const li = document.createElement('li');
      li.dataset.id = id; li.classList.toggle('on', id === sel);
      const state = id in mine ? (mine[id] ? 'déplacé ici' : 'remis à sa place ici') : depot[id] ? 'déplacé (publié)' : '';
      li.innerHTML = '<button type="button" class="am-name"></button><span class="dz-meta"></span>';
      li.querySelector('.am-name').textContent = label;
      li.querySelector('.dz-meta').textContent = state;
      li.querySelector('.am-name').addEventListener('click', () => select(id, true));
      if (moved(id) || depot[id]) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'design-btn quiet'; b.textContent = 'Remettre à sa place';
        b.addEventListener('click', () => {
          // (publié ailleurs : on note « à sa place » ; sinon on oublie simplement)
          store(id, depot[id] ? null : undefined);
          say(`${label} : remis à sa place d'origine.`);
          setTimeout(() => location.reload(), 600);       // (sa place d'origine se recalcule)
        });
        li.append(b);
      }
      return li;
    }));
  }
  host.querySelectorAll('[data-z]').forEach(b => b.addEventListener('click', () => { k = Math.max(1, Math.min(6, k + +b.dataset.z)); layout(); if (sel) select(sel, true); }));
  renderList(); layout();
}
