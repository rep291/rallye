// Papercraft-Boxen, Papierstraße, Buntstift-Wiese, Park und Bahnhof. Eine Zone = eine Seite.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PAGE, fieldColor } from './layout.js';
import { toonMat, hullFrom, paperTexture } from './toon.js';
import { makeTextPlane } from './figures.js';

const INK = '#2E2E33';
const KRAFT = '#C4A574';
const KRAFT_IN = '#E8D2A8';
const KRAFT_EDGE = '#8D6A42';

function paint(geo, hex) {
  const c = new THREE.Color(hex);
  const arr = new Float32Array(geo.getAttribute('position').count * 3);
  for (let i = 0; i < geo.getAttribute('position').count; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

function put(bucket, w, h, d, x, y, z, color, rot) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rot[0] || 0, rot[1] || 0, rot[2] || 0)));
  g.translate(x, y, z);
  paint(g, color);
  bucket.push(g);
}

function mergeColored(geos) {
  const merged = mergeGeometries(geos, false);
  geos.forEach(g => g.dispose());
  const mesh = new THREE.Mesh(merged, toonMat('#ffffff', { vertexColors: true }));
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

function ribbon(pts, half, y, color) {
  if (pts.length < 2) return null;
  const pos = [];
  const nrm = [];
  const col = [];
  const idx = [];
  const c = new THREE.Color(color);
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    let tx = next.lx - prev.lx;
    let tz = next.lz - prev.lz;
    const len = Math.hypot(tx, tz) || 1;
    tx /= len;
    tz /= len;
    const rx = -tz * half;
    const rz = tx * half;
    pos.push(pts[i].lx + rx, y, pts[i].lz + rz, pts[i].lx - rx, y, pts[i].lz - rz);
    nrm.push(0, 1, 0, 0, 1, 0);
    col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    if (i) {
      const v = (i - 1) * 2;
      idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  return geo;
}

function hinge(bucket, span, flap, x, y, z, color, angle, axis) {
  const g = axis === 'x'
    ? new THREE.BoxGeometry(span, 0.08, flap)
    : new THREE.BoxGeometry(flap, 0.08, span);
  if (axis === 'x') g.translate(0, 0, Math.sign(angle || 1) * flap / 2);
  else g.translate(Math.sign(angle || 1) * flap / 2, 0, 0);
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(axis === 'x' ? angle : 0, 0, axis === 'z' ? angle : 0)));
  g.translate(x, y, z);
  paint(g, color);
  bucket.push(g);
}

function paperBox(bucket, b) {
  const H = b.open ? 1.15 : 2.35;
  const t = 0.16;
  const cx = b.lx != null ? b.lx : b.cx;
  const cz = b.lz != null ? b.lz : b.cz;
  const L = b.length;
  const D = b.depth;
  const alongX = b.alongX !== false;
  put(bucket, L, 0.08, D, cx, 0.06, cz, KRAFT_IN);
  const flap = 1.15;
  if (alongX) {
    put(bucket, L, H, t, cx, H / 2 + 0.08, cz + D / 2, KRAFT);
    put(bucket, L, H, t, cx, H / 2 + 0.08, cz - D / 2, KRAFT);
    const gap = 2.3;
    const jamb = Math.max(0.4, (D - gap) / 2);
    for (const x of [-L / 2, L / 2]) {
      for (const z of [-(gap / 2 + jamb / 2), gap / 2 + jamb / 2]) {
        put(bucket, t, H, jamb, cx + x, H / 2 + 0.08, cz + z, KRAFT_EDGE);
      }
    }
    hinge(bucket, L, flap, cx, H + 0.05, cz + D / 2, KRAFT, -0.65, 'x');
    hinge(bucket, L, flap, cx, H + 0.05, cz - D / 2, KRAFT, 0.65, 'x');
    hinge(bucket, D, flap, cx + L / 2, H + 0.05, cz, KRAFT, 0.55, 'z');
    hinge(bucket, D, flap, cx - L / 2, H + 0.05, cz, KRAFT, -0.55, 'z');
  } else {
    put(bucket, t, H, D, cx + L / 2, H / 2 + 0.08, cz, KRAFT);
    put(bucket, t, H, D, cx - L / 2, H / 2 + 0.08, cz, KRAFT);
    const gap = 2.3;
    const jamb = Math.max(0.4, (L - gap) / 2);
    for (const z of [-D / 2, D / 2]) {
      for (const x of [-(gap / 2 + jamb / 2), gap / 2 + jamb / 2]) {
        put(bucket, jamb, H, t, cx + x, H / 2 + 0.08, cz + z, KRAFT_EDGE);
      }
    }
    hinge(bucket, D, flap, cx + L / 2, H + 0.05, cz, KRAFT, 0.55, 'z');
    hinge(bucket, D, flap, cx - L / 2, H + 0.05, cz, KRAFT, -0.55, 'z');
  }
  propsFor(bucket, b);
}

