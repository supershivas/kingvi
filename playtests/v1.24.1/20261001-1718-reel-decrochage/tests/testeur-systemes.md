# Rapport — testeur-systemes — 20261001-1718-reel-decrochage
Verdict : MAJEURS

Sources : `question.md`, `mesures.md`, `carnet.md`, `events.json` (87 événements),
`durations.json`, `run.json` (0 erreur, `derniereErreurDuJeu` nulle) ; run précédent
`v1.22.1/20261001-1625-light`. Scripts Playwright dans `tests/` (`lib.mjs` commun),
sorties brutes dans `tests/*.out.txt`. Pas de BLOQUANT, pas de régression constatée.

## Problèmes

### [MAJEUR] Maj tenue à endurance vide : course hachée, endurance bloquée à zéro, plus aucun coup possible
- Constat : en marchant Maj tenue, l'endurance se vide en 6,1 s (course à 43,7 px/s).
  Ensuite, tant que Maj reste enfoncée et qu'on marche, elle ne remonte jamais
  au-dessus de 0,03 : au bout de 0,8 s de repos, elle repasse au-dessus de 0,02,
  la course reprend pour **une seule image**, la vide à nouveau, et ainsi de suite
  (19 images de course isolées sur 262, 19 bascules en 8 s ; vitesse moyenne 19,8 px/s
  au lieu de 18). Surtout : les clics ne frappent plus (4 clics, 4 `essouffle`,
  aucune `frappe`), puisqu'un coup demande 0,12. Il suffit de relâcher Maj : 2,5 s
  de marche plus tard, l'endurance est remontée et le coup part.
  Cause (lecture du code) : `game.js` l. 975, `running = Maj && stamina > 0.02`,
  sans seuil de reprise ; chaque image de course remet `staminaRest` à 0,8 s.
  À l'arrêt, Maj tenue, l'endurance remonte normalement (0,02 → 0,83 en 3 s).
- Étapes de reproduction : `node tests/maj-essouffle.mjs` (et `tests/controles2.mjs`,
  bloc `courseVide`). À la main : Maj + D pendant 10 s, puis cliquer sans lâcher Maj.
- Attendu / obtenu : la course s'arrête quand l'endurance est vide, puis l'endurance
  revient au pas ; obtenu : la course clignote, la barre reste vide indéfiniment et
  l'épée ne sort plus tant que Maj est tenue. Un joueur qui fuit la meute Maj
  enfoncée puis se retourne pour frapper ne peut pas frapper, sans comprendre pourquoi.
- Capture : tests/maj-tenue-essouffle.png (la barre vide au-dessus du viking)
- Régression : non (règle présente depuis l'ajout de l'endurance, avant v1.22.1)

