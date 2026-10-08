/* La saga de KINGVI SNO 7 : la bible du récit, en données.
   Familles, personnages (arbres sur quatre générations et plus), lieux,
   scénarios avec leurs lignes de dialogue, fins. Lu par le labo (onglet
   « La saga », labo-saga.js) ; le jeu n'en lit encore rien.
   Le second monde (SNO 4, un culte des esprits venu du sud) est dans saga-sno4.js : ajouté
   ici au reste.

   Règle (Jérôme, v1.46.0) : les personnages peuvent parler. Les lignes sont
   courtes, rares, et ne racontent jamais l'histoire à la place du paysage.

   Années : comptées en hivers avant aujourd'hui (−26 : il y a 26 hivers).
   Aujourd'hui, la nuit dure depuis 19 hivers. */

import { BIBLE_SNO4, FAMILIES_SNO4, PEOPLE_SNO4, PLACES_SNO4, SCENARIOS_SNO4, VOICES_SNO4 } from './saga-sno4.js?v=1.66.0';

// ── La bible : les pages qu'on lit avant tout ──
export const BIBLE = [
  {
    id: 'intention',
    titre: 'Ce que raconte la saga',
    texte: [
      `Kári revient sur le continent où il est né et qu'il ne connaît pas. Il a vingt-six hivers. On l'a mis à la mer dans un panier, le jour de sa naissance, parce qu'un devin avait lu dans un foie de bronze que « le fils de Kingvi rallumera le jour ». Son père, le roi Kingvi, ne voulait pas que le jour revienne.`,
      `Car sur SNO 7 il fait nuit depuis dix-neuf hivers. Quand son plus jeune fils est mort, Kingvi a pris le marteau des Orsènes, le peuple d'avant, et il a planté le dernier clou de Sorne, la déesse du sort, à l'envers, dans le cœur de l'année. Le temps s'est arrêté sur le continent. Personne n'y vieillit plus vraiment, rien n'y pousse plus, et la tempête ne cesse pas. Le roi lui-même attend sur son trône, sous la roche, ni mort ni vivant.`,
      `Kári n'est pas venu seul. Eyvind, son frère de lait, l'homme sauvage qu'une louve blanche a élevé, a débarqué avant lui. Le cousin Thorgrim l'attendait sur la grève. Il l'a conduit jusqu'à la maison de la nourrice et l'a tué dans le noir, en le prenant pour Kári. Ce sont les deux pistes qui partent de la grève : une seule ressort, tachée de sang.`,
      `Le reste est la saga : ce que Kári fera du clou, de la couronne, de sa sœur changée en glace, de la nièce qu'il ne connaît pas, et de la peur de mourir qui a gelé son père.`,
    ],
  },
  {
    id: 'parole',
    titre: 'La règle de la parole',
    texte: [
      `Les personnages parlent. Ils parlent peu. Une rencontre, c'est trois à huit lignes, rarement plus. Une ligne fait douze mots au plus, et deux lignes à l'écran au plus.`,
      `Personne n'explique l'histoire. On parle comme on parle dans le froid : pour l'essentiel, de travers, avec des silences. Le paysage reste le premier narrateur. Une ligne doit ajouter ce que les traces ne peuvent pas dire (un nom, un regret, une menace), jamais répéter ce qu'on voit.`,
      `Kári parle peu, et presque toujours en dernier. Les morts parlent : c'est la magie du continent, où le temps arrêté retient les voix. Les dieux parlent encore moins que les morts. Les bêtes ne parlent pas, sauf la louve blanche, qui est une fylgja et pas une bête.`,
      `Aucun choix de réplique. Le joueur répond par des gestes : frapper, épargner, partir, rester, prendre, laisser. Le texte avance seul, au rythme de la lecture (un clic l'accélère), et le monde ne s'arrête pas pendant qu'on parle, sauf dans les intérieurs.`,
      `Les lignes s'affichent dans un phylactère (propositions dans « Phylactères »). Langue : un français simple et sec, sans archaïsme de théâtre. Les noms nordiques gardent leurs accents (Kári, Ása, Sigrún), et les noms orsènes leur dureté (Larth, Ramtha, Thanchvil).`,
    ],
  },
  {
    id: 'monde',
    titre: 'Le monde : l\'Archipel des Neuf',
    texte: [
      `SNO 7 n'est pas une île : c'est le continent, la grande terre dont l'Archipel des Neuf n'est que la frange, sur une mer qui gèle à moitié. On compte les neuf terres d'est en ouest, comme on comptait les mondes autour de l'Arbre ; le continent est la septième.`,
      `SNO 3 est l'île des pêcheurs, où Kári a grandi, où Ingunn l'attend et où va naître leur enfant. SNO 8 est l'île de la Brasseuse : Sidrún y tient une taverne au bord du monde, et c'est la dernière île où l'on trouve de la bière. SNO 9 est l'île du Survivant, derrière les Eaux de la Mort, qu'aucun vivant n'a traversées sans le passeur. SNO 4 est l'île Carrefour, où se croisent les routes de la mer et celles des morts : un navire venu de Morne-Aurore s'y est pris dans la glace il y a cent dix hivers, avec ses esprits (le second monde de la saga). Les autres îles sont des noms dans les chansons d'Ásdís.`,
      `Sur SNO 7 vivent trois peuples, morts ou presque. Les Orsènes, venus du sud en suivant les oiseaux, ont bâti l'arche, le temple de Sorne et les Véla, qu'ils appelaient Ilé. Les gens de Hrólf, venus du nord avec trois navires, sont enterrés dans la plaine. Les géants du froid, enfin, sont la montagne, le glacier et la neige elle-même.`,
      `Le continent est plus grand que ce qu'on en a vu. Au nord de la plaine se trouve le hameau des Gunnar. Au-delà du plateau, une montagne est un géant qui dort. Sous le lac, une flotte est prise dans la glace. Derrière le trône, une fissure monte jusqu'à une racine trop grande pour l'écran.`,
    ],
  },
  {
    id: 'magie',
    titre: 'La magie',
    texte: [
      `Trois magies se croisent, et aucune n'est gratuite.`,
      `Le seiðr, la magie de Véla et des völvas, voit et lie, au prix de soi. Hallveig y a laissé son visage. Le joueur en voit les effets : le guetteur qui s'efface, les pas qui s'arrêtent net, les rêves.`,
      `Le galdr, ce sont les runes chantées. Kári peut en apprendre trois, une par grande rencontre. Kenaz rallume la torche soufflée. Isa fige l'eau et la neige (marcher sur le lac, arrêter une avalanche de pierres). Ansuz fait parler un mort une fois de plus. Chaque rune chantée coûte une blessure, qui saigne comme un coup reçu.`,
      `La disciplina des Orsènes, c'est lire le sort dans un foie, dans la foudre, dans le vol des oiseaux. Elle ne change rien, elle annonce. Larth lit le foie des loups abattus, Tavé parle par énigmes, et le clou de Sorne fixe ce qui est lu.`,
      `Et il y a la grande magie, celle qu'on ne fait qu'une fois : le clou planté à l'envers. Elle a arrêté le temps d'un continent entier. La saga, c'est la question de l'arracher ou non.`,
    ],
  },
  {
    id: 'cubes',
    titre: 'Le cube blanc et le cube noir',
    texte: [
      `Sur chaque île de l'archipel, il y a deux cubes : un blanc et un noir, toujours loin l'un de l'autre. Ce sont les deux seules choses parfaitement droites du monde. Ni la pierre, ni la glace, ni les mains n'ont jamais rien fait d'aussi droit. Ils mesurent presque deux fois un homme. La neige ne tient pas dessus.`,
      `Personne ne sait qui les a posés. Les Orsènes les comptaient déjà parmi les choses d'avant, et n'y plantaient pas de clou. Les gens de Hrólf les ont contournés sans y toucher. Sur SNO 4, on dit que les esprits ne s'en approchent pas : ce qui est trop droit ne laisse pas de place pour passer.`,
      `Le blanc est tiède. Qui le touche voit ses blessures se fermer sans rien sentir. Le noir ne renvoie aucun reflet, pas même le sien ; qui le touche voit le continent d'en haut, un instant, comme un oiseau ou comme un mort. Larth disait que le blanc garde ce qui a été et que le noir montre ce qui est ; il n'a jamais dit qui montrerait ce qui vient.`,
    ],
  },
  {
    id: 'mythes',
    titre: 'Les trois sources sous la neige',
    texte: [
      `Le roi et le sauvage : Kári et Eyvind se sont battus trois jours avant de devenir frères, et la mort de l'un jette l'autre dans la peur de mourir. Kingvi a fait le même chemin avant son fils et s'y est perdu. Hvumbi garde la forêt noire. Les deux Karrog gardent la porte du soleil, dans la falaise. Sidrún la Brasseuse tient la taverne au bord du monde, Úrsi passe les Eaux de la Mort, Útnafi le Survivant ne meurt pas ; la fleur de givre rend la jeunesse, et un serpent la vole.`,
      `Les Orsènes : les Orsènes lisent les foies (Larth et son foie de bronze). Tavé naît d'un sillon avec un visage de vieillard. Sorne est la déesse dont on plantait un clou chaque année. Vaïne, la femme ailée à la torche, vient à chaque mort, et Karrog garde les portes avec son marteau. Fersel est l'homme masqué du jeu mortel, Ilé la déesse que les vikings ont appelée Véla. Les Orsènes savaient que leur peuple n'avait qu'un nombre compté de siècles.`,
      `Le Nord : l'hiver sans fin, c'est la nuit perpétuelle du jeu. On y croise la völva, les fylgjur, les draugar dans les navires de pierres, la Chasse sauvage et son Chasseur borgne, les corbeaux, les géants du froid, Ormgard, et les Fileuses qui filent au pied de l'Arbre.`,
    ],
  },
  {
    id: 'partie',
    titre: 'Une partie, une saga',
    texte: [
      `Chaque partie a la même colonne vertébrale (la grève, la maison, l'autre, le roi). Elle tire ensuite, avec la graine du continent, quatre scénarios parmi les « souvent » et un parmi les « rares », et une fin parmi quatre selon ce que Kári a fait.`,
      `Tavé, l'enfant au visage de vieillard, assis dans l'arche, annonce les scénarios tirés en trois énigmes. Le joueur entend la partie avant de la vivre, sans la comprendre.`,
      `Les fins sont l'Aube (arracher le clou), le Roi sous la roche (s'asseoir à la place du père), la Mer (brûler Eyvind sur l'eau et rentrer à SNO 3) et le Bout du monde (passer les Eaux de la Mort jusqu'au Survivant). Une fin vécue reste vraie dans les parties suivantes, d'une manière ou d'une autre. Si Kári s'est assis sur le trône, c'est lui qui attend sous la roche la fois suivante.`,
    ],
  },
  {
    id: 'chronologie',
    titre: 'Chronologie',
    liste: [
      ['il y a des siècles', 'Les Orsènes arrivent du sud en suivant les oiseaux. Ils bâtissent l\'arche, le temple de Sorne, et plantent un clou par an dans son mur.'],
      ['−900 hivers', 'Le Grand Givre, le premier hiver sans fin. Útnafi le sauve dans son navire. Les dieux lui donnent de ne pas mourir.'],
      ['−150', 'Naissance d\'Arnth Velkar, le dernier bâtisseur des Orsènes.'],
      ['−95', 'Naissance de Ramtha, petite-fille d\'Arnth.'],
      ['−90', 'Aule, son frère, n\'est pas encore muré.'],
      ['−78', 'Hrólf Barbe-de-Givre débarque avec trois navires. Guerre d\'un hiver. Aule se mure dans la crypte du lac avec les livres de la foudre.'],
      ['−77', 'Paix : Hrólf épouse Ramtha.'],
      ['−75', 'Naissance de Kingvi.'],
      ['−72', 'Naissance de Thorbrand, fils de Hrólf et de Lysa, la neige.'],
      ['−55', 'Mort de Hrólf. On lui dresse le grand navire de pierres de la plaine.'],
      ['−48', 'Hallveig la völva arrive du nord sur la glace et épouse Kingvi.'],
      ['−40', 'Mort de Larth le devin, qui laisse sa dernière lecture : « le fils de Kingvi rallumera le jour ».'],
      ['−35', 'Naissance de Thorgrim, fils de Thorbrand.'],
      ['−30', 'Naissance de Sigrún.'],
      ['−26', 'Naissance de Kári. Le jour même, Hallveig et la nourrice Thordís le mettent à la mer dans un panier. Il dérive jusqu\'à SNO 3.'],
      ['−25', 'Naissance de Hjalti.'],
      ['−19', 'Hjalti meurt de la fièvre, à six ans. Kingvi plante le dernier clou à l\'envers. La nuit commence. Egil et la flotte des Gunnar sont pris dans le lac qui gèle d\'un coup.'],
      ['−18', 'Hallveig donne son visage à Véla pour voir où est son fils. Elle devient le guetteur.'],
      ['−12', 'Thorbrand se perd dans la Chasse sauvage.'],
      ['−9', 'Thorgrim prend Sigrún de force pour avoir le sang du roi.'],
      ['−8', 'Naissance d\'Ása.'],
      ['−7', 'Sigrún s\'enfuit et monte voler la torche de Vaïne pour rallumer le jour. Vaïne la fige dans la glace, la torche à la main. Les Gunnar quittent le continent, Ása refuse de partir.'],
      ['−5', 'Sur SNO 3, Kári se bat trois jours contre l\'homme sauvage Eyvind. Ils deviennent frères.'],
      ['−1', 'Kári épouse Ingunn.'],
      ['0', 'Le rêve envoyé par Hallveig appelle Kári. Eyvind part le premier. Thorgrim l\'attend sur la grève.'],
    ],
  },
];

// ── Les familles ──
export const FAMILIES = [
  { id: 'kingvi', nom: 'La maison de Kingvi', devise: 'Ce qui est à nous ne finit pas.', about: 'La lignée royale de SNO 7, née de la paix entre Hrólf le conquérant et Ramtha des Orsènes. Elle a le sang des deux peuples, et celui de la neige par la branche cadette.' },
  { id: 'rasna', nom: 'Les Orsènes', devise: 'Le sort est écrit ; on peut le lire.', about: 'Ceux d\'avant, venus du sud. Bâtisseurs, devins, sculpteurs. Ils savaient que leur peuple avait un nombre compté de siècles et les ont comptés, clou après clou.' },
  { id: 'gunnar', nom: 'Les Gunnar', devise: 'On rame.', about: 'Pêcheurs et passeurs du hameau du nord. Ils ont nourri les enfants des rois et n\'en ont rien eu. Ils descendent, sans le savoir, du Survivant.' },
  { id: 'utnafi', nom: 'La maison du Survivant', devise: 'Rien ne dure, sauf nous, et ce n\'est pas un cadeau.', about: 'Útnafi, qui a survécu au Grand Givre, et les siens, au bout du monde. La plus vieille histoire du monde, sous la neige.' },
  { id: 'jotnar', nom: 'Les géants du froid', devise: '…', about: 'La montagne, le glacier, la neige, la forêt. Ils ne parlent qu\'en dormant, ou quand on les réveille. La branche cadette des rois descend d\'eux.' },
  { id: 'puissances', nom: 'Les puissances', devise: '', about: 'Ceux qui ne meurent pas et n\'ont pas de famille : les dieux des deux peuples, les gardiens, les bêtes qui ne sont pas des bêtes.' },
];

