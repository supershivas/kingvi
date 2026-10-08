# KINGVI SNO 7 — Bible du jeu

Document de référence de l'équipe d'agents (designers, testeurs, synthèse).
Il décrit le jeu tel qu'il est (v1.22) et ce qu'il veut être. Les détails
techniques sont dans `CLAUDE.md` ; ici, l'intention.

## Intention

Un viking accoste sur une terre enneigée, SNO 7, un continent (pas une île : la grande terre dont l'Archipel des Neuf n'est que la frange), et suit des traces dans la neige.
Personne ne lui dit pourquoi, ni où aller : les traces sont le seul fil.
Elles racontent une histoire que le joueur reconstitue en marchant : ils
étaient deux à débarquer, deux pistes côte à côte jusqu'à une maison, une
seule en ressort, tachée de sang. Au bout, l'autre attend.

Le jeu est **contemplatif** et sa **lenteur est assumée**. On marche à
18 pixels par seconde sur une île de 6144 pixels de côté ; les traces, de la
barque à leur bout, demandent près de six minutes de marche sans s'arrêter.
Le viking fait 9 pixels de haut sur un écran d'environ 280 : la vue est
rapprochée, et on ne voit qu'à distance de vue du héros (net autour de lui,
flou vers le bord, puis le noir, dont la forme vit avec le décor). Par défaut, c'est la nuit, toujours, et la
tempête. On doit sentir l'immensité qu'on ne voit pas, le froid, le vent, la
solitude. Le récit
n'est jamais dit : il est posé dans le paysage (traces, sang, corps, statues,
pierres levées, offrandes) et le joueur le lit.

## Piliers

1. **Les traces sont le récit.** Suivre, lire, comprendre. Tout ce qui
   compte se voit dans la neige.
2. **L'immensité.** Viking minuscule, peu d'éléments, grands vides ; le
   cercle de vue cerné de noir laisse deviner ce qu'on ne voit pas. Tout se mesure au viking (porte ≈ sa taille, loup à sa
   hanche, statue ≈ dix fois sa taille).
3. **Rien de géométrique.** Ni droite, ni grille, ni cercle parfaits : tout
   est tordu par le bruit, cassé, effrité, asymétrique. Seuls les objets
   fabriqués (maison, barques, coffre) gardent quelques lignes, usées.
4. **Trois couleurs.** Neige bleutée, bleu nuit, et le rouge de l'accent
   (le sang, presque seul) ; un noir profond pour l'intérieur et la coque.
5. **Le monde vit sans le joueur.** Le vent et le jour suivent l'horloge
   réelle ; les arbres ploient, la neige recouvre les pas en 40 secondes.
6. **La violence est rare, brève et lourde.** Trois coups abattent ; le
   sang reste ; les corbeaux viennent aux cadavres.

## La saga

Le récit complet (qui sont Kári, Eyvind, Thorgrim, le roi, le guetteur ; le
clou de Sorne et la nuit qui dure depuis dix-neuf hivers ; l'Archipel des
Neuf ; la magie ; le Nord, les Orsènes et le roi qui ne voulait pas mourir), les
arbres généalogiques, les lieux à venir et les scénarios avec leurs lignes de
dialogue sont dans `js/saga.js`, lisibles dans l'onglet « La saga » du labo.
Une partie des scénarios est dans le jeu (v1.47.0, phylactère B) ; les autres restent des propositions. Le megamoth est retiré : Sigrún est figée dans la glace.

Un second monde, SNO 4, l'île Carrefour, bâti sur un culte des esprits venu du sud (v1.48.0, dans `js/saga-sno4.js`, pas encore jouable) : les esprits, les Gisants de Baron Cendre, la cour Jean-Louis et son héroïne Anaïse. Ses refus propres sont dans sa page « Ce que ce monde refuse ».

## Le voyage, chapitre par chapitre

v1.65.0 : une seule aventure, d'ouest en est, que la piste traverse dans cet
ordre (l'île refaite pour qu'on ne reconnaisse pas l'ancienne ; contre les
« quêtes FedEx » des testeurs, les objets servent là où on les trouve).

Chaque chapitre s'inscrit une fois par vie, en haut de l'écran
(« Chapitre III » en petit, le nom en gothique), et la musique retient son
souffle (sauf aux combats).

