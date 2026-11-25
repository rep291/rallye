// Prueft jede Aktionskarte (beliebig viele): Effekt-Text auf der Karte passt zur Spiellogik.
const cards = require('../config/cards.json').action;
let bad = 0;
for (const c of cards) {
  const m = c.effectLabel.match(/^(\d+) (Felde?r?) (vor|zurück)|^(\d+) Runden? aussetzen/);
  const exp = /noch einmal würfeln/i.test(c.effectLabel) ? { type: 'extraTurn' } : !m ? null : m[4] ? { type: 'skip', turns: +m[4] } : { type: 'move', steps: (m[3] === 'vor' ? 1 : -1) * m[1] };
  if (!exp || JSON.stringify(exp) !== JSON.stringify(c.effect)) { bad++; console.log('FEHLER', c.nr, c.effectLabel, JSON.stringify(c.effect)); }
}
console.log(cards.length, 'Aktionskarten geprüft,', bad, 'Fehler'); process.exit(bad ? 1 : 0);
