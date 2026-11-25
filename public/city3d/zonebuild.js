// Papercraft-Boxen, Buntstift-Wiese, Park und Bahnhof. Eine Zone = eine Flipchart-Seite.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PAGE, fieldColor, zoneOf } from './layout.js';
import { toonMat, hullFrom, hullGeo, paperTexture, hatchTexture, inkMat } from './toon.js';
import { makeTextPlane, makePerson } from './figures.js';

const INK = '#2E2E33';
const KRAFT = '#C4A574';
const KRAFT_IN = '#E8D2A8';
const KRAFT_EDGE = '#8D6A42';
const CREASE = '#5C4330';

const paperMat = toonMat('#ffffff', { vertexColors: true, map: paperTexture() });
const vcMat = toonMat('#ffffff', { vertexColors: true });
const flatMat = toonMat('#ffffff', { flat: true });
const outlineMat = inkMat();

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

function mergeWith(geos, mat) {
  const merged = mergeGeometries(geos, false);
  geos.forEach(g => g.dispose());
  const mesh = new THREE.Mesh(merged, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

function mergeColored(geos) {
  return mergeWith(geos, paperMat);
}

function mergeToon(geos) {
  return mergeWith(geos, vcMat);
}

function withHull(mesh, amount) {
  const hull = hullFrom(mesh.geometry, amount || 0.045);
  return [mesh, hull];
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
    ? new THREE.BoxGeometry(span, 0.07, flap)
    : new THREE.BoxGeometry(flap, 0.07, span);
  if (axis === 'x') g.translate(0, 0, Math.sign(angle || 1) * flap / 2);
  else g.translate(Math.sign(angle || 1) * flap / 2, 0, 0);
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(axis === 'x' ? angle : 0, 0, axis === 'z' ? angle : 0)));
  g.translate(x, y, z);
  paint(g, color);
  bucket.push(g);
  const crease = axis === 'x'
    ? new THREE.BoxGeometry(span, 0.05, 0.07)
    : new THREE.BoxGeometry(0.07, 0.05, span);
  crease.translate(x, y + 0.02, z);
  paint(crease, CREASE);
  bucket.push(crease);
}

function flute(bucket, length, x, y, z, axis) {
  const n = 8;
  const step = length / n;
  for (let i = 0; i < n; i++) {
    const o = -length / 2 + step * (i + 0.5);
    const color = i % 2 ? KRAFT_EDGE : '#b89563';
    if (axis === 'x') put(bucket, step * 0.9, 0.12, 0.1, x + o, y, z, color);
    else put(bucket, 0.1, 0.12, step * 0.9, x, y, z + o, color);
  }
}

function spot(b, u, v) {
  const along = b.alongX !== false;
  const lu = u * (b.length / 2 - 0.9);
  const lv = v * (b.depth / 2 - 0.95);
  if (along) return [b.lx + lu, b.lz + lv];
  return [b.lx + lv, b.lz + lu];
}

function paperBox(bucket, decals, b) {
  const H = b.open ? 1.25 : 2.45;
  const t = 0.14;
  const cx = b.lx;
  const cz = b.lz;
  const L = b.length;
  const D = b.depth;
  const alongX = b.alongX !== false;
  put(bucket, L - 0.08, 0.1, D - 0.08, cx, 0.06, cz, KRAFT_IN);
  const flap = 1.25;
  if (alongX) {
    put(bucket, L, H, t, cx, H / 2 + 0.08, cz + D / 2, KRAFT);
    put(bucket, L, H, t, cx, H / 2 + 0.08, cz - D / 2, KRAFT);
    put(bucket, L - 0.3, H - 0.35, 0.05, cx, H / 2, cz + D / 2 - 0.12, KRAFT_IN);
    put(bucket, L - 0.3, H - 0.35, 0.05, cx, H / 2, cz - D / 2 + 0.12, KRAFT_IN);
    flute(bucket, L, cx, H + 0.12, cz + D / 2 + 0.04, 'x');
    flute(bucket, L, cx, H + 0.12, cz - D / 2 - 0.04, 'x');
    const gap = 2.4;
    const jamb = Math.max(0.45, (D - gap) / 2);
    for (const x of [-L / 2, L / 2]) {
      for (const z of [-(gap / 2 + jamb / 2), gap / 2 + jamb / 2]) {
        put(bucket, t, H, jamb, cx + x, H / 2 + 0.08, cz + z, KRAFT);
      }
      const leaf = new THREE.BoxGeometry(0.08, H * 0.9, 0.9);
      leaf.translate(0, 0, 0.45);
      leaf.rotateY(x > 0 ? -1.25 : 1.25);
      leaf.translate(cx + x, H / 2 + 0.04, cz - gap / 2);
      paint(leaf, KRAFT_EDGE);
      bucket.push(leaf);
    }
    hinge(bucket, L, flap, cx, H + 0.08, cz + D / 2, KRAFT, -0.72, 'x');
    hinge(bucket, L, flap, cx, H + 0.08, cz - D / 2, KRAFT, 0.72, 'x');
    hinge(bucket, D, flap * 0.85, cx + L / 2, H + 0.08, cz, KRAFT, 0.6, 'z');
    hinge(bucket, D, flap * 0.85, cx - L / 2, H + 0.08, cz, KRAFT, -0.6, 'z');
    decals.push({ kind: 'window', w: 0.85, h: 0.7, x: cx - L * 0.22, y: H * 0.58, z: cz + D / 2 + 0.09, rotY: 0 });
    decals.push({ kind: 'window', w: 0.85, h: 0.7, x: cx + L * 0.22, y: H * 0.58, z: cz + D / 2 + 0.09, rotY: 0 });
    decals.push({ kind: 'window', w: 0.7, h: 0.6, x: cx, y: H * 0.55, z: cz - D / 2 - 0.09, rotY: Math.PI });
  } else {
    put(bucket, t, H, D, cx + L / 2, H / 2 + 0.08, cz, KRAFT);
    put(bucket, t, H, D, cx - L / 2, H / 2 + 0.08, cz, KRAFT);
    put(bucket, 0.05, H - 0.35, D - 0.3, cx + L / 2 - 0.12, H / 2, cz, KRAFT_IN);
    put(bucket, 0.05, H - 0.35, D - 0.3, cx - L / 2 + 0.12, H / 2, cz, KRAFT_IN);
    flute(bucket, D, cx + L / 2 + 0.04, H + 0.12, cz, 'z');
    flute(bucket, D, cx - L / 2 - 0.04, H + 0.12, cz, 'z');
    const gap = 2.4;
    const jamb = Math.max(0.45, (L - gap) / 2);
    for (const z of [-D / 2, D / 2]) {
      for (const x of [-(gap / 2 + jamb / 2), gap / 2 + jamb / 2]) {
        put(bucket, jamb, H, t, cx + x, H / 2 + 0.08, cz + z, KRAFT);
      }
    }
    hinge(bucket, D, flap, cx + L / 2, H + 0.08, cz, KRAFT, 0.6, 'z');
    hinge(bucket, D, flap, cx - L / 2, H + 0.08, cz, KRAFT, -0.6, 'z');
    decals.push({ kind: 'window', w: 0.85, h: 0.7, x: cx + L / 2 + 0.09, y: H * 0.58, z: cz - D * 0.18, rotY: Math.PI / 2 });
    decals.push({ kind: 'window', w: 0.85, h: 0.7, x: cx + L / 2 + 0.09, y: H * 0.58, z: cz + D * 0.18, rotY: Math.PI / 2 });
  }
  propsFor(bucket, b, H);
  return H;
}

