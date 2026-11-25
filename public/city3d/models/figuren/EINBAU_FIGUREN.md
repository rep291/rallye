# EINBAU – Figuren & NPCs in Three.js (Stil C)

**Stand v3 (25.11.2026, Europe/Vienna):** Alle Hand-Props haben jetzt einen **Grip-Pivot**: Ursprung = Griffpunkt, Geometrie schon im Raum ihres Sockets. Der Einbau ist damit nur noch `socket.add(prop)` ohne Offset (§6, **`attachProp` bitte ersetzen**; Signatur bleibt gleich). Neu: `Prop_Heugabel` mit den Clips `Pitchfork`/`PitchforkIdle` (§6b), `Prop_Laptop_zu` mit `CarryLaptopWalk`, die Clips `Saw`, `Paint`, `Water` und die Achsen-Tabelle `prop_grips.json`. Die Arbeits-Clips Hammer, Chop, Stir, Weld, Haircut, Pipette, Clipboard, KneelFix und CrouchIdle sind mit korrekter Handrotation neu gebacken. Alle Namen aus v1/v2 gelten weiter.

**Stand v2 (25.11.2026, Europe/Vienna):** Handschellen an beiden Handgelenken (§3a), 12 neue Berufsfiguren (Mapping Beruf → Figur in `LISTE.md`), Props Balken/Reifen + 9 Berufs-Props, neue Clips `PrisonerCuff`, `CarryShoulder`, `CarryShoulderWalk`; Victory/Hammer/Wave ohne Durchdringung von Kopf und Hut. Alle Datei-, Clip-, Bone- und Prop-Namen aus v1 gelten weiter.

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
const ONESHOT = new Set(['Sit','StandUp','PickUp','Interact','KneelFix','Cuff','PrisonerCuff']);
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
- Festnahme (§15): siehe §3a.
- Arbeit (§13): siehe Tabelle „empfohlene Clips“ in `LISTE.md`. Alle Arbeits-Clips loopen außer `KneelFix` (5,2 s inkl. Hinknien und Aufstehen) und `PickUp`/`Interact`.
- `LieIdle` (Patient): Die Figur liegt auf dem Rücken, Kopf Richtung −Z, Rücken ca. 0,14 m über dem Pivot. Root auf die Bettoberkante minus 0,14 m setzen.

## 3a. Festnahme mit Handschellen (§15)

Die Handschellen trägt **der Gefangene**: zwei Schellen mit Kette an beiden Handgelenken. Kein Prop mehr in der Polizistenhand.

```js
// Spieler steht 0,35 m (× Maßstab) vor dem Polizisten, beide mit Blick in dieselbe Richtung
const cuffs = attachProp(spieler.root, 'Prop_Handschellen', 'Socket_Hand_R');  // Set: rechte + linke Schelle + Kette
cuffs.visible = false;
polizist.play('Cuff');                                   // 1,0 s, Hände an die Handgelenke des Spielers
spieler.play('PrisonerCuff', { onDone: () => spieler.play('PrisonerIdle') });   // gleich lang wie Cuff
setTimeout(() => { cuffs.visible = true; /* Klick-Sound */ }, 500);              // Klick bei 50 %
// danach: polizist.play('Lead') + spieler.play('PrisonerWalk'), in der Zelle spieler.play('PrisonerSit')
```

- In `PrisonerCuff` (ab 50 %), `PrisonerIdle`, `PrisonerWalk` und `PrisonerSit` sind beide Handgelenke fest relativ zur Lende gehalten (0,14 m auseinander, Daumen innen). Deshalb sitzt die linke Schelle des starren Sets genau am linken Handgelenk, ohne Code pro Frame.
- Nach der Festnahme: `cuffs.removeFromParent()` oder `cuffs.visible = false`.
- **Eigene Posen** (Handgelenke bewegen sich gegeneinander): Einzelteile verwenden und die Kette pro Frame spannen:

```js
const sL = attachProp(fig.root, 'Prop_Handschelle_L', 'Socket_Hand_L');
const sR = attachProp(fig.root, 'Prop_Handschelle_R', 'Socket_Hand_R');
const kette = props.getObjectByName('Prop_Handschellen_Kette').clone(true);
toonify(kette, { gradient: TOON_GRADIENT, outline: 0.006 }); scene.add(kette);
const aL = sL.getObjectByName('Anker_L'), aR = sR.getObjectByName('Anker_R');
const pL = new THREE.Vector3(), pR = new THREE.Vector3(), s = new THREE.Vector3();
function updateKette() {                    // nach mixer.update(dt) aufrufen
  aL.getWorldPosition(pL); aR.getWorldPosition(pR); fig.root.getWorldScale(s);
  kette.position.copy(pR); kette.lookAt(pL);                 // Kette liegt entlang lokal +Z
  kette.scale.set(s.x, s.x, pR.distanceTo(pL) / 0.03);       // Ruhelänge 0,03 m
}
```

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

