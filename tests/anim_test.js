// Browser-Test Animationen: Figurwahl, kompakte Ansicht, Würfel, Figur in Bewegung, Siegerehrung, Host-Reload
// Start: TEST_HOOKS=1 NO_SAVE=1 PORT=3500 node server.js & node tests/anim_test.js
const { chromium } = require('playwright-core');
const URL = process.env.URL || 'http://localhost:3500';
const OUT = __dirname + '/../screens/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const host = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  host.on('pageerror', e => errors.push('host: ' + e.message));
  await host.goto(URL + '/host'); await host.waitForFunction(() => roomCode && S && S.room); const code = await host.evaluate(() => roomCode);
  const phones = [], figs = ['lager', 'koch', 'friseur'], figNames = ['Lagerlogistik', 'Koch/Köchin', 'Friseur/in'];
  for (const [i, n] of ['Anna', 'Ben', 'Cem'].entries()) {
    const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
    p.on('pageerror', e => errors.push(n + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto(URL + '/?r=' + code); await sleep(300); await p.fill('#name', n);
    await p.click(`#figBox button:has-text("${figNames[i]}")`);
    await p.click('#colorsBox button >> nth=' + (i === 2 ? 3 : 0)); await sleep(150);
    if (n === 'Cem') { await p.screenshot({ path: OUT + '20_handy_figurwahl.png' }); const shown = await p.$$eval('#figBox button', b => b.length); console.log('Figuren zur Auswahl für Cem:', shown, '(2 schon vergeben)'); if (shown !== 20) throw new Error('vergebene Figuren werden angezeigt'); }
    await p.click('#joinBtn'); await sleep(300); phones.push(p);
  }
  await sleep(500);
  let S = await host.evaluate(() => S);
  const got = S.players.map(p => p.figure).join(',');
  if (got !== figs.join(',')) throw new Error('Figuren falsch: ' + got);
  if (new Set(S.players.map(p => p.color)).size !== 3) throw new Error('Farben doppelt');
  await phones[0].screenshot({ path: OUT + '21_handy_lobby_figur.png' });
  await host.screenshot({ path: OUT + '22_host_lobby_figuren.png' });
  await host.click('text=Spiel starten'); await sleep(900);
  if (!(await host.evaluate(() => document.getElementById('hostroot').classList.contains('compact')))) throw new Error('nicht kompakt');
  await host.screenshot({ path: OUT + '23_host_spiel_kompakt.png' });
  await host.click('#menubtn'); await sleep(400); await host.screenshot({ path: OUT + '24_host_menue_offen.png' }); await host.click('#menubtn'); await sleep(300);
  // ein Zug mit Würfel + Bewegung
  S = await host.evaluate(() => S);
  const i0 = S.turn;
  await phones[i0].click('#rollBtn'); await sleep(350);
  await host.screenshot({ path: OUT + '25_host_wuerfel.png' });
  await phones[i0].screenshot({ path: OUT + '26_handy_wuerfel.png' });
  S = await host.evaluate(() => S);
  let mv = false;
  for (let k = 0; k < 60 && !mv; k++) { mv = await host.evaluate(() => view && view.moving && view.moving()); if (!mv) await sleep(50); }
  await sleep(120);
  await host.screenshot({ path: OUT + '27_host_figur_unterwegs.png' });
  console.log('Bewegung läuft beim Screenshot:', mv, 'Wurf', S.lastRoll && S.lastRoll.value);
  // Host-Reload mitten im Spiel
  await sleep(2500); await host.reload(); await sleep(1200);
  S = await host.evaluate(() => S);
  if (S.phase !== 'playing' || S.players.length !== 3) throw new Error('Reload verliert Spiel');
  console.log('Host-Reload ok, Phase', S.phase);
  // weiter spielen; zur Beschleunigung alle auf Feld 88+ setzen
  for (const p of S.players) await host.evaluate(([id, pos]) => sock.emit('test:setPos', id, pos), [p.id, 88 + Math.floor(Math.random() * 6)]);
  let t0 = Date.now(), rolls = 0, cardShot = false, slideShot = false;
  while (true) {
    if (Date.now() - t0 > 300000) throw new Error('Timeout');
    S = await host.evaluate(() => S);
    if (S.phase === 'finished') break;
    const pd = S.pending;
    if (pd && pd.type === 'info' && pd.kind === 'rutsche' && pd.sliding && !slideShot) { await sleep(500); await host.screenshot({ path: OUT + '28_host_rutsche_animation.png' }); slideShot = true; }
    if (pd && pd.type === 'question' && !pd.resolved) {
      const i = S.players.findIndex(p => p.id === pd.playerId);
      if (pd.stage === 'personal') {
        if (!cardShot) { await sleep(400); await phones[i].screenshot({ path: OUT + '29_handy_karte_gross.png' }); cardShot = true; }
        await phones[i].click('.qa button >> nth=' + Math.floor(Math.random() * 3)).catch(() => {});
      } else if (pd.stage === 'group') { for (const [j, ph] of phones.entries()) if (j !== i) await ph.click('.qa button >> nth=' + Math.floor(Math.random() * 3)).catch(() => {}); }
      else await host.click(`#ov .judgebar button[data-delta="${Math.floor(Math.random() * 11) - 5}"]`).catch(() => {});
      await sleep(300); continue;
    }
    if (pd && pd.type === 'action' && pd.playerId && !cardShot) { const i = S.players.findIndex(p => p.id === pd.playerId); await sleep(300); await phones[i].screenshot({ path: OUT + '29_handy_karte_gross.png' }); cardShot = true; }
    if (!pd && !S.busy) { const btn = await phones[S.turn].$('#rollBtn:not([disabled])'); if (btn) { await btn.click().catch(() => {}); rolls++; await sleep(400); continue; } }
    await sleep(250);
  }
  await sleep(1200);
  await host.screenshot({ path: OUT + '30_host_siegerehrung.png' });
  await sleep(2500);
  await host.screenshot({ path: OUT + '31_host_siegerehrung_rangliste.png' });
  const w = S.players.find(p => p.id === S.winner.playerId);
  const wi = S.players.indexOf(w);
  await phones[wi].screenshot({ path: OUT + '32_handy_gewonnen.png' });
  console.log('Sieger', S.winner.name, 'Rangliste', S.winner.ranking ? S.winner.ranking.map(r => r.place + '.' + r.name + ':' + r.pos).join(' ') : '', 'Würfe', rolls);
  await b.close();
  if (errors.length) { console.log('JS-Fehler:', errors); process.exit(1); }
  console.log('ANIM TEST OK');
})().catch(e => { console.error('FEHLER', e, errors); process.exit(1); });
