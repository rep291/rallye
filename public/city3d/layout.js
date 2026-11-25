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

const SHOP_RANGES = [
  ['schlosserei', 6, 12], ['kueche', 15, 21], ['labor', 24, 30], ['lager', 39, 45],
  ['buero', 48, 54], ['friseur', 57, 61], ['baustelle', 72, 78], ['krankenhaus', 81, 84],
  ['autowerkstatt', 90, 96],
];

function buildingAt(i) {
  for (const [id, a, b] of SHOP_RANGES) if (i >= a && i <= b) return id;
  return null;
}

function bow(x0, x1, z, amp, n) {
  const p = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    p.push([x0 + (x1 - x0) * u, z + Math.sin(Math.PI * u) * amp]);
  }
  return p;
}

function arc(cx, cz, r, a0, a1, n) {
  const p = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    p.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
  }
  return p;
}

function chain(parts) {
  const o = [];
  for (const part of parts) {
    for (const q of part) {
      const last = o[o.length - 1];
      if (last && Math.hypot(last[0] - q[0], last[1] - q[1]) < 0.25) continue;
      o.push(q);
    }
  }
  return o;
}

function polyLen(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}

function pointAt(pts, dist) {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dz = pts[i][1] - pts[i - 1][1];
    const seg = Math.hypot(dx, dz) || 1;
    if (acc + seg >= dist || i === pts.length - 1) {
      const u = Math.min(1, (dist - acc) / seg);
      return { x: pts[i - 1][0] + dx * u, z: pts[i - 1][1] + dz * u, tx: dx / seg, tz: dz / seg };
    }
    acc += seg;
  }
  const last = pts[pts.length - 1];
  return { x: last[0], z: last[1], tx: 1, tz: 0 };
}

/** Geschwungene Straße mit zwei Kehren, passend zu 102 Feldern. */
function windSamples(n) {
  const R = 20;
  const amp = 6;
  const wps = chain([
    bow(0, 96, 0, -amp, 16),
    arc(96, R, R, -Math.PI / 2, Math.PI / 2, 10),
    bow(96, 0, R * 2, amp, 16),
    arc(0, R * 3, R, -Math.PI / 2, -Math.PI * 1.5, 10),
    bow(0, 100, R * 4, amp, 16),
  ]);
  const total = polyLen(wps);
  const out = [];
  for (let i = 0; i < n; i++) out.push(pointAt(wps, (n === 1 ? 0 : i / (n - 1)) * total));
  return out;
}

export function buildLayout(fields) {
  const list = Array.isArray(fields) ? fields : [];
  const runs = scaleRuns(Math.max(0, list.length - 1));
  const points = [];
  if (list.length === 102) {
    const samples = windSamples(102);
    for (let i = 0; i < 102; i++) {
      const s = samples[i];
      points.push(makePoint(i, list[i], s.x, s.z, s.tx, s.tz, buildingAt(i)));
    }
  }
  let x = 0;
  let z = 0;
  const seed = runs[0] || { dx: 1, dz: 0 };
  const firstLen = Math.hypot(seed.dx, seed.dz) || 1;
  if (!points.length) points.push(makePoint(0, list[0], x, z, seed.dx / firstLen, seed.dz / firstLen, null));
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
  let tx = 0;
  let tz = 0;
  let cx = 0;
  let cz = 0;
  const count = to - from + 1;
  for (let i = from; i <= to; i++) {
    tx += points[i].tx;
    tz += points[i].tz;
    cx += points[i].x;
    cz += points[i].z;
  }
  tx /= count;
  tz /= count;
  const mag = Math.hypot(tx, tz) || 1;
  tx /= mag;
  tz /= mag;
  cx /= count;
  cz /= count;
  let minA = Infinity;
  let maxA = -Infinity;
  for (let i = from; i <= to; i++) {
    const along = (points[i].x - cx) * tx + (points[i].z - cz) * tz;
    if (along < minA) minA = along;
    if (along > maxA) maxA = along;
  }
  return {
    id,
    name: meta.name,
    blurb: meta.blurb,
    wall: meta.wall,
    floor: meta.floor,
    trim: meta.trim,
    roof: meta.roof,
    open: !!meta.open,
    cx, cz, tx, tz,
    sx: -tz,
    sz: tx,
    length: (maxA - minA) + STEP,
    depth: meta.open ? 8.2 : 7.6,
    height: meta.open ? 2.6 : 3.4,
    fieldFrom: from,
    fieldTo: to,
  };
}
