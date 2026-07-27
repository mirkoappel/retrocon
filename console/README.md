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
| 3 | EINSTELLUNGEN | Nur Globales: Lautstärke, Bildröhre, Vollbild |
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
| **Controller** | Verbindet sich ein Smartphone für einen Platz, hat es Vorrang: `getConns()` trägt `conns` vor den Tastaturspielern ein. Trennt sich der Controller, springt die Tastatur bzw. die KI wieder ein |

**Die Tastatur bleibt auch bei verbundenem Controller bedienbar** — sonst ließen sich mit angeschlossenem Smartphone weder Menüs bedienen noch das Spiel steuern. Sie wird dann nur durchgereicht, solange wirklich eine Taste liegt, plus der Loslass-Frame, damit Flanken (Taste loslassen = schießen) nicht verlorengehen. Ein leeres Tastatur-Gamepad würde sonst jeden Frame die Controller-Eingabe überschreiben.

Der Anspruch auf P2 entsteht bewusst **nur im laufenden Spiel und nur über Richtungstasten** (`claimByKey`): Die Leertaste ist P2s Aktionstaste — ein Reflex darauf würde sonst stillschweigend den KI-Gegner abschalten. Und im Menü ist WASD bloß Navigation, mit der sich ein Solospieler nicht versehentlich den Gegner wegnehmen soll.

Spiele erfahren davon nichts weiter als `api.getConns()`; sie starten die KI für jeden Platz, der dort fehlt. Weil alle Spiele das **pro Frame** auswerten (`numPlayers` aus `create()` wird nirgends benutzt), kann ein zweiter Spieler mitten im Match einsteigen.

## Einstellungen

Zwei Ebenen, die **nicht vermischt** werden:

| Ebene | Wo | Was | Gespeichert unter |
|---|---|---|---|
| **Global** | Konsolenmenü, Zeile EINSTELLUNGEN | Lautstärke, Bildröhre, Vollbild | `retrocon.settings` |
| **Spielspezifisch** | Ingame-Menü des laufenden Spiels | Was nur dieses Spiel angeht | `retrocon.game.<id>` |

Die Konsole kennt keine Spielbegriffe. Was ein Spiel anbietet, deklariert es selbst:

```js
window.RetroGames.soccer = {
  settings: [
    { key: 'duration', label: 'HALBZEIT', werte: [60, 90, 120, 180, 300],
      vorgabe: 180, zeige: v => (v / 60).toFixed(0) + ' MIN' },
  ],
};
```

Im Spiel gelesen über `api.setting('duration')`. Fehlt `api.setting` (Prüfstand, Einbettung), muss der Vorgabewert greifen:

```js
const HALF_TIME = api.setting?.('duration') ?? 180;
```

Ein Spiel braucht für einen eigenen Regler also nichts am Menü zu ändern — und das Konsolenmenü bleibt frei von Dingen, die nur ein einzelnes Spiel betreffen.

### Bedienung — beide Ebenen gleich

Beide Einstellungs-Screens sind **dasselbe Karussell**, mit denselben Karten und denselben Tasten: **← →** blättert durch die Regler, **A / Enter** ändert den ausgewählten, **↑ ↓** verlässt den Screen. Mausklick wählt eine Karte, der zweite Klick ändert sie; die ‹ › am Rand sind anklickbar.

Waagerecht deshalb, weil ↑ ↓ im Hauptmenü für den Zeilenwechsel belegt sind — eine senkrechte Liste stritte sich damit. Im Spiel gilt dieselbe Aufteilung, damit man nicht zwei Bedienarten lernen muss.

| Eintrag | Werte | Wirkung |
|---|---|---|
| LAUTSTÄRKE | 0–100 % | Master-Gain vor dem Ausgang, quadratisch geregelt |
| BILDRÖHRE | AN / AUS | Scanline-Overlay (`body.no-scanlines`) |
| VOLLBILD | AN / AUS | `requestFullscreen()` |

**Lautstärke ohne Eingriff in die Spiele:** Alle Spiele verbinden ihre Klänge auf `audioCtx.destination`. Sie bekommen deshalb nicht den AudioContext selbst, sondern eine Hülle (`Proxy`), deren `destination` ein Master-Gain ist. Der Regler wirkt damit überall, ohne dass ein einziges Spiel angefasst werden musste.

### Spiel-Einstellungen

Zwei Wege dorthin, beide führen auf denselben Screen mit dem Titel **INGAME EINSTELLUNGEN**:

- **ESC → EINSTELLUNGEN** im Pausenmenü
- **aus dem Startmenü des Spiels selbst**, über `api.openSettings()`. STREET SOCCER bietet das als dritten Punkt neben WORLD CUP und FREUNDSCHAFTSSPIEL an — so kommt man an Halbzeitlänge und Schwierigkeit, ohne erst anpfeifen zu müssen. Zurück führt dann auch dorthin zurück und nicht ins Pausenmenü, das man nie aufgerufen hat. Dauer und Stärke liest ein Spiel beim Start — die Änderung gilt deshalb ab dem nächsten Spiel, und der Hinweis unter dem Karussell sagt das auch.

## Ingame-Menü

ESC (Tastatur) oder SELECT (Controller) öffnet das Pause-Menü. Das Spiel pausiert, der Canvas bleibt im Hintergrund sichtbar.

Das Menü nutzt denselben Slide-Mechanismus wie das Hauptmenü:

**Slide 0 — Pause**

| Eintrag | Aktion |
|---|---|
| WEITER | Spiel fortsetzen (auch: ESC / B) |
| SPIEL BEENDEN | Zurück zum SPIELE-Slide, letztes Spiel im Fokus |
| EINSTELLUNGEN | → Slide 1, die Regler dieses Spiels |
| HILFE | → Slide 2 |

**Slide 2 — Steuerung**

Eine Tabelle aus Taste, zweiter Taste und Bedeutung, in drei Abschnitten: Bewegen, Tasten, Wer spielt mit. Die allgemeinen Zeilen stehen in `game.js`; was **A und B im laufenden Spiel** bedeuten, weiß nur das Spiel und liefert es über `help` am Modul — dieselbe Idee wie bei `settings`. Zurück per Pfeil-Hoch, W, Backspace, ESC, B oder Klick auf „← ZURÜCK".

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

## Zwischenspeicher

GitHub Pages liefert `cache-control: max-age=600`. Ohne Gegenmaßnahme kann der Browser bis zu zehn Minuten lang eine **alte Spieldatei zu einer neuen `index.html`** mischen — ein längst behobener Fehler sieht dann aus, als wäre er zurück.

Deshalb trägt jede eigene Datei die Version im Namen:

```html
<script src="../games/soccer/soccer.js?v=0.18.8"></script>
```

Beim Versionssprung wird der Anhang mitgezogen; der Prüfstandsfall `konsole-cache` schlägt an, wenn eine Datei zurückbleibt.

**Nicht abgedeckt** sind die ES-Module unter `console/` — deren `import`-Pfade müssten dafür einzeln versioniert werden, was bei jedem Sprung 16 Zeilen beträfe. Sie ändern sich seltener als die Spiele; im Zweifel hilft ein harter Neuladen.

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
