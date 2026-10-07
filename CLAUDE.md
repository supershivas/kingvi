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
La vue est rapprochée (écran d'environ 280 pixels du jeu de haut) ; **zoom à
la molette** (v1.54.0) : par défaut le plan le plus large, on rapproche d'un
cran entier à la fois jusqu'au double (la moitié de la largeur vue) ; c'est
le facteur entier d'agrandissement qui change (`zoomSteps`, `zoomedFactor`,
`setFactor`), jamais la caméra, et l'interface garde la taille du plan large
(`--ui-px`) ; le cran choisi est gardé (`prefs.zoom`, options `zoom` / `onZoom`
de `createGame`) et rendu au rechargement ; aucun zoom automatique (ni combat, ni intérieurs) ; la caméra est
fixée sur le viking (`FOLLOW` = 1 : elle avance du même pixel que lui) ; on ne voit qu'à distance de vue du héros : net autour
de lui, flou vers le bord du cercle de vue (`BLUR_SCALE`, fixe), puis le noir, plus loin (`SIGHT`) (le bleu nuit exact,
par-dessus le CRT et la vignette), tramé par paliers. Sa forme n'est pas
définie : la portée de la vue, dans 72 directions, dépend un peu du décor
(v1.53.0 : plus grande, `SIGHT` 0,86 × 0,70, presque une ellipse ; le décor
n'en mord plus qu'un quart, quatre passes de lissage, une lente dérive en
quatre ondes la garde organique : `updateSight`, `castSight`, `sightShape`,
`paintSight`, canevas `#sight`).
**Rien de géométrique dans ce monde** : ni droite, ni grille, ni cercle, ni
arc parfaits (une seule exception voulue : le cube blanc et le cube noir, voir plus bas). Tout est tordu par du bruit, cassé, effrité, asymétrique
(falaise, grotte, crypte, pierres, rivages). Seuls les objets fabriqués
(maison, barques, coffre) gardent quelques lignes, et encore, usées.

