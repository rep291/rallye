# Figuren – BERUFE-RALLYE 3D (Stil C)

Stand 25.11.2026, Nachbesserung v2 (Europe/Vienna). Alle Dateien glTF 2.0 Binary, **Y-up, Meter, Pivot an den Füßen** (Boden y = 0), Blickrichtung **+Z** (wie die bisherigen Quaternius-Figuren). Khronos-Validator: **0 Fehler**; Figuren je 1 Hinweis `NODE_SKINNED_MESH_NON_ROOT` (Standard bei Blender-Exporten, harmlos), `Handprops.glb` 0 Hinweise.

**Neu in v2:** Handschellen als zwei Schellen mit Kette an beiden Handgelenken (Clip `PrisonerCuff` neu, Prisoner-Clips mit zusammengeführten Handgelenken), 12 neue Berufsfiguren (jeder der 22 Berufe aus `assets/figuren/figuren.json` hat jetzt ein eigenes Kostüm), Props `Prop_Balken` + `Prop_Reifen` und 9 weitere Berufs-Props, Clips `CarryShoulder`/`CarryShoulderWalk` für den Balken, Victory/Hammer/Wave/Haircut/Pipette ohne Durchdringung von Kopf und Hut. Dateinamen von v1 unverändert.

Gemeinsam für alle Figuren:
- **Ein Rig** (`Rig`, 23 deformierende Bones + 4 Sockets, Bone-Namen wie Quaternius Universal Animation Library), Chibi-Proportionen, Höhe ca. 1,15 m (mit Hut bis 1,31 m).
- **1 Mesh, 1 Skin, 1 Material** (`M_Figur` bzw. `M_Figur_Spieler`) mit eingebettetem 64×64-Palettenatlas `texturen/figuren_atlas.png` (8×8 Zellen, Nearest-Filter). v2 nutzt 4 zusätzliche, bisher freie Zellen (50–53); alle alten UVs bleiben gleich.
- `COLOR_0.r` = Outline-Stärke pro Vertex (1 = Körper, 0 = Augen/Mund/Brauen/Flecken, 0,3 = Knöpfe, Streifen, Kleinteile).
- **Clips liegen zentral in `BR_Animationen.glb`** (39 Clips, gleiches Rig) und werden per Bone-Namen auf jede Figur gebunden.
- `_LOD1` = gleiche Figur mit 60 % Segmenten. Gleicher Atlas, gleiches Rig, gleiche Clips.

## Berufe → Figur (Mapping, 2D-Berufe aus `assets/figuren/figuren.json`)

Vorher teilten sich Bäcker/Koch, IT/Büro, Elektriker/Tischler/Metaller (Schlosser) und Feuerwehr/Maurer/Bauarbeiter je ein Kostüm; Fahrer, Gärtner, Kindergarten, Landwirt, Maler und Verkauf hatten keine eigene Figur. **Jetzt teilt sich kein Beruf mehr ein Kostüm.** `NPC_Bauarbeiter` bleibt als allgemeiner Baustellen-NPC (gelber Helm, Warnweste) ohne eigenen Beruf.

| Beruf-ID | Beruf | 3D-Figur | Status | Erkennungsmerkmale |
|---|---|---|---|---|
| `mechanik` | Kfz-Mechaniker/in | `NPC_Mechanikerin` | eigen (schon v1) | rotes Hemd, Latz-Overall, Kappe rückwärts; Reifen |
| `koch` | Koch/Köchin | `NPC_Koch` | eigen (schon v1) | hohe Kochmütze, Kochjacke mit Knopfreihen, rotes Halstuch |
| `friseur` | Friseur/in | `NPC_Friseurin` | eigen (schon v1) | pinker Bob, schwarz mit Schürze; Schere + Kamm |
| `it` | IT-Techniker/in | `NPC_IT` | **neu**, vorher geteilt mit Büro | Hoodie dunkelblau, Headset mit Mikro, Brille, Lanyard mit Ausweis |
| `garten` | Gärtner/in | `NPC_Gaertnerin` | **neu**, vorher keine eigene Figur | Strohhut mit grünem Band, lange grüne Schürze, grüne Gummistiefel und Handschuhe; Gießkanne |
| `labor` | Labortechniker/in | `NPC_Laborantin` | eigen (schon v1) | Laborkittel, große Brille, Nitril-Handschuhe; Pipette + Reagenzglas |
| `lager` | Lagerlogistik | `NPC_Lagerist` | eigen (schon v1) | Warnweste, Beanie, Lederhandschuhe; Kiste, Klemmbrett |
| `tischler` | Tischler/in | `NPC_Tischler` | **neu**, vorher geteilt mit Schlosser | schwarzer Zimmermannshut, Zimmermannshose (Schlag, Perlmuttknöpfe), schwarze Weste, Bleistift hinterm Ohr, Zollstock in der Beintasche; Säge, Balken |
| `elektrik` | Elektriker/in | `NPC_Elektriker` | **neu**, vorher geteilt mit Schlosser | weißer Helm, gelbes Shirt, Werkzeuggürtel mit Taschen, orange Kabelrolle an der Hüfte, Knieschoner; Messgerät |
| `pflege` | Pfleger/in | `NPC_Pfleger` | eigen (schon v1) | Kasack türkis, OP-Haube |
| `polizei` | Polizist/in | `NPC_Polizist, NPC_Polizistin` | eigen (schon v1, 2 Varianten) | Uniform, Polizeimütze, Abzeichen |
| `feuerwehr` | Feuerwehr | `NPC_Feuerwehr` | **neu**, vorher geteilt mit Bauarbeiter | roter Feuerwehrhelm mit gelbem Reflexstreifen und Nackenschutz, dunkelblaue Einsatzkleidung mit gelben Reflexstreifen (Rumpf, Ärmel, Beine), Stiefel; Feuerlöscher |
| `maurer` | Maurer/in | `NPC_Maurer` | **neu**, vorher geteilt mit Bauarbeiter | weiße Kappe, graues Shirt, orange Latzhose mit Mörtelflecken, Knieschoner; Maurerkelle, Balken |
| `maler` | Maler/in | `NPC_Maler` | **neu**, vorher keine eigene Figur | weißer Latz-Overall mit Farbklecksen, hellblaue Kappe; Farbroller |
| `baecker` | Bäcker/in | `NPC_Baecker` | **neu**, vorher geteilt mit Koch | flache Bäckermütze, lange beige Mehlschürze mit Mehlflecken, Mehl auf Wange, hellgraue Hose; Brot |
| `verkauf` | Verkäufer/in | `NPC_Verkaeuferin` | **neu**, vorher keine eigene Figur | rotes Polo mit Kragen, Namensschild, schwarze Hose; Einkaufskorb |
| `buero` | Bürokaufmann/-frau | `NPC_Buero` | eigen (schon v1) | hellblaues Hemd, Krawatte, Brille |
| `arzt` | Arzt/Ärztin | `NPC_Aerztin` | eigen (schon v1) | Arztkittel, Stethoskop |
| `schweiss` | Metalltechniker/in | `NPC_Schlosser` | eigen (schon v1) | blaue Arbeitskleidung mit Latz, Kappe; Hammer, Schweißbrenner |
| `fahrer` | Berufskraftfahrer/in | `NPC_Fahrer` | **neu**, vorher keine eigene Figur | dunkelblaue Kappe, hellblaues Polo mit Kragen und Namensschild, Gürtel |
| `kiga` | Elementarpädagog/in | `NPC_Erzieherin` | **neu**, vorher keine eigene Figur | pinke Bommelmütze, lila Pulli mit bunten Punkten, rote Schuhe; Ball |
| `landwirt` | Landwirt/in | `NPC_Landwirt` | **neu**, vorher keine eigene Figur | Strohhut mit rotem Band, Bart, rotes Hemd, olivgrüne Latzhose, Gummistiefel |

