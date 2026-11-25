// Lädt die CC0-Modelle (Kenney, Quaternius) und stellt die Stadt damit.
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { yawFacing } from './layout.js';
import { makeTextPlane, paintCharacter } from './figures.js';

const K = '/city3d/models/kenney/';
const F = '/city3d/models/furniture/';
const Q = '/city3d/models/quaternius/';

const FILES = {
  treeL: K + 'suburban/tree-large.glb',
  treeS: K + 'suburban/tree-small.glb',
  planter: K + 'suburban/planter.glb',
  fence: K + 'suburban/fence-1x3.glb',
  lamp: K + 'roads/light-curved.glb',
  roundabout: K + 'roads/road-roundabout.glb',
  light: K + 'roads/traffic-light.glb',
  dumpster: K + 'roads/dumpster.glb',
  stop: K + 'roads/road-sign-stop.glb',
  bend: K + 'roads/road-bend.glb',
  road: K + 'roads/road-straight.glb',
  cone: K + 'roads/construction-cone.glb',
  barrier: K + 'roads/construction-barrier.glb',
  police: K + 'cars/police.glb',
  sedan: K + 'cars/sedan.glb',
  taxi: K + 'cars/taxi.glb',
  van: K + 'cars/van.glb',
  truck: K + 'cars/truck.glb',
  pot: K + 'food/pot.glb',
  pan: K + 'food/pan.glb',
  frying: K + 'food/frying-pan.glb',
  mug: K + 'food/mug.glb',
  plate: K + 'food/plate.glb',
  burger: K + 'food/burger.glb',
  apple: K + 'food/apple.glb',
  ketchup: K + 'food/bottle-ketchup.glb',
  awning: K + 'commercial/detail-awning.glb',
  parasol: K + 'commercial/detail-parasol-a.glb',
  houseA: K + 'commercial/low-detail-building-a.glb',
  houseC: K + 'commercial/low-detail-building-c.glb',
  houseE: K + 'commercial/low-detail-building-e.glb',
  houseG: K + 'commercial/low-detail-building-g.glb',
  houseI: K + 'commercial/low-detail-building-i.glb',
  skyA: K + 'commercial/building-skyscraper-a.glb',
  skyB: K + 'commercial/building-skyscraper-b.glb',
  skyC: K + 'commercial/building-skyscraper-c.glb',
  homeA: K + 'suburban/building-type-a.glb',
  homeC: K + 'suburban/building-type-c.glb',
  homeE: K + 'suburban/building-type-e.glb',
  homeG: K + 'suburban/building-type-g.glb',
  homeK: K + 'suburban/building-type-k.glb',
  suv: K + 'cars/suv.glb',
  bus: K + 'cars/delivery.glb',
  shopA: K + 'commercial/building-a.glb',
  shopD: K + 'commercial/building-d.glb',
  shopF: K + 'commercial/building-f.glb',
  stove: F + 'kitchenStove.glb',
  cabinet: F + 'kitchenCabinet.glb',
  fridge: F + 'kitchenFridge.glb',
  sink: F + 'kitchenSink.glb',
  chair: F + 'chair.glb',
  chairDesk: F + 'chairDesk.glb',
  desk: F + 'desk.glb',
  table: F + 'table.glb',
  stool: F + 'stoolBar.glb',
  shelf: F + 'bookcaseOpen.glb',
  bed: F + 'bedSingle.glb',
  lounge: F + 'loungeChair.glb',
  plant: F + 'pottedPlant.glb',
  plant2: F + 'plantSmall1.glb',
  lampFloor: F + 'lampRoundFloor.glb',
  mirror: F + 'bathroomMirror.glb',
  casualM: Q + 'Casual_Male.glb',
  casualF: Q + 'Casual_Female.glb',
  casual2: Q + 'Casual2_Male.glb',
  workerM: Q + 'Worker_Male.glb',
  workerF: Q + 'Worker_Female.glb',
  chefM: Q + 'Chef_Male.glb',
  chefF: Q + 'Chef_Female.glb',
  doctorM: Q + 'Doctor_Male_Young.glb',
  doctorF: Q + 'Doctor_Female_Young.glb',
  suit: Q + 'Suit_Male.glb',
};