Au lancement, un écran d'accueil, sans sous-titre : le nom en gothique
étrange (Grenze Gotisch), tracé petit puis pixelisé et texturé (croûte de
neige, ombre tramée, éclats, glaçons), figé en dessin (`js/title-art.js`,
`TITLE_ART`) qu'on redessine dans l'atelier (dessin `titre`, groupe « Le
titre » ; `drawTitle` dans `main.js` le peint depuis `designRows`, agrandi
d'un facteur entier, repeint si on le retouche dans un autre onglet), sur la mer de nuit où vogue la barque, le viking debout
dedans (houle qui roule vers nous en crêtes tramées, roulis, sillage, moutons,
icebergs au loin, neige, bords vignettés : `js/titlesea.js`, arrêté quand
l'accueil est caché ; **tirée au sort à chaque ouverture** (v1.53.3, `reroll`,
paramètres `P` : nombre d'icebergs, leur profondeur et vitesse, houle,
barque, roulis, moutons, ambiance `MOODS` qui change d'elle-même toutes les
40 à 100 s), comme la mer des traversées (`#voyage`) ; carte du labo
« La mer de nuit, tirée au sort »), avec sa propre musique
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
pierres levées, d'après un champ de pierres levées du Nord), quelques arbres,
une volée de corbeaux qui s'envole à l'approche, la forêt, une statue géante de Véla ensevelie, penchée et
brisée, puis la forêt noire, longue à traverser (si dense que le sol est
noir ; la sente y file sans trop serpenter, se resserre ; trois clairières
seulement : une vide au premier quart ; au milieu, le bosquet sacré, un grand
arbre mort (~7 fois le viking) chargé d'offrandes qui tournent au vent, et
juste après lui le guetteur ; à la sortie du noir, la grande clairière
(`GLADE`, ouverte vers la plaine) : **la louve blanche**, Hvít, prise dans un
collet (`HVIT_AT`, `this.hvit`, `updateHvit` ; les poses du loup en blanc
cerné de bleu nuit, `makeWhiteWolf` dans `pack.js`) ; E « Défaire le
collet » (`freeHvit`, `hvitFree`) : elle parle, hurle et rentre sous les
arbres ; le guetteur : grande silhouette
encapuchonnée qui s'efface quand on approche, jamais pendant un combat, ses pas s'arrêtant net), une grande
Véla debout à la sortie, la maison (vue de biais, sans fumée ni lumière).
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
abattent (l'autre viking, et les loups tués). **L'incendie** : l'autre mort, on revient à la maison ; un clic près du corps,
dans la pièce, met le feu au bûcher (`lightPyre`, `js/fire.js` : `FIRE`, les
durées) ; la fumée de la pièce blesse au bout de 14 s (il faut sortir) ;
dehors, les flammes gagnent le toit, fumée tramée qui file au vent
(`drawSmoke`), escarbilles, la nuit s'ouvre autour (`firelight`), crépitements
(`audio.fire`) ; le toit s'effondre (`collapseHouse`) : ruine qui fume, neige
fondue (`meltSnow`), la boucle du compagnon dans les cendres ; on n'entre plus
(`fire` dans la sauvegarde : secondes de feu, null si jamais).
Plus loin, une falaise gigantesque face au sud, faite de pans
avancés ou reculés, une **sente** taillée en lacets dans la face (`LEDGE`,
`ledgeAt` dans `world.js`, peinte dans les tranches de la falaise) : on y
monte en marchant vers la roche au pied (`LEDGE.bottom`) ou vers le bord en
haut (`LEDGE.top`) ; dessus, on ne fait qu'avancer ou reculer (`climb`,
`climbStep`, `CLIMB`), dessiné devant toute la falaise (`baseDepth`) ; des
pierres tombent du rebord, annoncées par un filet de neige (`updateRockfall`).
En haut, un plateau (le **megamoth**, `js/moth.js`, est retiré pour le moment :
`MOTH_ENABLED = false` dans `game.js`, une bête absente `NO_MOTH` à sa place ;
code gardé, comme les cerfs). Sur le plateau, **la meute** (v1.52.0 : plus
dans la forêt, ce n'était plus un premier combat ; `WOLF_DEN` près de
`MOTH_LAIR`, `DEN_OPEN` le sud : ils sortent du côté du glacier, jamais du
bord ; ils ne passent ni la paroi ni les rochers) : trois loups qui sortent
quand on approche (galop en quatre temps ; des pas d'un pixel, pâles :
`wolfPrint` ; hurlement au loin avant) ; ils encerclent, grondent 1,5 s,
bondissent l'un après l'autre toutes les 4 s environ ; deux coups en abattent
un, et le premier tombé fait fuir les autres pour de bon (`ROUT` = 1) ; si
l'on s'enfuit en saignant, ils suivent le sang (`pack.scent`). Si la louve a
été déliée (`tame`), ils tournent sept secondes sans mordre et s'en vont
(`wolvesSpared`), à moins qu'on frappe l'un d'eux (`provoked`). Et l'entrée d'une grotte : on y entre (il y fait toujours
nuit, la torche s'allume) ; une galerie qui serpente, une mare gelée, des
ossements, et au fond, dans une grande salle, un roi squelette immense sur son
trône (d'après le dessin fourni) : quand on approche, sa tête s'affaisse et sa
couronne roule au pied de l'estrade (`kingBowed`).
Au sud de la piste, avant la forêt, un lac : une barque (on y monte en
marchant dessus, on rame, on descend en abordant une rive), un îlot, une
Véla plus petite avec une porte dans sa robe ; dedans, une crypte et un
coffre à ouvrir (clic près de lui).
**L'Aube** (v1.52.0, la première fin) : sous l'arche, entre ses piliers, une
dalle (`TEMPLE_DOOR_OUT`, image `temple-slab`) que Tavé fait glisser quand
on lui donne le sceau de la crypte ; des marches (`temple-stairs`) descendent
au **temple de Sorne** (`js/temple.js`, intérieur `temple`, toujours la
nuit) : le mur des ans hérissé de clous, le dernier à l'envers, rouge
(`NAIL`, image `nail`). E « Arracher le clou » (`pullNail`) : Sorne parle, le
vent tombe en bise, la nuit pâlit en une minute avec une lueur d'aube, puis
le jour pour toujours (`aube` dans la sauvegarde, `applyDaylight`) ;
`onEnding('aube')` → `playEnding` dans `main.js` : trois lignes sur le noir
(`ENDINGS`, même écran que le prologue), puis « Fin · L'aube », et l'on
continue de jouer ; les fins vécues sont gardées dans `kingvi:fins` (et
l'export). **Donner** (touche E) : `veut.don` dans `saga.js` (relique, lignes,
effet) ; si elle pend à la ceinture, « Donner … » remplace « Parler »
(`give`, `given` dans la sauvegarde : la relique quitte la ceinture, `isGiven`).
Véla ← la poupée : un point de vie de plus (`maxHp`) ; Tavé ← le sceau : le
temple ; Croisée ← l'anneau de l'autre : l'âme d'Eyvind passe ; Rosine ← la
boucle : une tombe. `apres` peut être une liste (la dernière vraie : `aube`,
`don-<id>`, `hvitFree`…).
Aux grands moments, un chapitre s'inscrit dans le haut de l'écran, une fois
par vie (`chapters` dans la sauvegarde, vidé à la mort ; La grève 2,5 s de
jeu après l'ouverture du noir, `calm`) : « Chapitre I » en petit, le nom
en grand dans la gothique du titre, sobre : rien que le texte clair, cerné
d'une ombre bleu nuit discrète (lisible sur la neige comme sur la mer), qui
apparaît et s'efface en fondu, sans fond ni mouvement (`CHAPTER_STYLE`
`sobre`). I La grève, II La plaine
des morts, III La forêt, IV La forêt noire, V La louve blanche (près du
collet), VI La maison, VII L'autre (il vient au contact),
VIII L'incendie (le feu pris, près de la maison), IX La falaise (sur la
sente, ou près de la falaise après lui), X Les loups (sur le plateau), XI Le
roi sous la roche (dans la grotte), XII Le mur des ans (dans le temple) ;
Fin, L'aube ; Interlude, Le lac (en barque).
Hors des combats, la musique se tait un instant (`checkChapters` dans
`game.js`, `onChapter` → `showChapter` de `js/chapters.js`).
**La parole** (les personnages parlent, Jérôme, v1.46.0 ; phylactère B
retenu, v1.47.0) : `js/dialogue.js` (`createTalk` : bulle de neige aux bords
cassés en pixels du jeu, `brokenBox`, texte HTML par-dessus, une ligne après
l'autre au rythme de la lecture, `readTime` ; on se tait si celui qui parle
est loin, et en entrant ou sortant d'un intérieur). Le jeu choisit les scènes
de la saga (`checkTalk`, `speak`, `sceneLines` dans `game.js` ; les lignes
viennent de `SCENARIOS` dans `saga.js`), chacune une fois par partie (`said`
dans la sauvegarde) ; Vaïne dit une ligne à chaque mort (`deaths`). Tavé et
Hjalti sont posés dans le monde d'après `people.js` (`personImage`).
**Prologue** : au début d'une partie neuve, trois lignes sur le noir disent
l'état du monde avant que l'iris s'ouvre (`PROLOGUE`, `playPrologue` dans
`main.js` ; un clic ou une touche le passe). **Tutoriel** : des consignes une
à une dans `#hint` (`TUTO` : marcher, suivre les traces, courir, frapper, le
tourbillon, M et I), chacune jusqu'à ce qu'on l'ait faite ou qu'elle ait
assez duré ; une fois par navigateur (`prefs.tuto`). Rien des deux en debug.
**La carte qui se construit** (touche M, bouton carte de l'en-tête, `#map`) :
le jeu note les cases de 48 px vues autour du viking (`markSeen`, `seen` en
bits base64 dans la sauvegarde, `game.mapData()`) ; `js/map.js` dessine l'île
vue, le reste dans le noir, bord tramé, les lieux vus nommés, une croix
rouge là où l'on est (terrain calculé une fois, `drawMap` ; `renderMap` :
cadré sur ce qui est vu, presque tout l'écran (`#map` jusqu'à 96vw), agrandi
d'un facteur entier s'il remplit au moins 85 % de la place, sinon au plus
grand : `mapScale`). Pause pendant qu'elle est ouverte.
**Le pas des morts** (v1.55.0, la téléportation) : au creux du grand navire de
pierres de la plaine des morts (`PASSAGE_AT` dans `world.js`), E « Poser la
main sur l'étrave » (`takePassage`, `passage` dans la sauvegarde) ; ensuite,
sur la carte, un clic sur un lieu vu (ou son nom) y mène (`renderMap` rend
`places`, `game.canTravel()`, `game.travel(x, y)` : point praticable le plus
proche, fondu de `teleport`) ; ni en combat, ni dedans, ni en barque, ni sur
la sente ; pas sur SNO 4. Carte du labo « Le pas des morts ».
L'endurance est retirée pour le moment (`STAMINA_ON = false` dans `game.js` :
courir et frapper ne coûtent rien, pas de barre ; le code reste) ; à un point de vie, l'écran se teinte de rouge (`onHealth` →
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
**Neige profonde** (v1.51.0, revue v1.53.0) : trois niveaux (`snowDepth` dans `world.js`,
bruit sans `rng` : tassée, aux mollets, à la taille ; jamais sur la piste,
en forêt ni chez les loups) ; `updateSnow` dans `game.js` : le viking
s'enfonce de 1 ou 3 pixels seulement (`SNOW_SINK`, sprite et cape rognés par
`setCrop`), une collerette d'un pixel au plus, sur la ligne de la neige,
ronge le bas du corps (`this.collar`, hasard `noise` accroché au monde :
jamais de coupe droite, jamais enseveli), ralentit (`SNOW_SPEED`, 80 % à la
taille). Aux mollets : les pas normaux, plus une ou deux mottes pâles autour
(`leavePrint`). À la taille : un sillon au lieu de pas, deux lèvres serrées
contre le corps (à un ou deux pixels), celle de devant en morceaux, des
trous, une motte parfois. Carte du labo « Marche dans la neige
profonde ». **Touche E** : `actionTarget` (coffre, bûcher, roi, barque vers
SNO 4 et retour, parler aux gens), `act`, `onAction` → bouton `#act` (on
peut aussi cliquer) ; parler dit ce que la personne veut (`veut` de chaque
personnage dans `saga.js`, `apres` une fois un fait accompli ; `talkTo`).
L'éclair est blanc pur (couleur `w`, `WHITE` : seule exception aux trois
couleurs, voulue par Jérôme).
**Le cube blanc et le cube noir** (v1.53.0, `js/cubes.js` : `CUBE_WHITE`,
`CUBE_BLACK`, vue isométrique, arêtes d'un pixel, 59 × 62 pixels, sept fois
le viking (v1.53.2) ; leur pied bloque un losange au sol, `cubeBlocked` ; dessins `cube-blanc`,
`cube-noir` de l'atelier, groupe « Les cubes, la glace, le temple ») : sur
chaque île, toujours loin l'un de l'autre ; les seules choses parfaitement
droites du monde. SNO 7 : `SNO7_CUBES`, `cubeBlocked` (dans `walkable`) ;
SNO 4 : `SNO4_CUBES` (accessoires de la scène). E « Toucher le cube … »
(`touchCube`) : le blanc referme les blessures, le noir découvre la carte
(900 px autour ; toute SNO 4). `cubes` dans la sauvegarde. Saga : page
« Le cube blanc et le cube noir ». **Sigrún dans la glace** (`js/sigrun.js`,
`ICE_FRAMES` ; `SIGRUN_AT` sur le plateau) : torche allumée près d'elle, la
glace parle (scène `glace`) ; E « Allumer ta torche à la sienne »
(`freeSigrun`) : la glace se fend, fond, une flaque ; Vaïne l'emmène
(`sigrunFree`). **Le carnet des vœux** (touche J, `#wishes`, `game.wishes()`) :
en tête, ce que Kári pense devoir faire (`goal`), puis ce que veulent ceux
qu'on a croisés (`met`, `veut.voeu`, rayé quand `veut.fait` est vrai :
`facts`). **Le fil** : Kári dit son but à voix haute quand il change (6 s
après) et toutes les deux minutes s'il traîne (`checkGoal`). **Les messages
du jeu** (relique trouvée…) : la bulle de neige des phylactères, en bas
(`note` dans `main.js`, `#note`, `brokenBox`) ; le toast du design system
reste pour l'interface (export, mise à jour). Le cadre de la touche E
(`#act`) et les consignes (`#hint`) sont aussi dans la bulle de neige
(`snowBox` dans `main.js` : un canevas `.snow-bg` sous le texte, `brokenBox`
à la taille de l'élément, une graine par texte, redessiné au redimensionnement). **Chargement** : `#loader`
(la nuit, des flocons d'un pixel) jusqu'à ce que le titre, la mer et les
polices soient prêts (`hideLoader`).
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
La musique (v1.56.0) : **des fichiers**, les MP3 de `assets/music/` déposés
par Jérôme (la musique synthétisée est retirée), en **playlist** (`TRACKS`
dans `audio.js` : nom, fichier, `lieu`) ; deux platines (`<audio>` → Web
Audio, `startTrack`) : le suivant monte pendant que l'autre s'éteint
(`XFADE`, 8 s, trois au premier) ; la forêt noire, les loups et l'aube ont
leur morceau (`lieu` : `musicMood` rend `place`, stable 3 s : fondu vers
lui ; on le laisse finir en partant) ; `audio.setTrack('playlist' | id)`,
Réglages « Morceau », `prefs.track` ; deux morceaux pour un lieu (The wolves
I et II) : l'un ou l'autre au hasard. Les bruitages restent synthétisés (aucun
fichier) : le vent qui suit la météo (étouffé à l'intérieur ; v1.53.4 : plus
léger et vivant, `windLayers` : un souffle grave qui respire et se déplace
d'une oreille à l'autre, un air aigu, deux sifflements qui naissent et
glissent, chacun ses phases tirées au hasard ; `audio.wind` toutes les 200 ms), les corbeaux,
l'épée (fendre l'air, neige, chair, bois, pierre), le coffre, les loups
(hurlement, grondement, morsure, glapissement). Il démarre au premier geste du
joueur ; trois curseurs dans les Réglages : musique, bruitages, son du vent.
L'humeur (`musicMood` dans `game.js` → `audio.setMood({ energy, dark,
muffled, place })`) ne change plus les notes : un filtre assombrit un peu
dans la forêt noire et étouffe à l'intérieur ; le silence d'une présence ou
d'un chapitre (`audio.hush`, `duckBus`) éteint la musique quelques secondes.

La page `labo.html` suit le labo du design system (conventions, 8 ter ;
v1.51.0) : en-tête couleur d'accent avec « LABO » encadré, favicon à fiole
(`favicon-labo.svg`, `.png`), écran fixe ; les thèmes en onglets (La saga,
L'île, Le rivage, Le viking, Les bêtes, Ciel et nature, Son, Interface), les
sujets du thème dans la marge de gauche (icône, nombre de variantes), le
sujet ouvert déplie ses variantes en lettres A, B, C… (point d'accent sur la
retenue) et n'en montre qu'une ; flèches du clavier, balayage ; adresse
`#loups-B` ; sur téléphone, puces sous l'en-tête et barre en bas. Les
phylactères sont dans Interface, pas dans la saga. Sur la neige aux couleurs du jeu :
les cartes (v1.53.0) : l'Archipel des Neuf, puis « Carte de SNO 1 » à
« Carte de SNO 9 » (même convention partout : titre, lieux nommés dans la
gothique, leur liste dessous) ; SNO 7 et SNO 4 sont les vraies (un clic y
téléporte Kári ; pour SNO 4, rendez-vous `kingvi:goto` en sessionStorage,
lu par `create`), les sept autres dessinées d'après la saga (`js/islands.js` :
`ARCHIPEL`, `paintIsland`, `islandLand`), chapitres, barque, jour et nuit, viking,
cape, attaques (8 directions, tourbillon, arbre qui tombe, rocher qui éclate), torche, meute,
grotte et roi mort, intérieur de la maison, lac, crypte,
falaise, vagues, icebergs, charognards ; et des propositions à choisir
(lettres A, B, C…) : pontons, seconde barque, nécropole d'après un champ de pierres levées du Nord,
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
viking, chaque loup ; les arbres tremblent) et coûterait plus d'endurance (retirée pour le moment)
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
- Données : `localStorage` uniquement (`kingvi:island` : le numéro de l'île de la partie, tiré à « Nouveau jeu » ; `kingvi:save` : position, orientation,
  nombre de pas, `foeDead`, `rowboat` (position de la barque du lac),
  `chestOpen`, `watcherGone`, `kingBowed`, `chapters` (chapitres déjà vus), `wrecked` (arbres abattus, rochers brisés),
  `wolvesDead` (loups tués, là où ils sont tombés ; ceux d'avant v1.52.0, dans la forêt, sont oubliés), `fire` (l'incendie),
  `hvitFree`, `wolvesSpared`, `passage` (le pas des morts), `templeOpen`, `aube`, `given` (personne → relique donnée),
  `mothDead` (ancien, le megamoth est retiré), `belt` (la ceinture), `said` (scènes déjà dites),
  `deaths` (morts, pour Vaïne), `seen` (la carte : cases vues), `salt`, `clotildeFree`, `seen4`, `veve` (SNO 4), `chips` (coups déjà portés
  aux arbres et rochers encore debout), `tally` (le compteur) ; `kingvi:prefs` : qualité de l'image `quality` (1 → 3), météo, `musicVol`, `sfxVol`, `windVol` (0 → 100),
  décalage de l'heure du jeu `dayOffset` en secondes, 0 pour suivre l'heure, `zoom` : crans de zoom à la molette, `tuto` : consignes déjà vues) ; côté labo : `kingvi:designs` (dessins retouchés) et `kingvi:gh-token` (jeton de publication, jamais exporté). Récupérables via l'export JSON (la partie et les réglages ; ni les dessins, publiés dans le dépôt, ni le jeton).
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
- `js/saga.js`, `js/people.js`, `js/labo-saga.js`, `css/labo-saga.css` — **la
  saga** (onglet « La saga » du labo, le premier) : la bible du récit
  (`BIBLE`), familles et personnages sur quatre générations et plus
  (`FAMILIES`, `PEOPLE` : parents, conjoints, frères de lait, biographie,
  voix, répliques), lieux (`PLACES`, dont ceux qui agrandissent le monde),
  scénarios avec leurs dialogues (`SCENARIOS` : trame, souvent, rare, fin ;
  `lignes` = [qui, texte]). Les personnages parlent (Jérôme, v1.46.0) : règle de
  la parole dans `BIBLE`. Arbres dessinés en HTML + SVG (clic → fiche dans un
  `<dialog>`). `people.js` construit chaque personnage d'après le gabarit du
  héros (tête, corps, objet, taille ; `personSprite(spec)` → face et 4 temps de
  marche ; placeholders). Phylactères : propositions A à G sur une scène de
  192 × 84 pixels du jeu, texte en HTML posé au pixel près (`placeText`),
  bulles en pixels (`brokenBox`, de `dialogue.js`) ; **B est retenue** et dans le jeu.
  Sigrún n'est plus le megamoth : figée dans la glace sur le plateau (pas encore en jeu).
  **Second monde** (`js/saga-sno4.js`, ajouté par saga.js : `BIBLE_SNO4`,
  `FAMILIES_SNO4`, `PEOPLE_SNO4`, `PLACES_SNO4` avec x, y pour la carte du labo,
  `SCENARIOS_SNO4` avec `ile: 'SNO 4'`) : SNO 4, l'île Carrefour, celle des esprits
  venus du sud par la mer (Jérôme, v1.48.0), toujours dans le froid. Trois ensembles : les
  Gisants, les esprits de la tonnelle (Doux et Ardents), la cour Jean-Louis (héroïne :
  Anaïse). `WORLDS`, `worldOf` rangent le labo par monde. Page « Ce que ce monde
  refuse » (pas de poupée à épingles, les dormeurs sont des victimes, on ne combat
  pas un esprit). **Aucun nom réel** (Jérôme, v1.53.0) : ni pays, ni dieux, ni
  esprits, ni rites d'une religion ou d'une mythologie réelle ; on ne garde que
  l'inspiration (Véla, Sorne, Vaïne, Tavé, les Orsènes ; Clède, Baron Cendre, Mèt
  Croisée, Lazul, Morne-Aurore…). Les identifiants du code (`freya`, `legba`,
  `lakou`…) restent, pour les sauvegardes ; seuls les textes changent. **Jouable avec Kári**
  (v1.49.0) : `js/sno4.js` (scène de 960 × 600 posée loin en mer comme la
  grotte, `INTERIORS.sno4` à `{ x: 80, y: 5400 }` (zone sans terre, vérifiée), en
  plein air : `outdoor`, `roofed(key)` décide neige, vent, cape, éclair ;
  `paintSno4` le sol, `SNO4_PROPS` ce qui est debout trié à son pied et bloque,
  `sno4Walkable`, préparée au premier voyage par `ensureSno4`). La traversée :
  s'éloigner de la barque de la grève (`leftShore`), revenir et pousser vers
  elle 1,4 s (`checkVoyage`, `voyage`, `arrive`) ; `onVoyage` → `voyage` dans
  `main.js` (l'iris se ferme, la mer de l'accueil `#voyage`, un chapitre, puis
  l'île). Retour de même depuis la barque de SNO 4. Les gens (`sno4People`,
  `personImage` d'après `PERSON`), les âmes du carrefour, Clotilde qui marche
  (`updateSno4`) ; scènes `kari-*` de `saga-sno4.js` ; le sel de Ti-Jo
  (`salt`) réveille Clotilde (`clotildeFree`). Mourir ou se sauvegarder sur
  SNO 4 ramène à la grève de SNO 7. **Tracé** (v1.50.0) : `VEVE` dans `sno4.js`
  (points `nodes` et traits `links` autour de `at`) ; on les marche : chaque
  point foulé à moins de `VEVE_NODE` px compte, tous en moins de `VEVE_TIME` s
  referment le dessin (`checkVeve`, `drawVeve` : graphique au ras du sol,
  `veveClosed`) ; Clède ouvre toute la carte de SNO 4, Lazul met le vent au
  calme une minute, le Baron monte Kári 16 s (`ridden` : il tangue). Faits
  gardés dans `veve`. **Carte de SNO 4** : cases de 24 px (`seen4`, `SEEN4_*`),
  `mapData()` rend `world: 'sno4'`, `renderSno4Map` dans `map.js` (la scène
  réduite au quart, le noir sur le non-vu).
- `js/dialogue.js` — la parole (bulle B), partagée jeu/labo ; `js/map.js` — la
  carte qui se construit (voir la Description).
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
  **L'île de la partie** (`ISLAND` dans `world.js` ; 0 = l'île d'origine, `?ile=n` dans l'adresse, 0 en debug sauf `&ile=n` ; gardée dans la sauvegarde, `island`) : elle fait varier le tracé de la piste (`chooseTrail` essaie des variantes jusqu'à une qui reste de la bonne longueur, hors de l'eau et du lac, avec une forêt noire de même épaisseur), la forêt, les arbres et les rochers ; les lieux fixes (maison, falaise, lac, nécropole) et leur ordre ne bougent pas. `WORLD_VERSION` (dans `world.js`, partagé avec la carte du labo) : à
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
- **Hitbox des décors** (`blocked` dans `world.js`) : un arbre bloque son tronc
  (3 × 2 px) ; tout autre objet bloque exactement là où son dessin est plein,
  sur ses `foot` rangées du bas (`solidAt`), pas sur un rectangle de la largeur
  de son dessin : on passe sous les branches du grand arbre mort du bosquet,
  entre les racines, autour d'une statue. `foot` doit rester la profondeur du
  pied, pas la hauteur de l'objet.
