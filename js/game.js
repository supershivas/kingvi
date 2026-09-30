/* La scène Phaser : sol par morceaux, viking, empreintes, neige qui tombe. */
import { paintSheet, FRAME_W, FRAME_H, CX, GROUND } from './viking.js';
import { WORLD, CHUNK, isLand, landing, paintChunk, DRAKKAR } from './world.js';

const Phaser = window.Phaser;

const SPEED = 21;              // pixels du monde par seconde : on marche lentement
const WALK_FPS = 7;
const OWN_PRINTS_MAX = 500;
const OWN_PRINT_LIFE = 40000;  // la neige recouvre nos pas en 40 s
const TARGET_HEIGHT = 300;     // hauteur visée de l'écran, en pixels du jeu
const FLAKES = 140;

// Taille interne et facteur d'agrandissement entier, pour des pixels nets.
export function fitScreen(w, h) {
  const zoom = Math.max(1, Math.round(h / TARGET_HEIGHT));
  return { zoom, width: Math.ceil(w / zoom), height: Math.ceil(h / zoom) };
}

export function createGame({ parent, palette, save, onSave, isPaused }) {
  const hex = c => parseInt(c.slice(1), 16);
  const rect = parent.getBoundingClientRect();
  const fit = fitScreen(rect.width, rect.height);

  class Island extends Phaser.Scene {
    constructor() { super('island'); }

    create() {
      this.chunks = new Map();
      this.keys = new Set();
      this.ownPrints = [];
      this.stepCount = save.steps || 0;
      this.distance = save.distance || 0;
      this.attacking = false;
      this.facing = save.facing || 'back';
      this.flip = !!save.flip;

      this.makeTextures();

      const land = landing();
      this.spawn = { x: land.x - 10, y: land.shore - 34 };
      const start = save.x != null && isLand(save.x, save.y) ? save : this.spawn;

      // Le drakkar sur lequel il a accosté, proue dans l'eau
      this.add.image(land.x, land.shore, 'drakkar').setOrigin(0.5, 0.5).setDepth(1);

      this.shadow = this.add.rectangle(start.x, start.y, 5, 1, hex(palette.b), 0.28).setDepth(4);
      this.player = this.add.sprite(start.x, start.y, 'viking', `${this.facing}-idle`)
        .setOrigin(CX / FRAME_W, (GROUND + 1) / FRAME_H)
        .setFlipX(this.flip)
        .setDepth(5);
      this.makeAnimations();
      this.player.on('animationupdate', (anim, frame) => this.onFrame(anim, frame));
      this.player.on('animationcomplete', anim => {
        if (anim.key.includes('attack')) {
          this.attacking = false;
          this.player.setFrame(`${this.facing}-idle`);
        }
      });

      const cam = this.cameras.main;
      cam.setBounds(0, 0, WORLD, WORLD);
      cam.setRoundPixels(true);
      cam.startFollow(this.player, true, 0.035, 0.035);
      cam.setBackgroundColor(palette.b);

      this.makeSnowfall();

      window.addEventListener('keydown', this.onKeyDown = e => {
        if (isPaused()) return;
        if (MOVE_CODES[e.code]) { this.keys.add(e.code); e.preventDefault(); }
      });
      window.addEventListener('keyup', this.onKeyUp = e => this.keys.delete(e.code));
      window.addEventListener('blur', () => this.keys.clear());

      this.input.on('pointerdown', p => {
        if (!isPaused() && p.button === 0) this.attack(p.worldX, p.worldY);
      });

      this.time.addEvent({ delay: 4000, loop: true, callback: () => this.persist() });
      this.updateChunks(true);
    }

    makeTextures() {
      const sheet = document.createElement('canvas');
      const frames = paintSheet(sheet, palette);
      const tex = this.textures.addCanvas('viking', sheet);
      frames.forEach(f => tex.add(f.name, 0, f.x, 0, FRAME_W, FRAME_H));

      const boat = document.createElement('canvas');
      boat.width = DRAKKAR[0].length; boat.height = DRAKKAR.length;
      const bctx = boat.getContext('2d');
      DRAKKAR.forEach((row, y) => [...row].forEach((c, x) => {
        if (c === '.') return;
        bctx.fillStyle = palette[c]; bctx.fillRect(x, y, 1, 1);
      }));
      this.textures.addCanvas('drakkar', boat);

      const dot = document.createElement('canvas');
      dot.width = dot.height = 1;
      const dctx = dot.getContext('2d');
      dctx.fillStyle = palette.s; dctx.fillRect(0, 0, 1, 1);
      this.textures.addCanvas('flake', dot);
      const dark = document.createElement('canvas');
      dark.width = dark.height = 1;
      const kctx = dark.getContext('2d');
      kctx.fillStyle = palette.b; kctx.fillRect(0, 0, 1, 1);
      this.textures.addCanvas('dust', dark);
    }

    makeAnimations() {
      for (const view of ['side', 'front', 'back']) {
        this.anims.create({
          key: `${view}-walk`,
          frames: [0, 1, 2, 3].map(i => ({ key: 'viking', frame: `${view}-walk-${i}` })),
          frameRate: WALK_FPS, repeat: -1,
        });
        this.anims.create({
          key: `${view}-attack`,
          frames: [
            { key: 'viking', frame: `${view}-attack-0`, duration: 90 },
            { key: 'viking', frame: `${view}-attack-1`, duration: 70 },
            { key: 'viking', frame: `${view}-attack-2`, duration: 60 },
            { key: 'viking', frame: `${view}-attack-3`, duration: 180 },
          ],
          frameRate: 12, repeat: 0,
        });
      }
    }

    makeSnowfall() {
      // Flocons couleur neige : on ne les voit que sur ce qui est sombre
      // (la mer, le viking, les rochers), comme de vrais flocons sur la neige.
      // Ils vivent dans le monde (et non collés à l'écran) : ils défilent quand on marche.
      this.flakes = [];
      for (let i = 0; i < FLAKES; i++) {
        const f = this.add.image(0, 0, 'flake').setDepth(10);
        this.placeFlake(f, true);
        this.flakes.push(f);
      }
      this.dust = this.add.particles(0, 0, 'dust', {
        lifespan: { min: 300, max: 700 },
        speed: { min: 6, max: 22 },
        gravityY: 30,
        alpha: { start: 0.8, end: 0 },
        emitting: false,
      }).setDepth(6);
    }

    placeFlake(f, anywhere) {
      const v = this.cameras.main.worldView;
      const w = this.scale.width, h = this.scale.height;
      const x0 = v.width ? v.x : this.player.x - w / 2;
      const y0 = v.height ? v.y : this.player.y - h / 2;
      f.x = x0 + Math.random() * (w + 60);
      f.y = anywhere ? y0 + Math.random() * h : y0 - 4;
      f.vx = -2 - Math.random() * 5;
      f.vy = 5 + Math.random() * 7;
      f.phase = Math.random() * 6.28;
      f.setAlpha(0.6 + Math.random() * 0.4);
    }

    updateFlakes(time, delta) {
      const v = this.cameras.main.worldView, dt = delta / 1000;
      for (const f of this.flakes) {
        f.x += (f.vx + Math.sin(time / 900 + f.phase) * 2) * dt;
        f.y += f.vy * dt;
        // Sorti par le bas : il repart d'en haut ; sorti ailleurs (on a marché) : n'importe où
        if (f.y > v.bottom + 4) this.placeFlake(f, false);
        else if (f.y < v.y - 40 || f.x < v.x - 60 || f.x > v.right + 60) this.placeFlake(f, true);
      }
    }

    onFrame(anim, frame) {
      // Une empreinte à chaque pose de pied (temps 0 et 2 du cycle)
      if (anim.key.endsWith('walk') && (frame.index === 1 || frame.index === 3)) {
        this.leavePrint(frame.index === 1 ? -1 : 1);
      }
    }

    leavePrint(side) {
      const { x, y } = this.player;
      const horizontal = this.facing === 'side';
      const px = Math.round(x + (horizontal ? 0 : side));
      const py = Math.round(y - 1 + (horizontal ? (side > 0 ? 0 : -1) : 0));
      const mark = this.add.rectangle(px, py, horizontal ? 2 : 1, horizontal ? 1 : 2, hex(palette.b), 0.9)
        .setOrigin(0, 0).setDepth(2);
      this.tweens.add({ targets: mark, alpha: 0, duration: OWN_PRINT_LIFE, ease: 'Quad.easeIn', onComplete: () => mark.destroy() });
      this.ownPrints.push(mark);
      if (this.ownPrints.length > OWN_PRINTS_MAX) this.ownPrints.shift().destroy();
      this.stepCount++;
    }

    attack(tx, ty) {
      if (this.attacking) return;
      const dx = tx - this.player.x, dy = ty - (this.player.y - 5);
      if (Math.abs(dx) > Math.abs(dy)) { this.facing = 'side'; this.flip = dx < 0; }
      else this.facing = dy < 0 ? 'back' : 'front';
      this.player.setFlipX(this.flip);
      this.attacking = true;
      this.player.play(`${this.facing}-attack`);
      // Neige soulevée par la lame, au moment de la coupe
      this.time.delayedCall(170, () => {
        const dir = this.facing === 'side' ? (this.flip ? -1 : 1) : 0;
        const vy = this.facing === 'back' ? -1 : this.facing === 'front' ? 1 : 0;
        this.dust.explode(7, this.player.x + dir * 6 + (dir ? 0 : -3), this.player.y - 2 + vy * 3);
      });
    }

    update(time, delta) {
      if (isPaused()) { this.keys.clear(); }
      let mx = 0, my = 0;
      for (const code of this.keys) { mx += MOVE_CODES[code][0]; my += MOVE_CODES[code][1]; }

      if (!this.attacking) {
        if (mx || my) {
          const len = Math.hypot(mx, my);
          const step = SPEED * delta / 1000;
          const nx = this.player.x + mx / len * step, ny = this.player.y + my / len * step;
          // Pas dans la mer : on glisse le long du rivage si possible
          if (isLand(nx, ny)) { this.player.x = nx; this.player.y = ny; }
          else if (mx && isLand(nx, this.player.y)) this.player.x = nx;
          else if (my && isLand(this.player.x, ny)) this.player.y = ny;
          this.distance += step;

          if (mx) { this.facing = 'side'; this.flip = mx < 0; }
          else this.facing = my < 0 ? 'back' : 'front';
          this.player.setFlipX(this.flip);
          const key = `${this.facing}-walk`;
          if (this.player.anims.currentAnim?.key !== key || !this.player.anims.isPlaying) this.player.play(key, true);
        } else if (this.player.anims.isPlaying) {
          this.player.stop();
          this.player.setFrame(`${this.facing}-idle`);
        }
      }
      this.shadow.setPosition(Math.round(this.player.x), Math.round(this.player.y));
      this.updateFlakes(time, delta);
      this.updateChunks();
    }

    // Charge les morceaux de sol visibles, oublie ceux qui sont loin.
    updateChunks(force) {
      const cam = this.cameras.main;
      const v = cam.worldView;
      const margin = CHUNK / 2;
      const c0 = Math.max(0, Math.floor((v.x - margin) / CHUNK));
      const c1 = Math.min(WORLD / CHUNK - 1, Math.floor((v.right + margin) / CHUNK));
      const r0 = Math.max(0, Math.floor((v.y - margin) / CHUNK));
      const r1 = Math.min(WORLD / CHUNK - 1, Math.floor((v.bottom + margin) / CHUNK));
      if (!force && this.lastRange === `${c0},${c1},${r0},${r1}`) return;
      this.lastRange = `${c0},${c1},${r0},${r1}`;

      const wanted = new Set();
      let painted = 0;
      for (let cy = r0; cy <= r1; cy++) {
        for (let cx = c0; cx <= c1; cx++) {
          const key = `${cx},${cy}`;
          wanted.add(key);
          if (this.chunks.has(key)) continue;
          // Au plus deux morceaux peints par image, pour ne pas saccader
          if (!force && painted >= 2) { this.lastRange = null; continue; }
          painted++;
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = CHUNK;
          paintChunk(canvas.getContext('2d'), cx, cy, palette);
          const texKey = `chunk-${key}`;
          this.textures.addCanvas(texKey, canvas);
          const img = this.add.image(cx * CHUNK, cy * CHUNK, texKey).setOrigin(0, 0).setDepth(0);
          this.chunks.set(key, img);
        }
      }
      for (const [key, img] of this.chunks) {
        if (wanted.has(key)) continue;
        const far = this.chunks.size > 40;
        if (!far) continue;
        img.destroy();
        this.textures.remove(`chunk-${key}`);
        this.chunks.delete(key);
      }
    }

    persist() {
      onSave({
        x: Math.round(this.player.x), y: Math.round(this.player.y),
        facing: this.facing, flip: this.flip,
        steps: this.stepCount, distance: Math.round(this.distance),
      });
    }

    backToShore() {
      this.player.setPosition(this.spawn.x, this.spawn.y);
      this.facing = 'back'; this.flip = false;
      this.player.setFrame('back-idle').setFlipX(false);
      this.cameras.main.centerOn(this.spawn.x, this.spawn.y);
      this.updateChunks(true);
      this.persist();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: fit.width,
    height: fit.height,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: palette.b,
    scale: { mode: Phaser.Scale.NONE, zoom: fit.zoom },
    scene: Island,
    banner: false,
    input: { mouse: { preventDefaultWheel: false } },
    disableContextMenu: true,
  });

  function resize() {
    const r = parent.getBoundingClientRect();
    const f = fitScreen(r.width, r.height);
    game.scale.setZoom(f.zoom);
    game.scale.resize(f.width, f.height);
    parent.style.setProperty('--px', `${f.zoom}px`);
  }
  window.addEventListener('resize', resize);
  parent.style.setProperty('--px', `${fit.zoom}px`);

  return {
    game,
    scene: () => game.scene.getScene('island'),
    save: () => game.scene.getScene('island')?.persist(),
  };
}

// Touches physiques : ZQSD sur un clavier AZERTY, WASD en QWERTY, et les flèches.
const MOVE_CODES = {
  KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0],
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
};
