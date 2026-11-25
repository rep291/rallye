// Rendert eine Fragekarte (gleich fuer Druck und Beamer) und passt die Schrift an die Kartengroesse an.
window.Fragekarte = {
  html(card, o) {
    o = o || {}; const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const nr = card.nr ?? String(card.id || '').replace(/\D/g, '').replace(/^0+/, '');
    return `<div class="fk"><div class="fk-frame"></div><div class="fk-q">?</div><div class="fk-nr">${esc(nr)}</div><div class="fk-body"><div class="fk-text">${esc(card.question)}</div><div class="fk-ans">${(card.answers || []).map((a, i) => `<div class="fk-a ${o.chosen === i ? 'chosen' : ''} ${o.right === i ? 'right' : ''}"><b>${String.fromCharCode(97 + i)})</b>${esc(a)}</div>`).join('')}</div></div></div>`;
  },
  htmlAction(card) {
    const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    return `<div class="fk fk-aktion" data-max="3.6"><div class="fk-frame"></div><div class="fk-q">!</div><div class="fk-nr">${esc(card.nr ?? '')}</div><div class="fk-body"><div class="fk-text">${esc(card.text)}</div><div class="fk-eff">${esc(card.effectLabel || card.effect || '')}</div></div></div>`;
  },
  fit(root) {
    (root.classList && root.classList.contains('fk') ? [root] : root.querySelectorAll('.fk')).forEach(fk => {
      const b = fk.querySelector('.fk-body'); let s = +(fk.dataset.max || 3.0); b.style.fontSize = s + 'mm';
      while (b.scrollHeight > b.clientHeight + 0.5 && s > 2.2) { s -= 0.05; b.style.fontSize = s.toFixed(2) + 'mm'; }
    });
  }
};
