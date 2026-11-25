// 3D-Stadt auf der Beamer-Seite. Spiellogik bleibt auf dem Server;
// hier wird nur der öffentliche Spielstand gezeigt.
//
// Zielhardware: Kurslaptop mit AMD Ryzen 5 7530U (Radeon-Vega, 7 CUs),
// 16 GB RAM, Beamer 1080p. „Mittel“ ist dafür ausgelegt (30+ FPS):
// eine Schattenkarte 1024 mit leichtem PCF, instanzierte Passanten
// und Deko, pixelRatio höchstens 1 (Hoch höchstens 1.25).

import * as THREE from 'three';
import { buildLayout, TILE_Y, yawFacing, kartenStimmung } from './layout.js';
import { buildCity, stepPeds } from './scenery.js';
import { loadWorldAssets, dressWorld, stepCrowd } from './assets.js';
import {
  createPlayerVisual, updateVisual, setCuffs, createLoader, makeNameSprite, makeTextPlane, pose, equipFromLibrary,
} from './figures.js';

// dpr ist die Obergrenze vor devicePixelRatio. Schatten 0 = aus, sonst Kantenlänge der Karte.
// decor: Anteil der instanzierten Bäume, Häuser und Laternen.
const PRESETS = {
  niedrig: { dpr: 0.75, peds: 8, npcs: 1, shadows: 0, decor: 0.5, shadowRadius: 0 },
  mittel: { dpr: 1, peds: 14, npcs: 2, shadows: 1024, decor: 1, shadowRadius: 1.5 },
  hoch: { dpr: 1.25, peds: 18, npcs: 2, shadows: 1024, decor: 1, shadowRadius: 2 },
};
const DPR_CAP = 1.25;

const TYPE_DE = {
  start: 'Start', ziel: 'Ziel', normal: 'Weg', aktion: 'Aktion',
  frage: 'Frage', rutsche: 'Rutsche', finanzpolizei: 'Finanzpolizei',
};

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _look = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _camLook = new THREE.Vector3();

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch (e) {
    return false;
  }
}

