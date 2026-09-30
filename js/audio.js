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

let ctx = null, master, musicBus, sfxBus, reverb, delay, noise;
let musicOn = true, sfxOn = true;
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
  musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? 0.55 : 0; musicBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 0.8 : 0; sfxBus.connect(master);
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
  src.connect(windFilter).connect(windGain).connect(sfxBus);
  const src2 = ctx.createBufferSource(); src2.buffer = noise; src2.loop = true; src2.playbackRate.value = 0.7;
  whistleFilter = ctx.createBiquadFilter(); whistleFilter.type = 'bandpass'; whistleFilter.frequency.value = 1400; whistleFilter.Q.value = 9;
  whistleGain = ctx.createGain(); whistleGain.gain.value = 0;
  src2.connect(whistleFilter).connect(whistleGain).connect(sfxBus);
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

// Ce qui joue dans chaque phrase : l'entrée, la montée, le plein, la respiration
function arrangement(bar) {
  const phrase = Math.floor(bar / 16) % 6;
  return [
    { kick: 0, hats: 0, bass: 0, stab: 0.6, pad: 1 },
    { kick: 1, hats: 0, bass: 0, stab: 0.8, pad: 1 },
    { kick: 1, hats: 1, bass: 1, stab: 1, pad: 0.6 },
    { kick: 1, hats: 1, bass: 1, stab: 1, pad: 1 },
    { kick: 0, hats: 0.5, bass: 1, stab: 0.7, pad: 1 },
    { kick: 1, hats: 1, bass: 1, stab: 1, pad: 0.4 },
  ][phrase];
}

function scheduleStep(t, i) {
  const bar = Math.floor(i / 16), s = i % 16;
  const A = arrangement(bar), chord = CHORDS[Math.floor(bar / 4) % CHORDS.length];
  if (A.kick && s % 4 === 0) kick(t, A.kick);
  if (A.hats && s % 4 === 2) hat(t, A.hats, s === 14 && bar % 2 === 1);
  if (A.hats && (s === 7 || s === 15) && Math.random() < 0.4) hat(t, A.hats * 0.5);
  if (A.bass && [3, 6, 11, 14].includes(s)) bass(t, chord[0] + (s === 11 && bar % 4 === 3 ? 7 : 0), A.bass);
  // Les accords : peu, à des places qui changent d'une mesure à l'autre
  const stabs = [[6], [3, 10], [6, 14], [0, 11]][bar % 4];
  if (A.stab && stabs.includes(s)) stab(t, chord, A.stab, 1400 + 900 * Math.sin(bar * 0.4));
  if (A.pad && s === 0 && bar % 2 === 0) pad(t, chord, BEAT * 8, A.pad);
}

function scheduler() {
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
  setMusic(on) {
    musicOn = on;
    if (ctx) musicBus.gain.setTargetAtTime(on ? 0.55 : 0, ctx.currentTime, 0.4);
  },
  setSfx(on) {
    sfxOn = on;
    if (ctx) sfxBus.gain.setTargetAtTime(on ? 0.8 : 0, ctx.currentTime, 0.2);
  },
  // Le vent : sa force (pixels/s, 0 → ~200) et les rafales (0 → 1) ; `muffled`
  // quand on est à l'abri (dans une pièce)
  wind(force, gust, muffled = false) {
    if (!ctx) return;
    const t = ctx.currentTime, k = Math.min(1, force / 170) * (muffled ? 0.15 : 1);
    windGain.gain.setTargetAtTime(0.02 + 0.28 * k, t, 0.5);
    windFilter.frequency.setTargetAtTime(250 + 700 * k + 300 * gust, t, 0.5);
    whistleGain.gain.setTargetAtTime(Math.max(0, k - 0.45) * 0.12 * (0.4 + gust), t, 0.3);
    whistleFilter.frequency.setTargetAtTime(1100 + 900 * gust, t, 0.3);
  },
  play(name, opts) {
    if (!ctx || !sfxOn || ctx.state !== 'running') return;
    SOUNDS[name]?.(opts);
  },
};