function propsFor(bucket, b, H) {
  const y = 0.42;
  if (b.id === 'schlosserei') {
    const [ax, az] = spot(b, -0.35, 0.82);
    put(bucket, 0.7, 0.45, 0.42, ax, y, az, '#3a3e44');
    put(bucket, 0.28, 0.16, 0.28, ax, y + 0.3, az, '#5c6168');
    const [wx, wz] = spot(b, 0.35, 0.78);
    put(bucket, 1.3, 0.7, 0.5, wx, y, wz, '#6d533c');
    put(bucket, 0.35, 0.12, 0.22, wx + 0.2, y + 0.42, wz, '#8a929a');
    const [sx, sz] = spot(b, 0.05, -0.82);
    put(bucket, 0.9, 1.15, 0.35, sx, 0.7, sz, '#8D6A42');
    put(bucket, 0.28, 0.22, 0.28, sx, 1.35, sz, '#c48a2a');
  } else if (b.id === 'kueche') {
    const [hx, hz] = spot(b, -0.25, 0.78);
    put(bucket, 1.5, 0.72, 0.55, hx, y, hz, '#d5d8dc');
    put(bucket, 1.35, 0.08, 0.42, hx, y + 0.4, hz, '#2E2E33');
    put(bucket, 0.42, 0.16, 0.42, hx + 0.35, y + 0.52, hz, '#8d9399');
    put(bucket, 0.7, 0.28, 0.4, hx - 0.15, 1.35, hz, '#c5ccd1');
    const [cx, cz] = spot(b, 0.45, 0.72);
    put(bucket, 0.7, 0.85, 0.45, cx, y + 0.1, cz, '#3e9a4a');
    put(bucket, 0.12, 0.28, 0.12, cx - 0.15, y + 0.65, cz, '#7EC8FF');
    put(bucket, 0.12, 0.34, 0.12, cx + 0.12, y + 0.68, cz, '#FF8FAB');
    put(bucket, 0.1, 0.22, 0.1, cx + 0.02, y + 0.6, cz + 0.12, '#FFE566');
    const along = b.alongX !== false;
    const aw = b.length * 0.7;
    for (let i = 0; i < 6; i++) {
      const color = i % 2 ? '#d23b4b' : '#f7f4ef';
      const o = -aw / 2 + (i + 0.5) * (aw / 6);
      if (along) put(bucket, aw / 6 * 0.92, 0.07, 0.55, b.lx + o, H - 0.15, b.lz + b.depth / 2 + 0.28, color);
      else put(bucket, 0.55, 0.07, aw / 6 * 0.92, b.lx + b.length / 2 + 0.28, H - 0.15, b.lz + o, color);
    }
  } else if (b.id === 'labor') {
    const [tx, tz] = spot(b, 0, 0.8);
    put(bucket, 1.7, 0.7, 0.5, tx, y, tz, '#e7eef3');
    put(bucket, 0.16, 0.42, 0.16, tx - 0.4, 0.95, tz, '#7EC8FF');
    put(bucket, 0.14, 0.5, 0.14, tx - 0.1, 1.0, tz, '#B6F2C3');
    put(bucket, 0.18, 0.36, 0.18, tx + 0.25, 0.92, tz, '#FF8FAB');
    put(bucket, 0.55, 0.4, 0.35, tx + 0.55, 0.85, tz, '#5a6a78');
  } else if (b.id === 'lager') {
    const [a, az] = spot(b, -0.4, 0.7);
    put(bucket, 0.7, 0.55, 0.7, a, 0.4, az, '#c48a2a');
    put(bucket, 0.6, 0.5, 0.6, a + 0.15, 0.9, az, '#8D6A42');
    const [b1, bz] = spot(b, 0.35, 0.65);
    put(bucket, 0.75, 0.7, 0.75, b1, 0.45, bz, '#a56b28');
    put(bucket, 0.7, 0.55, 0.7, b1 + 0.1, 1.05, bz, '#c48a2a');
    const [px, pz] = spot(b, 0.1, -0.55);
    put(bucket, 1.1, 0.12, 0.9, px, 0.16, pz, '#d8d0c2');
  } else if (b.id === 'buero') {
    const [dx, dz] = spot(b, 0, 0.7);
    put(bucket, 1.4, 0.7, 0.6, dx, y, dz, '#d9e0ec');
    put(bucket, 0.5, 0.08, 0.32, dx, y + 0.42, dz, '#2E2E33');
    put(bucket, 0.45, 0.7, 0.45, dx + 0.85, y, dz - 0.35, '#2c4d86');
    const [px, pz] = spot(b, -0.55, -0.6);
    put(bucket, 0.45, 0.35, 0.4, px, 0.55, pz, '#e8edf2');
  } else if (b.id === 'friseur') {
    const [cx, cz] = spot(b, 0, 0.55);
    put(bucket, 0.7, 0.85, 0.7, cx, y, cz, '#f6e7ee');
    put(bucket, 0.55, 0.1, 0.55, cx, y + 0.48, cz, '#ffffff');
    const [mx, mz] = spot(b, -0.55, 0.85);
    put(bucket, 0.08, 1.15, 0.7, mx, 0.85, mz, '#d5e4ee');
    const [tx, tz] = spot(b, 0.6, 0.75);
    put(bucket, 0.8, 0.7, 0.4, tx, y, tz, '#c45b8a');
  } else if (b.id === 'baustelle') {
    const [px, pz] = spot(b, -0.4, 0.4);
    put(bucket, 0.16, 1.7, 0.16, px - 0.45, 0.9, pz, '#e0b04a');
    put(bucket, 0.16, 1.7, 0.16, px + 0.45, 0.9, pz, '#e0b04a');
    put(bucket, 1.3, 0.14, 0.18, px, 1.65, pz, '#f2c14a');
    put(bucket, 0.28, 0.45, 0.28, px + 1.3, 0.28, pz, '#F58220');
    put(bucket, 0.22, 0.4, 0.22, px + 1.6, 0.26, pz + 0.3, '#F58220');
  } else if (b.id === 'krankenhaus') {
    const [bx, bz] = spot(b, -0.15, 0.65);
    put(bucket, 1.5, 0.4, 0.7, bx, 0.35, bz, '#f7f7f5');
    put(bucket, 0.4, 0.12, 0.55, bx, 0.58, bz, '#d8e6ee');
    const [sx, sz] = spot(b, 0.65, 0.7);
    put(bucket, 0.45, 0.7, 0.35, sx, y, sz, '#f4f7fb');
    put(bucket, 0.28, 0.28, 0.08, sx, 1.15, sz, '#d23b4b');
  } else if (b.id === 'autowerkstatt') {
    const [cx, cz] = spot(b, 0, 0.45);
    put(bucket, 1.7, 0.4, 0.85, cx, 0.4, cz, '#3d7ff2');
    put(bucket, 0.7, 0.12, 0.7, cx - 0.15, 0.68, cz, '#d5d8dc');
    put(bucket, 0.35, 0.35, 0.16, cx + 0.85, 0.28, cz, '#22262c');
    const [rx, rz] = spot(b, 0.7, -0.45);
    put(bucket, 0.55, 0.18, 0.55, rx, 0.2, rz, '#22262c');
  }
}

