// Rejoue la logique de followTrail du harnais à partir du téléport « maison »
import { open, sleep, OUT } from './flib.mjs';
const speed = Number(process.argv[2] || 2);
const g = await open({ speed });
const { K, state, steer, release, page, sc } = g;
const trail = await page.evaluate(() => window.__kingvi.trail);
const nearestIndex = s => trail.reduce((b, p, i) => (Math.hypot(p.x - s.x, p.y - s.y) < Math.hypot(trail[b].x - s.x, trail[b].y - s.y) ? i : b), 0);
async function walkTo(target, { timeout = 30, near = 3, until } = {}) {
  const t0 = Date.now();
  let last = await state(), stuckSince = Date.now(), detour = null;
  while ((Date.now() - t0) / 1000 * speed < timeout) {
    const s = await state();
    if (until && until(s)) break;
    const dx = target.x - s.x, dy = target.y - s.y;
    if (Math.hypot(dx, dy) < near) break;
    if (Math.hypot(s.x - last.x, s.y - last.y) > 1) { last = s; stuckSince = Date.now(); }
    if (!detour && Date.now() - stuckSince > 1500 / speed) { detour = { until: Date.now() + 900 / speed, dx: -dy, dy: dx, side: 1 }; console.log('  détour à', s.x, s.y); }
    if (detour && Date.now() > detour.until) { detour = null; stuckSince = Date.now(); }
    if (detour) await steer(detour.dx * detour.side, detour.dy * detour.side); else await steer(dx, dy);
    await sleep(80);
  }
  await release();
}
for (let run = 0; run < 3; run++) {
  await K('teleport', 'maison');
  const t0 = Date.now(); let s = await state(), i = nearestIndex(s), minDoor = 99, pts = [];
  const door = { x: 2632, y: 2992 };
  while ((Date.now() - t0) / 1000 * speed < 30 && i < trail.length - 1) {
    s = await state();
    if (s.dedans) break;
    i = Math.max(i, nearestIndex(s));
    let j = i;
    while (j < trail.length - 1 && Math.hypot(trail[j].x - s.x, trail[j].y - s.y) < 12) j++;
    await walkTo(trail[j], { timeout: 6, near: 4, until: x => !!x.dedans });
    const s2 = await state(); minDoor = Math.min(minDoor, Math.hypot(s2.x - door.x, s2.y - door.y)); pts.push([s2.x, s2.y]);
    i = Math.max(i, j - 1);
    if (s2.x > 2700) break;
  }
  s = await state();
  const mons = await sc('return sc.mons ? {x: Math.round(sc.mons.x), y: Math.round(sc.mons.y), shown: sc.mons.shown} : null');
  console.log(`essai ${run} (vitesse ${speed}) : dedans=${s.dedans} min distance porte≈${minDoor.toFixed(1)} fin ${s.x},${s.y} mons`, mons, pts.slice(0, 12).map(p => p.map(Math.round).join(',')).join(' '));
  if (s.dedans) { await K('teleport', 'maison'); }
}
await g.close();
