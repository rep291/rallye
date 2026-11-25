# BERUFE-RALLYE 3D – Modell-Liste

Stand 25.11.2026 (Europe/Vienna). Alle Dateien glTF-Binary (.glb), Y-up, 1 Einheit = 1 m, Pivot unten mittig. Geprüft mit Khronos glTF-Validator: 0 Fehler, 0 Warnungen.

**Spalten:** Dreiecke = sichtbares Mesh (inkl. Props), Outline = Inverted-Hull-Kinder (`*_Outline`, nur auf Wunsch rendern), Draws = Primitives in der Datei ohne Instancing, Mat. = Materialien (immer `BR_Atlas` + ggf. `BR_Outline`).

Gesamt: 48 Modelle, 44339 Dreiecke (+40982 Outline), 22.6 MB.

## Betriebs-Boxen (Stil B)

| Datei | Zweck | Dreiecke | Outline | Draws | Mat. | KB | Lizenz / Quelle | Animierbare Knoten | Empties |
|---|---|---|---|---|---|---|---|---|---|
| `BR_Box_Baustelle.glb` | Baustelle (niedriger Bauzaun), Gerüst, Ziegelwand, Papier-Kran; Props Balken/Hammer/Kranlast | 1872 | 1658 | 8 | BR_Outline, BR_Atlas | 570 | eigen (CC0) | Prop_Balken, Prop_Hammer, Prop_Kranlast | Station_Balken_Ab, Station_Balken_Auf, Station_Geruest, VFX_Funken, Weg_Ausgang, Weg_Eingang |
| `BR_Box_Buero.glb` | Büro-Box: 2 Arbeitsplätze, Drucker, Board; Props Tastatur/Papier | 4470 | 4302 | 6 | BR_Outline, BR_Atlas | 1007 | eigen (CC0) + KayKit Furniture Bits (CC0) | Prop_Papier, Prop_Tastatur | Station_Board, Station_Drucker, Station_Schreibtisch2_Sitz, Station_Schreibtisch_Sitz, Weg_Ausgang, Weg_Eingang |
| `BR_Box_Friseur.glb` | Friseursalon-Box mit Markise; Props Schere/Föhn | 3050 | 2882 | 6 | BR_Outline, BR_Atlas | 754 | eigen (CC0) + KayKit Furniture Bits (CC0) | Prop_Foehn, Prop_Schere | Kunde_Sitz_1, Kunde_Sitz_2, Station_Empfang, Station_Stylist_1, Station_Stylist_2, Warten_Sitz, Weg_Ausgang, Weg_Eingang |
| `BR_Box_Krankenhaus.glb` | Krankenhaus-Box: 3 Betten, Tresen; Props Tablett/Klemmbrett | 3300 | 3110 | 6 | BR_Outline, BR_Atlas | 829 | eigen (CC0) + KayKit Furniture Bits (CC0) | Prop_Klemmbrett, Prop_Tablett | Bett_1, Bett_2, Bett_3, Patient_1, Patient_2, Patient_3, Station_Schrank, Station_Tresen, Weg_Ausgang, Weg_Eingang |
| `BR_Box_Kueche.glb` | Restaurantküche-Box mit Markise; Props Topf/Brett/Messer | 11462 | 11292 | 8 | BR_Outline, BR_Atlas | 2065 | eigen (CC0) + KayKit Restaurant Bits (CC0) | Prop_Messer, Prop_Schneidebrett, Prop_Topf | Station_Brett, Station_Herd, Station_Kuehlschrank, Station_Theke, VFX_Dampf, Weg_Ausgang, Weg_Eingang |
| `BR_Box_Labor.glb` | Labor-Box: Labortisch, Abzug, Gerät; Props Blubberkolben/Pipette/Probe | 1958 | 1802 | 8 | BR_Outline, BR_Atlas | 590 | eigen (CC0) + KayKit Furniture Bits (CC0) | Prop_Blubberkolben, Prop_Pipette, Prop_Probe | Station_Abzug, Station_Geraet, Station_Schreibtisch, Station_Tisch, VFX_Blubber, Weg_Ausgang, Weg_Eingang |
| `BR_Box_Lager.glb` | Lager-Box: Hochregale, Paletten, Hubwagen; Props Kiste/Klemmbrett | 2068 | 1570 | 6 | BR_Outline, BR_Atlas | 608 | eigen (CC0) + KayKit Restaurant Bits (CC0) | Prop_Kiste, Prop_Klemmbrett | Station_Kiste, Station_Palette, Station_Regal_L, Station_Regal_R, Weg_Ausgang, Weg_Eingang |
| `BR_Box_Schlosserei.glb` | Schlosserei-Box: Amboss, Werkbank, Esse, Regal; Props Hammer/Werkstück | 1338 | 1162 | 6 | BR_Outline, BR_Atlas | 506 | eigen (CC0) | Prop_Hammer, Prop_Werkstueck | Station_Ablage, Station_Amboss, Station_Regal, Station_Werkbank, VFX_Feuer, VFX_Funken, Weg_Ausgang, Weg_Eingang |
| `BR_Box_Werkstatt.glb` | Autowerkstatt-Box: Hebebühne mit Auto, Werkzeugwand, Reifen; Props Reifen/Schrauber | 2564 | 2404 | 6 | BR_Outline, BR_Atlas | 685 | eigen (CC0) + KayKit City Builder Bits (CC0) | Prop_Reifen, Prop_Schrauber | Station_Haube, Station_Montage, Station_Reifenstapel, Station_Werkbank, VFX_Funken, Weg_Ausgang, Weg_Eingang |

