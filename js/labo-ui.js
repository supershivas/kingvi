/* Labo, onglet Interface : propositions (A actuel, B, C, D, E…) pour les
   boutons de l'écran d'accueil et pour le menu Réglages. Des maquettes en
   HTML, jouables (survol, curseurs, rubriques), mais qui ne règlent rien. */

const icon = name => `<i class="ti ti-${name}" aria-hidden="true"></i>`;

function card(section, { tag, title, about, html, stage = '' }) {
  const el = document.createElement('article');
  el.className = 'demo wide';
  el.innerHTML = `<h3><span class="tag">${tag}</span><span></span></h3><p></p><div class="ui-stage ${stage}">${html}</div>`;
  el.querySelector('h3 span:last-child').textContent = title;
  el.querySelector('p').textContent = about;
  document.querySelector(`#${section} .demos`).append(el);
  return el.querySelector('.ui-stage');
}

// « Nouveau jeu » : comme dans le jeu, un premier clic demande confirmation
function confirmable(stage) {
  for (const b of stage.querySelectorAll('[data-new]')) {
    const label = b.querySelector('span') || b;
    const text = label.textContent;
    let timer;
    b.addEventListener('click', () => {
      const armed = b.classList.toggle('confirm');
      label.textContent = armed ? 'Effacer la partie ?' : text;
      clearTimeout(timer);
      if (armed) timer = setTimeout(() => { b.classList.remove('confirm'); label.textContent = text; }, 3000);
    });
  }
}

// ══ Boutons de l'accueil ══
const BUTTONS = [
  {
    tag: 'A', cls: 'btnA', title: 'Actuel : les boutons du design system',
    about: 'Rouge plein pour Reprendre, cerclés clairs pour les autres, coins arrondis, Inter. Lisibles et communs à toutes les apps, mais étrangers au monde en pixels.',
    html: `<div class="ui-col">
      <button class="btn-primary" type="button">${icon('player-play')} Reprendre</button>
      <button class="btn-ghost" type="button" data-new>${icon('refresh')} <span>Nouveau jeu</span></button>
      <button class="btn-ghost" type="button">${icon('settings')} Réglages</button></div>`,
  },
  {
    tag: 'B', cls: 'btnB', title: 'Gothique nue',
    about: 'Le mot seul, dans la gothique du titre, sans cadre ni icône. Une petite lame en pixels (garde rouge, pointe de neige) désigne le choix, au survol comme au clavier. Le plus sobre : rien entre le nom et la mer.',
    html: `<div class="ui-col">
      <button type="button" class="on">Reprendre</button>
      <button type="button" data-new>Nouveau jeu</button>
      <button type="button">Réglages</button></div>`,
  },
  {
    tag: 'C', cls: 'btnC', title: 'Plaques de neige',
    about: 'Des blocs pleins aux coins grignotés en marches de pixels, chacun usé à sa façon, une ligne d\'ombre dessous. Reprendre en rouge. Au survol, la plaque passe en bleu nuit, cernée de neige. Le plus « jeu » des quatre.',
    html: `<div class="ui-col">
      <button type="button" class="primary">${icon('player-play')} Reprendre</button>
      <button type="button" data-new>${icon('refresh')} <span>Nouveau jeu</span></button>
      <button type="button">${icon('settings')} Réglages</button></div>`,
  },
  {
    tag: 'D', cls: 'btnD', title: 'Cadre tramé',
    about: 'Le fond reste la mer ; seul un cadre en damier d\'un pixel (la trame des ombres et de la nuit dans le jeu) dessine le bouton. Lettres mono espacées, icônes au trait. Le cadre de Reprendre, et celui qu\'on survole, est tramé de rouge.',
    html: `<div class="ui-col">
      <button type="button" class="primary">${icon('player-play')} Reprendre</button>
      <button type="button" data-new>${icon('refresh')} <span>Nouveau jeu</span></button>
      <button type="button">${icon('settings')} Réglages</button></div>`,
  },
  {
    tag: 'E', cls: 'btnE', title: 'Lambeaux de neige',
    about: 'Des bandes de neige déchirées, posées un peu de travers, le mot en gothique bleu nuit. Quelques gouttes de sang sur Reprendre. Rien de droit : le plus fidèle à « rien de géométrique ».',
    html: `<div class="ui-col">
      <button type="button" class="primary">Reprendre</button>
      <button type="button" data-new>Nouveau jeu</button>
      <button type="button">Réglages</button></div>`,
  },
];

