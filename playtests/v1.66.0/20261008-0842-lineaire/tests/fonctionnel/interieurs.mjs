// Les intérieurs (maison, crypte, grotte) : entrer, aller au fond (le point le plus loin), revenir, ressortir
import { open, sleep, OUT } from './flib.mjs';
const g = await open({ speed: 2 });
const { K, state, walk, page, sc, strikeAt } = g;
const c = await page.evaluate(() => window.__kingvi.cibles);
const DEF = {
  maison: { mod: '/js/interior.js?v=1.66.0', fn: 'roomWalkable', door: 'atRoomDoor', at: { x: 700, y: 700 }, entry: 'ROOM_ENTRY', w: 150, h: 100 },
  crypte: { mod: '/js/crypt.js?v=1.66.0', fn: 'cryptWalkable', door: 'atCryptDoor', at: { x: 400, y: 400 }, entry: 'CRYPT_ENTRY', w: 120, h: 90 },
  grotte: { mod: '/js/cave.js?v=1.66.0', fn: 'caveWalkable', door: 'atCaveDoor', at: { x: 300, y: 1000 }, entry: 'CAVE_ENTRY', w: 200, h: 192 },
};
async function plan(name, goalLocal) {
  const d = DEF[name];
  return page.evaluate(async ([d, goalLocal]) => {
    const m = await import(d.mod), ok = m[d.fn], E = m[d.entry];
    const W = d.w, H = d.h + 4, idx = (x, y) => y * W + x;
    const prev = new Int32Array(W * H).fill(-2), q = [];
    const s = idx(Math.round(E.x), Math.round(E.y)); prev[s] = -1; q.push(s);
    let far = s, dist = new Int32Array(W * H);
    for (let h = 0; h < q.length; h++) {
      const k = q[h], x = k % W, y = (k / W) | 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const nk = idx(nx, ny); if (prev[nk] !== -2 || !ok(nx, ny)) continue;
        prev[nk] = k; dist[nk] = dist[k] + 1; q.push(nk); if (dist[nk] > dist[far]) far = nk;
      }
    }
    let goal = far;
    if (goalLocal) { let best = 1e9; for (const k of q) { const x = k % W, y = (k / W) | 0, dd = Math.hypot(x - goalLocal.x, y - goalLocal.y); if (dd < best) { best = dd; goal = k; } } }
    const path = []; for (let k = goal; k >= 0; k = prev[k]) path.push({ x: k % W, y: (k / W) | 0 });
    path.reverse();
    return { reach: q.length, entry: E, far: { x: far % W, y: (far / W) | 0, d: dist[far] }, goal: path.at(-1), path: path.filter((_, i) => i % 3 === 0 || i === path.length - 1) };
  }, [d, goalLocal]);
}
async function run(path, at, secs = 120) {
  const t0 = Date.now();
  for (const p of path) {
    const tx = at.x + p.x, ty = at.y + p.y;
    let s = await state(), stuck = 0, last = s;
    while (Math.hypot(tx - s.x, ty - s.y) > 1.6) {
      if ((Date.now() - t0) / 1000 * 2 > secs) { await g.release(); return { ok: false, s }; }
      if (!s.dedans) { await g.release(); return { ok: 'sorti', s }; }
      await g.steer(tx - s.x, ty - s.y); await sleep(40);
      s = await state();
      if (Math.hypot(s.x - last.x, s.y - last.y) < 0.15) { if (++stuck > 40) { await g.release(); return { ok: false, s, at: p }; } } else stuck = 0;
      last = s;
    }
  }
  await g.release(); return { ok: true, s: await state() };
}
async function testRoom(name, goal) {
  let s = await state();
  const d = DEF[name];
  const p = await plan(name, goal);
  console.log(`${name} : ${p.reach} cases praticables depuis l'entrée ; le plus loin (${p.far.x},${p.far.y}) à ${p.far.d} pas ; but ${JSON.stringify(p.goal)}`);
  let r = await run(p.path, d.at);
  console.log(`  aller : ${r.ok} pos ${r.s.x},${r.s.y}`, r.at ? `coincé vers ${JSON.stringify(r.at)}` : '');
  await page.screenshot({ path: `${OUT}/int-${name}-fond.png` });
  // retour : BFS inverse = même chemin, à l'envers, puis vers la porte
  r = await run([...p.path].reverse(), d.at);
  console.log(`  retour : ${r.ok} pos ${r.s.x},${r.s.y}`);
  const out = await walk({ x: r.s.x + (name === 'maison' ? -20 : 0), y: r.s.y + (name === 'maison' ? 0 : 20) }, 6, x => !x.dedans);
  await sleep(1500);
  s = await state();
  console.log(`  sortie : dedans=${s.dedans} pos ${s.x},${s.y}`);
  return s;
}
// La maison (par la porte, à pied)
await K('teleport', 'interieur');
let r = await walk(c.porteMaison, 6, x => !!x.dedans, 1); await sleep(1500);
console.log('maison, entrée à pied :', (await state()).dedans);
let s = await testRoom('maison');
console.log('   porte maison dehors', c.porteMaison);
// La crypte : par la barque ? ici par le téléport (la barque est testée à part)
await K('teleport', 'crypte'); await sleep(800);
s = await testRoom('crypte', { x: 60, y: 20 });
console.log('   porte crypte dehors', c.ilot);
// La grotte : briser l'éboulis par le côté
await K('teleport', 'falaise');
await walk({ x: c.eboulis.x - 8, y: c.eboulis.y + 20 }, 8, null, 2);
for (let k = 0; k < 20 && (await state()).drapeaux.eboulis; k++) { await walk({ x: c.eboulis.x, y: c.eboulis.y + 10 }, 4, null, 2); await strikeAt(c.eboulis.x, c.eboulis.y - 3); await sleep(450); }
r = await walk({ x: c.porteGrotte.x, y: c.porteGrotte.y - 6 }, 8, x => !!x.dedans, 1); await sleep(1500);
console.log('grotte, entrée à pied :', (await state()).dedans);
s = await testRoom('grotte', { x: 100, y: 78 });
console.log('   porte grotte dehors', c.porteGrotte);
// Rechargement près de la grotte, et on rentre
await page.evaluate(() => window.__kingvi.scene.persist());
await g.reload();
s = await state(); console.log('après rechargement :', s.x, s.y, 'éboulis debout', s.drapeaux.eboulis);
r = await walk({ x: c.porteGrotte.x, y: c.porteGrotte.y - 6 }, 8, x => !!x.dedans, 1); await sleep(1200);
console.log('on rentre dans la grotte après rechargement :', (await state()).dedans);
console.log('erreurs', g.errors);
await g.close();
