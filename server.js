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
const R = () => Object.assign({}, board.rules, process.env.FAST ? { stepMs: 5, cardDisplayMs: 40, resultDisplayMs: 40, infoDisplayMs: 40 } : process.env.TIMING ? (([a, b, c]) => ({ stepMs: +a, cardDisplayMs: +b, resultDisplayMs: +c }))(process.env.TIMING.split(',')) : {});
const LAST = () => board.fields.length - 1;

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

const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let G;
function newGame(keepPlayers) {
  const players = keepPlayers && G ? G.players.map(p => Object.assign(p, { pos: 0, skip: 0, jail: false, jailTries: 0, extra: false })) : [];
  G = { phase: 'lobby', players, turn: 0, pending: null, busy: false, winner: null, lastRoll: null, log: [], decks: { action: shuffle(cards.action), question: shuffle(cards.question) }, seq: 0 };
  if (process.env.QFIRST) { const q = G.decks.question, i = q.findIndex(c => c.id === process.env.QFIRST); if (i >= 0) q.push(q.splice(i, 1)[0]); } // nur fuer Tests
}
newGame(false);
function draw(kind) { if (!G.decks[kind].length) G.decks[kind] = shuffle(cards[kind]); return G.decks[kind].pop(); }
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
function publicState() {
  const r = R();
  return {
    phase: G.phase, turn: G.turn, seq: G.seq, stepMs: r.stepMs, lastRoll: G.lastRoll, winner: G.winner, log: G.log.slice(0, 8), busy: G.busy,
    teams: r.teams && r.teams.enabled ? r.teams.list : null, questionMode: r.questionMode,
    players: G.players.map(p => ({ id: p.id, name: p.name, color: p.color, team: p.team, pos: p.pos, skip: p.skip, jail: !!p.jail, connected: p.connected })), need: (r.finanzpolizei || {}).need || 6, last: LAST(),
    pending: G.pending && {
      type: G.pending.type, playerId: G.pending.playerId, resolved: G.pending.resolved, result: G.pending.result, answer: G.pending.answer, deadline: G.pending.deadline,
      kind: G.pending.kind, text: G.pending.text,
      card: G.pending.type === 'info' ? null : G.pending.type === 'question'
        ? { id: G.pending.card.id, title: G.pending.card.title, question: G.pending.card.question, answers: G.pending.card.answers, correct: G.pending.resolved && Number.isInteger(G.pending.card.correct) ? G.pending.card.correct : null, hostDecides: !Number.isInteger(G.pending.card.correct) || R().questionMode !== 'auto', nr: G.pending.card.nr, onCorrect: effectText(G.pending.card.onCorrect), onWrong: effectText(G.pending.card.onWrong) }
        : { id: G.pending.card.id, nr: G.pending.card.nr, title: G.pending.card.title, text: G.pending.card.text, effectLabel: G.pending.card.effectLabel || effectText(G.pending.card.effect), effect: effectText(G.pending.card.effect) }
    },
    freeColors: PALETTE.filter(c => !G.players.some(p => p.color === c))
  };
}
const broadcast = () => { G.seq++; io.emit('state', publicState()); };
const later = (ms, fn) => { const game = G, epoch = G.epoch || 0; return setTimeout(() => { if (G === game && (G.epoch || 0) === epoch) fn(); }, ms); };