| # | Chapitre | Ce qu'on y trouve | Ce qu'on y lit |
|---|---|---|---|
| I | La grève | La barque échouée qui flotte, une seconde barque mâtée halée sur la grève (le sillon de sa quille), icebergs, vagues ; tout de suite, une lanterne, et le mons qui y attend : il apparaît, parle, puis marche devant Kári le long des traces | Ils étaient deux ; quelqu'un sent les pas |
| II | Le ravin | Une crevasse qui coupe l'île d'une mer à l'autre. Les traces s'arrêtent au bord et reprennent en face. Le mons l'enjambe et montre le grand sapin du bord : abattu, il tombe en travers, et l'on passe sur le tronc (la souche reste) | L'épreuve, le premier geste |
| III | La forêt noire | Aussitôt après le ravin. Si dense que le sol est noir ; la sente se resserre, trois clairières seulement (une vide, l'arbre aux offrandes et le guetteur, la grande clairière). Longue à traverser. La poupée tombée de l'arbre s'y raccroche | L'oppression, la perte de repères |
| IV | La louve blanche | À la sortie du noir, une louve blanche prise dans un collet. Déliée (E), elle parle de ses petits, sur la roche, et laisse des traces qu'on suit jusqu'à la falaise | La pitié, une dette |
| V | La maison | Une grande Véla debout au sortir du noir, puis la maison (sans fumée ni lumière). Les traces entrent par la porte ; dedans, un corps, du sang. Une seule piste ressort, tachée de sang | Le meurtre |
| VI | L'incendie | Dès qu'on est entré, on peut mettre le feu au corps (clic près de lui) : la fumée chasse de la pièce, le toit brûle, s'effondre ; dans les cendres, la boucle du compagnon, qu'on y enterre (E) | Le bûcher, le deuil |
| VII | Le lac | La piste de sang longe sa rive nord : un ponton (on y marche), la barque au bout (on rame), un îlot, une Véla plus petite avec une porte dans sa robe ; une crypte, un coffre, le sceau | Un détour, un secret |
| VIII | La plaine des morts | Navires, cercles et triangles de pierres levées, une volée de corbeaux, la Véla ensevelie, penchée, brisée ; au creux du grand navire, la main sur l'étrave : le pas des morts | Un lieu de sépulture ancien ; des dieux tombés |
| IX | L'autre | Au bout des traces, sous la falaise, un viking attend. Il vient au contact et frappe | La confrontation |
| X | La falaise | Une falaise gigantesque face au sud, des pans avancés et reculés ; une sente en lacets ; au pied, une grotte bouchée par un éboulis qu'on brise. Le mons attend là, privé de son œil | L'ascension |
| XI | Le roi sous la roche | Dans la grotte (toujours la nuit, la torche s'allume) : galerie, mare gelée, ossements, un roi mort sur son trône ; à l'approche, sa tête tombe et sa couronne roule ; frappé, il lâche le rubis, l'œil du mons. Rendu, le mons s'arrache une griffe et s'en va voir la mer | La fin d'une lignée |
| XII | Les loups | Sur le plateau, en haut de la sente : une meute de trois loups. Si l'on a délié la louve, ils tournent et s'en vont sans mordre | Le danger, ou la dette payée |
| XIII | Le mur des ans | Tout au bout, sur le plateau, l'arche ; Tavé y est assis. On pose soi-même le sceau dans la dalle, malgré lui ; elle glisse. En bas, le temple de Sorne : un mur hérissé de clous, le dernier à l'envers, rouge. On peut l'arracher (E) | Le choix |
| Fin | L'aube | Le clou arraché : trois lignes sur le noir, puis la nuit pâlit et le jour revient, pour toujours, sur l'île ; on continue de marcher dans le jour. Les autres le disent quand on leur parle | Le temps qui reprend |

Mort, le noir se referme sur le corps, « Vous êtes mort », et on se réveille à
la barque ; les chapitres s'inscrivent de nouveau. Les traces ne disparaissent pas : on peut
toujours reprendre le fil.

## Les systèmes

### Le vent et la neige
Par défaut, la tempête. Dans les Réglages, un cycle naturel d'environ
8 minutes, calé sur l'horloge réelle (il continue d'une session à l'autre) :
calme, bise, rafales, tempête, rafales, tourbillons, bise ; fondus de 18 s ;
ou une autre ambiance figée. Les arbres ploient, la cape bat, le son du vent suit (étouffé à
l'intérieur et dans la forêt noire).

### La neige profonde
Par endroits, hors de la piste et des forêts, la neige monte aux mollets,
parfois à la taille : le viking s'y enfonce, avance à 80 %, et n'y laisse
plus de pas mais un sillon. On choisit de couper par la neige ou de suivre
la piste tassée.

### La touche d'action (E)
Près de ce qui peut se faire (coffre, bûcher, roi, barque) ou de quelqu'un,
un petit cadre dit quoi ; E (ou un clic sur ce cadre) le fait. Parler dit ce
que la personne veut, et autre chose une fois qu'on l'a fait. Si l'on porte
ce qu'elle attend, E le lui donne : Véla garde (un point de vie de plus),
Tavé ouvre le temple, Croisée fait passer Eyvind, Rosine enterre le
compagnon. Donner est une autre façon d'avancer que frapper.

### Le jour et la nuit
Par défaut, la nuit, toujours (« Toujours la nuit » dans les Réglages).
Sinon, un cycle de 20 minutes sur l'horloge réelle : aube (1 min 30), jour (11 min),
crépuscule (1 min 30), nuit (6 min). La nuit, un voile bleu nuit ; le viking
sort une torche dont le halo s'ouvre en paliers tramés, et arbres et rochers
portent une ombre opposée. Dans la grotte, il fait toujours nuit.

### Le combat
- Clic : un coup vers le pointeur, en huit directions. L'épée est cachée et
  ne sort que pendant l'attaque.
- Bouton maintenu deux secondes : la neige se met à tourner autour des pieds,
  puis un coup tourbillonnant, un tour complet qui trace un anneau, puis un
  souffle qui chasse la neige alentour ; il touche tout autour.
- Trois coups abattent l'autre viking, trois coups nous abattent ; un loup
  tombe en deux coups. On voit venir le coup de l'autre (il arme).
- L'endurance est retirée pour le moment : frapper et courir ne coûtent rien.
- Blessé, on saigne en marchant ; hors combat, les blessures se referment.
  À un point de vie, l'écran se teinte de rouge.
- Pas de zoom automatique (le joueur zoome à la molette, du plan large au double), secousses minimes (un pixel, un instant, seulement pour un vrai coup), sang qui gicle et
  reste.
- La meute : elle encercle, gronde, bondit l'un après l'autre. Si l'on
  s'enfuit en saignant, elle suit le sang (au retour, elle sort plus tôt et
  poursuit plus loin).
- Corbeaux : quand on s'éloigne d'un cadavre, ils s'y abattent.

### Le monde qu'on entame
Frapper un arbre le fait trembler et tomber sa neige ; tous finissent par
tomber. Frapper une pierre fait jaillir des étincelles, la lame rebondit ;
chaque coup arrache un éclat, et tous les rochers finissent par céder. Un
compteur discret, en haut à droite, dit combien.

### Le mons
Loin des traces, au creux des landes du sud, une bête qui n'est pas une bête
attend qu'on la découvre. Le roi sous la roche lui a pris son œil, la pierre
rouge qu'il porte sur la poitrine. On la lui rend : il voit de nouveau, et
s'arrache une griffe pour Kári. Une petite quête pour qui s'écarte du chemin.

### La musique et le son
La musique : des morceaux enregistrés (assets/music/), planants, qui
s'enchaînent en fondu ; la forêt noire, les loups et l'aube ont le leur, qui
vient de lui-même. Sourde dans la forêt noire, étouffée à l'intérieur ;
muette quelques secondes quand le guetteur s'efface ou que le roi s'incline.
Les bruitages (vent, épée, corbeaux, loups) restent synthétisés.

### L'interface qui existe
Volontairement mince : l'écran d'accueil (titre gothique sur la mer de nuit),
les chapitres, l'inventaire (touche I : la ceinture du viking, où pendent
les reliques ; on les déplace d'un crochet à l'autre ; dessous, la vie et
les quêtes),
les points de vie (seulement en combat), le compteur d'arbres et de rochers
(dès le premier), la teinte rouge à un point de vie, une consigne de
commandes qui s'efface d'elle-même. Un curseur de qualité de l'image (de
légère à complète) règle l'effet cathodique, le flou de maquette et la
quantité de flocons ; l'image, elle, est toujours en vraie basse définition.

