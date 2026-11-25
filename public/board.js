// Zeichnet das Brett als SVG aus config/board.json und animiert die Figuren.
window.BoardView = function (svg, board) {
  const NS = 'http://www.w3.org/2000/svg', c = board.colors, R = board.fieldRadius || 17, PR = board.pawnRadius || 12;
  const el = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; };
  svg.setAttribute('viewBox', `0 0 ${board.width} ${board.height}`);
  svg.innerHTML = '';
  el('rect', { x: 0, y: 0, width: board.width, height: board.height, fill: c.boardBg, rx: 14 });
  const F = board.fields;
  const debug = /[?&]debug=1/.test(location.search);
  if (board.background) el('image', { href: board.background, x: 0, y: 0, width: board.width, height: board.height, preserveAspectRatio: 'none' });
  if (board.drawFields !== false) {
    // Prototyp-Zeichnung (nur ohne Brettgrafik)
    for (let i = 1; i < F.length; i++) { const s = (board.sectors || [])[F[i].sector] || {}; el('line', { x1: F[i - 1].x, y1: F[i - 1].y, x2: F[i].x, y2: F[i].y, stroke: s.color || c.track, 'stroke-width': R * 3.2, 'stroke-linecap': 'round' }); }
    const title = el('text', { x: board.width / 2, y: 58, 'text-anchor': 'middle', 'font-size': 34, 'font-weight': 700, fill: c.text }); title.textContent = board.title;
    const icon = { aktion: '!', frage: '?', start: '▶', ziel: '★', rutsche: '↩', finanzpolizei: '6' };
    F.forEach(f => {
      const big = f.type === 'start' || f.type === 'ziel';
      el('circle', { cx: f.x, cy: f.y, r: big ? R * 1.45 : R, fill: c[f.type] || c.normal, stroke: '#00000055', 'stroke-width': 1.5 });
      const t = el('text', { x: f.x, y: f.y + 5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: f.type === 'normal' ? c.text : '#fff' }); t.textContent = big ? f.label : (icon[f.type] || f.id);
    });
  }
  if (debug) F.forEach(f => { el('circle', { cx: f.x, cy: f.y, r: 3, fill: 'red' }); const t = el('text', { x: f.x + 4, y: f.y - 4, 'font-size': 7, fill: 'red' }); t.textContent = f.id; });
  const pawnLayer = el('g', {});
  const pawns = {}; let shown = {};
  function place(players) {
    const byField = {}; players.forEach(p => { const pos = shown[p.id] ?? p.pos; (byField[pos] = byField[pos] || []).push(p); });
    players.forEach(p => {
      let g = pawns[p.id];
      if (!g) { g = pawns[p.id] = el('g', { class: 'pawn' }, pawnLayer); el('circle', { r: PR, 'stroke-width': PR * 0.22, stroke: '#fff' }, g); const t = el('text', { 'text-anchor': 'middle', y: PR * 0.36, 'font-size': PR * 0.95, 'font-weight': 700 }, g); }
      const pos = shown[p.id] ?? p.pos, list = byField[pos], k = list.indexOf(p), n = list.length, f = F[pos];
      const ang = k * 2.4, rad = n > 1 ? PR * (0.75 + 0.5 * Math.sqrt(k)) : 0;
      g.setAttribute('transform', `translate(${f.x + Math.cos(ang) * rad},${f.y + Math.sin(ang) * rad})`);
      g.firstChild.setAttribute('fill', p.color); g.lastChild.textContent = p.name.slice(0, 2).toUpperCase();
      g.lastChild.setAttribute('fill', lum(p.color) > 0.6 ? '#000' : '#fff');
      g.style.opacity = p.connected ? 1 : 0.45;
    });
    Object.keys(pawns).forEach(id => { if (!players.some(p => p.id === id)) { pawns[id].remove(); delete pawns[id]; } });
  }
  function lum(h) { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }
  let anim = null;
  return {
    update(players, stepMs, activeId) {
      players.forEach(p => { if (shown[p.id] === undefined) shown[p.id] = p.pos; });
      clearInterval(anim);
      anim = setInterval(() => {
        let moving = false;
        players.forEach(p => { if (shown[p.id] !== p.pos) { shown[p.id] += Math.sign(p.pos - shown[p.id]); moving = true; } });
        place(players); if (!moving) clearInterval(anim);
      }, stepMs || 250);
      place(players);
      Object.entries(pawns).forEach(([id, g]) => g.classList.toggle('active', id === activeId));
    }
  };
};