## 6. Props an Sockets (v3: attach ohne Offset)

Sockets (Bones): `Socket_Hand_R`, `Socket_Hand_L`, `Socket_Head`, `Socket_Back`. Kiste, Tablett, Balken und Reifen hängen an `DEF-spine003`. Die Zuordnung steht in `LISTE.md` und maschinenlesbar in `prop_grips.json` (`socket_three` ist der von three gesäuberte Name).

Seit v3 hat jeder Prop-Knoten in `Handprops.glb` eine Identitäts-Transformation. Seine Geometrie liegt bereits im lokalen Raum des Sockets, der Ursprung ist der Griffpunkt (Mitte der Faust). Deshalb genügt `add`, ohne Rest-Pose und ohne Offset:

```js
const props = (await loader.loadAsync(BASE + 'Handprops.glb')).scene;
export function attachProp(figRoot, propName, socketName) {          // gleiche Signatur wie v1/v2
  const prop = props.getObjectByName(propName).clone(true);
  figRoot.getObjectByName(socketName.replace(/\./g, '')).add(prop);  // 'DEF-spine.003' oder 'DEF-spine003'
  toonify(prop, { gradient: TOON_GRADIENT, outline: 0.008 });
  return prop;
}
attachProp(koch.root, 'Prop_Kochloeffel', 'Socket_Hand_R'); koch.play('Stir');
```

**Wichtig:** Die alte `attachProp`-Variante aus v1/v2 (mit `skel.pose()` und `attach`) passt nicht mehr zu dieser `Handprops.glb`, denn die Props würden an den Füßen landen. Bitte die Funktion durch die obige ersetzen. Wer die alte Funktion behalten muss, findet in `prop_grips.json` pro Prop `legacy_restmatrix_socket_lokal`.

Achsen im Lokalraum von `Socket_Hand_R`/`Socket_Hand_L`, für alle Hand-Props gleich: **+Z = Daumenseite** (Werkzeugkopf, Klinge, Tülle, Zinken), **−X (R) / +X (L) = Handfläche** (aufgelegte Props wie Klemmbrett und Messgerät), **+Y = Fingerrichtung**. Wer eigene Props baut, modelliert sie so mit dem Griff im Ursprung.

Props mit `prop.visible` ein- und ausblenden. `Prop_Tastatur` und `Prop_Laptop` (aufgeklappt) sind Tisch-Props und werden nicht an die Hand gehängt. Der Ursprung ist der Standpunkt, also direkt auf die Tischplatte setzen.

Neue Trage-Props (v2), beide an der Brust (`DEF-spine003`), so wie Kiste und Tablett:

```js
attachProp(bauarbeiter.root, 'Prop_Balken', 'DEF-spine003'); bauarbeiter.play('CarryShoulderWalk');  // Balken auf rechter Schulter
attachProp(mechanikerin.root, 'Prop_Reifen', 'DEF-spine003'); mechanikerin.play('CarryWalk');        // Reifen mit beiden Händen vorn
```

Der Balken gehört zu `CarryShoulder`/`CarryShoulderWalk`: Dort stützt die rechte Hand den Balken vorne, die linke schwingt normal. In `CarryWalk` wären beide Hände vor dem Bauch und der Balken läge frei auf der Schulter. Der Reifen passt zu `CarryIdle`/`CarryWalk`, beide Hände greifen die Flanken.

Weitere Berufs-Props (v2): `Prop_Brot`, `Prop_Saege`, `Prop_Kelle`, `Prop_Giesskanne`, `Prop_Farbroller` (rechte Hand), `Prop_Messgeraet`, `Prop_Feuerloescher`, `Prop_Ball`, `Prop_Einkaufskorb` (linke Hand). Die Zuordnung steht in `LISTE.md`.

### 6a. Arbeits-Clips mit Prop (v3)

| Figur | Clip | Props |
|---|---|---|
| NPC_Tischler | `Hammer`, `Saw` | `Prop_Hammer` (R), `Prop_Saege` (R) |
| NPC_Koch | `Stir`, `Chop` | `Prop_Kochloeffel` (R), `Prop_Messer` (R) |
| NPC_Baecker | `Chop` | `Prop_Messer` (R) |
| NPC_Schlosser | `Weld` | `Prop_Schweissbrenner` (R) |
| NPC_Friseurin | `Haircut` | `Prop_Schere` (R) + `Prop_Kamm` (L) |
| NPC_Laborantin | `Pipette` | `Prop_Pipette` (R) + `Prop_Reagenzglas` (L) |
| NPC_Lagerist, NPC_Aerztin | `Clipboard` | `Prop_Klemmbrett` (L) + `Prop_Stift` (R) |
| NPC_Elektriker | `Clipboard` oder `Interact` | `Prop_Messgeraet` (L) (+ `Prop_Stift` (R) bei Clipboard) |
| NPC_Mechanikerin | `KneelFix` | `Prop_Schraubenschluessel` (R) |
| NPC_Maurer | `CrouchIdle` | `Prop_Kelle` (R) |
| NPC_Maler | `Paint` | `Prop_Farbroller` (R) |
| NPC_Gaertnerin | `Water` | `Prop_Giesskanne` (R) |
| NPC_IT | `CarryLaptopWalk` | `Prop_Laptop_zu` (L) |
| NPC_Landwirt | `Pitchfork`, `PitchforkIdle` | `Prop_Heugabel` (R) |

