import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
const require = createRequire('/home/user/kingvi/tools/playtest/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch(); const page = await browser.newPage();
// node profil.mjs fichier.png xFrac yFrac n  → luminance des n lignes d'une colonne
const [file, xf, yf, n] = process.argv.slice(2);
const png = await readFile(file);
const out = await page.evaluate(async ([b64, xf, yf, n]) => {
  const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
  const W = bmp.width, H = bmp.height, c = new OffscreenCanvas(W, H), x = c.getContext('2d'); x.drawImage(bmp, 0, 0);
  const X = Math.round(W * xf), Y = Math.round(H * yf);
  const d = x.getImageData(X, Y, 1, n).data; const r = [];
  for (let i = 0; i < n; i++) r.push(Math.round(d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11));
  return { W, H, X, Y, r: r.join(' ') };
}, [png.toString('base64'), +xf, +yf, +n]);
console.log(JSON.stringify(out));
await browser.close();
