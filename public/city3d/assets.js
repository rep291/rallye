// Art-Director-Modelle: ein Atlas, Toon, Figuren-Clips, Handprops.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

const BR = '/city3d/models/br/';
const FIG = '/city3d/models/figuren/';
const INK = 0x2e2e33;
const SCALE = 1.35;

export const JOB_MODEL = {
  mechanik: 'NPC_Mechanikerin',
  koch: 'NPC_Koch',
  friseur: 'NPC_Friseurin',
  it: 'NPC_IT',
  garten: 'NPC_Gaertnerin',
  labor: 'NPC_Laborantin',
  lager: 'NPC_Lagerist',
  tischler: 'NPC_Tischler',
  elektrik: 'NPC_Elektriker',
  pflege: 'NPC_Pfleger',
  polizei: 'NPC_Polizist',
  feuerwehr: 'NPC_Feuerwehr',
  maurer: 'NPC_Maurer',
  maler: 'NPC_Maler',
  baecker: 'NPC_Baecker',
  verkauf: 'NPC_Verkaeuferin',
  buero: 'NPC_Buero',
  arzt: 'NPC_Aerztin',
  schweiss: 'NPC_Schlosser',
  fahrer: 'NPC_Fahrer',
  landwirt: 'NPC_Landwirt',
  kiga: 'NPC_Erzieherin',
};

export const JOB_ORDER = [
  'mechanik', 'koch', 'friseur', 'it', 'garten', 'labor', 'lager', 'tischler', 'elektrik', 'pflege',
  'polizei', 'feuerwehr', 'maurer', 'maler', 'baecker', 'verkauf', 'buero', 'arzt', 'schweiss', 'fahrer', 'landwirt', 'kiga',
];

export const JOB_LABEL = {
  mechanik: 'Mechanik', koch: 'Koch', friseur: 'Friseur', it: 'IT', garten: 'Garten',
  labor: 'Labor', lager: 'Lager', tischler: 'Tischler', elektrik: 'Elektrik', pflege: 'Pflege',
  polizei: 'Polizei', feuerwehr: 'Feuerwehr', maurer: 'Maurer', maler: 'Maler', baecker: 'Bäcker',
  verkauf: 'Verkauf', buero: 'Büro', arzt: 'Arzt', schweiss: 'Metall', fahrer: 'Fahrer',
  landwirt: 'Landwirt', kiga: 'Kindergarten',
};

/** Prop, Socket und Clip laut EINBAU §6a. Sockets aus prop_grips.json (socket_three). */
export const JOB_GEAR = {
  mechanik: { prop: 'Prop_Reifen', socket: 'DEF-spine003', clip: 'CarryWalk' },
  koch: { prop: 'Prop_Kochloeffel', socket: 'Socket_Hand_R', clip: 'Stir' },
  friseur: { prop: 'Prop_Schere', socket: 'Socket_Hand_R', prop2: 'Prop_Kamm', socket2: 'Socket_Hand_L', clip: 'Haircut' },
  it: { prop: 'Prop_Laptop_zu', socket: 'Socket_Hand_L', clip: 'CarryLaptopWalk' },
  garten: { prop: 'Prop_Giesskanne', socket: 'Socket_Hand_R', clip: 'Water' },
  labor: { prop: 'Prop_Pipette', socket: 'Socket_Hand_R', prop2: 'Prop_Reagenzglas', socket2: 'Socket_Hand_L', clip: 'Pipette' },
  lager: { prop: 'Prop_Kiste', socket: 'DEF-spine003', clip: 'CarryIdle' },
  tischler: { prop: 'Prop_Saege', socket: 'Socket_Hand_R', clip: 'Saw' },
  elektrik: { prop: 'Prop_Messgeraet', socket: 'Socket_Hand_L', clip: 'Interact' },
  pflege: { prop: 'Prop_Tablett', socket: 'DEF-spine003', clip: 'CarryWalk' },
  polizei: { clip: 'Idle' },
  feuerwehr: { prop: 'Prop_Feuerloescher', socket: 'Socket_Hand_L', clip: 'Idle' },
  maurer: { prop: 'Prop_Kelle', socket: 'Socket_Hand_R', clip: 'CrouchIdle' },
  maler: { prop: 'Prop_Farbroller', socket: 'Socket_Hand_R', clip: 'Paint' },
  baecker: { prop: 'Prop_Brot', socket: 'Socket_Hand_R', clip: 'Idle' },
  verkauf: { prop: 'Prop_Einkaufskorb', socket: 'Socket_Hand_L', clip: 'Idle' },
  buero: { clip: 'Idle' },
  arzt: { prop: 'Prop_Klemmbrett', socket: 'Socket_Hand_L', prop2: 'Prop_Stift', socket2: 'Socket_Hand_R', clip: 'Clipboard' },
  schweiss: { prop: 'Prop_Schweissbrenner', socket: 'Socket_Hand_R', clip: 'Weld' },
  fahrer: { clip: 'Idle' },
  landwirt: { prop: 'Prop_Heugabel', socket: 'Socket_Hand_R', clip: 'Pitchfork' },
  kiga: { prop: 'Prop_Ball', socket: 'Socket_Hand_L', clip: 'Talk' },
};

