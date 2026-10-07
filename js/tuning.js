/* Les nombres du jeu, réglés dans l'atelier (v1.63.0, onglet Réglages). Les
   modules lisent `T.<clé>` au moment où ils s'en servent (pas une copie
   faite au chargement) : un réglage changé dans l'atelier passe dans le jeu
   ouvert. Les valeurs réglées : `assets/design/tuning.json` (publié) puis ce
   navigateur (`kingvi:tuning`) ; main.js les applique avant de lancer le jeu
   (`applyTuning`). Ce module n'importe rien : tout le monde peut le lire. */

// [clé, groupe, libellé, défaut, min, max, pas, unité, ce que ça change]
export const TUNING_DEFS = [
  ['kariVitesse', 'kari', 'Vitesse de marche', 18, 6, 60, 1, 'px/s', 'Les pixels du monde parcourus par seconde, en marchant.'],
  ['kariCourse', 'kari', 'Course (Maj)', 2.4, 1, 5, 0.1, '×', 'Combien de fois plus vite il court.'],
  ['kariPv', 'kari', 'Points de vie', 3, 1, 10, 1, 'coups', 'Combien de coups il encaisse (un de plus si Véla le garde).'],
  ['guerison', 'kari', 'Guérison hors combat', 25, 3, 120, 1, 's', 'Une blessure se referme toutes les … secondes, loin du combat.'],
  ['tourbillon', 'kari', 'Coup tourbillonnant', 2, 0.5, 5, 0.1, 's', 'Combien de temps tenir le bouton pour le coup tourbillonnant.'],

  ['autrePv', 'autre', 'Points de vie de l\'autre', 3, 1, 10, 1, 'coups', 'Combien de coups pour l\'abattre.'],
  ['autreVitesse', 'autre', 'Sa vitesse', 15, 5, 40, 1, 'px/s', 'À quelle allure il vient au contact.'],
  ['autreVue', 'autre', 'Il te voit à', 110, 40, 300, 5, 'px', 'La distance à laquelle il te voit venir et s\'avance.'],

  ['loups', 'loups', 'Nombre de loups', 3, 1, 6, 1, '', 'Combien sortent de la tanière.'],
  ['loupPv', 'loups', 'Points de vie d\'un loup', 2, 1, 6, 1, 'coups', 'Combien de coups pour en abattre un.'],
  ['loupGrogne', 'loups', 'Grognement avant le bond', 1.5, 0.3, 4, 0.1, 's', 'Le temps de voir venir le bond.'],
  ['loupEcart', 'loups', 'Entre deux bonds', 3.8, 1, 10, 0.1, 's', 'Combien de temps entre deux bonds (un peu plus quand il en reste peu).'],
  ['loupGalop', 'loups', 'Galop', 58, 20, 120, 1, 'px/s', 'Leur vitesse quand ils foncent.'],
  ['loupBond', 'loups', 'Élan du bond', 125, 60, 250, 5, 'px/s', 'La vitesse du bond.'],
  ['loupEpargne', 'loups', 'Épargné : ils tournent', 7, 2, 20, 1, 's', 'Si la louve est libre, combien de temps ils tournent avant de partir.'],

  ['feuToit', 'feu', 'Les flammes au toit', 8, 1, 60, 1, 's', 'Après le bûcher, quand le feu sort par le toit.'],
  ['feuToutEnFeu', 'feu', 'Le toit tout en feu', 30, 5, 120, 1, 's', 'Quand tout le toit brûle.'],
  ['feuEffondrement', 'feu', 'Le toit s\'effondre', 70, 10, 240, 1, 's', 'Quand il ne reste que la ruine.'],
  ['feuBraises', 'feu', 'Plus que des braises', 190, 30, 600, 5, 's', 'Quand les dernières flammes s\'éteignent.'],
  ['feuFumee', 'feu', 'La fumée blesse après', 14, 3, 60, 1, 's', 'Combien de temps on tient dans la pièce en feu.'],

  ['eclairTempete', 'monde', 'Éclairs dans la tempête', 150, 10, 600, 5, 's', 'Un éclair toutes les … secondes, en moyenne.'],
  ['eclairOrage', 'monde', 'Éclairs dans l\'orage', 11, 2, 120, 1, 's', 'Un éclair toutes les … secondes, en moyenne.'],
  ['chutePierres', 'monde', 'Pierres sur la sente', 5, 1.5, 30, 0.5, 's', 'Une pierre tombe du rebord toutes les … secondes, environ, quand on grimpe.'],
];
export const TUNING_GROUPS = [['kari', 'Kári'], ['autre', 'L\'autre viking'], ['loups', 'Les loups'], ['feu', 'L\'incendie'], ['monde', 'Le monde']];

// Les valeurs en cours (les défauts, puis ce qui est réglé)
export const T = Object.fromEntries(TUNING_DEFS.map(d => [d[0], d[3]]));
export const tuningDefault = key => TUNING_DEFS.find(d => d[0] === key)?.[3];

// Remet les défauts, puis écrit les valeurs réglées (bornées)
export function applyTuning(over = {}) {
  for (const [key, , , def, min, max] of TUNING_DEFS) {
    const v = Number(over[key]);
    T[key] = over[key] != null && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : def;
  }
}