const SHOPS = {
  schlosserei: { house: 'houseE', npc: 'workerM', props: [['table', 0.9, -1.2, 3.4], ['chair', 0.85, 1.4, 3.1], ['barrier', 0.7, -2.4, 2.6]] },
  kueche: { house: 'shopA', npc: 'chefM', props: [['stove', 1.05, -1.6, 3.6], ['cabinet', 1.0, 1.5, 3.5], ['fridge', 1.7, 0.2, 4.4], ['pot', 0.45, -1.5, 3.2], ['pan', 0.35, -0.6, 3.3], ['stool', 0.8, 2.2, 2.4], ['mug', 0.28, 1.4, 3.1]] },
  labor: { house: 'houseC', npc: 'doctorF', props: [['desk', 0.9, -1.2, 3.3], ['chairDesk', 0.9, 0.2, 2.5], ['ketchup', 0.35, -1.1, 2.9], ['mug', 0.3, -0.4, 2.9], ['plant', 0.7, 1.8, 3.6]] },
  lager: { house: 'houseI', npc: 'workerF', props: [['shelf', 1.5, -1.8, 3.8], ['shelf', 1.5, 1.6, 3.8], ['table', 0.8, 0, 2.8]] },
  buero: { house: 'shopD', npc: 'suit', props: [['desk', 0.9, -1.3, 3.4], ['chairDesk', 0.9, 0.1, 2.6], ['lampFloor', 1.15, 1.8, 3.2], ['plant', 0.75, -2.4, 3.0]] },
  friseur: { house: 'shopF', npc: 'chefF', props: [['lounge', 0.85, -0.4, 3.0], ['mirror', 1.1, -1.6, 4.0], ['chair', 0.8, 1.6, 2.8], ['plant2', 0.55, 2.2, 3.4]] },
  baustelle: { house: 'houseG', npc: 'workerM', props: [['cone', 0.7, -1.4, 2.4], ['cone', 0.7, 1.2, 2.6], ['barrier', 0.75, 0, 3.2], ['fence', 1.1, -2.2, 4.2]] },
  krankenhaus: { house: 'houseA', npc: 'doctorM', props: [['bed', 0.85, -1.2, 3.4], ['cabinet', 1.05, 1.6, 3.6], ['plant', 0.7, 0.2, 2.4]] },
  autowerkstatt: { house: 'houseE', npc: 'casual2', props: [['sedan', 1.3, -0.2, 4.6], ['van', 1.35, 2.4, 5.2]] },
};

export function loadWorldAssets(loader) {
  const jobs = Object.entries(FILES).map(async ([id, url]) => {
    try {
      const gltf = await loader.loadAsync(url);
      return [id, gltf];
    } catch (err) {
      console.warn('Modell fehlt:', url, err && err.message ? err.message : err);
      return [id, null];
    }
  });
  return Promise.all(jobs).then(pairs => {
    const all = Object.fromEntries(pairs);
    const chars = {
      Casual_Male: all.casualM,
      Casual_Female: all.casualF,
      Casual2_Male: all.casual2,
      Worker_Male: all.workerM,
      Worker_Female: all.workerF,
      Chef_Male: all.chefM,
      Chef_Female: all.chefF,
      Doctor_Male_Young: all.doctorM,
      Doctor_Female_Young: all.doctorF,
      Suit_Male: all.suit,
    };
    Object.values(all).forEach(gltf => {
      if (!gltf || !gltf.scene) return;
      gltf.scene.traverse(o => { if (o.geometry) o.geometry.userData.shared = true; });
    });
    return { all, chars };
  });
}

function stand(obj, height) {
  obj.scale.set(1, 1, 1);
  obj.position.set(0, 0, 0);
  obj.rotation.set(0, 0, 0);
  obj.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
  obj.scale.setScalar(height / (size.y || 1));
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  obj.position.y -= box.min.y;
  const c = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
  obj.position.x -= c.x;
  obj.position.z -= c.z;
}

function cloneProp(gltf, height) {
  if (!gltf) return null;
  const obj = gltf.scene.clone(true);
  stand(obj, height);
  obj.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = height >= 3.2;
    o.receiveShadow = true;
  });
  return obj;
}

function place(group, gltf, height, x, z, yaw) {
  const obj = cloneProp(gltf, height);
  if (!obj) return null;
  obj.position.x = x;
  obj.position.z = z;
  obj.rotation.y = yaw || 0;
  group.add(obj);
  return obj;
}

