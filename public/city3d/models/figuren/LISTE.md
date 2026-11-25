# Figuren – BERUFE-RALLYE 3D (Stil C)

Stand 25.11.2026 (Europe/Vienna). Alle Dateien glTF 2.0 Binary, **Y-up, Meter, Pivot an den Füßen** (Boden y = 0), Blickrichtung **+Z** (wie die bisherigen Quaternius-Figuren). Khronos-Validator: **0 Fehler**, je 1 Hinweis `NODE_SKINNED_MESH_NON_ROOT` (Standard bei Blender-Exporten, harmlos).

Gemeinsam für alle Figuren:
- **Ein Rig** (`Rig`, 23 deformierende Bones + 4 Sockets, Bone-Namen wie Quaternius Universal Animation Library), Chibi-Proportionen, Höhe ca. 1,15 m (mit Hut bis 1,31 m).
- **1 Mesh, 1 Skin, 1 Material** (`M_Figur` bzw. `M_Figur_Spieler`) mit eingebettetem 64×64-Palettenatlas `texturen/figuren_atlas.png` (8×8 Zellen, Nearest-Filter).
- `COLOR_0.r` = Outline-Stärke pro Vertex (1 = Körper, 0 = Augen/Mund/Brauen, 0,3 = Knöpfe, Streifen, Kleinteile).
- **Clips liegen zentral in `BR_Animationen.glb`** (36 Clips, gleiches Rig) und werden per Bone-Namen auf jede Figur gebunden. Die Figuren-GLBs selbst enthalten keine Animation (spart ca. 1 MB pro Datei).
- `_LOD1` = gleiche Figur mit 60 % Segmenten (ca. 1,9–2,8k Dreiecke), optisch auf Beamer-Distanz kaum unterscheidbar. Gleicher Atlas, gleiches Rig, gleiche Clips.

## Figuren

