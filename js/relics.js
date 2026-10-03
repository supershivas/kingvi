/* Les reliques de l'île : ce qu'on ramasse en chemin et qui va dans
   l'inventaire (touche I). Chacune a son dessin, à redessiner dans l'atelier
   du labo (onglet Dessins, dossier « Reliques ») : ceux d'ici ne sont que des
   placeholders, de la taille qu'il faut garder (RELIC_SIZE).

   Où on les trouve (game.js : `dropRelic`, `updateRelics`) :
   - la poupée : on frappe l'arbre sacré, une offrande tombe ;
   - le rubis : on frappe le roi mort, dans la grotte, il tombe de sa poitrine ;
   - le médaillon : oublié sur la table de la maison ;
   - le sceau : dans le coffre de la crypte ;
   - l'anneau : il tombe de la main de l'autre viking quand il meurt ;
   - la dent : elle tombe du premier loup abattu. */

export const RELIC_SIZE = { w: 10, h: 10 };

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
  },
];

export const relicDesign = id => `relique-${id}`;
export const relicById = id => RELICS.find(r => r.id === id);
