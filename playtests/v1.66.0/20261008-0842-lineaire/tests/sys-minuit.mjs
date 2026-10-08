// testeur-systemes : marche continue au passage de minuit local (Paris), horloge simulée
import { open, sleep } from './lib.mjs';
const prefs = { quality: 1, musicVol: 0, sfxVol: 0, windVol: 0, dayNight: false, nightStorm: true, windCycle: true, wind: 'cycle', dayOffset: 0 };
const { page, K, S, errors, close } = await open({ prefs, timezoneId: 'Europe/Paris', clock: p => p.clock.install({ time: new Date('2026-10-08T21:59:50Z') }) });
const st = () => page.evaluate(() => { const sc = window.__kingvi.scene, s = window.__kingvi.state(); return { local: new Date().toString().slice(16, 33), heure: s.heureCycle, x: +sc.pos.x.toFixed(1), y: +sc.pos.y.toFixed(1), keys: [...sc.keys], clock: Math.round(sc.clock), moved: sc.moved, anim: sc.player.anims.currentAnim?.key }; });
await K('teleport', 'apres-ravin'); await sleep(1000);
console.log(JSON.stringify(await st()));
await page.keyboard.down('KeyS');
for (let i = 0; i < 8; i++) { await sleep(2500); console.log(JSON.stringify(await st())); }
await page.keyboard.up('KeyS');
console.log('erreurs', errors); await close();
