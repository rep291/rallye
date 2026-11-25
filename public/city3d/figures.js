// Spielfiguren für die 3D-Stadt.
//
// Berufsfiguren können als glTF/GLB dazukommen, ohne den Platzhalter
// anzufassen. Katalog: /city3d/figures.json
//   defaultUrl: "/city3d/figures/default.glb"   (leer = Platzhalter)
//   byId:    { "<spieler-id>": "/city3d/figures/schlosser.glb" }
//   byName:  { "Anna": "/city3d/figures/koechin.glb" }
//   byColor: { "#e6194b": "/city3d/figures/schlosser.glb" }
//   scaleToHeight: 1.7
//   clips.idle / clips.walk / clips.sit: Clip-Namen im glTF
//
// Ohne passende Datei bleibt die farbige Low-Poly-Figur (Spielerfarbe).
// Handschellen, Hüpfen und die Zelle steuert die Stadt von außen.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

const SKIN = '#f0c3a0';
const geos = new Map();

function boxGeo(w, h, d) {
  const k = `b${w}x${h}x${d}`;
  let g = geos.get(k);
  if (!g) { g = new THREE.BoxGeometry(w, h, d); g.userData.shared = true; geos.set(k, g); }
  return g;
}

function sphereGeo(r) {
  const k = `s${r}`;
  let g = geos.get(k);
  if (!g) { g = new THREE.SphereGeometry(r, 7, 6); g.userData.shared = true; geos.set(k, g); }
  return g;
}

export function shade(hex, t) {
  const c = new THREE.Color(hex || '#888888');
  c.lerp(new THREE.Color('#1a1a1a'), 1 - t);
  return '#' + c.getHexString();
}

function mat(color) {
  return new THREE.MeshLambertMaterial({ color });
}

function hang(parent, x, y, z, w, h, d, color) {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, z);
  const mesh = new THREE.Mesh(boxGeo(w, h, d), mat(color));
  mesh.position.y = -h / 2;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  pivot.add(mesh);
  parent.add(pivot);
  return pivot;
}

/** Low-Poly-Mensch. Füße bei y=0, Blickrichtung lokale -Z. */
export function makePerson(opts = {}) {
  const shirt = opts.shirt || '#3d7ff2';
  const pants = opts.pants || '#243044';
  const skin = opts.skin || SKIN;
  const hair = opts.hair || '#3a2a22';
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const torso = new THREE.Mesh(boxGeo(0.46, 0.52, 0.26), mat(shirt));
  torso.position.y = 1.02;
  body.add(torso);

  const head = new THREE.Mesh(sphereGeo(0.2), mat(skin));
  head.position.y = 1.46;
  body.add(head);

  const hairMesh = new THREE.Mesh(sphereGeo(0.16), mat(hair));
  hairMesh.position.set(0, 1.58, 0.02);
  hairMesh.scale.set(1.15, 0.7, 1.1);
  body.add(hairMesh);

  let capMesh = null;
  let brimMesh = null;
  if (opts.cap) {
    capMesh = new THREE.Mesh(boxGeo(0.34, 0.1, 0.34), mat(opts.cap));
    capMesh.position.set(0, 1.64, -0.02);
    body.add(capMesh);
    brimMesh = new THREE.Mesh(boxGeo(0.34, 0.04, 0.16), mat(opts.cap));
    brimMesh.position.set(0, 1.58, -0.22);
    body.add(brimMesh);
  }

  const armL = hang(body, -0.32, 1.22, 0, 0.12, 0.48, 0.12, shirt);
  const armR = hang(body, 0.32, 1.22, 0, 0.12, 0.48, 0.12, shirt);
  const legL = hang(root, -0.12, 0.76, 0, 0.15, 0.74, 0.16, pants);
  const legR = hang(root, 0.12, 0.76, 0, 0.15, 0.74, 0.16, pants);

  if (opts.toolColor) {
    const tool = new THREE.Mesh(boxGeo(0.08, 0.32, 0.08), mat(opts.toolColor));
    tool.position.set(0, -0.58, 0.06);
    armR.children[0].add(tool);
  }

  const cuffMat = mat('#c5ccd4');
  const cuffGeo = new THREE.TorusGeometry(0.075, 0.02, 4, 8);
  const cuffL = new THREE.Mesh(cuffGeo, cuffMat);
  const cuffR = new THREE.Mesh(cuffGeo, cuffMat);
  cuffL.rotation.x = Math.PI / 2;
  cuffR.rotation.x = Math.PI / 2;
  cuffL.position.set(0, -0.4, 0);
  cuffR.position.set(0, -0.4, 0);
  cuffL.visible = false;
  cuffR.visible = false;
  armL.children[0].add(cuffL);
  armR.children[0].add(cuffR);

  root.userData.parts = { body, armL, armR, legL, legR, cuffL, cuffR, torso };
  root.userData.tint = [torso.material, armL.children[0].material, armR.children[0].material];
  if (capMesh) root.userData.tint.push(capMesh.material, brimMesh.material);
  return root;
}