export function mountCity(canvas, board, opts = {}) {
  if (!webglAvailable()) throw new Error('WebGL2 fehlt');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.setClearColor(0x8ec8ee, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = skyGradient();
  scene.fog = new THREE.Fog(0xf3e2c4, 38, 168);
  const hemi = new THREE.HemisphereLight(0xfff4dd, 0x6fbf62, 0.95);
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.25);
  sun.position.set(30, 48, 18);
  sun.target.position.set(0, 0, 0);
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.001;
  sun.shadow.normalBias = 0.04;
  sun.shadow.radius = 1.5;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  scene.add(hemi, sun, sun.target);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.15, 480);
  const loader = createLoader();
  let catalog = emptyCatalog();
  fetch('/city3d/figures.json').then(r => r.ok ? r.json() : null).then(j => {
    if (j) catalog = Object.assign(emptyCatalog(), j);
    for (const pawn of players.values()) pawn.visual.load(catalog, loader);
  }).catch(() => {});

  let layout = buildLayout(board.fields || []);
  let built = buildCity(scene, layout, board);
  let worldLib = null;
  function applyWorld() {
    if (!worldLib) return;
    dressWorld(scene, layout, worldLib, built);
    for (const pawn of players.values()) equipFromLibrary(pawn.visual, worldLib, pawn);
  }
  loadWorldAssets(loader).then(lib => { worldLib = lib; applyWorld(); }).catch(err => console.warn(err));
  const players = new Map();
  let state = null;
  let stepMs = 260;
  let running = false;
  let raf = 0;
  let fallen = false;
  let errors = 0;
  let qualityMode = opts.quality || 'auto';
  let tier = qualityMode === 'auto' ? startTier() : (PRESETS[qualityMode] ? qualityMode : 'mittel');
  let lowSince = 0;
  let badSince = 0;
  let startedAt = performance.now();
  let fps = 60;
  let fpsFrames = 0;
  let fpsStamp = performance.now();
  let last = performance.now();
  let pendingKey = '';
  let rollKey = '';
  let partyAt = 0;
  let camReady = false;
  const camPos = new THREE.Vector3();
  const lookPos = new THREE.Vector3();

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.045, 6, 18),
    new THREE.MeshBasicMaterial({ color: 0xffd400 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.visible = false;
  scene.add(ring);

  const card = makeTextPlane(' ', { w: 640, h: 360, bg: '#10172a', fg: '#ffffff', pw: 2.8, ph: 1.58, font: 36, stripe: '#3d7ff2' });
  card.visible = false;
  scene.add(card);
  const cardCtx = card.userData.texture.image.getContext('2d');

  const dice = makeNameSprite(' ');
  dice.visible = false;
  dice.scale.set(1.1, 0.55, 1);
  scene.add(dice);
  let diceUntil = 0;

  const confetti = makeConfetti(scene);
  const rain = makeRain(scene);
  let rainUntil = 0;
  let celebrate = false;

  applyTier();

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    fallback('WebGL wurde beendet. Es wird das 2D-Brett gezeigt.');
  });

  const ro = new ResizeObserver(() => resize());
  if (canvas.parentElement) ro.observe(canvas.parentElement);
  resize();

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    const dpr = dprFor(PRESETS[tier]);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    noteFps(now, dt);
    const viewW = canvas.clientWidth;
    const viewH = canvas.clientHeight;
    if (viewW < 2 || viewH < 2) return;
    const pr = renderer.getPixelRatio();
    if (Math.abs(canvas.width - Math.floor(viewW * pr)) > 2 || Math.abs(canvas.height - Math.floor(viewH * pr)) > 2) resize();

    const t = now / 1000;
    stepPlayers(now, dt, t);
    stepDoors(dt);
    stepPeds(built.peds, dt);
    stepConfetti(confetti, dt);
    stepRain(rain, dt, t, rainUntil);
    stepBelt(dt);
    if (celebrate && now > partyAt) {
      partyAt = now + 420;
      const top = built.podium && built.podium.slots[0];
      if (top) burst(confetti, top.x, top.y + 1, top.z, 8);
    }
    stepNpcs(t);
    stepCrowd(built, dt);
    stepCar(dt, t);
    stepCamera(dt, t);
    renderer.render(scene, camera);
  }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    try {
      frame(now);
      errors = 0;
    } catch (err) {
      errors += 1;
      console.error(err);
      if (errors >= 3) fallback('Die 3D-Stadt ist abgestürzt. Es wird das 2D-Brett gezeigt.');
    }
  }

  function noteFps(now, dt) {
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
      else if (tier === 'niedrig' && badSince > 2.5) {
        fallback('Die 3D-Stadt ist auf diesem Gerät zu langsam. Es wird das 2D-Brett gezeigt.');
      }
    }
    const label = `${Math.round(fps)} FPS · ${tierName(tier)}${qualityMode === 'auto' ? ' (automatisch)' : ''}`;
    if (opts.onFps) opts.onFps({ fps, tier, label });
    void dt;
  }

  function applyTier() {
    const preset = PRESETS[tier];
    if (built) built.setQuality(preset);
    const size = preset.shadows | 0;
    const shadows = size > 0;
    renderer.shadowMap.enabled = shadows;
    sun.castShadow = shadows;
    if (shadows) {
      if (sun.shadow.mapSize.x !== size) {
        sun.shadow.mapSize.set(size, size);
        if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
      }
      sun.shadow.radius = preset.shadowRadius || 1.5;
      sun.shadow.needsUpdate = true;
    }
    resize();
    scene.fog.far = tier === 'niedrig' ? 90 : 140;
  }

  function fallback(msg) {
    if (fallen) return;
    fallen = true;
    running = false;
    cancelAnimationFrame(raf);
    if (opts.onFallback) opts.onFallback(msg);
  }

  function syncPlayers() {
    const list = (state && state.players) || [];
    const alive = new Set();
    for (const p of list) {
      alive.add(p.id);
      let pawn = players.get(p.id);
      if (!pawn) {
        pawn = createPawn(p);
        players.set(p.id, pawn);
      }
      if (pawn.color !== p.color) {
        pawn.color = p.color;
        const tint = pawn.visual.placeholder.userData.tint || [];
        for (const m of tint) m.color.set(p.color);
      }
      if (pawn.connected !== p.connected) {
        pawn.connected = p.connected;
        const opacity = p.connected ? 1 : 0.4;
        pawn.visual.placeholder.traverse(o => {
          if (!o.material) return;
          o.material.transparent = opacity < 1;
          o.material.opacity = opacity;
        });
      }
      pawn.target = p.pos | 0;
      pawn.wantJail = !!p.jail;
      pawn.name = p.name;
    }
    for (const [id, pawn] of players) {
      if (alive.has(id)) continue;
      scene.remove(pawn.visual.root);
      if (pawn.nameSprite) scene.remove(pawn.nameSprite);
      players.delete(id);
    }
  }

  function createPawn(p) {
    const visual = createPlayerVisual(p, catalog, loader);
    visual.load(catalog, loader);
    if (worldLib) equipFromLibrary(visual, worldLib, p);
    scene.add(visual.root);
    const nameSprite = makeNameSprite(p.name);
    visual.root.add(nameSprite);
    const pawn = {
      id: p.id,
      visual,
      nameSprite,
      color: p.color,
      connected: p.connected,
      name: p.name,
      index: null,
      target: p.pos | 0,
      wantJail: !!p.jail,
      mode: 'free',
      hop: null,
      pos: new THREE.Vector3(),
      face: new THREE.Vector2(1, 0),
      yaw: 0,
      arrestT: 0,
      releaseT: 0,
      prison: null,
      emote: null,
      cuffed: false,
      born: true,
    };
    return pawn;
  }

  function snapAll() {
    for (const pawn of players.values()) {
      pawn.hop = null;
      pawn.index = pawn.target;
      pawn.mode = 'free';
      pawn.cuffed = false;
      if (pawn.wantJail) putInCell(pawn, false);
      else putOnField(pawn, pawn.index);
      pawn.visual.root.position.copy(pawn.pos);
    }
  }

  function stepPlayers(now, dt, t) {
    const activeId = activePlayerId();
    const stacks = new Map();
    for (const pawn of players.values()) {
      if (pawn.born) {
        pawn.born = false;
        pawn.index = pawn.target;
        if (pawn.wantJail) putInCell(pawn, false);
        else putOnField(pawn, pawn.index);
      }
      if (pawn.mode === 'free' && pawn.wantJail && pawn.index === pawn.target && !pawn.hop) {
        startArrest(pawn);
      }
      if ((pawn.mode === 'cell' || pawn.mode === 'arrest') && !pawn.wantJail) {
        startRelease(pawn);
      }
      if (pawn.mode === 'arrest') stepArrest(pawn, dt);
      else if (pawn.mode === 'release') stepRelease(pawn, dt);
      else if (pawn.mode === 'cell') {
        if (pawn.prison) pawn.pos.copy(pawn.prison.seat);
        pawn.cuffed = true;
      } else if (celebrate && pawn.slot) {
        pawn.pos.lerp(_a.set(pawn.slot.x, pawn.slot.y, pawn.slot.z), Math.min(1, dt * 3));
        pawn.hop = null;
      } else {
        stepHop(pawn, now);
        if (!pawn.hop && pawn.mode === 'free') {
          const arr = stacks.get(pawn.index) || [];
          arr.push(pawn);
          stacks.set(pawn.index, arr);
        }
      }

      let poseMode = 'idle';
      if (pawn.mode === 'cell' || (pawn.mode === 'arrest' && pawn.arrestT > 1.35)) poseMode = 'sit';
      else if (pawn.hop) poseMode = 'walk';
      else if (pawn.emote && pawn.emote.until > now) poseMode = pawn.emote.mode;
      else if (celebrate && pawn.slot && pawn.place === 0) poseMode = 'cheer';
      if (pawn.mode === 'free' && pawn.hop && pawn.hop.back) poseMode = 'walk';
      const showNames = players.size <= 10 || pawn.id === activeId || pawn.hop;
      pawn.nameSprite.visible = showNames;
      setCuffs(pawn.visual.placeholder, pawn.cuffed && !pawn.visual.model);
      updateVisual(pawn.visual, poseMode, t, dt, catalog);
      const faceYaw = yawFacing(pawn.face.x, pawn.face.y);
      pawn.yaw = dampAngle(pawn.yaw, faceYaw, dt);
      pawn.visual.root.rotation.y = pawn.yaw;
      pawn.visual.root.position.copy(pawn.pos);
      if (pawn.hop) pawn.visual.root.position.y = pawn.pos.y;
    }
    for (const [index, arr] of stacks) {
      if (arr.length < 2) continue;
      const f = layout.points[index];
      if (!f) continue;
      arr.forEach((pawn, k) => {
        const ang = k * 1.8;
        const rad = 0.42;
        pawn.pos.set(f.x + Math.cos(ang) * rad, TILE_Y, f.z + Math.sin(ang) * rad);
        pawn.visual.root.position.copy(pawn.pos);
      });
    }
    const follow = followPawn();
    ring.visible = !!(follow && follow.mode === 'free');
    if (follow && ring.visible) ring.position.set(follow.pos.x, TILE_Y + 0.05, follow.pos.z);

    if (card.visible && follow) {
      const f = layout.points[follow.index] || layout.points[0];
      card.position.set(follow.pos.x + (f ? f.sx : 1) * 1.6, follow.pos.y + 2.15, follow.pos.z + (f ? f.sz : 0) * 1.6);
      card.lookAt(camera.position);
    }
    if (dice.visible && follow && now < diceUntil) {
      dice.position.set(follow.pos.x, follow.pos.y + 2.5, follow.pos.z);
    } else dice.visible = false;

    if (opts.onHud) {
      const f = follow && layout.points[follow.index];
      const b = f && f.building && layout.buildings.find(x => x.id === f.building);
      opts.onHud({
        title: b ? b.name : (celebrate ? 'Siegerehrung' : 'Stadt'),
        sub: f ? `${f.label && f.type !== 'normal' ? f.label : 'Feld ' + f.id} · ${TYPE_DE[f.type] || 'Weg'}${b ? ' · ' + b.blurb : ''}` : 'Warte auf die Runde',
      });
    }
  }

  function stepHop(pawn, now) {
    if (pawn.hop) {
      const u = Math.min(1, (now - pawn.hop.t0) / pawn.hop.dur);
      const A = layout.points[pawn.hop.from];
      const B = layout.points[pawn.hop.to];
      if (A && B) {
        pawn.pos.set(
          A.x + (B.x - A.x) * u,
          TILE_Y + Math.sin(u * Math.PI) * (pawn.hop.back ? 0.22 : 0.58),
          A.z + (B.z - A.z) * u,
        );
        pawn.face.set(B.x - A.x, B.z - A.z);
      }
      if (u >= 1) {
        pawn.index = pawn.hop.to;
        pawn.hop = null;
        const landed = layout.points[pawn.index];
        if (landed) pawn.face.set(landed.tx, landed.tz);
      }
      return;
    }
    if (pawn.index !== pawn.target) {
      const next = pawn.index + Math.sign(pawn.target - pawn.index);
      if (!layout.points[next]) { pawn.index = pawn.target; return; }
      pawn.hop = { from: pawn.index, to: next, t0: now, dur: Math.max(80, stepMs), back: next < pawn.index };
    } else {
      const f = layout.points[pawn.index];
      if (f) {
        pawn.pos.set(f.x, TILE_Y, f.z);
        if (!pawn.face.lengthSq()) pawn.face.set(f.tx, f.tz);
      }
    }
  }

  function startArrest(pawn) {
    pawn.mode = 'arrest';
    pawn.arrestT = 0;
    pawn.prison = prisonByField(pawn.index);
    pawn.cuffed = false;
    pawn._from = pawn.pos.clone();
    if (pawn.prison) {
      carJob = { pawn, t: 0, phase: 'in' };
      const f = layout.points[pawn.index];
      carFrom.copy(_a.set(f.x - f.tx * 10, 0, f.z - f.tz * 10));
      carTo.copy(_a.set(f.x - f.tx * 2.1 + f.sx * 1.5, 0, f.z - f.tz * 2.1 + f.sz * 1.5));
      built.car.visible = true;
      built.car.position.copy(carFrom);
    }
  }

  function stepArrest(pawn, dt) {
    pawn.arrestT += dt;
    const t = pawn.arrestT;
    const prison = pawn.prison;
    if (prison) prison.wantOpen = (t > 0.45 && t < 1.9) ? 1 : 0;
    pawn.cuffed = t > 0.55;
    if (prison && t >= 0.7 && t < 1.45) {
      const u = ease((t - 0.7) / 0.75);
      pawn.pos.lerpVectors(pawn._from, prison.doorSpot, u);
      pawn.face.set(prison.doorSpot.x - pawn._from.x, prison.doorSpot.z - pawn._from.z);
    } else if (prison && t >= 1.45) {
      const u = ease(Math.min(1, (t - 1.45) / 0.45));
      pawn.pos.lerpVectors(prison.doorSpot, prison.seat, u);
      pawn.face.set(prison.seat.x - prison.doorSpot.x, prison.seat.z - prison.doorSpot.z);
    }
    if (t >= 2.05) {
      pawn.mode = 'cell';
      pawn.cellCamUntil = performance.now() + 3200;
      if (prison) pawn.pos.copy(prison.seat);
      if (carJob && carJob.pawn === pawn) carJob.phase = 'out';
    }
  }

  function startRelease(pawn) {
    pawn.mode = 'release';
    pawn.releaseT = 0;
    pawn._from = pawn.pos.clone();
    const f = layout.points[pawn.index];
    pawn._to = f ? new THREE.Vector3(f.x, TILE_Y, f.z) : pawn.pos.clone();
  }

  function stepRelease(pawn, dt) {
    pawn.releaseT += dt;
    const t = pawn.releaseT;
    if (pawn.prison) pawn.prison.wantOpen = t < 0.9 ? 1 : 0;
    pawn.cuffed = t < 0.25;
    if (t < 0.85) {
      const u = ease(Math.min(1, t / 0.85));
      pawn.pos.lerpVectors(pawn._from, pawn._to, u);
      pawn.face.set(pawn._to.x - pawn._from.x, pawn._to.z - pawn._from.z);
    }
    if (t >= 0.9) {
      pawn.mode = 'free';
      pawn.pos.copy(pawn._to);
      const f = layout.points[pawn.index];
      if (f) pawn.face.set(f.tx, f.tz);
    }
  }

  function putInCell(pawn, openDoor) {
    pawn.prison = prisonByField(pawn.index);
    pawn.mode = 'cell';
    pawn.cuffed = true;
    if (pawn.prison) {
      pawn.pos.copy(pawn.prison.seat);
      pawn.prison.wantOpen = openDoor ? 1 : 0;
      const f = layout.points[pawn.index];
      if (f) pawn.face.set(f.x - pawn.prison.seat.x, f.z - pawn.prison.seat.z);
    } else putOnField(pawn, pawn.index);
  }

  function putOnField(pawn, index) {
    const f = layout.points[index] || layout.points[0];
    if (!f) return;
    pawn.pos.set(f.x, TILE_Y, f.z);
    pawn.face.set(f.tx, f.tz);
    pawn.mode = 'free';
  }

  function prisonByField(index) {
    for (const pr of built.prisons) if (pr.fieldIndex === index) return pr;
    return null;
  }

  function stepDoors(dt) {
    for (const pr of built.prisons) {
      const target = pr.wantOpen ? 1.2 : 0;
      pr.hinge.rotation.y += (target - pr.hinge.rotation.y) * Math.min(1, dt * 6);
      pr.wantOpen = 0;
    }
  }

  function stepNpcs(t) {
    for (const n of built.npcRoots) {
      if (!n.root.visible) continue;
      pose(n.root, n.anim === 'idle' ? 'idle' : n.anim, t);
    }
  }

  let carJob = null;
  const carFrom = new THREE.Vector3();
  const carTo = new THREE.Vector3();
  const carAway = new THREE.Vector3();

  function stepCar(dt, t) {
    const car = built.car;
    if (!carJob) { car.visible = false; return; }
    car.visible = true;
    carJob.t += dt;
    const blink = Math.floor(t * 8) % 2 === 0;
    car.userData.red.visible = blink;
    car.userData.blue.visible = !blink;
      if (car.userData.wheels) for (const w of car.userData.wheels) w.rotation.x += dt * (carJob.phase === 'wait' ? 0 : 14);
    if (carJob.phase === 'in') {
      const u = ease(Math.min(1, carJob.t / 0.75));
      car.position.lerpVectors(carFrom, carTo, u);
      car.lookAt(carTo.x, car.position.y, carTo.z);
      if (u >= 1) { carJob.phase = 'wait'; carJob.t = 0; }
    } else if (carJob.phase === 'wait') {
      car.position.copy(carTo);
      if (carJob.pawn.mode === 'cell' || carJob.pawn.mode === 'release') {
        carJob.phase = 'out';
        carJob.t = 0;
        const f = layout.points[carJob.pawn.index];
        carAway.set(carTo.x - (f ? f.tx : 1) * 12, 0, carTo.z - (f ? f.tz : 0) * 12);
      }
    } else {
      const u = Math.min(1, carJob.t / 0.8);
      car.position.lerpVectors(carTo, carAway, u);
      car.lookAt(carAway.x, car.position.y, carAway.z);
      if (u >= 1) { carJob = null; car.visible = false; }
    }
  }

  function stepBelt(dt) {
    const belt = built.belt;
    if (!belt) return;
    belt.material.map.offset.x -= dt * 0.55;
  }

  function stepCamera(dt, t) {
    let wantLook = _camLook;
    let dist = 9;
    let height = 6;
    if (celebrate && built.podium) {
      const g = built.podium.group;
      _desired.set(g.position.x + 11, 10, g.position.z + 14);
      wantLook = _look.set(g.position.x, 1.4, g.position.z);
      scene.fog.far = 150;
    } else {
      const pawn = followPawn();
      if (pawn && layout.points.length) {
        const f = layout.points[Math.max(0, Math.min(layout.points.length - 1, pawn.index || 0))];
        const inside = !!(f && f.building);
        const chase = pawn.mode === 'arrest' || pawn.mode === 'cell' || pawn.mode === 'release';
        const sliding = pawn.hop && pawn.hop.back;
        if (chase && pawn.prison && f) {
          // Von schräg oben in die offene Zelle, die Tür bleibt im Bild.
          const seat = pawn.prison.seat;
          _desired.set(f.x * 0.42 + seat.x * 0.58, 7.4, f.z * 0.42 + seat.z * 0.58);
          _look.set(seat.x, 0.7, seat.z);
          wantLook = _look;
        } else {
          dist = sliding ? 18 : inside ? 11 : 12;
          height = sliding ? 14 : inside ? 9 : 9.4;
          const hasFace = pawn.face.lengthSq() > 0.0001;
          const tx = hasFace ? pawn.face.x : ((f && f.tx) || 1);
          const tz = hasFace ? pawn.face.y : ((f && f.tz) || 0);
          const len = Math.hypot(tx, tz) || 1;
          _desired.set(pawn.pos.x - (tx / len) * dist, pawn.pos.y + height, pawn.pos.z - (tz / len) * dist);
          _look.set(pawn.pos.x + (tx / len) * 2.4, pawn.pos.y + 1.15, pawn.pos.z + (tz / len) * 2.4);
          wantLook = _look;
        }
        scene.fog.far = tier === 'niedrig' ? 110 : 170;
      } else {
        const b = layout.bounds;
        const cx = (b.minX + b.maxX) / 2;
        const cz = (b.minZ + b.maxZ) / 2;
        _desired.set(cx + Math.sin(t * 0.07) * 8, 52, cz + 46);
        wantLook = _look.set(cx, 0, cz);
      }
    }
    const k = 1 - Math.exp(-dt * (camReady ? 4.5 : 20));
    camPos.lerp(_desired, k);
    lookPos.lerp(wantLook, k);
    camReady = true;
    camera.position.copy(camPos);
    camera.lookAt(lookPos);
    if (renderer.shadowMap.enabled) {
      const overview = !followPawn() || (state && state.phase !== 'playing' && !celebrate);
      const half = overview ? 42 : 16;
      sun.position.set(lookPos.x + 16, 34, lookPos.z + 9);
      sun.target.position.set(lookPos.x, 0, lookPos.z);
      sun.target.updateMatrixWorld();
      const sc = sun.shadow.camera;
      sc.left = -half;
      sc.right = half;
      sc.top = half;
      sc.bottom = -half;
      sc.near = 0.5;
      sc.far = 72;
      sc.updateProjectionMatrix();
    }
  }

  function followPawn() {
    if (!state) return null;
    let moving = null;
    let jailed = null;
    for (const pawn of players.values()) {
      if (pawn.hop || pawn.mode === 'arrest' || pawn.mode === 'release') moving = pawn;
      else if (pawn.mode === 'cell' && pawn.cellCamUntil && performance.now() < pawn.cellCamUntil) jailed = pawn;
    }
    if (moving) return moving;
    if (jailed) return jailed;
    if (state.phase === 'playing' && state.players && state.players[state.turn]) {
      return players.get(state.players[state.turn].id) || null;
    }
    if (celebrate && state.winner) return players.get(state.winner.playerId) || players.values().next().value || null;
    return players.values().next().value || null;
  }

  function activePlayerId() {
    if (!state || state.phase !== 'playing' || !state.players) return null;
    const cur = state.players[state.turn];
    return cur ? cur.id : null;
  }

  function syncFx() {
    const pd = state && state.pending;
    const key = pd ? [pd.type, pd.playerId, pd.card && pd.card.id, pd.kind, pd.resolved ? 1 : 0, pd.result ? 1 : 0].join('|') : '';
    if (key !== pendingKey) {
      pendingKey = key;
      if (pd && (pd.type === 'action' || pd.type === 'question')) {
        drawCard(pd);
        card.visible = true;
        const pawn = players.get(pd.playerId);
        const mood = pd.type === 'question'
          ? (pd.resolved ? (pd.result ? 'gut' : 'schlecht') : 'frage')
          : kartenStimmung((pd.card && pd.card.effect) || '');
        if (pawn && (mood === 'gut' || (pd.type === 'question' && pd.resolved && pd.result))) {
          pawn.emote = { mode: 'cheer', until: performance.now() + 1600 };
          burst(confetti, pawn.pos.x, pawn.pos.y + 1.4, pawn.pos.z, 24);
        } else if (pawn && mood === 'schlecht') {
          pawn.emote = { mode: 'stumble', until: performance.now() + 1400 };
          rain.anchor = pawn;
          rainUntil = performance.now() + 1800;
        }
      } else {
        card.visible = false;
      }
    } else if (!pd) card.visible = false;

    const roll = state && state.lastRoll;
    const rk = roll ? String(roll.at || '') + ':' + roll.value : '';
    if (roll && rk !== rollKey && state.phase === 'playing') {
      rollKey = rk;
      paintDice(roll.value);
      dice.visible = true;
      diceUntil = performance.now() + 1400;
    }

    const was = celebrate;
    celebrate = !!(state && state.phase === 'finished' && state.winner);
    if (celebrate && !was) startCeremony();
    if (!celebrate && was) clearCeremony();
  }

  function startCeremony() {
    const ranking = (state.winner && state.winner.ranking) || [];
    const slots = (built.podium && built.podium.slots) || [];
    players.forEach(p => { p.slot = null; p.place = null; });
    ranking.slice(0, slots.length).forEach((r, i) => {
      const pawn = players.get(r.id);
      if (!pawn || !slots[i]) return;
      pawn.slot = slots[i];
      pawn.place = i;
      const ziel = layout.points[layout.points.length - 1];
      if (ziel) pawn.face.set(ziel.x - slots[i].x, ziel.z - slots[i].z);
    });
    const top = slots[0];
    if (top) burst(confetti, top.x, top.y + 1.2, top.z, 36);
  }

  function clearCeremony() {
    players.forEach(p => { p.slot = null; p.place = null; });
  }

  function drawCard(pd) {
    const g = cardCtx;
    const w = 640;
    const h = 360;
    const question = pd.type === 'question';
    g.fillStyle = '#10172a';
    g.fillRect(0, 0, w, h);
    g.fillStyle = question ? '#2f6fd6' : '#f28c28';
    g.fillRect(0, 0, 16, h);
    g.fillStyle = '#ffd76a';
    g.font = '700 28px system-ui, sans-serif';
    g.textAlign = 'left';
    g.fillText(question ? 'FRAGEKARTE' : 'AKTIONSKARTE', 40, 48);
    g.fillStyle = '#ffffff';
    g.font = '700 40px system-ui, sans-serif';
    wrap(g, clipText(pd.card && pd.card.title, 48), 40, 110, 560, 46);
    g.font = '500 28px system-ui, sans-serif';
    g.fillStyle = '#d5deee';
    const body = question ? (pd.card && pd.card.question) : ((pd.card && (pd.card.effectLabel || pd.card.text)) || '');
    wrap(g, clipText(body, 140), 40, 200, 560, 34);
    card.userData.texture.needsUpdate = true;
  }

  function paintDice(value) {
    const tex = dice.material.map;
    const c = tex.image;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = '#ffffff';
    round(g, 16, 8, 224, 48, 14);
    g.fill();
    g.fillStyle = '#1d2433';
    g.font = '800 32px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('Würfel ' + value, 128, 34);
    tex.needsUpdate = true;
  }

  function rebuild(next) {
    disposeBuilt();
    scene.userData.dressed = false;
    layout = buildLayout((next && next.fields) || []);
    built = buildCity(scene, layout, next || { colors: {} });
    applyWorld();
    built.setQuality(PRESETS[tier]);
    for (const pawn of players.values()) {
      pawn.born = true;
      pawn.hop = null;
      pawn.mode = 'free';
      pawn.prison = null;
      pawn.index = null;
    }
    pendingKey = '';
    scene.add(ring, card, dice);
    camReady = false;
  }

  function disposeBuilt() {
    const keep = new Set([hemi, sun, ring, card, dice, rain.group, ...confetti.map(c => c.m)]);
    for (const pawn of players.values()) keep.add(pawn.visual.root);
    for (let i = scene.children.length - 1; i >= 0; i--) {
      const o = scene.children[i];
      if (keep.has(o)) continue;
      scene.remove(o);
      disposeObj(o);
    }
  }

  return {
    update(s) {
      state = s || state;
      if (state && state.stepMs) stepMs = state.stepMs;
      syncPlayers();
      syncFx();
      if (!running) snapAll();
    },
    start() {
      fallen = false;
      errors = 0;
      badSince = 0;
      lowSince = 0;
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
      const pawns = [];
      for (const p of players.values()) {
        pawns.push({
          name: p.name, index: p.index, target: p.target, mode: p.mode, jail: p.wantJail,
          t: Math.round((p.arrestT || 0) * 100) / 100,
          x: Math.round(p.pos.x * 10) / 10, z: Math.round(p.pos.z * 10) / 10,
          seat: p.prison ? { x: Math.round(p.prison.seat.x * 10) / 10, z: Math.round(p.prison.seat.z * 10) / 10 } : null,
        });
      }
      return {
        fps: Math.round(fps),
        tier,
        dpr: renderer.getPixelRatio(),
        shadows: renderer.shadowMap.enabled,
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        pawns,
      };
    },
  };
}

