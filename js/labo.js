/* Labo : toutes les animations, chacune sur fond blanc et sur fond noir (négatif).
   Rendu en canvas 2D, avec les mêmes modules que le jeu (sprites, météo, arbres). */
import { startUpdateCheck } from '../app-update.js?v=1.58.0';
import {
  vikingFrames, capeGrid, smearPixels, whirlArc, blastRing, IMPACT, CX, GROUND, CAPE_LEVELS, CAPE_PHASES,
} from './viking.js?v=1.58.0';
import { createWeather, WEATHER_PRESETS, WEATHER_CYCLE, CYCLE_ABOUT } from './weather.js?v=1.58.0';
import { makeTree, makeFir, makeDeadTree, makeBoulder, makeCairn, boulderHits, chipBoulder } from './trees.js?v=1.58.0';
import {
  HOUSE_ART, HOUSE_H, rng, WORLD, WORLD_VERSION, coast, trail, landing, forestDensity, deepForest,
  HOUSE, STATUE_BASE, STATUE2_BASE, CROWS,
} from './world.js?v=1.58.0';
import { WOLF_ANIMS, WOLF_W, WOLF_GROUND } from './wolf.js?v=1.58.0';
import { STAG_ANIMS, DOE_ANIMS, DEER_W, DEER_GROUND } from './deer.js?v=1.58.0';
import { buildStatue, buildStatueUpright } from './statue.js?v=1.58.0';
import { BOAT_FRAMES, BOAT_W, BOAT_H, BOAT_WATERLINE, BOAT_EDGE } from './boat.js?v=1.58.0';
import { ROOM, ROOM_ENTRY, CORPSE } from './interior.js?v=1.58.0';
import { makeIceberg, LEANS, LEAN_PAD, leanRows, treeWind, treeLean, treeFreq } from './trees.js?v=1.58.0';
import { daylightAt, DAY_CYCLE, DAY_LABELS, DAY_LENGTH, torchLight, castShadow, castShadowBase, artBase } from './daylight.js?v=1.58.0';
import { createSea } from './sea.js?v=1.58.0';
import { createTitleSea } from './titlesea.js?v=1.58.0';
import { buildStatueDoor } from './statue.js?v=1.58.0';
import { CRYPT, CHEST, CHEST_FRAMES, CRYPT_ENTRY } from './crypt.js?v=1.58.0';
import { ROWBOAT_FRAMES, BOAT2 } from './boat.js?v=1.58.0';
import { CLIFF_PARTS, CAVE, CLIFF, LAKE, ARCH, RUINS, LEDGE, ledgeAt, cliffFoot, cliffHeight, FALLING_STONE, MOTH_LAIR, snowDepth, NECRO as NECRO_AREA, GROVE_TREE, WATCHER_AT, WOLF_DEN, HVIT_AT, TEMPLE_DOOR_OUT, SIGRUN_AT, SNO7_CUBES } from './world.js?v=1.58.0';
import { FIRE, FIRE_FRAMES, burnHouse } from './fire.js?v=1.58.0';
import { designRows, designsReady, loadDesigns } from './design-store.js?v=1.58.0';
// (les dessins publiés et retouchés : le labo les montre ; on les modifie dans l'atelier)
loadDesigns();
import * as PROPS from './props.js?v=1.58.0';
import { paintSno4, SNO4_W, SNO4_H, SNO4_PROPS, SNO4_BOAT, VEVE, sno4Walkable } from './sno4.js?v=1.58.0';
import { PLACES_SNO4 } from './saga-sno4.js?v=1.58.0';
import { audio, TRACKS } from './audio.js?v=1.58.0';
import { DESCRIPTIONS } from './describe.js?v=1.58.0';
import { monumentParts, makeOutlinedRock } from './ruins.js?v=1.58.0';
import { RUIN_ART } from './ruins-art.js?v=1.58.0';
import { CHAPTERS, CHAPTER_STYLES, CHAPTER_STYLE, showChapter } from './chapters.js?v=1.58.0';
import { makeGroveTree, BUNDLE, WATCHER } from './grove.js?v=1.58.0';
import { TEMPLE, NAIL, NAIL_ART, TEMPLE_ENTRY, TEMPLE_SLAB, TEMPLE_STAIRS } from './temple.js?v=1.58.0';
import { ICE_FRAMES } from './sigrun.js?v=1.58.0';
import { ARCHIPEL, paintIsland, islandLand } from './islands.js?v=1.58.0';
import { CUBE_WHITE, CUBE_BLACK } from './cubes.js?v=1.58.0';
import { CAVE_ROOM, CAVE_W, CAVE_H, CAVE_ENTRY, THRONE, THRONE_FRAMES, THRONE_FOOT } from './cave.js?v=1.58.0';

const css = getComputedStyle(document.documentElement);
const SNOW = css.getPropertyValue('--game-snow').trim();
const NIGHT = css.getPropertyValue('--game-night').trim();
const RED = css.getPropertyValue('--accent').trim();
const BLACK = css.getPropertyValue('--game-black').trim();
// Une seule vue par animation : sur la neige, aux couleurs du jeu
const PALETTES = {
  blanc: { label: '', bg: SNOW, b: NIGHT, s: SNOW, r: RED, k: BLACK, w: '#ffffff' },
};

const FRAMES = Object.fromEntries(vikingFrames().map(f => [f.name, f]));

// ── Dessin ──
function drawRows(ctx, pal, rows, x0, y0, flip = false) {
  const w = rows[0].length;
  rows.forEach((row, y) => {
    for (let x = 0; x < w; x++) {
      const c = row[x];
      if (!c || c === '.') continue;
      ctx.globalAlpha = c === 'h' ? 0.3 : 1;
      ctx.fillStyle = pal[c === 'h' ? 'b' : c];
      ctx.fillRect(x0 + (flip ? w - 1 - x : x), y0 + y, 1, 1);
    }
  });
  ctx.globalAlpha = 1;
}

// Grille (tableaux de cellules) → lignes de caractères
const gridRows = g => g.map(r => r.map(c => c || '.').join(''));

// Viking + cape. (fx, fy) : colonne du milieu du corps, ligne des pieds.
function drawViking(ctx, pal, frameName, fx, fy, { flip = false, wind = 0.55, clock = 0 } = {}) {
  const f = FRAMES[frameName];
  const level = wind < 0.22 ? 0 : wind < 0.6 ? 1 : 2;
  const cape = gridRows(capeGrid(CAPE_LEVELS[level], Math.floor(clock * (3 + wind * 14)) % CAPE_PHASES));
  const col = flip ? 2 * CX - f.cape.west - 1 : f.cape.east - 1;
  drawRows(ctx, pal, cape, fx + col - CX, fy + f.cape.y - GROUND);
  const rows = gridRows(f.grid);
  // Retourné : la colonne c passe en 2·CX − c
  const x0 = flip ? fx + CX - (rows[0].length - 1) : fx - CX;
  drawRows(ctx, pal, rows, x0, fy - GROUND, flip);
}

// ── Cartes ──
const demos = [];

function card(section, { title, tag, about, w, h, wide = false, setup, draw, button }) {
  const el = document.createElement('article');
  el.className = 'demo' + (wide ? ' wide' : '');
  el.innerHTML = `<h3>${tag ? `<span class="tag">${tag}</span>` : ''}<span></span></h3>${about ? '<p></p>' : ''}<div class="pair"></div>`;
  el.querySelector('h3 span:last-child').textContent = title;
  if (about) el.querySelector('p').textContent = about;
  const pair = el.querySelector('.pair');
  const views = Object.entries(PALETTES).map(([key, pal]) => {
    const fig = document.createElement('figure');
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const cap = document.createElement('figcaption');
    cap.textContent = pal.label;
    fig.append(canvas, cap);
    pair.append(fig);
    const view = { key, pal, ctx: canvas.getContext('2d'), w, h, state: {} };
    setup?.(view.state, view);
    return view;
  });
  if (button) {
    const b = document.createElement('button');
    b.className = 'btn-ghost'; b.type = 'button';
    b.innerHTML = `<i class="ti ti-refresh" aria-hidden="true"></i> ${button}`;
    b.addEventListener('click', () => views.forEach(v => { v.state = {}; setup?.(v.state, v); }));
    el.append(b);
  }
  document.querySelector(`#${section} .demos`).append(el);
  const demo = { el, views, draw, visible: true };
  new IntersectionObserver(([e]) => { demo.visible = e.isIntersecting; }).observe(el);
  demos.push(demo);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;
  for (const d of demos) {
    if (!d.visible) continue;
    for (const v of d.views) {
      v.ctx.fillStyle = v.pal.bg;
      v.ctx.fillRect(0, 0, v.w, v.h);
      d.draw(v.ctx, v.pal, t, dt, v.state, v);
    }
  }
  requestAnimationFrame(loop);
}

// ══ Viking ══
const walkFrame = (view, t) => `${view}-walk-${Math.floor(t * 7) % 4}`;

card('viking', {
  title: 'Marche — profil, face, dos', about: 'Cycle en 4 temps : appui, passage (le corps monte d\'un pixel), appui, passage.',
  w: 64, h: 18,
  draw(ctx, pal, t) {
    drawViking(ctx, pal, walkFrame('side', t), 8, 14, { clock: t });
    drawViking(ctx, pal, walkFrame('side', t), 26, 14, { clock: t, flip: true });
    drawViking(ctx, pal, walkFrame('front', t), 40, 14, { clock: t });
    drawViking(ctx, pal, walkFrame('back', t), 55, 14, { clock: t });
  },
});

card('viking', {
  title: 'Marche dans la neige', about: 'Il avance et laisse ses traces, que la neige recouvre peu à peu.',
  w: 100, h: 24,
  setup(s) { s.x = 10; s.prints = []; s.step = -1; },
  draw(ctx, pal, t, dt, s) {
    s.x += 18 * dt;
    if (s.x > 110) { s.x = -10; s.prints = []; }
    const i = Math.floor(t * 7) % 4;
    if ((i === 0 || i === 2) && s.step !== i) s.prints.push({ x: Math.round(s.x), y: 18 + (i ? 0 : -1), t });
    s.step = i;
    for (const p of s.prints) {
      ctx.globalAlpha = Math.max(0, 0.9 - (t - p.t) / 12);
      ctx.fillStyle = pal.b; ctx.fillRect(p.x, p.y, 2, 1);
    }
    ctx.globalAlpha = 1;
    drawViking(ctx, pal, `side-walk-${i}`, Math.round(s.x), 19, { clock: t });
  },
});

