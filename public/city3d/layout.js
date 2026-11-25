// Vier Flipchart-Zonen. Die Positionen sind die 3D-Darstellung.
// Typ, Rutsche (to) und Finanzpolizei kommen von den Feldern aus config/board.json.
// Neue Rutschen und Polizeifelder erscheinen, sobald sie dort stehen.

export const TILE_Y = 0.36;
export const PAGE = { w: 48, d: 34 };
export const ZONE_GAP = 80;

export const ZONE_NAME = {
  1: 'Handwerk und Küche',
  2: 'Labor und Lager',
  3: 'Büro, Salon und Bau',
  4: 'Klinik und Werkstatt',
};

const CYCLE = ['#E6197E', '#F7931E', '#FFD23F', '#7CC242', '#1F5FD6', '#8E44C9'];
const FIELD_COLOR = {
  aktion: '#F58220',
  frage: '#2D6CDF',
  rutsche: '#E8338B',
  finanzpolizei: '#4A3470',
  start: '#7CC242',
  ziel: '#FFD23F',
};

const KNOWN = new Set(['start', 'ziel', 'normal', 'aktion', 'frage', 'rutsche', 'finanzpolizei']);

const SHOPS = [
  { id: 'schlosserei', name: 'Schlosserei', zone: 1, from: 6, to: 12, blurb: 'Amboss und Werkbank' },
  { id: 'kueche', name: 'Restaurantküche', zone: 1, from: 16, to: 22, blurb: 'Herd, Töpfe, Theke' },
  { id: 'labor', name: 'Labor', zone: 2, from: 36, to: 42, blurb: 'Proben und Gläser' },
  { id: 'lager', name: 'Lager', zone: 2, from: 44, to: 49, blurb: 'Kisten und Palette' },
  { id: 'buero', name: 'Büro', zone: 3, from: 55, to: 60, blurb: 'Schreibtisch und Drucker' },
  { id: 'friseur', name: 'Friseursalon', zone: 3, from: 64, to: 68, blurb: 'Stuhl und Schere' },
  { id: 'baustelle', name: 'Baustelle', zone: 3, from: 73, to: 75, open: true, blurb: 'Gerüst und Balken' },
  { id: 'krankenhaus', name: 'Krankenhaus', zone: 4, from: 81, to: 85, blurb: 'Station und Betten' },
  { id: 'autowerkstatt', name: 'Autowerkstatt', zone: 4, from: 90, to: 93, blurb: 'Haube und Reifen' },
];

export function zoneOf(id) {
  const n = id | 0;
  if (n <= 25) return 1;
  if (n <= 50) return 2;
  if (n <= 75) return 3;
  return 4;
}

export function visualType(id, field) {
  if (field && KNOWN.has(field.type)) return field.type;
  if (id === 0) return 'start';
  if (id === 101) return 'ziel';
  return 'normal';
}

export function fieldColor(id, type) {
  if (type === 'normal') return CYCLE[(Math.max(1, id) - 1) % 6];
  return FIELD_COLOR[type] || CYCLE[0];
}

export function kartenStimmung(effectText) {
  const t = String(effectText || '');
  if (/zurück|aussetzen|zum Start/.test(t)) return 'schlecht';
  if (/vor|Noch einmal|Weiter auf/.test(t)) return 'gut';
  return 'neutral';
}

export function yawFacing(tx, tz) {
  return Math.atan2(-tx, -tz);
}

function chain(segments) {
  const out = [];
  segments.forEach((s, si) => {
    const start = si === 0 ? 0 : 1;
    for (let i = start; i < s.n; i++) {
      const t = s.n <= 1 ? 0 : i / (s.n - 1);
      out.push([s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t]);
    }
  });
  return out;
}

function paths() {
  return {
    1: chain([
      { a: [3, 8], b: [8, 17], n: 6 },
      { a: [8, 17], b: [20, 17], n: 8 },
      { a: [20, 17], b: [26, 14], n: 4 },
      { a: [26, 14], b: [38, 14], n: 8 },
      { a: [38, 14], b: [41, 22], n: 4 },
    ]),
    2: chain([
      { a: [3, 22], b: [12, 14], n: 8 },
      { a: [12, 14], b: [16, 21], n: 3 },
      { a: [16, 21], b: [24, 21], n: 8 },
      { a: [24, 21], b: [28, 16], n: 2 },
      { a: [28, 16], b: [40, 15], n: 7 },
      { a: [40, 15], b: [42, 10], n: 2 },
    ]),
    3: chain([
      { a: [3, 22], b: [8, 23], n: 4 },
      { a: [8, 23], b: [18, 23], n: 7 },
      { a: [18, 23], b: [28, 20], n: 4 },
      { a: [28, 20], b: [40, 17], n: 6 },
      { a: [40, 17], b: [32, 12], n: 4 },
      { a: [32, 12], b: [24, 10], n: 2 },
      { a: [24, 10], b: [10, 8], n: 4 },
    ]),
    4: chain([
      { a: [4, 22], b: [8, 22], n: 2 },
      { a: [8, 22], b: [10, 18], n: 2 },
      { a: [10, 18], b: [12, 22], n: 3 },
      { a: [12, 22], b: [22, 22], n: 6 },
      { a: [22, 22], b: [24, 16], n: 2 },
      { a: [24, 16], b: [28, 18], n: 4 },
      { a: [28, 18], b: [38, 17], n: 5 },
      { a: [38, 17], b: [40, 12], n: 2 },
      { a: [40, 12], b: [34, 22], n: 7 },
      { a: [34, 22], b: [43, 25], n: 2 },
    ]),
  };
}

