// Low-Poly-Stadt: eine zusammengefasste Geometrie für den statischen Teil,
// damit das Beamer-Bild auf Intel-Grafik leicht bleibt.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TILE_Y, yawFacing } from './layout.js';
import { makePerson, makeTextPlane } from './figures.js';

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const _m = new THREE.Matrix4();

function paint(geo, color) {
  const n = geo.getAttribute('position').count;
  const c = new THREE.Color(color);
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  if (!geo.getAttribute('normal')) geo.computeVertexNormals();
  if (!geo.getAttribute('uv')) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  return geo;
}

function addGeo(bucket, geo, color) {
  paint(geo, color);
  bucket.push(geo);
}

function addBox(bucket, w, h, d, x, y, z, color, rotY = 0) {
  const geo = new THREE.BoxGeometry(w, h, d);
  _q.setFromAxisAngle(Y_AXIS, rotY);
  _p.set(x, y, z);
  _m.compose(_p, _q, _s);
  geo.applyMatrix4(_m);
  addGeo(bucket, geo, color);
}

function addCyl(bucket, rt, rb, h, x, y, z, color, seg = 6, rotX = 0) {
  const geo = new THREE.CylinderGeometry(rt, rb, h, seg);
  _q.setFromEuler(new THREE.Euler(rotX, 0, 0));
  _p.set(x, y, z);
  _m.compose(_p, _q, _s);
  geo.applyMatrix4(_m);
  addGeo(bucket, geo, color);
}

function world(b, lx, lz) {
  return {
    x: b.cx + b.tx * lx + b.sx * lz,
    z: b.cz + b.tz * lx + b.sz * lz,
  };
}

function localBox(bucket, b, w, h, d, lx, y, lz, color) {
  const p = world(b, lx, lz);
  addBox(bucket, w, h, d, p.x, y, p.z, color, Math.atan2(-b.tz, b.tx));
}

