// Screenshots Finanzpolizei-Blaulicht und Rutsche mit Berufsfiguren. Start: TEST_HOOKS=1 NO_SAVE=1 PORT=3500 node server.js
const { chromium } = require('playwright-core'); const { io } = require('socket.io-client');
const URL = 'http://localhost:3500', OUT = __dirname + '/../screens/'; const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const host = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage(); await host.goto(URL + '/host'); await host.waitForFunction(() => roomCode && S && S.room);
  const code = await host.evaluate(() => roomCode), htok = await host.evaluate(() => localStorage.getItem('rallye_host_token'));
  const h = io(URL); await new Promise(r => h.on('connect', r)); await new Promise(r => h.emit('host:open', { token: htok }, r));
  const ids = []; for (const [n, f] of [['Anna', 'polizei'], ['Ben', 'arzt']]) { const c = io(URL, { forceNew: true }); await new Promise(r => c.emit('join', { name: n, figure: f, room: code }, x => { ids.push(x.id); r(); })); }
  await sleep(300); h.emit('host:start'); await sleep(300);
  const F = require('../config/board.json').fields, fp = F.find(f => f.type === 'finanzpolizei'), ru = F.find(f => f.type === 'rutsche');
  h.emit('test:setPos', ids[0], fp.id, false); await sleep(6000);
  const svg = await host.$('#board'); let bb = await svg.boundingBox(), k = bb.width / 865;
  const clip = f => ({ x: bb.x + (f.x - 75) * k, y: bb.y + (f.y - 80) * k, width: 150 * k, height: 120 * k });
  await host.screenshot({ path: OUT + '33a_fp_feld_mit_gefaengnis.png', clip: clip(fp) });
  h.emit('test:setPos', ids[0], fp.id, true); await sleep(650);
  await host.screenshot({ path: OUT + '33b_fp_wird_abgefuehrt.png', clip: clip(fp) });
  await sleep(2000); await host.screenshot({ path: OUT + '33_figur_finanzpolizei.png', clip: clip(fp) });
  await host.reload(); await sleep(1500); bb = await (await host.$('#board')).boundingBox();
  await host.screenshot({ path: OUT + '33c_fp_nach_reload.png', clip: clip(fp) });
  h.emit('test:setPos', ids[0], fp.id + 6, false); await sleep(450);
  await host.screenshot({ path: OUT + '33d_fp_frei.png', clip: clip(fp) });
  h.emit('test:setPos', ids[1], ru.id); await sleep(6000);
  await host.evaluate(([id, from, to]) => { const pl = S.players.map(p => p.id === id ? { ...p, pos: to } : p); view.update(pl, { stepMs: S.stepMs, lastMove: { playerId: id, kind: 'slide', from, to } }); }, [ids[1], ru.id, ru.to]);
  await sleep(650); const T = F[ru.to];
  await host.screenshot({ path: OUT + '34_figur_rutscht.png', clip: { x: bb.x + (Math.min(ru.x, T.x) - 40) * k, y: bb.y + (Math.min(ru.y, T.y) - 50) * k, width: (Math.abs(ru.x - T.x) + 80) * k, height: (Math.abs(ru.y - T.y) + 80) * k } });
  await b.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
