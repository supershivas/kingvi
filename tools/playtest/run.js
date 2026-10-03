/* Harnais de playtest de KINGVI SNO 7.

   Sert le dépôt en local, ouvre le jeu avec ?debug=1 (js/debug.js) et joue
   un parcours scripté en suivant les traces au clavier, comme un joueur.
   Sortie : playtests/vX.Y.Z/<run-id>/ — le carnet de partie (carnet.md),
   les captures, events.json, durations.json, run.json.

   node run.js [options]   (node run.js --aide) */
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPEED = 18;   // pixels du monde par seconde, à pied (game.js)

// ── Les étapes du parcours ──
const STEPS = [
  ['greve', 'La grève'],
  ['morts', 'La plaine des morts'],
  ['foret', 'La forêt et Freya ensevelie'],
  ['foret-noire', 'La forêt noire'],
  ['bosquet', 'Le bosquet sacré et la meute'],
  ['guetteur', 'Le guetteur'],
  ['freya-debout', 'Freya debout'],
  ['maison', 'La maison, dehors et dedans'],
  ['viking', 'L\'autre viking : mort volontaire'],
  ['reveil', 'Le réveil à la barque'],
  ['victoire', 'Retour au bout des traces, et victoire'],
  ['falaise', 'La falaise et la grotte'],
  ['roi', 'Le roi sous la roche'],
  ['lac', 'Interlude : le lac, l\'îlot, la crypte'],
];

const HELP = `Harnais de playtest — node run.js [options]
  --from <étape> --to <étape>   parcours partiel (${STEPS.map(s => s[0]).join(', ')})
  --sans-lac                    sans le détour du lac
  --reel                        tout à pied, de la barque au bout des traces (mesure du rythme)
  --vitesse <n>                 accélère le jeu (1 par défaut ; 2 à 4 pour aller vite)
  --heure <aube|jour|crepuscule|nuit>   --meteo <cycle|calme|bise|rafales|tempete|tourbillons>
  --clavier <azerty|qwerty|fleches>     (azerty par défaut)
  --qualite <1|2|3>             qualité de l'image (Réglages) : 1 légère, 2 économe, 3 complète (défaut)
  --navigateur <chromium|firefox|webkit> --taille 1280x800 --dpr 1
  --graine <n>                  graine du hasard du combat (7 par défaut)
  --capture <s>                 secondes entre deux captures (6 par défaut)
  --etiquette <texte>           ajoutée au nom du run
  --visible                     navigateur affiché (headed)`;

function parseArgs(argv) {
  const o = { clavier: 'azerty', qualite: 3, navigateur: 'chromium', taille: '1280x800', dpr: 1,
    graine: 7, capture: 6, vitesse: 1, heure: null, meteo: null, from: null, to: null, lac: true, reel: false, etiquette: '', visible: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--aide' || a === '--help') { console.log(HELP); process.exit(0); }
    else if (a === '--sans-lac') o.lac = false;
    else if (a === '--reel') o.reel = true;
    else if (a === '--visible') o.visible = true;
    else if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
    else throw new Error(`Option inconnue : ${a}`);
  }
  o.qualite = Math.min(3, Math.max(1, Number(o.qualite) || 3)); o.vitesse = Number(o.vitesse) || 1; o.capture = Number(o.capture) || 6; o.graine = Number(o.graine); o.dpr = Number(o.dpr) || 1;
  const ids = STEPS.map(s => s[0]);
  for (const k of ['from', 'to']) if (o[k] && !ids.includes(o[k])) throw new Error(`Étape inconnue : ${o[k]} (${ids.join(', ')})`);
  if (!['azerty', 'qwerty', 'fleches'].includes(o.clavier)) throw new Error('--clavier : azerty, qwerty ou fleches');
  return o;
}

