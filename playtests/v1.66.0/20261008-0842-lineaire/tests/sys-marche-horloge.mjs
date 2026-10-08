// testeur-systemes : la marche sous horloge simulée (page.clock) contre sans
import { open, sleep } from './lib.mjs';
const mode = process.argv[2] || 'clock';
const prefs = { quality: 1, musicVol: 0, sfxVol: 0, windVol: 0, dayNight: false, nightStorm: true, windCycle: true, wind: 'cycle', dayOffset: 0 };
const opts = { prefs, timezoneId: 'Europe/Paris' };
if (mode === 'clock') opts.clock = p => p.clock.install({ time: new Date('2026-10-08T21:59:20Z') });
const { page, K, S, errors, close } = await open(opts);
const st = () => page.evaluate(() => { const sc = window.__kingvi.scene; return { x: +sc.pos.x.toFixed(1), y: +sc.pos.y.toFixed(1), keys: [...sc.keys], att: sc.attacking, dead: sc.dead, clock: Math.round(sc.clock), talk: !!sc.talking, paused: document.body.className }; });
await K('teleport', 'apres-ravin'); await sleep(1000);
for (const k of ['KeyD', 'KeyS', 'KeyA', 'KeyW']) {
  const a = await st(); const t = Date.now(); await page.keyboard.down(k); await sleep(2500); await page.keyboard.up(k); const b = await st();
  console.log(mode, k, 'dx', (b.x - a.x).toFixed(1), 'dy', (b.y - a.y).toFixed(1), 'dclock', b.clock - a.clock, 'reel', Date.now() - t, JSON.stringify(b));
}
console.log('fps', (await S()).fps, 'erreurs', errors);
await close();
