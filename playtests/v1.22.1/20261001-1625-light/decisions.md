# Décisions — 20261001-1625-light

Question : run à blanc de `/playtest-light` — le harnais produit-il un carnet
lisible, et rien n'est-il cassé de la meute à la victoire ?
Version jouée : v1.22.1 · Testeur : tests/testeur-fonctionnel.md · Gardien : designers/gardien-du-ton.md

Verdict du testeur fonctionnel : **MINEURS** (aucun BLOQUANT, aucun MAJEUR ;
premier run, pas de régression à chercher). Carnet lisible, 0 erreur.

## Points ouverts

### 1. Le guetteur s'efface au moment où la meute surgit
Si l'on revient en saignant, la meute (qui suit le sang) sort à ~204 px de
la clairière, et le guetteur s'efface à 64 px du viking : les deux tombent
à la même seconde, et son silence est couvert par la musique de combat.
(Testeur : MINEUR ; gardien : tension avec « tout ce qui compte se voit ».)
- [ ] **Jérôme tranche** :

### 2. Le corps de l'autre viking change de place au rechargement
Il reste à terre, mais réapparaît à son poste d'attente (~40 px plus loin
que là où il est tombé) : sa position n'est pas sauvegardée, contrairement
aux loups. (Testeur : MINEUR.)
- [ ] **Jérôme tranche** :

### 3. Le titre « La maison » se lit encore dans la pièce
Visible par-dessus le corps quand on entre vite (ici, à cause du téléport
du script). (Testeur : MINEUR.)
- [ ] **Jérôme tranche** :

### 4. Tensions avec « Ce que le jeu refuse » (gardien du ton)
Toutes ces règles sont encore `[À VALIDER]` :
- l'en-tête du site (nom, logo, roue) reste affiché en jeu, sur une barre
  hors palette ;
- à un point de vie, la teinte rouge rosit la neige (une quatrième teinte) ;
- sous le zoom de combat, les flaques de sang sont plus larges que les corps ;
- la meute et l'autre viking peuvent être combattus sans limite (mort →
  réveil → retour) ;
- en forêt noire, les loups se distinguent mal du sol noir (seul le sang les
  trahit).
- [ ] **Jérôme tranche** (valider ou amender les règles de DESIGN.md) :

## Pour l'outillage (pas des décisions de jeu)
- Le journal ne dit pas quel loup est touché : impossible de vérifier « deux
  coups par loup » depuis le carnet (à ajouter au mode debug).
- Après un téléport, le lieu du carnet arrive 1 à 2 s en retard (lissage des
  lisières) ; certaines légendes de capture gardent l'ancien lieu.
- Le script marche vers le guetteur à 1 PV et meurt sous la meute : le carnet
  raconte trois morts au lieu d'une (attendre la guérison avant l'étape).
- Les titres de chapitre sont dans une police de secours sur les captures :
  les polices Google ne chargent pas dans le conteneur (pas dans le jeu).
