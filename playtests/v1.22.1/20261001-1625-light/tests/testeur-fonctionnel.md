# Rapport — testeur-fonctionnel — 20261001-1625-light
Verdict : MINEURS

Sources lues : `carnet.md`, `events.json` (201 événements), `durations.json`,
`run.json` (0 erreur, `derniereErreurDuJeu` nulle), captures 0022, 0035, 0065.
Premier run : aucune comparaison de régression possible. Une vérification
Playwright de la reprise (`tests/reprise.mjs`, capture `tests/reprise.png`),
et un calcul de géométrie (`tests/geo.mjs`, qui lit `world.js`).

## Problèmes

### [MINEUR] Le guetteur et la meute se déclenchent dans la même image quand on revient en saignant
- Constat : à 01:16 (`jeu` 76.2), `meute-attaque` et `guetteur-efface` arrivent
  à la même milliseconde, en (3226, 2200). La silhouette s'efface pendant que
  les loups sortent : le joueur ne la voit pas, et le silence de 6 s
  (`audio.hush(6)`) tombe en plein combat. Le guetteur est à 130 px du centre
  de la clairière (`WATCHER_AT` (3281, 2170), `WOLF_DEN` (3190, 2242)) ; il
  s'efface à 64 px, mais avec `pack.scent` la meute sort à `r + 140` = 204 px.
  Sans le sang, les deux restent séparés (portée normale 51 px).
- Étapes de reproduction : `node run.js --from bosquet --to guetteur` (graine 7) :
  la meute blesse, on recule, puis on avance vers le guetteur.
- Attendu / obtenu : DESIGN.md place le guetteur « plus loin », comme un moment
  à part ; obtenu : un seul moment, où le combat couvre la présence.
- Capture : captures/0022.jpg
- Régression : inconnu

### [MINEUR] Rechargé, l'autre viking abattu reprend sa place d'attente
- Constat : avec une sauvegarde `foeDead: true`, le corps réapparaît à son
  poste (5179, 2627), pas là où il est tombé (≈ 5156, 2659 dans ce run), à
  environ 40 px. La sauvegarde ne retient pas sa position (`wolvesDead` retient
  celle des loups ; `createFoe(... dead)` appelle `die(1)` au poste). Le sang
  du combat, lui, reste ailleurs. `state().ennemi.pv` vaut 3 chez un mort
  (sans effet en jeu).
- Étapes de reproduction : `node tests/reprise.mjs` (lancé depuis `tools/playtest`).
- Attendu / obtenu : « Tombé, il reste à terre (même après rechargement) » :
  il reste à terre, mais il a bougé.
- Capture : tests/reprise.png
- Régression : inconnu

### [MINEUR] Le titre « Chapitre VI — La maison » se lit encore à l'intérieur
- Constat : le chapitre s'inscrit à 01:40 devant la maison ; à 01:46, dans la
  pièce, le titre achève de s'effacer, en gros, par-dessus le corps.
- Attendu / obtenu : un titre lu dehors ; obtenu : il déborde sur la scène du
  meurtre (le vrai joueur, qui marche plus longtemps, l'évitera sans doute :
  ce sont surtout le téléport et l'entrée directe du script qui le provoquent).
- Capture : captures/0035.jpg
- Régression : inconnu

### [MINEUR] Harnais : le carnet suit les zones avec du retard après un saut ou un réveil
- Constat : après un téléport ou un réveil, l'événement `zone` arrive 1 à 2 s
  plus tard, et parfois avec une zone de départ fausse : capture 0002 légendée
  « la grève » alors qu'on est dans la forêt noire ; `zone de: bosquet → plaine`
  à 85.0, alors que le réveil venait de nous poser sur la grève ; capture 0027
  (après le réveil, saut vers la plaine). C'est le harnais, pas le jeu.
- Régression : non (premier run)

### [MINEUR] Harnais : deux morts imprévues brouillent les étapes
- Constat : l'étape « guetteur » se termine par une mort (meute, `scent`, à
  1 PV : aucune guérison possible en 7 s, il en faut 25 hors combat) ; l'étape
  « victoire » meurt une fois (échange de coups : 3 coups reçus en 2,5 s
  contre 2 donnés) avant de gagner au second essai. Le jeu se conduit comme
  prévu (réveil à la barque, l'autre repart à 3 PV : les combats en cours sont
  réinitialisés) ; mais le script avance en saignant vers le guetteur, et le
  carnet raconte trois morts au lieu d'une. À la graine 7, la victoire dépend
  du hasard de l'échange.
- Régression : non (premier run)

## Non vérifié (données insuffisantes)
- **Deux coups par loup** : trois coups touchent un loup (61.3, 64.2, 69.3),
  aucun ne meurt. Plausible (trois loups différents, et `scatter` remet les PV
  à 2), mais `events.json` ne nomme pas le loup touché : à ajouter au journal
  (`coup-donne` avec l'indice du loup et ses PV) pour trancher au prochain run.
- Parcours complet de la pièce (de l'entrée au fond) : 6 s dedans seulement.
- Corbeaux sur le cadavre : le run s'arrête 3 s après la victoire, sans s'éloigner.

## Vérifié sans problème
- Meute : hurlement au loin (4.9) bien avant la sortie (18.1), dans la
  clairière ; Chapitre V au même instant, musique de combat sans silence ;
  grognements, morsures (25.5, 48.9) ; retraite quand on s'éloigne (71.7) ;
  au retour en saignant, sortie plus tôt (`scent`, conforme à DESIGN.md).
- Guetteur : son de présence, silence de 6 s, `watcherGone` sauvegardé.
- Maison : Chapitre VI une fois, entrée (104.6) et sortie (110.5) au seuil de la
  porte (4207, 2955 ; `HOUSE_DOOR_OUT` = 4214, 2944), musique étouffée dedans,
  calme dehors ; corps et sang visibles (0035).
- Autre viking : attend, engage (129.7), Chapitre VII une fois, musique tendue
  puis combat ; trois coups tuent le héros ; trois coups l'abattent (177.9),
  il reste à terre (0065), `foeDead: true` ; musique calme ensuite.
- Mort et réveil : trois morts, trois réveils à la barque (610, 3272), PV
  pleins au réveil, meute dispersée, l'autre réinitialisé.
- Chapitres : chacun une seule fois (I, IV, V, VI, VII), silence de 4 s
  avant, sauf aux combats (V, VII) ; II et III sautés par le téléport.
- Reprise : `foeDead`, `watcherGone`, chapitres, compteur et loup mort
  restitués après chargement, sans erreur (`tests/reprise.mjs`).
- Stabilité : 0 erreur, aucun gel, 7,2 images/s en moyenne (conteneur sans GPU).
- Le carnet est lisible : étapes, sauts en italique, sons écrits, bilan final.
