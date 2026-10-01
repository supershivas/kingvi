/* Vent et neige, partagés entre le jeu et le labo.
   La simulation ne dessine rien elle-même : `draw(rect)` appelle
   rect(x, y, w, h, couleur, opacité) pour chaque pixel ou trait, couleur
   'b' (sombre) ou 's' (neige). Le vent souffle d'ouest en est.

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
    base: 95, max: 210, sharp: 1.5, flakes: 2400, turb: 16, fall: 16, vortexRate: 0.2, drifts: 150,
  },
  tourbillons: {
    label: 'Tourbillons',
    about: 'Vent modéré, mais la neige s\'enroule sans cesse en tourbillons.',
    base: 28, max: 75, sharp: 2, flakes: 1600, turb: 7, fall: 8, vortexRate: 0.8, drifts: 50,
  },
};

const REF_AREA = 800 * 440;  // surface de référence pour le nombre de flocons

// ── Le temps qui passe : un cycle logique, d'environ 8 minutes ──
// Le vent se lève, forcit en rafales, tourne à la tempête, retombe en
// tourbillons, puis s'apaise. Chaque phase glisse vers la suivante pendant
// BLEND secondes. Le cycle suit l'horloge réelle : il continue d'une session
// à l'autre, sans recommencer au calme à chaque ouverture.
export const WEATHER_CYCLE = [
  ['calme', 70],
  ['bise', 80],
  ['rafales', 75],
  ['tempete', 70],
  ['rafales', 40],
  ['tourbillons', 50],
  ['bise', 60],
];
const BLEND = 18;
const CYCLE_LENGTH = WEATHER_CYCLE.reduce((n, [, d]) => n + d, 0);
const NUMERIC = ['base', 'max', 'sharp', 'flakes', 'turb', 'fall', 'vortexRate', 'drifts'];

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
  for (const n of NUMERIC) params[n] = a[n] + (b[n] - a[n]) * ease;
  return { params, phase: ease > 0.5 ? next : key, from: key, to: next, blend: ease, t, index: i };
}

export const CYCLE_LABEL = 'Cycle naturel';
export const CYCLE_ABOUT = 'Le temps change de lui-même : calme, bise, rafales, tempête, tourbillons, '
  + 'puis l\'accalmie. Un cycle dure environ 8 minutes.';

// presetName : une ambiance fixe, ou 'cycle'. `speed` accélère le cycle (labo).
export function createWeather(presetName = 'cycle', { speed = 1 } = {}) {
  const fixed = name => WEATHER_PRESETS[name] || null;
  let P = fixed(presetName) || cycleAt(Date.now() / 1000 * speed).params;
  const flakes = [], drifts = [], vortices = [];
  let t = Math.random() * 100, t0 = null;
  let view = { x: 0, y: 0, width: 800, height: 440 };

  const w = {
    gust: 0, wind: P.base, preset: presetName, density: 1, phase: fixed(presetName) ? presetName : null,
    setPreset(name) { w.preset = name; if (fixed(name)) { P = fixed(name); w.phase = name; } },
    update, draw,
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

  function update(dt, v) {
    dt = Math.min(dt, 0.05);
    view = v;
    t += dt;
    followCycle();
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
      let tx = w.wind * (0.4 + 0.8 * f.z) + Math.sin(f.y * 0.05 + t * 1.3 + f.phase) * P.turb;
      let ty = P.fall * (0.5 + f.z) + Math.cos(f.x * 0.04 + t * 1.1 + f.phase) * P.turb * 0.7;
      for (const o of vortices) {
        const dx = f.x - o.x, dy = f.y - o.y, d = Math.hypot(dx, dy);
        if (d > o.r || d < 0.5) continue;
        const k = o.s * o.k * (1 - d / o.r);
        tx += (-dy / d) * k * o.spin - (dx / d) * k * 0.25;
        ty += (dx / d) * k * o.spin - (dy / d) * k * 0.25;
      }
      // Inertie : le flocon rejoint la vitesse voulue sans à-coups
      const a = Math.min(1, dt * 4);
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
  }

  function draw(rect) {
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
  }

  return w;
}
