# Controller-Varianten

`controller/` ist ein Plugin-System für austauschbare Gamepad-Layouts. `core.js` kapselt Verbindung, Senden, Variant-Picker, Wake-Lock. `qr-scanner.js` übernimmt den QR-Scan (globales `window.QRScanner`, `core.js` delegiert dorthin). Jede Variante liefert ihr eigenes Layout + ihre eigene Input-Logik.

## Routing

| URL | Verhalten |
|---|---|
| `controller/?code=AB23&player=1` | Redirect zur aktuell gewählten Variante (LocalStorage) mit Code durchgereicht |
| `controller/variants/classic/?code=AB23&player=1` | Variante direkt, verbindet automatisch |
| `controller/variants/classic/` (ohne Code) | Variante öffnet, LED rot — Wifi-Button öffnet QR-Scan zum Verbinden |

## Variant „Classic" (Default)

Layout (Querformat):
- **Links:** Analoger Joystick (fixer Mittelpunkt, Rücksprung)
- **Mitte:** Home (= SELECT, zurück ins Menü), Gear (Variant-Picker), Wifi (QR-Scan) — vertikal gestapelt
- **Rechts:** A- und B-Button in Mulden, diagonal versetzt; leicht nach links gerückt für bequeme Daumen-Reichweite
- **LED oben rechts:** Grün = verbunden, Rot = getrennt

Wifi-Icon leuchtet zusätzlich grün wenn verbunden — doppelte Status-Anzeige ohne Platz zu kosten.

Im Hochformat wird ein Hinweis-Overlay im RETROCON-Stil angezeigt (Gehäusefarbe, Akzent-Glow, animiertes Phone-Icon), das zum Drehen auffordert — der Controller ist für Querformat ausgelegt.

## PWA-Install

Der Controller ist als **Progressive Web App** installierbar. `controller/manifest.webmanifest` (fullscreen, landscape, RETROCON-Icons 192/512 + maskable) ist aus der Classic-Variante verlinkt plus iOS-Meta-Tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`).

Flow: Controller-URL am Handy öffnen → Share → „Zum Home-Screen". Beim Start ohne `?code=` öffnet der Controller automatisch den Scanner — direkt Raum-QR tippen, verbunden.

Safe-Area-Insets (`env(safe-area-inset-left/right)`) halten das Gehäuse auch auf Geräten mit Notch frei, der Joystick wird via ResizeObserver nach späten Viewport-Änderungen (PWA-Chrome-Hide, Rotation) re-zentriert.

## QR-Scanner

`qr-scanner.js` bevorzugt den nativen `BarcodeDetector` (Chromium Android, Safari iOS 17+) und fällt auf jsQR zurück. Der Scanner läuft kontinuierlich und zeichnet um jeden erkannten QR einen blauen Rahmen mit Label („SPIELER 1"/„SPIELER 2") — Tap auf einen Rahmen navigiert direkt zu dieser Spieler-URL. Kein Auto-Matching mehr, kein Viewfinder-Crop.

ABBRECHEN-Button prominent rot unten mittig schließt das Overlay und stoppt den Kamera-Stream.

## Neue Variante hinzufügen

1. Ordner `controller/variants/<id>/` anlegen mit `index.html`, `style.css`, `app.js`
2. In `index.html` PeerJS, jsQR, `qr-scanner.js`, `core.js` + `app.js` laden (in der Reihenfolge), gewünschte Button-IDs ins DOM
3. In `app.js`: `RC.bindBtn('id', 'key')` + eigene Joystick-/Touch-Logik, dann `RC.init()`
4. Eintrag in `VARIANTS`-Array in `core.js` ergänzen

Alle Varianten sprechen dasselbe [Gamepad-Protokoll](protocol.md), sind also mit jedem Spiel kompatibel. Der Nutzer wechselt Varianten über den Gear-Button im Controller selbst — die Wahl steckt in `localStorage` und gilt für alle Räume.

## Skins

Innerhalb einer Variante steuern CSS-Custom-Properties die Farben (Gehäuse, Akzent, Mulden). Classic liefert `crimson` (Default), `emerald`, `cobalt`, `mono` — per `<body class="skin-xyz">` umschaltbar.