// ── Les personnages ──
// gen : génération dans l'arbre (1 = la plus ancienne de la famille).
// parents, conjoints, lait (frères et sœurs de lait, adoption) : des id.
// statut : vivant, mort, mort-vivant, immortel, a-naitre, disparu.
// sprite : de quoi construire son dessin (people.js), toujours d'après le héros.
// lignes : quelques répliques typiques (les scénarios en ont d'autres).
export const PEOPLE = [
  // ══ La maison de Kingvi ══
  {
    id: 'hrolf', nom: 'Hrólf', surnom: 'Barbe-de-Givre', famille: 'kingvi', gen: 1, sexe: 'm',
    conjoints: ['ramtha', 'mjoll'], statut: 'mort-vivant', vie: '−120 – −55',
    role: 'Le conquérant. Draugr dans le grand navire de pierres.',
    lieu: 'La plaine des morts', magie: 'Aucune, de son vivant. Mort, il ne pourrit pas.',
    sprite: { corps: 'geant', tete: 'casque', objet: 'hache', echelle: 2 },
    voix: 'Fort, lent, content de lui. Il dit « nous » pour parler de lui-même.',
    bio: [
      `Il est venu du nord avec trois navires, trois cents hommes et une hache qui avait un nom (personne ne s'en souvient : il le disait trop souvent). Il a fait la guerre aux Orsènes pendant un hiver entier, sans la gagner. Alors il a demandé en mariage la petite-fille du devin. Ramtha a dit oui, en posant une condition qu'il n'a pas comprise : « Tu ne toucheras jamais au mur des clous. »`,
      `Il a tenu parole. Il a aussi aimé Lysa, la neige, qui venait le voir les nuits de tempête sous la forme d'une femme blanche, et il en a eu un fils, Thorbrand, que Ramtha a élevé sans un mot.`,
      `On l'a couché dans le grand navire de pierres de la plaine, avec sa hache. Il n'y dort pas bien. Les nuits où le vent tombe, il se redresse et regarde vers la mer.`,
    ],
    lignes: ['Qui foule mon navire ?', 'Nous avons pris cette île avec trois bateaux. Toi, tu as une barque.'],
  },
  {
    id: 'kingvi', nom: 'Kingvi', surnom: 'le Roi sous la roche', famille: 'kingvi', gen: 2, sexe: 'm',
    parents: ['hrolf', 'ramtha'], conjoints: ['hallveig'], statut: 'mort-vivant', vie: '−75 –',
    role: 'Le roi qui a arrêté le temps. Sur son trône, dans la grotte.',
    lieu: 'La grotte sous la falaise', magie: 'Il a planté le clou de Sorne à l\'envers. Il ne peut plus mourir, ni se lever.',
    sprite: { corps: 'geant', tete: 'couronne', echelle: 3 },
    voix: 'Très bas, très doux, comme quelqu\'un qui a eu le temps de choisir chaque mot. Jamais en colère.',
    bio: [
      `On disait de lui qu'il était fait pour deux tiers de neige et pour un tiers d'homme. Il était plus grand que tout le monde, plus fort, plus beau, et il le savait. Jeune, il a gouverné comme on chasse : vite, et pour lui. Il a pris les filles des autres, il a fait marcher les hommes jusqu'au glacier pour en ramener la glace la plus claire, il a fait bâtir sur le continent une salle plus haute que l'arche des Orsènes.`,
      `Hallveig l'a changé, un temps. Puis Larth, son grand-père, a lu dans le foie de bronze que son fils « rallumerait le jour », et Kingvi a eu peur pour la première fois. Il a laissé Hallveig mettre leur fils nouveau-né à la mer sans la retenir. Il s'est dit que c'était pour protéger l'enfant. C'était pour se protéger de lui.`,
      `Quand Hjalti, le petit, est mort de la fièvre à six ans, Kingvi a passé sept jours et sept nuits près du corps, jusqu'à ce qu'il le voie changer. Alors il a eu peur de mourir comme on a peur du noir, sans pouvoir rien faire d'autre. Il est descendu au temple de Sorne, il a pris le marteau des Orsènes et il a planté le dernier clou à l'envers, la pointe vers l'année qui venait.`,
      `Le temps s'est arrêté sur SNO 7. La nuit est venue et n'est pas repartie. Kingvi s'est assis sur son trône, sous la roche, pour attendre que la peur passe. Elle n'est pas passée. Sa couronne est devenue trop lourde pour sa tête. Il est là depuis dix-neuf hivers et il aime toujours ceux qu'il a perdus.`,
    ],
    lignes: ['Ton frère est mort sans vieillir. N\'est-ce pas ce que nous voulions tous ?', 'Arrache-le, si tu veux. Moi, je n\'ai pas pu.'],
  },
  {
    id: 'hallveig', nom: 'Hallveig', surnom: 'la völva, le guetteur', famille: 'kingvi', gen: 2, sexe: 'f',
    conjoints: ['kingvi'], statut: 'vivant', vie: '−70 –', origine: 'Du nord, sur la glace',
    role: 'La mère de Kári. La grande silhouette encapuchonnée qui s\'efface.',
    lieu: 'Partout où Kári passe', magie: 'Seiðr. Elle a donné son visage à Véla pour voir de loin. On ne la voit plus de près.',
    sprite: { corps: 'femme', tete: 'haute-capuche', objet: 'baton', echelle: 2 },
    voix: 'Elle ne dit presque rien, et jamais en face. Des phrases d\'un mot, ou des questions.',
    bio: [
      `Elle est arrivée du nord en marchant sur la mer gelée, seule, avec un bâton de fer et un sac de plumes. Les gens de Hrólf ont voulu la renvoyer. Kingvi l'a regardée et l'a épousée la semaine suivante.`,
      `Elle a eu trois enfants. Elle a mis le deuxième à la mer pour le sauver du premier homme qu'elle aimait. Elle a vu mourir le troisième. Elle a vu l'aînée partir vers la falaise et ne pas revenir sous sa forme.`,
      `Pour savoir où dérivait son fils, elle a fait le seiðr le plus long que la völva du continent ait jamais fait, et Véla lui a pris son visage en paiement. Depuis, on ne la voit plus que de loin : quand on approche, il n'y a rien sous la capuche, alors elle s'efface. Elle suit les traces des autres et ne laisse les siennes qu'à moitié.`,
      `C'est elle qui a envoyé le rêve qui a ramené Kári. Elle ne sait pas si elle a bien fait.`,
    ],
    lignes: ['Pas encore.', 'Tu as ses épaules.', 'Va.'],
  },
  {
    id: 'thorbrand', nom: 'Thorbrand', surnom: 'Fils-de-Neige', famille: 'kingvi', gen: 2, sexe: 'm',
    parents: ['hrolf', 'mjoll'], conjoints: ['gudrun'], statut: 'disparu', vie: '−72 – −12',
    role: 'Le bâtard à demi jötunn, père de Thorgrim. Perdu dans la Chasse sauvage.',
    lieu: 'Le rivage nord', magie: 'Il n\'avait jamais froid.',
    sprite: { corps: 'geant', tete: 'casque', objet: 'lance', echelle: 2 },
    voix: 'Rauque, amer, drôle quand il a bu.',
    bio: [
      `Fils de Hrólf et de Lysa, la neige, il est né une nuit de tempête, déjà chaud, déjà lourd. Ramtha l'a élevé avec Kingvi comme s'il était à elle. Kingvi l'a toujours appelé « mon petit frère de neige » devant tout le monde.`,
      `Il a reçu le rivage nord et le droit de s'asseoir à la droite du roi, pas plus. Il a épousé Gudrun, la fille du passeur, parce qu'elle riait de lui sans méchanceté.`,
      `Quand la nuit est venue, il a été le seul à ne pas avoir froid, et à aimer ça. Une nuit de Chasse sauvage, il est sorti pour la regarder passer. Il a couru derrière, en riant. Il n'est pas revenu. Certains disent qu'il chevauche dans la Chasse.`,
    ],
    lignes: ['Je chevauche à droite du Chasseur, maintenant. Comme toujours : à droite.'],
  },
  {
    id: 'asdis', nom: 'Ásdís', surnom: 'la Skáld', famille: 'kingvi', gen: 2, sexe: 'f',
    parents: ['hrolf', 'ramtha'], statut: 'vivant', vie: '−70 –',
    role: 'La sœur de Kingvi, poétesse. Les chapitres du jeu sont ses vers.',
    lieu: 'SNO 8, à la taverne de Sidrún', magie: 'Elle sait les noms. Un nom chanté par elle ne s\'oublie plus.',
    sprite: { corps: 'vieille', tete: 'voile', objet: 'baton' },
    voix: 'Elle chante plus qu\'elle ne parle. Des phrases courtes avec un rythme.',
    bio: [
      `Elle a quitté le continent à vingt ans pour chanter ailleurs ce qu'on y faisait. Elle n'est jamais revenue, mais elle sait tout : les oiseaux, les marins et les morts lui racontent.`,
      `On la retrouve vieille à SNO 8, assise près du feu de Sidrún. Chaque soir, elle chante la saga de son neveu un peu plus loin que la veille, comme si elle la lisait dans les flammes. Les titres des chapitres qui s'inscrivent dans le ciel du jeu sont ses vers.`,
    ],
    lignes: ['Chapitre sept, l\'Autre. Je l\'ai chanté avant que tu le vives, petit.', 'Assieds-toi. Je n\'ai pas encore trouvé ta fin.'],
  },
  {
    id: 'gudrun', nom: 'Gudrun', surnom: 'la Rieuse', famille: 'gunnar', gen: 2, sexe: 'f',
    parents: ['gunnar', 'sidrun'], conjoints: ['thorbrand'], statut: 'mort', vie: '−58 – −20',
    role: 'Fille du passeur, femme de Thorbrand, mère de Thorgrim.',
    lieu: 'Le rivage nord', magie: 'Un peu du sang du Survivant : elle a vieilli lentement.',
    sprite: { corps: 'femme', tete: 'tresses' },
    voix: 'Morte, elle ne parle qu\'à son fils, dans les rêves.',
    bio: [
      `Elle riait de tout, même de Thorbrand, surtout de lui. Elle est morte l'hiver avant la nuit, d'un mauvais enfantement. L'enfant n'a pas vécu. Thorgrim avait quinze ans. C'est depuis ce jour-là qu'il ne rit plus.`,
    ],
    lignes: [],
  },
  {
    id: 'sigrun', nom: 'Sigrún', surnom: 'la Femme de glace', famille: 'kingvi', gen: 3, sexe: 'f',
    parents: ['kingvi', 'hallveig'], conjoints: ['thorgrim'], statut: 'mort-vivant', vie: '−30 –',
    role: 'La sœur aînée de Kári, figée dans la glace sur le plateau, une torche éteinte à la main.',
    lieu: 'Le plateau, en haut de la falaise', magie: 'Vaïne l\'a figée. La glace pleure quand une flamme approche.',
    sprite: { corps: 'femme', tete: 'tresses', objet: 'torche' },
    voix: 'Une voix prise dans la glace, qui ne parle que quand une flamme la fait fondre un peu. Calme, amère, tendre pour sa fille.',
    bio: [
      `L'aînée, celle qui aurait dû régner. Elle avait onze ans quand la nuit est tombée, et elle n'a jamais pardonné à son père. Elle a grandi dans le noir en apprenant à faire du feu avec n'importe quoi.`,
      `Thorgrim l'a prise de force pour avoir le sang du roi et le droit au trône. Elle a eu Ása, et un an plus tard elle est partie. Elle est montée sur la falaise, là où passe Vaïne, la femme ailée qui vient chercher les morts avec sa torche, et elle a essayé de lui voler sa torche pour rallumer le jour sur le continent.`,
      `Vaïne l'a laissée prendre la torche, puis l'a figée : « Puisque tu veux la lumière, tiens-la. » Sigrún est debout sur le plateau, dans un bloc de glace claire, le bras levé, la torche éteinte au poing. Le vent a sculpté la glace autour d'elle.`,
      `Quand une flamme approche, la glace pleure et Sigrún peut parler un peu. Si Kári allume sa torche à la sienne, la glace fond d'un coup : Vaïne vient la prendre, enfin.`,
    ],
    lignes: ['Kári… ? Approche ta flamme. Pas trop.', 'J\'ai voulu ramener la lumière.', 'Ása. Dis-lui que je cherchais du feu.'],
  },
  {
    id: 'kari', nom: 'Kári', surnom: 'le Viking, le héros', famille: 'kingvi', gen: 3, sexe: 'm',
    parents: ['kingvi', 'hallveig'], conjoints: ['ingunn'], lait: ['eyvind', 'ragna'], statut: 'vivant', vie: '−26 –',
    role: 'Le viking qu\'on joue.',
    lieu: 'Il arrive par la grève ouest', magie: 'Aucune au départ. Il peut apprendre trois runes chantées.',
    sprite: { corps: 'homme', tete: 'casque' },
    voix: 'Laconique. Des phrases de trois mots. Il répond souvent par une question, ou pas du tout.',
    bio: [
      `Né un jour de grande marée, mis à la mer le soir même dans un panier calfaté de poix, entre une couverture et le peigne de sa mère. La nourrice Thordís a poussé le panier, Hallveig a chanté pour que le courant le prenne. Il a dérivé trois jours jusqu'à SNO 3, où un pêcheur qui n'avait pas d'enfant l'a trouvé dans ses filets.`,
      `Il a grandi sans savoir qu'il était fils de roi. Il était plus fort que les autres et n'aimait pas qu'on le lui dise. À vingt et un ans, il est allé dans la forêt de SNO 3 pour tuer « l'homme sauvage » qui volait les moutons. Ils se sont battus trois jours. Le troisième soir, ils ont ri ensemble. Eyvind est devenu son frère.`,
      `Il a épousé Ingunn l'hiver dernier. Elle porte leur enfant. Puis le rêve est venu : une femme sans visage, debout dans la neige, qui disait « Viens. » Eyvind a fait le même rêve, mais avec une louve. Eyvind est parti le premier, parce qu'il ne savait pas attendre.`,
      `Kári arrive deux jours après lui. Il trouve deux pistes sur la grève.`,
    ],
    lignes: ['Eyvind ?', 'Je suis venu chercher quelqu\'un.', 'Non.'],
  },
  {
    id: 'hjalti', nom: 'Hjalti', surnom: 'le Petit', famille: 'kingvi', gen: 3, sexe: 'm',
    parents: ['kingvi', 'hallveig'], statut: 'mort', vie: '−25 – −19',
    role: 'Le petit frère, mort à six ans. Sa poupée pend à l\'arbre sacré.',
    lieu: 'Le bosquet sacré', magie: 'Son fantôme n\'a pas grandi.',
    sprite: { corps: 'enfant', tete: 'nue' },
    voix: 'Une voix d\'enfant, curieuse, jamais triste.',
    bio: [
      `Né un an après Kári, il ne l'a jamais connu. Il demandait souvent pourquoi on mettait une assiette de plus à la fête de l'hiver. Il est mort de la fièvre au printemps de ses six ans, et son père n'a pas supporté de le voir changer.`,
      `Hallveig a pendu sa poupée à l'arbre mort du bosquet, au milieu de la forêt noire, avec les offrandes des autres mères. Son fantôme joue autour. Il attend son grand frère, celui qui reviendrait par la mer.`,
    ],
    lignes: ['Tu es mon frère ? Maman disait que tu reviendrais par la mer.', 'Papa a eu peur. Toi aussi, tu as peur ?'],
  },
  {
    id: 'thorgrim', nom: 'Thorgrim', surnom: 'l\'Autre', famille: 'kingvi', gen: 3, sexe: 'm',
    parents: ['thorbrand', 'gudrun'], conjoints: ['sigrun', 'svala'], statut: 'vivant', vie: '−35 –',
    role: 'Le cousin, l\'autre viking au bout des traces. Il a tué Eyvind en le prenant pour Kári.',
    lieu: 'Au bout des traces', magie: 'Le froid ne le mord pas. Il frappe comme une avalanche.',
    sprite: { corps: 'homme', tete: 'casque', objet: 'hache', large: true },
    voix: 'Calme, direct, presque poli. Il ne ment pas. Il ne s\'excuse pas.',
    bio: [
      `Petit-fils de la neige par son père et du Survivant par sa mère, il est plus lourd et plus froid que tous. On l'a appelé « le bâtard du bâtard » jusqu'à ce qu'il soit assez grand pour qu'on arrête.`,
      `Il a deux raisons, et il ne sait plus laquelle est vraie. La couronne d'abord : la dernière lecture de Larth disait aussi que « celui qui arrachera le clou prendra la couronne ». Il a pris Sigrún de force pour avoir le sang du roi. Elle a refusé de toucher au clou pour lui, et elle est partie.`,
      `La peur ensuite. Il croit que le jour réveillera Ísgrim, le géant de la montagne, son arrière-grand-père, et que le géant noiera le continent en se levant. Il garde la nuit comme on garde une porte.`,
      `Quand il a appris par les corbeaux que le fils de Kingvi revenait, il a attendu sur la grève. Un homme est arrivé seul dans une barque mâtée. Thorgrim lui a dit : « Je suis ton cousin. Viens, la nourrice t'attend. » Dans la maison noire, il a frappé. En voyant le visage, il a su qu'il s'était trompé : c'était un sauvage aux dents de loup, pas un fils de roi. Il est sorti, il a marché vers l'est, et il attend le bon.`,
      `Il aime sa fille Ása, qui ne veut pas le voir.`,
    ],
    lignes: ['Ainsi c\'était toi. J\'ai tué le mauvais frère.', 'Le trône à celui qui reste debout.', 'Ása… elle est au hameau. Ne lui dis pas qui je…'],
  },
  {
    id: 'svala', nom: 'Svala', surnom: 'la Servante', famille: 'kingvi', gen: 3, sexe: 'f',
    conjoints: ['thorgrim'], statut: 'vivant', vie: '−34 –', origine: 'SNO 8',
    role: 'Servante de la taverne de Sidrún, mère de Bersi.',
    lieu: 'SNO 8', magie: 'Aucune.',
    sprite: { corps: 'femme', tete: 'voile' },
    voix: 'Méfiante, fatiguée.',
    bio: [`Thorgrim est passé à SNO 8 une seule fois, à dix-neuf ans. Il est reparti avant de savoir qu'il serait père. Elle a élevé Bersi en lui parlant d'un héros. Elle sait que ce n'en est pas un.`],
    lignes: ['Ton père ? Un homme qui ne revient pas.'],
  },
  {
    id: 'yrsa', nom: 'Yrsa', surnom: 'la Chasseresse', famille: 'kingvi', gen: 3, sexe: 'f',
    parents: ['thorbrand', 'gudrun'], statut: 'disparu', vie: '−31 –',
    role: 'La sœur de Thorgrim, partie chercher son père dans la Chasse sauvage.',
    lieu: 'Dans la Chasse sauvage', magie: 'Elle court plus vite que les chevaux des morts.',
    sprite: { corps: 'femme', tete: 'capuche', objet: 'lance' },
    voix: 'Essoufflée, joyeuse, cruelle.',
    bio: [`Elle a suivi son père dans la Chasse, par amour ou par envie. Elle passe parfois en tête des cavaliers, les cheveux pris dans le givre, et elle crie le nom de son frère.`],
    lignes: ['Thorgrim ! Il est là-bas, il te cherche !', 'Ne cours pas, cousin. Ils n\'aiment que ceux qui courent.'],
  },
  {
    id: 'eyvind', nom: 'Eyvind', surnom: 'Fils-de-Louve', famille: 'kingvi', gen: 3, sexe: 'm',
    lait: ['kari'], statut: 'mort', vie: '−27 – 0',
    role: 'Le compagnon, le frère de lait de Kári. Le corps dans la maison.',
    lieu: 'La maison de la nourrice', magie: 'Élevé par une fylgja : il parlait aux bêtes. Son fantôme parle encore aux loups.',
    sprite: { corps: 'homme', tete: 'nue', objet: 'baton' },
    voix: 'Il rit avant de parler. Il dit les choses comme elles sont, sans précaution.',
    bio: [
      `Personne ne sait d'où il vient. La louve blanche Hvít l'a trouvé nouveau-né, ou fait naître, sur SNO 3, dans la forêt la plus proche de l'enfant qu'elle devait garder. Il a grandi avec les loups, mangé avec eux, couru avec eux. Il est devenu un homme sans savoir qu'il en était un.`,
      `Kári est venu le tuer. Ils se sont battus trois jours, jusqu'à ne plus pouvoir lever les bras. Le soir du troisième jour, Eyvind a dit : « Tu frappes comme un frère. » Ils ne se sont plus quittés.`,
      `La nuit avant le départ, il a rêvé d'une maison de terre où les morts mangent de la poussière, et il l'a raconté en riant. Il est parti le premier.`,
      `Sur la grève, un homme l'a appelé « Kári ». Il a répondu « oui », parce que c'était plus court qu'expliquer. Il est mort dans la maison de Thordís, dans le noir. Sa boucle de ceinture porte le même motif que l'anneau de Thorgrim, parce qu'il l'a reçue de Kári, qui la tenait de sa mère.`,
    ],
    lignes: ['Il m\'a appelé par ton nom. J\'ai dit oui. C\'était plus court.', 'Là-dessous, frère, ils mangent de la poussière. Brûle-moi.'],
  },
  {
    id: 'ingunn', nom: 'Ingunn', surnom: 'de SNO 3', famille: 'kingvi', gen: 3, sexe: 'f',
    conjoints: ['kari'], statut: 'vivant', vie: '−24 –', origine: 'SNO 3',
    role: 'La femme de Kári, qui l\'attend. Elle porte leur enfant.',
    lieu: 'SNO 3', magie: 'Aucune. Elle tisse des voiles.',
    sprite: { corps: 'femme', tete: 'tresses', objet: 'fuseau' },
    voix: 'Franche, pratique, tendre sans le dire.',
    bio: [`Elle tisse les voiles des pêcheurs de SNO 3. Elle a dit à Kári de partir, parce qu'un homme qui rêve de sa mère toutes les nuits n'est bon à rien. Elle ne lui a pas dit pour l'enfant. Elle le lui dira s'il revient.`],
    lignes: ['Tu as mis le temps.', 'Il s\'appellera comme le jour où tu es revenu.'],
  },
  {
    id: 'asa', nom: 'Ása', surnom: 'l\'Enfant du hameau', famille: 'kingvi', gen: 4, sexe: 'f',
    parents: ['thorgrim', 'sigrun'], statut: 'vivant', vie: '−8 –',
    role: 'La nièce de Kári. Les petits pas dans la neige.',
    lieu: 'Le hameau des Gunnar', magie: 'Elle voit le guetteur de près sans qu\'il s\'efface.',
    sprite: { corps: 'enfant', tete: 'capuche', accent: 'echarpe' },
    voix: 'Vive, sérieuse, elle pose des questions qui n\'ont pas de réponse.',
    bio: [
      `Elle a huit ans et n'a jamais vu le jour. Quand les Gunnar ont fui le continent, elle a refusé de monter dans la barque, parce que sa mère « allait revenir avec du feu ». Elle vit seule dans le hameau, dans le cellier de la grande maison, avec la louve blanche qui dort contre elle.`,
      `Elle a appris à reconnaître les traces de tout ce qui marche sur le continent. Elle suit Kári de loin depuis la grève. Ses petits pas apparaissent à côté des siens quand il ne regarde pas.`,
      `Elle porte une écharpe rouge que sa mère a teinte avec on ne sait quoi. C'est la seule chose du continent qui ait cette couleur sans être du sang.`,
    ],
    lignes: ['Tu suis les traces, toi aussi ?', 'Ma mère cherche du feu. Tu en as ?', 'Il fera jour comment ?'],
  },
  {
    id: 'bersi', nom: 'Bersi', surnom: 'le Fils', famille: 'kingvi', gen: 4, sexe: 'm',
    parents: ['thorgrim', 'svala'], statut: 'vivant', vie: '−16 –',
    role: 'Le fils de Thorgrim, qui viendra le venger, sur une autre île.',
    lieu: 'SNO 8, puis à la poursuite de Kári', magie: 'Aucune. Une colère qui tient chaud.',
    sprite: { corps: 'ado', tete: 'casque', objet: 'lance' },
    voix: 'Trop fort. Il a répété ses phrases.',
    bio: [`Seize ans, une lance trop longue pour lui. Il a grandi avec l'histoire d'un père héros, et il apprendra dans une taverne qu'un homme de SNO 3 l'a tué. Il traversera toutes les îles pour le trouver, et il le trouvera dans une partie suivante.`],
    lignes: ['Tu as tué mon père. J\'ai fait trois îles pour te le dire.', 'Ne me laisse pas gagner.'],
  },
  {
    id: 'enfant', nom: 'L\'enfant', surnom: 'Dagr ou Nótt', famille: 'kingvi', gen: 4, sexe: 'x',
    parents: ['kari', 'ingunn'], statut: 'a-naitre', vie: 'à naître',
    role: 'L\'enfant de Kári et d\'Ingunn. Son nom dépend de la fin.',
    lieu: 'SNO 3', magie: '—',
    sprite: { corps: 'bebe' },
    voix: '—',
    bio: [`Il naîtra si Kári rentre. Il s'appellera Dagr, « jour », si Kári a arraché le clou, et Nótt, « nuit », sinon. Au début d'une nouvelle partie, son nom est gravé sur la proue de la barque.`],
    lignes: [],
  },

  // ══ Les Orsènes ══
  {
    id: 'arnth', nom: 'Arnth Velkar', surnom: 'le Bâtisseur', famille: 'rasna', gen: 1, sexe: 'm',
    conjoints: ['thanchvil'], statut: 'mort', vie: '−150 – −85',
    role: 'Le dernier bâtisseur des Orsènes. Il a relevé l\'arche.',
    lieu: 'L\'arche', magie: 'Il savait où les pierres veulent tenir.',
    sprite: { corps: 'vieux', tete: 'bonnet', objet: 'baton' },
    voix: 'Mort, il ne parle qu\'à travers les pierres : des mots gravés qui apparaissent sous la neige.',
    bio: [
      `Les Orsènes étaient sur le continent depuis des siècles quand il est né, mais ils n'étaient plus que quelques familles. Il a passé sa vie à relever ce que le gel faisait tomber : l'arche, le socle à degrés, le mur du temple où l'on plantait un clou par an.`,
      `Il a compté les clous. Il en restait neuf avant le dernier siècle des Orsènes. Il ne l'a dit qu'à sa femme.`,
    ],
    lignes: ['ICI LE MUR DES ANS. UN CLOU PAR HIVER. NE PAS PLANTER À REBOURS.'],
  },
  {
    id: 'thanchvil', nom: 'Thanchvil', surnom: 'la Prêtresse d\'Ilé', famille: 'rasna', gen: 1, sexe: 'f',
    conjoints: ['arnth'], statut: 'mort', vie: '−145 – −90',
    role: 'Prêtresse d\'Ilé, celle que les vikings appelleront Véla.',
    lieu: 'Le temple', magie: 'Elle lisait le vol des oiseaux.',
    sprite: { corps: 'femme', tete: 'voile', objet: 'baton' },
    voix: '—',
    bio: [`C'est elle qui a voulu les grandes statues. Ilé a le visage de sa mère. Quand les vikings sont arrivés, ils ont reconnu Véla dans les statues et les ont laissées debout. Thanchvil a appelé ça « la ruse d'Ilé ».`],
    lignes: [],
  },
  {
    id: 'larth', nom: 'Larth', surnom: 'le Devin, l\'Haruspice', famille: 'rasna', gen: 2, sexe: 'm',
    parents: ['arnth', 'thanchvil'], conjoints: ['fasti'], statut: 'mort-vivant', vie: '−120 – −40',
    role: 'Le devin qui lisait les foies. Il a prédit le retour du jour.',
    lieu: 'Il revient près des bêtes mortes', magie: 'La disciplina : il lit le sort dans le foie d\'une bête. Son foie de bronze a seize cases, une par dieu.',
    sprite: { corps: 'vieux', tete: 'bonnet', objet: 'foie' },
    voix: 'Précis, comme un comptable. Il donne des nombres.',
    bio: [
      `Il a lu dans des foies de mouton pendant quatre-vingts ans et ne s'est trompé qu'une fois, sur la date de sa propre mort (il s'est trompé de deux jours, et il en était vexé). Son foie de bronze est divisé en seize cases, une par région du ciel, chacune avec le nom d'un dieu.`,
      `Sa dernière lecture, faite dans le foie d'un loup blanc que lui avait amené Kingvi enfant, disait trois choses. « Le fils de Kingvi rallumera le jour. Celui qui arrachera le clou prendra la couronne. Celui qui portera la couronne ne verra plus le jour. » Il est mort en disant que les trois étaient vraies ensemble.`,
      `Son ombre revient près des bêtes qu'on abat, s'accroupit et lit.`,
    ],
    lignes: ['Case de Tuen : la foudre. Case de Sorne : un clou. Tu vivras encore trois rencontres.', 'Je me suis trompé une fois. De deux jours.'],
  },
  {
    id: 'fasti', nom: 'Fasti', surnom: 'la Tisseuse', famille: 'rasna', gen: 2, sexe: 'f',
    conjoints: ['larth'], statut: 'mort', vie: '−118 – −70',
    role: 'Femme de Larth, tisseuse des bandelettes des morts.',
    lieu: '—', magie: 'Elle écrivait sur le lin.',
    sprite: { corps: 'femme', tete: 'voile', objet: 'fuseau' },
    voix: '—',
    bio: [`Elle tissait les bandelettes de lin sur lesquelles les Orsènes écrivaient leurs livres sacrés. Le dernier qu'elle a tissé est resté dans la crypte, avec Aule.`],
    lignes: [],
  },
  {
    id: 'velia', nom: 'Velia', surnom: 'la Sculptrice', famille: 'rasna', gen: 2, sexe: 'f',
    parents: ['arnth', 'thanchvil'], statut: 'mort', vie: '−115 – −60',
    role: 'Sœur de Larth. Elle a taillé les Véla. Elle a trouvé Tavé dans un sillon.',
    lieu: 'Les statues', magie: 'Ce qu\'elle taillait regardait.',
    sprite: { corps: 'femme', tete: 'bonnet', objet: 'marteau' },
    voix: '—',
    bio: [
      `Elle a taillé les trois grandes statues d'Ilé, que les vikings appelleront Véla : celle qui est ensevelie dans la forêt, celle qui est debout à la sortie de la forêt noire et la petite de l'îlot, avec une porte dans la robe.`,
      `Un printemps, en labourant le champ devant le temple, elle a vu le sillon s'ouvrir et un enfant en sortir avec un visage de vieillard. Elle l'a pris dans sa robe et l'a appelé Tavé.`,
    ],
    lignes: [],
  },
  {
    id: 'ramtha', nom: 'Ramtha', surnom: 'la Paix', famille: 'rasna', gen: 3, sexe: 'f',
    parents: ['larth', 'fasti'], conjoints: ['hrolf'], statut: 'mort', vie: '−95 – −50',
    role: 'La Orsènes qui a épousé le conquérant. Mère de Kingvi.',
    lieu: '—', magie: 'Elle savait lire, comme son père, et elle s\'en est privée.',
    sprite: { corps: 'femme', tete: 'voile' },
    voix: '—',
    bio: [
      `Elle a épousé Hrólf pour que la guerre s'arrête, et elle l'a aimé, ce qui n'était pas prévu. Elle a élevé le fils de la neige comme le sien.`,
      `Elle n'a jamais lu le foie de ses enfants, parce qu'elle avait vu ce que savoir avait fait à son père. Son peigne d'os est passé à Hallveig, puis dans le panier de Kári.`,
    ],
    lignes: [],
  },
  {
    id: 'aule', nom: 'Aule', surnom: 'le Muré', famille: 'rasna', gen: 3, sexe: 'm',
    parents: ['larth', 'fasti'], statut: 'mort-vivant', vie: '−92 –',
    role: 'Le frère de Ramtha, muré dans la crypte avec les livres de la foudre. Le sceau du coffre est le sien.',
    lieu: 'La crypte, sous la petite Véla de l\'îlot', magie: 'Les livres de la foudre : il sait où tombera chaque éclair.',
    sprite: { corps: 'vieux', tete: 'bonnet' },
    voix: 'Sec, ironique, fatigué. Il compte les hivers à voix haute.',
    bio: [
      `Il n'a pas voulu de la paix avec Hrólf. Quand sa sœur l'a épousé, il est descendu dans la crypte de la petite Ilé avec les livres de lin de sa mère et le sceau de la famille, et il a fait murer la porte de la robe derrière lui.`,
      `Il y est depuis soixante-dix-huit hivers. Le temps arrêté l'a gardé là, ni mort ni vieilli davantage. Il a lu les livres de la foudre tant de fois qu'il les récite. Il est le dernier Orsènes vivant, si l'on peut dire vivant.`,
    ],
    lignes: ['Tu ouvres, viking ? Soixante-dix-huit hivers que je compte dans le noir.', 'Prends le sceau. Je n\'ai plus rien à fermer.'],
  },
  {
    id: 'tages', nom: 'Tavé', surnom: 'l\'Enfant-Vieillard', famille: 'rasna', gen: 3, sexe: 'm',
    parents: ['velia'], statut: 'immortel', vie: 'sorti d\'un sillon',
    role: 'L\'enfant au visage de vieillard, sorti d\'un sillon. Il annonce la partie en trois énigmes.',
    lieu: 'Assis sous l\'arche', magie: 'Il a dicté la disciplina aux Orsènes. Il sait ce qui va arriver dans la partie.',
    sprite: { corps: 'enfant', tete: 'bonnet' },
    voix: 'Une voix de vieil homme dans un corps d\'enfant. Il parle en énigmes et rit de ses propres énigmes.',
    bio: [
      `Né d'un sillon, adopté par Velia. Il a dicté aux Orsènes tout ce qu'ils savaient du ciel et des foies, en une seule journée, puis il s'est tu pendant cent ans.`,
      `Il est assis sous l'arche, petit comme un enfant de cinq ans, avec un visage plus vieux que le continent. Il connaît la partie qui commence, et il la dit en trois énigmes à qui passe sous l'arche. Personne ne comprend avant de l'avoir vécue.`,
    ],
    lignes: ['Trois choses t\'attendent. Une qui vole, une qui dort, une qui ment.', 'Je suis plus vieux que toi et plus petit que ta hache.'],
  },

  // ══ Les Gunnar ══
  {
    id: 'gunnar', nom: 'Gunnar', surnom: 'Rame-Longue', famille: 'gunnar', gen: 1, sexe: 'm',
    conjoints: ['sidrun'], statut: 'mort', vie: '−100 – −30',
    role: 'Le passeur, apprenti d\'Úrsi. Il a ramené une immortelle chez lui.',
    lieu: 'Le hameau', magie: 'Il a ramé sur les Eaux de la Mort sans les toucher.',
    sprite: { corps: 'vieux', tete: 'capuche', objet: 'rame' },
    voix: '—',
    bio: [
      `Jeune, il a été apprenti chez Úrsi, le passeur du Survivant. Il a vu SNO 9 et il est revenu. Il a ramené Sidrún, la fille du Survivant, qui s'ennuyait dans l'éternité. Elle a vécu avec lui quarante ans, puis elle est repartie tenir sa taverne au bord du monde, parce qu'elle ne supportait pas de le voir vieillir.`,
      `Il a fondé le hameau du nord et appris aux siens à ramer. C'est lui qui a construit la barque où l'on a mis Kári.`,
    ],
    lignes: [],
  },
  {
    id: 'thordis', nom: 'Thordís', surnom: 'la Nourrice', famille: 'gunnar', gen: 2, sexe: 'f',
    parents: ['gunnar', 'sidrun'], conjoints: ['bard'], statut: 'mort-vivant', vie: '−55 – −7',
    role: 'La nourrice de Kári. La maison est la sienne.',
    lieu: 'La maison', magie: 'Son ombre fait encore le ménage.',
    sprite: { corps: 'femme', tete: 'voile' },
    voix: 'Une voix de cuisine, pressée, inquiète.',
    bio: [
      `Elle a nourri Kári pendant un jour, en même temps que sa propre fille Ragna, puis elle l'a mis dans le panier et l'a poussé dans le courant. Elle ne s'en est jamais remise.`,
      `Elle est morte dans sa maison l'année où les siens ont fui. Son ombre y range encore la table quand personne ne regarde. Le médaillon posé sur la table est le sien. Il y a dedans une mèche de cheveux de nouveau-né.`,
    ],
    lignes: ['C\'est toi ? Tu as grandi. Ne marche pas dans le sang, je viens de laver.'],
  },
  {
    id: 'bard', nom: 'Bárd', surnom: 'l\'Étranger', famille: 'gunnar', gen: 2, sexe: 'm',
    conjoints: ['thordis'], statut: 'vivant', vie: '−60 –', origine: 'Une île sans nom',
    role: 'Le mari de Thordís, qui a emmené les Gunnar loin de la nuit.',
    lieu: 'Parti', magie: '—',
    sprite: { corps: 'homme', tete: 'capuche', objet: 'rame' },
    voix: '—',
    bio: [`Un marin venu d'ailleurs, resté pour Thordís. Quand la nuit a duré douze ans, c'est lui qui a dit « on part ». Il a emmené tout le hameau, sauf la petite Ása, qui s'est cachée.`],
    lignes: [],
  },
  {
    id: 'onund', nom: 'Önund', surnom: 'le Charpentier', famille: 'gunnar', gen: 2, sexe: 'm',
    parents: ['gunnar', 'sidrun'], statut: 'vivant', vie: '−60 –',
    role: 'Charpentier de marine. La barque mâtée de la grève est de sa main.',
    lieu: 'Parti avec les siens', magie: '—',
    sprite: { corps: 'homme', tete: 'nue', objet: 'hache' },
    voix: '—',
    bio: [`Il a construit toutes les barques de l'île, dont celle qui a amené Eyvind (il l'avait vendue à SNO 3, des années plus tôt). On reconnaît ses coques à une encoche dans l'étrave.`],
    lignes: [],
  },
  {
    id: 'egil', nom: 'Egil', surnom: 'le Noyé', famille: 'gunnar', gen: 2, sexe: 'm',
    parents: ['gunnar', 'sidrun'], conjoints: ['halla'], statut: 'mort-vivant', vie: '−52 – −19',
    role: 'Pris dans la glace du lac avec la flotte, la nuit où le temps s\'est arrêté.',
    lieu: 'Sous la glace du lac', magie: 'Il ne s\'est jamais noyé tout à fait.',
    sprite: { corps: 'homme', tete: 'nue' },
    voix: 'Des bulles. Lent. Il parle de poisson.',
    bio: [`Il pêchait sur le lac avec six barques quand Kingvi a planté le clou. Le lac a gelé d'un coup, d'un bord à l'autre, en un battement. Egil et ses hommes sont dans la glace, debout dans leurs barques, les yeux ouverts. Ils attendent qu'on leur dise s'ils peuvent mourir.`],
    lignes: ['Il y avait du poisson, ce soir-là. Beaucoup.', 'Arrache-le. On aimerait couler, maintenant.'],
  },
  {
    id: 'halla', nom: 'Halla', surnom: 'la Veuve', famille: 'gunnar', gen: 2, sexe: 'f',
    conjoints: ['egil'], statut: 'vivant', vie: '−50 –',
    role: 'Femme d\'Egil. Partie avec les autres, en pleurant.',
    lieu: 'Partie', magie: '—',
    sprite: { corps: 'femme', tete: 'voile' },
    voix: '—',
    bio: [`Elle a marché sur la glace du lac tous les jours pendant douze ans, au-dessus de son mari qui la regardait. Puis elle est partie.`],
    lignes: [],
  },
  {
    id: 'ragna', nom: 'Ragna', surnom: 'la Sœur de lait', famille: 'gunnar', gen: 3, sexe: 'f',
    parents: ['thordis', 'bard'], conjoints: ['ketill'], lait: ['kari'], statut: 'vivant', vie: '−26 –',
    role: 'Née le même jour que Kári. Sa sœur de lait.',
    lieu: 'Partie, sur une autre île', magie: '—',
    sprite: { corps: 'femme', tete: 'tresses' },
    voix: 'Comme Kári, en plus aimable.',
    bio: [`Elle a bu le même lait que Kári pendant un jour. Elle a grandi en entendant parler d'un frère dans un panier. Elle a deux enfants, des jumeaux, et elle les a emmenés loin de la nuit.`],
    lignes: ['On a tété le même lait, toi et moi. Une journée.'],
  },
  {
    id: 'ketill', nom: 'Ketill', surnom: 'le Cousin', famille: 'gunnar', gen: 3, sexe: 'm',
    parents: ['onund'], conjoints: ['ragna'], statut: 'vivant', vie: '−28 –',
    role: 'Fils d\'Önund, mari de Ragna.',
    lieu: 'Parti', magie: '—',
    sprite: { corps: 'homme', tete: 'capuche', objet: 'rame' },
    voix: '—',
    bio: [`Il rame bien et parle peu, comme tous les Gunnar.`],
    lignes: [],
  },
  {
    id: 'alf', nom: 'Alf', surnom: 'le Jumeau', famille: 'gunnar', gen: 4, sexe: 'm',
    parents: ['ragna', 'ketill'], statut: 'vivant', vie: '−7 –',
    role: 'L\'un des jumeaux. Il a gravé son nom dans la porte du cellier.',
    lieu: 'Parti', magie: '—',
    sprite: { corps: 'enfant', tete: 'nue' },
    voix: '—',
    bio: [`Il a gravé « ALF » à hauteur d'enfant dans la porte du cellier, la veille du départ. Ása a gravé « ÁSA » en dessous, plus profond.`],
    lignes: [],
  },
  {
    id: 'alfhild', nom: 'Alfhild', surnom: 'la Jumelle', famille: 'gunnar', gen: 4, sexe: 'f',
    parents: ['ragna', 'ketill'], statut: 'vivant', vie: '−7 –',
    role: 'La jumelle, amie d\'Ása. Elle lui a laissé sa poupée.',
    lieu: 'Partie', magie: '—',
    sprite: { corps: 'enfant', tete: 'tresses' },
    voix: '—',
    bio: [`Elle a donné sa poupée à Ása pour qu'elle ait quelqu'un. Ása ne joue pas avec : elle la garde pour la rendre.`],
    lignes: [],
  },

  // ══ La maison du Survivant ══
  {
    id: 'utnafi', nom: 'Útnafi', surnom: 'le Survivant, le Lointain', famille: 'utnafi', gen: 1, sexe: 'm',
    conjoints: ['aldis'], statut: 'immortel', vie: 'avant le Grand Givre',
    role: 'Celui qui a survécu au premier hiver sans fin. Il ne peut pas mourir.',
    lieu: 'SNO 9, derrière les Eaux de la Mort', magie: 'Les dieux lui ont donné de ne pas mourir. Il sait où pousse la fleur de givre.',
    sprite: { corps: 'vieux', tete: 'nue', objet: 'baton', echelle: 2 },
    voix: 'Patient, paresseux, un peu moqueur. Il s\'assoit pour parler.',
    bio: [
      `Quand le premier hiver sans fin est venu, il y a neuf cents hivers, une voix lui a dit dans un mur de roseaux : « Démolis ta maison, bâtis un navire. » Il a chargé dans son navire une graine de chaque arbre, un couple de chaque bête, sa femme, et il a dérivé sur la glace pendant un an. Quand le Givre s'est retiré, il a lâché un corbeau, qui n'est pas revenu. Les dieux, honteux d'avoir voulu tout geler, lui ont donné de ne jamais mourir, et l'ont posé au bout du monde.`,
      `Il s'y ennuie. Il dit que l'éternité, c'est une très longue après-midi.`,
      `À qui vient lui demander de ne pas mourir, il fait passer une épreuve : rester éveillé six jours et sept nuits. Personne n'y est arrivé. Kingvi est venu, jeune, et s'est endormi le premier soir.`,
    ],
    lignes: ['Tu veux ne pas mourir ? Commence par ne pas dormir. Six jours, sept nuits.', 'Ton père aussi s\'est endormi. Le premier soir.', 'Sous l\'eau du lac de ton continent pousse une fleur de givre. Elle ne rend pas immortel. Elle rend jeune. Ce n\'est pas pareil.'],
  },
  {
    id: 'aldis', nom: 'Aldís', surnom: 'la Boulangère', famille: 'utnafi', gen: 1, sexe: 'f',
    conjoints: ['utnafi'], statut: 'immortel', vie: 'avant le Grand Givre',
    role: 'La femme du Survivant. Elle cuit un pain par jour de sommeil.',
    lieu: 'SNO 9', magie: 'Immortelle, comme lui.',
    sprite: { corps: 'vieille', tete: 'voile' },
    voix: 'Bienveillante, ironique. Elle prend le parti des visiteurs.',
    bio: [`Quand un visiteur s'endort pendant l'épreuve, elle pose chaque jour un pain à côté de sa tête, pour qu'il ne puisse pas mentir au réveil. Le premier est sec, le deuxième dur, le troisième moisi, et ainsi de suite. Elle a pitié de tous et elle demande toujours à son mari de leur donner quelque chose avant qu'ils repartent.`],
    lignes: ['Compte les pains, petit. Ils ne mentent pas.', 'Donne-lui quelque chose. Il a fait tout ce chemin.'],
  },
  {
    id: 'sidrun', nom: 'Sidrún', surnom: 'la Brasseuse', famille: 'utnafi', gen: 2, sexe: 'f',
    parents: ['utnafi', 'aldis'], conjoints: ['gunnar'], statut: 'immortel', vie: '—',
    role: 'La fille du Survivant. Elle tient la taverne au bord du monde, sur SNO 8.',
    lieu: 'SNO 8, la taverne au bord du monde', magie: 'Elle vieillit si lentement que ça ne compte pas. Sa bière fait dormir sans rêve.',
    sprite: { corps: 'femme', tete: 'voile', objet: 'chope' },
    voix: 'Chaleureuse, franche, elle tutoie tout le monde. Elle sait dire « arrête ».',
    bio: [
      `Elle a quitté l'île de son père par ennui, et un mortel par chagrin. Elle tient la dernière taverne avant les Eaux de la Mort. Tous ceux qui cherchent à ne pas mourir passent chez elle, et elle leur dit toujours la même chose.`,
      `Elle est l'arrière-grand-mère de Thorgrim, et la grand-mère de la nourrice de Kári. Elle les a tous vus naître, et elle en a vu mourir certains. C'est pour ça qu'elle sert la bière.`,
    ],
    lignes: ['Pose ta hache. Mange. Tu cherches à ne pas mourir, toi aussi ?', 'Remplis ton ventre. Lave tes habits. Regarde l\'enfant qui te tient la main. C\'est ça, la part des vivants.', 'Le passeur est en bas. Ne touche pas l\'eau.'],
  },
  {
    id: 'ursi', nom: 'Úrsi', surnom: 'le Passeur', famille: 'utnafi', gen: 2, sexe: 'm',
    statut: 'immortel', vie: '—',
    role: 'Le passeur du Survivant. Il traverse les Eaux de la Mort à la perche.',
    lieu: 'Le rivage de SNO 8', magie: 'Ses rameurs sont de pierre. Il ne touche jamais l\'eau.',
    sprite: { corps: 'vieux', tete: 'capuche', objet: 'rame' },
    voix: 'Bourru. Il compte les perches.',
    bio: [`Il fait la traversée avec un équipage d'hommes de pierre, qui ne craignent pas l'eau. Celui qui les brise doit couper cent vingt perches dans la forêt noire : chaque perche ne sert qu'une fois, puisqu'une goutte des Eaux de la Mort sur la main suffit.`],
    lignes: ['Tu as cassé mes rameurs. Bien. Va me couper cent vingt perches.', 'Une perche, une poussée. Lâche-la avant que l\'eau monte au bois.'],
  },

  // ══ Les géants du froid ══
  {
    id: 'hrimnir', nom: 'Ísgrim', surnom: 'l\'Endormi', famille: 'jotnar', gen: 1, sexe: 'm',
    conjoints: ['fonn'], statut: 'immortel', vie: '—',
    role: 'Le géant qui est une montagne. Sa respiration fait la tempête.',
    lieu: 'La chaîne du nord', magie: 'Il dort. Il parle en dormant. Si le jour revient, il se lèvera.',
    sprite: { corps: 'colosse', tete: 'cornes', echelle: 3 },
    voix: 'Un mot par minute. Ses phrases durent une nuit.',
    bio: [`Il s'est couché au nord du continent avant l'arrivée des Orsènes et ne s'est pas relevé. La neige l'a recouvert, les sapins ont poussé sur ses épaules. Chaque fois qu'il expire, la tempête se lève. Thorgrim croit qu'il noiera le continent en se levant. En vérité, il veut seulement aller voir la mer.`],
    lignes: ['… … la mer … … est-elle encore … … là ?'],
  },
  {
    id: 'mons', nom: 'Le mons', surnom: 'l\'Œil-Perdu', famille: 'jotnar', gen: 2, sexe: 'm',
    parents: ['fonn'], statut: 'immortel', vie: '—',
    role: 'Une bête qui n\'est pas une bête. Il marche devant toi, sur les traces. Le roi sous la roche lui a pris son œil, une pierre rouge.',
    lieu: 'Près de la lanterne, après la grève ; puis devant toi, sur les traces', magie: 'Il voit la chaleur. Sans son œil, il ne voit que le froid.',
    voix: 'Un grondement de pierre qui roule, avec des mots dedans.',
    bio: [`Né d'un iceberg qui n'a jamais atteint la mer, il est resté longtemps au fond d'un creux, là où personne ne marche. Le roi sous la roche, du temps où il régnait, lui a arraché son œil, une pierre rouge, pour la porter sur sa poitrine. Aveugle, il sent les pas dans la neige : il attend près de la lanterne de la grève, et marche devant ceux qui suivent les traces. Il voudrait voir la mer.`],
    lignes: ['Rouge… mon œil… il l\'a sur son cœur.'],
  },
  {
    id: 'fonn', nom: 'Skafla', surnom: 'le Glacier', famille: 'jotnar', gen: 1, sexe: 'f',
    conjoints: ['hrimnir'], statut: 'immortel', vie: '—',
    role: 'La géante glacier. Les icebergs plats sont ses larmes.',
    lieu: 'Le glacier du nord-est', magie: 'Elle avance d\'un pas par siècle.',
    sprite: { corps: 'colosse', tete: 'voile', echelle: 3 },
    voix: 'Craquements.',
    bio: [`Elle descend vers la mer depuis toujours et pleure en avançant : les icebergs plats qu'on voit au large de la grève sont ses larmes. Elle attend que son mari se réveille pour lui dire qu'elle a presque atteint la mer.`],
    lignes: [],
  },
  {
    id: 'hvumbi', nom: 'Hvumbi', surnom: 'le Gardien de la forêt noire', famille: 'jotnar', gen: 2, sexe: 'm',
    parents: ['hrimnir', 'fonn'], statut: 'immortel', vie: '—',
    role: 'Le gardien de la forêt noire, aux sept manteaux de brume.',
    lieu: 'Le cœur de la forêt noire', magie: 'Sept manteaux de terreur : chacun obscurcit la vue un peu plus. Il entend chaque pas dans la forêt.',
    sprite: { corps: 'colosse', tete: 'masque', echelle: 3 },
    voix: 'Il supplie et menace dans la même phrase.',
    bio: [
      `Le fils du géant et du glacier, chargé par les dieux de garder la forêt noire. Son visage est fait de racines nouées. Il porte sept manteaux de brume, et chacun qu'il ôte rend le noir plus noir.`,
      `Il entend tout ce qui marche dans la forêt. C'est pour ça que la sente se resserre : il pousse les arbres. Il a laissé passer Thorgrim, parce qu'il est de son sang. Il ne sait pas encore s'il laissera passer Kári.`,
      `Battu, il supplie. On peut l'épargner ou non. Eyvind aurait dit de le tuer. Eyvind n'est plus là.`,
    ],
    lignes: ['J\'entends ton cœur depuis la lisière, petit roi.', 'Laisse-moi vivre et je te donnerai tous les arbres.', 'Ton frère t\'aurait dit de frapper. Ton frère est mort.'],
  },
  {
    id: 'mjoll', nom: 'Lysa', surnom: 'la Neige fraîche', famille: 'jotnar', gen: 2, sexe: 'f',
    parents: ['hrimnir', 'fonn'], conjoints: ['hrolf'], statut: 'immortel', vie: '—',
    role: 'La neige qui tombe. Une femme blanche dans les tempêtes. Mère de Thorbrand.',
    lieu: 'Dans chaque tempête', magie: 'Elle est la neige. Elle efface les traces.',
    sprite: { corps: 'femme', tete: 'tresses', blanc: true },
    voix: 'Un souffle. Elle demande toujours des nouvelles de Hrólf.',
    bio: [`Elle tombe sur le continent depuis le premier hiver. Elle a aimé un seul mortel, Hrólf, et lui a donné un fils chaud dans un monde froid. C'est elle qui efface les pas en quarante secondes. Quand elle est triste, elle efface plus vite.`],
    lignes: ['Tu sens comme lui. Le grand, avec la barbe. Où est-il ?', 'Je recouvre tout. C\'est ma façon d\'oublier.'],
  },

  // ══ Les puissances ══
  {
    id: 'freya', nom: 'Véla', surnom: 'Ilé, pour les Orsènes', famille: 'puissances', gen: 1, sexe: 'f', statut: 'immortel',
    role: 'La déesse des statues, deux noms pour un même visage.',
    lieu: 'Les trois statues', magie: 'Le seiðr. Elle a pris le visage de Hallveig.',
    sprite: { corps: 'geant', tete: 'voile', echelle: 3 },
    voix: 'Deux voix ensemble, une ancienne et une nordique.',
    bio: [`On l'appelait Ilé, puis Véla. Elle n'a pas changé ; ce sont les bouches qui ont changé. Elle parle par ses statues. Elle offrira à Kári de l'épouser après sa victoire. S'il refuse, elle enverra le Taureau de givre.`],
    lignes: ['On m\'appelait Ilé. Puis Véla. Je n\'ai pas changé : ce sont les bouches.', 'Sois mon époux, petit roi. Ton père n\'a pas su.'],
  },
  {
    id: 'vanth', nom: 'Vaïne', surnom: 'la Femme ailée', famille: 'puissances', gen: 1, sexe: 'f', statut: 'immortel',
    role: 'Celle qui vient chercher les morts, avec sa torche. Elle vient à chaque mort de Kári.',
    lieu: 'Au-dessus de chaque mort', magie: 'Elle conduit les morts. Elle a figé Sigrún dans la glace.',
    sprite: { corps: 'femme', tete: 'voile', objet: 'torche', ailes: true },
    voix: 'Douce, sans pitié, un peu lasse. Une seule ligne à chaque mort.',
    bio: [`Orsène, elle a suivi les Orsènes jusqu'ici. Elle a de grandes ailes et une torche qui ne s'éteint pas. Quand Kári meurt, avant que le noir se referme, elle se penche sur lui et dit une ligne, chaque fois une autre. Elle n'emporte jamais personne sur SNO 7 : le temps arrêté le lui interdit. Ça l'agace.`],
    lignes: ['Encore toi.', 'Je ne peux pas t\'emmener. Personne ne meurt vraiment, ici.', 'Relève-toi. Ta sœur m\'a volé une torche, je l\'attends toujours.'],
  },
  {
    id: 'charun', nom: 'Karrog l\'Aîné et Karrog le Cadet', surnom: 'les Gardiens de la porte', famille: 'puissances', gen: 1, sexe: 'x', statut: 'immortel',
    role: 'Les deux gardiens au marteau, à la porte de la montagne.',
    lieu: 'La falaise, l\'entrée de la grotte, la porte du soleil', magie: 'Leur marteau ferme les portes.',
    sprite: { corps: 'geant', tete: 'masque', objet: 'marteau', echelle: 2 },
    voix: 'Ils parlent à deux, l\'un finit les phrases de l\'autre.',
    bio: [`Deux démons au nez crochu et à la peau bleue (bleu nuit, ici), mari et femme, qui gardent les passages entre les mondes. Ils ne se battent pas : ils demandent pourquoi, et ils écoutent la réponse. Une mauvaise réponse et le marteau tombe.`],
    lignes: ['Nul n\'a passé la montagne…', '…que viens-tu y chercher ?'],
  },
  {
    id: 'nortia', nom: 'Sorne', surnom: 'le Sort', famille: 'puissances', gen: 1, sexe: 'f', statut: 'immortel',
    role: 'La déesse des clous. On plantait un clou par an dans son mur.',
    lieu: 'Le temple sous l\'arche', magie: 'Ce qui est cloué est fixé.',
    sprite: { corps: 'femme', tete: 'voile', objet: 'marteau' },
    voix: 'Un bruit de métal sur la pierre. Ses mots sont des coups.',
    bio: [`On ne la voit jamais. Son mur est couvert de neuf cents clous, un par hiver depuis l'arrivée des Orsènes. Le dernier est planté à l'envers. Elle ne punit personne : elle attend qu'on l'arrache.`],
    lignes: ['Un. Clou. Par. Hiver.'],
  },
  {
    id: 'chasseur', nom: 'Le Chasseur', surnom: 'le Borgne', famille: 'puissances', gen: 1, sexe: 'm', statut: 'immortel',
    role: 'Celui qui mène la Chasse sauvage. Les corbeaux sont à lui.',
    lieu: 'Le ciel des nuits de tempête', magie: 'Il emporte ceux qui courent.',
    sprite: { corps: 'geant', tete: 'capuche', objet: 'lance', echelle: 2 },
    voix: 'Amusé. Il connaît le nom de tout le monde.',
    bio: [`Il passe certaines nuits de tempête avec sa troupe de morts à cheval. Ceux qui courent devant lui sont pris. Ceux qui restent immobiles reçoivent parfois un cadeau, ou un conseil. Les corbeaux du continent sont ses yeux.`],
    lignes: ['Cours, et tu es à moi.', 'Reste là, fils de Kingvi. Ton oncle te salue.'],
  },
  {
    id: 'jormungandr', nom: 'Ormgard', surnom: 'le Serpent', famille: 'puissances', gen: 1, sexe: 'x', statut: 'immortel',
    role: 'Le serpent qui entoure le monde. Il passe au large.',
    lieu: 'La mer', magie: 'Il a volé la fleur de givre et il a fait peau neuve.',
    sprite: { corps: 'serpent' },
    voix: 'Un mot par siècle.',
    bio: [`On ne voit de lui qu'un dos qui passe au loin, si long qu'on le prend pour une côte. C'est lui qui a mangé la fleur de givre que le premier roi de l'archipel avait remontée du fond. Il change de peau chaque siècle. Ses peaux échouent sur les grèves de l'archipel.`],
    lignes: ['… Jeune.'],
  },
  {
    id: 'hvit', nom: 'Hvít', surnom: 'la Louve blanche', famille: 'puissances', gen: 1, sexe: 'f', statut: 'immortel',
    role: 'La fylgja de la lignée : un esprit gardien en forme de louve. Elle a élevé Eyvind.',
    lieu: 'Le hameau, avec Ása', magie: 'Elle est l\'âme qui suit une famille. On la voit avant de mourir, ou quand on a de la chance.',
    sprite: { corps: 'loup' },
    voix: 'Elle seule, parmi les bêtes, parle. Sans bouger la gueule.',
    bio: [`Elle suit la maison de Kingvi depuis Hrólf. Quand Kári a été mis à la mer, elle a traversé la glace jusqu'à SNO 3 et elle a fait naître, ou trouvé, l'homme sauvage qui deviendrait son frère. Depuis la mort d'Eyvind, elle cherche son petit d'homme dans la neige. Elle dort contre Ása.`],
    lignes: ['Tu portes l\'odeur de mon petit d\'homme. Où est-il ?', 'Je garde la petite. Toi, garde-toi.'],
  },
];

