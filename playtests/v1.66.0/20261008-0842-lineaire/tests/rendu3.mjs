// Script jetable du testeur-rendu (2e passe) : étapes libres (JSON), captures PNG + mesures.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT = process.env.KROOT || '/home/user/kingvi';
const OUT = '/home/user/kingvi/playtests/v1.66.0/20261008-0842-lineaire/tests/rendu2';
const require = createRequire('/home/user/kingvi/tools/playtest/package.json');
const pw = require('playwright');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const server = await new Promise(r => { const s = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname); const f = join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
  if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(await readFile(f));
}); s.listen(0, '127.0.0.1', () => r(s)); });
const cfg = Object.assign({ nav: 'chromium', taille: '1280x800', dpr: 1, q: 1, heure: null, meteo: 'calme', tag: 'x', steps: [] }, JSON.parse(process.argv[2] || '{}'));
const [w, h] = cfg.taille.split('x').map(Number);
const browser = await pw[cfg.nav].launch();
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: cfg.dpr });
await ctx.addInitScript(q => { localStorage.setItem('kingvi:prefs', JSON.stringify({ quality: q, wind: 'cycle', dayOffset: 0, musicVol: 0, sfxVol: 0, windVol: 0, tuto: true })); }, cfg.q);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto(`http://127.0.0.1:${server.address().port}/?debug=1&seed=7`);
await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 120000 });
const K = (fn, ...a) => page.evaluate(([fn, a]) => window.__kingvi[fn](...a), [fn, a]);
if (cfg.meteo) await K('setWeather', cfg.meteo);
if (cfg.heure) await K('setTime', cfg.heure);
await K('enter');
await page.waitForTimeout(4000);
const measure = () => page.evaluate(() => {
  const k = window.__kingvi, sc = k.scene, c = sc.game.canvas, r = c.getBoundingClientRect(), dpr = devicePixelRatio;
  const scr = document.getElementById('screen'), sr = scr.getBoundingClientRect();
  const sight = document.getElementById('sight'), sg = sight.getBoundingClientRect();
  const s = k.state(), p = k.toScreen(sc.pos.x, sc.pos.y), cs = getComputedStyle(scr);
  return { dpr, canvas: { w: c.width, h: c.height, cssW: r.width, cssH: r.height, left: r.left, top: r.top }, physPerPx: r.width * dpr / c.width,
    screen: { left: sr.left, top: sr.top, w: sr.width, h: sr.height }, sight: { w: sight.width, h: sight.height, cssW: sg.width, cssH: sg.height },
    camZoom: sc.cameras.main.zoom, px: cs.getPropertyValue('--px'), line: cs.getPropertyValue('--line'), rx: cs.getPropertyValue('--sight-rx'), ry: cs.getPropertyValue('--sight-ry'),
    classes: scr.className, viking: p, center: { x: sr.left + sr.width / 2, y: sr.top + sr.height / 2 },
    state: { x: s.x, y: s.y, zone: s.zone, jour: s.jour, nuit: s.nuit, torche: s.torche, fps: s.fps, morceaux: s.morceauxEnAttente, err: s.derniereErreur, dedans: s.dedans, pv: s.pv, ennemi: s.ennemi?.etat, engage: s.ennemi?.engage } };
});
const setQ = q => page.evaluate(q => { const i = document.getElementById('opt-quality'); i.value = String(q); i.dispatchEvent(new Event('input')); i.dispatchEvent(new Event('change')); }, q);
const res = [];
const shot = async n => { await page.screenshot({ path: join(OUT, `${cfg.tag}-${n}.png`) }); res.push({ name: `${cfg.tag}-${n}`, m: await measure() }); };
const key = async (code, ms) => { await page.keyboard.down(code); await page.waitForTimeout(ms); await page.keyboard.up(code); };
for (const s of cfg.steps) {
  if (s.tp) { await K('teleport', s.tp); await page.waitForTimeout(s.wait ?? 3000); }
  if (s.pt) { await K('teleport', s.pt); await page.waitForTimeout(s.wait ?? 3000); }
  if (s.q) { await setQ(s.q); await page.waitForTimeout(s.wait ?? 1500); }
  if (s.key) { await key(s.key, s.ms || 1000); await page.waitForTimeout(300); }
  if (s.fell) { // abattre l'arbre du pont
    for (let i = 0; i < 30; i++) { const st = await K('state'); if (st.drapeaux.pont) break; const c = await page.evaluate(() => window.__kingvi.cibles.arbrePont);
      const p = await page.evaluate(([x, y]) => window.__kingvi.toScreen(x, y), [c.x, c.y - 4]); await page.mouse.click(p.x, p.y); await page.waitForTimeout(400); }
    await page.waitForTimeout(3000);
  }
  if (s.foe) { // marcher vers l'autre viking jusqu'au contact, cliquer vers lui
    for (let i = 0; i < 40; i++) { const st = await K('state'); if (st.ennemi.distance < 30) break; await key('KeyD', 400); }
    for (let i = 0; i < (s.clicks || 0); i++) { const c = await page.evaluate(() => window.__kingvi.cibles.ennemi); const p = await page.evaluate(([x, y]) => window.__kingvi.toScreen(x, y), [c.x, c.y - 4]); await page.mouse.click(p.x, p.y); await page.waitForTimeout(350); }
  }
  if (s.waitMs) await page.waitForTimeout(s.waitMs);
  if (s.shot) await shot(s.shot);
}
const final = await K('state');
writeFileSync(join(OUT, cfg.tag + '.json'), JSON.stringify({ cfg, errors, res, final }, null, 1));
console.log(JSON.stringify({ tag: cfg.tag, errors, n: res.length, err: final.derniereErreur, pv: final.pv }));
await browser.close(); server.close();
