// Zonen aus den Art-Director-Modellen. Vegetation, Felder, Wolken und Autos sind instanced.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PAGE, ZONE_GAP } from './layout.js';
import { makeTextPlane } from './figures.js';

const BOX = {
  schlosserei: 'BR_Box_Schlosserei',
  kueche: 'BR_Box_Kueche',
  labor: 'BR_Box_Labor',
  lager: 'BR_Box_Lager',
  buero: 'BR_Box_Buero',
  friseur: 'BR_Box_Friseur',
  baustelle: 'BR_Box_Baustelle',
  krankenhaus: 'BR_Box_Krankenhaus',
  autowerkstatt: 'BR_Box_Werkstatt',
};

const FIELD = {
  normal: 'BR_Feld_Normal',
  aktion: 'BR_Feld_Aktion',
  frage: 'BR_Feld_Frage',
  rutsche: 'BR_Feld_Rutsche_Start',
  finanzpolizei: 'BR_Feld_Finanzpolizei',
  start: 'BR_Feld_Start',
  ziel: 'BR_Feld_Ziel',
};

const TINT = new Set(['normal', 'rutscheZiel']);
const VFX_CELL = { funken: 0, dampf: 1, blubber: 2, staub: 3 };

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function blocked(pts, buildings, jail, park, station, x, z, pad) {
  for (const p of pts) if ((p.lx - x) ** 2 + (p.lz - z) ** 2 < pad * pad) return true;
  for (const b of buildings) {
    if (Math.abs(x - b.lx) < b.length / 2 + 0.6 && Math.abs(z - b.lz) < b.depth / 2 + 0.6) return true;
  }
  if (jail && Math.hypot(x - jail.lx, z - jail.lz) < 3.4) return true;
  if (park && Math.abs(x - park.x) < 8.4 && Math.abs(z - park.z) < 6.4) return true;
  if (station && Math.abs(x - station.x) < 11 && Math.abs(z - station.z) < 5) return true;
  return false;
}

function ribbon(pts) {
  const geos = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const dx = b.lx - a.lx;
    const dz = b.lz - a.lz;
    const len = Math.hypot(dx, dz) || 1;
    const px = -dz / len * 0.95;
    const pz = dx / len * 0.95;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([
      a.lx + px, 0.02, a.lz + pz, a.lx - px, 0.02, a.lz - pz,
      b.lx + px, 0.02, b.lz + pz, b.lx - px, 0.02, b.lz - pz,
    ], 3));
    g.setIndex([0, 1, 2, 2, 1, 3]);
    g.computeVertexNormals();
    geos.push(g);
  }
  return geos.length ? mergeGeometries(geos) : null;
}

function addInstances(content, template, places, kind, tint) {
  if (!places.length) return [];
  template.updateMatrixWorld(true);
  const made = [];
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  template.traverse((o) => {
    if (!o.isMesh) return;
    const im = new THREE.InstancedMesh(o.geometry, o.material, places.length);
    im.frustumCulled = false;
    im.userData.outline = !!o.userData.outline;
    im.userData.kind = kind;
    im.userData.fullCount = places.length;
    places.forEach((p, i) => {
      dummy.position.set(p.x, p.y || 0, p.z);
      dummy.rotation.set(p.rx || 0, p.rot || 0, 0);
      dummy.scale.set(p.sx || p.s || 1, p.sy || p.s || 1, p.sz || p.s || 1);
      dummy.updateMatrix();
      dummy.matrix.multiply(o.matrixWorld);
      im.setMatrixAt(i, dummy.matrix);
      if (tint && !o.userData.outline) im.setColorAt(i, color.set(p.c || '#ffffff'));
    });
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    content.add(im);
    made.push(im);
  });
  return made;
}

function numberUV(n) {
  const col = n % 10;
  const row = Math.floor(n / 10);
  return { du: col * 0.1, dv: -row * (93 / 1024) };
}

function stamp(geo, matrix, n, scale) {
  const g = geo.clone();
  if (scale !== 1) g.scale(scale, scale, scale);
  g.applyMatrix4(matrix);
  const uv = g.getAttribute('uv');
  if (uv) {
    const { du, dv } = numberUV(n);
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + du, uv.getY(i) + dv);
    uv.needsUpdate = true;
  }
  return g;
}

function emptyMatrix(scene, name) {
  const o = scene.getObjectByName(name);
  if (!o) return new THREE.Matrix4();
  scene.updateMatrixWorld(true);
  return o.matrixWorld.clone();
}

