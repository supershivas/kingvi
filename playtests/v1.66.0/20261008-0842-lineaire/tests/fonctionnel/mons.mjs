// Le mons : rencontre, guide, attend au ravin, s'arrête avant l'autre, attend à la falaise
import { open, sleep, OUT, follow } from './flib.mjs';
const g = await open({ speed: 3 });
const { K, state, walk, page, sc, strikeAt } = g;
const trail = await page.evaluate(() => window.__kingvi.trail);
const M = () => sc('const m = sc.mons; return m && { x: Math.round(m.x), y: Math.round(m.y), shown: m.shown, ti: m.ti, hold: m.hold, said: [...sc.said].filter(s => s.startsWith("mons")), talk: sc.talk.busy }');
const cross = await page.evaluate(async () => { const W = await import('/js/world.js?v=1.66.0'); return { i: W.RAVINE_CROSS.i, x: W.RAVINE_CROSS.x, y: W.RAVINE_CROSS.y, monsAt: W.MONS_AT }; });
console.log('ravin à la trace', cross.i, 'MONS_AT', cross.monsAt, 'traces', trail.length);
console.log('mons au départ', await M());
const fi = trail.findIndex(p => Math.hypot(p.x - cross.monsAt.x, p.y - cross.monsAt.y) < 40);
console.log('trace la plus proche de MONS_AT', fi);
let s = await follow(g, trail, { to: fi + 5, secs: 120, every: async (s, i) => { if (i % 6 === 0) { const m = await M(); console.log(` i=${i} kari ${s.x},${s.y}  mons`, JSON.stringify(m)); } } });
await sleep(3000);
console.log('après rencontre', JSON.stringify(await M()));
await page.screenshot({ path: `${OUT}/mons-rencontre.png` });
// suivre jusqu'au ravin
s = await follow(g, trail, { to: cross.i - 3, secs: 120, every: async (s, i) => { if (i % 10 === 0) { const m = await M(); console.log(` i=${i} kari ${s.x},${s.y} dist ${Math.round(Math.hypot(m.x - s.x, m.y - s.y))} mons`, JSON.stringify(m)); } } });
await sleep(4000);
const m = await M();
console.log('au ravin, sans pont : mons', JSON.stringify(m), 'mons à l\'est du ravin ?', m.x > cross.x);
await page.screenshot({ path: `${OUT}/mons-ravin.png` });
// Le mons est-il dans le ravin, ou sur un arbre ? (bloquerait-il ?)
// abattre l'arbre
const c = await page.evaluate(() => window.__kingvi.cibles);
for (let k = 0; k < 20 && !(await state()).drapeaux.pont; k++) {
  await walk({ x: c.arbrePont.x - 10, y: c.arbrePont.y }, 4, null, 1);
  s = await state(); await strikeAt(s.x + 30, s.y - 5); await sleep(400);
}
await sleep(1000);
await walk({ x: c.arbrePont.x + 3, y: c.arbrePont.y + 0.5 }, 4, null, 1);
await walk({ x: c.arbrePont.x + 30, y: c.arbrePont.y + 0.5 }, 6, null, 1);
// suivre encore 200 pas de piste
s = await follow(g, trail, { to: cross.i + 200, secs: 200, every: async (s, i) => { if (i % 25 === 0) { const m = await M(); console.log(` i=${i} kari ${s.x},${s.y} dist ${Math.round(Math.hypot(m.x - s.x, m.y - s.y))} mons ti=${m.ti}`); } } });
console.log('après 200 pas : mons', JSON.stringify(await M()));
await page.screenshot({ path: `${OUT}/mons-guide.png` });
// Rechargement : mons gardé ?
await page.evaluate(() => window.__kingvi.scene.persist());
await g.reload();
await sleep(1500);
s = await state();
console.log('après rechargement : kari', s.x, s.y, 'mons', JSON.stringify(await M()));
await page.screenshot({ path: `${OUT}/mons-recharge.png` });
// Avant l'autre : téléport au bout des traces, le mons rejoint et s'arrête avant
await K('teleport', 'viking');
await sleep(4000);
s = await state(); console.log('près de l\'autre : kari', s.x, s.y, 'mons', JSON.stringify(await M()), 'cap', trail.length - 40, 'ennemi', JSON.stringify(s.ennemi));
console.log('erreurs', g.errors);
await g.close();
