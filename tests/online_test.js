// Browser-Test Online-Modus: PIN-Abfrage am Beamer, oeffentliche URL im QR-Code, Beitritt + Spielzug.
// Start: ONLINE=1 HOST_PIN=482913 PUBLIC_URL=https://berufe-rallye.onrender.com PORT=3400 node server.js
const { chromium } = require('playwright-core'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const URL = process.env.URL || 'http://localhost:3400', OUT = __dirname + '/../screens/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const host = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  await host.goto(URL + '/host'); await sleep(1200);
  if (!await host.isVisible('#pinov.show')) throw new Error('PIN-Abfrage fehlt');
  await host.screenshot({ path: OUT + '16_online_pin.png' });
  await host.fill('#pin', '111111'); await host.click('#pinov button'); await sleep(1300);
  const err = await host.textContent('#pinerr'); if (!/falsch/i.test(err)) throw new Error('falsche PIN nicht abgewiesen');
  await host.fill('#pin', process.env.HOST_PIN || '482913'); await host.click('#pinov button'); await sleep(800);
  if (await host.isVisible('#pinov.show')) throw new Error('PIN nicht akzeptiert');
  await host.waitForFunction(() => roomCode); const code = await host.evaluate(() => roomCode);
  const url = await host.textContent('#url'); console.log('Join-URL am Beamer:', url); if (!url.includes('?r=' + code) || !url.startsWith('https://berufe-rallye.onrender.com')) throw new Error('Join-URL falsch');
  if ((await host.content()).includes(process.env.HOST_PIN || '482913')) throw new Error('PIN sichtbar im Beamer-HTML');
  const phones = [];
  for (const n of ['Anna', 'Ben', 'Cem']) { const p = await (await b.newContext({ viewport: { width: 390, height: 780 }, isMobile: true })).newPage(); await p.goto(URL + '/?r=' + code); await p.fill('#name', n); await p.click('#joinBtn'); await sleep(300); phones.push(p); }
  await sleep(500); await host.screenshot({ path: OUT + '17_online_lobby.png' });
  await host.click('text=Spiel starten'); await sleep(600);
  await phones[0].click('#rollBtn'); await sleep(2500);
  const S = await host.evaluate(() => S); console.log('Spielzug:', S.log[0].msg, '| Phase', S.phase);
  if (!S.lastRoll) throw new Error('kein Wurf');
  // Neuladen am Beamer: PIN bleibt in der Sitzung gespeichert
  await host.reload(); await sleep(1500); if (await host.isVisible('#pinov.show')) throw new Error('PIN nach Reload erneut gefragt'); await host.waitForFunction(() => roomCode); if (await host.evaluate(() => roomCode) !== code) throw new Error('Reload: anderer Raum');
  console.log('ONLINE-TEST OK'); await b.close();
})().catch(e => { console.error('FEHLER', e.message); process.exit(1); });
