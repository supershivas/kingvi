# Gardien du ton — run à blanc 20261001-1625-light (v1.22.1)

Aucune proposition de designer à juger : pas de verdict. Le seul changement
de la version (mode `?debug=1`) est invisible pour le joueur, donc hors de
mon champ. Ce qui suit lit **le jeu tel qu'il se montre** dans le carnet et
les captures (0001, 0003, 0008, 0015, 0024, 0030, 0034, 0042, 0044, 0046,
0065), à l'aune de `DESIGN.md`. Les règles de « Ce que le jeu refuse » sont
toutes `[À VALIDER]` : chaque tension ci-dessous en dépend.

## Conformité à la bible

Dans l'ensemble, le jeu respecte la bible.

- **Les traces sont le récit** : la piste guide seule ; on voit la double
  piste puis la piste unique tachée de sang après la maison (0042, 0044).
- **L'immensité** : vue lointaine, viking minuscule, grands blancs (0030,
  0042) ; la Freya debout écrase la scène.
- **Trois couleurs** : neige, bleu nuit, rouge du sang, noir de l'intérieur
  (0034). Rien d'autre dans l'image de jeu.
- **Rien de géométrique** : clairières, lisières et sente déchiquetées ; seule
  la pièce de la maison garde des lignes, comme prévu.
- **Le monde vit seul** : le vent change quatre fois (tempête, rafales,
  tourbillons, bise) sans le joueur.
- **Violence brève et lourde** : trois coups abattent, le sang reste sur la
  neige (0046, 0065).
- **Interface mince** : une seule consigne de commandes, qui s'efface (0003) ;
  pas de flèche, pas de marqueur, pas de carte ; on se réveille à la barque.
  Le compteur n'apparaît pas (aucun arbre abattu).
- **Musique** : elle se tait avant les chapitres, se fait sourde en forêt
  noire, tendue avant l'autre, combat, puis calme. Tout cela conforme.

Écart hors refus, à signaler : les titres de chapitre s'affichent dans une
romaine ordinaire (0003, 0034), pas dans la gothique du titre exigée par la
bible (« le nom en gothique »). Il faut vérifier si c'est le jeu ou le
navigateur du script.

## Tensions avec « Ce que le jeu refuse »

- **Pas d'interface permanente.** L'en-tête du site (nom, logo rouge, roue
  crantée) reste affiché en haut pendant toute la partie, même au repos. Sa
  barre gris anthracite est hors palette.
- **Pas de couleur en plus.** La teinte rouge à un point de vie rosit toute
  la neige (0015, 0024) : à l'écran, cela fait une quatrième teinte, ni
  neige, ni sang.
- **Pas de violence complaisante.** Au bout des traces, sous le zoom de
  combat, les flaques de sang sont plus larges que les corps (0065). On n'est
  plus dans « quelques pixels, vu de très loin ».
- **Pas d'ennemis en nombre / pas de combat à répétition.** La meute
  ressurgit et attaque une seconde fois à 01:16, après « ne l'attaquent
  plus ». L'autre viking se combat trois fois en moins d'une minute de jeu
  (morts volontaires du script, mais le jeu le permet sans limite).
- **Pas de dialogue ni de texte narratif / le monde dit tout par la neige.**
  Le guetteur s'efface à l'instant même où les loups surgissent (01:16) : son
  silence (`hush`) est aussitôt couvert par la musique de combat, et sa
  disparition se perd dans l'attaque.
- **Pilier 1, « tout ce qui compte se voit ».** Dans la forêt noire, les
  loups ne se distinguent pas sur le sol noir (0008, 0015) : seul le sang les
  trahit.

## Récapitulatif

| Point observé | Statut | Règle invoquée |
|---|---|---|
| Piste, immensité, palette, nature non géométrique | Conforme | Piliers 1 à 4 |
| Vent autonome, mort sans punition, consigne unique | Conforme | Pilier 5 ; refus « tutoriel bavard », « mort punitive » |
| Titres de chapitre hors gothique | Écart (à vérifier) | « le nom en gothique » |
| En-tête du site toujours visible | Tension | Pas d'interface permanente |
| Teinte rouge à 1 PV qui rosit la neige | Tension | Pas de couleur en plus |
| Flaques de sang larges sous le zoom | Tension | Pas de violence complaisante |
| Meute qui revient, autre viking combattu trois fois | Tension | Pas d'ennemis en nombre, pas de combat à répétition |
| Guetteur couvert par l'attaque des loups | Tension | Silence du guetteur (« muette quelques secondes ») |
| Loups invisibles en forêt noire | Tension | Pilier 1 « tout ce qui compte se voit » |
