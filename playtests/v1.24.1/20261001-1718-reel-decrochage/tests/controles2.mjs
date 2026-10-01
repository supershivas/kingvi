// (variante : sans le blur synthétique, après le cool-down) Clavier (3 dispositions), perte de focus, Maj, clics rapides — mode debug, vitesse 1
import { setup, watchErrors, openDebug, S, K, sleep, OUT } from './lib.mjs';
const { base, context, errors, close } = await setup();
const page = await context.newPage();
watchErrors(page, errors);
await openDebug(page, base);
await K(page, 'setTime', 'jour'); await K(page, 'setWeather', 'calme');
await sleep(20000); // fin du « cool-down » de Phaser (120 images à delta plafonné)
const out = {};
const synth = (type, code, key) => page.evaluate(([t, c, k]) => window.dispatchEvent(new KeyboardEvent(t, { code: c, key: k, bubbles: true })), [type, code, key]);
const LAY = {
  azerty: { down: c => synth('keydown', c, { KeyW: 'z', KeyD: 'd', KeyA: 'q' }[c]), up: c => synth('keyup', c, { KeyW: 'z', KeyD: 'd', KeyA: 'q' }[c]) },
  qwerty: { down: c => page.keyboard.down(c), up: c => page.keyboard.up(c) },
  fleches: { down: c => page.keyboard.down({ KeyW: 'ArrowUp', KeyD: 'ArrowRight', KeyA: 'ArrowLeft' }[c]), up: c => page.keyboard.up({ KeyW: 'ArrowUp', KeyD: 'ArrowRight', KeyA: 'ArrowLeft' }[c]) },
};
// ── 1. Les trois dispositions : 4 s vers l'est, puis 4 s vers l'ouest (retour), puis 2 s vers le haut
for (const [name, L] of Object.entries(LAY)) {
  await K(page, 'teleport', 'barque'); await sleep(800);
  const r = {};
  for (const [dir, code, ms] of [['est', 'KeyD', 4000], ['ouest', 'KeyA', 4000], ['haut', 'KeyW', 2000]]) {
    const a = await S(page); await L.down(code); await sleep(ms); await L.up(code); await sleep(300);
    const b = await S(page);
    const dt = b.tempsJeu - a.tempsJeu;
    r[dir] = { dx: +(b.x - a.x).toFixed(1), dy: +(b.y - a.y).toFixed(1), jeu: +dt.toFixed(2), pxs: +(Math.hypot(b.x - a.x, b.y - a.y) / (dt - 0.3)).toFixed(1) };
  }
  out[name] = r;
}
// Un QWERTY qui presse sa touche Z (code KeyZ) ne doit rien faire
{ await K(page, 'teleport', 'barque'); await sleep(500); const a = await S(page); await page.keyboard.down('KeyZ'); await sleep(1500); await page.keyboard.up('KeyZ'); const b = await S(page); out.keyZ = { dx: b.x - a.x, dy: b.y - a.y }; }

