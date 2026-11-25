// 3D-Flipchart. Nur die Zone des aktiven Spielers wird gezeichnet.
// Spiellogik bleibt auf dem Server, hier ist nur die Darstellung.
import * as THREE from 'three';
import {
  buildLayout, TILE_Y, zoneOf, ZONE_NAME, PAGE,
} from './layout.js';
import { buildZone, applyDecor } from './zonebuild.js';
import { loadCityLib } from './assets.js';
import {
  createPlayerVisual, updateVisual, createLoader, makeNameSprite, setCuffs,
} from './figures.js';

const PRESETS = {
  niedrig: { dpr: 0.75, npcs: 1, fill: 0.35, decor: 0.4, puffs: 0 },
  mittel: { dpr: 1, npcs: 2, fill: 1, decor: 1, puffs: 4 },
  hoch: { dpr: 1.25, npcs: 3, fill: 1, decor: 1, puffs: 8 },
};
const DPR_CAP = 1.25;
const FIG_SCALE = 1.35;
const Y180 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

const TYPE_DE = {
  start: 'Start', ziel: 'Ziel', normal: 'Weg', aktion: 'Aktion',
  frage: 'Frage', rutsche: 'Rutsche', finanzpolizei: 'Finanzpolizei',
};

const SHOP_JOBS = {
  schlosserei: [
    { fig: 'NPC_Schlosser', clip: 'Hammer', prop: 'Prop_Hammer', socket: 'Socket_Hand_R', at: 'Station_Amboss', vfx: 'spark' },
    { fig: 'NPC_Schlosser', clip: 'Weld', prop: 'Prop_Schweissbrenner', socket: 'Socket_Hand_R', at: 'Station_Werkbank', vfx: 'spark' },
  ],
  kueche: [
    { fig: 'NPC_Koch', clip: 'Stir', prop: 'Prop_Kochloeffel', socket: 'Socket_Hand_R', at: 'Station_Herd', vfx: 'steam' },
    { fig: 'NPC_Koch', clip: 'Chop', prop: 'Prop_Messer', socket: 'Socket_Hand_R', at: 'Station_Brett' },
  ],
  labor: [
    { fig: 'NPC_Laborantin', clip: 'Pipette', prop: 'Prop_Pipette', socket: 'Socket_Hand_R', at: 'Station_Tisch', vfx: 'steam' },
    { fig: 'NPC_Laborantin', clip: 'Examine', prop: 'Prop_Reagenzglas', socket: 'Socket_Hand_L', at: 'Station_Geraet' },
  ],
  lager: [
    { fig: 'NPC_Lagerist', clip: 'CarryIdle', prop: 'Prop_Kiste', socket: 'DEF-spine003', at: 'Station_Kiste' },
    { fig: 'NPC_Lagerist', clip: 'Clipboard', prop: 'Prop_Klemmbrett', socket: 'Socket_Hand_L', at: 'Station_Palette' },
  ],
  buero: [
    { fig: 'NPC_Buero', clip: 'Type', at: 'Station_Schreibtisch_Sitz' },
    { fig: 'NPC_Buero', clip: 'SitIdle', at: 'Station_Schreibtisch2_Sitz' },
  ],
  friseur: [
    { fig: 'NPC_Friseurin', clip: 'Haircut', prop: 'Prop_Schere', socket: 'Socket_Hand_R', at: 'Station_Stylist_1' },
    { fig: 'NPC_Passantin_Kleid', clip: 'SitIdle', at: 'Kunde_Sitz_1' },
  ],
  baustelle: [
    { fig: 'NPC_Bauarbeiter', clip: 'Hammer', prop: 'Prop_Hammer', socket: 'Socket_Hand_R', at: 'Station_Geruest', vfx: 'spark' },
    { fig: 'NPC_Bauarbeiter', clip: 'CarryIdle', at: 'Station_Balken_Auf' },
  ],
  krankenhaus: [
    { fig: 'NPC_Aerztin', clip: 'Examine', at: 'Station_Tresen' },
    { fig: 'NPC_Passant_Senior', clip: 'LieIdle', at: 'Patient_1' },
    { fig: 'NPC_Pfleger', clip: 'CarryIdle', prop: 'Prop_Tablett', socket: 'DEF-spine003', at: 'Station_Schrank' },
  ],
  autowerkstatt: [
    { fig: 'NPC_Mechanikerin', clip: 'KneelFix', prop: 'Prop_Schraubenschluessel', socket: 'Socket_Hand_R', at: 'Station_Haube', vfx: 'spark' },
    { fig: 'NPC_Mechanikerin', clip: 'CarryIdle', at: 'Station_Reifenstapel' },
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
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0xe4f1fa, 1);
  renderer.shadowMap.enabled = false;
  const scene = new THREE.Scene();
  scene.background = skyTexture();
  scene.fog = new THREE.Fog(0xf7f1e3, 70, 150);
  scene.add(new THREE.HemisphereLight(0xe4f1fa, 0x8fcf5a, 0.9));
  const sun = new THREE.DirectionalLight(0xfff4e4, 2.2);
  sun.position.set(-12, 18, 14);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xfff1d6, 0);
  fill.position.set(-12, 14, 18);
  scene.add(fill);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.12, 180);

  let layout = buildLayout(board.fields || []);
  const pages = {};
  function blankPage(z) {
    const pivot = new THREE.Group();
    const content = new THREE.Group();
    pivot.position.set(PAGE.w / 2, 0, PAGE.d);
    content.position.set(-PAGE.w / 2, 0, -PAGE.d);
    pivot.add(content);
    pivot.userData.zone = z;
    pivot.userData.content = content;
    return pivot;
  }
  for (const z of [1, 2, 3, 4]) {
    pages[z] = blankPage(z);
    scene.add(pages[z]);
  }

  const players = new Map();
  const pins = [];
  const npcs = [];
  let lib = null;
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
  let shot = null;
  const loader = createLoader();
  const catalog = { scaleToHeight: 1.58, clips: { idle: ['idle'], walk: ['walk'], sit: ['sitidle'], cheer: ['victory'] } };
  const camPos = new THREE.Vector3(8, 16, 22);
  const lookPos = new THREE.Vector3(PAGE.w / 2, 0, PAGE.d / 2);
  const _desired = new THREE.Vector3();
  const _look = new THREE.Vector3();
  const _wp = new THREE.Vector3();

  const ready = loadCityLib().then((loaded) => {
    lib = loaded;
    rebuild({ fields: board.fields || [] });
    for (const p of players.values()) dress(p);
    refreshNpcs();
    return loaded;
  }).catch((err) => { console.warn(err); throw err; });

  showOnly(1);
  applyTier();

  function contentOf(z) { return pages[z].userData.content; }

  function showOnly(z) {
    const changed = active !== z;
    for (const k of [1, 2, 3, 4]) pages[k].visible = k === z;
    active = z;
    if (changed || !npcs.length) refreshNpcs();
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
    if (!lib) return;
    const player = { id: pawn.id, figure: pawn.figure, color: pawn.color || '#E6197E', name: '' };
    lib.equip(pawn.visual, player, { outline: tier === 'niedrig' ? 0 : 0.016, scale: FIG_SCALE, lod: tier === 'hoch' ? 0 : 1 });
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
    const car = carOf(f.zone);
    pawn.carFrom = car ? car.position.clone() : null;
    parentTo(pawn, f.zone);
  }

  function beginRelease(pawn) {
    pawn.mode = 'release';
    pawn.phaseT = 0;
    pawn.phase = 'out';
    showCuffs(pawn, false);
    const car = carOf(zoneOf(pawn.target));
    pawn.carFrom = car ? car.position.clone() : null;
  }

  function carOf(zone) {
    const content = contentOf(zone);
    return content ? content.userData.policeCar : null;
  }

  function showCuffs(pawn, on) {
    if (pawn.visual && pawn.visual.placeholder) setCuffs(pawn.visual.placeholder, on);
    const model = pawn.visual && pawn.visual.figureRoot;
    if (lib && model && !model.userData.cuffs) {
      model.userData.cuffs = lib.attachProp(model, 'Prop_Handschellen', 'Socket_Hand_R');
      if (model.userData.cuffs) model.userData.cuffs.visible = false;
    }
    if (model && model.userData.cuffs) model.userData.cuffs.visible = !!on;
  }

  function driveCar(car, from, to, u) {
    if (!car || !from) return;
    car.position.x = from.x + (to.x - from.x) * u;
    car.position.z = from.z + (to.z - from.z) * u;
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    if (dx * dx + dz * dz > 0.04) car.rotation.y = Math.atan2(dx, dz);
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
      const poseMode = pawn.mode === 'cell' ? 'prisonersit'
        : pawn.mode === 'arrest' && pawn.phaseT >= 2.3 && pawn.phaseT < 6.1 ? 'prisonerwalk'
        : pawn.mode === 'arrest' && pawn.phaseT >= 1.4 ? 'prisoneridle'
        : (pawn.hop || pawn.mode === 'release') ? 'walk' : 'idle';
      updateVisual(pawn.visual, poseMode, now / 1000, dt, catalog);
      stepOfficer(pawn, poseMode, dt);
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
    pawn.yaw = damp(pawn.yaw, Math.atan2(pawn.face.x / len, pawn.face.y / len), dt);
  }

  function startHop(pawn, from, to, slide) {
    pawn.hop = { from, to, t0: performance.now(), dur: slide ? 90 : Math.max(90, state && state.stepMs || 260), slide };
    parentTo(pawn, zoneOf(to));
  }

  function stepArrest(pawn, dt) {
    pawn.phaseT += dt;
    const f = localPoint(pawn.arrestField == null ? pawn.index : pawn.arrestField);
    const jail = pawn.jail || jailFor(f.zone);
    const door = jail ? { lx: jail.lx, lz: jail.lz - 1.9 } : { lx: f.lx, lz: f.lz };
    const seat = pawn.slotPos || door;
    const car = carOf(f.zone);
    const home = pawn.carFrom || (car && car.userData.home) || { x: door.lx, z: door.lz };
    const beside = { x: f.lx + 1.45, z: f.lz + 0.15 };
    const cellPark = { x: (jail ? jail.lx : door.lx) + 2.3, z: (jail ? jail.lz : door.lz) + 1.5 };
    const t = pawn.phaseT;
    if (t < 1.4) {
      driveCar(car, home, beside, t / 1.4);
      pawn.pos.set(f.lx, TILE_Y, f.lz);
    } else if (t < 2.4) {
      driveCar(car, home, beside, 1);
      pawn.pos.set(f.lx, TILE_Y, f.lz);
      showCuffs(pawn, true);
    } else if (t < 4.9) {
      const u = (t - 2.4) / 2.5;
      driveCar(car, beside, cellPark, u);
      if (car) pawn.pos.set(car.position.x - 0.95, TILE_Y, car.position.z + 0.15);
      else pawn.pos.set(f.lx + (door.lx - f.lx) * u, TILE_Y, f.lz + (door.lz - f.lz) * u);
      showCuffs(pawn, true);
    } else if (t < 6.1) {
      const u = (t - 4.9) / 1.2;
      driveCar(car, beside, cellPark, 1);
      pawn.pos.set(door.lx + (seat.lx - door.lx) * u, TILE_Y, door.lz + (seat.lz - door.lz) * u);
      showCuffs(pawn, true);
    } else {
      pawn.mode = 'cell';
      pawn.pos.set(seat.lx, TILE_Y, seat.lz);
      showCuffs(pawn, true);
      if (car && car.userData.home) {
        car.position.copy(car.userData.home);
        car.rotation.y = 0;
      }
    }
    pawn.face.set((door.lx - pawn.pos.x) || 0.01, (door.lz - pawn.pos.z) || 0);
    pawn.yaw = Math.atan2(pawn.face.x, pawn.face.y);
    const doorMesh = contentOf(f.zone).userData.cellDoor;
    if (doorMesh) {
      const open = t > 4.6 && t < 6.4 ? Math.min(1, (t - 4.6) / 0.4) : (t >= 6.4 ? 0 : 0);
      doorMesh.rotation.y = -1.75 * (t >= 6.2 ? Math.max(0, 1 - (t - 6.2) / 0.4) : open);
    }
    parentTo(pawn, f.zone);
  }

  function stepOfficer(pawn, poseMode, dt) {
    if (!lib) return;
    const escort = poseMode === 'prisoneridle' || poseMode === 'prisonerwalk';
    if (escort && !pawn.officer) {
      pawn.officer = lib.spawn('NPC_Polizist', { lod: 1, outline: tier === 'niedrig' ? 0 : 0.014, scale: FIG_SCALE });
      pawn.officer.root.scale.setScalar(1);
      contentOf(pawn.zone || active).add(pawn.officer.root);
    }
    if (!pawn.officer) return;
    if (!escort) {
      pawn.officer.root.removeFromParent();
      pawn.officer = null;
      return;
    }
    const lead = 0.35 * FIG_SCALE;
    const dir = pawn.face.lengthSq() ? pawn.face.clone().normalize() : new THREE.Vector2(0, 1);
    pawn.officer.root.position.set(pawn.pos.x - dir.x * lead, pawn.pos.y, pawn.pos.z - dir.y * lead);
    pawn.officer.root.rotation.y = pawn.yaw;
    const clip = poseMode === 'prisonerwalk' ? 'Lead' : 'Cuff';
    if (pawn.officer.mixer && pawn.officer.clip !== clip) {
      pawn.officer.clip = clip;
      pawn.officer.play(clip, { loop: clip === 'Lead' });
    }
    if (pawn.officer.mixer) pawn.officer.mixer.update(dt || 0);
    if (pawn.officer.parentZone !== pawn.zone) {
      contentOf(pawn.zone).add(pawn.officer.root);
      pawn.officer.parentZone = pawn.zone;
    }
  }

  function stepRelease(pawn, dt) {
    pawn.phaseT += dt;
    const back = localPoint(pawn.target);
    const from = pawn.slotPos || { lx: pawn.pos.x, lz: pawn.pos.z };
    const u = Math.min(1, pawn.phaseT / 1.8);
    pawn.pos.set(from.lx + (back.lx - from.lx) * u, TILE_Y, from.lz + (back.lz - from.lz) * u);
    const car = carOf(back.zone);
    if (car && pawn.carFrom && car.userData.home) driveCar(car, pawn.carFrom, car.userData.home, u);
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

  function applyShot() {
    if (shot === 'kueche') {
      const b = layout.buildings.find(x => x.id === 'kueche');
      const along = !b || b.alongX !== false;
      const door = along ? b.length / 2 + 4.2 : b.depth / 2 + 4.2;
      _desired.set(b.lx + (along ? door : 1.6), 5.2, b.lz + (along ? 4.8 : door));
      _look.set(b.lx - (along ? 0.4 : 0), 1.15, b.lz);
    } else if (shot === 'festnahme') {
      const f = layout.points.find(p => p.zone === 2 && p.type3d === 'finanzpolizei') || layout.points.find(p => p.zone === 2);
      _desired.set(f.lx + 2.4, 4.4, f.lz + 6.2);
      _look.set(f.lx + 0.3, 1.05, f.lz + 0.2);
    } else if (shot === 'park') {
      const p = contentOf(2).userData.park || { x: 20, z: 6.2 };
      _desired.set(p.x - 1, 8.2, p.z + 11);
      _look.set(p.x, 1.1, p.z);
    } else if (shot === 'bahnhof') {
      const p = contentOf(4).userData.station || { x: 18, z: 4.2 };
      _desired.set(p.x - 2, 6.4, p.z + 12);
      _look.set(p.x + 2, 1.4, p.z + 1);
    } else {
      _desired.set(16, 20, 44);
      _look.set(26, 0.6, 15);
    }
  }

  function poseArrestStill() {
    const f = layout.points.find(p => p.zone === 2 && p.type3d === 'finanzpolizei') || layout.points.find(p => p.zone === 2);
    const content = contentOf(2);
    const car = content.userData.policeCar;
    if (car && f) {
      car.position.set(f.lx + 2.3, 0, f.lz - 1.5);
      car.rotation.y = Math.PI * 0.5;
    }
    if (!f || !lib || content.userData.demoMixers) return;
    const player = lib.spawn('Spieler_A', { lod: 0, color: '#E6197E', outline: 0.016, scale: FIG_SCALE });
    player.root.position.set(f.lx, TILE_Y, f.lz);
    player.root.rotation.y = 0;
    const cop = lib.spawn('NPC_Polizist', { lod: 1, outline: 0.016, scale: FIG_SCALE });
    cop.root.position.set(f.lx, TILE_Y, f.lz + 0.62);
    cop.root.rotation.y = Math.PI;
    content.add(player.root, cop.root);
    content.userData.demoMixers = [player, cop];
    player.ready.then(() => {
      player.play('PrisonerIdle');
      if (player.mixer) player.mixer.update(0.8);
      const cuffs = lib.attachProp(player.model, 'Prop_Handschellen', 'Socket_Hand_R');
      if (cuffs) cuffs.visible = true;
    });
    cop.ready.then(() => {
      cop.play('Cuff');
      if (cop.mixer) cop.mixer.update(0.62);
    });
  }

  function placeBlobs() {
    const mesh = ensureBlobs();
    const content = contentOf(active);
    if (mesh.parent !== content) content.add(mesh);
    let i = 0;
    const put = (x, y, z, s) => {
      if (i >= mesh.instanceMatrix.count) return;
      blobDummy.position.set(x, y, z);
      blobDummy.scale.setScalar(s);
      blobDummy.rotation.set(0, 0, 0);
      blobDummy.updateMatrix();
      mesh.setMatrixAt(i++, blobDummy.matrix);
    };
    for (const pawn of players.values()) if (pawn.visual.root.visible) put(pawn.pos.x, 0.34, pawn.pos.z, 1);
    for (const n of npcs) put(n.root.position.x, 0.08, n.root.position.z, 0.85);
    const demo = content.userData.demo;
    if (demo) put(demo.position.x, 0.34, demo.position.z, 1);
    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
  }

  function stepCamera(dt) {
    if (shot) {
      applyShot();
      camPos.copy(_desired);
      lookPos.copy(_look);
      camera.position.copy(camPos);
      camera.lookAt(lookPos);
      return;
    }
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
    if (!lib) return;
    const preset = PRESETS[tier];
    const content = contentOf(active);
    content.updateWorldMatrix(true, true);
    const shops = (content.userData.shops || []);
    let budget = 14 - Math.min(4, players.size);
    for (const shop of shops) {
      const jobs = SHOP_JOBS[shop.id] || [];
      const count = Math.min(jobs.length, preset.npcs, budget);
      for (let i = 0; i < count; i++) {
        budget--;
        const actor = makeNpc(jobs[i], shop, content);
        if (actor) npcs.push(actor);
      }
    }
    if (preset.fill > 0.5 && budget > 0) spawnFill(content, budget, preset);
    for (const n of npcs) content.add(n.root);
  }

  function spotOf(root, name, content) {
    const e = root && root.getObjectByName(name);
    if (!e) return null;
    root.updateWorldMatrix(true, true);
    const v = new THREE.Vector3();
    const q = new THREE.Quaternion();
    e.getWorldPosition(v);
    e.getWorldQuaternion(q);
    content.worldToLocal(v);
    return { x: v.x, y: v.y, z: v.z, q };
  }

  function makeNpc(job, shop, content) {
    const spot = spotOf(shop.root, job.at, content);
    if (!spot) return null;
    const spawned = lib.spawn(job.fig, { lod: 1, outline: tier === 'niedrig' ? 0 : 0.014, scale: FIG_SCALE });
    const seat = /Sitz|Patient|Warten|Bett/.test(job.at) || spot.y > 0.35;
    const drop = job.clip === 'LieIdle' ? 0.14 : 0.2;
    spawned.root.position.set(spot.x, seat ? Math.max(0, spot.y - drop * FIG_SCALE) : Math.max(0.04, spot.y), spot.z);
    spawned.root.quaternion.copy(spot.q).multiply(Y180);
    spawned.ready.then(() => {
      if (job.prop) lib.attachProp(spawned.model, job.prop, job.socket || 'Socket_Hand_R');
      spawned.play(job.clip, { loop: job.clip === 'KneelFix' });
    });
    return { root: spawned.root, spawned, clip: job.clip, vfx: job.vfx || null, loop: null };
  }

  function spawnFill(content, budget, preset) {
    const park = content.userData.parkRoot;
    if (park && budget > 0) {
      const names = ['NPC_Passant_Hoodie', 'NPC_Passantin_Pulli', 'NPC_Passant_Senior'];
      const seats = ['Sitz_1', 'Sitz_3', 'Sitz_5'].slice(0, Math.min(budget, preset.npcs > 1 ? 3 : 1));
      for (let i = 0; i < seats.length; i++) {
        const actor = makeNpc({ fig: names[i], clip: 'SitIdle', at: seats[i] }, { root: park }, content);
        if (actor) { npcs.push(actor); budget--; }
      }
      const walk = [];
      for (let i = 0; i < 12; i++) {
        const s = spotOf(park, 'Spazierweg_' + String(i).padStart(2, '0'), content);
        if (s) walk.push(s);
      }
      if (walk.length && budget > 0) {
        const spawned = lib.spawn('NPC_Passantin_Kleid', { lod: 1, outline: tier === 'niedrig' ? 0 : 0.014, scale: FIG_SCALE });
        spawned.root.position.set(walk[0].x, TILE_Y, walk[0].z);
        spawned.ready.then(() => spawned.play('Walk'));
        npcs.push({ root: spawned.root, spawned, clip: 'Walk', vfx: null, loop: walk, li: 0, lt: 0 });
        budget--;
      }
    }
    const station = content.userData.stationRoot;
    if (station && budget > 0) {
      const wait = ['Warten_1', 'Warten_2'].slice(0, Math.min(2, budget));
      for (let i = 0; i < wait.length; i++) {
        const actor = makeNpc({
          fig: i ? 'NPC_Reisende_Business' : 'NPC_Reisender_Rucksack',
          clip: 'SitIdle',
          at: wait[i],
          prop: i ? 'Prop_Koffer' : null,
          socket: 'Socket_Hand_R',
        }, { root: station }, content);
        if (actor) { npcs.push(actor); budget--; }
      }
    }
    const guard = content.userData.guardAt && content.userData.cell;
    if (guard && budget > 0) {
      const actor = makeNpc({ fig: 'NPC_Polizistin', clip: 'Idle', at: 'Polizist_Idle' }, { root: content.userData.cell }, content);
      if (actor) npcs.push(actor);
    }
  }

  function stepNpcs(dt, now) {
    const content = contentOf(active);
    if (content.userData.tick) content.userData.tick(now / 1000);
    for (const n of npcs) {
      if (n.loop && n.loop.length) {
        const a = n.loop[n.li];
        const b = n.loop[(n.li + 1) % n.loop.length];
        const dist = Math.hypot(b.x - a.x, b.z - a.z) || 0.001;
        n.lt += dt * (0.45 * FIG_SCALE) / dist;
        if (n.lt >= 1) { n.lt = 0; n.li = (n.li + 1) % n.loop.length; }
        n.root.position.set(a.x + (b.x - a.x) * n.lt, TILE_Y, a.z + (b.z - a.z) * n.lt);
        n.root.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      }
      if (n.spawned && n.spawned.mixer) n.spawned.mixer.update(dt);
      if (n.vfx && PRESETS[tier].puffs) emitMote(content, n.vfx, n.root.position.x, 1.2, n.root.position.z);
    }
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
    if (lib) for (const z of [1, 2, 3, 4]) lib.setOutlines(pages[z], tier !== 'niedrig');
    fill.intensity = tier === 'hoch' ? 0.28 : 0;
    liveTier = tier;
    for (const p of players.values()) dress(p);
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
      const demo = contentOf(active).userData.demoMixers;
      if (demo) for (const d of demo) if (d.mixer) d.mixer.update(dt);
      stepMotes(dt);
      placeBlobs();
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
      pages[z] = lib ? buildZone(layout, z, lib) : blankPage(z);
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
    ready,
    stats() {
      return {
        fps: Math.round(fps),
        tier,
        dpr: renderer.getPixelRatio(),
        shadows: 0,
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        zone: active,
        slides: layout.slides.map(s => s.field + '→' + s.to).join(' '),
        fp: layout.prisons.map(j => 'Z' + j.zone + ':' + j.fields.join('+')).join(' '),
      };
    },
    frameShot(kind) {
      shot = kind || 'uebersicht';
      const zone = { uebersicht: 1, kueche: 1, festnahme: 2, park: 2, bahnhof: 4 }[shot] || 1;
      if (!flip) showOnly(zone);
      if (shot === 'festnahme') poseArrestStill();
    if (shot === 'bahnhof') {
      const content = contentOf(4);
      content.userData.holdTrain = true;
      if (content.userData.train) content.userData.train.position.x = 0;
    }
      stepCamera(1);
      renderer.render(scene, camera);
      let skinned = 0;
      contentOf(active).traverse((o) => { if (o.isSkinnedMesh) skinned++; });
      return {
        fps: Math.round(fps),
        tier,
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        npcs: npcs.length,
        skinned,
        zone: active,
        slides: layout.slides.map(s => s.field + '→' + s.to).join(' '),
        fp: layout.prisons.map(j => 'Z' + j.zone + ':' + j.fields.join('+')).join(' '),
      };
    },
  };
}

