import { open, sleep, OUT } from './lib.mjs';
const prefs = { quality: 1, musicVol: 0, sfxVol: 0, windVol: 0, dayNight: false, nightStorm: true, windCycle: true, wind: 'cycle', dayOffset: 0 };
const START = new Date(process.argv[2] || '2026-10-08T21:59:20Z');
const { page, K, S, errors, close } = await open({ prefs, timezoneId: 'Europe/Paris', clock: p => p.clock.install({ time: START }) });
const info = () => page.evaluate(() => { const s = window.__kingvi.state(); const now = Date.now() / 1000; const sc = window.__kingvi.scene;
  return { now: new Date(Date.now()).toISOString(), local: new Date().toString().slice(16, 33), heure: s.heureCycle, attendu: Math.round(now % 1200), jour: s.jour, nuit: s.nuit, vent: s.vent, x: s.x, y: s.y, temps: s.tempsJeu, fps: s.fps, ennemi: s.ennemi.etat, clock: Math.round(sc.clock) }; });
await K('teleport', 'apres-ravin'); await sleep(1000);
console.log('départ', JSON.stringify(await info()));
// 1. Passage de minuit local (22:00Z à Paris en heure d'été), en marchant
await page.keyboard.down('KeyD');
for (let i = 0; i < 4; i++) { await sleep(10000); console.log('minuit?', JSON.stringify(await info())); }
await page.keyboard.up('KeyD');
// 2. Minuit UTC : on saute l'horloge système (sans faire tourner les minuteurs)
await page.clock.setSystemTime(new Date('2026-10-08T23:59:50Z'));
await sleep(1500); console.log('avant minuit UTC', JSON.stringify(await info()));
await sleep(15000); console.log('après minuit UTC', JSON.stringify(await info()));
// 3. Onglet en arrière-plan 3 h (visibilité cachée, horloge en pause, puis avance de 3 h)
await page.evaluate(() => { window.__vis = 'hidden'; Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.__vis }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__vis === 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
const a = await info();
await page.clock.pauseAt(new Date(Date.parse(a.now) + 1000));
await page.clock.fastForward(3 * 3600 * 1000);
await page.evaluate(() => { window.__vis = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
await page.clock.resume();
await sleep(500); const b = await info();
console.log('avant pause', JSON.stringify(a)); console.log('retour +3h', JSON.stringify(b));
await page.keyboard.down('KeyS'); await sleep(2000); await page.keyboard.up('KeyS');
await sleep(500); console.log('marche après retour', JSON.stringify(await info()));
// 4. Longue pause SANS événement de visibilité (machine en veille) : la première image a un énorme delta
const c = await info();
await page.clock.pauseAt(new Date(Date.parse(c.now) + 1000));
await page.clock.fastForward(5 * 3600 * 1000);
await page.clock.resume();
await sleep(1000); const d = await info();
console.log('avant veille', JSON.stringify(c)); console.log('après veille +5h', JSON.stringify(d));
await page.keyboard.down('KeyW'); await sleep(2000); await page.keyboard.up('KeyW');
await sleep(500); console.log('marche après veille', JSON.stringify(await info()));
await page.screenshot({ path: OUT + '/horloge-fin.png' });
console.log('erreurs', errors, await page.evaluate(() => localStorage.getItem('kingvi:lastError')));
await close();
