// Vérifie la reprise : une sauvegarde debug avec l'autre viking abattu,
// un loup mort et le guetteur parti est-elle restituée au chargement ?
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const require = createRequire('/home/user/kingvi/tools/playtest/package.json');
const { chromium } = require('playwright');
const root = '/home/user/kingvi';
const types = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.md':'text/markdown' };
const server = createServer(async (req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  try { const b = await readFile(p); res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const { WORLD_VERSION } = await import(root + '/js/world.js');
const save = { world: WORLD_VERSION, x: 5145, y: 2660, foeDead: true, watcherGone: true,
  chapters: ['greve','noire','loups','maison','autre'], wolvesDead: [{ i: 0, x: 3190, y: 2242, dir: 1 }],
  tally: { trees: 2, rocks: 1 }, chestOpen: false, kingBowed: false };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('kingvi:debug:save', s); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(save));
await page.goto(base + '?debug=1&seed=7');
await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 60000 });
await page.evaluate(() => window.__kingvi.enter());
await page.waitForTimeout(4000);
const s = await page.evaluate(() => window.__kingvi.state());
console.log(JSON.stringify({ x: s.x, y: s.y, zone: s.zone, ennemi: s.ennemi, meute: { vivants: s.meute.vivants, morts: s.meute.morts }, chapitres: s.chapitres, drapeaux: s.drapeaux, compteur: s.compteur, errors }, null, 1));
await page.screenshot({ path: '/home/user/kingvi/playtests/v1.22.1/20261001-1625-light/tests/reprise.png' });
await browser.close(); server.close();