function spot(b, along, side) {
  return {
    x: b.cx + b.tx * along + b.sx * side,
    z: b.cz + b.tz * along + b.sz * side,
  };
}

export function dressWorld(scene, layout, lib, built) {
  if (!lib || scene.userData.dressed) return;
  scene.userData.dressed = true;
  const group = new THREE.Group();
  group.name = 'stadt-modelle';
  const detail = new THREE.Group();
  detail.name = 'deko';
  scene.add(group, detail);
  scene.userData.detail = detail;
  const yawFor = b => yawFacing(b.sx, b.sz);
  const actors = [];
  const roofs = [];

  for (const b of layout.buildings) {
    const spec = SHOPS[b.id];
    if (!spec) continue;
    const yaw = yawFor(b);
    addRoom(group, b, roofs);
    const house = spot(b, 0, 10.5);
    place(group, lib.all[spec.house], 5.4, house.x, house.z, yaw);
    const signPos = spot(b, 0, 5.4);
    const sign = makeTextPlane(b.name, { w: 512, h: 160, bg: '#fff8ee', fg: '#3a2418', stripe: '#e07a32', pw: 3.4, ph: 1.05, font: 64 });
    sign.position.set(signPos.x, 3.15, signPos.z);
    sign.lookAt(b.cx, 3.15, b.cz);
    group.add(sign);
    const aw = spot(b, 0, 4.6);
    place(group, lib.all.awning, 1.1, aw.x, aw.z, yaw);
    for (const [id, h, along, side] of spec.props) {
      const sideIn = Math.sign(side || 1) * Math.min(Math.abs(side), 2.15);
      const p = spot(b, along * 0.55, sideIn);
      const obj = place(group, lib.all[id], h, p.x, p.z, yaw + (id === 'sedan' || id === 'van' ? Math.PI / 2 : 0));
      if (obj && h > 1.4) obj.traverse(m => { if (m.isMesh) m.castShadow = true; });
    }
    const npcGltf = lib.chars[{
      workerM: 'Worker_Male', workerF: 'Worker_Female', chefM: 'Chef_Male', chefF: 'Chef_Female',
      doctorM: 'Doctor_Male_Young', doctorF: 'Doctor_Female_Young', suit: 'Suit_Male', casual2: 'Casual2_Male',
    }[spec.npc]];
    if (npcGltf) {
      const npcTint = spec.npc.startsWith('doctor') || spec.npc.startsWith('chef') ? '#f4f7fb' : (spec.npc.startsWith('worker') ? '#e08a2c' : '#3d7ff2');
      const npc = spawnActor(npcGltf, spec.npc === 'workerF' ? 'Walk' : 'Idle', npcTint);
      const p = spot(b, 0.6, 2.5);
      npc.root.position.set(p.x, 0, p.z);
      npc.root.rotation.y = yaw;
      group.add(npc.root);
      actors.push(npc);
    }
  }

  scatter(detail, lib.all.treeL, 3.5, layout, 10, 6.5);
  scatter(detail, lib.all.treeS, 2.3, layout, 8, 5.2);
  scatter(group, lib.all.planter, 0.55, layout, 12, 2.35);
  scatter(group, lib.all.lamp, 2.4, layout, 8, -3.3);

  const cars = ['sedan', 'taxi', 'van', 'truck'];
  layout.buildings.forEach((b, i) => {
    const p = spot(b, 2.2, -5.5);
    place(detail, lib.all[cars[i % cars.length]], 1.35, p.x, p.z, yawFor(b) + Math.PI / 2);
  });

  // Polizeiwagen ersetzt die Klotz-Karosse, die Gruppe fährt weiter wie bisher.
  if (built.car && lib.all.police) {
    while (built.car.children.length) built.car.remove(built.car.children[0]);
    const car = cloneProp(lib.all.police, 1.25);
    if (car) {
      car.rotation.y = Math.PI / 2;
      car.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      built.car.add(car);
      built.car.userData.wheels = [];
    }
  }

  const ICONS = { aktion: '!', frage: '?', rutsche: '»', finanzpolizei: 'P', start: 'S', ziel: '★' };
  const COLORS = { aktion: '#e36b12', frage: '#2f6fd6', rutsche: '#e03a8c', finanzpolizei: '#6b3fa0', start: '#1f8a4c', ziel: '#c4275e' };
  for (const p of layout.points) {
    if (!ICONS[p.type]) continue;
    const icon = makeTextPlane(ICONS[p.type], { w: 128, h: 128, bg: COLORS[p.type], fg: '#fffaf3', pw: 0.7, ph: 0.7, font: 78 });
    icon.rotation.x = -Math.PI / 2;
    icon.position.set(p.x, 0.48, p.z);
    icon.scale.setScalar(1.35);
    group.add(icon);
  }

  const arrows = [];
  for (let i = 0; i < layout.points.length - 1; i++) {
    const a = layout.points[i], b = layout.points[i + 1];
    arrows.push({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, rot: Math.atan2(b.x - a.x, b.z - a.z) });
  }
  const arrowGeo = new THREE.ConeGeometry(0.28, 0.72, 4);
  arrowGeo.rotateX(Math.PI / 2);
  const arrowMesh = new THREE.InstancedMesh(arrowGeo, new THREE.MeshBasicMaterial({ color: '#ffb703' }), Math.max(1, arrows.length));
  arrowMesh.userData.fullCount = arrows.length;
  const ad = new THREE.Object3D();
  arrows.forEach((p, i) => { ad.position.set(p.x, 0.52, p.z); ad.rotation.y = p.rot; ad.updateMatrix(); arrowMesh.setMatrixAt(i, ad.matrix); });
  arrowMesh.instanceMatrix.needsUpdate = true;
  group.add(arrowMesh);
  const pulse = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.78, 28), new THREE.MeshBasicMaterial({ color: 0xffe14a, side: THREE.DoubleSide, transparent: true, opacity: 0.95 }));
  pulse.rotation.x = -Math.PI / 2;
  pulse.visible = false;
  group.add(pulse);
  built.pulse = pulse;
  built.pointList = layout.points;
  const start = layout.points[0];
  if (start) {
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 0.05, 24), new THREE.MeshLambertMaterial({ color: '#e7d3a1' }));
    plaza.position.set(start.x, 0.02, start.z);
    group.add(plaza);
    place(group, lib.all.parasol, 1.6, start.x + 4.2, start.z + 3.2, 0.4);
    place(group, lib.all.awning, 1.15, start.x - 3.5, start.z + 2.4, 0.2);
  }

  const walkers = [];
  const paths = [sidePath(layout, 3.6), sidePath(layout, -4.8)];
  const bodies = [['casualM', '#e23b5a'], ['casualF', '#3d7ff2'], ['casual2', '#2e9e5b'], ['suit', '#6b4ad6']];
  bodies.forEach(([id, tint], i) => {
    const gltf = lib.all[id];
    if (!gltf) return;
    const actor = spawnActor(gltf, 'Walk', tint);
    const path = paths[i % 2];
    actor.root.position.set(path[0].x, 0, path[0].z);
    group.add(actor.root);
    walkers.push({ root: actor.root, mixer: actor.mixer, path, t: (i / bodies.length) * (path.length - 1), dir: i % 2 ? -1 : 1, speed: 0.85 });
    actors.push(actor);
  });

  built.actors = actors;
  built.walkers = walkers;
  built.roofs = roofs;
  if (built.peds) built.peds.replaced = true;
  enrichCity(group, detail, lib, layout, built);
}