| Datei | Rolle | Dreiecke LOD0 / LOD1 | empfohlene Clips (+Props) | Lizenz |
|---|---|---|---|---|
| `Spieler_A.glb` / `Spieler_A_LOD1.glb` | Spielfigur (Junge, Stachelhaare) | 3.844 / 1.939 | Idle, Walk, Run, Victory, Wave, Sit→SitIdle→StandUp, Talk, Dance; Festnahme: PrisonerIdle/PrisonerWalk/PrisonerSit | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `Spieler_B.glb` / `Spieler_B_LOD1.glb` | Spielfigur (Mädchen, Zopf) | 4.250 / 2.069 | Idle, Walk, Run, Victory, Wave, Sit→SitIdle→StandUp, Talk, Dance; Festnahme: PrisonerIdle/PrisonerWalk/PrisonerSit | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `Spieler_C.glb` / `Spieler_C_LOD1.glb` | Spielfigur (Locken) | 4.682 / 2.445 | Idle, Walk, Run, Victory, Wave, Sit→SitIdle→StandUp, Talk, Dance; Festnahme: PrisonerIdle/PrisonerWalk/PrisonerSit | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `Spieler_D.glb` / `Spieler_D_LOD1.glb` | Spielfigur (Bob, blond) | 4.258 / 2.033 | Idle, Walk, Run, Victory, Wave, Sit→SitIdle→StandUp, Talk, Dance; Festnahme: PrisonerIdle/PrisonerWalk/PrisonerSit | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `Spieler_E.glb` / `Spieler_E_LOD1.glb` | Spielfigur (Scheitel, rot) | 4.090 / 2.009 | Idle, Walk, Run, Victory, Wave, Sit→SitIdle→StandUp, Talk, Dance; Festnahme: PrisonerIdle/PrisonerWalk/PrisonerSit | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `Spieler_F.glb` / `Spieler_F_LOD1.glb` | Spielfigur (Dutt) | 4.118 / 1.981 | Idle, Walk, Run, Victory, Wave, Sit→SitIdle→StandUp, Talk, Dance; Festnahme: PrisonerIdle/PrisonerWalk/PrisonerSit | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Koch.glb` / `NPC_Koch_LOD1.glb` | Koch (Restaurantküche) | 4.890 / 2.509 | Stir (+Kochloeffel), Chop (+Messer), PickUp, CarryWalk (+Tablett), Walk, Idle | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Schlosser.glb` / `NPC_Schlosser_LOD1.glb` | Schlosser/Schmied (Schlosserei) | 4.652 / 2.604 | Hammer (+Hammer), Weld (+Schweissbrenner), PickUp, CarryWalk (+Kiste), Walk | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Laborantin.glb` / `NPC_Laborantin_LOD1.glb` | Laborantin (Labor) | 5.036 / 2.815 | Pipette (+Pipette, Reagenzglas), Examine, Clipboard, Interact, Walk | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Lagerist.glb` / `NPC_Lagerist_LOD1.glb` | Lagerist (Lager) | 4.658 / 2.458 | CarryIdle/CarryWalk (+Kiste), PickUp, Push, Clipboard (+Klemmbrett, Stift), Walk | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Buero.glb` / `NPC_Buero_LOD1.glb` | Büro-Angestellter (Büro) | 4.906 / 2.833 | Sit→Type (+Tastatur am Tisch)→StandUp, Interact (Drucker), Talk, Walk | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Friseurin.glb` / `NPC_Friseurin_LOD1.glb` | Friseurin (Friseursalon) | 4.474 / 2.249 | Haircut (+Schere, Kamm), Talk, Interact, Walk | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Bauarbeiter.glb` / `NPC_Bauarbeiter_LOD1.glb` | Bauarbeiter (Baustelle) | 4.628 / 2.520 | Hammer, CarryWalk (Balken), CrouchIdle, PickUp, Walk | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Aerztin.glb` / `NPC_Aerztin_LOD1.glb` | Ärztin (Krankenhaus) | 5.040 / 2.763 | Examine, Clipboard, Talk, Walk | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Pfleger.glb` / `NPC_Pfleger_LOD1.glb` | Pfleger (Krankenhaus) | 4.148 / 2.136 | CarryWalk (+Tablett), PickUp, Examine, Walk | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Mechanikerin.glb` / `NPC_Mechanikerin_LOD1.glb` | Mechanikerin (Autowerkstatt) | 4.964 / 2.748 | KneelFix (+Schraubenschluessel), Hammer (Schrauber), CarryWalk (Reifen), Interact, Walk | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Polizist.glb` / `NPC_Polizist_LOD1.glb` | Polizist (Finanzpolizei, Festnahme) | 4.742 / 2.631 | Cuff (+Handschellen), Lead, Drive, Walk, Idle, Talk | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Polizistin.glb` / `NPC_Polizistin_LOD1.glb` | Polizistin (Finanzpolizei, Wache an der Zelle) | 5.054 / 2.779 | Idle, Talk, Walk, Drive, Cuff, Lead | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Passant_Hoodie.glb` / `NPC_Passant_Hoodie_LOD1.glb` | Passant (Park/Straße) | 4.958 / 2.609 | Walk, Idle, Wave, Talk, Dance, SitIdle | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Passantin_Kleid.glb` / `NPC_Passantin_Kleid_LOD1.glb` | Passantin (Park/Straße) | 4.662 / 2.249 | Walk, Talk, SitTalk, Wave | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Passant_Senior.glb` / `NPC_Passant_Senior_LOD1.glb` | Passant, Senior (Park, Bank) | 4.514 / 2.562 | SitIdle/SitTalk (Bank), WalkFormal, LieIdle (Patient) | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Passantin_Pulli.glb` / `NPC_Passantin_Pulli_LOD1.glb` | Passantin (Park/Straße) | 4.250 / 2.069 | Walk, Run, Idle, Talk, SitIdle | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Reisender_Rucksack.glb` / `NPC_Reisender_Rucksack_LOD1.glb` | Reisender (Bahnhof) | 4.482 / 2.409 | Walk, Idle, Wave, SitIdle | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |
| `NPC_Reisende_Business.glb` / `NPC_Reisende_Business_LOD1.glb` | Reisende (Bahnhof) | 4.794 / 2.469 | WalkFormal (+Koffer), Idle, SitIdle, Talk | eigen (frei, CC0-fähig) + Rig/Clips Quaternius UAL (CC0) |

Spielfiguren (`Spieler_A`–`F`, Material `M_Figur_Spieler`): Das Oberteil liegt auf Atlas-Zelle 0. Für die Spielerfarbe die Textur gegen `texturen/figuren_atlas_spieler_<pink|orange|gelb|gruen|blau|lila>.png` tauschen (siehe EINBAU_FIGUREN.md). Default im GLB ist Pink.

## Weitere Dateien

| Datei | Inhalt | Kennzahlen | Lizenz |
|---|---|---|---|
| `BR_Animationen.glb` | Rig + 36 Clips (+ Spieler_A-Mesh, damit die Datei in jedem Viewer sichtbar ist) | 1,0 MB, 24 fps, linear gesampelt | Clips teils Quaternius UAL (CC0), teils eigen gekeyt |
| `Figur_Baukasten.glb` | 67 einzelne Skinned Meshes auf **einem** Rig: 14 Köpfe, 19 Frisuren, 8 Hüte/Mützen, 3 Brillen, 23 Körper/Outfits. Zum freien Kombinieren (sichtbar schalten oder mergen). | 3,9 MB | eigen |
| `Handprops.glb` | 16 Handprops: Hammer, Kochloeffel, Messer, Schere, Kamm, Klemmbrett, Stift, Pipette, Reagenzglas, Schweissbrenner, Schraubenschluessel, Kiste, Tablett, Handschellen, Koffer, Tastatur | 2228 Dreiecke gesamt, 20–590 je Prop | eigen |
| `texturen/figuren_atlas*.png` | Paletten-Atlas + 6 Spielerfarben-Varianten | je 64×64 px | eigen |
| `figuren_kontakt.png` | Kontaktblatt aller 24 Figuren (Three.js-Render, Toon + Outline) | 1800×1800 | – |
| `vorschau/clip_<Name>.png` | 36 Bilderstreifen (6 Phasen je Clip, passende Figur + Props) | – | – |
| `vorschau/clips_uebersicht.png` | alle 36 Streifen auf einem Blatt | – | – |
| `vorschau/clips_animiert.gif` | 8 Clips animiert (Wave, Victory, Hammer, Stir, Haircut, Cuff, PrisonerWalk, CarryWalk) | 880×560, 16 Frames | – |

## Clips (alle in `BR_Animationen.glb`)

| Clip | Dauer | Loop | Herkunft | Einsatz |
|---|---|---|---|---|
| Idle | 2,5 s | ja | UAL Idle_Loop | Stehen, Warten |
| Walk | 1,33 s | ja | UAL Walk_Loop | Laufen, ca. 0,45 m/s bei Maßstab 1 |
| Run | 0,92 s | ja | UAL Jog_Fwd_Loop | ca. 1,15 m/s |
| Sprint | 0,67 s | ja | UAL Sprint_Loop | ca. 1,5 m/s |
| WalkFormal | 1,33 s | ja | UAL Walk_Formal_Loop | Reisende, Senior |
| Victory | 1,17 s | ja | eigen | Ziel erreicht, Jubel mit Hüpfer |
| Wave | 1,67 s | ja | eigen | Winken (rechte Hand) |
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
| Hammer | 1,0 s | ja | eigen | Hämmern/Schmieden (statt Punch) |
| Weld | 1,0 s | ja | eigen | Schweißen, vorgebeugt, leichtes Zittern |
| Stir | 1,33 s | ja | eigen | Topf rühren |
| Chop | 0,67 s | ja | eigen | Schneiden am Brett |
| CarryIdle | 2,5 s | ja | eigen | Kiste/Tablett vor der Brust halten |
| CarryWalk | 1,33 s | ja | eigen | Tragen beim Gehen (statt Walk while carrying) |
| Type | 1,67 s | ja | eigen (auf SitIdle) | Tippen am Schreibtisch |
| Haircut | 2,0 s | ja | eigen | Schere + Kamm am Kopf des Kunden |
| Examine | 2,0 s | ja | eigen | Untersuchen (vorgebeugt, Hand vorn, andere Hand an der Hüfte) |
| Pipette | 1,33 s | ja | eigen | Pipettieren über Reagenzglas |
| Clipboard | 2,0 s | ja | eigen | Klemmbrett schreiben/prüfen |
| LieIdle | 2,5 s | ja | eigen | Liegen auf dem Rücken (Patient), Kopf Richtung −Z, Rücken 0,14 m über Pivot |
| Cuff | 1,0 s | nein | eigen | Polizist legt Handschellen an (Hände nach vorn, Klick) |
| Lead | 1,33 s | ja | eigen | Polizist geht und hält den Gefangenen vor sich (rechte Hand vorn) |
| PrisonerIdle | 2,5 s | ja | eigen | Hände hinter dem Rücken, Kopf leicht gesenkt |
| PrisonerWalk | 1,33 s | ja | eigen | Abführen: Gehen mit Händen hinten |
| PrisonerSit | 1,67 s | ja | eigen | In der Zelle sitzen, Hände hinten, Kopf gesenkt |

Zuordnung zum Styleguide (§13/§15): `Punch` → `Hammer`/`Chop`/`Haircut`, `Walk while carrying` → `CarryWalk`, `SitDown` → `Sit` + `SitIdle`, Handschellen anlegen → `Cuff`, Hände hinten Idle/Walk → `PrisonerIdle`/`PrisonerWalk`, Abführen → `Lead` (Polizist) + `PrisonerWalk` (Figur ca. 0,35 m vor ihm). Nicht enthalten (bewusst): Death, Hit, Waffen-Clips.

## Atlas-Zellen (Index → Farbe)

Zelle i liegt bei u = (i % 8 + 0,5)/8, v = (⌊i/8⌋ + 0,5)/8 (glTF-UV, `flipY = false`).

| # | Name | Hex | # | Name | Hex |
|---|---|---|---|---|---|
| 0 | SPIELER | `#E6197E` | 23 | gruen | `#5DBB46` |
| 1 | haar_schwarz | `#2A2A31` | 24 | lila | `#8E44C9` |
| 2 | haar_braun | `#6B4226` | 25 | khaki | `#C9B48A` |
| 3 | haar_blond | `#EDC765` | 26 | hellblau | `#A9D2F5` |
| 4 | haar_rot | `#C8582C` | 27 | rosa | `#F28CB1` |
| 5 | haar_grau | `#BDBDC4` | 28 | reflex | `#E9EEF2` |
| 6 | weiss | `#F7F6F0` | 29 | leder | `#8A5A33` |
| 7 | jeans | `#3E63A8` | 30 | hellgrau | `#D3D3DA` |
| 8 | dunkelgrau | `#4A4A56` | 31 | weinrot | `#9E2B3B` |
| 9 | polizei | `#1F3A8A` | 32 | orange | `#F7931E` |
| 10 | arbeitsblau | `#2F6DB5` | 33 | gelb | `#FFD23F` |
| 11 | warn_orange | `#FF7A1A` | 34 | mint | `#B6F2C3` |
| 12 | warn_gelb | `#F5E23A` | 35 | nitril | `#7FA8F0` |
| 13 | rot | `#E03C3C` | 36 | glas | `#BFE6FF` |
| 14 | kasack | `#3BB3A8` | 37 | helmgelb | `#FFC928` |
| 15 | schwarz | `#23232B` | 38 | beige | `#E9D8B8` |
| 16 | augweiss | `#FFFFFF` | 39 | olive | `#7C8A3A` |
| 17 | wange | `#FF9AAE` | 40 | pink_haar | `#F06CB0` |
| 18 | mund | `#8C2F3A` | 41 | tuerkis | `#2EC4D6` |
| 19 | schuh_braun | `#6B3E1F` | 42 | blau_hell | `#5B9BE6` |
| 20 | schuh_dunkel | `#34343C` | 43 | braun | `#8D6A42` |
| 21 | silber | `#C9CED6` | 44 | dunkelblau | `#2B3550` |
| 22 | gold | `#F2C230` | 45 | grau | `#8A8A96` |

