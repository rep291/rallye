// 3D-Flipchart. Nur die Zone des aktiven Spielers wird gezeichnet.
// Spiellogik bleibt auf dem Server, hier ist nur die Darstellung.
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import {
  buildLayout, TILE_Y, yawFacing, zoneOf, ZONE_NAME, PAGE,
} from './layout.js';
import { buildZone, applyDecor } from './zonebuild.js';
import {
  createPlayerVisual, updateVisual, createLoader, makeNameSprite, equipFromLibrary,
  paintCharacter,
} from './figures.js';

const PRESETS = {
  niedrig: { dpr: 0.75, npcs: 1, fill: 0.35, decor: 0.4 },
  mittel: { dpr: 1, npcs: 2, fill: 1, decor: 1 },
  hoch: { dpr: 1.25, npcs: 3, fill: 1, decor: 1 },
};
const DPR_CAP = 1.25;
const Q = '/city3d/models/quaternius/';
const CHAR_FILES = {
  Casual_Male: Q + 'Casual_Male.glb',
  Casual_Female: Q + 'Casual_Female.glb',
  Casual2_Male: Q + 'Casual2_Male.glb',
  Worker_Male: Q + 'Worker_Male.glb',
  Worker_Female: Q + 'Worker_Female.glb',
  Chef_Male: Q + 'Chef_Male.glb',
  Chef_Female: Q + 'Chef_Female.glb',
  Doctor_Male_Young: Q + 'Doctor_Male_Young.glb',
  Doctor_Female_Young: Q + 'Doctor_Female_Young.glb',
  Suit_Male: Q + 'Suit_Male.glb',
};

const TYPE_DE = {
  start: 'Start', ziel: 'Ziel', normal: 'Weg', aktion: 'Aktion',
  frage: 'Frage', rutsche: 'Rutsche', finanzpolizei: 'Finanzpolizei',
};

const SHOP_JOBS = {
  schlosserei: [
    { model: 'Worker_Male', tint: '#3d5a8a', steps: [['walk', 1.3], ['punch', 1.2], ['wait', 1.1], ['pickup', 0.8]] },
    { model: 'Worker_Female', tint: '#e08a2c', steps: [['walk', 1.2], ['pickup', 0.8], ['carry', 1.3], ['wait', 1.0]] },
  ],
  kueche: [
    { model: 'Chef_Male', tint: '#f4f7fb', steps: [['walk', 1.1], ['wait', 1.6], ['pickup', 0.8], ['walk', 1.0]] },
    { model: 'Chef_Female', tint: '#f4f7fb', steps: [['walk', 1.2], ['wait', 1.8], ['pickup', 0.7]] },
  ],
  labor: [
    { model: 'Doctor_Female_Young', tint: '#e7eef8', steps: [['walk', 1.2], ['wait', 1.8], ['pickup', 0.8]] },
    { model: 'Doctor_Male_Young', tint: '#e7eef8', steps: [['walk', 1.3], ['wait', 1.6], ['walk', 1.1]] },
  ],
  lager: [
    { model: 'Worker_Female', tint: '#c48a2a', steps: [['walk', 1.1], ['pickup', 0.8], ['carry', 1.4], ['wait', 1.0]] },
    { model: 'Casual2_Male', tint: '#3d7ff2', steps: [['walk', 1.2], ['wait', 1.8], ['walk', 1.0]] },
  ],
  buero: [
    { model: 'Suit_Male', tint: '#2c4d86', steps: [['sit', 4.5], ['walk', 1.2], ['pickup', 0.8]] },
    { model: 'Casual_Female', tint: '#4363d8', steps: [['walk', 1.3], ['wait', 2.2], ['walk', 1.1]] },
  ],
  friseur: [
    { model: 'Chef_Female', tint: '#c45b8a', steps: [['walk', 1.2], ['wait', 2.0], ['punch', 0.6], ['wait', 1.2]] },
    { model: 'Casual_Female', tint: '#f6e7ee', steps: [['sit', 8]] },
  ],
  baustelle: [
    { model: 'Worker_Male', tint: '#e0b04a', steps: [['walk', 1.2], ['punch', 1.4], ['wait', 1.0]] },
    { model: 'Worker_Female', tint: '#f2c14a', steps: [['pickup', 0.8], ['carry', 1.4], ['wait', 1.1]] },
  ],
  krankenhaus: [
    { model: 'Doctor_Female_Young', tint: '#f7f7f5', steps: [['walk', 1.3], ['wait', 1.8], ['pickup', 0.8], ['walk', 1.1]] },
    { model: 'Doctor_Male_Young', tint: '#f4f7fb', steps: [['walk', 1.2], ['wait', 2.0], ['walk', 1.2]] },
  ],
  autowerkstatt: [
    { model: 'Worker_Male', tint: '#1f7a45', steps: [['walk', 1.2], ['wait', 1.6], ['punch', 1.2], ['wait', 0.8]] },
    { model: 'Casual2_Male', tint: '#3d7ff2', steps: [['pickup', 0.8], ['carry', 1.5], ['wait', 1.2]] },
  ],
};

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

