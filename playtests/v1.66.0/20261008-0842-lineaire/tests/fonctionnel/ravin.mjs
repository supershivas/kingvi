// Le ravin : infranchissable sauf par l'arbre du pont ; le pont, la souche, le tronc ; persistance
import { open, sleep, OUT } from './flib.mjs';
const g = await open({ speed: 2 });
const { K, state, walk, page, sc, strikeAt } = g;
// 1. Remplissage : sans pont, peut-on passer d'ouest en est, quelque part ?
const flood = await page.evaluate(async () => {
  const W = await import('/js/world.js?v=1.66.0');
  const { isLand, blocked, houseBlocked, inRavine, RAVINE, ravineMid, WORLD } = W;
  const x0 = RAVINE.x - 260, x1 = RAVINE.x + 330, w = x1 - x0, h = WORLD;
  const ok = (x, y) => isLand(x, y) && !blocked(x, y) && !houseBlocked(x, y) && !inRavine(x, y);
  const seen = new Uint8Array(w * h);
  // départ : tous les points praticables de la colonne ouest
  const st = [];
  for (let y = 0; y < h; y++) if (ok(x0, y)) { seen[y * w] = 1; st.push(0, y); }
  let east = null, n = 0, landRows = 0, ravRows = [];
  while (st.length) {
    const y = st.pop(), x = st.pop(); n++;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const k = ny * w + nx; if (seen[k]) continue; seen[k] = 1;
      if (!ok(x0 + nx, ny)) continue;
      // (diagonale : les deux côtés doivent être libres, comme le glissement)
      if (dx && dy && !ok(x0 + x + dx, y) && !ok(x0 + x, y + dy)) continue;
      if (x0 + nx > ravineMid(ny) + 20) { east = east || { x: x0 + nx, y: ny }; }
      st.push(nx, ny);
    }
  }
  // l'étendue nord-sud des terres à hauteur du ravin, et du ravin
  let minY = 1e9, maxY = -1;
  for (let y = 0; y < h; y++) { const m = Math.round(ravineMid(y)); if (isLand(m - 30, y) || isLand(m + 30, y)) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); } }
  // à chaque rangée de terre : y a-t-il de la terre des deux côtés et le ravin entre ?
  let gaps = [];
  for (let y = minY; y <= maxY; y++) { const m = Math.round(ravineMid(y)); for (let x = m - 15; x <= m + 15; x++) if (isLand(x, y) && !inRavine(x, y) && Math.abs(x - m) < 3) gaps.push([x, y]); }
  return { east, visited: n, minY, maxY, gaps: gaps.slice(0, 10), nGaps: gaps.length };
});
console.log('remplissage sans pont :', JSON.stringify(flood));
// 2. En jeu : tenter de passer le ravin à pied sans pont, à plusieurs endroits
const c = await page.evaluate(() => window.__kingvi.cibles);
console.log('arbre du pont', c.arbrePont, 'pont ?', (await state()).drapeaux.pont);
await K('teleport', 'ravin');
let s = await state(); console.log('au ravin', s.x, s.y);
let r = await walk({ x: s.x + 80, y: s.y }, 6); console.log('vers l\'est, sans pont :', r.s.x, r.s.y);
r = await walk({ x: s.x + 80, y: s.y - 30 }, 6); console.log('nord-est :', r.s.x, r.s.y);
r = await walk({ x: s.x + 80, y: s.y + 30 }, 6); console.log('sud-est :', r.s.x, r.s.y);
const mid = await page.evaluate(async y => { const W = await import('/js/world.js?v=1.66.0'); return { m: W.ravineMid(y), h: W.ravineHalf(y) }; }, s.y);
console.log('ravin à cette hauteur', mid);
await page.screenshot({ path: `${OUT}/ravin-sans-pont.png` });
// 3. Abattre l'arbre
let hits = 0;
for (let k = 0; k < 20 && !(await state()).drapeaux.pont; k++) {
  await walk({ x: c.arbrePont.x - 10, y: c.arbrePont.y }, 4, null, 1);
  s = await state(); await strikeAt(s.x + 30, s.y - 5); hits++; await sleep(500);
}
console.log('coups pour abattre l\'arbre du pont :', hits, 'pont', (await state()).drapeaux.pont);
await sleep(1500);
const logImg = await sc(`const im = sc.children.list.filter(i => i.texture && (i.texture.key === 'pont-tronc' || i.texture.key === 'souche')); return im.map(i => ({k: i.texture.key, x: i.x, y: i.y, vis: i.visible}))`);
console.log('images tronc/souche près du pont :', JSON.stringify(logImg.filter(i => Math.abs(i.x - c.arbrePont.x) < 60)));
await page.screenshot({ path: `${OUT}/ravin-pont.png` });
// 4. Traverser sur le tronc ; essayer d'en tomber par les côtés
r = await walk({ x: c.arbrePont.x + 3, y: c.arbrePont.y + 0.5 }, 4, null, 1);
r = await walk({ x: c.arbrePont.x + 14, y: c.arbrePont.y + 0.5 }, 4, null, 1);
s = await state(); console.log('sur le tronc', s.x, s.y);
let side = await g.hold(['KeyS'], 1500); console.log('pousser vers le sud sur le tronc →', side.x, side.y);
side = await g.hold(['KeyW'], 1500); console.log('pousser vers le nord →', side.x, side.y);
r = await walk({ x: c.arbrePont.x + 40, y: c.arbrePont.y + 0.5 }, 8, null, 2);
console.log('de l\'autre côté', r.s.x, r.s.y);
await page.screenshot({ path: `${OUT}/ravin-traverse.png` });
// retour vers l'ouest
r = await walk({ x: c.arbrePont.x - 12, y: c.arbrePont.y + 0.5 }, 8, null, 2);
console.log('retour à l\'ouest', r.s.x, r.s.y);
// 5. Rechargement : le pont reste
await K('teleport', 'apres-ravin');
await page.evaluate(() => window.__kingvi.scene.persist());
await g.reload();
s = await state(); console.log('après rechargement : pont', s.drapeaux.pont, 'pos', s.x, s.y, 'compteur', JSON.stringify(s.compteur));
await K('teleport', 'ravin');
const logImg2 = await sc(`const im = sc.children.list.filter(i => i.texture && (i.texture.key === 'pont-tronc' || i.texture.key === 'souche')); return im.map(i => ({k: i.texture.key, x: i.x, y: i.y, vis: i.visible}))`);
console.log('après rechargement, images :', JSON.stringify(logImg2.filter(i => Math.abs(i.x - c.arbrePont.x) < 60)));
r = await walk({ x: c.arbrePont.x + 3, y: c.arbrePont.y + 0.5 }, 4, null, 1);
r = await walk({ x: c.arbrePont.x + 40, y: c.arbrePont.y + 0.5 }, 10, null, 2);
console.log('traversée après rechargement', r.s.x, r.s.y);
await page.screenshot({ path: `${OUT}/ravin-recharge.png` });
console.log('erreurs', g.errors);
await g.close();