let markerTex = null;
function markerAtlas() {
  if (markerTex) return markerTex;
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 128;
  const g = c.getContext('2d');
  function frame(x) {
    g.fillStyle = '#C4A574';
    g.fillRect(x, 0, 128, 128);
    g.strokeStyle = '#2E2E33';
    g.lineWidth = 10;
    g.strokeRect(x + 8, 8, 112, 112);
  }
  frame(0);
  g.fillStyle = '#9fd4f5';
  g.fillRect(18, 18, 92, 92);
  g.strokeStyle = '#2E2E33';
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(64, 18);
  g.lineTo(64, 110);
  g.moveTo(18, 64);
  g.lineTo(110, 64);
  g.stroke();
  frame(128);
  g.fillStyle = '#a56b3c';
  g.fillRect(128 + 28, 16, 72, 100);
  g.fillStyle = '#e8d2a8';
  g.beginPath();
  g.arc(128 + 84, 68, 6, 0, Math.PI * 2);
  g.fill();
  frame(256);
  g.fillStyle = '#f7f4ef';
  g.beginPath();
  g.arc(256 + 64, 64, 46, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#2E2E33';
  g.lineWidth = 6;
  g.stroke();
  g.beginPath();
  g.moveTo(256 + 64, 64);
  g.lineTo(256 + 64, 32);
  g.moveTo(256 + 64, 64);
  g.lineTo(256 + 86, 70);
  g.stroke();
  markerTex = new THREE.CanvasTexture(c);
  markerTex.colorSpace = THREE.SRGBColorSpace;
  markerTex.magFilter = THREE.LinearFilter;
  markerTex.minFilter = THREE.LinearFilter;
  return markerTex;
}

const KIND_U = { window: 0, door: 1, clock: 2 };

function buildDecals(list) {
  if (!list.length) return null;
  const geos = [];
  for (const d of list) {
    const g = new THREE.PlaneGeometry(d.w, d.h);
    const uv = g.attributes.uv;
    const cell = (KIND_U[d.kind] || 0) / 3;
    for (let i = 0; i < uv.count; i++) uv.setX(i, cell + uv.getX(i) / 3);
    uv.needsUpdate = true;
    g.applyMatrix4(new THREE.Matrix4().makeRotationY(d.rotY || 0));
    g.translate(d.x, d.y, d.z);
    geos.push(g);
  }
  const merged = mergeGeometries(geos, false);
  geos.forEach(g => g.dispose());
  const mesh = new THREE.Mesh(merged, new THREE.MeshBasicMaterial({
    map: markerAtlas(),
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  }));
  return mesh;
}

function jailMesh(jail) {
  const bucket = [];
  const { lx, lz } = jail;
  put(bucket, 3.6, 0.1, 3.3, lx, 0.08, lz, KRAFT_IN);
  put(bucket, 3.6, 1.85, 0.12, lx, 1.0, lz + 1.55, KRAFT);
  put(bucket, 0.12, 1.85, 3.3, lx - 1.75, 1.0, lz, KRAFT);
  put(bucket, 0.12, 1.85, 3.3, lx + 1.75, 1.0, lz, KRAFT);
  flute(bucket, 3.4, lx, 1.95, lz + 1.62, 'x');
  for (let i = -2; i <= 2; i++) put(bucket, 0.08, 1.55, 0.08, lx + i * 0.32 - 0.55, 0.85, lz - 1.55, INK);
  put(bucket, 1.5, 0.08, 0.08, lx - 0.55, 1.55, lz - 1.55, INK);
  put(bucket, 1.15, 1.5, 0.08, lx + 0.85, 0.82, lz - 1.55, KRAFT_EDGE, [0, -0.35, 0]);
  const cuffs = new THREE.TorusGeometry(0.16, 0.035, 5, 10);
  cuffs.translate(lx + 1.15, 0.7, lz - 1.35);
  paint(cuffs, '#d5dbe3');
  bucket.push(cuffs);
  const mesh = mergeColored(bucket);
  const sign = makeTextPlane('6!', { w: 512, h: 200, bg: '#4A3470', fg: '#ffffff', pw: 1.5, ph: 0.58, font: 120, marker: true });
  sign.position.set(lx, 2.25, lz + 1.7);
  const car = policeCar();
  car.position.set(lx + 2.5, 0, lz + 1.8);
  car.userData.home = car.position.clone();
  const g = new THREE.Group();
  g.add(mesh, hullFrom(mesh.geometry, 0.04), sign, car);
  g.userData.car = car;
  return g;
}

function policeCar() {
  const bucket = [];
  put(bucket, 1.85, 0.4, 0.92, 0, 0.42, 0, '#1F5FD6');
  put(bucket, 0.85, 0.34, 0.8, -0.12, 0.76, 0, '#f7f8fb');
  put(bucket, 1.7, 0.08, 0.94, 0, 0.58, 0, '#f4f7fb');
  put(bucket, 0.2, 0.1, 0.16, -0.05, 1.0, 0.18, '#e02323');
  put(bucket, 0.2, 0.1, 0.16, -0.05, 1.0, -0.18, '#3d7ff2');
  for (const [x, z] of [[-0.55, 0.48], [0.55, 0.48], [-0.55, -0.48], [0.55, -0.48]]) {
    const wheel = new THREE.CylinderGeometry(0.2, 0.2, 0.14, 8);
    wheel.rotateZ(Math.PI / 2);
    wheel.translate(x, 0.2, z);
    paint(wheel, '#2E2E33');
    bucket.push(wheel);
  }
  const mesh = mergeToon(bucket);
  const car = new THREE.Group();
  car.add(mesh, hullFrom(mesh.geometry, 0.03));
  const cop = makePerson({ shirt: '#1F5FD6', pants: '#152038', cap: '#1F5FD6', hair: '#2a211c' });
  cop.scale.setScalar(0.62);
  cop.position.set(-0.12, -0.05, 0);
  car.add(cop);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(1.05, 14), new THREE.MeshBasicMaterial({ color: '#2a3a22', transparent: true, opacity: 0.28, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.03;
  car.add(blob);
  return car;
}

function putBench(bucket, x, z, rot) {
  put(bucket, 1.25, 0.08, 0.38, x, 0.46, z, '#8D6A42', [0, rot || 0, 0]);
  put(bucket, 1.2, 0.32, 0.08, x, 0.62, z - 0.16, '#6d533c', [0, rot || 0, 0]);
  put(bucket, 0.08, 0.4, 0.32, x - 0.52, 0.24, z, '#5C4330', [0, rot || 0, 0]);
  put(bucket, 0.08, 0.4, 0.32, x + 0.52, 0.24, z, '#5C4330', [0, rot || 0, 0]);
}

function park(group, bucket) {
  const trees = [];
  const bushes = [];
  const flowers = [];
  const cx = 22;
  const cz = 5.6;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const rad = 3.3 + (i % 3) * 0.45;
    trees.push({ x: cx + Math.cos(a) * rad, z: cz + Math.sin(a) * rad * 0.72, s: 0.85 + (i % 3) * 0.18, c: i % 2 ? '#3E7A1C' : '#4F8A2C' });
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    bushes.push({ x: cx + Math.cos(a) * 2.15, z: cz + Math.sin(a) * 1.45 });
  }
  const cols = ['#FF8FAB', '#FFE566', '#ffffff', '#B6F2C3'];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    flowers.push({ x: cx + Math.cos(a) * 2.7, z: cz + Math.sin(a) * 1.85, c: cols[i % 4] });
  }
  put(bucket, 2.4, 0.18, 2.4, cx, 0.12, cz, '#d9d3c6');
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.95, 18), toonMat('#7EC8FF'));
  water.rotation.x = -Math.PI / 2;
  water.position.set(cx, 0.2, cz);
  group.add(water);
  const bowl = new THREE.TorusGeometry(0.95, 0.1, 6, 18);
  bowl.rotateX(Math.PI / 2);
  bowl.translate(cx, 0.28, cz);
  paint(bowl, '#d9d3c6');
  bucket.push(bowl);
  put(bucket, 0.22, 0.85, 0.22, cx, 0.62, cz, '#cfc6b6');
  put(bucket, 0.5, 0.1, 0.5, cx, 1.05, cz, '#7EC8FF');
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), toonMat('#E6197E', { flat: true }));
  ball.position.set(cx + 1.6, 0.2, cz + 1.1);
  group.add(ball);
  putBench(bucket, cx - 2.4, cz + 1.5, 0.4);
  putBench(bucket, cx + 2.5, cz + 0.2, -0.6);
  const path = ribbon([
    { lx: 10, lz: 8.2 }, { lx: 14, lz: 6.4 }, { lx: cx - 1.2, lz: cz + 0.2 },
  ], 0.45, 0.04, '#e4d7b8');
  if (path) group.add(new THREE.Mesh(path, paperMat));
  return { trees, bushes, flowers };
}