export function setCuffs(root, on) {
  const p = root && root.userData.parts;
  if (!p) return;
  p.cuffL.visible = !!on;
  p.cuffR.visible = !!on;
}

/** Idle, Gehen, Sitzen, Jubel, Stolpern und Arbeitsbewegungen. */
export function pose(root, mode, t) {
  const p = root && root.userData.parts;
  if (!p) return;
  const { armL, armR, legL, legR, body } = p;
  armL.rotation.set(0, 0, 0);
  armR.rotation.set(0, 0, 0);
  legL.rotation.set(0, 0, 0);
  legR.rotation.set(0, 0, 0);
  body.rotation.set(0, 0, 0);
  const bob = Math.sin(t * 1.6) * 0.06;
  switch (mode) {
    case 'walk': {
      const w = Math.sin(t * 11);
      legL.rotation.x = w * 0.75;
      legR.rotation.x = -w * 0.75;
      armL.rotation.x = -w * 0.65;
      armR.rotation.x = w * 0.65;
      break;
    }
    case 'sit':
      legL.rotation.x = 1.45;
      legR.rotation.x = 1.45;
      armL.rotation.x = 0.45;
      armR.rotation.x = 0.45;
      body.rotation.x = 0.18;
      break;
    case 'cheer':
      armL.rotation.x = 2.6;
      armR.rotation.x = 2.6;
      armL.rotation.z = 0.25;
      armR.rotation.z = -0.25;
      body.position.y = Math.abs(Math.sin(t * 8)) * 0.08;
      break;
    case 'stumble':
      body.rotation.z = Math.sin(t * 18) * 0.4;
      armL.rotation.x = 1.1;
      armR.rotation.x = -0.6;
      legL.rotation.x = 0.4;
      break;
    case 'hammer':
      armR.rotation.x = 0.35 + Math.max(0, Math.sin(t * 8)) * 1.45;
      armL.rotation.x = 0.4;
      break;
    case 'stir':
      armR.rotation.x = 1.15;
      armR.rotation.z = Math.sin(t * 4) * 0.45;
      break;
    case 'type':
      armL.rotation.x = 0.95 + Math.sin(t * 14) * 0.12;
      armR.rotation.x = 0.95 + Math.sin(t * 14 + 1.2) * 0.12;
      break;
    case 'cut':
      armR.rotation.x = 1.05;
      armR.rotation.y = Math.sin(t * 12) * 0.55;
      armL.rotation.x = 0.7;
      break;
    case 'carry':
      armL.rotation.x = 1.35;
      armR.rotation.x = 1.35;
      body.position.y = bob;
      break;
    case 'weld':
      armR.rotation.x = 1.25;
      armL.rotation.x = 0.85;
      break;
    case 'mix':
      armR.rotation.x = 1.05 + Math.sin(t * 6) * 0.35;
      break;
    case 'sweep':
      armR.rotation.x = 0.55 + Math.sin(t * 4) * 0.55;
      break;
    default:
      armL.rotation.x = bob;
      armR.rotation.x = -bob;
      body.position.y = 0;
      return;
  }
  if (mode !== 'cheer' && mode !== 'carry') body.position.y = 0;
}

function clipByNames(clips, names) {
  if (!names) return null;
  const list = Array.isArray(names) ? names : [names];
  const keys = Object.keys(clips);
  for (const want of list) {
    const n = String(want).toLowerCase();
    if (clips[n]) return clips[n];
    const hit = keys.find(k => k.includes(n));
    if (hit) return clips[hit];
  }
  return null;
}

export function figureUrl(catalog, player) {
  if (!catalog || !player) return '';
  const byId = catalog.byId || {};
  const byName = catalog.byName || {};
  const byColor = catalog.byColor || {};
  const color = String(player.color || '');
  return byId[player.id] || byName[player.name] || byColor[color] || byColor[color.toLowerCase()] || catalog.defaultUrl || '';
}