## Festnahme

| Datei | Zweck | Dreiecke | Outline | Draws | Mat. | KB | Lizenz / Quelle | Animierbare Knoten | Empties |
|---|---|---|---|---|---|---|---|---|---|
| `BR_Handschellen.glb` | Handschellen, Knoten Schelle_L/R + Kette an Handgelenke hängen | 292 | 184 | 5 | BR_Atlas, BR_Outline | 383 | eigen (CC0) | Kette, Schelle_L, Schelle_R | – |
| `BR_Polizeiauto.glb` | Polizeiauto (Festnahme), Empty Fahrer | 1320 | 1316 | 2 | BR_Outline, BR_Atlas | 567 | KayKit City Builder Bits (CC0) + POLIZEI-Decal (eigen) | – | Fahrer |
| `BR_Zelle.glb` | Kartonzelle 6 Plätze, Tür-Knoten animierbar, Empties Platz_1..6 | 458 | 452 | 4 | BR_Outline, BR_Atlas | 419 | eigen (CC0) | Tuer | Auto_Park, Platz_1, Platz_2, Platz_3, Platz_4, Platz_5, Platz_6, Polizist_Idle, Tuer_Aussen, Tuer_Innen |

## Füllszenen

| Datei | Zweck | Dreiecke | Outline | Draws | Mat. | KB | Lizenz / Quelle | Animierbare Knoten | Empties |
|---|---|---|---|---|---|---|---|---|---|
| `BR_Bahnhof.glb` | Bahnhof Zone 4: Halle mit Uhr+Schalter, Bahnsteig 26 m, Gleis 30 m; Empties Zug/Tür/Warten | 1306 | 902 | 2 | BR_Outline, BR_Atlas | 504 | eigen (CC0) | – | Einsteiger_Start_1, Einsteiger_Start_2, Einsteiger_Start_3, Tuer_1, Tuer_2, Tuer_3, Tuer_4, Tuer_5, Warten_1, Warten_2, Warten_3, Warten_4, Zug_Ausfahrt_Ende, Zug_Einfahrt_Start, Zug_Lok, Zug_Wagen_1, Zug_Wagen_2, Zug_Wagen_3, Zug_Wagen_4, Zug_Wagen_5 |
| `BR_Park.glb` | Park Zone 2: Ring-Weg, Brunnen, 3 Bänke, Beete, Tor; Empties Sitz/Spazierweg/Spiel/Baum | 1876 | 1580 | 5 | BR_Outline, BR_Atlas | 524 | eigen (CC0) | Ball, Wasser | Baum_1, Baum_2, Baum_3, Baum_4, Baum_5, Baum_6, Baum_7, Baum_8, Baum_9, Sitz_1, Sitz_2, Sitz_3, Sitz_4, Sitz_5, Sitz_6, Spazierweg_00, Spazierweg_01, Spazierweg_02, Spazierweg_03, Spazierweg_04, Spazierweg_05, Spazierweg_06, Spazierweg_07, Spazierweg_08, Spazierweg_09, Spazierweg_10, Spazierweg_11, Spiel_1, Spiel_2 |
| `BR_Zug_Lok.glb` | Lok | 300 | 296 | 2 | BR_Outline, BR_Atlas | 394 | eigen (CC0) | – | – |
| `BR_Zug_Wagen_A.glb` | Wagen blau | 176 | 160 | 2 | BR_Outline, BR_Atlas | 384 | eigen (CC0) | – | Tuer |
| `BR_Zug_Wagen_B.glb` | Wagen grün | 176 | 160 | 2 | BR_Outline, BR_Atlas | 384 | eigen (CC0) | – | Tuer |
| `BR_Zug_Wagen_C.glb` | Wagen gelb | 176 | 160 | 2 | BR_Outline, BR_Atlas | 384 | eigen (CC0) | – | Tuer |
| `BR_Zug_Wagen_D.glb` | Wagen lila | 176 | 160 | 2 | BR_Outline, BR_Atlas | 384 | eigen (CC0) | – | Tuer |
| `BR_Zug_Wagen_E.glb` | Wagen orange | 176 | 160 | 2 | BR_Outline, BR_Atlas | 384 | eigen (CC0) | – | Tuer |

