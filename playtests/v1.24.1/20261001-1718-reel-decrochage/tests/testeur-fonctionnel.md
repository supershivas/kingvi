# Rapport — testeur-fonctionnel — 20261001-1718-reel-decrochage
Verdict : MAJEURS

Sources lues : `question.md`, `mesures.md`, `carnet.md`, `events.json`
(87 événements), `durations.json`, `run.json` (0 erreur, `derniereErreurDuJeu`
nulle), captures 0057, 0058, 0066, 0100. Run précédent : `v1.22.1/20261001-1625-light`
(autre parcours, du bosquet à la victoire, ×1) : comparaison possible sur la
meute, le guetteur, la maison, la reprise.

Scripts (dans `tests/`, lancés depuis `tools/playtest`) :
- `verif.mjs piste` : chaque point de la piste et une bande de ±3 × ±2 px, praticables ?
- `verif.mjs vitesse` : vitesse de marche à ×1 et ×3 ;
- `verif.mjs meute1 | meute3 | meuteImmobile` : traversée de la clairière à
  pied sans combattre (×1, ×3), ou immobile ; `W=640 H=400 Q=1` pour
  monter les FPS (sorties `out-*.txt`, captures `meute*.png`) ;
- `reprise.mjs` : la reprise de v1.22.1, rejouée sur v1.24.1.

## Problèmes

### [MAJEUR] La morsure des loups dépend des images par seconde : à 8 images/s, on traverse la meute sans une morsure ; à 16, on y meurt
- Constat : dans le run, la meute encercle (5 grondements, donc 5 bonds) de
  533,3 à 554,5 et ne mord jamais ; le script marche et elle renonce. Rejoué
  à ×1 en marchant le long des traces sans frapper : à 4 images/s, 4 bonds,
  **0 morsure** (`out-meute1.txt`) ; à 15,7 images/s (640×400, qualité 1),
  4 bonds, **3 morsures, mort** à (3269, 2147) (`out-meute1-leger.txt`).
  Immobile, même à 2,7 images/s, 3 morsures et la mort en 10 s
  (`out-meuteImmobile.txt`). Cause probable (`pack.js`, état `lunge`) : le loup
  bondit à 125 px/s pendant ~0,3 s et la morsure ne se teste qu'à la position
  de chaque image, dans une fenêtre de 12 × 8 px autour du viking. À 8 images/s
  (×1), le loup avance de ~16 px par image et saute par-dessus la fenêtre ; à
  ×3 (le harnais), de ~47 px, le bond tient en une image. Le bond vise aussi
  là où était le viking, sans anticiper : à la marche, il le manque.
- Étapes de reproduction : `cd tools/playtest && node ../../playtests/v1.24.1/20261001-1718-reel-decrochage/tests/verif.mjs meute1`
  puis `W=640 H=400 Q=1 node …/verif.mjs meute1`.
- Attendu / obtenu : la meute « bondit l'un après l'autre pour mordre » de la
  même façon pour tous ; obtenu : sur une machine lente (le Mac Intel cité dans
  `CLAUDE.md`), elle ne mord jamais un joueur qui marche ; sur une machine
  rapide, un joueur qui marche sans frapper meurt en 10 s.
- Conséquence pour la question du run : le « pic » du bosquet décrit dans
  `mesures.md` (et « la meute a renoncé », `question.md`) est un artefact. Un
  vrai joueur à 60 images/s qui suit les traces sans se battre meurt au
  bosquet et se réveille à la barque, à 2:53 de marche : c'est là le premier
  décrochage probable, que ce run ne peut pas montrer. À refaire à ×1, sans
  `--vitesse`, en mesurant les FPS.
- Capture : tests/meute1.png (mort à 15,7 images/s)
- Régression : inconnu (au run précédent, à ×1 et à l'arrêt pour combattre,
  2 morsures en ~50 s : cohérent avec ce constat)

### [MAJEUR] Pour qui suit les traces, le guetteur s'efface toujours en plein combat contre la meute
- Constat : dans le run, `meute-attaque` à 533,3, `guetteur-efface` à 545,1
  (à 62 px du guetteur), `meute-fin` à 554,5. Rejoué trois fois à pied
  (×1, ×3, ×1 léger) : le guetteur s'efface à chaque fois 5 à 6 s après la
  sortie des loups, pendant qu'ils encerclent. Le guetteur (`WATCHER_AT`, à
  14 points de piste après le bosquet) est à ~130 px du centre de la
  clairière, et la piste passe à moins de 64 px de lui avant que la meute ait
  renoncé (`chase` = 166 px). Le silence de 6 s (`audio.hush`) tombe au milieu
  de la musique de combat. Au run précédent, cela n'arrivait qu'en revenant en
  saignant (`scent`) ; c'est en fait le cas normal de quiconque avance.
- Étapes de reproduction : `node run.js --reel --vitesse 3` (comme ce run),
  ou `verif.mjs meute1`.
