/* Le son (Web Audio). La musique (v1.56.0) : des morceaux enregistrés
   (`assets/music/`, MP3), joués l'un après l'autre en fondu enchaîné ; les
   bruitages restent synthétisés : le vent (qui suit la météo du jeu), les
   corbeaux, l'épée, les loups.
   Le navigateur n'autorise le son qu'après un geste du joueur : `unlock()`
   est appelé au premier clic ou à la première touche. */

// ── La playlist : les fichiers de `assets/music/`. `lieu` : le morceau que le
// jeu préfère à un endroit (la forêt noire, les loups) ; on y passe en fondu,
// et on le laisse finir quand on s'en va ──
export const TRACKS = {
  'spring-reverb': { nom: 'Spring Reverb', file: 'Spring Reverb.mp3', about: 'Planant : des échos qui ruissellent.' },
  'foret-noire': { nom: 'La Forêt Noire', file: 'La Forêt Noire.mp3', about: 'Sourd et sombre ; il vient de lui-même sous les arbres noirs.', lieu: 'foret-noire' },
  'breaks': { nom: 'Abstract Breaks', file: 'Abstract Breaks.mp3', about: 'Des cassures de rythme, au loin.' },
  'aube': { nom: 'L\'aube', file: 'L\'aube.mp3', about: 'Le plus lumineux ; il vient à la fin, quand la nuit pâlit.', lieu: 'aube' },
  'breaks-2': { nom: 'Abstract Breaks II', file: 'Abstract Breaks II.mp3', about: 'La suite, plus nue.' },
  'loups': { nom: 'The wolves', file: 'The wolves II.mp3', about: 'Tendu ; il vient quand la meute est là.', lieu: 'loups' },
};
const TRACK_ORDER = Object.keys(TRACKS);
const XFADE = 8;                                    // le fondu enchaîné, en secondes
const TRACK_GAIN = 0.75;
let choice = 'playlist', current = null;

let ctx = null, master, musicBus, duckBus, musicFilter, sfxBus, reverb, noise;
// L'humeur voulue par le jeu (0 → 1) et celle qu'on entend, qui la rejoint
// en douceur : énergie (du silence au combat), ombre, étouffement
const mood = { energy: 0.35, dark: 0, muffled: 0 };
const heard = { energy: 0.35, dark: 0, muffled: 0 };
let duckUntil = 0;
// Les niveaux (0 → 1), réglés par le joueur ; le vent a le sien
const vol = { music: 0.7, sfx: 0.8, wind: 0.35 };
let windBus;
let fireGain = null, fireFilter;                    // l'incendie : un grondement, des crépitements
let timer = null;

