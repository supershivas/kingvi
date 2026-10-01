// Changer de qualité en jeu : taille du canevas affiché, pour chaque passage de niveau
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.KROOT || '/home/user/kingvi';
const require = createRequire('/home/user/kingvi/tools/playtest/package.json');
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
const [nav, dprS, seq] = process.argv.slice(2);
const qs = seq.split(',').map(Number);
const browser = await pw[nav].launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: Number(dprS) });
await ctx.addInitScript(p => { localStorage.setItem('kingvi:prefs', JSON.stringify(p)); }, { quality: qs[0], wind: 'calme', windCycle: false, musicVol: 0, sfxVol: 0, windVol: 0 });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(`${base}?debug=1&seed=7`);
await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 120000 });
await page.evaluate(() => window.__kingvi.enter()); await sleep(4000);
const probe = () => page.evaluate(() => { const cv = document.querySelector('#stage canvas'), r = cv.getBoundingClientRect(), st = document.getElementById('stage').getBoundingClientRect();
  return `canevas ${cv.width}x${cv.height}, affiché ${r.width}x${r.height} (scène ${st.width}x${st.height}) zoom ${window.__kingvi.state().zoom}`; });
console.log(nav, 'dpr', dprS, 'q', qs[0], await probe());
for (const q of qs.slice(1)) {
  await page.evaluate(q => { const r = document.querySelector('#opt-quality'); r.value = q; r.dispatchEvent(new Event('input', { bubbles: true })); }, q);
  await sleep(2000);
  console.log(nav, 'dpr', dprS, '→ q', q, await probe());
}
await page.screenshot({ path: join(HERE, 'rendu', `qualite-${nav}-d${dprS}-${qs.join('')}.png`) });
await page.setViewportSize({ width: 1279, height: 800 }); await sleep(1500);
console.log(nav, 'dpr', dprS, 'après redimensionnement de la fenêtre', await probe());
console.log('erreurs', JSON.stringify(errs));
await browser.close(); server.close();