function win(p) {
  G.phase = 'finished'; G.pending = null; G.busy = false;
  const t = R().teams;
  G.winner = { playerId: p.id, name: p.name, team: t && t.enabled ? p.team : null,
    ranking: G.players.slice().sort((a, b) => b.pos - a.pos).map(x => ({ id: x.id, name: x.name, pos: x.pos, color: x.color, team: x.team })) };
  log(`🏆 ${p.name} ist im Ziel!`); broadcast();
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
  if (p && p.extra) { p.extra = false; log(`${p.name} würfelt noch einmal.`); broadcast(); return; }
  for (let guard = 0; guard < G.players.length * 10; guard++) {
    G.turn = (G.turn + 1) % G.players.length;
    const n = cur();
    if (n.skip > 0) { n.skip--; log(`${n.name} setzt aus.`); continue; }
    break;
  }
  broadcast();
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
      const from = p.pos; p.pos = f.to; G.pending = { type: 'info', kind: 'rutsche', playerId: p.id, text: `Rutsche! Zurück auf Feld ${f.to}.`, sliding: true }; broadcast();
      later(animMs(from, p.pos), () => landed(p, true, depth + 1));
    });
  }
  if (f.type === 'finanzpolizei') {
    p.jail = true; p.jailTries = 0;
    log(`🚓 ${p.name} ist bei der Finanzpolizei (Feld ${f.id}) – weiter nur mit einer ${r.finanzpolizei.need}.`);
    return info(p, 'finanzpolizei', `Finanzpolizei! Ab dem nächsten Zug geht es nur mit einer ${r.finanzpolizei.need} weiter.`, endTurn);
  }
  if (fromCard && !r.chainCards) return endTurn();
  if (f.type === 'aktion') {
    const card = draw('action');
    G.pending = { type: 'action', playerId: p.id, card }; log(`${p.name} zieht ${card.title}: ${card.effectLabel || ''}`); broadcast();
    later(r.cardDisplayMs, () => {
      if (!G.pending || G.pending.card !== card) return;
      const from = p.pos; applyEffect(p, card.effect); G.pending = null;
      if (p.pos !== from) { log(`${p.name} → ${fname(p.pos)}.`); broadcast(); later(animMs(from, p.pos), () => landed(p, true, depth + 1)); } else endTurn();
    });
  } else if (f.type === 'frage') {
    const card = draw('question');
    G.pending = { type: 'question', playerId: p.id, card, answer: null, resolved: false, deadline: r.questionTimeSec ? Date.now() + r.questionTimeSec * 1000 : null };
    log(`${p.name} bekommt ${card.title}.`); broadcast();
    if (r.questionTimeSec) later(r.questionTimeSec * 1000, () => { if (G.pending && G.pending.card === card && !G.pending.resolved) judge(false); });
  } else endTurn();
}
function judge(correct) {
  const pd = G.pending; if (!pd || pd.type !== 'question' || pd.resolved) return;
  const p = G.players.find(x => x.id === pd.playerId); const r = R();
  pd.resolved = true; pd.result = !!correct; log(`${p.name}: ${correct ? 'richtig ✅' : 'falsch ❌'}`); broadcast();
  later(r.resultDisplayMs, () => {
    if (G.pending !== pd) return;
    const from = p.pos; applyEffect(p, correct ? pd.card.onCorrect : pd.card.onWrong); G.pending = null;
    if (p.pos !== from) { broadcast(); later(animMs(from, p.pos), () => landed(p, true, 1)); } else endTurn();
  });
}
function doRoll(p) {
  if (G.phase !== 'playing' || G.pending || G.busy || cur() !== p) return false;
  const r = R(), fp = r.finanzpolizei, d = 1 + Math.floor(Math.random() * r.dice), from = p.pos;
  G.busy = true;
  G.lastRoll = { playerId: p.id, value: d, from, to: from, at: Date.now() };
  if (p.jail) {
    p.jailTries = (p.jailTries || 0) + 1;
    const free = d === fp.need || (fp.maxTries > 0 && p.jailTries >= fp.maxTries);
    if (!free) { log(`🚓 ${p.name} würfelt ${d} – keine ${fp.need}, bleibt bei der Finanzpolizei.`); return info(p, 'gesperrt', `${d} gewürfelt – keine ${fp.need}. Du bleibst bei der Finanzpolizei.`, endTurn), true; }
    p.jail = false;
    if (!fp.moveOnRelease) { log(`🚓 ${p.name} würfelt ${d} – frei! Nächster Zug normal.`); return info(p, 'frei', `${d}! Du bist frei und ziehst im nächsten Zug weiter.`, endTurn), true; }
    log(`🚓 ${p.name} würfelt ${d} – frei!`);
  }
  moveBy(p, d); G.lastRoll.to = p.pos;
  log(`${p.name} würfelt ${d} → ${fname(p.pos)}.`); broadcast();
  later(animMs(from, p.pos), () => landed(p, false, 0));
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
app.get('/api/join-info', async (q, s) => {
  const ips = lanIPs(); const host = (ips[0] && ips[0].address) || 'localhost';
  const reqHost = q.get('x-forwarded-host') || q.get('host') || '';
  const viaProxy = !!(q.get('x-forwarded-for') || q.get('cf-connecting-ip'));
  const publicReq = viaProxy && reqHost && !/^(localhost|127\.|\[?::1)/.test(reqHost);
  const url = PUBLIC_URL ? PUBLIC_URL + '/' : publicReq ? `${q.get('x-forwarded-proto') || q.protocol}://${reqHost}/` : `http://${host}:${PORT}/`;
  s.json({ url, online: !!(PUBLIC_URL || publicReq), alternatives: (PUBLIC_URL || publicReq) ? [] : ips.slice(1).map(i => `http://${i.address}:${PORT}/`), qr: await QRCode.toDataURL(url, { margin: 1, width: 400 }) });
});

const isLocal = sock => /^(::1|127\.|::ffff:127\.)/.test(sock.handshake.address);
const proxied = sock => { const h = sock.handshake.headers; return !!(h['x-forwarded-for'] || h['cf-connecting-ip'] || h['x-forwarded-host']); };
// Spielleitung ohne PIN nur offline direkt am Host-PC; online/ueber Proxy immer PIN
const hostAllowed = sock => sock.data.hostOk || (!ONLINE && !proxied(sock) && (isLocal(sock) || R().allowRemoteHost));
const pinOk = pin => { const a = Buffer.from(String(pin || '')), b = Buffer.from(HOST_PIN); return a.length === b.length && crypto.timingSafeEqual(a, b); };
io.on('connection', sock => {
  sock.emit('state', publicState());
  sock.on('join', (d, ack) => {
    ack = typeof ack === 'function' ? ack : () => {};
    d = d || {};
    let p = d.token && G.players.find(x => x.token === d.token);
    if (p) { p.connected = true; p.socketId = sock.id; sock.data.pid = p.id; log(`${p.name} ist wieder da.`); broadcast(); return ack({ ok: true, token: p.token, id: p.id }); }
    const r = R(); const name = String(d.name || '').trim().slice(0, 20);
    if (!name) return ack({ ok: false, error: 'Bitte einen Namen eingeben.' });
    if (G.players.length >= r.maxPlayers) return ack({ ok: false, error: 'Das Spiel ist voll.' });
    if (G.phase !== 'lobby' && !r.allowLateJoin) return ack({ ok: false, error: 'Das Spiel läuft bereits.' });
    if (G.players.some(x => x.name.toLowerCase() === name.toLowerCase())) return ack({ ok: false, error: 'Dieser Name ist schon vergeben.' });
    const free = PALETTE.filter(c => !G.players.some(x => x.color === c));
    const color = free.includes(d.color) ? d.color : free[0];
    const teams = r.teams && r.teams.enabled ? r.teams.list : null;
    p = { id: crypto.randomBytes(4).toString('hex'), token: crypto.randomBytes(16).toString('hex'), name, color, team: teams ? (teams.some(t => t.name === d.team) ? d.team : teams[G.players.length % teams.length].name) : null, pos: 0, skip: 0, connected: true, socketId: sock.id };
    G.players.push(p); sock.data.pid = p.id; log(`${name} ist beigetreten.`); broadcast();
    ack({ ok: true, token: p.token, id: p.id });
  });
  const me = () => G.players.find(x => x.id === sock.data.pid);
  sock.on('setColor', c => { const p = me(); if (p && PALETTE.includes(c) && !G.players.some(x => x.color === c)) { p.color = c; broadcast(); } });
  sock.on('setTeam', t => { const p = me(), r = R(); if (p && r.teams.enabled && r.teams.list.some(x => x.name === t)) { p.team = t; broadcast(); } });
  sock.on('roll', () => { const p = me(); if (p) doRoll(p); });
  sock.on('answer', i => {
    const p = me(), pd = G.pending; if (!p || !pd || pd.type !== 'question' || pd.playerId !== p.id || pd.resolved || pd.answer !== null) return;
    pd.answer = i | 0; log(`${p.name} antwortet ${String.fromCharCode(65 + pd.answer)}.`);
    if (pd.answer < 0 || pd.answer >= pd.card.answers.length) { pd.answer = null; return; }
    if (R().questionMode === 'auto' && Number.isInteger(pd.card.correct)) judge(pd.answer === pd.card.correct); else broadcast();
  });
  sock.on('leave', () => { const p = me(); if (p && G.phase === 'lobby') { G.players = G.players.filter(x => x !== p); broadcast(); } });
  sock.on('disconnect', () => { const p = me(); if (p && p.socketId === sock.id) { p.connected = false; broadcast(); } });

  // Spielleiter-Aktionen (standardmaessig nur vom Host-PC selbst)
  sock.emit('hostAuth', { required: !hostAllowed(sock) });
  sock.data.pinFails = 0;
  sock.on('host:auth', (pin, ack) => {
    ack = typeof ack === 'function' ? ack : () => {};
    if (sock.data.pinFails >= 5) return ack({ ok: false, error: 'Zu viele Fehlversuche. Seite neu laden.' });
    if (pinOk(pin)) { sock.data.hostOk = true; ack({ ok: true }); sock.emit('hostAuth', { required: false }); }
    else { sock.data.pinFails++; setTimeout(() => ack({ ok: false, error: 'PIN falsch.' }), 800); if (sock.data.pinFails >= 5) setTimeout(() => sock.disconnect(true), 900); }
  });
  const H = (ev, fn) => sock.on(ev, (...a) => { if (!hostAllowed(sock)) return sock.emit('hostError', 'Spielleitung: bitte zuerst die PIN eingeben.'); fn(...a); });
  H('host:start', () => { if (G.phase === 'lobby' && G.players.length >= R().minPlayers) { G.phase = 'playing'; G.turn = 0; log('Spiel gestartet!'); broadcast(); } });
  H('host:judge', c => judge(!!c));
  H('host:rollFor', () => { const p = cur(); if (p) doRoll(p); });
  H('host:skipTurn', () => { if (G.phase === 'playing') { G.pending = null; G.busy = false; log(`${cur().name} wurde übersprungen.`); endTurn(); } });
  H('host:kick', id => {
    const i = G.players.findIndex(x => x.id === id); if (i < 0) return;
    const wasCur = i === G.turn; log(`${G.players[i].name} wurde entfernt.`); G.players.splice(i, 1);
    if (i < G.turn) G.turn--; if (G.turn >= G.players.length) G.turn = 0;
    if (wasCur) { G.epoch = (G.epoch || 0) + 1; G.pending = null; G.busy = false; }
    if (G.phase === 'playing' && G.players.length === 0) newGame(false); broadcast();
  });
  if (process.env.TEST_HOOKS) H('test:setPos', (id, pos) => { const p = G.players.find(x => x.id === id); if (p) { p.pos = pos; broadcast(); } }); // nur fuer Tests
  H('host:reset', keep => { newGame(!!keep); log(keep ? 'Neue Runde mit denselben Spielern.' : 'Neues Spiel.'); broadcast(); });
  H('host:reload', () => { try { board = readJSON('board.json'); cards = readJSON('cards.json'); newGame(true); log('Konfiguration neu geladen.'); io.emit('reloadConfig'); broadcast(); } catch (e) { sock.emit('hostError', 'Fehler in JSON: ' + e.message); } });
});

app.get('/healthz', (q, s) => s.send('ok'));
server.listen(PORT, '0.0.0.0', () => {
  const ips = lanIPs();
  console.log('\n  BERUFE-RALLYE läuft!');
  console.log(`  Beamer/Spielleitung:  http://localhost:${PORT}/host`);
  console.log(`  Handys beitreten:     ${ips.length ? ips.map(i => `http://${i.address}:${PORT}/`).join('  oder  ') : `http://localhost:${PORT}/`}`);
  if (PUBLIC_URL) console.log(`  Öffentliche Adresse:  ${PUBLIC_URL}/  (Beamer: ${PUBLIC_URL}/host)`);
  console.log(ONLINE ? `  Spielleitungs-PIN:    ${HOST_PIN}` : `  Spielleitungs-PIN (nur für Zugriff über Tunnel/anderes Gerät): ${HOST_PIN}`);
  console.log('  Fenster offen lassen. Beenden mit Strg+C.\n');
  if (process.env.OPEN_BROWSER) require('child_process').exec(`start "" "http://localhost:${PORT}/host"`);
});