function station(group, decals) {
  const bucket = [];
  const hx = 31;
  const hz = 4.3;
  const L = 16;
  const D = 3.5;
  const H = 2.55;
  put(bucket, L, 0.1, D, hx, 0.08, hz, KRAFT_IN);
  put(bucket, L, H, 0.12, hx, H / 2, hz - D / 2, KRAFT);
  put(bucket, 0.12, H, D, hx - L / 2, H / 2, hz, KRAFT);
  put(bucket, 0.12, H, D, hx + L / 2, H / 2, hz, KRAFT);
  put(bucket, 4.4, H, 0.12, hx - 5.6, H / 2, hz + D / 2, KRAFT);
  put(bucket, 4.4, H, 0.12, hx + 5.6, H / 2, hz + D / 2, KRAFT);
  put(bucket, 6.2, 0.55, 0.12, hx, H - 0.28, hz + D / 2, KRAFT);
  flute(bucket, L, hx, H + 0.08, hz + D / 2 + 0.02, 'x');
  hinge(bucket, L, 1.2, hx, H + 0.05, hz - D / 2, KRAFT, 0.7, 'x');
  hinge(bucket, D, 1.05, hx + L / 2, H + 0.05, hz, KRAFT, 0.55, 'z');
  hinge(bucket, D, 1.05, hx - L / 2, H + 0.05, hz, KRAFT, -0.55, 'z');
  put(bucket, 17, 0.1, 2.8, hx, 0.1, hz + D / 2 + 1.7, '#d8d3ca');
  put(bucket, 17.2, 0.08, 0.12, hx, 0.08, hz + D / 2 + 2.9, '#8a8680');
  put(bucket, 17.2, 0.08, 0.12, hx, 0.08, hz + D / 2 + 2.35, '#8a8680');
  const hall = mergeColored(bucket);
  group.add(...withHull(hall, 0.045));
  decals.push({ kind: 'clock', w: 1.35, h: 1.35, x: hx, y: 2.15, z: hz + 1.9, rotY: 0 });
  decals.push({ kind: 'window', w: 0.8, h: 0.7, x: hx - 6.2, y: 1.5, z: hz + 1.85, rotY: 0 });
  decals.push({ kind: 'window', w: 0.8, h: 0.7, x: hx + 6.2, y: 1.5, z: hz + 1.85, rotY: 0 });
  const sign = makeTextPlane('Bahnhof', { w: 640, h: 160, bg: '#FFE566', fg: '#2E2E33', pw: 3.4, ph: 0.7, font: 72, marker: true });
  sign.position.set(hx, 3.15, hz + 1.9);
  group.add(sign);
  const train = new THREE.Group();
  const body = [];
  const glass = [];
  const wheels = [];
  const colors = ['#E6197E', '#F7931E', '#7CC242', '#1F5FD6', '#FFD23F'];
  for (let i = 0; i < 5; i++) {
    const x = i * 2.55;
    put(body, 2.35, 1.05, 1.15, x, 0.72, 0, colors[i]);
    put(body, 2.2, 0.12, 1.2, x, 1.28, 0, '#f7f4ef');
    put(glass, 1.5, 0.32, 0.06, x, 0.95, 0.6, '#bfe6fb');
    for (const wx of [-0.7, 0.7]) {
      const wheel = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 8);
      wheel.rotateZ(Math.PI / 2);
      wheel.translate(x + wx, 0.22, 0.55);
      paint(wheel, '#2E2E33');
      wheels.push(wheel);
    }
  }
  const shell = mergeToon(body);
  train.add(shell, hullFrom(shell.geometry, 0.035));
  train.add(mergeToon(glass));
  train.add(mergeToon(wheels));
  train.position.set(hx - 6.2, 0, hz + 4.45);
  group.add(train);
  group.userData.train = train;
  group.userData.door = new THREE.Vector3(hx - 1.2, 0, hz + 3.2);
}

