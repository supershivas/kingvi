/* Publier les dessins retouchés pour tout le monde : un bouton du labo écrit
   les PNG (et `assets/design/index.json`) directement dans le dépôt GitHub, en
   UN seul commit sur `main`. GitHub Pages republie le site, et le jeu, partout,
   lit alors ces images à son lancement (design-store.js).

   Il faut un « jeton » GitHub (une clé personnelle, limitée à ce dépôt et au
   droit d'écrire son contenu), collé une fois dans le labo : il reste dans ce
   navigateur et ne part que vers api.github.com. Demandé et accepté par
   Jérôme : il ne veut pas passer par Claude pour publier. */
import { DESIGNS, rowsToPng, readLocal, setLocalDesign, markSent, readCustom, customDepotDefs, customDefs, setCustomDepot } from './designs.js?v=1.63.3';
import { readPlacements, writePlacements, placementsDepot, setPlacementsDepot, readTexts, writeTexts, textsDepot, setTextsDepot, setPublishedTimes, readTuning, writeTuning, tuningDepotGet, setTuningDepot, readExtras, writeExtras, extrasDepotGet, setExtrasDepot } from './design-store.js?v=1.63.3';

export const REPO = 'supershivas/kingvi', BRANCH = 'main';
export const TOKEN_KEY = 'kingvi:gh-token';
export const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
export const setToken = t => { try { t ? localStorage.setItem(TOKEN_KEY, t.trim()) : localStorage.removeItem(TOKEN_KEY); } catch { /* rien */ } };

// (l'adresse de l'API se change pour les essais : kingvi:gh-api)
const apiBase = () => { try { return localStorage.getItem('kingvi:gh-api') || 'https://api.github.com'; } catch { return 'https://api.github.com'; } };

