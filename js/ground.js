/* Le sol en tuiles de 256 px (un morceau de l'île chacune), peintes une fois :
   une tuile qui sort de la vue garde sa peinture (et la planche de ses objets)
   en réserve, et revient sans être repeinte.

   Les pas, le sang, les entailles ne sont pas des objets : ils s'écrivent
   directement dans la toile de la tuile. Chaque tuile garde sa peinture
   d'origine (`pristine`) ; une marque qui s'efface fait recomposer la tuile
   (peinture d'origine, puis les marques encore là, à leur opacité du moment),
   par paliers : quelques fois au cours de sa vie, pas à chaque image. Les
   marques permanentes (`decal` : le sillon de la barque, les pistes de loups)
   sont peintes dans la peinture d'origine.

   Le module ne connaît Phaser que par `onUpload(tuile)` : la toile a changé,
   la texture doit être renvoyée à la carte graphique. */
import { CHUNK, paintChunkSteps } from './world.js?v=1.53.2';

const LEVELS = 12;               // paliers de l'effacement d'une marque
const MAX_MARKS = 2000;          // au-delà, les plus anciennes disparaissent
const RESERVE = 48 * 2 ** 20;    // octets gardés en réserve pour les tuiles hors de vue

export function createGround(palette) {
  const tiles = new Map();       // clé → { canvas, ctx, pristine, atlas?, bytes, used, live }
  const marks = new Map();       // clé → marques temporaires de la tuile
  const decals = new Map();      // clé → marques permanentes
  let fifo = [];                 // toutes les marques temporaires, de la plus ancienne
  const dirty = new Set();       // tuiles à renvoyer à la carte graphique
  let clock = 0;

  const keyOf = (cx, cy) => `${cx},${cy}`;
  // Les tuiles que touche un rectangle (une marque à cheval sur deux tuiles
  // s'écrit dans les deux)
  function tilesOf(x, y, w, h) {
    const out = [];
    for (let cy = Math.floor(y / CHUNK); cy <= Math.floor((y + h - 1) / CHUNK); cy++) {
      for (let cx = Math.floor(x / CHUNK); cx <= Math.floor((x + w - 1) / CHUNK); cx++) out.push(keyOf(cx, cy));
    }
    return out;
  }
  function paint(ctx, m, x0, y0, a) {
    ctx.globalAlpha = a;
    ctx.fillStyle = palette[m.color] || m.color;
    ctx.fillRect(m.x - x0, m.y - y0, m.w, m.h);
  }
  // Opacité d'une marque à l'instant t : elle pâlit de plus en plus vite
  // (comme un fondu en Quad.easeIn), par paliers
  function level(m, t) {
    const k = (t - m.born) / m.life;
    if (k >= 1) return 0;
    return Math.max(1, Math.ceil((1 - k * k) * LEVELS));
  }

  function compose(key, tile) {
    const [cx, cy] = key.split(',').map(Number), x0 = cx * CHUNK, y0 = cy * CHUNK;
    const ctx = tile.ctx;
    ctx.globalAlpha = 1;
    ctx.drawImage(tile.pristine, 0, 0);
    for (const m of marks.get(key) || []) paint(ctx, m, x0, y0, m.a * m.level / LEVELS);
    ctx.globalAlpha = 1;
    dirty.add(key);
  }

  // La réserve : les tuiles hors de vue les moins récemment vues partent
  // les premières
  function trim() {
    let total = 0;
    const idle = [];
    for (const [key, t] of tiles) if (!t.live) { total += t.bytes; idle.push([key, t]); }
    if (total <= RESERVE) return;
    idle.sort((a, b) => a[1].used - b[1].used);
    for (const [key, t] of idle) {
      if (total <= RESERVE) break;
      total -= t.bytes;
      tiles.delete(key);
    }
  }

  return {
    // Une tuile, peinte si elle ne l'est pas encore (générateur : chaque
    // `yield` rend la main). Rend { canvas, atlas } ; `atlas` est la planche
    // des objets, gardée avec la tuile si on l'y range (`keepAtlas`).
    *tile(cx, cy) {
      const key = keyOf(cx, cy);
      let t = tiles.get(key);
      if (!t) {
        const pristine = document.createElement('canvas');
        pristine.width = pristine.height = CHUNK;
        const pctx = pristine.getContext('2d');
        yield* paintChunkSteps(pctx, cx, cy, palette);
        // (une autre préparation a pu finir la même tuile pendant ce temps)
        t = tiles.get(key);
        if (!t) {
          for (const d of decals.get(key) || []) paint(pctx, d, cx * CHUNK, cy * CHUNK, d.a);
          pctx.globalAlpha = 1;
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = CHUNK;
          const ctx = canvas.getContext('2d');
          t = { canvas, ctx, pristine, atlas: null, bytes: 2 * CHUNK * CHUNK * 4, used: 0, live: false };
          tiles.set(key, t);
          compose(key, t);
        }
      }
      t.used = ++clock;
      return t;
    },
    keepAtlas(cx, cy, atlas) {
      const t = tiles.get(keyOf(cx, cy));
      if (!t || t.atlas) return;
      t.atlas = atlas;
      t.bytes += atlas.canvas.width * atlas.canvas.height * 4;
    },
    // La tuile est affichée (elle ne quitte pas la réserve) ou ne l'est plus
    setLive(cx, cy, live) {
      const t = tiles.get(keyOf(cx, cy));
      if (!t) return;
      t.live = live; t.used = ++clock;
      if (live) dirty.delete(keyOf(cx, cy));
      else trim();
    },

    // Une marque permanente (peinte dans la peinture d'origine)
    decal(x, y, w, h, color, a) {
      const d = { x, y, w, h, color, a };
      for (const key of tilesOf(x, y, w, h)) {
        if (!decals.has(key)) decals.set(key, []);
        decals.get(key).push(d);
        const t = tiles.get(key);
        if (t) {
          const [cx, cy] = key.split(',').map(Number);
          paint(t.pristine.getContext('2d'), d, cx * CHUNK, cy * CHUNK, a);
          t.pristine.getContext('2d').globalAlpha = 1;
          compose(key, t);
        }
      }
    },

    // Une marque qui s'efface en `life` ms (l'horloge est celle qu'on passe à
    // `update` et à `mark` : celle du jeu)
    mark(x, y, w, h, life, color, a, now) {
      const m = { x, y, w, h, life, color, a, born: now, level: LEVELS };
      for (const key of tilesOf(x, y, w, h)) {
        if (!marks.has(key)) marks.set(key, []);
        marks.get(key).push(m);
        const t = tiles.get(key);
        if (t) {
          const [cx, cy] = key.split(',').map(Number);
          paint(t.ctx, m, cx * CHUNK, cy * CHUNK, a);
          t.ctx.globalAlpha = 1;
          dirty.add(key);
        }
      }
      fifo.push(m);
      if (fifo.length > MAX_MARKS) {
        fifo = fifo.filter(o => o.level > 0 && !o.gone);
        while (fifo.length > MAX_MARKS) fifo.shift().gone = true;
      }
    },

    // Les marques pâlissent (quelques fois par seconde suffit) ; rend les
    // tuiles dont la toile a changé
    fade(now) {
      for (const [key, list] of marks) {
        let changed = false;
        for (const m of list) {
          const l = m.gone ? 0 : level(m, now);
          if (l !== m.level) { m.level = l; changed = true; }
        }
        if (!changed) continue;
        const kept = list.filter(m => m.level > 0);
        if (kept.length) marks.set(key, kept); else marks.delete(key);
        const t = tiles.get(key);
        if (t) compose(key, t);
      }
    },
    // Les tuiles à renvoyer à la carte graphique (et on les oublie)
    takeDirty() {
      const out = [...dirty];
      dirty.clear();
      return out;
    },
  };
}
