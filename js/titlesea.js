/* Le fond de l'écran d'accueil : la mer, de nuit, en pixels agrandis d'un
   facteur entier. La barque y vogue vers l'est, le viking debout dedans ; la
   houle la soulève et la fait rouler, un sillage d'écume la suit, des moutons
   défilent, des icebergs plats passent au loin, il neige. Rien ne tourne quand
   l'écran d'accueil est caché. */
import { BOAT_FRAMES, BOAT_W, BOAT_WATERLINE } from './boat.js?v=1.22.1';
import { vikingFrames, CX, GROUND } from './viking.js?v=1.22.1';
import { makeIceberg } from './trees.js?v=1.22.1';
import { createSea } from './sea.js?v=1.22.1';
import { createWeather } from './weather.js?v=1.22.1';

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
}

export function createTitleSea(canvas, palette) {
  const ctx = canvas.getContext('2d');
  const viking = vikingFrames().find(f => f.name === 'side-idle').grid;
  const sea = createSea(() => 1);                     // la mer seule : pas de rivage
  const weather = createWeather('bise');
  const r = rng(7);
  const bergs = Array.from({ length: 4 }, (_, i) => ({ art: makeIceberg(r), x: i * 130 + r() * 60, y: 0.06 + r() * 0.12, speed: 2 + r() * 2.5 }));
  let W = 0, H = 0, S = 1, running = false, last = 0, t = 0;
  const wake = [];

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

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now; t += dt;
    ctx.globalAlpha = 1; ctx.fillStyle = palette.b; ctx.fillRect(0, 0, W, H);
    // Les icebergs, loin, qui glissent lentement vers l'ouest
    for (const b of bergs) {
      b.x -= b.speed * dt;
      const w = b.art.rows[0].length;
      if (b.x < -w - 10) { b.x = W + 20 + Math.random() * 120; b.y = 0.06 + Math.random() * 0.12; }
      rows(b.art.rows, Math.round(b.x), Math.round(H * b.y));
    }
    // Les moutons : la mer défile (la barque avance vers l'est)
    const sx = t * 9;
    sea.draw({ x: sx, y: 0, w: W, h: H }, t, (x, y, a) => put(Math.round(x - sx), y, 's', a), 1.4);
    // La barque : la houle la soulève et la fait rouler
    const bx = Math.round(W * 0.5 - BOAT_W / 2), swell = Math.sin(t * 1.1) * 1.4 + Math.sin(t * 0.43) * 0.8;
    const by = Math.round(H * 0.84 + swell);
    const roll = Math.sin(t * 0.8 + 1);
    const hull = roll > 0.55 ? BOAT_FRAMES.right : roll < -0.55 ? BOAT_FRAMES.left : BOAT_FRAMES.still;
    // Le sillage : de l'écume qui naît à la poupe et s'efface en arrière
    if (Math.random() < dt * 14) wake.push({ x: bx + 3 + Math.random() * 3, y: by + BOAT_WATERLINE + Math.round((Math.random() - 0.5) * 3), age: 0 });
    for (let i = wake.length - 1; i >= 0; i--) {
      const w = wake[i]; w.age += dt; w.x -= 9 * dt;
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
    weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = palette[c]; ctx.fillRect(x, y, w, h); });
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => { if (running) fit(); });
  return {
    start() { if (running) return; fit(); running = true; last = performance.now(); requestAnimationFrame(frame); },
    stop() { running = false; },
  };
}
