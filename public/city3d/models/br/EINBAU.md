# EINBAU – BERUFE-RALLYE 3D-Modelle in Three.js

Für Spielemacher, Branch `cursor/3d-stadt-86c9`. Stand 25.11.2026 (Europe/Vienna). Verbindlich bleiben `../3d_stil/STYLEGUIDE_3D.md` und `Feldliste_3D.csv`.

## 1. Konventionen aller GLBs

- glTF 2.0 Binary, **Y-up, 1 Einheit = 1 m, Pivot unten mittig** (Boden = y 0). Validator: 0 Fehler, 0 Warnungen.
- **Gleiches Material überall:** `BR_Atlas`. Das ist die Basistextur `BR_Atlas_1024.png` (in jeder Datei eingebettet) × `COLOR_0` (Vertex-Color, linear), `alphaMode MASK` (0,5) für die Decals.
- Ein Kind pro Mesh: `<Name>_Outline` mit Material `BR_Outline` (`KHR_materials_unlit`, #2E2E33). Das ist eine fertige **Inverted Hull**: Wicklung umgedreht und gemittelte Normalen, also kein Shader-Trick nötig.
- Kamera-Seite der Betriebe ist **+Z** (niedrige, aufgeschnittene Vorderwand, Schild, Markise). Die Wegrichtung durch die Box ist **+X**: `Weg_Eingang` (−X) → `Weg_Ausgang` (+X).
- **Empties** (glTF-Knoten ohne Mesh) geben Positionen und Blickrichtung vor. Die Blickrichtung ist die **lokale −Z-Achse** des Knotens. Quaternius-Figuren schauen nach +Z, also gilt `figur.quaternion.copy(empty.getWorldQuaternion(q)).multiply(Y180)`.

## 2. Laden und Material tauschen (ein Atlas, MeshToonMaterial)

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const loader = new GLTFLoader();
const texLoader = new THREE.TextureLoader();

// Eine geteilte Atlas-Textur statt 48 eingebetteter Kopien
const atlas = texLoader.load('models/br/texturen/BR_Atlas_1024.png');
atlas.colorSpace = THREE.SRGBColorSpace;
atlas.flipY = false;                     // glTF-UV-Konvention!
atlas.anisotropy = 4;

// Gradient-Map: 2 Stufen (Figuren/Gebäude), optional 3 Stufen für Innenräume
const gradient = texLoader.load('models/br/texturen/BR_Gradient_2stufig.png');
gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
gradient.generateMipmaps = false;

const MAT = {
  atlas: new THREE.MeshToonMaterial({ map: atlas, vertexColors: true, gradientMap: gradient, alphaTest: 0.5 }),
  outline: new THREE.MeshBasicMaterial({ color: 0x2E2E33 }),   // FrontSide! Die Hull ist schon umgedreht.
};

function prepare(root) {
  root.traverse(o => {
    if (!o.isMesh) return;
    const isOutline = o.material.name === 'BR_Outline';
    o.material.dispose?.();
    o.material = isOutline ? MAT.outline : MAT.atlas;
    o.castShadow = o.receiveShadow = false;      // Blob-Schatten laut Styleguide
    if (isOutline) o.userData.outline = true;
  });
  return root;
}
const gltf = await loader.loadAsync('models/br/BR_Box_Kueche.glb');
const kueche = prepare(gltf.scene);
```

- **Licht:** 1 `DirectionalLight` (oben-vorn, Intensität ca. 2,2) plus `HemisphereLight` (Himmel #E4F1FA, Boden #8FCF5A, 0,9). Keine Shadow-Maps.
- **Wichtig:** Kein `side: BackSide` für die Outline, sonst ist sie innen. Die Dicke ist gebacken: Gebäude 0,04, Props 0,025–0,03, Vegetation 0,035, Felder 0,03, Wolken 0,06.
- **Quality Low:** Alle `userData.outline` von Gras, Blumen und kleinen Props auf `visible = false` setzen. Gras und Blumen haben ohnehin keine Hull.

## 3. Betriebs-Boxen (`BR_Box_*.glb`)

- Nennmaß **9,6 × 6,6 m**, Rückwand und Seiten 2,6 m, Vorderwand 1,25 m (aufgeschnitten, damit man NPCs sieht). Die Baustelle ist ein offener Bauzaun mit 1,2 m.
- Türöffnungen in beiden Seitenwänden: 2,3 m breit, 2,15 m hoch, mittig (z = 0). Der **freie Korridor ist |z| < 1,0 m**, dort liegen die Felder (TILE_Y 0,36 über dem Boden). Der Boden der Box liegt bei y 0,06.
- **Platzierung:** Die Box gehört auf ein **gerades** Wegstück von ca. 6 Feldern, gedreht nach `atan2` des Wegs. In X darf sie auf 0,8–1,25 skaliert werden (`(span + 2,6) / 9,6`). In `layout.js` liegt die Autowerkstatt (90–93) aktuell auf einem Knick, die Felder laufen dort durch die Wand. Bitte den Weg dort begradigen oder die Box verschieben (siehe `vorschau/_Szene_Zone4.png`).
- **Statisch:** 1 Mesh + 1 Outline pro Box, alles gemergt. **Animierbar:** einzelne Knoten `Prop_*` mit eigener Outline.

| Box | Props (Knoten) | Vorschlag Animation | Stationen (Empties) | VFX-Empties |
|---|---|---|---|---|
| Schlosserei | Prop_Hammer, Prop_Werkstueck | Hammer rotation.x ±40° synchron zu `Punch` | Station_Amboss, _Werkbank, _Regal, _Ablage | VFX_Funken, VFX_Feuer |
| Küche | Prop_Topf, Prop_Schneidebrett, Prop_Messer | Topf rotation.y ±8° Wackeln, Messer y-Hüpfer 0,05 | Station_Herd, _Brett, _Theke, _Kuehlschrank | VFX_Dampf |
| Labor | Prop_Blubberkolben, Prop_Pipette, Prop_Probe | Kolben scale.y 1↔1,06 Puls, Pipette dippen | Station_Tisch, _Geraet, _Schreibtisch, _Abzug | VFX_Blubber |
| Lager | Prop_Kiste, Prop_Klemmbrett | Kiste an rechte Hand (Walk carrying) | Station_Kiste, _Palette, _Regal_L/_R | – |
| Büro | Prop_Tastatur, Prop_Papier | Papier aus Drucker schieben (z +0,2) | Station_Schreibtisch_Sitz, _Schreibtisch2_Sitz, _Drucker, _Board | – |
| Friseur | Prop_Schere, Prop_Foehn | Schere an Hand, rotation.z ±15° | Station_Stylist_1/2, Kunde_Sitz_1/2, Warten_Sitz, Station_Empfang | – |
| Baustelle | Prop_Balken, Prop_Hammer, Prop_Kranlast | Kranlast y ±0,4 auf/ab (Loop 8 s), Balken tragen | Station_Geruest, _Balken_Auf, _Balken_Ab | VFX_Funken |
| Krankenhaus | Prop_Tablett, Prop_Klemmbrett | Tablett an Hand | Bett_1–3, Patient_1–3 (Sitz-/Liegepose auf dem Bett), Station_Tresen, _Schrank | – |
| Werkstatt | Prop_Reifen, Prop_Schrauber | Reifen tragen, Schrauber rotation.z drehen | Station_Haube, _Montage, _Reifenstapel, _Werkbank | VFX_Funken |

Stationen liegen bei y 0,06 auf dem Box-Boden, Sitz-Empties auf Sitzhöhe. Die VFX nutzen `texturen/BR_VFX_4x1.png` (Funken, Dampf, Blubber, Staub, je 128 px) als `Sprite`/`Points` mit einem Material.

## 4. Festnahme

- `BR_Zelle.glb`, 3,4 × 2,5 m: `Platz_1`–`Platz_6` (2×3, Abstand 0,72 / 0,7 wie `slotsAt()` in layout.js), `Tuer` (Pivot am Scharnier, **rotation.y 0 → −1,75 rad** in 0,4 s), `Tuer_Innen`, `Tuer_Aussen`, `Polizist_Idle`, `Auto_Park`.
- `BR_Polizeiauto.glb` (KayKit-Basis, 4,1 m) mit `Fahrer`. Die Fahrt ist eine reine Transform-Animation auf festem Pfad.
- `BR_Handschellen.glb`: Knoten `Schelle_L`, `Schelle_R`, `Kette`. Die Schellen an die Hand-Bones hängen (Quaternius: `hand.L`/`hand.R` bzw. `Wrist`), Kette mittig zwischen beide Hände setzen.

## 5. Füllszenen

- **Park** (`BR_Park.glb`, ca. 16 × 13 m): Ring-Weg, Brunnen (Knoten `Wasser`, UV-Scroll oder rotation.y langsam), Teich mit 2 Enten, 3 Bänke, Beete, Hecken, Tor, Picknickdecke, `Ball` (Spiel-Loop). Empties: `Sitz_1`–`6`, `Spazierweg_00`–`11` (geschlossener Loop), `Spiel_1`/`2`, `Baum_1`–`9` (dort Instanzen von `BR_Baum_*` setzen).
- **Bahnhof** (`BR_Bahnhof.glb`, ca. 33 × 13 m in Originalgröße): Halle 11 × 7 × 5,4 m mit Uhr, Schalter, Plakaten, Bahnsteig 26 m mit Dach, Bänken, Automat, Gleis 30 m mit Prellbock. Für Zone 4 **skaliert ×0,6–0,7** einsetzen (Testszene ×0,62). Empties: `Zug_Lok`, `Zug_Wagen_1`–`5`, `Tuer_1`–`5` (Despawn-Punkte), `Warten_1`–`4`, `Einsteiger_Start_1`–`3`, `Zug_Einfahrt_Start`, `Zug_Ausfahrt_Ende`.
- **Zug:** `BR_Zug_Lok.glb` + 5 Wagen `BR_Zug_Wagen_A`–`E` (blau, grün, gelb, lila, orange), je 4,0 m, Abstand 4,4 m. Eine Gruppe, 12–16 s Loop auf x zwischen `Zug_Einfahrt_Start` → Halt (Wagen-Empties) → `Zug_Ausfahrt_Ende`.

## 6. Felder (Instancing)

Pro Typ eine Datei: `BR_Feld_Normal`, `_Aktion`, `_Frage`, `_Rutsche_Start`, `_Rutsche_Ziel`, `_Finanzpolizei`, `_Start`, `_Ziel`. Normale Kacheln sind 1,5 × 1,5 × 0,14 m, Start und Ziel 1,74 m.

- `BR_Feld_Normal` und `BR_Feld_Rutsche_Ziel` sind **weiß bzw. grau**. Die Farbe aus dem Zyklus `#E6197E #F7931E #FFD23F #7CC242 #1F5FD6 #8E44C9` kommt per `setColorAt` (instanceColor multipliziert die Vertex-Color, die Seiten werden automatisch dunkler).
- Empty `Nummer` (Mitte bzw. unten rechts) und bei Rutschen `Zielnummer`: dort sitzt das Nummern-Quad.

```js
// Pro Typ: Mesh und Outline als zwei InstancedMesh mit denselben Matrizen
function instanced(gltfScene, matrices, colors) {
  const out = [];
  gltfScene.traverse(o => {
    if (!o.isMesh) return;
    const im = new THREE.InstancedMesh(o.geometry, o.material.name === 'BR_Outline' ? MAT.outline : MAT.atlas, matrices.length);
    matrices.forEach((m, i) => im.setMatrixAt(i, m.clone().multiply(o.matrixWorld)));
    if (colors && o.material.name !== 'BR_Outline') colors.forEach((c, i) => im.setColorAt(i, c));
    out.push(im);
  });
  return out;   // 2 Draw Calls pro Typ, egal wie viele Felder
}
```

**Feldnummern:** `BR_Feld_Nummer.glb` ist ein 0,9 m-Quad mit UV auf Zelle „0“ von `BR_Feldnummern_1024.png` (10 Spalten × 11 Zeilen, Zelle 0,1 × 93/1024). Pro Zone die 25 Quads zu **einer** Geometrie mergen und die UVs verschieben:

```js
function numberUV(n) {          // n = 0..100
  const col = n % 10, row = Math.floor(n / 10);
  return { du: col * 0.1, dv: -row * (93 / 1024) };   // auf alle 4 UVs addieren (flipY=false: v nach unten)
}
```

Material: `MeshBasicMaterial({ map: nummernTex, transparent: true, alphaTest: 0.4 })`, 1 Draw Call pro Zone. Für kleinere Nummern auf Sonderfeldern das Quad auf 0,5 skalieren. Ankunftspfeil „von Feld Y“: `BR_Feld_Rutsche_Ziel` hat den Pfeil oben rechts. Die Zahl Y kommt als zweites Nummern-Quad an `Nummer`.

## 7. Vegetation, Deko, Himmel (Instancing)

| Typ | Dateien | Stück/Zone (Styleguide) | Tris/Instanz (+Outline) |
|---|---|---|---|
| Bäume | BR_Baum_A/B/C | 40–60 | 180 / 144 / 78 (+gleich viel) |
| Büsche | BR_Busch_A/B | 30–40 | 72 (+72) |
| Blumen | BR_Blumen_A/B/C | 50–80 | 30 (ohne Outline) |
| Gras | BR_Gras_A/B | 80–120 | 15 / 18 (ohne Outline) |
| Wolken | BR_Wolke_A/B/C | 6–10 | 144–240 (+gleich viel), 1,5–2× skalieren |
| Bank, Laterne, Haftnotiz | BR_Bank (Sitz_1/2), BR_Laterne (Licht), BR_Haftnotiz (weiß, per Instanzfarbe Pink/Gelb/Blau/Mint) | 2–8 | 108 / 66 / 4 |
| Autos | BR_Auto_Limousine/Kombi/Klein | 2–4 | ca. 1.200 (+gleich viel) |

Zufällige rotation.y und Skalierung 0,8–1,2 gegen Wiederholung einsetzen. Für den Wiesenboden `BR_Buntstift_512.png` (RepeatWrapping, ca. 12×9 pro Seite) × #8FCF5A, für Himmel und Seitenrand `BR_Papier_512.png`.

## 8. Budget (gemessen an den Testszenen)

- `vorschau/_Szene_Zone1.png`: Zone 1 komplett mit Vegetation, **ca. 55k Dreiecke inklusive Outline, 55 Draw Calls mit Instancing** (400 ohne).
- `vorschau/_Szene_Zone4.png`: Zone 4 mit Bahnhof, Zug, Zelle, **ca. 41k Dreiecke, 63 Draw Calls mit Instancing**.
- Ziel laut Styleguide: < 120 Draws, 80–150k Dreiecke. Es bleiben ca. 50 Draws und rund 90k Dreiecke für Figuren, NPCs, VFX und UI.
- Ohne Instancing (jedes Objekt einzeln) wird das Ziel klar gerissen. Vegetation, Felder, Wolken und Autos **müssen** instanced werden.
- Alle GLBs betten denselben Atlas ein (ca. 370 KB je Datei). Mit dem Material-Tausch aus Abschnitt 2 liegt nur **eine** Textur im VRAM. Optional `gltf-transform dedup` bzw. `gltf-transform copy --texture-compress webp`, falls die Download-Größe stört (gesamt ca. 22 MB, ohne Atlas ca. 4 MB).

## 9. Bekannte Grenzen

- Die Vorschaubilder sind Cycles-Renderings mit Toon-Näherung (2 Stufen und Hull). In Three.js weichen Helligkeit und Lichtwinkel leicht ab.
- Diese Lieferung enthält keine Figuren und keine Arbeits-Clips. Der Ordner `figuren/` kommt aus einem parallelen Auftrag und ist hier nicht dokumentiert. Die Stationen und Props oben passen zu `Idle`/`Punch`/`PickUp`/`SitDown` (Styleguide §13).
