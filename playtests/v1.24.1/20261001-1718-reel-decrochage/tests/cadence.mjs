// Temps de jeu (delta de Phaser) contre temps réel : après le chargement, après une perte de focus, après le retour
import { setup, watchErrors, openDebug, S, K, sleep } from './lib.mjs';
const { base, context, errors, close } = await setup();
const page = await context.newPage();
watchErrors(page, errors);
const t0 = Date.now();
await page.goto(`${base}?debug=1&seed=7`);
await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 60000 });
await page.evaluate(() => window.__kingvi.enter());
const sample = async (label, secs, walk) => {
  const rows = [];
  if (walk) await page.keyboard.down(walk);
  let a = await S(page), ta = Date.now();
  for (let i = 0; i < secs; i++) {
    await sleep(1000);
    const b = await S(page), tb = Date.now();
    rows.push({ t: ((tb - t0) / 1000).toFixed(0), ratio: ((b.tempsJeu - a.tempsJeu) / ((tb - ta) / 1000)).toFixed(2), fps: b.fps, pxReel: (Math.hypot(b.x - a.x, b.y - a.y) / ((tb - ta) / 1000)).toFixed(1) });
    a = b; ta = tb;
  }
  if (walk) await page.keyboard.up(walk);
  console.log(label, rows.map(r => `[${r.t}s x${r.ratio} ${r.fps}fps ${r.pxReel}px/s]`).join(' '));
};
await sample('apres-entree', 24, 'KeyD');
await page.evaluate(() => window.dispatchEvent(new Event('blur')));
await sample('fenetre-sans-focus', 6);
await page.evaluate(() => window.dispatchEvent(new Event('focus')));
await sample('retour-focus', 20, 'KeyA');
// onglet caché puis visible (Phaser : loop.pause / resume)
await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
await sample('onglet-cache', 3);
await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
await sample('onglet-revenu', 18, 'KeyD');
console.log('erreurs', errors);
await close();
