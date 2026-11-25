// Brettspiel Arbeitswelt – Mehrspieler-Server (offline im Kurs-WLAN)
const path = require('path'), fs = require('fs'), os = require('os'), http = require('http'), crypto = require('crypto');
const express = require('express');
const { Server } = require('socket.io');
const QRCode = require('qrcode');

const BASE = process.pkg ? path.dirname(process.execPath) : __dirname;
const PORT = +(process.env.PORT || 3000);
// Online-Betrieb (Render, Tunnel ...): PUBLIC_URL = oeffentliche Adresse fuer QR-Code; HOST_PIN = PIN fuer die Spielleitung
const PUBLIC_URL = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, '');
const ONLINE = !!(PUBLIC_URL || process.env.ONLINE || process.env.RENDER || process.env.HOST_PIN);
const HOST_PIN = String(process.env.HOST_PIN || crypto.randomInt(100000, 1000000));
const readJSON = f => JSON.parse(fs.readFileSync(path.join(BASE, 'config', f), 'utf8'));
let board = readJSON('board.json'), cards = readJSON('cards.json');
const R = () => applySettings(Object.assign({ diceMs: 900, slideMs: 1500 }, board.rules, process.env.FAST ? { stepMs: 5, cardDisplayMs: 40, resultDisplayMs: 40, infoDisplayMs: 40, diceMs: 5, slideMs: 5 } : process.env.TIMING ? (([a, b, c]) => ({ stepMs: +a, cardDisplayMs: +b, resultDisplayMs: +c }))(process.env.TIMING.split(',')) : {}));
// Einstellungen der Spielleitung je Raum (Host-Panel) ueberschreiben die Regeln aus board.json
const DEFAULT_SETTINGS = { fpMaxTries: null, finishExact: null, actionCards: true, questionCards: true, turnTimeSec: 0, gameTimeMin: 0, packs: [], questionTimeSec: null, judgeRange: 5, quickRight: 2, quickWrong: 0 };
function applySettings(r) {
  const st = ROOM && ROOM.settings; r.decks = { action: true, question: true }; r.turnTimeSec = 0; r.judgeRange = 5; r.quickRight = 2; r.quickWrong = 0;
  if (!st) return r;
  if (st.fpMaxTries != null) r.finanzpolizei = Object.assign({}, r.finanzpolizei, { maxTries: st.fpMaxTries });
  if (st.finishExact != null) r.finishExact = st.finishExact;
  if (st.questionTimeSec != null) r.questionTimeSec = st.questionTimeSec;
  r.decks = { action: st.actionCards !== false, question: st.questionCards !== false };
  r.turnTimeSec = st.turnTimeSec || 0; r.gameTimeMin = st.gameTimeMin || 0; r.judgeRange = st.judgeRange || 5; r.quickRight = st.quickRight; r.quickWrong = st.quickWrong;
  return r;
}
function cleanSettings(cur, d) {
  const o = Object.assign({}, cur), int = (v, a, b) => Math.max(a, Math.min(b, Math.round(+v || 0)));
  if ('fpMaxTries' in d) o.fpMaxTries = d.fpMaxTries === null || d.fpMaxTries === '' ? null : int(d.fpMaxTries, 0, 20);
  if ('finishExact' in d) o.finishExact = d.finishExact === null ? null : !!d.finishExact;
  if ('actionCards' in d) o.actionCards = !!d.actionCards;
  if ('questionCards' in d) o.questionCards = !!d.questionCards;
  if ('turnTimeSec' in d) { const t = int(d.turnTimeSec, 0, 600); o.turnTimeSec = t && t < 10 ? 10 : t; }
  if ('gameTimeMin' in d) o.gameTimeMin = Math.max(0, Math.min(240, +d.gameTimeMin || 0));
  if ('packs' in d && G && G.phase === 'lobby' && Array.isArray(d.packs)) o.packs = d.packs.filter(x => (cards.packs || []).some(p => p.id === x));
  if ('questionTimeSec' in d) o.questionTimeSec = d.questionTimeSec === null ? null : int(d.questionTimeSec, 0, 600);
  if ('judgeRange' in d) o.judgeRange = int(d.judgeRange, 1, 5);
  if ('quickRight' in d) o.quickRight = int(d.quickRight, -5, 5);
  if ('quickWrong' in d) o.quickWrong = int(d.quickWrong, -5, 5);
  o.quickRight = Math.max(-o.judgeRange, Math.min(o.judgeRange, o.quickRight)); o.quickWrong = Math.max(-o.judgeRange, Math.min(o.judgeRange, o.quickWrong));
  return o;
}
const LAST = () => board.fields.length - 1;

// Berufsfiguren: Liste aus assets/figuren/figuren.json (Sprites aus tools/figuren_blender.py)
const FIGURES = (() => { try { return JSON.parse(fs.readFileSync(path.join(BASE, 'assets', 'figuren', 'figuren.json'), 'utf8')).map(f => f.id); } catch { return ['mechanik', 'koch', 'friseur', 'it', 'garten', 'labor', 'lager', 'tischler']; } })();
const freeFigures = (exceptId) => !G ? FIGURES : FIGURES.filter(f => !G.players.some(p => p.figure === f && p.id !== exceptId));
const PALETTE = ['#e6194b','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#42d4f4','#f032e6','#bfef45','#fabed4','#469990','#dcbeff','#9a6324','#fffac8','#800000','#aaffc3','#808000','#ffd8b1','#000075','#a9a9a9','#ff6f61','#2f4f4f','#7fffd4','#ff1493','#1e90ff','#ffa500','#8b4513','#00ced1','#9acd32','#ba55d3'];

function lanIPs() {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) for (const a of list || []) {
    if (a.family !== 'IPv4' && a.family !== 4) continue; if (a.internal) continue;
    const virt = /vEthernet|VirtualBox|VMware|WSL|docker|br-|veth|Hyper-V|Loopback/i.test(name);
    const priv = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address);
    out.push({ name, address: a.address, score: (virt ? 0 : 2) + (priv ? 1 : 0) + (/^192\.168\./.test(a.address) ? 1 : 0) });
  }
  return out.sort((a, b) => b.score - a.score);
}

