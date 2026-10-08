// Qu'y a-t-il entre l'arrivée « falaise » et la porte de la grotte ?
import { open, sleep, OUT } from './flib.mjs';
const g = await open({ speed: 2 });
const { K, state, walk, page, sc, strikeAt } = g;
await K('teleport', 'falaise');
const map = await page.evaluate(async () => {
  const W = await import('/js/world.js?v=1.66.0');
  const D = W.CAVE_DOOR_OUT, rows = [];
  for (let y = D.y - 4; y <= D.y + 64; y++) { let r = `${y} `; for (let x = D.x - 30; x <= D.x + 30; x++) r += x === D.x && y === D.y ? 'D' : !W.isLand(x, y) ? '~' : W.blocked(x, y) ? '#' : '.'; rows.push(r); }
  const objs = [];
  for (const [i, j] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) for (const o of W.objectsInChunk(Math.floor(D.x / W.CHUNK) + i, Math.floor(D.y / W.CHUNK) + j)) if (Math.abs(o.x - D.x) < 35 && o.y > D.y - 5 && o.y < D.y + 65) objs.push({ type: o.type, x: o.x, y: o.y, w: o.w, h: o.h, foot: o.foot });
  return { rows, objs };
});
console.log(map.rows.join('\n'));
console.log(JSON.stringify(map.objs));
const p = await K('toScreen', 5232, 2560);
await page.screenshot({ path: `${OUT}/falaise-abords.png`, clip: { x: Math.max(0, p.x - 220), y: Math.max(0, p.y - 200), width: 440, height: 360 } });
await g.close();
