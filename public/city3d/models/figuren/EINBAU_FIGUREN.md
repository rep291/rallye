# EINBAU – Figuren & NPCs in Three.js (Stil C)

Getestet mit **three r170** (GLTFLoader, SkeletonUtils, MeshToonMaterial). Mit genau diesem Code sind `figuren_kontakt.png` und `vorschau/*` gerendert: `/workspace/figuren_work/preview/toon.js` + `sheet.html`.

## 1. Konventionen

- Y-up, Meter, **Pivot an den Füßen** (y = 0), Blickrichtung **+Z**, wie die bisherigen Quaternius-Figuren und die Boxen aus dem Parallel-Auftrag.
- Figurhöhe ca. **1,15 m** (Chibi, Kopf ≈ 40 %), mit Hut bis 1,31 m. Bei Feldern von 1,5 m und Boxen mit 2,6 m Wandhöhe ist Maßstab **1,3–1,4** empfehlenswert (Figur ≈ 1,5–1,6 m, passt durch die 2,15-m-Türen). Den Maßstab immer auf den Figuren-Root setzen, nie auf Bones.
- Laufgeschwindigkeit bei Maßstab 1: Walk/CarryWalk/PrisonerWalk/Lead ≈ 0,45 m/s, Run ≈ 1,15 m/s, Sprint ≈ 1,5 m/s. Der Wert skaliert linear mit dem Maßstab. Die Clips laufen auf der Stelle (in place), Bewegung kommt aus dem Code. `timeScale` lässt sich zum Feinabgleich gegen Fußrutschen nutzen.

## 2. Laden: eine Animationsdatei für alle

```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const loader = new GLTFLoader();
const BASE = 'figuren/';
const animGltf = await loader.loadAsync(BASE + 'BR_Animationen.glb');   // einmal laden
const CLIPS = Object.fromEntries(animGltf.animations.map(c => [c.name, c]));

const figCache = new Map();
async function spawnFigure(name, { lod = 0 } = {}) {      // z. B. 'NPC_Koch'
  const file = BASE + name + (lod ? '_LOD1' : '') + '.glb';
  if (!figCache.has(file)) figCache.set(file, await loader.loadAsync(file));
  const root = SkeletonUtils.clone(figCache.get(file).scene);   // Wichtig: SkeletonUtils statt clone()
  toonify(root, { gradient: TOON_GRADIENT });                    // siehe §4
  const mixer = new THREE.AnimationMixer(root);
  return { root, mixer, play: makePlayer(mixer) };
}
```

Die Clips binden über Bone-Namen. Der GLTFLoader „säubert“ die Namen (`DEF-spine.003` → `DEF-spine003`), und zwar in Figuren und Clips gleich, deshalb passt alles ohne Retargeting. Alle Figuren, auch `_LOD1`, und `Figur_Baukasten.glb` haben exakt dasselbe Rig.

## 3. Clips abspielen

```js
const ONESHOT = new Set(['Sit','StandUp','PickUp','Interact','KneelFix','Cuff']);
function makePlayer(mixer) {
  let cur = null;
  return function play(name, { fade = 0.2, timeScale = 1, onDone } = {}) {
    const a = mixer.clipAction(CLIPS[name]);
    a.reset(); a.timeScale = timeScale;
    if (ONESHOT.has(name)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    else a.setLoop(THREE.LoopRepeat, Infinity);
    if (cur && cur !== a) a.crossFadeFrom(cur, fade, false);
    a.play(); cur = a;
    if (onDone) { const h = e => { if (e.action === a) { mixer.removeEventListener('finished', h); onDone(); } };
                  mixer.addEventListener('finished', h); }
  };
}
// im Render-Loop:  for (const f of figuren) f.mixer.update(dt);
```

