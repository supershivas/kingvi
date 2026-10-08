import { open, sleep } from './lib.mjs';
const seed = Number(process.argv[2] || 7);
const { page, K, S, errors, close } = await open({ query: `?debug=1&seed=${seed}` });
await K('teleport', 'viking'); await sleep(600);
await page.evaluate(() => { const f = window.__kingvi.scene.foe; window.__cools = []; let last = null; setInterval(() => { if (f.cool > (last ?? -1) + 0.5) window.__cools.push(+f.cool.toFixed(3)); last = f.cool; }, 16); });
const n0 = await page.evaluate(() => window.__kingvi.events.length);
// avancer vers l'ennemi jusqu'au contact, puis frapper toutes les 420 ms
const t0 = Date.now();
let res = 'temps';
while (Date.now() - t0 < 60000) {
  const s = await S();
  if (s.mort) { res = 'mort'; break; }
  if (!s.ennemi.vivant) { res = 'gagne'; break; }
  const e = s.ennemi, d = Math.hypot(e.x - s.x, e.y - s.y);
  if (d > 11) {
    const want = [e.x - s.x > 1.5 ? 'KeyD' : e.x - s.x < -1.5 ? 'KeyA' : null, e.y - s.y > 1.5 ? 'KeyS' : e.y - s.y < -1.5 ? 'KeyW' : null].filter(Boolean);
    for (const k of ['KeyA', 'KeyD', 'KeyS', 'KeyW']) if (!want.includes(k)) await page.keyboard.up(k);
    for (const k of want) await page.keyboard.down(k);
    await sleep(90); continue;
  }
  for (const k of ['KeyA', 'KeyD', 'KeyS', 'KeyW']) await page.keyboard.up(k);
  const p = await page.evaluate(([x, y]) => window.__kingvi.toScreen(x, y), [e.x, e.y - 3]);
  await page.mouse.click(p.x, p.y);
  await sleep(420);
}
const ev = await page.evaluate(n => window.__kingvi.events.slice(n).filter(e => ['coup-donne', 'coup-recu', 'mort', 'ennemi-abattu', 'ennemi-engage', 'tourbillon'].includes(e.type)).map(e => `${e.jeu.toFixed(1)}:${e.type}${e.cible ? '/' + e.cible : ''}${e.pv != null ? '/pv' + e.pv : ''}`), n0);
console.log('graine', seed, res, ev.join(' '));
console.log('cool', JSON.stringify(await page.evaluate(() => window.__cools)));
console.log('erreurs', errors);
await close();
