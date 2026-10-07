/* Le son, entièrement synthétisé (Web Audio) : aucun fichier, aucune
   dépendance. Une musique de deep techno contemplative, générée en continu
   (grosse caisse feutrée, basse ronde, accords dub noyés d'écho, nappe), et
   les bruitages : le vent (qui suit la météo du jeu), les corbeaux, l'épée.
   Le navigateur n'autorise le son qu'après un geste du joueur : `unlock()`
   est appelé au premier clic ou à la première touche. */

// La minor 9 : la, do, mi, sol, si ; la basse tourne autour du la
const CHORDS = [
  [45, 52, 55, 59, 60],                         // Am9
  [43, 50, 53, 57, 59],                         // G6/9
  [41, 48, 52, 55, 57],                         // Fmaj9
  [45, 52, 55, 60, 62],                         // Am(add11)
];
// ── La playlist : quatre morceaux de deep techno, toujours générés, qui
// évoluent de phrase en phrase. La nuit (l'original : accords dub) ; la glace
// (des arpèges qui s'ouvrent) ; l'aurore (une mélodie qui se cherche, se
// répond, se transforme) ; la forge (plus sourde, une basse qui chante, des
// frappes de métal). `stab`, `arp`, `lead`, `rim`, `song` (la basse
// mélodique) : la place de chaque voix (0 → 1).
export const TRACKS = {
  nuit: { nom: 'La nuit', about: 'L\'original : grosse caisse feutrée, accords dub noyés d\'écho, nappe.', bpm: 116, chords: CHORDS, stab: 1, arp: 0, lead: 0, rim: 0, song: 0 },
  glace: {
    nom: 'La glace', about: 'Des arpèges clairs qui s\'ouvrent et se referment, une mélodie qui passe de temps en temps.', bpm: 118,
    chords: [[50, 57, 60, 64, 65], [46, 53, 57, 60, 62], [41, 48, 53, 57, 60], [48, 55, 59, 62, 64]],
    stab: 0.35, arp: 1, lead: 0.45, rim: 0, song: 0,
  },
  aurore: {
    nom: 'L\'aurore', about: 'Le plus mélodique : une ligne chantée qui se cherche, se répond et se transforme, sur des nappes chaudes.', bpm: 120,
    chords: [[40, 47, 50, 54, 55], [48, 55, 59, 62, 64], [43, 50, 54, 57, 59], [50, 57, 60, 62, 66]],
    stab: 0.3, arp: 0.35, lead: 1, rim: 0, song: 0,
  },
  forge: {
    nom: 'La forge', about: 'Plus sourde et plus ronde : une basse qui chante, des frappes de métal, un motif obstiné.', bpm: 122,
    chords: [[41, 48, 51, 55, 56], [37, 44, 48, 51, 53], [39, 46, 50, 53, 55], [36, 43, 46, 51, 53]],
    stab: 0.6, arp: 0.2, lead: 0.3, rim: 1, song: 1,
  },
};
const TRACK_ORDER = ['nuit', 'glace', 'aurore', 'forge'];
let choice = 'playlist', current = 'nuit', trackBars = 0;
let BPM = 116, BEAT = 60 / BPM, STEP = BEAT / 4;   // une double croche
function useTrack(id) {
  current = id;
  BPM = TRACKS[id].bpm; BEAT = 60 / BPM; STEP = BEAT / 4;
  trackBars = 0;
  if (delay) delay.delayTime.setTargetAtTime(STEP * 3, ctx.currentTime, 0.5);
}
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
let fireGain = null, fireFilter;                    // l'incendie : un grondement, des crépitements
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