Typische Ketten:
- Hinsetzen: `play('Sit',{onDone:()=>play('SitIdle')})`, danach `SitTalk` oder `Type`. Aufstehen: `play('StandUp',{onDone:()=>play('Idle')})`. Die Sitzhöhe liegt bei Maßstab 1 bei ca. 0,20 m über dem Pivot (Stuhl/Bank entsprechend platzieren oder Figur anheben).
- Festnahme (§15): Polizist `play('Cuff',{onDone:()=>play('Lead')})`, gleichzeitig der Spieler `PrisonerIdle`, ab dem Losgehen `PrisonerWalk`. Den Spieler etwa 0,35 m (× Maßstab) vor den Polizisten auf dieselbe Bahn setzen, beide gleich schnell. In der Zelle: `PrisonerSit`.
- Arbeit (§13): siehe Tabelle „empfohlene Clips“ in `LISTE.md`. Alle Arbeits-Clips loopen außer `KneelFix` (5,2 s inkl. Hinknien und Aufstehen) und `PickUp`/`Interact`.
- `LieIdle` (Patient): Die Figur liegt auf dem Rücken, Kopf Richtung −Z, Rücken ca. 0,14 m über dem Pivot. Root auf die Bettoberkante minus 0,14 m setzen.

## 4. Toon-Material + Outline (2-Stufen-Cel, Stil C)

Alle Figuren haben **ein** Material mit eingebettetem 64×64-Atlas. `COLOR_0.r` enthält die Outline-Stärke pro Vertex: 0 bei Augen/Mund/Brauen (sonst schwarze Kleckse), 0,3 bei Kleinteilen.

```js
export function makeGradient(steps = [0.62, 1.0]) {
  const d = new Uint8Array(steps.length * 4);
  steps.forEach((s, i) => { const v = Math.round(s * 255); d.set([v, v, v, 255], i * 4); });
  const t = new THREE.DataTexture(d, steps.length, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
}
export const TOON_GRADIENT = makeGradient();

export function toonify(root, { gradient, atlas = null, outline = 0.014, outlineColor = 0x2E2E33 } = {}) {
  const meshes = []; root.traverse(o => { if (o.isMesh && !o.userData.isOutline) meshes.push(o); });
  for (const m of meshes) {
    const src = m.material, map = atlas || src.map;
    if (map) { map.colorSpace = THREE.SRGBColorSpace; map.magFilter = map.minFilter = THREE.NearestFilter;
               map.generateMipmaps = false; map.needsUpdate = true; }
    m.material = new THREE.MeshToonMaterial({ map, gradientMap: gradient });
    m.material.name = src.name;
    if (outline > 0) {                       // Inverted Hull, teilt Geometrie + Skelett
      const hasCol = !!m.geometry.attributes.color;
      const om = new THREE.MeshBasicMaterial({ color: outlineColor, side: THREE.BackSide });
      om.onBeforeCompile = s => {
        s.uniforms.uThick = { value: outline };
        s.vertexShader = 'uniform float uThick;\n' + (hasCol ? 'attribute vec4 color;\n' : '') +
          s.vertexShader.replace('#include <begin_vertex>',
            '#include <begin_vertex>\n  transformed += normalize(normal) * uThick' + (hasCol ? ' * color.r' : '') + ';');
      };
      let o;
      if (m.isSkinnedMesh) { o = new THREE.SkinnedMesh(m.geometry, om); o.bind(m.skeleton, m.bindMatrix);
                             o.frustumCulled = m.frustumCulled = false; m.parent.add(o); }
      else { o = new THREE.Mesh(m.geometry, om); m.add(o); }
      o.name = m.name + '_Outline'; o.userData.isOutline = true;
    }
  }
}
```

