/* Ce qui se dit sur le noir : le prologue d'une partie neuve, et les fins
   (main.js, `playPrologue`, `playEnding`). À part pour que l'atelier puisse
   les réécrire (texts.js). */

export const PROLOGUE = [
  'Sur SNO 7, septième île de l\'Archipel des Neuf, il fait nuit depuis dix-neuf hivers.',
  'Un rêve t\'a rappelé sur l\'île où tu es né. Eyvind, ton frère de lait, est parti avant toi.',
  'Sur la grève, deux pistes s\'en vont dans la neige.',
];

// Les fins : ce qui se dit sur le noir quand on en vit une
export const ENDINGS = {
  aube: [
    'Le clou est sorti du mur. Sous la roche, un vieil homme a fermé les yeux.',
    'Sur SNO 7, pour la première fois depuis dix-neuf hivers, le ciel a pâli à l\'est.',
    'Le temps reprend. Ce qui devait vieillir vieillira. Ce qui devait mourir mourra.',
  ],
};

// Les indices : ce que Kári remarque à voix haute (game.js, `checkTalk`)
export const HINTS = {
  // Près du grand navire de pierres, tant qu'il n'y a pas posé la main
  passage: [
    'La pierre de proue luit, à peine. Comme une braise sous la neige.',
    'Ceux qu\'on a couchés dans ce navire n\'ont jamais fini leur voyage. Si je posais la main sur l\'étrave… (E)',
  ],
};
