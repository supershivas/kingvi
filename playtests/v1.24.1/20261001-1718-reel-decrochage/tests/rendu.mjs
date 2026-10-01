// Script jetable du testeur-rendu : pixels entiers, qualité, nuit, chargement, FPS, navigateurs.
// node rendu.mjs <configs.json> <sortie.json>
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = '/home/user/kingvi';
const require = createRequire(join(ROOT, 'tools/playtest/package.json'));
const { chromium, firefox, webkit } = require('playwright');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/markdown', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
  if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(await readFile(f));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const configs = JSON.parse(await readFile(process.argv[2], 'utf8'));
const results = [];

// Analyse d'une capture PNG dans la page : bords mod N, au centre net
async function analyse(page, png, N, cropFrac = 0.3) {
  return page.evaluate(async ([b64, N, cropFrac]) => {
    const blob = await (await fetch('data:image/png;base64,' + b64)).blob();
    const bmp = await createImageBitmap(blob);
    const c = new OffscreenCanvas(bmp.width, bmp.height), ctx = c.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    const W = bmp.width, H = bmp.height;
    const st = document.querySelector('#stage canvas').getBoundingClientRect(), k = W / innerWidth;
    const x0 = Math.round((st.left + st.width * (0.5 - cropFrac / 2)) * k), x1 = Math.round((st.left + st.width * (0.5 + cropFrac / 2)) * k);
    const y0 = Math.round((st.top + st.height * (0.5 - cropFrac / 2)) * k), y1 = Math.round((st.top + st.height * (0.5 + cropFrac / 2)) * k);
    const d = ctx.getImageData(0, 0, W, H).data;
    const px = (x, y) => { const i = (y * W + x) * 4; return (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; };
    const n = Math.max(1, Math.round(N));
    const hx = new Array(n).fill(0), hy = new Array(n).fill(0);
    let runsBad = 0, runs = 0;
    for (let y = y0; y < y1; y++) { let run = 1; for (let x = x0 + 1; x < x1; x++) { if (px(x, y) !== px(x - 1, y)) { hx[x % n]++; if (x - run > x0) { runs++; if (run % n) runsBad++; } run = 1; } else run++; } }
    for (let x = x0; x < x1; x++) for (let y = y0 + 1; y < y1; y++) if (px(x, y) !== px(x, y - 1)) hy[y % n]++;
    const frac = h => { const t = h.reduce((a, b) => a + b, 0); return t ? Math.round(Math.max(...h) / t * 1000) / 10 : null; };
    // couleurs distinctes au centre
    const cols = new Set(); for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) cols.add(px(x, y));
    // luminance moyenne de bandes : centre, anneau, bord
    const lum = (ax, ay, bx, by) => { let s = 0, m = 0; for (let y = ay; y < by; y += 3) for (let x = ax; x < bx; x += 3) { const i = (y * W + x) * 4; s += d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; m++; } return Math.round(s / m); };
    return { W, H, crop: [x0, y0, x1, y1], n, edgesX: hx, edgesY: hy, phaseX: frac(hx), phaseY: frac(hy), runsBadPct: runs ? Math.round(runsBad / runs * 1000) / 10 : null, colours: cols.size };
  }, [png.toString('base64'), N, cropFrac]);
}