// La neige profonde (game.js : `updateSnow`, `placePlayer`) : tassée, aux
// mollets, jusqu'à la taille ; il s'enfonce de 0, 1 ou 3 pixels, une
// collerette bosselée de neige le cerne, et à la taille un sillon aux lèvres
// irrégulières remplace les pas
const snowNoise = (x, y, s) => {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
card('viking', {
  title: 'Marche dans la neige profonde', tag: 'neige',
  about: 'Trois neiges : tassée (des pas) ; aux mollets (les mêmes pas, avec une ou deux mottes de neige soulevée autour ; il s\'enfonce d\'un pixel, 90 % de sa vitesse) ; jusqu\'à la taille (il s\'enfonce de trois pixels, la neige ronge le bas du corps d\'un pixel irrégulier, 80 % de sa vitesse, et il laisse un sillon : deux lèvres serrées contre le corps, celle de devant en morceaux).',
  w: 120, h: 60, wide: true,
  setup(s) { s.x = 0; s.marks = [[], [], []]; s.step = -1; s.last = [null, null, null]; },
  draw(ctx, pal, t, dt, s) {
    const SPEEDS = [1, 0.9, 0.8], SINK = [0, 1, 3];
    s.x += 18 * dt;
    if (s.x > 130) { s.x = -10; s.marks = [[], [], []]; s.last = [null, null, null]; }
    const i = Math.floor(t * 7) % 4;
    for (let lane = 0; lane < 3; lane++) {
      const ground = 16 + lane * 18, x = Math.round(s.x * SPEEDS[lane]), sink = SINK[lane];
      // Tassée et aux mollets : le même pas ; aux mollets, une ou deux mottes pâles autour
      if (lane < 2 && (i === 0 || i === 2) && s.step !== i) {
        const side = i ? 1 : -1, py = ground - 1 + (side > 0 ? 0 : -1);
        s.marks[lane].push({ x, y: py, w: 2, h: 1, t, a: 0.9 });
        if (lane === 1) for (let k = 0; k < 2; k++) {
          if (snowNoise(x, py, 13 + k) < 0.35) continue;
          s.marks[1].push({ x: x + Math.round(snowNoise(x, py, 17 + k) * 4 - 2), y: py + Math.round(snowNoise(x, py, 19 + k) * 2 - 1) + side, w: 1, h: 1, t, a: 0.4 });
        }
      }
      // Jusqu'à la taille : le sillon, deux lèvres serrées contre le corps
      if (lane === 2 && s.last[2] !== x) {
        s.last[2] = x;
        for (const k of [-1, 1]) {
          const n = snowNoise(x, ground, k > 0 ? 3 : 5);
          if (n < (k > 0 ? 0.5 : 0.18)) continue;
          const off = 1 + (snowNoise(x >> 1, ground >> 1, k > 0 ? 9 : 11) > 0.65 ? 1 : 0);
          const my = k < 0 ? ground - 1 - off : ground + off - 1;
          s.marks[2].push({ x, y: my, w: 1, h: 1, t, a: 0.9 });
          if (n > 0.92) s.marks[2].push({ x: x + 1, y: my + k, w: 1, h: 1, t, a: 0.45 });
        }
      }
      ctx.fillStyle = pal.b;
      for (const m of s.marks[lane]) { ctx.globalAlpha = Math.max(0, m.a - (t - m.t) / 14); ctx.fillRect(m.x, m.y, m.w, m.h); }
      ctx.globalAlpha = 1;
      drawViking(ctx, pal, `side-walk-${i}`, x, ground + sink, { clock: t });
      if (sink) {
        // ce qui passe sous la neige (rogné, comme dans le jeu), puis la
        // collerette : un pixel au plus, sur la ligne de la neige
        // (l'ombre au sol du dessin passe aussi sous la neige)
        ctx.fillStyle = pal.bg; ctx.fillRect(x - 8, ground + 1, 17, sink + 2);
        for (const m of s.marks[lane]) if (m.y > ground && m.y <= ground + sink + 2 && Math.abs(m.x - x) <= 8) { ctx.globalAlpha = Math.max(0, m.a - (t - m.t) / 14); ctx.fillStyle = pal.b; ctx.fillRect(m.x, m.y, m.w, m.h); }
        ctx.globalAlpha = 1;
        ctx.fillStyle = pal.s || pal.bg;
        for (let dx = -3; dx <= 3; dx++) if (snowNoise(x + dx, Math.round(ground / 3), 7) > (Math.abs(dx) === 3 ? 0.7 : 0.4)) ctx.fillRect(x + dx, ground, 1, 1);
      }
    }
    s.step = i;
  },
});

// ══ Cape ══
CAPE_LEVELS.forEach((level, k) => {
  const names = ['Au calme : elle pend', 'Vent moyen : elle se soulève', 'Vent fort : elle claque à l\'horizontale'];
  card('cape', {
    title: names[k], w: 44, h: 20,
    draw(ctx, pal, t) {
      drawViking(ctx, pal, 'side-idle', 10, 16, { wind: level, clock: t });
      drawViking(ctx, pal, 'side-idle', 30, 16, { wind: level, clock: t + 0.3, flip: true });
    },
  });
});
card('cape', {
  title: 'Rafales', about: 'La cape suit la force du vent : on voit arriver chaque rafale.',
  w: 44, h: 20,
  setup(s) { s.weather = createWeather('rafales'); },
  draw(ctx, pal, t, dt, s, v) {
    s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
    const wind = Math.min(1, s.weather.wind / 140);
    drawViking(ctx, pal, walkFrame('front', t), 18, 16, { wind, clock: t });
    s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
    ctx.globalAlpha = 1;
  },
});

// La torche : la nuit, un halo tramé autour de la flamme, des ombres portées
card('nuit', {
  title: 'La torche', about: 'Quand la nuit tombe, il sort une torche : le voile de nuit s\'ouvre en paliers tramés autour de la flamme (qui vacille), et arbres, rochers, le viking lui-même portent une ombre à l\'opposé, tramée par les mêmes paliers que le halo.',
  wide: true, w: 220, h: 110,
  setup(s, v) {
    s.light = torchLight(1);
    s.veil = document.createElement('canvas'); s.veil.width = v.w; s.veil.height = v.h;
    const r = rng(33);
    s.trees = [[40, 50], [70, 92], [120, 40], [160, 88], [190, 55], [100, 70]].map(([x, y]) => {
      const art = makeTree(r, { big: true });
      return { x, y, art, img: prerender(art.rows, v.pal), tree: true };
    });
    // Et deux rochers, à l'ombre courte
    for (const [x, y] of [[140, 64], [58, 80]]) { const art = makeBoulder(r); s.trees.push({ x, y, art, img: prerender(art.rows, v.pal) }); }
  },
  draw(ctx, pal, t, dt, s, v) {
    const k = (t % 16) / 8, u = k < 1 ? k : 2 - k, flip = k >= 1;
    const hx = Math.round(20 + u * 180), hy = 76, tx = hx + (flip ? -3 : 3), ty = hy - 8;
    const all = [...s.trees, { hero: true, y: hy }].sort((a, b) => a.y - b.y);
    for (const o of all) {
      if (o.hero) drawViking(ctx, pal, walkFrame('side', t), hx, hy, { clock: t, wind: 0.2, flip });
      else ctx.drawImage(o.img, o.x - o.art.ax, o.y - o.img.height + 1);
    }
    // La flamme
    ctx.fillStyle = pal.b; ctx.fillRect(tx, ty + 1, 1, 3);
    ctx.fillStyle = pal.r; ctx.fillRect(tx - (Math.floor(t * 12) % 2), ty - 1, 2, 1); ctx.fillRect(tx, ty - 2 - (Math.floor(t * 12) % 2), 1, 1);
    ctx.fillStyle = pal.s; ctx.fillRect(tx, ty, 1, 1);
    // Le voile de nuit, percé par la lumière, multiplié sur la scène
    const vc = s.veil.getContext('2d');
    vc.globalCompositeOperation = 'source-over';
    vc.clearRect(0, 0, v.w, v.h);
    vc.globalAlpha = 0.62; vc.fillStyle = pal.b; vc.fillRect(0, 0, v.w, v.h);
    vc.globalAlpha = 1; vc.globalCompositeOperation = 'destination-out';
    vc.drawImage(s.light, tx - s.light.width / 2, ty + 4 - s.light.height / 2);
    // Les ombres portées, redessinées dans le voile, par paliers tramés comme
    // le halo : jamais plus sombres que la nuit hors du halo (comme dans le jeu)
    vc.globalCompositeOperation = 'source-over'; vc.fillStyle = pal.b;
    const put = (px, py, a) => { vc.globalAlpha = 0.62 * a; vc.fillRect(px, py, 1, 1); };
    const lx = tx, ly = hy + 1;
    castShadow(put, hx, hy + 0.5, lx, ly, 1.5, 5);
    for (const o of s.trees) {
      const d = Math.max(4, Math.hypot(o.x - lx, o.y - ly)), h = o.art.rows.length, w = o.art.rows[0].length;
      if (o.tree) castShadow(put, o.x, o.y, lx, ly, 1.2, Math.max(5, Math.min(40, h * 18 / d)));
      else { const b = artBase(o.art), left = o.x - o.art.ax; castShadowBase(put, left + b.x0, left + b.x1, o.y + 1 - b.dy, lx, ly, Math.max(4, Math.min(14, h * 9 / d))); }
    }
    vc.globalAlpha = 1;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(s.veil, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  },
});

// ══ Attaques ══
const ATTACK_TIMES = [0, 0.26, 0.315, 0.635, 0.795];
function attackDemo(title, view, flip) {
  card('attaques', {
    title, w: 40, h: 36,
    setup(s) { s.dust = []; s.cycle = -1; },
    draw(ctx, pal, t, dt, s) {
      const profile = view !== 'front' && view !== 'back';
      const fx = profile ? (flip ? 26 : 14) : 18, fy = view === 'back' || view === 'diagup' ? 31 : view === 'front' || view === 'diagdown' ? 22 : 24;
      const period = 1.8, local = t % period, cycle = Math.floor(t / period);
      let i = ATTACK_TIMES.findIndex((tt, k) => local >= tt && local < (ATTACK_TIMES[k + 1] ?? 99));
      const dir = flip ? -1 : 1;
      // Traînée
      if (local > 0.26 && local < 0.6) {
        const fade = 1 - (local - 0.26) / 0.34;
        for (const p of smearPixels(view)) {
          ctx.globalAlpha = p.a * fade; ctx.fillStyle = pal.b;
          ctx.fillRect(fx + p.x * dir, fy + p.y, 1, 1);
        }
      }
      // Impact : gerbe de neige et onde au sol
      const imp = IMPACT[view], ix = fx + imp.x * dir, iy = fy + imp.y;
      if (local >= 0.315 && s.cycle !== cycle) {
        s.cycle = cycle;
        for (let k = 0; k < 16; k++) {
          const a = (200 + Math.random() * 140) * Math.PI / 180, sp = 10 + Math.random() * 35;
          s.dust.push({ x: ix, y: iy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4 + Math.random() * 0.5, age: 0 });
        }
      }
      if (local > 0.315 && local < 0.75) {
        const k = (local - 0.315) / 0.43;
        ctx.globalAlpha = 0.6 * (1 - k); ctx.strokeStyle = pal.b; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(ix + 0.5, iy + 0.5, 2 + 6 * k, 1 + 3 * k, 0, 0, Math.PI * 2); ctx.stroke();
      }
      if (local > 0.315) {
        ctx.globalAlpha = Math.max(0, 0.9 - (local - 0.315) / 1.4); ctx.fillStyle = pal.b;
        if (view === 'side') ctx.fillRect(flip ? ix - 3 : ix - 2, iy, 6, 1);
        else if (profile) for (let k = -2; k <= 2; k++) ctx.fillRect(ix + k * dir, iy + Math.round(k * 0.7) * (view === 'diagdown' ? 1 : -1), 1, 1);
        else ctx.fillRect(ix, iy - 2, 1, 5);
      }
      for (const d of s.dust) {
        d.age += dt; d.vy += 60 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
        ctx.globalAlpha = Math.max(0, 0.9 * (1 - d.age / d.life)); ctx.fillStyle = pal.b;
        ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 1);
      }
      s.dust = s.dust.filter(d => d.age < d.life);
      ctx.globalAlpha = 1;
      const frame = i >= 0 && i < 4 ? `${view}-attack-${i}` : `${profile ? 'side' : view}-idle`;
      drawViking(ctx, pal, frame, fx, fy, { flip, clock: t });
    },
  });
}
attackDemo('Vers la droite', 'side', false);
attackDemo('Vers la gauche', 'side', true);
attackDemo('Vers le haut', 'back', false);
attackDemo('Vers le bas', 'front', false);
attackDemo('En bas à droite', 'diagdown', false);
attackDemo('En haut à droite', 'diagup', false);
attackDemo('En bas à gauche', 'diagdown', true);
attackDemo('En haut à gauche', 'diagup', true);
// Le coup tourbillonnant : le bouton maintenu deux secondes, la neige se met
// à tourner autour des pieds ; puis un tour complet, lame sortie
card('attaques', {
  title: 'Tourbillon (bouton maintenu)', w: 96, h: 60,
  setup(s) { s.dust = []; s.cycle = -1; },
  draw(ctx, pal, t, dt, s) {
    const fx = 48, fy = 34, hold = 2, STEP = 0.048, period = 3.8, local = t % period, cycle = Math.floor(t / period);
    const TURN = [['side', false], ['diagdown', false], ['front', false], ['diagdown', true], ['side', true], ['diagup', true], ['back', false], ['diagup', false], ['side', false]];
    const step = Math.floor((local - hold) / STEP), end = hold + (TURN.length - 1) * STEP;
    // La charge : un remous de neige qui grossit et accélère
    if (local < hold) {
      const k = Math.max(0, (local - 0.35) / (hold - 0.35)), n = Math.round(3 + k * 14), spin = local * (3 + k * 9);
      if (k > 0) for (let i = 0; i < n; i++) {
        const a = spin + i / n * Math.PI * 2, wob = Math.sin(i * 12.9898) * 2;
        ctx.globalAlpha = 0.35 + 0.5 * k; ctx.fillStyle = i % 3 ? pal.s : pal.b;
        ctx.fillRect(Math.round(fx + Math.cos(a) * (9 + wob)), Math.round(fy - 2 + Math.sin(a) * (5 + wob * 0.5)), 1, 1);
      }
    }
    // L'anneau de la lame : tracé pendant le tour, puis il s'efface
    const ringFade = local < end + 0.06 ? 1 : Math.max(0, 1 - (local - end - 0.06) / 0.52);
    const drawn = Math.min(TURN.length - 1, step);
    const ring = (front) => {
      if (drawn < 1 || ringFade <= 0) return;
      for (const p of whirlArc(0, drawn * Math.PI / 4)) {
        if (p.front !== front) continue;
        ctx.globalAlpha = p.a * ringFade; ctx.fillStyle = pal.b;
        ctx.fillRect(fx + p.x, fy - 3 + p.y, 1, 1);
      }
    };
    ring(false);
    // Le souffle, au bout du tour
    const since = local - end;
    if (since >= 0 && s.cycle !== cycle) {
      s.cycle = cycle;
      for (let k = 0; k < 48; k++) {
        const a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 60;
        s.dust.push({ x: fx, y: fy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, life: 0.4 + Math.random() * 0.6, age: 0 });
      }
    }
    if (since >= 0 && since < 0.52) {
      const e = 1 - Math.pow(1 - since / 0.52, 2), r = 12 + 34 * e, fade = 1 - (r - 12) / 34;
      for (const p of blastRing(r, 3)) { ctx.globalAlpha = 0.15 + 0.7 * fade; ctx.fillStyle = pal.b; ctx.fillRect(fx + p.x, fy - 1 + p.y, 1, 1); }
    }
    for (const d of s.dust) {
      d.age += dt; d.vy += 40 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
      ctx.globalAlpha = Math.max(0, 0.9 * (1 - d.age / d.life)); ctx.fillStyle = pal.b;
      ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 1);
    }
    s.dust = s.dust.filter(d => d.age < d.life);
    ctx.globalAlpha = 1;
    const turn = step >= 0 && step < TURN.length ? TURN[step] : null;
    drawViking(ctx, pal, turn ? `${turn[0]}-attack-2` : 'side-idle', fx, fy, { flip: turn ? turn[1] : false, clock: t });
    ring(true);
  },
});
// Sur un arbre : il tremble et sa neige tombe ; sur un rocher : des
// étincelles, et le coup s'arrête net, la lame rebondit
card('attaques', {
  title: 'Sur un arbre', w: 40, h: 36,
  setup(s, v) { const r = rng(5); s.tree = makeTree(r, { big: true }); s.frames = LEANS.map(l => prerender(leanRows(s.tree.rows, l), v.pal)); s.flakes = []; s.cycle = -1; },
  draw(ctx, pal, t, dt, s) {
    const period = 1.8, local = t % period, cycle = Math.floor(t / period), hit = 0.315;
    const i = ATTACK_TIMES.findIndex((tt, k) => local >= tt && local < (ATTACK_TIMES[k + 1] ?? 99));
    let lean = 0;
    if (local > hit) { const k = Math.max(0, 1 - (local - hit) / 0.75); lean = Math.max(-1, Math.min(2, Math.round(Math.sin((1 - k) * 34) * 2.2 * k + 0.5 * k))); }
    if (local >= hit && s.cycle !== cycle) {
      s.cycle = cycle;
      for (let k = 0; k < 14; k++) s.flakes.push({ x: 27 + (Math.random() - 0.5) * 8, y: 30 - s.tree.rows.length * (0.35 + Math.random() * 0.5), vy: 4 + Math.random() * 12, life: 0.6 + Math.random() * 0.8, age: 0 });
    }
    const img = s.frames[LEANS.indexOf(lean)];
    ctx.drawImage(img, 27 - s.tree.ax - LEAN_PAD, 31 - img.height);
    for (const f of s.flakes) { f.age += dt; f.vy += 22 * dt; f.y += f.vy * dt; ctx.globalAlpha = Math.max(0, 1 - f.age / f.life); ctx.fillStyle = pal.b; ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1); }
    ctx.globalAlpha = 1;
    s.flakes = s.flakes.filter(f => f.age < f.life);
    drawViking(ctx, pal, i >= 0 && i < 4 ? `side-attack-${i}` : 'side-idle', 17, 31, { clock: t });
  },
});
card('attaques', {
  title: 'Sur un rocher', w: 40, h: 36,
  setup(s, v) { const r = rng(9); s.rock = makeBoulder(r); s.img = prerender(s.rock.rows, v.pal); s.sparks = []; s.cycle = -1; },
  draw(ctx, pal, t, dt, s) {
    const period = 1.8, local = t % period, cycle = Math.floor(t / period), hit = 0.315;
    const rx = 28;
    ctx.drawImage(s.img, rx - s.rock.ax, 31 - s.img.height);
    if (local >= hit && s.cycle !== cycle) {
      s.cycle = cycle;
      for (let k = 0; k < 16; k++) { const a = (150 + Math.random() * 100) * Math.PI / 180, sp = 40 + Math.random() * 70; s.sparks.push({ x: 27, y: 29, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.1 + Math.random() * 0.3, age: 0, c: k % 3 ? 'r' : 's' }); }
    }
    // Arrêté net : la lame reste tendue un instant, un pixel en arrière, puis la garde
    let frame = 'side-idle', x = 17;
    if (local < hit) frame = `side-attack-${local < 0.26 ? 0 : 1}`;
    else if (local < hit + 0.17) { frame = 'side-attack-2'; x = 16; }
    drawViking(ctx, pal, frame, x, 31, { clock: t });
    for (const p of s.sparks) { p.age += dt; p.vy += 180 * dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = Math.max(0, 1 - p.age / p.life); ctx.fillStyle = pal[p.c]; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
    ctx.globalAlpha = 1;
    s.sparks = s.sparks.filter(p => p.age < p.life);
  },
});

// Certains arbres sont pourris : au second coup, ils s'effondrent ; certains
// rochers sont fendus : au second coup, ils éclatent, les morceaux restent
function swing(local, hits) {
  for (const h of hits) { const k = local - h + 0.315; if (k >= 0 && k < 0.8) { const i = ATTACK_TIMES.findIndex((tt, j) => k >= tt && k < (ATTACK_TIMES[j + 1] ?? 99)); return i >= 0 && i < 4 ? `side-attack-${i}` : 'side-idle'; } }
  return 'side-idle';
}
card('attaques', {
  title: 'Un arbre finit par tomber', about: 'Tous les arbres finissent par tomber : chaque coup le fait trembler et laisse une entaille ; les petits cèdent au second coup, les grands en demandent bien plus (un coup par 4 pixels de haut). Il tombe à l\'opposé du viking et reste couché (on l\'enjambe).', w: 60, h: 36,
  setup(s, v) { const r = rng(12); s.tree = makeTree(r, { big: true }); s.img = prerender(s.tree.rows, v.pal); },
  draw(ctx, pal, t, dt, s) {
    const period = 5, local = t % period, h1 = 0.4, h2 = 1.4;
    const fall = Math.max(0, Math.min(1, (local - h2) / 0.9));
    const shake = local > h1 && local < h1 + 0.6 ? Math.round(Math.sin((local - h1) * 40) * (1 - (local - h1) / 0.6)) : 0;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(27.5, 31);
    ctx.rotate(fall * fall * Math.PI / 2);
    ctx.drawImage(s.img, -s.tree.ax - 0.5 + shake, -s.img.height + 1);
    ctx.restore();
    drawViking(ctx, pal, local < 3.8 ? swing(local, [h1, h2]) : 'side-idle', 17, 31, { clock: t });
  },
});
card('attaques', {
  title: 'Un rocher s\'effrite, puis cède', about: 'Tous les rochers finissent par céder : chaque coup fait jaillir des étincelles et arrache un éclat, qui tombe au pied ; les gros résistent bien plus longtemps. Au dernier coup, il éclate, ses morceaux restent au sol.', w: 64, h: 40,
  setup(s, v) {
    const r = rng(21); s.rock = makeBoulder(r); s.hp = boulderHits(s.rock.rows[0].length, s.rock.rows.length);
    s.stages = Array.from({ length: s.hp }, (_, n) => chipBoulder(s.rock.rows, n, 21));
    s.imgs = s.stages.map(st => prerender(st.rows, v.pal));
    s.pieces = Array.from({ length: 6 }, () => ({ x: 34 + Math.round((r() - 0.5) * s.rock.rows[0].length), w: 1 + Math.floor(r() * 3), y: 35 - Math.floor(r() * 3) }));
    s.sparks = []; s.last = -1;
  },
  draw(ctx, pal, t, dt, s) {
    const beat = 0.9, rest = 2.5, period = s.hp * beat + rest, local = t % period;
    const n = Math.min(s.hp, Math.floor(local / beat + 0.65));      // coups déjà portés
    const rx = 36 - s.rock.ax, ground = 35;
    const hitId = Math.floor(t / period) * 100 + n;
    if (n > 0 && s.last !== hitId) {
      s.last = hitId;
      const broken = n >= s.hp;
      for (let k = 0; k < (broken ? 16 : 7); k++) { const a = (broken ? 200 + Math.random() * 140 : 150 + Math.random() * 100) * Math.PI / 180, sp = 25 + Math.random() * 45; s.sparks.push({ x: rx - 1, y: ground - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.1 + Math.random() * 0.25, age: 0, c: broken ? (k % 2 ? 'b' : 'k') : (k % 3 ? 'r' : 's') }); }
    }
    if (n < s.hp) {
      const img = s.imgs[n];
      ctx.drawImage(img, rx, ground + 1 - img.height);
      // Les éclats déjà tombés
      ctx.fillStyle = pal.k;
      s.stages[n].fell.forEach((f, i) => ctx.fillRect(Math.round(rx + f.x + f.side * (2 + (i % 3))), ground - (i % 2), f.size > 1.8 ? 2 : 1, 1));
    } else for (const p of s.pieces) { ctx.fillStyle = pal.b; ctx.fillRect(p.x + 1, p.y - 1, Math.max(1, p.w - 1), 1); ctx.fillStyle = pal.k; ctx.fillRect(p.x, p.y, p.w, 1); }
    const sw = local % beat;
    drawViking(ctx, pal, n < s.hp || local < s.hp * beat + 0.3 ? swing(sw + 0.315 - 0.25, [0.315]) : 'side-idle', rx - 11, ground, { clock: t });
    for (const p of s.sparks) { p.age += dt; p.vy += 180 * dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = Math.max(0, 1 - p.age / p.life); ctx.fillStyle = pal[p.c]; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
    ctx.globalAlpha = 1;
    s.sparks = s.sparks.filter(p => p.age < p.life);
  },
});

// ══ Neige et vent ══
// Le cycle naturel, accéléré : une frise en bas montre les phases et l'instant
const CYCLE_SPEED = 20;
card('vent', {
  title: `Cycle naturel (accéléré ×${CYCLE_SPEED})`, about: CYCLE_ABOUT, wide: true, w: 240, h: 78,
  setup(s) { s.weather = createWeather('cycle', { speed: CYCLE_SPEED }); },
  draw(ctx, pal, t, dt, s, v) {
    s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h - 8 });
    drawViking(ctx, pal, 'side-idle', 50, 50, { wind: Math.min(1, s.weather.wind / 140), clock: t });
    s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
    ctx.globalAlpha = 1;
    // Frise : une case par phase, plus sombre quand le vent est fort ; curseur sur l'instant
    const total = WEATHER_CYCLE.reduce((n, [, d]) => n + d, 0);
    const strength = { calme: 0.1, bise: 0.3, rafales: 0.55, tempete: 0.95, tourbillons: 0.45 };
    let x = 0;
    WEATHER_CYCLE.forEach(([key, d], i) => {
      const w = Math.round(d / total * v.w);
      ctx.globalAlpha = 0.15 + 0.75 * strength[key];
      ctx.fillStyle = pal.b;
      ctx.fillRect(x, v.h - 6, w - 1, 6);
      if (i === s.weather.cycle.index) {
        const cx = x + Math.round(s.weather.cycle.t / d * w);
        ctx.globalAlpha = 1; ctx.fillStyle = pal.r;
        ctx.fillRect(cx, v.h - 8, 1, 8);
      }
      x += w;
    });
    ctx.globalAlpha = 1;
    // Nom de la phase en cours, sous le titre de la carte
    if (v.key === 'blanc') {
      const label = s.label || (s.label = v.ctx.canvas.closest('.demo').querySelector('h3 span:last-child'));
      const now = WEATHER_PRESETS[s.weather.phase].label;
      const text = `Cycle naturel (accéléré ×${CYCLE_SPEED}) — ${now.toLowerCase()}`;
      if (label.textContent !== text) label.textContent = text;
    }
  },
});

