@.claude/conventions.md

# KINGVI SNO 7

## Description

Jeu contemplatif en pixel art : un viking armé d'une épée accoste sur une île
enneigée et suit des traces dans la neige. Très peu d'éléments, écran en trois
couleurs (neige bleutée, bleu nuit, et le rouge de l'accent pour le sang et les
repères du labo ; un noir profond autour de l'intérieur de la maison), avec un temps qui change selon un cycle
naturel, le jour et la nuit, un effet
d'écran cathodique discret et un flou de maquette (tilt-shift), désactivables.
Vue de très loin : on doit sentir l'immensité de l'île.

On part de la grève ouest, près de la barque échouée qui flotte (quelques
icebergs plats au large), et on suit les traces vers l'est : quelques arbres,
une volée de corbeaux qui s'envole à l'approche, la forêt, une statue géante de Freya ensevelie, penchée et
brisée, puis la forêt noire, longue à traverser (si dense que le sol est
noir ; la sente y file sans trop serpenter, se resserre, s'ouvre en
clairières), une grande
Freya debout à la sortie, la maison (vue de biais, sans fumée ni lumière).
Les traces entrent par la porte ; on y entre aussi (nouvelle scène : la pièce,
noire tout autour, un corps, du sang), et elles ressortent tachées de sang
vers l'est.
Le viking est tout noir ; sa cape bat au vent ; les arbres ploient sous le vent.

La page `labo.html` regroupe toutes les animations (menu en haut vers les
sections), chacune sur fond blanc et sur fond noir, pour choisir et régler :
carte de l'île (un clic y téléporte le viking), barque, jour et nuit, viking,
cape, attaques, intérieur de la maison, icebergs,
ambiances de vent, arbres, rochers, maison, statues, corbeaux, loups, cerfs
et biches.

Commandes : ZQSD (touches physiques, donc WASD en QWERTY) ou flèches pour
marcher, Maj pour courir, clic pour frapper vers le pointeur (droite, gauche,
haut, bas). L'épée
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
  nombre de pas ; `kingvi:prefs` : effet CRT, tilt-shift, vent, moment de la
  journée figé `dayFixed` ou `null` pour suivre l'heure). Récupérables via l'export JSON.
  Pas de Supabase.

## Structure

- `index.html` — en-tête, écran de jeu, réglages (`<dialog>`), toast.
- `labo.html`, `js/labo.js`, `css/labo.css` — le labo d'animations (canvas 2D,
  mêmes modules que le jeu). Toute nouvelle animation y a sa carte.
- `js/main.js` — interface : réglages, export, sauvegarde, mise à jour auto.
- `js/game.js` — scène Phaser : sol par morceaux, objets debout triés en
  profondeur par la ligne de leurs pieds (un atlas par morceau), viking et
  cape (calque à part), attaque (traînée, impact), maison, échelle
  entière (`fitScreen`). Le vent est dessiné sur un canvas 2D posé sur le jeu.
  `WORLD_VERSION` : à incrémenter quand l'île change, les anciennes positions
  sauvegardées repartent alors de la barque. Voile de nuit : rectangle
  multiplié au-dessus de tout. L'intérieur de la maison est une pièce posée
  loin en mer (`ROOM_AT`), fond noir, profondeur `DEPTH_ROOM` au-dessus du
  dehors ; on y passe par un fondu (`goInside` / `goOutside`), caméra ×2.
- `js/viking.js` — le sprite, dessiné pixel par pixel à partir de poses
  (marche et attaque en 4 temps, profil/face/dos), la cape (3 forces × 6
  temps) et la traînée du coup.
- `js/boat.js` — la barque (pixels tirés de l'image de référence, liseré
  clair pour la détacher de la mer sombre), ligne de flottaison, bords, roulis
  (`BOAT_FRAMES`).
