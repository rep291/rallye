// Headless-Test: 3 Spieler treten bei und spielen per socket.io-client bis zum Sieg.
// Start: FAST=1 PORT=3100 node server.js  &  node tests/game_test.js
const { io } = require('socket.io-client');
const URL = process.env.URL || 'http://localhost:3100';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PROXY = process.env.PROXY_SIM ? { extraHeaders: { 'x-forwarded-for': '203.0.113.7' } } : {};
const host = io(URL, PROXY); let S = null; const allLog = new Set(); host.on('state', s => { S = s; s.log.forEach(l => allLog.add(l.t + ' ' + l.msg)); });
const stats = { games: 0, rolls: 0, actions: 0, questions: 0, right: 0, wrong: 0, reconnects: 0, hostJudged: 0 };
const names = ['Anna', 'Ben', 'Cem']; let ROOMC = process.env.ROOM || '';
function mkPlayer(name, token) {
  const c = io(URL, Object.assign({ forceNew: true }, PROXY)); const P = { name, c, id: null, token };
  c.on('connect', () => c.emit('join', token ? { token, room: ROOMC } : { name, room: ROOMC }, r => { if (!r.ok) throw new Error(r.error); P.id = r.id; P.token = r.token; }));
  return P;
}
(async () => {
  await new Promise(r => host.on('connect', r));
  if (process.env.HOST_PIN) {
    const no = await new Promise(r => host.emit('host:open', {}, r)); if (no.ok) throw new Error('Lobby ohne PIN eröffnet');
    const bad = await new Promise(r => host.emit('host:auth', '000000', r)); if (bad.ok) throw new Error('falsche PIN akzeptiert');
    const ok = await new Promise(r => host.emit('host:auth', process.env.HOST_PIN, r)); if (!ok.ok) throw new Error('PIN abgelehnt');
    console.log('PIN-Schutz ok: ohne/mit falscher PIN gesperrt, richtige PIN akzeptiert');
  }
  const op = await new Promise(r => host.emit('host:open', {}, r)); if (!op.ok) throw new Error('Lobby: ' + op.error); ROOMC = op.code; console.log('Eigene Lobby:', ROOMC);
  const players = names.map(n => mkPlayer(n));
  await sleep(600);
  if (S.players.length !== 3) throw new Error('Nicht alle beigetreten');
  console.log('Lobby:', S.players.map(p => `${p.name}(${p.color})`).join(', '));
  host.emit('host:start'); await sleep(200);
  if (S.phase !== 'playing') throw new Error('Start fehlgeschlagen');
  let lastSeq = -1, t0 = Date.now(), seenCard = new Set(), turnHist = [];
  while (S.phase !== 'finished') {
    if (Date.now() - t0 > 120000) throw new Error('Timeout');
    await sleep(15);
    if (S.seq === lastSeq) continue; lastSeq = S.seq;
    const cur = S.players[S.turn], P = players.find(p => p.id === cur.id), pd = S.pending;
    if (pd && pd.type === 'question' && pd.stage === 'group' && !seenCard.has('g' + S.seq)) {
      seenCard.add('g' + S.seq); if (pd.answer !== null) throw new Error('Antwort vor der Gruppenabstimmung sichtbar');
      for (const o of players.filter(p => p.id !== pd.playerId)) if (!o.voted || o.voted !== pd.card.id + S.lastRoll.at) { o.voted = pd.card.id + S.lastRoll.at; o.c.emit('vote', Math.floor(Math.random() * pd.card.answers.length)); }
      stats.groupVotes = (stats.groupVotes || 0) + 1; continue;
    }
    if (pd && pd.type === 'question' && !pd.resolved && pd.stage === 'personal' && !seenCard.has(S.seq)) {
      seenCard.add(S.seq); stats.questions++;
      const owner = players.find(p => p.id === pd.playerId);
      if (pd.card.answers.length === 2) stats.twoAnswerCards = (stats.twoAnswerCards || 0) + 1;
      const a = Math.floor(Math.random() * pd.card.answers.length); owner.c.emit('answer', a);
      continue;
    }
    if (pd && pd.type === 'question' && !pd.resolved && pd.stage === 'reveal' && !seenCard.has('j' + S.seq)) {
      if (pd.answer === null || !pd.groupCounts || pd.groupCounts.reduce((a, b) => a + b, 0) !== pd.groupTotal) throw new Error('Auflösung unvollständig');
      // Spielleitung entscheidet nach Besprechung (keine feste richtige Antwort)
      seenCard.add('j' + S.seq); if (pd.card.correct !== null || !pd.card.hostDecides) throw new Error('richtige Antwort sollte nicht feststehen');
      { const v = Math.floor(Math.random() * 11) - 5; host.emit('host:judge', v); (stats.bewertungen = stats.bewertungen || {})[v] = (stats.bewertungen[v] || 0) + 1; } stats.hostJudged++; continue;
    }
    if (pd && pd.type === 'question' && pd.resolved && !seenCard.has('r' + S.seq)) { seenCard.add('r' + S.seq); pd.delta > 0 ? stats.right++ : stats.wrong++; if (Math.abs(pd.delta) > 5) throw new Error('Bewertung ausserhalb ±5'); }
    if (pd && pd.type === 'action' && !seenCard.has('a' + pd.card.id + S.lastRoll.at)) { seenCard.add('a' + pd.card.id + S.lastRoll.at); stats.actions++; (stats.effekte = stats.effekte || {})[pd.card.effectLabel] = ((stats.effekte || {})[pd.card.effectLabel] || 0) + 1; }
    if (pd && pd.type === 'info' && !pd.sliding && !seenCard.has('i' + S.seq)) { seenCard.add('i' + S.seq); stats[pd.kind] = (stats[pd.kind] || 0) + 1; }
    if (!pd && !S.busy) {
      // Reconnect-Test: nach 10 Wuerfen trennt Ben die Verbindung und kommt mit Token zurueck
      if (stats.rolls === 10 && !stats.reconnects) {
        const b = players[1]; const pos = S.players.find(p => p.id === b.id).pos; b.c.disconnect(); await sleep(150);
        if (S.players.find(p => p.id === b.id).connected) throw new Error('Disconnect nicht erkannt');
        const nb = mkPlayer(b.name, b.token); players[1] = nb; await sleep(300);
        if (nb.id !== b.id) throw new Error('Reconnect bekam neue ID');
        if (S.players.find(p => p.id === b.id).pos !== pos) throw new Error('Position verloren');
        stats.reconnects++; console.log('Reconnect ok: Ben wieder verbunden auf Feld', pos); lastSeq = -1; continue;
      }
      // Falscher Spieler darf nicht wuerfeln
      const other = players.find(p => p.id !== cur.id); const before = S.seq; other.c.emit('roll'); await sleep(30);
      if (S.lastRoll && S.lastRoll.playerId === other.id && S.seq !== before && S.players[S.turn].id !== other.id) throw new Error('Falscher Spieler konnte würfeln');
      P.c.emit('roll'); stats.rolls++; turnHist.push(cur.name);
      await sleep(30);
    }
  }
  console.log('Sieger:', S.winner.name, '| Rangliste:', S.winner.ranking.map(r => `${r.name}:${r.pos}`).join(', '));
  console.log('Statistik:', JSON.stringify(stats));
  console.log('Letzte Log-Zeilen:\n  ' + S.log.slice(0, 6).map(l => l.msg).join('\n  '));
  if (S.winner.ranking[0].pos !== S.last) throw new Error('Sieger nicht auf Ziel');
  for (const k of ['actions', 'questions', 'rutsche', 'finanzpolizei']) if (!stats[k]) throw new Error('Nicht vorgekommen: ' + k);
  const L = [...allLog]; console.log('Finanzpolizei: eingesperrt', L.filter(m => m.includes('ist bei der Finanzpolizei')).length, '| ohne 6 geblieben', L.filter(m => m.includes('keine 6')).length, '| mit 6 frei', L.filter(m => m.includes('– frei')).length, '| Rutschen', L.filter(m => m.includes('Rutsche auf')).length);
  console.log('Finanzpolizei-Log:\n  ' + [...allLog].filter(m => m.includes('🚓')).map(m => m.replace(/^\d+ /, '')).join('\n  '));
    if (!stats.groupVotes) throw new Error('keine Gruppenabstimmung');
  if (!S.history || S.history.filter(h => h.type === 'question').length !== stats.hostJudged) throw new Error('Auswertung unvollständig: ' + (S.history || []).length);
  console.log('Auswertung:', S.history.length, 'Situationen,', S.history.filter(h => h.type === 'question').length, 'Fragen mit Gruppenverteilung');
  console.log('TEST OK');
  process.exit(0);
})().catch(e => { console.error('TEST FEHLER:', e.message); process.exit(1); });
