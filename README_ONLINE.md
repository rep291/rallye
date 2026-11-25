# BERUFE-RALLYE online (ohne Installation, nur Browser)

Für verwaltete Kurs-Laptops, auf denen keine Programme gestartet werden dürfen.
Der Server läuft bei einem kostenlosen Hoster; Beamer und Handys öffnen nur eine Internet-Adresse.

## Einmalig einrichten (Render, kostenlos, ohne Kreditkarte)

1. **GitHub-Konto** (kostenlos) anlegen oder anmelden: https://github.com
2. Neues Repository anlegen: oben rechts **+ → New repository**, Name z. B. `berufe-rallye`, **Private** oder Public, **Create repository**.
3. Auf der leeren Repository-Seite **„uploading an existing file“** anklicken.
   - `Brettspiel_Online_Render.zip` entpacken.
   - Den **Inhalt** des Ordners `berufe-rallye` (nicht den Ordner selbst) ins Browserfenster ziehen: `server.js`, `package.json`, `render.yaml`, die Ordner `config`, `public`, `assets` usw.
   - Dann **Commit changes**.
4. Bei **Render** anmelden: https://render.com → **Get Started** → **mit GitHub anmelden**. Keine Kreditkarte nötig.
5. Im Render-Dashboard **New → Blueprint** wählen, GitHub verbinden und das Repository `berufe-rallye` auswählen.
   - Render liest `render.yaml`: Web Service, Plan **Free**, Region Frankfurt.
   - Bei **HOST_PIN** eine eigene PIN eintragen (z. B. 6 Ziffern, nicht weitergeben).
   - **Apply / Deploy** drücken.
   - Alternative ohne Blueprint: **New → Web Service** → Repository wählen → Language **Node**, Build Command `npm ci --omit=dev`, Start Command `node server.js`, Instance Type **Free**, unter *Environment* `HOST_PIN` setzen.
6. Nach 2–5 Minuten zeigt Render die Adresse an, z. B. `https://berufe-rallye.onrender.com`.

## Im Kurs

1. **5 Minuten vor Beginn** am Kurs-Laptop `https://<deine-adresse>.onrender.com/host` öffnen. Nach einer Pause schläft der Gratis-Dienst; das erste Laden dauert dann ca. 1 Minute. Danach F11 drücken.
2. **PIN** eingeben. Der Browser merkt sie sich bis zum Schließen des Tabs. Danach entsteht automatisch die eigene Lobby mit Raumcode und QR-Code. Andere Gruppen können gleichzeitig ihre eigene Lobby öffnen.
3. Teilnehmende scannen den QR-Code am Beamer. Er zeigt die öffentliche https-Adresse. Funktioniert auch über mobile Daten; ein gemeinsames WLAN ist nicht nötig.
4. Spielen wie gewohnt (siehe Spielanleitung).

## Wichtige Einschränkungen (Render Free, Stand 2026)

- **Schläft nach 15 Minuten ohne Zugriff ein**; Aufwachen dauert ca. 1 Minute. Während eines laufenden Spiels bleibt der Dienst wach.
- **Spielstand ist nicht dauerhaft.** Die Datei `state/spielstand.json` überlebt auf Render Free keinen Neustart; beim Einschlafen, Neustart oder Update ist eine laufende Runde weg. Render darf Gratis-Dienste jederzeit neu starten. Also eine Runde am Stück spielen.
- 750 Gratis-Stunden pro Monat; das reicht für einen Dienst.
- Wer die Adresse kennt, kann als Spieler beitreten. Die **Spielleitung** ist durch die PIN geschützt. Bei falscher PIN wird nach 5 Versuchen getrennt.
- Ist keine `HOST_PIN` gesetzt, erzeugt der Server beim Start eine zufällige PIN; sie steht im Render-Log unter **Logs**.

## Karten oder Brett ändern
Dateien im GitHub-Repository bearbeiten (z. B. `config/cards.json`). Render baut nach jedem Commit automatisch neu.

## Andere Hoster
Mit dem `Dockerfile` läuft es auch bei anderen Docker-Hostern. Stand 2026:
- **Koyeb** verlangt eine Kreditkarte zur Prüfung.
- **Fly.io** hat für neue Konten nur eine kurze Testphase.
- **Railway** bietet nur 5 $ Testguthaben und danach 1 $ pro Monat.