function addRoom(parent, b, roofs) {
  const g = new THREE.Group();
  g.position.set(b.cx, 0, b.cz);
  g.rotation.y = Math.atan2(-b.tz, b.tx);
  const L = Math.max(6, b.length);
  const D = b.depth;
  const H = b.open ? 1.35 : 2.85;
  const wall = new THREE.MeshLambertMaterial({ color: b.wall });
  const floorM = new THREE.MeshLambertMaterial({ color: b.floor });
  const aisle = 2.5;
  const sideW = Math.max(0.6, (D - aisle) / 2);
  for (const z of [-(aisle / 2 + sideW / 2), aisle / 2 + sideW / 2]) {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(L, 0.08, sideW), floorM);
    floor.position.set(0, 0.08, z);
    floor.receiveShadow = true;
    g.add(floor);
  }
  const t = 0.28;
  for (const z of [D / 2, -D / 2]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(L, H, t), wall);
    side.position.set(0, H / 2 + 0.12, z);
    side.castShadow = true;
    g.add(side);
  }
  const gap = 2.6;
  const jamb = Math.max(0.4, (D - gap) / 2);
  for (const x of [-L / 2, L / 2]) {
    for (const z of [-(gap / 2 + jamb / 2), gap / 2 + jamb / 2]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(t, H, jamb), wall);
      post.position.set(x, H / 2 + 0.12, z);
      g.add(post);
    }
  }
  if (!b.open) {
    const roofG = new THREE.Group();
    const roofMat = new THREE.MeshLambertMaterial({ color: b.roof });
    const solarMat = new THREE.MeshLambertMaterial({ color: '#1f6fbf' });
    const plantMat = new THREE.MeshLambertMaterial({ color: '#2f9a45' });
    for (const z of [D * 0.34, -D * 0.34]) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(L, 0.14, D * 0.3), roofMat);
      slab.position.set(0, H + 0.22, z);
      slab.castShadow = true;
      roofG.add(slab);
    }
    const solar = new THREE.Mesh(new THREE.BoxGeometry(L * 0.28, 0.06, D * 0.16), solarMat);
    solar.position.set(-L * 0.2, H + 0.36, D * 0.34);
    const green = new THREE.Mesh(new THREE.BoxGeometry(L * 0.18, 0.08, D * 0.16), plantMat);
    green.position.set(L * 0.22, H + 0.34, -D * 0.34);
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.42), new THREE.MeshLambertMaterial({ color: '#8a4030' }));
    chim.position.set(L * 0.32, H + 0.62, D * 0.34);
    roofG.add(solar, green, chim);
    g.add(roofG);
    roofs.push({ mesh: roofG, from: b.fieldFrom, to: b.fieldTo });
  }
  parent.add(g);
}

