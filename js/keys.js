/* Le clavier (convention du design system) : se déplacer par la touche
   physique (`e.code` : ZQSD en AZERTY, WASD en QWERTY) ; une commande par sa
   lettre (`e.key` : M ouvre la carte là où l'on lit M). Repli sur la touche
   physique quand la lettre n'est pas latine. */
export const keyIs = (e, letter) => !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat
  && (/^[a-z]$/i.test(e.key) ? e.key.toLowerCase() === letter : e.code === `Key${letter.toUpperCase()}`);

// Firefox cherche dans la page dès qu'on tape une lettre (« recherche
// automatique », touches ' et / aussi) : hors des champs de saisie, une touche
// imprimable ne va pas au navigateur
export function stopTypeahead(target = window) {
  target.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    const t = e.target;
    if (t.closest?.('input, textarea, select, [contenteditable]')) return;
    if (e.key === ' ' && t.closest?.('button, a, summary')) return;
    e.preventDefault();
  });
}