## Feldkacheln

| Datei | Zweck | Dreiecke | Outline | Draws | Mat. | KB | Lizenz / Quelle | Animierbare Knoten | Empties |
|---|---|---|---|---|---|---|---|---|---|
| `BR_Feld_Aktion.glb` | Aktionsfeld ! | 94 | 46 | 2 | BR_Outline, BR_Atlas | 376 | eigen (CC0) | – | Nummer |
| `BR_Feld_Finanzpolizei.glb` | Finanzpolizei (Akte+Lupe+6!) | 94 | 46 | 2 | BR_Outline, BR_Atlas | 376 | eigen (CC0) | – | Nummer |
| `BR_Feld_Frage.glb` | Fragefeld ? | 94 | 46 | 2 | BR_Outline, BR_Atlas | 376 | eigen (CC0) | – | Nummer |
| `BR_Feld_Normal.glb` | Feld normal, weiß -> per Instanzfarbe (Farbzyklus) tönen | 92 | 46 | 2 | BR_Outline, BR_Atlas | 376 | eigen (CC0) | – | Nummer |
| `BR_Feld_Nummer.glb` | Nummern-Quad, UV-Offset je Feld (BR_Feldnummern_1024.png) | 2 | 0 | 1 | BR_Feldnummern | 209 | eigen (CC0), Font Permanent Marker (Apache 2.0) | – | – |
| `BR_Feld_Rutsche_Start.glb` | Rutschfeld (Pfeil runter), Empties Nummer/Zielnummer | 94 | 46 | 2 | BR_Outline, BR_Atlas | 376 | eigen (CC0) | – | Nummer, Zielnummer |
| `BR_Feld_Rutsche_Ziel.glb` | Landefeld mit Ankunftspfeil, weiß -> tönen | 94 | 46 | 2 | BR_Outline, BR_Atlas | 376 | eigen (CC0) | – | Nummer |
| `BR_Feld_Start.glb` | Startfeld (1,74 m) | 94 | 46 | 2 | BR_Outline, BR_Atlas | 376 | eigen (CC0) | – | Nummer |
| `BR_Feld_Ziel.glb` | Zielfeld (1,74 m, Urlaub) | 94 | 46 | 2 | BR_Outline, BR_Atlas | 376 | eigen (CC0) | – | Nummer |

## Vegetation (instancen)

| Datei | Zweck | Dreiecke | Outline | Draws | Mat. | KB | Lizenz / Quelle | Animierbare Knoten | Empties |
|---|---|---|---|---|---|---|---|---|---|
| `BR_Baum_A.glb` | Baum rund (3 Blobs), instancen | 180 | 180 | 2 | BR_Outline, BR_Atlas | 378 | eigen (CC0) | – | – |
| `BR_Baum_B.glb` | Baum hoch-oval, instancen | 144 | 144 | 2 | BR_Outline, BR_Atlas | 376 | eigen (CC0) | – | – |
| `BR_Baum_C.glb` | Papier-Tanne (3 Kegel), instancen | 78 | 30 | 2 | BR_Outline, BR_Atlas | 373 | eigen (CC0) | – | – |
| `BR_Blumen_A.glb` | Blumen-Clump pink/weiß | 30 | 0 | 1 | BR_Atlas | 370 | eigen (CC0) | – | – |
| `BR_Blumen_B.glb` | Blumen-Clump gelb/orange | 30 | 0 | 1 | BR_Atlas | 370 | eigen (CC0) | – | – |
| `BR_Blumen_C.glb` | Blumen-Clump blau/lila | 30 | 0 | 1 | BR_Atlas | 370 | eigen (CC0) | – | – |
| `BR_Busch_A.glb` | Busch rund | 72 | 72 | 2 | BR_Outline, BR_Atlas | 371 | eigen (CC0) | – | – |
| `BR_Busch_B.glb` | Busch 3 Blobs | 72 | 72 | 2 | BR_Outline, BR_Atlas | 372 | eigen (CC0) | – | – |
| `BR_Gras_A.glb` | Gras-Büschel hell | 15 | 0 | 1 | BR_Atlas | 368 | eigen (CC0) | – | – |
| `BR_Gras_B.glb` | Gras-Büschel mittel | 18 | 0 | 1 | BR_Atlas | 368 | eigen (CC0) | – | – |