function instanceOf(gltf, height, places, cast) {
  if (!gltf || !places.length) return null;
  const sample = gltf.scene.clone(true);
  stand(sample, height);
  sample.updateMatrixWorld(true);
  const geos = [];
  let map = null;
  sample.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    geos.push(g);
    if (o.material && o.material.map) map = o.material.map;
  });
  if (!geos.length) return null;
  let geo = geos[0];
  if (geos.length > 1) {
    try { geo = mergeGeometries(geos); } catch { return null; }
  }
  const mat = new THREE.MeshLambertMaterial({ map, color: 0xffffff });
  const mesh = new THREE.InstancedMesh(geo, mat, places.length);
  mesh.userData.fullCount = places.length;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  places.forEach((p, i) => {
    dummy.position.set(p.x, p.y || 0, p.z);
    dummy.rotation.set(0, p.rot || 0, 0);
    dummy.scale.set(p.sx || 1, p.sy || 1, p.sz || 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (p.color) mesh.setColorAt(i, color.set(p.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = !!cast;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

function enrichCity(group, detail, lib, layout, built) {
  const b = layout.bounds;
  const pts = layout.points;
  const density = [];
  const remember = mesh => { if (mesh) { group.add(mesh); density.push(mesh); } };

  const homes = [];
  const types = ['homeA', 'homeC', 'homeE', 'homeG', 'homeK'];
  const step = 16;
  for (let x = b.minX - 18; x <= b.maxX + 28; x += step) {
    for (let z = b.minZ - 18; z <= b.maxZ + 22; z += step) {
      let near = false;
      for (let i = 0; i < pts.length; i += 2) {
        if (Math.hypot(pts[i].x - x, pts[i].z - z) < 11) { near = true; break; }
      }
      if (near) continue;
      homes.push({ x, z, rot: ((x * 3 + z) % 4) * Math.PI / 2, kind: types[Math.abs(Math.floor(x + z)) % types.length], sy: 0.85 + ((Math.abs(x) + Math.abs(z)) % 5) * 0.05 });
    }
  }
  for (const kind of types) {
    const places = homes.filter(h => h.kind === kind).map(h => ({ x: h.x, z: h.z, rot: h.rot, sy: h.sy }));
    remember(instanceOf(lib.all[kind], 4.8, places, true));
  }
  const skyline = [];
  const edge = b.maxZ + 28;
  for (let i = 0; i < 7; i++) skyline.push({ x: b.minX + i * 22, z: edge + (i % 2) * 8, rot: Math.PI, sy: 1.1 + (i % 3) * 0.25 });
  remember(instanceOf(lib.all.skyA, 11, skyline.filter((_, i) => i % 3 === 0), true));
  remember(instanceOf(lib.all.skyB, 13, skyline.filter((_, i) => i % 3 === 1), true));
  remember(instanceOf(lib.all.skyC, 12, skyline.filter((_, i) => i % 3 === 2), true));

  const hills = new THREE.Group();
  const hillMat = new THREE.MeshLambertMaterial({ color: '#7ed36a' });
  const hillGeo = new THREE.ConeGeometry(18, 11, 7);
  [[b.minX - 30, b.minZ - 20], [b.maxX + 36, b.minZ - 16], [b.minX - 28, b.maxZ + 36], [b.maxX + 40, b.maxZ + 30], [(b.minX + b.maxX) / 2, b.maxZ + 42]].forEach(([x, z], i) => {
    const m = new THREE.Mesh(hillGeo, hillMat);
    m.position.set(x, 2, z);
    m.scale.set(1 + i * 0.08, 0.8 + (i % 3) * 0.15, 1);
    hills.add(m);
  });
  group.add(hills);

  const pond = new THREE.Mesh(new THREE.CircleGeometry(7, 18), new THREE.MeshLambertMaterial({ color: '#3aa0d8' }));
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(b.minX + 18, 0.12, b.minZ + 22);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.8, 8), new THREE.MeshLambertMaterial({ color: '#d9d3c8' }));
  rim.position.set(b.minX + 18, 0.4, b.minZ + 14);
  group.add(pond, rim);

  const stripes = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const dot = pts[i - 1].tx * pts[i].tx + pts[i - 1].tz * pts[i].tz;
    if (dot > 0.35) continue;
    for (let s = -1.2; s <= 1.2; s += 0.6) stripes.push({ x: pts[i].x + pts[i].tx * s, z: pts[i].z + pts[i].tz * s, rot: Math.atan2(pts[i].tx, pts[i].tz) });
  }
  const stripeGeo = new THREE.BoxGeometry(0.28, 0.04, 1.5);
  const stripeMat = new THREE.MeshBasicMaterial({ color: '#f7f4ee' });
  const stripeMesh = new THREE.InstancedMesh(stripeGeo, stripeMat, Math.max(1, stripes.length));
  stripeMesh.userData.fullCount = stripes.length;
  stripeMesh.count = stripes.length;
  const dummy = new THREE.Object3D();
  stripes.forEach((p, i) => {
    dummy.position.set(p.x, 0.16, p.z);
    dummy.rotation.y = p.rot;
    dummy.updateMatrix();
    stripeMesh.setMatrixAt(i, dummy.matrix);
  });
  stripeMesh.instanceMatrix.needsUpdate = true;
  group.add(stripeMesh);
  density.push(stripeMesh);

  place(group, lib.all.roundabout, 0.9, 96, 20, 0);
  place(group, lib.all.light, 2.6, 100, 8, 0);
  place(group, lib.all.light, 2.6, -8, 62, Math.PI / 2);
  place(group, lib.all.stop, 1.6, 20, 8, 0.4);
  place(group, lib.all.bend, 1.2, 96, 6, 0);

  const bins = [];
  for (let i = 4; i < pts.length; i += 9) bins.push({ x: pts[i].x + pts[i].sx * 3.1, z: pts[i].z + pts[i].sz * 3.1, rot: yawFacing(pts[i].tx, pts[i].tz) });
  remember(instanceOf(lib.all.dumpster, 1.15, bins, false));

  const trees = [];
  for (let i = 0; i < pts.length; i += 4) {
    trees.push({ x: pts[i].x + pts[i].sx * (i % 8 === 0 ? 5.5 : -5.2), z: pts[i].z + pts[i].sz * (i % 8 === 0 ? 5.5 : -5.2), color: i % 3 ? '#3e9a4a' : '#2f7a38', rot: i });
  }
  const treeMesh = instanceOf(lib.all.treeL, 3.6, trees, false);
  remember(treeMesh);
  const root = group.parent;
  root.userData.trees = treeMesh;
  root.userData.treePlaces = trees;

  const cars = ['sedan', 'taxi', 'suv', 'bus', 'van'];
  const traffic = [];
  const loop = roadLoop(layout.bounds);
  for (let i = 0; i < 5; i++) {
    const gltf = lib.all[cars[i % cars.length]];
    const obj = cloneProp(gltf, i === 3 ? 1.7 : 1.25);
    if (!obj) continue;
    group.add(obj);
    traffic.push({ obj, t: i / 5, speed: 0.045 + i * 0.008, loop });
  }
  root.userData.traffic = traffic;

  const life = new THREE.Group();
  const cloudGeo = new THREE.SphereGeometry(3.2, 7, 5);
  const cloudMat = new THREE.MeshLambertMaterial({ color: '#fffaf3' });
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Mesh(cloudGeo, cloudMat);
    c.scale.set(1.8, 0.45, 1);
    c.position.set(b.minX + i * 28, 18 + (i % 2) * 3, b.minZ + 10 + (i % 3) * 20);
    life.add(c);
  }
  const birdGeo = new THREE.ConeGeometry(0.18, 0.7, 4);
  birdGeo.rotateZ(Math.PI / 2);
  const birdMat = new THREE.MeshLambertMaterial({ color: '#3d4454' });
  const birds = new THREE.InstancedMesh(birdGeo, birdMat, 8);
  birds.userData.fullCount = 8;
  life.add(birds);
  const puffs = [];
  const puffGeo = new THREE.SphereGeometry(0.22, 6, 5);
  const steamMat = new THREE.MeshBasicMaterial({ color: '#f7fbff', transparent: true, opacity: 0.55 });
  const sparkMat = new THREE.MeshBasicMaterial({ color: '#ffb14a' });
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(puffGeo, i < 8 ? steamMat : sparkMat);
    m.visible = false;
    life.add(m);
    puffs.push({ m, life: 0, kind: i < 8 ? 'steam' : 'spark' });
  }
  group.add(life);
  root.userData.life = life;
  root.userData.birds = birds;
  root.userData.puffs = puffs;
  root.userData.density = density;
  root.userData.bounds = layout.bounds;
}