### Commandes
ZQSD / WASD (touches physiques) ou flèches, Maj pour courir, clic pour
frapper (maintenu deux secondes : le tourbillon). Tactile : une croix (au
bord pour courir), toucher l'écran pour frapper.

## Palette

| Rôle | Couleur |
|---|---|
| Neige | bleu très pâle (`--game-snow`) |
| Nuit, silhouettes, eau | bleu nuit (`--game-night`) |
| Sang, repères | rouge de l'accent (`--accent`) |
| Intérieur, coque | noir profond (`--game-black`) |

Pas d'autre couleur, sauf le blanc pur de l'éclair (décision de Jérôme,
v1.51.0). Les nuances viennent de la trame (pixels alternés), du
voile de nuit et de la lueur rasante de l'aube et du crépuscule.

### Les cubes
Sur chaque île, un cube blanc et un cube noir, loin l'un de l'autre : les
seules choses parfaitement droites du monde, et c'est voulu (tout le reste
est tordu, cassé, organique). Le blanc referme les blessures ; le noir montre
l'île d'en haut. On ne sait pas d'où ils viennent, et le jeu ne le dira pas.

### Le carnet des vœux et le fil
Touche J : en tête, ce que Kári pense devoir faire ; puis ce que veulent ceux
qu'on a croisés, rayé quand c'est fait. Kári dit son but à voix haute quand
il change, et s'il traîne longtemps. Jamais de flèche ni de marqueur : une
pensée, dans sa bouche.

