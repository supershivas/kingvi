@.claude/conventions.md

# KINGVI SNO 7

## Description

Jeu contemplatif en pixel art : un viking armé d'une épée accoste sur une île
enneigée et suit des traces dans la neige. Très peu d'éléments, écran en trois
couleurs (neige bleutée, bleu nuit, et le rouge de l'accent pour le sang et les
repères du labo ; un noir profond autour de l'intérieur de la maison et pour
la coque de la barque), avec un temps qui change selon un cycle
naturel, le jour et la nuit, un effet
d'écran cathodique discret et un flou de maquette (en ellipse autour du
héros), désactivables.
Vue de très loin : on doit sentir l'immensité de l'île.
**Rien de géométrique dans ce monde** : ni droite, ni grille, ni cercle, ni
arc parfaits. Tout est tordu par du bruit, cassé, effrité, asymétrique
(falaise, grotte, crypte, pierres, rivages). Seuls les objets fabriqués
(maison, barques, coffre) gardent quelques lignes, et encore, usées.

Au lancement, un écran d'accueil : le nom en gothique étrange (Grenze
Gotisch), et Reprendre, Nouveau jeu (un second clic confirme l'effacement de
la partie), Réglages. Le nom dans l'en-tête y ramène.

On part de la grève ouest, près de la barque échouée qui flotte (une seconde
barque, mâtée sans voile, vue sous un autre angle, halée sur la grève : le
sillon de sa quille court jusqu'à l'eau ; ils étaient deux ; des
icebergs plats au large, des vagues qui roulent sur la grève), et on suit les traces vers l'est (deux pistes côte à côte jusqu'à la maison,
une seule en ressort) : le champ des morts (navires, cercles et triangles de
pierres levées, d'après Lindholm Høje), quelques arbres,
une volée de corbeaux qui s'envole à l'approche, la forêt, une statue géante de Freya ensevelie, penchée et
brisée, puis la forêt noire, longue à traverser (si dense que le sol est
noir ; la sente y file sans trop serpenter, se resserre, s'ouvre en
clairières), une grande
Freya debout à la sortie, la maison (vue de biais, sans fumée ni lumière).
Les traces entrent par la porte ; on y entre aussi (nouvelle scène : la pièce,
noire tout autour, un corps, du sang), et elles ressortent tachées de sang
vers l'est.
Au bout des traces, un autre viking attend : il vient au contact et frappe ;
trois coups de part et d'autre abattent (zoom d'action, sang qui gicle, on
saigne en marchant, les blessures se referment hors du combat). Mort, on
repart de la barque. Quand on s'éloigne d'un cadavre, des corbeaux s'y
abattent. Plus loin, une falaise gigantesque face au sud, faite de pans
avancés ou reculés, et l'entrée d'une grotte (on n'y entre pas encore).
Au sud de la piste, avant la forêt, un lac : une barque (on y monte en
marchant dessus, on rame, on descend en abordant une rive), un îlot, une
Freya plus petite avec une porte dans sa robe ; dedans, une crypte et un
coffre à ouvrir (clic près de lui).
La nuit, le viking sort une torche : le voile de nuit s'ouvre en paliers
tramés autour de lui, arbres et rochers portent une ombre à l'opposé.
Le viking est tout noir ; sa cape bat au vent ; les arbres ploient sous le vent.

La page `labo.html` regroupe toutes les animations (menu en haut vers les
sections), une vue par animation, sur la neige aux couleurs du jeu :
carte de l'île (un clic y téléporte le viking), barque, jour et nuit, viking,
cape, attaques (8 directions), torche, intérieur de la maison, lac, crypte,
falaise, vagues, icebergs, charognards ; et des propositions à choisir
(lettres A, B, C…) : pontons, seconde barque, nécropole d'après Lindholm Høje,
ambiances de vent, arbres, rochers, maison, statues, corbeaux, loups, cerfs
et biches.

Commandes : ZQSD (touches physiques, donc WASD en QWERTY) ou flèches pour
marcher, Maj pour courir, clic pour frapper vers le pointeur (huit directions :
les diagonales se jouent de profil, lame en travers), molette pour zoomer. L'épée
est cachée et ne sort que pendant l'attaque.

- Production : https://supershivas.github.io/kingvi/
- Catégorie : **secondaire**.
- Cible : **uniquement bureau** (bandeau refermable sur téléphone).

## Stack

- HTML/CSS/JS statique, modules ES, sans build.
- Phaser 3.90.0, copié dans `vendor/phaser.min.js` (dépendance validée ;
  ne pas passer par un CDN : l'app doit charger même si le CDN tombe).
- Hébergement : GitHub Pages, branche `main`, racine du dépôt (`.nojekyll`).
- Données : `localStorage` uniquement (`kingvi:save` : position, orientation,
  nombre de pas, `foeDead`, `rowboat` (position de la barque du lac),
  `chestOpen` ; `kingvi:prefs` : effet CRT, tilt-shift, vent,
  décalage de l'heure du jeu `dayOffset` en secondes, 0 pour suivre l'heure). Récupérables via l'export JSON.
  Pas de Supabase.

## Structure

- `index.html` — en-tête, écran de jeu, écran d'accueil (`#title`),
  réglages (`<dialog>`, « Nouveau jeu » en premier), toast.
- `labo.html`, `js/labo.js`, `css/labo.css` — le labo d'animations (canvas 2D,
  mêmes modules que le jeu). Toute nouvelle animation y a sa carte.
- `js/main.js` — interface : écran d'accueil, nouveau jeu (efface
  `kingvi:save` et recharge, drapeau `kingvi:start` en sessionStorage pour
  entrer directement), réglages, export, sauvegarde, mise à jour auto.