Eigene Kombinationen aus dem Baukasten (z. B. weitere Passanten oder eine zweite Variante pro Beruf): siehe Abschnitt „Baukasten-Teile“ und `EINBAU_FIGUREN.md` §7 (Teile wählen, Atlas-Zelle umfärben).

## Figuren

| Datei | Rolle | Dreiecke LOD0 / LOD1 | empfohlene Clips (+Props) | Lizenz |
|---|---|---|---|---|
| `Spieler_A.glb` / `Spieler_A_LOD1.glb` | Spielfigur (Junge. Stachelhaare) | 3.844 / 1.939 | Idle, Walk, Run, Victory, Wave, Sit→SitIdle→StandUp, Talk, Dance; Festnahme: PrisonerCuff→PrisonerIdle/PrisonerWalk/PrisonerSit (+Handschellen) | eigen + Rig/Clips Quaternius UAL (CC0) |
| `Spieler_B.glb` / `Spieler_B_LOD1.glb` | Spielfigur (Mädchen. Zopf) | 4.250 / 2.069 | Idle, Walk, Run, Victory, Wave, Sit→SitIdle→StandUp, Talk, Dance; Festnahme: PrisonerCuff→PrisonerIdle/PrisonerWalk/PrisonerSit (+Handschellen) | eigen + Rig/Clips Quaternius UAL (CC0) |
| `Spieler_C.glb` / `Spieler_C_LOD1.glb` | Spielfigur (Locken) | 4.682 / 2.445 | Idle, Walk, Run, Victory, Wave, Sit→SitIdle→StandUp, Talk, Dance; Festnahme: PrisonerCuff→PrisonerIdle/PrisonerWalk/PrisonerSit (+Handschellen) | eigen + Rig/Clips Quaternius UAL (CC0) |
| `Spieler_D.glb` / `Spieler_D_LOD1.glb` | Spielfigur (Bob. blond) | 4.258 / 2.033 | Idle, Walk, Run, Victory, Wave, Sit→SitIdle→StandUp, Talk, Dance; Festnahme: PrisonerCuff→PrisonerIdle/PrisonerWalk/PrisonerSit (+Handschellen) | eigen + Rig/Clips Quaternius UAL (CC0) |
| `Spieler_E.glb` / `Spieler_E_LOD1.glb` | Spielfigur (Scheitel. rot) | 4.090 / 2.009 | Idle, Walk, Run, Victory, Wave, Sit→SitIdle→StandUp, Talk, Dance; Festnahme: PrisonerCuff→PrisonerIdle/PrisonerWalk/PrisonerSit (+Handschellen) | eigen + Rig/Clips Quaternius UAL (CC0) |
| `Spieler_F.glb` / `Spieler_F_LOD1.glb` | Spielfigur (Dutt) | 4.118 / 1.981 | Idle, Walk, Run, Victory, Wave, Sit→SitIdle→StandUp, Talk, Dance; Festnahme: PrisonerCuff→PrisonerIdle/PrisonerWalk/PrisonerSit (+Handschellen) | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Koch.glb` / `NPC_Koch_LOD1.glb` | Koch (Restaurantküche) | 4.890 / 2.509 | Stir (+Kochloeffel), Chop (+Messer), PickUp, CarryWalk (+Tablett), Walk, Idle | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Schlosser.glb` / `NPC_Schlosser_LOD1.glb` | Schlosser/Schmied (Schlosserei) | 4.652 / 2.604 | Hammer (+Hammer), Weld (+Schweissbrenner), PickUp, CarryWalk (+Kiste), Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Laborantin.glb` / `NPC_Laborantin_LOD1.glb` | Laborantin (Labor) | 5.036 / 2.815 | Pipette (+Pipette, Reagenzglas), Examine, Clipboard, Interact, Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Lagerist.glb` / `NPC_Lagerist_LOD1.glb` | Lagerist (Lager) | 4.658 / 2.458 | CarryIdle/CarryWalk (+Kiste), PickUp, Push, Clipboard (+Klemmbrett, Stift), Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Buero.glb` / `NPC_Buero_LOD1.glb` | Büro-Angestellter (Büro) | 4.906 / 2.833 | Sit→Type (+Tastatur am Tisch)→StandUp, Interact (Drucker), Talk, Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Friseurin.glb` / `NPC_Friseurin_LOD1.glb` | Friseurin (Friseursalon) | 4.474 / 2.249 | Haircut (+Schere, Kamm), Talk, Interact, Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Bauarbeiter.glb` / `NPC_Bauarbeiter_LOD1.glb` | Bauarbeiter (Baustelle) | 4.628 / 2.520 | CarryShoulder/CarryShoulderWalk (+Balken), Hammer, CrouchIdle, PickUp, Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Aerztin.glb` / `NPC_Aerztin_LOD1.glb` | Ärztin (Krankenhaus) | 5.040 / 2.763 | Examine, Clipboard, Talk, Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Pfleger.glb` / `NPC_Pfleger_LOD1.glb` | Pfleger (Krankenhaus) | 4.148 / 2.136 | CarryWalk (+Tablett), PickUp, Examine, Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Mechanikerin.glb` / `NPC_Mechanikerin_LOD1.glb` | Mechanikerin (Autowerkstatt) | 4.964 / 2.748 | CarryIdle/CarryWalk (+Reifen), KneelFix (+Schraubenschluessel), Hammer, Interact, Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Polizist.glb` / `NPC_Polizist_LOD1.glb` | Polizist (Finanzpolizei. Festnahme) | 4.742 / 2.631 | Cuff, Lead, Drive, Walk, Idle, Talk (Handschellen trägt der Gefangene) | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Polizistin.glb` / `NPC_Polizistin_LOD1.glb` | Polizistin (Finanzpolizei. Wache an der Zelle) | 5.054 / 2.779 | Idle, Talk, Walk, Drive, Cuff, Lead | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Passant_Hoodie.glb` / `NPC_Passant_Hoodie_LOD1.glb` | Passant (Park/Straße) | 4.958 / 2.609 | Walk, Idle, Wave, Talk, Dance, SitIdle | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Passantin_Kleid.glb` / `NPC_Passantin_Kleid_LOD1.glb` | Passantin (Park/Straße) | 4.662 / 2.249 | Walk, Talk, SitTalk, Wave | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Passant_Senior.glb` / `NPC_Passant_Senior_LOD1.glb` | Passant. Senior (Park. Bank) | 4.514 / 2.562 | SitIdle/SitTalk (Bank), WalkFormal, LieIdle (Patient) | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Passantin_Pulli.glb` / `NPC_Passantin_Pulli_LOD1.glb` | Passantin (Park/Straße) | 4.250 / 2.069 | Walk, Run, Idle, Talk, SitIdle | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Reisender_Rucksack.glb` / `NPC_Reisender_Rucksack_LOD1.glb` | Reisender (Bahnhof) | 4.482 / 2.409 | Walk, Idle, Wave, SitIdle | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Reisende_Business.glb` / `NPC_Reisende_Business_LOD1.glb` | Reisende (Bahnhof) | 4.794 / 2.469 | WalkFormal (+Koffer), Idle, SitIdle, Talk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Baecker.glb` / `NPC_Baecker_LOD1.glb` **neu** | Bäcker (Backstube) | 4.918 / 2.797 | Chop (+Messer), PickUp/CarryWalk (+Tablett), Idle mit Brot (+Brot), Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_IT.glb` / `NPC_IT_LOD1.glb` **neu** | IT-Technikerin/-Techniker (Büro. Serverraum) | 5.216 / 2.933 | Sit→Type (+Tastatur/Laptop am Tisch)→StandUp, Interact, Talk, Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Elektriker.glb` / `NPC_Elektriker_LOD1.glb` **neu** | Elektriker (Baustelle. Haus) | 5.120 / 2.812 | Interact (+Messgeraet), KneelFix (+Schraubenschluessel), CrouchIdle, Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Tischler.glb` / `NPC_Tischler_LOD1.glb` **neu** | Tischler/Zimmerer (Werkstatt) | 4.742 / 2.665 | Hammer (+Hammer), Chop (+Saege), CarryShoulderWalk (+Balken), Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Feuerwehr.glb` / `NPC_Feuerwehr_LOD1.glb` **neu** | Feuerwehr (Feuerwache. Einsatz) | 5.270 / 3.167 | Walk/Run, Idle (+Feuerloescher), Push, Drive, Talk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Maurer.glb` / `NPC_Maurer_LOD1.glb` **neu** | Maurer (Baustelle) | 4.956 / 2.796 | CrouchIdle/Chop (+Kelle), CarryShoulderWalk (+Balken), PickUp, Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Fahrer.glb` / `NPC_Fahrer_LOD1.glb` **neu** | Berufskraftfahrer (Lkw. Bus. Lieferung) | 4.476 / 2.444 | Drive, Walk, Idle, Talk, CarryWalk (+Kiste, Lieferung) | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Gaertnerin.glb` / `NPC_Gaertnerin_LOD1.glb` **neu** | Gärtnerin (Park. Gärtnerei) | 4.886 / 2.689 | Walk (+Giesskanne), CrouchIdle, PickUp, Wave | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Erzieherin.glb` / `NPC_Erzieherin_LOD1.glb` **neu** | Kindergartenpädagogin (Kindergarten) | 5.196 / 2.652 | Talk (+Ball), Wave, SitIdle/SitTalk, Dance, Walk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Landwirt.glb` / `NPC_Landwirt_LOD1.glb` **neu** | Landwirt (Bauernhof) | 5.016 / 2.903 | Push, CarryWalk (+Kiste), PickUp, Walk, Talk | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Maler.glb` / `NPC_Maler_LOD1.glb` **neu** | Maler (Baustelle. Wohnung) | 4.756 / 2.724 | Stir/Interact (+Farbroller), Walk, Idle | eigen + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Verkaeuferin.glb` / `NPC_Verkaeuferin_LOD1.glb` **neu** | Verkäuferin (Geschäft. Supermarkt) | 4.842 / 2.449 | PickUp, Idle (+Einkaufskorb), Interact (Kasse), Talk, Walk | eigen + Rig/Clips Quaternius UAL (CC0) |

