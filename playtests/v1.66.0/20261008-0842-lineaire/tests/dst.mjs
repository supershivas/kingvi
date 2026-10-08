import { open, sleep } from './lib.mjs';
const prefs = { quality: 1, musicVol: 0, sfxVol: 0, windVol: 0, dayNight: false, nightStorm: true, windCycle: true, wind: 'cycle', dayOffset: 0 };
const { page, K, S, errors, close } = await open({ prefs, timezoneId: 'Europe/Paris', clock: p => p.clock.install({ time: new Date('2026-10-25T00:59:30Z') }) });
const info = () => page.evaluate(() => { const s = window.__kingvi.state(); return { local: new Date().toString().slice(16, 33), heure: s.heureCycle, attendu: Math.round(Date.now() / 1000 % 1200), jour: s.jour, vent: s.vent, temps: s.tempsJeu }; });
await page.clock.setSystemTime(new Date('2026-10-25T00:59:56Z'));
for (let i = 0; i < 6; i++) { console.log(JSON.stringify(await info())); await sleep(4000); }
console.log('erreurs', errors); await close();
