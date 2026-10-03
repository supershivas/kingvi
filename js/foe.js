/* L'autre viking, qui attend au bout des traces. Même silhouette que le
   héros, même épée. Il guette vers l'ouest ; quand on approche, il se tourne,
   vient au contact et frappe (on voit venir le coup : il arme d'abord).
   Trois coups l'abattent ; trois coups nous abattent.

   Le module ne connaît la scène que par ce qu'on lui passe : le sprite
   partagé du viking (animations globales), et quelques fonctions. */
import { CX, GROUND, ORIGIN_X, ORIGIN_Y, IMPACT } from './viking.js?v=1.37.0';

export const FOE_HP = 3;
const SIGHT = 110;          // il nous voit venir de là
const REACH = { min: 7, max: 14, dy: 4 };
const SPEED = 15;

export function createFoe(scene, { post, walkable, capeAnchor, onStrike, bleed, dead = false }) {
  const sprite = scene.add.sprite(post.x + 0.5, post.y, 'viking', 'side-idle')
    .setOrigin(ORIGIN_X, ORIGIN_Y).setFlipX(true);
  const cape = scene.add.image(0, 0, 'cape', 'cape-0-0').setOrigin(0, 0);
  const pips = scene.add.graphics();

  const foe = {
    pos: { x: post.x, y: post.y },
    hp: FOE_HP, state: 'wait', flip: true, cool: 0, stun: 0, vx: 0,
    sprite, cape, pips, engaged: false,
  };

  sprite.on('animationupdate', (anim, frame) => {
    if (anim.key === 'side-attack' && frame.index === 3) strike();
  });
  sprite.on('animationcomplete', anim => {
    if (anim.key === 'side-attack' && foe.state === 'attack') {
      foe.state = 'engage';
      foe.cool = 1.3 + Math.random() * 0.8;
      sprite.setFrame('side-idle');
    }
  });

  // `alpha` : entre les deux derniers pas de logique (le rendu interpole)
  function place(alpha = 1) {
    const p = foe.prev && Math.hypot(foe.prev.x - foe.pos.x, foe.prev.y - foe.pos.y) < 12 ? foe.prev : foe.pos;
    const x = p.x + (foe.pos.x - p.x) * alpha, y = p.y + (foe.pos.y - p.y) * alpha;
    const px = Math.round(x), py = Math.round(y);
    sprite.setPosition(px + 0.5, py).setDepth(foe.pos.y).setFlipX(foe.flip);
    const a = capeAnchor[sprite.frame.name];
    if (a && foe.state !== 'dead') {
      const col = foe.flip ? 2 * CX - a.west - 1 : a.east - 1;
      cape.setPosition(px + col - CX, py + a.y - GROUND - 1).setDepth(foe.pos.y - 0.01);
    }
  }

  // Le coup porte-t-il ? (pointe de la lame, devant lui)
  function strike() {
    const dir = foe.flip ? -1 : 1;
    const ix = foe.pos.x + IMPACT.side.x * dir, iy = foe.pos.y + IMPACT.side.y;
    scene.jolt?.(0.004);
    onStrike(ix, iy, dir);
  }

  function die(dir) {
    foe.state = 'dead';
    sprite.stop();
    sprite.setTexture('fallen').setOrigin(0.5, 1).setFlipX(dir < 0).setAlpha(1);
    cape.setVisible(false);
    bleed(foe.pos.x, foe.pos.y, 14);
    pips.clear();
  }

  if (dead) die(1);

  // (un accesseur : Object.assign en figerait la valeur)
  Object.defineProperty(foe, 'alive', { get: () => foe.state !== 'dead' });
  return Object.assign(foe, {

    // Un coup du héros, dont la lame touche (x, y) : touché ?
    // `probe` : seulement savoir s'il est sous la lame, sans le blesser
    hitAt(x, y, dir, probe = false) {
      if (foe.state === 'dead') return false;
      if (Math.abs(x - foe.pos.x) > 7 || Math.abs(y - (foe.pos.y - 2)) > 6) return false;
      if (probe) return true;
      foe.hp--;
      bleed(foe.pos.x, foe.pos.y, 5);
      if (foe.hp <= 0) { die(dir); return true; }
      foe.state = 'hurt';
      foe.stun = 0.45;
      foe.vx = dir * 40;
      sprite.stop(); sprite.setFrame('side-attack-3');
      scene.tweens.add({ targets: sprite, alpha: 0.2, duration: 70, yoyo: true, repeat: 2 });
      return true;
    },

    // Revient à son poste, requinqué (quand le héros est tombé)
    reset() {
      if (foe.state === 'dead') return;
      foe.hp = FOE_HP; foe.state = 'wait'; foe.pos = { ...post }; foe.flip = true; foe.engaged = false;
      sprite.stop(); sprite.setFrame('side-idle').setAlpha(1);
    },

    update(dt, player, capeFrame) {
      foe.prev = { x: foe.pos.x, y: foe.pos.y };
      if (foe.state === 'dead') return;
      cape.setFrame(capeFrame);
      const dx = player.pos.x - foe.pos.x, dy = player.pos.y - foe.pos.y, d = Math.hypot(dx, dy);
      foe.cool -= dt;

      if (foe.state === 'wait') {
        if (!player.dead && !player.inside && d < SIGHT) { foe.state = 'engage'; foe.engaged = true; }
      } else if (foe.state === 'hurt') {
        foe.stun -= dt;
        const nx = foe.pos.x + foe.vx * dt;
        if (walkable(nx, foe.pos.y)) foe.pos.x = nx;
        foe.vx *= 1 - 8 * dt;
        if (foe.stun <= 0) foe.state = 'engage';
      } else if (foe.state === 'engage') {
        // On s'est enfui (ou on est mort) : il retourne à son poste
        if (player.dead || player.inside || player.rowing || d > SIGHT * 2.2) { foe.reset(); }
        else {
          foe.flip = dx < 0;
          // Il se place à portée d'épée, à côté de nous, à la même hauteur
          const tx = player.pos.x - Math.sign(dx || 1) * 11, ty = player.pos.y;
          const ex = tx - foe.pos.x, ey = ty - foe.pos.y, e = Math.hypot(ex, ey);
          const inReach = Math.abs(dx) >= REACH.min && Math.abs(dx) <= REACH.max && Math.abs(dy) <= REACH.dy;
          if (inReach && foe.cool <= 0) {
            foe.state = 'attack';
            sprite.play('side-attack');
          } else if (e > 1.5) {
            const step = SPEED * dt;
            const nx = foe.pos.x + ex / e * step, ny = foe.pos.y + ey / e * step;
            if (walkable(nx, ny)) { foe.pos.x = nx; foe.pos.y = ny; }
            else if (walkable(nx, foe.pos.y)) foe.pos.x = nx;
            else if (walkable(foe.pos.x, ny)) foe.pos.y = ny;
            if (sprite.anims.currentAnim?.key !== 'side-walk' || !sprite.anims.isPlaying) sprite.play('side-walk');
          } else if (sprite.anims.isPlaying) {
            sprite.stop(); sprite.setFrame('side-idle');
          }
        }
      }
    },

    // Une image : là où il est, entre les deux derniers pas
    render(alpha) {
      if (foe.state === 'dead') { sprite.setDepth(foe.pos.y - 1); return; }
      place(alpha);
      drawPips(pips, sprite.x - 0.5, foe.pos.y, foe.hp, foe.engaged);
    },
  });
}

// Trois petits traits au-dessus de la tête, pendant le combat seulement
export function drawPips(g, x, y, hp, show, color = 0x1f2a44) {
  g.clear();
  if (!show) return;
  g.setDepth(y + 0.02);
  const x0 = Math.round(x) - 4, y0 = Math.round(y) - 14;
  for (let i = 0; i < FOE_HP; i++) {
    g.fillStyle(color, i < hp ? 0.95 : 0.2);
    g.fillRect(x0 + i * 3, y0, 2, 1);
  }
}
