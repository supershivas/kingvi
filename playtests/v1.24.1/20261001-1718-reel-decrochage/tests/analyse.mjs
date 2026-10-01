// Analyse des PNG : longueurs de plages (horizontales et verticales), avec un seuil de différence de couleur
import { createRequire } from 'node:module';
import { readFile, readdir } from 'node:fs/promises';
const require = createRequire('/home/user/kingvi/tools/playtest/package.json');
const { chromium } = require('playwright');
const res = JSON.parse(await readFile(process.argv[2], 'utf8'));
const browser = await chromium.launch(); const page = await browser.newPage();
for (const r of res) for (const m of r.mesures) {
  const png = await readFile(m.capture.replace('tests/', ''));
  const out = await page.evaluate(async ([b64, N, cv, dpr, thr]) => {
    const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
    const W = bmp.width, H = bmp.height, c = new OffscreenCanvas(W, H), x = c.getContext('2d'); x.drawImage(bmp, 0, 0);
    const d = x.getImageData(0, 0, W, H).data;
    const top = Math.round(cv.top * dpr), h = Math.round(cv.cssH * dpr);
    const x0 = Math.round(W * 0.35), x1 = Math.round(W * 0.65), y0 = top + Math.round(h * 0.35), y1 = top + Math.round(h * 0.65);
    const diff = (i, j) => Math.abs(d[i] - d[j]) + Math.abs(d[i + 1] - d[j + 1]) + Math.abs(d[i + 2] - d[j + 2]);
    const n = Math.round(N);
    const hist = (horiz) => { const h = {}; let bad = 0, tot = 0;
      const A = horiz ? [y0, y1, x0, x1] : [x0, x1, y0, y1];
      for (let a = A[0]; a < A[1]; a += 1) { let run = 0, started = false;
        for (let b = A[2] + 1; b < A[3]; b++) { const i = horiz ? (a * W + b) * 4 : (b * W + a) * 4, j = horiz ? i - 4 : i - W * 4; run++;
          if (diff(i, j) > thr) { if (started) { h[run] = (h[run] || 0) + 1; tot++; if (run % n) bad++; } started = true; run = 0; } } }
      const top5 = Object.entries(h).sort((p, q) => q[1] - p[1]).slice(0, 6).map(([k, v]) => `${k}:${v}`).join(' ');
      return { badPct: tot ? Math.round(bad / tot * 1000) / 10 : null, tot, top5 }; };
    return { H: hist(true), V: hist(false) };
  }, [png.toString('base64'), m.physParPixelJeu, m.info.canvas, m.info.dpr, 40]);
  console.log(r.nom.padEnd(26), m.etape.padEnd(13), 'N', m.physParPixelJeu, '| horiz bad', out.H.badPct, '%', out.H.top5, '| vert bad', out.V.badPct, '%', out.V.top5);
}
await browser.close();
