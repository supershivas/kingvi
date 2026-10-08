import { open, sleep, OUT } from './lib.mjs';
const { page, K, S, errors, close } = await open();
const M = async () => { const s = await S(); const c = await page.evaluate(() => window.__kingvi.cibles.mons); return { kari: [s.x, s.y], mons: c, d: c ? Math.round(Math.hypot(c.x - s.x, c.y - s.y)) : null }; };
const hold = async (k, ms) => { await page.keyboard.down(k); await sleep(ms); await page.keyboard.up(k); };
async function walkTo(x, y, t = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < t) { const s = await S(); const dx = x - s.x, dy = y - s.y; if (Math.hypot(dx, dy) < 6) break;
    const ks = [dx > 2 ? 'KeyD' : dx < -2 ? 'KeyA' : null, dy > 2 ? 'KeyS' : dy < -2 ? 'KeyW' : null].filter(Boolean);
    for (const k of ks) await page.keyboard.down(k); await sleep(150); for (const k of ks) await page.keyboard.up(k); }
}
await K('teleport', 'lanterne'); await sleep(800);
console.log('lanterne', JSON.stringify(await M()));
const m0 = await M(); await walkTo(m0.mons.x - 60, m0.mons.y, 10000); await sleep(1000);
console.log('près du mons', JSON.stringify(await M()));
await sleep(16000);
console.log('après la rencontre', JSON.stringify(await M()));
// le suivre un peu le long des traces
const tr = await page.evaluate(() => window.__kingvi.trail);
for (let i = 0; i < 8; i++) { const m = await M(); await walkTo(m.mons.x - 10, m.mons.y + 14, 3000); }
console.log('en le suivant', JSON.stringify(await M()));
// abattre l'arbre du pont
await K('teleport', 'ravin'); await sleep(800);
const c = await page.evaluate(() => window.__kingvi.cibles);
await page.evaluate(c => { const sc = window.__kingvi.scene; sc.pos.x = c.arbrePont.x - 10; sc.pos.y = c.arbrePont.y; }, c); await sleep(300);
for (let k = 0; k < 20 && !(await S()).drapeaux.pont; k++) { const s = await S(); const p = await page.evaluate(([x, y]) => window.__kingvi.toScreen(x, y), [s.x + 30, s.y - 5]); await page.mouse.click(p.x, p.y); await sleep(700); }
await sleep(2500);
console.log('pont', (await S()).drapeaux.pont, JSON.stringify(await M()));
// pas des morts (téléport debug) loin devant
await K('teleport', 'morts'); 
const samples = []; for (let i = 0; i < 6; i++) { samples.push((await M()).d); await sleep(300); }
console.log('après téléport morts : distance du mons', samples.join(','), JSON.stringify(await M()));
await page.screenshot({ path: OUT + '/mons-rattrapage.png' });
await K('teleport', 'viking'); await sleep(1500);
console.log('près de l\'autre', JSON.stringify(await M()));
// retour en arrière (barque) : il ne recule pas
await K('teleport', 'barque'); await sleep(1500);
console.log('retour barque', JSON.stringify(await M()));
console.log('debug:save ?', await page.evaluate(() => !!localStorage.getItem('kingvi:debug:save')), 'kingvi:save ?', await page.evaluate(() => !!localStorage.getItem('kingvi:save')));
console.log('erreurs', errors);
await close();
