import { open, sleep, OUT } from './lib.mjs';
const { page, K, S, errors, close } = await open();
const LAYOUTS = {
  azerty: { up: ['KeyW', 'z'], left: ['KeyA', 'q'], down: ['KeyS', 's'], right: ['KeyD', 'd'] },
  qwerty: { up: ['KeyW', 'w'], left: ['KeyA', 'a'], down: ['KeyS', 's'], right: ['KeyD', 'd'] },
  fleches: { up: ['ArrowUp', 'ArrowUp'], left: ['ArrowLeft', 'ArrowLeft'], down: ['ArrowDown', 'ArrowDown'], right: ['ArrowRight', 'ArrowRight'] },
};
const ev = (type, code, key) => page.evaluate(([type, code, key]) => window.dispatchEvent(new KeyboardEvent(type, { code, key, bubbles: true })), [type, code, key]);
for (const [name, L] of Object.entries(LAYOUTS)) {
  for (const dir of ['right', 'down', 'left', 'up']) {
    await K('teleport', 'apres-ravin'); await sleep(800);
    const a = await S();
    // vraies touches via page.keyboard pour les flèches et le qwerty ; événements synthétiques avec la lettre AZERTY
    if (name === 'azerty') await ev('keydown', L[dir][0], L[dir][1]); else await page.keyboard.down(L[dir][0]);
    const t0 = Date.now(); await sleep(1500);
    if (name === 'azerty') await ev('keyup', L[dir][0], L[dir][1]); else await page.keyboard.up(L[dir][0]);
    const dt = (Date.now() - t0) / 1000;
    await sleep(300);
    const b = await S();
    console.log(name, dir, 'dx', (b.x - a.x).toFixed(1), 'dy', (b.y - a.y).toFixed(1), 'v', (Math.hypot(b.x - a.x, b.y - a.y) / dt).toFixed(1), 'px/s');
  }
}
// Course : Maj + droite
await K('teleport', 'apres-ravin'); await sleep(800);
let a = await S();
await page.keyboard.down('Shift'); await page.keyboard.down('KeyD'); await sleep(1500);
const mid = await S();
await page.keyboard.up('KeyD'); await page.keyboard.up('Shift'); await sleep(300);
let b = await S();
console.log('course', (b.x - a.x).toFixed(1), 'court pendant:', mid.court, 'endurance', mid.endurance);
// Touche M en AZERTY : la touche physique Semicolon porte « m » ; KeyM porte « , »
await ev('keydown', 'Semicolon', 'm'); await sleep(400);
console.log('carte ouverte (Semicolon/m):', await page.evaluate(() => document.getElementById('map')?.open));
await page.keyboard.press('Escape'); await sleep(300);
await ev('keydown', 'KeyM', ','); await sleep(400);
console.log('carte ouverte (KeyM/,):', await page.evaluate(() => document.getElementById('map')?.open));
console.log('erreurs', errors);
await close();
