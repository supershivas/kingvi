@.claude/conventions.md

# KINGVI SNO 7

## Description

Jeu contemplatif en pixel art : un viking armé d'une épée accoste sur une île
enneigée et suit des traces dans la neige. Très peu d'éléments, écran en trois
couleurs (neige bleutée, bleu nuit, et le rouge de l'accent pour le sang et les
repères du labo). **Aucun pixel noir** : ce qui était noir (rochers, coques,
traits des dessins, fond autour des intérieurs) est en bleu nuit (`--game-black`
vaut le bleu nuit ; la lettre `k` des dessins existe toujours, même couleur), avec un temps qui change selon un cycle
naturel, le jour et la nuit (par défaut : la nuit, toujours, et la tempête ;
`prefs.dayNight`, `wind: 'tempete'`), un effet
d'écran cathodique discret et un flou de maquette, désactivables.
La vue est rapprochée (écran d'environ 280 pixels du jeu de haut), sans
aucun zoom de caméra (ni molette, ni combat, ni intérieurs), la caméra serre
le viking (`FOLLOW`) ; on ne voit qu'à distance de vue du héros : net autour
de lui, flou vers le bord du cercle de vue, puis le noir, tramé par paliers,
au bord rongé (`SIGHT`, `drawSight`, canevas `#sight`).
**Rien de géométrique dans ce monde** : ni droite, ni grille, ni cercle, ni
arc parfaits. Tout est tordu par du bruit, cassé, effrité, asymétrique
(falaise, grotte, crypte, pierres, rivages). Seuls les objets fabriqués
(maison, barques, coffre) gardent quelques lignes, et encore, usées.

Au lancement, un écran d'accueil, sans sous-titre : le nom en gothique
étrange (Grenze Gotisch), tracé petit puis pixelisé et texturé (croûte de
neige, ombre tramée, éclats, glaçons ; `drawTitle` dans `main.js`, agrandi
d'un facteur entier), sur la mer de nuit où vogue la barque, le viking debout
dedans (houle qui roule vers nous en crêtes tramées, roulis, sillage, moutons,
icebergs au loin, neige, bords vignettés : `js/titlesea.js`, arrêté quand
l'accueil est caché), avec sa propre musique
(sourde, sombre : `isTitle` → `musicMood`), et Reprendre, Nouveau jeu (un second clic confirme l'effacement de
la partie), Réglages. Le nom dans l'en-tête y ramène. En entrant dans le
jeu, la musique de l'accueil se tait, l'écran reste noir le temps de placer
la caméra sur le viking et de charger l'île autour de lui (`game.focus()`,
puis `game.ready()` : morceaux chargés, quelques images posées ; la neige
se répand d'un coup dans une vue qui a sauté), puis le noir s'ouvre en rond depuis le centre, bord fondu (`openIris`,
`#iris`). En jeu, les coins de l'écran sont un peu assombris (`.vignette`).

On part de la grève ouest, près de la barque échouée qui flotte (une seconde
barque, mâtée sans voile, vue sous un autre angle, halée sur la grève : le
sillon de sa quille court jusqu'à l'eau ; ils étaient deux ; des
icebergs plats au large, des vagues qui roulent sur la grève), et on suit les traces vers l'est (deux pistes côte à côte jusqu'à la maison,
une seule en ressort) : le champ des morts (navires, cercles et triangles de
pierres levées, d'après Lindholm Høje), quelques arbres,
une volée de corbeaux qui s'envole à l'approche, la forêt, une statue géante de Freya ensevelie, penchée et
brisée, puis la forêt noire, longue à traverser (si dense que le sol est
noir ; la sente y file sans trop serpenter, se resserre ; trois clairières
seulement : une vide au premier quart ; au milieu, le bosquet sacré, un grand
arbre mort (~7 fois le viking) chargé d'offrandes qui tournent au vent, et
juste après lui le guetteur ; à la sortie du noir, la grande clairière des
loups, ouverte vers la plaine (`DEN_OPEN` : les repaires sont du côté de la
forêt) : une meute de trois loups qui sort de la forêt
quand on y entre (galop en quatre temps, avec un temps pattes rassemblées ;
des pas d'un pixel, pâles, dans la neige : `wolfPrint` ; hurlement au loin avant ; ils encerclent, grondent, bondissent
l'un après l'autre pour mordre ; deux coups en abattent un ; quand deux sont
tombés, les autres s'enfuient et ne reviennent plus ; leurs pistes errent
autour de la clairière ; si l'on s'enfuit en saignant, ils suivent le sang :
au retour, ils sortent plus tôt et poursuivent plus loin, `pack.scent` ; le
guetteur : grande silhouette
encapuchonnée qui s'efface quand on approche, jamais pendant un combat, ses pas s'arrêtant net), une grande
Freya debout à la sortie, la maison (vue de biais, sans fumée ni lumière).
Les traces entrent par la porte ; on y entre aussi (nouvelle scène : la pièce,
noire tout autour, un corps, du sang), et elles ressortent tachées de sang
vers l'est.
Au bout des traces, un autre viking attend : il vient au contact et frappe ;
trois coups de part et d'autre abattent (sang qui gicle, on
saigne en marchant, les blessures se referment hors du combat). Mort, le
noir se referme sur le corps (`shutIris`), « Vous êtes mort » s'inscrit, on
repart de la barque (`onDeath` → `die` dans `main.js`, `respawn`), le noir se
rouvre quand l'île est prête, et les chapitres s'inscrivent de nouveau.
Tant que l'iris bouge ou couvre l'écran, le jeu est en pause (`irisBusy`). Quand on s'éloigne d'un cadavre, des corbeaux s'y
abattent (l'autre viking, et les loups tués). Plus loin, une falaise gigantesque face au sud, faite de pans
avancés ou reculés, et l'entrée d'une grotte : on y entre (il y fait toujours
nuit, la torche s'allume) ; une galerie qui serpente, une mare gelée, des
ossements, et au fond, dans une grande salle, un roi squelette immense sur son
trône (d'après le dessin fourni) : quand on approche, sa tête s'affaisse et sa
couronne roule au pied de l'estrade (`kingBowed`).
Au sud de la piste, avant la forêt, un lac : une barque (on y monte en
marchant dessus, on rame, on descend en abordant une rive), un îlot, une
Freya plus petite avec une porte dans sa robe ; dedans, une crypte et un
coffre à ouvrir (clic près de lui).
Aux grands moments, un chapitre s'inscrit dans le haut de l'écran, une fois
par vie (`chapters` dans la sauvegarde, vidé à la mort ; La grève 2,5 s de
jeu après l'ouverture du noir, `calm`) : « Chapitre I » en petit, le nom
en grand dans la gothique du titre, sobre : rien que le texte clair, cerné
d'une ombre bleu nuit discrète (lisible sur la neige comme sur la mer), qui
apparaît et s'efface en fondu, sans fond ni mouvement (`CHAPTER_STYLE`
`sobre`). I La grève, II La plaine
des morts, III La forêt, IV La forêt noire, V Les loups (la meute attaque),
VI La maison, VII L'autre (il vient au contact), VIII La falaise (après lui),
IX Le roi sous la roche (dans la grotte) ; Interlude, Le lac (en barque).
Hors des combats, la musique se tait un instant (`checkChapters` dans
`game.js`, `onChapter` → `showChapter` de `js/chapters.js`).
Une barre d'endurance au-dessus du viking (frapper et courir la vident,
`STAMINA`) ; à un point de vie, l'écran se teinte de rouge (`onHealth` →
`.hurt`). Les secousses d'écran sont minimes (`jolt` : rien pour la neige, le bois ou la pierre ; un pixel du jeu tout au plus, un instant, pour un vrai coup). À l'intérieur, la cape
ne bat pas.
La nuit, le viking sort une torche : le voile de nuit s'ouvre en paliers
tramés autour de lui, arbres et rochers portent une ombre à l'opposé, tramée
par les mêmes paliers que le halo (`castShadow` dans `daylight.js`, partagé
jeu/labo) ; celle d'un rocher (cairn, statue) part de sa base, d'un coin
inférieur à l'autre (`castShadowBase`, `artBase` : la rangée de pierre
la plus basse, sans les éclats posés autour), le bout rongé ; sa première
rangée couvre aussi la rangée noire du pied du rocher (le voile de nuit
glisse d'une fraction de pixel au rendu : sinon, une ligne claire s'ouvre).
Le viking est tout noir ; sa cape bat au vent ; les arbres ploient sous le vent.
Frapper un arbre le fait trembler et tomber sa neige (« toc ») ; tous finissent
par tomber (un coup par 4 pixels de haut, deux au moins). Tous les rochers
finissent par céder : chaque coup en arrache un éclat qui tombe au pied
(`chipBoulder`, `chipRock`), les gros résistent longtemps (`boulderHits`) ;
au dernier, ils éclatent en morceaux qui restent au sol (`fellTree`,
`breakRock` ; `wrecked`, `chips` dans la sauvegarde). Un compteur discret,
en haut à droite, dit combien d'arbres abattus et de rochers brisés
(`tally`, `onTally`) ; frapper une
pierre (rocher, cairn, statue, falaise) fait jaillir des étincelles, la lame
sonne et rebondit, le coup s'arrête net (`struckObject`, `shakeTree`,
`strikeRock`).
Le son est synthétisé (aucun fichier) : une deep techno contemplative et
changeante, le vent qui suit la météo (étouffé à l'intérieur), les corbeaux,
l'épée (fendre l'air, neige, chair, bois, pierre), le coffre, les loups
(hurlement, grondement, morsure, glapissement). Il démarre au premier geste du
joueur ; trois curseurs dans les Réglages : musique, bruitages, son du vent.
La musique suit l'humeur du moment (`musicMood` dans `game.js` →
`audio.setMood({ energy, dark, muffled })`) : calme sur la grève, sourde et
assombrie dans la forêt noire, tendue à l'approche de l'autre viking, à son
comble au combat, puis un silence ; étouffée à l'intérieur ; muette quelques
secondes quand le guetteur s'efface (`audio.hush`).

La page `labo.html` regroupe toutes les animations, rangées par thèmes en
onglets (L'île, Le rivage, Le viking, Les bêtes, Ciel et nature, Son, Interface ; un
seul thème affiché, avec le sous-menu de ses sections ; l'adresse garde le
thème ou la section, `#betes`, `#loups`), une vue par animation, sur la neige aux couleurs du jeu :
carte de l'île (un clic y téléporte le viking), chapitres, barque, jour et nuit, viking,
cape, attaques (8 directions, tourbillon, arbre qui tombe, rocher qui éclate), torche, meute,
grotte et roi mort, intérieur de la maison, lac, crypte,
falaise, vagues, icebergs, charognards ; et des propositions à choisir
(lettres A, B, C…) : pontons, seconde barque, nécropole d'après Lindholm Høje,
ambiances de vent, arbres, rochers, maison, statues, corbeaux, loups, cerfs
et biches ; dans Interface, les boutons de l'accueil et le menu Réglages
(maquettes HTML jouables, `js/labo-ui.js`, `css/labo-ui.css` : A l'actuel,
B à E des styles propres au jeu ; E est retenu pour les deux et branché
dans le jeu : boutons `.scrap`, réglages `.modal.stone` avec crans `.notches`).

Commandes : ZQSD (touches physiques, donc WASD en QWERTY) ou flèches pour
marcher, Maj pour courir, clic pour frapper vers le pointeur (huit directions :
les diagonales se jouent de profil, lame en travers). Le bouton maintenu
`WHIRL_HOLD` secondes (2, à régler dans `game.js`) : un remous de neige
grossit autour des pieds (`updateCharge`), puis le coup tourbillonnant, un
tour complet lame sortie, qui trace un anneau épais et bosselé (`whirlArc`,
moitié derrière, moitié devant le viking), puis un souffle : une onde qui
s'élargit en se déchirant (`blastRing`), la neige soufflée, les flocons
chassés (`weather.blast`) ; il touche une fois tout ce qui est autour (l'autre
viking, chaque loup ; les arbres tremblent) et coûte plus d'endurance
(`whirl`, `whirlStrike`, `STAMINA.whirl`). Sur écran tactile : la croix
pour marcher (au bord pour courir), toucher l'écran pour frapper. L'épée
est cachée et ne sort que pendant l'attaque.

- Production : https://supershivas.github.io/kingvi/
- Catégorie : **secondaire**.
- Cible : **uniquement bureau** (bandeau refermable sur téléphone), mais jouable au doigt : sur écran tactile,
  une croix directionnelle (`#dpad`, `game.setPad(x, y, courir)` → `scene.pad`),
  tout au bord pour courir ; toucher l'écran frappe.

## Stack

- HTML/CSS/JS statique, modules ES, sans build.
- Phaser 3.90.0, copié dans `vendor/phaser.min.js` (dépendance validée ;
  ne pas passer par un CDN : l'app doit charger même si le CDN tombe).
- Hébergement : GitHub Pages, branche `main`, racine du dépôt (`.nojekyll`).
  **Toujours pousser sur `main`**, même quand la session désigne une branche
  `claude/...` : Jérôme l'a redemandé.
- Données : `localStorage` uniquement (`kingvi:save` : position, orientation,
  nombre de pas, `foeDead`, `rowboat` (position de la barque du lac),
  `chestOpen`, `watcherGone`, `kingBowed`, `chapters` (chapitres déjà vus), `wrecked` (arbres abattus, rochers brisés),
  `wolvesDead` (loups tués, là où ils sont tombés), `chips` (coups déjà portés
  aux arbres et rochers encore debout), `tally` (le compteur) ; `kingvi:prefs` : qualité de l'image `quality` (1 → 3), météo, `musicVol`, `sfxVol`, `windVol` (0 → 100),
  décalage de l'heure du jeu `dayOffset` en secondes, 0 pour suivre l'heure). Récupérables via l'export JSON.
  Pas de Supabase.

## Structure

- `index.html` — en-tête, écran de jeu, écran d'accueil (`#title`, boutons
  en lambeaux de neige `.scrap`), réglages (`<dialog>` `.stone` : dalle aux
  bords cassés dans un cadre tramé, curseurs lus par crans `.notches`, posés
  par `main.js` sous le vrai `<input type="range">` rendu invisible ;
  « Nouveau jeu » en premier), toast.
- `labo.html`, `js/labo.js`, `css/labo.css` — le labo d'animations (canvas 2D,
  mêmes modules que le jeu). Chaque section porte son thème
  (`data-theme`) ; toute nouvelle section en a un. Toute nouvelle animation y a sa carte ; une
  section Son fait entendre la musique et chaque bruitage.
