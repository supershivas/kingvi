import { T } from './tuning.js?v=1.70.2';
/* Vent et neige, partagés entre le jeu et le labo.
   La simulation ne dessine rien elle-même : `draw(rect)` appelle
   rect(x, y, w, h, couleur, opacité) pour chaque pixel ou trait, couleur
   'b' (sombre), 's' (neige) ou 'w' (le blanc pur de l'éclair). Le vent souffle d'ouest en est.

   Chaque flocon clair porte une légère ombre sombre : on le voit sur la neige
   comme sur la mer. Aux grandes vitesses il s'étire en trait. Les tourbillons
   font tourner les flocons qui passent à leur portée. */

export const WEATHER_PRESETS = {
  calme: {
    label: 'Calme',
    about: 'Presque plus de vent : quelques flocons descendent sans hâte.',
    base: 3, max: 9, sharp: 2, flakes: 260, turb: 3, fall: 7, vortexRate: 0, drifts: 6,
  },
  bise: {
    label: 'Bise',
    about: 'Vent régulier, flocons épars, quelques traînées au sol.',
    base: 14, max: 45, sharp: 2, flakes: 900, turb: 5, fall: 10, vortexRate: 0, drifts: 30,
  },
  rafales: {
    label: 'Rafales',
    about: 'Calme relatif puis coups de vent violents ; la neige file en traits.',
    base: 18, max: 170, sharp: 3.5, flakes: 1500, turb: 9, fall: 12, vortexRate: 0.12, drifts: 80,
  },
  tempete: {
    label: 'Tempête',
    about: 'Blizzard continu : neige couchée à l\'horizontale, poudrerie épaisse.',
    base: 95, max: 210, sharp: 1.5, flakes: 2400, turb: 16, fall: 16, vortexRate: 0.2, drifts: 150, lightning: 1 / 150,
  },
  orage: {
    label: 'Orage de neige',
    about: 'Tempête traversée d\'éclairs : un flash ouvre la nuit un instant, puis le tonnerre roule.',
    base: 70, max: 190, sharp: 2, flakes: 2100, turb: 14, fall: 15, vortexRate: 0.15, drifts: 120, lightning: 1 / 11,
  },
  brouillard: {
    label: 'Brouillard',
    about: 'Plus un souffle ; la neige flotte et la vue se referme autour du viking.',
    base: 2, max: 7, sharp: 2, flakes: 420, turb: 2, fall: 4, vortexRate: 0, drifts: 0, fog: 1,
  },
  tourbillons: {
    label: 'Tourbillons',
    about: 'Vent modéré, mais la neige s\'enroule sans cesse en tourbillons.',
    base: 28, max: 75, sharp: 2, flakes: 1600, turb: 7, fall: 8, vortexRate: 0.8, drifts: 50,
  },
};
// v1.68.0 : la pluie, le grésil, la grêle. `precip` : ce qui tombe ('neige' par
// défaut), `wet` : combien le sol est mouillé (0 → 1), `splash` : éclaboussures
// par seconde et par écran. La phase de l'eau suit la température : au-dessus de
// +1 °C la pluie, entre +1 et −1 °C le grésil, au-dessous la neige.
Object.assign(WEATHER_PRESETS, {
  bruine: {
    label: 'Bruine',
    about: 'Un crachin fin que le vent de mer rabat ; la vue se voile à peine.',
    precip: 'pluie', base: 10, max: 30, sharp: 2, flakes: 700, turb: 4, fall: 95, vortexRate: 0, drifts: 0, fog: 0.35, wet: 0.45, splash: 14,
  },
  pluie: {
    label: 'Pluie froide',
    about: 'Des traits fins, penchés par le vent ; le sol les boit en anneaux.',
    precip: 'pluie', base: 22, max: 65, sharp: 2, flakes: 1100, turb: 4, fall: 210, vortexRate: 0, drifts: 0, fog: 0.12, wet: 0.8, splash: 40,
  },
  averse: {
    label: 'Averse',
    about: 'Un rideau serré qui passe par vagues ; tout ruisselle.',
    precip: 'pluie', base: 38, max: 100, sharp: 1.6, flakes: 1800, turb: 6, fall: 250, vortexRate: 0, drifts: 0, fog: 0.2, wet: 1, splash: 80,
  },
  'orage-pluie': {
    label: 'Orage de pluie',
    about: 'La pluie battante, le vent qui tourne, des éclairs qui ouvrent la nuit, le tonnerre qui roule.',
    precip: 'pluie', base: 60, max: 160, sharp: 2, flakes: 2000, turb: 9, fall: 270, vortexRate: 0, drifts: 0, fog: 0.15, wet: 1, splash: 110, lightning: 1 / 9,
  },
  gresil: {
    label: 'Grésil',
    about: 'Pluie et flocons mêlés : ça blanchit en touchant le sol, sans tenir.',
    precip: 'gresil', base: 30, max: 85, sharp: 2, flakes: 1300, turb: 6, fall: 130, vortexRate: 0, drifts: 12, wet: 0.6, splash: 22,
  },
  grele: {
    label: 'Grêle',
    about: 'Des grains durs qui rebondissent sur la neige et la pierre.',
    precip: 'grele', base: 40, max: 115, sharp: 2, flakes: 650, turb: 3, fall: 270, vortexRate: 0, drifts: 0, wet: 0.5, splash: 45,
  },
});
Object.defineProperty(WEATHER_PRESETS['orage-pluie'], 'lightning', { get: () => 1 / T.eclairOrage, enumerable: true });
// (la fréquence des éclairs se règle dans l'atelier : tuning.js)
Object.defineProperty(WEATHER_PRESETS.tempete, 'lightning', { get: () => 1 / T.eclairTempete, enumerable: true });
Object.defineProperty(WEATHER_PRESETS.orage, 'lightning', { get: () => 1 / T.eclairOrage, enumerable: true });