function ribbon(bucket, pts, half, y, color) {
  if (pts.length < 2) return;
  const pos = [];
  const nrm = [];
  const uv = [];
  const idx = [];
  let dist = 0;
  const left = [];
  const right = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    let tx = next.x - prev.x;
    let tz = next.z - prev.z;
    const len = Math.hypot(tx, tz) || 1;
    tx /= len;
    tz /= len;
    const rx = -tz * half;
    const rz = tx * half;
    left.push([pts[i].x + rx, y, pts[i].z + rz]);
    right.push([pts[i].x - rx, y, pts[i].z - rz]);
  }
  for (let i = 0; i < pts.length; i++) {
    if (i) dist += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    pos.push(left[i][0], left[i][1], left[i][2], right[i][0], right[i][1], right[i][2]);
    nrm.push(0, 1, 0, 0, 1, 0);
    uv.push(dist, 0, dist, 1);
    if (i) {
      const v = (i - 1) * 2;
      idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  addGeo(bucket, geo, color);
}

function sideLine(points, side, near, far) {
  return points.map(p => {
    const off = p.building ? far : near;
    return { x: p.x + p.sx * side * off, z: p.z + p.sz * side * off };
  });
}

function rand(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildCity(scene, layout, board) {
  const solid = [];
  const glass = [];
  const colors = (board && board.colors) || {};
  const pts = layout.points;
  const bds = layout.bounds;
  const pad = 16;
  const cx = (bds.minX + bds.maxX) / 2;
  const cz = (bds.minZ + bds.maxZ) / 2;
  const gw = (bds.maxX - bds.minX) + pad * 2;
  const gd = (bds.maxZ - bds.minZ) + pad * 2;

  const ground = new THREE.PlaneGeometry(Math.max(40, gw), Math.max(40, gd));
  ground.rotateX(-Math.PI / 2);
  ground.translate(cx, 0, cz);
  addGeo(solid, ground, '#63b85c');

  ribbon(solid, pts, 1.15, 0.045, '#e4c07a');
  ribbon(solid, sideLine(pts, 1, 2.15, 3.5), 0.55, 0.06, '#f3e2b0');
  ribbon(solid, sideLine(pts, -1, 2.15, 3.5), 0.55, 0.06, '#f3e2b0');

  const tileColor = {
    start: colors.start || '#2e9e5b',
    ziel: colors.ziel || '#e0407e',
    aktion: colors.aktion || '#f28c28',
    frage: colors.frage || '#2f6fd6',
    rutsche: colors.rutsche || '#e03a8c',
    finanzpolizei: colors.finanzpolizei || '#5b3a8c',
    normal: '#f4f0e4',
  };

  for (const p of pts) {
    const col = tileColor[p.type] || tileColor.normal;
    const big = p.type === 'start' || p.type === 'ziel';
    const rad = big ? 0.92 : 0.7;
    addCyl(solid, rad + 0.08, rad + 0.08, 0.08, p.x, 0.08, p.z, '#fff6e4', 12);
    addCyl(solid, rad, rad * 0.92, 0.2, p.x, 0.2, p.z, col, 12);
  }

  const npcs = [];

  const decor = [];
  const prisons = layout.prisons.map(pr => makePrison(scene, pr));
  const podium = makePodium(scene, pts[pts.length - 1]);
  makeArch(scene, pts[0], 'START', '#146b38', -1);
  makeArch(scene, pts[pts.length - 1], 'ZIEL', '#a02858', 1);

  const belt = makeBelt(scene, layout);
  const pedPaths = [sideLine(pts, 1, 2.45, 4.15), sideLine(pts, -1, 2.45, 4.15)];

  const merged = mergeGeometries(solid, false);
  solid.forEach(g => g.dispose());
  const cityMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const cityMesh = new THREE.Mesh(merged, cityMat);
  cityMesh.castShadow = true;
  cityMesh.receiveShadow = true;
  cityMesh.matrixAutoUpdate = false;
  cityMesh.updateMatrix();
  scene.add(cityMesh);

  let glassMesh = null;
  if (glass.length) {
    const gg = mergeGeometries(glass, false);
    glass.forEach(g => g.dispose());
    glassMesh = new THREE.Mesh(gg, new THREE.MeshLambertMaterial({
      vertexColors: true, transparent: true, opacity: 0.38, depthWrite: false,
    }));
    glassMesh.matrixAutoUpdate = false;
    glassMesh.updateMatrix();
    scene.add(glassMesh);
  }

  const npcRoots = [];
  const peds = spawnPeds(scene, pedPaths, 18);
  peds.mesh.visible = false;
  peds.mesh.count = 0;
  peds.active = 0;
  const car = makePoliceCar();
  car.visible = false;
  car.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(car);
  prisons.forEach(pr => pr.root.traverse(o => {
    if (o.isMesh && o.material && o.material.isMeshLambertMaterial) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  }));

  return {
    cityMesh, glassMesh, prisons, podium, belt, npcRoots, peds, car, pedPaths, decor,
    setQuality(preset) {
      npcRoots.forEach((n, i) => {
        const slot = npcs[i].slot || 0;
        n.root.visible = slot < (preset.npcs || 1);
      });
      if (!peds.replaced) {
        const keep = Math.max(0, Math.min(18, preset.peds | 0));
        peds.mesh.count = keep;
        peds.active = keep;
      }
      const frac = preset.decor == null ? 1 : preset.decor;
      for (const mesh of decor) if (mesh.userData && mesh.userData.fullCount) mesh.count = Math.max(0, Math.round(mesh.userData.fullCount * frac));
      if (scene.userData.detail) scene.userData.detail.visible = frac > 0.6;
    },
  };
}

function furnish(solid, glass, b, npcs) {
  const h = b.open ? 1.15 : 3.15;
  const yWall = h / 2 + 0.12;
  const floorY = 0.12;
  localBox(solid, b, b.length, 0.1, b.depth, 0, floorY, 0, b.floor);
  localBox(solid, b, b.length, h, 0.22, 0, yWall, b.depth / 2, b.wall);
  localBox(solid, b, b.length, h, 0.22, 0, yWall, -b.depth / 2, b.wall);
  // Türpfosten an beiden offenen Enden
  for (const end of [-1, 1]) {
    const x = end * (b.length / 2);
    localBox(solid, b, 0.22, h, 0.22, x, yWall, b.depth / 2 - 0.2, b.trim);
    localBox(solid, b, 0.22, h, 0.22, x, yWall, -(b.depth / 2 - 0.2), b.trim);
    if (!b.open) localBox(solid, b, 0.28, 0.28, b.depth, x, h + 0.2, 0, b.roof);
  }
  if (!b.open) {
    localBox(solid, b, b.length * 0.92, 0.16, 0.28, 0, h + 0.28, b.depth / 2 - 0.3, b.roof);
    localBox(solid, b, b.length * 0.92, 0.16, 0.28, 0, h + 0.28, -(b.depth / 2 - 0.3), b.roof);
    for (let i = -1; i <= 1; i++) {
      localBox(glass, b, 0.9, 0.7, 0.08, i * (b.length * 0.22), 1.7, b.depth / 2 + 0.02, '#b9dff0');
      localBox(glass, b, 0.9, 0.7, 0.08, i * (b.length * 0.22), 1.7, -(b.depth / 2 + 0.02), '#b9dff0');
    }
  }
  if (b.id === 'schlosserei') {
    localBox(solid, b, 1.6, 0.85, 0.7, -1.2, 0.55, 2.15, '#6d533c');
    localBox(solid, b, 0.45, 0.7, 0.35, -0.2, 0.5, 2.05, '#3a3e44');
    localBox(solid, b, 0.5, 1.4, 0.5, b.length * 0.3, 0.85, -2.2, '#5a4034');
    addNpc(npcs, b, 0.4, 1.7, 'hammer', '#8a4b32', 0);
    addNpc(npcs, b, -2.2, -1.7, 'weld', '#5c3428', 1);
  } else if (b.id === 'kueche') {
    localBox(solid, b, b.length * 0.7, 0.9, 0.7, 0, 0.58, 2.2, '#f7f4ee');
    localBox(solid, b, 1.1, 0.35, 0.7, 1.4, 1.15, 2.2, '#2b2d31');
    localBox(solid, b, 0.7, 0.85, 0.7, -2, 0.55, -2.1, '#f2efe8');
    addNpc(npcs, b, 0.2, 1.35, 'stir', '#f4f4f2', 0);
    addNpc(npcs, b, -2.4, -1.5, 'carry', '#f7f4ee', 1);
  } else if (b.id === 'labor') {
    localBox(solid, b, 2.2, 0.9, 0.7, 0, 0.58, 2.15, '#f4f7f8');
    localBox(glass, b, 1.4, 1.5, 0.08, -2, 1.2, 0.4, '#d5f2f6');
    addNpc(npcs, b, 0.8, 1.4, 'mix', '#e8f4f6', 0);
    addNpc(npcs, b, -1.6, -1.6, 'type', '#d5e4ea', 1);
  } else if (b.id === 'lager') {
    for (const side of [-1, 1]) {
      localBox(solid, b, b.length * 0.75, 2.2, 0.55, 0, 1.25, side * 2.35, '#a7844e');
      for (let k = -1; k <= 1; k++) localBox(solid, b, 0.7, 0.45, 0.5, k * 1.6, 0.7 + (k === 0 ? 0.7 : 0), side * 2.35, k === 0 ? '#c45b3e' : '#3d6ea8');
    }
    addNpc(npcs, b, 0, 0.9, 'carry', '#c4a36a', 0);
    addNpc(npcs, b, 2.2, -0.9, 'carry', '#8a6232', 1);
  } else if (b.id === 'buero') {
    localBox(solid, b, 1.4, 0.75, 0.7, -0.4, 0.5, 2.05, '#8d6a45');
    localBox(solid, b, 0.8, 0.55, 0.08, -0.4, 1.15, 1.75, '#1d3c6e');
    localBox(solid, b, 1.4, 0.75, 0.7, 1.8, 0.5, -2.05, '#8d6a45');
    localBox(solid, b, 0.8, 0.55, 0.08, 1.8, 1.15, -1.75, '#1d3c6e');
    addNpc(npcs, b, -0.4, 1.2, 'type', '#d9e0ec', 0);
    addNpc(npcs, b, 1.8, -1.2, 'type', '#2c4d86', 1);
  } else if (b.id === 'friseur') {
    localBox(solid, b, 0.7, 0.9, 0.7, 0, 0.58, 2.0, '#c45b8a');
    localBox(glass, b, 0.8, 1.1, 0.06, 0, 1.5, 2.45, '#d5e4ea');
    localBox(solid, b, 0.7, 0.9, 0.7, -1.8, 0.58, 2.0, '#e7b7cc');
    addNpc(npcs, b, 0.9, 1.3, 'cut', '#f6e7ee', 0);
    addNpc(npcs, b, -1.8, -1.6, 'sweep', '#c45b8a', 1);
  } else if (b.id === 'baustelle') {
    localBox(solid, b, b.length * 0.8, 1.6, 0.12, 0, 1.0, 2.5, '#e0b04a');
    localBox(solid, b, b.length * 0.8, 1.6, 0.12, 0, 1.0, -2.5, '#f2c14a');
    localBox(solid, b, 0.9, 0.55, 0.9, 1.5, 0.4, 1.4, '#a33b24');
    localBox(solid, b, 0.8, 0.7, 0.8, -1.4, 0.48, -1.5, '#6d6a64');
    addNpc(npcs, b, 0.2, 1.3, 'hammer', '#e0b04a', 0);
    addNpc(npcs, b, -1.8, -1.2, 'carry', '#c48a2a', 1);
  } else if (b.id === 'krankenhaus') {
    localBox(solid, b, 1.6, 0.45, 0.8, 0, 0.45, 1.9, '#f7f7f5');
    localBox(solid, b, 0.45, 0.12, 0.4, 0, 0.72, 1.7, '#d7e4ee');
    localBox(solid, b, 0.7, 0.18, 0.18, b.length * 0.35, 2.3, 0, '#d23b4b');
    localBox(solid, b, 0.18, 0.7, 0.18, b.length * 0.35, 2.3, 0, '#d23b4b');
    addNpc(npcs, b, 1.1, 1.2, 'mix', '#f7f7f5', 0);
    addNpc(npcs, b, -1.2, -1.4, 'idle', '#d23b4b', 1);
  } else if (b.id === 'autowerkstatt') {
    localBox(solid, b, 1.8, 0.4, 0.9, 0.4, 0.9, 1.5, '#c23b3b');
    localBox(solid, b, 1.5, 0.12, 0.15, 0.4, 0.55, 1.15, '#2a2e33');
    localBox(solid, b, 0.9, 0.7, 0.45, -2, 0.5, -2.1, '#3a4148');
    addNpc(npcs, b, 1.3, 0.7, 'weld', '#1f7a45', 0);
    addNpc(npcs, b, -1.5, -1.4, 'hammer', '#3a4148', 1);
  }
  // kleine Farbtupfer (Kolben, Kisten) über dem Boden
  if (b.id === 'labor') {
    localBox(solid, b, 0.16, 0.32, 0.16, 0.4, 1.15, 2.15, '#3cb48a');
    localBox(solid, b, 0.14, 0.26, 0.14, 0.7, 1.12, 2.15, '#7a4db0');
  }
  if (b.id === 'kueche') localBox(solid, b, 0.35, 0.22, 0.35, 1.4, 1.4, 2.2, '#c0c4c8');
}

function addNpc(list, b, lx, lz, anim, shirt, slot) {
  const p = world(b, lx, lz);
  const face = lz >= 0 ? -1 : 1;
  list.push({
    x: p.x, z: p.z,
    tx: b.sx * face, tz: b.sz * face,
    anim, shirt, slot, building: b.id,
  });
}

function spawnNpc(scene, n) {
  const root = makePerson({
    shirt: n.shirt,
    pants: '#2c3340',
    hair: '#4a3428',
    toolColor: n.anim === 'hammer' || n.anim === 'weld' ? '#6a6e74' : (n.anim === 'cut' ? '#d0d4d8' : null),
  });
  root.position.set(n.x, 0.12, n.z);
  root.rotation.y = yawFacing(n.tx, n.tz);
  scene.add(root);
  return { root, anim: n.anim };
}

const PED_COLORS = ['#e07a3d', '#3d7ff2', '#2e9e5b', '#c45b8a', '#f2c14a', '#7a4db0', '#d23b4b', '#3a4148'];

function spawnPeds(scene, paths, max) {
  const body = new THREE.BoxGeometry(0.36, 0.7, 0.24);
  body.translate(0, 0.85, 0);
  const head = new THREE.SphereGeometry(0.16, 6, 5);
  head.translate(0, 1.35, 0);
  const geo = mergeGeometries([body, head], false);
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const mesh = new THREE.InstancedMesh(geo, mat, max);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = max;
  const dummy = new THREE.Object3D();
  const agents = [];
  for (let i = 0; i < max; i++) {
    const path = i % 2;
    const pts = paths[path];
    const t0 = (i / max) * (pts.length - 1);
    agents.push({ path, t: t0, dir: i % 3 === 0 ? -1 : 1, speed: 0.55 + (i % 5) * 0.12 });
    dummy.position.set(pts[0].x, 0.1, pts[0].z);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, new THREE.Color(PED_COLORS[i % PED_COLORS.length]));
  }
  mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
  return { mesh, agents, active: max, dummy, paths };
}

function instanced(geo, material, items) {
  const mesh = new THREE.InstancedMesh(geo, material, Math.max(1, items.length));
  mesh.userData.fullCount = items.length;
  mesh.count = items.length;
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  items.forEach((p, i) => {
    dummy.position.set(p.x, p.y || 0, p.z);
    dummy.rotation.set(0, p.rot || 0, 0);
    dummy.scale.set(p.sx || p.scale || 1, p.sy || p.scale || 1, p.sz || p.scale || 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (p.color) mesh.setColorAt(i, color.set(p.color));
  });
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = material.isMeshBasicMaterial ? false : true;
  mesh.receiveShadow = !material.isMeshBasicMaterial;
  mesh.matrixAutoUpdate = false;
  mesh.frustumCulled = false;
  return mesh;
}

// Bäume, Häuser und Laternen als InstancedMesh: ein Draw-Call pro Sorte.
function makeDecor(scene, layout, rnd) {
  const b = layout.bounds;
  const spanZ = Math.max(1, b.maxZ - b.minZ);
  const spanX = Math.max(1, b.maxX - b.minX);
  const trees = [];
  for (let i = 0; i < 24; i++) {
    const edge = i % 4;
    let x, z;
    if (edge === 0) { x = b.minX - 5 - rnd() * 5; z = b.minZ + rnd() * spanZ; }
    else if (edge === 1) { x = b.maxX + 5 + rnd() * 5; z = b.minZ + rnd() * spanZ; }
    else if (edge === 2) { x = b.minX + rnd() * spanX; z = b.minZ - 5 - rnd() * 4; }
    else { x = b.minX + rnd() * spanX; z = b.maxZ + 5 + rnd() * 4; }
    const scale = 0.8 + rnd() * 0.45;
    trees.push({ x, z, scale, color: rnd() > 0.5 ? '#2f8a45' : '#3e9a52' });
  }
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.22, 0.75, 5);
  trunkGeo.translate(0, 0.38, 0);
  const crownGeo = new THREE.ConeGeometry(0.85, 1.55, 6);
  crownGeo.translate(0, 1.5, 0);
  const trunks = instanced(trunkGeo, new THREE.MeshLambertMaterial({ color: '#6b4a2e' }), trees.map(t => ({ x: t.x, z: t.z, scale: t.scale })));
  const crowns = instanced(crownGeo, new THREE.MeshLambertMaterial({ color: '#ffffff' }), trees);

  const houses = [];
  for (let i = 0; i < 8; i++) {
    const z = b.minZ + (i + 0.5) * (spanZ / 8);
    const sy = 0.85 + rnd() * 0.45;
    houses.push({ x: b.minX - 9, z, sy, rot: 0, color: i % 2 ? '#d7d0c4' : '#c4b8a4' });
    houses.push({ x: b.maxX + 9, z, sy, rot: Math.PI, color: i % 2 ? '#e4d8c4' : '#b7c4b0' });
  }
  const bodyGeo = new THREE.BoxGeometry(3.2, 2.4, 2.8);
  bodyGeo.translate(0, 1.2, 0);
  const roofGeo = new THREE.BoxGeometry(3.5, 0.42, 3.1);
  roofGeo.translate(0, 2.55, 0);
  const bodies = instanced(bodyGeo, new THREE.MeshLambertMaterial({ color: '#ffffff' }), houses.map(h => ({ x: h.x, z: h.z, sy: h.sy, rot: h.rot, color: h.color })));
  const roofs = instanced(roofGeo, new THREE.MeshLambertMaterial({ color: '#8c4d3a' }), houses.map(h => ({ x: h.x, z: h.z, sy: h.sy, rot: h.rot })));

  const lamps = [];
  const pts = layout.points;
  for (let i = 2; i < pts.length; i += 8) {
    if (pts[i].building) continue;
    lamps.push({ x: pts[i].x + pts[i].sx * 3.35, z: pts[i].z + pts[i].sz * 3.35 });
  }
  const poleGeo = new THREE.CylinderGeometry(0.05, 0.07, 2.15, 5);
  poleGeo.translate(0, 1.08, 0);
  const bulbGeo = new THREE.SphereGeometry(0.14, 6, 5);
  bulbGeo.translate(0, 2.2, 0);
  const poles = instanced(poleGeo, new THREE.MeshLambertMaterial({ color: '#3c4148' }), lamps);
  const bulbs = instanced(bulbGeo, new THREE.MeshBasicMaterial({ color: '#ffe7a3' }), lamps);

  const meshes = [trunks, crowns, bodies, roofs, poles, bulbs];
  meshes.forEach(m => scene.add(m));
  return meshes;
}

function makePrison(scene, pr) {
  const root = new THREE.Group();
  root.position.set(pr.x, 0, pr.z);
  root.lookAt(pr.x + pr.faceX * 3, 0, pr.z + pr.faceZ * 3);
  const wall = new THREE.MeshLambertMaterial({ color: '#6e645c' });
  const dark = new THREE.MeshLambertMaterial({ color: '#3a342f' });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 2.5), new THREE.MeshLambertMaterial({ color: '#8a8176' }));
  floor.position.y = 0.06;
  root.add(floor);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.15, 0.16), wall);
  back.position.set(0, 1.1, 1.15);
  root.add(back);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.15, 2.5), wall);
  left.position.set(-1.2, 1.1, 0);
  root.add(left);
  const right = left.clone();
  right.position.x = 1.2;
  root.add(right);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.42), dark);
  bench.position.set(0, 0.38, 0.55);
  root.add(bench);
  for (let i = -1; i <= 1; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.7, 0.06), new THREE.MeshLambertMaterial({ color: '#22262c' }));
    bar.position.set(i * 0.28, 1.15, -1.18);
    root.add(bar);
  }
  const hinge = new THREE.Group();
  hinge.position.set(-0.55, 0, -1.18);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.45, 0.08), new THREE.MeshLambertMaterial({ color: '#4d463f' }));
  door.position.set(0.55, 0.72, 0);
  hinge.add(door);
  root.add(hinge);
  const sign = makeTextPlane('Finanzpolizei', { w: 512, h: 128, bg: '#3a2d55', fg: '#ffffff', pw: 2.2, ph: 0.55, font: 48 });
  sign.position.set(0, 2.45, -1.25);
  root.add(sign);
  scene.add(root);
  root.updateMatrixWorld(true);
  const seat = new THREE.Vector3(0, 0.4, 0.42);
  const doorSpot = new THREE.Vector3(0, 0.12, -1.7);
  seat.applyMatrix4(root.matrixWorld);
  doorSpot.applyMatrix4(root.matrixWorld);
  return { root, hinge, seat, doorSpot, fieldIndex: pr.fieldIndex, open: 0 };
}

