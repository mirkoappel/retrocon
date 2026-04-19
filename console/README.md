# Console

Die SPA, die auf dem Bildschirm läuft. Enthält Boot-Intro, Setup-Screen, Spielmenü und Canvas-Game-View in einem einzigen Dokument — so bleibt der AudioContext über alle Screens hinweg gültig.

## Screen-Flow

```
Boot  →  Setup (QR-Codes)  →  Hauptmenü  →  Game-View
              ↑                   ↑
              └── B (Controller) ─┘
```

- **Boot**: Terminal-Intro + RETROCON-Animation. Der erste Klick/Tap erzeugt den globalen AudioContext.
- **Setup**: Zeigt QR-Codes für P1 und P2. Smartphone scannt → verbindet sich per WebRTC. Sobald mindestens ein Controller verbunden ist, erscheint der „A zum Starten"-Hinweis.
- **Hauptmenü**: Horizontales Karussell aller registrierten Spiele (aus `window.RetroGames`). B öffnet Setup zum Hinzufügen/Wechseln eines Spielers.
- **Game-View**: Canvas im Vollbild. SELECT auf dem Controller → zurück ins Hauptmenü.

## Dateistruktur

```
console/
  index.html          Shell: Screen-Container für alle Views
  style.css           Alle Styles (Boot, Setup, Menü, HUD, Overlays)
  app.js              Orchestrator: Screen-Routing, Event-Verdrahtung
  services/
    connection.js     PeerJS-Verbindung, Raum-Code, Controller-Pool, Gamepad-State
    audio.js          Globaler AudioContext (lazy, im Boot-Gesture erzeugt)
  views/
    boot.js           Terminal-Intro + RETROCON-Animation + Audio-Init
    setup.js          QR-Codes + Player-Status-Anzeige
    menu.js           Karussell + Navigation + Keyboard-Fallback
    game.js           Canvas + requestAnimationFrame-Loop + Game-API
```

## Keyboard-Steuerung (Entwicklung / Demo ohne Controller)

| Taste | Aktion |
|---|---|
| Beliebige Taste / Klick | Boot starten |
| Pfeiltasten | Karussell-Navigation im Menü |
| A / Enter | Spiel auswählen |
| B | Setup-Screen öffnen |
| Esc | Im Menü: Setup; im Spiel: zurück ins Menü |

## Raum-Code & Verbindung

`connection.js` generiert beim Start einen zufälligen 4-stelligen Code (`console-XXXX`). Controller verbinden sich als Peers `XXXX-1` bzw. `XXXX-2`. Die Verbindung ist P2P via PeerJS — kein eigener Server nötig.

## Game-API (`api`-Objekt)

Jedes Spiel bekommt beim Start ein `api`-Objekt:

| Eigenschaft | Beschreibung |
|---|---|
| `api.exit()` | Zurück zum Hauptmenü |
| `api.getConns()` | `Map(playerIndex → DataConnection)` der verbundenen Controller |
| `api.audioCtx` | Globaler AudioContext (nicht schließen!) |
| `api.code` | Aktueller Raum-Code (4-stellig) |

Neue Spiele registrieren sich an `window.RetroGames` — das Karussell baut sich automatisch daraus. Siehe [docs/games.md](../docs/games.md).
