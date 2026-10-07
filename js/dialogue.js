/* La parole : le phylactère retenu (B, « lambeau de neige », v1.47.0).
   Une bulle de neige aux bords cassés, cernée d'un pixel bleu nuit, avec une
   pointe en zigzag vers la bouche ; le nom en gothique, en petit ; la ligne
   s'écrit au rythme de la lecture, la suivante vient seule. La bulle est
   dessinée en pixels du jeu (un canevas agrandi sans lissage), le texte est
   en HTML par-dessus. Le jeu (game.js) dit qui parle et où est sa tête ;
   le labo (labo-saga.js) reprend `brokenBox`. Le monde ne s'arrête pas pendant
   qu'on parle. Ce module n'importe rien. */

// Un rectangle aux bords cassés, accroché aux pixels : chaque pixel du bord
// recule de 0 ou 1 au hasard (graine fixe par bulle) ; `tail` : la pointe
export function brokenBox(ctx, x0, y0, w, h, fill, edge, seed, { tail = null, chunky = false } = {}) {
  let r = seed * 9301 + 49297;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const inset = (i, n) => (i === 0 || i === n - 1) ? 1 : (rnd() < (chunky ? 0.35 : 0.22) ? 1 : 0) + (chunky && rnd() < 0.12 ? 1 : 0);
  const top = Array.from({ length: w }, (_, i) => inset(i, w));
  const bot = Array.from({ length: w }, (_, i) => inset(i, w));
  const left = Array.from({ length: h }, (_, i) => inset(i, h));
  const right = Array.from({ length: h }, (_, i) => inset(i, h));
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h && y >= top[x] && y < h - bot[x] && x >= left[y] && x < w - right[y];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!inside(x, y)) continue;
    const border = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
    ctx.fillStyle = border ? edge : fill;
    ctx.fillRect(x0 + x, y0 + y, 1, 1);
  }
  if (tail && tail.len > 0) {
    // La pointe : quelques pixels qui descendent vers la bouche, en zigzag
    let { x, y } = tail;
    const dir = tail.dir || -1;
    for (let i = 0; i < tail.len; i++) {
      ctx.fillStyle = edge;
      ctx.fillRect(x, y, 1, 1);
      if (i < tail.len - 1) { ctx.fillStyle = fill; ctx.fillRect(x - dir, y, 1, 1); }
      y++; if (i % 2) x += dir;
    }
  }
}

const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
// Le temps de lecture d'une ligne (en secondes), et la vitesse d'écriture
export const readTime = text => 1.3 + text.length * 0.055;
const TYPE = 38;   // caractères par seconde
const PAD = 3;     // marge de la bulle, en pixels du jeu

export function createTalk(host, palette) {
  const layer = document.createElement('div');
  layer.className = 'talk';
  const canvas = document.createElement('canvas');
  canvas.className = 'talk-bubble';
  const text = document.createElement('div');
  text.className = 'talk-text';
  layer.append(canvas, text);
  host.append(layer);
  const ctx = canvas.getContext('2d');

  const queue = [];
  let line = null, t = 0, seed = 1, shown = -1, drawn = '';

  function next() {
    line = queue.shift() || null;
    t = 0; shown = -1; seed++; drawn = '';
    layer.classList.toggle('on', !!line);
    if (line) {
      text.innerHTML = `<span class="talk-name">${esc(line.name || '')}</span><span class="talk-line"></span>`;
    }
  }

  const talk = {
    // lines : [{ who, name, text, at() → { x, y } (le haut de la tête, dans le
    // monde) }] ; `interrupt` : coupe ce qui se dit
    say(lines, { interrupt = false } = {}) {
      if (interrupt) { queue.length = 0; line = null; }
      queue.push(...lines.filter(l => l && l.text));
      if (!line) next();
    },
    get busy() { return !!line || queue.length > 0; },
    clear() { queue.length = 0; next(); },
    // Le temps du jeu (s'arrête avec la pause)
    update(dt) {
      if (!line) return;
      t += dt;
      if (t > readTime(line.text) + 0.35) next();
    },
    // `project(x, y)` → { x, y } en pixels CSS dans `host`, et `unit` : la
    // taille d'un pixel du jeu en pixels CSS
    place(project, unit, bounds) {
      if (!line) return;
      // Les lettres déjà écrites ; le reste tient sa place, invisible
      const n = Math.min(line.text.length, Math.floor(t * TYPE));
      if (n !== shown) {
        shown = n;
        text.lastChild.innerHTML = `${esc(line.text.slice(0, n))}<span class="talk-rest">${esc(line.text.slice(n))}</span>`;
      }
      const fade = Math.min(1, t / 0.2, Math.max(0, (readTime(line.text) + 0.35 - t) / 0.3));
      layer.style.opacity = fade.toFixed(2);
      layer.style.setProperty('--unit', `${unit}px`);
      const head = line.at();
      const p = project(head.x, head.y);
      // La bulle, en pixels du jeu, posée au-dessus de la tête
      const tw = Math.ceil(text.offsetWidth / unit), th = Math.ceil(text.offsetHeight / unit);
      const bw = tw + PAD * 2, bh = th + PAD * 2;
      const W = bounds.width / unit, H = bounds.height / unit;
      const hx = p.x / unit, hy = p.y / unit;
      const gap = 7;
      let bx = Math.round(hx - bw / 2 + 4), by = Math.round(hy - gap - bh);
      bx = Math.max(4, Math.min(W - bw - 4, bx));
      by = Math.max(4, Math.min(H - bh - 4, by));
      const tailLen = Math.round(hy - 1 - (by + bh));
      const visible = hx > 0 && hx < W && hy > 0 && hy < H;
      // Celui qui parle est loin (on est parti, entré quelque part) : on se tait
      if (hx < -W * 0.4 || hx > W * 1.4 || hy < -H * 0.4 || hy > H * 1.4) { next(); return; }
      const tx = Math.max(bx + 3, Math.min(bx + bw - 4, Math.round(hx)));
      const key = `${bw}x${bh}:${tailLen}:${tx - bx}:${seed}:${visible}`;
      if (key !== drawn) {
        drawn = key;
        const ch = bh + Math.max(0, tailLen) + 2;
        canvas.width = bw; canvas.height = ch;
        ctx.clearRect(0, 0, bw, ch);
        brokenBox(ctx, 0, 0, bw, bh, palette.s, palette.b, seed, {
          tail: visible && tailLen > 1 ? { x: tx - bx, y: bh - 1, len: Math.min(tailLen, 14), dir: hx < bx + bw / 2 ? 1 : -1 } : null,
        });
        canvas.style.width = `${bw * unit}px`;
        canvas.style.height = `${ch * unit}px`;
      }
      canvas.style.transform = `translate(${bx * unit}px, ${by * unit}px)`;
      text.style.transform = `translate(${(bx + PAD) * unit}px, ${(by + PAD) * unit}px)`;
    },
  };
  return talk;
}