- Licht: ein DirectionalLight (Intensität ca. 2,2, von vorn-oben-links) plus `HemisphereLight` (ca. 1,0), so sind die Vorschauen gerendert. Weil der Gradient nur zwei Stufen hat, entsteht genau eine harte Schattenkante.
- `uThick = 0.014` ist in Figuren-Lokaleinheiten angegeben (≈ 1,2 % der Höhe) und skaliert deshalb mit dem Root-Maßstab mit. Für Beamer und große Distanz sind 0,018–0,022 sinnvoll. Die Konturfarbe `#2E2E33` entspricht dem Styleguide.
- Die Boxen aus dem Parallel-Auftrag bringen ihre Kontur als gebackenes Hull-Mesh mit. Bei den Figuren wird die Kontur zur Laufzeit erzeugt, weil ein gebackener Hull ein zweites Skin bräuchte. Optisch ist es dasselbe Verfahren.
- `MeshToonMaterial` bitte nicht durch die eingebetteten PBR-Materialien ersetzen. Die GLBs enthalten Standard-PBR nur als Fallback für Viewer.
- Alle Figur-Instanzen können sich ein einziges Material teilen. Ausnahme sind die Spielerfiguren, die je Farbe ein Material brauchen (§5). Bei 16 Figuren ergibt das ≤ 8 Material-Objekte und damit kaum Shader-Wechsel.

## 5. Spielerfarbe (Farbslot)

Die Spielfiguren `Spieler_A`–`F` tragen ihr Oberteil (Shirt, Pulli, Mützenbommel …) auf **Atlas-Zelle 0**. Für die Spielerfarbe tauscht man einfach den Atlas. Fertige Varianten liegen in `texturen/`:

| Farbe | Hex | Datei |
|---|---|---|
| Pink | #E6197E | `figuren_atlas_spieler_pink.png` (Default im GLB) |
| Orange | #F7931E | `figuren_atlas_spieler_orange.png` |
| Gelb | #FFD23F | `figuren_atlas_spieler_gelb.png` |
| Grün | #7CC242 | `figuren_atlas_spieler_gruen.png` |
| Blau | #1F5FD6 | `figuren_atlas_spieler_blau.png` |
| Lila | #8E44C9 | `figuren_atlas_spieler_lila.png` |

```js
const tl = new THREE.TextureLoader();
async function loadAtlas(farbe) {
  const t = await tl.loadAsync(BASE + `texturen/figuren_atlas_spieler_${farbe}.png`);
  t.flipY = false;                       // glTF-Konvention, sonst falsche Zellen!
  return t;                              // toonify setzt sRGB + Nearest
}
toonify(spieler.root, { gradient: TOON_GRADIENT, atlas: await loadAtlas('gruen') });
```

Alternativ ohne Extra-Dateien: den Default-Atlas in ein Canvas zeichnen, das Pixel (0,0) bzw. die Zelle 0 (8×8 px oben links) mit der Spielerfarbe füllen und als `CanvasTexture` (`flipY = false`) verwenden.

NPCs nutzen Zelle 0 nicht, also bleibt `figuren_atlas.png` für sie neutral.

## 6. Props an Sockets

Sockets (Bones): `Socket_Hand_R`, `Socket_Hand_L`, `Socket_Head`, `Socket_Back`. Kiste und Tablett hängen an `DEF-spine003`, die passende Zuordnung steht in `LISTE.md`. Die Props in `Handprops.glb` sind im Rest-Raum der Figur modelliert, ihr Ursprung ist der Griffpunkt. Deshalb das Skelett kurz in die Rest-Pose bringen, dann `attach`:

```js
const props = (await loader.loadAsync(BASE + 'Handprops.glb')).scene;
export function attachProp(figRoot, propName, socketName) {
  const prop = props.getObjectByName(propName).clone(true);
  let skel = null; figRoot.traverse(o => { if (o.isSkinnedMesh && !skel) skel = o.skeleton; });
  const saved = skel.bones.map(b => [b.position.clone(), b.quaternion.clone(), b.scale.clone()]);
  skel.pose(); figRoot.add(prop); figRoot.updateMatrixWorld(true);
  figRoot.getObjectByName(socketName).attach(prop);
  skel.bones.forEach((b, i) => { b.position.copy(saved[i][0]); b.quaternion.copy(saved[i][1]); b.scale.copy(saved[i][2]); });
  toonify(prop, { gradient: TOON_GRADIENT, outline: 0.008 });
  return prop;
}
attachProp(koch.root, 'Prop_Kochloeffel', 'Socket_Hand_R'); koch.play('Stir');
```

