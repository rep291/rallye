import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildLayout, corridorOffset, kartenStimmung, missesDoor, zoneOf, visualType } from '../public/city3d/layout.js';

const board = JSON.parse(fs.readFileSync(new URL('../config/board.json', import.meta.url), 'utf8'));
const layout = buildLayout(board.fields);

assert.equal(layout.points.length, board.fields.length, 'ein Punkt pro Brettfeld');
assert.equal(layout.buildings.length, 9, 'neun Betriebe');
const names = layout.buildings.map(b => b.name);
for (const n of ['Schlosserei', 'Restaurantküche', 'Labor', 'Lager', 'Büro', 'Friseursalon', 'Baustelle', 'Krankenhaus', 'Autowerkstatt']) {
  assert.ok(names.includes(n), n);
}

const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
for (const p of layout.points) counts[p.zone]++;
assert.deepEqual(counts, { 1: 26, 2: 25, 3: 25, 4: 26 });

assert.equal(layout.prisons.length, 3, 'eine Zelle in Zone 2, 3 und 4');
assert.equal(layout.slides.length, 12, 'zwölf Rutschen aus dem Brett');

for (const b of layout.buildings) {
  const own = layout.points.filter(p => p.id >= b.from && p.id <= b.to);
  for (const p of own) {
    assert.ok(Math.abs(corridorOffset(b, p.lx, p.lz)) < 0.45, b.id + ' Feld ' + p.id + ' verlässt den Korridor');
  }
  const foreign = layout.points.filter(p => p.zone === b.zone && (p.id < b.from || p.id > b.to));
  for (const p of foreign) {
    assert.equal(missesDoor(b, p.lx, p.lz), false, 'Feld ' + p.id + ' läuft durch die Wand von ' + b.name);
  }
  for (let i = 0; i < layout.points.length - 1; i++) {
    const a = layout.points[i];
    const c = layout.points[i + 1];
    if (a.zone !== b.zone || c.zone !== b.zone) continue;
    const mx = (a.lx + c.lx) / 2;
    const mz = (a.lz + c.lz) / 2;
    const insideShop = (a.id >= b.from && a.id <= b.to) || (c.id >= b.from && c.id <= b.to);
    if (!insideShop) assert.equal(missesDoor(b, mx, mz), false, 'Weg ' + a.id + '-' + c.id + ' durch ' + b.name);
  }
}
const fp = board.fields.filter(f => f.type === 'finanzpolizei').map(f => f.id);
assert.deepEqual(fp, [33, 53, 62, 72, 78, 86, 94]);
for (const id of fp) {
  const pt = layout.points.find(p => p.id === id);
  assert.equal(pt.building, null, 'Finanzpolizei liegt nicht in einer Box, Feld ' + id);
  const prison = layout.prisons.find(r => r.zone === zoneOf(id));
  assert.ok(prison, 'Zelle der Zone');
  assert.ok(Math.hypot(prison.x - pt.x, prison.z - pt.z) > 4, 'Zelle neben dem Feld ' + id);
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

const fieldOf = id => board.fields.find(f => f.id === id);
assert.equal(visualType(100, fieldOf(100)), 'frage');
assert.equal(visualType(99, fieldOf(99)), 'rutsche');
assert.equal(visualType(21, fieldOf(21)), 'rutsche');
assert.equal(visualType(53, fieldOf(53)), 'finanzpolizei');
assert.equal(layout.points.find(p => p.id === 99).slideTo, 87);

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
