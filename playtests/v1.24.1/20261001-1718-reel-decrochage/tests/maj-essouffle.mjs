// Maj tenue en marchant jusqu'à l'endurance vide, puis clic (Maj toujours tenue) ; puis Maj relâchée.
// Et : dix clics contre la falaise, puis on s'en éloigne vers le sud.
import { setup, watchErrors, openDebug, S, K, sleep, OUT } from './lib.mjs';
const env = await setup(); const page = await env.context.newPage(); watchErrors(page, env.errors);
await openDebug(page, env.base);
await K(page, 'setTime', 'jour'); await K(page, 'setWeather', 'calme'); await sleep(20000);
const clickNear = async (dx, dy) => { const s = await S(page); const p = await page.evaluate(([x, y]) => window.__kingvi.toScreen(x, y), [s.x + dx, s.y + dy]); await page.mouse.click(p.x, p.y); };
const evSince = n => page.evaluate(n => window.__kingvi.events.slice(n).map(e => `${e.jeu} ${e.type}${e.vue ? ' ' + e.vue : ''}${e.cible ? ' ' + e.cible : ''}`), n);
const out = {};
await K(page, 'teleport', 'barque'); await sleep(2000);
await page.keyboard.down('Shift'); await page.keyboard.down('KeyD');
await sleep(9000);
const a = await S(page);
let n = await page.evaluate(() => window.__kingvi.events.length);
const clicks = [];
for (let i = 0; i < 4; i++) { await clickNear(15, -3); await sleep(700); clicks.push((await S(page)).endurance); }
out.majTenue = { enduranceAvantClics: a.endurance, enduranceApresChaqueClic: clicks, evenements: await evSince(n) };
await page.screenshot({ path: `${OUT}/maj-tenue-essouffle.png` });
await page.keyboard.up('Shift');
await sleep(2500);
const b = await S(page);
n = await page.evaluate(() => window.__kingvi.events.length);
await clickNear(15, -3); await sleep(900);
out.majRelachee = { enduranceApres2_5sDeMarche: b.endurance, evenements: await evSince(n) };
await page.keyboard.up('KeyD');
// Falaise
await K(page, 'teleport', 'falaise'); await sleep(2500);
await page.keyboard.down('KeyW'); await sleep(5000); await page.keyboard.up('KeyW');
n = await page.evaluate(() => window.__kingvi.events.length);
for (let i = 0; i < 10; i++) { await clickNear(0, -14); await sleep(100); }
await sleep(1500);
const c = await S(page);
await page.keyboard.down('KeyS'); await sleep(1500); await page.keyboard.up('KeyS');
const d = await S(page);
out.falaise = { evenements: await evSince(n), attaqueApres: c.attaque, sudPx: +(d.y - c.y).toFixed(1) };
out.erreurs = env.errors;
console.log(JSON.stringify(out, null, 1));
await env.close();
