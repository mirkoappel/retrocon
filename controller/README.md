# Controller

Die Smartphone-Web-App, die als Game-Controller fungiert. Kein App-Download nötig — QR-Code auf dem Spielbildschirm scannen, fertig. Als PWA installierbar (Homescreen → Vollbild).

## Verbindung

1. Console zeigt QR-Code für P1 und P2
2. Smartphone öffnet QR-Scanner (oder direkt aus dem Homescreen als PWA)
3. QR-Code scannen → WebRTC-Verbindung (P2P, via PeerJS) wird aufgebaut
4. LED leuchtet grün → Controller bereit

Kein Server, kein Login. Der Peer-ID enthält den Raum-Code und den Spieler-Index.

## Dateistruktur

```
controller/
  index.html              Einstieg: lädt Variant-Picker oder letzte Variante
  core.js                 Shared-Infrastruktur: Verbindung, Gamepad-State, Send-Loop, Wake-Lock
  qr-scanner.js           QR-Kamera (BarcodeDetector nativ, jsQR als Fallback)
  manifest.webmanifest    PWA-Manifest (fullscreen landscape, Icons)
  icons/                  PNG-Icons (192, 512, maskable)
  variants/
    classic/              Default-Variante
      index.html
      app.js              Joystick + Buttons + Overlay-Binding
      style.css           Layout + Skins
```

## Classic-Variante

Layout (Landscape):

```
[ Joystick ]  [ SELECT · Gear · Wifi ]  [ A · B ]
```

- **Joystick**: Fixer Mittelpunkt, Dead-Zone ≈ 5 %. Liefert `x`/`y` (-1…1) und leitet D-Pad ab (Schwelle ~0,35).
- **A / B**: Rechts, nebeneinander. Daumen-erreichbar.
- **SELECT**: Öffnet Menü im Spiel (entspricht `SELECT` im Gamepad-Protokoll).
- **Gear-Icon**: Varianten-Picker (Classic / weitere).
- **Wifi-Icon**: QR-Scanner zum Neuverbinden.

### Skins

Über das Gear-Menü wählbar. Implementiert als CSS-Variablen:

| Skin | Gehäuse | Akzent |
|---|---|---|
| Crimson | Dunkelrot | Rot |
| Emerald | Dunkelgrün | Grün |
| Cobalt | Dunkelblau | Blau |
| Mono | Dunkelgrau | Weiß |

## Gamepad-Protokoll

Der Controller sendet alle ~33 ms ein JSON-Paket:

```json
{
  "player": 1,
  "joystick": { "x": 0.0, "y": -0.8, "active": true },
  "dpad":    { "up": true, "down": false, "left": false, "right": false },
  "a": false, "b": false, "select": false, "start": false
}
```

Koordinaten canvas-konform: `x+` = rechts, `y+` = unten. Vollständiges Schema: [docs/protocol.md](../docs/protocol.md).

## PWA-Install

- **Android (Chrome)**: „Zum Startbildschirm hinzufügen" → startet fullscreen landscape, System-Bars ausgeblendet
- **iOS (Safari)**: „Zum Home-Bildschirm" → startet fullscreen (Status-Bar bleibt sichtbar, iOS-Einschränkung)

## Neue Variante hinzufügen

1. Ordner `variants/<name>/` mit `index.html`, `app.js`, `style.css`
2. `window.RC` aus `core.js` nutzen: `RC.sendGamepad(gp)`, `RC.onConnect(cb)`, `RC.onDisconnect(cb)`
3. Variante registriert sich im Variant-Picker via `data-variant`-Attribut

Ausführliche Anleitung: [docs/controller-variants.md](../docs/controller-variants.md).
