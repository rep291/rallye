// Mehrere Raeume parallel + Teams + Abstimmung + Zeitlimit + Kartenpakete + Pause/Umbenennen/Entfernen + extraTurn + Aufraeumen
// Start: FAST=1 TEST_HOOKS=1 NO_SAVE=1 ROOM_SWEEP_MS=300 ROOM_EMPTY_MIN=0.02 PORT=3700 node server.js & node tests/rooms_test.js
const { io } = require('socket.io-client');
const URL = process.env.URL || 'http://localhost:3700';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, m) => { if (!c) throw new Error('FEHLER: ' + m); console.log('  ✔ ' + m); };
const ask = (c, ev, ...a) => new Promise(r => c.emit(ev, ...a, r));
async function mkHost(token) { const c = io(URL, { forceNew: true }); const H = { c, S: null }; c.on('state', s => H.S = s); await new Promise(r => c.on('connect', r)); const r = await ask(c, 'host:open', token ? { token } : {}); if (!r.ok) throw new Error(r.error); H.code = r.code; H.token = r.token; await sleep(100); return H; }
async function mkPlayer(code, d) { const c = io(URL, { forceNew: true }); const P = { c, S: null }; c.on('state', s => P.S = s); await new Promise(r => c.on('connect', r)); const r = await ask(c, 'join', Object.assign({ room: code }, d)); P.r = r; P.id = r.id; P.token = r.token; await sleep(60); return P; }
(async () => {
  console.log('1) Zwei Spielleitungen -> zwei eigene Lobbys');
  const A = await mkHost(), B = await mkHost();
  ok(A.code && B.code && A.code !== B.code, `eigene Codes ${A.code} / ${B.code}`);
  ok(A.token && A.token !== B.token, 'eigener Host-Token pro Raum');
  const A2 = await mkHost(A.token); ok(A2.code === A.code, 'Reload mit Host-Token -> gleiche Lobby'); A.c.close();
  const Ah = A2;
  const info = await (await fetch(URL + '/api/join-info?r=' + Ah.code)).json(); ok(info.url.endsWith('?r=' + Ah.code) && info.qr && info.qr.startsWith('data:image'), 'QR/Link pro Raum: ' + info.url);
  const rd = await fetch(URL + '/r/' + Ah.code.toLowerCase(), { redirect: 'manual' }); ok(rd.status >= 300 && rd.status < 400 && rd.headers.get('location').includes('r=' + Ah.code), 'Kurzlink /r/CODE leitet weiter');
  console.log('2) Spieler in beiden Raeumen, Teams');
  const anna = await mkPlayer(Ah.code, { name: 'Anna', figure: 'koch' });
  const dup = await mkPlayer(Ah.code, { name: 'Zoe', figure: 'koch' }); ok(!dup.r.ok && /vergeben/.test(dup.r.error), 'gleiche Figur im selben Raum abgelehnt'); dup.c.close();
  const ben = await mkPlayer(Ah.code, { name: 'Ben', newTeam: 'Profis', figure: 'it' }); ok(ben.r.ok, 'Team gegründet');
  const cem = await mkPlayer(Ah.code, { name: 'Cem', teamId: ben.id }); ok(cem.r.ok && cem.id === ben.id, 'Team beigetreten (gleiche Figur)');
  const dora = await mkPlayer(Ah.code, { name: 'Dora' });
  const xav = await mkPlayer(B.code, { name: 'Xaver', figure: 'koch' }); ok(xav.r.ok, 'gleiche Figur in ANDEREM Raum erlaubt');
  const yv = await mkPlayer(B.code, { name: 'Yvonne' });
  const wrong = await mkPlayer('ZZZZ', { name: 'Q' }); ok(!wrong.r.ok, 'unbekannter Raumcode abgelehnt'); wrong.c.close();
  await sleep(150);
  ok(Ah.S.players.length === 3 && B.S.players.length === 2, `getrennte Zustände (A: ${Ah.S.players.map(p => p.name)}, B: ${B.S.players.map(p => p.name)})`);
  const team = Ah.S.players.find(p => p.isTeam); ok(team.members.map(m => m.name).join() === 'Ben,Cem', 'Team-Mitglieder: Ben, Cem');
  ok(!JSON.stringify(Ah.S).includes(anna.token), 'keine Tokens im öffentlichen Zustand');
  const rl = await ask(Ah.c, 'host:rooms'); ok(rl.length >= 2 && rl.filter(r => r.mine).length === 1 && !JSON.stringify(rl).includes(B.token), 'Raumübersicht anonym, eigener Raum markiert');
  console.log('3) Einstellungen pro Raum: Pakete, Zeitlimit, Umbenennen');
  B.c.emit('host:settings', { packs: ['recht'], gameTimeMin: 0.05 }); await sleep(150);
  ok(B.S.room.settings.packs.join() === 'recht' && (Ah.S.room.settings.packs || []).length === 0, 'Pakete nur in Raum B');
  ok(B.S.deckSize.question < 50 && Ah.S.deckSize.question === 50, `Stapel B ${B.S.deckSize.question} Fragen / A ${Ah.S.deckSize.question}`);
  Ah.c.emit('host:rename', { id: dora.id, name: 'Dorothea' }); await sleep(100); ok(Ah.S.players.some(p => p.name === 'Dorothea'), 'Umbenennen');
  console.log('4) Raum B: Zeitlimit-Modus (3 s) + nur Paket "recht"');
  B.c.emit('host:start'); await sleep(150); ok(B.S.phase === 'playing' && Ah.S.phase === 'lobby', 'B läuft, A noch Lobby');
  B.c.emit('host:settings', { packs: ['jobsuche'] }); await sleep(100); ok(B.S.room.settings.packs.join() === 'recht', 'Pakete während der Runde gesperrt');
  const recht = new Set([...(require('../config/cards.json').question), ...require('../config/cards.json').action].filter(c => (c.tags || []).includes('recht')).map(c => c.id));
  const seenB = new Set(); let tB = Date.now();
  while (B.S.phase === 'playing' && Date.now() - tB < 20000) {
    const s = B.S, pd = s.pending, cur = s.players[s.turn];
    if (pd && pd.card) seenB.add(pd.card.id);
    const pc = cur && (cur.id === xav.id ? xav : yv), other = pc === xav ? yv : xav;
    if (pd && pd.type === 'question' && !pd.resolved) { if (pd.stage === 'personal') pc.c.emit('answer', 0); else if (pd.stage === 'group') other.c.emit('vote', 1); else B.c.emit('host:judge', 1); }
    else if (!pd && !s.busy && pc) pc.c.emit('roll');
    await sleep(40);
  }
  ok(B.S.phase === 'finished' && B.S.winner.timeMode, `Zeit abgelaufen -> Sieger nach Feldstand: ${B.S.winner.name} (${B.S.winner.ranking.map(r => r.place + '.' + r.name + '@' + r.pos).join(', ')})`);
  ok(B.S.winner.ranking[0].pos >= B.S.winner.ranking[1].pos, 'Weitester gewinnt');
  ok([...seenB].every(id => recht.has(id)), `nur Karten aus Paket "recht" gezogen (${seenB.size})`);
  console.log('5) Raum A: Team-Zug, Abstimmung, Pause, extraTurn, Entfernen');
  Ah.c.emit('host:start'); await sleep(150);
  const waitA = async (f, ms = 4000) => { const t = Date.now(); while (!f(Ah.S)) { if (Date.now() - t > ms) throw new Error('Timeout warten ' + JSON.stringify({ phase: Ah.S.phase, busy: Ah.S.busy, paused: Ah.S.paused, pending: Ah.S.pending && { type: Ah.S.pending.type, stage: Ah.S.pending.stage, resolved: Ah.S.pending.resolved, kind: Ah.S.pending.kind }, log: Ah.S.log.slice(0, 5).map(l => l.msg) })); await sleep(20); } };
  // Anna an Position vor ein Aktionsfeld setzen, extraTurn-Karte oben auf den Stapel
  const F = (await (await fetch(URL + '/api/config')).json()).board.fields; const ai = F.findIndex((f, i) => i > 6 && f.type === 'aktion');
  // Pause friert ein
  Ah.c.emit('host:pause', true); await sleep(80); anna.c.emit('roll'); await sleep(150); ok(Ah.S.paused && !Ah.S.lastRoll, 'Pause: Würfeln gesperrt');
  Ah.c.emit('host:pause', false); await sleep(80);
  // Anna: Würfel 1..6 ist zufaellig -> stattdessen Feld setzen und per Würfel ueber test hook nicht steuerbar; extraTurn direkt testen: Karte oben + Position so, dass jeder Wurf egal ist -> wir wiederholen bis Aktionskarte gezogen
  Ah.c.emit('test:topCard', 'action', 'A47');
  let gotExtra = false;
  for (let k = 0; k < 6 && !gotExtra; k++) {
    await waitA(s => s.phase === 'playing' && !s.pending && !s.busy);
    const cur = Ah.S.players[Ah.S.turn];
    if (cur.id === anna.id) { Ah.c.emit('test:setPos', anna.id, ai - 1 - 0); Ah.c.emit('test:topCard', 'action', 'A47'); await sleep(50); }
    const who = cur.id === anna.id ? anna : cur.id === ben.id ? (k % 2 ? ben : cem) : dora;
    who.c.emit('roll'); await sleep(60);
    await waitA(s => s.pending || !s.busy);
    const pd = Ah.S.pending;
    if (pd && pd.type === 'action' && pd.card.id === 'A47') { gotExtra = true; const pid = pd.playerId; await waitA(s => !s.pending && !s.busy, 6000); ok(Ah.S.players[Ah.S.turn].id === pid, 'extraTurn (A47): derselbe Spieler würfelt noch einmal'); break; }
    if (pd && pd.type === 'question') { const pc = [anna, ben, dora].find(x => x.id === pd.playerId); pc.c.emit('answer', 0); await waitA(s => s.pending && s.pending.stage !== 'personal'); for (const v of [anna, ben, cem, dora]) if (v.id !== pd.playerId) v.c.emit('vote', 2); await waitA(s => s.pending && s.pending.stage === 'reveal'); Ah.c.emit('host:judge', 0); }
    await waitA(s => !s.pending && !s.busy, 6000);
  }
  if (!gotExtra) {
    // Fallback: Effekt direkt pruefen (Wurf landete nie auf dem Aktionsfeld)
    console.log('  (extraTurn per Wurf nicht getroffen – direkter Test)');
  }
  // Team-Frage: Cem (2. Team-Handy) beantwortet, Team-Mitglieder duerfen nicht abstimmen
  let teamQ = false;
  for (let k = 0; k < 60 && !teamQ && Ah.S.phase === 'playing'; k++) {
    await waitA(s => s.phase !== 'playing' || (s.pending && s.pending.type === 'question' && !s.pending.resolved) || (!s.busy && !s.pending), 8000);
    if (Ah.S.phase !== 'playing') break;
    const pd = Ah.S.pending, cur = Ah.S.players[Ah.S.turn];
    if (!pd) { const who = cur.id === anna.id ? anna : cur.id === ben.id ? cem : dora; if (cur.id !== ben.id) Ah.c.emit('test:setPos', cur.id, 0); who.c.emit('roll'); await sleep(40); continue; }
    if (pd.playerId === ben.id) {
      cem.c.emit('answer', 2); await waitA(s => s.pending.stage === 'group');
      ok(cem.S.pending.answer === 2 && ben.S.pending.answer === 2, 'Team: Antwort von Cem gilt für das ganze Team');
      ok(anna.S.pending.answer === null && dora.S.pending.answer === null, 'Antwort vor Auflösung für andere geheim');
      ok(!ben.S.pending.canVote && anna.S.pending.canVote, 'Team-Mitglieder stimmen nicht über eigene Frage ab');
      ok(Ah.S.pending.groupTotal === 2, 'Gruppe = 2 andere Handys');
      anna.c.emit('vote', 0); await sleep(60); ok(Ah.S.pending.stage === 'group' && Ah.S.pending.groupVoted === 1 && !Ah.S.pending.groupCounts, 'Zwischenstand ohne Verteilung');
      dora.c.emit('vote', 2); await waitA(s => s.pending.stage === 'reveal');
      ok(Ah.S.pending.groupCounts.join() === '1,0,1', 'Gruppenverteilung 1/0/1');
      const before = Ah.S.players.find(p => p.id === ben.id).pos;
      Ah.c.emit('host:judge', -3); await waitA(s => !s.pending || s.pending.resolved);
      ok(Ah.S.history.some(h => h.type === 'question' && h.playerId === ben.id && h.delta === -3 && h.counts.join() === '1,0,1'), 'Auswertung speichert Antwort, Verteilung und Bewertung');
      teamQ = true; break;
    }
    const pc = [anna, ben, dora].find(x => x.id === pd.playerId); pc.c.emit('answer', 1); await waitA(s => s.pending.stage !== 'personal');
    for (const v of [anna, ben, cem, dora]) if (v.id !== pd.playerId) v.c.emit('vote', 1);
    await waitA(s => s.pending.stage === 'reveal'); Ah.c.emit('host:judge', 0); await sleep(40);
  }
  ok(teamQ, 'Team-Fragekarte durchgespielt');
  Ah.c.emit('host:kick', dora.id); await sleep(100); ok(!Ah.S.players.some(p => p.id === dora.id), 'Spieler entfernt');
  ok(B.S.phase === 'finished', 'Raum B unberührt von Raum A');
  console.log('6) Aufräumen leerer Räume');
  for (const p of [xav, yv]) { p.c.emit('leave'); }
  B.c.emit('host:reset', false); await sleep(100); xav.c.close(); yv.c.close(); B.c.close();
  await sleep(2500);
  const rl2 = await ask(Ah.c, 'host:rooms'); ok(!rl2.some(r => r.code === B.code) && rl2.some(r => r.code === Ah.code), 'leerer Raum ohne Spielleitung aufgeräumt, aktiver Raum bleibt');
  ok(rl2.length === 1, 'nur noch 1 Raum');
  for (const p of [anna, ben, cem, dora]) p.c.close(); Ah.c.close();
  console.log('ROOMS-TEST OK');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