Spielfiguren (`Spieler_A`–`F`, Material `M_Figur_Spieler`): Das Oberteil liegt auf Atlas-Zelle 0. Für die Spielerfarbe die Textur gegen `texturen/figuren_atlas_spieler_<pink|orange|gelb|gruen|blau|lila>.png` tauschen (siehe EINBAU_FIGUREN.md). Default im GLB ist Pink.

Budget: alle Figuren 3,8–5,3k Dreiecke (LOD0), 1,9–3,2k (LOD1). Leicht über 5k liegen nur die neuen Figuren mit viel Ausrüstung (Feuerwehr 5.270, IT 5.216, Erzieherin 5.196, Elektriker 5.120) sowie Landwirt/Polizistin/Ärztin/Laborantin (≈5,0k); für Mengen-NPCs LOD1 verwenden.

## Handprops (`Handprops.glb`, 31 Props, 5.284 Dreiecke gesamt)

| Prop | Socket (three-Name) | Dreiecke | Zweck / Clip |
|---|---|---|---|
| `Prop_Hammer` | Socket_Hand_R | 136 | Hammer, Clip Hammer |
| `Prop_Kochloeffel` | Socket_Hand_R | 84 | Stir |
| `Prop_Messer` | Socket_Hand_R | 120 | Chop |
| `Prop_Schere` | Socket_Hand_R | 152 | Haircut |
| `Prop_Kamm` | Socket_Hand_L | 96 | Haircut |
| `Prop_Klemmbrett` | Socket_Hand_L | 36 | Clipboard |
| `Prop_Stift` | Socket_Hand_R | 20 | Clipboard |
| `Prop_Pipette` | Socket_Hand_R | 48 | Pipette |
| `Prop_Reagenzglas` | Socket_Hand_L | 56 | Pipette |
| `Prop_Schweissbrenner` | Socket_Hand_R | 84 | Weld |
| `Prop_Schraubenschluessel` | Socket_Hand_R | 136 | KneelFix |
| `Prop_Kiste` | DEF-spine003 (Brust) | 120 | CarryIdle/CarryWalk |
| `Prop_Tablett` | DEF-spine003 (Brust) | 164 | CarryWalk |
| `Prop_Handschellen` **geändert** | Socket_Hand_R | 440 | **Komplett-Set** (2 Schellen + Kette) an der rechten Hand des Gefangenen; passt starr in PrisonerCuff (ab 50 %), PrisonerIdle, PrisonerWalk, PrisonerSit |
| `Prop_Handschelle_L` **neu** | Socket_Hand_L | 124 | Einzelschelle links, Kind-Knoten `Anker_L` (Kettenöse) |
| `Prop_Handschelle_R` **neu** | Socket_Hand_R | 124 | Einzelschelle rechts, Kind-Knoten `Anker_R` |
| `Prop_Handschellen_Kette` **neu** | keiner (per Code zwischen Anker_R und Anker_L) | 192 | dehnbare Kette (Länge 0,03 m entlang +Z), per Code zwischen `Anker_R` und `Anker_L` gespannt, für eigene Posen |
| `Prop_Koffer` | Socket_Hand_L | 172 | WalkFormal |
| `Prop_Tastatur` | keiner (Tisch) | 588 | Tisch-Prop, Type |
| `Prop_Balken` **neu** | DEF-spine003 (Brust) | 132 | Kantholz auf der rechten Schulter, CarryShoulder/CarryShoulderWalk (Bauarbeiter, Maurer, Tischler) |
| `Prop_Reifen` **neu** | DEF-spine003 (Brust) | 440 | Autoreifen mit Felge, mit beiden Händen vor dem Bauch, CarryIdle/CarryWalk (Mechanikerin) |
| `Prop_Brot` **neu** | Socket_Hand_R | 136 | Baguette (Bäcker) |
| `Prop_Laptop` **neu** | keiner (Tisch) | 228 | Tisch-Prop (IT) |
| `Prop_Messgeraet` **neu** | Socket_Hand_L | 216 | Multimeter mit Messkabeln (Elektriker) |
| `Prop_Saege` **neu** | Socket_Hand_R | 112 | Handsäge, Chop (Tischler) |
| `Prop_Feuerloescher` **neu** | Socket_Hand_L | 212 | Feuerlöscher, hängt am Arm (Feuerwehr) |
| `Prop_Kelle` **neu** | Socket_Hand_R | 88 | Maurerkelle, CrouchIdle/Chop (Maurer) |
| `Prop_Giesskanne` **neu** | Socket_Hand_R | 216 | Gießkanne (Gärtnerin) |
| `Prop_Ball` **neu** | Socket_Hand_L | 264 | Ball (Kindergarten) |
| `Prop_Farbroller` **neu** | Socket_Hand_R | 164 | Farbroller (Maler) |
| `Prop_Einkaufskorb` **neu** | Socket_Hand_L | 184 | Einkaufskorb, hängt am Arm (Verkauf) |