function makePodium(scene, ziel) {
  if (!ziel) return { slots: [], group: new THREE.Group() };
  const group = new THREE.Group();
  const px = ziel.x + ziel.sx * 4.6;
  const pz = ziel.z + ziel.sz * 4.6;
  group.position.set(px, 0, pz);
  group.lookAt(ziel.x, 0, ziel.z);
  const specs = [
    { x: 0, h: 1.15, c: '#e0b030', label: '1' },
    { x: -1.7, h: 0.78, c: '#c5ccd4', label: '2' },
    { x: 1.7, h: 0.52, c: '#c47a3a', label: '3' },
  ];
  const slots = [];
  for (const s of specs) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.45, s.h, 1.45), new THREE.MeshLambertMaterial({ color: s.c }));
    box.position.set(s.x, s.h / 2, 0);
    group.add(box);
    const tag = makeTextPlane(s.label, { w: 128, h: 128, bg: s.c, fg: '#1d2433', pw: 0.6, ph: 0.6, font: 80 });
    tag.position.set(s.x, s.h * 0.55, 0.74);
    group.add(tag);
    slots.push({ local: new THREE.Vector3(s.x, s.h, 0), h: s.h });
  }
  const title = makeTextPlane('Siegerpodest', { w: 512, h: 96, bg: '#1d2433', fg: '#ffd76a', pw: 3.4, ph: 0.64, font: 42 });
  title.position.set(0, 1.7, 0);
  group.add(title);
  scene.add(group);
  group.updateMatrixWorld(true);
  slots.forEach(s => {
    const w = s.local.clone().applyMatrix4(group.matrixWorld);
    s.x = w.x; s.y = w.y; s.z = w.z;
  });
  return { group, slots };
}

