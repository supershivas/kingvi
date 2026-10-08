// Après rechargement, l'éboulis brisé : bloque-t-il encore ? on entre ?
import { open, sleep, OUT } from './flib.mjs';
const g = await open({ speed: 2 });
const { K, state, walk, page, sc, strikeAt } = g;
const c = await page.evaluate(() => window.__kingvi.cibles);
await K('teleport', 'falaise');
for (let k = 0; k < 20 && (await state()).drapeaux.eboulis; k++) {
  await walk({ x: c.eboulis.x, y: c.eboulis.y + 12 }, 6, null, 2);
  await strikeAt(c.eboulis.x, c.eboulis.y - 3); await sleep(450);
}
await sleep(1000);
const probe = () => page.evaluate(async () => {
  const W = await import('/js/world.js?v=1.66.0');
  const sc = window.__kingvi.scene, D = W.CAVE_DOOR_OUT;
  const col = [];
  for (let y = D.y - 2; y <= D.y + 14; y++) col.push(`${y}:${W.blocked(D.x, y) ? 'B' : '.'}`);
  const objs = W.objectsInChunk(Math.floor(D.x / W.CHUNK), Math.floor(D.y / W.CHUNK)).filter(o => o.rubble || Math.abs(o.x - D.x) < 12 && Math.abs(o.y - D.y) < 12).map(o => ({ type: o.type, x: o.x, y: o.y, broken: !!o.broken, rubble: !!o.rubble, same: o === W.CAVE_RUBBLE }));
  return { col: col.join(' '), objs, rubbleBroken: !!W.CAVE_RUBBLE.broken, wrecked: sc.wrecked.has(`${W.CAVE_RUBBLE.x},${W.CAVE_RUBBLE.y}`), inside: sc.inside };
});
console.log('avant rechargement', JSON.stringify(await probe()));
let r = await walk({ x: c.porteGrotte.x, y: c.porteGrotte.y - 6 }, 15, x => !!x.dedans, 1);
console.log('entre avant rechargement ?', r.s.dedans);
await sleep(1500);
// ressortir par la téléportation hors de la grotte puis recharger dehors
await K('teleport', 'falaise');
await page.evaluate(() => window.__kingvi.scene.persist());
await g.reload();
console.log('après rechargement', JSON.stringify(await probe()));
await K('teleport', 'falaise');
console.log('après téléport falaise', JSON.stringify(await probe()));
r = await walk({ x: c.porteGrotte.x, y: c.porteGrotte.y - 6 }, 15, x => !!x.dedans, 1);
await sleep(1000);
const s = await state();
console.log('entre après rechargement ?', s.dedans, 'pos', r.s.x, r.s.y);
await page.screenshot({ path: `${OUT}/eboulis-recharge.png` });
const p = await K('toScreen', c.porteGrotte.x, c.porteGrotte.y);
await page.screenshot({ path: `${OUT}/eboulis-recharge-zoom.png`, clip: { x: Math.max(0, p.x - 200), y: Math.max(0, p.y - 150), width: 400, height: 300 } });
console.log('erreurs', g.errors);
await g.close();
