# Décisions — 20261001-1718-reel-decrochage

Question : Où un joueur décroche-t-il entre la grève et la maison ? Mesure le
temps sans événement entre deux repères.
Version jouée : v1.24.1 · Testeurs : tests/ · Mesures : mesures.md

**Playtest arrêté au premier BLOQUANT** (étape 2) : ni joueurs, ni synthèse,
ni designers. À relancer une fois le bloquant corrigé.

## BLOQUANT

### Changer la qualité en cours de partie réduit l'image du jeu à un quart de l'écran — testeur-rendu
- Constat : à dpr 1, passer le curseur « Qualité de l'image » de 1 ou 2 à
  3 ou 4 en pleine partie : le canevas prend sa nouvelle taille (1280×748)
  mais s'affiche en 640×374, collé en haut à gauche, sur la copie floue
  figée. Le viking n'est plus au centre. Ça dure jusqu'à un redimensionnement
  de la fenêtre ou un rechargement. Chromium, Firefox et WebKit, au calme
  comme en combat ; aucune erreur de console. Le sens 3 → 1 marche ; à dpr 2,
  le passage 1 → 3 tombe juste par hasard.
- Reproduction : Réglages, curseur sur Légère, puis sur Équilibrée. Ou
  `cd tests && node qualite.mjs chromium 1 1,3` (reproduit aussi par
  l'orchestrateur : `→ q 3 canevas 1280x748, affiché 640x374`).
- Piste : `setQuality` → `resize` (`game.scale.setZoom(1 / f.dpr)` puis
  `game.scale.resize`) : la taille affichée se perd quand la densité du
  canevas change.
- Régression : oui (v1.23.0 changeait CRT et flou en jeu sans casser
  l'image ; le curseur de v1.24.0 redimensionne le canevas).
- Captures : tests/rendu/qualite-chromium-d1-12343214.png,
  tests/rendu/chromium-d1-q3-combat-combat-q4.png
- [ ] **Jérôme tranche** : 

## Réponse provisoire à la question (mesures, sans joueurs)

Voir `mesures.md`. En temps de marche réel (distance ÷ 18 px/s) :
- **Premier décrochage probable : le bosquet, à 2:53.** À une cadence
  d'image normale, un joueur qui marche sans frapper meurt sous la meute et
  se réveille à la barque (testeur-fonctionnel ; le run du conteneur ne le
  montre pas, ses loups ne mordent pas à 8 images/s).
- **Le plus long creux : la seconde moitié de la forêt noire**, de la meute
  à la grande Freya : 0:54 de marche (≈ 4 min pour le script), aucun
  événement, seulement des clairières ; puis 0:39 de plaine jusqu'à la
  maison. Meute → Chapitre VI : 1:33 sans aucun événement.
- Second creux : Chapitre IV → hurlement, 0:38 de forêt noire.
- La première moitié (grève → forêt) est rythmée : un repère toutes les
  20 à 40 s.

## Problèmes signalés par les testeurs (pour mémoire)

### MAJEURS
- **Morsures des loups dépendantes des images par seconde** (fonctionnel) :
  à 4–8 images/s le bond saute la fenêtre de morsure (0 morsure) ; à
  15,7 images/s, 3 morsures et la mort. `pack.js`, état `lunge`.
- **Le guetteur s'efface pendant le combat contre la meute**, dès le premier
  passage (fonctionnel, systèmes) : silence de 6 s en pleine musique de
  combat.
- **Maj tenue, endurance vide : plus de coup possible** (systèmes) :
  endurance collée à ~0,02, les clics donnent « essoufflé » ; pas de seuil de
  reprise (`game.js` l. 975).
- **Ralenti du jeu à faible cadence** (systèmes) : Phaser plafonne le delta à
  16,7 ms pendant 120 images après un retour de focus ou d'onglet, et en
  continu sans focus.
- **Les lignes du CRT ne suivent pas les pixels du jeu** (rendu) : `--px`
  posé sur `#stage` n'atteint pas `.crt-layer` (frère, pas enfant) ;
  période fixe de 3 px CSS, bandes irrégulières à 125 %.

### MINEURS
- La nuit, la musique de combat contre la meute plafonne à « tendue »
  (`1 - 0.25 * night`), peut-être voulu (fonctionnel).
- Musique et zone oscillent à la lisière de la forêt noire (pas
  d'hystérésis sur `deep > 0.3`) (fonctionnel, systèmes).
- « Chapitre VI — La maison » déborde sur l'intérieur (déjà vu en v1.22.1).
- La graine ne rend pas les combats rejouables au-delà du premier coup.
- Le compteur de pas augmente contre un obstacle (`game.js` l. 1000).
- Flou presque absent dans WebKit (`ctx.filter`), à vérifier sur Safari.
- Anneaux concentriques dans le noir autour des intérieurs.
- Le canevas ne suit pas un changement de hauteur de la scène sans
  redimensionnement de la fenêtre (bandeau sur appareil tactile).
- Harnais : `--heure` ne tient pas avec `--vitesse` ; le script avance à
  ~5 px/s (zigzags de `walkTo`) ; le temps de jeu démarre lentement.
