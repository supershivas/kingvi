/* Labo : toutes les animations, chacune sur fond blanc et sur fond noir (négatif).
   Rendu en canvas 2D, avec les mêmes modules que le jeu (sprites, météo, arbres). */
import { startUpdateCheck } from '../app-update.js';
import {
  vikingFrames, capeGrid, smearPixels, IMPACT, CX, GROUND, CAPE_LEVELS, CAPE_PHASES,
} from './viking.js';
import { createWeather, WEATHER_PRESETS, WEATHER_CYCLE, CYCLE_ABOUT } from './weather.js';
import { makeTree, makeFir, makeDeadTree, makeBoulder, makeCairn } from './trees.js';
import {
  HOUSE_ART, HOUSE_H, rng, WORLD, coast, trail, landing, forestDensity, deepForest,
  HOUSE, STATUE_BASE, STATUE2_BASE, CROWS,
} from './world.js';
import { WOLF_ANIMS, WOLF_W, WOLF_GROUND } from './wolf.js';
import { STAG_ANIMS, DOE_ANIMS, DEER_W, DEER_GROUND } from './deer.js';
import { buildStatue, buildStatueUpright } from './statue.js';

const css = getComputedStyle(document.documentElement);
const SNOW = css.getPropertyValue('--game-snow').trim();
const NIGHT = css.getPropertyValue('--game-night').trim();
const RED = css.getPropertyValue('--accent').trim();
const BLACK = '#0b0d14';
const PALETTES = {
  blanc: { label: 'Fond blanc', bg: SNOW, b: NIGHT, s: SNOW, r: RED },
  noir: { label: 'Fond noir (négatif)', bg: BLACK, b: SNOW, s: BLACK, r: RED },
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

// ══ Attaques ══
const ATTACK_TIMES = [0, 0.26, 0.315, 0.635, 0.795];
function attackDemo(title, view, flip) {
  card('attaques', {
    title, w: 40, h: 36,
    setup(s) { s.dust = []; s.cycle = -1; },
    draw(ctx, pal, t, dt, s) {
      const fx = view === 'side' ? (flip ? 26 : 14) : 18, fy = view === 'back' ? 31 : view === 'front' ? 20 : 24;
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
        if (view === 'side') ctx.fillRect(flip ? ix - 3 : ix - 2, iy, 6, 1); else ctx.fillRect(ix, iy - 2, 1, 5);
      }
      for (const d of s.dust) {
        d.age += dt; d.vy += 60 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
        ctx.globalAlpha = Math.max(0, 0.9 * (1 - d.age / d.life)); ctx.fillStyle = pal.b;
        ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 1);
      }
      s.dust = s.dust.filter(d => d.age < d.life);
      ctx.globalAlpha = 1;
      const frame = i >= 0 && i < 4 ? `${view}-attack-${i}` : `${view}-idle`;
      drawViking(ctx, pal, frame, fx, fy, { flip, clock: t });
    },
  });
}
attackDemo('Vers la droite', 'side', false);
attackDemo('Vers la gauche', 'side', true);
attackDemo('Vers le haut', 'back', false);
attackDemo('Vers le bas', 'front', false);

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
    title: p.label, tag: 'ABCDE'[k], about: p.about, wide: true, w: 240, h: 70,
    setup(s) { s.weather = createWeather(key); },
    draw(ctx, pal, t, dt, s, v) {
      s.weather.update(dt, { x: 0, y: 0, width: v.w, height: v.h });
      drawViking(ctx, pal, 'side-idle', 50, 50, { wind: Math.min(1, s.weather.wind / 140), clock: t });
      s.weather.draw((x, y, w, h, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = pal[c]; ctx.fillRect(x, y, w, h); });
      ctx.globalAlpha = 1;
    },
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

