// Vérifications du testeur fonctionnel (run 20261001-1718-reel-decrochage).
// Lancer depuis tools/playtest : node ../../playtests/v1.24.1/20261001-1718-reel-decrochage/tests/verif.mjs <cas>
// cas : piste | meute1 | meute3 | meuteImmobile | vitesse
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(join(process.cwd(), 'x.js'));
const { chromium } = require('playwright');
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..', '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/plain' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(ROOT, p)); res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cas = process.argv[2] || 'piste';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: Number(process.env.W || 1280), height: Number(process.env.H || 800) } });
await ctx.addInitScript(q => { if (!localStorage.getItem('kingvi:prefs')) localStorage.setItem('kingvi:prefs', JSON.stringify({ quality: q, musicVol: 0, sfxVol: 0, windVol: 0 })); }, Number(process.env.Q || 3));
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto(`${base}?debug=1&seed=7`);
await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 60000 });
const K = (fn, ...a) => page.evaluate(([fn, a]) => window.__kingvi[fn](...a), [fn, a]);
const S = () => page.evaluate(() => window.__kingvi.state());

await K('enter'); await sleep(2500);
await K('setTime', 'jour');
await sleep(16000); // Phaser bride le delta pendant ~120 images après le chargement
const key = (code, down) => page.evaluate(([t, c]) => window.dispatchEvent(new KeyboardEvent(t, { code: c, bubbles: true })), [down ? 'keydown' : 'keyup', code]);

if (cas === 'piste') {
  // Chaque point de la piste et une bande de ±3 px autour : praticable ?
  const r = await page.evaluate(async () => {
    const v = [...document.querySelectorAll('script[type=module]')].map(s => s.src).find(s => s.includes('?v='))?.split('?v=')[1] || '1.24.1';
    const W = await import(`/js/world.js?v=${v}`);
    const free = (x, y) => W.isLand(x, y) && !W.houseBlocked(x, y) && !W.blocked(x, y);
    const out = { total: W.trail.length, bloques: [], etroits: [] };
    let dist = 0;
    W.trail.forEach((p, i) => {
      if (i) dist += Math.hypot(p.x - W.trail[i - 1].x, p.y - W.trail[i - 1].y);
      const x = Math.round(p.x), y = Math.round(p.y);
      if (!free(x, y)) out.bloques.push({ i, x, y, d: Math.round(dist) });
      else {
        let n = 0; for (let dx = -3; dx <= 3; dx++) for (let dy = -2; dy <= 2; dy++) if (!free(x + dx, y + dy)) n++;
        if (n > 8) out.etroits.push({ i, x, y, d: Math.round(dist), n });
      }
    });
    return out;
  });
  console.log(JSON.stringify({ total: r.total, bloques: r.bloques.length, premiers: r.bloques.slice(0, 40), etroits: r.etroits.length, etroitsEx: r.etroits.slice(0, 20) }, null, 1));
}

if (cas === 'vitesse') {
  // En plaine, D tenue 6 s réelles, à ×1 puis ×3 : px parcourus et temps de jeu
  await K('teleport', 'morts'); await sleep(1500);
  for (const f of [1, 3]) {
    await K('timeScale', f);
    const a = await S(); await key('KeyS', true); await sleep(6000); await key('KeyS', false); const b = await S();
    console.log(`x${f} : ${Math.round(Math.hypot(b.x - a.x, b.y - a.y))} px en ${(b.tempsJeu - a.tempsJeu).toFixed(1)} s de jeu (${((Math.hypot(b.x - a.x, b.y - a.y)) / (b.tempsJeu - a.tempsJeu)).toFixed(1)} px/s), fps ${b.fps}`);
    await K('teleport', 'morts'); await sleep(1500);
  }
}

if (cas.startsWith('meute')) {
  // La meute : immobile au centre, ou traversée à pied le long des traces
  const f = cas === 'meute3' ? 3 : 1;
  await K('timeScale', f);
  await K('teleport', 'bosquet'); await sleep(1500);
  const trail = await page.evaluate(() => window.__kingvi.trail);
  const den = await page.evaluate(async () => { const W = await import('/js/world.js?v=1.24.1'); return W.WOLF_DEN; });
  const t0 = (await S()).tempsJeu;
  let s = await S();
  const near = p => trail.reduce((b, q, i) => Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(trail[b].x - p.x, trail[b].y - p.y) ? i : b, 0);
  let i = near(s);
  const deadline = Date.now() + 150000 / f;
  if (cas === 'meuteImmobile') {
    // marcher jusqu'à l'engagement, puis ne plus bouger
    while (!s.meute.engagee && Date.now() < deadline) {
      const tgt = trail[Math.min(trail.length - 1, i + 3)];
      const dx = tgt.x - s.x, dy = tgt.y - s.y;
      await key('KeyD', dx > 1); await key('KeyA', dx < -1); await key('KeyS', dy > 1); await key('KeyW', dy < -1);
      await sleep(80); s = await S(); i = Math.max(i, near(s));
    }
    for (const c of ['KeyD', 'KeyA', 'KeyS', 'KeyW']) await key(c, false);
    const te = s.tempsJeu;
    while (s.tempsJeu - te < 25 && !s.mort) { await sleep(300); s = await S(); }
  } else {
    while (Date.now() < deadline && i < trail.length - 1) {
      s = await S(); i = Math.max(i, near(s));
      if (s.mort) break;
      const den2 = Math.hypot(s.x - den.x, s.y - den.y);
      if (den2 > 260 && i > near(den) + 10) break;
      let j = i; while (j < trail.length - 1 && Math.hypot(trail[j].x - s.x, trail[j].y - s.y) < 8) j++;
      const dx = trail[j].x - s.x, dy = trail[j].y - s.y;
      await key('KeyD', dx > 1.5); await key('KeyA', dx < -1.5); await key('KeyS', dy > 1.5); await key('KeyW', dy < -1.5);
      await sleep(60);
    }
    for (const c of ['KeyD', 'KeyA', 'KeyS', 'KeyW']) await key(c, false);
  }
  s = await S();
  const ev = await page.evaluate(() => window.__kingvi.events);
  const keep = ev.filter(e => ['meute-attaque', 'meute-fin', 'coup-recu', 'mort', 'guetteur-efface', 'silence'].includes(e.type) || (e.type === 'son' && ['growl', 'bite', 'howl'].includes(e.son)));
  console.log(keep.map(e => `${e.jeu.toFixed(1)} ${e.type} ${e.son || ''} (${e.x},${e.y})`).join('\n'));
  console.log(`fin : pv ${s.pv}, mort ${s.mort}, meute ${s.meute.etat}, fps ${s.fps}, ${(s.tempsJeu - t0).toFixed(1)} s de jeu`);
  await page.screenshot({ path: join(HERE, `${cas}.png`) });
}
console.log('erreurs :', errors.length ? errors : 'aucune');
await browser.close(); server.close();