function boxAround(pts) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.lx);
    maxX = Math.max(maxX, p.lx);
    minZ = Math.min(minZ, p.lz);
    maxZ = Math.max(maxZ, p.lz);
  }
  const alongX = (maxX - minX) >= (maxZ - minZ);
  const length = Math.max(7.2, (alongX ? maxX - minX : maxZ - minZ) + 2.4);
  const depth = 6.6;
  return {
    cx: (minX + maxX) / 2,
    cz: (minZ + maxZ) / 2,
    length,
    depth,
    alongX,
  };
}

function slotsAt(lx, lz) {
  const slots = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      slots.push({ lx: lx + (col - 1) * 0.72, lz: lz + (row - 0.5) * 0.7 });
    }
  }
  return slots;
}

export function buildLayout(fields) {
  const local = paths();
  const expected = { 1: 26, 2: 25, 3: 25, 4: 26 };
  for (const z of [1, 2, 3, 4]) {
    if (local[z].length !== expected[z]) throw new Error('Zone ' + z + ' hat ' + local[z].length + ' statt ' + expected[z]);
  }
  const byId = new Map((fields || []).map(f => [f.id, f]));
  const points = [];
  for (const z of [1, 2, 3, 4]) {
    const pts = local[z];
    const ox = (z - 1) * ZONE_GAP;
    pts.forEach((xy, i) => {
      const id = z === 1 ? i : z === 2 ? 26 + i : z === 3 ? 51 + i : 76 + i;
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(pts.length - 1, i + 1)];
      let tx = next[0] - prev[0];
      let tz = next[1] - prev[1];
      const len = Math.hypot(tx, tz) || 1;
      tx /= len;
      tz /= len;
      const server = byId.get(id);
      const type3d = visualType(id, server);
      const slideTo = type3d === 'rutsche' && server && Number.isInteger(server.to) ? server.to : null;
      points.push({
        id,
        index: points.length,
        zone: z,
        lx: xy[0],
        lz: xy[1],
        x: xy[0] + ox,
        z: xy[1],
        tx, tz,
        sx: -tz,
        sz: tx,
        type: server ? server.type : type3d,
        serverTo: slideTo,
        type3d,
        slideTo,
        building: null,
        color: fieldColor(id, type3d),
        label: id === 0 ? 'START' : id === 101 ? 'ZIEL' : String(id),
      });
    });
  }

  const buildings = SHOPS.map(shop => {
    const inside = points.filter(p => p.id >= shop.from && p.id <= shop.to);
    const box = boxAround(inside);
    const ox = (shop.zone - 1) * ZONE_GAP;
    for (const p of inside) {
      if (p.type3d === 'finanzpolizei' || p.type === 'finanzpolizei') continue;
      p.building = shop.id;
    }
    return {
      ...shop,
      ...box,
      lx: box.cx,
      lz: box.cz,
      cx: box.cx + ox,
      cz: box.cz,
    };
  });

  const JAIL_AT = { 1: [4.2, 6.2], 2: [4.2, 6.2], 3: [43.5, 26], 4: [4.2, 8.2] };
  const fpByZone = new Map();
  for (const p of points) {
    if (p.type3d !== 'finanzpolizei') continue;
    if (!fpByZone.has(p.zone)) fpByZone.set(p.zone, []);
    fpByZone.get(p.zone).push(p.id);
  }
  const jails = [...fpByZone.entries()].map(([zone, fields]) => {
    const at = JAIL_AT[zone] || [4.2, 6.2];
    const ox = (zone - 1) * ZONE_GAP;
    const place = slotsAt(at[0], at[1]);
    return {
      zone,
      fields,
      lx: at[0],
      lz: at[1],
      x: at[0] + ox,
      z: at[1],
      slots: place.map(s => ({ ...s, x: s.lx + ox, z: s.lz })),
    };
  });

  const slides = [];
  for (const f of fields || []) {
    if (f.type === 'rutsche' && Number.isInteger(f.to)) {
      slides.push({ field: f.id, to: f.to, indices: [f.id, f.to], live: true });
    }
  }

  const visualSlides = {};
  for (const p of points) if (p.slideTo) visualSlides[p.id] = p.slideTo;
  return { points, buildings, prisons: jails, slides, visualSlides, page: PAGE };
}