function skyGradient() {
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#5aa6ef');
  grd.addColorStop(0.45, '#b7e4fb');
  grd.addColorStop(0.78, '#ffe3bf');
  grd.addColorStop(1, '#ffd39a');
  g.fillStyle = grd;
  g.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function emptyCatalog() {
  return {
    scaleToHeight: 1.7,
    defaultUrl: '',
    byId: {},
    byName: {},
    byColor: {},
    clips: { idle: ['idle', 'stand'], walk: ['walk', 'run'], sit: ['sit', 'sitting', 'jail'] },
  };
}

function startTier() {
  // Ryzen 5 7530U: 12 Threads, deviceMemory meldet 8 bei 16 GB → Mittel.
  // Nur klar schwächere Geräte (sehr wenige Kerne oder wenig RAM) starten niedriger.
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  if (cores <= 2 || mem <= 2) return 'niedrig';
  return 'mittel';
}

function tierName(tier) {
  if (tier === 'niedrig') return 'Niedrig';
  if (tier === 'hoch') return 'Hoch';
  return 'Mittel';
}

function dprFor(preset) {
  const device = window.devicePixelRatio || 1;
  return Math.min(preset.dpr, device, DPR_CAP);
}

function ease(u) {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
}

function dampAngle(cur, target, dt) {
  let d = target - cur;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return cur + d * Math.min(1, dt * 8);
}

function clipText(s, n) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}