function makeNoise() {
  const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// Une salle immense : réponse impulsionnelle de bruit qui s'éteint en 4 s
function makeReverb() {
  const len = ctx.sampleRate * 4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  noise = makeNoise();
  master = ctx.createDynamicsCompressor();
  master.threshold.value = -18; master.ratio.value = 3;
  const out = ctx.createGain(); out.gain.value = 1.5;
  master.connect(out).connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = 0.8 * vol.music;
  // Le filtre de l'humeur : il assombrit la musique dans la forêt noire et
  // l'étouffe à l'intérieur
  musicFilter = ctx.createBiquadFilter(); musicFilter.type = 'lowpass'; musicFilter.frequency.value = 6000; musicFilter.Q.value = 0.7;
  // (les platines → le silence d'une présence → le volume → le filtre)
  duckBus = ctx.createGain(); duckBus.connect(musicBus);
  musicBus.connect(musicFilter).connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = vol.sfx; sfxBus.connect(master);
  windBus = ctx.createGain(); windBus.gain.value = vol.wind; windBus.connect(master);
  // La réverbération des bruitages (une salle immense)
  reverb = makeReverb();
  const revOut = ctx.createGain(); revOut.gain.value = 0.5;
  reverb.connect(revOut).connect(sfxBus);
  buildWind();
}

// ── Le vent (v1.53.4 : plus léger, et vivant) : trois couches de bruit
// filtré qui respirent chacune à leur rythme, même quand la météo ne change
// pas : un souffle grave qui enfle et retombe et passe d'une oreille à
// l'autre, un air aigu et léger, et deux sifflements qui naissent, glissent
// et s'éteignent, plus souvent quand ça souffle fort ──
let windLayers = null;
function buildWind() {
  const layer = (rate, type, freq, q) => {
    const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true; src.playbackRate.value = rate;
    const filter = ctx.createBiquadFilter(); filter.type = type; filter.frequency.value = freq; filter.Q.value = q;
    const gain = ctx.createGain(); gain.gain.value = 0;
    const pan = ctx.createStereoPanner();
    src.connect(filter).connect(gain).connect(pan).connect(windBus);
    src.start(0, Math.random() * 2);
    return { filter, gain, pan };
  };
  windLayers = {
    body: layer(1, 'bandpass', 400, 0.7),
    air: layer(1.3, 'highpass', 3200, 0.5),
    whistles: [layer(0.7, 'bandpass', 1300, 14), layer(0.85, 'bandpass', 1900, 18)],
    // (chacun ses phases : la même météo ne sonne jamais deux fois pareil)
    phase: Array.from({ length: 8 }, () => Math.random() * 100),
  };
}

// ── Musique : un séquenceur à 16 pas, par phrases de 16 mesures ──
function envGain(t, peak, attack, decay, dest) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(dest);
  return g;
}

// L'humeur entendue rejoint la voulue : vite quand le danger monte, lentement
// quand il retombe ; le filtre suit
function followMood() {
  const up = mood.energy > heard.energy;
  // (appelé toutes les 25 ms : ~1,5 s pour monter, ~6 s pour redescendre)
  heard.energy += (mood.energy - heard.energy) * (up ? 0.017 : 0.004);
  heard.dark += (mood.dark - heard.dark) * 0.006;
  heard.muffled += (mood.muffled - heard.muffled) * 0.03;
  // (des morceaux enregistrés : le filtre les assombrit à peine, et les étouffe dedans)
  const cut = 900 + 15000 * (1 - 0.5 * heard.dark) * (1 - 0.88 * heard.muffled) * (0.75 + 0.25 * heard.energy);
  musicFilter.frequency.setTargetAtTime(cut, ctx.currentTime, 0.3);
}

// ── Le lecteur : deux platines, l'une qui s'éteint quand l'autre monte ──
let deck = null;                                    // { id, el, gain, started }
let placeWanted = null, placeSince = 0, hushed = false;
function startTrack(id) {
  if (!ctx || !TRACKS[id]) return;
  const t = ctx.currentTime, old = deck;
  const el = new Audio(`assets/music/${encodeURIComponent(TRACKS[id].file)}`);
  el.preload = 'auto';
  const gain = ctx.createGain(); gain.gain.value = 0;
  ctx.createMediaElementSource(el).connect(gain).connect(duckBus);
  // (le premier morceau monte plus vite : on n'attend pas huit secondes de silence)
  const fade = old ? XFADE : 3;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(TRACK_GAIN, t + fade);
  el.play().catch(() => {});
  deck = { id, el, gain, started: t };
  current = id;
  if (old) {
    old.fading = true;
    old.gain.gain.cancelScheduledValues(t);
    old.gain.gain.setValueAtTime(old.gain.gain.value, t);
    old.gain.gain.linearRampToValueAtTime(0.0001, t + XFADE);
    setTimeout(() => { old.el.pause(); old.el.removeAttribute('src'); old.el.load(); old.gain.disconnect(); }, XFADE * 1000 + 300);
  }
}
// Le suivant : dans l'ordre de la playlist, sans les morceaux de lieu (ils
// viennent quand on y est)
function nextTrack() {
  if (choice !== 'playlist') return choice;
  const pool = TRACK_ORDER.filter(id => !TRACKS[id].lieu);
  return pool[(pool.indexOf(current) + 1) % pool.length];
}
function scheduler() {
  followMood();
  if (!deck) { startTrack(choice === 'playlist' ? TRACK_ORDER[0] : choice); return; }
  const t = ctx.currentTime, el = deck.el;
  // Un silence (une présence, un chapitre) : la musique retient son souffle
  const hush = t < duckUntil;
  if (hush !== hushed) { hushed = hush; duckBus.gain.setTargetAtTime(hush ? 0.0001 : 1, t, hush ? 0.35 : 1.2); }
  // Un lieu qui a son morceau (stable depuis 3 s) : on y passe en fondu
  const place = mood.place || null;
  if (place !== placeWanted) { placeWanted = place; placeSince = t; }
  if (choice === 'playlist' && place && t - placeSince > 3 && TRACKS[current]?.lieu !== place && t - deck.started > XFADE + 2) {
    const id = TRACK_ORDER.find(k => TRACKS[k].lieu === place);
    if (id) { startTrack(id); return; }
  }
  // La fin approche : le suivant monte pendant que celui-ci s'éteint
  if (el.duration && el.duration - el.currentTime < XFADE + 0.3) { startTrack(choice === 'playlist' ? nextTrack() : choice); return; }
  if ((el.ended || el.error) && t - deck.started > 2) startTrack(nextTrack());
}

