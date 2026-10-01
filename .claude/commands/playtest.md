---
description: Playtest complet de KINGVI SNO 7 par l'équipe d'agents (harnais, testeurs, joueurs, synthèse, designers, gardien du ton). Argument : la question de la version.
argument-hint: "<question, ex. La forêt noire est-elle trop longue ?>"
---

# Playtest complet

Question de cette version : **$ARGUMENTS**

Tu orchestres l'équipe d'agents définie dans `.claude/agents/`. Les agents ne
peuvent pas en lancer d'autres : c'est toi qui les lances, avec l'outil
Agent (`subagent_type` = nom de l'agent), et qui écris leurs sorties.

**Ne JAMAIS implémenter une proposition** : ni code, ni réglage, ni
CLAUDE.md. Jérôme tranche. Ce playtest ne modifie que `playtests/`.

## 0. Préparer
- Lis `DESIGN.md` et la section « Playtest et agents » de `CLAUDE.md`.
- Si `tools/playtest/node_modules` manque : `sh scripts/setup-playtest.sh`.
- Version jouée : `version.json`. Run précédent : `ls playtests/`.

## 1. Le harnais
Choisis les options selon la question (`node tools/playtest/run.js --aide`) :
par exemple `--reel` pour une question de rythme ou de longueur (tout à pied,
long : utilise `--vitesse 2` à `4`), `--heure nuit` pour la nuit, un parcours
partiel (`--from`, `--to`) pour une zone. Par défaut, le parcours complet.

```
cd tools/playtest && node run.js --etiquette "<mot-clé de la question>" [options]
```

Lance-le en arrière-plan (plusieurs minutes) et attends la fin. Puis, dans le
dossier du run (`playtests/vX.Y.Z/<run-id>/`) :
- écris `question.md` (la question, la date, les options du harnais) ;
- lis `carnet.md` et vérifie qu'il est lisible (étapes « ok », captures
  présentes, pas d'erreur dans `run.json`). Si une étape a échoué à cause du
  script, relance une fois ; sinon note-le.

## 2. Les testeurs
Lance en parallèle `testeur-fonctionnel`, `testeur-rendu`, `testeur-systemes`,
chacun avec le chemin du run. Ils écrivent `tests/<nom>.md`.

**S'il y a un BLOQUANT** : arrête-toi là. Écris `decisions.md` avec seulement
la liste des BLOQUANTS (reproduction, capture) et dis-le à Jérôme. Pas de
joueurs, pas de designers.

## 3. Les joueurs
Lance en parallèle, isolés les uns des autres, `joueur-10-roblox`,
`joueur-11-novice`, `joueur-12-mythologie`, `joueur-14-inde`,
`joueur-15-blase`, `parent-referent`. Le prompt de chacun contient
seulement : le chemin absolu du dossier du run et la consigne de lire
`carnet.md` et ses captures. **Ne leur donne ni la question, ni DESIGN.md,
ni aucun autre retour** (cela biaiserait leur regard). Écris la réponse de
chacun, telle quelle, dans `retours/<nom-de-l-agent>.md`.

## 4. La synthèse
Lance `synthetiseur` avec le chemin du run. Il écrit `synthese.md`.

## 5. Les designers, puis le gardien
Lance en parallèle `designer-rythme`, `designer-recit`, `designer-toucher`,
avec le chemin du run et la question. Écris leurs réponses dans
`designers/<nom>.md`.

Puis lance `gardien-du-ton` avec toutes les propositions (le contenu des
trois fichiers). Écris sa réponse dans `designers/gardien-du-ton.md`.

## 6. Les décisions
Écris `decisions.md` d'après `playtests/_templates/decisions.md` :
- chaque proposition retenue (ou retenue sous condition), avec constat,
  proposition, hypothèse, mesure, condition du gardien, et une case
  `- [ ] **Jérôme tranche** :` vide ;
- chaque refus, avec la règle invoquée et le motif du gardien ;
- les problèmes MAJEURS et MINEURS des testeurs, pour mémoire.

## 7. Rendre compte
Dis à Jérôme, en quelques lignes : la réponse courte à la question (d'après
la synthèse), les propositions retenues (titres), les refus, les problèmes
des testeurs, et le chemin de `decisions.md`. Propose de committer le
dossier du run (`playtests/…`) ; ne pousse rien sans son accord.
