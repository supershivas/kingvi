// Transforme le texte « Copier mes modifications » de l'onglet Dessins du labo
// (collé dans la conversation) en PNG 1 × 1 dans assets/design/ :
//   node scripts/designs-vers-png.mjs retouches.txt
// Les PNG sont ensuite lus par le jeu (designs.js). Sans dépendance.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const COLORS = { s: [0xdf, 0xe6, 0xee], b: [0x1f, 0x2a, 0x44], k: [0x1f, 0x2a, 0x44], r: [0xc0, 0x39, 0x2b] };   // neige, bleu nuit, rouge (style.css)

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0); out.write(type, 4, 'latin1'); data.copy(out, 8);
  out.writeUInt32BE(crc(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function png(rows) {
  const w = rows[0].length, h = rows.length, raw = Buffer.alloc((w * 4 + 1) * h);
  rows.forEach((row, y) => {
    for (let x = 0; x < w; x++) {
      const c = COLORS[row[x]], o = y * (w * 4 + 1) + 1 + x * 4;
      if (c) { raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2]; raw[o + 3] = 255; }
    }
  });
  const head = Buffer.alloc(13); head.writeUInt32BE(w, 0); head.writeUInt32BE(h, 4); head[8] = 8; head[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const lines = readFileSync(process.argv[2], 'utf8').split('\n').map(l => l.trim()).filter(Boolean);
if (!lines[0]?.startsWith('KINGVI-DESSINS')) throw new Error('Texte inattendu : il doit commencer par KINGVI-DESSINS.');
mkdirSync(join(root, 'assets/design'), { recursive: true });
for (const line of lines.slice(1)) {
  const [, name, size, data] = line.match(/^(\S+) (\d+x\d+) (.+)$/) || [];
  if (!name) { console.log('ligne ignorée :', line.slice(0, 40)); continue; }
  const [w, h] = size.split('x').map(Number);
  const rows = data.split('|').map(r => [...r.matchAll(/(.)(\d+)/g)].map(m => m[1].repeat(+m[2])).join(''));
  if (rows.length !== h || rows.some(r => r.length !== w)) { console.log(`${name} : taille incohérente, ignoré`); continue; }
  writeFileSync(join(root, 'assets/design', `${name}.png`), png(rows));
  console.log(`${name}.png (${w} × ${h})`);
}