- `js/design-store.js`, `js/designs.js`, `js/labo-designs.js`,
  `js/pixel-editor.js`, `assets/design/` — **les dessins redessinables à la
  main** (atelier : l'asset choisi à gauche, les dossiers à droite avec recherche, aide dans une boîte « ? » ; **assets créés** : `addCustom`, nom `custom-<id>` ou `custom-<id>-<n>`, type décor / animation / relique / autre, taille 4 → 160, catalogue dans `kingvi:custom` et `assets/design/custom.json`, publiés avec le reste ; dossiers « Mes … »), dans l'onglet Dessins du labo (10 groupes, 159 images, dont les placeholders de
l'incendie, du megamoth, de la pierre qui tombe, de la ceinture et des reliques : éléments du
  décor, ruines et arches, poses du viking (35, avec ombre au sol `h`), de sa
  cape (18), du loup (9), des cerfs et biches (42, retirés du jeu) ; **arbres,
  rochers et statues restent générés**). Un **éditeur de pixels intégré**
  (`openPixelEditor`, inspiré de pixel-studio : crayon, gomme, pot, ligne,
  rectangle, ellipse, pipette, **trame** (pinceau tramé, trame de Bayer 4 × 4 comme
  le halo et les ombres du jeu, densité 25 / 50 / 75 %, accrochée aux pixels de
  l'image) et **dégradé tramé** (glisser un rectangle), taille des outils de 1 à
  5 pixels, symétries, annuler, zoom, ajuster, grille, aperçu avec le viking ;
  **mode animation** : une animation (un enchaînement de `SEQUENCES`, dédoublonné)
  s'ouvre avec toutes ses images (`frames`, `order` pour la lecture : le galop
  répète une pose), une bande de vignettes, **pelure d'oignon** (1 ou 2 images
  voisines, d'avant en rouge, d'après en bleu), **« Modifier toutes les images
  ensemble »** (`st.all` : `set()` écrit dans toutes les grilles ; cadre rouge
  autour de la zone de travail), décalage d'un pixel, lecture avec vitesse ;
  un dessin seul n'a ni bande ni section Animation ; l'historique garde un
  instantané de toutes les images, `onSave(nom, rangées)` n'est appelé que pour
  les images vraiment changées ; **plein écran** (`100dvh`,
  page figée derrière) et **tactile** : un doigt ou l'Apple Pencil dessine,
  deux doigts déplacent la vue (le trait commencé est annulé), ni menu de
  sélection / copier, ni loupe, ni zoom de la page : `contextmenu`,
  `selectstart`, `gesturestart` annulés, `user-select` et `-webkit-touch-callout`
  coupés, `touch-action: none` ; les événements du pointeur sont sur la zone de
  travail, le canevas n'en reçoit pas) ; chaque trait est
  enregistré, et les animations de chaque groupe tournent avec les dessins du
  moment. **`design-store.js` n'importe rien** et se charge avant tout : `main.js`
  fait `await loadDesigns()` puis `import('./game.js')` (le monde, la meute, le
  viking se construisent à l'import de leurs modules : `viking.js`, `wolf.js`,
  `deer.js`, `ruins.js`, `cave.js` lisent `designRows` / `designGrid`). Sources :
  retouché dans ce navigateur (`kingvi:designs`) > fichier `assets/design/<nom>.png`
  listé dans `assets/design/index.json` > dessin du code ; une image de taille
  différente de l'original est ignorée. `designs.js` : le catalogue (`DESIGNS`,
  `GROUPS`, `SEQUENCES`, noms `viking-…`, `cape-…`, `loup-…`, `cerf-…`,
  `biche-…`, `decor-…`). **Mise à jour en direct** dans un autre onglet du même
  navigateur (événement `storage`) : textures d'`art()` (`redrawArt`), planches
  du viking et de la cape, loup (`pack.repaint`) ; ruines, arches, cerfs et biches
  au prochain lancement (ils sont cuits dans les morceaux de l'île). **Publier
  pour tous** (`designs-publish.js`, voulu par Jérôme pour ne pas passer par
  Claude) : le bouton du labo écrit les PNG et `assets/design/index.json` dans le
  dépôt, en un seul commit sur `main` (API Git de GitHub : blobs, arbre, commit,
  mise à jour de la référence), avec un jeton personnel fin (droit « Contents :
  Read and write » sur ce seul dépôt) collé une fois et gardé dans ce
  navigateur (`kingvi:gh-token`) ; GitHub Pages republie, le jeu lit les images
  à son lancement. Après une publication, les dessins envoyés restent 15 min dans `kingvi:designs-sent` (`markSent`) au lieu de masquer le dépôt ; le labo affiche les dessins pas encore publiés et propose une publication automatique (`kingvi:autopublish`, désactivée par défaut). Pelure d'oignon : voisin rouge/bleu, boutons sous le canevas. Une retouche locale identique à la publiée est abandonnée
  au chargement (`loadDesigns`) : le navigateur suit alors le dépôt. Repli :
  « Copier mes modifications » (`designsToText`) → texte collé à Claude →
  `node scripts/designs-vers-png.mjs texte.txt`. PNG décodé sans canevas
  (`decodePng`, `DecompressionStream`).
- `js/ground.js` — les tuiles du sol (`createGround`) : peinture d'origine
  (`pristine`) et toile affichée, réserve des tuiles hors de vue (48 Mo, les
  moins récemment vues partent), marques qui pâlissent par paliers (la tuile
  est recomposée : peinture d'origine, puis les marques encore là), marques
  permanentes peintes dans la peinture d'origine. L'horloge des marques est
  celle du jeu (`scene.clock`, accélérée par le debug).
- `js/audio.js` — le son (Web Audio) : la playlist des fichiers de
  `assets/music/` en fondu enchaîné (`TRACKS`, `startTrack`, `scheduler`) ;
  bruitages synthétisés (`audio.play('swing' |
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
  squelette (`RUIN_ART.roi`, ~11 fois le viking ; seul son pied bloque, `kingBlocks` ; `THRONE_FRAMES` : assis,
  et la tête tombée : la couronne `CROWN` roule au pied, le crâne `SKULL`
  s'affaisse ; l'estrade bloque) ; `caveWalkable`, `atCaveDoor`,
  `nearThrone`. Le seuil dehors : `CAVE_DOOR_OUT` (`world.js`).
- `js/relics.js` — les reliques (`RELICS` : id, nom, texte, dessin placeholder
  10 × 10 `relique-<id>` pour l'inventaire, et `relique-<id>-sol`, 4 × 4, celui qu'on voit à terre sur l'île, dossiers « Reliques » et « Reliques sur l'île » de l'atelier).
  Dans le jeu (`game.js`) : `dropRelic` (elle tombe en rebondissant et reste au
  sol jusqu'à ce qu'on marche dessus : `updateRelics`, `collectRelic`), la
  poupée quand on frappe l'arbre sacré (`knockGrove`), le rubis quand on frappe
  le roi (`knockKing`, dans la grotte), le médaillon posé sur la table de la
  maison (visible seulement dedans), le sceau qui jaillit du coffre de la crypte,
  l'anneau de l'autre viking et la dent du premier loup abattu (`checkBodyRelics` :
  aussi pour ce qui était déjà fait avant le chargement, sans chute), la boucle dans les cendres
  de la maison. Sauvegarde : `relics`, `relicDrops`
  (tombées, pas ramassées), `belt`. **Les reliques pendent à la ceinture du
  viking** (invisible en jeu) : `BELT_SLOTS` (10) crochets, un id ou null
  chacun (`normalBelt`, une trouvaille au premier crochet libre). Inventaire :
  touche I ou le sac de l'en-tête (`#inventory`, `renderInventory` dans
  `main.js` : la ceinture dessinée (`BELT`, dessin `ceinture` de l'atelier),
  agrandie d'un facteur entier ; on y déplace les reliques par glisser-déposer
  ou clic puis clic, `game.belt()`, `game.moveRelic(de, vers)` ; pause pendant
  qu'il est ouvert), `onRelic` → un toast.
- `js/islands.js` — l'Archipel des Neuf pour le labo (voir plus haut) ;
  `js/cubes.js` — les deux cubes ; `js/sigrun.js` — la glace de Sigrún.
- `js/temple.js` — le temple de Sorne (`TEMPLE`, `NAIL`, `NAIL_ART`,
  `TEMPLE_SLAB`, `TEMPLE_STAIRS`, `templeWalkable`, `atTempleDoor`,
  `nearNail`) ; posé à `{ x: 150, y: 150 }` en mer.
- `js/fire.js` — l'incendie : `FIRE` (les temps), flammes `FIRE_FRAMES`,
  `HOUSE_BURNING`, `HOUSE_RUIN`, où poser les flammes (`ROOF_FLAMES`,
  `RUIN_FLAMES`) : tous tirés par `burnHouse` de **la maison de l'atelier**
  (`designRows('house')` : retouchée ou publiée dans `assets/design/house.png`),
  pas du `HOUSE_ART` du code (retouchée dans un autre onglet : la maison en
  feu et la ruine sont refaites aussitôt ; le labo attend `designsReady`) ;
  `ROOM_FLAMES`, le bûcher (`PYRE`,
  `nearPyre`). Placeholders à redessiner (dossier « L'incendie »).
- `js/moth.js` — le megamoth : dessins placeholders (`MOTH_FRAMES` : posé,
  quatre temps de vol, à terre ; dossier « Le megamoth »), `createMoth`
  (repos, éveil, orbite autour de la flamme, plongée, recul, retour au nid,
  chute) ; l'ombre au sol tramée, accrochée au monde.
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
  Rafales, Tempête, Orage de neige, Brouillard, Tourbillons ; **éclairs** (`lightning`, par seconde :
  rares dans la tempête, fréquents dans l'orage ; `strike(near)`, `flash` 1 → 0 qui
  ouvre la nuit et le noir de la vue, `bolt` le trait de la foudre, tonnerre
  `audio.play('thunder', { near })` après un délai) ; **brouillard** (`fog` :
  la portée de la vue se referme, `updateSight`) ; debug `eclair()`. Par défaut la tempête, figée (les
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
- `js/pack.js` — la meute dans le jeu (`createPack` : repaires autour de
  `WOLF_DEN`, cercle, grogne → bond → morsure `onBite`, `hitAt`,
  retraite si on fuit ou tombe ; réglages `CROUCH` (1,5 s de grognement avant
  le bond), `LUNGE_GAP`, `HIT` (marge de la lame), `ROUT` : un loup tombé,
  les autres fuient pour de bon ; `tame`, `SPARE` : épargné ; un loup qui
  fuit et reste coincé disparaît au bout de 6 s) ; `pack.engaged` compte comme un combat
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
- `js/statue.js` — la statue de Véla : pixels tirés d'une photo
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

- Une relique qui tombe (`dropRelic`) se ramasse là où elle atterrit : `d.x`,
  `d.y` sont posés sur `to`, pas sur `from` (le rubis partait de la poitrine du
  roi, hors d'atteinte : on ne pouvait pas le prendre).
- Dans la grotte, seul le pied du roi bloque (`kingBlocks` : ses 10 rangées du
  bas, là où le dessin est plein, plus le trône et le mur derrière) : on passe
  à sa gauche. Un rectangle de la largeur du dessin fermait tout le côté.
- La meute partie pour de bon (`gone`, `sparing`) ne hurle plus quand on
  revient près de la tanière.
- Dans la grotte, la caméra monte près du trône (`updateLook`, `LOOK_UP`, `setFollowOffset`) : le roi fait ~100 px, plus que la moitié de l'écran.

- **Vérifier la syntaxe d'un module** : `node --check js/x.js` ne dit rien
  (le fichier n'est pas lu comme un module) ; utiliser
  `node --input-type=module --check < js/x.js`. Une apostrophe dans un texte
  entre apostrophes a ainsi cassé la saga sans que `--check` la voie.
- **Cache de GitHub Pages** (dix minutes) : après une mise à jour, le
  navigateur mélangeait anciens et nouveaux modules (le jeu tournait avec
  l'ancien code, le labo avec le nouveau). Tous les imports et les pages
  portent la version (`?v=1.28.0`) : après chaque changement de
  `version.json`, lancer `node scripts/stamp-version.mjs` avant de pousser.
  Et `app-update.js` prend la première lecture de version.json pour
  référence : une page servie en retard ne se savait pas périmée (Jérôme
  entendait encore l'ancienne musique). `main.js` compare donc, au lancement,
  son propre `?v=` (`import.meta.url`) à version.json et recharge une fois
  avec `?v=<version>` dans l'adresse (`kingvi:fresh` en sessionStorage évite
  la boucle).
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
- **Trames et déplacement** : une trame (halo de la torche, ombres, bord du
  cercle de vue) est toujours accrochée au monde (indice de Bayer pris sur les
  coordonnées du monde, `torchLight(k, ox, oy)`, `placeSight`), jamais à
  l'objet qui bouge : sinon, à chaque pixel de marche, toute la trame glisse
  et scintille. Pas de vacillement par changement de taille d'une trame
  (la torche vacille en intensité), et pas de caméra qui rattrape le viking
  à son propre rythme (il tremblait d'un pixel à l'écran).
- Le debug `setTime` sort de la nuit perpétuelle (`freeTime`) : sinon
  l'heure forcée du harnais n'aurait aucun effet.
- Tout se mesure au viking : porte de la maison ≈ sa taille, loup à la
  hauteur de sa hanche (oreilles comprises), statue ≈ dix fois sa taille. Vérifier dans le labo.
- La cape est courte et discrète : au calme elle se confond avec le dos ; même
  par grand vent elle ne dépasse que de quelques pixels (pas de cape de héros).
- Les cairns sont d'un seul tenant et jamais symétriques.
- Labo : un écran fixe (`.lab`, `100dvh`) ; seul `.lab-stage` défile (le
  document et le body ne défilent plus). Le menu se construit seul
  (`navigation()` dans `labo.js`) : une section = un sujet (icône `ICONS`),
  chaque enfant de `.demos` = une variante (lettre A, B…), une seule
  affichée (`.lab-off` sur les autres) ; un `MutationObserver` suit les
  cartes ajoutées après coup.
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
