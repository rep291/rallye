// Lädt die CC0-Modelle (Kenney, Quaternius) und stellt die Stadt damit.
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
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

  for (const b of layout.buildings) {
    const spec = SHOPS[b.id];
    if (!spec) continue;
    const yaw = yawFor(b);
    const house = spot(b, 0, 7.2);
    place(group, lib.all[spec.house], 4.6, house.x, house.z, yaw);
    const signPos = spot(b, 0, 5.4);
    const sign = makeTextPlane(b.name, { w: 512, h: 160, bg: '#fff8ee', fg: '#3a2418', stripe: '#e07a32', pw: 3.4, ph: 1.05, font: 64 });
    sign.position.set(signPos.x, 3.15, signPos.z);
    sign.lookAt(b.cx, 3.15, b.cz);
    group.add(sign);
    const aw = spot(b, 0, 4.6);
    place(group, lib.all.awning, 1.1, aw.x, aw.z, yaw);
    for (const [id, h, along, side] of spec.props) {
      const p = spot(b, along, side);
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
    icon.position.set(p.x, 0.36, p.z);
    group.add(icon);
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
  if (built.peds) built.peds.replaced = true;
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

export function stepCrowd(built, dt) {
  if (!built) return;
  for (const a of built.actors || []) a.mixer.update(dt);
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