const PLAYERS = ['Spieler_A', 'Spieler_B', 'Spieler_C', 'Spieler_D', 'Spieler_E', 'Spieler_F'];
const NAMED = {
  '#e6197e': 'pink',
  '#f7931e': 'orange',
  '#ffd23f': 'gelb',
  '#7cc242': 'gruen',
  '#1f5fd6': 'blau',
  '#8e44c9': 'lila',
};
const ONESHOT = new Set(['Sit', 'StandUp', 'PickUp', 'Interact', 'KneelFix', 'Cuff', 'PrisonerCuff']);

const ENV = [
  'BR_Box_Schlosserei', 'BR_Box_Kueche', 'BR_Box_Labor', 'BR_Box_Lager', 'BR_Box_Buero',
  'BR_Box_Friseur', 'BR_Box_Baustelle', 'BR_Box_Krankenhaus', 'BR_Box_Werkstatt',
  'BR_Zelle', 'BR_Polizeiauto', 'BR_Handschellen', 'BR_Park', 'BR_Bahnhof',
  'BR_Zug_Lok', 'BR_Zug_Wagen_A', 'BR_Zug_Wagen_B', 'BR_Zug_Wagen_C', 'BR_Zug_Wagen_D', 'BR_Zug_Wagen_E',
  'BR_Feld_Normal', 'BR_Feld_Aktion', 'BR_Feld_Frage', 'BR_Feld_Rutsche_Start', 'BR_Feld_Rutsche_Ziel',
  'BR_Feld_Finanzpolizei', 'BR_Feld_Start', 'BR_Feld_Ziel', 'BR_Feld_Nummer',
  'BR_Baum_A', 'BR_Baum_B', 'BR_Baum_C', 'BR_Busch_A', 'BR_Busch_B',
  'BR_Blumen_A', 'BR_Blumen_B', 'BR_Blumen_C', 'BR_Gras_A', 'BR_Gras_B',
  'BR_Wolke_A', 'BR_Wolke_B', 'BR_Wolke_C', 'BR_Auto_Klein', 'BR_Auto_Kombi', 'BR_Auto_Limousine',
  'BR_Bank', 'BR_Laterne', 'BR_Haftnotiz',
];

function hash(id) {
  let h = 0;
  const s = String(id || '');
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h;
}

function prepTexture(t, { nearest = false, repeat = false } = {}) {
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false;
  if (nearest) {
    t.magFilter = t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
  } else {
    t.anisotropy = 4;
  }
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

function makeOutlineMat() {
  const om = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  om.onBeforeCompile = (shader) => {
    shader.uniforms.uThick = { value: 0.014 };
    shader.vertexShader = 'uniform float uThick;\nattribute vec4 color;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n  transformed += normalize(normal) * uThick * color.r;',
    );
  };
  return om;
}

function prepareBuilding(root, mats) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const outline = /_Outline$/.test(o.name) || (o.material && o.material.name === 'BR_Outline');
    if (o.material) {
      const list = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of list) {
        if (m.map) m.map.dispose();
        m.dispose();
      }
    }
    o.material = outline ? mats.outline : mats.atlas;
    o.castShadow = false;
    o.receiveShadow = false;
    o.userData.outline = !!outline;
  });
  return root;
}

function toonify(root, { material, outlineMat, outline }) {
  const meshes = [];
  root.traverse((o) => { if (o.isMesh && !o.userData.isOutline) meshes.push(o); });
  for (const m of meshes) {
    m.material = material;
    m.castShadow = false;
    m.receiveShadow = false;
    m.frustumCulled = false;
    if (!(outline > 0)) continue;
    const hasCol = !!(m.geometry.attributes && m.geometry.attributes.color);
    const om = hasCol ? outlineMat : outlineMat.userData.plain;
    let o;
    if (m.isSkinnedMesh) {
      o = new THREE.SkinnedMesh(m.geometry, om);
      o.bind(m.skeleton, m.bindMatrix);
      m.parent.add(o);
    } else {
      o = new THREE.Mesh(m.geometry, om);
      m.add(o);
    }
    o.name = m.name + '_Outline';
    o.userData.isOutline = true;
    o.userData.outline = true;
    o.frustumCulled = false;
    o.castShadow = false;
  }
}

