/* Le jour et la nuit : aube, jour, crépuscule, nuit, en 20 minutes.
   Comme le vent, le cycle suit l'horloge réelle : il continue d'une session à
   l'autre. `night` va de 0 (plein jour) à 1 (nuit noire) ; `dusk` monte à
   l'aube et au crépuscule (lueur rasante). */

export const DAY_CYCLE = [
  ['aube', 90],
  ['jour', 660],
  ['crepuscule', 90],
  ['nuit', 360],
];
export const DAY_LABELS = { aube: 'Aube', jour: 'Jour', crepuscule: 'Crépuscule', nuit: 'Nuit' };
export const DAY_LENGTH = DAY_CYCLE.reduce((n, [, d]) => n + d, 0);

const smooth = k => k * k * (3 - 2 * k);

export function daylightAt(seconds) {
  let t = ((seconds % DAY_LENGTH) + DAY_LENGTH) % DAY_LENGTH;
  let i = 0;
  while (t >= DAY_CYCLE[i][1]) { t -= DAY_CYCLE[i][1]; i++; }
  const [phase, duration] = DAY_CYCLE[i];
  const k = t / duration;
  const night = phase === 'aube' ? 1 - smooth(k) : phase === 'crepuscule' ? smooth(k) : phase === 'nuit' ? 1 : 0;
  const dusk = phase === 'aube' || phase === 'crepuscule' ? Math.sin(Math.PI * k) : 0;
  return { phase, night, dusk, index: i, t };
}
