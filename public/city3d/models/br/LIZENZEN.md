# BERUFE-RALLYE 3D – Lizenzen und Quellen

Stand 25.11.2026 (Europe/Vienna).

## 1. Eigene Modelle (Großteil)

Alle Gebäude-Hüllen (Kartonboxen), Zelle, Park, Bahnhof, Zug, Feldkacheln, Vegetation, Wolken, Bank, Laterne, Handschellen, Haftnotiz sowie alle Texturen und der Atlas wurden per Python-Skript in Blender 5.2.3 bzw. mit Pillow neu erzeugt. Es gibt keine fremden Bilddaten. Sie können im Projekt frei genutzt und verändert werden; eine Weitergabe als CC0 ist möglich.

Generator-Skripte (außerhalb des Repos): `/workspace/br3d_src/scripts/`, nämlich `brlib.py`, `assets_env.py`, `assets_buildings.py`, `make_textures.py`, `run.py`, `preview.py`, `scene.py`, `contact.py` und `liste.py`. Neu bauen: `cd /workspace/br3d_src/scripts && blender -b --factory-startup --python run.py`

## 2. CC0-Basis: KayKit (Kay Lousberg)

Lizenz: Creative Commons Zero (CC0 1.0), http://creativecommons.org/publicdomain/zero/1.0/ . Eine Namensnennung ist nicht nötig, wird aber gern gesehen: "KayKit by Kay Lousberg (kaylousberg.com)".
Quelle: GitHub `KayKit-Game-Assets` (lokale Kopie samt LICENSE.txt unter `/workspace/br3d_src/cc0/`).

| Paket | Verwendete Teile | Ziel-Datei |
|---|---|---|
| KayKit Restaurant Bits 1.0 | kitchencounter_straight_A_backsplash, kitchencounter_sink_backsplash, stove_multi_countertop, extractorhood, oven, fridge_A_decorated, pot_A_stew, pot_B, cuttingboard, knife, food_ingredient_carrot, jar_A_medium, jar_B_medium, kitchentable_A_large, crate_tomatoes, crate_lettuce, crate | BR_Box_Kueche, BR_Box_Lager |
| KayKit Furniture Bits 1.0 | bed_single_A, chair_A, chair_B, table_medium, table_round_A, table_low, shelf_A_big, shelf_B_large_decorated, book_set, cactus_medium_A, lamp_table, lamp_standing, couch_pillows, rug_oval_A, rug_rectangle_stripes_A, pictureframe_* | BR_Box_Buero, BR_Box_Krankenhaus, BR_Box_Friseur, BR_Box_Labor |
| KayKit City Builder Bits 1.0 | car_police, car_sedan, car_stationwagon, car_hatchback | BR_Polizeiauto, BR_Auto_*, BR_Box_Werkstatt |

**Umbau:** Die KayKit-Palettentextur wurde pro Fläche in Vertex-Colors gebacken, Sättigung und Helligkeit wurden angehoben, und die Teile auf Maßstab 1 m gebracht (teils nicht-uniform, z. B. Theken flacher). Danach wurden sie mit den eigenen Teilen zu einem Mesh pro Box gemergt, bekamen den gemeinsamen Atlas `BR_Atlas` und eine Inverted-Hull-Kontur. Die Betten wurden auf Weiß und Hellblau umgefärbt, und das Polizeiauto bekam eigene `POLIZEI`-Decals.

## 3. Schriften (nur in Texturen eingebrannt)

| Schrift | Lizenz | Verwendung |
|---|---|---|
| Permanent Marker (Font Diner) | Apache License 2.0 | Schilder, Feldsymbole, `6!`, Feldnummern im Atlas |
| Kalam (Indian Type Foundry) | SIL Open Font License 1.1 | nur Beschriftung im Kontaktblatt |

## 4. Werkzeuge

Blender 5.2.3 (GPL; die Lizenz betrifft nur das Programm, nicht die erzeugten Dateien), Pillow, NumPy und Khronos glTF-Validator (Apache 2.0) zur Prüfung.

## 5. Bestehende Projekt-Assets (unverändert)

Figuren im Repo: Quaternius Ultimate Animated Character Pack (CC0), `public/city3d/models/quaternius/`. Der Ordner `figuren/` hier stammt aus einem parallelen Auftrag und gehört nicht zu dieser Lieferung; seine Lizenzen sind dort zu dokumentieren.