Props mit `prop.visible` ein- und ausblenden, zum Beispiel die Handschellen bei `Cuff` erst ab ca. 40 % der Cliplänge. `Prop_Tastatur` ist ein Tisch-Prop und wird nicht an die Hand gehängt.

## 7. Baukasten (eigene Kombinationen)

`Figur_Baukasten.glb` enthält 67 Skinned Meshes auf **einem** Rig: `Kopf_*`, `Haar_*`, `Hut_*`, `Brille_*`, `Koerper_*`. Welche Teile die 24 fertigen Figuren nutzen, steht in `LISTE.md`.

```js
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const kit = await loader.loadAsync(BASE + 'Figur_Baukasten.glb');
function buildFromKit(partNames, { merge = true } = {}) {
  const root = SkeletonUtils.clone(kit.scene);
  const parts = []; root.traverse(o => { if (o.isSkinnedMesh) (partNames.includes(o.name) ? parts : []).push(o); });
  root.traverse(o => { if (o.isSkinnedMesh) o.visible = partNames.includes(o.name); });
  if (merge) {                         // -> 1 Draw-Call wie die fertigen Figuren
    const g = mergeGeometries(parts.map(p => p.geometry.clone()), false);
    const m = new THREE.SkinnedMesh(g, parts[0].material);
    m.bind(parts[0].skeleton, parts[0].bindMatrix);
    parts[0].parent.add(m);
    root.traverse(o => { if (o.isSkinnedMesh && o !== m) o.visible = false; });
    // ungenutzte Teile danach entfernen (o.removeFromParent()), um Speicher zu sparen
  }
  return root;
}
```

Hinweise:
- Für Kopfbedeckungen die Haar-Variante `_unterHut` verwenden, sonst schaut das Haar durch den Hut.
- Umfärben ohne neue Textur: In der UV-Map liegen alle Vertices exakt auf Zellmitten. Zelle i ↔ (u, v) = ((i%8+0,5)/8, (⌊i/8⌋+0,5)/8). Um eine Farbe zu tauschen, verschiebt man die UVs aller Vertices mit `uv ≈ Zelle a` auf `Zelle b` (Palette siehe `LISTE.md`). Damit lassen sich beliebig viele Passanten-Varianten bauen.

## 8. Performance (Ziel: 16 animierte Figuren pro Zone, Vega-7-iGPU)

- LOD0 hat 3,8–5,1k Dreiecke, LOD1 1,9–2,8k. Die Outline verdoppelt die Vertex-Arbeit, weil die Geometrie ein zweites Mal gezeichnet wird. Damit liegen 16 Figuren bei ca. 160k (LOD0) bzw. ca. 85k (LOD1) skinned Dreiecken pro Frame.
- Empfehlung: Spielfiguren und Figuren im Fokus auf LOD0, NPCs ab ca. 12 m Kameradistanz auf LOD1. Auf der Stufe „Mittel“ alle NPCs auf LOD1. Auf „Niedrig“ bei NPCs `outline: 0` (dann 1 statt 2 Draw-Calls pro Figur).
- Jede Figur hat 27 Bones, also eine kleine Bone-Textur. Alle Mixer laufen problemlos auf der CPU. Nicht sichtbare Zonen sollten `mixer.update` überspringen.
- Gleiche Figur mehrfach: per `SkeletonUtils.clone` aus dem Cache. Die Geometrie bleibt geteilt, nur das Skelett wird kopiert.

## 9. Bekannte Grenzen

- Chibi-Arme sind kurz: Bei hohen Armposen (Victory, Hammer) schneiden die Hände leicht in den Hut/Kopf, aus Spielkamera-Distanz unauffällig.
- Kleine Props (Stift, Pipette) sind aus Spielkamera-Distanz kaum sichtbar, ihre Ausrichtung in der Hand ist nur angenähert.
- `KneelFix`, `Sit`, `StandUp` sind One-Shots mit Translation in der Hüfte: Die Figur endet am selben Pivot.
- Die GLBs enthalten keine Clips. Wer eine Figur einzeln in einem Viewer animiert sehen will, öffnet `BR_Animationen.glb`.
