// Spielstand-Test: Server mit STATE_FILE starten, spielen, Server beenden, neu starten -> Spiel muss weiterlaufen
const { spawn } = require('child_process'); const { io } = require('socket.io-client'); const fs = require('fs');
const FILE = '/tmp/rallye_state_test.json', PORT = 3600, URL = 'http://localhost:' + PORT;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const start = () => { const s = spawn(process.execPath, [__dirname + '/../server.js'], { env: { ...process.env, PORT, STATE_FILE: FILE, FAST: '1', NO_SAVE: '' } }); return new Promise(r => s.stdout.on('data', d => { if (/http/.test(d)) r(s); })); };
const conn = () => new Promise(r => { const c = io(URL, { reconnection: false }); c.on('state', st => c.S = st); c.on('connect', () => r(c)); });
(async () => {
  try { fs.unlinkSync(FILE); } catch {}
  let srv = await start(); const toks = [];
  const h = await conn(); let S = h.S; h.on('state', s => S = s); const op = await new Promise(r => h.emit('host:open', {}, r)); const code = op.code;
  for (const n of ['Anna', 'Ben', 'Cem']) { const c = await conn(); toks.push(await new Promise(r => c.emit('join', { name: n, room: code }, a => r(a.token)))); }
  await sleep(200); h.emit('host:start'); await sleep(300);
  for (let k = 0; k < 6; k++) { const c = await conn(); await new Promise(r => c.emit('join', { token: toks[S.turn], room: code }, r)); c.emit('roll'); await sleep(600); if (S.pending && S.pending.type === 'question') { c.emit('answer', 0); await sleep(150); h.emit('host:revealVotes'); await sleep(150); h.emit('host:judge', 2); } await sleep(300); c.close(); }
  console.log('gespielt');await sleep(800); const before = JSON.stringify(S.players.map(p => [p.name, p.pos, p.figure]));
  srv.kill(); await sleep(500);
  srv = await start(); console.log('neu gestartet'); const h2 = await conn(); const op2 = await new Promise(r => h2.emit('host:open', { token: op.token }, r)); await sleep(500); const S2 = h2.S; if (op2.code !== code || !op2.resumed) { console.log('Raum nicht wiederhergestellt', op2); process.exit(1); }
  const after = JSON.stringify(S2.players.map(p => [p.name, p.pos, p.figure]));
  console.log('vorher', before, '\nnachher', after, 'Phase', S2.phase);
  const c = await conn(); const rj = await new Promise(r => c.emit('join', { token: toks[0], room: code }, r));
  srv.kill();
  if (before !== after || S2.phase !== 'playing' || !rj.ok) { console.log('RESTORE FEHLER', rj); process.exit(1); }
  console.log('RESTORE TEST OK (Raum ' + code + ' + Host-Token + Handy-Token gelten weiter)'); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
