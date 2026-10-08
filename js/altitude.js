/* L'ascension du mont King (v1.69.0) : l'altitude, les étages, la température.
   Le monde monte vers le nord-est ; l'altitude est la distance parcourue le
   long de cet axe (`progress`, en pixels du jeu depuis la grève), remise en
   mètres par des repères (`ANCHORS`), pour que chaque lieu existant tombe dans
   le bon étage. Ce module n'importe rien : le monde (`world.js`) lui donne la
   progression, déformée par du bruit pour que les limites ne soient jamais
   droites. */

// Les étages : de l'altitude `from` à `to` (m), la température qu'on y sent
// (°C, d'en bas à en haut ; la nuit, un peu plus bas), ce qui y tombe et ce qui y pousse.
export const ETAGES = [
  { id: 'greve',    nom: 'La grève',               from: 0,    to: 100,  temp: [6, 3],     meteo: ['bruine', 'pluie'] },
  { id: 'landes',   nom: 'Les landes',             from: 100,  to: 500,  temp: [3, -1],    meteo: ['pluie', 'averse', 'orage-pluie', 'gresil'] },
  { id: 'bois',     nom: 'Le bois clair',          from: 500,  to: 700,  temp: [-1, -3],   meteo: ['averse', 'gresil', 'bise', 'calme'] },
  { id: 'noire',    nom: 'La forêt noire',         from: 700,  to: 1300, temp: [-3, -7],   meteo: ['calme', 'bise', 'brouillard'] },
  { id: 'haut',     nom: 'Le haut-pays',           from: 1300, to: 1900, temp: [-8, -12],  meteo: ['grele', 'bise', 'rafales'] },
  { id: 'plateau',  nom: 'La falaise et le plateau', from: 1900, to: 2500, temp: [-13, -17], meteo: ['orage', 'tempete', 'rafales'] },
  { id: 'eboulis',  nom: 'Les éboulis',            from: 2500, to: 3100, temp: [-18, -21], meteo: ['brouillard', 'bise', 'calme'] },
  { id: 'glacier',  nom: 'Le glacier',             from: 3100, to: 3700, temp: [-22, -27], meteo: ['tempete', 'orage', 'tourbillons'] },
  { id: 'arete',    nom: 'L\'arête',               from: 3700, to: 4200, temp: [-28, -33], meteo: ['rafales', 'calme', 'tourbillons'] },
  { id: 'sommet',   nom: 'Le sommet du mont King', from: 4200, to: 4300, temp: [-35, -35], meteo: ['calme'] },
];
export const SUMMIT = 4300;

// Repères [progression en pixels, altitude en mètres] : la lanterne, le ravin,
// la forêt noire, la maison, le pied de la falaise, l'arche du plateau, puis
// ce qui reste à construire jusqu'au sommet.
const ANCHORS = [
  [0, 0], [180, 100], [450, 500], [600, 700], [1900, 1300], [4300, 1900], [5000, 2500],
  [5700, 3100], [6400, 3700], [7000, 4200], [7250, SUMMIT],
];

export function altitudeOf(progress) {
  const A = ANCHORS;
  if (progress <= 0) return 0;
  for (let i = 1; i < A.length; i++) {
    if (progress <= A[i][0]) { const [p0, a0] = A[i - 1], [p1, a1] = A[i]; return a0 + (a1 - a0) * (progress - p0) / (p1 - p0); }
  }
  return SUMMIT;
}

// La progression : `dx` vers l'est depuis la grève, `north` vers le nord. L'axe
// monte de 20° vers le nord (le nord-est du jeu).
const AX = Math.cos(0.35), AY = Math.sin(0.35);
export const progressOf = (dx, north) => dx * AX + north * AY;

export const etageIndex = alt => {
  for (let i = ETAGES.length - 1; i >= 0; i--) if (alt >= ETAGES[i].from) return i;
  return 0;
};
export const etageAt = alt => ETAGES[etageIndex(alt)];

// La température à une altitude : elle glisse dans l'étage, d'un bout à l'autre
export function temperatureAt(alt, { night = true } = {}) {
  const e = etageAt(alt), k = e.to > e.from ? Math.max(0, Math.min(1, (alt - e.from) / (e.to - e.from))) : 0;
  return e.temp[0] + (e.temp[1] - e.temp[0]) * k - (night ? 0 : -3);
}

// Ce qui tombe : pluie au-dessus de +1 °C, grésil de +1 à −1, neige au-dessous
export const precipAt = temp => (temp > 1 ? 'pluie' : temp > -1 ? 'gresil' : 'neige');

// La neige au sol : rien en bas, des plaques vers 350 m, tout dès 750 m (0 → 1)
export function snowCover(alt) {
  const t = Math.max(0, Math.min(1, (alt - 350) / 400));
  return t * t * (3 - 2 * t);
}

// Le temps d'une altitude : une ambiance de l'étage dont l'eau est de la bonne
// phase (pluie, grésil, neige) ; `turn` (un entier qui avance de lui-même)
// fait changer d'ambiance de temps en temps. `presets` : WEATHER_PRESETS.
export function skyAt(alt, turn, presets, { night = true } = {}) {
  const phase = precipAt(temperatureAt(alt, { night }));
  const class_ = n => { const p = presets[n]?.precip; return p === 'pluie' ? 'pluie' : p === 'gresil' ? 'gresil' : 'neige'; };
  const list = etageAt(alt).meteo.filter(n => class_(n) === phase);
  return list.length ? list[Math.abs(turn) % list.length] : phase === 'pluie' ? 'pluie' : phase === 'gresil' ? 'gresil' : 'bise';
}
