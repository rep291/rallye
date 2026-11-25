// Visuelle Pruefung: Figuren auf Feldern des GAD-Bretts. Start: TEST_HOOKS=1 PORT=3300 node server.js
const { chromium } = require('playwright-core'); const { io } = require('socket.io-client');
const URL = 'http://localhost:3300', OUT = __dirname + '/../screens/'; const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const host = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  await host.goto(URL + '/host?debug=1'); await host.waitForFunction(() => roomCode && S && S.room); await sleep(800);
  const code = await host.evaluate(() => roomCode), htok = await host.evaluate(() => localStorage.getItem('rallye_host_token'));
  const h = io(URL); await new Promise(r => h.on('connect', r)); await new Promise(r => h.emit('host:open', { token: htok }, r));
  await host.screenshot({ path: OUT + 'mapping_alle_felder_debug.png' });
  const ids = [];
  for (const n of ['Anna', 'Ben', 'Cem']) { const c = io(URL, { forceNew: true }); await new Promise(r => c.emit('join', { name: n, room: code }, x => { ids.push(x.id); r(); })); }
  await sleep(300); h.emit('host:start'); await sleep(300);
  const svg = await host.$('#board');
  for (const pos of [0, 1, 33, 50, 99, 100, 101]) {
    h.emit('test:setPos', ids[0], pos); h.emit('test:setPos', ids[1], pos); h.emit('test:setPos', ids[2], pos === 101 ? 101 : Math.min(100, pos + 1));
    await sleep(2500);
    const f = await host.evaluate(p => board.fields[p], pos); const bb = await svg.boundingBox(); const k = bb.width / 865;
    const clip = { x: Math.max(0, bb.x + (f.x - 45) * k), y: Math.max(0, bb.y + (f.y - 35) * k), width: 90 * k, height: 70 * k };
    await host.screenshot({ path: OUT + `figur_feld_${String(pos).padStart(3, '0')}.png`, clip });
  }
  h.emit('test:setPos', ids[0], 33); h.emit('test:setPos', ids[1], 56); h.emit('test:setPos', ids[2], 86); await sleep(2500);
  await (await b.newPage()).close();
  await host.goto(URL + '/host'); await sleep(1500);
  await host.screenshot({ path: OUT + '12_host_brett_figuren.png' });
  await b.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
