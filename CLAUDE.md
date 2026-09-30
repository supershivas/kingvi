@.claude/conventions.md

# KINGVI SNO 7

## Description

Jeu contemplatif en pixel art : un viking armé d'une épée accoste sur une île
enneigée et suit des traces dans la neige. Très peu d'éléments, écran en trois
couleurs (neige bleutée, bleu nuit, rouge de l'accent) avec un effet d'écran
cathodique discret, désactivable. Vue de très loin : on doit sentir
l'immensité de l'île.

Commandes : ZQSD (touches physiques, donc WASD en QWERTY) ou flèches pour
marcher, clic pour donner un coup d'épée vers le pointeur.

- Production : https://supershivas.github.io/kingvi/
- Catégorie : **secondaire**.
- Cible : **uniquement bureau** (bandeau refermable sur téléphone).

## Stack

- HTML/CSS/JS statique, modules ES, sans build.
- Phaser 3.90.0, copié dans `vendor/phaser.min.js` (dépendance validée ;
  ne pas passer par un CDN : l'app doit charger même si le CDN tombe).
- Hébergement : GitHub Pages, branche `main`, racine du dépôt (`.nojekyll`).
- Données : `localStorage` uniquement (`kingvi:save` : position, orientation,
  nombre de pas ; `kingvi:prefs` : effet CRT). Récupérables via l'export JSON.
  Pas de Supabase.

## Structure

- `index.html` — en-tête, écran de jeu, réglages (`<dialog>`), toast.
- `js/main.js` — interface : réglages, export, sauvegarde, mise à jour auto.
- `js/game.js` — scène Phaser : sol par morceaux, viking, empreintes, flocons,
  échelle entière (`fitScreen`) pour des pixels nets.
- `js/viking.js` — le sprite, dessiné pixel par pixel à partir de poses
  (marche en 4 temps, attaque en 4 temps, vues profil/face/dos).
- `js/world.js` — l'île, déterministe (graine fixe) : côte, traces, rochers,
  pierres levées, cairns, drakkar.
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
  après coup, et savoir que les sauvegardes restent valables (seule la
  position est gardée, remise au rivage si elle tombe dans l'eau).
- Épée tenue pointe en bas, de profil : on la prenait pour une troisième
  jambe. Elle est portée vers l'avant et le haut.