- `js/game.js` — scène Phaser : sol par morceaux, objets debout triés en
  profondeur par la ligne de leurs pieds (un atlas par morceau), viking et
  cape (calque à part), attaque (traînée, impact), maison. Le canevas a la
  taille de l'écran en pixels physiques (`devicePixelRatio`, zoom Phaser
  1/dpr) ; la caméra agrandit d'un facteur entier de pixels physiques au repos
  (`updateZoom` : base selon la hauteur d'écran, molette ±, combat, ×2 dedans). Le vent est dessiné sur un canvas 2D posé sur le jeu.
  `WORLD_VERSION` (dans `world.js`, partagé avec la carte du labo) : à
  incrémenter quand l'île change, les anciennes positions sauvegardées
  repartent alors de la barque. Voile de nuit : une RenderTexture
  multipliée au-dessus de tout, masquée en plein jour, où la torche efface son
  halo ; les ombres portées (pixels tramés) y sont redessinées : elles ne sont
  jamais plus sombres que la nuit hors du halo (`updateNight`). Les intérieurs (`INTERIORS` : la
  maison, la crypte) sont des pièces posées loin en mer, fond noir, profondeur
  `DEPTH_ROOM` au-dessus du dehors ; on y passe par un fondu
  (`goInside(key)` / `goOutside`). Barque du lac : `checkBoat`, `row`, `landAt`.
- `js/viking.js` — le sprite, dessiné pixel par pixel à partir de poses
  (marche et attaque en 4 temps, profil/face/dos ; attaques en diagonale
  `diagup` / `diagdown`, `ATTACK_VIEWS`), la cape (3 forces × 6
  temps) et la traînée du coup.
- `js/boat.js` — la barque (pixels tirés de l'image de référence, réduite par
  `BOAT_SCALE`, coque noire `k` sans liseré), la seconde (`BOAT2` : cisaillée,
  un mât), ligne de flottaison, bords, roulis (`BOAT_FRAMES`) ; la
  petite barque du lac, vide ou avec le rameur (`ROWBOAT_FRAMES`).
- `js/props.js` — décor à choisir dans le labo : nécropole (navire de
  pierres, triangle, cercle, tertre, champ des morts — E est dans le jeu :
  `necropolisStones`, `stoneArt`), pontons, seconde barque.
- `js/crypt.js` — la crypte de la statue du lac, creusée (sol en ellipse
  cabossée, dalles et moellons en cellules de Voronoï), runes, ossements, et le
  coffre (`CHEST_FRAMES` : fermé, entrouvert, ouvert).
- `js/sea.js` — les vagues, partagées jeu/labo : rouleaux qui avancent vers
  la grève puis se retirent (pixels du rivage mis en cache par carreau),
  moutons au large. Dans le jeu, un calque `DEPTH_WAVES` redessiné ~8 fois/s.
- `js/foe.js` — l'autre viking, au bout des traces : attente, approche,
  attaque (il arme, puis `onStrike`), recul quand il est touché, `FOE_HP`
  coups ; `hitAt` teste la pointe de la lame du héros. Tombé, il reste à terre.
- `js/interior.js` — la pièce (sol repéré en u, v), meubles, corps, sang ;
  `roomWalkable`, `atRoomDoor`, `ROOM_ENTRY`.
- `js/daylight.js` — jour et nuit (`DAY_CYCLE`, 20 min sur l'horloge réelle) :
  `night` (0 → 1) et `dusk` (lueur de l'aube et du crépuscule) ; `torchLight`,
  le halo tramé de la torche (partagé jeu/labo).
- `js/weather.js` — vent et neige, partagés jeu/labo. Ambiances Calme, Bise,
  Rafales, Tempête, Tourbillons, enchaînées par défaut en un cycle logique
  (`WEATHER_CYCLE`, ~8 min, fondus de 18 s) calé sur l'horloge réelle ; le
  joueur peut figer une ambiance dans les Réglages. Le nombre de flocons est
  plafonné quand on dézoome, et la neige s'installe en 2 s au lancement.
- `js/trees.js` — générateurs : sapins, arbres morts, gros rochers, cairns,
  icebergs plats ; `leanRows` : un arbre penché de −1 à +2 pixels à la cime
  (`LEANS`). Le jeu met les quatre inclinaisons de chaque arbre dans l'atlas
  du morceau (1024 px de large) et en change ~22 fois par seconde
  (`swayTrees`) : `treeWind` (quasi rien sous la bise), `treeLean`,
  `treeFreq` (les petits arbres battent plus vite).
- `js/wolf.js` — loups (labo seulement pour l'instant) : petits, trapus,
  voûtés, la tête plus basse que le garrot (pas de chien de dessin animé) ;
  trot, galop, arrêt, grogne, flaire, hurle, assis.
- `js/deer.js` — cerfs (bois) et biches : marche, bond, arrêt, broute,
  brame / alerte.
- `js/fauna.js` — les bêtes dans le jeu : envol de corbeaux (`CROWS`, ils
  filent jusqu'à sortir de l'écran), charognards sur le cadavre de l'autre
  viking (`updateCarrion`). Cerfs et biches codés mais retirés pour
  le moment (`DEER_ENABLED = false`).
- `js/statue.js` — la statue de Freya : pixels tirés d'une photo
  (b sombre, m demi-teinte), lissés, cassés (coiffe, épaule), inclinés,
  enfouis ; éclats et débris autour. `buildStatueUpright` : la grande, droite ;
  `buildStatueDoor` : celle de l'îlot, réduite, une porte dans la robe.
- `js/world.js` — l'île, déterministe (graine fixe) : côte, traces, rochers,
  pierres levées, maison (`makeHouse`, `houseBlocked`, `houseFrontY`,
  `HOUSE_DOOR_OUT`), traces ensanglantées après la porte (`p.blood`), forêt (`forestDx` : bandes à lisière irrégulière,
  `forestDensity`, `deepForest`, largeur de sente `p.lane`, `CLEARINGS`), statues et corbeaux placés le long de la
  piste (`STATUE_BASE`, `STATUE2_BASE`, `CROWS`), `objectsInChunk`, `blocked`.
  Le lac (`LAKE`, `ISLET`, `inLake`) passe par `coast` (positif dans l'eau) ;
  `companion` : la piste du second marcheur, décalée sur la gauche, jusqu'à
  la porte de la maison (peinte avec les traces, sans toucher au tracé).
  `seaCoast` (la mer seule) sert au tracé et à l'accostage, pour que le lac ne
  les déplace pas. La falaise (`CLIFF`, `CAVE`, `CLIFF_PARTS`) : des tranches
  de 20 px, objets triés comme les autres, qui bloquent tout leur pied ; des
  pans (`cliffStep`) avancés ou reculés (`cliffFoot`), plus ou moins hauts.
  Le champ des morts (`NECRO`) : une pierre par objet.
- `css/style.css` — tokens en variables CSS, composants partagés, effet CRT,
  écran d'accueil (`--font-game-title` : la gothique du titre, propre au jeu).
- `app-update.js`, `mobile.css` — copies du design system, tenues à jour par
  `scripts/sync-design-system.sh`. Ne pas les modifier ici.

## Exceptions aux conventions

- Les trois couleurs du jeu (`--game-snow`, `--game-night`, et `--accent`)
  sont propres à l'app : ce sont des couleurs de jeu, pas d'interface.
- La police gothique du titre (Grenze Gotisch, Google Fonts) est propre au
  jeu (`--font-game-title`), hors des tokens du design system.
- Pas de mode sombre : le jeu a sa propre palette (facultatif pour une app
  secondaire).

## Pièges connus

- Les déplacements lisent `event.code` (touches physiques), pas `event.key` :
  ZQSD en AZERTY et WASD en QWERTY marchent sans rien configurer.
- Tout changement dans `world.js` qui consomme le générateur aléatoire
  (`rng`) ou touche au tracé déplace les traces et les objets : vérifier la
  carte de l'île (la piste doit atteindre son bout, sans se perdre dans la
  forêt noire), et incrémenter `WORLD_VERSION` dans `world.js`.
- Le viking doit peser sur la neige : son ombre est dessinée dans le sprite,
  sur la ligne même des pieds. Une ombre séparée, un pixel plus bas, le
  faisait léviter.
- Il doit rester petit (environ 9 pixels de haut, écran d'environ 440 pixels
  de haut) et se lire comme une masse : pas de visage ni de détail.
- Tout se mesure au viking : porte de la maison ≈ sa taille, tête du loup à
  la hauteur de son casque, statue ≈ dix fois sa taille. Vérifier dans le labo.
- La cape est courte et discrète : au calme elle se confond avec le dos ; même
  par grand vent elle ne dépasse que de quelques pixels (pas de cape de héros).
- Les cairns sont d'un seul tenant et jamais symétriques.
- Labo : c'est le document qui défile (pas le body comme dans le jeu), pour
  que l'en-tête et le menu restent collés en haut partout.
- JS : un accesseur (`get x()`) passé dans `Object.assign` est évalué une
  fois et figé ; utiliser `Object.defineProperty` (bug de `foe.alive`).
- Le corps est centré sur la colonne CX et l'origine du sprite est au milieu
  de cette colonne : le retournement ne décale rien, et la cape se place au
  pixel près (`placePlayer`).
- Rendu en pixels physiques : sans cela, sur un écran à 125 % (ou autre
  densité fractionnaire), les lignes du CRT et les pixels du jeu tombent entre
  deux pixels de l'écran et dessinent des bandes claires horizontales.
- `pagehide` sauvegarde la partie : pour tester une position, écrire la
  sauvegarde avant le chargement (sinon elle est écrasée).