function makeArch(scene, field, text, color, dir) {
  if (!field) return;
  const g = new THREE.Group();
  const x = field.x - field.tx * 1.8 * dir;
  const z = field.z - field.tz * 1.8 * dir;
  g.position.set(x, 0, z);
  g.lookAt(field.x, 0, field.z);
  const mat = new THREE.MeshLambertMaterial({ color });
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.4, 0.28), mat);
  left.position.set(-1.15, 1.2, 0);
  const right = left.clone();
  right.position.x = 1.15;
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.28, 0.28), mat);
  beam.position.y = 2.35;
  g.add(left, right, beam);
  const sign = makeTextPlane(text, { w: 512, h: 160, bg: color, fg: '#ffffff', pw: 2.2, ph: 0.7, font: 72 });
  sign.position.y = 2.35;
  sign.position.z = 0.2;
  g.add(sign);
  scene.add(g);
}

function makeBelt(scene, layout) {
  const geos = [];
  for (const slide of layout.slides) {
    const seq = slide.indices.map(i => layout.points[i]).filter(Boolean);
    if (seq.length < 2) continue;
    const pos = [];
    const uv = [];
    const idx = [];
    let dist = 0;
    for (let i = 0; i < seq.length; i++) {
      const prev = seq[Math.max(0, i - 1)];
      const next = seq[Math.min(seq.length - 1, i + 1)];
      let tx = next.x - prev.x;
      let tz = next.z - prev.z;
      const len = Math.hypot(tx, tz) || 1;
      tx /= len; tz /= len;
      const rx = -tz * 0.45;
      const rz = tx * 0.45;
      const y = TILE_Y + 0.08;
      if (i) dist += Math.hypot(seq[i].x - seq[i - 1].x, seq[i].z - seq[i - 1].z);
      const base = pos.length / 3;
      pos.push(seq[i].x + rx, y, seq[i].z + rz, seq[i].x - rx, y, seq[i].z - rz);
      uv.push(dist * 0.35, 0, dist * 0.35, 1);
      if (i) idx.push(base - 2, base - 1, base, base - 1, base + 1, base);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    geo.setIndex(idx);
    geos.push(geo);
  }
  if (!geos.length) return null;
  const geo = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
  const c = document.createElement('canvas');
  c.width = 128; c.height = 32;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 32);
  g.fillStyle = 'rgba(224, 58, 140, 0.0)';
  g.clearRect(0, 0, 128, 32);
  g.strokeStyle = '#ff4fa3';
  g.fillStyle = '#ff4fa3';
  for (let i = 0; i < 4; i++) {
    const x = 8 + i * 32;
    g.beginPath();
    g.moveTo(x, 6); g.lineTo(x + 16, 16); g.lineTo(x, 26); g.closePath();
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  mesh.userData.tex = tex;
  scene.add(mesh);
  return mesh;
}

function makePoliceCar() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.42, 0.9), new THREE.MeshLambertMaterial({ color: '#f4f6f8' }));
  body.position.y = 0.5;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.38, 0.82), new THREE.MeshLambertMaterial({ color: '#d5e6f2' }));
  cabin.position.set(-0.1, 0.85, 0);
  g.add(body, cabin);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.1, 0.92), new THREE.MeshLambertMaterial({ color: '#1d4e89' }));
  stripe.position.y = 0.62;
  g.add(stripe);
  const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 8);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheels = [];
  for (const [x, z] of [[0.55, 0.42], [0.55, -0.42], [-0.55, 0.42], [-0.55, -0.42]]) {
    const w = new THREE.Mesh(wheelGeo, new THREE.MeshLambertMaterial({ color: '#222' }));
    w.position.set(x, 0.2, z);
    g.add(w);
    wheels.push(w);
  }
  const red = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.18), new THREE.MeshBasicMaterial({ color: '#ff2a2a' }));
  const blue = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.18), new THREE.MeshBasicMaterial({ color: '#2a5bff' }));
  red.position.set(-0.16, 1.12, 0);
  blue.position.set(0.16, 1.12, 0);
  g.add(red, blue);
  g.userData.wheels = wheels;
  g.userData.red = red;
  g.userData.blue = blue;
  // Front zeigt nach -Z (lookAt).
  return g;
}