const deckCards = kind => { const all = cards[kind] || [], selected = ROOM && ROOM.settings.packs || []; return !selected.length ? all : all.filter(c => (c.tags || []).some(t => selected.includes(t))); };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// ---------- Raeume: jede Spielleitung hat ihre eigene Lobby (Raumcode + QR + eigener Spielstand) ----------
let G, ROOM = null;                       // aktueller Raum-Kontext (wird vor jeder Aktion gesetzt)
const rooms = new Map();                  // code -> { code, hostToken, G, settings, createdAt, lastActive }
const use = room => { ROOM = room || null; G = room ? room.G : null; return room; };
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode() { for (;;) { let c = ''; for (let i = 0; i < 4; i++) c += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]; if (!rooms.has(c)) return c; } }
function createRoom() {
  const room = { code: newCode(), hostToken: crypto.randomBytes(16).toString('hex'), settings: Object.assign({}, DEFAULT_SETTINGS), createdAt: Date.now(), lastActive: Date.now(), G: null };
  rooms.set(room.code, room); use(room); G = null; newGame(false); log('Lobby eröffnet.'); return room;
}
function newGame(keepPlayers) {
  const players = keepPlayers && G ? G.players.map(p => Object.assign(p, { pos: 0, skip: 0, jail: false, jailTries: 0, extra: false })) : [];
  const old = G;
  G = { phase: 'lobby', players, turn: 0, pending: null, busy: false, paused: false, history: [], gameDeadline: null, gameRemaining: 0, winner: null, lastRoll: null, log: [], decks: { action: shuffle(deckCards('action')), question: shuffle(deckCards('question')) }, seq: old ? old.seq + 1 : 0, epoch: old ? (old.epoch || 0) + 1 : 0 };
  if (ROOM) ROOM.G = G;
  if (process.env.QFIRST) { const q = G.decks.question, i = q.findIndex(c => c.id === process.env.QFIRST); if (i >= 0) q.push(q.splice(i, 1)[0]); } // nur fuer Tests
}
// Stapel: beliebig viele Karten; leerer Stapel wird neu gemischt, ganz ohne Karten gibt es keine
function draw(kind) { if (!G.decks[kind].length) G.decks[kind] = shuffle(deckCards(kind)); return G.decks[kind].pop() || null; }
function log(msg) { G.log.unshift({ t: Date.now(), msg }); G.log = G.log.slice(0, 40); }
const cur = () => G.players[G.turn];
function effectText(e) {
  if (!e) return '';
  switch (e.type) {
    case 'move': return e.steps > 0 ? `${e.steps} Feld${e.steps > 1 ? 'er' : ''} vor` : e.steps < 0 ? `${-e.steps} Feld${e.steps < -1 ? 'er' : ''} zurück` : 'Keine Bewegung';
    case 'moveTo': return `Weiter auf Feld ${e.field}`;
    case 'skip': return `${e.turns || 1}x aussetzen`;
    case 'extraTurn': return 'Noch einmal würfeln';
    case 'toStart': return 'Zurück zum Start';
    default: return 'Keine Wirkung';
  }
}
function publicState(viewer) {
  const r = R(), pd = G.pending, isActive = pd && viewer && viewer.data.pid === pd.playerId;
  const voter = viewer && (viewer.data.memberToken || (G.players.find(p => p.id === viewer.data.pid) || {}).token);
  return {
    packs: cards.packs || [], history: G.history || [], gameDeadline: G.gameDeadline || null, gameRemaining: G.gameRemaining || 0,
    room: ROOM ? { code: ROOM.code, settings: ROOM.settings } : null, paused: !!G.paused, turnDeadline: G.turnDeadline || null, judgeRange: r.judgeRange, quickRight: r.quickRight, quickWrong: r.quickWrong,
    cardCount: { action: (cards.action || []).length, question: (cards.question || []).length }, deckSize: { action: r.decks && r.decks.action === false ? 0 : deckCards('action').length, question: r.decks && r.decks.question === false ? 0 : deckCards('question').length }, decksOn: r.decks,
    phase: G.phase, turn: G.turn, seq: G.seq, stepMs: r.stepMs, lastRoll: G.lastRoll, winner: G.winner, log: G.log.slice(0, 8), busy: G.busy,
    teams: r.teams && r.teams.enabled ? r.teams.list : null, questionMode: r.questionMode,
    lastMove: G.lastMove || null, players: G.players.map(p => ({ id: p.id, name: p.name, color: p.color, figure: p.figure, team: p.team, isTeam: !!p.isTeam, members: (p.members || []).map(m => ({ name: m.name, connected: m.connected })), pos: p.pos, skip: p.skip, jail: !!p.jail, connected: p.connected })), need: (r.finanzpolizei || {}).need || 6, last: LAST(),
    pending: G.pending && {
      type: G.pending.type, playerId: G.pending.playerId, resolved: G.pending.resolved, result: G.pending.result, delta: G.pending.delta, answer: G.pending.type === 'question' && G.pending.stage !== 'reveal' && !G.pending.resolved && !isActive ? null : G.pending.answer, answerLocked: G.pending.stage && G.pending.stage !== 'personal', stage: G.pending.stage, vote: voter && G.pending.votes ? (G.pending.votes[voter] ?? null) : null, canVote: !!(voter && G.pending.eligible && G.pending.eligible.includes(voter)), groupTotal: G.pending.eligible ? G.pending.eligible.length : 0, groupVoted: G.pending.votes ? Object.keys(G.pending.votes).length : 0, groupCounts: G.pending.stage === 'reveal' || G.pending.resolved ? voteCounts(G.pending) : null, deadline: G.pending.deadline,
      kind: G.pending.kind, text: G.pending.text,
      card: G.pending.type === 'info' ? null : G.pending.type === 'question'
        ? { id: G.pending.card.id, title: G.pending.card.title, question: G.pending.card.question, answers: G.pending.card.answers, correct: G.pending.resolved && Number.isInteger(G.pending.card.correct) ? G.pending.card.correct : null, hostDecides: !Number.isInteger(G.pending.card.correct) || R().questionMode !== 'auto', nr: G.pending.card.nr, onCorrect: effectText(G.pending.card.onCorrect), onWrong: effectText(G.pending.card.onWrong) }
        : { id: G.pending.card.id, nr: G.pending.card.nr, title: G.pending.card.title, text: G.pending.card.text, effectLabel: G.pending.card.effectLabel || effectText(G.pending.card.effect), effect: effectText(G.pending.card.effect) }
    },
    freeColors: PALETTE.filter(c => !G.players.some(p => p.color === c)), freeFigures: freeFigures()
  };
}
const broadcast = () => { if (!ROOM) return; G.seq++; ROOM.lastActive = Date.now(); for (const sk of io.sockets.sockets.values()) if (sk.data.room === ROOM.code) sk.emit('state', publicState(sk)); saveSoon(); };
// ---------- Spielstand sichern (Server-Neustart); Host-Neuladen braucht das nicht, der Stand liegt am Server ----------
const SAVE_FILE = process.env.STATE_FILE || path.join(BASE, 'state', 'spielstand.json');
let saveTimer = null;
function saveSoon() {
  if (process.env.NO_SAVE || saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(path.dirname(SAVE_FILE), { recursive: true });
      const data = { v: 2, savedAt: Date.now(), rooms: [...rooms.values()].map(room => { const g = room.G; return { code: room.code, hostToken: room.hostToken, settings: room.settings, createdAt: room.createdAt, lastActive: room.lastActive,
        phase: g.phase, turn: g.turn, winner: g.winner, lastRoll: g.lastRoll, log: g.log, seq: g.seq, paused: !!g.paused, history: g.history || [], gameRemaining: g.gameDeadline ? Math.max(0, g.gameDeadline - Date.now()) : g.gameRemaining || 0, inTurn: !!(g.pending || g.busy),
        players: g.players.map(p => ({ id: p.id, token: p.token, name: p.name, color: p.color, figure: p.figure, team: p.team, isTeam: !!p.isTeam, members: (p.members || []).map(m => ({ name: m.name, connected: m.connected })), pos: p.pos, skip: p.skip, jail: !!p.jail, jailTries: p.jailTries || 0, extra: !!p.extra, isTeam: !!p.isTeam, members: (p.members || []).map(m => ({ name: m.name, token: m.token })) })),
        decks: { action: g.decks.action.map(c => c.id), question: g.decks.question.map(c => c.id) } }; }) };
      fs.writeFileSync(SAVE_FILE + '.tmp', JSON.stringify(data)); fs.renameSync(SAVE_FILE + '.tmp', SAVE_FILE);
    } catch (e) { console.error('Spielstand nicht gespeichert:', e.message); }
  }, 400);
}
function restore() {
  if (process.env.NO_SAVE || !fs.existsSync(SAVE_FILE)) return;
  try {
    const d = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'));
    if (d.v !== 2 || Date.now() - d.savedAt > 12 * 3600e3) return;
    for (const x of d.rooms || []) {
      const room = { code: x.code, hostToken: x.hostToken, settings: Object.assign({}, DEFAULT_SETTINGS, x.settings), createdAt: x.createdAt, lastActive: Date.now(), G: null };
      rooms.set(room.code, room); use(room); G = null; newGame(false);
      G.players = x.players.map(p => Object.assign(p, { connected: false, pos: Math.min(p.pos, LAST()) }));
      G.players.forEach(p => { if (!FIGURES.includes(p.figure)) p.figure = freeFigures(p.id)[0] || FIGURES[0]; });
      Object.assign(G, { phase: x.phase, turn: Math.max(0, Math.min(x.turn, G.players.length - 1)), winner: x.winner, lastRoll: x.lastRoll, log: x.log || [], seq: x.seq || 0, paused: !!x.paused, history: x.history || [], gameRemaining: x.gameRemaining || 0 });
      G.players.forEach(p => (p.members || []).forEach(m => m.connected = false));
      if (G.phase === 'playing' && G.gameRemaining && !G.paused) { G.gameDeadline = Date.now() + G.gameRemaining; armGameTimer(room); }
      const byId = k => id => (cards[k] || []).find(c => c.id === id);
      G.decks = { action: x.decks.action.map(byId('action')).filter(Boolean), question: x.decks.question.map(byId('question')).filter(Boolean) };
      if (G.phase === 'playing' && !G.players.length) G.phase = 'lobby';
      if (G.phase === 'playing' && x.inTurn) endTurn(); else if (G.phase === 'playing') armTurnTimer();
      log('Spielstand wiederhergestellt.');
    }
    use(null);
    console.log(`  Spielstand wiederhergestellt: ${rooms.size} Raum/Räume`);
  } catch (e) { console.error('Spielstand nicht lesbar:', e.message); }
}