## Deko / Himmel / Verkehr

| Datei | Zweck | Dreiecke | Outline | Draws | Mat. | KB | Lizenz / Quelle | Animierbare Knoten | Empties |
|---|---|---|---|---|---|---|---|---|---|
| `BR_Auto_Klein.glb` | Passanten-Auto | 1194 | 1194 | 2 | BR_Outline, BR_Atlas | 548 | KayKit City Builder Bits (CC0), umgefärbt | – | Fahrer |
| `BR_Auto_Kombi.glb` | Passanten-Auto | 1234 | 1234 | 2 | BR_Outline, BR_Atlas | 554 | KayKit City Builder Bits (CC0), umgefärbt | – | Fahrer |
| `BR_Auto_Limousine.glb` | Passanten-Auto | 1222 | 1222 | 2 | BR_Outline, BR_Atlas | 552 | KayKit City Builder Bits (CC0), umgefärbt | – | Fahrer |
| `BR_Bank.glb` | Parkbank, Empties Sitz_1/2 | 108 | 108 | 2 | BR_Outline, BR_Atlas | 380 | eigen (CC0) | – | Sitz_1, Sitz_2 |
| `BR_Haftnotiz.glb` | Haftnotiz (weiß, per Instanzfarbe tönen) | 4 | 4 | 2 | BR_Outline, BR_Atlas | 368 | eigen (CC0) | – | – |
| `BR_Laterne.glb` | Laterne 3,4 m | 66 | 66 | 2 | BR_Outline, BR_Atlas | 374 | eigen (CC0) | – | Licht |
| `BR_Wolke_A.glb` | Wolke groß | 192 | 192 | 2 | BR_Outline, BR_Atlas | 378 | eigen (CC0) | – | – |
| `BR_Wolke_B.glb` | Wolke lang | 240 | 240 | 2 | BR_Outline, BR_Atlas | 380 | eigen (CC0) | – | – |
| `BR_Wolke_C.glb` | Wolke klein | 144 | 144 | 2 | BR_Outline, BR_Atlas | 375 | eigen (CC0) | – | – |

## Budget-Probe (Testszenen in `vorschau/`)

| Szene | Inhalt | Dreiecke inkl. Outline | Draws ohne Instancing | Draws mit Instancing (je Modell 1×) |
|---|---|---|---|---|
| `_Szene_Zone1.png` | 26 Felder, Schlosserei, Küche, 45 Bäume, 30 Büsche, 60 Blumen, 100 Gras, 5 Wolken, Autos, Bänke | 54845 | 400 | 55 |
| `_Szene_Zone4.png` | 26 Felder, Krankenhaus, Werkstatt, Bahnhof (×0,62) + Lok + 5 Wagen, Zelle, Polizeiauto, Vegetation | 41235 | 362 | 63 |

Ziel laut Styleguide: < 120 Draws, 80–150k Dreiecke pro Zone. Mit Instancing liegen beide Testzonen bei ca. 55–65 Draws und 40–55k Dreiecken inklusive Outline. Es bleibt Luft für Figuren (Quaternius) und VFX.

## Texturen (`texturen/`)

| Datei | Größe | Zweck |
|---|---|---|
| `BR_Atlas_1024.png` | 1024² RGBA | Gemeinsamer Atlas aller Modelle: Karton außen/innen, Boden, Wellpappe-Kante, Buntstift-Hatch, Papier-Weiß, Markisen, Feldsymbole, Schilder, Fenster, Tür, Tor, Uhr, Board, Spiegel, Wasser, Bildschirm, Warnstreifen. In jeder GLB eingebettet (gleiche Datei). |
| `BR_Feldnummern_1024.png` | 1024² RGBA | Zahlen 0–100, Raster 10 Spalten × 11 Zeilen (Zelle 102,4 × 93 px), für `BR_Feld_Nummer.glb` |
| `BR_Papier_512.png` | 512², kachelbar | Flipchart-Papier (#F7F1E3), Multiply 0,08–0,15 für Himmel/Seitenrand |
| `BR_Karton_512.png` | 512², kachelbar | Kraftkarton mit Fasern und Rippen, für eigene Code-Geometrie |
| `BR_Buntstift_512.png` | 512², kachelbar, Graustufen | Buntstift-Hatch, mit Wiesengrün multiplizieren (Boden, Wiese) |
| `BR_Gradient_2stufig.png` / `BR_Gradient_3stufig.png` | 2×1 / 3×1 | Gradient-Maps für `MeshToonMaterial` (NearestFilter) |
