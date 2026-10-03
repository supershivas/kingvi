/* Les reliques de l'île : ce qu'on ramasse en chemin et qui va dans
   l'inventaire (touche I). Chacune a son dessin, à redessiner dans l'atelier
   du labo (onglet Dessins) : ceux d'ici ne sont que des placeholders, de la
   taille qu'il faut garder. Deux dessins par relique : celui de l'inventaire
   (`rows`, RELIC_SIZE, dossier « Reliques ») et celui qu'on voit à terre sur
   l'île (`ground`, RELIC_GROUND_SIZE, dossier « Reliques sur l'île »).

   Où on les trouve (game.js : `dropRelic`, `updateRelics`) :
   - la poupée : on frappe l'arbre sacré, une offrande tombe ;
   - le rubis : on frappe le roi mort, dans la grotte, il tombe de sa poitrine ;
   - le médaillon : oublié sur la table de la maison ;
   - le sceau : dans le coffre de la crypte ;
   - l'anneau : il tombe de la main de l'autre viking quand il meurt ;
   - la dent : elle tombe du premier loup abattu. */

export const RELIC_SIZE = { w: 10, h: 10 };            // le dessin de l'inventaire
export const RELIC_GROUND_SIZE = { w: 4, h: 4 };       // la relique vue sur l'île : de 1 à 4 pixels (le viking en fait 9)

export const RELICS = [
  {
    id: 'poupee', name: 'La poupée de paille', about: 'Une offrande pendue à l\'arbre sacré, tombée sous la lame.',
    rows: [
      '....bb....',
      '...bssb...',
      '...bssb...',
      '..bbssbb..',
      '.b.bssb.b.',
      '...bssb...',
      '...bssbb..',
      '...b..b...',
      '..bb..bb..',
      '..........',
    ],
    ground: [
      '.b..',
      'bsb.',
      '.s..',
      'b.b.',
    ],
  },
  {
    id: 'rubis', name: 'Le rubis du roi', about: 'Tombé de la poitrine du roi mort quand on l\'a frappé.',
    rows: [
      '..........',
      '...bbbb...',
      '..brrrsb..',
      '.brrrrrsb.',
      '.brrrrrrb.',
      '..brrrrb..',
      '...brrb...',
      '....bb....',
      '..........',
      '..........',
    ],
    ground: [
      '....',
      '.rr.',
      'rsrr',
      '.rr.',
    ],
  },
  {
    id: 'medaillon', name: 'Le médaillon', about: 'Posé sur la table de la maison, près du corps.',
    rows: [
      '....bb....',
      '...b..b...',
      '...b..b...',
      '....bb....',
      '..bbbbbb..',
      '.bsssssbb.',
      '.bssbbssb.',
      '.bssbbssb.',
      '..bsssbb..',
      '...bbbb...',
    ],
    ground: [
      '.bb.',
      'b..b',
      'bssb',
      '.bb.',
    ],
  },
  {
    id: 'sceau', name: 'Le sceau de la crypte', about: 'Dans le coffre de la crypte, sous la statue de l\'îlot.',
    rows: [
      '..........',
      '..bbbbbb..',
      '.bsssssbb.',
      '.bsbssbsb.',
      '.bssbbssb.',
      '.bssbbssb.',
      '.bsbssbsb.',
      '.bsssssbb.',
      '..bbbbbb..',
      '..........',
    ],
    ground: [
      '.bb.',
      'bssb',
      'bssb',
      '.bb.',
    ],
  },
  {
    id: 'viking', name: 'L\'anneau de l\'autre', about: 'Tombé de la main de l\'autre viking, au bout des traces.',
    rows: [
      '..........',
      '...bbbb...',
      '..bsssb...',
      '.bs..rsb..',
      '.bs...sb..',
      '.bs...sb..',
      '.bss.ssb..',
      '..bsssb...',
      '...bbb....',
      '..........',
    ],
    ground: [
      '.bb.',
      'b..b',
      'b.rb',
      '.bb.',
    ],
  },
  {
    id: 'loup', name: 'La dent du loup', about: 'Arrachée à l\'un des loups de la forêt noire.',
    rows: [
      '..........',
      '..bbbbb...',
      '..bsssb...',
      '..bsssb...',
      '...bssb...',
      '...bssb...',
      '....bsb...',
      '....bsb...',
      '.....bb...',
      '..........',
    ],
    ground: [
      '..s.',
      '.bs.',
      '.bs.',
      '..b.',
    ],
  },
];

export const relicDesign = id => `relique-${id}`;
export const relicGround = id => `relique-${id}-sol`;
export const relicById = id => RELICS.find(r => r.id === id);