function placeBox(content, template, b) {
  const root = template.clone(true);
  root.position.set(b.lx, 0, b.lz);
  root.rotation.y = b.yaw;
  root.scale.set(b.scaleX, 1, 1);
  root.userData.shop = b.id;
  content.add(root);
  return root;
}

function vfxSprite(mats, kind) {
  const map = mats.vfx.clone();
  map.repeat.set(0.25, 1);
  map.offset.set((VFX_CELL[kind] || 0) * 0.25, 0);
  map.needsUpdate = true;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false }));
  s.scale.set(0.7, 0.7, 0.7);
  s.userData.vfx = kind;
  return s;
}

function remember(node) {
  return { node, y: node.rotation.y, x: node.rotation.x, z: node.rotation.z, py: node.position.y, pz: node.position.z, sy: node.scale.y };
}

export function buildZone(layout, zone, lib) {
  const pts = layout.points.filter((p) => p.zone === zone);
  const buildings = layout.buildings.filter((b) => b.zone === zone);
  const jail = layout.prisons.find((j) => j.zone === zone) || null;
  const content = new THREE.Group();
  content.name = 'zone' + zone;
  const rand = rng(zone * 97 + 13);
  const parkAt = zone === 2 ? { x: 20, z: 6.2 } : null;
  const stationAt = zone === 4 ? { x: 18, z: 4.2 } : null;
  const slidesTo = new Map();
  for (const s of layout.slides) {
    if (!slidesTo.has(s.to)) slidesTo.set(s.to, s.field);
  }

  const paper = lib.mats.paper.clone();
  paper.repeat.set(6, 4);
  const page = new THREE.Mesh(new THREE.PlaneGeometry(PAGE.w + 1.2, PAGE.d + 1.2), new THREE.MeshBasicMaterial({ map: paper }));
  page.rotation.x = -Math.PI / 2;
  page.position.set(PAGE.w / 2, -0.04, PAGE.d / 2);
  content.add(page);
  const grassMap = lib.mats.hatch.clone();
  grassMap.repeat.set(12, 9);
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(PAGE.w - 0.4, PAGE.d - 0.4),
    new THREE.MeshToonMaterial({ color: 0x8fcf5a, map: grassMap, gradientMap: lib.mats.gradient }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(PAGE.w / 2, -0.02, PAGE.d / 2);
  content.add(grass);
  const roadGeo = ribbon(pts);
  if (roadGeo) {
    const roadMap = lib.mats.karton.clone();
    roadMap.repeat.set(8, 2);
    content.add(new THREE.Mesh(roadGeo, new THREE.MeshToonMaterial({ color: 0xd8d3ca, map: roadMap, gradientMap: lib.mats.gradient })));
  }

  const groups = new Map();
  for (const p of pts) {
    let kind = FIELD[p.type3d] ? p.type3d : 'normal';
    if (kind === 'normal' && slidesTo.has(p.id)) kind = 'rutscheZiel';
    if (!groups.has(kind)) groups.set(kind, []);
    groups.get(kind).push(p);
  }
  const decor = [];
  for (const [kind, list] of groups) {
    const file = kind === 'rutscheZiel' ? 'BR_Feld_Rutsche_Ziel' : FIELD[kind];
    const template = lib.scenes[file];
    if (!template) continue;
    const tint = TINT.has(kind);
    const meshes = addInstances(content, template, list.map((p) => ({
      x: p.lx, y: 0.02, z: p.lz, c: p.color,
    })), 'field', tint);
    decor.push(...meshes);
  }

  let numGeo = null;
  lib.scenes.BR_Feld_Nummer.traverse((o) => { if (o.isMesh && !numGeo) numGeo = o.geometry; });
  if (numGeo) {
    const stamps = [];
    for (const p of pts) {
      const kind = (p.type3d === 'normal' && slidesTo.has(p.id)) ? 'rutscheZiel' : p.type3d;
      const file = kind === 'rutscheZiel' ? 'BR_Feld_Rutsche_Ziel' : (FIELD[kind] || FIELD.normal);
      const scene = lib.scenes[file];
      const place = new THREE.Matrix4().makeTranslation(p.lx, 0.02, p.lz);
      const small = kind !== 'normal' && kind !== 'start' && kind !== 'ziel';
      const nummer = emptyMatrix(scene, 'Nummer');
      stamps.push(stamp(numGeo, place.clone().multiply(nummer), p.id, small ? 0.55 : 1));
      if (kind === 'rutsche') {
        const ziel = emptyMatrix(scene, 'Zielnummer');
        const to = p.slideTo == null ? p.id : p.slideTo;
        stamps.push(stamp(numGeo, place.clone().multiply(ziel), to, 0.5));
      }
      if (kind === 'rutscheZiel' && slidesTo.has(p.id)) {
        const arrow = new THREE.Matrix4().makeTranslation(0.42, 0.16, -0.42);
        stamps.push(stamp(numGeo, place.clone().multiply(arrow), slidesTo.get(p.id), 0.45));
      }
    }
    if (stamps.length) {
      const merged = mergeGeometries(stamps);
      const mesh = new THREE.Mesh(merged, lib.mats.numbers);
      mesh.renderOrder = 2;
      content.add(mesh);
    }
  }

  const shops = [];
  const animated = [];
  for (const b of buildings) {
    const root = placeBox(content, lib.scenes[BOX[b.id]], b);
    shops.push({ id: b.id, root, yaw: b.yaw });
    const sign = makeTextPlane(b.name, { w: 640, h: 160, bg: '#FFE566', fg: '#2E2E33', pw: 2.6, ph: 0.58, font: 54, marker: true });
    sign.position.set(b.lx, 3.15, b.lz);
    content.add(sign);
    root.traverse((o) => {
      if (!o.name || !o.name.startsWith('Prop_') || o.name.endsWith('_Outline')) return;
      animated.push(remember(o));
    });
    root.updateWorldMatrix(true, true);
    root.traverse((o) => {
      if (!o.name || !o.name.startsWith('VFX_')) return;
      const kind = /Dampf/.test(o.name) ? 'dampf' : /Blubber/.test(o.name) ? 'blubber' : 'funken';
      const s = vfxSprite(lib.mats, kind);
      const p = new THREE.Vector3();
      o.getWorldPosition(p);
      root.worldToLocal(p);
      s.position.copy(p);
      root.add(s);
    });
  }

  let wasser = null;
  let ball = null;
  if (parkAt) {
    const park = lib.scenes.BR_Park.clone(true);
    park.position.set(parkAt.x, 0, parkAt.z);
    content.add(park);
    wasser = park.getObjectByName('Wasser');
    ball = park.getObjectByName('Ball');
    if (ball) ball.userData.baseY = ball.position.y;
    content.userData.park = parkAt;
    content.userData.parkRoot = park;
  }

  let train = null;
  let trainSpan = null;
  if (stationAt) {
    const st = lib.scenes.BR_Bahnhof.clone(true);
    st.position.set(stationAt.x, 0, stationAt.z);
    st.scale.setScalar(0.62);
    content.add(st);
    train = new THREE.Group();
    st.add(train);
    const cars = [
      ['BR_Zug_Lok', 'Zug_Lok'],
      ['BR_Zug_Wagen_A', 'Zug_Wagen_1'],
      ['BR_Zug_Wagen_B', 'Zug_Wagen_2'],
      ['BR_Zug_Wagen_C', 'Zug_Wagen_3'],
      ['BR_Zug_Wagen_D', 'Zug_Wagen_4'],
      ['BR_Zug_Wagen_E', 'Zug_Wagen_5'],
    ];
    for (const [file, empty] of cars) {
      const car = lib.scenes[file].clone(true);
      const e = st.getObjectByName(empty);
      if (e) car.position.copy(e.position);
      train.add(car);
    }
    const ein = st.getObjectByName('Zug_Einfahrt_Start');
    const lok = st.getObjectByName('Zug_Lok');
    const aus = st.getObjectByName('Zug_Ausfahrt_Ende');
    trainSpan = {
      from: ein && lok ? ein.position.x - lok.position.x : 20,
      to: aus && lok ? aus.position.x - lok.position.x : -40,
    };
    content.userData.station = stationAt;
    content.userData.stationRoot = st;
    content.userData.train = train;
  }

  if (jail) {
    const cell = lib.scenes.BR_Zelle.clone(true);
    cell.position.set(jail.lx, 0, jail.lz);
    content.add(cell);
    const slots = [];
    for (let i = 1; i <= 6; i++) {
      const e = cell.getObjectByName('Platz_' + i);
      if (!e) continue;
      slots.push({ lx: jail.lx + e.position.x, lz: jail.lz + e.position.z, x: jail.lx + e.position.x + (zone - 1) * ZONE_GAP, z: jail.lz + e.position.z });
    }
    if (slots.length) jail.slots = slots;
    const car = lib.scenes.BR_Polizeiauto.clone(true);
    const park = cell.getObjectByName('Auto_Park');
    car.position.set(jail.lx + (park ? park.position.x : 2.6), 0, jail.lz + (park ? park.position.z : 0.2));
    car.userData.home = car.position.clone();
    content.add(car);
    content.userData.policeCar = car;
    content.userData.cell = cell;
    content.userData.cellDoor = cell.getObjectByName('Tuer');
    content.userData.guardAt = cell.getObjectByName('Polizist_Idle');
  }

  const trees = [];
  const bushes = [];
  const flowers = [];
  const tufts = [];
  const treeTarget = zone === 2 ? 28 : zone === 4 ? 22 : 42;
  let guard = 0;
  while (trees.length < treeTarget && guard < 700) {
    guard++;
    const x = 1.6 + rand() * (PAGE.w - 3.2);
    const z = 1.4 + rand() * (PAGE.d - 2.8);
    if (blocked(pts, buildings, jail, parkAt, stationAt, x, z, 1.7)) continue;
    const kind = rand() > 0.66 ? 'A' : rand() > 0.5 ? 'B' : 'C';
    trees.push({ kind, x, z, s: 0.85 + rand() * 0.35, rot: rand() * 6.2 });
  }
  if (content.userData.parkRoot) {
    for (let i = 1; i <= 9; i++) {
      const e = content.userData.parkRoot.getObjectByName('Baum_' + i);
      if (!e) continue;
      trees.push({ kind: ['A', 'B', 'C'][i % 3], x: parkAt.x + e.position.x, z: parkAt.z + e.position.z, s: 0.95 + (i % 3) * 0.08, rot: i });
    }
  }
  guard = 0;
  while (bushes.length < 28 && guard < 500) {
    guard++;
    const x = 1.2 + rand() * (PAGE.w - 2.4);
    const z = 1.2 + rand() * (PAGE.d - 2.4);
    if (blocked(pts, buildings, jail, parkAt, stationAt, x, z, 1.35)) continue;
    bushes.push({ kind: rand() > 0.5 ? 'A' : 'B', x, z, s: 0.85 + rand() * 0.35, rot: rand() * 6 });
  }
  guard = 0;
  while (flowers.length < 54 && guard < 600) {
    guard++;
    const x = 1 + rand() * (PAGE.w - 2);
    const z = 1 + rand() * (PAGE.d - 2);
    if (blocked(pts, buildings, jail, null, stationAt, x, z, 1.05)) continue;
    flowers.push({ kind: ['A', 'B', 'C'][flowers.length % 3], x, z, s: 0.85 + rand() * 0.4, rot: rand() * 6 });
  }
  guard = 0;
  while (tufts.length < 80 && guard < 600) {
    guard++;
    const x = 0.8 + rand() * (PAGE.w - 1.6);
    const z = 0.8 + rand() * (PAGE.d - 1.6);
    if (blocked(pts, buildings, jail, null, stationAt, x, z, 0.85)) continue;
    tufts.push({ kind: rand() > 0.5 ? 'A' : 'B', x, z, s: 0.8 + rand() * 0.5, rot: rand() * 3 });
  }

  function scatter(prefix, list, kind) {
    for (const key of [...new Set(list.map((p) => p.kind))]) {
      const places = list.filter((p) => p.kind === key);
      decor.push(...addInstances(content, lib.scenes[prefix + key], places, kind, false));
    }
  }
  scatter('BR_Baum_', trees, 'tree');
  scatter('BR_Busch_', bushes, 'bush');
  scatter('BR_Blumen_', flowers, 'flower');
  scatter('BR_Gras_', tufts, 'tuft');

  const clouds = [];
  for (let i = 0; i < 7; i++) {
    clouds.push({
      kind: ['A', 'B', 'C'][i % 3],
      x: 4 + (i * 6.4) % 40,
      y: 12.5 + (i % 3) * 1.15,
      z: 3 + (i % 4) * 6,
      s: 1.55 + (i % 3) * 0.28,
      rot: i * 0.5,
    });
  }
  scatter('BR_Wolke_', clouds, 'cloud');

  const cars = [];
  const edge = [[6, 2.2, 0.4], [PAGE.w - 7, 3.1, -0.6], [PAGE.w * 0.55, PAGE.d - 2.4, 2.4]];
  ['BR_Auto_Limousine', 'BR_Auto_Kombi', 'BR_Auto_Klein'].forEach((file, i) => {
    const [x, z, rot] = edge[i];
    if (blocked(pts, buildings, jail, parkAt, stationAt, x, z, 1.2)) return;
    cars.push(addInstances(content, lib.scenes[file], [{ x, z, rot, s: 0.92 + i * 0.05 }], 'car', false));
  });
  decor.push(...cars.flat());

  const lamps = [];
  const benches = [];
  for (let i = 0; i < 4; i++) {
    const x = 3 + rand() * (PAGE.w - 6);
    const z = 2.2 + rand() * (PAGE.d - 4.4);
    if (blocked(pts, buildings, jail, parkAt, stationAt, x, z, 1.5)) continue;
    if (lamps.length < 3) lamps.push({ x, z, rot: rand() * 3 });
    else if (benches.length < 2) benches.push({ x, z, rot: rand() * 6 });
  }
  decor.push(...addInstances(content, lib.scenes.BR_Laterne, lamps, 'lamp', false));
  decor.push(...addInstances(content, lib.scenes.BR_Bank, benches, 'bench', false));
  const noteCols = ['#FF8FAB', '#FFE566', '#7EC8FF', '#B6F2C3'];
  const notes = [[2.2, 2.2], [PAGE.w - 2.4, 2.4], [2.4, PAGE.d - 2.2], [PAGE.w - 2.6, PAGE.d - 2.4]].map((p, i) => ({
    x: p[0], y: 0.05, z: p[1], rot: i * 0.35, c: noteCols[i], s: 1.3,
  }));
  decor.push(...addInstances(content, lib.scenes.BR_Haftnotiz, notes, 'note', true));

  content.userData.decor = decor.filter((m) => m && m.isInstancedMesh);
  content.userData.shops = shops;
  content.userData.tick = (t) => {
    for (const a of animated) {
      const n = a.node.name;
      if (n === 'Prop_Topf') a.node.rotation.y = a.y + Math.sin(t * 1.3) * 0.14;
      else if (n === 'Prop_Messer') a.node.position.y = a.py + Math.abs(Math.sin(t * 6)) * 0.05;
      else if (n === 'Prop_Hammer') a.node.rotation.x = a.x + Math.max(0, Math.sin(t * 6)) * 0.7;
      else if (n === 'Prop_Schrauber' || n === 'Prop_Schere') a.node.rotation.z = a.z + Math.sin(t * 8) * 0.26;
      else if (n === 'Prop_Blubberkolben') a.node.scale.y = 1 + Math.sin(t * 3) * 0.03;
      else if (n === 'Prop_Kranlast') a.node.position.y = a.py + Math.sin(t * 0.8) * 0.4;
      else if (n === 'Prop_Papier') a.node.position.z = a.pz + (Math.sin(t * 0.7) * 0.5 + 0.5) * 0.2;
      else if (n === 'Prop_Pipette') a.node.position.y = a.py + Math.sin(t * 2.2) * 0.06;
    }
    if (wasser) wasser.rotation.y = t * 0.35;
    if (ball) {
      ball.position.y = ball.userData.baseY + Math.abs(Math.sin(t * 1.7)) * 0.45;
      const outline = ball.parent && ball.parent.getObjectByName('Ball_Outline');
      if (outline && outline.parent === ball.parent) outline.position.y = ball.position.y;
    }
    if (train && trainSpan && !content.userData.holdTrain) {
      const u = (t % 14) / 14;
      let dx = 0;
      if (u < 0.32) dx = trainSpan.from * (1 - u / 0.32);
      else if (u < 0.52) dx = 0;
      else dx = trainSpan.to * ((u - 0.52) / 0.48);
      train.position.x = dx;
    }
    content.traverse((o) => {
      if (!o.userData || !o.userData.vfx) return;
      const k = o.userData.vfx === 'funken' ? 7 : 2;
      o.position.y = (o.userData.baseY == null ? (o.userData.baseY = o.position.y) : o.userData.baseY) + Math.sin(t * k) * 0.08;
      o.material.opacity = 0.45 + Math.sin(t * k) * 0.35;
    });
  };

  const pivot = new THREE.Group();
  pivot.position.set(PAGE.w / 2, 0, PAGE.d);
  content.position.set(-PAGE.w / 2, 0, -PAGE.d);
  pivot.add(content);
  pivot.userData.zone = zone;
  pivot.userData.content = content;
  pivot.updateMatrixWorld(true);
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
    else if (kind === 'tree') keep = Math.max(frac, 0.7);
    mesh.count = Math.max(0, Math.round(full * keep));
  }
}