async function gh(token, path, init = {}) {
  const res = await fetch(`${apiBase()}/repos/${REPO}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', ...(init.headers || {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 401) throw new Error('Jeton refusé par GitHub : il est faux ou expiré.');
  if (res.status === 403 || (res.status === 404 && init.method)) throw new Error('GitHub refuse l\'écriture : le jeton doit avoir le droit « Contents : Read and write » sur le dépôt supershivas/kingvi.');
  if (!res.ok && res.status !== 404) throw new Error(`GitHub a répondu ${res.status}.`);
  return res.status === 404 ? null : res.json();
}

const toBase64 = async blob => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

// Les dessins retouchés ici, à publier : { name, rows }
export function pending() {
  const local = readLocal();
  return DESIGNS.filter(d => local[d.name]?.length === d.h).map(d => ({ name: d.name, rows: local[d.name] }));
}

// Le catalogue des assets créés dans l'atelier a-t-il changé depuis le dépôt ?
const sameDefs = (a, b) => JSON.stringify([...a].sort((x, y) => x.id.localeCompare(y.id))) === JSON.stringify([...b].sort((x, y) => x.id.localeCompare(y.id)));
export const customChanged = () => !sameDefs(customDefs(), customDepotDefs());
// Les lieux déplacés sur la carte de l'atelier : le dépôt, plus ce qui est fait
// ici (null : revenir à la place du code) ; les clés triées, pour comparer
const mergePlaces = (remote, mine) => {
  const out = { ...remote };
  for (const [k, v] of Object.entries(mine)) if (v) out[k] = v; else delete out[k];
  return Object.fromEntries(Object.keys(out).sort().map(k => [k, out[k]]));
};
const samePlaces = (a, b) => JSON.stringify(mergePlaces(a, {})) === JSON.stringify(mergePlaces(b, {}));
// Les textes réécrits : même principe (null : revenir au texte du code)
export const textsChanged = () => !samePlaces(mergePlaces(textsDepot(), readTexts()), textsDepot());
// Les nombres du jeu réglés (tuning.json)
export const tuningChanged = () => !samePlaces(mergePlaces(tuningDepotGet(), readTuning()), tuningDepotGet());
// Les marges et les images de plus (extras.json : { pads, anims })
const mergeExtras = (remote, mine) => ({ pads: mergePlaces(remote.pads || {}, mine.pads || {}), anims: mergePlaces(remote.anims || {}, mine.anims || {}), props: mergePlaces(remote.props || {}, mine.props || {}) });
const sameExtras = (a, b) => JSON.stringify(mergeExtras(a, {})) === JSON.stringify(mergeExtras(b, {}));
export const extrasChanged = () => !sameExtras(mergeExtras(extrasDepotGet(), readExtras()), extrasDepotGet());
export const placementsChanged = () => !samePlaces(mergePlaces(placementsDepot(), readPlacements()), placementsDepot());

// Écrit tout d'un coup : les blobs, un arbre, un commit, puis avance `main`.
// `progress(texte)` : où l'on en est. Rend le nombre d'images publiées.
export async function publish(progress = () => {}) {
  const token = getToken();
  if (!token) throw new Error('Pas de jeton GitHub.');
  const items = pending();
  if (!items.length && !customChanged() && !placementsChanged() && !textsChanged() && !extrasChanged() && !tuningChanged()) throw new Error('Rien à publier : aucun dessin retouché, aucun lieu déplacé, aucun texte réécrit.');

  for (let attempt = 0; ; attempt++) {
    progress('Lecture du dépôt…');
    const ref = await gh(token, `/git/ref/heads/${BRANCH}`);
    if (!ref) throw new Error(`Branche ${BRANCH} introuvable.`);
    const head = ref.object.sha;
    const commit = await gh(token, `/git/commits/${head}`);

    // La liste des images déjà publiées, à compléter
    const idx = await gh(token, `/contents/assets/design/index.json?ref=${BRANCH}`);
    let names = [];
    try { names = idx ? JSON.parse(decodeURIComponent(escape(atob(idx.content.replace(/\n/g, ''))))) : []; } catch { names = []; }
    const all = [...new Set([...names, ...items.map(i => i.name)])].sort();

    const tree = [];
    // Le catalogue des assets créés : ce que le dépôt a déjà, plus ce qui est créé ici, moins ce qui est supprimé ici
    const cu = await gh(token, `/contents/assets/design/custom.json?ref=${BRANCH}`);
    let remote = [];
    try { remote = cu ? JSON.parse(decodeURIComponent(escape(atob(cu.content.replace(/\n/g, ''))))) : []; } catch { remote = []; }
    const local = readCustom(), byId = new Map(remote.map(d => [d.id, d]));
    for (const d of local.defs) byId.set(d.id, d);
    for (const id of local.deleted) byId.delete(id);
    const defs = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
    const defsChanged = !sameDefs(defs, remote);
    if (defsChanged) {
      const blobC = await gh(token, '/git/blobs', { method: 'POST', body: { content: JSON.stringify(defs, null, 2) + '\n', encoding: 'utf-8' } });
      tree.push({ path: 'assets/design/custom.json', mode: '100644', type: 'blob', sha: blobC.sha });
    }
    // Les lieux de l'île (la carte de l'atelier)
    const pl = await gh(token, `/contents/assets/design/placements.json?ref=${BRANCH}`);
    let remotePlaces = {};
    try { remotePlaces = pl ? JSON.parse(decodeURIComponent(escape(atob(pl.content.replace(/\n/g, ''))))) : {}; } catch { remotePlaces = {}; }
    const places = mergePlaces(remotePlaces, readPlacements());
    const placesChanged = !samePlaces(places, remotePlaces);
    if (placesChanged) {
      const blobP = await gh(token, '/git/blobs', { method: 'POST', body: { content: JSON.stringify(places, null, 2) + '\n', encoding: 'utf-8' } });
      tree.push({ path: 'assets/design/placements.json', mode: '100644', type: 'blob', sha: blobP.sha });
    }
    // Les nombres du jeu
    const tu = await gh(token, `/contents/assets/design/tuning.json?ref=${BRANCH}`);
    let remoteTu = {};
    try { remoteTu = tu ? JSON.parse(decodeURIComponent(escape(atob(tu.content.replace(/\n/g, ''))))) : {}; } catch { remoteTu = {}; }
    const tuning = mergePlaces(remoteTu, readTuning());
    const tuningMoved = !samePlaces(tuning, remoteTu);
    if (tuningMoved) {
      const blobU = await gh(token, '/git/blobs', { method: 'POST', body: { content: JSON.stringify(tuning, null, 2) + '\n', encoding: 'utf-8' } });
      tree.push({ path: 'assets/design/tuning.json', mode: '100644', type: 'blob', sha: blobU.sha });
    }
    // Les marges et les images de plus
    const ex = await gh(token, `/contents/assets/design/extras.json?ref=${BRANCH}`);
    let remoteEx = {};
    try { remoteEx = ex ? JSON.parse(decodeURIComponent(escape(atob(ex.content.replace(/\n/g, ''))))) : {}; } catch { remoteEx = {}; }
    const extras = mergeExtras(remoteEx, readExtras());
    const extrasMoved = !sameExtras(extras, remoteEx);
    if (extrasMoved) {
      const blobE = await gh(token, '/git/blobs', { method: 'POST', body: { content: JSON.stringify(extras, null, 2) + '\n', encoding: 'utf-8' } });
      tree.push({ path: 'assets/design/extras.json', mode: '100644', type: 'blob', sha: blobE.sha });
    }
    // Les textes réécrits
    const tx = await gh(token, `/contents/assets/design/texts.json?ref=${BRANCH}`);
    let remoteTexts = {};
    try { remoteTexts = tx ? JSON.parse(decodeURIComponent(escape(atob(tx.content.replace(/\n/g, ''))))) : {}; } catch { remoteTexts = {}; }
    const texts = mergePlaces(remoteTexts, readTexts());
    const textsMoved = !samePlaces(texts, remoteTexts);
    if (textsMoved) {
      const blobT = await gh(token, '/git/blobs', { method: 'POST', body: { content: JSON.stringify(texts, null, 2) + '\n', encoding: 'utf-8' } });
      tree.push({ path: 'assets/design/texts.json', mode: '100644', type: 'blob', sha: blobT.sha });
    }
    let n = 0;
    for (const it of items) {
      progress(`Envoi des images (${++n}/${items.length})…`);
      const blob = await gh(token, '/git/blobs', { method: 'POST', body: { content: await toBase64(await rowsToPng(it.rows)), encoding: 'base64' } });
      tree.push({ path: `assets/design/${it.name}.png`, mode: '100644', type: 'blob', sha: blob.sha });
    }
    // La date de publication de chaque dessin envoyé : une retouche plus vieille,
    // ailleurs, s'effacera devant lui (design-store.js, `loadDesigns`)
    let times = {};
    if (items.length) {
      const pt = await gh(token, `/contents/assets/design/published.json?ref=${BRANCH}`);
      try { times = pt ? JSON.parse(decodeURIComponent(escape(atob(pt.content.replace(/\n/g, ''))))) : {}; } catch { times = {}; }
      const now = Date.now();
      for (const it of items) times[it.name] = now;
      times = Object.fromEntries(Object.keys(times).sort().map(k => [k, times[k]]));
      const blobPt = await gh(token, '/git/blobs', { method: 'POST', body: { content: JSON.stringify(times, null, 2) + '\n', encoding: 'utf-8' } });
      tree.push({ path: 'assets/design/published.json', mode: '100644', type: 'blob', sha: blobPt.sha });
    }
    const index = await gh(token, '/git/blobs', { method: 'POST', body: { content: JSON.stringify(all, null, 2) + '\n', encoding: 'utf-8' } });
    tree.push({ path: 'assets/design/index.json', mode: '100644', type: 'blob', sha: index.sha });

    progress('Publication…');
    const newTree = await gh(token, '/git/trees', { method: 'POST', body: { base_tree: commit.tree.sha, tree } });
    const made = await gh(token, '/git/commits', {
      method: 'POST',
      body: { message: items.length ? `Publie ${items.length} dessin${items.length > 1 ? 's' : ''} depuis l'atelier` : (textsMoved ? 'Publie les textes réécrits depuis l\'atelier' : 'Publie les lieux déplacés depuis l\'atelier'), tree: newTree.sha, parents: [head] },
    });
    try {
      await gh(token, `/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: { sha: made.sha } });
      // Publié : ces dessins ne sont plus « à moi ». Ce navigateur suivra le dépôt (donc ce que
      // publient les autres appareils), en gardant un moment ce qu'il vient d'envoyer
      if (defsChanged) setCustomDepot(defs);
      if (placesChanged) { setPlacementsDepot(places); writePlacements({}); }
      if (textsMoved) { setTextsDepot(texts); writeTexts({}); }
      if (tuningMoved) { setTuningDepot(tuning); writeTuning({}); }
      if (extrasMoved) { setExtrasDepot(extras); writeExtras({ pads: {}, anims: {}, props: {} }); }
      if (items.length) setPublishedTimes(times);
      markSent(Object.fromEntries(items.map(i => [i.name, i.rows])));
      for (const it of items) setLocalDesign(it.name, null);
      return items.length;
    } catch (e) {
      // quelqu'un a poussé entre-temps : on recommence une fois sur la nouvelle pointe
      if (attempt >= 1) throw new Error('Le dépôt a changé pendant la publication : réessayez.');
    }
  }
}
