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
  // Gedruckte Kartenzahlen auf der Brettgrafik durch die aktuelle Stapelgröße ersetzen
  const countEls = (board.background && board.countLabels || []).map(l => { el('rect', { x: l.x - 0.6, y: l.y - 0.3, width: l.w + 1.2, height: l.h + 0.6, fill: l.bg, rx: 0.8 }); const t = el('text', { x: l.x + l.w / 2, y: l.y + l.h * 0.84, 'text-anchor': 'middle', 'font-size': l.size, fill: l.color, 'font-family': "'Comic Sans MS','Comic Neue','Patrick Hand',cursive", class: 'countlabel' }); t.dataset.kind = l.kind; return t; });
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
  // ---------- Finanzpolizei-Gefaengnis neben jedem FP-Feld ----------
  const JAIL = {};
  F.forEach((f, i) => {
    if (f.type !== 'finanzpolizei') return;
    if (f.jail) { JAIL[i] = f.jail; return; }
    let best = null, bestD = -1;
    for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8, x = f.x + Math.cos(a) * 36, y = f.y + Math.sin(a) * 30;
      if (x < 22 || x > board.width - 22 || y < 36 || y > board.height - 12) continue;
      const d = Math.min(...F.map(g => Math.hypot(g.x - x, g.y - y)));
      if (d > bestD) { bestD = d; best = { x, y }; }
    }
    JAIL[i] = best || { x: f.x, y: f.y - 30 };
  });
  const jailBack = el('g', { class: 'jails' });
  for (const i in JAIL) {
    const { x, y } = JAIL[i], g = el('g', { class: 'jail-cell', transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, jailBack);
    el('line', { x1: 0, y1: 0, x2: (F[i].x - x) * 0.62, y2: (F[i].y - y) * 0.62, class: 'jail-path' }, g);
    el('ellipse', { cx: 0, cy: 3, rx: 17, ry: 5, fill: '#0002' }, g);
    el('path', { d: 'M-15 3 L-15 -24 Q0 -34 15 -24 L15 3 Z', class: 'jail-wall' }, g);
    el('rect', { x: -9, y: -36, width: 18, height: 6.5, rx: 2, class: 'jail-sign' }, g);
    const t = el('text', { x: 0, y: -31.2, 'text-anchor': 'middle', class: 'jail-text' }, g); t.textContent = 'FINANZ-POLIZEI';
    el('circle', { cx: 0, cy: -38.5, r: 2.2, class: 'jail-light' }, g);
  }
  // ---------- Figuren ----------
  const pawnLayer = el('g', { class: 'pawns' });
  const jailFront = el('g', { class: 'jails-front', 'pointer-events': 'none' });
  for (const i in JAIL) {
    const { x, y } = JAIL[i], g = el('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, jailFront);
    for (let bx = -12; bx <= 12; bx += 4.8) el('line', { x1: bx, y1: 3, x2: bx, y2: bx * bx > 100 ? -23 : -27, class: 'jail-bar' }, g);
    el('line', { x1: -15, y1: -12, x2: 15, y2: -12, class: 'jail-bar' }, g);
  }
  const S = 0.29 * (board.pawnScale || 1);         // Figur ca. 29 mm hoch
  const pawns = {};                                 // id -> {g, inner, pos, x, y, queue, anim}
  const LAY = { 2: [[-10, 0], [10, 5]], 3: [[-16, 0], [0, 7], [16, 0]], 4: [[-15, -4], [15, -4], [-7, 8], [7, 8]] };
  const OFF = [[0, 0], [-9, 3], [9, 3], [-5, -7], [5, -7], [-13, -5], [13, -5], [0, 8], [-14, 9], [14, 9]];
  function offset(k) { if (k < OFF.length) return OFF[k]; const a = k * 2.4, r = 8 + k * 0.9; return [Math.cos(a) * r, Math.sin(a) * r * 0.6]; }
  const tgt = p => pawns[p.id] ? pawns[p.id].target : p.pos, inJ = p => !!(pawns[p.id] ? pawns[p.id].jt : p.jail) && !!JAIL[tgt(p)];
  function restXY(pos, players, id) {
    const me = players.find(p => p.id === id), j = me ? inJ(me) : false;
    const here = players.filter(p => tgt(p) === pos && inJ(p) === j);
    const k = Math.max(0, here.findIndex(p => p.id === id));
    if (j) { const J = JAIL[pos], o = here.length < 2 ? 0 : (k - (here.length - 1) / 2) * 7; return [J.x + o, J.y - 1 + (k % 2) * 2]; }
    const o = here.length < 2 ? [0, 0] : LAY[here.length] ? LAY[here.length][k] : offset(k);
    return [F[pos].x + o[0], F[pos].y + o[1]];
  }
  function make(p) {
    const g = el('g', { class: 'pawn', style: `--d:${(-Math.random() * 7).toFixed(2)}s` }, pawnLayer);
    el('ellipse', { class: 'ring', cx: 0, cy: 0, rx: 10, ry: 3.6 }, g);
    el('ellipse', { cx: 0, cy: 0.4, rx: 6.5, ry: 2, fill: '#0004' }, g);
    const bob = el('g', { class: 'bob', style: `animation-delay:${-Math.random() * 2}s` }, g);
    const inner = el('g', { transform: `scale(${S})` }, bob);
    const siren = el('g', { class: 'siren', transform: `translate(0,${-118 * S})` }, bob);
    el('ellipse', { class: 'halo', cx: 0, cy: 0, rx: 14, ry: 9 }, siren); el('rect', { x: -7.5, y: 1.2, width: 15, height: 3, rx: 1.2, fill: '#222a3a' }, siren);
    el('circle', { class: 'sb', cx: -3.6, cy: 0, r: 3.2 }, siren); el('circle', { class: 'sr', cx: 3.6, cy: 0, r: 3.2 }, siren);
    const cuffs = el('g', { class: 'cuffs', transform: 'translate(0,-8)' }, g);
    el('circle', { cx: -2.6, cy: 0, r: 2.1 }, cuffs); el('circle', { cx: 2.6, cy: 0, r: 2.1 }, cuffs); el('path', { d: 'M-0.6 0 h1.2' }, cuffs);
    const name = el('text', { class: 'pname', x: 0, y: 9.6, 'text-anchor': 'middle' }, g);
    return { g, bob, inner, name, pos: p.pos, target: p.pos, jt: !!p.jail, x: F[p.pos].x, y: F[p.pos].y, queue: [], anim: null, fig: null, col: null };
  }
  let raf = null, stepMs = 260;
  function setXY(P, x, y, lift, rot) { P.x = x; P.y = y; P.g.setAttribute('transform', `translate(${x.toFixed(2)},${(y - (lift || 0)).toFixed(2)})${rot ? ` rotate(${rot.toFixed(1)})` : ''}`); }
  function tick(now) {
    let busy = false;
    for (const P of Object.values(pawns)) {
      if (!P.anim && P.queue.length) { const s = P.queue.shift(); P.anim = Object.assign(s, { t0: now, x0: P.x, y0: P.y }); if (s.onStart) s.onStart(); }
      const A = P.anim; P.g.classList.toggle('hopping', !!A && A.kind === 'hop' && A.dur > 150 && P.queue.length + 1 > 0 && A.big !== false); if (!A) continue; busy = true;
      const t = Math.min(1, (now - A.t0) / A.dur);
      if (A.kind === 'hop') { const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; setXY(P, A.x0 + (A.x - A.x0) * e, A.y0 + (A.y - A.y0) * e, Math.sin(Math.PI * t) * 7, 0); }
      else if (A.kind === 'slide') { const e = t * t * (3 - 2 * t); setXY(P, A.x0 + (A.x - A.x0) * e, A.y0 + (A.y - A.y0) * e, Math.sin(Math.PI * t) * 2, Math.sin(Math.PI * t) * (A.x < A.x0 ? -18 : 18)); }
      else if (A.kind === 'walk') { const e = t * t * (3 - 2 * t); setXY(P, A.x0 + (A.x - A.x0) * e, A.y0 + (A.y - A.y0) * e, Math.abs(Math.sin(Math.PI * t * 5)) * 1.6, Math.sin(Math.PI * t * 5) * 4); }
      else setXY(P, A.x, A.y, 0, 0);
      if (t >= 1) { setXY(P, A.x, A.y, 0, 0); P.anim = null; if (A.onEnd) A.onEnd(); }
    }
    if (busy) { depthSort(); raf = requestAnimationFrame(tick); } else { raf = null; P_moving.clear(); }
  }
  const P_moving = new Set();
  function depthSort() { Object.values(pawns).sort((a, b) => a.y - b.y).forEach(P => pawnLayer.appendChild(P.g)); }
  function run() { if (!raf) raf = requestAnimationFrame(tick); }
  function setCounts(c) { if (!c) return; countEls.forEach(t => { const v = String(c[t.dataset.kind] ?? ''); if (t.textContent !== v) t.textContent = v; }); }
  return {
    setCounts,
    // lastMove: {playerId, kind:'slide'|'walk', from, to, seq}
    update(players, opts) {
      opts = opts || {}; stepMs = opts.stepMs || stepMs;
      for (const p of players) {
        let P = pawns[p.id]; if (!P) { P = pawns[p.id] = make(p); const [x, y] = restXY(p.pos, players, p.id); setXY(P, x, y); P.g.classList.toggle('cuffed', P.jt && !!JAIL[p.pos]); }
        if (P.fig !== p.figure || P.col !== p.color) { P.inner.innerHTML = Figuren.svg(p.figure || 'klassik', p.color); P.fig = p.figure; P.col = p.color; }
        P.name.textContent = p.name;
        P.g.classList.toggle('active', p.id === opts.activeId); P.g.classList.toggle('jail', !!p.jail); P.g.classList.toggle('off', !p.connected);
        const jt = !!p.jail;
        if (p.pos !== P.target || jt !== P.jt) {
          const from = P.target, to = p.pos, wasJ = P.jt && !!JAIL[from]; P.target = to; P.jt = jt; P_moving.add(p.id);
          const lm = opts.lastMove;
          if (wasJ && (!jt || to !== from)) P.queue.push({ kind: 'walk', x: F[from].x, y: F[from].y, dur: 700, onStart: () => { P.g.classList.remove('cuffed'); opts.onRelease && opts.onRelease(p); } });
          if (to === from) { /* nur Gefaengnis-Wechsel */ }
          else if (lm && lm.playerId === p.id && lm.kind === 'slide' && lm.to === to) {
            P.queue.push({ kind: 'slide', x: F[to].x, y: F[to].y, dur: 1300, onStart: () => opts.onSlide && opts.onSlide(p) });
          } else {
            const dir = Math.sign(to - from), n = Math.abs(to - from), d = Math.max(120, Math.min(stepMs, 4000 / n));
            for (let i = from + dir; dir > 0 ? i <= to : i >= to; i += dir) { const f = F[i]; P.queue.push({ kind: 'hop', x: f.x, y: f.y, dur: d, onEnd: () => opts.onHop && opts.onHop(p) }); }
          }
          if (jt && JAIL[to]) P.queue.push({ kind: 'walk', x: JAIL[to].x, y: JAIL[to].y, dur: 1300, onStart: () => { P.g.classList.add('cuffed'); opts.onArrest && opts.onArrest(p); } });
          P.queue.push({ kind: 'settle', dur: 1, get x() { return restXY(to, players, p.id)[0]; }, get y() { return restXY(to, players, p.id)[1]; } });
        }
      }
      for (const id of Object.keys(pawns)) if (!players.some(p => p.id === id)) { pawns[id].g.remove(); delete pawns[id]; }
      // ruhende Figuren auf Versatz bringen (z. B. wenn eine zweite Figur dazukommt)
      for (const p of players) { const P = pawns[p.id]; if (!P.anim && !P.queue.length) { const [x, y] = restXY(P.target, players, p.id); if (Math.hypot(x - P.x, y - P.y) > 0.5) P.queue.push({ kind: 'hop', x, y, dur: 220, big: false }); } }
      depthSort(); run();
    },
    moving: () => Object.values(pawns).some(P => P.anim || P.queue.length),
    fieldXY: i => [F[i].x, F[i].y],
    jailXY: i => JAIL[i] ? [JAIL[i].x, JAIL[i].y] : null
  };
};