// ── Un petit serveur statique, à la racine du dépôt ──
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.md': 'text/markdown', '.woff2': 'font/woff2' };
function serve() {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = join(ROOT, path.endsWith('/') ? `${path}index.html` : path);
    if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
    try {
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(await readFile(file));
    } catch { res.writeHead(500); res.end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const pad2 = n => String(Math.floor(n)).padStart(2, '0');
const clock = s => `${pad2(s / 60)}:${pad2(s % 60)}`;

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const { version } = JSON.parse(await readFile(join(ROOT, 'version.json'), 'utf8'));
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 13);
  const runId = [stamp, o.reel ? 'reel' : null, o.etiquette ? o.etiquette.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : null].filter(Boolean).join('-');
  const out = join(ROOT, 'playtests', `v${version}`, runId);
  await mkdir(join(out, 'captures'), { recursive: true });

  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const [w, h] = o.taille.split('x').map(Number);
  const engine = { chromium, firefox, webkit }[o.navigateur];
  const browser = await engine.launch({ headless: !o.visible });
  const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: o.dpr, ignoreHTTPSErrors: true });
  // Les réglages du joueur : la qualité de l'image ; la musique coupée (rien n'écoute)
  await context.addInitScript(p => { if (!localStorage.getItem('kingvi:prefs')) localStorage.setItem('kingvi:prefs', JSON.stringify(p)); },
    { quality: o.qualite, wind: 'cycle', windCycle: true, dayOffset: 0, musicVol: 0, sfxVol: 0, windVol: 0 });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('pageerror', e => consoleErrors.push({ t: Date.now(), message: e.message }));
  // (les ressources extérieures, polices Google, ne comptent pas : le proxy du conteneur les refuse parfois)
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const url = m.location()?.url || '';
    if (/Failed to load resource/.test(m.text()) && !url.startsWith('http://127.0.0.1')) return;
    consoleErrors.push({ t: Date.now(), message: m.text(), url });
  });

  // ── Captures : toutes les N secondes, et à chaque événement marquant ──
  const shots = [];
  let shotQueue = Promise.resolve(), shotN = 0, lastShot = 0, currentStep = null;
  const shoot = (why, delay = 0) => {
    shotQueue = shotQueue.then(async () => {
      if (delay) await sleep(delay);
      const file = `captures/${String(++shotN).padStart(4, '0')}.jpg`;
      try {
        await page.screenshot({ path: join(out, file), type: 'jpeg', quality: 62 });
        const s = await page.evaluate(() => window.__kingvi?.state()).catch(() => null);
        shots.push({ file, why, step: currentStep, jeu: s?.tempsJeu, zone: s?.zone, s });
        lastShot = Date.now();
      } catch { /* page fermée */ }
    });
    return shotQueue;
  };
  const CAPTURE_ON = new Set(['zone', 'entree', 'sortie', 'chapitre', 'corbeaux-envoles', 'meute-attaque', 'loup-abattu', 'coup-recu', 'mort',
    'reveil', 'ennemi-engage', 'ennemi-abattu', 'guetteur-efface', 'coffre-ouvert', 'roi-incline', 'barque-montee', 'barque-quittee',
    'torche-allumee', 'arbre-abattu', 'rocher-brise', 'charognards-fuient']);
  const events = [];
  await page.exposeFunction('__kingviEvent', e => {
    e.etape = currentStep;
    events.push(e);
    if (CAPTURE_ON.has(e.type)) shoot(e.type, e.type === 'chapitre' ? 1500 : e.type === 'mort' ? 1200 : 350);
  });

  await page.goto(`${base}?debug=1&seed=${o.graine}`);
  await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 60000 });
  const K = (fn, ...a) => page.evaluate(([fn, a]) => window.__kingvi[fn](...a), [fn, a]);
  const state = () => page.evaluate(() => window.__kingvi.state());
  await shoot('accueil');
  if (o.vitesse !== 1) await K('timeScale', o.vitesse);
  if (o.heure) await K('setTime', o.heure);
  if (o.meteo) await K('setWeather', o.meteo);
  await K('enter');
  await sleep(2500);
  const trail = await page.evaluate(() => window.__kingvi.trail);
  const places = await page.evaluate(() => window.__kingvi.places);

  // Les captures régulières
  let running = true;
  (async () => { while (running) { await sleep(500); if (Date.now() - lastShot > o.capture * 1000 / Math.max(1, o.vitesse ** 0.5)) await shoot('regulier'); } })();

  // ── Le clavier : les touches physiques (event.code) ; en AZERTY, ZQSD ──
  const LABELS = { azerty: { KeyW: 'z', KeyA: 'q', KeyS: 's', KeyD: 'd' }, qwerty: { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd' } };
  const ARROWS = { KeyW: 'ArrowUp', KeyA: 'ArrowLeft', KeyS: 'ArrowDown', KeyD: 'ArrowRight' };
  const held = new Set();
  async function key(code, down) {
    if (down === held.has(code)) return;
    if (down) held.add(code); else held.delete(code);
    if (code.startsWith('Shift')) { await (down ? page.keyboard.down('Shift') : page.keyboard.up('Shift')); return; }
    if (o.clavier === 'fleches') { await (down ? page.keyboard.down(ARROWS[code]) : page.keyboard.up(ARROWS[code])); return; }
    await page.evaluate(([type, code, key]) => window.dispatchEvent(new KeyboardEvent(type, { code, key, bubbles: true })),
      [down ? 'keydown' : 'keyup', code, LABELS[o.clavier][code]]);
  }
  const release = async () => { for (const c of [...held]) await key(c, false); };
  async function steer(dx, dy, run = false) {
    const want = new Set();
    if (dx > 1.5) want.add('KeyD'); else if (dx < -1.5) want.add('KeyA');
    if (dy > 1.5) want.add('KeyS'); else if (dy < -1.5) want.add('KeyW');
    if (run) want.add('ShiftLeft');
    for (const c of [...held]) if (!want.has(c)) await key(c, false);
    for (const c of want) await key(c, true);
  }
  const gameWait = ms => sleep(ms / o.vitesse);

  // Marcher vers un point ; contourner si l'on reste bloqué. `until` : s'arrêter avant
  async function walkTo(target, { timeout = 30, near = 3, until, run = false } = {}) {
    const t0 = Date.now();
    let last = await state(), stuckSince = Date.now(), detour = null;
    while ((Date.now() - t0) / 1000 * o.vitesse < timeout) {
      const s = await state();
      if (until && until(s)) break;
      if (s.mort || s.accueil) break;
      const dx = target.x - s.x, dy = target.y - s.y;
      if (Math.hypot(dx, dy) < near) break;
      if (Math.hypot(s.x - last.x, s.y - last.y) > 1) { last = s; stuckSince = Date.now(); }
      if (!detour && Date.now() - stuckSince > 1500 / o.vitesse) detour = { until: Date.now() + 900 / o.vitesse, dx: -dy, dy: dx, side: Math.random() < 0.5 ? 1 : -1 };
      if (detour && Date.now() > detour.until) { detour = null; stuckSince = Date.now(); }
      if (detour) await steer(detour.dx * detour.side, detour.dy * detour.side, run);
      else await steer(dx, dy, run);
      await sleep(80);
    }
    await release();
    return state();
  }
  const nearestIndex = s => trail.reduce((b, p, i) => (Math.hypot(p.x - s.x, p.y - s.y) < Math.hypot(trail[b].x - s.x, trail[b].y - s.y) ? i : b), 0);
  // Suivre les traces, pendant `seconds` de jeu (ou jusqu'à l'indice `toIndex`, ou une condition)
  async function followTrail({ seconds = 25, toIndex = trail.length - 1, until, run = false, fromIndex = 0 } = {}) {
    const t0 = Date.now();
    let s = await state(), i = Math.max(fromIndex, nearestIndex(s));
    while ((Date.now() - t0) / 1000 * o.vitesse < seconds && i < toIndex) {
      s = await state();
      if (until && until(s)) break;
      if (s.mort || s.dedans) break;
      i = Math.max(i, nearestIndex(s));
      let j = i;
      while (j < toIndex && Math.hypot(trail[j].x - s.x, trail[j].y - s.y) < 12) j++;
      await walkTo(trail[j], { timeout: 6, near: 4, until, run });
      i = Math.max(i, j - 1);
    }
    await release();
    return state();
  }
  async function strikeAt(x, y) {
    const p = await page.evaluate(([x, y]) => window.__kingvi.toScreen(x, y), [x, y]);
    await page.mouse.click(p.x, p.y);
  }
  // Se battre : frapper ce qui est à portée, s'en approcher sinon
  async function fight({ seconds = 60, target = s => s.ennemi.vivant && s.ennemi.engage ? s.ennemi : null, passive = false } = {}) {
    const t0 = Date.now();
    while ((Date.now() - t0) / 1000 * o.vitesse < seconds) {
      const s = await state();
      if (s.mort) return 'mort';
      const t = target(s);
      if (!t) return 'fini';
      if (passive) { await release(); await sleep(200); continue; }
      const d = Math.hypot(t.x - s.x, t.y - s.y);
      if (d > 11) { await steer(t.x - s.x, t.y - s.y); await sleep(90); continue; }
      await release();
      if (s.endurance > 0.25) await strikeAt(t.x, t.y - 3);
      await gameWait(420);
    }
    await release();
    return 'temps';
  }
  const wolfTarget = s => {
    if (!s.meute.engagee) return null;
    const w = s.meute.loups.filter(l => !['dead', 'hidden', 'leave'].includes(l.etat))
      .sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y))[0];
    return w || null;
  };
  const waitFor = async (test, seconds = 20) => {
    const t0 = Date.now();
    while ((Date.now() - t0) / 1000 * o.vitesse < seconds) { const s = await state(); if (test(s)) return s; await sleep(150); }
    return state();
  };
  const teleport = async lieu => { await release(); await K('teleport', lieu); await gameWait(600); };

  // ── Le parcours ──
  const ACTIONS = {
    async greve() { await teleport('barque'); await followTrail({ seconds: 25 }); },
    async morts() { await teleport('morts'); await followTrail({ seconds: 22 }); },
    async foret() { await teleport('freya-ensevelie'); await followTrail({ seconds: 25 }); },
    async 'foret-noire'() { await teleport('foret-noire'); await followTrail({ seconds: 25 }); },
    async bosquet() {
      await teleport('bosquet');
      await followTrail({ seconds: 40, until: s => s.meute.engagee });
      await fight({ seconds: 70, target: wolfTarget });
      if ((await state()).mort) await waitFor(s => !s.mort, 15);
      // Toujours là : on fuit le long des traces, en courant, jusqu'à les semer
      else if ((await state()).meute.engagee) await followTrail({ seconds: 40, run: true, until: s => !s.meute.engagee });
    },
    async guetteur() { await teleport('guetteur'); await followTrail({ seconds: 20, until: s => s.drapeaux.watcherGone }); await gameWait(2500); },
    async 'freya-debout'() { await teleport('freya-debout'); await followTrail({ seconds: 15 }); },
    async maison() {
      await teleport('maison');
      await followTrail({ seconds: 30, until: s => !!s.dedans });
      let s = await waitFor(x => x.dedans === 'maison', 4);
      if (s.dedans === 'maison') {
        const c = await page.evaluate(() => window.__kingvi.cibles);
        await walkTo({ x: s.x, y: s.y - 22 }, { timeout: 5 });
        await walkTo({ x: s.x - 18, y: s.y - 18 }, { timeout: 5 });
        await gameWait(1500);
        await walkTo({ x: c.entreeMaison.x, y: c.entreeMaison.y + 30 }, { timeout: 15, until: x => !x.dedans });
        s = await waitFor(x => !x.dedans, 4);
      }
      // Les traces qui ressortent, tachées de sang (sans repasser la porte)
      await followTrail({ seconds: 12, fromIndex: trail.findIndex(p => p.sang) + 4 });
    },
    async viking() {
      await teleport('viking');
      await followTrail({ seconds: 30, until: s => s.ennemi.engage });
      // Mort volontaire : on ne lève pas l'épée
      await fight({ seconds: 60, passive: true, target: s => (s.ennemi.vivant ? s.ennemi : null) });
    },
    async reveil() { await waitFor(s => !s.mort && s.zone === 'greve', 20); await gameWait(3000); },
    async victoire() {
      for (let k = 0; k < 4; k++) {
        await teleport('viking');
        await followTrail({ seconds: 30, until: s => s.ennemi.engage });
        const r = await fight({ seconds: 60 });
        if ((await state()).ennemi.vivant === false) break;
        if (r === 'mort') { await shoot('mort'); await waitFor(s => !s.mort, 15); await gameWait(1500); }
      }
      await gameWait(2500);
    },
    async falaise() {
      await teleport('falaise');
      const c = await page.evaluate(() => window.__kingvi.cibles);
      await walkTo({ x: c.porteGrotte.x, y: c.porteGrotte.y - 6 }, { timeout: 30, near: 1, until: s => !!s.dedans });
      await waitFor(s => s.dedans === 'grotte', 4);
    },
    async roi() {
      await teleport('roi');
      const c = await page.evaluate(() => window.__kingvi.cibles);
      await walkTo({ x: c.trone.x, y: c.trone.y + 4 }, { timeout: 30, until: s => s.drapeaux.kingBowed });
      await gameWait(3000);
    },
    async lac() {
      await teleport('lac');
      let c = await page.evaluate(() => window.__kingvi.cibles);
      await walkTo(c.barqueDuLac, { timeout: 15, until: s => s.enBarque });
      await walkTo({ x: c.ilot.x, y: c.ilot.y - 14 }, { timeout: 60, until: s => !s.enBarque && (s.zone !== 'lac' || Math.hypot(s.x - c.ilot.x, s.y - c.ilot.y) < 30) });
      await walkTo({ x: c.ilot.x, y: c.ilot.y - 2 }, { timeout: 15, near: 1, until: s => !!s.dedans });
      let s = await waitFor(x => x.dedans === 'crypte', 4);
      if (s.dedans !== 'crypte') { await teleport('crypte'); s = await state(); }
      c = await page.evaluate(() => window.__kingvi.cibles);
      await walkTo({ x: c.coffre.x, y: c.coffre.y + 2 }, { timeout: 20, until: x => x.drapeaux.chestOpen });
      s = await state();
      if (!s.drapeaux.chestOpen) await strikeAt(c.coffre.x, c.coffre.y);
      await gameWait(2500);
      await walkTo({ x: s.x, y: s.y + 60 }, { timeout: 15, until: x => !x.dedans });
      await gameWait(1500);
    },
  };

  let steps = STEPS.filter(([id]) => o.lac || id !== 'lac');
  const from = o.from ? steps.findIndex(s => s[0] === o.from) : 0, to = o.to ? steps.findIndex(s => s[0] === o.to) : steps.length - 1;
  steps = steps.slice(from, to + 1);
  const stepLog = [];
  const started = Date.now();
  try {
    if (o.reel) {
      currentStep = 'traversee';
      stepLog.push({ id: 'traversee', titre: 'La traversée, à pied', debut: (await state()).tempsJeu });
      await followTrail({ seconds: 4 * 3600, until: s => s.ennemi.engage });
      stepLog.at(-1).fin = (await state()).tempsJeu;
    } else {
      for (const [id, titre] of steps) {
        currentStep = id;
        const s = await state();
        stepLog.push({ id, titre, debut: s.tempsJeu });
        process.stdout.write(`· ${titre}… `);
        try { await ACTIONS[id](); console.log('ok'); } catch (e) { console.log(`ÉCHEC : ${e.message}`); stepLog.at(-1).erreur = e.message; await release(); }
        await shoot('fin d\'étape');
        stepLog.at(-1).fin = (await state()).tempsJeu;
      }
    }
  } finally {
    running = false;
    await shotQueue;
  }
  const final = await state();
  const allEvents = await page.evaluate(() => window.__kingvi.events);
  // (le journal de la page fait foi ; on y reporte l'étape vue par le harnais)
  allEvents.forEach((e, i) => { e.etape = events.find(x => x.t === e.t && x.type === e.type)?.etape ?? null; e.n = i; });
  await browser.close();
  server.close();

  // ── Durées ──
  const durations = computeDurations(allEvents, final, trail, places);
  durations.etapes = stepLog.map(s => ({ ...s, duree: Math.round((s.fin - s.debut) * 10) / 10 }));
  const fpsList = shots.map(x => x.s?.fps).filter(Boolean);
  const run = {
    runId, version, date: new Date().toISOString(), dureeReelle: Math.round((Date.now() - started) / 1000), options: o,
    navigateur: `${o.navigateur} ${browser.version?.() || ''}`.trim(), fps: { moyen: avg(fpsList), min: Math.min(...fpsList), max: Math.max(...fpsList) },
    erreurs: consoleErrors, derniereErreurDuJeu: final.derniereErreur, etatFinal: final, captures: shots.length,
  };
  await writeFile(join(out, 'events.json'), JSON.stringify(allEvents, null, 1));
  await writeFile(join(out, 'durations.json'), JSON.stringify(durations, null, 2));
  await writeFile(join(out, 'run.json'), JSON.stringify(run, null, 2));
  await writeFile(join(out, 'carnet.md'), carnet({ run, events: allEvents, shots, durations, stepLog }));
  console.log(`\nCarnet : ${join(out, 'carnet.md')}`);
  console.log(`${allEvents.length} événements, ${shots.length} captures, ${consoleErrors.length} erreur(s) de console`);
}

