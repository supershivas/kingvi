import { open, sleep, OUT } from './lib.mjs';
const { page, K, S, errors, close } = await open();
const scr = async (dx, dy) => { const s = await S(); return page.evaluate(([x, y]) => window.__kingvi.toScreen(x, y), [s.x + dx, s.y - 5 + dy]); };
const st = () => page.evaluate(() => { const sc = window.__kingvi.scene; return { x: +sc.pos.x.toFixed(1), running: sc.running, attacking: sc.attacking, ts: sc.player.anims.timeScale, anim: sc.player.anims.currentAnim?.key, playing: sc.player.anims.isPlaying, keys: [...sc.keys] }; });
const speed = async ms => { const a = await st(); await sleep(ms); const b = await st(); return ((b.x - a.x) / ms * 1000).toFixed(1); };
await K('teleport', 'apres-ravin'); await sleep(1500);
// Marche Maj + droite, clic pendant la course, Maj relâchée pendant le coup
await page.keyboard.down('KeyD'); await page.keyboard.down('Shift'); await sleep(500);
console.log('course v=', await speed(800), JSON.stringify(await st()));
let p = await scr(12, 0);
await page.mouse.click(p.x, p.y); await sleep(60);
console.log('pendant coup', JSON.stringify(await st()));
await page.keyboard.up('Shift'); await sleep(500);
console.log('apres coup, Maj relachee', JSON.stringify(await st()), 'v=', await speed(800));
// Maj enfoncée pendant le coup, puis coup fini : on court ?
p = await scr(12, 0);
await page.mouse.click(p.x, p.y); await sleep(40); await page.keyboard.down('Shift'); await sleep(500);
console.log('Maj enfoncee pendant le coup -> apres', JSON.stringify(await st()), 'v=', await speed(800));
await page.keyboard.up('Shift'); await page.keyboard.up('KeyD'); await sleep(300);
// Maj tenue, rien d'autre, puis frappe : le coup a-t-il la bonne vitesse d'anim ?
await page.keyboard.down('Shift'); p = await scr(12, 0);
const t0 = Date.now(); await page.mouse.click(p.x, p.y);
await page.waitForFunction(() => !window.__kingvi.scene.attacking); console.log('duree coup Maj tenue (ms)', Date.now() - t0);
await page.keyboard.up('Shift');
const t1 = Date.now(); await page.mouse.click(p.x, p.y); await page.waitForFunction(() => !window.__kingvi.scene.attacking); console.log('duree coup sans Maj (ms)', Date.now() - t1);
// Course sous endurance nulle forcée (endurance retirée : STAMINA_ON=false)
await page.evaluate(() => { window.__kingvi.scene.stamina = 0; });
await page.keyboard.down('Shift'); await page.keyboard.down('KeyD'); await sleep(300);
console.log('endurance 0 forcée -> court?', JSON.stringify(await st()), 'v=', await speed(800), 'endurance', (await S()).endurance);
await page.keyboard.up('Shift'); await page.keyboard.up('KeyD');
// Perte de focus pendant la marche
await page.keyboard.down('KeyD'); await page.keyboard.down('Shift'); await sleep(400);
await page.evaluate(() => window.dispatchEvent(new Event('blur')));
await sleep(200);
console.log('apres blur (touches encore physiquement tenues)', JSON.stringify(await st()), 'v=', await speed(800));
await page.keyboard.up('KeyD'); await page.keyboard.up('Shift');
// Vraie perte de focus : une 2e page au premier plan
await page.keyboard.down('KeyD'); await sleep(300);
const p2 = await page.context().newPage(); await p2.bringToFront(); await sleep(300);
console.log('autre onglet au premier plan', JSON.stringify(await st()));
await page.bringToFront(); await sleep(300);
console.log('retour', JSON.stringify(await st()), 'v=', await speed(600));
console.log('erreurs', errors);
await close();