function roadLoop(b) {
  const pad = 8;
  return [
    { x: b.minX - pad, z: b.minZ - pad },
    { x: b.maxX + pad, z: b.minZ - pad },
    { x: b.maxX + pad, z: b.maxZ + pad },
    { x: b.minX - pad, z: b.maxZ + pad },
  ];
}

function loopPoint(loop, t) {
  const n = loop.length;
  const scaled = ((t % 1) + 1) % 1 * n;
  const i = Math.floor(scaled) % n;
  const u = scaled - Math.floor(scaled);
  const a = loop[i];
  const c = loop[(i + 1) % n];
  return { x: a.x + (c.x - a.x) * u, z: a.z + (c.z - a.z) * u, tx: c.x - a.x, tz: c.z - a.z };
}

function spawnActor(gltf, clipName, tint) {
  const model = cloneSkinned(gltf.scene);
  stand(model, 1.72);
  model.rotation.y = Math.PI;
  paintCharacter(model, tint || '#e07a32');
  const root = new THREE.Group();
  root.add(model);
  model.traverse(o => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });
  const mixer = new THREE.AnimationMixer(model);
  const clip = (gltf.animations || []).find(c => c.name.split('|').pop() === clipName)
    || (gltf.animations || []).find(c => c.name.split('|').pop() === 'Idle');
  if (clip) mixer.clipAction(clip).play();
  return { root, mixer };
}

