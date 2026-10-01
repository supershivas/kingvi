// Outils communs aux scripts du testeur-systemes (jetables)
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
const require = createRequire('/home/user/kingvi/tools/playtest/package.json');
export const { chromium } = require('playwright');
export const ROOT = '/home/user/kingvi';
export const OUT = '/home/user/kingvi/playtests/v1.24.1/20261001-1718-reel-decrochage/tests';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.md': 'text/markdown' };
export const requested = [];
export function serve() {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    requested.push(path);
    const file = join(ROOT, path.endsWith('/') ? `${path}index.html` : path);
    if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(file));
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function setup({ timezoneId, prefs = { quality: 1, musicVol: 0, sfxVol: 0, windVol: 0 } } = {}) {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, timezoneId });
  if (prefs) await context.addInitScript(p => { if (!localStorage.getItem('kingvi:prefs')) localStorage.setItem('kingvi:prefs', JSON.stringify(p)); }, prefs);
  const errors = [];
  const close = async () => { await browser.close(); server.close(); };
  return { server, base, browser, context, errors, close };
}
export function watchErrors(page, errors) {
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
}
export async function openDebug(page, base, { seed = 7, enter = true } = {}) {
  await page.goto(`${base}?debug=1&seed=${seed}`);
  await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 60000 });
  if (enter) { await page.evaluate(() => window.__kingvi.enter()); await page.waitForTimeout(2500); }
}
export const S = page => page.evaluate(() => window.__kingvi.state());
export const K = (page, fn, ...a) => page.evaluate(([fn, a]) => window.__kingvi[fn](...a), [fn, a]);
