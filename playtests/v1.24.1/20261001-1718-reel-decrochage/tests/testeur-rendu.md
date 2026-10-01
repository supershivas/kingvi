# Rapport — testeur-rendu — 20261001-1718-reel-decrochage
Verdict : BLOQUANT

Matériel : le run (carnet, 101 captures, run.json, events.json), le run
précédent `v1.22.1/20261001-1625-light`, et mes propres scripts dans
`tests/` (`rendu.mjs`, `rendu2.mjs`, `qualite.mjs`, `analyse.mjs`,
`profil.mjs`). Ils servent le dépôt en local sans passer par le harnais, pour
ne rien écrire hors de ce dossier. Résultats bruts dans `log-*.txt` et
`r-*.json`, captures PNG dans `tests/rendu/`. La mesure des pixels compte les
plages de couleur au centre net de l'image, en pixels physiques, et vérifie
qu'elles sont multiples du pixel du jeu.

## Problèmes

### [BLOQUANT] Changer la qualité en cours de partie réduit l'image du jeu à un quart de l'écran
- Constat : quand le curseur « Qualité de l'image » passe de 1 ou 2 (canevas
  en gros pixels) à 3 ou 4 (canevas plein), le canevas reçoit sa nouvelle
  taille, mais il s'affiche à la moitié de sa taille CSS, collé en haut à gauche
  (canevas 1280×748 affiché en 640×374). Le reste de l'écran ne montre que la
  copie floue figée. Le viking n'est plus au centre, et le flou ne le suit plus.
  L'image reste cassée jusqu'à un redimensionnement de la fenêtre ou un
  rechargement. Je l'ai reproduit dans Chromium, Firefox et WebKit, à dpr 1,
  en combat comme au calme. À dpr 2, le passage 1 → 3 ou 4 tombe juste par
  hasard. Dans l'autre sens (3 → 1), tout va bien. Pas d'erreur de console, et
  `derniereErreur` reste vide : le jeu continue de tourner, mais il est
  injouable.
- Étapes de reproduction : `cd tests && node qualite.mjs chromium 1 1,2,3,4,3,2,1,4`
  (même chose avec `firefox`, `webkit`). À la main : Réglages, curseur sur
  Légère, puis sur Équilibrée.
  Sortie :
  `→ q 3 canevas 1280x748, affiché 640x374 (scène 1280x748) zoom 2`
- Attendu / obtenu : même cadrage, viking au centre, plein écran à chaque niveau
  / image du jeu dans le quart haut gauche, sur un fond flou figé.
- Capture : tests/rendu/chromium-d1-q3-combat-combat-q4.png (en plein combat de loups,
  après le passage 1 → 4), tests/rendu/qualite-chromium-d1-12343214.png
- Régression : oui. En v1.23.0, les réglages d'image (cases CRT et flou) se
  changeaient en jeu sans rien casser : ils ne faisaient que basculer des
  classes CSS. Le curseur de qualité arrivé en v1.24.0 redimensionne le
  canevas (`setQuality` → `resize` : `game.scale.setZoom(1 / f.dpr)` puis
  `game.scale.resize`), et c'est là que la taille affichée se perd quand la
  densité du canevas change.

### [MAJEUR] Les lignes du CRT ne suivent jamais les pixels du jeu (`--px` ne leur parvient pas)
- Constat : `updateZoom` pose `--px` sur `#stage` (le parent du canevas). Mais
  `.crt-layer` est un frère de `#stage` dans `#screen`, pas un enfant : il ne
  reçoit pas la variable (`getComputedStyle(.crt-layer).getPropertyValue('--px')`
  est vide) et retombe sur la valeur par défaut de 3 px CSS. Les lignes ont
  donc toujours une période de 3 px CSS, quel que soit le zoom :
  - dpr 1, pixel du jeu = 2 px : une ligne tous les 3 px. Elles battent avec
    les pixels du jeu (relevé d'une colonne de neige :
    `201 238 237 201 237 238 …`, période 3).
  - dpr 1,25, pixel du jeu = 2 px physiques : période de 3,75 px physiques.
    Les lignes font tantôt 1, tantôt 2 px, à intervalles inégaux. Ce sont les
    bandes horizontales irrégulières dont parlent les « Pièges connus »
    (`36 36 33 32 36 36 33 36 36 36 33 …`).
  - dpr 2, pixel du jeu = 3 px physiques : période de 6 px, soit une ligne
    pour deux pixels du jeu.
  - Combat (zoom 3), intérieurs (zoom 4) : toujours 3 px, sans rapport avec le zoom.