function propsFor(bucket, b) {
  const y = 0.35;
  const x = b.cx;
  const z = b.cz + 1.6;
  if (b.id === 'schlosserei') {
    put(bucket, 1.4, 0.7, 0.6, x - 1.2, y, z, '#6d533c');
    put(bucket, 0.35, 0.55, 0.3, x + 0.4, y, z, '#3a3e44');
  } else if (b.id === 'kueche') {
    put(bucket, 1.5, 0.8, 0.6, x, y, z, '#f4f1ea');
    put(bucket, 0.5, 0.15, 0.4, x - 0.2, 0.85, z, '#c0c6cc');
    put(bucket, 1.6, 0.5, 0.25, x, 1.15, b.cz + b.depth / 2 - 0.2, '#b4332a');
  } else if (b.id === 'labor') {
    put(bucket, 1.6, 0.75, 0.55, x, y, z, '#e7eef3');
    put(bucket, 0.2, 0.45, 0.2, x + 0.4, 0.9, z, '#7EC8FF');
  } else if (b.id === 'lager') {
    put(bucket, 0.7, 0.7, 0.7, x - 1, y, z, '#c48a2a');
    put(bucket, 0.7, 1.0, 0.7, x + 0.9, y + 0.15, z, '#8D6A42');
  } else if (b.id === 'buero') {
    put(bucket, 1.3, 0.7, 0.6, x, y, z, '#d9e0ec');
    put(bucket, 0.45, 0.7, 0.45, x + 0.9, y, z - 0.7, '#2c4d86');
  } else if (b.id === 'friseur') {
    put(bucket, 0.7, 0.9, 0.7, x, y, z, '#f6e7ee');
    put(bucket, 0.1, 1.1, 0.7, x - 0.8, 0.8, z, '#d8e6ee');
  } else if (b.id === 'baustelle') {
    put(bucket, 0.3, 1.6, 0.3, x - 1.2, 0.8, z, '#e0b04a');
    put(bucket, 1.4, 0.2, 0.25, x - 1.2, 1.5, z, '#f2c14a');
    put(bucket, 0.35, 0.45, 0.35, x + 1.1, 0.25, z, '#F58220');
  } else if (b.id === 'krankenhaus') {
    put(bucket, 1.6, 0.45, 0.7, x, 0.4, z, '#f7f7f5');
    put(bucket, 0.5, 0.7, 0.3, x + 1.3, y, z, '#d23b4b');
  } else if (b.id === 'autowerkstatt') {
    put(bucket, 1.8, 0.45, 0.8, x, 0.4, z, '#3d7ff2');
    put(bucket, 0.7, 0.35, 0.7, x, 0.75, z, '#d5d8dc');
    put(bucket, 0.35, 0.35, 0.15, x + 1.3, 0.3, z + 0.5, '#22262c');
  }
}

function jailMesh(jail) {
  const bucket = [];
  const { lx, lz } = jail;
  put(bucket, 3.4, 0.08, 3.2, lx, 0.08, lz, KRAFT_IN);
  put(bucket, 3.4, 1.7, 0.12, lx, 0.9, lz + 1.5, KRAFT);
  put(bucket, 0.12, 1.7, 3.2, lx - 1.65, 0.9, lz, KRAFT);
  put(bucket, 0.12, 1.7, 3.2, lx + 1.65, 0.9, lz, KRAFT);
  for (let i = -1; i <= 1; i++) put(bucket, 0.08, 1.45, 0.08, lx + i * 0.28, 0.8, lz - 1.5, INK);
  put(bucket, 1.1, 1.35, 0.08, lx + 0.7, 0.75, lz - 1.5, KRAFT_EDGE);
  const mesh = mergeColored(bucket);
  const sign = makeTextPlane('Finanzpolizei  6!', { w: 512, h: 128, bg: '#4A3470', fg: '#ffffff', pw: 2.4, ph: 0.55, font: 42 });
  sign.position.set(lx, 2.15, lz - 1.55);
  const car = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.45, 0.85), toonMat('#1F5FD6'));
  body.position.y = 0.4;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.32, 0.75), toonMat('#f4f7fb'));
  roof.position.set(-0.15, 0.75, 0);
  const light = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.2), toonMat('#ff2a2a'));
  light.position.set(-0.15, 0.98, 0);
  car.add(body, roof, light);
  car.position.set(lx + 2.4, 0, lz + 2.1);
  const g = new THREE.Group();
  g.add(mesh, hullFrom(mesh.geometry, 0.035), sign, car);
  g.userData.car = car;
  return g;
}

