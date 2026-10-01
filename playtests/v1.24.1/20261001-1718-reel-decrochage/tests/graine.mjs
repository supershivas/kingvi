// Même graine, même parcours → mêmes combats ? (à peu près : le rythme des images varie)
import { setup, watchErrors, openDebug, S, K, sleep } from './lib.mjs';
const seed = Number(process.argv[2] || 7), quality = Number(process.argv[3] || 1);
const env = await setup({ prefs: { quality, musicVol: 0, sfxVol: 0, windVol: 0 } });
const page = await env.context.newPage(); watchErrors(page, env.errors);
await openDebug(page, env.base, { seed });
await K(page, 'setWeather', 'calme'); await K(page, 'setTime', 'jour');
const holdToward = async (tx, ty, untilFn, maxMs) => {
  const t0 = Date.now(); let held = [];
  while (Date.now() - t0 < maxMs) {
    const s = await S(page); if (untilFn(s)) break;
    const want = []; if (tx - s.x > 2) want.push('KeyD'); else if (tx - s.x < -2) want.push('KeyA'); if (ty - s.y > 2) want.push('KeyS'); else if (ty - s.y < -2) want.push('KeyW');
    for (const k of held) if (!want.includes(k)) await page.keyboard.up(k);
    for (const k of want) if (!held.includes(k)) await page.keyboard.down(k);
    held = want; await sleep(60);
  }
  for (const k of held) await page.keyboard.up(k);
};
const result = {};
// 1. La meute : on entre au centre de la clairière, on reste immobile
{
  await K(page, 'teleport', 'bosquet'); await sleep(1500);
  const den = (await page.evaluate(() => window.__kingvi.cibles)).tanière;
  const n0 = await page.evaluate(() => window.__kingvi.events.length);
  await holdToward(den.x, den.y, s => s.meute.engagee, 60000);
  await page.waitForFunction(() => { const s = window.__kingvi.state(); return s.mort || s.tempsJeu > 0 && false; }, null, { timeout: 45000 }).catch(() => {});
  const ev = await page.evaluate(n => window.__kingvi.events.slice(n), n0);
  const t0 = ev.find(e => e.type === 'meute-attaque')?.jeu ?? 0;
  result.meute = ev.filter(e => ['meute-attaque', 'coup-recu', 'mort', 'meute-fin'].includes(e.type) || (e.type === 'son' && ['growl', 'bite', 'howl'].includes(e.son)))
    .map(e => `${(e.jeu - t0).toFixed(1)} ${e.type === 'son' ? e.son : e.type}${e.pv != null ? ' pv' + e.pv : ''}`);
}
// 2. L'autre viking : on s'approche, on reste immobile
{
  await page.waitForFunction(() => !window.__kingvi.state().mort, null, { timeout: 30000 }).catch(() => {});
  await sleep(1500);
  await K(page, 'teleport', 'viking'); await sleep(1500);
  const foe = (await S(page)).ennemi;
  const n0 = await page.evaluate(() => window.__kingvi.events.length);
  await holdToward(foe.x, foe.y, s => s.ennemi.engage, 60000);
  await page.waitForFunction(() => window.__kingvi.state().mort, null, { timeout: 45000 }).catch(() => {});
  const ev = await page.evaluate(n => window.__kingvi.events.slice(n), n0);
  const t0 = ev.find(e => e.type === 'ennemi-engage')?.jeu ?? 0;
  result.autre = ev.filter(e => ['ennemi-engage', 'coup-recu', 'mort'].includes(e.type)).map(e => `${(e.jeu - t0).toFixed(1)} ${e.type}${e.pv != null ? ' pv' + e.pv : ''}`);
}
result.fps = (await S(page)).fps;
result.erreurs = env.errors;
console.log(`graine ${seed} qualite ${quality}`, JSON.stringify(result));
await env.close();
