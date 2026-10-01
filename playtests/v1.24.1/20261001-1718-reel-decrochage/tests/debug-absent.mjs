// Sans ?debug=1 : pas de window.__kingvi, debug.js jamais demandé, sauvegarde kingvi:save.
// Avec : kingvi:debug:save, et kingvi:prefs jamais écrit (même en touchant aux Réglages).
import { setup, watchErrors, sleep, requested } from './lib.mjs';
const out = {};
{
  const env = await setup({ prefs: null });
  const page = await env.context.newPage(); watchErrors(page, env.errors);
  await page.goto(env.base); await sleep(4000);
  out.normal = await page.evaluate(() => ({ kingvi: typeof window.__kingvi, dateNowNatif: /native code/.test(Date.now.toString()), randomNatif: /native code/.test(Math.random.toString()), cles: Object.keys(localStorage) }));
  out.normal.debugJsDemande = requested.some(p => p.includes('debug.js'));
  // entrer, marcher, quitter la page (pagehide)
  await page.evaluate(() => (document.getElementById('title-new').hidden ? document.getElementById('title-resume') : document.getElementById('title-new')).click());
  await sleep(3000);
  await page.keyboard.down('KeyD'); await sleep(2000); await page.keyboard.up('KeyD');
  await page.goto('about:blank'); await page.goto(env.base); await sleep(2000);
  out.normal.apresSortie = await page.evaluate(() => ({ cles: Object.keys(localStorage), save: localStorage.getItem('kingvi:save')?.slice(0, 120), debugSave: localStorage.getItem('kingvi:debug:save') }));
  // ?debug=0 et ?debug=true : le module ne doit pas non plus se charger
  requested.length = 0;
  await page.goto(`${env.base}?debug=0`); await sleep(2500);
  out.debug0 = { kingvi: await page.evaluate(() => typeof window.__kingvi), debugJsDemande: requested.some(p => p.includes('debug.js')) };
  out.erreurs = env.errors;
  await env.close();
}
{
  requested.length = 0;
  const env = await setup({ prefs: null });
  const page = await env.context.newPage(); watchErrors(page, env.errors);
  await page.goto(`${env.base}?debug=1`); await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 60000 });
  await page.evaluate(() => window.__kingvi.enter()); await sleep(2500);
  await page.keyboard.down('KeyD'); await sleep(2000); await page.keyboard.up('KeyD');
  // toucher à tous les réglages
  await page.evaluate(() => document.getElementById('open-settings').click()); await sleep(400);
  const touched = await page.evaluate(() => {
    const done = [];
    for (const el of document.querySelectorAll('#settings input, #settings select')) {
      if (el.type === 'range') { el.value = String(Number(el.min || 0) + 1); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
      else if (el.type === 'checkbox' || el.type === 'radio') { el.click(); }
      else if (el.tagName === 'SELECT') { el.selectedIndex = (el.selectedIndex + 1) % el.options.length; el.dispatchEvent(new Event('change', { bubbles: true })); }
      done.push(el.id || el.name);
    }
    return done;
  });
  await sleep(500);
  await page.keyboard.press('Escape');
  await page.goto('about:blank'); await page.goto(`${env.base}?debug=1`); await sleep(3000);
  out.debug = await page.evaluate(() => ({ cles: Object.keys(localStorage), prefs: localStorage.getItem('kingvi:prefs'), save: !!localStorage.getItem('kingvi:save'), debugSave: localStorage.getItem('kingvi:debug:save')?.slice(0, 100) }));
  out.debug.reglagesTouches = touched;
  out.debug.debugJsDemande = requested.some(p => p.includes('debug.js'));
  out.erreursDebug = env.errors;
  await env.close();
}
console.log(JSON.stringify(out, null, 1));