function park(group, decor) {
  const trees = [];
  const bushes = [];
  const flowers = [];
  for (let i = 0; i < 18; i++) {
    const a = i * 0.7;
    trees.push({ x: 18 + Math.cos(a) * (2.4 + (i % 4)), z: 11 + Math.sin(a) * 1.6, s: 0.8 + (i % 3) * 0.15 });
  }
  for (let i = 0; i < 10; i++) bushes.push({ x: 15 + (i % 5) * 1.3, z: 9.2 + (i % 2) * 0.8 });
  for (let i = 0; i < 16; i++) flowers.push({ x: 16 + (i % 8) * 0.7, z: 13.2 + (i % 2) * 0.4, c: i % 2 ? '#FF8FAB' : '#FFE566' });
  const pond = new THREE.Mesh(new THREE.CircleGeometry(1.6, 16), toonMat('#7EC8FF'));
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(22, 0.05, 10.2);
  group.add(pond);
  putBench(group, 16.2, 12.2);
  putBench(group, 20.4, 12.4);
  group.userData.park = { trees, bushes, flowers, decor };
  return { trees, bushes, flowers };
}

function putBench(group, x, z) {
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.35), toonMat('#8D6A42'));
  seat.position.set(x, 0.42, z);
  const leg = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 0.08), toonMat('#5C4330'));
  leg.position.set(x, 0.22, z);
  group.add(seat, leg);
}

function station(group) {
  const bucket = [];
  put(bucket, 16, 2.4, 3.2, 30, 1.3, 5.2, KRAFT);
  put(bucket, 16, 0.1, 2.2, 30, 0.12, 8.2, '#d8d3ca');
  put(bucket, 0.4, 2.8, 0.4, 22.2, 1.5, 5.2, KRAFT_EDGE);
  put(bucket, 0.4, 2.8, 0.4, 37.8, 1.5, 5.2, KRAFT_EDGE);
  const hall = mergeColored(bucket);
  group.add(hall, hullFrom(hall.geometry, 0.04));
  const sign = makeTextPlane('Bahnhof', { w: 512, h: 128, bg: '#F7F1E3', fg: '#2E2E33', pw: 3.2, ph: 0.7, font: 64 });
  sign.position.set(30, 3.1, 3.7);
  group.add(sign);
  const train = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const car = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.15, 1.15), toonMat(i === 0 ? '#E6197E' : '#F7931E'));
    car.position.set(i * 2.7, 0.7, 0);
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.06), toonMat('#7EC8FF'));
    win.position.set(i * 2.7, 0.95, 0.58);
    train.add(car, win);
  }
  train.position.set(20, 0, 8.15);
  group.add(train);
  group.userData.train = train;
  group.userData.door = new THREE.Vector3(24.2, 0, 8.2);
}

function symbolAtlas() {
  const cols = 16;
  const rows = 8;
  const cell = 64;
  const c = document.createElement('canvas');
  c.width = cols * cell;
  c.height = rows * cell;
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  function cellAt(i, text, color) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * cell;
    const y = row * cell;
    g.fillStyle = color || '#ffffff';
    g.font = '700 36px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, x + cell / 2, y + cell / 2 + 2);
  }
  for (let n = 0; n <= 100; n++) cellAt(n, String(n), '#2E2E33');
  cellAt(110, '!', '#ffffff');
  cellAt(111, '?', '#ffffff');
  cellAt(112, '↓', '#ffffff');
  cellAt(113, '6!', '#ffffff');
  cellAt(114, 'S', '#ffffff');
  cellAt(115, '★', '#2E2E33');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

let atlas = null;

function symbolIndex(p) {
  if (p.type3d === 'start') return 114;
  if (p.type3d === 'ziel') return 115;
  if (p.type3d === 'aktion') return 110;
  if (p.type3d === 'frage') return 111;
  if (p.type3d === 'rutsche') return 112;
  if (p.type3d === 'finanzpolizei') return 113;
  return p.id;
}

