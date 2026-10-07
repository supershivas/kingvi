/* Loup, de profil (tourné vers la droite), d'après le dessin fourni
   (assets/loups.png → ruins-art.js, WOLF_ART) : deux temps de marche, deux
   temps de course, et un temps rassemblé (pattes sous le ventre) ajouté
   pour le galop. On ne retouche pas le dessin : on le pose dans un cadre
   commun, la tête au même endroit d'une pose à l'autre (pas de saut d'image),
   les pattes sur la ligne du sol.
   Petit : un loup arrive à la hanche d'un homme (6 à 7 pixels, le viking en
   fait 9).
   Chaque image fait WOLF_W × WOLF_H ; les pattes touchent la ligne WOLF_GROUND. */
import { WOLF_ART } from './ruins-art.js?v=1.60.0';
import { designGrid } from './design-store.js?v=1.60.0';

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
// Le galop a besoin d'un temps où les pattes se rassemblent sous le ventre,
// le loup en l'air (le dessin n'a que les deux temps étendus) : le corps de
// la première course, les pattes repliées au milieu
const GATHER = [...A.course0.slice(0, 4), '..bbbb.bbb....', '....bb.bb.....'];
// Les poses, une image chacune (les animations les assemblent). À terre : le
// corps sans les pattes, couché sur le sol ; le bond : la course, lancée un
// pixel au-dessus du sol
export const WOLF_POSES_RAW = {
  'marche-0': place(A.marche0), 'marche-1': place(A.marche1),
  'course-0': place(A.course0), 'course-1': place(A.course1), 'course-rassemble': place(GATHER, 1),
  'bond-0': place(A.course0, 1), 'bond-1': place(GATHER, 2), 'bond-2': place(A.course1, 1),
  'mort': place(A.marche0.slice(0, -2)),
};
export const WOLF_LABELS = {
  'marche-0': 'Marche, pas 1', 'marche-1': 'Marche, pas 2', 'course-0': 'Course, pattes étendues 1', 'course-1': 'Course, pattes étendues 2',
  'course-rassemble': 'Course, pattes rassemblées', 'bond-0': 'Bond, départ', 'bond-1': 'Bond, en l\'air', 'bond-2': 'Bond, réception', 'mort': 'À terre',
};

// Les poses du moment (celles qu'on a redessinées à la main remplacent celles du code)
function poses() {
  return Object.fromEntries(Object.entries(WOLF_POSES_RAW).map(([k, g]) => [k, designGrid(`loup-${k}`, g)]));
}
function anims(P) {
  const walk = [P['marche-0'], P['marche-1']];
  const run = [P['course-0'], P['course-rassemble'], P['course-1'], P['course-rassemble']];
  return {
    trot: { label: 'Trot', fps: 7, frames: walk },
    galop: { label: 'Galop', fps: 13, frames: run },
    marche: { label: 'Marche', fps: 4, frames: walk },
    arret: { label: 'À l\'arrêt', fps: 1, frames: [walk[0]] },
    flaire: { label: 'Flaire le sol', fps: 2, frames: walk },
    hurle: { label: 'Hurle', fps: 1, frames: [walk[1]] },
    grogne: { label: 'Grogne (il va bondir)', fps: 6, frames: [walk[0], walk[1]] },
    bond: { label: 'Bondit', fps: 8, frames: [P['bond-0'], P['bond-1'], P['bond-2']] },
    mort: { label: 'À terre', fps: 1, frames: [P['mort']] },
    assis: { label: 'Assis', fps: 1, frames: [walk[0]] },
  };
}
export const WOLF_ANIMS = anims(poses());
// Les animations avec les poses du moment (le jeu ouvert se repeint quand on
// retouche une pose dans l'éditeur du labo)
export const wolfAnims = () => anims(poses());