Object.entries(WEATHER_PRESETS).forEach(([key, p], k) => {
  card('vent', {
    title: p.label, tag: 'ABCDEFG'[k], about: p.about, wide: true, w: 240, h: 70,
    // (l'orage se joue de nuit, pour voir l'éclair ouvrir le noir ; le tonnerre au clic)
    setup(s) { s.weather = createWeather(key); s.strikeNow = p.lightning > 0.05; s.weather.onStrike = near => setTimeout(() => audio.play('thunder', { near }), (1 - near) * 2600 + 120); },
    draw(ctx, pal, t, dt, s, v) {
      s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
      if (s.strikeNow) { s.strikeNow = false; s.weather.strike(1); }
      drawViking(ctx, pal, 'side-idle', 50, 50, { wind: Math.min(1, s.weather.wind / 140), clock: t });
      s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c] || '#ffffff'; ctx.fillRect(x, y, w, h); });
      if (p.lightning > 0.05) {
        ctx.globalAlpha = 0.75 * (1 - s.weather.flash);
        ctx.fillStyle = pal.b;
        ctx.fillRect(0, 0, v.w, v.h);
      }
      if (p.fog) {
        // Le brouillard : la vue se referme, tramée
        for (let y = 0; y < v.h; y++) for (let x = 0; x < v.w; x++) {
          const d = Math.hypot((x - 50) / 1.6, y - 44) / 40;
          if (d > 0.6 && Math.min(1, (d - 0.6) * 1.6) > ((x * 7 + y * 13) % 16) / 16) { ctx.globalAlpha = 1; ctx.fillStyle = pal.b; ctx.fillRect(x, y, 1, 1); }
        }
      }
      ctx.globalAlpha = 1;
    },
    button: p.lightning > 0.05 ? 'Un éclair tout près' : undefined,
  });
});

// ══ Arbres ══
function prerender(rows, pal) {
  const c = document.createElement('canvas');
  c.width = rows[0].length; c.height = rows.length;
  drawRows(c.getContext('2d'), pal, rows, 0, 0);
  return c;
}

card('arbres', {
  title: 'Chaque arbre est différent', about: 'Hauteur, largeur, étages, inclinaison, tronc et neige tirés au hasard ; un sur dix est un arbre mort.',
  wide: true, w: 320, h: 90, button: 'Autres arbres',
  setup(s, v) {
    const seed = Math.floor(Math.random() * 1e9);
    const r = rng(seed);
    s.trees = [];
    for (let x = 8; x < v.w - 8;) {
      const art = makeTree(r, { big: r() < 0.5 });
      s.trees.push({ img: prerender(art.rows, v.pal), x: x + art.ax, y: 80 - (s.trees.length % 2) * 30, ax: art.ax });
      x += art.rows[0].length + 2;
    }
  },
  draw(ctx, pal, t, dt, s) {
    for (const tr of s.trees) ctx.drawImage(tr.img, tr.x - tr.ax, tr.y - tr.img.height + 1);
  },
});

card('arbres', {
  title: 'Quelques arbres, puis la forêt', about: 'Clairsemés près du rivage, puis de plus en plus serrés ; triés en profondeur avec le viking.',
  wide: true, w: 320, h: 120, button: 'Autre lisière',
  setup(s, v) {
    const r = rng(Math.floor(Math.random() * 1e9));
    s.items = [];
    for (let y = 20; y < v.h + 20; y += 7) {
      for (let x = 0; x < v.w; x += 8) {
        const d = Math.max(0.02, Math.min(0.75, (x - 90) / 180));
        if (r() > d) continue;
        const art = makeTree(r, { big: d > 0.3 });
        s.items.push({ img: prerender(art.rows, v.pal), x: x + Math.floor(r() * 8), y: y + Math.floor(r() * 7), ax: art.ax });
      }
    }
    s.weather = createWeather('bise');
  },
  draw(ctx, pal, t, dt, s, v) {
    const vx = ((t * 18) % (v.w + 40)) - 20;
    const hero = { hero: true, x: Math.round(vx), y: 70 };
    const all = [...s.items, hero].sort((a, b) => a.y - b.y);
    for (const it of all) {
      if (it.hero) drawViking(ctx, pal, walkFrame('side', t), it.x, it.y, { clock: t, wind: 0.4 });
      else ctx.drawImage(it.img, it.x - it.ax, it.y - it.img.height + 1);
    }
    s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
    s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
    ctx.globalAlpha = 1;
  },
});

card('arbres', {
  title: 'Arbres au vent', about: 'Presque immobiles par calme et par bise ; au-delà, ils penchent vers l\'est et ploient vite, chacun à sa cadence, les rafales passant sur la forêt comme une vague. Ici le cycle du vent, accéléré.',
  wide: true, w: 240, h: 70,
  setup(s, v) {
    const r = rng(Math.floor(Math.random() * 1e9));
    s.trees = [];
    for (let x = 6; x < v.w - 10;) {
      const art = makeTree(r, { big: r() < 0.6 });
      const imgs = LEANS.map(l => prerender(leanRows(art.rows, l), v.pal));
      s.trees.push({ imgs, x: x + art.ax, y: 60 - (s.trees.length % 3) * 7, ax: art.ax + LEAN_PAD, h: art.rows.length, phase: r() * 6.28 });
      x += art.rows[0].length - 2;
    }
    s.trees.sort((a, b) => a.y - b.y);
    s.weather = createWeather('cycle', { speed: 20 });
  },
  draw(ctx, pal, t, dt, s, v) {
    s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
    const { base, amp } = treeWind(s.weather.wind, s.weather.gust);
    for (const tr of s.trees) {
      tr.freq = tr.freq || treeFreq(tr.h);
      const lean = treeLean(t, tr, base, amp);
      const img = tr.imgs[LEANS.indexOf(lean)];
      ctx.drawImage(img, tr.x - tr.ax, tr.y - img.height + 1);
    }
    s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
    ctx.globalAlpha = 1;
    if (v.key === 'blanc') {
      const label = s.label || (s.label = v.ctx.canvas.closest('.demo').querySelector('h3 span:last-child'));
      const text = `Arbres au vent — ${WEATHER_PRESETS[s.weather.phase].label.toLowerCase()}`;
      if (label.textContent !== text) label.textContent = text;
    }
  },
});

// ══ Rochers et cairns ══
function row(section, title, about, make, button, sea = false) {
  card(section, {
    title, about, wide: true, w: 320, h: 50, button,
    setup(s, v) {
      const r = rng(Math.floor(Math.random() * 1e9));
      s.items = [];
      for (let x = 6; x < v.w - 30;) {
        const art = make(r);
        s.items.push({ img: prerender(art.rows, v.pal), x });
        x += art.rows[0].length + 8;
      }
    },
    draw(ctx, pal, t, dt, s, v) {
      if (sea) { ctx.fillStyle = pal.b; ctx.fillRect(0, 0, v.w, v.h); }
      for (const it of s.items) ctx.drawImage(it.img, it.x, 40 - it.img.height + 1);
      drawViking(ctx, pal, 'side-idle', 310, 40, { flip: true, wind: 0.3, clock: t });
    },
  });
}
row('rochers', 'Gros rochers', 'Blocs de roc noirs, trapus, taillés en facettes nettes (pas de pyramides) ; à peine de neige sur les replats. Le viking à droite donne l\'échelle.', makeBoulder, 'Autres rochers');
row('rochers', 'Rochers cernés (autour des ruines)', 'Dans le style des dessins de l\'arche et des ruines : un trait fin en bleu nuit, l\'intérieur clair ; un polygone simple mais irrégulier, assis sur la neige, parfois fendu. Ils entourent les monuments, à la place des gravats.', makeOutlinedRock, 'Autres rochers');
row('rochers', 'Cairns (nouvelle forme)', 'Pierres plates empilées, séparées par des lits de neige.', makeCairn, 'Autres cairns');

// ══ Maison ══
card('maison', {
  title: 'La maison, vue de haut et de biais', about: 'D\'après l\'image de référence : grand toit enneigé en losange, murs sombres, ombre portée. Pas de fumée. Les traces passent devant et continuent vers l\'est.',
  wide: true, w: 200, h: 80,
  setup(s, v) { s.img = prerender(HOUSE_ART, v.pal); s.weather = createWeather('rafales'); },
  draw(ctx, pal, t, dt, s, v) {
    s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
    ctx.drawImage(s.img, 80, 74 - HOUSE_H + 1);
    drawViking(ctx, pal, walkFrame('side', t), 20 + Math.round((t * 14) % 170), 76, { wind: Math.min(1, s.weather.wind / 140), clock: t });
    s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
    ctx.globalAlpha = 1;
  },
});

// ══ Loups ══
for (const [key, anim] of Object.entries(WOLF_ANIMS)) {
  card('loups', {
    title: anim.label, w: 58, h: 16,
    draw(ctx, pal, t) {
      const f = anim.frames[Math.floor(t * anim.fps) % anim.frames.length];
      drawRows(ctx, pal, gridRows(f), 0, 14 - WOLF_GROUND);
      drawRows(ctx, pal, gridRows(f), 20, 14 - WOLF_GROUND, true);
      drawViking(ctx, pal, 'side-idle', 50, 14, { flip: true, wind: 0.3, clock: t });
    },
  });
}
card('loups', {
  title: 'Une meute passe', about: 'Trois loups au trot, puis au galop ; le viking donne l\'échelle.', wide: true, w: 220, h: 52,
  setup(s) { s.wolves = [0, 1, 2].map(i => ({ x: -24 - i * 24, y: 26 + i * 9, phase: i * 0.37 })); s.weather = createWeather('bise'); },
  draw(ctx, pal, t, dt, s, v) {
    const galop = (t % 12) > 6;
    const anim = galop ? WOLF_ANIMS.galop : WOLF_ANIMS.trot;
    for (const w of s.wolves) {
      w.x += (galop ? 55 : 22) * dt;
      if (w.x > v.w + 10) w.x = -WOLF_W - Math.random() * 40;
    }
    const all = [...s.wolves, { hero: true, y: 42 }].sort((a, b) => a.y - b.y);
    for (const w of all) {
      if (w.hero) { drawViking(ctx, pal, 'side-idle', 200, 42, { flip: true, wind: 0.3, clock: t }); continue; }
      const f = anim.frames[Math.floor((t + w.phase) * anim.fps) % anim.frames.length];
      drawRows(ctx, pal, gridRows(f), Math.round(w.x), w.y - WOLF_GROUND);
    }
    s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
    s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
    ctx.globalAlpha = 1;
  },
});

// La louve blanche (game.js : `this.hvit`) : les poses du loup, blanches,
// cernées de bleu nuit ; prise au collet, elle tire sur la corde ; déliée,
// elle hurle et rentre sous les arbres
const whiteWolf = g => g.map((row, y) => row.map((c, x) => {
  const full = (i, j) => { const v = g[j]?.[i]; return !!v && v !== '.' && v !== 'h'; };
  if (full(x, y)) return 's';
  if (full(x - 1, y) || full(x + 1, y) || full(x, y - 1) || full(x, y + 1)) return 'b';
  return c === 'h' ? 'h' : null;
}));
card('loups', {
  title: 'La louve blanche', tag: 'forêt noire',
  about: 'À la sortie de la forêt noire, dans la grande clairière : une louve blanche, la patte prise dans un collet, attachée à un piquet. Elle tire sur la corde de temps en temps (un grognement sourd, de près). E « Défaire le collet » : elle se relève, hurle, parle de ses petits sur la roche, et rentre sous les arbres. Plus haut, la meute épargne alors Kári.',
  wide: true, w: 120, h: 30,
  draw(ctx, pal, t) {
    const k = t % 10, ground = 22;
    // le piquet et la corde
    if (k < 5) {
      ctx.fillStyle = pal.b;
      for (let i = 0; i <= 6; i++) ctx.fillRect(40 - 3 - i, ground - 2 + Math.round(i * 0.3), 1, 1);
      ctx.fillRect(30, ground - 3, 1, 4);
      const tug = Math.sin(t * 1.7) > 0.93;
      drawRows(ctx, pal, gridRows(whiteWolf(tug ? WOLF_ANIMS.grogne.frames[0] : WOLF_ANIMS.mort.frames[0])), 40 - 7, ground - WOLF_GROUND, true);
      drawViking(ctx, pal, walkFrame('side', t), Math.round(90 - Math.min(1, k / 3) * 30), ground, { flip: true, clock: t });
    } else {
      const f = k < 6.5 ? WOLF_ANIMS.hurle.frames[0] : WOLF_ANIMS.trot.frames[Math.floor(t * 7) % 2];
      const x = k < 6.5 ? 33 : Math.round(33 - (k - 6.5) * 26);
      drawRows(ctx, pal, gridRows(whiteWolf(f)), x, ground - WOLF_GROUND, true);
      drawViking(ctx, pal, 'side-idle', 60, ground, { flip: true, clock: t });
    }
  },
});