function scatter(group, gltf, height, layout, every, side) {
  if (!gltf) return;
  const pts = layout.points;
  for (let i = 2; i < pts.length; i += every) {
    if (pts[i].building && Math.abs(side) < 4) continue;
    const p = pts[i];
    place(group, gltf, height, p.x + p.sx * side, p.z + p.sz * side, yawFacing(p.tx, p.tz));
  }
}

function sidePath(layout, side) {
  return layout.points.map(p => ({ x: p.x + p.sx * side, z: p.z + p.sz * side }));
}

export function applyDensity(scene, frac) {
  const list = (scene && scene.userData.density) || [];
  for (const mesh of list) {
    const full = mesh.userData.fullCount || mesh.count;
    mesh.count = Math.max(0, Math.round(full * frac));
  }
  if (scene && scene.userData.life) scene.userData.life.visible = frac > 0.45;
}

export function stepCrowd(built, dt, scene) {
  if (!built) return;
  for (const a of built.actors || []) a.mixer.update(dt);
  const now = performance.now() / 1000;
  if (scene && scene.userData.trees && scene.userData.treePlaces) {
    const mesh = scene.userData.trees;
    const places = scene.userData.treePlaces;
    const dummy = new THREE.Object3D();
    const n = mesh.count;
    for (let i = 0; i < n; i++) {
      const p = places[i];
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.y = (p.rot || 0) + Math.sin(now * 1.3 + i) * 0.05;
      dummy.rotation.z = Math.sin(now * 1.7 + i) * 0.03;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  const traffic = (scene && scene.userData.traffic) || [];
  for (const car of traffic) {
    car.t = (car.t + dt * car.speed) % 1;
    const p = loopPoint(car.loop, car.t);
    car.obj.position.set(p.x, 0, p.z);
    car.obj.lookAt(p.x + p.tx, 0, p.z + p.tz);
  }
  if (scene && scene.userData.birds) {
    const birds = scene.userData.birds;
    const dummy = new THREE.Object3D();
    const b = scene.userData.bounds || { minX: 0, minZ: 0, maxX: 80, maxZ: 80 };
    for (let i = 0; i < birds.count; i++) {
      const a = now * 0.35 + i;
      dummy.position.set((b.minX + b.maxX) / 2 + Math.cos(a) * (18 + i * 3), 11 + Math.sin(a * 2) * 1.5, (b.minZ + b.maxZ) / 2 + Math.sin(a) * (14 + i));
      dummy.rotation.y = -a;
      dummy.updateMatrix();
      birds.setMatrixAt(i, dummy.matrix);
    }
    birds.instanceMatrix.needsUpdate = true;
  }
  if (built.pulse && built.pointList && built.pulseIndex >= 0) {
    const fp = built.pointList[built.pulseIndex];
    if (fp) {
      const s = 1 + Math.sin(now * 5) * 0.1;
      built.pulse.visible = true;
      built.pulse.position.set(fp.x, 0.58, fp.z);
      built.pulse.scale.set(s, s, 1);
    }
  } else if (built.pulse) built.pulse.visible = false;
  const inside = built.insideIndex;
  for (const roof of built.roofs || []) roof.mesh.visible = !(inside >= roof.from && inside <= roof.to);
  const puffs = (scene && scene.userData.puffs) || [];
  const shop = (built.roofs || []).find(r => inside >= r.from && inside <= r.to);
  built._puff = (built._puff || 0) - dt;
  if (shop && puffs.length && built._puff <= 0) {
    built._puff = 0.28;
    const idle = puffs.find(p => p.life <= 0);
    if (idle) {
      idle.life = 1.2;
      idle.m.visible = true;
      idle.m.position.set(shop.mesh.parent.position.x, 1.2, shop.mesh.parent.position.z);
      idle.kind = inside >= 15 && inside <= 21 ? 'steam' : 'spark';
      idle.m.material = idle.kind === 'steam' ? puffs[0].m.material : puffs[8].m.material;
    }
  }
  for (const p of puffs) {
    if (p.life <= 0) continue;
    p.life -= dt;
    p.m.position.y += dt * (p.kind === 'steam' ? 0.8 : 1.4);
    p.m.position.x += Math.sin(now * 6 + p.m.id) * dt * 0.2;
    if (p.life <= 0) p.m.visible = false;
  }
  for (const w of built.walkers || []) {
    const pts = w.path;
    if (!pts || pts.length < 2) continue;
    w.t += w.dir * w.speed * dt;
    if (w.t >= pts.length - 1) { w.t = pts.length - 1; w.dir = -1; }
    if (w.t <= 0) { w.t = 0; w.dir = 1; }
    const i0 = Math.floor(w.t);
    const i1 = Math.min(pts.length - 1, i0 + 1);
    const u = w.t - i0;
    const x = pts[i0].x + (pts[i1].x - pts[i0].x) * u;
    const z = pts[i0].z + (pts[i1].z - pts[i0].z) * u;
    w.root.position.set(x, 0, z);
    w.root.lookAt(x - (pts[i1].x - pts[i0].x), 0, z - (pts[i1].z - pts[i0].z));
  }
}
