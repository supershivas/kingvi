/* L'atelier, onglet Nombres (v1.63.0) : régler les nombres du jeu (tuning.js).
   Chaque valeur s'enregistre en bougeant le curseur (`kingvi:tuning`) ; le jeu
   ouvert dans un autre onglet la prend aussitôt ; « Publier pour tous »
   l'envoie dans `assets/design/tuning.json`. */
import { readTuning, writeTuning, tuningDepotGet, tuningOverrides, designsReady } from './design-store.js?v=1.65.0';
import { TUNING_DEFS, TUNING_GROUPS } from './tuning.js?v=1.65.0';

const fmt = (v, step) => (step < 1 ? v.toFixed(String(step).split('.')[1].length) : String(Math.round(v))).replace('.', ',');

export async function mountTuning(host, { onChange = () => {}, onPublish = null } = {}) {
  await designsReady;
  host.innerHTML = `
    <div class="at">
      <div class="at-bar">
        <p class="design-note">Chaque nombre s'enregistre en bougeant le curseur ; le jeu ouvert dans un autre onglet le prend aussitôt (sauf le nombre de loups : au prochain lancement).</p>
        <span class="dz-spacer"></span>
        <button type="button" class="design-btn primary" data-publish-tuning><i class="ti ti-cloud-upload" aria-hidden="true"></i> Publier pour tous</button>
      </div>
      <div class="tu-groups"></div>
    </div>`;
  const wrap = host.querySelector('.tu-groups');
  function store(key, value, def) {
    const mine = readTuning(), depot = tuningDepotGet();
    if (value === def) { if (depot[key] != null) mine[key] = null; else delete mine[key]; } else mine[key] = value;
    writeTuning(mine);
    onChange();
  }
  for (const [gid, gtitle] of TUNING_GROUPS) {
    const sec = document.createElement('section');
    sec.className = 'at-section tu-group';
    sec.innerHTML = '<h3></h3>';
    sec.querySelector('h3').textContent = gtitle;
    for (const [key, group, label, def, min, max, step, unit, about] of TUNING_DEFS) {
      if (group !== gid) continue;
      const row = document.createElement('div');
      row.className = 'tu-row';
      row.innerHTML = `
        <div class="tu-head"><b></b><span class="tu-val"></span><button type="button" class="design-btn quiet" data-reset>Défaut</button></div>
        <input type="range" min="${min}" max="${max}" step="${step}" aria-label="">
        <p class="at-orig"></p>`;
      row.querySelector('b').textContent = label;
      row.querySelector('input').setAttribute('aria-label', label);
      row.querySelector('.at-orig').textContent = `${about} Défaut : ${fmt(def, step)}${unit ? ` ${unit}` : ''}.`;
      const input = row.querySelector('input'), val = row.querySelector('.tu-val'), reset = row.querySelector('[data-reset]');
      const show = v => { val.textContent = `${fmt(v, step)}${unit ? ` ${unit}` : ''}`; row.classList.toggle('changed', v !== def); reset.hidden = v === def; };
      const cur = tuningOverrides()[key] ?? def;
      input.value = cur; show(+input.value);
      let t = 0;
      input.addEventListener('input', () => { show(+input.value); clearTimeout(t); t = setTimeout(() => store(key, +input.value, def), 200); });
      reset.addEventListener('click', () => { input.value = def; show(def); store(key, def, def); });
      sec.append(row);
    }
    wrap.append(sec);
  }
  host.querySelector('[data-publish-tuning]').addEventListener('click', () => onPublish?.());
}