// La meute attaque : elle tourne autour du viking ; l'un gronde, bondit,
// file au-delà et reprend sa place. Des pistes de loups sur la neige.
card('loups', {
  title: 'La meute attaque', about: 'Sur le plateau, en haut de la falaise : trois loups sortent du côté du glacier, encerclent le viking, grondent une seconde et demie et bondissent l\'un après l\'autre, toutes les quatre secondes environ. Deux coups en abattent un, et le premier tombé fait fuir les autres. Si la louve blanche a été déliée, ils tournent sept secondes et s\'en vont sans mordre. Autour, leurs pistes dans la neige.', wide: true, w: 160, h: 80,
  setup(s) {
    const r = rng(8);
    s.prints = [];
    for (let k = 0; k < 4; k++) {
      const a0 = r() * 6.28, x0 = 80 + Math.cos(a0) * 90, y0 = 44 + Math.sin(a0) * 50;
      for (let i = 0; i < 30; i++) { const f = i / 30, w = Math.sin(f * 7 + k) * 5; s.prints.push([Math.round(x0 + (80 - x0) * f + w + (i % 2)), Math.round(y0 + (44 - y0) * f + (i % 2))]); }
    }
    s.wolves = [0, 1, 2].map(i => ({ a: i * Math.PI * 2 / 3 + 0.4, x: 0, y: 0, state: 'circle', timer: 0, vx: 0, vy: 0, flip: false }));
    s.clock = 1.5; s.next = 0;
  },
  draw(ctx, pal, t, dt, s) {
    ctx.fillStyle = pal.b; ctx.globalAlpha = 0.6;
    for (const [x, y] of s.prints) ctx.fillRect(x, y, 1, 1);
    ctx.globalAlpha = 1;
    const hx = 80, hy = 46;
    s.clock -= dt;
    if (s.clock <= 0) { const w = s.wolves[s.next++ % s.wolves.length]; w.state = 'crouch'; w.timer = 0.6; s.clock = 2.4; }
    let heroFrame = 'side-idle', heroFlip = false;
    for (const w of s.wolves) {
      w.timer -= dt;
      if (w.state === 'circle') {
        w.a += dt * 0.55;
        const tx = hx + Math.cos(w.a) * 30, ty = hy + Math.sin(w.a) * 17;
        const dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy);
        if (d > 0.5) { const st = Math.min(d, (d > 10 ? 58 : 30) * dt); w.x += dx / d * st; w.y += dy / d * st; w.flip = dx < 0; }
        w.anim = d > 10 ? 'galop' : 'trot';
      } else if (w.state === 'crouch') {
        w.anim = 'grogne'; w.flip = hx < w.x;
        if (w.timer <= 0) { const dx = hx - w.x, dy = hy - w.y, d = Math.hypot(dx, dy); w.vx = dx / d * 125; w.vy = dy / d * 125; w.timer = (d + 8) / 125; w.state = 'lunge'; }
      } else if (w.state === 'lunge') {
        w.anim = 'bond'; w.x += w.vx * dt; w.y += w.vy * dt; w.flip = w.vx < 0;
        heroFlip = w.vx > 0;
        const k = 0.35 - w.timer;
        heroFrame = k < 0 ? 'side-idle' : `side-attack-${Math.min(3, Math.floor(k / 0.1))}`;
        if (w.timer <= 0) { w.state = 'circle'; w.a = Math.atan2((w.y - hy) / 17, (w.x - hx) / 30); }
      }
    }
    const all = [...s.wolves, { hero: true, y: hy }].sort((a, b) => a.y - b.y);
    for (const w of all) {
      if (w.hero) { drawViking(ctx, pal, heroFrame, hx, hy, { flip: heroFlip, wind: 0.2, clock: t }); continue; }
      const anim = WOLF_ANIMS[w.anim || 'trot'];
      const f = anim.frames[Math.floor(t * anim.fps) % anim.frames.length];
      drawRows(ctx, pal, gridRows(f), Math.round(w.x) - 8, Math.round(w.y) - WOLF_GROUND, w.flip);
    }
  },
});

// ══ Cerfs et biches ══
for (const [who, anims] of [['Cerf', STAG_ANIMS], ['Biche', DOE_ANIMS]]) {
  for (const anim of Object.values(anims)) {
    card('cerfs', {
      title: `${who} — ${anim.label.toLowerCase()}`, w: 56, h: 16,
      draw(ctx, pal, t) {
        const f = anim.frames[Math.floor(t * anim.fps) % anim.frames.length];
        drawRows(ctx, pal, gridRows(f), 0, 14 - DEER_GROUND);
        drawRows(ctx, pal, gridRows(f), 19, 14 - DEER_GROUND, true);
        drawViking(ctx, pal, 'side-idle', 48, 14, { flip: true, wind: 0.3, clock: t });
      },
    });
  }
}

// ══ Statue ══
// L'arche et les ruines, d'après les dessins de assets/ : le viking passe,
// pour l'échelle (sous les arches, il traverse du sud au nord et revient)
for (const [section, key, title, about, w, h, under] of [
  ['arche', 'arche', 'L\'arche', 'Une porte de pierre seule dans la plaine, au nord de la piste, entre la plaine des morts et la forêt ; une douzaine de fois le viking. On passe dessous : le passage est sombre.', 160, 150, true],
  ['ruines', 'ruine', 'L\'arche en ruine', 'Entre la maison et la falaise, au sud de la piste. On passe dessous.', 140, 130, true],
  ['ruines', 'colonne', 'La colonne couchée', 'Avant le lac, au sud de la piste. On ne la franchit pas ; on marche sur les éclats.', 120, 90, false],
  ['ruines', 'socle', 'Le socle en ruine', 'Au sortir de la forêt noire, au nord de la piste. Un obstacle ; on marche sur les éclats.', 130, 120, false],
]) {
  card(section, {
    title, about, wide: section === 'arche', w, h,
    setup(s, v) {
      s.parts = monumentParts(key, Math.round(v.w / 2), v.h - 14).map(o => ({ ...o, img: prerender(o.art.rows, v.pal) }));
      s.weather = createWeather('bise');
    },
    draw(ctx, pal, t, dt, s, v) {
      let hero;
      if (under) {
        const k = (t % 14) / 7, u = k < 1 ? k : 2 - k;
        hero = { hero: true, y: Math.round(v.h - 2 - u * 40), x: Math.round(v.w / 2 + (key === 'arche' ? 4 : 0)), view: k < 1 ? 'back' : 'front' };
      } else hero = { hero: true, y: v.h - 3, x: 6 + Math.round((t * 10) % (v.w - 12)), view: 'side' };
      for (const o of [...s.parts, hero].sort((a, b) => a.y - b.y)) {
        if (o.hero) drawViking(ctx, pal, walkFrame(o.view, t), o.x, o.y, { clock: t, wind: 0.4 });
        else ctx.drawImage(o.img, o.x - o.art.ax, o.y - o.img.height + 1);
      }
      s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
      s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
      ctx.globalAlpha = 1;
    },
  });
}

card('statue', {
  title: 'Véla, ensevelie, penchée, brisée',
  about: 'À mi-chemin, au bord nord de la piste, dans une clairière. Environ dix fois la taille du viking ; la coiffe et un éclat d\'épaule gisent dans la neige.',
  wide: true, w: 240, h: 100,
  setup(s, v) {
    s.parts = buildStatue({ x: 120, y: 84 }).map(o => ({ ...o, img: prerender(o.art.rows, v.pal) }));
    s.weather = createWeather('rafales');
  },
  draw(ctx, pal, t, dt, s, v) {
    const hero = { hero: true, y: 92 };
    const all = [...s.parts, hero].sort((a, b) => a.y - b.y);
    for (const o of all) {
      if (o.hero) drawViking(ctx, pal, walkFrame('side', t), 30 + Math.round((t * 12) % 180), 92, { clock: t, wind: 0.5 });
      else ctx.drawImage(o.img, o.x - o.art.ax, o.y - o.img.height + 1);
    }
    s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
    s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
    ctx.globalAlpha = 1;
  },
});

card('statue', {
  title: 'Véla, debout, au sortir de la forêt',
  about: 'Plus grande (une douzaine de fois le viking), droite, à peine enfoncée, de la neige sur la coiffe et les épaules.',
  wide: true, w: 240, h: 140,
  setup(s, v) {
    s.parts = buildStatueUpright({ x: 120, y: 128 }).map(o => ({ ...o, img: prerender(o.art.rows, v.pal) }));
    s.weather = createWeather('bise');
  },
  draw(ctx, pal, t, dt, s, v) {
    const all = [...s.parts, { hero: true, y: 134 }].sort((a, b) => a.y - b.y);
    for (const o of all) {
      if (o.hero) drawViking(ctx, pal, walkFrame('side', t), 30 + Math.round((t * 12) % 180), 134, { clock: t, wind: 0.3 });
      else ctx.drawImage(o.img, o.x - o.art.ax, o.y - o.img.height + 1);
    }
    s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
    s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
    ctx.globalAlpha = 1;
  },
});

// ══ Lac ══
card('lac', {
  title: 'Le lac, la barque, l\'îlot', about: 'Au sud de la piste, avant la forêt. On monte dans la barque en marchant dessus, on rame (Maj pour ramer plus fort), on descend en abordant une rive. Sur l\'îlot, une Véla plus petite, une porte taillée dans sa robe.',
  wide: true, w: 260, h: 160,
  setup(s, v) {
    const L = { x: 130, y: 112, rx: 118, ry: 42 }, I = { x: 150, y: 110, rx: 24, ry: 11 };
    s.coast = (x, y) => {
      const dx = (x - L.x) / L.rx, dy = (y - L.y) / L.ry;
      let c = (1 - Math.hypot(dx, dy)) * L.ry * 0.0007;
      const di = Math.hypot((x - I.x) / I.rx, (y - I.y) / I.ry);
      return Math.min(c, (di - 1) * I.ry * 0.0007);
    };
    s.sea = createSea(s.coast);
    s.water = document.createElement('canvas');
    s.water.width = v.w; s.water.height = v.h;
    const wc = s.water.getContext('2d');
    wc.fillStyle = v.pal.b;
    for (let y = 0; y < v.h; y++) for (let x = 0; x < v.w; x++) if (s.coast(x, y) > 0) wc.fillRect(x, y, 1, 1);
    s.statue = buildStatueDoor({ x: I.x, y: I.y + 2 }).map(o => ({ ...o, img: prerender(o.art.rows, v.pal) }));
    s.boats = Object.fromEntries(Object.entries(ROWBOAT_FRAMES).map(([k, rows]) => [k, prerender(rows, v.pal)]));
  },
  draw(ctx, pal, t, dt, s, v) {
    ctx.drawImage(s.water, 0, 0);
    s.sea.draw({ x: 0, y: 0, w: v.w, h: v.h }, t, (x, y, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal.s; ctx.fillRect(x, y, 1, 1); });
    ctx.globalAlpha = 1;
    for (const o of s.statue) ctx.drawImage(o.img, o.x - o.art.ax, o.y - o.img.height + 1);
    // La barque traverse, aller et retour
    const k = (t % 16) / 8, go = k < 1, u = go ? k : 2 - k;
    const bx = Math.round(40 + u * 60), by = Math.round(120 + Math.sin(u * 3) * 4);
    const img = s.boats[`row${[0, 1, 2, 1][Math.floor(t * 4.5) % 4]}`];
    ctx.save();
    if (!go) { ctx.translate(bx * 2, 0); ctx.scale(-1, 1); }
    ctx.drawImage(img, bx - Math.round(img.width / 2), by - Math.round(img.height * 0.7));
    ctx.restore();
  },
});

card('lac', {
  title: 'La crypte, le coffre', about: 'Dans la statue : une salle de pierre, des runes, des ossements, et au fond un coffre. On l\'ouvre en cliquant près de lui (ou en le poussant) : il s\'entrouvre, s\'ouvre, des éclats montent.',
  wide: true, w: 120, h: 90,
  setup(s, v) { s.room = prerender(CRYPT, v.pal); s.chest = Object.fromEntries(Object.entries(CHEST_FRAMES).map(([k, rows]) => [k, prerender(rows, v.pal)])); },
  draw(ctx, pal, t, dt, s, v) {
    ctx.drawImage(s.room, 0, 0);
    const k = t % 9;
    const walk = Math.min(1, k / 3), x = CRYPT_ENTRY.x, y = Math.round(CRYPT_ENTRY.y - (CRYPT_ENTRY.y - CHEST.y - 8) * walk);
    const state = k < 3.4 ? 'closed' : k < 3.8 ? 'ajar' : 'open';
    const img = s.chest[state];
    ctx.drawImage(img, CHEST.x - Math.floor(img.width / 2), CHEST.y + 1 - img.height);
    if (state === 'open') {
      for (let i = 0; i < 8; i++) {
        const age = (k - 3.8 - i * 0.12);
        if (age < 0 || age > 1.4) continue;
        ctx.globalAlpha = 1 - age / 1.4; ctx.fillStyle = i % 4 ? pal.s : pal.r;
        ctx.fillRect(CHEST.x - 4 + ((i * 5) % 9), Math.round(CHEST.y - 4 - age * 14), 1, 1);
      }
      ctx.globalAlpha = 1;
    }
    drawViking(ctx, pal, walk < 1 ? walkFrame('back', t) : 'back-idle', x, y, { clock: t, wind: 0 });
  },
});

// ══ Nécropole, d'après un champ de pierres levées du Nord ══
const NECRO = [
  ['A', 'Navire de pierres', 'Une enceinte en forme de navire : un ovale aux deux bouts pointus, les pierres des étraves plus hautes. Certaines manquent.', () => PROPS.shipSetting(1, 64, 16)],
  ['B', 'Triangle', 'Trois côtés de pierres basses, une pierre haute au sommet.', () => PROPS.triangleSetting(2, 30)],
  ['C', 'Cercle', 'Un cercle de pierres, une grande pierre dressée au centre.', () => PROPS.stoneCircle(3, 14)],
  ['D', 'Tertre et pierre runique', 'Un monticule enneigé, un anneau de pierres à sa base, une pierre gravée devant.', () => PROPS.mound(4, 44)],
  ['E', 'Le champ des morts', 'Plusieurs navires, cercles et triangles sur une pente, des pierres isolées : la nécropole entière, à traverser.', () => PROPS.necropolis(5)],
];
for (const [tag, title, about, make] of NECRO) {
  card('necropole', {
    tag, title, about, wide: tag === 'E', w: tag === 'E' ? 240 : 120, h: tag === 'E' ? 90 : 50,
    setup(s, v) { s.img = prerender(make(), v.pal); s.weather = createWeather('bise'); },
    draw(ctx, pal, t, dt, s, v) {
      const x0 = Math.round((v.w - s.img.width) / 2), y0 = v.h - s.img.height - 4;
      ctx.drawImage(s.img, x0, y0);
      // Le viking passe devant, pour l'échelle
      drawViking(ctx, pal, walkFrame('side', t), 8 + Math.round((t * 12) % (v.w - 16)), v.h - 3, { clock: t, wind: 0.3 });
      s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
      s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
      ctx.globalAlpha = 1;
    },
  });
}

// ══ Le pas des morts ══
card('pas-des-morts', {
  title: 'La main sur l\'étrave', tag: 'touche E, puis la carte',
  about: 'Dans la plaine des morts, au creux du grand navire de pierres (`PASSAGE_AT`), le viking pose la main sur l\'étrave (touche E) : « La pierre est tiède. Ceux de ce navire marchent encore. » Les morts lui prêtent leur pas. Désormais, la carte (M) dit « touche un lieu nommé pour t\'y rendre » : un clic sur un lieu déjà vu, la carte se ferme, l\'écran fond au bleu nuit et l\'on est là-bas (au point praticable le plus proche). Pas pendant un combat, ni dedans, ni en barque, ni sur la sente. Gardé dans la sauvegarde (`passage`).',
  wide: true, w: 200, h: 60,
  setup(s, v) { s.img = prerender(PROPS.shipSetting(1, 64, 16), v.pal); s.weather = createWeather('bise'); },
  draw(ctx, pal, t, dt, s, v) {
    const x0 = 24, y0 = v.h - s.img.height - 8;
    ctx.drawImage(s.img, x0, y0);
    // Il entre dans le navire, pose la main, s'efface, et reparaît plus loin
    const k = t % 9, inX = x0 + 50, outX = 170;
    let x = inX, a = 1, frame = 'side-idle';
    if (k < 3) { x = Math.round(4 + (inX - 4) * k / 3); frame = walkFrame('side', t); }
    else if (k < 5) a = 1;
    else if (k < 6) a = 1 - (k - 5);
    else if (k < 7) { x = outX; a = k - 6; }
    else x = outX;
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    drawViking(ctx, pal, frame, x, v.h - 10, { clock: t, wind: 0.3 });
    ctx.globalAlpha = 1;
    s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
    s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
    ctx.globalAlpha = 1;
  },
});

