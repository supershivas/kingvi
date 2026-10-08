import { chromium } from '/home/user/kingvi/tools/playtest/node_modules/playwright/index.mjs';
import { serve, sleep, OUT } from './lib.mjs';
const server = await serve(); const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage(); const errors = [];
page.on('pageerror', e => errors.push(e.message));
const LS = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
await page.goto(base); await page.waitForSelector('#title-new', { state: 'visible', timeout: 60000 }); await sleep(1500);
console.log('__kingvi ?', await page.evaluate(() => typeof window.__kingvi), '| debug.js chargé ?', await page.evaluate(() => performance.getEntriesByType('resource').some(r => r.name.includes('debug.js'))));
console.log('reprendre visible ?', await page.isVisible('#title-resume'));
await page.click('#title-new');
await page.waitForLoadState('load'); await sleep(2500);
await page.keyboard.press('Space'); // passer le prologue
const t0 = Date.now();
let seenHint = null, gone = null;
while (Date.now() - t0 < 25000) {
  const h = await page.evaluate(() => { const h = document.getElementById('hint'); return { txt: h.textContent.trim(), gone: h.classList.contains('gone'), hidden: h.hidden }; });
  if (!seenHint && !h.gone && !h.hidden && h.txt) { seenHint = { at: Date.now() - t0, txt: h.txt }; await page.screenshot({ path: OUT + '/tuto.png' }); }
  if (seenHint && h.gone && !gone) gone = Date.now() - t0;
  await sleep(250);
}
console.log('consigne', JSON.stringify(seenHint), 'effacée à', gone, 'ms');
await page.keyboard.down('KeyD'); await sleep(1500); await page.keyboard.up('KeyD');
await page.click('#open-settings'); await sleep(400); await page.keyboard.press('Escape'); await sleep(300);
const ls = await LS(); console.log('localStorage :', Object.keys(ls).join(', '));
console.log('prefs', ls['kingvi:prefs']); console.log('save', ls['kingvi:save'].slice(0,120));
// rechargement : plus de consigne
await page.reload(); await page.waitForSelector('#title-resume', { state: 'visible', timeout: 60000 }); await sleep(800);
await page.click('#title-resume'); await sleep(14000);
console.log('consigne au 2e lancement ?', await page.evaluate(() => { const h = document.getElementById('hint'); return !h.classList.contains('gone') && !h.hidden ? h.textContent.trim() : null; }));
// Sauvegarde d'avant (WORLD_VERSION 8) : elle repart de la barque
const spawn = JSON.parse((await LS())['kingvi:save']);
await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('kingvi:save')); window.__old = { ...s, world: 8, x: 4400, y: 2700, foeDead: true, steps: 4321, belt: ['anneau', null, null, null, null, null, null, null, null, null], relics: ['anneau'] }; });
await page.evaluate(() => { window.addEventListener('pagehide', e => e.stopImmediatePropagation(), true); });
// écrire avant le chargement (pagehide sauvegarderait par-dessus) : via un script d'init unique
await ctx.addInitScript(() => { if (sessionStorage.getItem('__oldDone')) return; sessionStorage.setItem('__oldDone', '1'); const s = JSON.parse(localStorage.getItem('kingvi:save')); localStorage.setItem('kingvi:save', JSON.stringify({ ...s, world: 8, x: 4400, y: 2700, foeDead: true, steps: 4321, chapters: ['greve', 'ravin'], belt: ['anneau', null, null, null, null, null, null, null, null, null], relics: ['anneau'] })); });
await page.reload(); await page.waitForSelector('#title-resume', { state: 'visible', timeout: 60000 }); await sleep(800);
console.log('vieille sauvegarde lue :', (await LS())['kingvi:save'].slice(0,80));
await page.click('#title-resume'); await sleep(6000);
await page.screenshot({ path: OUT + '/vieille-sauvegarde.png' });
await page.click('#open-settings'); await sleep(400);
console.log('distance affichée', await page.textContent('#stat-distance'));
await page.keyboard.press('Escape'); await sleep(300);
const after = JSON.parse((await LS())['kingvi:save']);
console.log('après reprise : world', after.world, 'x,y', after.x, after.y, '(barque', spawn.x, spawn.y, ') foeDead', after.foeDead, 'steps', after.steps, 'belt', JSON.stringify(after.belt), 'chapters', JSON.stringify(after.chapters));
console.log('debug:save ?', (await LS())['kingvi:debug:save'] ? 'oui' : 'non', '| erreurs', errors);
await browser.close(); server.close();
