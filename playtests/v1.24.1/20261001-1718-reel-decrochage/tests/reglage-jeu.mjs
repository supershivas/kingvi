// Le curseur « Moment de la journée » change-t-il le jour du jeu lui-même (state().jour, torche) ?
import { setup, watchErrors, openDebug, S, sleep, OUT } from './lib.mjs';
const env = await setup(); const page = await env.context.newPage(); watchErrors(page, env.errors);
await page.clock.install({ time: new Date('2026-10-01T10:05:00Z') });   // cycle 300 : jour
await openDebug(page, env.base);
const a = await S(page);
const res = [];
for (const v of [1000, 30, 800, 400]) {
  await page.evaluate(() => document.getElementById('open-settings').click()); await sleep(300);
  await page.evaluate(v => { const s = document.getElementById('opt-daytime'); s.value = String(v); s.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  await page.keyboard.press('Escape'); await sleep(2500);
  const s = await S(page); res.push({ curseur: v, cycle: s.heureCycle, jour: s.jour, nuit: s.nuit, torche: s.torche });
  if (v === 1000) await page.screenshot({ path: `${OUT}/reglage-nuit-jeu.png` });
}
console.log(JSON.stringify({ depart: { cycle: a.heureCycle, jour: a.jour }, res, prefs: await page.evaluate(() => localStorage.getItem('kingvi:prefs')), erreurs: env.errors }, null, 1));
await env.close();
