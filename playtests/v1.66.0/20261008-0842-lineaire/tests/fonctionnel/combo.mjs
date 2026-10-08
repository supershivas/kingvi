// Le combo à l'épée : clic gardé, trois coups enchaînés, tourniquet ; sur l'arbre, l'éboulis, l'autre
import { open, sleep, OUT } from './flib.mjs';
const g = await open({ speed: 1 });
const { K, state, walk, page, sc, strikeAt } = g;
const evs = async n => page.evaluate(n => window.__kingvi.events.slice(n).filter(e => ['frappe', 'tourbillon', 'coup-donne', 'arbre-abattu', 'rocher-brise', 'ennemi-abattu', 'coup-recu'].includes(e.type)).map(e => `${e.jeu}:${e.type}${e.cible ? '/' + e.cible : ''}${e.ennemiPv != null ? '(' + e.ennemiPv + ')' : ''}${e.ennemi != null ? '(ennemi ' + e.ennemi + ')' : ''}`), n);
const N = () => page.evaluate(() => window.__kingvi.events.length);
// a) sur la neige, trois clics rapprochés (150 ms)
await K('teleport', 'barque');
await sleep(1500);
let s = await state(), n = await N();
for (let k = 0; k < 3; k++) { await strikeAt(s.x + 30, s.y); await sleep(150); }
await sleep(1500);
console.log('a) 3 clics à 150 ms :', (await evs(n)).join(' '));
// a2) six clics espacés de 300 ms
n = await N();
for (let k = 0; k < 6; k++) { await strikeAt(s.x + 30, s.y); await sleep(300); }
await sleep(1500);
console.log('a2) 6 clics à 300 ms :', (await evs(n)).join(' '));
// a3) clics lents (900 ms) : pas de combo
n = await N();
for (let k = 0; k < 4; k++) { await strikeAt(s.x + 30, s.y); await sleep(900); }
await sleep(800);
console.log('a3) 4 clics à 900 ms :', (await evs(n)).join(' '));
// a4) clic gardé : deux clics à 40 ms, puis direction du second (vers la gauche)
n = await N();
await strikeAt(s.x + 30, s.y); await sleep(40); await strikeAt(s.x - 30, s.y);
await sleep(200);
const flip1 = await sc('return { flip: sc.flip, att: sc.attacking, q: !!sc.queued }');
await sleep(800);
console.log('a4) 2 clics à 40 ms (droite puis gauche) :', (await evs(n)).join(' '), 'pendant :', JSON.stringify(flip1), 'après flip', await sc('return sc.flip'));
// b) l'arbre du pont, clics rapides
await K('teleport', 'ravin');
const c = await page.evaluate(() => window.__kingvi.cibles);
await walk({ x: c.arbrePont.x - 10, y: c.arbrePont.y }, 4, null, 1);
n = await N(); let clicks = 0;
for (let k = 0; k < 40 && !(await state()).drapeaux.pont; k++) { s = await state(); await strikeAt(s.x + 30, s.y - 5); clicks++; await sleep(200); }
const eb = await evs(n);
console.log('b) arbre du pont, clics à 200 ms :', clicks, 'clics ;', eb.filter(e => e.includes('coup-donne/arbre')).length, 'coups au bois ;', eb.filter(e => e.includes('tourbillon')).length, 'tourniquets ;', eb.join(' '));
// c) l'autre viking, clics rapides
await K('teleport', 'viking');
const trail = await page.evaluate(() => window.__kingvi.trail);
for (let k = 0; k < 60; k++) { s = await state(); if (s.ennemi.engage) break; await walk(trail.at(-1), 1, x => x.ennemi.engage); }
n = await N();
for (let k = 0; k < 60; k++) {
  s = await state(); if (!s.ennemi.vivant || s.mort) break;
  const e = s.ennemi; const d = Math.hypot(e.x - s.x, e.y - s.y);
  if (d > 11) { await g.steer(e.x - s.x, e.y - s.y); await sleep(80); continue; }
  await g.release(); await strikeAt(e.x, e.y - 3); await sleep(170);
}
await sleep(1500);
s = await state();
console.log('c) contre l\'autre, clics à 170 ms :', (await evs(n)).join(' '), '| ennemi', JSON.stringify(s.ennemi), 'pv', s.pv);
await page.screenshot({ path: `${OUT}/combo-autre.png` });
console.log('erreurs', g.errors);
await g.close();
