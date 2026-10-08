// Script jetable : les nouveautés visuelles de v1.66.0 (pont, souche, éboulis, falaise, mons, rochers).
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT = process.env.KROOT || '/home/user/kingvi';
const OUT = '/home/user/kingvi/playtests/v1.66.0/20261008-0842-lineaire/tests/rendu';
const require = createRequire('/home/user/kingvi/tools/playtest/package.json');
const pw = require('playwright');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = await new Promise(r => { const s = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname); const f = join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
  if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); res.end(await readFile(f));
}); s.listen(0, '127.0.0.1', () => r(s)); });
const cfg = Object.assign({ nav: 'chromium', q: 1, heure: null, tag: 'nv' }, JSON.parse(process.argv[2] || '{}'));
const browser = await pw[cfg.nav].launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
await ctx.addInitScript(q => { localStorage.setItem('kingvi:prefs', JSON.stringify({ quality: q, wind: 'cycle', dayOffset: 0, musicVol: 0, sfxVol: 0, windVol: 0, tuto: true })); }, cfg.q);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto(`http://127.0.0.1:${server.address().port}/?debug=1&seed=7`);
await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 90000 });
const K = (fn, ...a) => page.evaluate(([fn, a]) => window.__kingvi[fn](...a), [fn, a]);
await K('setWeather', 'calme');
if (cfg.heure) await K('setTime', cfg.heure);
await K('enter');
await page.waitForTimeout(4000);
if (cfg.zoom) { await page.mouse.move(640, 420); for (let i = 0; i < cfg.zoom; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(300); } }
const shot = async n => { await page.waitForTimeout(800); await page.screenshot({ path: join(OUT, `${cfg.tag}-${n}.png`) }); };
const cib = () => page.evaluate(() => window.__kingvi.cibles);
const st = () => K('state');
async function hitUntil(target, done, max = 40) {
  for (let i = 0; i < max; i++) {
    if (await done()) return true;
    const me = await st();
    const tx = target.x > me.x + 2 ? me.x + 30 : target.x < me.x - 2 ? me.x - 30 : me.x, ty = target.x === undefined ? me.y : (Math.abs(target.x - me.x) > 2 ? me.y - 5 : target.y - 6);
    const p = await page.evaluate(([x, y]) => window.__kingvi.toScreen(x, y), [tx, ty]);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(450);
  }
  return done();
}
const log = {};
// 1. Le ravin, l'arbre debout, puis abattu, puis sur le tronc
await K('teleport', 'ravin'); await shot('ravin-avant');
const c = await cib();
log.pont = await hitUntil(c.arbrePont, async () => (await st()).drapeaux.pont);
await page.waitForTimeout(2500); await shot('ravin-pont');
// marcher vers l'est sur le tronc
await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD', key: 'd', bubbles: true })));
await page.waitForTimeout(1200); await shot('ravin-sur-tronc');
await page.waitForTimeout(1500);
await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD', key: 'd', bubbles: true })));
log.apresPont = await st(); await shot('ravin-traverse');
// 2. Le mons (près de la lanterne)
await K('teleport', 'lanterne'); await page.waitForTimeout(2500); await shot('lanterne');
log.mons = (await cib()).mons;
// 3. L'éboulis, puis brisé
const e = (await cib()).eboulis;
await K('teleport', { x: e.x, y: e.y + 16 }); await shot('eboulis-avant');
log.eboulis = await hitUntil(e, async () => !(await st()).drapeaux.eboulis, 60);
await page.waitForTimeout(1500); await shot('eboulis-apres');
// 4. La falaise, plus large
await K('teleport', 'falaise'); await shot('falaise');
await K('teleport', 'sente'); await shot('sente');
// 5. La maison, la plaine des morts (rochers), la Véla debout
for (const l of ['maison', 'morts', 'freya-debout', 'viking']) { await K('teleport', l); await shot(l); }
log.final = await st();
writeFileSync(join(OUT, cfg.tag + '.json'), JSON.stringify({ cfg, errors, log }, null, 1));
console.log(JSON.stringify({ errors, pont: log.pont, eboulis: log.eboulis, mons: log.mons, err: log.final.derniereErreur }));
await browser.close(); server.close();