Props in anderen Clips (z. B. Hammer in `Idle`) sitzen ebenfalls korrekt in der Faust, zeigen dann aber in die Richtung, in die die UAL-Hand gerade zeigt.

### 6b. Heugabel (Landwirt)

```js
const gabel = attachProp(landwirt.root, 'Prop_Heugabel', 'Socket_Hand_R');   // nur an die rechte Hand
landwirt.play('Pitchfork');        // Arbeitsschleife: Heu aufnehmen, anheben, seitlich werfen (2,0 s)
// Pause: landwirt.play('PitchforkIdle')  – Gabel senkrecht rechts, Stielende am Boden, Zinken oben
```

Die linke Hand greift im Clip 0,29 m weiter hinten am Stiel. Die Gabel hängt nur an `Socket_Hand_R`, ein zweites Attach ist nicht nötig. Zinken und Hände sind über alle Frames frei von Kopf und Hüten (Strohhut geprüft). Länge 1,03 m, 416 Dreiecke.

## 7. Baukasten (eigene Kombinationen)

`Figur_Baukasten.glb` enthält 98 Skinned Meshes auf **einem** Rig: `Kopf_*`, `Haar_*`, `Hut_*` (u. a. Feuerwehrhelm, Bäckermütze, Strohhut, Zimmermannshut, Bommelmütze), `Brille_*`, `Zubehoer_*` (Headset, Bleistift, Mehl), `Koerper_*`. Welche Teile die 36 fertigen Figuren nutzen, steht in `LISTE.md`.

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

- LOD0 hat 3,8–5,3k Dreiecke, LOD1 1,9–3,2k. Die Outline verdoppelt die Vertex-Arbeit, weil die Geometrie ein zweites Mal gezeichnet wird. Damit liegen 16 Figuren bei ca. 160k (LOD0) bzw. ca. 85k (LOD1) skinned Dreiecken pro Frame. Die Props kosten zusätzlich je 20–590 Dreiecke.
- Empfehlung: Spielfiguren und Figuren im Fokus auf LOD0, NPCs ab ca. 12 m Kameradistanz auf LOD1. Auf der Stufe „Mittel“ alle NPCs auf LOD1. Auf „Niedrig“ bei NPCs `outline: 0` (dann 1 statt 2 Draw-Calls pro Figur).
- Jede Figur hat 27 Bones, also eine kleine Bone-Textur. Alle Mixer laufen problemlos auf der CPU. Nicht sichtbare Zonen sollten `mixer.update` überspringen.
- Gleiche Figur mehrfach: per `SkeletonUtils.clone` aus dem Cache. Die Geometrie bleibt geteilt, nur das Skelett wird kopiert.

## 9. Bekannte Grenzen

- Die Chibi-Arme sind kurz. Victory (V-Pose), Hammer (Ausholen seitlich) und Wave (Schulterhöhe) sind in v2 so gestellt, dass Hände und Hammerkopf weder Kopf noch Hut berühren. Geprüft ist das per Skript über alle Frames, mit und ohne Hut, Vorher/Nachher-Bild in `vorschau/vergleich_victory_hammer.png`. Haircut berührt das Haar-Volumen nur am Rand.
- `Prop_Handschellen` passt nur zu den Prisoner-Clips. In anderen Clips die Einzelteile mit gespannter Kette nehmen (§3a).
- Kleine Props (Stift, Pipette) sind aus Spielkamera-Distanz kaum sichtbar. Seit v3 sitzen sie per Grip-Pivot in der Faust und sind in ihren Arbeits-Clips ausgerichtet. Das Rig hat keine Finger-Bones, die Faust ist modelliert, Finger schließen sich also nicht um den Griff.
- Die Griffe laufen quer durch die Faust. Damit das Handgelenk nicht unnatürlich abknickt, ist die Werkzeugachse in den Clips auf höchstens ca. 30° Abweichung vom Unterarm begrenzt. Messer, Säge und Hammer stehen dadurch etwas steiler als „ideal“.
- `KneelFix`, `Sit`, `StandUp` sind One-Shots mit Translation in der Hüfte: Die Figur endet am selben Pivot.
- Die GLBs enthalten keine Clips. Wer eine Figur einzeln in einem Viewer animiert sehen will, öffnet `BR_Animationen.glb`.