PEOPLE.push(...PEOPLE_SNO4);
export const PERSON = Object.fromEntries(PEOPLE.map(p => [p.id, p]));

// ── Ce qu'ils veulent : ce qu'un personnage dit quand on lui parle (touche E),
// pour qu'on comprenne ce qu'il attend et ce qui pourrait arriver. `apres` :
// ce qu'il dit une fois la chose faite (le jeu sait quand : `si` ; une liste :
// la dernière qui est vraie). `voeu` : ce qu'en dit le carnet des vœux (rayé
// quand `fait` est vrai). `don` : la
// relique qu'on peut lui donner (touche E, si elle pend à la ceinture), ce
// qui se dit alors, et ce que ça fait (`effet`, game.js : `give`).
const VEUT = {
  tages: {
    // (v1.65.0 : on ne lui donne plus le sceau, on le pose soi-même dans la dalle, devant lui)
    voeu: 'Ne veut pas qu\'on ouvre les marches sous l\'arche. Le sceau de la crypte s\'emboîte dans la dalle.', fait: 'don-tages',
    lignes: ['Je dis ce qui vient. Rien de plus.', 'Sous mes pieds, des marches. Une dalle les ferme : le sceau d\'Aule s\'y emboîte.', 'Tu l\'as pris au lac ? Garde-le. Le clou doit rester.'],
    don: { relique: 'sceau', effet: 'temple', lignes: [['tages', 'Non. Pas dans la dalle…'], ['tages', 'Elle t\'obéit. Elle ne m\'a jamais obéi.'], ['tages', 'En bas, le mur des ans. Laisse le dernier clou, si tu m\'aimes un peu.']] },
    apres: [
      { si: 'don-tages', lignes: ['La dalle est poussée. Descends.', 'Le clou est à l\'envers, à hauteur d\'homme. Tire, si tu veux. Ou laisse.'] },
      { si: 'aube', lignes: ['Tu vois ? Plus jeune.', 'Maintenant, ça va vieillir, ici. Et toi aussi.'] },
    ],
  },
  kingvi: {
    voeu: 'Ne veut pas mourir, ni que rien change. Le clou doit rester planté.', fait: 'aube',
    lignes: ['Je veux ne pas mourir. Je veux que rien ne change.', 'Le clou est sous l\'arche, dans le mur des Orsènes. Tu le sais, maintenant.', 'Si tu l\'arraches, je meurs. Et le jour revient. Choisis.'],
    apres: { si: 'aube', lignes: ['Il fait jour, dehors ? Je le sens dans mes os.', 'Ce n\'est pas si terrible. Laisse-moi, maintenant.'] },
  },
  freya: {
    // (v1.65.0 : la poupée se raccroche à l'arbre aux offrandes, là où on la trouve)
    voeu: 'Voudrait que la poupée de paille retourne à son crochet, à l\'arbre aux offrandes.', fait: 'don-freya',
    lignes: ['Je regarde. C\'est tout ce que je fais depuis des siècles.', 'Ta mère m\'a donné son visage. Sa poupée pendait à l\'arbre aux offrandes.', 'Si elle est tombée, raccroche-la. Je te garderai.'],
    don: { relique: 'poupee', effet: 'garde', lignes: [['freya', 'La poupée de Hallveig, à son crochet. Elle avait tes yeux, enfant.'], ['freya', 'Je te garde, petit roi. Un coup de plus, et tu tiendras debout.']] },
    apres: { si: 'don-freya', lignes: ['Va. Je regarde pour toi.'] },
  },
  thorgrim: { lignes: ['Viens. Qu\'on en finisse.'] },
  // Le mons (v1.60.0) : le rubis du roi est son œil. v1.65.0 : il attend près
  // de la lanterne, après la grève, et marche devant Kári sur les traces
  mons: {
    voeu: 'Veut son œil : une pierre rouge que le roi sous la roche porte sur la poitrine. Il marche devant, sur les traces.', fait: 'don-mons',
    lignes: ['N\'aie pas peur. Je ne vois plus. Je sens les pas, dans la neige.', 'Je vais devant. Suis-moi.', 'Le roi sous la roche m\'a pris mon œil. Une pierre rouge, sur son cœur. Quand tu l\'auras, je serai là.'],
    don: { relique: 'rubis', effet: 'griffe', lignes: [['mons', 'Mon œil… Chaud. Je te vois, maintenant. Tu es petit.'], ['mons', 'Prends ça. Je l\'arrache pour toi : une griffe repousse en cent ans.'], ['kari', 'Elle est chaude. Elle bat, comme un cœur.']] },
    apres: { si: 'don-mons', lignes: ['Je te vois. Je vais voir la mer, maintenant. Je ne l\'ai jamais vue.'] },
  },
  legba: {
    voeu: 'Veut qu\'on marche son signe, à côté de ses mâts.', fait: 'veve-legba',
    lignes: ['Je tiens les barrières, petit. Celle-ci est ouverte.', 'Marche mon tracé, là, à côté de mes mâts : je t\'ouvrirai les chemins de l\'île.'],
    apres: { si: 'veve-legba', lignes: ['Les chemins sont ouverts. Regarde ta carte.', 'Va au carrefour. La nuit, c\'est mon autre visage qui garde.'] },
  },
  anaise: {
    voeu: 'Veut que sa sœur passe : il faut que le clou tombe, sur SNO 7.', fait: 'aube',
    lignes: ['Je veux que ma sœur passe. Elle attend au carrefour.', 'Pour ça, il faut que ton père lâche son clou, sur ton continent.', 'Il y a trois tracés dans la neige : Clède, Lazul, le Baron. Marche-les.'],
    apres: { si: 'aube', lignes: ['Anisse est passée. Je l\'ai sentie partir. Merci.'] },
  },
  tijo: {
    voeu: 'Veut que sa maman se réveille. Le sel réveille.', fait: 'clotildeFree',
    lignes: ['Ma maman marche sur la banquise. Elle ne me voit pas.', 'Si tu la croises, donne-lui le sel. Le sel réveille.'],
    apres: { si: 'clotildeFree', lignes: ['Maman est rentrée ! Elle parle trop vite. C\'est bien.'] },
  },
  kalfou: {
    voeu: 'Veut qu\'on le paie, ou que le clou tombe, pour rouvrir la route des morts.', fait: ['don-kalfou', 'aube'],
    lignes: ['Je garde les morts jusqu\'à ce que la route s\'ouvre.', 'Le clou de ton père bouche tout. Arrache-le, et je rouvrirai.', 'Ou paie-moi. L\'anneau de celui que tu as tué : ça paie un passage.'],
    don: { relique: 'viking', effet: 'passage', lignes: [['kalfou', 'L\'anneau d\'un mort, donné par son tueur. Bon prix.'], ['kalfou', 'Un passage. Pour qui ? Pour ton frère, je sais.'], ['eyvind', 'Merci, Kári. Je monte. Ne pleure pas, il fait trop froid.']] },
    apres: [
      { si: 'don-kalfou', lignes: ['Ton frère est passé. Pour les autres, la route reste bouchée.'] },
      { si: 'aube', lignes: ['La route est ouverte. Ils passent tous, maintenant. Merci, petit roi.'] },
    ],
  },
  eyvind: {
    voeu: 'Veut que son corps brûle dans la maison, et passer.', fait: ['brule', 'don-kalfou'],
    lignes: ['Arrache le clou, frère. Alors on pourra passer.', 'Ou paie Croisée pour moi. Il aime les anneaux des morts.', 'Et brûle mon corps, dans la maison, si ce n\'est pas fait. Je veux monter.'],
    apres: { si: 'aube', lignes: ['Le jour, chez nous. Je le vois d\'ici. Va, frère.'] },
  },
  anisse: {
    voeu: 'Attend sa sœur pour passer.', fait: 'aube', lignes: ['Dis à Anaïse que j\'attends. Je n\'ai pas peur.', 'Il fait froid, ici. Mais on chante.'] },
  baron: {
    voeu: 'Veut qu\'on marche sa croix, au sud du cimetière.', fait: 'veve-baron',
    lignes: ['Je ne creuse plus, mon garçon. Personne ne meurt pour de bon.', 'Marche ma croix, au sud du cimetière. Je te ferai rire.'],
    apres: { si: 'veve-baron', lignes: ['Ha ! Tu ris bien, pour un viking.', 'Reviens quand ton papa sera mort. J\'aurai du travail, enfin.'] },
  },
  brigitte: {
    voeu: 'Voudrait ce qui reste du compagnon, pour lui donner une tombe.', fait: 'don-brigitte',
    lignes: ['Je garde les tombes. Il n\'y a rien à garder, en ce moment.', 'Quand le jour reviendra chez toi, il y aura du monde ici. Je serai prête.', 'Si tu as ce qui reste de ton compagnon, donne-le-moi. Il aura une tombe.'],
    don: { relique: 'boucle', effet: 'tombe', lignes: [['brigitte', 'Une boucle, et de la cendre dedans. C\'est assez pour une tombe.'], ['brigitte', 'Je l\'enterre près de la croix. Le Baron dira les mots.'], ['baron', 'Il riait bien, celui-là ? Alors il dormira bien.']] },
    apres: { si: 'don-brigitte', lignes: ['Ton compagnon dort. Je passe le voir chaque nuit.'] },
  },
  lucien: {
    voeu: 'Veut garder une âme en bouteille. Ton frère, peut-être.', lignes: ['Je vends des bouteilles. Une âme au chaud, ça ne meurt jamais.', 'Tu veux garder quelqu\'un ? Ton frère, peut-être ? Il attend au carrefour.'] },
  clotilde: { lignes: ['… bwa … bwa …'] },
  damballah: {
    voeu: 'Regarde le dessin de cendre, sous l\'arbre.', fait: 'veve-damballah',
    lignes: ['Ssss.', 'Sss… (le serpent regarde le dessin de cendre, sous l\'arbre)'],
    apres: { si: 'veve-damballah', lignes: ['Ssssss.'] },
  },
};
VEUT.sigrun = {
  voeu: 'Cherchait du feu pour rallumer le jour. Elle attend une flamme.', fait: 'sigrunFree',
  lignes: ['(la glace pleure)', 'Approche ta flamme. Pas trop.'],
};
VEUT.hvit = {
  voeu: 'Veut qu\'on défasse le collet qui lui tient la patte.', fait: 'hvitFree',
  lignes: ['(elle gronde, la patte prise dans un collet)'],
  apres: { si: 'hvitFree', lignes: ['Mes petits sont là-haut, sur la roche. Suis mes traces : ils te laisseront passer.', 'Ne lève pas la lame sur eux.'] },
};
for (const [id, v] of Object.entries(VEUT)) if (PERSON[id]) PERSON[id].veut = v;