// Une note pincée : dents de scie, filtre qui se referme vite, dans l'écho
function pluck(t, note, v, bright) {
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(note);
  const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = midi(note); o2.detune.value = 6;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 4;
  lp.frequency.setValueAtTime(bright, t); lp.frequency.exponentialRampToValueAtTime(260, t + 0.16);
  const g = envGain(t, 0.07 * v, 0.003, 0.22, musicBus);
  o.connect(lp); o2.connect(lp); lp.connect(g);
  const send = ctx.createGain(); send.gain.value = 0.6; g.connect(send); send.connect(delay);
  o.start(t); o2.start(t); o.stop(t + 0.3); o2.stop(t + 0.3);
}
// Une voix chantée : triangle et sinus, attaque douce, un léger vibrato
function lead(t, note, dur, v) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.075 * v, t + Math.min(0.08, dur * 0.3));
  g.gain.setTargetAtTime(0.0001, t + dur * 0.7, dur * 0.3);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
  g.connect(lp).connect(musicBus);
  const send = ctx.createGain(); send.gain.value = 0.5; lp.connect(send); send.connect(delay); send.connect(reverb);
  const vib = ctx.createOscillator(); vib.frequency.value = 5.2;
  const vg = ctx.createGain(); vg.gain.value = 6; vib.connect(vg);
  for (const [type, det, k] of [['triangle', 0, 1], ['sine', 1200, 0.35]]) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = midi(note); o.detune.value = det;
    vg.connect(o.detune);
    const og = ctx.createGain(); og.gain.value = k; o.connect(og).connect(g);
    o.start(t); o.stop(t + dur + 0.6);
  }
  vib.start(t); vib.stop(t + dur + 0.6);
}
// Une frappe de métal : du bruit très filtré, bref, qui sonne
function rim(t, v) {
  const s = ctx.createBufferSource(); s.buffer = noise;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700 + Math.random() * 300; bp.Q.value = 14;
  const g = envGain(t, 0.18 * v, 0.001, 0.07, musicBus);
  s.connect(bp).connect(g);
  const send = ctx.createGain(); send.gain.value = 0.3; g.connect(send); send.connect(delay);
  s.start(t, Math.random()); s.stop(t + 0.12);
}