// ══ Le bosquet sacré ══
card('bosquet', {
  title: 'L\'arbre aux offrandes et le guetteur', about: 'Au milieu de la forêt noire, dans une trouée : un arbre mort immense, chargé d\'offrandes qui tournent au vent. De l\'autre côté, une silhouette plus grande que le viking le regarde venir ; quand il approche, elle vacille et s\'efface, un souffle grave dans l\'air. Ses pas s\'arrêtent net.',
  wide: true, w: 200, h: 70,
  setup(s, v) {
    s.tree = makeGroveTree(7); s.treeImg = prerender(s.tree.rows, v.pal);
    s.bundle = prerender(BUNDLE, v.pal); s.watcher = prerender(WATCHER, v.pal);
    s.weather = createWeather('rafales');
  },
  draw(ctx, pal, t, dt, s, v) {
    const tx = 60, ty = 62, top = ty - s.tree.rows.length + 1, x0 = tx - s.tree.ax;
    ctx.drawImage(s.treeImg, x0, top);
    const force = Math.min(1, s.weather.wind / 140);
    s.tree.hooks.forEach((h, i) => {
      const len = 3 + (i * 7) % 5, sway = Math.round(Math.sin(t * (1.1 + force) + i * 1.7) * (0.4 + 1.3 * force) + force);
      ctx.fillStyle = pal.b;
      for (let k = 0; k < len; k++) ctx.fillRect(x0 + h.x + Math.round(sway * k / len), top + h.y + k, 1, 1);
      ctx.drawImage(s.bundle, x0 + h.x + sway - 1, top + h.y + len);
    });
    // Le viking avance ; le guetteur s'efface quand il est à 30 pixels
    const k = (t % 12) / 12, hx = Math.round(10 + k * 150), wx = 175;
    const near = wx - hx < 30;
    const fade = near ? Math.max(0, 1 - (hx - (wx - 30)) / 8) : 1;
    if (fade > 0.05) { ctx.globalAlpha = (Math.floor(t * 10) % 3 === 0 && near) ? fade * 0.3 : fade; ctx.drawImage(s.watcher, wx - 3, 63 - WATCHER.length); ctx.globalAlpha = 1; }
    for (let j = 1; j <= 3; j++) { ctx.fillStyle = pal.b; ctx.fillRect(wx - 1 + (j % 2) * 2, 64 - j * 6, 1, 2); }
    drawViking(ctx, pal, walkFrame('side', t), hx, 64, { clock: t, wind: force });
    s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
    s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
    ctx.globalAlpha = 1;
  },
});

// ══ Falaise ══
card('falaise', {
  title: 'La falaise et la grotte', about: 'Au-delà du bout des traces, un mur de roc face au sud, plus d\'un kilomètre de large (en pixels), quinze à vingt fois la taille du viking : corniche de neige, vires enneigées, fissures ; au pied, la bouche noire d\'une grotte, des glaçons au linteau.',
  wide: true, w: 300, h: 220,
  setup(s, v) {
    s.x0 = CAVE.x - 150;
    s.parts = CLIFF_PARTS.filter(o => o.x + o.art.rows[0].length > s.x0 && o.x < s.x0 + 300).map(o => ({ ...o, img: prerender(o.art.rows, v.pal) }));
    s.weather = createWeather('bise');
  },
  draw(ctx, pal, t, dt, s, v) {
    const dy = v.h - 12 - CLIFF.y;
    const all = [...s.parts, { hero: true, y: CLIFF.y + 9 }].sort((a, b) => a.y - b.y);
    for (const o of all) {
      if (o.hero) drawViking(ctx, pal, walkFrame('side', t), 20 + Math.round((t * 12) % 260), v.h - 3, { clock: t, wind: 0.3 });
      else ctx.drawImage(o.img, o.x - s.x0 - o.art.ax, o.y + dy - o.img.height + 1);
    }
    s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
    s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
    ctx.globalAlpha = 1;
  },
});

card('falaise', {
  title: 'La sente (chapitre IX)', about: 'Un chemin taillé en lacets dans la face, du pied au rebord : on y monte en marchant vers la roche (haut monte toujours, bas descend), plus lentement. La paroi au-dessus est plâtrée de neige : le viking s\'y découpe. Des pierres se détachent du rebord : un filet de neige d\'abord, puis la pierre ; sur la sente, elle blesse. En haut, un plateau.',
  wide: true, w: 200, h: 150,
  setup(s, v) {
    s.x0 = LEDGE.bottom.x - 90;
    s.parts = CLIFF_PARTS.filter(o => o.type === 'cliff' && o.x + o.art.rows[0].length > s.x0 && o.x < s.x0 + 200).map(o => ({ ...o, img: prerender(o.art.rows, v.pal) }));
    s.stone = prerender(FALLING_STONE, v.pal);
  },
  draw(ctx, pal, t, dt, s, v) {
    const dy = v.h - 8 - CLIFF.y;
    for (const o of s.parts) ctx.drawImage(o.img, o.x - s.x0 - o.art.ax, o.y + dy - o.img.height + 1);
    // Il monte, s'arrête quand la neige coule, repart
    const T = 26, k = t % T, along = Math.min(LEDGE.len, k * 10 - (k > 9 ? 12 : 0) * Math.min(1, (k - 9) / 1.2));
    const p = ledgeAt(Math.max(0, along)), moving = k < 9 || k > 10.2;
    drawViking(ctx, pal, moving && along < LEDGE.len ? walkFrame('side', t) : 'side-idle', Math.round(p.x) - s.x0, Math.round(p.y) + dy, { flip: p.ux < 0, clock: t, wind: 0.5 });
    // La pierre, devant lui, quand il s'arrête
    const r = ledgeAt(Math.max(0, along) + 9), rx = Math.round(r.x) - s.x0, top = cliffFoot(Math.round(r.x)) - cliffHeight(Math.round(r.x)) + dy;
    if (k > 8 && k < 9.2) { ctx.fillStyle = pal.s; for (let i = 0; i < 4; i++) ctx.fillRect(rx + ((i * 7 + Math.floor(t * 9)) % 3) - 1, top + ((Math.floor(t * 30) + i * 11) % 18), 1, 1); }
    if (k >= 9.2 && k < 10.4) ctx.drawImage(s.stone, rx - 2, Math.round(top + (k - 9.2) ** 2 * 140) - 3);
  },
});

card('falaise', {
  title: 'Sigrún dans la glace', tag: 'plateau',
  about: 'Sur le plateau, à l\'est de la meute : la sœur de Kári, debout dans un bloc de glace taillé par le vent, le bras levé, une torche éteinte au poing. Quand la torche approche, la glace pleure et elle parle. E « Allumer ta torche à la sienne » : la glace se fend, fond, il ne reste qu\'une flaque ; elle parle encore, et celle qui vient chercher les morts l\'emmène.',
  w: 90, h: 34,
  setup(s, v) { s.frames = Object.fromEntries(Object.entries(ICE_FRAMES).map(([k, r]) => [k, prerender(r, v.pal)])); },
  draw(ctx, pal, t, dt, s) {
    const k = t % 9, ground = 30;
    const key = k < 3 ? 'whole' : k < 4 ? 'crack' : k < 5 ? 'melt1' : k < 6 ? 'melt2' : 'gone';
    ctx.drawImage(s.frames[key], 40, ground - ICE_FRAMES.whole.length + 1);
    drawViking(ctx, pal, k < 2 ? walkFrame('side', t) : 'side-idle', Math.round(20 + Math.min(1, k / 2) * 10), ground, { clock: t });
  },
});

card('falaise', {
  title: 'Dans la grotte', about: 'On y entre par la bouche au pied de la falaise. Il y fait toujours nuit : la torche s\'allume. Une galerie qui serpente, une mare gelée, des stalagmites, des ossements de plus en plus nombreux ; au fond, un roi mort sur son trône, l\'épée sur les genoux. Quand on s\'approche, sa tête tombe et la couronne roule à ses pieds.',
  wide: true, w: CAVE_W, h: CAVE_H,
  setup(s, v) {
    s.room = prerender(CAVE_ROOM, v.pal);
    s.throne = Object.fromEntries(Object.entries(THRONE_FRAMES).map(([k, rows]) => [k, prerender(rows, v.pal)]));
    // Le chemin du viking, de l'entrée au trône
    s.path = [[100, 176], [96, 164], [84, 150], [74, 138], [82, 122], [104, 110], [126, 98], [118, 86], [104, 74], [100, 62]];
  },
  draw(ctx, pal, t, dt, s) {
    ctx.fillStyle = pal.k; ctx.fillRect(0, 0, CAVE_W, CAVE_H);
    ctx.drawImage(s.room, 0, 0);
    const k = t % 16, n = s.path.length - 1, f = Math.min(n, k / 10 * n), i = Math.min(n - 1, Math.floor(f)), u = f - i;
    const x = Math.round(s.path[i][0] + (s.path[i + 1][0] - s.path[i][0]) * u), y = Math.round(s.path[i][1] + (s.path[i + 1][1] - s.path[i][1]) * u);
    const img = s.throne[k > 11 ? 'bowed' : 'seated'];
    ctx.drawImage(img, THRONE.x - Math.floor(img.width / 2), THRONE.y - THRONE_FOOT);
    const dx = s.path[i + 1][0] - s.path[i][0], dy = s.path[i + 1][1] - s.path[i][1];
    const view = f >= n ? 'back' : Math.abs(dx) > Math.abs(dy) ? 'side' : dy < 0 ? 'back' : 'front';
    drawViking(ctx, pal, f >= n ? 'back-idle' : walkFrame(view, t), x, y, { flip: dx < 0, clock: t, wind: 0 });
  },
});

// ══ L'incendie ══
card('incendie', {
  title: 'La maison brûle (chapitre VIII)', about: 'L\'autre mort, on revient à la maison : un clic près du corps, et le viking met le feu au bûcher. Le feu prend dans la pièce (la fumée blesse au bout de quelques secondes : il faut sortir), puis gagne le toit de la porte vers le fond ; la fumée part avec le vent, la nuit s\'ouvre autour. Le toit s\'effondre : une ruine noircie qui fume, la neige fondue autour, et dans les cendres, la boucle du compagnon. On n\'y entre plus. Dessins (placeholders) : dossier « L\'incendie » de l\'atelier.',
  wide: true, w: 240, h: 110, button: 'Rallumer',
  setup(s, v) {
    s.t0 = null;
    // (la maison de l'atelier, et ce que le feu en fait, comme dans le jeu)
    const build = () => {
      const house = designRows('house', HOUSE_ART), b = burnHouse(house);
      s.house = house; s.roof = b.roofFlames; s.ruinFl = b.ruinFlames;
      s.img = { house: prerender(house, v.pal), burning: prerender(designRows('house-burning', b.burning), v.pal), ruin: prerender(designRows('house-ruin', b.ruin), v.pal) };
    };
    build(); designsReady.then(build);
    s.flames = FIRE_FRAMES.map(r => prerender(r, v.pal));
    s.weather = createWeather('bise');
    s.smoke = [];
  },
  draw(ctx, pal, t, dt, s, v) {
    if (s.t0 == null) s.t0 = t;
    // (le feu du labo va trois fois plus vite que celui du jeu)
    const f = ((t - s.t0) * 3) % (FIRE.out + 30), hx = 120 - s.house[0].length / 2, hy = v.h - 8 - s.house.length;
    const key = f >= FIRE.collapse ? 'ruin' : f >= FIRE.spread * 0.6 ? 'burning' : 'house';
    ctx.drawImage(s.img[key], hx, hy);
    const k = Math.floor(t * 9);
    const ruinK = f < FIRE.collapse ? 0 : Math.max(0, 1 - (f - FIRE.collapse) / (FIRE.out - FIRE.collapse));
    const spots = f < FIRE.collapse ? s.roof.slice(0, f < FIRE.roof ? 0 : Math.ceil(s.roof.length * Math.min(1, (f - FIRE.roof + 1) / (FIRE.spread - FIRE.roof)))) : s.ruinFl.slice(0, Math.ceil(s.ruinFl.length * ruinK));
    spots.forEach((p, i) => { const im = s.flames[(k + i * 3) % 4]; ctx.drawImage(im, hx + p.x - 3, hy + p.y - im.height + 1); });
    // La fumée, tramée, que le vent emporte
    const level = f < FIRE.roof ? 0.4 : f < FIRE.collapse ? 1 : 0.2 + 0.8 * ruinK;
    if (spots.length && Math.random() < dt * 9 * level) { const p = spots[Math.floor(Math.random() * spots.length)]; s.smoke.push({ x: hx + p.x, y: hy + p.y - 10, age: 0, life: 3 + Math.random() * 2 }); }
    ctx.fillStyle = pal.b;
    for (const p of s.smoke) {
      p.age += dt; p.y -= 9 * dt; p.x += 6 * dt;
      const q = p.age / p.life, r = 1 + q * 4.5, dens = (1 - q) ** 2 * 0.8;
      for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r * 1.3); x <= r * 1.3; x++) {
        if ((x / 1.3) ** 2 + y * y > r * r) continue;
        const px = Math.round(p.x) + x, py = Math.round(p.y) + y;
        if (dens * 16 > [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][(py & 3) * 4 + (px & 3)] + 0.5) ctx.fillRect(px, py, 1, 1);
      }
    }
    s.smoke = s.smoke.filter(p => p.age < p.life);
    drawViking(ctx, pal, 'side-idle', 40, v.h - 6, { clock: t, wind: 0.4 });
  },
});

// ══ Corbeaux ══
const CROW = {
  sit0: ['.bb.', 'bbbb', '.b..'], sit1: ['....', 'bbb.', '..bb'],
  fly: [['b...b', '.b.b.', '..b..'], ['.....', 'bbbbb', '..b..'], ['..b..', '.bbb.', 'b...b'], ['.....', 'bbbbb', '..b..']],
};
card('corbeaux', {
  title: 'Envol de corbeaux', about: 'Une volée posée près de la piste, avant la forêt. Ils picorent ; quand le viking approche (de plus loin s\'il court), ils s\'envolent l\'un après l\'autre et filent avec le vent.',
  wide: true, w: 200, h: 70,
  setup(s) { s.start = null; },
  draw(ctx, pal, t, dt, s) {
    const period = 7, local = t % period;
    if (!s.birds || local < s.last) {
      s.birds = [...Array(14)].map(() => ({ x: 120 + (Math.random() - 0.5) * 50, y: 56 + (Math.random() - 0.5) * 12, delay: 2.4 + Math.random() * 0.7, vx: 20 + Math.random() * 30, vy: -(26 + Math.random() * 22), ph: Math.random() * 4, flip: Math.random() < 0.5 }));
    }
    s.last = local;
    const hx = Math.round(20 + Math.min(local, 3) * 26);
    drawViking(ctx, pal, local < 3 ? walkFrame('side', t) : 'side-idle', hx, 62, { clock: t, wind: 0.3 });
    for (const b of s.birds) {
      if (local < b.delay) {
        const rows = (t + b.ph) % 1.1 < 0.9 ? CROW.sit0 : CROW.sit1;
        drawRows(ctx, pal, rows, Math.round(b.x), Math.round(b.y) - 3, b.flip);
      } else {
        const k = local - b.delay;
        const x = b.x + b.vx * k, y = b.y + b.vy * k * (1 - 0.15 * k);
        drawRows(ctx, pal, CROW.fly[Math.floor((t + b.ph) * 12) % 4], Math.round(x), Math.round(y) - 3);
      }
    }
  },
});

card('corbeaux', {
  title: 'Les charognards', about: 'Quand le viking s\'éloigne d\'un cadavre, des corbeaux arrivent de loin, un à un, et s\'y posent pour picorer ; s\'il revient, ils s\'envolent.',
  wide: true, w: 200, h: 70,
  setup(s, v) { s.corpse = prerender(CORPSE, v.pal); },
  draw(ctx, pal, t, dt, s) {
    const period = 12, local = t % period, cx = 100, cy = 56;
    ctx.fillStyle = pal.r;
    for (const [x, y] of [[-6, 1], [-3, 2], [2, 1], [5, 2], [8, 1], [-1, 2]]) ctx.fillRect(cx + x, cy + y, 2, 1);
    ctx.drawImage(s.corpse, cx - 7, cy - 6);
    if (!s.birds || local < s.last) {
      s.birds = [...Array(5)].map((_, i) => ({ lx: cx + Math.round((Math.random() - 0.5) * 22), ly: cy + Math.round((Math.random() - 0.5) * 6), sx: 230 + Math.random() * 40, sy: -10 - Math.random() * 20, delay: 0.5 + i * 0.7, ph: Math.random() * 3, vx: 30 + Math.random() * 30 }));
    }
    s.last = local;
    // Le viking s'en va, puis revient (vers la 8e seconde)
    const back = local > 7.5;
    const hx = Math.round(back ? 190 - Math.min(1, (local - 7.5) / 3) * 80 : 120 + Math.min(1, local / 2) * 70);
    drawViking(ctx, pal, (local < 2 || (back && local < 10.5)) ? walkFrame('side', t) : 'side-idle', hx, 60, { clock: t, wind: 0.3, flip: back });
    const scared = back && hx < 150;
    for (const b of s.birds) {
      const k = local - b.delay;
      if (k < 0) continue;
      const arrive = Math.min(1, k / 2.2);
      let x = b.sx + (b.lx - b.sx) * arrive, y = b.sy + (b.ly - b.sy) * (1 - (1 - arrive) * (1 - arrive));
      if (scared) {
        if (!b.flee) b.flee = local;
        const f = local - b.flee;
        x = b.lx - b.vx * f; y = b.ly - 40 * f;
        drawRows(ctx, pal, CROW.fly[Math.floor((t + b.ph) * 12) % 4], Math.round(x), Math.round(y) - 3, true);
      } else if (arrive < 1) drawRows(ctx, pal, CROW.fly[Math.floor((t + b.ph) * 12) % 4], Math.round(x), Math.round(y) - 3, true);
      else drawRows(ctx, pal, (t + b.ph) % 1.1 < 0.9 ? CROW.sit0 : CROW.sit1, Math.round(x), Math.round(y) - 3, b.lx > cx);
    }
    if (local < 1) s.birds.forEach(b => { b.flee = null; });
  },
});