// ── Les lieux (anciens et nouveaux : le monde s'agrandit) ──
export const PLACES = [
  { id: 'greve', nom: 'La grève', ile: 'SNO 7', nouveau: false, about: 'La barque de Kári, la barque mâtée d\'Önund qui a amené Eyvind, deux pistes.' },
  { id: 'plaine', nom: 'La plaine des morts', ile: 'SNO 7', nouveau: false, about: 'Les trois navires de pierres de Hrólf et de ses hommes. Le plus grand est le sien.' },
  { id: 'hameau', nom: 'Le hameau des Gunnar', ile: 'SNO 7', nouveau: true, about: 'Au nord de la plaine, cinq maisons de tourbe, une table encore mise, un cellier où vit Ása. Des noms gravés à hauteur d\'enfant.' },
  { id: 'temple', nom: 'Le temple de Sorne', ile: 'SNO 7', nouveau: true, about: 'Sous l\'arche, des marches descendent vers un mur couvert de neuf cents clous. Le dernier est planté à l\'envers.' },
  { id: 'arche', nom: 'L\'arche', ile: 'SNO 7', nouveau: false, about: 'La porte du temple. Tavé y est assis.' },
  { id: 'foret-noire', nom: 'La forêt noire', ile: 'SNO 7', nouveau: false, about: 'Le domaine de Hvumbi. En son cœur, une clairière qu\'on ne trouve que sans torche.' },
  { id: 'bosquet', nom: 'Le bosquet sacré', ile: 'SNO 7', nouveau: false, about: 'L\'arbre mort aux offrandes. La poupée de Hjalti.' },
  { id: 'maison', nom: 'La maison de Thordís', ile: 'SNO 7', nouveau: false, about: 'La maison de la nourrice. Eyvind y est mort.' },
  { id: 'lac', nom: 'Le lac et la flotte prise', ile: 'SNO 7', nouveau: true, about: 'Sous la glace, six barques et leurs pêcheurs debout. Au fond, la fleur de givre.' },
  { id: 'crypte', nom: 'La crypte d\'Aule', ile: 'SNO 7', nouveau: false, about: 'Sous la petite Véla de l\'îlot. Les livres de la foudre.' },
  { id: 'falaise', nom: 'La falaise et la porte', ile: 'SNO 7', nouveau: false, about: 'La sente en lacets, les deux Karrog à l\'entrée.' },
  { id: 'grotte', nom: 'La grotte du roi', ile: 'SNO 7', nouveau: false, about: 'Kingvi sur son trône. Derrière, une fissure qui monte.' },
  { id: 'plateau', nom: 'Le plateau', ile: 'SNO 7', nouveau: false, about: 'Là où passe Vaïne. Sigrún y est debout dans la glace.' },
  { id: 'racine', nom: 'La Racine', ile: 'SNO 7', nouveau: true, about: 'Au-dessus du plateau, par la fissure : la base d\'un tronc qui sort de l\'écran, et les trois fileuses.' },
  { id: 'geant', nom: 'Le géant endormi', ile: 'SNO 7', nouveau: true, about: 'Au nord, une chaîne de montagnes qui respire. On marche entre ses doigts.' },
  { id: 'porte-soleil', nom: 'La porte du soleil', ile: 'SNO 7', nouveau: true, about: 'Un tunnel sous la montagne : douze lieues de noir complet, sans torche possible. Seul le son guide.' },
  { id: 'sno3', nom: 'SNO 3, l\'île des pêcheurs', ile: 'SNO 3', nouveau: true, about: 'Là où Kári a grandi. Ingunn, les filets, une forêt où vivait un homme sauvage.' },
  { id: 'taverne', nom: 'La taverne au bord du monde', ile: 'SNO 8', nouveau: true, about: 'La taverne de Sidrún. Ásdís chante près du feu. En bas, le passeur.' },
  { id: 'eaux', nom: 'Les Eaux de la Mort', ile: 'entre SNO 8 et SNO 9', nouveau: true, about: 'Une mer immobile et noire qu\'on ne doit pas toucher. Cent vingt perches.' },
  { id: 'sno9', nom: 'SNO 9, l\'île du Survivant', ile: 'SNO 9', nouveau: true, about: 'Une maison, un four, un vieux couple qui ne meurt pas.' },
];

