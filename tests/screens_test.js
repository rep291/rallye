// Browser-Test mit echter Host- und Handy-Ansicht + Screenshots nach screens/
// Raum-System, Team/Solo, Abstimmung (Spieler legt sich fest -> Gruppe stimmt ab -> Host bewertet -5..+5), Auswertung + Druck
// Start: TIMING=40,1800,1500 PORT=3200 node server.js & node tests/screens_test.js
const { chromium } = require('playwright-core');
const URL = process.env.URL || 'http://localhost:3200';
const OUT = __dirname + '/../screens/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, m) => { if (!c) throw new Error('Check fehlgeschlagen: ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const hctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
  const host = await hctx.newPage();
  await host.goto(URL + '/host'); await host.waitForFunction(() => typeof roomCode !== 'undefined' && roomCode && S && S.room);
  const code = await host.evaluate(() => roomCode);
  ok(/^[A-Z2-9]{4}$/.test(code), 'Raumcode ' + code);
  const roomTxt = await host.textContent('#roomcode'); ok(roomTxt.includes(code), 'Raumcode am Beamer');
  // Reload -> gleicher Raum (Host-Token im localStorage)
  await host.reload(); await host.waitForFunction(() => roomCode && S && S.room);
  ok(await host.evaluate(() => roomCode) === code, 'Host-Reload landet im selben Raum');
  const phones = []; const who = {};
  const mk = async () => { const p = await (await b.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); p.on('dialog', d => d.accept()); return p; };
  // 1) Anna allein, ueber Code-Eingabe
  let p = await mk(); await p.goto(URL + '/'); await sleep(300);
  if (await p.$('#roomIn')) { await p.screenshot({ path: OUT + '40_handy_raumcode.png' }); await p.fill('#roomIn', code.toLowerCase()); await p.keyboard.press('Enter'); }
  await p.waitForSelector('#name'); await p.fill('#name', 'Anna'); await p.click('#joinBtn'); await sleep(300); phones.push(p); who.Anna = p;
  // 2) Ben gruendet Team "Profis" (per QR-Link ?r=)
  p = await mk(); await p.goto(URL + '/?r=' + code); await p.waitForSelector('#name'); await p.fill('#name', 'Ben');
  await p.click('text=Team gründen'); await p.fill('#teamName', 'Profis'); await p.screenshot({ path: OUT + '41_handy_team_gruenden.png' });
  await p.click('#joinBtn'); await sleep(300); phones.push(p); who.Ben = p;
  // 3) Cem tritt Team Profis bei
  p = await mk(); await p.goto(URL + '/?r=' + code); await p.waitForSelector('#name'); await p.fill('#name', 'Cem');
  await p.click('text=Team beitreten'); await p.click('.teamlist button'); await p.screenshot({ path: OUT + '42_handy_team_beitreten.png' });
  await p.click('#joinBtn'); await sleep(300); phones.push(p); who.Cem = p;
  // 4) Dora allein
  p = await mk(); await p.goto(URL + '/?r=' + code); await p.waitForSelector('#name'); await p.fill('#name', 'Dora');
  await p.screenshot({ path: OUT + '03_handy_beitreten.png' }); await p.click('#joinBtn'); await sleep(400); phones.push(p); who.Dora = p;
  let S = await host.evaluate(() => S);
  ok(S.players.length === 3, 'Spieler/Teams: ' + S.players.length);
  const team = S.players.find(x => x.isTeam); ok(team && team.members.length === 2, 'Team mit 2 Handys');
  await host.screenshot({ path: OUT + '01_host_lobby.png' });
  await who.Cem.screenshot({ path: OUT + '04_handy_lobby_team.png' });
  // Einstellungen: Kartenpakete + Zeitlimit-Anzeige
  await host.evaluate(() => openSettings()); await sleep(300);
  await host.screenshot({ path: OUT + '43_host_einstellungen.png' });
  await host.fill('#set_game', '30');
  await host.click('text=Einstellungen speichern'); await sleep(300); await host.evaluate(() => closeSettings()); await sleep(200);
  S = await host.evaluate(() => S); ok(S.room.settings.gameTimeMin === 30, 'gameTimeMin gesetzt');
  await host.click('text=Spiel starten'); await sleep(600);
  const phonesOf = id => { const pl = S.players.find(x => x.id === id); return pl.isTeam ? pl.members.map(m => who[m.name]) : [who[pl.name]]; };
  let shots = {}, t0 = Date.now(), rolls = 0, votes = 0, judged = 0;
  while (true) {
    if (Date.now() - t0 > 1200000) throw new Error('Timeout');
    S = await host.evaluate(() => S);
    if (S.phase === 'finished') break;
    const pd = S.pending;
    if (pd && pd.type === 'info' && pd.kind === 'rutsche' && !pd.sliding && !shots.rutsche) { await sleep(300); await host.screenshot({ path: OUT + '13_host_rutsche.png' }); shots.rutsche = true; }
    if (pd && pd.type === 'info' && pd.kind === 'finanzpolizei' && !shots.fp) { await sleep(300); await host.screenshot({ path: OUT + '14_host_finanzpolizei.png' }); shots.fp = true; }
    if (!pd && !S.busy && S.players[S.turn] && S.players[S.turn].jail && !shots.phoneFp) { await sleep(200); await phonesOf(S.players[S.turn].id)[0].screenshot({ path: OUT + '15_handy_finanzpolizei_6.png' }); shots.phoneFp = true; }
    if (pd && pd.type === 'action' && !shots.action) { await sleep(500); await host.screenshot({ path: OUT + '06_host_aktionskarte.png' }); shots.action = true; }
    if (pd && pd.type === 'question' && !pd.resolved) {
      const mine = phonesOf(pd.playerId), others = phones.filter(x => !mine.includes(x));
      if (pd.stage === 'personal') {
        if (!shots.qPersonal) { await sleep(500); await host.screenshot({ path: OUT + '07_host_fragekarte_festlegen.png' }); await mine[0].screenshot({ path: OUT + '08_handy_frage_festlegen.png' }); await others[0].screenshot({ path: OUT + '44_handy_andere_warten.png' }); }
        // Geheimhaltung: andere Handys sehen die Antwort nicht
        const actor = mine[mine.length - 1]; // bei Teams antwortet ein anderes Team-Handy als das erste
        await actor.click('.qa button >> nth=' + Math.floor(Math.random() * 3)).catch(() => {}); await sleep(250);
        const seen = await others[0].evaluate(() => S.pending && S.pending.answer);
        if (S.pending) ok(seen === null || seen === undefined || (await host.evaluate(() => S.pending && S.pending.stage)) === 'reveal', 'Antwort vor Auflösung geheim');
        if (!shots.qPersonal) { await sleep(300); await mine[0].screenshot({ path: OUT + '45_handy_festgelegt.png' }); shots.qPersonal = true; }
        continue;
      }
      if (pd.stage === 'group') {
        if (!shots.qGroup) { await sleep(300); await others[0].screenshot({ path: OUT + '46_handy_abstimmen.png' }); }
        let n = 0;
        for (const ph of others) { const can = await ph.evaluate(() => S.pending && S.pending.canVote && S.pending.vote === null && S.pending.stage === 'group'); if (can) { await ph.click('.qa button >> nth=' + Math.floor(Math.random() * 3)).catch(() => {}); votes++; n++; await sleep(150); if (!shots.qGroup) { await sleep(300); await host.screenshot({ path: OUT + '47_host_gruppe_stimmt_ab.png' }); shots.qGroup = true; } } }
        if (!n) { await host.click('text=Abstimmung beenden').catch(() => {}); }
        await sleep(250); continue;
      }
      if (pd.stage === 'reveal') {
        if (!shots.qReveal) { await sleep(500); await host.screenshot({ path: OUT + '09_host_frage_auswertung_bewerten.png' }); await others[0].screenshot({ path: OUT + '48_handy_aufloesung.png' }); shots.qReveal = true; }
        ok(pd.groupCounts && pd.groupCounts.length === pd.card.answers.length, 'Gruppenverteilung am Beamer');
        const d = Math.floor(Math.random() * 11) - 5;
        await host.click(`#ov .judgebar button[data-delta="${d}"]`).catch(() => {}); judged++;
        await sleep(300); continue;
      }
    }
    if (!pd && !S.busy) {
      const cur = S.players[S.turn]; const list = phonesOf(cur.id); const ph = list[rolls % list.length];
      const btn = await ph.$('#rollBtn:not([disabled])');
      if (btn) {
        if (!shots.phoneRoll) { await ph.screenshot({ path: OUT + '05_handy_wuerfeln.png' }); shots.phoneRoll = true; }
        await btn.click(); rolls++;
        if (rolls === 20 && !shots.board) { await sleep(1200); await host.screenshot({ path: OUT + '02_host_spiel.png' }); shots.board = true; }
      }
    }
    await sleep(120);
  }
  await sleep(1200);
  await host.screenshot({ path: OUT + '10_host_sieger.png' });
  await phones[0].screenshot({ path: OUT + '11_handy_ende.png' });
  await host.waitForSelector('.evaluation', { timeout: 15000 });
  await sleep(400); await host.screenshot({ path: OUT + '49_host_auswertung.png' });
  const [pr] = await Promise.all([hctx.waitForEvent('page'), host.click('text=Drucken / als PDF')]);
  await pr.waitForLoadState(); const ptxt = await pr.textContent('body'); ok(ptxt.includes('Auswertung') && ptxt.includes('Rangliste'), 'Druckansicht');
  await pr.close().catch(() => {});
  S = await host.evaluate(() => S);
  const qh = S.history.filter(h => h.type === 'question');
  ok(qh.length === judged, 'Historie Fragen ' + qh.length + ' vs bewertet ' + judged);
  console.log('Browser-Test OK. Raum', code, 'Screens:', Object.keys(shots).join(','), 'Würfe:', rolls, 'Gruppenstimmen:', votes, 'Bewertet:', judged, 'Sieger:', S.winner.name, S.winner.ranking.map(r => r.place + '.' + r.name + ':' + r.pos).join(', '));
  await b.close();
})().catch(e => { console.error('FEHLER', e); process.exit(1); });