`Prop_Handschellen` hat den alten Namen behalten, ist aber kein Einzelteil in der Polizistenhand mehr: es ist das Set für die Handgelenke des Gefangenen (Socket_Hand_R des Gefangenen, die linke Schelle sitzt dadurch exakt am linken Handgelenk).

## Weitere Dateien

| Datei | Inhalt | Kennzahlen | Lizenz |
|---|---|---|---|
| `BR_Animationen.glb` | Rig + alle Clips (+ Spieler_A-Mesh, damit die Datei in jedem Viewer sichtbar ist) | 1,1 MB, 24 fps, linear gesampelt | Clips teils Quaternius UAL (CC0), teils eigen gekeyt |
| `Figur_Baukasten.glb` | 98 einzelne Skinned Meshes auf **einem** Rig: 16 Köpfe, 23 Frisuren, 18 Hüte/Mützen/Helme, 3 Brillen, 3 Zubehör (Headset, Bleistift, Mehl), 35 Körper/Outfits | 6,0 MB | eigen |
| `Handprops.glb` | 31 Props (Tabelle oben) | 5284 Dreiecke gesamt | eigen |
| `texturen/figuren_atlas*.png` | Paletten-Atlas + 6 Spielerfarben-Varianten | je 64×64 px | eigen |
| `figuren_kontakt.png` | Kontaktblatt aller 36 Figuren (Three.js-Render, Toon + Outline), mit Dreieckszahlen | 1800×2782 | – |
| `vorschau/vergleich_victory_hammer.png` | **Vorher/Nachher** Victory + Hammer, je ohne Hut, Sonnenhut, Helm, Kochmütze, Polizeimütze, Kappe | – | – |
| `vorschau/clip_<Name>.png` | Bilderstreifen je Clip (6 Phasen, passende Figur + Props; Prisoner-Clips von hinten) | – | – |
| `vorschau/clips_uebersicht.png` | alle Streifen auf einem Blatt | – | – |
| `vorschau/clips_animiert.gif` | Victory, Hammer, Wave, CarryShoulderWalk (Balken), CarryWalk (Reifen), Haircut, PrisonerWalk + PrisonerIdle (Handschellen, von hinten) | 1760×320, 16 Frames | – |