// ── Les scénarios ──
// trame : toujours là, dans l'ordre ; souvent : tirés quatre par partie ;
// rare : un par partie, une chance sur trois ; fin : un parmi quatre.
// lignes : [qui, texte] ; qui est un id de PEOPLE, ou 'kari'.
export const SCENARIOS = [
  // ── La trame ──
  {
    id: 'greve', rarete: 'trame', titre: 'Deux pistes', lieu: 'greve', mythe: 'Nord',
    quand: 'Au début, sur la grève.',
    recit: `Kári échoue sur la grève. La barque mâtée d'Önund est là, déjà vide, et le sillon de sa quille court vers l'eau. Deux pistes en partent. Un corbeau se pose sur la proue et parle : c'est un œil du Chasseur.`,
    lignes: [['kari', 'Eyvind ?'], ['corbeau', 'Deux sont venus.'], ['corbeau', 'Un seul a marché droit.'], ['kari', 'Lequel ?'], ['corbeau', 'Celui qui saigne moins.']],
  },
  {
    id: 'draugr', rarete: 'trame', titre: 'Le navire de Hrólf', lieu: 'plaine', mythe: 'Nord',
    quand: 'La première fois qu\'on traverse le grand navire de pierres.',
    recit: `Le vent tombe d'un coup. Au milieu du grand navire de pierres, la neige se soulève : Hrólf se redresse, assis, la hache sur les genoux. Il ne se bat pas, il renifle. Il reconnaît le sang de Ramtha.`,
    magie: 'Le mort parle (temps arrêté).',
    lignes: [['hrolf', 'Qui foule mon navire ?'], ['kari', 'Kári.'], ['hrolf', 'Ce nom ne nous dit rien. Ton odeur, si.'], ['hrolf', 'Tu sens Ramtha. Et la peur de ton père.'], ['hrolf', 'Il a touché au mur des clous. Nous avions promis.'], ['hrolf', 'Va. Nous sommes fatigués.']],
  },
  {
    id: 'freya-ensevelie', rarete: 'trame', titre: 'Les deux noms', lieu: 'foret', mythe: 'Orsène',
    quand: 'Près de la Véla ensevelie.',
    recit: `La statue penchée parle avec deux voix superposées, une très ancienne et une nordique. Elle voit plus loin que Kári.`,
    lignes: [['freya', 'On m\'appelait Ilé. Puis Véla.'], ['freya', 'Je n\'ai pas changé. Ce sont les bouches.'], ['freya', 'Ta mère m\'a donné son visage. Je le garde au chaud.'], ['kari', 'Rends-le-lui.'], ['freya', 'Viens le chercher. Plus tard.']],
  },
  {
    id: 'hjalti', rarete: 'trame', titre: 'La poupée', lieu: 'bosquet', mythe: 'Nord',
    quand: 'Au bosquet sacré, au milieu de la forêt noire.',
    recit: `Sous l'arbre aux offrandes, un enfant pâle joue avec les rubans. Il ne fait pas d'ombre. Il demande à Kári s'il est son frère. Si on frappe l'arbre, la poupée tombe et l'enfant disparaît en riant.`,
    lignes: [['hjalti', 'Tu es mon frère ?'], ['hjalti', 'Maman disait que tu reviendrais par la mer.'], ['kari', 'Comment tu t\'appelles ?'], ['hjalti', 'Hjalti. J\'ai six ans. Depuis longtemps.'], ['hjalti', 'Papa a eu peur. Toi aussi, tu as peur ?'], ['kari', 'Oui.'], ['hjalti', 'Alors tu n\'es pas comme lui. Lui disait non.']],
  },
  {
    id: 'guetteur', rarete: 'trame', titre: 'Pas encore', lieu: 'foret-noire', mythe: 'Nord',
    quand: 'Le guetteur, juste après le bosquet.',
    recit: `La grande silhouette encapuchonnée attend sur la sente. Quand Kári approche, elle dit un mot, un seul, et s'efface. Ses pas s'arrêtent net.`,
    magie: 'Seiðr.',
    lignes: [['hallveig', 'Pas encore.']],
  },
  {
    id: 'meute', rarete: 'trame', titre: 'La meute', lieu: 'foret-noire', mythe: 'Nord',
    quand: 'Dans la clairière des loups.',
    recit: `Les trois loups attaquent comme avant. Mais si Kári en abat un, une voix de louve parle dans sa tête, depuis la lisière : Hvít a senti Eyvind sur lui.`,
    lignes: [['hvit', 'Tu portes l\'odeur de mon petit d\'homme.'], ['hvit', 'Où est-il ?'], ['kari', 'Je le cherche.'], ['hvit', 'Alors suis le sang. Pas les loups.']],
  },
  {
    id: 'maison', rarete: 'trame', titre: 'La maison de la nourrice', lieu: 'maison', mythe: 'Le roi et le sauvage',
    quand: 'Dans la pièce, près du corps.',
    recit: `Le corps est celui d'Eyvind. Si Kári reste immobile près de lui, le froid de la pièce dessine une forme au-dessus : la fylgja d'Eyvind qui s'en va. Elle a le temps de trois lignes. L'ombre de Thordís range la table dans le coin, sans se retourner.`,
    magie: 'Le mort parle une dernière fois.',
    lignes: [['eyvind', 'Il m\'a appelé par ton nom, Kári.'], ['eyvind', 'J\'ai dit oui. C\'était plus court.'], ['kari', '…'], ['eyvind', 'Là-dessous, ils mangent de la poussière. J\'en ai rêvé.'], ['eyvind', 'Brûle-moi. Je veux monter, pas descendre.'], ['thordis', 'Ne marche pas dans le sang, je viens de laver.']],
  },
  {
    id: 'autre', rarete: 'trame', titre: 'L\'Autre', lieu: 'maison', mythe: 'Nord',
    quand: 'Au bout des traces.',
    recit: `Thorgrim attend. Il parle en marchant vers Kári. Il ne ment sur rien. Il frappe à la dernière ligne. S'il tombe, il a le temps de dire deux choses.`,
    lignes: [['thorgrim', 'Ainsi c\'était toi.'], ['thorgrim', 'J\'ai tué le mauvais frère. Il avait des dents de loup.'], ['kari', 'Il s\'appelait Eyvind.'], ['thorgrim', 'Je retiendrai. Le trône à celui qui reste debout.'], ['thorgrim', '(à terre) Ása… elle est au hameau.'], ['thorgrim', 'Ne lui dis pas qui je…']],
  },
  {
    id: 'bucher', rarete: 'trame', titre: 'Le bûcher', lieu: 'maison', mythe: 'Le roi et le sauvage',
    quand: 'Quand Kári met le feu au corps d\'Eyvind.',
    recit: `La fumée remplit la pièce. Dehors, le toit s'embrase. Dans la fumée, un instant, une grande silhouette sans visage regarde le feu à côté de Kári. Elle ne s'efface pas, cette fois.`,
    lignes: [['kari', 'Brûle, frère. Que la fumée te porte plus loin que nos rames.'], ['hallveig', 'Il t\'aimait.'], ['kari', 'Qui es-tu ?'], ['hallveig', 'Celle qui t\'a mis à la mer.']],
  },
  {
    id: 'charun', rarete: 'trame', titre: 'Les gardiens de la porte', lieu: 'falaise', mythe: 'Orsène, Le roi et le sauvage',
    quand: 'Au pied de la sente, ou à l\'entrée de la grotte.',
    recit: `Deux grandes formes bleu nuit au nez crochu, chacune avec un marteau, barrent l'entrée. Comme les hommes-scorpions de la porte du soleil, ils demandent pourquoi. Il n'y a pas de bonne réponse à choisir : ils regardent ce que Kári porte à la ceinture.`,
    lignes: [['charun', 'Nul n\'a passé la montagne…'], ['charun', '…que viens-tu y chercher ?'], ['kari', 'Mon père.'], ['charun', 'Il est assis…'], ['charun', '…depuis dix-neuf hivers. Passe.']],
  },
  {
    id: 'roi', rarete: 'trame', titre: 'Le roi sous la roche', lieu: 'grotte', mythe: 'Le roi et le sauvage, Orsène',
    quand: 'Devant le trône.',
    recit: `Kingvi n'est pas mort. Sa tête est trop lourde pour sa couronne et il ne peut plus se lever, mais il parle, très doucement. Il reconnaît son fils. Il raconte le clou sans s'excuser. Sa tête s'affaisse à la dernière ligne et la couronne roule : on peut la ramasser.`,
    lignes: [['kingvi', 'Approche. Je ne vois plus bien.'], ['kingvi', 'Tu as mes épaules et la bouche de ta mère.'], ['kari', 'Tu m\'as mis à la mer.'], ['kingvi', 'Oui. J\'avais peur de toi. J\'ai eu peur de tout, ensuite.'], ['kingvi', 'Hjalti a changé, tu sais. Sept jours. Je l\'ai regardé changer.'], ['kingvi', 'Alors j\'ai cloué le temps. Ton frère est mort sans vieillir.'], ['kingvi', 'N\'est-ce pas ce que nous voulions tous ?'], ['kingvi', 'Le clou est sous l\'arche. Arrache-le, si tu veux. Moi, je n\'ai pas pu.']],
  },
  {
    id: 'glace', rarete: 'trame', titre: 'Celle qui cherchait du feu', lieu: 'plateau', mythe: 'Orsène',
    quand: 'Sur le plateau, quand la torche approche de la femme de glace.',
    recit: `Une femme debout dans un bloc de glace, le bras levé, une torche éteinte au poing. Quand la flamme de Kári approche, la glace pleure et elle parle. Si Kári frappe la glace, elle se fend ; s'il approche sa torche de la sienne, la glace fond d'un coup et Vaïne l'emporte.`,
    lignes: [['sigrun', 'Kári… ? Approche ta flamme. Pas trop.'], ['sigrun', 'J\'ai voulu ramener la lumière.'], ['sigrun', 'Elle m\'a donné sa torche. Et l\'hiver avec.'], ['kari', 'Je vais la ramener.'], ['sigrun', 'Ása. Au hameau. Dis-lui que je cherchais du feu.']],
  },
  {
    id: 'crypte', rarete: 'trame', titre: 'Le muré', lieu: 'crypte', mythe: 'Orsène',
    quand: 'Quand on ouvre le coffre de la crypte.',
    recit: `Le coffre n'est pas vide : Aule est assis derrière, dans le noir. Il est maigre comme un livre. Il compte les hivers à voix haute, et il donne son sceau.`,
    lignes: [['aule', 'Tu ouvres, viking ?'], ['aule', 'Soixante-dix-huit hivers que je compte dans le noir.'], ['aule', 'Tu as la bouche de ma sœur. Quelle déception.'], ['aule', 'Prends le sceau. Je n\'ai plus rien à fermer.'], ['aule', 'Et si tu touches au clou, préviens-moi. J\'aimerais mourir assis.']],
  },

  // ── Souvent (quatre par partie) ──
  {
    id: 'tages', rarete: 'souvent', titre: 'Les trois énigmes', lieu: 'arche', mythe: 'Orsène',
    quand: 'La première fois qu\'on passe sous l\'arche.',
    recit: `Un enfant est assis sous l'arche, avec un visage de vieillard. Il annonce les scénarios de la partie en énigmes, tirées selon ce qui attend Kári (les lignes ci-dessous sont un exemple). Quand une énigme s'accomplit, la même ligne revient, en gris, au-dessus du viking.`,
    magie: 'Prophétie.',
    lignes: [['tages', 'Je suis sorti d\'un sillon. Assieds-toi, petit vieux.'], ['tages', 'Trois choses t\'attendent.'], ['tages', 'Une qui court derrière le vent.'], ['tages', 'Une qui dort sous l\'eau dure.'], ['tages', 'Une qui ment avec la bouche de ta mère.'], ['tages', 'Hé hé. Tu n\'as rien compris. C\'est normal.']],
  },
  {
    id: 'hameau', rarete: 'souvent', titre: 'Le hameau des Gunnar', lieu: 'hameau', mythe: 'Nord',
    quand: 'Au nord de la plaine, si l\'on quitte les traces.',
    recit: `Cinq maisons de tourbe, une table encore mise pour neuf. Des petits pas sortent d'un cellier et y retournent. Si Kári entre, une enfant à l'écharpe rouge le regarde, une louve blanche couchée contre elle.`,
    lignes: [['asa', 'Tu suis les traces, toi aussi ?'], ['kari', 'Oui.'], ['asa', 'Celles-là, c\'est moi. Celles-là, c\'est la louve.'], ['asa', 'Ma mère cherche du feu. Tu en as ?'], ['kari', 'Une torche.'], ['asa', 'Ma mère, elle est en haut. Elle a froid.']],
  },
  {
    id: 'asa-suit', rarete: 'souvent', titre: 'Les petits pas', lieu: 'greve', mythe: 'Nord',
    quand: 'Pendant tout le voyage, après la rencontre au hameau.',
    recit: `Ása suit Kári de loin. Ses petits pas apparaissent à côté des siens quand il ne regarde pas. Elle dit une ligne à chaque chapitre, d'assez loin pour qu'on ne la voie pas, et la ligne s'affiche au bord de la vue.`,
    lignes: [['asa', 'Pourquoi tu frappes les arbres ?'], ['asa', 'La statue, elle me parle aussi. Elle dit que je ressemble à quelqu\'un.'], ['asa', 'L\'homme au bout des traces, je le connais.'], ['asa', 'Il fera jour comment ? Ça fait du bruit ?']],
  },
  {
    id: 'pierre-famille', rarete: 'souvent', titre: 'La pierre de famille', lieu: 'maison', mythe: 'Nord',
    quand: 'Derrière la maison, une pierre levée.',
    recit: `Une pierre runique gravée de figures : un homme à barbe, une femme voilée, trois enfants, un trait barré. Quand Thorgrim tombe, une nouvelle entaille apparaît. Avec la rune Ansuz, la pierre parle avec la voix d'Ásdís, qui l'a gravée.`,
    lignes: [['asdis', 'Hrólf prit le continent. Ramtha prit Hrólf.'], ['asdis', 'Kingvi prit le temps.'], ['asdis', 'Et le temps prit les autres.'], ['asdis', 'J\'ai laissé de la place en bas. Pour toi, neveu.']],
  },
  {
    id: 'larth', rarete: 'souvent', titre: 'Le foie du loup', lieu: 'foret-noire', mythe: 'Orsène',
    quand: 'Près d\'un loup abattu, quand les corbeaux sont partis.',
    recit: `Une ombre de vieillard au bonnet pointu s'accroupit près du loup mort, sort un foie de bronze et compare. Il lit l'avenir de Kári, une ligne vraie tirée parmi celles de la partie.`,
    magie: 'Haruspicine.',
    lignes: [['larth', 'Bouge pas. Je lis.'], ['larth', 'Case de Tuen : la foudre. Case de Sorne : un clou.'], ['larth', 'Case d\'Ilé : une femme qui t\'offre quelque chose. Refuse, ou ne refuse pas.'], ['larth', 'Tu vivras encore trois rencontres. Peut-être quatre.'], ['larth', 'Je me suis trompé une fois. De deux jours.']],
  },
  {
    id: 'chasse', rarete: 'souvent', titre: 'La Chasse sauvage', lieu: 'plaine', mythe: 'Nord',
    quand: 'Une nuit de tempête, dans la plaine des morts.',
    recit: `Un grondement, les corbeaux qui reviennent tous ensemble, et une troupe de cavaliers spectraux traverse la plaine en trente secondes. Qui court est emporté (il se réveille ailleurs sur le continent, pas à la barque). Qui reste immobile reçoit un mot. Yrsa et Thorbrand passent dans la troupe.`,
    lignes: [['chasseur', 'Cours, et tu es à moi.'], ['yrsa', 'Ne cours pas, cousin ! Ils n\'aiment que ceux qui courent !'], ['thorbrand', 'Je chevauche à droite du Chasseur, maintenant. Comme toujours.'], ['chasseur', 'Reste là, fils de Kingvi. Ton oncle te salue.'], ['chasseur', 'Le jour, si tu le rallumes, nous n\'aurons plus où courir. Pense à nous.']],
  },
  {
    id: 'lac-gele', rarete: 'souvent', titre: 'Le lac pris', lieu: 'lac', mythe: 'Nord',
    quand: 'Sur certaines îles, le lac est gelé.',
    recit: `On marche sur le lac. Sous la glace, six barques et leurs pêcheurs, debout, les yeux ouverts. La glace craque et les fissures restent. Si l'on s'arrête trop longtemps, elle cède. Egil parle à travers.`,
    lignes: [['egil', 'Il y avait du poisson, ce soir-là. Beaucoup.'], ['egil', 'On a levé les filets et le lac s\'est fermé.'], ['kari', 'Je peux vous sortir ?'], ['egil', 'Arrache-le, là-haut. On aimerait couler, maintenant.'], ['egil', 'Ne reste pas debout au même endroit.']],
  },
  {
    id: 'hvumbi', rarete: 'souvent', titre: 'Le gardien de la forêt', lieu: 'foret-noire', mythe: 'Le roi et le sauvage',
    quand: 'Au cœur de la forêt noire, si l\'on éteint la torche.',
    recit: `Sans torche, la sente mène à une clairière qu'on ne voit pas autrement. Hvumbi s'y lève, haut comme quatre arbres, le visage de racines. Il ôte un manteau de brume à chaque coup reçu, et le cercle de vue se resserre chaque fois. Battu, il supplie. On l'épargne (on part) ou non (on frappe). Épargné, il ouvre la forêt. Tué, la forêt noire s'éclaircit pour toujours, et sa mère le glacier pleure plus fort.`,
    lignes: [['hvumbi', 'J\'entends ton cœur depuis la lisière, petit roi.'], ['hvumbi', 'J\'ai laissé passer l\'autre. Il est de mon sang. Toi ?'], ['hvumbi', '(à genoux) Laisse-moi vivre et je te donnerai tous les arbres.'], ['hvumbi', 'Ton frère t\'aurait dit de frapper.'], ['hvumbi', 'Ton frère est mort.']],
  },
  {
    id: 'mjoll', rarete: 'souvent', titre: 'La femme de neige', lieu: 'plaine', mythe: 'Nord',
    quand: 'Au cœur d\'une tempête, en plein champ.',
    recit: `Une femme blanche, presque invisible sur la neige, marche à côté de Kári. Ses pas s'effacent avant même d'être faits. Elle demande des nouvelles de Hrólf. Si Kári lui dit qu'il est mort, la tempête redouble pendant une minute. S'il ment, elle efface ses traces à lui, et il doit retrouver le fil.`,
    lignes: [['mjoll', 'Tu sens comme lui.'], ['mjoll', 'Le grand, avec la barbe. Où est-il ?'], ['kari', 'Dans son navire de pierres.'], ['mjoll', 'Encore ? Il n\'aimait pas rester couché.'], ['mjoll', 'Je recouvre tout. C\'est ma façon d\'oublier.']],
  },
  {
    id: 'taureau', rarete: 'souvent', titre: 'Le Taureau de givre', lieu: 'plaine', mythe: 'Le roi et le sauvage',
    quand: 'Après la victoire sur Thorgrim, à la grande Véla debout.',
    recit: `La grande Véla se penche et propose à Kári de l'épouser. S'il reste, il devient son époux : la partie continue avec une torche qui ne s'éteint plus, mais la statue garde son ombre. S'il s'en va, elle envoie le Taureau de givre, un aurochs de glace haut comme la maison, qui charge à travers la plaine.`,
    lignes: [['freya', 'Sois mon époux, petit roi.'], ['freya', 'Ton père n\'a pas su. Toi, tu sauras.'], ['kari', 'Tes époux, que deviennent-ils ?'], ['freya', 'Des statues. Des loups. Des pierres. Tu le savais.'], ['freya', 'Alors cours, petit roi. Je t\'envoie mon taureau.']],
  },
  {
    id: 'vanth', rarete: 'souvent', titre: 'Vaïne à chaque mort', lieu: 'partout', mythe: 'Orsène',
    quand: 'À chaque mort de Kári, avant que le noir se referme.',
    recit: `Une femme ailée à la torche se penche sur le corps. Elle dit une ligne, chaque fois une autre, puis le noir se referme. Elle ne peut emporter personne : le temps arrêté l'en empêche. À la dixième mort, elle ne dit rien et elle reste.`,
    magie: 'Psychopompe.',
    lignes: [['vanth', 'Encore toi.'], ['vanth', 'Je ne peux pas t\'emmener. Personne ne meurt vraiment, ici.'], ['vanth', 'Relève-toi. Ta sœur m\'a volé une torche, je l\'attends toujours.'], ['vanth', 'Ton père m\'a fait attendre dix-neuf hivers. Toi, tu me fais attendre combien ?'], ['vanth', 'Tu es mort en courant. Le Chasseur aurait aimé.']],
  },
  {
    id: 'thordis', rarete: 'souvent', titre: 'L\'ombre qui range', lieu: 'maison', mythe: 'Nord',
    quand: 'Si l\'on revient dans la maison avant l\'incendie.',
    recit: `L'ombre de Thordís range la table. Elle prend Kári pour l'enfant qu'elle a nourri un jour, puis comprend. Elle montre le médaillon : dedans, une mèche de cheveux de nouveau-né, les siens.`,
    lignes: [['thordis', 'C\'est toi ? Tu as grandi.'], ['thordis', 'Je t\'ai nourri une journée. Avec ma Ragna. Une à droite, un à gauche.'], ['thordis', 'Puis je t\'ai poussé dans l\'eau. Ta mère chantait.'], ['thordis', 'Prends le médaillon. Il y a tes cheveux dedans.'], ['thordis', 'Et ne marche pas dans le sang, je viens de laver.']],
  },
  {
    id: 'fylgja', rarete: 'souvent', titre: 'La louve blanche', lieu: 'foret-noire', mythe: 'Nord',
    quand: 'Si l\'on fuit la meute sans tuer aucun loup.',
    recit: `Une louve blanche, cernée d'un trait bleu nuit, suit Kári de loin pendant tout le voyage. Elle surgit pendant le duel contre Thorgrim et le mord au bras. Si Kári a tué les trois loups, c'est elle qui l'attend, plus tard, et elle ne parle pas.`,
    lignes: [['hvit', 'Tu n\'as pas tué mes petits.'], ['hvit', 'Je garde la petite. Toi, garde-toi.'], ['hvit', '(au duel) Il a mangé le cœur de mon petit d\'homme. Je mange son bras.']],
  },
  {
    id: 'runes', rarete: 'souvent', titre: 'Le chant de la völva', lieu: 'foret', mythe: 'Nord',
    quand: 'Après le bûcher, au premier feu de camp.',
    recit: `Hallveig s'assoit de l'autre côté du feu, la capuche baissée. Elle apprend à Kári une rune chantée, Kenaz, Isa ou Ansuz, selon la partie. Il la chante en tenant le bouton de frappe sans arme sortie, et chaque chant coûte une blessure.`,
    magie: 'Galdr.',
    lignes: [['hallveig', 'Assieds-toi. Ne me regarde pas.'], ['hallveig', 'Kenaz. La torche. Chante-la quand le noir te prend.'], ['hallveig', 'Ça coûte du sang. Tout coûte du sang, ici.'], ['kari', 'Tu es ma mère.'], ['hallveig', 'J\'étais.']],
  },
  {
    id: 'geant', rarete: 'souvent', titre: 'Le géant endormi', lieu: 'geant', mythe: 'Nord',
    quand: 'Au nord, au-delà du plateau.',
    recit: `La chaîne du nord respire. La tempête suit son souffle : les rafales arrivent à chaque expiration. On marche entre ses doigts, grands comme des rochers. Il parle en dormant, un mot par minute, et la ligne reste à l'écran tout ce temps-là.`,
    lignes: [['hrimnir', '… …la mer…'], ['hrimnir', '… …est-elle encore… …là ?'], ['kari', 'Elle est là.'], ['hrimnir', '… …bien.']],
  },
  {
    id: 'pas-autre-vie', rarete: 'souvent', titre: 'Les pas de l\'autre vie', lieu: 'partout', mythe: 'Nord',
    quand: 'Après une mort.',
    recit: `Les traces de la vie précédente de Kári restent sur le continent, grises, à côté du fil. À l'endroit où il est mort, une ombre de lui-même est debout. Avec Ansuz, elle parle.`,
    lignes: [['ombre', 'Pas par là.'], ['ombre', 'Je suis mort par là.'], ['ombre', 'Il frappe à droite d\'abord.'], ['kari', 'Et toi ?'], ['ombre', 'Moi, je t\'attends ici. Ne te presse pas.']],
  },
  {
    id: 'deux-freya', rarete: 'souvent', titre: 'Les deux Véla', lieu: 'foret', mythe: 'Orsène',
    quand: 'Entre la Véla ensevelie et la grande Véla debout.',
    recit: `Les deux statues se parlent d'un bout à l'autre de la forêt. Kári est entre elles et entend les deux. Elles se disputent pour savoir laquelle est la vraie.`,
    lignes: [['freya', '(la couchée) Je suis Ilé. Velia m\'a taillée la première.'], ['freya', '(la debout) Je suis Véla. On m\'a priée plus longtemps.'], ['freya', '(la couchée) Tu es debout parce que tu as eu de la chance.'], ['freya', '(la debout) Et toi couchée parce qu\'ils t\'ont oubliée.'], ['kari', 'Vous êtes la même.'], ['freya', '(les deux) Tais-toi.']],
  },

  // ── Rare (un par partie, une chance sur trois) ──
  {
    id: 'drakkar', rarete: 'rare', titre: 'Le navire de pierres appareille', lieu: 'plaine', mythe: 'Nord',
    quand: 'Une nuit sur vingt, dans la plaine des morts.',
    recit: `Les pierres d'un navire se soulèvent en neige et glissent vers la mer, avec des silhouettes à bord qui rament dans l'air. Hrólf est à la proue. Le lendemain, une trace de quille raye la plaine jusqu'à l'eau.`,
    lignes: [['hrolf', 'Nous partons, petit. Nous allons voir si le sud est encore là.'], ['hrolf', 'Monte, si tu veux.'], ['kari', 'Non.'], ['hrolf', 'Bien. Nous n\'aurions pas su où te mettre.']],
  },
  {
    id: 'serpent', rarete: 'rare', titre: 'Le dos du monde', lieu: 'greve', mythe: 'Nord, Le roi et le sauvage',
    quand: 'Un soir, depuis la grève ou la falaise.',
    recit: `Un des icebergs plats avance contre le vent. Puis un dos immense longe la côte au loin et soulève une vague qui efface toutes les traces de la grève. Sur le sable, il reste une peau de serpent longue comme la plaine. Ormgard dit un mot.`,
    lignes: [['jormungandr', '… Jeune.']],
  },
  {
    id: 'phersu', rarete: 'rare', titre: 'Le jeu de Fersel', lieu: 'arche', mythe: 'Orsène',
    quand: 'Sous le socle à degrés, une nuit sans vent.',
    recit: `Un homme masqué, Fersel, tient en laisse un loup noir. Il propose un jeu : Kári, la tête dans un sac (la vue réduite à rien, seul le son guide), doit frapper le loup avant que le loup ne le morde trois fois. C'est le jeu mortel des tombes orsènes. Qui gagne repart avec le masque.`,
    lignes: [['phersu', 'Un jeu, viking ? Tu as l\'air de t\'ennuyer.'], ['phersu', 'Le sac sur la tête. La massue dans la main.'], ['phersu', 'Le chien ne joue pas, lui.'], ['phersu', '(s\'il perd) Garde le masque. Moi, j\'en ai d\'autres.']],
  },
  {
    id: 'racine', rarete: 'rare', titre: 'La Racine', lieu: 'racine', mythe: 'Nord, Orsène',
    quand: 'Par la fissure derrière le trône.',
    recit: `On monte longtemps dans le noir. On arrive au pied d'un tronc qui sort de l'écran par le haut. Trois femmes filent près d'un puits, et l'une a un marteau et un clou à la ceinture : Sorne est assise avec les Fileuses.`,
    lignes: [['nornes', 'Ce qui fut.'], ['nornes', 'Ce qui est.'], ['nortia', 'Ce. Qui. Est. Cloué.'], ['nornes', 'Elle n\'est pas d\'ici, mais elle file bien.'], ['nortia', 'Arrache. Ou. Pas. Le. Fil. Attend.']],
  },
  {
    id: 'porte-soleil', rarete: 'rare', titre: 'Les douze lieues de noir', lieu: 'porte-soleil', mythe: 'Le roi et le sauvage',
    quand: 'Par la porte que gardent les Karrog, si l\'on y retourne.',
    recit: `Un tunnel sous la montagne, douze lieues de noir complet (la torche ne s'allume pas). L'écran reste noir, et seul le son guide : le vent devant, l'eau à gauche, une respiration derrière. Au bout, un jardin de glace aux arbres de cristal, et la mer.`,
    lignes: [['charun', 'Douze lieues…'], ['charun', '…sans lumière. Personne n\'en est revenu…'], ['charun', '…sauf le premier roi, celui des roseaux.'], ['kari', '(dans le noir) …'], ['siduri-echo', 'Encore un peu. J\'entends ta respiration.']],
  },
  {
    id: 'banquet', rarete: 'rare', titre: 'Le banquet des morts', lieu: 'hameau', mythe: 'Nord',
    quand: 'À minuit (heure réelle), dans la grande maison du hameau.',
    recit: `La table mise pour neuf se remplit d'ombres. Gunnar Rame-Longue préside. On parle des vivants comme on parle de la pluie. Kári peut s'asseoir à la place vide : la musique s'arrête et le vent aussi, jusqu'à ce qu'il se lève.`,
    lignes: [['gunnar', 'Assieds-toi, toi. C\'est la place de l\'enfant du panier.'], ['gunnar', 'Ma barque t\'a porté. Elle était bonne.'], ['egil', 'Il y avait du poisson, ce soir-là.'], ['gunnar', 'Tais-toi, Egil. On sait.'], ['gunnar', 'Les miens sont partis. Bien. Les vivants doivent partir.']],
  },

  // ── Les fins ──
  {
    id: 'fin-aube', rarete: 'fin', titre: 'L\'Aube', lieu: 'temple', mythe: 'Orsène, Nord',
    quand: 'Kári arrache le clou de Sorne.',
    recit: `Le clou sort avec un cri de métal. Neuf cents clous tombent du mur en même temps. Dehors, pour la seule fois de la saga, le ciel pâlit à l'est. La tempête tombe, la musique s'ouvre. Kingvi meurt enfin et Vaïne l'emporte. Le géant du nord se lève, très lentement, il marche jusqu'à la mer et s'y couche. Thorgrim avait tort. La couronne attend : Kári la pose sur la tête d'Ása, ou la jette.`,
    lignes: [['nortia', 'Enfin.'], ['kingvi', '(très loin) Merci.'], ['vanth', 'Je l\'emmène. Il était temps.'], ['asa', 'Ça ne fait pas de bruit, le jour.'], ['kari', 'Non.'], ['asa', 'C\'est mieux.']],
  },
  {
    id: 'fin-roi', rarete: 'fin', titre: 'Le Roi sous la roche', lieu: 'grotte', mythe: 'Le roi et le sauvage',
    quand: 'Kári pose la couronne sur sa propre tête et s\'assoit sur le trône.',
    recit: `Kári ne sort plus. La nuit continue. Au début de la partie suivante, un autre viking accoste, et c'est Kári qui attend sous la roche, sur le trône, et qui parle à celui qui vient. Celui qui vient a peut-être le visage de son fils.`,
    lignes: [['kari', '(sur le trône) Approche. Je ne vois plus bien.'], ['kari', 'J\'ai eu peur, moi aussi.'], ['kari', 'Arrache-le, si tu veux. Moi, je n\'ai pas pu.']],
  },
  {
    id: 'fin-mer', rarete: 'fin', titre: 'La Mer', lieu: 'greve', mythe: 'Nord',
    quand: 'Kári pousse la barque mâtée en feu, avec la boucle d\'Eyvind, et rentre à SNO 3.',
    recit: `La barque d'Önund brûle sur l'eau et dérive vers les icebergs, et le rouge éclaire toute la mer. Kári rame vers SNO 3. Ingunn l'attend sur la grève, avec un enfant dans les bras. Le nom de l'enfant est gravé dans la barque de la partie suivante.`,
    lignes: [['kari', 'Brûle, frère. Va plus loin que nous.'], ['ingunn', 'Tu as mis le temps.'], ['kari', 'Il y avait du monde.'], ['ingunn', 'Il s\'appellera comme le jour où tu es revenu.']],
  },
  {
    id: 'fin-bout', rarete: 'fin', titre: 'Le Bout du monde', lieu: 'sno9', mythe: 'Le roi et le sauvage',
    quand: 'Kári passe à la taverne de Sidrún, traverse les Eaux de la Mort et rencontre le Survivant.',
    recit: `Sidrún dit ce qu'elle dit à tous. Úrsi demande cent vingt perches. Útnafi propose l'épreuve : rester éveillé (ne pas lâcher les touches) six jours et sept nuits de jeu. Kári s'endort, et Aldís pose un pain par jour. Pour le consoler, on lui donne la fleur de givre, au fond du lac de SNO 7. Sur le chemin du retour, pendant qu'il se lave dans la mare gelée, le serpent la prend et fait peau neuve. Kári revient les mains vides. Il montre l'arche à Ása : « Regarde les pierres. Ça, ça dure. »`,
    lignes: [['sidrun', 'Pose ta hache. Mange. Tu cherches à ne pas mourir, toi aussi ?'], ['sidrun', 'Remplis ton ventre. Lave tes habits. Regarde l\'enfant qui te tient la main.'], ['sidrun', 'C\'est ça, la part des vivants.'], ['ursi', 'Une perche, une poussée. Lâche-la avant que l\'eau monte au bois.'], ['utnafi', 'Tu veux ne pas mourir ? Commence par ne pas dormir.'], ['aldis', 'Compte les pains, petit. Ils ne mentent pas.'], ['utnafi', 'Ton père aussi s\'est endormi. Le premier soir.'], ['kari', '(à Ása, sous l\'arche) Regarde les pierres. Ça, ça dure.']],
  },
];

