/* Le son, entièrement synthétisé (Web Audio) : aucun fichier, aucune
   dépendance. Une musique de deep techno contemplative, générée en continu
   (grosse caisse feutrée, basse ronde, accords dub noyés d'écho, nappe), et
   les bruitages : le vent (qui suit la météo du jeu), les corbeaux, l'épée.
   Le navigateur n'autorise le son qu'après un geste du joueur : `unlock()`
   est appelé au premier clic ou à la première touche. */

const BPM = 116;
const BEAT = 60 / BPM;
const STEP = BEAT / 4;                          // une double croche
// La minor 9 : la, do, mi, sol, si ; la basse tourne autour du la
const CHORDS = [
  [45, 52, 55, 59, 60],                         // Am9
  [43, 50, 53, 57, 59],                         // G6/9
  [41, 48, 52, 55, 57],                         // Fmaj9
  [45, 52, 55, 60, 62],                         // Am(add11)
];
const midi = n => 440 * Math.pow(2, (n - 69) / 12);

let ctx = null, master, musicBus, musicFilter, sfxBus, reverb, delay, noise;
// L'humeur voulue par le jeu (0 → 1) et celle qu'on entend, qui la rejoint
// en douceur : énergie (du silence au combat), ombre, étouffement
const mood = { energy: 0.35, dark: 0, muffled: 0 };
const heard = { energy: 0.35, dark: 0, muffled: 0 };
let duckUntil = 0;
// Les niveaux (0 → 1), réglés par le joueur ; le vent a le sien
const vol = { music: 0.7, sfx: 0.8, wind: 0.35 };
let windBus;
let windGain, windFilter, whistleGain, whistleFilter;
let nextStep = 0, stepIndex = 0, timer = null;

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
  musicBus.connect(musicFilter).connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = vol.sfx; sfxBus.connect(master);
  windBus = ctx.createGain(); windBus.gain.value = vol.wind; windBus.connect(master);
  // Réverbération et écho dub (croche pointée, retour filtré)
  reverb = makeReverb();
  const revOut = ctx.createGain(); revOut.gain.value = 0.5;
  reverb.connect(revOut).connect(musicBus);
  delay = ctx.createDelay(2); delay.delayTime.value = STEP * 3;
  const fb = ctx.createGain(); fb.gain.value = 0.55;
  const fbFilter = ctx.createBiquadFilter(); fbFilter.type = 'lowpass'; fbFilter.frequency.value = 1400;
  delay.connect(fbFilter).connect(fb).connect(delay);
  const delOut = ctx.createGain(); delOut.gain.value = 0.6;
  fbFilter.connect(delOut).connect(musicBus);
  delOut.connect(reverb);
  buildWind();
}

// ── Le vent : du bruit filtré, un souffle grave et un sifflement ──
function buildWind() {
  const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true;
  windFilter = ctx.createBiquadFilter(); windFilter.type = 'bandpass'; windFilter.frequency.value = 400; windFilter.Q.value = 0.7;
  windGain = ctx.createGain(); windGain.gain.value = 0;
  src.connect(windFilter).connect(windGain).connect(windBus);
  const src2 = ctx.createBufferSource(); src2.buffer = noise; src2.loop = true; src2.playbackRate.value = 0.7;
  whistleFilter = ctx.createBiquadFilter(); whistleFilter.type = 'bandpass'; whistleFilter.frequency.value = 1400; whistleFilter.Q.value = 9;
  whistleGain = ctx.createGain(); whistleGain.gain.value = 0;
  src2.connect(whistleFilter).connect(whistleGain).connect(windBus);
  src.start(); src2.start();
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

function kick(t, v) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.09);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
  o.connect(lp).connect(envGain(t, 0.9 * v, 0.004, 0.42, musicBus));
  o.start(t); o.stop(t + 0.5);
}

function hat(t, v, open = false) {
  const s = ctx.createBufferSource(); s.buffer = noise;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7500;
  const g = envGain(t, 0.07 * v, 0.002, open ? 0.18 : 0.04, musicBus);
  s.connect(hp).connect(g);
  if (open) g.connect(delay);
  s.start(t, Math.random()); s.stop(t + 0.25);
}

function bass(t, note, v) {
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(note - 12);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6;
  lp.frequency.setValueAtTime(420, t); lp.frequency.exponentialRampToValueAtTime(110, t + 0.18);
  o.connect(lp).connect(envGain(t, 0.28 * v, 0.01, 0.24, musicBus));
  o.start(t); o.stop(t + 0.3);
}

// L'accord dub : bref, étouffé, qui ne vit que dans l'écho et la réverbération
function stab(t, chord, v, bright) {
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 3;
  lp.frequency.setValueAtTime(bright, t); lp.frequency.exponentialRampToValueAtTime(300, t + 0.25);
  const g = envGain(t, 0.12 * v, 0.006, 0.32, musicBus);
  lp.connect(g);
  const send = ctx.createGain(); send.gain.value = 0.9; g.connect(send);
  send.connect(delay); send.connect(reverb);
  for (const n of chord) for (const det of [-7, 7]) {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = det;
    o.connect(lp); o.start(t); o.stop(t + 0.4);
  }
}