### [MAJEUR] Ralenti du jeu après chaque retour (focus, onglet) et tant que la fenêtre n'a pas le focus, aux faibles FPS
- Constat : Phaser (`smoothStep`, par défaut) plafonne le delta à 16,7 ms pendant
  120 images après le démarrage et après chaque retour de focus ou d'onglet
  (`resetDelta` → `_coolDown = 120`), et en permanence tant que la fenêtre n'a pas
  le focus (`inFocus = false`). À 60 images/s, c'est invisible ; en dessous, le
  monde tourne au ralenti (marche, loups, l'autre viking, animations) pendant que
  le jour et le vent, eux, suivent `Date.now`. Mesures dans le conteneur
  (`tests/cadence.out.txt`, rapport temps de jeu / temps réel) :
  - après l'entrée en jeu : ×0,2 à ×0,5 pendant ~6 s (marche à 5–7 px/s réels) ;
  - fenêtre visible sans focus : ×0,2 à ×0,37, tant que dure la perte de focus ;
  - retour du focus : ×0,18 à ×0,29 pendant ~9 s (13 images/s), marche à 3–4 px/s ;
  - onglet caché puis revenu : ×0,1 à ×0,2 pendant ~11 s.
  Sur une machine à 30 images/s, cela donne ~4 s à demi-vitesse à chaque retour,
  et un jeu à demi-vitesse sur un second écran sans focus. C'est le profil des
  « ordinateurs anciens » visés par la qualité 1.
  Effet secondaire sur le playtest : les premières secondes de chaque run du
  harnais, et chaque retour de focus, sont mesurés en ralenti.
- Étapes de reproduction : `node tests/cadence.mjs` (qualité 1, 1280×800).
- Attendu / obtenu : au retour, le jeu reprend sans sauter ni se figer (c'est le
  cas : aucun saut) et à sa vitesse normale ; obtenu : plusieurs secondes de ralenti
  aux faibles FPS.
- Capture : — (mesure de cadence ; voir `tests/cadence.out.txt`)
- Régression : non (comportement par défaut de Phaser, configuration inchangée)

### [MINEUR] La graine ne rend pas les combats reproductibles au-delà du premier tirage
- Constat : même graine (7), même parcours, même qualité, immobile face à la meute
  puis face à l'autre viking. Le premier coup reçu tombe au même instant (3,1 s),
  puis les deux runs divergent d'autant que deux graines différentes :

  | Run | Morsures (s après l'attaque) | Coups de l'autre (s après l'engagement) |
  |---|---|---|
  | graine 7, qualité 1 | 3,1 · 5,0 · 7,1 | 6,7 · 8,9 · 11,2 |
  | graine 7, qualité 1 | 3,1 · 6,1 · 9,1 | 6,8 · 9,6 · 12,5 |
  | graine 7, qualité 3 | 3,2 · 5,5 · 8,3 | 6,6 · 9,3 · 11,4 |
  | graine 8, qualité 1 | 3,2 · 5,1 · 8,2 | 6,8 · 8,9 · 11,4 |

  Cause probable : `setSeed` remplace `Math.random` pour tout le jeu, et ce
  générateur est puisé à chaque image par la neige et les tourbillons
  (`weather.js` l. 150 et suivantes), la faune, les particules et la musique ;
  le nombre d'images variant, la suite du combat se décale. Le déroulé reste
  le même (3 coups, mort), mais `--graine` ne permet pas de rejouer un combat.
- Étapes de reproduction : `for a in "7 1" "7 1" "7 3" "8 1"; do node tests/graine.mjs $a; done`
- Attendu / obtenu : à peu près les mêmes combats ; obtenu : identiques au premier
  coup seulement, puis l'écart est le même qu'avec une autre graine.
- Régression : inconnu (premier test de la graine)

### [MINEUR] La distance parcourue compte les pas contre un obstacle
- Constat : `this.distance += step` (`game.js` l. 1000) s'ajoute même quand le viking
  ne bouge pas. Contre la mer, à la barque : x figé à 589,2 pendant 4 s, distance
  108 → 180. Le « nombre de pas » de la sauvegarde (`steps`, affiché dans les
  Réglages) gonfle donc quand on pousse contre un arbre, un rocher ou la mer.
  Dans ce run : `distance` 12 639 pour 5 087 px de piste.
- Étapes de reproduction : `node tests/pas-bloques.mjs`
- Attendu / obtenu : la distance marchée ; obtenu : le temps passé à pousser.
- Régression : non (depuis v1.0.0)

### [MINEUR] La musique bascule sourde / calme / sourde en moins de 2 s à la lisière de la forêt noire
- Constat : `events.json` n° 33, 36, 37 : `sourde` (295,3), `calme` (296,8), `sourde`
  (297,1) ; puis n° 71 à 73 à la sortie : `calme`, `sourde`, `calme` en 7 s.
  `musicMood` passe en « sourde » dès que `deepForest > 0,3`, sans hystérésis (le
  journal des zones en a une de 1,2 s, la musique non). Le zigzag du script
  l'accentue, mais un joueur qui longe la lisière l'entendra aussi.
- Étapes de reproduction : le run lui-même (`node run.js --reel --vitesse 3`), tronçons 295–298 s et 786–803 s.
- Attendu / obtenu : une humeur qui change une fois en entrant ; obtenu : trois changements en 2 s.
- Régression : inconnu

### [MINEUR] Le guetteur s'efface pendant l'attaque de la meute, même au premier passage
- Constat : `meute-attaque` à 533,3, `guetteur-efface` et `silence 6 s` à 545,1,
  `meute-fin` à 554,5 : le guetteur disparaît, et le silence tombe, pendant que la
  meute encercle encore le viking qui fuit (sans `scent` cette fois). Le run
  v1.22.1 l'avait signalé au retour en saignant ; ici, il suffit de traverser la
  clairière sans se battre.
- Capture : captures du carnet autour de 09:05
- Régression : non (déjà signalé en v1.22.1, autre configuration)

### [MINEUR] Harnais : `--heure` ne tient pas, et la lenteur du parcours vient du script, pas du jeu
- Constat :
  - `--heure jour` force un instant, que `timeScale(3)` fait ensuite défiler :
    crépuscule à 319,5, nuit à 408,3, aube à 768,6, jour à 859,1 (durées conformes
    au cycle : 89 s, 360 s, 90 s). C'est conforme à `CLAUDE.md` (« accélère aussi le
    jour »), mais l'option promet une heure, et un run `--reel` de 16 min de jeu
    traverse presque un cycle entier. Il faudrait que le harnais fige l'heure (ou la
    réimpose) pendant tout le run.
  - Le jeu marche bien à 18 px/s de temps de jeu, quelle que soit la disposition
    (17,4 à 18,2 px/s mesurés). Les ~5 px/s du run viennent du script : touches
    tenues ~70 % du temps (12 639 / 18 = 702 s sur 1 001 s ; ce compteur inclut
    les poussées contre les troncs, voir plus haut), et une progression de
    5 087 px seulement. La correction ×3,5 de `mesures.md` (temps de marche
    = piste ÷ 18) est donc la bonne lecture.
  - `--clavier azerty` envoie des événements synthétiques (`code` + `key`) : cela
    vérifie bien la lecture par `event.code`, pas une vraie disposition.
- Régression : non

## Vérifié sans problème
- **Passage de minuit** (horloge simulée, Paris et UTC) : 23:59:58 → 00:00:00 UTC,
  cycle 1199 → 0, nuit → aube, sans saut, sans erreur ; le cycle suit l'UTC (minuit
  UTC tombe sur le début de l'aube, 86 400 étant un multiple de 1 200).
  `tests/horloge.mjs minuit`.
- **Heure d'hiver** (25 octobre 2026, 01:00 UTC) : à Paris, l'heure locale passe de
  02:59:59 CEST à 02:00:00 CET, et le cycle du jeu continue sans à-coup (1199 → 1 → 2…),
  identique en UTC et à New York. Aucun `getHours` ni fuseau dans le code du jeu.
  `tests/horloge.mjs hiver`. (Détail du debug : `heureCycle` arrondi affiche 1200 à
  1199,6 s ; sans effet.)
- **Onglet caché puis revenu, longue pause** : 3 h d'horloge simulée onglet caché,
  puis 5 h d'un seul saut sans événement de visibilité, touche tenue : le viking ne
  saute pas (x 629 → 631), la boucle reprend (pas de gel, pas d'erreur,
  `kingvi:lastError` vide), le jour et le vent arrivent directement à la bonne phase
  (rafales → tempête, puis tempête → calme). Seul défaut : le ralenti ci-dessus.
  `tests/horloge.mjs pause`, capture `tests/pause-3h.png`.
- **Décalage de l'heure des Réglages** : le curseur à 1000 donne la nuit (torche
  allumée), 30 l'aube, 800 le crépuscule, 400 le jour (`state().jour`, `heureCycle`
  = curseur ±2) ; hors debug, `dayOffset` est écrit, gardé au rechargement, et le
  temps s'écoule depuis le moment choisi (1000 → 1128 après 2 min) ; « suivre
  l'heure réelle » remet `dayOffset` à 0. `tests/reglage-jeu.mjs`, `tests/horloge.mjs reglage`.
