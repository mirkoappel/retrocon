# Prüfstand

```bash
node tests/run.js
```

Kein Build, keine Abhängigkeiten. Die Spieldateien werden eingelesen und in einer Node-Umgebung ausgeführt, in der `window` und ein Canvas-Kontext nachgebildet sind.

| Aufruf | Wirkung |
|---|---|
| `node tests/run.js` | die schnellen Fälle (unter einer Sekunde) |
| `node tests/run.js --full` | zusätzlich die statistischen (mehrere Minuten, viele volle Spiele) |
| `node tests/run.js soccer` | nur Fälle, deren Datei- oder Anzeigename den Teil enthält |

## Warum es das gibt

Jeder Fall hier steht für einen Fehler, der schon einmal im Spiel war und beim Spielen aufgefallen ist — nicht für eine ausgedachte Möglichkeit:

| Fall | Der Fehler, der ihn ausgelöst hat |
|---|---|
| `soccer-contact` | Spieler traten den Ball aus 0,046 Entfernung — sie hatten unsichtbare Füße |
| `soccer-turn` | Mit Ball ließ sich die Richtung nicht ändern; der Ball rollte geradeaus weiter, während der Spieler abbog |
| `soccer-loose` | Der Ball blieb herrenlos liegen, weil er beim Abbiegen verloren ging und auslief |
| `soccer-kickoff` | Der Anstoßpass ging ins Leere, der Abnehmer lief dem Ball nicht entgegen |
| `soccer-duel` | Ballabnahme von hinten war geometrisch unmöglich (0 von 120 Verfolgungen) — die Obergrenze hält sie umgekehrt davon ab, zu leicht zu werden |
| `soccer-menu` | Zurück aus der Mannschaftswahl führte im Einzelspiel auf den falschen Bildschirm |
| `soccer-balance` | Eine Mannschaft traf dreimal so oft wie die andere, weil eine Ballaktion mitten im Entscheidungsdurchgang griff |
| `soccer-cup` | Der Turnieraufschlag galt für beide Mannschaften und wirkte deshalb kaum |
| `settings-games` | Spiele müssen ihre eigenen Regler deklarieren, übernehmen *und* ohne die Konsole laufen |
| `soccer-dive` | Der Hechtsprung muss vorkommen, aber die Ausnahme bleiben — und darf den Ball nie führen |
| `soccer-torwart` | Die Torhüter bewegten sich im Gleichschritt und kamen nie heraus |
| `soccer-tor` | Ein Tor war nach 2,4 s vorbei; später kam nach der selbst gewählten Wiederholung noch eine automatische |
| `soccer-wechsel` | Der Spielerwechsel war fest verdrahtet statt einstellbar |
| `soccer-b-taste` | Angriff und Grätsche ließen sich mit der Tastatur nicht auslösen |
| `soccer-zuschauen` | Ein Spiel blieb an der Halbzeit- und der Ergebnistafel stehen, statt von selbst weiterzulaufen |
| `soccer-ergebnis` | Die Ergebnistafel war eine Tafel ohne Menü, und „WEITER" las sich als Taste statt als Ergebnis |
| `soccer-wiederholung` | In der Zeitlupe hingen die Animationen, weil nur Positionen mitgeschnitten wurden |
| `spiele-hoisting` | Fünfmal stand eine Konstante unterhalb der öffentlichen Schnittstelle und wurde nie initialisiert |
| `konsole-cache` | Der Browser mischte eine alte Spieldatei zu einer neuen `index.html` |

**Beobachte den Zustand, nicht die Zierde.** `playMatch` erkannte Halbzeit und Abpfiff einmal am gezeichneten Text „A · WEITER". Als diese Tastenhinweise aus den Menüs flogen, lief jeder statistische Lauf still ins Zeitlimit und gab den Halbzeitstand als Endstand aus. Für Spielabschnitte also `state.phase` nehmen; der gezeichnete Text taugt für Inhalte, die auch wirklich Inhalt sind (Spielstand, Mannschaftsnamen).

## Einen Fall schreiben

Eine Datei in `cases/`, die ein Objekt ausliefert:

```js
module.exports = {
  name: 'Fussball · kurze Beschreibung',
  slow: false,                 // true = nur bei --full
  run() {
    return { ok: true, info: 'was gemessen wurde, mit Zahlen' };
  }
};
```

`info` gehört immer die Messung selbst, nicht bloß „bestanden" — beim Nachjustieren an Konstanten ist der Zahlenwert das Nützliche.

## Werkzeug (`harness.js`)

| Funktion | Zweck |
|---|---|
| `session(spiel, {conns, settings, inject})` | Partie starten. Liefert `game`, `state`, `screen()`, `send(gp)`, `tap()`, `step(dt)` |
| `playMatch(s, onFrame)` | Menü durchtippen und bis zum Abpfiff spielen; liefert `[tore0, tore1]` |
| `pad(o)` / `stick(x, y)` | Gamepad-Zustände |
| `quantile`, `mean` | Auswertung |

Beobachtet wird möglichst so, wie es ein Mensch sähe — über `screen()`, also die Texte, die das Spiel zeichnet. Nur wo das nicht reicht, greifen Fälle über `state` auf den Spielzustand zu; `__state` blendet der Prüfstand beim Einlesen ein, damit die ausgelieferte Datei davon nichts wissen muss.

`inject` erlaubt einem Fall, zusätzliche Messpunkte in den Quelltext zu setzen — so misst `soccer-contact` bei jedem Schuss den Abstand Spieler–Ball.