- Attendu / obtenu : DESIGN.md met le guetteur « plus loin », un moment à
  part, suivi d'un silence ; obtenu : sa disparition est noyée dans les loups
  et le titre « Chapitre V » (0057, 0058 : le titre couvre encore la clairière).
- Capture : captures/0058.jpg
- Régression : non (même placement en v1.22.1)

### [MINEUR] À la nuit, le combat contre la meute n'atteint pas la musique « à son comble »
- Constat : `meute-attaque` à 533,3 (nuit) → musique `tendue`, jamais
  `combat`. `musicMood` met l'énergie à 1 au combat puis la multiplie par
  `1 - 0.25 * night` : 0,75 la nuit.
- Attendu / obtenu : DESIGN.md « à son comble au combat » ; obtenu : tendue,
  de nuit. Peut-être voulu ; à confirmer.
- Régression : inconnu

### [MINEUR] La musique et la zone battent à la lisière de la forêt noire
- Constat : à l'entrée (295,3 → 297,1) : sourde → calme → sourde en 2 s ; à la
  sortie (786 → 803) : zones noire/forêt/noire/forêt et musique calme → sourde
  → calme. Le seuil `deep > 0.3` de `musicMood` n'a pas d'hystérésis ; un
  joueur qui longe la lisière ou hésite fera osciller l'humeur. Le script, qui
  zigzague, l'exagère.
- Régression : inconnu

### [MINEUR] « Chapitre VI — La maison » se lit encore dans la pièce
- Constat : le titre s'inscrit 105 px de piste avant la porte (5,8 s de marche
  à 18 px/s) et reste affiché 6,8 s (1,4 + 3,8 + 1,6) : même à vitesse réelle,
  il déborde sur le corps et le sang. Ici, à ×3, il couvre la pièce en entier.
- Capture : captures/0100.jpg
- Régression : non (déjà vu en v1.22.1)

### [MINEUR] Harnais : à ×3 et 8 images/s, la marche du parcours `--reel` n'est pas mesurable
- Constat : à ×3, une image vaut ~0,375 s de jeu, soit ~6,8 px de pas ; la
  boucle `walkTo` (arrêt à 4 px, sondage toutes les 80 ms) dépasse et
  zigzague : `distance` 12 639 px de marche commandée pour ~5 090 px de piste.
  La piste elle-même est libre (`verif.mjs piste` : 725 points, un seul
  bloqué, le seuil de la porte de la maison ; aucun passage étroit). Le
  ralentissement ne vient donc pas des arbres. Le recalcul de `mesures.md`
  (distance ÷ 18 px/s) est la bonne approche ; les durées du carnet et de
  `durations.json` ne sont pas exploitables. Par ailleurs, `timeScale`
  accélère le cycle du jour (`--heure jour` ne tient pas, noté dans
  `question.md`), et Phaser bride le delta à 16,7 ms pendant les ~120
  premières images (`panicMax`) : à 8 images/s, le temps du jeu avance à
  peine pendant ~15 s après le chargement (`out-vitesse.txt`, ×1 : 0,6 s de
  jeu en 6 s).
- Régression : non (outil)

## Non vérifié dans ce run
- L'autre viking, la mort et le réveil, la grotte, la crypte, le lac : hors du
  parcours (il s'arrête à la porte de la maison).
- Parcours complet de la pièce et sortie : 5,6 s dedans seulement.
- Deux coups par loup, retraite après blessure, loups morts sauvegardés : le
  script ne frappe pas.

## Vérifié sans problème
- Piste de la barque à la maison : entièrement praticable (`verif.mjs piste`).
- Aucune erreur, aucun gel en 1 003 s de jeu ; FPS moyen 11,7 (non comparable
  au run précédent : ×3 et autre parcours).
- Chapitres I à VI, chacun une seule fois, dans l'ordre et aux bons endroits ;
  silence de 4 s avant chacun, sauf V (combat).
- Corbeaux : envol à 141,5 près de `CROWS`, trois croassements.
- Meute : hurlement au loin (490,3) bien avant la sortie (533,3) ; chapitre V
  au même instant ; retraite quand on s'éloigne (`meute-fin` à 554,5, 2,5 s
  après la sortie de la clairière) ; tous les loups rentrés (`hidden`) à la fin.
- Torche : allumée au crépuscule dans la forêt noire (357,9), éteinte à l'aube
  (819,5) ; halo visible (0066).
- Maison : entrée par la porte (4154, 2930 → pièce 758, 772), musique étouffée,
  corps et sang visibles (0100).
- Reprise (rejouée sur v1.24.1, `tests/reprise.mjs`) : `foeDead`,
  `watcherGone`, chapitres, compteur et loup mort restitués, sans erreur ;
  même résultat qu'en v1.22.1 (y compris le corps de l'autre viking remis à
  son poste, MINEUR déjà signalé). Pas de régression.
