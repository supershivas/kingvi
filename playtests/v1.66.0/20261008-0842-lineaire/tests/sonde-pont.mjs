// Script jetable : où est le tronc du pont, est-il visible ?
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
const browser = await pw.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => localStorage.setItem('kingvi:prefs', JSON.stringify({ quality: 1, wind: 'cycle', musicVol: 0, sfxVol: 0, windVol: 0, tuto: true })));
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/?debug=1&seed=7`);
await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 90000 });
const K = (fn, ...a) => page.evaluate(([fn, a]) => window.__kingvi[fn](...a), [fn, a]);
await K('setWeather', 'calme'); await K('setTime', 'jour'); await K('enter'); await page.waitForTimeout(3000);
await page.mouse.move(640, 420); for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(300); }
await K('teleport', 'ravin');
const c = await page.evaluate(() => window.__kingvi.cibles);
for (let i = 0; i < 30 && !(await K('state')).drapeaux.pont; i++) {
  await K('teleport', { x: c.arbrePont.x - 9, y: c.arbrePont.y + 1 }); await page.waitForTimeout(200);
  const s = await K('state'); const p = await page.evaluate(([x, y]) => window.__kingvi.toScreen(x, y), [s.x + 30, s.y - 5]);
  await page.mouse.click(p.x, p.y); await page.waitForTimeout(450);
}
await page.waitForTimeout(3000);
const info = () => page.evaluate(() => {
  const sc = window.__kingvi.scene;
  const all = []; const walk = l => { for (const o of l) { all.push(o); if (o.list) walk(o.list); } }; walk(sc.children.list);
  const logs = all.filter(o => o.texture?.key === 'pont-tronc').map(o => ({ x: o.x, y: o.y, w: o.width, h: o.height, depth: o.depth, vis: o.visible, alpha: o.alpha }));
  const src = sc.textures.get('pont-tronc').getSourceImage();
  return { pont: window.__kingvi.state().drapeaux.pont, n: all.length, stumps: all.filter(o => o.texture?.key === 'souche').length, logs, tex: [src.width, src.height], pos: { x: sc.pos.x, y: sc.pos.y }, depthPlayer: sc.player?.depth };
});
console.log('apres chute', JSON.stringify(await info()), JSON.stringify(c.arbrePont));
await page.screenshot({ path: join(OUT, 'sonde-pont-1.png') });
console.log('ecran du tronc', JSON.stringify(await page.evaluate(() => { const k = window.__kingvi; return [k.toScreen(1008, 3227), k.toScreen(1036, 3232)]; })));
console.log('objets pres du tronc', JSON.stringify(await page.evaluate(() => { const sc = window.__kingvi.scene; const all = []; const walk = l => { for (const o of l) { all.push(o); if (o.list) walk(o.list); } }; walk(sc.children.list);
  return all.filter(o => o.visible && o.texture && Math.abs(o.x - 1020) < 30 && Math.abs(o.y - 3230) < 30).map(o => ({ k: o.texture.key, f: o.frame?.name, x: o.x, y: o.y, d: o.depth, a: o.angle, w: o.width, h: o.height })); })));
await page.evaluate(() => { const sc = window.__kingvi.scene; const all = []; const walk = l => { for (const o of l) { all.push(o); if (o.list) walk(o.list); } }; walk(sc.children.list); all.filter(o => o.texture?.key === 'pont-tronc').forEach(o => o.setDepth(1e7)); });
await page.waitForTimeout(500);
await page.screenshot({ path: join(OUT, 'sonde-pont-1-dessus.png') });
// marcher sur le tronc : se poser à son pied puis aller vers l'est
await K('teleport', { x: c.arbrePont.x + 2, y: c.arbrePont.y + 1 });
await page.waitForTimeout(800);
await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD', key: 'd', bubbles: true })));
for (let i = 0; i < 6; i++) { await page.waitForTimeout(350); const s = await K('state'); console.log('marche', s.x, s.y, s.zone); await page.screenshot({ path: join(OUT, `sonde-pont-marche-${i}.png`) }); }
await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD', key: 'd', bubbles: true })));
console.log('apres marche', JSON.stringify(await info()), errors);
await browser.close(); server.close();