- `js/interior.js` — la pièce (sol repéré en u, v), meubles, corps, sang ;
  `roomWalkable`, `atRoomDoor`, `ROOM_ENTRY`.
- `js/daylight.js` — jour et nuit (`DAY_CYCLE`, 20 min sur l'horloge réelle) :
  `night` (0 → 1) et `dusk` (lueur de l'aube et du crépuscule).
- `js/weather.js` — vent et neige, partagés jeu/labo. Ambiances Calme, Bise,
  Rafales, Tempête, Tourbillons, enchaînées par défaut en un cycle logique
  (`WEATHER_CYCLE`, ~8 min, fondus de 18 s) calé sur l'horloge réelle ; le
  joueur peut figer une ambiance dans les Réglages.
- `js/trees.js` — générateurs : sapins, arbres morts, gros rochers, cairns,
  icebergs plats ; `leanRows` : un arbre penché de −1 à +2 pixels à la cime
  (`LEANS`). Le jeu met les quatre inclinaisons de chaque arbre dans l'atlas
  du morceau (1024 px de large) et en change ~11 fois par seconde
  (`swayTrees`), selon la force du vent, les rafales et une vague d'ouest en est.
- `js/wolf.js` — loups (labo seulement pour l'instant), d'après des
  silhouettes de référence : trot, galop, arrêt, flaire, hurle, assis.
- `js/deer.js` — cerfs (bois) et biches : marche, bond, arrêt, broute,
  brame / alerte.
- `js/fauna.js` — les bêtes dans le jeu : envol de corbeaux (`CROWS`, ils
  filent jusqu'à sortir de l'écran). Cerfs et biches codés mais retirés pour
  le moment (`DEER_ENABLED = false`).
- `js/statue.js` — la statue de Freya : pixels tirés d'une photo
  (b sombre, m demi-teinte), lissés, cassés (coiffe, épaule), inclinés,
  enfouis ; éclats et débris autour. `buildStatueUpright` : la grande, droite.
- `js/world.js` — l'île, déterministe (graine fixe) : côte, traces, rochers,
  pierres levées, maison (`makeHouse`, `houseBlocked`, `houseFrontY`,
  `HOUSE_DOOR_OUT`), traces ensanglantées après la porte (`p.blood`), forêt (`forestDx` : bandes à lisière irrégulière,
  `forestDensity`, `deepForest`, largeur de sente `p.lane`, `CLEARINGS`), statues et corbeaux placés le long de la
  piste (`STATUE_BASE`, `STATUE2_BASE`, `CROWS`), `objectsInChunk`, `blocked`.
- `css/style.css` — tokens en variables CSS, composants partagés, effet CRT.
- `app-update.js`, `mobile.css` — copies du design system, tenues à jour par
  `scripts/sync-design-system.sh`. Ne pas les modifier ici.

## Exceptions aux conventions

- Les trois couleurs du jeu (`--game-snow`, `--game-night`, et `--accent`)
  sont propres à l'app : ce sont des couleurs de jeu, pas d'interface.
- Pas de mode sombre : le jeu a sa propre palette (facultatif pour une app
  secondaire).

## Pièges connus

- Les déplacements lisent `event.code` (touches physiques), pas `event.key` :
  ZQSD en AZERTY et WASD en QWERTY marchent sans rien configurer.
- Tout changement dans `world.js` qui consomme le générateur aléatoire
  (`rng`) ou touche au tracé déplace les traces et les objets : vérifier la
  carte de l'île (la piste doit atteindre son bout, sans se perdre dans la
  forêt noire), et incrémenter `WORLD_VERSION` dans `game.js`.
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
- Le corps est centré sur la colonne CX et l'origine du sprite est au milieu
  de cette colonne : le retournement ne décale rien, et la cape se place au
  pixel près (`placePlayer`).
- `pagehide` sauvegarde la partie : pour tester une position, écrire la
  sauvegarde avant le chargement (sinon elle est écrasée).
