// Weg der 3D-Stadt aus den Feldern von config/board.json.
// Reihenfolge, Typ und Rutschen-Ziel kommen 1:1 vom Brett.
// Die x/y-Millimeter des 2D-Bretts bleiben dem SVG vorbehalten:
// der Pfad wird zu einer begehbaren Straße mit Betrieben, damit
// sich Gebäude nicht auf dem engen Schlangenweg überlagern.

export const STEP = 2.72;
export const TILE_Y = 0.2;

export const PROFESSIONS = {
  schlosserei: { name: 'Schlosserei', blurb: 'Werkbank und Amboss', wall: '#8a4b32', floor: '#6a5b4c', trim: '#d08a45', roof: '#5c3428' },
  kueche: { name: 'Restaurantküche', blurb: 'Herd, Töpfe, Theke', wall: '#f3efe6', floor: '#e2c9a4', trim: '#b4332a', roof: '#8c4038' },
  labor: { name: 'Labor', blurb: 'Proben und Gläser', wall: '#e7eef3', floor: '#d5dee6', trim: '#2f7f9a', roof: '#c5d4de' },
  lager: { name: 'Lager', blurb: 'Regale und Kisten', wall: '#c4a36a', floor: '#b7a27a', trim: '#8a6232', roof: '#7d6240' },
  buero: { name: 'Büro', blurb: 'Schreibtische und Bildschirme', wall: '#d9e0ec', floor: '#c5cbd6', trim: '#2c4d86', roof: '#8ea0be' },
  friseur: { name: 'Friseursalon', blurb: 'Stuhl, Spiegel, Schere', wall: '#f6e7ee', floor: '#ead5ce', trim: '#c45b8a', roof: '#e7b7cc' },
  baustelle: { name: 'Baustelle', blurb: 'Gerüst und Zement', wall: '#e0b04a', floor: '#c4a56a', trim: '#f2c14a', roof: '#c48a2a', open: true },
  krankenhaus: { name: 'Krankenhaus', blurb: 'Station und Betten', wall: '#f7f7f5', floor: '#dbe3ea', trim: '#d23b4b', roof: '#eceff2' },
  autowerkstatt: { name: 'Autowerkstatt', blurb: 'Hebebühne und Reifen', wall: '#d5d8dc', floor: '#8e959b', trim: '#1f7a45', roof: '#9aa3aa' },
};

// 101 Schritte bei 102 Feldern (Index 0 = Start). Betriebe liegen auf Geraden,
// Finanzpolizei-Felder 33, 62 und 86 bleiben auf der Straße (Zelle daneben).
const PROTO = [
  { n: 3, dx: 1, dz: 0 },
  { n: 2, dx: 1, dz: 0 },
  { n: 7, dx: 1, dz: 0, building: 'schlosserei' },
  { n: 2, dx: 1, dz: 0 },
  { n: 7, dx: 1, dz: 0, building: 'kueche' },
  { n: 2, dx: 1, dz: 0 },
  { n: 7, dx: 1, dz: 0, building: 'labor' },
  { n: 2, dx: 1, dz: 0 },
  { n: 4, dx: 0, dz: 1 },
  { n: 2, dx: -1, dz: 0 },
  { n: 7, dx: -1, dz: 0, building: 'lager' },
  { n: 2, dx: -1, dz: 0 },
  { n: 7, dx: -1, dz: 0, building: 'buero' },
  { n: 2, dx: -1, dz: 0 },
  { n: 5, dx: -1, dz: 0, building: 'friseur' },
  { n: 4, dx: -1, dz: 0 },
  { n: 4, dx: 0, dz: 1 },
  { n: 2, dx: 1, dz: 0 },
  { n: 7, dx: 1, dz: 0, building: 'baustelle' },
  { n: 2, dx: 1, dz: 0 },
  { n: 4, dx: 1, dz: 0, building: 'krankenhaus' },
  { n: 5, dx: 1, dz: 0 },
  { n: 7, dx: 1, dz: 0, building: 'autowerkstatt' },
  { n: 5, dx: 1, dz: 0 },
];

const PROTO_SUM = PROTO.reduce((s, r) => s + r.n, 0);

export function kartenStimmung(effectText) {
  const t = String(effectText || '');
  if (/zurück|aussetzen|zum Start/.test(t)) return 'schlecht';
  if (/vor|Noch einmal|Weiter auf/.test(t)) return 'gut';
  return 'neutral';
}

export function yawFacing(tx, tz) {
  // Figur schaut entlang -Z. Drehung so, dass -Z auf (tx, tz) zeigt.
  return Math.atan2(-tx, -tz);
}

function scaleRuns(nSteps) {
  if (nSteps === PROTO_SUM) return PROTO.map(r => ({ ...r }));
  if (nSteps <= 0) return [];
  const raw = PROTO.map(r => (nSteps * r.n) / PROTO_SUM);
  const counts = raw.map((x, i) => Math.max(PROTO[i].building ? 2 : 0, Math.floor(x)));
  let diff = nSteps - counts.reduce((a, b) => a + b, 0);
  const order = raw.map((x, i) => ({ i, f: x - Math.floor(x) })).sort((a, b) => b.f - a.f);
  let k = 0;
  while (diff > 0 && order.length) {
    counts[order[k % order.length].i] += 1;
    diff -= 1;
    k += 1;
  }
  while (diff < 0) {
    let idx = -1;
    for (let i = counts.length - 1; i >= 0; i--) {
      const min = PROTO[i].building ? 2 : 0;
      if (counts[i] > min) { idx = i; break; }
    }
    if (idx < 0) break;
    counts[idx] -= 1;
    diff += 1;
  }
  return PROTO.map((r, i) => ({ ...r, n: counts[i] })).filter(r => r.n > 0);
}