// Ceux qui parlent sans être dans les arbres
export const VOICES = {
  corbeau: { nom: 'Le corbeau', role: 'Un œil du Chasseur.' },
  ombre: { nom: 'L\'ombre de Kári', role: 'Lui-même, dans une vie précédente.' },
  phersu: { nom: 'Fersel', role: 'L\'homme masqué du jeu mortel.' },
  nornes: { nom: 'Les Fileuses', role: 'Les fileuses au pied de l\'Arbre.' },
  'siduri-echo': { nom: 'Une voix de femme', role: 'Sidrún, de l\'autre côté de la montagne.' },
};

BIBLE.push(...BIBLE_SNO4);
FAMILIES.push(...FAMILIES_SNO4);
PLACES.push(...PLACES_SNO4);
SCENARIOS.push(...SCENARIOS_SNO4);
Object.assign(VOICES, VOICES_SNO4);
// Les deux mondes de la saga (pour ranger le labo)
export const WORLDS = { sno7: 'SNO 7, l\'île du roi', sno4: 'SNO 4, l\'île Carrefour' };
export const worldOf = x => (x.monde || (x.ile === 'SNO 4' ? 'sno4' : null) || FAMILIES.find(f => f.id === x.famille)?.monde || 'sno7');

export const speakerName = id => PERSON[id]?.nom || VOICES[id]?.nom || id;

export const RARITY = {
  trame: 'La trame (toujours)',
  souvent: 'Souvent (quatre par partie)',
  rare: 'Rare (un par partie, une chance sur trois)',
  fin: 'Les fins (une par partie)',
};
