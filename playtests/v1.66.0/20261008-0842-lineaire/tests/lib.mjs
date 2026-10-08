// Outils communs des scripts du testeur-systemes (jetables)
import { chromium } from '/home/user/kingvi/tools/playtest/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
export const ROOT = '/home/user/kingvi';
export const OUT = '/home/user/kingvi/playtests/v1.66.0/20261008-0842-lineaire/tests';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
export function serve() {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = join(ROOT, path.endsWith('/') ? `${path}index.html` : path);
    if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(file));
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function open({ prefs = { quality: 1, musicVol: 0, sfxVol: 0, windVol: 0 }, query = '?debug=1&seed=7', timezoneId, clock, init, enter = true } = {}) {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, timezoneId });
  if (prefs) await context.addInitScript(p => { if (!localStorage.getItem('kingvi:prefs')) localStorage.setItem('kingvi:prefs', JSON.stringify(p)); }, prefs);
  if (init) await context.addInitScript(init.fn, init.arg);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  if (clock) await clock(page);
  await page.goto(base + query);
  const K = (fn, ...a) => page.evaluate(([fn, a]) => window.__kingvi[fn](...a), [fn, a]);
  const S = () => page.evaluate(() => window.__kingvi.state());
  if (query.includes('debug=1')) {
    await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 90000 });
    if (enter) { await K('enter'); await sleep(3000); }
  }
  const close = async () => { await browser.close(); server.close(); };
  return { page, context, browser, base, K, S, errors, close };
}