export function createLoader() {
  return new GLTFLoader();
}

/**
 * Spielerfigur: Platzhalter sofort, glTF danach wenn der Katalog eine URL hat.
 * root steht mit den Füßen auf y=0.
 */
export function createPlayerVisual(player, catalog, loader) {
  const root = new THREE.Group();
  const tilt = new THREE.Group();
  root.add(tilt);
  const placeholder = makePerson({
    shirt: player.color,
    pants: shade(player.color, 0.45),
    cap: shade(player.color, 0.72),
    skin: SKIN,
    hair: '#2c241c',
  });
  placeholder.visible = false;
  tilt.add(placeholder);
  const api = {
    root,
    tilt,
    placeholder,
    mixer: null,
    model: null,
    clips: {},
    current: '',
    action: null,
    loadedUrl: '',
  };
  api.load = (cat, ldr) => loadFigure(api, player, cat || catalog, ldr || loader);
  return api;
}

async function loadFigure(api, player, catalog, loader) {
  const url = figureUrl(catalog, player);
  if (!url || !loader || api.loadedUrl === url) return;
  api.loadedUrl = url;
  try {
    const gltf = await loader.loadAsync(url);
    if (api.loadedUrl !== url) return;
    const model = gltf.scene || gltf.scenes?.[0];
    if (!model) throw new Error('leere Szene');
    model.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    const target = (catalog && catalog.scaleToHeight) || 1.7;
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const h = size.y || 1;
    model.scale.setScalar(target / h);
    const fitted = new THREE.Box3().setFromObject(model);
    model.position.x -= (fitted.min.x + fitted.max.x) / 2;
    model.position.z -= (fitted.min.z + fitted.max.z) / 2;
    model.position.y -= fitted.min.y;
    model.userData.baseY = model.position.y;
    api.tilt.add(model);
    api.placeholder.visible = false;
    api.model = model;
    api.mixer = new THREE.AnimationMixer(model);
    api.clips = {};
    for (const clip of gltf.animations || []) api.clips[clip.name.toLowerCase()] = clip;
  } catch (err) {
    console.warn('glTF-Figur nicht geladen, Platzhalter bleibt:', url, err && err.message ? err.message : err);
    api.loadedUrl = '';
    api.placeholder.visible = true;
  }
}

export function updateVisual(api, mode, t, dt, catalog) {
  if (!api) return;
  if (api.mixer && api.model) {
    const names = (catalog && catalog.clips) || {};
    const want = mode === 'cheer' ? (names.cheer || ['victory', 'cheer', 'yes'])
      : mode === 'sit' ? (names.sit || ['sitdown', 'sit', 'sitting', 'jail'])
      : (mode === 'walk' ? (names.walk || ['walk', 'running', 'run'])
        : (names.idle || ['idle', 'stand', 'idle_01']));
    const clip = clipByNames(api.clips, want) || clipByNames(api.clips, names.idle || ['idle']) || null;
    const key = clip ? clip.name : '';
    if (key !== api.current) {
      if (api.action) api.action.fadeOut(0.15);
      api.current = key;
      api.action = null;
      if (clip) {
        api.action = api.mixer.clipAction(clip);
        if (mode === 'sit' || mode === 'cheer') {
          api.action.setLoop(THREE.LoopOnce, 1);
          api.action.clampWhenFinished = true;
        }
        api.action.reset().fadeIn(0.15).play();
      }
    }
    api.mixer.update(dt || 0);
    const hasSit = !!clipByNames(api.clips, names.sit || ['sit', 'sitting', 'jail']);
    const baseY = api.model.userData.baseY ?? 0;
    if (mode === 'sit' && !hasSit) {
      api.model.rotation.x = 0.65;
      api.model.position.y = baseY - 0.15;
    } else {
      api.model.rotation.x = 0;
      api.model.position.y = baseY;
    }
    setCuffs(api.placeholder, false);
    return;
  }
  pose(api.placeholder, mode, t);
}