export async function loadCityLib() {
  const loader = new GLTFLoader();
  const tex = new THREE.TextureLoader();
  const [atlas, gradient, numbers, paper, hatch, karton, vfx, figAtlas] = await Promise.all([
    tex.loadAsync(BR + 'texturen/BR_Atlas_1024.png'),
    tex.loadAsync(BR + 'texturen/BR_Gradient_2stufig.png'),
    tex.loadAsync(BR + 'texturen/BR_Feldnummern_1024.png'),
    tex.loadAsync(BR + 'texturen/BR_Papier_512.png'),
    tex.loadAsync(BR + 'texturen/BR_Buntstift_512.png'),
    tex.loadAsync(BR + 'texturen/BR_Karton_512.png'),
    tex.loadAsync(BR + 'texturen/BR_VFX_4x1.png'),
    tex.loadAsync(FIG + 'texturen/figuren_atlas.png'),
  ]);
  prepTexture(atlas);
  gradient.magFilter = gradient.minFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.colorSpace = THREE.NoColorSpace;
  gradient.flipY = false;
  numbers.flipY = false;
  numbers.colorSpace = THREE.SRGBColorSpace;
  numbers.magFilter = THREE.LinearFilter;
  numbers.minFilter = THREE.LinearFilter;
  prepTexture(paper, { repeat: true });
  paper.flipY = true;
  prepTexture(hatch, { repeat: true });
  hatch.flipY = true;
  prepTexture(karton, { repeat: true });
  karton.flipY = true;
  vfx.flipY = false;
  vfx.colorSpace = THREE.SRGBColorSpace;
  vfx.magFilter = vfx.minFilter = THREE.NearestFilter;
  vfx.generateMipmaps = false;
  prepTexture(figAtlas, { nearest: true });

  const mats = {
    atlas: new THREE.MeshToonMaterial({ map: atlas, vertexColors: true, gradientMap: gradient, alphaTest: 0.5 }),
    outline: new THREE.MeshBasicMaterial({ color: INK }),
    numbers: new THREE.MeshBasicMaterial({ map: numbers, transparent: true, alphaTest: 0.4, depthWrite: false }),
    paper, hatch, karton, vfx, gradient,
  };
  const npcMat = new THREE.MeshToonMaterial({ map: figAtlas, gradientMap: gradient });
  const outlineMat = makeOutlineMat();
  const plainOutline = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  plainOutline.onBeforeCompile = (shader) => {
    shader.uniforms.uThick = { value: 0.008 };
    shader.vertexShader = 'uniform float uThick;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n  transformed += normalize(normal) * uThick;',
    );
  };
  outlineMat.userData.plain = plainOutline;

  const scenes = {};
  await Promise.all(ENV.map(async (name) => {
    const gltf = await loader.loadAsync(BR + name + '.glb');
    scenes[name] = prepareBuilding(gltf.scene, mats);
  }));

  const animGltf = await loader.loadAsync(FIG + 'BR_Animationen.glb');
  const clips = Object.fromEntries(animGltf.animations.map((c) => [c.name, c]));
  const figCache = new Map();
  const colorTex = new Map();
  const colorMat = new Map();
  for (const [hex, name] of Object.entries(NAMED)) {
    const t = await tex.loadAsync(FIG + 'texturen/figuren_atlas_spieler_' + name + '.png');
    prepTexture(t, { nearest: true });
    colorTex.set(hex, t);
    colorMat.set(hex, new THREE.MeshToonMaterial({ map: t, gradientMap: gradient }));
  }
  const baseImg = figAtlas.image;

  function atlasFor(hex) {
    const key = String(hex || '#e6197e').toLowerCase();
    if (colorMat.has(key)) return colorMat.get(key);
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    if (baseImg) g.drawImage(baseImg, 0, 0, 64, 64);
    g.fillStyle = key;
    g.fillRect(0, 0, 8, 8);
    const t = new THREE.CanvasTexture(c);
    prepTexture(t, { nearest: true });
    const m = new THREE.MeshToonMaterial({ map: t, gradientMap: gradient });
    colorMat.set(key, m);
    return m;
  }

  function figureScene(name, lod) {
    const file = name + (lod ? '_LOD1' : '') + '.glb';
    if (!figCache.has(file)) {
      const job = loader.loadAsync(FIG + file).catch((err) => {
        figCache.delete(file);
        if (!lod) return figureScene(name, 1);
        throw err;
      });
      figCache.set(file, job);
    }
    return figCache.get(file);
  }

  const propsGltf = await loader.loadAsync(FIG + 'Handprops.glb');
  const props = propsGltf.scene;

  function makePlayer(mixer) {
    let cur = null;
    return function play(name, opts = {}) {
      const clip = clips[name];
      if (!clip) return;
      const a = mixer.clipAction(clip);
      a.reset();
      a.timeScale = opts.timeScale || 1;
      if (ONESHOT.has(name) && !opts.loop) {
        a.setLoop(THREE.LoopOnce, 1);
        a.clampWhenFinished = true;
      } else a.setLoop(THREE.LoopRepeat, Infinity);
      if (cur && cur !== a) a.crossFadeFrom(cur, opts.fade == null ? 0.2 : opts.fade, false);
      a.play();
      cur = a;
      if (opts.onDone) {
        const h = (e) => {
          if (e.action !== a) return;
          mixer.removeEventListener('finished', h);
          opts.onDone();
        };
        mixer.addEventListener('finished', h);
      }
      return a;
    };
  }

  function spawn(name, opts = {}) {
    const lod = opts.lod ? 1 : 0;
    const pending = figureScene(name, name.startsWith('NPC') ? 1 : lod);
    const root = new THREE.Group();
    root.name = name;
    const holder = { root, mixer: null, play() {}, clips: {}, ready: pending.then(fill) };
    function fill(gltf) {
      const model = cloneSkinned(gltf.scene);
      const mat = opts.color ? atlasFor(opts.color) : npcMat;
      toonify(model, { material: mat, outlineMat, outline: opts.outline == null ? 0.014 : opts.outline });
      model.scale.setScalar(opts.scale || SCALE);
      root.add(model);
      const mixer = new THREE.AnimationMixer(model);
      holder.mixer = mixer;
      holder.model = model;
      holder.play = makePlayer(mixer);
      holder.clips = Object.fromEntries(Object.keys(clips).map((n) => [n.toLowerCase(), clips[n]]));
      holder.play('Idle');
      return holder;
    }
    return holder;
  }

  function bone(root, hint) {
    let hit = null;
    const want = String(hint || '').replace(/\./g, '');
    root.traverse((o) => {
      if (hit || !o.name) return;
      if (o.name === hint || o.name.replace(/\./g, '') === want) hit = o;
    });
    return hit;
  }

  // v3-Grip-Pivot: Geometrie liegt schon im Socket-Raum, Ursprung ist der Griff.
  // socket.add ohne Offset und ohne skel.pose(); die alte Variante setzt Props an die Füße.
  function attachProp(figRoot, propName, socketName) {
    const src = props.getObjectByName(propName);
    if (!src || !figRoot) return null;
    const socket = figRoot.getObjectByName(String(socketName || '').replace(/\./g, ''));
    if (!socket) return null;
    const prop = src.clone(true);
    socket.add(prop);
    toonify(prop, { material: npcMat, outlineMat, outline: 0.008 });
    return prop;
  }

  const ringGeo = new THREE.RingGeometry(0.32, 0.48, 18);

  function equip(api, player, opts = {}) {
    const job = JOB_MODEL[player.figure];
    const colored = !job;
    const name = job || PLAYERS[hash(player.id) % PLAYERS.length];
    const lod = name.startsWith('NPC') ? 1 : (opts.lod ? 1 : 0);
    const outline = opts.outline == null ? 0.014 : opts.outline;
    const key = name + '|' + (colored ? player.color : '') + '|' + lod + '|' + outline;
    if (!api.ring) {
      api.ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: player.color || '#E6197E', side: THREE.DoubleSide }));
      api.ring.rotation.x = -Math.PI / 2;
      api.ring.position.y = 0.04;
      api.tilt.add(api.ring);
    }
    api.ring.material.color.set(player.color || '#E6197E');
    if (api.modelKey === key) return;
    api.modelKey = key;
    if (api.model) {
      api.tilt.remove(api.model);
      api.model = null;
      api.mixer = null;
      api.play = null;
    }
    const spawned = spawn(name, { lod, color: colored ? (player.color || '#E6197E') : null, outline, scale: opts.scale || SCALE });
    api.model = spawned.root;
    api.tilt.add(spawned.root);
    if (api.placeholder) api.placeholder.visible = false;
    spawned.ready.then(() => {
      if (api.model !== spawned.root) return;
      api.mixer = spawned.mixer;
      api.play = spawned.play;
      api.clips = spawned.clips;
      api.figureRoot = spawned.model;
    });
  }

  function setOutlines(root, on) {
    root.traverse((o) => {
      if (o.userData && (o.userData.outline || o.userData.isOutline)) o.visible = !!on;
    });
  }

  return { scenes, mats, clips, spawn, equip, attachProp, setOutlines, bone, SCALE };
}
