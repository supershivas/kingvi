---
description: Playtest léger de KINGVI SNO 7 pour les itérations rapides : harnais, testeur fonctionnel, gardien du ton. Argument facultatif : la question ou la zone à vérifier.
argument-hint: "[question ou zone, ex. la maison]"
---

# Playtest léger

Objet : **$ARGUMENTS** (si vide : vérifier que rien n'est cassé).

Itération rapide : pas de joueurs, pas de synthèse, pas de designers.
**Ne JAMAIS implémenter quoi que ce soit** : ce playtest ne modifie que
`playtests/`.

1. Si `tools/playtest/node_modules` manque : `sh scripts/setup-playtest.sh`.
2. **Harnais** : si l'objet désigne une zone, un parcours partiel
   (`--from`, `--to`, voir `node tools/playtest/run.js --aide`) ; sinon le
   parcours complet, `--sans-lac --vitesse 2`.
   `cd tools/playtest && node run.js --etiquette light [options]`
   (en arrière-plan ; attendre la fin). Écris `question.md` dans le dossier
   du run.
3. Vérifie que `carnet.md` est lisible et que toutes les étapes sont « ok ».
4. **Testeur fonctionnel** : lance `testeur-fonctionnel` avec le chemin du
   run (et l'objet). Il écrit `tests/testeur-fonctionnel.md`.
5. **Gardien du ton** : lance `gardien-du-ton` avec le chemin du run, le
   carnet, et s'il y a lieu le changement en cours (le diff depuis la
   dernière version) : respecte-t-il la bible ? Écris sa réponse dans
   `designers/gardien-du-ton.md`.
6. Écris `decisions.md` (court) : verdict du testeur, BLOQUANTS et MAJEURS,
   avis du gardien, une case `- [ ] **Jérôme tranche** :` par point ouvert.
7. Rends compte en quelques lignes, avec un extrait du carnet.