- Étapes de reproduction : `node rendu.mjs c-matrice.json r-matrice.json`, puis
  `node profil.mjs rendu/chr-1280-d1.25-q2-greve.png 0.3 0.8 24`. Ou bien, dans
  la console : `getComputedStyle(document.querySelector('.crt-layer')).getPropertyValue('--px')`.
- Attendu / obtenu : une ligne par pixel du jeu, au même pas que lui / une
  période fixe de 3 px CSS, décalée par rapport aux pixels, irrégulière à 125 %.
- Capture : tests/rendu/crt-d1.25-q2-zoom.png (×10 : lignes de 1 et 2 px, mal
  espacées), tests/rendu/zoom-d1-q3-nuit.png, tests/rendu/zoom-d2-q4-nuit.png
- Régression : non. Le défaut existe depuis l'arrivée de `--px` sur `#stage`
  (commit 0591921) : la structure `#stage` / `.crt-layer` n'a pas changé depuis.

### [MINEUR] Flou de maquette presque absent dans WebKit (Safari)
- Constat : dans WebKit, le pourtour de l'image reste presque net. On n'y voit
  qu'un léger empâtement, pas le flou doux puis fort de Chromium et Firefox.
  `blurCopy` s'appuie sur `ctx.filter = 'blur(…)'`, que WebKit ne gère pas :
  la copie est seulement réduite puis agrandie.
- Étapes de reproduction : `node rendu2.mjs webkit 1 3 parcours`, et comparer avec chromium.
- Attendu / obtenu : même image dans les trois navigateurs / le flou d'ellipse
  à peine visible dans WebKit.
- Capture : tests/rendu/navigateurs-comparaison.png (colonne de droite),
  tests/rendu/webkit-d1-q3-parcours-foret-noire.png
- Régression : inconnu (le moteur de Playwright n'est pas Safari, à vérifier
  sur un Mac).

### [MINEUR] Cernes concentriques dans le noir autour des intérieurs
- Constat : autour de la pièce de la maison et dans la grotte, le noir est
  strié d'anneaux elliptiques concentriques. C'est le dégradé du
  vignettage/masque radial qui marche par paliers (8 bits) sur un fond presque
  noir. On les devine à l'œil sur un bon écran, et le contraste relevé les rend
  évidents.
- Étapes de reproduction : `--from maison`, entrer dans la maison ; ou
  `teleport('grotte')`.
- Attendu / obtenu : un noir uni / des cernes réguliers et géométriques. « Rien
  de géométrique dans ce monde. »
- Capture : captures/0101.jpg (anneaux visibles dans le noir),
  tests/rendu/grotte-contraste.png (même image, contraste relevé)
- Régression : inconnu.

### [MINEUR] Le canevas ne suit pas un changement de hauteur de la scène sans redimensionnement de la fenêtre
- Constat : dans Firefox headless (détecté comme tactile), le bandeau « Cette
  app est prévue pour un écran d'ordinateur » apparaît après la création du
  jeu. La scène passe à 703 px de haut, mais le canevas garde ses 748 px
  (`canevas 1280x748, affiché 1280x748 (scène 1280x703)`). Le bas de l'image
  est coupé de 45 px, et le viking descend de 22 px sous le centre du flou.
  Les vrais joueurs sur écran tactile auront la même chose (bandeau + croix).
  Un redimensionnement de la fenêtre recale tout.
- Étapes de reproduction : `node qualite.mjs firefox 1 3,1,3` (première ligne).
- Capture : tests/rendu/navigateurs-comparaison.png (colonne du milieu : viking plus bas)
- Régression : inconnu.