const later = (ms, fn) => {
  const room = ROOM, game = G, epoch = G.epoch || 0; let left = ms, last = Date.now();
  const tick = () => {
    if (!room || rooms.get(room.code) !== room || room.G !== game || (game.epoch || 0) !== epoch) return;
    const now = Date.now(); if (!game.paused) left -= now - last; last = now;
    if (left <= 0 && !game.paused) { use(room); fn(); } else setTimeout(tick, Math.max(1, Math.min(100, left || 100)));
  };
  return setTimeout(tick, Math.max(1, Math.min(100, ms)));
};
// Optionales Zugzeit-Limit: wer nicht wuerfelt, fuer den wird automatisch gewuerfelt
function armTurnTimer() {
  const t = R().turnTimeSec; G.turnDeadline = null;
  if (!t || G.phase !== 'playing' || G.paused || !cur()) return;
  const key = (G.epoch || 0) + ':' + G.turn; G.turnDeadline = Date.now() + t * 1000;
  later(t * 1000, () => { if ((G.epoch || 0) + ':' + G.turn !== key || G.paused || G.pending || G.busy) return; const p = cur(); log(`⏱ Zeit abgelaufen – für ${p.name} wird gewürfelt.`); doRoll(p); });
}

function win(p, timeMode) {
  G.phase = 'finished'; G.pending = null; G.busy = false;
  const t = R().teams;
  G.winner = { playerId: p.id, name: p.name, team: t && t.enabled ? p.team : null,
    timeMode: !!timeMode, ranking: G.players.slice().sort((a, b) => (b.id === p.id) - (a.id === p.id) || b.pos - a.pos).map(x => ({ id: x.id, name: x.name, pos: x.pos, color: x.color, figure: x.figure, team: x.team })) };
  G.winner.ranking.forEach((x, i, a) => { x.place = i > 0 && x.pos === a[i - 1].pos && (timeMode || (x.id !== p.id && a[i - 1].id !== p.id)) ? a[i - 1].place : i + 1; });
  G.gameDeadline = null; G.gameRemaining = 0; G.turnDeadline = null;
  log(timeMode ? `🏆 Zeit abgelaufen: ${p.name} führt auf Feld ${p.pos}.` : `🏆 ${p.name} ist im Ziel!`); broadcast();
}
function moveBy(p, steps) {
  const last = LAST(), r = R(); let to = p.pos + steps;
  if (to > last) to = r.finishExact ? last - (to - last) : last;
  p.pos = Math.max(0, to); return p.pos === last;
}
const fname = pos => pos === 0 ? 'START' : pos === LAST() ? 'ZIEL' : 'Feld ' + pos;
const animMs = (from, to) => Math.abs(to - from) * R().stepMs + 350;
function applyEffect(p, e) {
  e = e || { type: 'none' };
  if (e.type === 'move') return moveBy(p, e.steps | 0);
  if (e.type === 'moveTo') { p.pos = Math.max(0, Math.min(LAST(), e.field | 0)); return p.pos === LAST(); }
  if (e.type === 'toStart') p.pos = 0;
  if (e.type === 'skip') p.skip += (e.turns || 1);
  if (e.type === 'extraTurn') p.extra = true;
  return false;
}
function endTurn() {
  G.epoch = (G.epoch || 0) + 1;
  G.pending = null; G.busy = false;
  const p = cur();
  G.turnDeadline = null;
  if (p && p.extra) { p.extra = false; log(`${p.name} würfelt noch einmal.`); armTurnTimer(); broadcast(); return; }
  for (let guard = 0; guard < G.players.length * 10; guard++) {
    G.turn = (G.turn + 1) % G.players.length;
    const n = cur();
    if (n.skip > 0) { n.skip--; log(`${n.name} setzt aus.`); continue; }
    break;
  }
  armTurnTimer(); broadcast();
}
// Kurzer Hinweis (Rutsche, Finanzpolizei) am Beamer und Handy, danach weiter mit fn
function info(p, kind, text, fn) {
  const pd = { type: 'info', kind, playerId: p.id, text }; G.pending = pd; broadcast();
  later(R().infoDisplayMs, () => { if (G.pending === pd) fn(); });
}
// Nach jeder Bewegung: Ziel pruefen, sonst Feld auswerten.
// Kettenregel: Rutsche und Finanzpolizei wirken IMMER (auch nach Kartenbewegung).
// Aktion/Frage nur nach dem Wuerfeln, nicht nach einer Kartenbewegung (max. 1 Karte pro Zug; rules.chainCards).
function landed(p, fromCard, depth) {
  if (p.pos === LAST()) return win(p);
  const f = board.fields[p.pos], r = R(); depth = depth || 0;
  if (f.type === 'rutsche' && f.to != null && depth < 3) {
    log(`🛝 ${p.name}: Rutsche auf Feld ${f.id} → zurück auf Feld ${f.to}.`);
    return info(p, 'rutsche', `Rutsche! Zurück von Feld ${f.id} auf Feld ${f.to}.`, () => {
      const from = p.pos; p.pos = f.to; G.lastMove = { playerId: p.id, kind: 'slide', from, to: f.to, seq: G.seq + 1 };
      G.pending = { type: 'info', kind: 'rutsche', playerId: p.id, text: `Rutsche! Zurück auf Feld ${f.to}.`, sliding: true }; broadcast();
      later(r.slideMs, () => landed(p, true, depth + 1));
    });
  }
  if (f.type === 'finanzpolizei') {
    p.jail = true; p.jailTries = 0;
    log(`🚓 ${p.name} ist bei der Finanzpolizei (Feld ${f.id}) – weiter nur mit einer ${r.finanzpolizei.need}.`);
    return info(p, 'finanzpolizei', `Finanzpolizei! Ab dem nächsten Zug geht es nur mit einer ${r.finanzpolizei.need} weiter.`, endTurn);
  }
  if (fromCard && !r.chainCards) return endTurn();
  const card0 = f.type === 'aktion' && r.decks.action ? draw('action') : f.type === 'frage' && r.decks.question ? draw('question') : null;
  if (f.type === 'aktion' && card0) {
    const card = card0;
    (G.history || (G.history = [])).push({ type: 'action', player: p.name, playerId: p.id, cardId: card.id, nr: card.nr, text: card.text, effect: card.effectLabel || effectText(card.effect), at: Date.now() });
    G.pending = { type: 'action', playerId: p.id, card }; log(`${p.name} zieht ${card.title}: ${card.effectLabel || ''}`); broadcast();
    later(r.cardDisplayMs, () => {
      if (!G.pending || G.pending.card !== card) return;
      const from = p.pos; applyEffect(p, card.effect); G.pending = null;
      if (p.pos !== from) { G.lastMove = { playerId: p.id, kind: 'walk', from, to: p.pos, seq: G.seq + 1 }; log(`${p.name} → ${fname(p.pos)}.`); broadcast(); later(animMs(from, p.pos), () => landed(p, true, depth + 1)); } else endTurn();
    });
  } else if (f.type === 'frage' && card0) {
    const card = card0;
    G.pending = { type: 'question', playerId: p.id, card, answer: null, stage: 'personal', votes: {}, eligible: [], resolved: false, deadline: r.questionTimeSec ? Date.now() + r.questionTimeSec * 1000 : null };
    log(`${p.name} bekommt ${card.title}.`); broadcast();
    if (r.questionTimeSec) later(r.questionTimeSec * 1000, () => { if (G.pending && G.pending.card === card && !G.pending.resolved) judge(false); });
  } else endTurn();
}
function voteCounts(pd) { const counts = (pd.card && pd.card.answers || []).map(() => 0); Object.values(pd.votes || {}).forEach(v => { if (counts[v] !== undefined) counts[v]++; }); return counts; }
function revealVotes() { const pd = G.pending; if (!pd || pd.type !== 'question' || pd.resolved) return; pd.stage = 'reveal'; pd.deadline = null; broadcast(); }
function commitAnswer(i) {
  const pd = G.pending; if (!pd || pd.stage !== 'personal' || pd.resolved) return;
  i |= 0; if (i < 0 || i >= pd.card.answers.length) return;
  pd.answer = i; pd.stage = 'group'; pd.eligible = G.players.filter(p => p.id !== pd.playerId).flatMap(p => p.isTeam ? (p.members || []).filter(m => m.connected).map(m => m.token) : p.connected ? [p.token] : []);
  // Antwort bleibt fuer Gruppe und Beamer verborgen, bis Abstimmung beendet ist
  log('Antwort festgelegt. Jetzt stimmt die Gruppe ab.');
  if (!pd.eligible.length) revealVotes(); else broadcast();
}
// Zeitlimit-Modus pro Raum (unabhaengig vom Zugzeit-Limit, ueberlebt Pausen und Reload)
function armGameTimer(room) {
  const g = room.G, key = g.gameDeadline;
  const tick = () => { if (!rooms.has(room.code) || room.G !== g || g.phase !== 'playing' || !g.gameDeadline || g.gameDeadline !== key) return;
    if (Date.now() >= g.gameDeadline && !g.paused) { use(room); log('⏱ Spielzeit abgelaufen – Auswertung nach Feldstand.'); finishByTime(); } else setTimeout(tick, 250);
  }; setTimeout(tick, 250);
}
function finishByTime() {
  const p = G.players.slice().sort((a,b) => b.pos-a.pos)[0]; if (!p) return;
  G.epoch = (G.epoch || 0)+1; G.gameDeadline = null; G.gameRemaining = 0; win(p, true);
}
// Bewertung durch die Spielleitung: -range..+range Felder (true/false = Schnellwahl Richtig/Falsch aus den Einstellungen)
function judge(v) {
  const pd = G.pending; if (!pd || pd.type !== 'question' || pd.resolved || G.paused) return;
  if (pd.stage !== 'reveal') revealVotes();
  const p = G.players.find(x => x.id === pd.playerId); const r = R();
  let delta = typeof v === 'boolean' ? (v ? r.quickRight : r.quickWrong) : Math.round(+v);
  if (!Number.isFinite(delta)) return;
  delta = Math.max(-r.judgeRange, Math.min(r.judgeRange, delta));
  pd.resolved = true; pd.delta = delta; pd.result = typeof v === 'boolean' ? v : delta > 0;
  const txt = delta > 0 ? `+${delta} Feld${delta > 1 ? 'er' : ''} vor` : delta < 0 ? `${-delta} Feld${delta < -1 ? 'er' : ''} zurück` : '0 Felder (keine Bewegung)';
  log(`${p.name}: Bewertung ${delta > 0 ? '+' : ''}${delta} → ${txt}${typeof v === 'boolean' ? (v ? ' (Richtig)' : ' (Falsch)') : ''}`);
  (G.history || (G.history = [])).push({ type: 'question', player: p.name, playerId: p.id, cardId: pd.card.id, nr: pd.card.nr, text: pd.card.question, answers: pd.card.answers, answer: pd.answer, counts: voteCounts(pd), votes: Object.keys(pd.votes || {}).length, groupTotal: (pd.eligible || []).length, delta, at: Date.now() });
  broadcast();
  later(r.resultDisplayMs, () => {
    if (G.pending !== pd) return;
    const from = p.pos; if (delta) moveBy(p, delta); G.pending = null;
    if (p.pos !== from) { G.lastMove = { playerId: p.id, kind: 'walk', from, to: p.pos, seq: G.seq + 1 }; broadcast(); later(animMs(from, p.pos), () => landed(p, true, 1)); } else endTurn();
  });
}
function doRoll(p) {
  if (G.phase !== 'playing' || G.pending || G.busy || G.paused || cur() !== p) return false;
  G.turnDeadline = null;
  const r = R(), fp = r.finanzpolizei, d = 1 + Math.floor(Math.random() * r.dice), from = p.pos;
  G.busy = true; let released = false;
  G.lastRoll = { playerId: p.id, value: d, from, to: from, at: Date.now() };
  if (p.jail) {
    p.jailTries = (p.jailTries || 0) + 1;
    const free = d === fp.need || (fp.maxTries > 0 && p.jailTries >= fp.maxTries);
    if (!free) { broadcast(); later(r.diceMs, () => { log(`🚓 ${p.name} würfelt ${d} – keine ${fp.need}, bleibt bei der Finanzpolizei.`); info(p, 'gesperrt', `${d} gewürfelt – keine ${fp.need}. Du bleibst bei der Finanzpolizei.`, endTurn); }); return true; }
    p.jail = false; released = true;
    if (!fp.moveOnRelease) { broadcast(); later(r.diceMs, () => { log(`🚓 ${p.name} würfelt ${d} – frei! Nächster Zug normal.`); info(p, 'frei', `${d}! Du bist frei und ziehst im nächsten Zug weiter.`, endTurn); }); return true; }
    log(`🚓 ${p.name} würfelt ${d} – frei!`);
  }
  log(`${p.name} würfelt ${d}.`); broadcast();
  // Wuerfel-Animation abwarten, dann ziehen
  later(r.diceMs, () => {
    moveBy(p, d); G.lastRoll.to = p.pos; G.lastMove = { playerId: p.id, kind: 'walk', from, to: p.pos, seq: G.seq + 1 };
    G.log[0].msg = `${p.name} würfelt ${d} → ${fname(p.pos)}.`; broadcast();
    later(animMs(from, p.pos) + (released && !process.env.FAST ? 700 : 0), () => landed(p, false, 0));
  });
  return true;
}