export function stepPeds(peds, dt) {
  if (!peds || !peds.active) return;
  const dummy = peds.dummy;
  const n = peds.active;
  for (let i = 0; i < n; i++) {
    const a = peds.agents[i];
    const pts = a.path === 0 ? peds.paths[0] : peds.paths[1];
    if (!pts || pts.length < 2) continue;
    a.t += a.dir * a.speed * dt;
    if (a.t >= pts.length - 1) { a.t = pts.length - 1; a.dir = -1; }
    if (a.t <= 0) { a.t = 0; a.dir = 1; }
    const i0 = Math.floor(a.t);
    const i1 = Math.min(pts.length - 1, i0 + 1);
    const u = a.t - i0;
    const x = pts[i0].x + (pts[i1].x - pts[i0].x) * u;
    const z = pts[i0].z + (pts[i1].z - pts[i0].z) * u;
    dummy.position.set(x, 0.1 + Math.abs(Math.sin(a.t * 6)) * 0.06, z);
    dummy.lookAt(pts[i1].x, 0.1, pts[i1].z);
    dummy.updateMatrix();
    peds.mesh.setMatrixAt(i, dummy.matrix);
  }
  peds.mesh.instanceMatrix.needsUpdate = true;
}

export function attachPedPaths(peds, paths) {
  peds.paths = paths;
}