function crowdAt(points, buildings, x, z) {
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const d = Math.hypot(points[i].x - x, points[i].z - z);
    if (d < 7) s += 7 - d;
  }
  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    const dx = x - b.cx;
    const dz = z - b.cz;
    const along = dx * b.tx + dz * b.tz;
    const side = dx * b.sx + dz * b.sz;
    if (Math.abs(along) < b.length / 2 + 1.2 && Math.abs(side) < b.depth / 2 + 1.2) s += 12;
  }
  return s;
}

export function buildLayout(fields) {
  const list = Array.isArray(fields) ? fields : [];
  const runs = scaleRuns(Math.max(0, list.length - 1));
  const points = [];
  let x = 0;
  let z = 0;
  const seed = runs[0] || { dx: 1, dz: 0 };
  const firstLen = Math.hypot(seed.dx, seed.dz) || 1;
  points.push(makePoint(0, list[0], x, z, seed.dx / firstLen, seed.dz / firstLen, null));
  for (let r = 0; r < runs.length && points.length < list.length; r++) {
    const run = runs[r];
    const len = Math.hypot(run.dx, run.dz) || 1;
    const tx = run.dx / len;
    const tz = run.dz / len;
    for (let i = 0; i < run.n && points.length < list.length; i++) {
      x += tx * STEP;
      z += tz * STEP;
      const idx = points.length;
      points.push(makePoint(idx, list[idx], x, z, tx, tz, run.building || null));
    }
  }
  while (points.length < list.length) {
    const prev = points[points.length - 1];
    x += prev.tx * STEP;
    z += prev.tz * STEP;
    const idx = points.length;
    points.push(makePoint(idx, list[idx], x, z, prev.tx, prev.tz, null));
  }

  const buildings = [];
  let i = 0;
  while (i < points.length) {
    const id = points[i].building;
    if (!id || !PROFESSIONS[id]) { i += 1; continue; }
    const from = i;
    while (i < points.length && points[i].building === id) i += 1;
    buildings.push(makeBuilding(id, points, from, i - 1));
  }

  const prisons = [];
  for (let p = 0; p < points.length; p++) {
    if (points[p].type !== 'finanzpolizei') continue;
    const f = points[p];
    const dist = 6.4;
    const opts = [
      { x: f.x + f.sx * dist, z: f.z + f.sz * dist, faceX: -f.sx, faceZ: -f.sz },
      { x: f.x - f.sx * dist, z: f.z - f.sz * dist, faceX: f.sx, faceZ: f.sz },
    ];
    opts.sort((a, b) => crowdAt(points, buildings, a.x, a.z) - crowdAt(points, buildings, b.x, b.z));
    const spot = opts[0];
    prisons.push({ fieldIndex: p, x: spot.x, z: spot.z, faceX: spot.faceX, faceZ: spot.faceZ });
  }

  const slides = [];
  for (let p = 0; p < points.length; p++) {
    const to = points[p].to;
    if (points[p].type !== 'rutsche' || !Number.isInteger(to)) continue;
    const a = Math.max(0, Math.min(points.length - 1, to));
    const lo = Math.min(a, p);
    const hi = Math.max(a, p);
    const indices = [];
    for (let k = lo; k <= hi; k++) indices.push(k);
    slides.push({ field: p, to: a, indices });
  }

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.z < minZ) minZ = pt.z;
    if (pt.z > maxZ) maxZ = pt.z;
  }
  if (!points.length) { minX = 0; maxX = 0; minZ = 0; maxZ = 0; }

  return { points, buildings, prisons, slides, bounds: { minX, maxX, minZ, maxZ } };
}

function makePoint(index, field, x, z, tx, tz, building) {
  const f = field || {};
  return {
    index,
    id: f.id != null ? f.id : index,
    type: f.type || 'normal',
    label: f.label || '',
    to: Number.isInteger(f.to) ? f.to : null,
    x, z, tx, tz,
    sx: -tz,
    sz: tx,
    building,
  };
}

function makeBuilding(id, points, from, to) {
  const meta = PROFESSIONS[id];
  const a = points[from];
  const b = points[to];
  const span = Math.hypot(b.x - a.x, b.z - a.z);
  return {
    id,
    name: meta.name,
    blurb: meta.blurb,
    wall: meta.wall,
    floor: meta.floor,
    trim: meta.trim,
    roof: meta.roof,
    open: !!meta.open,
    cx: (a.x + b.x) / 2,
    cz: (a.z + b.z) / 2,
    tx: a.tx,
    tz: a.tz,
    sx: a.sx,
    sz: a.sz,
    length: span + STEP,
    depth: meta.open ? 7.2 : 6.8,
    height: meta.open ? 2.5 : 3.9,
    fieldFrom: from,
    fieldTo: to,
  };
}
