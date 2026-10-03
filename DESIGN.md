# KINGVI SNO 7 — Bible du jeu

Document de référence de l'équipe d'agents (designers, testeurs, synthèse).
Il décrit le jeu tel qu'il est (v1.22) et ce qu'il veut être. Les détails
techniques sont dans `CLAUDE.md` ; ici, l'intention.

## Intention

Un viking accoste sur une île enneigée et suit des traces dans la neige.
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

## Le voyage, chapitre par chapitre

Chaque chapitre s'inscrit une fois par vie, en haut de l'écran
(« Chapitre III » en petit, le nom en gothique), et la musique retient son
souffle (sauf aux combats).

| # | Chapitre | Ce qu'on y trouve | Ce qu'on y lit |
|---|---|---|---|
| I | La grève | La barque échouée qui flotte, une seconde barque mâtée halée sur la grève (le sillon de sa quille), icebergs, vagues | Ils étaient deux |
| II | La plaine des morts | Navires, cercles et triangles de pierres levées (d'après Lindholm Høje), quelques arbres, une volée de corbeaux qui s'envole | Un lieu de sépulture ancien |
| — | (l'arche, les ruines) | Une arche de pierre seule au nord de la piste, une douzaine de fois le viking, qu'on peut traverser ; une colonne couchée avant le lac ; un socle à degrés et ses piliers brisés au sortir de la forêt noire (on monte dessus, les piliers bloquent) ; une arche en ruine entre la maison et la falaise | Une civilisation disparue, avant les vikings |
| III | La forêt | La forêt s'épaissit ; une statue géante de Freya ensevelie, penchée, brisée | Des dieux tombés |
| IV | La forêt noire | Si dense que le sol est noir ; la sente se resserre, trois clairières seulement (une vide, l'arbre aux offrandes, les loups). Longue à traverser | L'oppression, la perte de repères |
| V | Les loups | À mi-chemin, le bosquet sacré : un grand arbre mort chargé d'offrandes. À la sortie du noir, une grande clairière ouverte sur la plaine : une meute de trois loups en sort quand on y entre (hurlement au loin avant) | Le danger, le sacré |
| — | (le guetteur) | Plus loin, une grande silhouette encapuchonnée qui s'efface quand on approche ; ses pas s'arrêtent net | Une présence, sans explication |
| VI | La maison | Une grande Freya debout à la sortie de la forêt, puis la maison (sans fumée ni lumière). Les traces entrent par la porte ; dedans, un corps, du sang. Une seule piste ressort, tachée de sang | Le meurtre |
| VII | L'autre | Au bout des traces, un viking attend. Il vient au contact et frappe | La confrontation |
| VIII | La falaise | Une falaise gigantesque face au sud, des pans avancés et reculés, l'entrée d'une grotte | Au-delà du récit des traces |
| IX | Le roi sous la roche | Dans la grotte (toujours la nuit, la torche s'allume) : galerie, mare gelée, ossements, un roi mort sur son trône ; à l'approche, sa tête tombe et sa couronne roule | La fin d'une lignée |
| Interlude | Le lac | Au sud de la piste, avant la forêt : un ponton sur pilotis qui part de la rive nord (on y marche), la barque amarrée au bout (on rame), un îlot, une Freya plus petite avec une porte dans sa robe ; une crypte, un coffre à ouvrir | Un détour, un secret |

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
  souffle qui chasse la neige alentour ; il touche tout autour (plus
  cher en endurance).
- Trois coups abattent l'autre viking, trois coups nous abattent ; un loup
  tombe en deux coups. On voit venir le coup de l'autre (il arme).
- L'endurance (une barre au-dessus du viking) : frapper et courir la vident.
- Blessé, on saigne en marchant ; hors combat, les blessures se referment.
  À un point de vie, l'écran se teinte de rouge.
- Pas de zoom de caméra, secousses minimes (un pixel, un instant, seulement pour un vrai coup), sang qui gicle et
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

### La musique et le son
Tout est synthétisé. Une deep techno contemplative qui suit l'humeur : calme
sur la grève, sourde dans la forêt noire, tendue à l'approche de l'autre, à
son comble au combat, puis un silence ; étouffée à l'intérieur ; muette
quelques secondes quand le guetteur s'efface ou que le roi s'incline.

### L'interface qui existe
Volontairement mince : l'écran d'accueil (titre gothique sur la mer de nuit),
les chapitres, la barre d'endurance (seulement quand elle n'est pas pleine),
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

Pas d'autre couleur. Les nuances viennent de la trame (pixels alternés), du
voile de nuit et de la lueur rasante de l'aube et du crépuscule.

## Ce que le jeu refuse

Propositions à valider par Jérôme. Les tensions avec l'existant sont
signalées, pas tranchées.

- **Pas d'objectif affiché.** Ni quête, ni flèche, ni marqueur : seules les
  traces guident. `[À VALIDER]`
- **Pas de carte en jeu.** La carte n'existe que dans le labo. `[À VALIDER]`
- **Pas de tutoriel bavard.** Une seule consigne de commandes, qui s'efface
  seule. Pas de bulle, pas de « appuyez sur… » contextuel. `[À VALIDER]`
- **Pas de dialogue ni de texte narratif.** Personne ne parle ; les seuls mots
  sont les noms des chapitres. `[À VALIDER]`
- **Pas de loot, pas d'équipement, ni d'expérience ni de niveaux.** Décision
  de Jérôme (v1.44.0) : un inventaire (touche I) ne garde que les reliques,
  trois à ce jour (la poupée de l'arbre sacré, le rubis du roi mort, le
  médaillon de la maison). Elles ne donnent rien : on les trouve. *Tension :*
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