const ROSTER = ['Casual_Male', 'Casual_Female', 'Casual2_Male', 'Suit_Male', 'Worker_Female'];
const FIGURE_MODEL = {
  koch: 'Chef_Male', baecker: 'Chef_Male', friseur: 'Chef_Female',
  arzt: 'Doctor_Male_Young', pflege: 'Doctor_Female_Young', labor: 'Doctor_Female_Young',
  buero: 'Suit_Male', it: 'Suit_Male', verkauf: 'Casual_Female', polizei: 'Suit_Male',
  mechanik: 'Worker_Male', lager: 'Worker_Female', tischler: 'Worker_Male', elektrik: 'Worker_Male',
  maurer: 'Worker_Male', schweiss: 'Worker_Male', feuerwehr: 'Worker_Male',
  garten: 'Worker_Female', landwirt: 'Worker_Female', fahrer: 'Casual2_Male', maler: 'Casual2_Male', kiga: 'Casual_Female'
};

const SKIN_COLOR = new THREE.Color('#f0c09a');
const HAIR_COLOR = new THREE.Color('#6b3f28');

/** Assimp schreibt die Albedo-Farben viel zu dunkel. Hier bekommen Haut, Haar und Outfit klare Farben. */
export function paintCharacter(model, tint) {
  const outfit = new THREE.Color(tint || '#3d7ff2');
  model.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = false;
    o.frustumCulled = false;
    const list = Array.isArray(o.material) ? o.material : [o.material];
    const next = list.map(m => {
      const c = m.clone();
      const n = (m.name || '').toLowerCase();
      if (n.includes('skin') || n.includes('face')) c.color.copy(SKIN_COLOR);
      else if (n.includes('hair')) c.color.copy(HAIR_COLOR);
      else if (n.includes('shirt') || n.includes('pants')) c.color.copy(outfit);
      else if (n.includes('belt')) c.color.set('#5a3b28');
      c.metalness = 0.04;
      c.roughness = 0.78;
      return c;
    });
    o.material = next.length === 1 ? next[0] : next;
  });
}

function hashId(id) {
  let h = 0;
  const s = String(id || '');
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h;
}

function standOnGround(obj, height) {
  obj.scale.set(1, 1, 1);
  obj.position.set(0, 0, 0);
  obj.rotation.set(0, 0, 0);
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);
  const s = height / (size.y || 1);
  obj.scale.setScalar(s);
  obj.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(obj);
  obj.position.y -= fitted.min.y;
  const center = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.userData.baseY = obj.position.y;
}

/** Quaternius-Figur aus dem geladenen Katalog. Shirt und Hose in der Spielerfarbe. */
export function equipFromLibrary(api, lib, player) {
  if (!api || !lib || !lib.chars) return;
  const ids = ROSTER.filter(id => lib.chars[id]);
  const mapped = FIGURE_MODEL[player.figure];
  const id = (mapped && lib.chars[mapped]) ? mapped : (ids[hashId(player.id) % Math.max(1, ids.length)] || null);
  if (!id) return;
  if (api.modelId === id && api.tint === player.color) return;
  if (api.model) { api.tilt.remove(api.model); api.model = null; api.mixer = null; api.clips = {}; api.current = ''; }
  api.modelId = id;
  api.tint = player.color;
  const gltf = lib.chars[id];
  const model = cloneSkinned(gltf.scene);
  standOnGround(model, 1.72);
  model.rotation.y = Math.PI;
  paintCharacter(model, player.color || '#3d7ff2');
  api.tilt.add(model);
  api.placeholder.visible = false;
  api.model = model;
  api.mixer = new THREE.AnimationMixer(model);
  api.clips = {};
  for (const clip of gltf.animations || []) api.clips[clip.name.toLowerCase()] = clip;
}

export function makeTextPlane(text, opts = {}) {
  const w = opts.w || 512;
  const h = opts.h || 128;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = opts.bg || '#1d2433';
  g.fillRect(0, 0, w, h);
  if (opts.stripe) {
    g.fillStyle = opts.stripe;
    g.fillRect(0, 0, 18, h);
  }
  g.fillStyle = opts.fg || '#ffffff';
  g.font = `700 ${opts.font || 54}px system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lines = String(text || '').split('\n');
  const lh = (opts.font || 54) * 1.15;
  const y0 = h / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((line, i) => g.fillText(line, w / 2, y0 + i * lh, w - 36));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 2;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: !!opts.transparent });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(opts.pw || 3.2, opts.ph || 0.8), mat);
  plane.userData.texture = tex;
  return plane;
}

export function makeNameSprite(name) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(12,18,34,0.78)';
  roundRect(g, 8, 8, 240, 48, 16);
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = '700 30px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(name || '').slice(0, 16), 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set(1.7, 0.42, 1);
  sprite.position.y = 2.05;
  sprite.renderOrder = 12;
  sprite.userData.texture = tex;
  return sprite;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