function symbolMesh(pts) {
  if (!atlas) atlas = symbolAtlas();
  const pos = [];
  const uv = [];
  const idx = [];
  const cols = 16;
  const rows = 8;
  pts.forEach((p, n) => {
    const s = p.type3d === 'start' || p.type3d === 'ziel' ? 0.62 : 0.42;
    const y = 0.42;
    const x = p.lx;
    const z = p.lz;
    const i = symbolIndex(p);
    const col = i % cols;
    const row = Math.floor(i / cols);
    const u0 = col / cols;
    const v1 = 1 - row / rows;
    const u1 = (col + 1) / cols;
    const v0 = 1 - (row + 1) / rows;
    const b = pos.length / 3;
    pos.push(x - s, y, z - s, x + s, y, z - s, x + s, y, z + s, x - s, y, z + s);
    uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: atlas, transparent: true, depthWrite: false }));
  mesh.renderOrder = 3;
  return mesh;
}

function instanced(geo, mat, places, key) {
  if (!places.length) return null;
  const mesh = new THREE.InstancedMesh(geo, mat, places.length);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  places.forEach((p, i) => {
    dummy.position.set(p.x, p.y || 0, p.z);
    dummy.scale.setScalar(p.s || 1);
    dummy.rotation.y = p.rot || 0;
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (p.c) mesh.setColorAt(i, color.set(p.c));
  });
  mesh.userData.fullCount = places.length;
  mesh.userData.kind = key;
  return mesh;
}

