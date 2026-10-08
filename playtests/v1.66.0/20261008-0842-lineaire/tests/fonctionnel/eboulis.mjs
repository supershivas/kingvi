// L'éboulis devant la grotte ; la grotte de l'entrée au fond et retour ; ressortie ; persistance
import { open, sleep, OUT } from './flib.mjs';
const g = await open({ speed: 2 });
const { K, state, walk, page, sc, strikeAt } = g;
const c = await page.evaluate(() => window.__kingvi.cibles);
console.log('éboulis', c.eboulis, 'porte grotte', c.porteGrotte);
await K('teleport', 'falaise');
let s = await state(); console.log('falaise', s.x, s.y, 'éboulis debout', s.drapeaux.eboulis);
// marcher vers la porte sans briser
let r = await walk({ x: c.porteGrotte.x, y: c.porteGrotte.y - 6 }, 10, x => !!x.dedans, 1);
console.log('vers la porte, éboulis debout : dedans=', r.s.dedans, 'pos', r.s.x, r.s.y);
for (const dx of [-6, 6]) { r = await walk({ x: c.porteGrotte.x + dx, y: c.porteGrotte.y - 6 }, 5, x => !!x.dedans, 1); console.log('  par le côté', dx, 'dedans=', r.s.dedans, r.s.x, r.s.y); }
await page.screenshot({ path: `${OUT}/eboulis-debout.png` });
// le briser
let hits = 0;
const ev0 = (await page.evaluate(() => window.__kingvi.events.length));
for (let k = 0; k < 20 && (await state()).drapeaux.eboulis; k++) {
  await walk({ x: c.eboulis.x, y: c.eboulis.y + 12 }, 6, null, 2);
  await strikeAt(c.eboulis.x, c.eboulis.y - 3); hits++; await sleep(450);
}
const evs = await page.evaluate(n => window.__kingvi.events.slice(n).filter(e => ['coup-donne', 'rocher-brise'].includes(e.type)).map(e => e.type + ':' + (e.cible || '')), ev0);
console.log('clics pour briser :', hits, evs.join(' '), 'éboulis debout', (await state()).drapeaux.eboulis);
await sleep(800);
await page.screenshot({ path: `${OUT}/eboulis-brise.png` });
// entrer
r = await walk({ x: c.porteGrotte.x, y: c.porteGrotte.y - 6 }, 15, x => !!x.dedans, 1);
await sleep(1200);
s = await state(); console.log('entrée : dedans=', s.dedans, s.x, s.y);
// parcours : vers le trône (avec contournement simple), puis retour
const path = [];
const goal = c.trone;
async function nav(goal, secs) {
  const t0 = Date.now(); let last = await state(), stuck = 0, det = 0;
  while ((Date.now() - t0) / 1000 * 2 < secs) {
    const s = await state(); if (!s.dedans) return s;
    if (Math.hypot(goal.x - s.x, goal.y - s.y) < 6) return s;
    if (Math.hypot(s.x - last.x, s.y - last.y) < 0.3) stuck++; else stuck = 0; last = s;
    if (stuck > 12) { det = 10; stuck = 0; }
    let dx = goal.x - s.x, dy = goal.y - s.y;
    if (det > 0) { det--; [dx, dy] = Math.random() < 0.5 ? [-dy, dx] : [dy, -dx]; }
    await g.steer(dx, dy); await sleep(70);
  }
  await g.release(); return state();
}
s = await nav({ x: goal.x, y: goal.y + 10 }, 120);
console.log('près du trône ?', s.x, s.y, 'trône', goal, 'roi incliné', s.drapeaux.kingBowed);
await page.screenshot({ path: `${OUT}/grotte-fond.png` });
// un coup au roi : le rubis tombe
await strikeAt(goal.x, goal.y - 10); await sleep(1500);
const drops = await sc('return Object.keys(sc.relicDrops || {})');
console.log('reliques tombées', drops);
// ramasser le rubis
const rub = await sc('const d = (sc.drops || []).find(d => d.id === "rubis" && !d.taken); return d && { x: d.x, y: d.y }');
console.log('rubis au sol', rub);
if (rub) { await walk(rub, 8, null, 1); await sleep(800); }
console.log('ceinture', JSON.stringify((await state()).ceinture));
// retour vers l'entrée
const entry = await sc('return { x: 300 + 0, y: 1000 + 0 }');
s = await nav({ x: 400, y: 1180 }, 120);
r = await walk({ x: s.x, y: s.y + 30 }, 6, x => !x.dedans);
await sleep(1500);
s = await state(); console.log('ressorti ? dedans=', s.dedans, 'pos', s.x, s.y, 'porte dehors', c.porteGrotte);
await page.screenshot({ path: `${OUT}/grotte-sortie.png` });
// rechargement
await page.evaluate(() => window.__kingvi.scene.persist());
await g.reload();
s = await state(); console.log('après rechargement : éboulis debout', s.drapeaux.eboulis, 'roi', s.drapeaux.kingBowed, 'compteur', JSON.stringify(s.compteur), 'ceinture', JSON.stringify(s.ceinture), 'pos', s.x, s.y);
await K('teleport', 'falaise');
r = await walk({ x: c.porteGrotte.x, y: c.porteGrotte.y - 6 }, 15, x => !!x.dedans, 1);
await sleep(1000);
console.log('après rechargement, on entre ?', (await state()).dedans);
console.log('erreurs', g.errors);
await g.close();