// ══ Ce qu'on voit : les descriptions au clic ══
(function descriptions() {
  const el = document.createElement('article');
  el.className = 'demo wide';
  el.innerHTML = '<h3><span>Les descriptions</span></h3><p>Un clic droit sur n\'importe quoi (le sol aussi), ou un clic sur une chose hors de portée de la lame et hors combat, la décrit dans la bulle de neige des messages : un titre, une phrase tirée au sort mais accrochée à l\'objet (le même rocher dit toujours la même chose). Les personnages disent leur rôle (saga), les reliques à terre leur nom. Le jeu teste le pixel sous le pointeur (`describeAt`, `whatIs` dans game.js) ; les textes sont dans `js/describe.js`.</p><dl class="desc-list"></dl>';
  const list = el.querySelector('.desc-list');
  for (const [kind, d] of Object.entries(DESCRIPTIONS)) {
    const dt = document.createElement('dt'); dt.textContent = `${d.title}  ·  ${kind}`;
    list.append(dt);
    for (const line of d.lines) { const dd = document.createElement('dd'); dd.textContent = line; list.append(dd); }
  }
  document.querySelector('#descriptions .demos').append(el);
})();

// ══ Son : la musique (des fichiers) et les bruitages (synthétisés) ══
(function sounds() {
  const el = document.createElement('article');
  el.className = 'demo wide';
  el.innerHTML = '<h3><span>Musique et bruitages</span></h3><p>La musique : les morceaux de <code>assets/music/</code> (MP3), en playlist, qui s\'enchaînent en fondu de huit secondes (le suivant monte pendant que l\'autre s\'éteint). La forêt noire, les loups et l\'aube ont leur morceau : le jeu y passe en fondu quand on y est (trois secondes de suite), et le laisse finir quand on s\'en va. L\'humeur ne change plus les notes : elle assombrit un peu le son dans la forêt noire, l\'étouffe à l\'intérieur, et le silence d\'une présence ou d\'un chapitre l\'éteint quelques secondes. Les bruitages restent synthétisés (aucun fichier) : le vent qui suit la météo, les corbeaux, l\'épée, les loups.</p><div class="sound-buttons"></div>';
  const box = el.querySelector('.sound-buttons');
  let music = false;
  const add = (label, icon, fn) => {
    const b = document.createElement('button');
    b.className = 'btn-ghost'; b.type = 'button';
    b.innerHTML = `<i class="ti ti-${icon}" aria-hidden="true"></i> <span></span>`;
    b.querySelector('span').textContent = label;
    b.addEventListener('click', () => { audio.unlock(); fn(b); });
    box.append(b);
  };
  audio.setMusic(false);
  add('Musique', 'music', b => { music = !music; audio.setMusic(music); b.querySelector('span').textContent = music ? 'Couper la musique' : 'Musique'; });
  // La playlist (Réglages du jeu : « Morceau ») : chaque morceau, à écouter
  for (const [id, t] of Object.entries(TRACKS)) add(`Morceau : ${t.nom}`, 'playlist', () => { audio.setTrack(id); if (!music) { music = true; audio.setMusic(true); } });
  add('Morceaux enchaînés', 'arrows-shuffle', () => { audio.setTrack('playlist'); if (!music) { music = true; audio.setMusic(true); } });
  let windOn = false, windTimer = null;
  add('Vent (tempête)', 'wind', b => {
    windOn = !windOn;
    clearInterval(windTimer);
    if (windOn) { let t = 0; windTimer = setInterval(() => { t += 0.2; audio.wind(120 + 60 * Math.sin(t / 3), 0.5 + 0.5 * Math.sin(t), false); }, 200); }
    else audio.wind(0, 0);
    b.querySelector('span').textContent = windOn ? 'Couper le vent' : 'Vent (tempête)';
  });
  // L'humeur : le jeu la règle selon le lieu et le danger ; ici, à la main
  for (const [label, icon, m] of [
    ['Humeur : grève', 'sun', { energy: 0.4, dark: 0, muffled: 0, place: null }],
    ['Humeur : forêt noire', 'trees', { energy: 0.22, dark: 0.9, muffled: 0, place: 'foret-noire' }],
    ['Humeur : il approche', 'alert-triangle', { energy: 0.75, dark: 0.2, muffled: 0, place: null }],
    ['Humeur : les loups', 'swords', { energy: 1, dark: 0, muffled: 0, place: 'loups' }],
    ['Humeur : à l\'intérieur', 'home', { energy: 0.15, dark: 0.3, muffled: 1, place: null }],
  ]) add(label, icon, () => { if (!music) { music = true; audio.setMusic(true); } audio.setMood(m); });
  add('Corbeaux', 'feather', () => audio.play('caw', { n: 3 }));
  add('Tonnerre, tout près', 'bolt', () => audio.play('thunder', { near: 1 }));
  add('Tonnerre, au loin', 'cloud-storm', () => audio.play('thunder', { near: 0.1 }));
  add('Coup d\'épée', 'sword', () => audio.play('swing'));
  add('Dans la neige', 'snowflake', () => audio.play('snow'));
  add('Dans la chair', 'droplet', () => audio.play('flesh'));
  add('Le coffre', 'box', () => audio.play('creak'));
  add('Hurlements', 'moon', () => audio.play('howl', { n: 3 }));
  add('Grondement', 'alert-triangle', () => audio.play('growl'));
  add('Morsure', 'bone', () => audio.play('bite'));
  add('Glapissement', 'paw', () => audio.play('yelp'));
  add('Le feu prend', 'flame', () => audio.play('ignite'));
  add('L\'incendie (5 s)', 'flame', () => { let k = 0; const id = setInterval(() => { audio.fire(++k < 25 ? 1 : 0); if (k >= 26) clearInterval(id); }, 200); });
  add('Le toit s\'effondre', 'home-off', () => audio.play('collapse'));
  add('La torche soufflée', 'flame-off', () => audio.play('snuff'));
  add('Froissement d\'ailes', 'feather', () => audio.play('rustle'));
  document.querySelector('#son .demos').append(el);
})();

// ══ Carte de l'île : cliquer pour s'y téléporter ══
(function islandMap() {
  const section = document.querySelector('#carte .demos');
  const el = document.createElement('article');
  el.className = 'demo wide';
  el.dataset.ile = 7;
  el.innerHTML = '<h3><span>Carte de SNO 7, l\'île du roi</span></h3><p>L\'île qu\'on joue. Clique n\'importe où sur l\'île : le jeu s\'ouvre et Kári y apparaît (au point praticable le plus proche). Le carré rouge : là où il se trouve.</p>';
  const canvas = document.createElement('canvas');
  const S = 12, N = WORLD / S;
  canvas.width = N; canvas.height = N;
  canvas.className = 'map';
  el.append(canvas);
  const legend = document.createElement('p');
  legend.className = 'map-legend';
  legend.dataset.old = 'Traces · D barque (E : vers SNO 4) · N champ des morts (Hrólf) · C corbeaux · A arche (Tavé ; T : le temple de Sorne, dessous) · c colonne couchée · s socle en ruine · r arche en ruine · 1 statue brisée (Véla parle) · forêt noire · O bosquet (Hjalti) · G guetteur · B la louve blanche (collet) · 2 grande statue · M maison · F falaise et grotte (le roi) · S sente · P plateau · W les loups · L lac et îlot · trame claire : neige profonde (aux mollets, et plus dense : jusqu\'à la taille)';
  el.append(legend);
  section.append(el);

  // La carte se prépare sur un canevas caché, puis se recopie : jamais de
  // relecture des pixels (getImageData), que bloquent certaines extensions
  // anti-pistage (la carte ne s'affichait plus du tout)
  const view = canvas.getContext('2d');
  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = N; baseCanvas.height = N;
  const ctx = baseCanvas.getContext('2d');
  const img = new ImageData(N, N);
  const put = (i, hex) => { const n = parseInt(hex.slice(1), 16); img.data[i] = n >> 16; img.data[i + 1] = (n >> 8) & 255; img.data[i + 2] = n & 255; img.data[i + 3] = 255; };
  const MID = '#8a96b0', DEEP = '#4a5776';  // forêt, forêt noire (la mer reste nuit)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const wx = x * S + S / 2, wy = y * S + S / 2, i = (y * N + x) * 4;
    if (coast(wx, wy) >= 0) { put(i, NIGHT); continue; }
    const deep = deepForest(wx, wy);
    const f = forestDensity(wx, wy);
    // Forêt : tramée selon sa densité ; forêt noire : pleine
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][(y & 3) * 4 + (x & 3)] / 16;
    // La neige profonde : une trame claire de plus en plus serrée
    const sd = deep > 0.5 || f > 0.25 ? 0 : snowDepth(wx, wy);
    put(i, deep > 0.5 ? DEEP : bayer < f * 0.9 ? MID : sd && bayer < sd * 0.3 ? '#b7c3d6' : SNOW);
  }
  const L = landing();
  // (comme la carte de SNO 4 : les lieux nommés sur la carte, et leur liste dessous)
  const marks = [['La grève', L.shore, L.y, 0], ['Le champ des morts', NECRO_AREA.x + 100, NECRO_AREA.y + 35, -1], ['L\'arche et le temple', ARCH.x, ARCH.y, 1], ['Le lac', LAKE.x, LAKE.y, 1],
    ['La Véla ensevelie', STATUE_BASE.x, STATUE_BASE.y, -1], ['Le bosquet', GROVE_TREE.x, GROVE_TREE.y, -1], ['La louve blanche', HVIT_AT.x, HVIT_AT.y, -1], ['La grande Véla', STATUE2_BASE.x, STATUE2_BASE.y, 1], ['La maison', HOUSE.x, HOUSE.y, 1],
    ['La falaise et la grotte', CAVE.x, CLIFF.y, 1], ['Les loups', WOLF_DEN.x, WOLF_DEN.y, -1], ['Sigrún', SIGRUN_AT.x, SIGRUN_AT.y, 0],
    ...SNO7_CUBES.map(c => [`Le cube ${c.kind}`, c.x, c.y, 1])];
  legend.textContent = marks.map(m => m[0]).join(' · ') + ' · en noir : les traces ; trame claire : la neige profonde (aux mollets, et plus serrée : jusqu\'à la taille)';
  function drawBase() {
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = NIGHT;
    for (const p of trail) ctx.fillRect(Math.floor(p.x / S), Math.floor(p.y / S), 1, 1);
    // La falaise : un trait sombre à son pied
    ctx.fillStyle = NIGHT;
    ctx.fillRect(Math.floor(CLIFF.x0 / S), Math.floor(CLIFF.y / S) - 1, Math.ceil((CLIFF.x1 - CLIFF.x0) / S), 2);
    ctx.font = '500 12px "Grenze Gotisch", serif';
    ctx.textBaseline = 'middle';
    // (le nom au-dessus, au niveau ou en dessous du repère : ils ne se marchent pas dessus)
    for (const [label, x, y, dy] of marks) {
      ctx.fillStyle = NIGHT; ctx.fillRect(x / S - 2, y / S - 2, 5, 5);
      ctx.fillStyle = RED; ctx.fillRect(x / S - 1, y / S - 1, 3, 3);
      const ty = y / S + dy * 9;
      ctx.lineWidth = 3; ctx.strokeStyle = SNOW; ctx.strokeText(label, x / S + 5, ty);
      ctx.fillStyle = NIGHT; ctx.fillText(label, x / S + 5, ty);
    }
  }
  drawBase();
  function drawHere() {
    view.drawImage(baseCanvas, 0, 0);
    let save = {};
    try { save = JSON.parse(localStorage.getItem('kingvi:save')) || {}; } catch { /* rien */ }
    if (save.x == null) return;
    view.fillStyle = RED;
    view.fillRect(Math.round(save.x / S) - 2, Math.round(save.y / S) - 2, 5, 5);
  }
  drawHere();
  document.fonts?.ready.then(() => { drawBase(); drawHere(); });

  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - r.left) / r.width * WORLD), y = Math.round((e.clientY - r.top) / r.height * WORLD);
    if (coast(x, y) >= 0) { toast('C\'est la mer : choisis un point sur l\'île.'); return; }
    let save = {};
    try { save = JSON.parse(localStorage.getItem('kingvi:save')) || {}; } catch { /* rien */ }
    try {
      localStorage.setItem('kingvi:save', JSON.stringify({ ...save, world: WORLD_VERSION, x, y, facing: 'side', flip: false }));
    } catch { toast('Impossible d\'enregistrer la position.'); return; }
    location.href = './';
  });
})();

// ══ Carte de SNO 4 : l'île Carrefour, telle qu'on la joue ; un clic y envoie Kári ══
(function sno4Map() {
  const section = document.querySelector('#carte .demos');
  const el = document.createElement('article');
  el.className = 'demo wide';
  el.dataset.ile = 4;
  el.innerHTML = '<h3><span>Carte de SNO 4, l\'île Carrefour</span></h3><p>L\'île où Kári va en barque (touche E près de la barque de la grève). Clique sur l\'île : le jeu s\'ouvre et Kári y est. En rouge : la barque et les trois tracés à marcher.</p>';
  const canvas = document.createElement('canvas');
  canvas.width = SNO4_W; canvas.height = SNO4_H;
  canvas.className = 'map';
  el.append(canvas);
  const legend = document.createElement('p');
  legend.className = 'map-legend';
  legend.textContent = PLACES_SNO4.map(p => p.nom).join(' · ');
  el.append(legend);
  section.append(el);
  const g = canvas.getContext('2d');
  paintSno4(g, { s: SNOW, b: NIGHT, r: RED });
  for (const p of SNO4_PROPS) drawRows(g, PALETTES.blanc, p.rows, p.at.x - p.ax, p.at.y - p.h + 1);
  g.fillStyle = RED;
  g.fillRect(SNO4_BOAT.x, SNO4_BOAT.y, 30, 10);
  for (const v of VEVE) for (const [dx, dy] of v.nodes) g.fillRect(v.at.x + dx - 1, v.at.y + dy - 1, 3, 3);
  // (les deux cubes sont des accessoires de la scène : déjà dessinés)
  g.font = '500 15px "Grenze Gotisch", serif';
  g.textBaseline = 'middle';
  for (const p of PLACES_SNO4) {
    const x = p.x * SNO4_W, y = p.y * SNO4_H;
    g.lineWidth = 4; g.strokeStyle = SNOW; g.strokeText(p.nom, x + 8, y);
    g.fillStyle = NIGHT; g.fillText(p.nom, x + 8, y);
  }
  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - r.left) / r.width * SNO4_W), y = Math.round((e.clientY - r.top) / r.height * SNO4_H);
    if (!sno4Walkable(x, y)) { toast('On ne peut pas aller là : choisis un point sur la neige ou la banquise.'); return; }
    // (le jeu lit ce rendez-vous à son lancement : il fait la traversée d'un coup)
    try { sessionStorage.setItem('kingvi:goto', JSON.stringify({ world: 'sno4', x, y })); } catch { toast('Impossible de préparer le voyage.'); return; }
    location.href = './';
  });
})();

