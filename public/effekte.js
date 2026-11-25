// Kleine Animationen und Sound. Nutzt die SFX-Dateien aus assets/sfx, wenn vorhanden, sonst selbst erzeugte WebAudio-Klaenge.
window.Effekte = (() => {
  let audio, muted = localStorage.getItem('rallyeMute') === '1', volume = Math.max(0, Math.min(1, +(localStorage.getItem('rallyeVol') ?? 0.8)));
  const unlock = () => { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (_) {} };
  document.addEventListener('pointerdown', () => { unlock(); setTimeout(() => { if (loopWanted) setLoop(loopWanted); }, 300); }, { once: true });
  document.addEventListener('keydown', unlock, { once: true });
  function tone(f, dur, delay, type, end) {
    if (muted || !audio || audio.state !== 'running') return;
    const t = audio.currentTime + (delay || 0), o = audio.createOscillator(), g = audio.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (end) o.frequency.exponentialRampToValueAtTime(end, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.055 * volume + .0001, t + .008); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + dur + .02);
  }
  // ---- Sound: echte SFX aus /assets/sfx (falls vorhanden, Liste vom Server /sfx.json), sonst WebAudio-Ersatz ----
  const ALIAS = { dice: 'wuerfel_rollen', slide: 'rutsche', police: 'finanzpolizei_sirene', card: 'karte_aufdecken', win: 'sieg_fanfare' };
  const VOL = { figur_hopp: .35, lobby_loop: .25, wuerfel_rollen: .8 };
  let files = {}, buffers = {}, loop = null, loopWanted = null;
  const ext = (() => { try { return new Audio().canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3'; } catch (_) { return 'mp3'; } })();
  fetch('/sfx.json').then(r => r.ok ? r.json() : []).then(list => { list.forEach(f => { const m = /^(.+)\.(ogg|mp3)$/.exec(f); if (m) (files[m[1]] = files[m[1]] || {})[m[2]] = '/assets/sfx/' + f; }); preload(); }).catch(() => {});
  function url(n) { const f = files[n]; return f && (ext === 'ogg' ? (f.ogg || f.mp3) : (f.mp3 || f.ogg)); } // .ogg bevorzugt (lobby_loop: nahtlos), mp3 nur als Ersatz
  function preload() { if (!audio) return; Object.keys(files).forEach(n => { if (buffers[n] || !url(n)) return; buffers[n] = 'loading'; fetch(url(n)).then(r => r.arrayBuffer()).then(b => audio.decodeAudioData(b)).then(buf => { buffers[n] = buf; if (loopWanted === n) startLoop(n); }).catch(() => { delete buffers[n]; }); }); }
  document.addEventListener('pointerdown', () => setTimeout(preload, 50), { once: true });
  function fileSound(n, vol) {
    const b = buffers[n]; if (!b || b === 'loading') return false;
    const src = audio.createBufferSource(), g = audio.createGain(); src.buffer = b; g.gain.value = (vol == null ? (VOL[n] || 1) : vol) * volume; src._g = g; src.connect(g); g.connect(audio.destination); src.start(); return src;
  }
  const SYN = {
    wuerfel_rollen: () => [0, .09, .21, .36, .55, .72].forEach((d, i) => tone(250 + i * 50, .055, d, 'triangle')),
    wuerfel_landet: () => { tone(180, .09, 0, 'square'); tone(120, .12, .06, 'triangle'); },
    figur_hopp: () => tone(520, .06, 0, 'sine', 780),
    rutsche: () => tone(950, .95, 0, 'sine', 120),
    finanzpolizei_sirene: () => [0, .18, .36, .54].forEach((d, i) => tone(i % 2 ? 650 : 950, .16, d, 'sine')),
    handschellen_klick: () => { tone(2400, .03, 0, 'square'); tone(1800, .04, .07, 'square'); },
    gefaengnis_tuer_zu: () => { tone(90, .3, 0, 'sawtooth', 60); tone(1500, .05, .02, 'square'); },
    gefaengnis_tuer_auf: () => { tone(300, .35, 0, 'sawtooth', 600); },
    karte_aufdecken: () => { tone(440, .12, 0, 'triangle'); tone(660, .18, .1, 'triangle'); },
    aktion_positiv: () => [523, 659, 784].forEach((f, i) => tone(f, .16, i * .09, 'triangle')),
    aktion_negativ: () => [392, 330, 262].forEach((f, i) => tone(f, .18, i * .11, 'triangle')),
    runde_aussetzen: () => { tone(330, .25, 0, 'sine'); tone(247, .4, .2, 'sine'); },
    frage_erscheint: () => { tone(587, .12, 0, 'triangle'); tone(880, .2, .12, 'triangle'); },
    richtig: () => [659, 784, 1047].forEach((f, i) => tone(f, .18, i * .1, 'triangle')),
    falsch: () => { tone(220, .22, 0, 'square'); tone(180, .3, .2, 'square'); },
    spieler_beitritt: () => { tone(660, .08, 0, 'sine'); tone(990, .12, .07, 'sine'); },
    spiel_start: () => [392, 523, 659, 784].forEach((f, i) => tone(f, .2, i * .12, 'triangle')),
    sieg_fanfare: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, .3, i * .16, 'triangle')),
  };
  function play(k, vol) {
    const n = ALIAS[k] || k; if (muted || !audio || audio.state !== 'running') return;
    if (!fileSound(n, vol) && SYN[n]) SYN[n]();
  }
  function startLoop(n) { if (loop || muted || !audio) return; const src = fileSound(n); if (src) { src.loop = true; loop = src; } }
  function setLoop(n) { // Hintergrundschleife (nur echte Datei, kein Ersatzton)
    loopWanted = n || null;
    if (!n || muted) { if (loop) { try { loop.stop(); } catch (_) {} loop = null; } return; }
    if (audio && audio.state === 'running') startLoop(n);
  }
  const faces = {1:[[50,50]],2:[[28,28],[72,72]],3:[[28,28],[50,50],[72,72]],4:[[28,28],[72,28],[28,72],[72,72]],5:[[28,28],[72,28],[50,50],[28,72],[72,72]],6:[[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]]};
  function dice(v, rolling) { return `<span class="dice3 ${rolling ? 'rolling' : ''}"><svg viewBox="0 0 100 100" aria-label="Würfel ${v}"><rect x="4" y="4" width="92" height="92" rx="20" fill="#fff" stroke="#1e293b" stroke-width="5"/><path d="M18 10 Q50 0 80 12" fill="none" stroke="#fff" stroke-width="4"/>${(faces[v] || faces[1]).map(([x,y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#27324b"/>`).join('')}</svg></span>`; }
  function confetti() {
    const old = document.getElementById('confetti'); if (old) return;
    const c = document.createElement('div'); c.id = 'confetti'; c.setAttribute('aria-hidden','true');
    for (let i = 0; i < 65; i++) { const p = document.createElement('i'); p.style.cssText = `left:${Math.random()*100}%;background:${['#ef2998','#337af0','#ffcb3d','#46c78d','#a97df0'][i%5]};animation-delay:${-Math.random()*4}s;animation-duration:${3+Math.random()*3}s;transform:rotate(${Math.random()*360}deg)`; c.appendChild(p); }
    document.body.appendChild(c); setTimeout(() => c.remove(), 12000);
  }
  return { play, setLoop, dice, confetti, get files() { return Object.keys(files); }, get loaded() { return Object.keys(buffers).filter(n => buffers[n] && buffers[n] !== 'loading'); }, get looping() { return !!loop; }, get muted() { return muted; }, get volume() { return volume; }, setVolume(v) { volume = Math.max(0, Math.min(1, +v)); localStorage.setItem('rallyeVol', volume); if (loop && loop._g) loop._g.gain.value = (VOL.lobby_loop || 1) * volume; }, toggle() { unlock(); muted = !muted; localStorage.setItem('rallyeMute', muted ? '1' : '0'); setLoop(loopWanted); if (!muted) preload(); return muted; } };
})();