// ══ Rochers et cairns ══
function row(section, title, about, make, button) {
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
    draw(ctx, pal, t, dt, s) {
      for (const it of s.items) ctx.drawImage(it.img, it.x, 40 - it.img.height + 1);
      drawViking(ctx, pal, 'side-idle', 310, 40, { flip: true, wind: 0.3, clock: t });
    },
  });
}
row('rochers', 'Gros rochers', 'Blocs sombres coiffés de neige ; le viking à droite donne l\'échelle.', makeBoulder, 'Autres rochers');
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
card('statue', {
  title: 'Freya, ensevelie, penchée, brisée',
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
  title: 'Freya, debout, au sortir de la forêt',
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

// ══ Carte de l'île : cliquer pour s'y téléporter ══
(function islandMap() {
  const section = document.querySelector('#carte .demos');
  const el = document.createElement('article');
  el.className = 'demo wide';
  el.innerHTML = '<h3><span>Carte de l\'île</span></h3><p>Clique n\'importe où sur l\'île : le jeu s\'ouvre et le viking y apparaît (au point praticable le plus proche). Le point rouge : là où il se trouve.</p>';
  const canvas = document.createElement('canvas');
  const S = 12, N = WORLD / S;
  canvas.width = N; canvas.height = N;
  canvas.className = 'map';
  el.append(canvas);
  const legend = document.createElement('p');
  legend.className = 'map-legend';
  legend.textContent = 'Traces · D drakkar · C corbeaux · 1 statue brisée · forêt noire · 2 grande statue · M maison';
  el.append(legend);
  section.append(el);

  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(N, N);
  const put = (i, hex) => { const n = parseInt(hex.slice(1), 16); img.data[i] = n >> 16; img.data[i + 1] = (n >> 8) & 255; img.data[i + 2] = n & 255; img.data[i + 3] = 255; };
  const MID = '#8a96b0', DEEP = '#4a5776';  // forêt, forêt noire (la mer reste nuit)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const wx = x * S + S / 2, wy = y * S + S / 2, i = (y * N + x) * 4;
    if (coast(wx, wy) >= 0) { put(i, NIGHT); continue; }
    const deep = deepForest(wx, wy);
    const f = forestDensity(wx, wy);
    // Forêt : tramée selon sa densité ; forêt noire : pleine
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][(y & 3) * 4 + (x & 3)] / 16;
    put(i, deep > 0.5 ? DEEP : bayer < f * 0.9 ? MID : SNOW);
  }
  ctx.putImageData(img, 0, 0);
  ctx.fillStyle = NIGHT;
  for (const p of trail) ctx.fillRect(Math.floor(p.x / S), Math.floor(p.y / S), 1, 1);
  const L = landing();
  const marks = [['D', L.shore, L.y], ['C', CROWS.x, CROWS.y], ['1', STATUE_BASE.x, STATUE_BASE.y], ['2', STATUE2_BASE.x, STATUE2_BASE.y], ['M', HOUSE.x, HOUSE.y]];
  ctx.font = '9px "DM Mono", monospace';
  for (const [label, x, y] of marks) {
    ctx.fillStyle = NIGHT; ctx.fillRect(x / S - 2, y / S - 2, 5, 5);
    ctx.fillStyle = SNOW; ctx.fillRect(x / S - 1, y / S - 1, 3, 3);
    ctx.fillStyle = RED; ctx.fillText(label, x / S + 4, y / S - 3);
  }
  const base = ctx.getImageData(0, 0, N, N);
  function drawHere() {
    ctx.putImageData(base, 0, 0);
    let save = {};
    try { save = JSON.parse(localStorage.getItem('kingvi:save')) || {}; } catch { /* rien */ }
    if (save.x == null) return;
    ctx.fillStyle = RED;
    ctx.fillRect(Math.round(save.x / S) - 2, Math.round(save.y / S) - 2, 5, 5);
  }
  drawHere();

  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - r.left) / r.width * WORLD), y = Math.round((e.clientY - r.top) / r.height * WORLD);
    if (coast(x, y) >= 0) { toast('C\'est la mer : choisis un point sur l\'île.'); return; }
    let save = {};
    try { save = JSON.parse(localStorage.getItem('kingvi:save')) || {}; } catch { /* rien */ }
    try {
      localStorage.setItem('kingvi:save', JSON.stringify({ ...save, world: 3, x, y, facing: 'side', flip: false }));
    } catch { toast('Impossible d\'enregistrer la position.'); return; }
    location.href = './';
  });
})();

requestAnimationFrame(loop);

// ── Mise à jour automatique, comme dans le jeu ──
function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = text; el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 3200);
}
startUpdateCheck({ onUpdated: v => toast(`Mis à jour en v${v}`) });
