/* Loup, de profil (tourné vers la droite), d'après le dessin fourni
   (assets/loups.png → ruins-art.js, WOLF_ART) : deux temps de marche, deux
   temps de course, et un temps rassemblé (pattes sous le ventre) ajouté
   pour le galop. On ne retouche pas le dessin : on le pose dans un cadre
   commun, la tête au même endroit d'une pose à l'autre (pas de saut d'image),
   les pattes sur la ligne du sol.
   Petit : un loup arrive à la hanche d'un homme (6 à 7 pixels, le viking en
   fait 9).
   Chaque image fait WOLF_W × WOLF_H ; les pattes touchent la ligne WOLF_GROUND. */
import { WOLF_ART } from './ruins-art.js?v=1.32.0';

export const WOLF_W = 16;
export const WOLF_H = 8;
export const WOLF_GROUND = 7;

// Une pose du dessin dans le cadre : le bord avant (la tête) à droite, à un
// pixel du bord ; `rows` du bas posé sur le sol (ou `lift` pixels plus haut)
function place(rows, lift = 0) {
  const g = Array.from({ length: WOLF_H }, () => Array(WOLF_W).fill(null));
  const w = Math.max(...rows.map(r => r.length)), x0 = WOLF_W - 1 - w, y0 = WOLF_GROUND - lift - rows.length + 1;
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== '.' && y0 + y >= 0 && x0 + x >= 0) g[y0 + y][x0 + x] = 'b';
  }));
  return g;
}

const A = WOLF_ART;
const walk = [place(A.marche0), place(A.marche1)];
// Le galop a besoin d'un temps où les pattes se rassemblent sous le ventre,
// le loup en l'air (le dessin n'a que les deux temps étendus) : le corps de
// la première course, les pattes repliées au milieu
const GATHER = [...A.course0.slice(0, 4), '..bbbb.bbb....', '....bb.bb.....'];
const gather = place(GATHER, 1);
const run = [place(A.course0), gather, place(A.course1), gather];
// À terre : le corps sans les pattes, couché sur le sol
const lying = place(A.marche0.slice(0, -2));

export const WOLF_ANIMS = {
  trot: { label: 'Trot', fps: 7, frames: walk },
  galop: { label: 'Galop', fps: 13, frames: run },
  marche: { label: 'Marche', fps: 4, frames: walk },
  arret: { label: 'À l\'arrêt', fps: 1, frames: [walk[0]] },
  flaire: { label: 'Flaire le sol', fps: 2, frames: walk },
  hurle: { label: 'Hurle', fps: 1, frames: [walk[1]] },
  grogne: { label: 'Grogne (il va bondir)', fps: 6, frames: [walk[0], walk[1]] },
  // Le bond : la course, lancée un pixel au-dessus du sol
  bond: { label: 'Bondit', fps: 8, frames: [place(A.course0, 1), place(GATHER, 2), place(A.course1, 1)] },
  mort: { label: 'À terre', fps: 1, frames: [lying] },
  assis: { label: 'Assis', fps: 1, frames: [walk[0]] },
};