function glyph(g, p, x, y, s, arrival) {
  g.lineJoin = 'round';
  g.lineWidth = 10;
  g.strokeStyle = '#2E2E33';
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const cx = x + s / 2;
  const cy = y + s / 2;
  function stamp(text, size, dy) {
    g.font = `800 ${size}px system-ui, sans-serif`;
    g.strokeText(text, cx, cy + (dy || 0));
    g.fillText(text, cx, cy + (dy || 0));
  }
  if (p.type3d === 'start') stamp('START', 40, 4);
  else if (p.type3d === 'ziel') stamp('ZIEL', 48, 4);
  else if (p.type3d === 'aktion') stamp('!', 96, 6);
  else if (p.type3d === 'frage') stamp('?', 92, 8);
  else if (p.type3d === 'rutsche') {
    g.beginPath();
    g.moveTo(cx, cy + 8);
    g.lineTo(cx - 28, cy - 28);
    g.lineTo(cx - 10, cy - 28);
    g.lineTo(cx - 10, cy - 52);
    g.lineTo(cx + 10, cy - 52);
    g.lineTo(cx + 10, cy - 28);
    g.lineTo(cx + 28, cy - 28);
    g.closePath();
    g.fill();
    g.stroke();
    const other = zoneOf(p.slideTo) !== p.zone ? 'Z' + zoneOf(p.slideTo) : '';
    stamp(String(p.slideTo) + (other ? ' ' + other : ''), other ? 36 : 48, 36);
  } else if (p.type3d === 'finanzpolizei') {
    g.strokeStyle = '#ffffff';
    g.lineWidth = 6;
    g.strokeRect(cx - 28, cy - 40, 40, 50);
    g.beginPath();
    g.moveTo(cx - 18, cy - 24);
    g.lineTo(cx + 4, cy - 24);
    g.moveTo(cx - 18, cy - 12);
    g.lineTo(cx + 4, cy - 12);
    g.stroke();
    g.beginPath();
    g.arc(cx + 16, cy - 8, 14, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.moveTo(cx + 26, cy + 4);
    g.lineTo(cx + 38, cy + 16);
    g.stroke();
    g.strokeStyle = '#2E2E33';
    g.lineWidth = 10;
    stamp('6!', 52, 40);
  } else {
    const label = String(p.id);
    stamp(label, label.length > 2 ? 58 : 78, 2);
    if (arrival) {
      g.font = '700 28px system-ui, sans-serif';
      g.strokeText('von ' + arrival, cx, cy + 48);
      g.fillText('von ' + arrival, cx, cy + 48);
    }
  }
}

function symbolMesh(pts) {
  const cols = 12;
  const cell = 160;
  const rows = Math.ceil(pts.length / cols) || 1;
  const canvas = document.createElement('canvas');
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, canvas.width, canvas.height);
  const arrival = new Map();
  for (const p of pts) {
    if (!p.slideTo || zoneOf(p.slideTo) !== p.zone) continue;
    if (!arrival.has(p.slideTo)) arrival.set(p.slideTo, p.id);
  }
  pts.forEach((p, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    glyph(g, p, col * cell, row * cell, cell, arrival.get(p.id));
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  const pos = [];
  const uv = [];
  const idx = [];
  pts.forEach((p, n) => {
    const s = (p.type3d === 'start' || p.type3d === 'ziel' ? 0.86 : 0.7);
    const y = 0.42;
    const col = n % cols;
    const row = Math.floor(n / cols);
    const u0 = col / cols;
    const u1 = (col + 1) / cols;
    const v1 = 1 - row / rows;
    const v0 = 1 - (row + 1) / rows;
    const b = pos.length / 3;
    pos.push(
      p.lx - s, y, p.lz - s,
      p.lx + s, y, p.lz - s,
      p.lx + s, y, p.lz + s,
      p.lx - s, y, p.lz + s,
    );
    uv.push(u0, v1, u1, v1, u1, v0, u0, v0);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  }));
  mesh.renderOrder = 6;
  return mesh;
}

function instanced(geo, mat, places, key) {
  if (!places.length) return null;
  const mesh = new THREE.InstancedMesh(geo, mat, places.length);
  mesh.frustumCulled = false;
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  places.forEach((p, i) => {
    dummy.position.set(p.x, p.y || 0, p.z);
    dummy.scale.set(p.sx || p.s || 1, p.sy || p.s || 1, p.sz || p.s || 1);
    dummy.rotation.y = p.rot || 0;
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (p.c) mesh.setColorAt(i, color.set(p.c));
  });
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.userData.fullCount = places.length;
  mesh.userData.kind = key;
  return mesh;
}

function addOutlined(content, geo, mat, places, key, amount, decor) {
  const mesh = instanced(geo, mat, places, key);
  if (!mesh) return;
  const hull = instanced(hullGeo(geo, amount), outlineMat, places, key);
  mesh.userData.hull = hull;
  content.add(mesh);
  if (hull) content.add(hull);
  decor.push(mesh);
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function blocked(pts, buildings, jail, x, z, pad) {
  for (const p of pts) {
    if ((p.lx - x) ** 2 + (p.lz - z) ** 2 < pad * pad) return true;
  }
  for (const b of buildings) {
    if (Math.abs(x - b.lx) < b.length / 2 + 0.8 && Math.abs(z - b.lz) < b.depth / 2 + 0.8) return true;
  }
  if (jail && Math.hypot(x - jail.lx, z - jail.lz) < 3.2) return true;
  return false;
}

function pageTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 384;
  const g = c.getContext('2d');
  g.fillStyle = '#F7F1E3';
  g.fillRect(0, 0, 512, 384);
  g.strokeStyle = 'rgba(196, 184, 160, 0.45)';
  g.lineWidth = 1;
  for (let x = 0; x <= 512; x += 16) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 384);
    g.stroke();
  }
  for (let y = 0; y <= 384; y += 16) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(512, y);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function grassMesh(trees, buildings) {
  const geo = new THREE.PlaneGeometry(PAGE.w - 1.5, PAGE.d - 1.5, 28, 20);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 11, uv.getY(i) * 8);
  const light = new THREE.Color('#B5E07A');
  const mid = new THREE.Color('#8FCF5A');
  const dark = new THREE.Color('#5A9A32');
  const ao = new THREE.Color('#3d6e24');
  const col = new Float32Array(pos.count * 3);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + PAGE.w / 2;
    const z = pos.getZ(i) + PAGE.d / 2;
    const n = Math.abs(Math.sin(x * 0.37) * Math.cos(z * 0.41));
    tmp.copy(mid).lerp(n > 0.62 ? light : dark, n > 0.62 ? (n - 0.62) : (0.62 - n) * 0.35);
    for (const b of buildings) {
      const dx = Math.max(0, Math.abs(x - b.lx) - b.length / 2);
      const dz = Math.max(0, Math.abs(z - b.lz) - b.depth / 2);
      const d = Math.hypot(dx, dz);
      if (d < 1.8) tmp.lerp(ao, (1 - d / 1.8) * 0.55);
    }
    for (const t of trees) {
      const d = Math.hypot(x - t.x, z - t.z);
      if (d < 1.1) tmp.lerp(ao, (1 - d / 1.1) * 0.4);
    }
    col[i * 3] = tmp.r;
    col[i * 3 + 1] = tmp.g;
    col[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const hatch = hatchTexture().clone();
  hatch.needsUpdate = true;
  const mesh = new THREE.Mesh(geo, toonMat('#ffffff', { vertexColors: true, map: hatch }));
  mesh.position.set(PAGE.w / 2, -0.01, PAGE.d / 2);
  return mesh;
}