function tierName(t) {
  return t === 'niedrig' ? 'Niedrig' : t === 'hoch' ? 'Hoch' : 'Mittel';
}

function startTier() {
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  if (cores <= 2 || mem <= 2) return 'niedrig';
  return 'mittel';
}

export function mountCity(canvas, board, opts = {}) {
  if (!webglAvailable()) throw new Error('WebGL2 fehlt');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xe4f1fa, 1);
  renderer.shadowMap.enabled = false;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe4f1fa);
  scene.fog = new THREE.Fog(0xe4f1fa, 28, 78);
  scene.add(new THREE.HemisphereLight(0xe4f1fa, 0x8fcf5a, 0.85));
  const sun = new THREE.DirectionalLight(0xfff6ea, 1.2);
  sun.position.set(14, 24, 10);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.12, 180);

  let layout = buildLayout(board.fields || []);
  const pages = {};
  for (const z of [1, 2, 3, 4]) {
    pages[z] = buildZone(layout, z);
    scene.add(pages[z]);
  }

  const players = new Map();
  const pins = [];
  const npcs = [];
  let chars = null;
  let state = null;
  let active = 1;
  let flip = null;
  let running = false;
  let raf = 0;
  let fallen = false;
  let qualityMode = opts.quality || 'auto';
  let tier = qualityMode === 'auto' ? startTier() : (PRESETS[qualityMode] ? qualityMode : 'mittel');
  let lowSince = 0;
  let badSince = 0;
  let startedAt = performance.now();
  let fps = 60;
  let fpsFrames = 0;
  let fpsStamp = performance.now();
  let last = performance.now();
  let slideSeq = '';
  const loader = createLoader();
  const catalog = { scaleToHeight: 1.7, clips: { idle: ['idle'], walk: ['walk'], sit: ['sitdown'], cheer: ['victory'] } };
  const camPos = new THREE.Vector3(8, 16, 22);
  const lookPos = new THREE.Vector3(PAGE.w / 2, 0, PAGE.d / 2);
  const _desired = new THREE.Vector3();
  const _look = new THREE.Vector3();
  const _wp = new THREE.Vector3();

  loadChars(loader).then(lib => { chars = lib; for (const p of players.values()) dress(p); refreshNpcs(); }).catch(err => console.warn(err));

  showOnly(1);
  applyTier();

  function contentOf(z) { return pages[z].userData.content; }

  function showOnly(z) {
    for (const k of [1, 2, 3, 4]) pages[k].visible = k === z;
    active = z;
    refreshNpcs();
  }

  function localPoint(id) {
    return layout.points.find(p => p.id === id) || layout.points[0];
  }

  function syncPlayers() {
    const list = (state && state.players) || [];
    const seen = new Set();
    for (const p of list) {
      seen.add(p.id);
      let pawn = players.get(p.id);
      if (!pawn) {
        const visual = createPlayerVisual(p, catalog, loader);
        const name = makeNameSprite(p.name);
        visual.root.add(name);
        pawn = {
          id: p.id, visual, name, index: p.pos | 0, target: p.pos | 0,
          wantJail: !!p.jail, mode: 'free', pos: new THREE.Vector3(),
          face: new THREE.Vector2(0, 1), yaw: 0, hop: null, arrestField: null,
          slot: -1, color: p.color, figure: p.figure,
        };
        players.set(p.id, pawn);
        placeImmediate(pawn, pawn.index, !!p.jail);
        dress(pawn);
      }
      if (pawn.color !== p.color || pawn.figure !== p.figure) {
        pawn.color = p.color;
        pawn.figure = p.figure;
        dress(pawn);
      }
      if (pawn.name.userData.label !== p.name) {
        pawn.name.userData.label = p.name;
      }
      const nextJail = !!p.jail;
      const nextTarget = p.pos | 0;
      if (nextJail && !pawn.wantJail) beginArrest(pawn, nextTarget);
      if (!nextJail && pawn.wantJail) beginRelease(pawn);
      pawn.wantJail = nextJail;
      pawn.target = nextTarget;
    }
    for (const [id, pawn] of players) {
      if (seen.has(id)) continue;
      pawn.visual.root.removeFromParent();
      players.delete(id);
    }
  }

  function dress(pawn) {
    const player = { id: pawn.id, figure: pawn.figure, color: pawn.color || '#E6197E', name: '' };
    if (chars) equipFromLibrary(pawn.visual, { chars }, player);
  }

  function placeImmediate(pawn, id, jailed) {
    const f = localPoint(id);
    pawn.index = f.id;
    if (jailed) {
      const jail = jailFor(f.zone);
      const slot = takeSlot(pawn, jail);
      pawn.mode = 'cell';
      pawn.arrestField = f.id;
      pawn.pos.set(slot.lx, TILE_Y, slot.lz);
    } else {
      pawn.mode = 'free';
      pawn.pos.set(f.lx, TILE_Y, f.lz);
    }
    parentTo(pawn, f.zone);
    pawn.visual.root.position.copy(pawn.pos);
  }

  function parentTo(pawn, zone) {
    const content = contentOf(zone);
    if (pawn.visual.root.parent !== content) content.add(pawn.visual.root);
    pawn.zone = zone;
  }

  function jailFor(zone) {
    return layout.prisons.find(j => j.zone === zone) || null;
  }

  function takeSlot(pawn, jail) {
    if (!jail) return { lx: 0, lz: 0 };
    const used = new Set();
    for (const other of players.values()) if (other !== pawn && other.mode === 'cell' && other.zone === jail.zone && other.slot >= 0) used.add(other.slot);
    let slot = 0;
    while (used.has(slot) && slot < jail.slots.length - 1) slot++;
    pawn.slot = slot;
    return jail.slots[slot];
  }

  function beginArrest(pawn, fieldId) {
    const f = localPoint(fieldId);
    pawn.arrestField = f.id;
    pawn.mode = 'arrest';
    pawn.phaseT = 0;
    pawn.phase = 'fetch';
    const jail = jailFor(f.zone);
    pawn.jail = jail;
    pawn.slotPos = takeSlot(pawn, jail);
    parentTo(pawn, f.zone);
  }

  function beginRelease(pawn) {
    pawn.mode = 'release';
    pawn.phaseT = 0;
    pawn.phase = 'out';
  }

  function activeId() {
    if (!state || state.phase !== 'playing' || !state.players) return null;
    const cur = state.players[state.turn];
    return cur ? cur.id : null;
  }

  function followPawn() {
    const id = activeId();
    if (id && players.get(id)) return players.get(id);
    return players.values().next().value || null;
  }

  function stepPlayers(dt, now) {
    const focus = followPawn();
    for (const pawn of players.values()) {
      if (pawn.mode === 'free') stepFree(pawn, dt, now);
      else if (pawn.mode === 'arrest') stepArrest(pawn, dt);
      else if (pawn.mode === 'release') stepRelease(pawn, dt);
      else if (pawn.mode === 'cell' && pawn.slotPos) pawn.pos.set(pawn.slotPos.lx, TILE_Y, pawn.slotPos.lz);
      const poseMode = pawn.mode === 'cell' || (pawn.mode === 'arrest' && pawn.phaseT > 4.2) ? 'sit'
        : (pawn.hop || pawn.mode === 'arrest' || pawn.mode === 'release') ? 'walk' : 'idle';
      updateVisual(pawn.visual, poseMode, now / 1000, dt, catalog);
      pawn.visual.root.position.copy(pawn.pos);
      pawn.visual.root.rotation.y = pawn.yaw;
      const away = zoneOf(pawn.target) !== active && pawn !== focus;
      pawn.visual.root.visible = !away && pawn.zone === active;
    }
    if (focus && focus.zone !== active && !flip) beginFlip(focus.zone);
  }

  function stepFree(pawn, dt, now) {
    if (pawn.hop) {
      const u = Math.min(1, (now - pawn.hop.t0) / pawn.hop.dur);
      const a = localPoint(pawn.hop.from);
      const b = localPoint(pawn.hop.to);
      pawn.pos.set(
        a.lx + (b.lx - a.lx) * u,
        TILE_Y + Math.sin(u * Math.PI) * (pawn.hop.slide ? 0.15 : 0.45),
        a.lz + (b.lz - a.lz) * u,
      );
      pawn.face.set(b.lx - a.lx, b.lz - a.lz);
      if (u >= 1) {
        pawn.index = pawn.hop.to;
        pawn.hop = null;
        const landed = localPoint(pawn.index);
        pawn.face.set(landed.tx, landed.tz);
        if (pawn.slideLeft && pawn.slideLeft.length) {
          const n = pawn.slideLeft.shift();
          startHop(pawn, pawn.index, n, true);
        }
      }
    } else if (pawn.slideLeft && pawn.slideLeft.length) {
      const n = pawn.slideLeft.shift();
      startHop(pawn, pawn.index, n, true);
    } else if (zoneOf(pawn.target) !== zoneOf(pawn.index)) {
      const tz = zoneOf(pawn.target);
      if (pawn === followPawn() && !flip && active !== tz) beginFlip(tz);
      else if (!flip && (pawn !== followPawn() || active === tz)) {
        const f = localPoint(pawn.target);
        pawn.index = f.id;
        pawn.pos.set(f.lx, TILE_Y, f.lz);
        parentTo(pawn, tz);
      }
    } else if (pawn.index !== pawn.target) {
      const next = pawn.index + Math.sign(pawn.target - pawn.index);
      startHop(pawn, pawn.index, next, false);
    } else {
      const f = localPoint(pawn.index);
      pawn.pos.set(f.lx, TILE_Y, f.lz);
      if (!pawn.face.lengthSq()) pawn.face.set(f.tx, f.tz);
      parentTo(pawn, f.zone);
    }
    const len = Math.hypot(pawn.face.x, pawn.face.y) || 1;
    const aim = yawFacing(pawn.face.x / len, pawn.face.y / len);
    pawn.yaw = damp(pawn.yaw, aim, dt);
  }

  function startHop(pawn, from, to, slide) {
    pawn.hop = { from, to, t0: performance.now(), dur: slide ? 90 : Math.max(90, state && state.stepMs || 260), slide };
    parentTo(pawn, zoneOf(to));
  }

  function stepArrest(pawn, dt) {
    pawn.phaseT += dt;
    const f = localPoint(pawn.arrestField == null ? pawn.index : pawn.arrestField);
    const jail = pawn.jail || jailFor(f.zone);
    const door = jail ? { lx: jail.lx, lz: jail.lz - 1.7 } : { lx: f.lx, lz: f.lz };
    const seat = pawn.slotPos || door;
    const t = pawn.phaseT;
    if (t < 1.4) {
      const u = t / 1.4;
      pawn.pos.set(f.lx + (door.lx - f.lx) * u * 0.35, TILE_Y, f.lz + (door.lz - f.lz) * u * 0.35);
    } else if (t < 2.4) {
      pawn.pos.set(f.lx, TILE_Y, f.lz);
    } else if (t < 4.9) {
      const u = (t - 2.4) / 2.5;
      pawn.pos.set(f.lx + (door.lx - f.lx) * u, TILE_Y, f.lz + (door.lz - f.lz) * u);
    } else if (t < 6.1) {
      const u = (t - 4.9) / 1.2;
      pawn.pos.set(door.lx + (seat.lx - door.lx) * u, TILE_Y, door.lz + (seat.lz - door.lz) * u);
    } else {
      pawn.mode = 'cell';
      pawn.pos.set(seat.lx, TILE_Y, seat.lz);
    }
    pawn.face.set((door.lx - pawn.pos.x) || 0.01, (door.lz - pawn.pos.z) || 0);
    pawn.yaw = yawFacing(pawn.face.x, pawn.face.y);
    parentTo(pawn, f.zone);
  }

  function stepRelease(pawn, dt) {
    pawn.phaseT += dt;
    const back = localPoint(pawn.target);
    const from = pawn.slotPos || { lx: pawn.pos.x, lz: pawn.pos.z };
    const u = Math.min(1, pawn.phaseT / 1.8);
    pawn.pos.set(from.lx + (back.lx - from.lx) * u, TILE_Y, from.lz + (back.lz - from.lz) * u);
    if (u >= 1) {
      pawn.mode = 'free';
      pawn.slot = -1;
      pawn.index = back.id;
      parentTo(pawn, back.zone);
    }
  }

  function noteSlides() {
    const mv = state && state.lastMove;
    if (!mv || mv.kind !== 'slide') return;
    const key = mv.playerId + ':' + mv.from + ':' + mv.to + ':' + (mv.seq || '');
    if (key === slideSeq) return;
    slideSeq = key;
    const pawn = players.get(mv.playerId);
    if (!pawn) return;
    const from = mv.from | 0;
    const to = mv.to | 0;
    const path = [];
    const dir = Math.sign(to - from) || -1;
    for (let i = from + dir; dir > 0 ? i <= to : i >= to; i += dir) path.push(i);
    pawn.index = from;
    pawn.slideLeft = path;
    pawn.hop = null;
    if (zoneOf(from) !== zoneOf(to)) beginFlip(zoneOf(to));
  }

  function beginFlip(to) {
    if (!to || to === active || flip) return;
    flip = { from: active, to, t: 0 };
    pages[to].visible = true;
    pages[to].rotation.x = 0;
    pages[fromZone(flip)].rotation.x = 0;
  }

  function fromZone(f) { return f.from; }

  function stepFlip(dt) {
    if (!flip) return;
    flip.t += dt;
    const u = Math.min(1, flip.t / 0.85);
    const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    pages[flip.from].rotation.x = e * Math.PI * 0.72;
    if (u >= 1) {
      pages[flip.from].visible = false;
      pages[flip.from].rotation.x = 0;
      active = flip.to;
      pages[active].visible = true;
      pages[active].rotation.x = 0;
      for (const pawn of players.values()) {
        if (pawn.zone === active) parentTo(pawn, active);
      }
      refreshNpcs();
      flip = null;
    }
  }

  function stepCamera(dt) {
    const pawn = followPawn();
    if (flip) {
      _desired.set(PAGE.w / 2, 26, 32);
      _look.set(PAGE.w / 2, 1.2, PAGE.d * 0.35);
    } else if (!pawn || (state && state.phase === 'lobby')) {
      _desired.set(PAGE.w * 0.15, 22, PAGE.d * 0.92);
      _look.set(PAGE.w * 0.48, 0, PAGE.d * 0.42);
    } else if (pawn.mode === 'arrest' || pawn.mode === 'cell' || pawn.mode === 'release') {
      pawn.visual.root.getWorldPosition(_wp);
      _desired.set(_wp.x + 4.5, 7.2, _wp.z + 6.5);
      _look.set(_wp.x, 0.8, _wp.z);
    } else {
      pawn.visual.root.getWorldPosition(_wp);
      const inside = localPoint(pawn.index).building;
      const dist = inside ? 11 : 14;
      const height = inside ? 9.5 : 12;
      _desired.set(_wp.x - 6, _wp.y + height, _wp.z + dist);
      _look.set(_wp.x + 1.5, 0.8, _wp.z - 1);
    }
    const k = 1 - Math.exp(-dt * 3.2);
    camPos.lerp(_desired, k);
    lookPos.lerp(_look, k);
    camera.position.copy(camPos);
    camera.lookAt(lookPos);
  }

  function stepPins() {
    const focus = followPawn();
    const others = [];
    for (const pawn of players.values()) if (zoneOf(pawn.target) !== active && pawn !== focus) others.push(pawn);
    while (pins.length < others.length) {
      const g = new THREE.Group();
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
      head.position.y = 2.05;
      const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6), new THREE.MeshBasicMaterial({ color: '#2E2E33' }));
      needle.position.y = 0.55;
      const tag = makeNameSprite('andere Zone');
      tag.position.y = 2.7;
      tag.scale.set(2.2, 0.55, 1);
      g.add(head, needle, tag);
      pins.push(g);
    }
    const anchor = followPawn();
    pins.forEach((pin, i) => {
      const pawn = others[i];
      if (!pawn || !anchor) { pin.visible = false; return; }
      if (pin.parent !== scene) scene.add(pin);
      pin.visible = true;
      anchor.visual.root.getWorldPosition(_wp);
      pin.position.set(_wp.x + 1.7 + i * 1.2, 0, _wp.z + 0.3);
      pin.scale.setScalar(1);
      pin.children[0].material.color.set(pawn.color || '#E6197E');
    });
  }

  function clearNpcs() {
    for (const n of npcs) n.root.removeFromParent();
    npcs.length = 0;
  }

  function refreshNpcs() {
    clearNpcs();
    const preset = PRESETS[tier];
    const shops = layout.buildings.filter(b => b.zone === active);
    let budget = 16 - Math.min(6, players.size);
    for (const shop of shops) {
      const jobs = SHOP_JOBS[shop.id] || [];
      const count = Math.min(jobs.length, preset.npcs, budget);
      for (let i = 0; i < count; i++) {
        budget--;
        npcs.push(makeNpc(jobs[i], shop, i));
      }
    }
    if (preset.fill > 0.5 && budget > 0) spawnFill(active, budget, preset);
    const content = contentOf(active);
    for (const n of npcs) content.add(n.root);
  }

  function makeNpc(job, shop, i) {
    const root = new THREE.Group();
    const player = { id: shop.id + i, figure: figureFor(job.model), color: job.tint, name: shop.name };
    const visual = createPlayerVisual(player, catalog, loader);
    if (chars && chars[job.model]) {
      const model = cloneSkinned(chars[job.model].scene);
      stand(model);
      model.rotation.y = Math.PI;
      paintCharacter(model, job.tint);
      visual.tilt.add(model);
      visual.model = model;
      visual.mixer = new THREE.AnimationMixer(model);
      visual.clips = {};
      for (const clip of chars[job.model].animations || []) visual.clips[clip.name.toLowerCase()] = clip;
      visual.placeholder.visible = false;
    } else visual.placeholder.visible = true;
    root.add(visual.root);
    const home = { lx: shop.lx + (i ? 1.1 : -1.1), lz: shop.lz + 0.4 };
    root.position.set(home.lx, 0, home.lz);
    const steps = job.steps.map((s, idx) => ({
      mode: s[0] === 'sit' ? 'sit' : s[0] === 'punch' ? 'punch' : s[0] === 'pickup' ? 'pickup' : s[0] === 'carry' ? 'carry' : s[0] === 'wait' ? 'idle' : 'walk',
      dur: s[1],
      to: {
        lx: shop.lx + Math.cos(idx + i) * 1.4,
        lz: shop.lz + Math.sin(idx * 1.3) * 1.1,
      },
    }));
    return { root, visual, steps, i: 0, t: Math.random(), from: { ...home }, home, forever: steps.length === 1 && steps[0].mode === 'sit' };
  }

  function figureFor(model) {
    if (model.startsWith('Chef')) return 'koch';
    if (model.startsWith('Doctor')) return 'arzt';
    if (model === 'Suit_Male') return 'buero';
    if (model.includes('Female') && model.includes('Worker')) return 'lager';
    return 'mechanik';
  }

  function stand(obj) {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    box.getSize(size);
    obj.scale.setScalar(1.7 / (size.y || 1));
    obj.updateMatrixWorld(true);
    const fitted = new THREE.Box3().setFromObject(obj);
    obj.position.y -= fitted.min.y;
  }

  function spawnFill(zone, budget, preset) {
    if (zone === 2) {
      const sit = Math.min(budget, preset.npcs > 1 ? 3 : 2);
      for (let i = 0; i < sit; i++) npcs.push(fillActor('Casual_Male', '#7CC242', 14 + i * 1.6, 7.4, 'sit', true));
      if (budget - sit > 0) npcs.push(fillActor('Casual_Female', '#F7931E', 17, 6.2, 'walk', false));
    }
    if (zone === 4) {
      const n = Math.min(budget, preset.fill > 0.8 ? 4 : 2);
      for (let i = 0; i < n; i++) {
        npcs.push(fillActor(i % 2 ? 'Casual_Female' : 'Suit_Male', i % 2 ? '#FFD23F' : '#1F5FD6', 24 + i * 1.4, 8.6, i < 2 ? 'idle' : 'walk', i < 2));
      }
    }
  }

  function fillActor(model, tint, x, z, mode, forever) {
    const root = new THREE.Group();
    const visual = createPlayerVisual({ id: model + x, figure: figureFor(model), color: tint, name: '' }, catalog, loader);
    if (chars && chars[model]) {
      const cloned = cloneSkinned(chars[model].scene);
      stand(cloned);
      cloned.rotation.y = Math.PI;
      paintCharacter(cloned, tint);
      visual.tilt.add(cloned);
      visual.model = cloned;
      visual.mixer = new THREE.AnimationMixer(cloned);
      visual.clips = {};
      for (const clip of chars[model].animations || []) visual.clips[clip.name.toLowerCase()] = clip;
      visual.placeholder.visible = false;
    } else visual.placeholder.visible = true;
    root.add(visual.root);
    root.position.set(x, 0, z);
    return {
      root, visual, forever,
      steps: [{ mode, dur: forever ? 99 : 2.4, to: { lx: x + 2.2, lz: z } }],
      i: 0, t: 0, from: { lx: x, lz: z }, home: { lx: x, lz: z },
    };
  }

  function stepNpcs(dt, now) {
    const content = contentOf(active);
    const train = content.userData.train;
    if (train) {
      const u = (Math.sin(now / 1000 * 0.35) + 1) / 2;
      train.position.x = 18 + u * 8;
    }
    for (const n of npcs) {
      const step = n.steps[n.i];
      n.t += dt;
      if (!n.forever && (step.mode === 'walk' || step.mode === 'carry')) {
        const dur = step.dur || 1.2;
        const u = Math.min(1, n.t / dur);
        n.root.position.set(
          n.from.lx + (step.to.lx - n.from.lx) * u,
          0,
          n.from.lz + (step.to.lz - n.from.lz) * u,
        );
        if (u >= 1) advanceNpc(n);
      } else if (!n.forever && n.t > (step.dur || 1)) {
        advanceNpc(n);
      }
      updateVisual(n.visual, step.mode === 'walk' ? 'walk' : step.mode, now / 1000, n.forever ? 0 : dt, catalog);
      if (n.forever && n.visual.mixer) n.visual.mixer.timeScale = n.t > 1.2 ? 0 : 1;
    }
  }

  function advanceNpc(n) {
    n.i = (n.i + 1) % n.steps.length;
    n.t = 0;
    n.from = { lx: n.root.position.x, lz: n.root.position.z };
  }

  function damp(a, b, dt) {
    const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
    return a + d * (1 - Math.exp(-dt * 6));
  }

  function hud() {
    const pawn = followPawn();
    const f = pawn ? localPoint(pawn.index) : null;
    const shop = f && f.building && layout.buildings.find(b => b.id === f.building);
    if (opts.onHud) {
      opts.onHud({
        title: flip ? 'Umblättern' : (ZONE_NAME[active] || 'Stadt'),
        sub: f ? `${f.label} · ${TYPE_DE[f.type3d] || ''}${shop ? ' · ' + shop.name : ''}${pawn.mode === 'cell' ? ' · Zelle' : ''}` : 'Warte auf die Runde',
      });
    }
  }

  function resize() {
    const w = canvas.clientWidth || 1280;
    const h = canvas.clientHeight || 720;
    const dpr = Math.min(DPR_CAP, (PRESETS[tier].dpr || 1) * (window.devicePixelRatio || 1));
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  function applyTier() {
    for (const z of [1, 2, 3, 4]) applyDecor(pages[z], PRESETS[tier].decor);
    refreshNpcs();
    resize();
  }

  function noteFps(now) {
    fpsFrames += 1;
    const span = now - fpsStamp;
    if (span < 500) return;
    fps = (fpsFrames * 1000) / span;
    fpsFrames = 0;
    fpsStamp = now;
    if (qualityMode === 'auto' && now - startedAt > 1600) {
      if (fps < 30) lowSince += span / 1000; else lowSince = 0;
      if (fps < 18) badSince += span / 1000; else badSince = 0;
      if (tier === 'hoch' && lowSince > 1.2) { tier = 'mittel'; lowSince = 0; applyTier(); }
      else if (tier === 'mittel' && lowSince > 1.2) { tier = 'niedrig'; lowSince = 0; applyTier(); }
      else if (tier === 'niedrig' && badSince > 2.5) fallback('Die 3D-Stadt ist auf diesem Gerät zu langsam. Es wird das 2D-Brett gezeigt.');
    }
    if (opts.onFps) opts.onFps({ fps, tier, label: `${Math.round(fps)} FPS · ${tierName(tier)}${qualityMode === 'auto' ? ' (automatisch)' : ''}` });
  }

  function fallback(msg) {
    if (fallen) return;
    fallen = true;
    running = false;
    cancelAnimationFrame(raf);
    if (opts.onFallback) opts.onFallback(msg);
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    try {
      stepFlip(dt);
      stepPlayers(dt, now);
      noteSlides();
      stepNpcs(dt, now);
      stepPins();
      stepCamera(dt);
      hud();
      renderer.render(scene, camera);
      canvas.dataset.pins = String(pins.filter(p => p.visible).length);
      canvas.dataset.calls = String(renderer.info.render.calls);
      canvas.dataset.tris = String(renderer.info.render.triangles);
      noteFps(now);
    } catch (err) {
      console.error(err);
      fallback('Die 3D-Ansicht hat einen Fehler. Es wird das 2D-Brett gezeigt.');
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  function rebuild(next) {
    layout = buildLayout((next && next.fields) || []);
    for (const z of [1, 2, 3, 4]) {
      scene.remove(pages[z]);
      pages[z] = buildZone(layout, z);
      scene.add(pages[z]);
    }
    showOnly(active);
    applyTier();
  }

  return {
    update(s) {
      state = s || state;
      syncPlayers();
      if (!running) {
        stepPlayers(0.016, performance.now());
        stepPins();
        stepCamera(1);
        hud();
      }
    },
    start() {
      fallen = false;
      startedAt = performance.now();
      if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
      resize();
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    setQuality(mode) {
      qualityMode = mode || 'auto';
      tier = qualityMode === 'auto' ? startTier() : (PRESETS[qualityMode] ? qualityMode : 'mittel');
      lowSince = 0;
      badSince = 0;
      startedAt = performance.now();
      applyTier();
    },
    setBoard(next) { rebuild(next); },
    stats() {
      return {
        fps: Math.round(fps),
        tier,
        dpr: renderer.getPixelRatio(),
        shadows: 0,
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        zone: active,
      };
    },
  };
}

function loadChars(loader) {
  return Promise.all(Object.entries(CHAR_FILES).map(async ([id, url]) => {
    const gltf = await loader.loadAsync(url);
    return [id, gltf];
  })).then(list => Object.fromEntries(list));
}
