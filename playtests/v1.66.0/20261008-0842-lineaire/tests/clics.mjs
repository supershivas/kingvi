import { open, sleep, OUT } from './lib.mjs';
const { page, K, S, errors, close } = await open();
const ev = () => page.evaluate(() => window.__kingvi.events.length);
const since = n => page.evaluate(n => window.__kingvi.events.slice(n).map(e => `${e.jeu}:${e.type}${e.vue ? '/' + e.vue : ''}${e.cible ? '/' + e.cible : ''}`), n);
const scr = async (dx, dy) => { const s = await S(); return page.evaluate(([x, y]) => window.__kingvi.toScreen(x, y), [s.x + dx, s.y - 5 + dy]); };
const anim = () => page.evaluate(() => { const sc = window.__kingvi.scene; return { attacking: sc.attacking, whirling: !!sc.whirling, queued: !!sc.queued, combo: sc.combo, anim: sc.player.anims.currentAnim?.key, playing: sc.player.anims.isPlaying, frame: sc.player.frame.name, charge: !!sc.charge }; });

await K('teleport', 'apres-ravin'); await sleep(1500);
// 1. Dix clics en une seconde
let n0 = await ev();
let p = await scr(12, 0);
for (let i = 0; i < 10; i++) { await page.mouse.click(p.x, p.y); await sleep(100); }
const during = await anim();
await sleep(2000);
console.log('10 clics/1s ->', (await since(n0)).join(' '));
console.log(' pendant:', JSON.stringify(during), ' apres:', JSON.stringify(await anim()), 'endurance', (await S()).endurance);
// marche-t-on après ?
let a = await S(); await page.keyboard.down('KeyD'); await sleep(800); await page.keyboard.up('KeyD'); let b = await S();
console.log(' marche apres:', (b.x - a.x).toFixed(1));

// 2. Clics espacés de 600 ms (au-delà du combo) : pas de tourniquet
await K('teleport', 'apres-ravin'); await sleep(1500);
n0 = await ev(); p = await scr(12, 0);
for (let i = 0; i < 6; i++) { await page.mouse.click(p.x, p.y); await sleep(800); }
await sleep(800);
console.log('6 clics espacés 800ms ->', (await since(n0)).join(' '));

// 3. Trois clics vifs à 250ms
n0 = await ev();
for (let i = 0; i < 3; i++) { await page.mouse.click(p.x, p.y); await sleep(250); }
await sleep(1500);
console.log('3 clics à 250ms ->', (await since(n0)).join(' '));

// 4. Tourbillon chargé : bouton tenu 2,5 s
n0 = await ev();
await page.mouse.move(p.x, p.y); await page.mouse.down(); const c1 = []; for (let i = 0; i < 5; i++) { await sleep(500); c1.push(JSON.stringify(await anim())); } await page.mouse.up();
await sleep(1500);
console.log('bouton tenu 2.5s ->', (await since(n0)).join(' '));
console.log(c1.join('\n'));
// 5. Combo puis bouton tenu sur le 3e clic (tourniquet + charge)
n0 = await ev();
await page.mouse.click(p.x, p.y); await sleep(200); await page.mouse.click(p.x, p.y); await sleep(200);
await page.mouse.down(); await sleep(2800); await page.mouse.up(); await sleep(1500);
console.log('2 clics + 3e tenu 2.8s ->', (await since(n0)).join(' '));
// 6. Clic tenu puis clics pendant la charge
n0 = await ev();
await page.mouse.down(); await sleep(1000); await page.mouse.up(); await page.mouse.click(p.x, p.y); await sleep(2500);
console.log('tenu 1s puis clic ->', (await since(n0)).join(' '), JSON.stringify(await anim()));
// 7. Clics pendant le tourbillon chargé
n0 = await ev();
await page.mouse.down(); await sleep(2100); await page.mouse.up();
for (let i = 0; i < 5; i++) { await page.mouse.click(p.x, p.y); await sleep(80); }
await sleep(2000);
console.log('clics pendant le tourbillon ->', (await since(n0)).join(' '), JSON.stringify(await anim()));
// 8. Bouton enfoncé, la fenêtre perd le focus (alt-tab) : le tourbillon part-il quand même ?
n0 = await ev();
await page.mouse.down(); await sleep(200);
await page.evaluate(() => window.dispatchEvent(new Event('blur')));
await sleep(2600);
console.log('bouton enfoncé + blur ->', (await since(n0)).join(' '));
await page.mouse.up(); await sleep(1000);
await page.screenshot({ path: OUT + '/clics-fin.png' });
console.log('erreurs', errors);
await close();