const avg = a => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length * 10) / 10 : null);

// Temps passé par zone (temps de jeu), et ce qu'auraient pris à pied les tronçons sautés
function computeDurations(events, final, trail, places) {
  const zones = {}, chapters = {};
  let cur = null, since = 0;
  for (const e of events) {
    if (e.type === 'debut' || e.type === 'entree-en-jeu') { cur = e.zone; since = e.jeu; }
    if (e.type === 'zone') { if (cur) zones[cur] = (zones[cur] || 0) + e.jeu - since; cur = e.vers; since = e.jeu; }
    if (e.type === 'chapitre') chapters[e.titre] = e.jeu;
  }
  if (cur) zones[cur] = (zones[cur] || 0) + final.tempsJeu - since;
  for (const k in zones) zones[k] = Math.round(zones[k] * 10) / 10;
  // Les tronçons téléportés : longueur de piste entre l'endroit quitté et l'arrivée
  const idx = (x, y) => trail.reduce((b, p, i) => (Math.hypot(p.x - x, p.y - y) < Math.hypot(trail[b].x - x, trail[b].y - y) ? i : b), 0);
  const along = (a, b) => { let d = 0; for (let i = Math.min(a, b); i < Math.max(a, b); i++) d += Math.hypot(trail[i + 1].x - trail[i].x, trail[i + 1].y - trail[i].y); return d; };
  const skipped = [];
  for (const e of events.filter(x => x.type === 'teleport')) {
    const p = places[e.vers];
    if (!p || e.x == null || e.zone?.startsWith('interieur')) continue;
    const a = idx(e.x, e.y), b = idx(p.x, p.y);
    if (b > a) skipped.push({ vers: e.vers, pixels: Math.round(along(a, b)), secondesAPied: Math.round(along(a, b) / SPEED) });
  }
  let total = 0;
  for (let i = 0; i < trail.length - 1; i++) total += Math.hypot(trail[i + 1].x - trail[i].x, trail[i + 1].y - trail[i].y);
  return {
    unite: 'secondes de temps de jeu', parZone: zones, chapitresA: chapters, tronconsSautes: skipped,
    pisteEntiere: { pixels: Math.round(total), secondesAPied: Math.round(total / SPEED), minutesAPied: Math.round(total / SPEED / 6) / 10 },
  };
}