## Neu: Räume, Abstimmung, Teams, Zeitlimit, Auswertung
- **Eigene Lobby pro Spielleitung:** Wer `/host` öffnet (online nach PIN), bekommt automatisch eine eigene Lobby mit Raumcode und QR-Code. Mehrere Gruppen spielen gleichzeitig auf demselben Server, jede mit eigenem Spielstand. Neu laden am Beamer führt in dieselbe Lobby zurück (Host-Token im Browser). Handys kommen per QR-Code (`/?r=CODE`) oder durch Eintippen des Codes in ihre Lobby. Verlassene Räume werden automatisch aufgeräumt (leer und ohne Spielleitung nach 30 Minuten, sonst nach 3 Stunden Inaktivität).
- **Allein oder im Team:** Beim Beitreten wählt man „Allein“, „Team gründen“ (Teamname) oder „Team beitreten“. Mehrere Handys teilen sich eine Figur; jedes Team-Handy darf würfeln und antworten.
- **Fragekarten mit Abstimmung:** Zuerst legt sich die Person am Zug am Handy geheim fest. Danach stimmt die Gruppe auf ihren Handys ab. Der Beamer zeigt dann Spielerantwort und Gruppenverteilung. Anschließend bewertet die Spielleitung mit der Leiste **−5 … +5 Felder** (Schnellwahl Richtig/Falsch, Standard +2/0). Rutsche und Finanzpolizei wirken danach normal; die Bewertung steht im Protokoll.
- **Hauptauswertung** direkt nach der Siegerehrung: Rangliste, alle Situationen mit Antwort, Gruppenverteilung und Bewertung, alle Aktionskarten. Knopf „🖨 Drucken / als PDF“.
- **Einstellungen (⚙)** pro Raum: Finanzpolizei-Fehlversuche, exakte Zahl fürs Ziel, Aktions-/Fragekarten an/aus, Kartenpakete (nur vor der Runde; keine Auswahl = alle), Zugzeit-Limit, Fragezeit-Limit, **Zeitlimit-Modus** (Minuten; bei Ablauf gewinnt, wer am weitesten ist), Bewertungsbereich, Schnellwahl, Lautstärke, Spieler umbenennen/entfernen, Übersicht aller Räume. Im Menü: Pause (friert auch die Spielzeit ein), Zug überspringen, für jemanden würfeln, neue Runde.
- **Karten:** 50 Aktions- und 50 Fragekarten. Aktion 1–27 und Frage 1–14 sind die Originaltexte (zeichengenau geprüft mit `node tools/pruefe_originale.js`). Jede Karte hat `tags` für die Kartenpakete (`packs` in `cards.json`). Die Kartenzahl auf der Brettgrafik wird am Beamer durch die aktuelle Stapelgröße ersetzt.

## Neu: Figuren, Animationen, Spielstand
- Jede Person wählt beim Beitreten am Handy eine von 22 Berufsfiguren im 3D-Chibi-Look und eine Farbe (jede Figur und jede Farbe nur einmal). Beides kann in der Lobby noch geändert werden.
- Die Figuren sind in Blender gerenderte PNG-Sprites (kein Echtzeit-3D). Sie winken im Stand, hüpfen Feld für Feld, rutschen auf der Rutsche und werden bei der Finanzpolizei mit Handschellen ins kleine Gefängnis neben dem Feld geführt. Dort bleiben sie bis zur 6. Dann gehen sie zurück auf den Weg. Es gibt einen animierten Würfel, Karten groß auf dem Handy der Person am Zug und eine Siegerehrung mit Konfetti und Plätzen.
- Beamer: Ab Spielstart wird die Spielerliste zur schmalen Leiste, das Brett wird größer. „☰ Menü“ öffnet Spielerliste und Spielleitungs-Knöpfe. „⛶ Vollbild“ (Taste F) und „🔊 Ton an/aus“ (Taste M) stehen oben rechts; Esc schließt das Menü. 19 kurze Soundeffekte und eine Lobby-Schleife sind enthalten. Fehlen die Tondateien, werden Ersatzklänge erzeugt. Der Browser braucht einen ersten Klick für Ton. Das Handy vibriert kurz, wenn man dran ist; auf unterstützten Geräten bleibt der Bildschirm an.
- Spielstand: Lädt man die Beamer-Seite neu, bleibt das Spiel erhalten (der Stand liegt am Server). Zusätzlich speichert der Server alle Räume in `state/spielstand.json` und lädt ihn nach einem Neustart wieder (bis 12 Stunden alt). Die Handys verbinden sich danach automatisch wieder. Abschalten mit der Umgebungsvariable `NO_SAVE=1`. Auf Render Free geht diese Datei bei einem Neustart verloren. Das ist normal.

## Umgebungsvariablen
| Variable | Bedeutung |
|---|---|
| `PORT` | Port (setzt Render automatisch) |
| `HOST_PIN` | PIN der Spielleitung (empfohlen) |
| `PUBLIC_URL` | Öffentliche Adresse für den QR-Code. Bei Render automatisch über `RENDER_EXTERNAL_URL`; sonst aus der Anfrage ermittelt. |
| `ONLINE=1` | Erzwingt den PIN-Schutz auch ohne die anderen Variablen |
| `NO_SAVE=1` | Spielstand nicht in eine Datei speichern |
| `MAX_ROOMS` | Höchstzahl gleichzeitiger Lobbys (Standard 50) |
| `ROOM_IDLE_MIN` / `ROOM_EMPTY_MIN` | Aufräumen: inaktive Räume nach 180 min, leere Räume ohne Spielleitung nach 30 min |