## Baukasten-Teile (`Figur_Baukasten.glb`)

**Kopf** (14): `Kopf_haut1_Bart_Braue_grau` (1518), `Kopf_haut1_Braue_blond` (1360), `Kopf_haut1_Braue_braun` (1360), `Kopf_haut1_Braue_pink_haar` (1360), `Kopf_haut1_Braue_schwarz` (1360), `Kopf_haut1_ernst_Braue_braun` (1336), `Kopf_haut2_Bart_Braue_rot` (1518), `Kopf_haut2_Braue_braun` (1360), `Kopf_haut2_Braue_rot` (1360), `Kopf_haut2_Braue_schwarz` (1360), `Kopf_haut2_ernst_Braue_schwarz` (1336), `Kopf_haut3_Braue_braun` (1360), `Kopf_haut3_Braue_schwarz` (1360), `Kopf_haut4_Braue_schwarz` (1360)

**Haar** (19): `Haar_bob_blond` (670), `Haar_bob_braun` (670), `Haar_bob_pink_haar` (670), `Haar_buzz_schwarz_unterHut` (174), `Haar_dutt_braun` (530), `Haar_dutt_schwarz` (530), `Haar_glatze_grau` (60), `Haar_kurz_braun_unterHut` (182), `Haar_kurz_rot_unterHut` (182), `Haar_kurz_schwarz_unterHut` (182), `Haar_lang_blond` (918), `Haar_locken_schwarz` (1094), `Haar_scheitel_blond` (362), `Haar_scheitel_rot` (362), `Haar_stachel_braun` (256), `Haar_zopf_blond_unterHut` (494), `Haar_zopf_braun` (662), `Haar_zopf_braun_unterHut` (494), `Haar_zopf_schwarz` (662)

