import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildLayout, kartenStimmung } from '../public/city3d/layout.js';

const board = JSON.parse(fs.readFileSync(new URL('../config/board.json', import.meta.url), 'utf8'));
const layout = buildLayout(board.fields);

assert.equal(layout.points.length, board.fields.length, 'ein Punkt pro Brettfeld');
assert.equal(layout.buildings.length, 9, 'neun Betriebe');
const names = layout.buildings.map(b => b.name);
for (const n of ['Schlosserei', 'Restaurantküche', 'Labor', 'Lager', 'Büro', 'Friseursalon', 'Baustelle', 'Krankenhaus', 'Autowerkstatt']) {
  assert.ok(names.includes(n), n);
}

const fp = board.fields.filter(f => f.type === 'finanzpolizei').map(f => f.id);
assert.equal(layout.prisons.length, fp.length);
for (const id of fp) {
  const pt = layout.points.find(p => p.id === id);
  assert.ok(pt, 'Feld ' + id);
  assert.equal(pt.building, null, 'Finanzpolizei liegt auf der Straße, Feld ' + id);
  const prison = layout.prisons.find(r => r.fieldIndex === pt.index);
  assert.ok(prison);
  assert.ok(Math.hypot(prison.x - pt.x, prison.z - pt.z) > 4, 'Zelle neben dem Feld');
}

for (let i = 0; i < layout.buildings.length; i++) {
  for (let j = i + 1; j < layout.buildings.length; j++) {
    const a = layout.buildings[i];
    const b = layout.buildings[j];
    const dx = Math.abs(a.cx - b.cx);
    const dz = Math.abs(a.cz - b.cz);
    const overlap = dx < (a.length + b.length) / 2 - 0.2 && dz < (a.depth + b.depth) / 2 - 0.2;
    assert.equal(overlap, false, a.name + ' überlappt ' + b.name);
  }
}

const slides = board.fields.filter(f => f.type === 'rutsche');
assert.equal(layout.slides.length, slides.length);
for (const s of layout.slides) assert.ok(s.indices.includes(s.field) && s.indices.includes(s.to));

assert.equal(kartenStimmung('3 Felder vor'), 'gut');
assert.equal(kartenStimmung('2 Felder zurück'), 'schlecht');
assert.equal(kartenStimmung('Noch einmal würfeln'), 'gut');
assert.equal(kartenStimmung('1x aussetzen'), 'schlecht');
assert.equal(kartenStimmung('Zurück zum Start'), 'schlecht');
assert.equal(kartenStimmung('Keine Wirkung'), 'neutral');

const types = new Set(layout.points.map(p => p.type));
for (const t of ['start', 'ziel', 'aktion', 'frage', 'rutsche', 'finanzpolizei', 'normal']) {
  assert.ok(types.has(t), t);
}

console.log('layout ok', layout.points.length, 'Felder,', names.join(', '));
