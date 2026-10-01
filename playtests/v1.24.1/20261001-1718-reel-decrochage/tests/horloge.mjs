// Horloge simulée (page.clock) : minuit, longue pause, heure d'hiver, décalage des Réglages
import { setup, watchErrors, S, sleep, OUT } from './lib.mjs';
const which = process.argv[2];
const expected = ms => Math.round((((ms / 1000) % 1200) + 1200) % 1200);
const phaseOf = c => c < 90 ? 'aube' : c < 750 ? 'jour' : c < 840 ? 'crepuscule' : 'nuit';
async function open(timezoneId, iso) {
  const env = await setup({ timezoneId });
  const page = await env.context.newPage();
  watchErrors(page, env.errors);
  await page.clock.install({ time: new Date(iso) });
  await page.goto(`${env.base}?debug=1&seed=7`);
  await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 60000 });
  await page.evaluate(() => window.__kingvi.enter());
  await sleep(3000);
  return { ...env, page };
}
const snap = async page => { const s = await S(page); const now = await page.evaluate(() => Date.now()); return { utc: new Date(now).toISOString().slice(11, 19), local: await page.evaluate(() => new Date().toString().slice(16, 33)), cycle: s.heureCycle, attendu: expected(now), jour: s.jour, attenduPhase: phaseOf(expected(now)), vent: s.vent, x: s.x, y: s.y, tempsJeu: s.tempsJeu, fps: s.fps }; };

if (which === 'minuit' || which === 'hiver') {
  const iso = which === 'minuit' ? '2026-10-01T23:59:56Z' : '2026-10-25T00:59:56Z';
  for (const tz of which === 'minuit' ? ['Europe/Paris', 'UTC'] : ['Europe/Paris', 'UTC', 'America/New_York']) {
    const { page, errors, close } = await open(tz, iso);
    const rows = [];
    for (let i = 0; i < 8; i++) { rows.push(await snap(page)); await sleep(3000); }
    console.log(which, tz, JSON.stringify(rows.map(r => `${r.utc} | ${r.local} | cycle ${r.cycle}/${r.attendu} ${r.jour}/${r.attenduPhase} | jeu ${r.tempsJeu}`), null, 1));
    console.log('erreurs', errors);
    await close();
  }
}
if (which === 'pause') {
  const { page, errors, close } = await open('Europe/Paris', '2026-10-01T10:00:00Z');
  await page.keyboard.down('KeyD'); await sleep(3000);
  const a = await snap(page);
  // a) onglet caché (Phaser met la boucle en pause), 3 h passent, il revient ; la touche est relâchée ailleurs
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('blur')); });
  await page.clock.fastForward('03:00:00');
  await page.keyboard.up('KeyD');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); });
  const b = await snap(page); await sleep(4000); const c = await snap(page);
  console.log('A avant', a); console.log('A retour', b); console.log('A +4s', c);
  await page.screenshot({ path: `${OUT}/pause-3h.png` });
  // b) machine en veille sans événement de visibilité : un seul pas de 5 h, touche tenue
  await page.keyboard.down('KeyD'); await sleep(2000);
  const d = await snap(page);
  await page.clock.fastForward('05:00:00');
  const e = await snap(page); await sleep(2000); const f = await snap(page);
  await page.keyboard.up('KeyD');
  console.log('B avant', d); console.log('B apres saut', e); console.log('B +2s', f);
  const ev = await page.evaluate(() => window.__kingvi.events.slice(-15).map(e => `${e.jeu} ${e.type} ${e.phase || e.humeur || ''}`));
  console.log(ev);
  console.log('erreurs', errors, await page.evaluate(() => localStorage.getItem('kingvi:lastError')));
  await close();
}
if (which === 'reglage') {
  // Le curseur « moment de la journée » des Réglages (mode normal, sans debug : prefs écrites)
  const env = await setup({ timezoneId: 'Europe/Paris', prefs: { quality: 1, musicVol: 0, sfxVol: 0, windVol: 0, dayOffset: 0, windCycle: true } });
  const page = await env.context.newPage(); watchErrors(page, env.errors);
  await page.clock.install({ time: new Date('2026-10-01T10:00:10Z') });   // cycle 10 : aube
  await page.goto(env.base); await sleep(4000);
  const read = () => page.evaluate(() => ({ label: document.getElementById('daytime-label').textContent, slider: document.getElementById('opt-daytime').value, auto: document.getElementById('opt-dayauto').checked, prefs: JSON.parse(localStorage.getItem('kingvi:prefs')) }));
  await page.click('#open-settings').catch(() => page.evaluate(() => document.getElementById('open-settings').click()));
  await sleep(500);
  const r0 = await read();
  await page.evaluate(() => { const s = document.getElementById('opt-daytime'); s.value = '1000'; s.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(1500);
  const r1 = await read();
  await page.screenshot({ path: `${OUT}/reglage-nuit.png` });
  await page.keyboard.press('Escape'); await sleep(300);
  // le moment choisi se garde-t-il au rechargement, et le temps s'écoule-t-il ?
  await page.clock.fastForward('00:02:00');
  await page.reload(); await sleep(4000);
  await page.evaluate(() => document.getElementById('open-settings').click()); await sleep(500);
  const r2 = await read();
  await page.evaluate(() => { const c = document.getElementById('opt-dayauto'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
  await sleep(500);
  const r3 = await read();
  console.log(JSON.stringify({ avant: r0, apresCurseur1000: r1, recharge2minPlusTard: r2, retourHeureReelle: r3 }, null, 1));
  console.log('erreurs', env.errors);
  await env.close();
}