## Clips (alle in `BR_Animationen.glb`)

| Clip | Dauer | Loop | Herkunft | Einsatz |
|---|---|---|---|---|
| Idle | 2,5 s | ja | UAL Idle_Loop | Stehen, Warten |
| Walk | 1,33 s | ja | UAL Walk_Loop | Laufen, ca. 0,45 m/s bei Maßstab 1 |
| Run | 0,92 s | ja | UAL Jog_Fwd_Loop | ca. 1,15 m/s |
| Sprint | 0,67 s | ja | UAL Sprint_Loop | ca. 1,5 m/s |
| WalkFormal | 1,33 s | ja | UAL Walk_Formal_Loop | Reisende, Senior |
| Victory | 1,17 s | ja | eigen (v2: V-Pose) | Ziel erreicht, Jubel mit Hüpfer; Hände weit seitlich, frei von Kopf und allen Hüten |
| Wave | 1,67 s | ja | eigen (v2: Schulterhöhe) | Winken (rechte Hand) seitlich auf Schulterhöhe, frei von Hutkrempen |
| Dance | 1,0 s | ja | UAL Dance_Loop | Park, Jubel-Alternative |
| Talk | 2,92 s | ja | UAL Idle_Talking_Loop | Gespräch |
| Sit | 1,29 s | nein | UAL Sitting_Enter | Hinsetzen (danach SitIdle) |
| SitIdle | 1,67 s | ja | UAL Sitting_Idle_Loop | Sitzen (Bank, Büro, Kunde, Wartende) |
| SitTalk | 2,92 s | ja | UAL Sitting_Talking_Loop | Sitzend reden |
| StandUp | 1,0 s | nein | UAL Sitting_Exit | Aufstehen |
| PickUp | 0,83 s | nein | UAL PickUp_Table | Greifen, Abstellen, Probe nehmen |
| Interact | 2,0 s | nein | UAL Interact | Knopf/Drucker/Gerät bedienen |
| Push | 2,67 s | ja | UAL Push_Loop | Hubwagen, Rollwagen schieben |
| CrouchIdle | 2,92 s | ja | UAL Crouch_Idle_Loop | Hocken (Baustelle, Beet) |
| KneelFix | 5,17 s | nein | UAL Fixing_Kneeling | Mechanik am Rad/Boden (knien, schrauben, aufstehen) |
| Drive | 1,67 s | ja | UAL Driving_Loop | Polizist am Steuer |
| Hammer | 1,0 s | ja | eigen (v2: neu ausgeholt) | Hämmern: Ausholen seitlich neben dem Kopf (Hammerkopf zeigt nach hinten-oben), Schlag vorne unten |
| Weld | 1,0 s | ja | eigen | Schweißen, vorgebeugt, leichtes Zittern |
| Stir | 1,33 s | ja | eigen | Topf rühren |
| Chop | 0,67 s | ja | eigen | Schneiden am Brett |
| CarryIdle | 2,5 s | ja | eigen | Kiste/Tablett vor der Brust halten |
| CarryWalk | 1,33 s | ja | eigen | Tragen beim Gehen (statt Walk while carrying) |
| CarryShoulder | 2,5 s | ja | eigen (neu v2) | Balken auf der rechten Schulter, rechte Hand stützt vorne |
| CarryShoulderWalk | 1,33 s | ja | eigen (neu v2) | Gehen mit Balken auf der Schulter (Prop_Balken) |
| Type | 1,67 s | ja | eigen (auf SitIdle) | Tippen am Schreibtisch |
| Haircut | 2,0 s | ja | eigen (v2: Hände weiter vorn) | Schere + Kamm am Kopf des Kunden |
| Examine | 2,0 s | ja | eigen | Untersuchen (vorgebeugt, Hand vorn, andere Hand an der Hüfte) |
| Pipette | 1,33 s | ja | eigen (v2: Hände weiter vorn) | Pipettieren über Reagenzglas |
| Clipboard | 2,0 s | ja | eigen | Klemmbrett schreiben/prüfen |
| LieIdle | 2,5 s | ja | eigen | Liegen auf dem Rücken (Patient), Kopf Richtung −Z, Rücken 0,14 m über Pivot |
| Cuff | 1,0 s | nein | eigen | Polizist legt Handschellen an (Hände nach vorn an die Handgelenke des Gefangenen, Klick). Gegenstück: PrisonerCuff |
| PrisonerCuff | 1,0 s | nein | eigen (neu v2) | Gefangener: Hände gehen nach hinten zusammen, Klick bei 50 %; gleich lang wie Cuff, Handschellen ab 50 % einblenden |
| Lead | 1,33 s | ja | eigen | Polizist geht und hält den Gefangenen vor sich (rechte Hand vorn) |
| PrisonerIdle | 2,5 s | ja | eigen (v2: Handgelenke zusammen) | Hände hinter dem Rücken (Handgelenke 0,14 m auseinander, Daumen innen), Kopf leicht gesenkt |
| PrisonerWalk | 1,33 s | ja | eigen (v2: Handgelenke zusammen) | Abführen: Gehen mit Händen hinten |
| PrisonerSit | 1,67 s | ja | eigen (v2: Handgelenke zusammen) | In der Zelle sitzen, Hände hinten, Kopf gesenkt |

