// La distance parcourue (save.steps, « pas » des Réglages) compte-t-elle quand on pousse contre la mer ?
import { setup, watchErrors, openDebug, S, K, sleep } from './lib.mjs';
const env = await setup(); const page = await env.context.newPage(); watchErrors(page, env.errors);
await openDebug(page, env.base); await sleep(15000);
await K(page, 'teleport', 'barque'); await sleep(1500);
await page.keyboard.down('KeyA'); await sleep(6000);
const a = await S(page); await sleep(4000); const b = await S(page);
await page.keyboard.up('KeyA');
console.log(JSON.stringify({ x: [a.x, b.x], y: [a.y, b.y], distance: [a.distance, b.distance], jeu: [a.tempsJeu, b.tempsJeu], erreurs: env.errors }));
await env.close();