- `js/debug.js` — le mode debug du playtest, chargé seulement avec
  `?debug=1` (voir « Playtest et agents »). Il regarde le jeu sans le changer.
- `js/main.js` — interface : écran d'accueil, nouveau jeu (efface
  `kingvi:save` et recharge, drapeau `kingvi:start` en sessionStorage pour
  entrer directement), réglages, export, sauvegarde, mise à jour auto.
- `js/game.js` — scène Phaser : sol par morceaux, objets debout triés en
  profondeur par la ligne de leurs pieds (un atlas par morceau), viking et
  cape (calque à part), attaque (traînée, impact), maison.
  **Pas de temps fixe** : la logique (`tick`, marche, endurance, l'autre
  viking, la meute, la barque) avance par pas de 1/60 s (`STEP`) ; chaque
  image (`frame`) dessine l'état interpolé entre les deux derniers pas
  (`placePlayer(alpha)`, `foe.render`, `pack.render`, `placeRowboat`) ; au-delà
  de `MAX_FRAME` (0,5 s) d'un coup, le temps est perdu. Phaser ne lisse plus
  le temps (`fps.smoothStep: false`) ; la caméra suit à la même allure à toute
  cadence (`FOLLOW`). Les combats se jouent pareil à 7 ou à 60 images/s.
  **Vraie basse définition** : le canevas a un pixel par pixel du jeu
  (~280 de haut), agrandi sans lissage d'un facteur entier de pixels
  physiques (`fitScreen` : `factor` ; zoom Phaser `factor/dpr`) ; la caméra
  reste à 1 ; le facteur ne change qu'avec l'écran (`setFactor`, qui garde
  le centre de la vue et redessine le cercle de vue). Le calque de la neige
  et le cercle de vue (`#sight`) ont la taille du canevas ; les masques du
  flou lisent sa taille (`--sight-rx`, `--sight-ry`). Le CRT (`.crt-layer`) lit `--px` (un
  pixel du canevas) et `--line` (un pixel physique), posés sur `#screen` :
  ses lignes tombent sur les pixels. **Qualité de l'image** (Réglages, 1 → 3,
  `prefs.quality`) : 1 légère (ni CRT ni flou, moitié moins de flocons :
  `weather.density`), 2 économe (+ CRT), 3 complète (+ flou ; par défaut) ;
  l'ancien niveau 4 est ramené à 3 ; `game.setQuality(q)`.
  Le flou de maquette : une copie réduite de chaque image (`blurCopy`, après
  le rendu), agrandie en douceur sous un masque radial ; jamais de
  `backdrop-filter` plein écran (trop cher sur un Mac Intel).
  Les morceaux (tuiles de 256 px, `ground.js`) se préparent en plusieurs
  temps (`*loadChunk`, générateur), avec un budget de 5 ms par image, en
  avance sur la vue ; peints une fois (sol et planche des objets,
  `paintAtlas`), ils sont gardés en réserve quand ils sortent de la vue ;
  `cull` cache ce qui sort de l'écran (des milliers d'arbres dans la forêt
  noire) ; les planches d'objets s'écrivent en ImageData, pas pixel par pixel. Le vent est dessiné sur un canvas 2D posé sur le jeu.
  `WORLD_VERSION` (dans `world.js`, partagé avec la carte du labo) : à
  incrémenter quand l'île change, les anciennes positions sauvegardées
  repartent alors de la barque. Les pas, le sang, les entailles (`mark`,
  `wolfPrint`) et les traces permanentes (sillon de la barque, pistes de
  loups, pas du guetteur : `ground.decal`) s'écrivent dans la toile de la
  tuile, pas en objets ; `updateGround` les fait pâlir et renvoie les tuiles
  retouchées à la carte graphique. Voile de nuit : une RenderTexture
  multipliée au-dessus de tout, masquée en plein jour, où la torche efface son
  halo ; les ombres portées (pixels tramés) y sont redessinées : elles ne sont
  jamais plus sombres que la nuit hors du halo (`updateNight`). Les intérieurs (`INTERIORS` : la
  maison, la crypte, la grotte — `dark` : toujours nuit) sont des pièces posées loin en mer, fond noir, profondeur
  `DEPTH_ROOM` au-dessus du dehors ; on y passe par un fondu
  (`goInside(key)` / `goOutside`). Barque du lac : `checkBoat`, `row`, `landAt`.
