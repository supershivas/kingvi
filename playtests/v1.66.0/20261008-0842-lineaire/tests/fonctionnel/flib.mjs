// Outils jetables du testeur fonctionnel (v1.66.0)
import { chromium } from '/home/user/kingvi/tools/playtest/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
export const ROOT = process.env.KROOT || '/tmp/claude-0/-home-user-kingvi/417019d7-415a-5612-9d2a-853add2277aa/scratchpad/k166';
export const OUT = '/home/user/kingvi/playtests/v1.66.0/20261008-0842-lineaire/tests/fonctionnel';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.mp3': 'audio/mpeg' };
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function open({ speed = 1, seed = 7, w = 1280, h = 800, save = null, context: ctxIn = null } = {}) {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = join(ROOT, path.endsWith('/') ? `${path}index.html` : path);
    if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(file));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: w, height: h } });
  await context.addInitScript(p => { if (!localStorage.getItem('kingvi:prefs')) localStorage.setItem('kingvi:prefs', JSON.stringify(p)); },
    { quality: 1, dayOffset: 0, musicVol: 0, sfxVol: 0, windVol: 0 });
  if (save) await context.addInitScript(s => { if (!sessionStorage.getItem('__seeded')) { sessionStorage.setItem('__seeded', '1'); localStorage.setItem('kingvi:debug:save', JSON.stringify(s)); } }, save);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const url = `${base}?debug=1&seed=${seed}`;
  const K = (fn, ...a) => page.evaluate(([fn, a]) => window.__kingvi[fn](...a), [fn, a]);
  const state = () => page.evaluate(() => window.__kingvi.state());
  async function boot() {
    await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 60000 });
    if (speed !== 1) await K('timeScale', speed);
    if (await page.evaluate(() => !document.getElementById('title').hidden)) await K('enter');
    await sleep(2500);
  }
  await page.goto(url); await boot();
  const held = new Set();
  async function key(code, down) {
    if (down === held.has(code)) return;
    if (down) held.add(code); else held.delete(code);
    if (code === 'Shift') { await (down ? page.keyboard.down('Shift') : page.keyboard.up('Shift')); return; }
    const k = { KeyW: 'z', KeyA: 'q', KeyS: 's', KeyD: 'd', KeyE: 'e' }[code];
    await page.evaluate(([type, code, key]) => window.dispatchEvent(new KeyboardEvent(type, { code, key, bubbles: true })), [down ? 'keydown' : 'keyup', code, k]);
  }
  const release = async () => { for (const c of [...held]) await key(c, false); };
  async function steer(dx, dy) {
    const want = new Set();
    if (dx > 1.5) want.add('KeyD'); else if (dx < -1.5) want.add('KeyA');
    if (dy > 1.5) want.add('KeyS'); else if (dy < -1.5) want.add('KeyW');
    for (const c of [...held]) if (!want.has(c)) await key(c, false);
    for (const c of want) await key(c, true);
  }
  async function walk(target, secs = 10, until, near = 2) {
    const t0 = Date.now(); let s = await state(); const path = [];
    while ((Date.now() - t0) / 1000 * speed < secs) {
      s = await state(); path.push([s.x, s.y]);
      if (until && until(s)) break;
      if (Math.hypot(target.x - s.x, target.y - s.y) < near) break;
      await steer(target.x - s.x, target.y - s.y); await sleep(60);
    }
    await release(); return { s: await state(), path };
  }
  async function hold(codes, ms) { for (const c of codes) await key(c, true); await sleep(ms); await release(); return state(); }
  async function strikeAt(x, y) { const p = await K('toScreen', x, y); await page.mouse.click(p.x, p.y); }
  async function press(code) { await key(code, true); await sleep(80); await key(code, false); }
  const sc = (fn, arg) => page.evaluate(([f, a]) => new Function('sc', 'a', f)(window.__kingvi.scene, a), [fn, arg]);
  const reload = async () => { await page.reload(); await boot(); };
  const close = async () => { await browser.close(); server.close(); };
  return { page, K, state, key, release, steer, walk, hold, strikeAt, press, sc, close, errors, url, reload, speed };
}
// Suivre les traces (points de la piste, un à un) jusqu'à l'indice `to` ou une condition
export async function follow(g, trail, { to, secs = 60, until, every } = {}) {
  const t0 = Date.now();
  const nearest = s => trail.reduce((b, p, i) => (Math.hypot(p.x - s.x, p.y - s.y) < Math.hypot(trail[b].x - s.x, trail[b].y - s.y) ? i : b), 0);
  let s = await g.state(), i = nearest(s);
  while ((Date.now() - t0) / 1000 * g.speed < secs && i < to) {
    s = await g.state();
    if (until && until(s)) break;
    let j = i; while (j < to && Math.hypot(trail[j].x - s.x, trail[j].y - s.y) < 6) j++;
    let last = s, stuck = 0;
    while (Math.hypot(trail[j].x - s.x, trail[j].y - s.y) > 2.5) {
      s = await g.state(); if (until && until(s)) break;
      if (Math.hypot(s.x - last.x, s.y - last.y) < 0.2) { if (++stuck > 25) break; } else stuck = 0; last = s;
      await g.steer(trail[j].x - s.x, trail[j].y - s.y); await sleep(40);
    }
    i = Math.max(i + 1, nearest(s));
    if (every) await every(s, i);
  }
  await g.release();
  return g.state();
}
