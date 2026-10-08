// testeur-systemes : sans ?debug=1 — __kingvi absent, kingvi:save, consigne unique, vieille sauvegarde
import { chromium } from '/home/user/kingvi/tools/playtest/node_modules/playwright/index.mjs';
import { serve, sleep, OUT } from './lib.mjs';
const server = await serve(); const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage(); const errors = [];
page.on('pageerror', e => errors.push(e.message));
const LS = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
await page.goto(base); await page.waitForSelector('#title-new', { state: 'visible', timeout: 90000 }); await sleep(1500);
console.log('__kingvi ?', await page.evaluate(() => typeof window.__kingvi), '| debug.js chargé ?', await page.evaluate(() => performance.getEntriesByType('resource').some(r => r.name.includes('debug.js'))));
await Promise.all([page.waitForNavigation({ timeout: 60000 }).catch(() => null), page.click('#title-new')]);
await page.waitForLoadState('load'); await sleep(3000);
await page.keyboard.press('Space');
const t0 = Date.now(); let seen = null, gone = null;
while (Date.now() - t0 < 30000) {
  const h = await page.evaluate(() => { const h = document.getElementById('hint'); return { txt: h.textContent.trim(), gone: h.classList.contains('gone') || h.hidden }; }).catch(() => null);
  if (h && !seen && !h.gone && h.txt) seen = { at: Date.now() - t0, txt: h.txt };
  if (h && seen && h.gone && !gone) gone = Date.now() - t0;
  await sleep(250);
}
console.log('consigne', JSON.stringify(seen), 'effacée à', gone);
await page.keyboard.down('KeyD'); await sleep(1500); await page.keyboard.up('KeyD'); await sleep(500);
await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
let ls = await LS(); console.log('clés', Object.keys(ls).join(', '));
console.log('prefs', ls['kingvi:prefs']);
const s1 = JSON.parse(ls['kingvi:save'] || '{}'); console.log('save world', s1.world, 'x,y', s1.x, s1.y);
await page.reload(); await page.waitForSelector('#title-resume', { state: 'visible', timeout: 90000 }); await sleep(800);
await page.click('#title-resume'); await sleep(14000);
console.log('consigne au 2e lancement ?', await page.evaluate(() => { const h = document.getElementById('hint'); return !h.classList.contains('gone') && !h.hidden ? h.textContent.trim() : null; }));
// Vieille sauvegarde (world 8) écrite avant le chargement
await ctx.addInitScript(() => { if (sessionStorage.getItem('__old')) return; sessionStorage.setItem('__old', '1'); const s = JSON.parse(localStorage.getItem('kingvi:save')); localStorage.setItem('kingvi:save', JSON.stringify({ ...s, world: 8, x: 4400, y: 2700, foeDead: true, steps: 4321, chapters: ['greve', 'ravin'], belt: ['anneau', null, null, null, null, null, null, null, null, null], relics: ['anneau'] })); });
await page.reload(); await page.waitForSelector('#title-resume', { state: 'visible', timeout: 90000 }); await sleep(800);
await page.click('#title-resume'); await sleep(7000);
await page.screenshot({ path: OUT + '/sys-vieille-sauvegarde.png' });
await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
const after = JSON.parse((await LS())['kingvi:save']);
console.log('après reprise : world', after.world, 'x,y', after.x, after.y, '(début', s1.x, s1.y, ') foeDead', after.foeDead, 'steps', after.steps, 'belt', JSON.stringify(after.belt), 'chapters', JSON.stringify(after.chapters));
console.log('debug:save ?', (await LS())['kingvi:debug:save'] ? 'oui' : 'non', '| erreurs', errors);
await browser.close(); server.close();