// ══ L'Archipel des Neuf : une carte d'ensemble, et les sept autres îles ══
(function archipelago() {
  const section = document.querySelector('#carte .demos');
  const C = { snow: SNOW, night: NIGHT, mid: '#8a96b0', deep: '#4a5776', ice: '#b7c3d6', red: RED };
  // Les autres îles, dessinées d'après la saga (islands.js)
  for (const I of ARCHIPEL.filter(i => !i.joue)) {
    const el = document.createElement('article');
    el.className = 'demo wide';
    el.dataset.ile = I.n;
    el.innerHTML = '<h3><span></span></h3><p></p>';
    el.querySelector('span').textContent = `Carte de SNO ${I.n}, ${I.nom}`;
    el.querySelector('p').textContent = `${I.about} Pas encore jouable : dessinée d'après la saga.`;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    canvas.className = 'map';
    el.append(canvas);
    const legend = document.createElement('p');
    legend.className = 'map-legend';
    legend.textContent = I.lieux.map(l => l[0]).join(' · ') + ' · le cube blanc · le cube noir';
    el.append(legend);
    section.append(el);
    // (la police du titre doit être là avant d'écrire les noms)
    const paint = () => paintIsland(canvas.getContext('2d'), I, 512, 512, C);
    paint();
    document.fonts?.ready.then(paint);
  }
  // La carte d'ensemble : les neuf îles, comptées d'est en ouest
  const el = document.createElement('article');
  el.className = 'demo wide';
  el.dataset.ile = 0;
  el.innerHTML = '<h3><span>L\'Archipel des Neuf</span></h3><p>Les neuf îles, posées sur une mer qui gèle à moitié, comptées d\'est en ouest (SNO 1 à l\'est, SNO 9 tout à l\'ouest, derrière les Eaux de la Mort). En rouge, les deux qu\'on joue : SNO 7 et SNO 4.</p>';
  const canvas = document.createElement('canvas');
  canvas.width = 900; canvas.height = 340;
  canvas.className = 'map';
  el.append(canvas);
  section.append(el);
  const g = canvas.getContext('2d');
  const paint = () => {
    g.fillStyle = NIGHT; g.fillRect(0, 0, 900, 340);
    const spots = [[820, 120], [720, 230], [610, 110], [520, 240], [420, 120], [330, 250], [230, 140], [130, 230], [50, 110]];
    ARCHIPEL.forEach((I, k) => {
      const [cx, cy] = spots[k], R = 44;
      const shape = I.forme ? I : { forme: { long: 1.2, angle: k, foret: 0.3, monts: 0.3, banquise: 0.4, ilots: 2 }, graine: 7 + k * 13 };
      for (let y = -R; y < R; y++) for (let x = -R; x < R; x++) {
        const land = islandLand(shape, (x + R) / (2 * R), (y + R) / (2 * R));
        if (land > 0) { g.fillStyle = land < 0.04 ? NIGHT : I.joue ? '#f2d6d2' : SNOW; g.fillRect(cx + x, cy + y, 1, 1); }
      }
      g.font = '500 17px "Grenze Gotisch", serif'; g.textAlign = 'center'; g.textBaseline = 'top';
      g.fillStyle = I.joue ? RED : SNOW;
      g.fillText(`SNO ${I.n}`, cx, cy + R + 2);
    });
    // les Eaux de la Mort, entre SNO 8 et SNO 9
    g.fillStyle = '#0d1424';
    for (let y = 60; y < 300; y++) for (let x = 84; x < 100; x++) if ((x + y) % 2) g.fillRect(x, y, 1, 1);
    g.textAlign = 'left';
  };
  paint();
  document.fonts?.ready.then(paint);
  // L'ordre : l'archipel, puis SNO 1 → 9
  [...section.querySelectorAll('[data-ile]')].sort((a, b) => a.dataset.ile - b.dataset.ile).forEach(n => section.append(n));
})();

// ══ Barque ══
card('barque', {
  title: 'La barque flotte', about: 'D\'après l\'image de référence, échouée sur la grève : elle dodine, roule d\'un bord à l\'autre, l\'écume bat sa coque. Pas de liseré : la coque sombre se pose sur l\'eau.',
  wide: true, w: 200, h: 60,
  setup(s, v) { s.imgs = Object.fromEntries(Object.entries(BOAT_FRAMES).map(([k, rows]) => [k, prerender(rows, v.pal)])); },
  draw(ctx, pal, t, dt, s, v) {
    const shore = 130;
    ctx.fillStyle = pal.b;
    for (let y = 0; y < v.h; y++) ctx.fillRect(0, y, shore + Math.round(Math.sin(y * 0.3) * 2), 1);
    const bx = shore + 6 - (BOAT_W - 2), bob = Math.sin(t * 1.3) > 0.35 ? 1 : 0, by = 24 + bob;
    const roll = Math.sin(t * 0.8 + 1);
    ctx.drawImage(s.imgs[roll > 0.55 ? 'right' : roll < -0.55 ? 'left' : 'still'], bx, by);
    ctx.fillStyle = pal.s;
    for (const e of BOAT_EDGE) {
      if (e.y < BOAT_WATERLINE + 1 || bx + e.x > shore) continue;
      if (Math.sin(t * 3.3 + e.x * 1.3 + e.y * 2.1) > 0.9) ctx.fillRect(bx + e.x, by + e.y, 1, 1);
    }
    drawViking(ctx, pal, 'side-idle', shore + 24, 37, { clock: t, wind: 0.3 });
  },
});

// ══ Accostage : pontons et seconde barque, à choisir ══
// Le décor commun : la mer à gauche, la grève à droite, la barque du viking
function landingScene(ctx, pal, t, s, v, shore) {
  ctx.fillStyle = pal.b;
  for (let y = 0; y < v.h; y++) ctx.fillRect(0, y, shore + Math.round(Math.sin(y * 0.3) * 2), 1);
  const bx = shore + 6 - (BOAT_W - 2), by = 34 + (Math.sin(t * 1.3) > 0.35 ? 1 : 0);
  const roll = Math.sin(t * 0.8 + 1);
  ctx.drawImage(s.boat[roll > 0.55 ? 'right' : roll < -0.55 ? 'left' : 'still'], bx, by);
}
// Le pont, d'après le dessin fourni (assets/pont.png) : des travées de
// planches sur caissons, reliées par des cordes, vues de biais
card('accostage', {
  tag: 'E', title: 'Le pont, d\'après le dessin', about: 'Des travées de planches posées sur des caissons, des poteaux aux angles, des cordes de l\'un à l\'autre ; vu de biais, il file vers le large. Le viking donne l\'échelle. Où le poser : au bout de la grève, pour la barque ? Sur le lac ?',
  wide: true, w: 220, h: 140,
  setup(s, v) { s.img = prerender(RUIN_ART.pont, v.pal); s.weather = createWeather('bise'); },
  draw(ctx, pal, t, dt, s, v) {
    ctx.drawImage(s.img, 20, v.h - s.img.height - 4);
    drawViking(ctx, pal, walkFrame('side', t), 8 + Math.round((t * 10) % (v.w - 16)), v.h - 2, { clock: t, wind: 0.3 });
    s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
    s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
    ctx.globalAlpha = 1;
  },
});
const PONTOONS = [
  ['A', 'Ponton de planches', 'Sur pilotis, planches claires, joints sombres ; la barque vient s\'y ranger.', () => PROPS.jetty(64)],
  ['B', 'Ponton rompu', 'Le même, abandonné : planches arrachées au large, pieux qui penchent.', () => PROPS.brokenJetty(64)],
  ['C', 'Môle de pierres', 'Des pierres entassées, la neige dessus : plus ancien, plus lourd.', () => PROPS.stonePier(58)],
  ['D', 'Pieux d\'amarrage', 'Pas de ponton : trois pieux dans l\'eau, une corde qui pend.', () => PROPS.mooringPosts(52)],
];
for (const [tag, title, about, make] of PONTOONS) {
  card('accostage', {
    tag, title, about, w: 200, h: 80,
    setup(s, v) { s.boat = Object.fromEntries(Object.entries(BOAT_FRAMES).map(([k, rows]) => [k, prerender(rows, v.pal)])); s.img = prerender(make(), v.pal); },
    draw(ctx, pal, t, dt, s, v) {
      const shore = 130;
      ctx.fillStyle = pal.b;
      for (let y = 0; y < v.h; y++) ctx.fillRect(0, y, shore + Math.round(Math.sin(y * 0.3) * 2), 1);
      ctx.drawImage(s.img, shore + 6 - s.img.width, 12);
      const bx = shore + 6 - (BOAT_W - 2), by = 40 + (Math.sin(t * 1.3) > 0.35 ? 1 : 0);
      const roll = Math.sin(t * 0.8 + 1);
      ctx.drawImage(s.boat[roll > 0.55 ? 'right' : roll < -0.55 ? 'left' : 'still'], bx, by);
      drawViking(ctx, pal, 'side-idle', shore + 24, 50, { clock: t, wind: 0.3 });
    },
  });
}
const SECOND_BOATS = [
  ['A', 'Une jumelle, mâtée (dans le jeu)', 'La même barque, vue sous un autre angle, un mât sans voile ; tirée tout entière sur la grève : ils sont arrivés à deux.', v => BOAT2, 'beach'],
  ['B', 'Retournée', 'Quille en l\'air sur la neige, la neige sur le ventre : quelqu\'un ne comptait pas repartir.', v => PROPS.overturned(BOAT_FRAMES.still), 'beach'],
  ['C', 'À demi coulée', 'Au large, seules l\'étrave et la poupe crèvent l\'eau.', v => PROPS.sunken(BOAT_FRAMES.still, BOAT_WATERLINE), 'sea'],
  ['D', 'Une petite barque', 'Celle du lac, plus petite, tirée sur la grève, les rames dedans.', v => PROPS.skiff(ROWBOAT_FRAMES.empty), 'beach'],
];
for (const [tag, title, about, make, where] of SECOND_BOATS) {
  card('accostage', {
    tag, title, about, w: 200, h: 80,
    setup(s, v) { s.boat = Object.fromEntries(Object.entries(BOAT_FRAMES).map(([k, rows]) => [k, prerender(rows, v.pal)])); s.img = prerender(make(v), v.pal); },
    draw(ctx, pal, t, dt, s, v) {
      const shore = 130;
      landingScene(ctx, pal, t, s, v, shore);
      const bob = where === 'sea' && Math.sin(t * 1.1 + 2) > 0.4 ? 1 : 0;
      ctx.drawImage(s.img, where === 'sea' ? 30 : shore + 4, where === 'sea' ? 12 + bob : Math.max(0, 22 - s.img.height));
      drawViking(ctx, pal, 'side-idle', shore + 24, 60, { clock: t, wind: 0.3 });
    },
  });
}

// ══ Jour et nuit ══
const DAY_SPEED = 60;
card('nuit', {
  title: `Jour et nuit (accéléré ×${DAY_SPEED})`,
  about: 'Aube, jour, crépuscule, nuit : 20 minutes calées sur l\'heure réelle (le curseur des Réglages avance ou recule l\'heure du jeu). La nuit, un voile bleu nuit ; à l\'aube et au crépuscule, une lueur rouge rasante.',
  wide: true, w: 200, h: 86,
  setup(s, v) { s.img = prerender(HOUSE_ART, v.pal); s.weather = createWeather('bise'); },
  draw(ctx, pal, t, dt, s, v) {
    const d = daylightAt(t * DAY_SPEED);
    const h = v.h - 8;
    s.weather.update(dt, { x: 0, y: 0, width: v.w, height: h });
    ctx.drawImage(s.img, 70, 74 - HOUSE_H + 1);
    drawViking(ctx, pal, 'side-idle', 40, 76, { clock: t, wind: 0.3 });
    s.weather.draw((x, y, w, hh, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, hh); });
    // Voile de nuit (multiplié) et lueur rasante
    ctx.globalAlpha = d.night * 0.5; ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = NIGHT; ctx.fillRect(0, 0, v.w, h);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = d.dusk * 0.08;
    ctx.fillStyle = pal.r; ctx.fillRect(0, 0, v.w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    // Frise des phases, curseur sur l'instant
    let x = 0;
    for (const [key, dur] of DAY_CYCLE) {
      const w = Math.round(dur / DAY_LENGTH * v.w);
      ctx.fillStyle = pal.b; ctx.globalAlpha = key === 'nuit' ? 0.9 : key === 'jour' ? 0.15 : 0.5;
      ctx.fillRect(x, v.h - 6, w - 1, 6);
      x += w;
    }
    const cur = ((t * DAY_SPEED) % DAY_LENGTH) / DAY_LENGTH * v.w;
    ctx.globalAlpha = 1; ctx.fillStyle = pal.r; ctx.fillRect(Math.round(cur), v.h - 8, 1, 8);
    if (v.key === 'blanc') {
      const label = s.label || (s.label = v.ctx.canvas.closest('.demo').querySelector('h3 span:last-child'));
      const text = `Jour et nuit (accéléré ×${DAY_SPEED}) — ${DAY_LABELS[d.phase].toLowerCase()}`;
      if (label.textContent !== text) label.textContent = text;
    }
  },
});

// ══ Intérieur de la maison ══
card('interieur', {
  title: 'Dans la maison', about: 'On y entre par la porte (en marchant vers elle). Pièce vue de biais, noire tout autour ; un corps au milieu, une flaque de sang, une traînée et des pas ensanglantés jusqu\'à la porte. On ressort par où l\'on est entré ; dehors, les traces qui repartent sont tachées de sang.',
  wide: true, w: 150, h: 100,
  setup(s, v) { s.img = prerender(ROOM, v.pal); },
  draw(ctx, pal, t, dt, s) {
    ctx.drawImage(s.img, 0, 0);
    // Le viking entre, s'approche du corps, s'arrête
    const k = Math.min(1, (t % 10) / 5);
    const x = Math.round(ROOM_ENTRY.x + 24 * k), y = Math.round(ROOM_ENTRY.y - 12 * k);
    drawViking(ctx, pal, k < 1 ? walkFrame('side', t) : 'back-idle', x, y, { clock: t, wind: 0 });
  },
});

card('interieur', {
  title: 'Le temple de Sorne, sous l\'arche', tag: 'la fin de l\'Aube',
  about: 'Sous l\'arche, entre ses piliers, une dalle (à gauche) : Tavé la fait glisser quand on lui donne le sceau de la crypte, et des marches descendent (à droite). En bas, une salle basse et le mur des ans, hérissé de clous, un par hiver ; le dernier, rouge, est planté à l\'envers. E « Arracher le clou » : la fin de l\'Aube, le jour revient sur l\'île.',
  wide: true, w: 150, h: 112,
  setup(s, v) { s.img = prerender(TEMPLE, v.pal); s.slab = prerender(TEMPLE_SLAB, v.pal); s.stairs = prerender(TEMPLE_STAIRS, v.pal); },
  draw(ctx, pal, t, dt, s) {
    ctx.fillStyle = pal.k; ctx.fillRect(0, 0, 150, 112);
    ctx.drawImage(s.img, 0, 0);
    const k = t % 12;
    // le viking descend les marches, va au mur, arrache le clou
    const walk = Math.min(1, k / 5);
    const x = TEMPLE_ENTRY.x, y = Math.round(TEMPLE_ENTRY.y - walk * (TEMPLE_ENTRY.y - NAIL.y - 12));
    if (k < 8) drawRows(ctx, pal, NAIL_ART, NAIL.x, NAIL.y - 2);
    else { ctx.globalAlpha = Math.max(0, 1 - (k - 8)); drawRows(ctx, pal, NAIL_ART, NAIL.x, NAIL.y - 2 + Math.round((k - 8) * 6)); ctx.globalAlpha = 1; }
    drawViking(ctx, pal, walk < 1 ? walkFrame('back', t) : 'back-idle', x, y, { clock: t, wind: 0 });
    ctx.drawImage(s.slab, 4, 100); ctx.drawImage(s.stairs, 132, 100);
  },
});

// ══ Le cube blanc et le cube noir (cubes.js) ══
card('cubes', {
  title: 'Les deux cubes', tag: 'sur chaque île',
  about: 'Les deux seules choses parfaitement droites de l\'archipel : un cube blanc, un cube noir, d\'une matière qu\'on ne connaît pas, posés sur chaque île, toujours loin l\'un de l\'autre. La neige ne tient pas dessus. Ils mesurent sept fois le viking (59 pixels de large, 62 de haut). Sur SNO 7 : le blanc au nord du champ des morts, le noir loin à l\'est de la maison ; sur SNO 4 : au nord-est de la source, et près du fromager.',
  wide: true, w: 200, h: 72,
  setup(s, v) { s.w = prerender(CUBE_WHITE, v.pal); s.b = prerender(CUBE_BLACK, v.pal); },
  draw(ctx, pal, t, dt, s) {
    ctx.drawImage(s.w, 8, 70 - CUBE_WHITE.length + 1);
    ctx.drawImage(s.b, 132, 70 - CUBE_BLACK.length + 1);
    drawViking(ctx, pal, walkFrame('side', t), Math.round(80 + Math.sin(t * 0.5) * 12), 70, { clock: t });
  },
});
card('cubes', {
  title: 'Toucher le cube blanc', tag: 'touche E',
  about: 'Il est tiède, rien n\'y colle. Le toucher referme toutes les blessures, sans qu\'on sente rien (un endroit sûr, avant un combat).',
  wide: true, w: 160, h: 72,
  setup(s, v) { s.w = prerender(CUBE_WHITE, v.pal); },
  draw(ctx, pal, t, dt, s) {
    const k = t % 6;
    ctx.drawImage(s.w, 92, 70 - CUBE_WHITE.length + 1);
    const x = Math.round(14 + Math.min(1, k / 2.5) * 70);
    drawViking(ctx, pal, k < 2.5 ? walkFrame('side', t) : 'side-idle', x, 62, { clock: t });
    // les gouttes de sang derrière lui, puis plus rien
    if (k < 2.5) { ctx.fillStyle = pal.r; for (let i = 0; i < 4; i++) ctx.fillRect(x - 6 - i * 5, 62 - (i % 2), 1, 1); }
  },
});
card('cubes', {
  title: 'Toucher le cube noir', tag: 'touche E',
  about: 'Il ne renvoie aucun reflet, pas même le sien. Qui le touche voit l\'île d\'en haut, un instant : la carte (M) se découvre loin autour du cube ; sur SNO 4, toute l\'île.',
  wide: true, w: 160, h: 72,
  setup(s, v) { s.b = prerender(CUBE_BLACK, v.pal); },
  draw(ctx, pal, t, dt, s) {
    const k = t % 6;
    ctx.drawImage(s.b, 92, 70 - CUBE_BLACK.length + 1);
    drawViking(ctx, pal, k < 2.5 ? walkFrame('side', t) : 'side-idle', Math.round(14 + Math.min(1, k / 2.5) * 70), 62, { clock: t });
    // l'île vue d'en haut : un éclair de carte, tramé
    if (k > 3 && k < 4.2) { ctx.globalAlpha = 0.5; ctx.fillStyle = pal.b; for (let y = 0; y < 72; y++) for (let x = (y % 2); x < 160; x += 2) ctx.fillRect(x, y, 1, 1); ctx.globalAlpha = 1; }
  },
});

