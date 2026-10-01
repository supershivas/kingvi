# Mesures — temps sans événement entre deux repères

Pour les testeurs et les designers (pas pour les joueurs).
Distances le long des traces (`trail` de `world.js`, 6209 px de la barque au
bout). « Marche » = distance ÷ 18 px/s, le temps d'un joueur qui marche sans
s'arrêter. « Script » = temps de jeu mesuré dans ce run (gonflé, voir
`question.md`). Les repères sans événement dans le journal (statues,
nécropole, clairières) sont placés par leur point de piste le plus proche ;
à l'écran, ils entrent dans le champ environ 8 à 10 s de marche plus tôt.

## Repères, dans l'ordre

| Repère | Piste (px) | Marche | Script | Événement |
|---|---|---|---|---|
| Barque, Chapitre I La grève | 0 | 0:00 | 0:02 | chapitre |
| Chapitre II La plaine des morts | 475 | 0:26 | 1:04 | chapitre, silence |
| Nécropole (pierres levées, à 138 px de la piste) | ~600 | 0:33 | ~1:10 | aucun (vue) |
| Envol de corbeaux | 1175 | 1:05 | 2:22 | son, envol |
| Chapitre III La forêt | 1566 | 1:27 | 3:25 | chapitre, silence |
| Freya ensevelie (à 26 px) | 2001 | 1:51 | ~4:30 | aucun (vue) |
| Chapitre IV La forêt noire | 2262 | 2:06 | 4:56 | chapitre, musique sourde |
| 4 premières clairières | 2254 → 2979 | — | — | aucun (vue) |
| Hurlement au loin | 2948 | 2:44 | 8:10 | son |
| Bosquet, Chapitre V Les loups | 3110 | 2:53 | 8:53 | chapitre, meute |
| Guetteur qui s'efface | 3220 | 2:59 | 9:05 | silence 6 s |
| La meute renonce | 3310 | 3:04 | 9:14 | — |
| 5 clairières suivantes | 3434 → 3932 | — | — | aucun (vue) |
| Sortie de la forêt noire | ~3993 | 3:42 | 13:06 | zone, musique calme |
| Grande Freya debout (à 38 px) | 4284 | 3:58 | ~14:25 | aucun (vue) |
| Chapitre VI La maison | 4982 | 4:37 | 16:34 | chapitre, silence |
| Porte de la maison | 5087 | 4:43 | 16:43 | entrée |

## Les plus longs écarts sans événement (journal)

Événements comptés : chapitres, sons du monde (corbeaux, hurlement,
grondements, présence), meute, guetteur, entrées. Ni le vent, ni le jour, ni
les changements de zone.

| De → à | Marche | Script | Ce qui se voit entre les deux |
|---|---|---|---|
| Meute qui renonce → Chapitre VI | **1:33** | 7:20 | fin de la forêt noire (5 clairières), sortie, grande Freya, plaine |
| Chapitre IV → hurlement | **0:38** | 3:14 | forêt noire, 4 clairières, rien d'autre |
| Corbeaux → Chapitre III | 0:22 | 1:02 | plaine, (le lac au sud, à 280 px) |
| Chapitre II → corbeaux | 0:39 | 1:18 | nécropole |
| Chapitre III → Chapitre IV | 0:39 | 1:31 | forêt claire, Freya ensevelie |

Si l'on compte aussi ce qui se voit sans événement (statues), le plus long
trou est **la seconde moitié de la forêt noire** : de la meute (3310) à la
grande Freya (4284), 974 px, **0:54 de marche**, de nuit dans ce run, sans
autre repère que des clairières. Puis **grande Freya → maison** : 0:39 de
plaine.

À l'opposé, le bosquet concentre tout en 15 s de marche (hurlement, meute,
chapitre V, guetteur, retraite de la meute) : un pic après un creux, suivi
d'un autre creux.

## Correctif après le testeur fonctionnel

Le « pic » du bosquet et « la meute renonce » sont des artefacts du
conteneur : à ~8 images/s, le bond du loup saute par-dessus la fenêtre de
morsure. Rejoué à ×1 à 15,7 images/s (`tests/out-meute1-leger.txt`), un
joueur qui marche sans frapper reçoit 3 morsures et meurt au bosquet ; il se
réveille à la barque, à **2:53 de marche** du départ. C'est vraisemblablement
le premier décrochage réel, avant même le creux de la seconde moitié de la
forêt noire. Le guetteur s'efface pendant ce combat (silence de 6 s en
pleine musique de combat).
