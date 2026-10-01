// Script jetable du testeur-rendu (2) : navigateurs, combat + changement de qualité, chargement, écran figé, CRT (--px)
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = '/home/user/kingvi';
const require = createRequire(join(ROOT, 'tools/playtest/package.json'));
const pw = require('playwright');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/markdown', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
  if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(await readFile(f));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const [nav, dprS, q0S, mode] = process.argv.slice(2);
const dpr = Number(dprS), q0 = Number(q0S);
const browser = await pw[nav].launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: dpr });
await ctx.addInitScript(p => { localStorage.setItem('kingvi:prefs', JSON.stringify(p)); },
  { quality: q0, wind: 'calme', windCycle: false, dayOffset: 0, musicVol: 0, sfxVol: 0, windVol: 0 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
const tag = `${nav}-d${dpr}-q${q0}-${mode}`;
const log = (...a) => console.log(tag, ...a);
const probe = () => page.evaluate(() => {
  const s = window.__kingvi.state(), cv = document.querySelector('#stage canvas'), r = cv.getBoundingClientRect();
  const crt = document.querySelector('.crt-layer');
  const sc = window.__kingviScene;
  return { zoom: s.zoom, fps: s.fps, zone: s.zone, pv: s.pv, meute: s.meute.etat, engagee: s.meute.engagee, torche: s.torche, jour: s.jour, attente: s.morceauxEnAttente, err: s.derniereErreur,
    canvas: `${cv.width}x${cv.height} css ${r.width}x${r.height}`, stagePx: getComputedStyle(document.getElementById('stage')).getPropertyValue('--px'),
    crtPx: getComputedStyle(crt).getPropertyValue('--px') || '(non défini)', crtBg: getComputedStyle(crt).backgroundImage.slice(0, 200), classes: document.getElementById('screen').className };
});
const shot = async name => { await page.screenshot({ path: join(HERE, 'rendu', `${tag}-${name}.png`) }); return `tests/rendu/${tag}-${name}.png`; };
const same = async () => { const a = await page.screenshot(); await sleep(1200); const b = await page.screenshot(); return a.equals(b); };
try {
  await page.goto(`${base}?debug=1&seed=7`);
  await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 120000 });
  await page.evaluate(() => window.__kingvi.setWeather('calme'));
  await page.evaluate(() => window.__kingvi.enter());
  await sleep(4000);
  log('entrée', JSON.stringify(await probe()));
  if (mode === 'parcours') {
    // Le même parcours partiel dans les trois navigateurs : grève, forêt noire (nuit), maison, grotte
    for (const [lieu, heure] of [['barque', 'jour'], ['morts', 'jour'], ['foret-noire', 'nuit'], ['bosquet', 'nuit'], ['maison', 'jour'], ['interieur', 'jour'], ['grotte', 'jour']]) {
      await page.evaluate(h => window.__kingvi.setTime(h), heure);
      const t0 = Date.now();
      await page.evaluate(l => window.__kingvi.teleport(l), lieu);
      const tTp = Date.now() - t0;
      await sleep(1500);
      const p1 = await probe();
      await shot(`${lieu}-1s`);
      await sleep(4000);
      const p2 = await probe();
      const fig = await same();
      await shot(`${lieu}`);
      const fps = []; for (let i = 0; i < 3; i++) { await sleep(1000); fps.push((await probe()).fps); }
      log(lieu, heure, 'teleport ms', tTp, 'attente@1.5s', p1.attente, 'attente@5.5s', p2.attente, 'zoom', p2.zoom, 'torche', p2.torche, 'figé(2 captures identiques)', fig, 'fps', fps.join('/'), 'err', p2.err);
    }
  }
  if (mode === 'combat') {
    await page.evaluate(() => window.__kingvi.setTime('jour'));
    await page.evaluate(() => window.__kingvi.teleport('bosquet'));
    await sleep(2000);
    const den = await page.evaluate(() => window.__kingvi.cibles['tanière']);
    // Marcher vers la tanière
    for (let i = 0; i < 80; i++) {
      const s = await page.evaluate(() => window.__kingvi.state());
      if (s.meute.engagee) break;
      const dx = den.x - s.x, dy = den.y - s.y;
      const codes = []; if (dx > 2) codes.push('KeyD'); else if (dx < -2) codes.push('KeyA'); if (dy > 2) codes.push('KeyS'); else if (dy < -2) codes.push('KeyW');
      for (const c of ['KeyD', 'KeyA', 'KeyS', 'KeyW']) await page.evaluate(([c, d]) => window.dispatchEvent(new KeyboardEvent(d ? 'keydown' : 'keyup', { code: c, bubbles: true })), [c, codes.includes(c)]);
      await sleep(300);
    }
    for (const c of ['KeyD', 'KeyA', 'KeyS', 'KeyW']) await page.evaluate(c => window.dispatchEvent(new KeyboardEvent('keyup', { code: c, bubbles: true })), c);
    await sleep(3500);
    log('combat', JSON.stringify(await probe()));
    await shot('combat');
    for (const q of [1, 4, 2, 3]) {
      await page.evaluate(q => { const r = document.querySelector('#opt-quality'); r.value = q; r.dispatchEvent(new Event('input', { bubbles: true })); }, q);
      await sleep(2500);
      // frapper pendant le combat
      await page.mouse.click(700, 420); await sleep(600);
      const p = await probe();
      log('qualité→', q, JSON.stringify(p));
      await shot(`combat-q${q}`);
    }
    // s'éloigner : fin du combat, retour au zoom de repos
    await page.evaluate(() => window.__kingvi.teleport('foret-noire'));
    await sleep(4000);
    log('après combat', JSON.stringify(await probe()));
    // molette, puis retour
    await page.mouse.move(640, 400); await page.mouse.wheel(0, -300); await sleep(2500);
    log('molette +', JSON.stringify(await probe()));
    await page.mouse.wheel(0, 300); await sleep(2500);
    log('molette 0', JSON.stringify(await probe()));
  }
} catch (e) { log('ERREUR', e.message); }
const s = await page.evaluate(() => window.__kingvi?.state()).catch(() => null);
log('derniereErreur', s?.derniereErreur ?? null, 'erreurs console', JSON.stringify(errors));
await browser.close(); server.close();