export function buildZone(layout, zone) {
  const pts = layout.points.filter(p => p.zone === zone);
  const content = new THREE.Group();
  content.name = 'zone' + zone;

  const paper = new THREE.Mesh(new THREE.PlaneGeometry(PAGE.w + 1.2, PAGE.d + 1.2), toonMat('#F7F1E3', { map: paperTexture() }));
  paper.rotation.x = -Math.PI / 2;
  paper.position.set(PAGE.w / 2, -0.04, PAGE.d / 2);
  content.add(paper);

  const grass = new THREE.Mesh(new THREE.PlaneGeometry(PAGE.w - 1.4, PAGE.d - 1.4), toonMat('#8FCF5A', { map: paperTexture() }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(PAGE.w / 2, -0.02, PAGE.d / 2);
  content.add(grass);

  const frame = [];
  put(frame, PAGE.w + 1.4, 0.18, 0.18, PAGE.w / 2, 0.08, -0.2, INK);
  put(frame, PAGE.w + 1.4, 0.18, 0.18, PAGE.w / 2, 0.08, PAGE.d + 0.2, INK);
  put(frame, 0.18, 0.18, PAGE.d + 1.4, -0.2, 0.08, PAGE.d / 2, INK);
  put(frame, 0.18, 0.18, PAGE.d + 1.4, PAGE.w + 0.2, 0.08, PAGE.d / 2, INK);
  content.add(mergeColored(frame));

  const edge = ribbon(pts, 1.15, 0.03, '#F5F2EB');
  const road = ribbon(pts, 0.72, 0.05, '#D8D3CA');
  if (edge) content.add(new THREE.Mesh(edge, toonMat('#ffffff', { vertexColors: true })));
  if (road) content.add(new THREE.Mesh(road, toonMat('#ffffff', { vertexColors: true })));

  const boxes = [];
  for (const b of layout.buildings.filter(x => x.zone === zone)) {
    paperBox(boxes, b);
    const sign = makeTextPlane(b.name, { w: 512, h: 128, bg: '#FFE566', fg: '#2E2E33', pw: 2.6, ph: 0.55, font: 42 });
    sign.position.set(b.lx, 2.8, b.lz - b.depth / 2 - 0.4);
    content.add(sign);
  }
  if (boxes.length) {
    const mesh = mergeColored(boxes);
    content.add(mesh, hullFrom(mesh.geometry, 0.04));
  }

  const rimGeo = new THREE.CylinderGeometry(0.86, 0.86, 0.08, 16);
  const discGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.16, 16);
  const rim = new THREE.InstancedMesh(rimGeo, toonMat('#2E2E33'), pts.length);
  const disc = new THREE.InstancedMesh(discGeo, toonMat('#ffffff'), pts.length);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  pts.forEach((p, i) => {
    dummy.position.set(p.lx, 0.12, p.lz);
    dummy.scale.setScalar(p.type3d === 'start' || p.type3d === 'ziel' ? 1.25 : 1);
    dummy.updateMatrix();
    rim.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 0.24;
    dummy.updateMatrix();
    disc.setMatrixAt(i, dummy.matrix);
    disc.setColorAt(i, color.set(p.color || fieldColor(p.id, p.type3d)));
  });
  content.add(rim, disc, symbolMesh(pts));

  const trees = [];
  const bushes = [];
  const flowers = [];
  for (let i = 0; i < 14; i++) {
    const edgeSide = i % 2 ? 1 : -1;
    const p = pts[Math.min(pts.length - 1, 1 + i * 2)];
    trees.push({ x: p.lx + p.sx * edgeSide * 3.4, z: p.lz + p.sz * edgeSide * 3.4, s: 0.75 + (i % 3) * 0.12 });
  }
  for (let i = 0; i < 12; i++) {
    const p = pts[i * 2] || pts[0];
    bushes.push({ x: p.lx + p.sx * 2.4, z: p.lz + p.sz * 2.4 });
    flowers.push({ x: p.lx - p.sx * 2.1, z: p.lz - p.sz * 2.1, c: i % 2 ? '#FF8FAB' : '#B6F2C3' });
  }
  if (zone === 2) {
    const extra = park(content, 1);
    trees.push(...extra.trees);
    bushes.push(...extra.bushes);
    flowers.push(...extra.flowers);
  }
  if (zone === 4) station(content);

  const trunk = instanced(new THREE.CylinderGeometry(0.12, 0.16, 0.7, 5), toonMat('#8D6A42'), trees.map(t => ({ x: t.x, y: 0.35, z: t.z, s: t.s })), 'trunk');
  const crown = instanced(new THREE.ConeGeometry(0.55, 1.3, 6), toonMat('#5A9A32'), trees.map(t => ({ x: t.x, y: 1.15, z: t.z, s: t.s })), 'crown');
  const bush = instanced(new THREE.SphereGeometry(0.28, 6, 5), toonMat('#4F8A2C'), bushes.map(t => ({ x: t.x, y: 0.22, z: t.z })), 'bush');
  const flower = instanced(new THREE.SphereGeometry(0.12, 5, 4), toonMat('#ffffff'), flowers.map(t => ({ ...t, y: 0.16, s: 1 })), 'flower');
  for (const mesh of [trunk, crown, bush, flower]) if (mesh) content.add(mesh);
  content.userData.decor = [trunk, crown, bush, flower].filter(Boolean);

  const jail = layout.prisons.find(j => j.zone === zone);
  if (jail) content.add(jailMesh(jail));

  for (const p of pts) {
    if (!p.slideTo) continue;
    const target = layout.points.find(q => q.id === p.slideTo);
    const note = makeTextPlane('↓ ' + p.slideTo, { w: 256, h: 128, bg: '#E8338B', fg: '#ffffff', pw: 0.7, ph: 0.36, font: 64 });
    note.position.set(p.lx, 0.7, p.lz);
    note.rotation.x = -Math.PI / 2;
    content.add(note);
    if (target && target.zone === zone) {
      const mid = makeTextPlane('von ' + p.id, { w: 256, h: 96, bg: '#FF8FAB', fg: '#2E2E33', pw: 0.7, ph: 0.28, font: 40 });
      mid.position.set(target.lx, 0.55, target.lz + 0.55);
      mid.rotation.x = -Math.PI / 2;
      content.add(mid);
    }
  }

  const clouds = [];
  for (let i = 0; i < 6; i++) clouds.push({ x: 6 + i * 7, y: 7.5 + (i % 2), z: 4 + (i % 3) * 6, s: 1 });
  const cloud = instanced(new THREE.SphereGeometry(0.7, 6, 5), toonMat('#ffffff'), clouds, 'cloud');
  if (cloud) content.add(cloud);

  const pivot = new THREE.Group();
  pivot.position.set(PAGE.w / 2, 0, PAGE.d);
  content.position.set(-PAGE.w / 2, 0, -PAGE.d);
  pivot.add(content);
  pivot.userData.zone = zone;
  pivot.userData.content = content;
  return pivot;
}

export function applyDecor(pivot, frac) {
  const list = (pivot.userData.content && pivot.userData.content.userData.decor) || [];
  for (const mesh of list) {
    const full = mesh.userData.fullCount || mesh.count;
    const keep = mesh.userData.kind === 'flower' || mesh.userData.kind === 'bush' ? frac : Math.max(frac, 0.45);
    mesh.count = Math.max(0, Math.round(full * keep));
  }
}
