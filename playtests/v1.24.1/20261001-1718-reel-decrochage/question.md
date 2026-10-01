# Question

**Où un joueur décroche-t-il entre la grève et la maison ? Mesure le temps
sans événement entre deux repères.**

Date : 2026-10-01 · version 1.24.1

Harnais : `node run.js --reel --vitesse 3 --heure jour --etiquette "decrochage"`
(Chromium 141, 1280×800, dpr 1, AZERTY, qualité 3, graine 7, météo en cycle).
Tout à pied, de la barque jusqu'à l'entrée dans la maison (le parcours `--reel`
s'arrête quand le viking passe une porte).

Réserves sur la mesure :
- `--heure jour` n'a pas tenu : `timeScale(3)` accélère aussi le cycle du
  jour ; crépuscule à 05:19, nuit à 06:48, aube à 12:48, jour à 14:19 (temps
  de jeu). Toute la forêt noire a été traversée de nuit, à la torche.
- Le script avance à ~5 px/s de temps de jeu au lieu de 18 (≈ 8 images/s
  dans le conteneur, pas de 12 px avec arrêt entre deux). Les durées brutes
  du carnet (16:43 jusqu'à la porte) sont donc gonflées d'environ ×3,5, et
  plus encore dans la forêt noire où il bute. Les écarts entre repères sont
  ramenés en **temps de marche réel** (distance le long des traces ÷ 18 px/s)
  dans `mesures.md`.
- La meute a attaqué mais n'a pas mordu : le script ne combat pas, il a
  continué de marcher et la meute a renoncé (`meute-fin`, 21 s plus tard).