// ── Bruitages ──
// Croassement : une voix rauque (dents de scie, vibrato serré, filtre de gorge)
function caw(t, pitch, pan) {
  const o = ctx.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(pitch * 1.15, t);
  o.frequency.exponentialRampToValueAtTime(pitch * 0.8, t + 0.22);
  const lfo = ctx.createOscillator(); lfo.frequency.value = 38;
  const lfoGain = ctx.createGain(); lfoGain.gain.value = pitch * 0.12;
  lfo.connect(lfoGain).connect(o.frequency);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 2.5;
  const p = ctx.createStereoPanner(); p.pan.value = pan;
  o.connect(bp).connect(envGain(t, 0.4, 0.015, 0.23, p));
  p.connect(sfxBus);
  o.start(t); o.stop(t + 0.3); lfo.start(t); lfo.stop(t + 0.3);
}

function whoosh(t, dur, from, to, v) {
  const s = ctx.createBufferSource(); s.buffer = noise;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(from, t); bp.frequency.exponentialRampToValueAtTime(to, t + dur);
  s.connect(bp).connect(envGain(t, v, dur * 0.5, dur * 0.6, sfxBus));
  s.start(t, Math.random()); s.stop(t + dur * 1.2);
}

function thud(t, freq, v, dur = 0.18) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(freq * 1.8, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.05);
  o.connect(envGain(t, v, 0.003, dur, sfxBus));
  o.start(t); o.stop(t + dur + 0.05);
}