### La musique
Une playlist de morceaux enregistrés (Spring Reverb, La Forêt Noire,
Abstract Breaks I et II, L'aube, The wolves), enchaînés en fondu de huit
secondes ; au choix dans les Réglages, ou enchaînés.

## Ce que le jeu refuse

- **Aucun nom réel** (Jérôme, v1.53.0) : ni pays, ni dieux, ni esprits, ni
  rites d'une religion ou d'une mythologie réelle. On prend l'inspiration,
  on invente les noms.

Propositions à valider par Jérôme. Les tensions avec l'existant sont
signalées, pas tranchées.

- **Pas d'objectif affiché.** Ni quête, ni flèche, ni marqueur : seules les
  traces guident. `[À VALIDER]`
- **Pas de carte toute faite.** Décision de Jérôme (v1.47.0) : une carte en jeu
  (touche M), mais elle ne montre que ce que le viking a vu ; le reste est noir.
- **Pas de tutoriel bavard.** Décision de Jérôme (v1.47.0, resserrée en
  v1.65.0) : un prologue de trois lignes sur le noir (l'état du monde), puis
  une seule consigne, « Suis les traces dans la neige », une fois par
  navigateur. Le reste se découvre.
- **Pas de quête de livreur.** Décision de Jérôme (v1.65.0, après les
  playtests) : on ne rapporte pas un objet à quelqu'un d'ailleurs. Un objet
  sert là où on le trouve (la poupée à son crochet, le sceau dans la dalle, la
  boucle dans les cendres), une quête est une trace à suivre (la louve, le
  mons qui marche devant), une épreuve se résout avec ce que le jeu sait
  déjà faire (abattre un arbre en travers du ravin, briser l'éboulis).
- **Pas de bavardage.** Décision de Jérôme (v1.46.0) : les personnages
  parlent, mais peu (trois à huit lignes par rencontre, douze mots par ligne
  au plus), sans jamais raconter l'histoire à la place du paysage ; pas de
  choix de réplique, on répond par des gestes. Règle complète, personnages et
  dialogues : la saga (`js/saga.js`, onglet « La saga » du labo).
- **Pas de loot, pas d'équipement, ni d'expérience ni de niveaux.** Décision
  de Jérôme (v1.44.0) : un inventaire (touche I) ne garde que les reliques,
  six à ce jour (la poupée de l'arbre sacré, le rubis du roi mort, le
  médaillon de la maison, le sceau du coffre, l'anneau de l'autre viking, la
  dent du loup). Elles ne donnent rien : on les trouve. *Tension :*
  l'inventaire montre un nom et une phrase par relique, seul texte du jeu avec
  les chapitres. `[À VALIDER]`
- **Pas de score ni de récompense chiffrée.** *Tension :* le compteur
  d'arbres et de rochers est un score discret. `[À VALIDER]`
- **Pas de musique d'action plaquée.** La musique monte au combat mais reste
  la même matière (deep techno sourde), jamais une piste épique. `[À VALIDER]`
- **Pas d'interface permanente.** Rien à l'écran au repos. *Tension :* la
  barre d'endurance et les points de vie n'apparaissent qu'en mouvement et
  en combat ; le compteur reste affiché dès le premier arbre. `[À VALIDER]`
- **Pas de couleur en plus.** Trois couleurs et le noir, rien d'autre.
  `[À VALIDER]`
- **Pas de géométrie parfaite** dans la nature. `[À VALIDER]`
- **Pas d'accélération du voyage.** Pas de voyage rapide, pas de monture ; la
  course est limitée par l'endurance. *Tension :* « Revenir à la barque »
  dans les Réglages est un retour instantané (une sortie de secours). `[À VALIDER]`
- **Pas de violence complaisante.** Le sang est rouge et reste, mais en
  quelques pixels, vu de très loin ; pas de démembrement ni de gros plan.
  *Tension :* le roi décapité dans la grotte. `[À VALIDER]`
- **Pas d'ennemis en nombre.** Un homme, une meute ; pas de vagues
  d'ennemis, pas de combat à répétition. `[À VALIDER]`
- **Pas de mort punitive.** On se réveille à la barque, le monde garde ce
  qu'on y a fait. `[À VALIDER]`


## L'ascension du mont King (plan, v1.68.0 — décidé avec Jérôme)

Le but devient le sommet. Le monde actuel reste tel quel : ce sont les premiers
étages. On continue toujours vers le nord-est ; l'altitude est la distance
parcourue le long de cet axe, et choisit végétation, météo, température.

| # | Étage | Altitude | Température | Végétation |
|---|---|---|---|---|
| 1 | La grève | 0–100 m | +6 °C | oyats, varech, bois flotté, galets |
| 2 | Les landes | 100–500 m | +3 → −1 | bruyère, ajoncs, fougères, bouleaux nains |
| 3 | Le bois clair | 500–700 m | −1 → −3 | bouleaux, sorbiers à baies rouges, feuilles mortes |
| 4 | La forêt noire | 700–1 300 m | −3 → −7 | sapins sans neige puis givrés |
| 5 | Le haut-pays | 1 300–1 900 m | −8 → −12 | pins tordus, mélèzes, airelles |
| 6 | La falaise et le plateau | 1 900–2 500 m | −13 → −17 | lichens, coussins |
| 7 | Les éboulis | 2 500–3 100 m | −18 → −21 | pierriers |
| 8 | Le glacier | 3 100–3 700 m | −22 → −27 | séracs, crevasses, givre |
| 9 | L'arête | 3 700–4 200 m | −28 → −33 | corniches, perches givrées |
| 10 | Le sommet | 4 300 m | −35 | une dalle |

Eau : pluie au-dessus de +1 °C, grésil entre +1 et −1, neige au-dessous. Le
temple de Sorne garde l'Aube comme première fin ; la vraie fin est au sommet.
Gameplay retenu : le froid sans barre (givre, ralenti), des bivouacs (mort au
dernier feu), l'abri contre la pluie, les sols (boue, glace, crevasse sondée),
le vent qui pousse (arête seulement), des cairns facultatifs, le sommet visible
dès le titre, les traces de ceux d'avant, l'air mince (doux). Refusés : la
corde (équipement), le regard en arrière (zoom). Plus tard : « Froid doux ».
Ordre : v1.68 pluie, v1.69 placeholders de végétation (37 types) et altitude,
v1.70 végétation de l'existant, v1.71 froid et bivouacs, v1.72 prolongement
nord-est, v1.73 vent, cairns, sommet visible, vraie fin.