Zuordnung zum Styleguide (§13/§15): `Punch` → `Hammer`/`Chop`/`Haircut`, `Walk while carrying` → `CarryWalk` (Kiste, Tablett, Reifen) bzw. `CarryShoulderWalk` (Balken), `SitDown` → `Sit` + `SitIdle`, Handschellen anlegen → `Cuff` (Polizist) + `PrisonerCuff` (Gefangener), Hände hinten Idle/Walk → `PrisonerIdle`/`PrisonerWalk`, Abführen → `Lead` (Polizist) + `PrisonerWalk` (Figur ca. 0,35 m vor ihm). Nicht enthalten (bewusst): Death, Hit, Waffen-Clips.

Kollisionsprüfung v2 (Hände/Hammerkopf gegen Kopf+Haar sowie Hutvolumen Sonnenhut, Helm, Kochmütze, Polizeimütze, Feuerwehrhelm, über alle Frames): Victory, Hammer, Wave, Stir, Chop, Weld, Cuff, Lead, Type, Clipboard, Examine, Pipette, Prisoner*, CarryShoulder* frei; Haircut berührt das Haar-Volumen nur am Rand (< 1 cm). Skript: `/workspace/figuren_work/src/check.py`.

## Atlas-Zellen (Index → Farbe)

Zelle i liegt bei u = (i % 8 + 0,5)/8, v = (⌊i/8⌋ + 0,5)/8 (glTF-UV, `flipY = false`). (v1 dieser Liste hatte hier einen Indexfehler ab Zelle 1; diese Tabelle ist korrekt.)

| # | Name | Hex | # | Name | Hex |
|---|---|---|---|---|---|
| 0 | SPIELER | `#E6197E` | 27 | gruen | `#5DBB46` |
| 1 | haut1 | `#F6CFA8` | 28 | lila | `#8E44C9` |
| 2 | haut2 | `#E0A877` | 29 | khaki | `#C9B48A` |
| 3 | haut3 | `#A8714A` | 30 | hellblau | `#A9D2F5` |
| 4 | haut4 | `#6E4630` | 31 | rosa | `#F28CB1` |
| 5 | haar_schwarz | `#2A2A31` | 32 | reflex | `#E9EEF2` |
| 6 | haar_braun | `#6B4226` | 33 | leder | `#8A5A33` |
| 7 | haar_blond | `#EDC765` | 34 | hellgrau | `#D3D3DA` |
| 8 | haar_rot | `#C8582C` | 35 | weinrot | `#9E2B3B` |
| 9 | haar_grau | `#BDBDC4` | 36 | orange | `#F7931E` |
| 10 | weiss | `#F7F6F0` | 37 | gelb | `#FFD23F` |
| 11 | jeans | `#3E63A8` | 38 | mint | `#B6F2C3` |
| 12 | dunkelgrau | `#4A4A56` | 39 | nitril | `#7FA8F0` |
| 13 | polizei | `#1F3A8A` | 40 | glas | `#BFE6FF` |
| 14 | arbeitsblau | `#2F6DB5` | 41 | helmgelb | `#FFC928` |
| 15 | warn_orange | `#FF7A1A` | 42 | beige | `#E9D8B8` |
| 16 | warn_gelb | `#F5E23A` | 43 | olive | `#7C8A3A` |
| 17 | rot | `#E03C3C` | 44 | pink_haar | `#F06CB0` |
| 18 | kasack | `#3BB3A8` | 45 | tuerkis | `#2EC4D6` |
| 19 | schwarz | `#23232B` | 46 | blau_hell | `#5B9BE6` |
| 20 | augweiss | `#FFFFFF` | 47 | braun | `#8D6A42` |
| 21 | wange | `#FF9AAE` | 48 | dunkelblau | `#2B3550` |
| 22 | mund | `#8C2F3A` | 49 | grau | `#8A8A96` |
| 23 | schuh_braun | `#6B3E1F` | 50 | stroh | `#E8C66A` |
| 24 | schuh_dunkel | `#34343C` | 51 | holz | `#D9A464` |
| 25 | silber | `#C9CED6` | 52 | dunkelgruen | `#2F7A45` |
| 26 | gold | `#F2C230` | 53 | feuerrot | `#D7261E` |

## Baukasten-Teile (`Figur_Baukasten.glb`)

**Kopf** (16): `Kopf_haut1_Bart_Braue_braun` (1518), `Kopf_haut1_Bart_Braue_grau` (1518), `Kopf_haut1_Braue_blond` (1360), `Kopf_haut1_Braue_braun` (1360), `Kopf_haut1_Braue_pink_haar` (1360), `Kopf_haut1_Braue_schwarz` (1360), `Kopf_haut1_ernst_Braue_braun` (1336), `Kopf_haut2_Bart_Braue_braun` (1518), `Kopf_haut2_Bart_Braue_rot` (1518), `Kopf_haut2_Braue_braun` (1360), `Kopf_haut2_Braue_rot` (1360), `Kopf_haut2_Braue_schwarz` (1360), `Kopf_haut2_ernst_Braue_schwarz` (1336), `Kopf_haut3_Braue_braun` (1360), `Kopf_haut3_Braue_schwarz` (1360), `Kopf_haut4_Braue_schwarz` (1360)