function treeGeo() {
  const a = new THREE.IcosahedronGeometry(0.72, 0);
  const b = new THREE.IcosahedronGeometry(0.5, 0);
  b.translate(0.18, 0.42, 0.08);
  const c = new THREE.IcosahedronGeometry(0.4, 0);
  c.translate(-0.22, 0.28, -0.06);
  return mergeGeometries([a, b, c]);
}

function bushGeo() {
  const a = new THREE.IcosahedronGeometry(0.34, 0);
  a.scale(1.15, 0.72, 1);
  const b = new THREE.IcosahedronGeometry(0.22, 0);
  b.translate(0.22, 0.08, 0.05);
  return mergeGeometries([a, b]);
}

function flowerGeo() {
  const parts = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const p = new THREE.ConeGeometry(0.07, 0.16, 4);
    p.rotateZ(Math.PI / 2);
    p.translate(Math.cos(a) * 0.1, 0.16, Math.sin(a) * 0.1);
    parts.push(p);
  }
  const heart = new THREE.ConeGeometry(0.06, 0.1, 5);
  heart.translate(0, 0.2, 0);
  parts.push(heart);
  return mergeGeometries(parts);
}

function cloudGeo() {
  const parts = [[0, 0, 0.7], [0.55, 0.1, 0.48], [-0.52, 0.06, 0.44], [0.12, 0.28, 0.4]];
  return mergeGeometries(parts.map(([x, y, r]) => {
    const g = new THREE.SphereGeometry(r, 7, 5);
    g.scale(1.2, 0.82, 0.9);
    g.translate(x, y, 0);
    return g;
  }));
}

