/* Les reliques de l'île : ce qu'on ramasse en chemin et qui va dans
   l'inventaire (touche I). Chacune a son dessin, à redessiner dans l'atelier
   du atelier (atelier.html) : ceux d'ici ne sont que des placeholders, de la
   taille qu'il faut garder. Deux dessins par relique : celui de l'inventaire
   (`rows`, RELIC_SIZE, dossier « Reliques ») et celui qu'on voit à terre sur
   l'île (`ground`, RELIC_GROUND_SIZE, dossier « Reliques sur l'île »).

   Où on les trouve (game.js : `dropRelic`, `updateRelics`) :
   - la poupée : on frappe l'arbre sacré, une offrande tombe ;
   - le rubis : on frappe le roi mort, dans la grotte, il tombe de sa poitrine ;
   - le médaillon : oublié sur la table de la maison ;
   - le sceau : dans le coffre de la crypte ;
   - l'anneau : il tombe de la main de l'autre viking quand il meurt ;
   - la dent : elle tombe du premier loup abattu ;
   - la boucle : dans les cendres de la maison, quand le toit s'effondre ;
   - la griffe : le mons l'arrache pour toi quand tu lui rends son œil (le rubis).

   Ce qu'on a trouvé pend à la ceinture du viking (invisible en jeu) : dans
   l'inventaire, on les y déplace d'un crochet à l'autre (`belt` dans la
   sauvegarde : un id ou null par crochet, BELT_SLOTS crochets). */

export const RELIC_SIZE = { w: 10, h: 10 };            // le dessin de l'inventaire
export const RELIC_GROUND_SIZE = { w: 4, h: 4 };       // la relique vue sur l'île : de 1 à 4 pixels (le viking en fait 9)
// La ceinture : ses crochets, et son dessin (placeholder à redessiner, `ceinture`
// dans l'atelier : la boucle à gauche, puis 12 pixels par crochet)
export const BELT_SLOTS = 10;
export const BELT_LEFT = 8;            // la boucle occupe les 8 premiers pixels
export const BELT = (() => {
  const W = BELT_LEFT + BELT_SLOTS * 12, rows = Array.from({ length: 10 }, () => Array(W).fill('.'));
  const put = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < 10) rows[y][x] = c; };
  // La sangle : trois rangées sombres, une couture claire en pointillé
  for (let x = 4; x < W; x++) { put(x, 2, 'b'); put(x, 3, x % 3 ? 'b' : 's'); put(x, 4, 'b'); }
  // La boucle, à gauche
  for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
    const edge = y === 0 || y === 6 || x === 0 || x === 6;
    if ((y === 0 || y === 6) && (x === 0 || x === 6)) continue;
    put(x, y, edge ? 'b' : x === 1 || x === 5 || y === 1 || y === 5 ? 's' : x === 3 ? 'b' : '.');
  }
  // Un crochet sous chaque place (au milieu de ses 12 pixels)
  for (let k = 0; k < BELT_SLOTS; k++) {
    const x = BELT_LEFT + k * 12 + 6;
    put(x, 5, 'b'); put(x - 1, 6, 'b'); put(x + 1, 6, 'b'); put(x, 6, 's'); put(x - 1, 7, 'b'); put(x + 1, 7, 'b'); put(x, 8, 'b');
  }
  return rows.map(r => r.join(''));
})();

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

  {
    id: 'boucle', name: 'La boucle du compagnon', about: 'Dans les cendres de la maison, ce qui restait de lui.',
    rows: [
      '..........',
      '.bbbbbbbb.',
      '.bssssssb.',
      '.bs.bb.sb.',
      '.bs.bsbsbb',
      '.bs.bb.sb.',
      '.bssssssb.',
      '.bbbbbbbb.',
      '..........',
      '..........',
    ],
    ground: [
      'bbbb',
      'b.sb',
      'bbbb',
      '....',
    ],
  },
  {
    id: 'griffe', name: 'La griffe du mons', about: 'Il l\'a arrachée pour toi, en échange de son œil. Elle est chaude, et bat comme un cœur.',
    rows: [
      '..........',
      '......bb..',
      '.....bssb.',
      '....bssb..',
      '...bssb...',
      '..bssb....',
      '..bsb.....',
      '.bsrb.....',
      '.bbb......',
      '..........',
    ],
    ground: ['..b.', '.bs.', 'bsb.', 'bb..'],
  },
];

export const relicDesign = id => `relique-${id}`;
export const relicGround = id => `relique-${id}-sol`;
export const relicById = id => RELICS.find(r => r.id === id);
