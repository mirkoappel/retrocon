# Console

Die SPA, die auf dem Bildschirm läuft. Enthält Boot-Intro, Hauptmenü und Canvas-Game-View in einem einzigen Dokument — so bleibt der AudioContext über alle Screens hinweg gültig.

## Screen-Flow

```
Boot  →  Hauptmenü (Slide: RETROCON)
              ↓  navigieren
         Slide: CONTROLLER   ← QR-Codes, Player-Status
         Slide: SPIELE        ← Karussell, Spiel starten
         Slide: EINSTELLUNGEN
         Slide: CREDITS
              ↓  Spiel starten
         Game-View
              ↓  ESC
         Ingame-Menü (WEITER / SPIEL BEENDEN / HILFE)
```

## Hauptmenü — 2D-Navigation

Das Menü ist als vertikale **Slide-Liste** aufgebaut. Horizontal scrollt das Spiele-Karussell.

### Zeilen (Rows)

| Index | Slide | Inhalt |
|---|---|---|
| 0 | RETROCON | Logo-Animation |
| 1 | CONTROLLER | QR-Codes für P1 + P2, Verbindungsstatus |
| 2 | SPIELE | Karussell aller registrierten Spiele |
| 3 | EINSTELLUNGEN | (bald verfügbar) |
| 4 | CREDITS | (bald verfügbar) |

### Navigation

| Eingabe | Aktion |
|---|---|
| ↑ / ↓ · W / S · Dpad | Slide wechseln |
| ← / → · A / D · Dpad (auf SPIELE) | Karussell-Navigation |
| Enter / Leertaste / A (auf SPIELE) | Spiel starten |
| Klick auf Pfeil/Label oben/unten | Slide wechseln |
| Klick auf Karte (1×) | Karte fokussieren |
| Klick auf Karte (2×) | Spiel starten |
| Mausrad | Slide wechseln (700 ms Cooldown) |

### Keyboard-Belegung (ohne Controller)

| Spieler | Bewegung | Bestätigen | Spezial |
|---|---|---|---|
| P1 | Pfeiltasten | Enter | Shift (B) |
| P2 | W A S D | Leertaste | Q (B) |

Im **Menü** funktionieren beide Schemas gleichwertig zur Navigation (`menu.js` behandelt Pfeiltasten und WASD identisch) — genau wie jeder verbundene Controller das Menü steuern darf.

### Wer spielt einen Platz? (keine Auswahl nötig)

Ein Platz gehört der KI, bis ihn jemand übernimmt. Das regelt sich von selbst:

| Platz | Verhalten |
|---|---|
| **P1** | Immer der Mensch an den Pfeiltasten — nie KI. Festgelegt durch `addLocalPlayer(1)` in `setup.js` |
| **P2** | KI, bis jemand **im Spiel** eine WASD-Richtungstaste drückt. Dann übernimmt der zweite Mensch dauerhaft |
| **Controller** | Verbindet sich ein Smartphone für einen Platz, hat es Vorrang: `getConns()` trägt `conns` vor den Tastaturspielern ein, und `game.js` reicht die Tastatur für diesen Platz nicht mehr durch. Trennt sich der Controller, springt die Tastatur bzw. die KI wieder ein |

Der Anspruch auf P2 entsteht bewusst **nur im laufenden Spiel und nur über Richtungstasten** (`claimByKey`): Die Leertaste ist P2s Aktionstaste — ein Reflex darauf würde sonst stillschweigend den KI-Gegner abschalten. Und im Menü ist WASD bloß Navigation, mit der sich ein Solospieler nicht versehentlich den Gegner wegnehmen soll.

Spiele erfahren davon nichts weiter als `api.getConns()`; sie starten die KI für jeden Platz, der dort fehlt. Weil alle Spiele das **pro Frame** auswerten (`numPlayers` aus `create()` wird nirgends benutzt), kann ein zweiter Spieler mitten im Match einsteigen.

## Ingame-Menü

ESC (Tastatur) oder SELECT (Controller) öffnet das Pause-Menü. Das Spiel pausiert, der Canvas bleibt im Hintergrund sichtbar.

Das Menü nutzt denselben Slide-Mechanismus wie das Hauptmenü:

**Slide 0 — Pause**

| Eintrag | Aktion |
|---|---|
| WEITER | Spiel fortsetzen (auch: ESC / B) |
| SPIEL BEENDEN | Zurück zum SPIELE-Slide, letztes Spiel im Fokus |
| HILFE | → Slide 1 |

**Slide 1 — Steuerung**

Übersicht aller Eingabemethoden. Zurück per Pfeil-Hoch, W, Backspace, ESC, B oder Klick auf „← ZURÜCK".

## Dateistruktur

```
console/
  index.html          Shell: Screen-Container für alle Views + Ingame-Overlay
  style.css           Alle Styles (Boot, Menü, Slides, Ingame-Overlay, Toast)
  app.js              Orchestrator: Screen-Routing, Controller-Input-Routing
  services/
    connection.js     PeerJS-Verbindung, Raum-Code, Controller-Pool, Gamepad-State
    audio.js          Globaler AudioContext (lazy, im Boot-Gesture erzeugt)
  views/
    boot.js           Terminal-Intro (oben links) + RETROCON-Animation auf Slide 0
    setup.js          QR-Codes + Player-Status-Anzeige (Controller-Slide)
    menu.js           Slide-Navigation, Karussell, Keyboard + Controller-Input
    game.js           Canvas + RAF-Loop + Ingame-Menü + Pause-System
```

## Boot

Terminal-Ausgabe oben links, monospace, Zeilen erscheinen zeitversetzt. Nach der letzten Zeile blinkt „PRESS ANY KEY TO START" im selben Stil. Erster Klick/Tap/Taste:

1. Boot-Screen blendet ab, Hauptmenü erscheint auf Slide 0 (RETROCON)
2. RETROCON-Logo animiert buchstabenweise
3. Nutzer navigiert manuell weiter → lernt das Menüsystem

## Game-API (`api`-Objekt)

Jedes Spiel bekommt beim Start ein `api`-Objekt:

| Eigenschaft | Beschreibung |
|---|---|
| `api.exit()` | Spiel beenden, zurück zum SPIELE-Slide |
| `api.getConns()` | `Map(playerIndex → 'keyboard' \| DataConnection)` |
| `api.audioCtx` | Globaler AudioContext (nicht schließen!) |
| `api.code` | Aktueller Raum-Code (4-stellig) |

Neue Spiele registrieren sich an `window.RetroGames` — das Karussell baut sich automatisch daraus. Siehe [docs/games.md](../docs/games.md).
