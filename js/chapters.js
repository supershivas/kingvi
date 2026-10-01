/* Les chapitres : aux grands moments de l'aventure, un titre s'inscrit à
   l'écran, « Chapitre III » en petit, « La forêt » en grand (la gothique du
   titre), puis s'efface. Chacun ne paraît qu'une fois par partie. Le lac est
   un détour : un interlude, sans numéro. Le jeu dit quand (game.js,
   `checkChapters`) ; ce module dit quoi et comment. */

export const CHAPTERS = [
  { id: 'greve', label: 'Chapitre I', title: 'La grève' },
  { id: 'morts', label: 'Chapitre II', title: 'La plaine des morts' },
  { id: 'foret', label: 'Chapitre III', title: 'La forêt' },
  { id: 'noire', label: 'Chapitre IV', title: 'La forêt noire' },
  { id: 'loups', label: 'Chapitre V', title: 'Les loups' },
  { id: 'maison', label: 'Chapitre VI', title: 'La maison' },
  { id: 'autre', label: 'Chapitre VII', title: 'L\'autre' },
  { id: 'falaise', label: 'Chapitre VIII', title: 'La falaise' },
  { id: 'roi', label: 'Chapitre IX', title: 'Le roi sous la roche' },
  { id: 'lac', label: 'Interlude', title: 'Le lac' },
];
export const chapterById = id => CHAPTERS.find(c => c.id === id);

// Affiche le chapitre dans `host` (un conteneur en position relative) :
// il monte, reste quelques secondes, s'efface. Rend une promesse.
export function showChapter(host, ch, { hold = 3800 } = {}) {
  host.querySelector('.chapter')?.remove();
  const el = document.createElement('div');
  el.className = 'chapter';
  el.setAttribute('role', 'status');
  el.innerHTML = '<span class="chapter-label"></span><span class="chapter-title"></span>';
  el.querySelector('.chapter-label').textContent = ch.label;
  el.querySelector('.chapter-title').textContent = ch.title;
  host.append(el);
  return new Promise(resolve => {
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => {
      el.classList.remove('in'); el.classList.add('out');
      setTimeout(() => { el.remove(); resolve(); }, 1600);
    }, 1400 + hold);
  });
}