const SOUNDS = {
  // La lame fend l'air
  swing: () => whoosh(ctx.currentTime, 0.22, 500, 2600, 0.35),
  // Elle s'écrase dans la neige : un coup sourd, la neige qui crisse
  snow: () => { const t = ctx.currentTime; thud(t, 70, 0.5); whoosh(t, 0.12, 900, 300, 0.25); },
  // Elle entre dans la chair : sourd, mouillé, un tranchant aigu
  flesh: () => { const t = ctx.currentTime; thud(t, 55, 0.8, 0.25); whoosh(t, 0.09, 3200, 1200, 0.4); whoosh(t + 0.02, 0.2, 400, 150, 0.3); },
  // Un corbeau, ou plusieurs
  caw: ({ n = 1 + Math.floor(Math.random() * 3), pan = 0 } = {}) => {
    const t = ctx.currentTime, pitch = 520 + Math.random() * 160;
    for (let k = 0; k < n; k++) caw(t + k * (0.32 + Math.random() * 0.12), pitch * (1 + (Math.random() - 0.5) * 0.08), pan);
  },
  // Le tonnerre : un craquement si la foudre tombe près (`near` 0 → 1), puis
  // un grondement grave qui roule, enfle et s'éteint en quelques secondes
  thunder: ({ near = 0.5 } = {}) => {
    const t = ctx.currentTime, d = 3 + (1 - near) * 2.5;
    if (near > 0.45) { whoosh(t, 0.12, 5000, 900, 0.5 * near); thud(t, 48, 0.7 * near, 0.4); }
    const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(400 + near * 500, t); lp.frequency.exponentialRampToValueAtTime(90, t + d);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    let at = t + 0.05;
    // trois ou quatre roulements, de plus en plus sourds
    for (let k = 0; k < 4; k++) {
      const peak = (0.55 + 0.35 * near) * (1 - k * 0.2) * (0.7 + Math.random() * 0.3);
      g.gain.linearRampToValueAtTime(peak, at + 0.15 + Math.random() * 0.2);
      at += d / 4;
      g.gain.linearRampToValueAtTime(peak * 0.35, at);
    }
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.6);
    s.connect(lp).connect(g); g.connect(sfxBus); g.connect(reverb);
    s.start(t, Math.random()); s.stop(t + d + 0.8);
  },
  // Une présence qui s'efface : un souffle, et deux notes graves qui battent
  presence: () => {
    const t = ctx.currentTime;
    whoosh(t, 1.4, 250, 900, 0.18);
    for (const f of [55, 58.3]) {
      const o = ctx.createOscillator(); o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.25, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      o.connect(g).connect(sfxBus); g.connect(reverb);
      o.start(t); o.stop(t + 3.3);
    }
  },
  // La lame dans un tronc : un « toc » sec et boisé
  wood: () => { const t = ctx.currentTime; thud(t, 140, 0.55, 0.12); whoosh(t, 0.08, 1800, 700, 0.25); },
  // La lame sur la pierre : elle sonne, aigu, métallique, et s'arrête net
  clang: () => {
    const t = ctx.currentTime;
    for (const [f, v, d] of [[1520, 0.16, 0.5], [2390, 0.1, 0.35], [3170, 0.07, 0.25], [4410, 0.04, 0.18]]) {
      const o = ctx.createOscillator(); o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.02);
      o.connect(envGain(t, v, 0.002, d, sfxBus)); o.start(t); o.stop(t + d + 0.05);
    }
    whoosh(t, 0.05, 6000, 3000, 0.3);
    thud(t, 90, 0.35, 0.08);
  },
  // Un hurlement, loin dans la forêt : une voix qui monte, tient, retombe
  howl: ({ n = 2 } = {}) => {
    const t0 = ctx.currentTime;
    for (let k = 0; k < n; k++) {
      const t = t0 + k * (0.9 + Math.random() * 0.8), f = 380 + Math.random() * 90, d = 2.2 + Math.random() * 0.8;
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(f * 0.7, t);
      o.frequency.linearRampToValueAtTime(f, t + 0.5);
      o.frequency.linearRampToValueAtTime(f * 1.04, t + d * 0.7);
      o.frequency.exponentialRampToValueAtTime(f * 0.6, t + d);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 5.5;
      const lg = ctx.createGain(); lg.gain.value = f * 0.015;
      lfo.connect(lg).connect(o.frequency);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.13, t + 0.4);
      g.gain.setValueAtTime(0.13, t + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      const p = ctx.createStereoPanner(); p.pan.value = (Math.random() - 0.5) * 1.4;
      o.connect(lp).connect(g).connect(p); p.connect(sfxBus); p.connect(reverb);
      o.start(t); o.stop(t + d + 0.1); lfo.start(t); lfo.stop(t + d + 0.1);
    }
  },
  // Un grondement de gorge, bas et râpeux, avant qu'il ne bondisse
  growl: ({ v = 1 } = {}) => {
    const t = ctx.currentTime, d = 0.6;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 85 + Math.random() * 20;
    const am = ctx.createOscillator(); am.frequency.value = 26;
    const ag = ctx.createGain(); ag.gain.value = 0.5;
    const g = ctx.createGain(); g.gain.value = 0.5;
    am.connect(ag).connect(g.gain);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    o.connect(lp).connect(g).connect(envGain(t, 0.35 * v, 0.08, d, sfxBus));
    o.start(t); o.stop(t + d + 0.1); am.start(t); am.stop(t + d + 0.1);
  },
  // Les crocs claquent
  bite: () => { const t = ctx.currentTime; thud(t, 160, 0.4, 0.06); whoosh(t, 0.06, 4200, 2000, 0.35); thud(t + 0.03, 60, 0.5, 0.15); },
  // Touché, il glapit
  yelp: () => {
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(1500, t + 0.05); o.frequency.exponentialRampToValueAtTime(600, t + 0.25);
    o.connect(envGain(t, 0.22, 0.01, 0.25, sfxBus)); o.start(t); o.stop(t + 0.3);
  },
  // Le bruit sourd des ailes du megamoth (`v` : plus fort de près)
  flap: ({ v = 1 } = {}) => { const t = ctx.currentTime; whoosh(t, 0.16, 260, 110, 0.22 * v); thud(t, 48, 0.18 * v, 0.1); },
  // Un froissement sec d'ailes (touché, il tombe)
  rustle: () => { const t = ctx.currentTime; for (let k = 0; k < 5; k++) whoosh(t + k * 0.045, 0.05, 5200, 2400, 0.16); },
  // La torche soufflée : un chuintement
  snuff: () => { const t = ctx.currentTime; whoosh(t, 0.5, 2600, 500, 0.3); },
  // Le feu prend : un souffle qui monte
  ignite: () => { const t = ctx.currentTime; whoosh(t, 0.9, 200, 1400, 0.3); thud(t, 70, 0.3, 0.3); },
  // Le toit s'effondre : un fracas de bois, sourd et long
  collapse: () => {
    const t = ctx.currentTime;
    thud(t, 45, 0.9, 0.6); thud(t + 0.12, 70, 0.6, 0.35); thud(t + 0.3, 55, 0.5, 0.4);
    for (let k = 0; k < 6; k++) { thud(t + 0.05 + k * 0.09, 120 + k * 15, 0.25, 0.08); whoosh(t + k * 0.08, 0.12, 1500, 500, 0.2); }
    whoosh(t, 1.6, 900, 150, 0.3);
  },
  // Un coffre qui s'ouvre : un grincement de bois
  creak: () => { const t = ctx.currentTime; whoosh(t, 0.5, 300, 180, 0.2); thud(t + 0.4, 90, 0.35); },
};