**Haar** (23): `Haar_bob_blond` (670), `Haar_bob_braun` (670), `Haar_bob_pink_haar` (670), `Haar_buzz_schwarz_unterHut` (174), `Haar_dutt_braun` (530), `Haar_dutt_schwarz` (530), `Haar_glatze_grau` (60), `Haar_kurz_blond_unterHut` (182), `Haar_kurz_braun_unterHut` (182), `Haar_kurz_rot_unterHut` (182), `Haar_kurz_schwarz` (354), `Haar_kurz_schwarz_unterHut` (182), `Haar_lang_blond` (918), `Haar_lang_braun_unterHut` (750), `Haar_lang_schwarz` (918), `Haar_locken_schwarz` (1094), `Haar_scheitel_blond` (362), `Haar_scheitel_rot` (362), `Haar_stachel_braun` (256), `Haar_zopf_blond_unterHut` (494), `Haar_zopf_braun` (662), `Haar_zopf_braun_unterHut` (494), `Haar_zopf_schwarz` (662)

**Hut** (18): `Hut_baeckermuetze` (316), `Hut_feuerwehrhelm` (524), `Hut_helm` (374), `Hut_helm_weiss` (374), `Hut_kappe_arbeitsblau` (230), `Hut_kappe_blau_hell` (230), `Hut_kappe_dunkelblau` (230), `Hut_kappe_rueck_rot` (230), `Hut_kappe_weiss` (230), `Hut_kochmuetze` (656), `Hut_muetze_olive` (378), `Hut_muetze_pink_haar_Bommel_gelb` (498), `Hut_op_haube` (162), `Hut_polizeimuetze` (344), `Hut_sonnenhut` (196), `Hut_strohhut` (196), `Hut_strohhut_Band_rot` (196), `Hut_zimmermannshut` (196)

**Brille** (3): `Brille_leder` (384), `Brille_schwarz` (384), `Brille_tuerkis_gross` (384)

**Zubehoer** (3): `Zubehoer_bleistift` (30), `Zubehoer_headset_dunkelgrau` (382), `Zubehoer_mehl` (144)

**Koerper** (35): `Koerper_Aerztin` (3018), `Koerper_Baecker` (2916), `Koerper_Bauarbeiter` (2720), `Koerper_Buero` (2800), `Koerper_Elektriker` (3212), `Koerper_Erzieherin` (2588), `Koerper_Fahrer` (2704), `Koerper_Feuerwehr` (3228), `Koerper_Friseurin` (2444), `Koerper_Gaertnerin` (2836), `Koerper_IT` (2736), `Koerper_Koch` (2692), `Koerper_Laborantin` (2762), `Koerper_Lagerist` (2580), `Koerper_Landwirt` (3120), `Koerper_Maler` (2984), `Koerper_Maurer` (3184), `Koerper_Mechanikerin` (2880), `Koerper_Passant_Hoodie` (2504), `Koerper_Passant_Senior` (2552), `Koerper_Passantin_Kleid` (2384), `Koerper_Passantin_Pulli` (2228), `Koerper_Pfleger` (2444), `Koerper_Polizist` (2880), `Koerper_Polizistin` (2880), `Koerper_Reisende_Business` (2764), `Koerper_Reisender_Rucksack` (2744), `Koerper_Schlosser` (2880), `Koerper_Spieler_haut1` (2228), `Koerper_Spieler_haut2` (2228), `Koerper_Spieler_haut2_Shorts` (2368), `Koerper_Spieler_haut3` (2228), `Koerper_Spieler_haut4` (2228), `Koerper_Tischler` (2816), `Koerper_Verkaeuferin` (2564)

Welche Teile eine fertige Figur nutzt:

