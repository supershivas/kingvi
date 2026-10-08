// Script jetable du testeur-rendu : charge le jeu en debug, téléporte, capture en PNG, mesure.
// node rendu.mjs '<json config>'  → écrit tests/rendu/<nom>.png et .json
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT = process.env.KROOT || '/home/user/kingvi';
const OUT = '/home/user/kingvi/playtests/v1.66.0/20261008-0842-lineaire/tests/rendu';
const require = createRequire('/home/user/kingvi/tools/playtest/package.json');
const pw = require('playwright');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const server = await new Promise(r => { const s = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname); const f = join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
  if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(await readFile(f));
}); s.listen(0, '127.0.0.1', () => r(s)); });
const cfg = Object.assign({ nav: 'chromium', taille: '1280x800', dpr: 1, q: 1, lieux: ['barque'], heure: null, meteo: 'calme', tag: 'x', attente: 3500, switchQ: null, extra: null }, JSON.parse(process.argv[2] || '{}'));
const [w, h] = cfg.taille.split('x').map(Number);
const browser = await pw[cfg.nav].launch();
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: cfg.dpr });
await ctx.addInitScript(q => { localStorage.setItem('kingvi:prefs', JSON.stringify({ quality: q, wind: 'cycle', dayOffset: 0, musicVol: 0, sfxVol: 0, windVol: 0, tuto: true })); }, cfg.q);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
const base = `http://127.0.0.1:${server.address().port}/`;
await page.goto(`${base}?debug=1&seed=7`);
await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 90000 });
const K = (fn, ...a) => page.evaluate(([fn, a]) => window.__kingvi[fn](...a), [fn, a]);
if (cfg.meteo) await K('setWeather', cfg.meteo);
if (cfg.heure) await K('setTime', cfg.heure);
await K('enter');
await page.waitForTimeout(4000);
const measure = () => page.evaluate(() => {
  const k = window.__kingvi, sc = k.scene, c = sc.game.canvas, r = c.getBoundingClientRect(), dpr = devicePixelRatio;
  const scr = document.getElementById('screen'), sr = scr.getBoundingClientRect();
  const sight = document.getElementById('sight'), sg = sight.getBoundingClientRect();
  const sky = document.querySelector('.stage .sky'), sk = sky?.getBoundingClientRect();
  const cam = sc.cameras.main, s = k.state();
  const p = k.toScreen(sc.pos.x, sc.pos.y);
  const cs = getComputedStyle(scr);
  return { dpr, canvas: { w: c.width, h: c.height, cssW: r.width, cssH: r.height, left: r.left, top: r.top, styleW: c.style.width },
    physPerPx: r.width * dpr / c.width, physPerPxY: r.height * dpr / c.height,
    screen: { left: sr.left, top: sr.top, w: sr.width, h: sr.height }, sight: { w: sight.width, h: sight.height, cssW: sg.width, cssH: sg.height, left: sg.left, top: sg.top },
    sky: sky && { w: sky.width, h: sky.height, cssW: sk.width, cssH: sk.height },
    camZoom: cam.zoom, factor: sc.zoom?.canvas, px: cs.getPropertyValue('--px'), line: cs.getPropertyValue('--line'), sightRx: cs.getPropertyValue('--sight-rx'),
    classes: scr.className, viking: p, center: { x: sr.left + sr.width / 2, y: sr.top + sr.height / 2 },
    state: { x: s.x, y: s.y, zone: s.zone, jour: s.jour, nuit: s.nuit, torche: s.torche, fps: s.fps, zoom: s.zoom, morceaux: s.morceauxEnAttente, err: s.derniereErreur, dedans: s.dedans } };
});
const res = [];
for (const lieu of cfg.lieux) {
  if (typeof lieu === 'string') await K('teleport', lieu); else await K('teleport', lieu);
  await page.waitForTimeout(cfg.attente);
  if (cfg.switchQ) for (const q of cfg.switchQ) {
    await page.evaluate(q => { const i = document.getElementById('opt-quality'); i.value = String(q); i.dispatchEvent(new Event('input')); }, q);
    await page.waitForTimeout(1500);
    const name = `${cfg.tag}-${typeof lieu === 'string' ? lieu : 'pt'}-sw${q}`;
    await page.screenshot({ path: join(OUT, name + '.png') });
    res.push({ name, lieu, q, m: await measure() });
  } else {
    const name = `${cfg.tag}-${typeof lieu === 'string' ? lieu : 'pt'}`;
    // FPS sur 3 s
    const fps = [];
    for (let i = 0; i < 6; i++) { fps.push((await K('state')).fps); await page.waitForTimeout(500); }
    await page.screenshot({ path: join(OUT, name + '.png') });
    res.push({ name, lieu, fps, m: await measure() });
  }
}
const final = await K('state');
writeFileSync(join(OUT, cfg.tag + '.json'), JSON.stringify({ cfg, errors, res, derniereErreur: final.derniereErreur }, null, 1));
console.log(JSON.stringify({ tag: cfg.tag, errors, n: res.length, err: final.derniereErreur }));
await browser.close(); server.close();
