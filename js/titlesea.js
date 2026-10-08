/* Le fond de l'écran d'accueil : la mer, de nuit, en pixels agrandis d'un
   facteur entier. La barque y vogue vers l'est, le viking debout dedans ; la
   houle la soulève et la fait rouler, un sillage d'écume la suit, des moutons
   défilent, des icebergs plats passent au loin, il neige. Rien ne tourne quand
   l'écran d'accueil est caché.
   Tout est tiré au sort à chaque ouverture (v1.53.3, `reroll`) : le nombre
   d'icebergs, leurs formes, leur éloignement et leur vitesse (chacun change de
   forme en repassant), la houle (nombre de crêtes, vitesse, ampleur), l'allure
   de la barque et son roulis, les moutons, le vent et la neige ; et pendant
   qu'on regarde, le temps tourne tout seul, d'une ambiance à l'autre. */
import { BOAT_FRAMES, BOAT_W, BOAT_WATERLINE } from './boat.js?v=1.70.2';
import { vikingFrames, CX, GROUND } from './viking.js?v=1.70.2';
import { makeIceberg } from './trees.js?v=1.70.2';
import { createSea } from './sea.js?v=1.70.2';
import { createWeather } from './weather.js?v=1.70.2';

function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// Un bruit lisse sur une ligne (pour casser les crêtes : rien de droit)
function noise1(x, s) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return hash(i, 0, s) + (hash(i + 1, 0, s) - hash(i, 0, s)) * u;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
}

// Les ambiances possibles, et leur poids (la tempête et l'orage ont des éclairs :
// le trait blanc est dessiné, sans l'éclat de l'écran)
const MOODS = [['calme', 1], ['bise', 3], ['rafales', 2], ['tempete', 2], ['tourbillons', 1]];
const pickMood = (r, not) => {
  const list = MOODS.filter(([m]) => m !== not), total = list.reduce((a, [, w]) => a + w, 0);
  let k = r() * total;
  for (const [m, w] of list) if ((k -= w) <= 0) return m;
  return 'bise';
};