| Figur | Teile |
|---|---|
| Spieler_A | `Kopf_haut1_Braue_braun`, `Haar_stachel_braun`, `Koerper_Spieler_haut1` |
| Spieler_B | `Kopf_haut2_Braue_schwarz`, `Haar_zopf_schwarz`, `Koerper_Spieler_haut2` |
| Spieler_C | `Kopf_haut4_Braue_schwarz`, `Haar_locken_schwarz`, `Koerper_Spieler_haut4` |
| Spieler_D | `Kopf_haut1_Braue_blond`, `Haar_bob_blond`, `Koerper_Spieler_haut1` |
| Spieler_E | `Kopf_haut2_Braue_rot`, `Haar_scheitel_rot`, `Koerper_Spieler_haut2_Shorts` |
| Spieler_F | `Kopf_haut3_Braue_braun`, `Haar_dutt_braun`, `Koerper_Spieler_haut3` |
| NPC_Koch | `Kopf_haut2_Braue_braun`, `Haar_kurz_braun_unterHut`, `Hut_kochmuetze`, `Koerper_Koch` |
| NPC_Schlosser | `Kopf_haut1_Braue_schwarz`, `Haar_kurz_schwarz_unterHut`, `Hut_kappe_arbeitsblau`, `Koerper_Schlosser` |
| NPC_Laborantin | `Kopf_haut3_Braue_schwarz`, `Haar_dutt_schwarz`, `Brille_tuerkis_gross`, `Koerper_Laborantin` |
| NPC_Lagerist | `Kopf_haut2_Bart_Braue_rot`, `Haar_kurz_rot_unterHut`, `Hut_muetze_olive`, `Koerper_Lagerist` |
| NPC_Buero | `Kopf_haut1_Braue_blond`, `Haar_scheitel_blond`, `Brille_schwarz`, `Koerper_Buero` |
| NPC_Friseurin | `Kopf_haut1_Braue_pink_haar`, `Haar_bob_pink_haar`, `Koerper_Friseurin` |
| NPC_Bauarbeiter | `Kopf_haut3_Braue_schwarz`, `Haar_buzz_schwarz_unterHut`, `Hut_helm`, `Koerper_Bauarbeiter` |
| NPC_Aerztin | `Kopf_haut2_Braue_braun`, `Haar_zopf_braun`, `Koerper_Aerztin` |
| NPC_Pfleger | `Kopf_haut4_Braue_schwarz`, `Haar_kurz_schwarz_unterHut`, `Hut_op_haube`, `Koerper_Pfleger` |
| NPC_Mechanikerin | `Kopf_haut1_Braue_blond`, `Haar_zopf_blond_unterHut`, `Hut_kappe_rueck_rot`, `Koerper_Mechanikerin` |
| NPC_Polizist | `Kopf_haut2_ernst_Braue_schwarz`, `Haar_kurz_schwarz_unterHut`, `Hut_polizeimuetze`, `Koerper_Polizist` |
| NPC_Polizistin | `Kopf_haut1_ernst_Braue_braun`, `Haar_zopf_braun_unterHut`, `Hut_polizeimuetze`, `Koerper_Polizistin` |
| NPC_Passant_Hoodie | `Kopf_haut3_Braue_schwarz`, `Haar_locken_schwarz`, `Koerper_Passant_Hoodie` |
| NPC_Passantin_Kleid | `Kopf_haut1_Braue_blond`, `Haar_lang_blond`, `Koerper_Passantin_Kleid` |
| NPC_Passant_Senior | `Kopf_haut1_Bart_Braue_grau`, `Haar_glatze_grau`, `Brille_leder`, `Koerper_Passant_Senior` |
| NPC_Passantin_Pulli | `Kopf_haut4_Braue_schwarz`, `Haar_zopf_schwarz`, `Koerper_Passantin_Pulli` |
| NPC_Reisender_Rucksack | `Kopf_haut2_Braue_braun`, `Haar_kurz_braun_unterHut`, `Hut_sonnenhut`, `Koerper_Reisender_Rucksack` |
| NPC_Reisende_Business | `Kopf_haut3_Braue_braun`, `Haar_bob_braun`, `Koerper_Reisende_Business` |
| NPC_Baecker | `Kopf_haut1_Braue_blond`, `Zubehoer_mehl`, `Haar_kurz_blond_unterHut`, `Hut_baeckermuetze`, `Koerper_Baecker` |
| NPC_IT | `Kopf_haut4_Braue_schwarz`, `Haar_kurz_schwarz`, `Brille_schwarz`, `Zubehoer_headset_dunkelgrau`, `Koerper_IT` |
| NPC_Elektriker | `Kopf_haut3_Braue_schwarz`, `Haar_buzz_schwarz_unterHut`, `Hut_helm_weiss`, `Koerper_Elektriker` |
| NPC_Tischler | `Kopf_haut2_Bart_Braue_braun`, `Haar_kurz_braun_unterHut`, `Hut_zimmermannshut`, `Zubehoer_bleistift`, `Koerper_Tischler` |
| NPC_Feuerwehr | `Kopf_haut1_ernst_Braue_braun`, `Haar_kurz_braun_unterHut`, `Hut_feuerwehrhelm`, `Koerper_Feuerwehr` |
| NPC_Maurer | `Kopf_haut2_Braue_schwarz`, `Haar_kurz_schwarz_unterHut`, `Hut_kappe_weiss`, `Koerper_Maurer` |
| NPC_Fahrer | `Kopf_haut4_Braue_schwarz`, `Haar_kurz_schwarz_unterHut`, `Hut_kappe_dunkelblau`, `Koerper_Fahrer` |
| NPC_Gaertnerin | `Kopf_haut2_Braue_braun`, `Haar_zopf_braun_unterHut`, `Hut_strohhut`, `Koerper_Gaertnerin` |
| NPC_Erzieherin | `Kopf_haut1_Braue_braun`, `Haar_lang_braun_unterHut`, `Hut_muetze_pink_haar_Bommel_gelb`, `Koerper_Erzieherin` |
| NPC_Landwirt | `Kopf_haut1_Bart_Braue_braun`, `Haar_kurz_braun_unterHut`, `Hut_strohhut_Band_rot`, `Koerper_Landwirt` |
| NPC_Maler | `Kopf_haut1_Braue_braun`, `Haar_kurz_braun_unterHut`, `Hut_kappe_blau_hell`, `Koerper_Maler` |
| NPC_Verkaeuferin | `Kopf_haut4_Braue_schwarz`, `Haar_lang_schwarz`, `Koerper_Verkaeuferin` |

## Quelle und Neubau

Generator (nicht im Repo): `/workspace/figuren_work/src/` – `rig.py` (Chibi-Rig aus UAL), `kit.py` (Baukasten-Primitive, Palette), `figures.py` (36 Figuren), `anim.py` (Clips backen), `check.py` (Kollisionsprüfung), `export_anim.py`, `build_figs.py` (`-- --lod` für LOD1), `build_kit.py`, `props.py`. Vorschau-Tools: `/workspace/figuren_work/preview/` (Three.js-Renderer mit Puppeteer), `cmp.py`, `gif.py`, `post.mjs` (COLOR_0-Fix), `validate.mjs`, `liste.py` (diese Liste). Stand v1 gesichert unter `/workspace/figuren_work/v1/` und `src_v1/`.

```bash
cd /workspace/figuren_work && ./rebuild.sh            # Clips + alle Figuren
blender -b --python src/build_figs.py -- --lod        # LOD1
blender -b --python src/build_kit.py; blender -b --python src/props.py
node post.mjs /workspace/brettspiel_app/_art/3d_modelle/figuren/*.glb
```