**Hut** (8): `Hut_helm` (374), `Hut_kappe_arbeitsblau` (230), `Hut_kappe_rueck_rot` (230), `Hut_kochmuetze` (656), `Hut_muetze_olive` (378), `Hut_op_haube` (162), `Hut_polizeimuetze` (344), `Hut_sonnenhut` (196)

**Brille** (3): `Brille_leder` (384), `Brille_schwarz` (384), `Brille_tuerkis_gross` (384)

**Koerper** (23): `Koerper_Aerztin` (3018), `Koerper_Bauarbeiter` (2720), `Koerper_Buero` (2800), `Koerper_Friseurin` (2444), `Koerper_Koch` (2692), `Koerper_Laborantin` (2762), `Koerper_Lagerist` (2580), `Koerper_Mechanikerin` (2880), `Koerper_Passant_Hoodie` (2504), `Koerper_Passant_Senior` (2552), `Koerper_Passantin_Kleid` (2384), `Koerper_Passantin_Pulli` (2228), `Koerper_Pfleger` (2444), `Koerper_Polizist` (2880), `Koerper_Polizistin` (2880), `Koerper_Reisende_Business` (2764), `Koerper_Reisender_Rucksack` (2744), `Koerper_Schlosser` (2880), `Koerper_Spieler_haut1` (2228), `Koerper_Spieler_haut2` (2228), `Koerper_Spieler_haut2_Shorts` (2368), `Koerper_Spieler_haut3` (2228), `Koerper_Spieler_haut4` (2228)

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

## Quelle und Neubau

Generator (nicht im Repo): `/workspace/figuren_work/src/` – `rig.py` (Chibi-Rig aus UAL), `kit.py` (Baukasten-Primitive, Palette), `figures.py` (24 Figuren), `anim.py` (Clips backen), `export_anim.py`, `build_figs.py` (`-- --lod` für LOD1), `build_kit.py`, `props.py`. Vorschau-Tools: `/workspace/figuren_work/preview/` (Three.js-Renderer mit Puppeteer), `post.mjs` (COLOR_0-Fix), `validate.mjs`.

```bash
cd /workspace/figuren_work && ./rebuild.sh            # Clips + alle Figuren
blender -b --python src/build_figs.py -- --lod        # LOD1
blender -b --python src/build_kit.py; blender -b --python src/props.py
node post.mjs /workspace/brettspiel_app/_art/3d_modelle/figuren/*.glb
```