// Le motif d'une phrase : des notes (rangs dans l'accord, octave) sur des
// pas de la mesure ; tiré d'une graine (le morceau, la phrase) : le même
// motif revient, se répond, se transforme d'une phrase à l'autre
const motifs = new Map();
function motif(id, phrase) {
  const key = `${id}-${phrase}`;
  if (motifs.has(key)) return motifs.get(key);
  let r = (phrase + 1) * 7919 + id.length * 104729;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const slots = [0, 2, 3, 6, 8, 10, 11, 14].filter(() => rnd() < 0.62);
  if (!slots.length) slots.push(0, 8);
  let deg = Math.floor(rnd() * 5);
  const notes = slots.map(at => {
    deg = Math.max(0, Math.min(7, deg + Math.floor(rnd() * 5) - 2));
    return { at, deg, len: 1 + Math.floor(rnd() * 3) };
  });
  const m = { notes, arpOrder: ['up', 'down', 'updown', 'skip'][Math.floor(rnd() * 4)] };
  motifs.set(key, m);
  if (motifs.size > 64) motifs.delete(motifs.keys().next().value);
  return m;
}
// Le rang d'une note dans l'accord, sur deux octaves (la basse n'en est pas)
const tone = (chord, deg) => chord[1 + (deg % 4)] + 12 * Math.floor(deg / 4) + 12;

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
  // La playlist : on change de morceau sur une respiration, toutes les six phrases
  if (s === 0) {
    trackBars++;
    if (choice === 'playlist' && trackBars > 96 && bar % 16 === 0) useTrack(TRACK_ORDER[(TRACK_ORDER.indexOf(current) + 1) % TRACK_ORDER.length]);
  }
  const T = TRACKS[current], A = arrangement(bar);
  // Dans l'ombre, les accords descendent d'un ton, plus sourds
  const chord = T.chords[Math.floor(bar / 4) % T.chords.length].map(n => n - (heard.dark > 0.6 ? 2 : 0));
  const phrase = Math.floor(bar / 16), M = motif(current, phrase);
  const lvl = (from, to) => Math.max(0, Math.min(1, (heard.energy - from) / (to - from)));
  const brightA = (1600 + 1400 * Math.sin(bar * 0.25 + phrase)) * (1 - 0.5 * heard.dark);
  // Les arpèges : ils s'ouvrent sur la phrase (de deux à huit notes), plus serrés quand ça monte
  if (T.arp && A.kick + A.pad > 0) {
    const open = 2 + Math.floor((bar % 16) / 16 * 6), rate = heard.energy > 0.6 ? 1 : 2;
    if (s % rate === 0) {
      const k = (s / rate) % open;
      const idx = M.arpOrder === 'down' ? open - 1 - k : M.arpOrder === 'updown' ? (Math.floor(s / rate / open) % 2 ? open - 1 - k : k) : M.arpOrder === 'skip' ? (k * 2) % open : k;
      pluck(t, tone(chord, idx), T.arp * (0.5 + 0.5 * lvl(0.05, 0.4)), brightA);
    }
  }
  // La mélodie : le motif de la phrase ; il se répond (une mesure sur deux,
  // une note plus bas), et change un peu toutes les quatre mesures
  if (T.lead && (bar % 16) >= 2) {
    const answer = bar % 2 === 1, vary = Math.floor(bar / 4) % 4;
    for (const n of M.notes) {
      if (n.at !== s) continue;
      if (answer && n === M.notes.at(-1) && heard.energy < 0.7) continue;   // il laisse respirer
      const deg = n.deg + (answer ? -1 : 0) + (vary === 2 && n === M.notes[0] ? 2 : 0) + (vary === 3 ? 1 : 0);
      lead(t, tone(chord, Math.max(0, Math.min(7, deg))), STEP * n.len * 2, T.lead * (0.55 + 0.45 * (1 - heard.dark)));
    }
  }
  // La forge : des frappes de métal, et une basse qui chante le motif à l'octave
  if (T.rim && A.kick && [4, 12].includes(s)) rim(t, T.rim * A.kick);
  if (T.rim && A.hats && s === 7 && bar % 2) rim(t, T.rim * 0.5);
  if (T.song && A.bass) for (const n of M.notes) if (n.at === s) bass(t, chord[1 + (n.deg % 4)] - 12, A.bass * 0.9);
  if (A.kick && s % 4 === 0) kick(t, A.kick);
  if (A.hats && s % 4 === 2) hat(t, A.hats, s === 14 && bar % 2 === 1);
  if (A.hats && (s === 7 || s === 15) && Math.random() < 0.4) hat(t, A.hats * 0.5);
  if (A.fast && s % 2 === 1) hat(t, A.fast * 0.45);
  if (A.bass && !T.song && [3, 6, 11, 14].includes(s)) bass(t, chord[0] + (s === 11 && bar % 4 === 3 ? 7 : 0), A.bass);
  if (A.fast && [0, 8].includes(s)) bass(t, chord[0], A.fast * 0.8);
  // Les accords : peu, à des places qui changent d'une mesure à l'autre
  const stabs = [[6], [3, 10], [6, 14], [0, 11]][bar % 4];
  const bright = (1400 + 900 * Math.sin(bar * 0.4)) * (1 - 0.5 * heard.dark) * (1 + 0.6 * A.stabs2);
  if (A.stab && T.stab && stabs.includes(s)) stab(t, chord, A.stab * T.stab, bright);
  if (A.stabs2 && T.stab && [2, 9, 13].includes(s) && Math.random() < 0.7) stab(t, chord, A.stabs2 * 0.7 * T.stab, bright);
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
    if (choice !== 'playlist') useTrack(choice);
  },
  get track() { return current; },
  // L'humeur du moment, voulue par le jeu : { energy, dark, muffled } (0 → 1)
  setMood(m) { Object.assign(mood, m); },
  // Un silence de quelques secondes (la musique retient son souffle)
  hush(seconds) { if (ctx) duckUntil = ctx.currentTime + seconds; },
  play(name, opts) {
    if (!ctx || !vol.sfx || ctx.state !== 'running') return;
    SOUNDS[name]?.(opts);
  },
};
