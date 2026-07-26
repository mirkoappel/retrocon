# Architektur

## Warum WebRTC?

GitHub Pages liefert HTTPS → notwendig für Kamera/Sensoren auf iOS/Android. Kein eigener Server nötig. PeerJS übernimmt den Verbindungsaufbau (Signaling), danach läuft alles P2P zwischen Laptop und Smartphones.

## Raum-System

Jede Console bekommt beim Start einen zufälligen 4-stelligen Code aus dem Alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — ohne verwechselbare Zeichen (0/O, 1/I/L). Der Code wird als PeerJS Custom ID registriert: `console-XXXX`.

Controller verbinden sich zu `console-XXXX`. Bei Code-Kollision wird automatisch ein neuer Code generiert (bis zu 5 Versuche).

## Datenfluss

```
[Handy/Controller]  ──WebRTC P2P──►  [Laptop/Console]
     controller/                        console/
         ↑
    QR scannen
```

## SPA-Struktur (console/)

Die gesamte Console läuft als **Single-Page-App in einem Dokument**, damit der User-Gesture aus dem Boot-Screen für Audio im ganzen Spiel gilt. Root-`index.html` leitet nur nach `console/` weiter.

```
app.js             Orchestrator, Screen-Routing
services/          Infrastruktur ohne UI
  connection.js    PeerJS, Raum-Code, Controller-Pool
  audio.js         Globaler AudioContext (im Boot-Klick erzeugt)
views/             Ein Modul pro Screen
  boot.js
  setup.js
  menu.js
  game.js
```

## Screen-System

| Screen | Beschreibung |
|---|---|
| `boot` | Initialer Screen. Terminal-Intro → „PRESS ANY KEY" → RETROCON-Animation. Der Klick hier erzeugt den globalen `AudioContext`. |
| `main-menu` | Vertikale Slide-Liste (RETROCON · CONTROLLER · SPIELE · EINSTELLUNGEN · CREDITS). Die CONTROLLER-Slide zeigt die QR-Codes für P1/P2 — ein separater Setup-Screen existiert nicht mehr. Auf der SPIELE-Slide navigiert Joystick/D-Pad links/rechts im Karussell, A startet das fokussierte Spiel. |
| `game-view` | Laufendes Spiel im Canvas. SELECT/ESC → Ingame-Menü (Pause-Overlay), nicht direkt zurück ins Hauptmenü. |

Menünavigation: jeder verbundene Controller kann das Menü steuern. Die Game-Card-Vorschau kommt pro Spiel als `artSvg` aus dem Spielmodul. Details zur Slide-Navigation und zum Ingame-Menü: [console/README.md](../console/README.md).

### Keyboard-Fallback

Die Console unterstützt zusätzlich Maus + Tastatur — nützlich wenn (noch) kein Controller verbunden ist oder zu Demo-Zwecken.

| Kontext | Taste | Aktion |
|---|---|---|
| Hauptmenü | P1: Pfeiltasten + Enter · P2: WASD + Leertaste | Slide-Navigation, Karussell, Spiel starten |
| Im Spiel | `Esc` | Ingame-Menü öffnen (Pause) |
| Ingame-Menü | WEITER / SPIEL BEENDEN / HILFE | Fortsetzen, beenden (zurück zur SPIELE-Slide) oder Steuerungsübersicht |

Klicks auf Game-Cards (Karussell) und Slide-Pfeile/Labels funktionieren wie auf einem Controller.

## Bekannte Einschränkungen

- **PeerJS Public Broker** (`0.peerjs.com`): kein SLA, Community-Dienst. Bei Ausfall eigenen Broker hosten oder wechseln.
- **Audio-Autoplay:** Browser blockieren Audio ohne User-Gesture. Gelöst durch SPA-Architektur: der Klick im Boot-Screen erzeugt einen globalen `AudioContext` in `services/audio.js`, der an Spiele via `api.audioCtx` durchgereicht wird — keine Seitennavigation dazwischen, also bleibt die Gesture gültig.
- **iOS Querformat:** Controller erfordert Querformat. Portrait zeigt Dreh-Hinweis.
- **Raum-Code wechselt** bei Seiten-Reload → Controller müssen neu scannen.