function wrap(g, text, x, y, maxW, lh) {
  const words = String(text || '').split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, yy);
      line = word;
      yy += lh;
    } else line = test;
  }
  if (line) g.fillText(line, x, yy);
}

function round(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const CONFETTI_COLORS = ['#ffd76a', '#ff4fa3', '#3d7ff2', '#3dcc7a', '#ffffff', '#f28c28'];

function makeConfetti(scene) {
  const geo = new THREE.BoxGeometry(0.12, 0.18, 0.03);
  const mats = CONFETTI_COLORS.map(c => new THREE.MeshBasicMaterial({ color: c }));
  const list = [];
  for (let i = 0; i < 48; i++) {
    const m = new THREE.Mesh(geo, mats[i % mats.length]);
    m.visible = false;
    m.frustumCulled = false;
    scene.add(m);
    list.push({ m, life: 0, v: new THREE.Vector3() });
  }
  return list;
}

function burst(list, x, y, z, n) {
  let left = n;
  for (const c of list) {
    if (c.life > 0) continue;
    c.life = 1.1 + Math.random() * 0.5;
    c.m.visible = true;
    c.m.position.set(x, y, z);
    c.v.set((Math.random() - 0.5) * 3.2, 1.8 + Math.random() * 2.2, (Math.random() - 0.5) * 3.2);
    if (--left <= 0) break;
  }
}

function stepConfetti(list, dt) {
  for (const c of list) {
    if (c.life <= 0) continue;
    c.life -= dt;
    c.v.y -= 5 * dt;
    c.m.position.addScaledVector(c.v, dt);
    c.m.rotation.z += dt * 4;
    if (c.life <= 0 || c.m.position.y < 0) { c.life = 0; c.m.visible = false; }
  }
}

function makeRain(scene) {
  const group = new THREE.Group();
  const cloud = new THREE.MeshLambertMaterial({ color: '#6d7684' });
  for (const [x, z, s] of [[0, 0, 0.55], [0.45, 0.1, 0.4], [-0.4, 0.05, 0.38]]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(s, 7, 6), cloud);
    m.position.set(x, 0, z);
    group.add(m);
  }
  const drops = [];
  const dropMat = new THREE.MeshBasicMaterial({ color: '#9ec9e8' });
  for (let i = 0; i < 10; i++) {
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.04), dropMat);
    d.userData.phase = Math.random();
    group.add(d);
    drops.push(d);
  }
  group.visible = false;
  scene.add(group);
  return { group, drops, anchor: null };
}

function stepRain(rain, dt, t, until) {
  if (!rain.anchor || performance.now() > until) {
    rain.group.visible = false;
    rain.anchor = null;
    return;
  }
  rain.group.visible = true;
  const p = rain.anchor.pos;
  rain.group.position.set(p.x, p.y + 2.3, p.z);
  rain.drops.forEach((d, i) => {
    const u = (t * 1.4 + d.userData.phase) % 1;
    d.position.set(((i % 3) - 1) * 0.28, 0.2 - u * 1.3, ((i % 2) - 0.5) * 0.3);
  });
  void dt;
}

function disposeObj(o) {
  o.traverse && o.traverse(n => {
    if (n.geometry && n.geometry.dispose && !n.geometry.userData.shared) n.geometry.dispose();
    if (n.material) {
      const mats = Array.isArray(n.material) ? n.material : [n.material];
      mats.forEach(m => {
        if (m.map) m.map.dispose();
        if (m.dispose) m.dispose();
      });
    }
  });
}
