@.claude/conventions.md

# KINGVI SNO 7

## Description

Jeu contemplatif en pixel art : un viking armé d'une épée accoste sur une île
enneigée et suit des traces dans la neige. Très peu d'éléments, écran en trois
couleurs (neige bleutée, bleu nuit, rouge de l'accent), avec du vent, un effet
d'écran cathodique discret et un flou de maquette (tilt-shift), désactivables.
Vue de très loin : on doit sentir l'immensité de l'île.

On accoste à l'ouest et on suit les traces vers l'est ; au bout (environ
3 minutes de marche), une petite maison dont la cheminée fume.

Commandes : ZQSD (touches physiques, donc WASD en QWERTY) ou flèches pour
marcher, clic pour frapper, toujours de profil, du côté du pointeur. L'épée
est cachée sous la cape et ne sort que pendant l'attaque.

- Production : https://supershivas.github.io/kingvi/
- Catégorie : **secondaire**.
- Cible : **uniquement bureau** (bandeau refermable sur téléphone).

## Stack

- HTML/CSS/JS statique, modules ES, sans build.
- Phaser 3.90.0, copié dans `vendor/phaser.min.js` (dépendance validée ;
  ne pas passer par un CDN : l'app doit charger même si le CDN tombe).
- Hébergement : GitHub Pages, branche `main`, racine du dépôt (`.nojekyll`).
- Données : `localStorage` uniquement (`kingvi:save` : position, orientation,
  nombre de pas ; `kingvi:prefs` : effet CRT, tilt-shift). Récupérables via l'export JSON.
  Pas de Supabase.

## Structure

- `index.html` — en-tête, écran de jeu, réglages (`<dialog>`), toast.
- `js/main.js` — interface : réglages, export, sauvegarde, mise à jour auto.
- `js/game.js` — scène Phaser : sol par morceaux, viking, empreintes,
  vent (rafales, flocons, poudrerie), attaque (traînée, impact), maison et
  fumée, échelle entière (`fitScreen`) pour des pixels nets.
  `WORLD_VERSION` : à incrémenter quand l'île change, les anciennes positions
  sauvegardées repartent alors du drakkar.
- `js/viking.js` — le sprite, dessiné pixel par pixel à partir de poses
  (marche en 4 temps en profil/face/dos, attaque en 4 temps de profil).
- `js/world.js` — l'île, déterministe (graine fixe) : côte, traces, rochers,
  pierres levées, cairns, drakkar, maison (`HOUSE`, `HOUSE_ART`).
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
  (`rng`) déplace les traces et les objets : vérifier la carte de l'île
  après coup, et incrémenter `WORLD_VERSION` dans `game.js`.
- Le viking doit peser sur la neige : son ombre est dessinée dans le sprite,
  sur la ligne même des pieds. Une ombre séparée, un pixel plus bas, le
  faisait léviter.
- Il doit rester petit (environ 9 pixels de haut, écran d'environ 440 pixels
  de haut) et se lire comme une masse : pas de visage ni de détail.
- `pagehide` sauvegarde la partie : pour tester une position, écrire la
  sauvegarde avant le chargement (sinon elle est écrasée).