// La nappe : quelques sinus lents sur une mesure entière, dans la réverbération
function pad(t, chord, dur, v) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.08 * v, t + dur * 0.4);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  g.connect(reverb); g.connect(musicBus);
  for (const n of chord.slice(1)) {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = midi(n + 12);
    o.detune.value = (Math.random() - 0.5) * 12;
    o.connect(g); o.start(t); o.stop(t + dur + 0.1);
  }
}

// Ce qui joue dans chaque phrase : l'entrée, la montée, le plein, la respiration.
// L'énergie du moment (le lieu, le danger) décide de ce qui peut jouer : au
// calme, la nappe et quelques accords ; en marche, la grosse caisse ; près de
// l'ennemi, la basse et le charleston ; au combat, tout, plus dense, plus clair.
function arrangement(bar) {
  const e = heard.energy;
  const phrase = Math.floor(bar / 16) % 6;
  const breath = e < 0.85 && (phrase === 0 || phrase === 4);   // les respirations (sauf au combat)
  const lvl = (from, to) => Math.max(0, Math.min(1, (e - from) / (to - from)));
  return {
    kick: breath ? 0 : lvl(0.3, 0.5),
    hats: breath ? lvl(0.6, 0.9) * 0.5 : lvl(0.55, 0.8),
    fast: lvl(0.85, 1),                                          // charleston en doubles croches
    bass: lvl(0.22, 0.45),
    stab: 0.5 + 0.5 * lvl(0.1, 0.7),
    stabs2: lvl(0.8, 1),                                         // accords plus serrés
    pad: 1 - 0.7 * lvl(0.6, 1),
  };
}

function scheduleStep(t, i) {
  const bar = Math.floor(i / 16), s = i % 16;
  if (ctx.currentTime < duckUntil) return;                      // un silence (une présence)
  const A = arrangement(bar);
  // Dans l'ombre, les accords descendent d'un ton, plus sourds
  const chord = CHORDS[Math.floor(bar / 4) % CHORDS.length].map(n => n - (heard.dark > 0.6 ? 2 : 0));
  if (A.kick && s % 4 === 0) kick(t, A.kick);
  if (A.hats && s % 4 === 2) hat(t, A.hats, s === 14 && bar % 2 === 1);
  if (A.hats && (s === 7 || s === 15) && Math.random() < 0.4) hat(t, A.hats * 0.5);
  if (A.fast && s % 2 === 1) hat(t, A.fast * 0.45);
  if (A.bass && [3, 6, 11, 14].includes(s)) bass(t, chord[0] + (s === 11 && bar % 4 === 3 ? 7 : 0), A.bass);
  if (A.fast && [0, 8].includes(s)) bass(t, chord[0], A.fast * 0.8);
  // Les accords : peu, à des places qui changent d'une mesure à l'autre
  const stabs = [[6], [3, 10], [6, 14], [0, 11]][bar % 4];
  const bright = (1400 + 900 * Math.sin(bar * 0.4)) * (1 - 0.5 * heard.dark) * (1 + 0.6 * A.stabs2);
  if (A.stab && stabs.includes(s)) stab(t, chord, A.stab, bright);
  if (A.stabs2 && [2, 9, 13].includes(s) && Math.random() < 0.7) stab(t, chord, A.stabs2 * 0.7, bright);
  if (A.pad && s === 0 && bar % 2 === 0) pad(t, chord, BEAT * 8, A.pad);
}

// L'humeur entendue rejoint la voulue : vite quand le danger monte, lentement
// quand il retombe ; le filtre suit
function followMood() {
  const up = mood.energy > heard.energy;
  // (appelé toutes les 25 ms : ~1,5 s pour monter, ~6 s pour redescendre)
  heard.energy += (mood.energy - heard.energy) * (up ? 0.017 : 0.004);
  heard.dark += (mood.dark - heard.dark) * 0.006;
  heard.muffled += (mood.muffled - heard.muffled) * 0.03;
  const cut = 600 + 7000 * (1 - 0.75 * heard.dark) * (1 - 0.85 * heard.muffled) * (0.55 + 0.45 * heard.energy);
  musicFilter.frequency.setTargetAtTime(cut, ctx.currentTime, 0.3);
}

function scheduler() {
  followMood();
  while (nextStep < ctx.currentTime + 0.15) {
    scheduleStep(nextStep, stepIndex);
    nextStep += STEP * (stepIndex % 2 ? 0.94 : 1.06);   // un léger swing
    stepIndex++;
  }
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
      nextStep = ctx.currentTime + 0.1;
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
    if (!ctx) return;
    const t = ctx.currentTime, k = Math.min(1, force / 170) * (1 - 0.85 * Number(muffled));
    windGain.gain.setTargetAtTime(0.02 + 0.28 * k, t, 0.5);
    windFilter.frequency.setTargetAtTime(250 + 700 * k + 300 * gust, t, 0.5);
    whistleGain.gain.setTargetAtTime(Math.max(0, k - 0.45) * 0.12 * (0.4 + gust), t, 0.3);
    whistleFilter.frequency.setTargetAtTime(1100 + 900 * gust, t, 0.3);
  },
  // L'humeur du moment, voulue par le jeu : { energy, dark, muffled } (0 → 1)
  setMood(m) { Object.assign(mood, m); },
  // Un silence de quelques secondes (la musique retient son souffle)
  hush(seconds) { if (ctx) duckUntil = ctx.currentTime + seconds; },
  play(name, opts) {
    if (!ctx || !vol.sfx || ctx.state !== 'running') return;
    SOUNDS[name]?.(opts);
  },
};