export function buildZone(layout, zone) {
  const pts = layout.points.filter(p => p.zone === zone);
  const buildings = layout.buildings.filter(b => b.zone === zone);
  const jail = layout.prisons.find(j => j.zone === zone) || null;
  const content = new THREE.Group();
  content.name = 'zone' + zone;
  const rand = rng(zone * 97 + 13);
  const trees = [];
  const bushes = [];
  const flowers = [];
  const tufts = [];
  const parkBox = zone === 2 ? { x0: 12, z0: 1.2, x1: 34, z1: 9.2 } : null;
  const stationBox = zone === 4 ? { x0: 18, z0: 1, x1: 46, z1: 9.4 } : null;
  function inBox(box, x, z) {
    return box && x > box.x0 && x < box.x1 && z > box.z0 && z < box.z1;
  }
  const treeTarget = zone === 2 ? 16 : zone === 4 ? 14 : 24;
  let guard = 0;
  while (trees.length < treeTarget && guard < 500) {
    guard++;
    const x = 1.8 + rand() * (PAGE.w - 3.6);
    const z = 1.6 + rand() * (PAGE.d - 3.2);
    if (blocked(pts, buildings, jail, x, z, 2.15)) continue;
    if (inBox(parkBox, x, z) || inBox(stationBox, x, z)) continue;
    trees.push({ x, z, s: 0.82 + rand() * 0.45, rot: rand() * 6.2, c: rand() > 0.5 ? '#3E7A1C' : '#4c9a30' });
  }
  guard = 0;
  while (bushes.length < 20 && guard < 400) {
    guard++;
    const x = 1.4 + rand() * (PAGE.w - 2.8);
    const z = 1.4 + rand() * (PAGE.d - 2.8);
    if (blocked(pts, buildings, jail, x, z, 1.55)) continue;
    if (inBox(stationBox, x, z)) continue;
    bushes.push({ x, z, s: 0.85 + rand() * 0.4, rot: rand() * 6 });
  }
  const flowerCols = ['#FF8FAB', '#FFE566', '#ffffff', '#FF8FAB'];
  guard = 0;
  while (flowers.length < 36 && guard < 500) {
    guard++;
    const x = 1.2 + rand() * (PAGE.w - 2.4);
    const z = 1.2 + rand() * (PAGE.d - 2.4);
    if (blocked(pts, buildings, jail, x, z, 1.25)) continue;
    if (inBox(stationBox, x, z)) continue;
    flowers.push({ x, z, y: 0, s: 0.9 + rand() * 0.5, c: flowerCols[(flowers.length) % 4], rot: rand() * 6 });
  }
  guard = 0;
  while (tufts.length < 56 && guard < 400) {
    guard++;
    const x = 1 + rand() * (PAGE.w - 2);
    const z = 1 + rand() * (PAGE.d - 2);
    if (blocked(pts, buildings, jail, x, z, 1.05)) continue;
    tufts.push({ x, z, y: 0.12, s: 0.7 + rand() * 0.6, rot: rand() * 3 });
  }

  const extras = [];
  if (zone === 2) {
    const extra = park(content, extras);
    trees.push(...extra.trees);
    bushes.push(...extra.bushes);
    flowers.push(...extra.flowers);
  }

  const paper = new THREE.Mesh(new THREE.PlaneGeometry(PAGE.w + 1.6, PAGE.d + 1.6), new THREE.MeshBasicMaterial({ map: pageTexture() }));
  paper.rotation.x = -Math.PI / 2;
  paper.position.set(PAGE.w / 2, -0.05, PAGE.d / 2);
  content.add(paper);
  content.add(grassMesh(trees, buildings));

  const frame = [];
  put(frame, PAGE.w + 1.8, 0.22, 0.28, PAGE.w / 2, 0.08, -0.35, INK);
  put(frame, PAGE.w + 1.8, 0.22, 0.28, PAGE.w / 2, 0.08, PAGE.d + 0.35, INK);
  put(frame, 0.28, 0.22, PAGE.d + 1.8, -0.35, 0.08, PAGE.d / 2, INK);
  put(frame, 0.28, 0.22, PAGE.d + 1.8, PAGE.w + 0.35, 0.08, PAGE.d / 2, INK);
  const roll = new THREE.CylinderGeometry(0.28, 0.28, PAGE.w + 0.4, 10);
  roll.rotateZ(Math.PI / 2);
  roll.translate(PAGE.w / 2, 0.42, -0.7);
  paint(roll, '#f7f7f5');
  frame.push(roll);
  content.add(mergeColored(frame));

  const edge = ribbon(pts, 1.22, 0.035, '#F5F2EB');
  const road = ribbon(pts, 0.98, 0.055, '#D8D3CA');
  if (edge) content.add(new THREE.Mesh(edge, paperMat));
  if (road) content.add(new THREE.Mesh(road, paperMat));

  const boxes = [];
  const decals = [];
  for (const b of buildings) {
    const H = paperBox(boxes, decals, b);
    const sign = makeTextPlane(b.name, {
      w: 640, h: 160, bg: '#FFE566', fg: '#2E2E33', pw: 2.8, ph: 0.62, font: 58, marker: true,
    });
    sign.position.set(b.lx, H + 0.55, b.lz + Math.min(1.2, b.depth / 2));
    sign.rotation.x = -0.45;
    content.add(sign);
  }
  if (zone === 1) {
    putBench(boxes, 6.2, 5.2, 0.2);
    put(boxes, 1.15, 0.08, 0.12, 9.2, 0.55, 4.6, '#E6197E');
    put(boxes, 0.12, 0.45, 0.5, 9.2, 0.35, 4.6, '#2E2E33');
  }
  if (extras.length) boxes.push(...extras);
  if (boxes.length) content.add(...withHull(mergeColored(boxes), 0.048));

  if (zone === 4) station(content, decals);
  const decalMesh = buildDecals(decals);
  if (decalMesh) content.add(decalMesh);

  const tile = 1.58;
  const rimGeo = new THREE.BoxGeometry(tile, 0.12, tile);
  const faceGeo = new THREE.BoxGeometry(tile - 0.2, 0.1, tile - 0.2);
  const rim = new THREE.InstancedMesh(rimGeo, toonMat(INK), pts.length);
  const face = new THREE.InstancedMesh(faceGeo, flatMat, pts.length);
  rim.frustumCulled = false;
  face.frustumCulled = false;
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  pts.forEach((p, i) => {
    const big = p.type3d === 'start' || p.type3d === 'ziel' ? 1.16 : 1;
    dummy.position.set(p.lx, 0.16, p.lz);
    dummy.scale.setScalar(big);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    rim.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 0.26;
    dummy.updateMatrix();
    face.setMatrixAt(i, dummy.matrix);
    face.setColorAt(i, color.set(p.color || fieldColor(p.id, p.type3d)));
  });
  if (face.instanceColor) face.instanceColor.needsUpdate = true;
  content.add(rim, face, symbolMesh(pts));

  const decor = [];
  addOutlined(content, new THREE.CylinderGeometry(0.1, 0.16, 0.85, 5), toonMat('#8D6A42'), trees.map(t => ({ x: t.x, y: 0.42, z: t.z, s: t.s || 1, rot: t.rot })), 'tree', 0.035, decor);
  addOutlined(content, treeGeo(), flatMat, trees.map(t => ({ x: t.x, y: 1.25 * (t.s || 1), z: t.z, s: t.s || 1, c: t.c || '#3E7A1C', rot: t.rot })), 'tree', 0.05, decor);
  addOutlined(content, bushGeo(), flatMat, bushes.map(t => ({ ...t, y: 0.22, c: '#4F8A2C' })), 'bush', 0.04, decor);
  const flowersMesh = instanced(flowerGeo(), flatMat, flowers.map(t => ({ ...t, y: 0.02 })), 'flower');
  if (flowersMesh) { content.add(flowersMesh); decor.push(flowersMesh); }
  const tuft = instanced(new THREE.ConeGeometry(0.09, 0.28, 4), toonMat('#5A9A32', { flat: true }), tufts, 'tuft');
  if (tuft) { content.add(tuft); decor.push(tuft); }
  const shade = instanced(new THREE.CircleGeometry(0.55, 10), new THREE.MeshBasicMaterial({ color: '#2f4a22', transparent: true, opacity: 0.3, depthWrite: false }), trees.map(t => ({ x: t.x, y: 0.03, z: t.z + 0.15, s: (t.s || 1) * 1.15 })), 'shadow');
  if (shade) {
    shade.geometry.rotateX(-Math.PI / 2);
    content.add(shade);
  }

  if (jail) {
    const built = jailMesh(jail);
    content.add(built);
    content.userData.policeCar = built.userData.car;
  }

  const clouds = [];
  for (let i = 0; i < 7; i++) clouds.push({ x: 5 + (i * 6.2) % 38, y: 7.4 + (i % 3) * 0.55, z: 2 + (i % 4) * 6.5, s: 1.15 + (i % 3) * 0.2, rot: i * 0.4 });
  addOutlined(content, cloudGeo(), new THREE.MeshBasicMaterial({ color: '#ffffff' }), clouds, 'cloud', 0.055, decor);

  const notes = [];
  const noteCols = ['#FF8FAB', '#FFE566', '#7EC8FF', '#B6F2C3'];
  [[2.2, 2.2], [PAGE.w - 2.4, 2.4], [2.4, PAGE.d - 2.2], [PAGE.w - 2.6, PAGE.d - 2.4]].forEach((p, i) => {
    put(notes, 0.9, 0.04, 0.9, p[0], 0.08, p[1], noteCols[i], [0, i * 0.4, 0]);
  });
  content.add(mergeColored(notes));

  content.userData.decor = decor;
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
    const kind = mesh.userData.kind;
    let keep = 1;
    if (kind === 'flower' || kind === 'tuft') keep = frac;
    else if (kind === 'bush') keep = Math.max(frac, 0.55);
    else if (kind === 'tree') keep = Math.max(frac, 0.72);
    const n = Math.max(0, Math.round(full * keep));
    mesh.count = n;
    if (mesh.userData.hull) mesh.userData.hull.count = n;
  }
}