## Vérifié sans problème
- **Pixels entiers au repos** (Chromium, mesure au centre net) : zoom de
  caméra entier partout ; 0 % de plages horizontales qui ne soient pas un
  multiple du pixel du jeu, en qualité 1, à dpr 1, 1,25 et 2, de jour comme de
  nuit. Ailleurs, l'écart reste sous 2 % (le flou et les flocons). Pixel du jeu
  en pixels physiques : 2 (1280×800 à dpr 1 et 1,25 ; 1440×900 ; 1920×1080
  à dpr 1 ; 1024×640 à dpr 1,25), 3 (dpr 2 ; 1920×1080 à dpr 1,25), 1
  (1024×640 à dpr 1 : la vue fait alors 588 pixels du jeu de haut au lieu de
  ~440, c'est l'arrondi entier). Pas de pixels inégaux en largeur. En hauteur,
  hors CRT (q1), aucune plage anormale. Les seules bandes viennent du CRT
  (voir plus haut).
- **4 niveaux** : q1 = canevas d'un pixel par pixel du jeu (640×374 à dpr 1),
  sans `crt` ni `tilt-on` ; q2 = `crt` ; q3/q4 = `crt tilt-on`. Mêmes
  cadrages, pixels nets au centre à tous les niveaux. À dpr 2 en 1280×800, le
  facteur 3 est impair : q3 n'y passe pas en demi-résolution (q3 = q4,
  2560×1496), comme prévu par `fitScreen`. Je n'ai pas compté les flocons de
  q1 (`weather.density = 0.5` lu dans le code).
- **Combat** : zoom d'action entier (2 → 3 contre la meute à dpr 1), retour à 2
  après ; molette ±, puis retour à 2. (2,01 relevé en plein glissé, normal.)
- **Nuit et torche** : halo en paliers tramés autour du viking (grève, forêt
  noire, bosquet), ombres portées tramées autour de lui (captures 0070, 0076).
  Hors du halo, rien n'est plus sombre que la nuit. La grotte est de nuit même
  quand le jeu est mis en plein jour, torche allumée. Au crépuscule puis à
  l'aube du run, la torche s'allume (05:57) et s'éteint (13:39) sans saut de
  rendu.
- **Chargement** : aucun morceau manquant sur les 101 captures du run. Après
  chaque téléportation (7 lieux × 3 navigateurs), `morceauxEnAttente` = 0 dès
  1,5 s, sans rectangle sombre. Écran jamais figé : deux captures à 1,2 s
  d'écart diffèrent toujours dehors (dans la maison elles sont identiques,
  normal : pas de neige sous un toit).
- **Navigateurs** : même parcours (barque, plaine des morts, forêt noire de
  nuit, bosquet de nuit, maison, intérieur, grotte) dans Chromium 141, Firefox
  et WebKit : mêmes cadrages, zooms identiques (2 dehors, 4 dedans), aucune
  erreur.
- **FPS** (conteneur sans carte graphique, valeurs relatives ; à dpr 1, q3 et
  q4 sont la même configuration, mesurées 5,9 et 8,2 : ±30 % de bruit) :
  - grève, 1280×800, dpr 1 : q1 12,8 · q2 12,7 · q3/q4 ~6–8 ;
  - forêt noire de nuit : q1 7,2 · q2 7,5 · q3 3,2 · q4 4,7 (la forêt noire de
    nuit coûte environ deux fois la grève) ;
  - dpr 1,25 : q1 36 · q2 17,7 · q3 6,2 · q4 4,4 ;
  - dpr 2 : q1 18,5 · q2 9,8 · q3 = q4 2,6.

  La qualité 1 vaut bien deux à six fois la 3 ; la 2 coûte surtout sur écran
  dense (filtre CSS du CRT). Le run fait 11,7 de moyenne (min 7,1), le
  v1.22.1 7,2 (min 4,4), mais sur un parcours et une vitesse différents : pas
  de signe de régression. Navigateurs (parcours, q3) : Chromium 5–9, Firefox
  8,5–10,7, WebKit 9,5–14. WebKit est plus rapide, sans doute parce qu'il
  n'applique pas le flou.
- **Erreurs** : `erreurs: []` et `derniereErreurDuJeu: null` dans run.json ;
  aucune erreur de console dans mes 40 sessions (3 navigateurs).
