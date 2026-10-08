// Sur le tronc, au milieu du ravin : on ne tombe pas, on ne reste pas coincé ; le mons, son trajet
import { open, sleep, OUT } from './flib.mjs';
const g = await open({ speed: 2 });
const { K, state, walk, page, sc, strikeAt } = g;
const c = await page.evaluate(() => window.__kingvi.cibles);
await K('teleport', 'ravin');
for (let k = 0; k < 20 && !(await state()).drapeaux.pont; k++) {
  await walk({ x: c.arbrePont.x - 10, y: c.arbrePont.y }, 4, null, 1);
  const s = await state(); await strikeAt(s.x + 30, s.y - 5); await sleep(500);
}
await sleep(1500);
await walk({ x: c.arbrePont.x + 3, y: c.arbrePont.y + 0.5 }, 4, null, 1);
let r = await walk({ x: 1015, y: c.arbrePont.y + 0.5 }, 4, null, 0.6);
console.log('au milieu', r.s.x, r.s.y);
for (const k of ['KeyS', 'KeyW', 'KeyS']) { const s = await g.hold([k], 1200); console.log(k, '→', s.x, s.y); }
// diagonale
let s = await g.hold(['KeyD', 'KeyS'], 1500); console.log('diag SE →', s.x, s.y);
s = await g.hold(['KeyA', 'KeyW'], 2500); console.log('diag NO →', s.x, s.y);
await page.screenshot({ path: `${OUT}/ravin-tronc-milieu.png` });
// zoom capture
const p = await K('toScreen', 1015, 3229);
await page.screenshot({ path: `${OUT}/ravin-tronc-zoom.png`, clip: { x: p.x - 200, y: p.y - 130, width: 400, height: 260 } });
console.log('erreurs', g.errors);
await g.close();