for (const cfg of configs) {
  const [w, h] = (cfg.taille || '1280x800').split('x').map(Number);
  const engine = { chromium, firefox, webkit }[cfg.navigateur || 'chromium'];
  const browser = await engine.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: cfg.dpr || 1 });
  await ctx.addInitScript(p => { localStorage.setItem('kingvi:prefs', JSON.stringify(p)); },
    { quality: cfg.qualite || 3, wind: 'calme', windCycle: false, dayOffset: 0, musicVol: 0, sfxVol: 0, windVol: 0 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const tag = cfg.nom;
  const out = { nom: tag, cfg, mesures: [] };
  try {
    await page.goto(`${base}?debug=1&seed=7`);
    await page.waitForFunction(() => window.__kingvi?.state().pret, null, { timeout: 90000 });
    await page.evaluate(() => { window.__kingvi.setWeather('calme'); });
    await page.evaluate(() => window.__kingvi.enter());
    await sleep(3000);
    for (const step of cfg.etapes) {
      if (step.heure) await page.evaluate(h => window.__kingvi.setTime(h), step.heure);
      if (step.lieu) await page.evaluate(l => window.__kingvi.teleport(l), step.lieu);
      if (step.qualite) await page.evaluate(q => { const g = window.__kingviGame || null; }, step.qualite);
      if (step.setQualite) {
        // Le curseur des Réglages
        await page.evaluate(q => { const r = document.querySelector('#opt-quality'); if (r) { r.value = q; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); } return !!r; }, step.setQualite);
      }
      if (step.molette) { await page.mouse.move(w / 2, h / 2); await page.mouse.wheel(0, step.molette); }
      if (step.marche) { await page.evaluate(c => window.dispatchEvent(new KeyboardEvent('keydown', { code: c, key: 'd', bubbles: true })), step.marche); await sleep(step.ms || 1500); await page.evaluate(c => window.dispatchEvent(new KeyboardEvent('keyup', { code: c, key: 'd', bubbles: true })), step.marche); }
      if (step.clic) { await page.mouse.click(w / 2 + 60, h / 2); }
      await sleep(step.attente ?? 4000);
      // chargement : attendre les morceaux
      let t0 = Date.now(); while (Date.now() - t0 < 15000) { const s = await page.evaluate(() => window.__kingvi.state()); if (!s.morceauxEnAttente) break; await sleep(500); }
      await sleep(800);
      const info = await page.evaluate(() => {
        const s = window.__kingvi.state();
        const cv = document.querySelector('#stage canvas') || document.querySelector('canvas');
        const r = cv.getBoundingClientRect();
        const crt = document.querySelector('.crt-layer'), stage = cv.parentElement;
        const rr = crt ? crt.getBoundingClientRect() : null;
        const screen = document.querySelector('#screen, .screen') || stage.parentElement;
        return { s, dpr: devicePixelRatio, canvas: { w: cv.width, h: cv.height, cssW: r.width, cssH: r.height, left: r.left, top: r.top },
          px: getComputedStyle(stage).getPropertyValue('--px') || getComputedStyle(stage.parentElement).getPropertyValue('--px'),
          crtOn: !!document.querySelector('.crt'), tiltOn: !!document.querySelector('.tilt-on'), crtTop: rr?.top, classes: screen.className,
          flakes: window.__kingviFlakes };
      });
      const physPerCanvas = info.canvas.cssW * info.dpr / info.canvas.w;
      const N = info.s.zoom * physPerCanvas;
      // FPS : échantillons sur 4 s
      const fpsS = []; for (let i = 0; i < 4; i++) { await sleep(1000); fpsS.push(await page.evaluate(() => window.__kingvi.state().fps)); }
      const file = `${tag}-${step.nom}.png`;
      const png = await page.screenshot({ path: join(HERE, 'rendu', file), type: 'png' });
      const a = await analyse(page, png, N, step.crop || 0.3);
      // trame immobile ? deux captures du ciel à 1 s d'écart
      const m = { etape: step.nom, zoom: info.s.zoom, physParPixelJeu: Math.round(N * 1000) / 1000, physPerCanvas: Math.round(physPerCanvas * 1000) / 1000, info, fps: fpsS, analyse: a, capture: `tests/rendu/${file}`, zone: info.s.zone, torche: info.s.torche, jour: info.s.jour, nuit: info.s.nuit, attente: info.s.morceauxEnAttente, derniereErreur: info.s.derniereErreur };
      delete m.info.s;
      out.mesures.push(m);
      console.log(tag, step.nom, 'zoom', m.zoom, 'N', m.physParPixelJeu, 'phaseX', a.phaseX, 'phaseY', a.phaseY, 'runsBad', a.runsBadPct, 'fps', fpsS.join('/'), 'crt', info.crtOn, 'tilt', info.tiltOn, '--px', info.px, 'canvas', JSON.stringify(info.canvas));
    }
  } catch (e) { out.erreur = String(e); console.log(tag, 'ERREUR', e.message); }
  out.erreurs = errors;
  results.push(out);
  await browser.close();
}
await writeFile(process.argv[3], JSON.stringify(results, null, 1));
server.close();
