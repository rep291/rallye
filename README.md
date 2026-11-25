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
2. **PIN** eingeben. Der Browser merkt sie sich bis zum Schließen des Tabs.
3. Teilnehmende scannen den QR-Code am Beamer. Er zeigt die öffentliche https-Adresse. Funktioniert auch über mobile Daten; ein gemeinsames WLAN ist nicht nötig.
4. Spielen wie gewohnt (siehe Spielanleitung).

## Wichtige Einschränkungen (Render Free, Stand 2026)

- **Schläft nach 15 Minuten ohne Zugriff ein**; Aufwachen dauert ca. 1 Minute. Während eines laufenden Spiels bleibt der Dienst wach.
- **Spielstand liegt nur im Arbeitsspeicher.** Beim Einschlafen, Neustart oder Update ist eine laufende Runde weg. Render darf Gratis-Dienste jederzeit neu starten. Also eine Runde am Stück spielen.
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

## Umgebungsvariablen
| Variable | Bedeutung |
|---|---|
| `PORT` | Port (setzt Render automatisch) |
| `HOST_PIN` | PIN der Spielleitung (empfohlen) |
| `PUBLIC_URL` | Öffentliche Adresse für den QR-Code. Bei Render automatisch über `RENDER_EXTERNAL_URL`; sonst aus der Anfrage ermittelt. |
| `ONLINE=1` | Erzwingt den PIN-Schutz auch ohne die anderen Variablen |
