/* Ce qu'on voit quand on clique dessus (v1.57.0). Un titre et quelques
   phrases par chose ; on en tire une au hasard, accrochée à l'objet (le même
   rocher dit toujours la même chose). Le jeu trouve ce qui est sous le
   pointeur (game.js : `describeAt`) ; main.js l'affiche dans la bulle de
   neige des messages. Aucun nom réel : l'inspiration seulement. */

export const DESCRIPTIONS = {
  kari: { title: 'Kári', lines: ['Moi. La neige jusqu\'aux chevilles, une épée que je n\'aime pas sortir.', 'Le froid est entré sous la laine depuis longtemps.', 'Je suis ces traces. Je ne sais plus pourquoi je me suis mis à les suivre.'] },

  // ── La forêt ──
  tree: { title: 'Un sapin', lines: ['La neige lui pèse sur les branches. Il tient.', 'Il a poussé de travers, contre le vent.', 'L\'écorce est gelée, dure comme de la corne.', 'Un vieux sapin. Il en a vu passer d\'autres que moi.'] },
  'tree-small': { title: 'Un jeune sapin', lines: ['Pas plus haut que moi. Le vent le couche à chaque rafale.', 'Il tremble au moindre souffle.'] },
  'tree-dark': { title: 'La forêt noire', lines: ['Les arbres sont si serrés qu\'aucune neige ne touche le sol.', 'Pas un oiseau ici. Seulement le bois qui craque.', 'Des troncs, encore des troncs. Je ne vois pas le ciel.'] },
  'tree-fallen': { title: 'Un arbre abattu', lines: ['Je l\'ai couché. La neige le recouvre déjà.', 'Il ne se relèvera pas.'] },
  stump: { title: 'Une souche', lines: ['La coupe est encore claire. La sève gèle dessus.', 'Ce qui reste d\'un arbre que j\'ai couché.', 'Les cernes : plus qu\'il n\'y a d\'hivers dans ma vie.'] },
  ravine: { title: 'Le ravin', lines: ['Une fente dans l\'île, du nord au sud. On n\'en voit pas le fond.', 'Le froid monte de là, plus noir que la nuit.', 'Les traces s\'arrêtent au bord et reprennent en face.'] },
  tombe: { title: 'La tombe d\'Eyvind', lines: ['Trois pierres sur sa boucle, dans les cendres de la maison.', 'Ce qui reste de mon frère de lait. Au chaud, pour une fois.'] },
  grove: { title: 'L\'arbre aux offrandes', lines: ['Un arbre mort immense, chargé de petits paquets noués qui tournent au vent.', 'Quelqu\'un vient encore pendre des choses à ses branches.'] },
  bundle: { title: 'Une offrande', lines: ['Un paquet de chiffons noué de crin. Il tourne, il tourne.', 'Ce qu\'on donne pour ne pas être pris.'] },

  // ── La pierre ──
  boulder: { title: 'Un rocher', lines: ['Noir, taillé par le gel. Il était là avant l\'île.', 'La neige glisse sur ses pans sans s\'y poser.', 'Un bloc tombé d\'on ne sait où.', 'Ma lame y laisserait son fil.'] },
  cairn: { title: 'Un cairn', lines: ['Des pierres empilées de main d\'homme. Un repère, ou une tombe.', 'Quelqu\'un a voulu qu\'on ne passe pas ici sans le voir.'] },
  rubble: { title: 'Des éboulis', lines: ['Des pierres tombées de la falaise.', 'Le pied de la falaise en est jonché.'] },
  cliff: { title: 'La falaise', lines: ['Une paroi immense, face au sud. La neige n\'y tient pas.', 'Des pans avancent, d\'autres reculent. Une sente y monte en lacets.', 'Tout en haut, le vent ne s\'arrête jamais.'] },
  necro: { title: 'Une pierre levée', lines: ['Une des pierres du champ des morts. Elles dessinent des navires.', 'Le navire de pierres emmène les morts. Il n\'a jamais bougé.', 'Usée par le vent. On lit encore des entailles.'] },
  stone: { title: 'Une pierre', lines: ['Un éclat de la ruine, tombé là.', 'Une pierre taillée, puis oubliée.'] },
  chip: { title: 'Des éclats', lines: ['Ce qu\'il reste d\'un rocher que j\'ai brisé.'] },

  // ── Les ruines, les statues ──
  arche: { title: 'L\'arche', lines: ['Une porte de pierre seule, au milieu de rien. On passe dessous.', 'Personne ne sait ce qu\'elle fermait.'] },
  colonne: { title: 'La colonne couchée', lines: ['Une colonne tombée de tout son long. La neige l\'enterre.'] },
  socle: { title: 'Le socle', lines: ['Un socle sans statue. On peut monter dessus.', 'Ce qui était posé là est parti, ou tombé.'] },
  ruine: { title: 'L\'arche en ruine', lines: ['Il n\'en reste qu\'un pan, rongé.'] },
  pont: { title: 'Le ponton', lines: ['Des planches sur l\'eau noire du lac. La barque attend au bout.'] },
  'statue-ensevelie': { title: 'Véla ensevelie', lines: ['Une statue géante, penchée, brisée. La neige monte jusqu\'à sa poitrine.', 'Son visage regarde vers la mer.'] },
  'statue-debout': { title: 'La grande Véla', lines: ['Debout à la sortie de la forêt. Elle a vu passer ceux qui sont venus avant moi.', 'Immense. Je lui arrive à la cheville.'] },
  'statue-ilot': { title: 'La Véla de l\'îlot', lines: ['Plus petite que les autres. Une porte s\'ouvre dans sa robe.'] },
  fragment: { title: 'Un éclat de statue', lines: ['Un morceau de Véla, tombé dans la neige.'] },

  // ── La mer, la grève ──
  iceberg: { title: 'Un iceberg', lines: ['Plat, blanc, il dérive sans bruit.', 'La glace de quelque part au nord.'] },
  sea: { title: 'La mer', lines: ['Noire, lente, glacée. On n\'y survivrait pas longtemps.', 'Les vagues roulent jusqu\'à la grève et se retirent.'] },
  lake: { title: 'Le lac', lines: ['Une eau noire qui ne gèle pas. Un îlot au milieu.', 'Quelque chose dort au fond, peut-être.'] },
  boat: { title: 'Notre barque', lines: ['Celle qui nous a portés jusqu\'ici. Elle roule encore un peu.', 'Pousse-la vers la mer, et elle t\'emmène ailleurs.'] },
  boat2: { title: 'L\'autre barque', lines: ['Halée sur la grève, le mât nu. Le sillon de sa quille court jusqu\'à l\'eau.', 'Ils étaient deux. Je n\'en vois qu\'un.'] },
  rowboat: { title: 'La barque du lac', lines: ['Une petite barque à rames. Monte dedans pour traverser.'] },

  // ── Le sol ──
  snow: { title: 'La neige', lines: ['Tassée par le vent. Elle crisse sous le pas.', 'Rien que de la neige, jusqu\'au bord du monde.'] },
  'snow-calf': { title: 'La neige épaisse', lines: ['Elle monte aux mollets. Chaque pas coûte.'] },
  'snow-waist': { title: 'La neige profonde', lines: ['Jusqu\'à la taille. On y avance comme dans l\'eau.'] },
  trail: { title: 'Les traces', lines: ['Des pas dans la neige, vers l\'est. Je les suis.', 'Deux pistes côte à côte. Puis une seule.', 'Elles ne sont pas fraîches. Pas vieilles non plus.'] },
  forest: { title: 'Le sol de la forêt', lines: ['Des aiguilles, des racines, aucune neige.'] },

  // ── Les lieux, les intérieurs ──
  house: { title: 'La maison', lines: ['Vue de biais, sans fumée, sans lumière. Les traces entrent par la porte.', 'Quelqu\'un y vivait. Plus maintenant.'] },
  'house-burning': { title: 'La maison en feu', lines: ['Le toit flambe. La fumée part avec le vent.'] },
  'house-ruin': { title: 'La ruine', lines: ['Il ne reste que des murs bas, noircis, qui fument encore.'] },
  'room-house': { title: 'La pièce', lines: ['Noire tout autour. Un corps, du sang. Le silence.'] },
  'room-crypt': { title: 'La crypte', lines: ['Sous la statue, des dalles et des runes. Ça sent la pierre froide.'] },
  'room-cave': { title: 'La grotte', lines: ['La roche suinte. Il fait toujours nuit ici.'] },
  'room-temple': { title: 'Le temple', lines: ['Le mur des ans, hérissé de clous. Un par année.'] },
  'room-sno4': { title: 'Le carrefour', lines: ['Une autre île. D\'autres morts, d\'autres vivants.'] },
  chest: { title: 'Le coffre', lines: ['Un coffre de bois cerclé de fer, au fond de la crypte.'] },
  'chest-open': { title: 'Le coffre ouvert', lines: ['Vide, maintenant.'] },
  throne: { title: 'Le roi sous la roche', lines: ['Un squelette immense sur son trône. Il attend depuis plus longtemps que l\'île.', 'Sa couronne pèse encore sur ce qui reste de sa tête.'] },
  'throne-bowed': { title: 'Le roi incliné', lines: ['Sa tête est tombée. La couronne a roulé au pied de l\'estrade.'] },
  nail: { title: 'Le clou à l\'envers', lines: ['Le dernier clou du mur des ans, planté à l\'envers. Rouge.'] },
  'temple-slab': { title: 'La dalle', lines: ['Une dalle entre les piliers de l\'arche. Elle ne bouge pas.'] },
  'temple-stairs': { title: 'Les marches', lines: ['Elles descendent sous l\'arche, dans le noir.'] },
  ice: { title: 'La glace', lines: ['Une femme prise dans la glace. Ses yeux sont ouverts.'] },
  'ice-gone': { title: 'Une flaque', lines: ['La glace a fondu. Il ne reste qu\'une flaque.'] },
  'cube-blanc': { title: 'Le cube blanc', lines: ['Parfaitement droit. Tiède. La neige n\'y tient pas.', 'Rien d\'autre sur l\'île n\'a d\'angle aussi net.'] },
  'cube-noir': { title: 'Le cube noir', lines: ['Il ne renvoie aucun reflet, pas même le mien.', 'Froid. Parfaitement droit. Il n\'est pas d\'ici.'] },
  'falling-stone': { title: 'Une pierre', lines: ['Tombée du rebord de la falaise.'] },

  // ── Les vivants, les morts ──
  foe: { title: 'L\'autre', lines: ['Un viking, au bout des traces. Il m\'attend.', 'Il ne bouge pas. Il sait que je viens.'] },
  'foe-dead': { title: 'L\'autre, à terre', lines: ['Il ne se relèvera pas. Les corbeaux le savent déjà.'] },
  wolf: { title: 'Un loup', lines: ['Maigre, gris de neige. Il ne me quitte pas des yeux.'] },
  'wolf-dead': { title: 'Un loup mort', lines: ['Je l\'ai tué. La meute ne revient pas.'] },
  hvit: { title: 'Hvít, la louve blanche', lines: ['Blanche comme la neige, prise dans un collet.', 'Elle me regarde sans peur.'] },
  'hvit-free': { title: 'Hvít', lines: ['Libre. Elle ne m\'oubliera pas.'] },
  watcher: { title: 'Le guetteur', lines: ['Une grande silhouette encapuchonnée. Elle me regarde venir.'] },
  mons: { title: 'Le mons', lines: ['Une bête qui n\'est pas une bête. Il marche devant moi, sur les traces.', 'Il a un trou rouge à la place de l\'œil.', 'Il ne voit pas. Il sent les pas, dans la neige.'] },
  'mons-seeing': { title: 'Le mons', lines: ['Il me voit, maintenant. Il suit la braise de ma torche.', 'Son œil rouge brille dans le noir.'] },
  crow: { title: 'Un corbeau', lines: ['Noir, patient. Il attend qu\'on meure.'] },
  deer: { title: 'Un cerf', lines: ['Il lève la tête, puis s\'en va.'] },
};

// Un tirage stable : le même objet dit toujours la même chose
export function describe(kind, seed = 0) {
  const d = DESCRIPTIONS[kind];
  if (!d) return null;
  const i = Math.abs(Math.floor(seed * 2654435761) >>> 0) % d.lines.length;
  return { title: d.title, text: d.lines[i] };
}