for (const b of BUTTONS) {
  const stage = card('ui-boutons', { tag: b.tag, title: b.title, about: b.about, stage: b.cls,
    html: `<span class="ui-name">Kingvi Sno 7</span>${b.html}` });
  confirmable(stage);
}

// ══ Menu Réglages ══
const slider = (id, label, value, hint = '') => `<div class="set-row"><label for="${id}">${label}</label>
  <input id="${id}" type="range" min="0" max="100" step="5" value="${value}"/>${hint ? `<span class="hint-text">${hint}</span>` : ''}</div>`;
// Les crans de E : dix pierres, un clic ou un glissé règle le niveau
const notches = (label, value) => `<div class="set-row"><label>${label}</label>
  <div class="notches" role="slider" aria-label="${label}" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${value}" tabindex="0" data-value="${value}">${'<span></span>'.repeat(10)}</div></div>`;
const foot = () => `<div class="set-foot"><span class="version" data-version>v…</span><span>Dernières versions</span><span>${icon('download')} Exporter (JSON)</span></div>`;
const uid = (() => { let n = 0; return p => `ui-${p}-${n++}`; })();

const SETTINGS = [
  {
    tag: 'A', cls: 'setA', title: 'Actuel : la modale du design system',
    about: 'La boîte blanche commune à toutes les apps : Playfair pour le titre, Inter, curseurs du système en rouge, version et export en bas. Claire et connue, mais elle éteint l\'île d\'un coup.',
    html: () => `<div class="modal-box">
      <div class="modal-head"><h2>Réglages</h2><button class="icon-btn icon-only on-light" type="button" aria-label="Fermer">${icon('x')}</button></div>
      <button class="btn-ghost" type="button" data-new>${icon('refresh')} <span>Nouveau jeu</span></button>
      ${slider(uid('a'), 'Musique', 70)}${slider(uid('a'), 'Bruitages (corbeaux, épée…)', 80)}${slider(uid('a'), 'Son du vent', 60)}
      ${slider(uid('a'), 'Qualité de l\'image : équilibrée', 65)}
      <button class="btn-ghost" type="button">${icon('anchor')} Revenir à la barque</button>
      ${foot()}</div>`,
  },
  {
    tag: 'B', cls: 'setB', title: 'Carnet de neige',
    about: 'Une page claire cernée d\'un trait de pixels qui marche en escalier vers le bas à droite (l\'ombre du carnet). Titres en gothique, libellés mono, curseurs en pixels : piste tramée, poignée bleu nuit, partie remplie rouge (sous Firefox).',
    html: () => `<div class="set-panel">
      <div class="set-head"><span class="set-title">Réglages</span><button class="set-close" type="button" aria-label="Fermer">${icon('x')}</button></div>
      <h4>Le son</h4>${slider(uid('b'), 'Musique', 70)}${slider(uid('b'), 'Bruitages', 80)}${slider(uid('b'), 'Vent', 60)}
      <h4>L'image</h4>${slider(uid('b'), 'Qualité · équilibrée', 65, 'CRT et flou de maquette')}
      <h4>La partie</h4><div class="set-row"><span>1 284 pas dans la neige</span></div>
      ${foot()}</div>`,
  },
  {
    tag: 'C', cls: 'setC', title: 'Tiroir de nuit',
    about: 'Un pan bleu nuit glisse depuis la droite ; le jeu, en pause, reste visible à gauche. Bord en pointillés de neige, rubriques en mono rouge, curseurs clairs. Les actions (nouveau jeu, barque, labo) sont des liens, pas des boutons cerclés.',
    html: () => `<div class="set-panel">
      <div class="set-head"><span class="set-title">Réglages</span><button class="set-close" type="button" aria-label="Fermer">${icon('x')}</button></div>
      <h4>Son</h4>${slider(uid('c'), 'Musique', 70)}${slider(uid('c'), 'Bruitages', 80)}${slider(uid('c'), 'Vent', 60)}
      <h4>Image</h4>${slider(uid('c'), 'Qualité · équilibrée', 65)}
      <h4>Partie</h4>
      <button class="set-link" type="button" data-new>${icon('refresh')} <span>Nouveau jeu</span></button>
      <button class="set-link" type="button">${icon('anchor')} Revenir à la barque</button>
      <button class="set-link" type="button">${icon('flask')} Labo d'animations</button>
      ${foot()}</div>`,
  },
  {
    tag: 'D', cls: 'setD', title: 'Pause plein écran',
    about: 'Pas de boîte : la nuit couvre le jeu, comme un menu de pause. À gauche les rubriques en gothique (Son, Image, Monde, Partie), à droite celle qui est ouverte. Un trait rouge en pixels marque la rubrique. Chaque écran est court, rien ne défile.',
    html: () => `<div class="set-cols">
      <nav aria-label="Rubriques">
        <button type="button" class="on" data-pane="son">Son</button>
        <button type="button" data-pane="image">Image</button>
        <button type="button" data-pane="monde">Monde</button>
        <button type="button" data-pane="partie">Partie</button>
      </nav>
      <div>
        <div class="set-pane" data-pane="son">${slider(uid('d'), 'Musique', 70)}${slider(uid('d'), 'Bruitages', 80)}${slider(uid('d'), 'Vent', 60)}</div>
        <div class="set-pane" data-pane="image" hidden>${slider(uid('d'), 'Qualité · équilibrée', 65, 'CRT, flou de maquette')}</div>
        <div class="set-pane" data-pane="monde" hidden>
          <div class="set-row"><label>Météo</label><div class="set-chips">
            <button type="button" class="on">Le cycle</button><button type="button">Calme</button><button type="button">Bise</button><button type="button">Tempête</button></div></div>
          ${slider(uid('d'), 'Moment de la journée', 40, 'Suit l\'heure réelle')}</div>
        <div class="set-pane" data-pane="partie" hidden>
          <button class="set-link" type="button" data-new>${icon('refresh')} <span>Nouveau jeu</span></button>
          <button class="set-link" type="button">${icon('anchor')} Revenir à la barque</button>
          <button class="set-link" type="button">${icon('flask')} Labo d'animations</button>
          ${foot()}</div>
      </div></div>`,
  },
  {
    tag: 'E', cls: 'setE', title: 'Pierre rongée',
    about: 'Une dalle claire aux bords cassés, dans un cadre tramé. Les niveaux se règlent par crans, dix pierres de hauteurs inégales (clic ou glissé, flèches au clavier) ; le dernier cran est rouge. Les actions sont de petites plaques bleu nuit écornées.',
    html: () => `<div class="set-slab"><div class="set-panel">
      <div class="set-head"><span class="set-title">Réglages</span><button class="set-close" type="button" aria-label="Fermer">${icon('x')}</button></div>
      ${notches('Musique', 7)}${notches('Bruitages', 8)}${notches('Vent', 6)}${notches('Qualité · équilibrée', 7)}
      <div class="set-actions">
        <button type="button" data-new>${icon('refresh')} <span>Nouveau jeu</span></button>
        <button type="button">${icon('anchor')} À la barque</button></div>
      ${foot()}</div></div>`,
  },
];