export function createTitleSea(canvas, palette) {
  const ctx = canvas.getContext('2d');
  const viking = vikingFrames().find(f => f.name === 'side-idle').grid;
  let sea, weather, r, bergs, P, moodClock = 0;
  let W = 0, H = 0, S = 1, running = false, last = 0, t = 0;
  const wake = [];
  // Un iceberg : plus il est loin, plus il est haut sur l'écran, petit en
  // apparence et lent ; quelques-uns, rares, passent plus près
  function berg(x) {
    const near = r() < 0.18, depth = near ? 0.6 + r() * 0.4 : r() * 0.6;
    return { art: makeIceberg(r), x, depth, y: 0.035 + depth * 0.2, speed: (0.8 + depth * 6) * (0.6 + r() * 0.8) * P.drift };
  }
  // Un nouveau tirage de tout ce qui fait la scène
  function reroll() {
    r = rng((Math.random() * 4294967296) >>> 0);
    P = {
      swells: 10 + Math.floor(r() * 11),      // le nombre de crêtes
      swellSpeed: 0.05 + r() * 0.09,           // à quelle allure elles roulent vers nous
      swellAmp: 0.6 + r() * 0.9,               // leur ampleur
      boat: 5 + r() * 10,                      // l'allure de la barque (les moutons défilent)
      roll: 0.5 + r() * 0.8,                   // son roulis
      heave: 0.6 + r() * 1.2,                  // et la houle qui la soulève
      drift: 0.6 + r() * 1.1,                  // le courant qui emporte les icebergs
      wake: 8 + r() * 14,
    };
    sea = createSea(() => 1, { caps: 0.35 + r() * 0.8 });   // la mer seule : pas de rivage, des moutons
    weather = createWeather(pickMood(r));
    moodClock = 40 + r() * 60;
    const n = 2 + Math.floor(r() * 6);
    bergs = Array.from({ length: n }, (_, i) => berg((i + r()) * (W || 600) / n));
    wake.length = 0;
  }

  function fit() {
    const box = canvas.parentElement.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    // Un pixel du jeu = S pixels physiques, comme dans le jeu (~ 220 de haut)
    S = Math.max(2, Math.round(box.height * dpr / 220));
    W = Math.ceil(box.width * dpr / S); H = Math.ceil(box.height * dpr / S);
    canvas.width = W; canvas.height = H;
    canvas.style.width = `${W * S / dpr}px`; canvas.style.height = `${H * S / dpr}px`;
  }

  const put = (x, y, c, a = 1) => { ctx.globalAlpha = a; ctx.fillStyle = palette[c]; ctx.fillRect(x, y, 1, 1); };
  function rows(list, x0, y0, flip = false) {
    list.forEach((row, y) => {
      const cells = typeof row === 'string' ? [...row] : row;
      cells.forEach((c, x) => {
        if (!c || c === '.' || c === 'h') return;
        put(x0 + (flip ? cells.length - 1 - x : x), y0 + y, c);
      });
    });
  }

  function drawSwell(t) {
    const SWELLS = P.swells, sp = P.swellSpeed;
    const top = H * 0.05;
    for (let j = 0; j < SWELLS; j++) {
      const k = ((j + t * sp * SWELLS / 16) % SWELLS) / SWELLS;   // 0 au loin → 1 tout près
      const depth = k * k;
      const y0 = top + (H - top) * depth;
      const fade = Math.min(1, k * 6) * Math.min(1, (1 - k) * 8);
      const amp = (0.8 + 4.5 * depth) * P.swellAmp, len = 5 + 30 * depth, seed = j * 7 + Math.floor((j + t * sp * SWELLS / 16) / SWELLS) * 131;
      const alpha = (0.12 + 0.4 * depth) * fade;
      if (alpha < 0.03) continue;
      // La crête défile un peu (la barque avance), ondule, penche par endroits
      const shift = t * (2 + 9 * depth) * P.boat / 9;
      for (let x = 0; x < W; x++) {
        const u = (x + shift) / len;
        const seg = noise1(u * 0.7, seed);                    // par tronçons : la crête se forme et se défait
        if (seg < 0.4) continue;
        const y = Math.round(y0 + Math.sin(u * 1.7 + j + t * 0.6) * amp * 0.6
          + (noise1(u * 2.3, seed + 1) - 0.5) * amp * 1.6 + (noise1(u * 0.25, seed + 5) - 0.5) * amp * 3);
        if (hash(x, j, seed + 2) > 0.55 + 0.45 * depth) continue;
        const a = alpha * (0.6 + 0.8 * (seg - 0.4));
        put(x, y, 's', a);
        // Les vagues proches : le dos éclairé, tramé, au-dessus de la crête ;
        // un liseré d'écume là où elle se brise
        if (depth > 0.25) {
          const back = Math.round(1 + 3 * depth * seg);
          for (let k = 1; k <= back; k++) if ((x + k + j) % 2 === 0 && hash(x, k, seed + 3) < 0.7 - k * 0.12) put(x, y - k, 's', a * (0.5 - k * 0.08));
        }
        if (depth > 0.4 && seg > 0.7 && hash(x, j, seed + 4) < 0.5) put(x, y + 1, 's', a * 0.8);
      }
    }
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now; t += dt;
    ctx.globalAlpha = 1; ctx.fillStyle = palette.b; ctx.fillRect(0, 0, W, H);
    // Le temps tourne : de loin en loin, une autre ambiance
    moodClock -= dt;
    if (moodClock <= 0) { weather.setPreset(pickMood(r, weather.preset)); moodClock = 40 + r() * 60; }
    // Les icebergs glissent vers l'ouest, les plus loin d'abord (dessinés
    // dans l'ordre de la profondeur) ; sortis de l'écran, ils reviennent par
    // l'est sous une autre forme
    bergs.sort((a, b) => a.depth - b.depth);
    for (let i = 0; i < bergs.length; i++) {
      const b = bergs[i];
      b.x -= b.speed * dt;
      const w = b.art.rows[0].length;
      if (b.x < -w - 10) { bergs[i] = berg(W + 20 + r() * 160); continue; }
      rows(b.art.rows, Math.round(b.x), Math.round(H * b.y));
    }
    // La houle : des crêtes qui naissent au loin et roulent vers nous, de
    // plus en plus espacées, amples et claires (perspective) ; brisées par le
    // bruit, jamais une ligne droite
    drawSwell(t);
    // Les moutons : la mer défile (la barque avance vers l'est)
    const sx = t * P.boat;
    sea.draw({ x: sx, y: 0, w: W, h: H }, t, (x, y, a) => put(Math.round(x - sx), y, 's', a), 1.4);
    // La barque : la houle la soulève et la fait rouler
    const bx = Math.round(W * 0.5 - BOAT_W / 2), swell = (Math.sin(t * 1.1) * 1.4 + Math.sin(t * 0.43) * 0.8) * P.heave;
    const by = Math.round(H * 0.84 + swell);
    const roll = Math.sin(t * P.roll + 1);
    const hull = roll > 0.55 ? BOAT_FRAMES.right : roll < -0.55 ? BOAT_FRAMES.left : BOAT_FRAMES.still;
    // Le sillage : de l'écume qui naît à la poupe et s'efface en arrière
    if (Math.random() < dt * P.wake) wake.push({ x: bx + 3 + Math.random() * 3, y: by + BOAT_WATERLINE + Math.round((Math.random() - 0.5) * 3), age: 0 });
    for (let i = wake.length - 1; i >= 0; i--) {
      const w = wake[i]; w.age += dt; w.x -= P.boat * dt;
      if (w.age > 3) { wake.splice(i, 1); continue; }
      put(Math.round(w.x), w.y + Math.round(w.age * 0.6), 's', 0.8 * (1 - w.age / 3));
    }
    // À la proue, l'eau qui se fend
    if (Math.sin(t * 3) > 0.2) put(bx + BOAT_W - 3, by + BOAT_WATERLINE - 1, 's', 0.7);
    // Le viking, debout dans la barque (le plat-bord lui cache les jambes)
    rows(viking, bx + 17 - CX, by + 6 - GROUND);
    rows(hull, bx, by);
    // La neige
    weather.update(dt, { x: 0, y: 0, width: W, height: H });
    // (la foudre, s'il y en a : un trait blanc pur, comme dans le jeu)
    weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = palette[c] || '#ffffff'; ctx.fillRect(x, y, w, h); });
    // (et l'éclat de l'éclair, discret)
    if (weather.flash > 0.01) { ctx.globalAlpha = 0.25 * weather.flash; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => { if (running) fit(); });
  return {
    // (chaque ouverture : une autre mer)
    start() { if (running) return; fit(); reroll(); t = 0; running = true; last = performance.now(); requestAnimationFrame(frame); },
    stop() { running = false; },
    // (le labo : un autre tirage, sans attendre)
    reroll() { reroll(); t = 0; },
  };
}
