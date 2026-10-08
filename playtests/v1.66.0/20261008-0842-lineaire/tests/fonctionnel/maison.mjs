import { open, sleep, OUT } from './flib.mjs';
const g = await open({ speed: 1 });
const { K, state, walk, page, sc } = g;
const trail = await page.evaluate(() => window.__kingvi.trail);
const cib = await page.evaluate(() => window.__kingvi.cibles);
console.log('porte', cib.porteMaison);
const di = trail.reduce((b, p, i) => Math.hypot(p.x - cib.porteMaison.x, p.y - cib.porteMaison.y) < Math.hypot(trail[b].x - cib.porteMaison.x, trail[b].y - cib.porteMaison.y) ? i : b, 0);
console.log('trace la plus proche de la porte', di, trail[di], 'voisins', trail.slice(di - 3, di + 4));
await K('teleport', 'maison');
let s = await state(); console.log('après téléport', s.x, s.y);
// suivre les points de trace un par un jusqu'à la porte
for (let i = di - 8; i <= di + 2; i++) {
  const r = await walk(trail[i], 4, x => !!x.dedans);
  if (r.s.dedans) { console.log('ENTRÉ à', i); break; }
}
s = await state(); console.log('fin', s.x, s.y, s.dedans);
await page.screenshot({ path: `${OUT}/maison-1.png` });
// directement vers la porte
if (!s.dedans) {
  const r = await walk(cib.porteMaison, 6, x => !!x.dedans);
  console.log('vers la porte', r.s.x, r.s.y, r.s.dedans);
  await page.screenshot({ path: `${OUT}/maison-2.png` });
  const info = await sc(`const p=sc.pos; return {mons: sc.mons && {x:sc.mons.x,y:sc.mons.y}, moving: sc.moving, fire: sc.fire}`);
  console.log(info);
}
console.log('erreurs', g.errors);
await g.close();