const REF_AREA = 800 * 440;  // surface de référence pour le nombre de flocons

// ── Le temps qui passe : un cycle logique, d'environ 8 minutes ──
// Le vent se lève, forcit en rafales, tourne à la tempête, retombe en
// tourbillons, puis s'apaise. Chaque phase glisse vers la suivante pendant
// BLEND secondes. Le cycle suit l'horloge réelle : il continue d'une session
// à l'autre, sans recommencer au calme à chaque ouverture.
export const WEATHER_CYCLE = [
  ['calme', 50],
  ['brouillard', 60],
  ['bise', 80],
  ['rafales', 75],
  ['tempete', 50],
  ['orage', 50],
  ['rafales', 40],
  ['tourbillons', 50],
  ['bise', 60],
];
const BLEND = 18;
const CYCLE_LENGTH = WEATHER_CYCLE.reduce((n, [, d]) => n + d, 0);
const NUMERIC = ['base', 'max', 'sharp', 'flakes', 'turb', 'fall', 'vortexRate', 'drifts', 'lightning', 'fog', 'wet', 'splash'];

// État du cycle à l'instant `seconds` : paramètres mêlés, phase en cours, suivante.
export function cycleAt(seconds) {
  let t = ((seconds % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH;
  let i = 0;
  while (i < WEATHER_CYCLE.length - 1 && t >= WEATHER_CYCLE[i][1]) { t -= WEATHER_CYCLE[i][1]; i++; }
  const [key, duration] = WEATHER_CYCLE[i];
  const next = WEATHER_CYCLE[(i + 1) % WEATHER_CYCLE.length][0];
  const k = Math.max(0, (t - (duration - BLEND)) / BLEND);
  const ease = k * k * (3 - 2 * k);
  const a = WEATHER_PRESETS[key], b = WEATHER_PRESETS[next];
  const params = {};
  for (const n of NUMERIC) params[n] = (a[n] || 0) + ((b[n] || 0) - (a[n] || 0)) * ease;
  params.precip = (ease > 0.5 ? b : a).precip || 'neige';
  return { params, phase: ease > 0.5 ? next : key, from: key, to: next, blend: ease, t, index: i };
}

export const CYCLE_LABEL = 'Cycle naturel';
export const CYCLE_ABOUT = 'Le temps change de lui-même : calme, brouillard, bise, rafales, tempête, orage, '
  + 'tourbillons, puis l\'accalmie. Un cycle dure environ 9 minutes.';

// presetName : une ambiance fixe, ou 'cycle'. `speed` accélère le cycle (labo).
export function createWeather(presetName = 'cycle', { speed = 1 } = {}) {
  const fixed = name => WEATHER_PRESETS[name] || null;
  let P = fixed(presetName) || cycleAt(Date.now() / 1000 * speed).params;
  const flakes = [], drifts = [], vortices = [], splashes = [];
  let t = Math.random() * 100, t0 = null;
  let view = { x: 0, y: 0, width: 800, height: 440 };

  const w = {
    gust: 0, wind: P.base, preset: presetName, density: 1, phase: fixed(presetName) ? presetName : null,
    // L'éclair : `flash` (1 → 0, la nuit s'ouvre), `bolt` (le trait, un
    // instant), `fog` (0 → 1, la vue se referme). onStrike(near) : le jeu
    // fait gronder le tonnerre.
    flash: 0, bolt: null, fog: 0, onStrike: null, wet: 0, rain: 0, precip: 'neige',
    strike(near = Math.random()) { strike(near); },
    setPreset(name) { w.preset = name; if (fixed(name)) { P = fixed(name); w.phase = name; } },
    update, draw,
    // Un souffle en (x, y) : les flocons proches sont chassés vers l'extérieur
    blast(x, y, R, force) {
      for (const f of flakes) {
        const dx = f.x - x, dy = (f.y - y) / 0.6, d = Math.hypot(dx, dy);
        if (d > R || d < 0.5) continue;
        const k = force * (1 - d / R);
        f.vx += dx / d * k; f.vy += dy / d * k * 0.6;
      }
    },
  };
  const followCycle = () => {
    if (fixed(w.preset)) return;
    const c = cycleAt(Date.now() / 1000 * speed);
    P = c.params;
    w.phase = c.phase;
    w.cycle = c;
  };
  followCycle();

  function spawnFlake(f, where) {
    const v = view;
    if (where === 'left') { f.x = v.x - 6 - Math.random() * 20; f.y = v.y + Math.random() * v.height; }
    else if (where === 'top') { f.x = v.x - 40 + Math.random() * (v.width + 40); f.y = v.y - 6; }
    else { f.x = v.x + Math.random() * v.width; f.y = v.y + Math.random() * v.height; }
    f.z = Math.random();                 // proche (1) ou lointain (0)
    f.phase = Math.random() * 6.28;
    f.k = Math.random();                 // (grésil : pluie ou flocon)
    f.vx = w.wind * (0.4 + 0.8 * f.z); f.vy = P.fall;
    return f;
  }

  function spawnDrift(d, anywhere) {
    const v = view;
    d.len = 6 + Math.floor(Math.random() * 22);
    d.x = anywhere ? v.x + Math.random() * v.width : v.x - Math.random() * 60;
    d.y = v.y + Math.random() * v.height;
    d.speed = 1.3 + Math.random() * 1.2;
    d.phase = Math.random() * 6.28;
    d.alpha = 0.06 + Math.random() * 0.14;
    return d;
  }

  // Force du vent : une somme de sinus lents, relevée à la puissance `sharp`
  // pour des rafales plus ou moins soudaines.
  function gustAt(time) {
    const s = (Math.sin(time / 5.3) + 0.5 * Math.sin(time / 2.1 + 1) + 0.35 * Math.sin(time * 1.7 + 2) + 1.85) / 3.7;
    return Math.pow(Math.max(0, Math.min(1, s)), P.sharp);
  }

  // Un éclair : deux flashs rapprochés, et parfois le trait de la foudre qui
  // tombe dans la vue (`near` : 1 tout près, 0 au loin)
  function strike(near) {
    w.flash = 0.55 + 0.45 * near;
    w.reflash = 0.09 + Math.random() * 0.08;
    if (near > 0.55) {
      const v = view, x = v.x + v.width * (0.15 + Math.random() * 0.7), y = v.y + v.height * (0.35 + Math.random() * 0.5);
      const pts = [];
      let px = x + (Math.random() - 0.5) * 60, py = v.y - 4;
      while (py < y) { pts.push([Math.round(px), Math.round(py)]); py += 2 + Math.random() * 5; px += (x - px) * 0.12 + (Math.random() - 0.5) * 9; }
      pts.push([Math.round(x), Math.round(y)]);
      w.bolt = { pts, life: 0.22, x: Math.round(x), y: Math.round(y) };
    }
    w.onStrike?.(near, w.bolt);
  }

  function update(dt, v) {
    dt = Math.min(dt, 0.05);
    // L'éclair s'éteint, se rallume une fois, s'éteint
    if (w.reflash > 0) { w.reflash -= dt; if (w.reflash <= 0) w.flash = Math.max(w.flash, 0.7); }
    w.flash = Math.max(0, w.flash - dt * 2.6);
    if (w.bolt && (w.bolt.life -= dt) <= 0) w.bolt = null;
    w.fog += ((P.fog || 0) - w.fog) * Math.min(1, dt * 0.5);
    if (P.lightning && Math.random() < P.lightning * dt) strike(Math.random());
    // La vue a sauté (arrivée, réveil, téléportation) : la neige se répand
    // partout dans la nouvelle vue, au lieu de revenir par les bords
    if (Math.abs(v.x - view.x) > v.width / 2 || Math.abs(v.y - view.y) > v.height / 2) {
      view = v;
      for (const f of flakes) spawnFlake(f, 'anywhere');
      for (const d of drifts) spawnDrift(d, true);
    }
    view = v;
    t += dt;
    followCycle();
    w.precip = P.precip || 'neige';
    w.wet += ((P.wet || 0) - w.wet) * Math.min(1, dt * 0.15);          // (le sol met du temps à mouiller, et à sécher)
    w.rain += (((w.precip === 'neige') ? 0 : Math.min(1, (P.flakes || 0) / 1800)) - w.rain) * Math.min(1, dt * 0.6);
    w.gust = gustAt(t);
    w.wind = P.base + (P.max - P.base) * w.gust;

    // Autant de flocons par pixel du monde, mais plafonnés quand on dézoome
    // (au-delà, la densité baisse un peu : ça ne se voit pas, et ça coûte cher)
    const area = Math.min(1.8, (v.width * v.height) / REF_AREA);
    // Au lancement, la neige s'installe en deux secondes (pas d'averse d'un coup)
    const ramp = Math.min(1, t0 === null ? 0 : (t - t0) / 2);
    if (t0 === null) t0 = t;
    const wanted = Math.round(P.flakes * area * ramp * w.density);
    while (flakes.length < wanted) flakes.push(spawnFlake({}, 'anywhere'));
    flakes.length = Math.min(flakes.length, wanted);
    const wantedDrifts = Math.round(P.drifts * area);
    while (drifts.length < wantedDrifts) drifts.push(spawnDrift({}, true));
    drifts.length = Math.min(drifts.length, wantedDrifts);

    // Tourbillons : ils naissent, enflent, dérivent avec le vent et meurent
    if (Math.random() < P.vortexRate * dt) {
      vortices.push({
        x: v.x + Math.random() * v.width, y: v.y + Math.random() * v.height,
        r: 18 + Math.random() * 34, s: 50 + Math.random() * 90,
        spin: Math.random() < 0.5 ? -1 : 1, life: 0, span: 2.5 + Math.random() * 3,
      });
    }
    for (let i = vortices.length - 1; i >= 0; i--) {
      const o = vortices[i];
      o.life += dt;
      o.x += w.wind * 0.55 * dt;
      o.k = Math.sin(Math.PI * Math.min(1, o.life / o.span));
      if (o.life > o.span) vortices.splice(i, 1);
    }

    for (const f of flakes) {
      const kind = kindOf(f);
      // (la pluie tombe presque droit, penchée par le vent ; la neige flotte)
      const slant = kind === 'neige' ? 1 : 0.55;
      const fall = kind === 'neige' && w.precip === 'gresil' ? 12 : P.fall;
      let tx = w.wind * (0.4 + 0.8 * f.z) * slant + Math.sin(f.y * 0.05 + t * 1.3 + f.phase) * P.turb * (kind === 'neige' ? 1 : 0.3);
      let ty = fall * (kind === 'neige' ? 0.5 + f.z : 0.8 + 0.4 * f.z) + Math.cos(f.x * 0.04 + t * 1.1 + f.phase) * P.turb * 0.7 * (kind === 'neige' ? 1 : 0.2);
      for (const o of vortices) {
        const dx = f.x - o.x, dy = f.y - o.y, d = Math.hypot(dx, dy);
        if (d > o.r || d < 0.5) continue;
        const k = o.s * o.k * (1 - d / o.r);
        tx += (-dy / d) * k * o.spin - (dx / d) * k * 0.25;
        ty += (dx / d) * k * o.spin - (dy / d) * k * 0.25;
      }
      // Inertie : le flocon rejoint la vitesse voulue sans à-coups
      const a = Math.min(1, dt * (kind === 'neige' ? 4 : 9));
      f.vx += (tx - f.vx) * a;
      f.vy += (ty - f.vy) * a;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.x > v.x + v.width + 8) spawnFlake(f, Math.random() < 0.8 ? 'left' : 'top');
      else if (f.y > v.y + v.height + 8) spawnFlake(f, 'top');
      else if (f.x < v.x - 80 || f.y < v.y - 80) spawnFlake(f, 'anywhere');
    }

    for (const d of drifts) {
      d.x += w.wind * d.speed * dt;
      if (d.x - d.len > v.x + v.width) spawnDrift(d, false);
      else if (d.x < v.x - 120 || d.y < v.y - 20 || d.y > v.y + v.height + 20) spawnDrift(d, true);
    }

    // Les éclaboussures : là où la pluie touche le sol, au hasard dans la vue
    const per = (P.splash || 0) * area * w.density * ramp;
    let n = per * dt; n = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
    if (w.precip === 'neige') n = 0;
    for (let i = 0; i < n && splashes.length < 220; i++) {
      splashes.push({ x: v.x + Math.random() * v.width, y: v.y + Math.random() * v.height, age: 0, hop: 1 + Math.random() * 2.5 });
    }
    for (let i = splashes.length - 1; i >= 0; i--) if ((splashes[i].age += dt) > 0.32) splashes.splice(i, 1);
  }
  // Ce qu'un flocon est : de la neige, de la pluie, un grain de grêle
  function kindOf(f) {
    const p = P.precip || 'neige';
    if (p === 'gresil') return f.k < 0.55 ? 'pluie' : 'neige';
    return p;
  }

  // Une goutte : un trait fin couché dans le sens de sa chute, clair, avec
  // une ombre sombre d'un pixel (visible sur la neige comme sur la nuit)
  function drawDrop(f) {
    const sp = Math.hypot(f.vx, f.vy) || 1, ux = f.vx / sp, uy = f.vy / sp;
    const len = 2 + Math.round(f.z * 3 + Math.min(2, sp / 160));
    const light = 0.55 + 0.4 * f.z;
    for (let i = 0; i < len; i++) {
      const px = Math.round(f.x - ux * i * 1.2), py = Math.round(f.y - uy * i * 1.2);
      const fade = 1 - i / (len + 1);
      rect2(px + 1, py, 1, 1, 'b', 0.6 * fade);
      rect2(px, py, 1, 1, 's', light * fade);
    }
  }
  // Un grain de grêle : court, dur, deux pixels de près
  function drawHail(f) {
    const size = f.z > 0.6 ? 2 : 1, x = Math.round(f.x), y = Math.round(f.y);
    rect2(x + 1, y + 1, size, size, 'b', 0.4);
    rect2(x, y, size, size, 's', 0.85);
    rect2(Math.round(f.x - f.vx * 0.012), Math.round(f.y - f.vy * 0.012), 1, 1, 's', 0.4);
  }
  let rect2 = () => {};
  function draw(rect) {
    rect2 = rect;
    // La foudre : un trait blanc pur (couleur 'w', la seule hors des trois du
    // jeu, voulue par Jérôme), cerné de nuit, qui se ramifie un peu
    if (w.bolt) {
      const pts = w.bolt.pts;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let k = 0; k <= n; k++) {
          const x = Math.round(x0 + (x1 - x0) * k / (n || 1)), y = Math.round(y0 + (y1 - y0) * k / (n || 1));
          rect(x + 1, y, 1, 1, 'b', 0.8);
          rect(x, y, 1, 1, 'w', 1);
        }
        if (i % 7 === 3) rect(x1 + (i % 2 ? 2 : -2), y1 + 1, 1, 2, 'w', 0.8);
      }
    }
    // Poudrerie : serpents de neige soufflée au ras du sol
    const strength = 0.2 + 1.4 * w.gust + (P.base > 60 ? 0.6 : 0);
    for (const d of drifts) {
      for (let i = 0; i < d.len; i++) {
        const px = Math.round(d.x - i);
        const py = Math.round(d.y + Math.sin((d.x - i) * 0.12 + d.phase + t * 3) * 1.5);
        rect(px, py, 1, 1, 'b', d.alpha * strength * (1 - i / d.len));
      }
    }
    // Flocons : ombre, puis flocon ; traîné quand il file
    for (const f of flakes) {
      const kind = kindOf(f);
      if (kind === 'pluie') { drawDrop(f); continue; }
      if (kind === 'grele') { drawHail(f); continue; }
      const sp = Math.hypot(f.vx, f.vy);
      const len = Math.max(1, Math.min(5, Math.round(sp / 40)));
      const size = f.z > 0.85 ? 2 : 1;
      const ux = f.vx / (sp || 1), uy = f.vy / (sp || 1);
      const x = Math.round(f.x), y = Math.round(f.y);
      const shade = 0.3 + 0.25 * f.z, light = 0.75 + 0.25 * f.z;
      if (len > 1 && Math.abs(uy) < 0.4) {
        // Traînée presque horizontale : un seul trait, pour rester fluide
        rect(x - len + 2, y + 1, len, size, 'b', shade * 0.8);
        rect(x - len + 1, y, len, size, 's', light * 0.85);
      } else {
        for (let i = 0; i < len; i++) {
          const px = Math.round(f.x - ux * i), py = Math.round(f.y - uy * i);
          const fade = 1 - i / (len + 1);
          rect(px + 1, py + 1, size, size, 'b', shade * fade);
          rect(px, py, size, size, 's', light * fade);
        }
      }
    }
    // Les éclaboussures : un anneau qui s'ouvre (pluie), un grain qui rebondit (grêle)
    for (const sp of splashes) {
      const k = sp.age / 0.32, x = Math.round(sp.x), y = Math.round(sp.y), a = 0.55 * (1 - k);
      if (w.precip === 'grele') {
        const h = Math.round(Math.sin(Math.PI * k) * sp.hop * 2);
        rect(x, y - h, 1, 1, 's', 0.9 * (1 - k * 0.5));
      } else if (k < 0.34) rect(x, y, 1, 1, 's', a + 0.2);
      else {
        const r = k < 0.67 ? 1 : 2;
        rect(x - r, y, 1, 1, 's', a); rect(x + r, y, 1, 1, 's', a);
        if (r === 1) rect(x, y - 1, 1, 1, 's', a * 0.6);
      }
    }
  }

  return w;
}