// ── Le carnet : un récit factuel, sans un mot de code ──
const ZONES = { greve: 'la grève', plaine: 'la plaine enneigée', morts: 'la plaine des morts (pierres levées)', foret: 'la forêt', noire: 'la forêt noire',
  bosquet: 'la grande clairière du bosquet', maison: 'les abords de la maison', autre: 'le bout des traces', falaise: 'le pied de la falaise', lac: 'le lac',
  'interieur:maison': 'l\'intérieur de la maison', 'interieur:crypte': 'la crypte, sous la statue de l\'îlot', 'interieur:grotte': 'la grotte' };
// (les sons des coups sont déjà dits par les coups eux-mêmes)
const SOUNDS = { howl: 'des loups hurlent', growl: 'un loup gronde', caw: 'des corbeaux croassent', creak: 'un grincement', presence: 'un souffle étrange, une présence' };
const PLACES_FR = { barque: 'la barque, sur la grève', morts: 'l\'entrée de la plaine des morts', foret: 'l\'orée de la forêt', 'freya-ensevelie': 'un peu avant la statue ensevelie',
  'foret-noire': 'l\'entrée de la forêt noire', bosquet: 'la sente, avant la grande clairière', guetteur: 'la sente, plus loin dans la forêt noire',
  'freya-debout': 'la sortie de la forêt', maison: 'les traces, avant la maison', interieur: 'le seuil de la maison', viking: 'les traces, avant leur bout',
  falaise: 'le pied de la falaise', grotte: 'l\'entrée de la grotte', roi: 'le fond de la grotte', lac: 'la rive du lac', ilot: 'l\'îlot', crypte: 'la crypte' };