const motes = [];
let blobs = null;
const blobDummy = new THREE.Object3D();
let liveTier = 'mittel';

function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#d7ebf8');
  grd.addColorStop(0.45, '#e7f3fb');
  grd.addColorStop(1, '#f7f1e3');
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(120, 168, 196, 0.28)';
  g.lineWidth = 2;
  for (let i = -40; i < 560; i += 11) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + 70, 230);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function moteTexture(kind) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  if (kind === 'spark') {
    grd.addColorStop(0, 'rgba(255,244,190,1)');
    grd.addColorStop(0.45, 'rgba(255,140,40,0.95)');
    grd.addColorStop(1, 'rgba(255,90,20,0)');
  } else {
    grd.addColorStop(0, 'rgba(255,255,255,0.9)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
  }
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let sparkTex = null;
let steamTex = null;

function emitMote(parent, kind, x, y, z) {
  const cap = (PRESETS[tierNameLive()] || PRESETS.mittel).puffs || 4;
  if (!cap) return;
  if (Math.random() > 0.45) return;
  let m = motes.find(q => !q.alive);
  if (!m && motes.length >= cap) return;
  if (!sparkTex) sparkTex = moteTexture('spark');
  if (!steamTex) steamTex = moteTexture('steam');
  if (!m) {
    const mat = new THREE.SpriteMaterial({ map: kind === 'spark' ? sparkTex : steamTex, transparent: true, depthWrite: false });
    const s = new THREE.Sprite(mat);
    m = { s, alive: false, kind };
    motes.push(m);
  }
  m.kind = kind;
  m.s.material.map = kind === 'spark' ? sparkTex : steamTex;
  m.s.material.opacity = 1;
  if (m.s.parent !== parent) parent.add(m.s);
  m.alive = true;
  m.life = kind === 'spark' ? 0.45 : 0.8;
  m.max = m.life;
  m.s.visible = true;
  m.s.position.set(x + (Math.random() - 0.5) * 0.2, y, z + (Math.random() - 0.5) * 0.2);
  m.vx = (Math.random() - 0.5) * (kind === 'spark' ? 0.8 : 0.15);
  m.vy = kind === 'spark' ? 1.1 + Math.random() * 0.6 : 0.35 + Math.random() * 0.2;
  m.vz = (Math.random() - 0.5) * 0.4;
}

function tierNameLive() {
  return typeof liveTier === 'string' ? liveTier : 'mittel';
}

function stepMotes(dt) {
  for (const m of motes) {
    if (!m.alive) continue;
    m.life -= dt;
    if (m.life <= 0) {
      m.alive = false;
      m.s.visible = false;
      continue;
    }
    m.s.position.x += m.vx * dt;
    m.s.position.y += m.vy * dt;
    m.s.position.z += m.vz * dt;
    const k = Math.max(0, m.life / m.max);
    const base = m.kind === 'spark' ? 0.22 : 0.42;
    m.s.scale.setScalar(base * (0.5 + k));
    m.s.material.opacity = k;
  }
}

function ensureBlobs() {
  if (!blobs) {
    const geo = new THREE.CircleGeometry(0.46, 12);
    geo.rotateX(-Math.PI / 2);
    blobs = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: '#24331c', transparent: true, opacity: 0.3, depthWrite: false }), 24);
    blobs.frustumCulled = false;
    blobs.count = 0;
    blobs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }
  return blobs;
}

