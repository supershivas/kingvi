/* Les textes du jeu, réécrits dans l'atelier (v1.61.0, onglet Textes).
   Chaque texte a une clé stable (« desc.boulder.1 », « veut.mons.2 »…) et vit
   dans ses données d'origine (describe.js, saga.js, relics.js, chapters.js,
   story.js) : `applyTexts` y écrit les textes réécrits, sur place, après avoir
   remis ceux du code. main.js l'appelle avant de charger le jeu, et de
   nouveau quand l'atelier, dans un autre onglet, change un texte. */
import { DESCRIPTIONS } from './describe.js?v=1.62.0';
import { PEOPLE, SCENARIOS, speakerName } from './saga.js?v=1.62.0';
import { RELICS } from './relics.js?v=1.62.0';
import { CHAPTERS } from './chapters.js?v=1.62.0';
import { PROLOGUE, ENDINGS } from './story.js?v=1.62.0';

// Une entrée : { key, group, section, label, who, get, set } ; `original` : le texte du code
function build() {
  const out = [];
  const add = (group, section, key, label, obj, prop, who = null) => out.push({ group, section, key, label, who, get: () => obj[prop], set: v => { obj[prop] = v; } });

  PROLOGUE.forEach((_, i) => add('recit', 'Le prologue', `prologue.${i}`, `Ligne ${i + 1}`, PROLOGUE, i));
  for (const [id, lines] of Object.entries(ENDINGS)) lines.forEach((_, i) => add('recit', `La fin : ${id}`, `ending.${id}.${i}`, `Ligne ${i + 1}`, lines, i));
  for (const c of CHAPTERS) add('recit', 'Les chapitres', `chapter.${c.id}`, c.label, c, 'title');

  for (const [kind, d] of Object.entries(DESCRIPTIONS)) {
    add('descriptions', d.title, `desc.${kind}.title`, 'Titre', d, 'title');
    d.lines.forEach((_, i) => add('descriptions', d.title, `desc.${kind}.${i}`, `Phrase ${i + 1}`, d.lines, i));
  }

  for (const p of PEOPLE) {
    const v = p.veut, name = `${p.nom}${p.surnom ? `, ${p.surnom}` : ''}`;
    add('gens', name, `person.${p.id}.role`, 'Qui il est (clic droit)', p, 'role');
    if (!v) continue;
    if (v.voeu != null) add('gens', name, `voeu.${p.id}`, 'Son vœu (le carnet)', v, 'voeu');
    (v.lignes || []).forEach((_, i) => add('gens', name, `veut.${p.id}.${i}`, `Quand on lui parle, ${i + 1}`, v.lignes, i, p.id));
    if (v.don) v.don.lignes.forEach((l, i) => add('gens', name, `don.${p.id}.${i}`, `Quand on lui donne ${v.don.relique}, ${i + 1}`, l, 1, l[0]));
    [].concat(v.apres || []).forEach((a, k) => a.lignes.forEach((_, i) => add('gens', name, `apres.${p.id}.${k}.${i}`, `Après (${a.si}), ${i + 1}`, a.lignes, i, p.id)));
  }

  for (const r of RELICS) {
    add('reliques', r.name, `relic.${r.id}.name`, 'Nom', r, 'name');
    add('reliques', r.name, `relic.${r.id}.about`, 'Texte', r, 'about');
  }

  for (const sc of SCENARIOS) (sc.lignes || []).forEach((l, i) => {
    if (Array.isArray(l)) add('scenes', sc.titre || sc.id, `scene.${sc.id}.${i}`, `Réplique ${i + 1}`, l, 1, l[0]);
  });
  for (const e of out) e.original = e.get();
  return out;
}
let entries = null;
export function textEntries() { return (entries = entries || build()); }
export const TEXT_GROUPS = [
  ['recit', 'Prologue, fins, chapitres'],
  ['gens', 'Ce que disent les gens'],
  ['scenes', 'Scènes de la saga'],
  ['descriptions', 'Ce qu\'on voit (clic droit)'],
  ['reliques', 'Les reliques'],
];
export const whoName = id => (id ? speakerName(id) : '');

// Remet les textes du code, puis écrit ceux qui sont réécrits
export function applyTexts(over = {}) {
  for (const e of textEntries()) {
    const v = over[e.key];
    e.set(typeof v === 'string' && v.trim() ? v : e.original);
  }
}
