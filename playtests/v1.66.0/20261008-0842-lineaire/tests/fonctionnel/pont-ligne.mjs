// Sur le pont : tenir D depuis la rive ouest, à plusieurs hauteurs ; relever le trajet
import { open, sleep, OUT } from './flib.mjs';
const g = await open({ speed: 1 });
const { K, state, page, sc, strikeAt, walk } = g;
const c = await page.evaluate(() => window.__kingvi.cibles);
await K('teleport', 'ravin');
for (let k = 0; k < 20 && !(await state()).drapeaux.pont; k++) {
  await walk({ x: c.arbrePont.x - 10, y: c.arbrePont.y }, 4, null, 1);
  const s = await state(); await strikeAt(s.x + 30, s.y - 5); await sleep(450);
}
await sleep(2000);
const info = await page.evaluate(async () => { const W = await import('/js/world.js?v=1.66.0'); const B = W.BRIDGE_TREE; const r = []; for (let y = 3220; y <= 3240; y++) r.push([y, Math.round(W.ravineMid(y) - W.ravineHalf(y)), Math.round(W.ravineMid(y) + W.ravineHalf(y))]); return { B: { x: B.x, y: B.y, len: B.art.rows.length }, rav: r }; });
console.log('tronc', JSON.stringify(info.B)); console.log('ravin (y, ouest, est)', JSON.stringify(info.rav));
for (const y of [3227, 3228, 3229, 3229.5, 3230, 3231, 3232]) {
  await sc(`sc.pos = { x: 1000, y: ${y} }; sc.placePlayer && sc.placePlayer(); return 1`);
  await sleep(300);
  const path = []; await g.key('KeyD', true);
  for (let k = 0; k < 20; k++) { await sleep(150); const s = await state(); path.push(`${s.x.toFixed(1)},${s.y.toFixed(1)}`); }
  await g.release();
  console.log(`D depuis (1000, ${y}) :`, path.filter((p, i) => i % 3 === 0 || i === path.length - 1).join(' '));
  // retour
  await sc(`sc.pos = { x: 1000, y: 3229.5 }; return 1`); await sleep(200);
}
// diagonales sur le tronc et retour par Q
await sc(`sc.pos = { x: 1000, y: 3229.5 }; return 1`); await sleep(200);
let s = await g.hold(['KeyD', 'KeyS'], 2500); console.log('D+S depuis la rive', s.x, s.y);
s = await g.hold(['KeyD', 'KeyW'], 2500); console.log('puis D+Z', s.x, s.y);
s = await g.hold(['KeyA'], 3500); console.log('puis Q (retour)', s.x, s.y);
console.log('erreurs', g.errors);
await g.close();
