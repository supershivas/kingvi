import { open, sleep, OUT } from './lib.mjs';
const prefs = { quality: 1, musicVol: 0, sfxVol: 0, windVol: 0, dayNight: false, nightStorm: true, windCycle: true, wind: 'cycle', dayOffset: 0 };
const { page, K, S, errors, close } = await open({ prefs, timezoneId: 'Europe/Paris', clock: p => p.clock.install({ time: new Date('2026-10-25T00:59:40Z') }) });
const info = () => page.evaluate(() => { const s = window.__kingvi.state(); return { utc: new Date().toISOString(), local: new Date().toString().slice(16, 33), heure: s.heureCycle, attendu: Math.round(Date.now() / 1000 % 1200), jour: s.jour, nuit: s.nuit, x: s.x, y: s.y }; });
await K('teleport', 'apres-ravin'); await sleep(800);
const a = await info();
await page.keyboard.down('KeyD'); await sleep(3000); await page.keyboard.up('KeyD');
const b = await info();
console.log('changement d\'heure', JSON.stringify(a), '\n ->', JSON.stringify(b));
for (let i = 0; i < 2; i++) { await sleep(8000); console.log(JSON.stringify(await info())); }
// Réglages : décalage d'heure (curseur)
await page.click('#open-settings'); await sleep(600);
const lab0 = await page.textContent('#daytime-label');
await page.evaluate(() => { const s = document.getElementById('opt-daytime'); s.value = String(90 + 330); s.dispatchEvent(new Event('input', { bubbles: true })); });
await sleep(400);
const lab1 = await page.textContent('#daytime-label');
await page.keyboard.press('Escape'); await sleep(800);
const c = await S();
console.log('réglage :', lab0, '->', lab1, '| état', c.jour, c.nuit, c.heureCycle);
await page.screenshot({ path: OUT + '/heure-reglage-jour.png' });
// Toujours la nuit : coché
await page.click('#open-settings'); await sleep(500);
await page.evaluate(() => { const c = document.getElementById('opt-daynight'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
await page.keyboard.press('Escape'); await sleep(800);
const d = await S(); console.log('toujours la nuit :', d.jour, d.nuit, d.heureCycle);
console.log('prefs écrites en debug ?', await page.evaluate(() => localStorage.getItem('kingvi:prefs')));
console.log('erreurs', errors);
await close();