for (const s of SETTINGS) {
  const stage = card('ui-reglages', { tag: s.tag, title: s.title, about: s.about, stage: `set-stage ${s.cls}`, html: s.html() });
  confirmable(stage);
}

// D : les rubriques
for (const stage of document.querySelectorAll('.setD')) {
  const tabs = [...stage.querySelectorAll('nav button')];
  for (const t of tabs) t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.toggle('on', x === t));
    stage.querySelectorAll('.set-pane').forEach(p => { p.hidden = p.dataset.pane !== t.dataset.pane; });
  });
  for (const group of stage.querySelectorAll('.set-chips')) {
    group.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) group.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    });
  }
}

// E : les crans
for (const el of document.querySelectorAll('.notches')) {
  const cells = [...el.children];
  const set = v => {
    v = Math.max(0, Math.min(10, v));
    el.dataset.value = v; el.setAttribute('aria-valuenow', v);
    cells.forEach((c, i) => { c.classList.toggle('on', i < v); c.classList.toggle('tip', i === v - 1); });
  };
  const pick = e => {
    const r = el.getBoundingClientRect();
    set(Math.ceil(((e.clientX - r.left) / r.width) * 10));
  };
  el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); pick(e); });
  el.addEventListener('pointermove', e => { if (el.hasPointerCapture(e.pointerId)) pick(e); });
  el.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (d) { e.preventDefault(); set(+el.dataset.value + d); }
  });
  set(+el.dataset.value);
}

// La version, comme dans le vrai menu
fetch('version.json', { cache: 'no-store' }).then(r => r.json()).then(({ version }) => {
  document.querySelectorAll('[data-version]').forEach(el => { el.textContent = `v${version}`; });
}).catch(() => { /* la maquette s'en passe */ });