export const audio = {
  get ready() { return !!ctx; },
  // Au premier geste du joueur : on construit tout et on lance la musique
  unlock() {
    if (!ctx) build();
    if (ctx.state === 'suspended') ctx.resume();
    if (!timer) {
      timer = setInterval(scheduler, 25);
    }
  },
  // Les niveaux : musique, bruitages, vent (0 → 1)
  setVolume(kind, v) {
    vol[kind] = v;
    if (!ctx) return;
    const bus = { music: musicBus, sfx: sfxBus, wind: windBus }[kind];
    bus.gain.setTargetAtTime(kind === 'music' ? 0.8 * v : v, ctx.currentTime, 0.2);
  },
  setMusic(on) { this.setVolume('music', on ? (vol.music || 0.7) : 0); },
  get silent() { return !vol.music && !vol.sfx && !vol.wind; },
  // Le vent : sa force (pixels/s, 0 → ~200) et les rafales (0 → 1) ; `muffled`
  // (0 → 1) : à l'abri (1, dans une pièce), sous les arbres de la forêt noire
  wind(force, gust, muffled = 0) {
    if (!ctx || !windLayers) return;
    const t = ctx.currentTime, L = windLayers, ph = L.phase;
    const k = Math.min(1, force / 170) * (1 - 0.85 * Number(muffled));
    // La respiration : de lentes ondes qui ne se répètent pas, une houle de
    // vent toutes les dix à vingt secondes
    const breathe = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.11 + ph[0] + Math.sin(t * 0.031 + ph[1]) * 3));
    const body = L.body;
    body.gain.gain.setTargetAtTime((0.01 + 0.15 * k) * breathe * (0.85 + 0.3 * gust), t, 0.6);
    body.filter.frequency.setTargetAtTime(200 + 480 * k + 240 * gust + 110 * Math.sin(t * 0.05 + ph[2]), t, 0.8);
    body.filter.Q.setTargetAtTime(0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.07 + ph[3])), t, 1);
    body.pan.pan.setTargetAtTime(0.45 * Math.sin(t * 0.037 + ph[4]), t, 1.5);
    // L'air aigu : à peine, qui va et vient
    L.air.gain.gain.setTargetAtTime((0.003 + 0.03 * k) * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.09 + ph[5]))), t, 0.8);
    L.air.pan.pan.setTargetAtTime(-0.5 * Math.sin(t * 0.029 + ph[4]), t, 1.5);
    // Les sifflements : ils naissent, glissent, s'éteignent ; rien sous la bise
    L.whistles.forEach((w, i) => {
      const on = Math.pow(Math.max(0, Math.sin(t * (0.13 + i * 0.05) + ph[6 + i])), 3);
      w.gain.gain.setTargetAtTime(on * Math.max(0, k - 0.3) * (0.35 + gust) * 0.045, t, 0.5);
      w.filter.frequency.setTargetAtTime((1100 + i * 650) * (1 + 0.18 * Math.sin(t * 0.21 + ph[6 + i] * 2)) + 350 * gust, t, 0.4);
      w.pan.pan.setTargetAtTime((i ? 0.6 : -0.6) * Math.sin(t * 0.05 + i), t, 1);
    });
  },

  // L'incendie : son grondement et ses crépitements, selon ce qu'on en entend (0 → 1)
  fire(level) {
    if (!ctx || (!level && !fireGain)) return;
    const t = ctx.currentTime;
    if (!fireGain) {
      const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true; src.playbackRate.value = 0.5;
      fireFilter = ctx.createBiquadFilter(); fireFilter.type = 'lowpass'; fireFilter.frequency.value = 300;
      fireGain = ctx.createGain(); fireGain.gain.value = 0;
      src.connect(fireFilter).connect(fireGain).connect(sfxBus); src.start();
    }
    fireGain.gain.setTargetAtTime(0.35 * level, t, 0.4);
    fireFilter.frequency.setTargetAtTime(220 + 500 * level, t, 0.4);
    // Les crépitements : de petits claquements secs, au hasard
    const n = Math.floor(level * 3 + Math.random() * level * 2);
    for (let k = 0; k < n; k++) {
      const at = t + Math.random() * 0.2, s = ctx.createBufferSource(); s.buffer = noise;
      const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 1800 + Math.random() * 2500; hp.Q.value = 2;
      s.connect(hp).connect(envGain(at, 0.12 * level, 0.001, 0.02 + Math.random() * 0.03, sfxBus));
      s.start(at, Math.random() * 1.5); s.stop(at + 0.08);
    }
  },
  // Le morceau : 'playlist' (ils s'enchaînent), ou l'un de TRACKS
  setTrack(id) {
    choice = id === 'playlist' || TRACKS[id] ? id : 'playlist';
    // (un morceau choisi : on y passe tout de suite, en fondu)
    if (ctx && deck && choice !== 'playlist' && current !== choice) startTrack(choice);
  },
  get track() { return current; },
  // Où en est le morceau (debug, harnais) : { id, temps, durée, platines }
  seek(sec) { if (deck) deck.el.currentTime = sec; },
  get playing() { return deck && { id: deck.id, time: deck.el.currentTime, duration: deck.el.duration, paused: deck.el.paused }; },
  // L'humeur du moment, voulue par le jeu : { energy, dark, muffled } (0 → 1),
  // et `place` : un lieu qui a son morceau ('foret-noire', 'loups', 'aube')
  setMood(m) { Object.assign(mood, m); },
  // Un silence de quelques secondes (la musique retient son souffle)
  hush(seconds) { if (ctx) duckUntil = ctx.currentTime + seconds; },
  play(name, opts) {
    if (!ctx || !vol.sfx || ctx.state !== 'running') return;
    SOUNDS[name]?.(opts);
  },
};