// ── 3. Maj : pendant une attaque, puis relâchée ; endurance vide
const trace = async (ms) => page.evaluate(ms => new Promise(res => {
  const t0 = performance.now(), rows = [];
  const f = () => { const s = window.__kingvi.state(); rows.push([+(performance.now() - t0).toFixed(0), s.x, s.endurance, s.court ? 1 : 0, s.attaque ? 1 : 0, s.tempsJeu]); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(rows); };
  requestAnimationFrame(f);
}), ms);
const clickNear = async (dx, dy) => { const s = await S(page); const p = await page.evaluate(([x, y]) => window.__kingvi.toScreen(x, y), [s.x + dx, s.y + dy]); await page.mouse.click(p.x, p.y); };
{
  await K(page, 'teleport', 'barque'); await sleep(2500);
  // Maj tenue, on frappe sur place, on relâche Maj pendant le coup, puis on marche
  await page.keyboard.down('Shift');
  await clickNear(20, -3); await sleep(150);
  const during = await S(page);
  await page.keyboard.up('Shift'); await sleep(900);
  await page.keyboard.down('KeyD'); const rows = await trace(2000); await page.keyboard.up('KeyD');
  out.majPendantAttaque = { pendant: { attaque: during.attaque, court: during.court, endurance: during.endurance }, apres: { court: rows.some(r => r[3]), vitesse: +((rows.at(-1)[1] - rows[0][1]) / (rows.at(-1)[5] - rows[0][5])).toFixed(1) } };
  // Maj + marche, puis clic : la course reprend-elle après le coup ? (Maj toujours tenue)
  await K(page, 'teleport', 'barque'); await sleep(2500);
  await page.keyboard.down('Shift'); await page.keyboard.down('KeyD'); await sleep(600);
  await clickNear(20, -3);
  const r2 = await trace(2500);
  await page.keyboard.up('KeyD'); await page.keyboard.up('Shift');
  out.courseEtCoup = { lignes: r2.length, attaqueVue: r2.some(r => r[4]), courtApres: r2.slice(-5).every(r => r[3]), enduranceFin: r2.at(-1)[2] };
  // Course jusqu'à l'endurance vide, Maj tenue 14 s
  await K(page, 'teleport', 'barque'); await sleep(3000);
  await page.keyboard.down('Shift'); await page.keyboard.down('KeyD');
  const r3 = await trace(14000);
  await page.keyboard.up('KeyD'); await page.keyboard.up('Shift');
  const empty = r3.findIndex(r => r[2] <= 0.02);
  const after = empty >= 0 ? r3.slice(empty) : [];
  let switches = 0; for (let i = 1; i < after.length; i++) if (after[i][3] !== after[i - 1][3]) switches++;
  out.courseVide = {
    images: r3.length, videA_ms: empty >= 0 ? r3[empty][0] : null,
    imagesCourantApresVide: after.filter(r => r[3]).length, imagesApresVide: after.length, basculesCourse: switches,
    enduranceMaxApresVide: after.length ? Math.max(...after.map(r => r[2])) : null,
    vitesseAvant: empty > 5 ? +((r3[empty][1] - r3[0][1]) / (r3[empty][5] - r3[0][5])).toFixed(1) : null,
    vitesseApres: after.length > 5 ? +((after.at(-1)[1] - after[0][1]) / (after.at(-1)[5] - after[0][5])).toFixed(1) : null,
  };
  // Maj tenue, endurance nulle, à l'arrêt : l'endurance revient-elle ?
  await page.keyboard.down('Shift'); const r4 = await trace(3000); await page.keyboard.up('Shift');
  out.majArretVide = { enduranceDebut: r4[0][2], enduranceFin: r4.at(-1)[2], court: r4.some(r => r[3]) };
  await page.screenshot({ path: `${OUT}/course-vide.png` });
}

// ── 4. Dix clics en une seconde
{
  await K(page, 'teleport', 'barque'); await sleep(3000);
  const n0 = await page.evaluate(() => window.__kingvi.events.length);
  const rowsP = trace(3500);
  for (let i = 0; i < 10; i++) { await clickNear(20, -3); await sleep(100); }
  const rows = await rowsP;
  const ev = await page.evaluate(n => window.__kingvi.events.slice(n), n0);
  const frappes = ev.filter(e => e.type === 'frappe');
  const s = await S(page);
  // après : marcher marche-t-il ?
  await page.keyboard.down('KeyD'); await sleep(1500); await page.keyboard.up('KeyD');
  const s2 = await S(page);
  out.dixClics = { frappes: frappes.length, tempsFrappes: frappes.map(e => e.jeu), essouffle: ev.filter(e => e.type === 'essouffle').length,
    enduranceMin: Math.min(...rows.map(r => r[2])), attaqueApres: s.attaque, marcheApres: +(s2.x - s.x).toFixed(1),
    attaqueContinue_ms: (() => { let best = 0, run = 0, prev = null; for (const r of rows) { if (r[4]) { run += prev ? r[0] - prev : 0; best = Math.max(best, run); } else run = 0; prev = r[0]; } return best; })() };
}
// Dix clics sur la falaise (le coup qui rebondit : anims.stop + delayedCall)
{
  await K(page, 'teleport', 'falaise'); await sleep(2500);
  await page.keyboard.down('KeyW'); await sleep(6000); await page.keyboard.up('KeyW');
  const s0 = await S(page);
  const n0 = await page.evaluate(() => window.__kingvi.events.length);
  for (let i = 0; i < 10; i++) { await clickNear(0, -14); await sleep(100); }
  await sleep(1500);
  const ev = await page.evaluate(n => window.__kingvi.events.slice(n), n0);
  const s = await S(page);
  await page.keyboard.down('KeyD'); await sleep(1500); await page.keyboard.up('KeyD');
  const s2 = await S(page);
  out.dixClicsFalaise = { pos: [s0.x, s0.y], frappes: ev.filter(e => e.type === 'frappe').length, cibles: ev.filter(e => e.type === 'coup-donne').map(e => e.cible), attaqueApres: s.attaque, marcheApres: +(s2.x - s.x).toFixed(1) };
  await page.screenshot({ path: `${OUT}/clics-falaise.png` });
}
out.erreurs = errors;
out.derniereErreur = await page.evaluate(() => localStorage.getItem('kingvi:lastError'));
console.log(JSON.stringify(out, null, 1));
await close();