function sentence(e) {
  switch (e.type) {
    case 'debut': return `La partie commence : ${ZONES[e.zone] || e.zone}. Moment de la journée : ${e.jour} ; vent : ${e.vent}.`;
    case 'entree-en-jeu': return 'L\'écran d\'accueil s\'efface ; le noir s\'ouvre sur le viking.';
    case 'accueil': return 'Retour à l\'écran d\'accueil.';
    case 'teleport': return `*(Saut du script → ${PLACES_FR[e.vers] || e.vers}.)*`;
    case 'zone': return `Lieu : ${ZONES[e.vers] || e.vers}.`;
    case 'entree': return `Il entre dans ${e.lieu === 'maison' ? 'la maison' : e.lieu === 'crypte' ? 'la crypte' : 'la grotte'}.`;
    case 'sortie': return `Il ressort de ${e.lieu === 'maison' ? 'la maison' : e.lieu === 'crypte' ? 'la crypte' : 'la grotte'}.`;
    case 'chapitre': return `**Un titre s'inscrit à l'écran : « ${e.titre} ».**`;
    case 'corbeaux-envoles': return 'Une volée de corbeaux s\'envole à son approche.';
    case 'charognards-fuient': return 'Les corbeaux posés sur un cadavre s\'envolent.';
    case 'meute-attaque': return '**Des loups sortent de la forêt et l\'encerclent.**';
    case 'meute-fin': return 'Les loups ne l\'attaquent plus.';
    case 'loup-abattu': return `Un loup tombe (${e.morts} abattu${e.morts > 1 ? 's' : ''}).`;
    case 'guetteur-efface': return 'La grande silhouette encapuchonnée vacille et disparaît.';
    case 'coffre-ouvert': return 'Le coffre s\'ouvre.';
    case 'roi-incline': return 'Sur le trône, la tête du roi mort tombe ; sa couronne roule à ses pieds.';
    case 'barque-montee': return 'Il monte dans la barque et prend les rames.';
    case 'barque-quittee': return 'Il aborde et descend de la barque.';
    case 'torche-allumee': return 'Il fait sombre : il allume une torche.';
    case 'torche-eteinte': return 'La torche s\'éteint.';
    case 'frappe': return null;
    case 'coup-donne': return { ennemi: `Son coup touche l'autre viking (il lui reste ${e.ennemiPv}).`, loup: 'Son coup touche un loup.', arbre: 'Son coup frappe un arbre, qui tremble et perd sa neige.',
      pierre: 'Son coup frappe la pierre : étincelles, la lame rebondit.', air: 'Il frappe dans le vide.' }[e.cible];
    case 'coup-recu': return `**Il est blessé par ${e.source === 'loup' ? 'un loup' : 'l\'autre viking'} (il lui reste ${e.pv} sur 3).**`;
    case 'mort': return '**Il tombe, mort.**';
    case 'reveil': return 'Il se réveille près de la barque, sur la grève.';
    case 'ennemi-engage': return '**L\'autre viking l\'a vu : il vient au contact.**';
    case 'ennemi-abattu': return '**L\'autre viking s\'effondre.**';
    case 'arbre-abattu': return 'Un arbre s\'abat dans la neige.';
    case 'rocher-brise': return 'Un rocher éclate en morceaux.';
    case 'jour': return `Le jour tourne : ${e.phase}.`;
    case 'vent': return `Le vent change : ${e.phase}.`;
    case 'essouffle': return 'Trop essoufflé pour frapper.';
    case 'musique': return `La musique se fait ${e.humeur}.`;
    case 'silence': return 'La musique se tait un instant.';
    case 'son': return SOUNDS[e.son] ? `On entend : ${SOUNDS[e.son]}.` : null;
    case 'heure-forcee': return `*(Le harnais règle l'heure : ${e.phase}.)*`;
    case 'meteo-forcee': return `*(Le harnais règle le temps : ${e.ambiance}.)*`;
    case 'vitesse': return `*(Le harnais accélère le jeu ×${e.facteur}.)*`;
    default: return null;
  }
}
function carnet({ run, events, shots, durations, stepLog }) {
  const o = run.options;
  const L = [];
  L.push(`# Carnet de partie — ${run.runId}`, '');
  L.push(`Version ${run.version} · ${run.navigateur} · fenêtre ${o.taille} · clavier ${o.clavier} · qualité ${o.qualite}`
    + `${o.heure ? ` · heure forcée : ${o.heure}` : ''}${o.meteo ? ` · temps forcé : ${o.meteo}` : ''} · vitesse ×${o.vitesse}`, '');
  L.push('Ce carnet raconte une partie jouée par un script : le viking suit les traces au clavier, comme un joueur. '
    + 'Entre deux étapes, le script saute d\'un lieu à l\'autre (indiqué *en italique*) : ces sauts ne font pas partie du jeu. '
    + 'Les heures sont en temps de jeu (minutes:secondes). Les captures sont muettes ; les sons entendus sont écrits.', '');
  L.push('## Durées', '', '| Lieu | Temps passé |', '|---|---|');
  for (const [z, s] of Object.entries(durations.parZone).sort((a, b) => b[1] - a[1])) L.push(`| ${ZONES[z] || z} | ${clock(s)} |`);
  L.push('', `Les traces, de la barque à leur bout, font ${durations.pisteEntiere.pixels} pixels : environ ${durations.pisteEntiere.minutesAPied} minutes de marche sans s'arrêter.`, '');
  // Le récit, étape par étape ; les sons et la musique regroupés pour rester lisible
  const shotsByTime = [...shots];
  let si = 0;
  const NOISY = new Set(['son', 'musique', 'silence']);
  for (const step of stepLog) {
    L.push(`## ${step.titre}`, '');
    const evs = events.filter(e => (e.etape ? e.etape === step.id : e.jeu >= step.debut - 0.05 && e.jeu <= (step.fin ?? Infinity) + 0.05));
    let pendingNoise = [];
    const flushNoise = () => {
      if (!pendingNoise.length) return;
      const text = [...new Set(pendingNoise.map(sentence).filter(Boolean))].join(' ');
      if (text) L.push(`- \`${clock(pendingNoise[0].jeu)}\` ${text}`);
      pendingNoise = [];
    };
    for (const e of evs) {
      if (e.used) continue;
      e.used = true;
      while (si < shotsByTime.length && shotsByTime[si].jeu != null && shotsByTime[si].jeu <= e.jeu) {
        flushNoise();
        const s = shotsByTime[si++];
        if (s.step === step.id || !s.step) L.push('', `![${clock(s.jeu)} — ${ZONES[s.zone] || s.zone || ''}](${s.file})`, '');
      }
      if (e.type === 'frappe') continue;
      if (NOISY.has(e.type)) { pendingNoise.push(e); continue; }
      flushNoise();
      const t = sentence(e);
      if (t) L.push(`- \`${clock(e.jeu)}\` ${t}`);
    }
    flushNoise();
    while (si < shotsByTime.length && (shotsByTime[si].step === step.id || shotsByTime[si].jeu == null)) {
      const s = shotsByTime[si++];
      L.push('', `![${clock(s.jeu ?? 0)} — ${ZONES[s.zone] || s.zone || ''}](${s.file})`, '');
    }
    if (step.erreur) L.push('', `> Le script n'a pas pu finir cette étape : ${step.erreur}`);
    L.push('');
  }
  const f = run.etatFinal;
  L.push('## Fin de la partie', '');
  L.push(`- Chapitres vus : ${f.chapitres.length} (${f.chapitres.join(', ') || 'aucun'})`);
  L.push(`- Autre viking : ${f.drapeaux.foeDead ? 'abattu' : 'vivant'} · loups abattus : ${f.meute.morts} sur 4 · coffre : ${f.drapeaux.chestOpen ? 'ouvert' : 'fermé'} · roi : ${f.drapeaux.kingBowed ? 'tête tombée' : 'assis'}`);
  L.push(`- Arbres abattus : ${f.compteur.trees} · rochers brisés : ${f.compteur.rocks}`);
  L.push(`- Images par seconde (moyenne) : ${run.fps.moyen} · erreurs : ${run.erreurs.length}`);
  return L.join('\n') + '\n';
}

main().catch(e => { console.error(e); process.exit(1); });