- **Clavier** : ZQSD (AZERTY simulé), WASD (vraies touches), flèches : mêmes
  déplacements (72–73 px en 4 s vers l'est et l'ouest, 36–37 px en 2 s vers le
  haut, 17,2 à 18,2 px/s). La touche Z d'un QWERTY (`KeyZ`) ne fait rien.
  `tests/controles2.mjs`.
- **Maj tenue pendant une attaque puis relâchée** : le coup part, Maj relâchée
  pendant le coup, la marche reprend à 18,1 px/s, sans course résiduelle. Course
  + clic : la course reprend après le coup, Maj tenue.
- **Clics rapides** : dix clics en ~1 s dans le vide → 3 coups, un à la fois
  (~0,8 s chacun), endurance 1 → 0,46, aucune animation coincée, la marche repart.
  Contre la falaise (coup qui rebondit, `delayedCall`) : 3 coups « pierre », pas de
  blocage. (Le lieu `falaise` du debug est à ~115 px de l'autre viking vivant : il
  engage et tue pendant le test ; normal, mais à savoir pour le harnais.)
- **Perte de focus pendant la marche** : `blur` vide les touches, le viking
  s'arrête net (1 px de plus). Un autre onglet passé devant en mode headless ne
  déclenche ni `blur` ni `visibilitychange` : non testable ainsi, d'où l'événement simulé.
- **Mode debug absent** : sans `?debug=1` (et avec `?debug=0`), `window.__kingvi`
  n'existe pas, `debug.js` n'est jamais demandé au serveur, `Date.now` et
  `Math.random` restent natifs, la sauvegarde est `kingvi:save`. Avec `?debug=1` :
  seule `kingvi:debug:save` est écrite ; `kingvi:prefs` reste absent même après
  avoir touché aux sept réglages. `tests/debug-absent.mjs`.
- **Run lui-même** : aucune erreur de page ni du jeu ; temps de jeu / temps réel
  2,9 pour ×3 ; torche allumée au crépuscule, éteinte à l'aube ; FPS 11,7 de moyenne
  (7,2 au run v1.22.1, mais ni le parcours, ni la vitesse, ni les réglages de
  qualité ne sont comparables : pas de conclusion).