- `js/ground.js` — les tuiles du sol (`createGround`) : peinture d'origine
  (`pristine`) et toile affichée, réserve des tuiles hors de vue (48 Mo, les
  moins récemment vues partent), marques qui pâlissent par paliers (la tuile
  est recomposée : peinture d'origine, puis les marques encore là), marques
  permanentes peintes dans la peinture d'origine. L'horloge des marques est
  celle du jeu (`scene.clock`, accélérée par le debug).
- `js/audio.js` — le son (Web Audio) : séquenceur à 16 pas, 116 BPM, phrases
  de 16 mesures (`arrangement`, qui dépend de l'énergie entendue), grosse caisse, charleston, basse, accords dub
  (écho, réverbération générée), nappe ; bruitages (`audio.play('swing' |
  'snow' | 'flesh' | 'wood' | 'clang' | 'caw' | 'creak' | 'presence' | 'howl' | 'growl' | 'bite' | 'yelp')`, `audio.wind(force, rafale, abrité)`, sur son propre canal) ;
  niveaux `audio.setVolume('music' | 'sfx' | 'wind', 0 → 1).
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
- `js/grove.js` — le bosquet sacré : `makeGroveTree` (arbre mort noueux,
  crochets des offrandes), `BUNDLE`, `WATCHER`. Placé dans `world.js`
  (`GROVE_TREE`, `GROVE_HOOKS`, `WATCHER_AT`, trouées ajoutées aux
  `CLEARINGS`) ; animé dans `game.js` (`updateGrove`).
- `js/ruins.js` — l'arche et les ruines (colonne couchée, socle, arche en
  ruine), d'après les dessins de `assets/` : on ne retouche pas leurs pixels.
  `monumentParts(clé, x, y)` : la plus grande masse d'un seul tenant est le
  monument ; les morceaux détachés du dessin sont laissés de côté, et des
  rochers cernés (`makeOutlinedRock` : trait d'un pixel, intérieur clair,
  polygone irrégulier ; type `stone`, ils bloquent) l'entourent ; une
  arche est coupée en trois tranches (pilier, passage `arch-vault`, pilier),
  chacune triée à son propre pied (`PASSAGES` : les colonnes du passage ;
  `FOOT` : la profondeur qui bloque ; toutes les pièces d'un monument sont
  rangées dans le morceau de son pied, `home`, pour qu'il se charge d'un
  bloc). Placées dans `world.js` (`ARCH`,
  `RUINS`, `LANDMARKS` : ni arbres ni rochers dans leur emprise).
  Ce sur quoi l'on monte (`DECKS`) : le dessus du socle et le tablier du
  ponton, un contour sur le dessin (`poly`) et une hauteur (`lift`) ; au sol,
  l'emprise est ce contour descendu de `lift` (`deckLift` dans `world.js`) ;
  dessus, le viking est dessiné `lift` pixels plus haut (`this.lift`, qui
  suit en un instant) ; le dessus est trié à son bord arrière (`depthY`), les
  colonnes sont découpées à part et bloquent. Sur le ponton, on marche
  au-dessus de l'eau (`walkable`). L'arche principale est texturée au
  chargement (`texture`, `TEXTURED` : grain en taches, fissures, pied rongé),
  sans toucher aux traits.
- `js/ruins-art.js` — leurs pixels, **générés** par `scripts/import-art.py`
  (ImageMagick) depuis `assets/` : couleurs ramenées aux trois du jeu (traits
  k, demi-teintes b, clairs s), le blanc du fond transparent, le blanc enfermé
  en neige. Les fichiers `_x1` sont à l'échelle du jeu ; `arche2.png`,
  `pont.png` sont réduites par moyenne ; `roi.png` est en négatif (traits
  blancs sur noir : la silhouette est refermée puis remplie de bleu nuit) ;
  `loups.png` est lu sur sa grille puis réduit de moitié (`WOLF_ART`).
  Les traits de l'arche, des ruines et du pont sont amincis à un pixel
  (`thin_strokes` : squelette, sans toucher aux aplats sombres), pour aller
  avec le reste du jeu. À
  relancer après chaque changement d'image. Le pont (90 px de haut) est le
  ponton du lac (`PIER`, au bord nord ; la barque attend à son bout,
  `PIER_MOOR`).
- `js/crypt.js` — la crypte de la statue du lac, creusée (sol en ellipse
  cabossée, dalles et moellons en cellules de Voronoï), runes, ossements, et le
  coffre (`CHEST_FRAMES` : fermé, entrouvert, ouvert).
- `js/cave.js` — la grotte : poches de galerie (`POCKETS`) au bord rongé de
  bruit, paroi, glaçons, mare gelée, stalagmites, ossements ; le roi
  squelette (`RUIN_ART.roi`, ~11 fois le viking ; `THRONE_FRAMES` : assis,
  et la tête tombée : la couronne `CROWN` roule au pied, le crâne `SKULL`
  s'affaisse ; l'estrade bloque) ; `caveWalkable`, `atCaveDoor`,
  `nearThrone`. Le seuil dehors : `CAVE_DOOR_OUT` (`world.js`).
- `js/chapters.js` — les chapitres (`CHAPTERS` : numéro, nom) et leur
  affichage (`showChapter`, partagé jeu/labo) ; quand : `checkChapters`.
  Le fond derrière le titre : `CHAPTER_STYLE` (G, sobre : pas de fond, dans
  le jeu) ; les autres propositions restent dans le labo (`CHAPTER_STYLES` : brume tramée, lambeau,
  lettres de neige, voile du haut, pierre levée), dessinées en pixels du jeu.
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
  Rafales, Tempête, Tourbillons ; par défaut la tempête, figée (les
  Réglages proposent aussi un cycle logique, `WEATHER_CYCLE`, ~8 min,
  fondus de 18 s, calé sur l'horloge réelle). Jour et nuit : par défaut,
  « Toujours la nuit » (`dayNight` : l'heure du jeu reste au milieu de la
  nuit) ; décochée, l'heure suit le cycle. Migration une fois (`nightStorm`). Le nombre de flocons est
  plafonné quand on dézoome, et la neige s'installe en 2 s au lancement.
- `js/trees.js` — générateurs : sapins, arbres morts, gros rochers (blocs
  noirs `k`, trapus, taillés en facettes, jamais des pyramides ; pans tournés
  vers la droite en `b` ; `chipBoulder` : le rocher ébréché), cairns,
  icebergs plats ; `leanRows` : un arbre penché de −1 à +2 pixels à la cime
  (`LEANS`). Le jeu met les quatre inclinaisons de chaque arbre dans l'atlas
  du morceau (1024 px de large) et en change ~22 fois par seconde
  (`swayTrees`) : `treeWind` (quasi rien sous la bise), `treeLean`,
  `treeFreq` (les petits arbres battent plus vite).
- `js/pack.js` — la meute dans le jeu (`createPack` : repaires à la lisière
  de `WOLF_DEN`, cercle, grogne → bond → morsure `onBite`, `hitAt`,
  retraite si on fuit ou tombe ; réglages `CROUCH` (1 s de grognement avant
  le bond), `LUNGE_GAP`, `HIT` (marge de la lame), `ROUT` : deux loups tombés,
  les autres fuient pour de bon) ; `pack.engaged` compte comme un combat
  (musique, pas de guérison).
- `js/wolf.js` — loups, d'après le dessin fourni (`assets/loups.png` →
  `WOLF_ART` dans `ruins-art.js`) : deux temps de marche, deux de course,
  réduits de moitié pour arriver à la hanche du viking (6 à 7 px ; il en fait
  9), posés dans un cadre commun (`place`) ; trot, galop, marche, arrêt,
  flaire, hurle, grogne, bondit, à terre, assis s'en servent tous.
- `js/deer.js` — cerfs (bois) et biches : marche, bond, arrêt, broute,
  brame / alerte.
- `js/fauna.js` — les bêtes dans le jeu : envol de corbeaux (`CROWS`, ils
  filent jusqu'à sortir de l'écran), charognards, une volée par cadavre
  (l'autre viking, les loups : `updateCarrion`, `flockFor`). Cerfs et biches codés mais retirés pour
  le moment (`DEER_ENABLED = false`).
- `js/statue.js` — la statue de Freya : pixels tirés d'une photo
  (b sombre, m demi-teinte), lissés, cassés (coiffe, épaule), inclinés,
  enfouis ; éclats et débris autour. `buildStatueUpright` : la grande, droite ;
  `buildStatueDoor` : celle de l'îlot, réduite, une porte dans la robe.
- `js/world.js` — l'île, déterministe (graine fixe) : côte, traces, rochers,
  pierres levées, maison (`makeHouse`, `houseBlocked`, `houseFrontY`,
  `HOUSE_DOOR_OUT`), traces ensanglantées après la porte (`p.blood`), forêt (`forestDx` : bandes à lisière irrégulière,
  `forestDensity`, `deepForest`, largeur de sente `p.lane`, `CLEARINGS`), statues et corbeaux placés le long de la
  piste (`STATUE_BASE`, `STATUE2_BASE`, `CROWS`), la grande clairière de la meute
  (`WOLF_DEN`, peu d'aiguilles au sol pour qu'on y voie les loups), `objectsInChunk`, `blocked`.
  Le lac (`LAKE`, `ISLET`, `inLake`) passe par `coast` (positif dans l'eau) ;
  `companion` : la piste du second marcheur, décalée sur la gauche, jusqu'à
  la porte de la maison (peinte avec les traces, sans toucher au tracé).
  `seaCoast` (la mer seule) sert au tracé et à l'accostage, pour que le lac ne
  les déplace pas. La falaise (`CLIFF`, `CAVE`, `CLIFF_PARTS`) : des tranches
  de 20 px, objets triés comme les autres, qui bloquent tout leur pied ; des
  pans (`cliffStep`) avancés ou reculés (`cliffFoot`), plus ou moins hauts ;
  d'un pan à l'autre, le sommet s'effondre en gradins (`cliffJump`).
  Le champ des morts (`NECRO`) : une pierre par objet.
- `css/style.css` — tokens en variables CSS, composants partagés, effet CRT,
  écran d'accueil (`--font-game-title` : la gothique du titre, propre au jeu).
- `app-update.js`, `mobile.css` — copies du design system, tenues à jour par
  `scripts/sync-design-system.sh`. Ne pas les modifier ici.

## Playtest et agents

Une équipe d'agents joue, teste et critique le jeu ; Jérôme tranche. Rien
n'est jamais implémenté automatiquement.

- `DESIGN.md` — la bible du jeu (intention, piliers, voyage, systèmes,
  palette, « Ce que le jeu refuse »). Tous les agents la lisent en premier,
  sauf les joueurs. La tenir à jour quand le jeu change.
- **Mode debug** (`?debug=1`, `js/debug.js`) : `window.__kingvi` — `state()`
  (position, zone, PV, endurance, ennemi, meute, jour, vent, torche,
  chapitres, drapeaux, FPS), `events` (journal horodaté : zones, intérieurs,
  chapitres, coups donnés et reçus, morts, réveils, loups, corbeaux, sons,
  humeur de la musique…), `trail`, `places`, `cibles`, `teleport(lieu)`,
  `setTime(phase)`, `setWeather(ambiance)`, `timeScale(n)` (accélère aussi
  le jour et le vent, via `Date.now`), `setSeed(n)` (hasard du combat ;
  aussi `&seed=n` dans l'adresse), `toScreen`, `enter()`, `reset()`. En
  debug, la partie se sauvegarde sous `kingvi:debug:save` et les réglages ne
  sont jamais écrits. Sans le paramètre, le module n'est même pas chargé.
- **Harnais** `tools/playtest/` (Node + Playwright en devDependency,
  `node_modules` ignoré) : `node run.js --aide`. Sert le dépôt en local, joue
  un parcours scripté en suivant les traces au clavier (téléport entre les
  étapes ; `--reel` pour tout marcher), options d'étapes, heure, météo,
  clavier, qualité, navigateur, taille, densité, graine, vitesse.
  Conteneur neuf : `sh scripts/setup-playtest.sh` (Playwright 1.56.1, accordé
  au Chromium de `/opt/pw-browsers` ; Firefox, WebKit et ses bibliothèques).
- **Agents** `.claude/agents/` : designers (`gardien-du-ton` avec veto,
  `designer-rythme`, `designer-recit`, `designer-toucher`), testeurs
  (`testeur-fonctionnel`, `testeur-rendu`, `testeur-systemes` : BLOQUANT,
  MAJEUR, MINEUR ; une régression est bloquante), joueurs (`joueur-10-roblox`,
  `joueur-11-novice`, `joueur-12-mythologie`, `joueur-14-inde`,
  `joueur-15-blase`, et `parent-referent` : ils ne lisent que le carnet et
  ses captures), `synthetiseur` (motifs, pas des votes).
- **Commandes** : `/playtest <question>` (harnais → 3 testeurs, arrêt au
  premier BLOQUANT → 6 joueurs isolés → synthèse → 3 designers → gardien →
  `decisions.md` avec une case « Jérôme tranche » par proposition) ;
  `/playtest-light [objet]` (harnais, testeur fonctionnel, gardien).
- **Arborescence** :
  ```
  playtests/
    _templates/              retour-joueur.md, decisions.md
    vX.Y.Z/<run-id>/         (run-id : date-heure-étiquette)
      carnet.md              récit factuel, captures incluses (pour les joueurs)
      captures/              JPEG, toutes les N s et à chaque événement
      events.json            journal du jeu
      durations.json         temps par zone et par étape, tronçons sautés, piste à pied
      run.json               options, navigateur, FPS, erreurs, état final
      question.md            la question posée
      tests/                 rapports des testeurs (et leurs scripts)
      retours/               un fichier par persona
      synthese.md
      designers/             propositions, verdict du gardien
      decisions.md           ce que Jérôme tranche
  ```
- GitHub Pages sert tout le dépôt : `tools/` et `playtests/` y sont
  accessibles par URL, sans lien (accepté).
- Le conteneur n'a pas de carte graphique : le jeu y tourne vers 25 images/s (8 avant la basse définition, v1.34.0).
  Les durées sont en temps de jeu ; les FPS se comparent d'un run à l'autre.

## Exceptions aux conventions

- Les trois couleurs du jeu (`--game-snow`, `--game-night`, et `--accent`)
  sont propres à l'app : ce sont des couleurs de jeu, pas d'interface.
- La police gothique du titre (Grenze Gotisch, Google Fonts) est propre au
  jeu (`--font-game-title`), hors des tokens du design system.
- Les boutons de l'accueil et le menu Réglages sont habillés en pixels du
  jeu (lambeaux de neige, dalle de pierre, crans) au lieu des boutons et de
  la modale du design system ; l'en-tête et le toast restent ceux du design
  system, et le menu garde version, changelog et export en bas.
- Pas de mode sombre : le jeu a sa propre palette (facultatif pour une app
  secondaire).

## Pièges connus

- **Cache de GitHub Pages** (dix minutes) : après une mise à jour, le
  navigateur mélangeait anciens et nouveaux modules (le jeu tournait avec
  l'ancien code, le labo avec le nouveau). Tous les imports et les pages
  portent la version (`?v=1.28.0`) : après chaque changement de
  `version.json`, lancer `node scripts/stamp-version.mjs` avant de pousser.
- Redimensionner le canevas (Phaser 3.90, `Scale.NONE`) : `game.scale.resize`
  d'abord, puis `setZoom` (c'est lui qui pose la taille affichée ; dans
  l'autre ordre, le canevas gardait l'ancienne taille affichée : le jeu
  tombait dans un quart de l'écran quand on changeait la qualité).
- `scene.time.now` n'est pas accéléré par `timeScale` du debug : pour un
  temps de jeu, lire `scene.clock` (la somme des pas).
- `RenderTexture.resize` (Phaser 3.90) ne redimensionne pas la surface de
  dessin : le voile de nuit est recréé à la bonne taille (`makeShade`), en
  filtrage au plus proche (sinon le halo et les ombres tramés se fondent).

- Les déplacements lisent `event.code` (touches physiques), pas `event.key` :
  ZQSD en AZERTY et WASD en QWERTY marchent sans rien configurer.
- Tout changement dans `world.js` qui consomme le générateur aléatoire
  (`rng`) ou touche au tracé déplace les traces et les objets : vérifier la
  carte de l'île (la piste doit atteindre son bout, sans se perdre dans la
  forêt noire), et incrémenter `WORLD_VERSION` dans `world.js`.
- Le viking doit peser sur la neige : son ombre est dessinée dans le sprite,
  sur la ligne même des pieds. Une ombre séparée, un pixel plus bas, le
  faisait léviter.
- Il doit rester petit (environ 9 pixels de haut, écran d'environ 280 pixels
  de haut : `TARGET_HEIGHT`, rapproché de 440 à 352 puis à 280 ; le facteur
  restant entier, la vue varie un peu selon l'écran) et se lire comme une masse : pas de visage ni de détail.
- Le debug `setTime` sort de la nuit perpétuelle (`freeTime`) : sinon
  l'heure forcée du harnais n'aurait aucun effet.
- Tout se mesure au viking : porte de la maison ≈ sa taille, loup à la
  hauteur de sa hanche (oreilles comprises), statue ≈ dix fois sa taille. Vérifier dans le labo.
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
- Fluidité : ne jamais dessiner pixel par pixel avec `fillRect` dans une
  boucle chaude (une planche de forêt noire, c'est 150 000 pixels) ; découper
  les gros travaux en générateurs ; ne pas dessiner hors de la vue.
- Une image dont la texture a été retirée fait planter le rendu de Phaser,
  et la boucle s'arrête : le jeu se fige (écran noir, flocons immobiles). Un
  morceau abandonné en route défait ce qu'il a posé (`loadChunk` → `finally`),
  et une texture se retire toujours par `dropTexture` (qui détruit d'abord les
  images qui s'en servent). Filet de sécurité : la boucle du jeu attrape les
  erreurs et note la dernière dans `kingvi:lastError`.
- Un intérieur doit rester praticable de l'entrée au fond et retour (vérifier
  par un parcours de la grille, comme pour la grotte : les poches sont reliées
  par des boyaux).
- Labo : ne jamais relire les pixels d'un canevas (`getImageData`) ; des
  extensions anti-pistage le bloquent et la carte ne s'affichait plus. Préparer
  sur un canevas caché et recopier (`drawImage`).
- `pagehide` sauvegarde la partie : pour tester une position, écrire la
  sauvegarde avant le chargement (sinon elle est écrasée).