// ══ La mer de l'accueil et des traversées (titlesea.js) : générée ══
(function titleSeaCard() {
  const el = document.createElement('article');
  el.className = 'demo wide';
  el.innerHTML = '<h3><span class="tag">accueil, interludes</span><span>La mer de nuit, tirée au sort</span></h3><p>Derrière le titre et pendant les traversées : à chaque ouverture, un nouveau tirage. Le nombre d\'icebergs (deux à sept), leurs formes, leur éloignement et leur vitesse (les plus loin, plus hauts et plus lents ; parfois un tout près ; chacun change de forme en repassant), la houle (nombre de crêtes, vitesse, ampleur), l\'allure de la barque, son roulis, les moutons, le vent et la neige (calme, bise, rafales, tempête avec ses éclairs, tourbillons). Et pendant qu\'on regarde, le temps tourne tout seul, toutes les quarante secondes à deux minutes.</p>';
  const box = document.createElement('div');
  box.style.cssText = 'position:relative;width:100%;height:320px;overflow:hidden;background:#1f2a44';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;image-rendering:pixelated';
  box.append(canvas);
  const b = document.createElement('button');
  b.className = 'btn-ghost'; b.type = 'button';
  b.innerHTML = '<i class="ti ti-refresh" aria-hidden="true"></i> Un autre tirage';
  el.append(box, b);
  document.querySelector('#mer .demos').append(el);
  const css = getComputedStyle(document.documentElement);
  const sea = createTitleSea(canvas, { s: css.getPropertyValue('--game-snow').trim() || SNOW, b: css.getPropertyValue('--game-night').trim() || NIGHT, r: RED, k: NIGHT });
  // (elle ne tourne que quand on la regarde)
  new IntersectionObserver(([e]) => e.isIntersecting && !el.classList.contains('lab-off') ? sea.start() : sea.stop()).observe(el);
  b.addEventListener('click', () => sea.reroll());
})();

// ══ Vagues ══
card('mer', {
  title: 'Les vagues', about: 'Les rouleaux arrivent sur la grève, s\'amincissent, s\'étalent en nappe puis se retirent ; pas tous ensemble le long de la côte. Au large, de rares moutons naissent, filent avec le vent et s\'éteignent.',
  wide: true, w: 220, h: 80,
  setup(s) {
    const shoreX = y => 160 + 7 * Math.sin(y / 13) + 3 * Math.sin(y / 5 + 1);
    s.coast = (x, y) => (shoreX(y) - x) * 0.0007;
    s.sea = createSea(s.coast);
    s.shoreX = shoreX;
  },
  draw(ctx, pal, t, dt, s, v) {
    ctx.fillStyle = pal.b;
    for (let y = 0; y < v.h; y++) ctx.fillRect(0, y, Math.ceil(s.shoreX(y)), 1);
    s.sea.draw({ x: 0, y: 0, w: v.w, h: v.h }, t, (x, y, a) => {
      ctx.globalAlpha = a; ctx.fillStyle = pal.s; ctx.fillRect(x, y, 1, 1);
    });
    ctx.globalAlpha = 1;
    drawViking(ctx, pal, 'side-idle', 190, 44, { clock: t, wind: 0.3 });
  },
});

// ══ Icebergs ══
row('mer', 'Icebergs plats', 'Tabulaires, au large des côtes : plateau de glace, falaise tramée, écume au ras de l\'eau.', makeIceberg, 'Autres icebergs', true);

requestAnimationFrame(loop);

// ── Mise à jour automatique, comme dans le jeu ──
function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = text; el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 3200);
}
startUpdateCheck({ onUpdated: v => toast(`Mis à jour en v${v}`) });

// ══ Chapitres : aux grands moments, un titre s'inscrit à l'écran ══
(function chapters() {
  const el = document.createElement('article');
  el.className = 'demo wide';
  el.innerHTML = '<h3><span>Les chapitres</span></h3><p>Aux grands moments de l\'aventure, un titre s\'inscrit dans le haut de l\'écran, une seule fois par partie : le numéro en petit, le nom en grand (la gothique du titre). En arrivant sur la grève ; dans la plaine des morts ; à l\'orée de la forêt ; dans la forêt noire ; quand la meute attaque ; devant la maison ; quand l\'autre vient au contact ; au pied de la falaise ; dans la grotte. Le lac est un détour : un interlude. Hors des combats, la musique se tait un instant. Clique un chapitre pour le voir.</p><div class="chapter-stage"></div><div class="sound-buttons"></div>';
  const stage = el.querySelector('.chapter-stage'), row = el.querySelector('.sound-buttons');
  for (const ch of CHAPTERS) {
    const b = document.createElement('button');
    b.className = 'btn-ghost'; b.type = 'button';
    b.textContent = `${ch.label} · ${ch.title}`;
    b.addEventListener('click', () => showChapter(stage, ch, { hold: 2200 }));
    row.append(b);
  }
  document.querySelector('#chapitres .demos').append(el);
})();

// ══ Chapitres : le fond derrière le titre, propositions ══
(function chapterStyles() {
  let style = CHAPTER_STYLE, bg = 'rivage', which = 2;
  const el = document.createElement('article');
  el.className = 'demo wide';
  el.innerHTML = '<h3><span>Le fond des chapitres — propositions</span></h3><p>Derrière le titre, l\'ombre ovale actuelle (A) et d\'autres idées, dessinées en pixels du jeu. Choisis une lettre, un fond, un chapitre.</p><div class="chapter-styles letters"></div><p class="chapter-about"></p><div class="chapter-styles backs"></div><div class="chapter-stage"></div><div class="chapter-styles chs"></div>';
  const stage = el.querySelector('.chapter-stage'), about = el.querySelector('.chapter-about');
  const show = () => showChapter(stage, CHAPTERS[which], { hold: 2600, style });
  const group = (sel, items, current, pick) => {
    const box = el.querySelector(sel);
    for (const [key, label] of items) {
      const b = document.createElement('button');
      b.className = 'btn-ghost'; b.type = 'button'; b.textContent = label;
      if (key === current) b.classList.add('on');
      b.addEventListener('click', () => { box.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); pick(key); show(); });
      box.append(b);
    }
  };
  const describe = () => { const s = CHAPTER_STYLES.find(x => x[0] === style); about.textContent = `${s[1]} · ${s[2]} — ${s[3]}`; };
  group('.letters', CHAPTER_STYLES.map(([key, tag, title]) => [key, `${tag} · ${title}`]), style, k => { style = k; describe(); });
  group('.backs', [['rivage', 'Rivage'], ['neige', 'Neige'], ['mer', 'Mer'], ['foret', 'Forêt noire']], bg, k => { bg = k; stage.className = `chapter-stage bg-${k}`; });
  group('.chs', CHAPTERS.map((c, i) => [i, c.title]), which, k => { which = k; });
  describe();
  document.querySelector('#chapitres .demos').append(el);
})();

// ══ Navigation (design system, 8 ter) : les groupes en onglets dans l'en-tête,
// les sujets du groupe dans la marge de gauche (icône, nombre de variantes),
// le sujet ouvert déplie ses variantes A, B, C… ; une seule variante à
// l'écran. Un sujet, c'est une section ; ses variantes, les cartes de sa
// section (`.demos` > enfants ; un titre `.saga-world` y fait un intertitre).
// L'adresse garde le sujet et la lettre (#loups-B) ; flèches du clavier,
// balayage sur téléphone. En téléphone : les sujets en puces sous l'en-tête,
// les variantes dans une barre en bas.
(function navigation() {
  const tabs = [...document.querySelectorAll('.labo-tabs a')];
  const side = document.querySelector('.lab-side');
  const chips = document.querySelector('.lab-chips');
  const bar = document.querySelector('.lab-bar');
  const stage = document.querySelector('.lab-stage');
  const sections = [...document.querySelectorAll('.labo-section')];
  const ICONS = {
    'saga-bible': 'book', 'saga-arbres': 'hierarchy-2', 'saga-personnages': 'users', 'saga-lieux': 'map-pin', 'saga-scenarios': 'messages',
    'saga-phylacteres': 'message-circle', carte: 'map', chapitres: 'bookmark', son: 'volume', barque: 'sailboat', accostage: 'anchor',
    nuit: 'moon', viking: 'walk', cape: 'wind', attaques: 'sword', vent: 'snowflake', arbres: 'tree', rochers: 'mountain', maison: 'home',
    interieur: 'door', mer: 'ripple', arche: 'building-arch', ruines: 'building-castle', statue: 'user', lac: 'droplet', necropole: 'grave', 'pas-des-morts': 'route', descriptions: 'eye',
    bosquet: 'trees', incendie: 'flame', falaise: 'stairs', corbeaux: 'feather', loups: 'paw', cerfs: 'deer', dessins: 'brush',
    'ui-boutons': 'click', 'ui-reglages': 'adjustments', cubes: 'cube',
  };
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const themeOf = id => sections.find(s => s.id === id)?.dataset.theme || (tabs.some(t => t.dataset.theme === id) ? id : null);
  let theme = null, subject = null, index = 0;

  // Les variantes d'un sujet : les cartes de sa section (et ses intertitres)
  function variants(section) {
    const out = [];
    let group = null;
    for (const el of section.querySelector('.demos')?.children || []) {
      if (el.classList.contains('saga-world')) { group = el.textContent; el.dataset.labDivider = '1'; continue; }
      const h = el.querySelector('h3');
      const title = (h ? [...h.childNodes].filter(n => !n.classList?.contains('tag')).map(n => n.textContent).join(' ') : el.querySelector('summary')?.textContent || section.querySelector('h2').textContent).trim();
      out.push({ el, title, group, retained: /retenue|dans le jeu|actuel/i.test(h?.textContent || '') });
    }
    return out;
  }

  function show() {
    const sec = sections.find(s => s.id === subject);
    if (!sec) return;
    const list = variants(sec);
    index = Math.max(0, Math.min(index, list.length - 1));
    for (const s of sections) s.hidden = s !== sec;
    for (const el of sec.querySelector('.demos')?.children || []) el.classList.toggle('lab-off', el.dataset.labDivider === '1' || el !== list[index]?.el);
    renderMenus(list);
    stage.scrollTop = 0;
    const letter = list.length > 1 ? `-${LETTERS[index] || index + 1}` : '';
    const hash = `#${subject}${letter}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    try { localStorage.setItem('kingvi:labo-theme', theme); } catch { /* rien */ }
  }

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  function letterButton(v, i) {
    const b = el('button', `lab-letter${i === index ? ' on' : ''}${v.retained ? ' retained' : ''}`, LETTERS[i] || String(i + 1));
    b.type = 'button'; b.title = v.title;
    b.setAttribute('aria-label', `${LETTERS[i] || i + 1} : ${v.title}`);
    b.addEventListener('click', () => { index = i; show(); });
    return b;
  }
  function renderMenus(list) {
    const subs = sections.filter(s => s.dataset.theme === theme);
    // La marge : les sujets, celui qui est ouvert déplie ses variantes
    side.replaceChildren(...subs.map(s => {
      const item = el('div', `lab-subject${s.id === subject ? ' open' : ''}`);
      const head = el('button', 'lab-subject-head');
      head.type = 'button';
      const n = variants(s).length;
      head.innerHTML = `<i class="ti ti-${ICONS[s.id] || 'point'}" aria-hidden="true"></i><span></span><em>${n}</em>`;
      head.querySelector('span').textContent = s.querySelector('h2').textContent;
      head.addEventListener('click', () => { subject = s.id; index = 0; show(); });
      item.append(head);
      if (s.id === subject) {
        const ul = el('ol', 'lab-variants');
        let group = null;
        list.forEach((v, i) => {
          if (v.group && v.group !== group) { group = v.group; ul.append(el('li', 'lab-group', group)); }
          const li = el('li');
          const b = el('button', `lab-variant${i === index ? ' on' : ''}`);
          b.type = 'button';
          b.append(letterButton(v, i), el('span', null, v.title));
          b.querySelector('.lab-letter').replaceWith(el('b', `lab-letter${i === index ? ' on' : ''}${v.retained ? ' retained' : ''}`, LETTERS[i] || String(i + 1)));
          b.addEventListener('click', () => { index = i; show(); });
          li.append(b);
          ul.append(li);
        });
        item.append(ul);
      }
      return item;
    }));
    // Téléphone : les sujets en puces, les variantes dans la barre du bas
    chips.replaceChildren(...subs.map(s => {
      const a = el('button', `lab-chip${s.id === subject ? ' on' : ''}`, s.querySelector('h2').textContent);
      a.type = 'button';
      a.addEventListener('click', () => { subject = s.id; index = 0; show(); });
      return a;
    }));
    const prev = el('button', 'lab-step'); prev.type = 'button'; prev.setAttribute('aria-label', 'Variante précédente'); prev.innerHTML = '<i class="ti ti-chevron-left" aria-hidden="true"></i>';
    const next = el('button', 'lab-step'); next.type = 'button'; next.setAttribute('aria-label', 'Variante suivante'); next.innerHTML = '<i class="ti ti-chevron-right" aria-hidden="true"></i>';
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    const letters = el('div', 'lab-letters');
    list.forEach((v, i) => letters.append(letterButton(v, i)));
    bar.replaceChildren(prev, letters, next, el('span', 'lab-bar-title', list[index]?.title || ''));
    bar.hidden = list.length < 2;
    for (const t of tabs) {
      const on = t.dataset.theme === theme;
      t.classList.toggle('active', on);
      if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    }
  }
  function step(d) {
    const n = variants(sections.find(s => s.id === subject)).length;
    if (n < 2) return;
    index = (index + d + n) % n;
    show();
  }

  function route() {
    let id = decodeURIComponent(location.hash.slice(1)), letter = null;
    if (!sections.some(s => s.id === id) && !tabs.some(t => t.dataset.theme === id)) {
      const m = id.match(/^(.*)-([A-Z])$/);
      if (m && sections.some(s => s.id === m[1])) { id = m[1]; letter = m[2]; }
    }
    let saved = null;
    try { saved = localStorage.getItem('kingvi:labo-theme'); } catch { /* rien */ }
    theme = themeOf(id) || themeOf(saved) || tabs[0].dataset.theme;
    subject = sections.some(s => s.id === id) ? id : sections.find(s => s.dataset.theme === theme)?.id;
    index = letter ? LETTERS.indexOf(letter) : 0;
    show();
  }
  for (const t of tabs) t.addEventListener('click', e => { e.preventDefault(); location.hash = t.dataset.theme; });
  window.addEventListener('hashchange', route);
  // Les cartes s'ajoutent à mesure (modules) : la marge suit
  for (const s of sections) new MutationObserver(() => { if (s.id === subject) show(); else if (s.dataset.theme === theme) renderMenus(variants(sections.find(x => x.id === subject))); }).observe(s.querySelector('.demos') || s, { childList: true });
  // Flèches gauche et droite : variante précédente, suivante (pas dans un champ, pas sous une fenêtre)
  window.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (document.querySelector('dialog[open]') || e.target.closest?.('input, select, textarea, [contenteditable]')) return;
    e.preventDefault();
    step(e.key === 'ArrowLeft' ? -1 : 1);
  });
  // Balayage horizontal (téléphone)
  let touch = null;
  stage.addEventListener('touchstart', e => { if (e.touches.length === 1) touch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (!touch || e.target.closest('canvas, input, .pxe')) { touch = null; return; }
    const t = e.changedTouches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 40) step(dx < 0 ? 1 : -1);
  }, { passive: true });
  route();
})();