// ---------- HTTP ----------
const app = express();
app.set('trust proxy', true);
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 5000, pingTimeout: 8000, serveClient: false });
app.use('/assets', express.static(path.join(BASE, 'assets')));
app.use(express.static(path.join(BASE, 'public'), { index: false }));
app.get('/', (q, s) => s.sendFile(path.join(BASE, 'public', 'player.html')));
app.get('/host', (q, s) => s.sendFile(path.join(BASE, 'public', 'host.html')));
app.get('/api/config', (q, s) => s.json({ board }));
app.get('/r/:code', (q, s) => s.redirect('/?r=' + encodeURIComponent(String(q.params.code).toUpperCase())));
app.get('/api/join-info', async (q, s) => {
  const ips = lanIPs(); const host = (ips[0] && ips[0].address) || 'localhost';
  const reqHost = q.get('x-forwarded-host') || q.get('host') || '';
  const viaProxy = !!(q.get('x-forwarded-for') || q.get('cf-connecting-ip'));
  const publicReq = viaProxy && reqHost && !/^(localhost|127\.|\[?::1)/.test(reqHost);
  const code = String(q.query.r || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const base = PUBLIC_URL ? PUBLIC_URL + '/' : publicReq ? `${q.get('x-forwarded-proto') || q.protocol}://${reqHost}/` : `http://${host}:${PORT}/`;
  const url = code ? `${base}?r=${code}` : base;
  s.json({ url, base, code, online: !!(PUBLIC_URL || publicReq), alternatives: (PUBLIC_URL || publicReq) ? [] : ips.slice(1).map(i => `http://${i.address}:${PORT}/${code ? '?r=' + code : ''}`), qr: await QRCode.toDataURL(url, { margin: 1, width: 400 }) });
});

const isLocal = sock => /^(::1|127\.|::ffff:127\.)/.test(sock.handshake.address);
const proxied = sock => { const h = sock.handshake.headers; return !!(h['x-forwarded-for'] || h['cf-connecting-ip'] || h['x-forwarded-host']); };
// Spielleitung ohne PIN nur offline direkt am Host-PC; online/ueber Proxy immer PIN
const hostAllowed = sock => sock.data.hostOk || (!ONLINE && !proxied(sock) && (isLocal(sock) || board.rules.allowRemoteHost));
const pinOk = pin => { const a = Buffer.from(String(pin || '')), b = Buffer.from(HOST_PIN); return a.length === b.length && crypto.timingSafeEqual(a, b); };
const hostOnline = code => [...io.sockets.sockets.values()].some(x => x.data.hostRoom === code);
const roomInfo = (room, mine) => ({ code: room.code, mine, phase: room.G.phase, players: room.G.players.length, connected: room.G.players.filter(p => p.connected).length, hostOnline: hostOnline(room.code), lastActive: room.lastActive, createdAt: room.createdAt, paused: !!room.G.paused });
function closeRoom(room, why) {
  io.to('r:' + room.code).emit('roomClosed', { code: room.code, why });
  for (const x of io.sockets.sockets.values()) if (x.data.room === room.code || x.data.hostRoom === room.code) { x.leave('r:' + room.code); if (x.data.room === room.code) x.data.room = null; if (x.data.hostRoom === room.code) x.data.hostRoom = null; }
  rooms.delete(room.code); if (ROOM === room) use(null); saveSoon();
}
// Alte Raeume aufraeumen: lange inaktiv, oder leer und ohne Spielleitung
const IDLE_MIN = +(process.env.ROOM_IDLE_MIN || 180), EMPTY_MIN = +(process.env.ROOM_EMPTY_MIN || 30);
setInterval(() => {
  const now = Date.now();
  for (const room of [...rooms.values()]) {
    const idle = (now - room.lastActive) / 60000, online = hostOnline(room.code) || room.G.players.some(p => p.connected);
    if (idle > IDLE_MIN || (!online && !room.G.players.length && idle > EMPTY_MIN)) { console.log(`  Raum ${room.code} aufgeräumt (inaktiv ${Math.round(idle)} min).`); closeRoom(room, 'inaktiv'); }
  }
}, +(process.env.ROOM_SWEEP_MS || 60000)).unref();

io.on('connection', sock => {
  // Raum betreten (Handy): Code aus QR/Link; ohne Code und mit genau einem Raum -> dieser Raum
  const roomOf = code => { code = String(code || '').toUpperCase().trim(); return code ? rooms.get(code) : rooms.size === 1 ? [...rooms.values()][0] : null; };
  function enter(room) {
    if (sock.data.room && sock.data.room !== room.code) sock.leave('r:' + sock.data.room);
    sock.data.room = room.code; sock.join('r:' + room.code); use(room); sock.emit('state', publicState(sock));
  }
  sock.on('room:watch', (code, ack) => {
    ack = typeof ack === 'function' ? ack : () => {};
    const room = roomOf(code); if (!room) return ack({ ok: false, error: code ? 'Raum „' + String(code).toUpperCase() + '“ gibt es nicht (mehr).' : 'Bitte den Raumcode eingeben.', rooms: rooms.size });
    enter(room); ack({ ok: true, code: room.code });
  });
  const P = fn => (...a) => { const room = rooms.get(sock.data.room); if (!room) return; use(room); fn(...a); };
  sock.on('join', (d, ack) => {
    ack = typeof ack === 'function' ? ack : () => {};
    d = d || {};
    const room = d.room ? roomOf(d.room) : rooms.get(sock.data.room) || roomOf('');
    if (!room) return ack({ ok: false, error: 'Raum nicht gefunden. Bitte QR-Code neu scannen.', noRoom: true });
    enter(room);
    let member;
    let p = d.token && G.players.find(x => { if (x.isTeam) { member = (x.members || []).find(m => m.token === d.token); return !!member; } return x.token === d.token; });
    if (p) { if (p.isTeam && member) { member.connected = true; member.socketId = sock.id; sock.data.memberToken = member.token; } p.connected = true; p.socketId = sock.id; sock.data.pid = p.id; log(`${member ? member.name + ' (' + p.name + ')' : p.name} ist wieder da.`); broadcast(); return ack({ ok: true, token: d.token, id: p.id, room: room.code, memberName: member ? member.name : p.name }); }
    if (d.token && !d.name) return ack({ ok: false, error: 'Spieler nicht mehr im Raum.', room: room.code });
    const r = R(); const name = String(d.name || '').trim().slice(0, 20);
    if (!name) return ack({ ok: false, error: 'Bitte einen Namen eingeben.' });
    if (G.players.length >= r.maxPlayers && !d.teamId) return ack({ ok: false, error: 'Das Spiel ist voll.' });
    if (G.phase !== 'lobby' && !r.allowLateJoin) return ack({ ok: false, error: 'Das Spiel läuft bereits.' });
    if (G.players.some(x => !x.isTeam && x.name.toLowerCase() === name.toLowerCase() || (x.members || []).some(m => m.name.toLowerCase() === name.toLowerCase()))) return ack({ ok: false, error: 'Dieser Name ist schon vergeben.' });
    if (d.teamId) {
      p = G.players.find(x => x.id === d.teamId && x.isTeam);
      if (!p) return ack({ ok: false, error: 'Team nicht mehr vorhanden.' });
      if (p.members.length >= 8) return ack({ ok: false, error: 'Dieses Team ist voll (max. 8 Handys).' });
      const m = { name, token: crypto.randomBytes(16).toString('hex'), connected: true, socketId: sock.id }; p.members.push(m); p.connected = true; sock.data.pid = p.id; sock.data.memberToken = m.token;
      log(`${name} tritt Team ${p.name} bei.`); broadcast(); return ack({ ok: true, token: m.token, id: p.id, room: room.code, memberName: name });
    }
    const teamName = d.newTeam ? String(d.newTeam).trim().slice(0, 20) : '';
    if (teamName && G.players.some(x => x.name.toLowerCase() === teamName.toLowerCase())) return ack({ ok: false, error: 'Dieser Teamname ist schon vergeben.' });
    const free = PALETTE.filter(c => !G.players.some(x => x.color === c));
    const color = free.includes(d.color) ? d.color : free[0];
    const ff = freeFigures();
    if (!ff.length) return ack({ ok: false, error: 'Alle 22 Figuren sind vergeben. Tritt einem Team bei.' });
    if (d.figure && FIGURES.includes(d.figure) && !ff.includes(d.figure)) return ack({ ok: false, error: 'Diese Figur ist schon vergeben – bitte eine andere wählen.' });
    const figure = ff.includes(d.figure) ? d.figure : (ff[0] || FIGURES[G.players.length % FIGURES.length]);
    const teams = r.teams && r.teams.enabled ? r.teams.list : null;
    const tok = crypto.randomBytes(16).toString('hex');
    p = { id: crypto.randomBytes(4).toString('hex'), token: tok, name: teamName || name, color, team: teamName || null, isTeam: !!teamName, members: teamName ? [{ name, token: tok, connected: true, socketId: sock.id }] : [], figure, pos: 0, skip: 0, connected: true, socketId: sock.id };
    G.players.push(p); sock.data.pid = p.id; sock.data.memberToken = tok; log(teamName ? `${name} gründet Team ${teamName}.` : `${name} ist beigetreten.`); broadcast();
    ack({ ok: true, token: tok, id: p.id, room: room.code, memberName: name });
  });
  const me = () => G && G.players.find(x => x.id === sock.data.pid);
  sock.on('setFigure', P(f => { const p = me(); if (p && freeFigures(p.id).includes(f)) { p.figure = f; broadcast(); } }));
  sock.on('setColor', P(c => { const p = me(); if (p && PALETTE.includes(c) && !G.players.some(x => x.color === c)) { p.color = c; broadcast(); } }));
  sock.on('setTeam', P(t => { const p = me(), r = R(); if (p && r.teams.enabled && r.teams.list.some(x => x.name === t)) { p.team = t; broadcast(); } }));
  sock.on('roll', P(() => { const p = me(); if (p) doRoll(p); }));
  sock.on('answer', P(i => {
    const p = me(), pd = G.pending; if (!p || !pd || pd.type !== 'question' || pd.playerId !== p.id || pd.resolved || pd.stage !== 'personal' || G.paused) return;
    commitAnswer(i);
  }));
  sock.on('vote', P(i => {
    const pd = G.pending, p = me(); if (!p || !pd || pd.type !== 'question' || pd.stage !== 'group' || p.id === pd.playerId || G.paused) return;
    const token = sock.data.memberToken || p.token; if (!pd.eligible.includes(token) || pd.votes[token] !== undefined) return;
    i |= 0; if (i < 0 || i >= pd.card.answers.length) return;
    pd.votes[token] = i;
    if (Object.keys(pd.votes).length >= pd.eligible.length) revealVotes(); else broadcast();
  }));
  sock.on('leave', P(() => { const p = me(); if (!p || G.phase !== 'lobby') return; if (p.isTeam && p.members.length > 1) { const m = p.members.find(m => m.token === sock.data.memberToken); p.members = p.members.filter(x => x !== m); if (p.token === (m && m.token)) p.token = p.members[0].token; log(`${m ? m.name : '?'} verlässt Team ${p.name}.`); } else G.players = G.players.filter(x => x !== p); sock.data.pid = null; sock.data.memberToken = null; broadcast(); }));
  sock.on('disconnect', () => {
    const room = rooms.get(sock.data.room); if (!room) return; use(room);
    const p = me(); if (p) { if (p.isTeam) { const m = (p.members || []).find(m => m.socketId === sock.id); if (m) m.connected = false; p.connected = p.members.some(m => m.connected); } else if (p.socketId === sock.id) p.connected = false; broadcast(); }
    if (sock.data.hostRoom) setTimeout(() => { if (rooms.has(sock.data.hostRoom)) { use(rooms.get(sock.data.hostRoom)); broadcast(); } }, 50);
  });

  // ---------- Spielleitung: nach PIN (bzw. lokal ohne PIN) automatisch eigene Lobby ----------
  sock.emit('hostAuth', { required: !hostAllowed(sock) });
  sock.data.pinFails = 0;
  sock.on('host:auth', (pin, ack) => {
    ack = typeof ack === 'function' ? ack : () => {};
    if (sock.data.pinFails >= 5) return ack({ ok: false, error: 'Zu viele Fehlversuche. Seite neu laden.' });
    if (pinOk(pin)) { sock.data.hostOk = true; ack({ ok: true }); sock.emit('hostAuth', { required: false }); }
    else { sock.data.pinFails++; setTimeout(() => ack({ ok: false, error: 'PIN falsch.' }), 800); if (sock.data.pinFails >= 5) setTimeout(() => sock.disconnect(true), 900); }
  });
  // host:open {token}: mit gueltigem Host-Token zurueck in die eigene Lobby, sonst neue Lobby
  sock.on('host:open', (d, ack) => {
    ack = typeof ack === 'function' ? ack : () => {};
    if (!hostAllowed(sock)) return ack({ ok: false, error: 'PIN nötig.' });
    const t = d && d.token; let room = t && [...rooms.values()].find(x => x.hostToken === t);
    const resumed = !!room;
    if (!room) { if (rooms.size >= +(process.env.MAX_ROOMS || 50)) return ack({ ok: false, error: 'Zu viele offene Räume.' }); room = createRoom(); console.log(`  Neue Lobby ${room.code}`); }
    sock.data.hostRoom = room.code; enter(room); broadcast();
    ack({ ok: true, code: room.code, token: room.hostToken, resumed });
  });
  const H = (ev, fn) => sock.on(ev, (...a) => {
    if (!hostAllowed(sock)) return sock.emit('hostError', 'Spielleitung: bitte zuerst die PIN eingeben.');
    const room = rooms.get(sock.data.hostRoom); if (!room) return sock.emit('hostError', 'Keine Lobby – Seite neu laden.');
    use(room); fn(...a);
  });
  H('host:start', () => { if (G.phase === 'lobby' && G.players.length >= R().minPlayers) { G.decks = { action: shuffle(deckCards('action')), question: shuffle(deckCards('question')) }; G.phase = 'playing'; G.turn = 0; if (R().gameTimeMin) { G.gameRemaining = R().gameTimeMin * 60000; G.gameDeadline = Date.now() + G.gameRemaining; armGameTimer(ROOM); } log('Spiel gestartet!'); armTurnTimer(); broadcast(); } });
  H('host:revealVotes', () => revealVotes());
  H('host:judge', v => judge(typeof v === 'boolean' ? v : +v));
  H('host:rollFor', () => { const p = cur(); if (p) doRoll(p); });
  H('host:skipTurn', () => { if (G.phase === 'playing' && G.players.length) { log(`${cur().name} wurde übersprungen.`); endTurn(); } });
  H('host:pause', on => { if (G.phase !== 'playing') return; if (G.paused === !!on) return; G.paused = !!on; log(G.paused ? '⏸ Spiel pausiert.' : '▶ Spiel geht weiter.'); if (G.paused) { G.turnDeadline = null; if (G.gameDeadline) { G.gameRemaining = Math.max(0, G.gameDeadline - Date.now()); G.gameDeadline = null; } } else { if (G.gameRemaining) { G.gameDeadline = Date.now() + G.gameRemaining; armGameTimer(ROOM); } if (!G.pending && !G.busy) armTurnTimer(); } broadcast(); });
  H('host:settings', d => { if (!d || typeof d !== 'object') return; ROOM.settings = cleanSettings(ROOM.settings, d); if (G.phase === 'playing' && !G.pending && !G.busy) armTurnTimer(); broadcast(); });
  H('host:rename', d => {
    const p = d && G.players.find(x => x.id === d.id), name = String((d && d.name) || '').trim().slice(0, 20);
    if (!p || !name) return; if (G.players.some(x => x !== p && x.name.toLowerCase() === name.toLowerCase())) return sock.emit('hostError', 'Dieser Name ist schon vergeben.');
    log(`${p.name} heißt jetzt ${name}.`); p.name = name; broadcast();
  });
  H('host:kick', id => {
    const i = G.players.findIndex(x => x.id === id); if (i < 0) return;
    const wasCur = i === G.turn; log(`${G.players[i].name} wurde entfernt.`); G.players.splice(i, 1);
    if (i < G.turn) G.turn--; if (G.turn >= G.players.length) G.turn = 0;
    if (wasCur) { G.epoch = (G.epoch || 0) + 1; G.pending = null; G.busy = false; if (G.phase === 'playing') armTurnTimer(); }
    if (G.phase === 'playing' && G.players.length === 0) newGame(false); broadcast();
  });
  H('host:rooms', (ack) => { if (typeof ack === 'function') ack([...rooms.values()].map(r => roomInfo(r, r.code === sock.data.hostRoom))); });
  H('host:closeRoom', () => { closeRoom(ROOM, 'beendet'); });
  if (process.env.TEST_HOOKS) H('test:topCard', (kind, id) => { const d = G.decks[kind], c = (cards[kind] || []).find(x => x.id === id); if (d && c) d.push(c); }); // nur fuer Tests
  if (process.env.TEST_HOOKS) H('test:setPos', (id, pos, jail) => { const p = G.players.find(x => x.id === id); if (p) { p.pos = pos; if (jail !== undefined) p.jail = !!jail; broadcast(); } }); // nur fuer Tests
  H('host:reset', keep => { newGame(!!keep); G.lastMove = null; log(keep ? 'Neue Runde mit denselben Spielern.' : 'Neues Spiel.'); broadcast(); });
  H('host:reload', () => { try { board = readJSON('board.json'); cards = readJSON('cards.json'); newGame(true); log(`Konfiguration neu geladen (${cards.action.length} Aktions-, ${cards.question.length} Fragekarten).`); io.to('r:' + ROOM.code).emit('reloadConfig'); broadcast(); } catch (e) { sock.emit('hostError', 'Fehler in JSON: ' + e.message); } });
});

restore();
app.get('/healthz', (q, s) => s.send('ok'));
// Liste der vorhandenen Sound-Dateien (assets/sfx/*.ogg|*.mp3); fehlt der Ordner, nutzen die Seiten Ersatz-Klaenge
app.get('/sfx.json', (q, s) => { let l = []; try { l = fs.readdirSync(path.join(BASE, 'assets', 'sfx')).filter(f => /^[a-z0-9_]+\.(ogg|mp3)$/i.test(f)); } catch {} s.set('Cache-Control', 'no-cache').json(l); });
server.listen(PORT, '0.0.0.0', () => {
  const ips = lanIPs();
  console.log('\n  BERUFE-RALLYE läuft!');
  console.log(`  Beamer/Spielleitung:  http://localhost:${PORT}/host`);
  console.log(`  Handys beitreten:     ${ips.length ? ips.map(i => `http://${i.address}:${PORT}/`).join('  oder  ') : `http://localhost:${PORT}/`}  (Raumcode/QR steht am Beamer)`);
  if (PUBLIC_URL) console.log(`  Öffentliche Adresse:  ${PUBLIC_URL}/  (Beamer: ${PUBLIC_URL}/host)`);
  console.log(ONLINE ? `  Spielleitungs-PIN:    ${HOST_PIN}` : `  Spielleitungs-PIN (nur für Zugriff über Tunnel/anderes Gerät): ${HOST_PIN}`);
  console.log('  Fenster offen lassen. Beenden mit Strg+C.\n');
  if (process.env.OPEN_BROWSER) require('child_process').exec(`start "" "http://localhost:${PORT}/host"`);
});
