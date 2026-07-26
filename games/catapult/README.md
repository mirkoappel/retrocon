# CATAPULT

**Spieler:** 1–2 · **Siegbedingung:** gegnerischen Burgkern zerstören — oder nach 90 s mehr Treffer gelandet haben

Zwei Katapulte beschießen sich über einen Berg hinweg. Jeder Spieler steht vor seiner eigenen Burg (P1 links/Cyan, P2 rechts/Pink) und wirft Steine im Bogen auf die gegnerische Seite. Wer zuerst den **Kern** der gegnerischen Burg zerstört, gewinnt sofort.

## Steuerung

| Eingabe | Aktion |
|---|---|
| Joystick hoch/runter | Abschusswinkel (15°–75°, absolut) |
| Dpad hoch/runter · Pfeiltasten | Abschusswinkel schrittweise (48°/s) |
| A halten | Kraft laden (Balken füllt sich in 1,1 s) |
| A loslassen | Stein abfeuern |
| A / START (Game Over) | Neustart |
| SELECT | Zurück zum Menü |

Nach jedem Schuss folgen **2 s Nachladezeit** — solange zeigt der Balken grau den Fortschritt. Beide Spieler feuern unabhängig voneinander, es gibt keine Züge.

## Burg

Die Burg besteht aus vier gestapelten Segmenten mit eigener Trefferzahl:

| Segment | Breite | HP |
|---|---|---|
| ZINNE (oben) | schmal | 2 |
| TURM | schmal | 3 |
| MAUER | breit | 3 |
| KERN (unten) | breit | 4 |

Jeder Treffer nimmt 1 HP und zeichnet einen zusätzlichen Riss ins Segment. Bei 0 HP bricht das Segment weg und **alle darüberliegenden rutschen nach** — die Burg sackt sichtbar zusammen. Ist der Kern zerstört, ist das Spiel vorbei.

Da Steine im Bogen von oben kommen, wird eine Burg in der Regel von oben nach unten abgetragen: die Zinne fällt zuerst, der Kern zuletzt.

## Umgebung

- **Gravitation** zieht jeden Stein in eine Parabel.
- **Wind** wirkt seitlich auf die Flugbahn und driftet alle ~7 s weich auf einen neuen Wert. Die Anzeige oben mittig zeigt Richtung (← / →) und Stärke (0,0–0,9).
- **Berg** in der Bildmitte blockiert flache Schüsse und erzwingt hohe Bögen.

Treffer auf die eigene Burg sind möglich (z. B. bei starkem Gegenwind), zählen aber nicht auf das eigene Trefferkonto.

## HUD

```
P1 ████████░░              1:30              ░░████████ P2
9 TREFFER              → WIND 0.5              12 TREFFER
```

Der Balken zeigt die verbleibenden HP der jeweiligen Burg, darunter die gelandeten Treffer — sie entscheiden das Spiel, wenn die Zeit abläuft. Der Timer blinkt rot in den letzten 10 Sekunden.

Am Katapult selbst stehen der aktuelle Winkel und der Kraft-/Nachladebalken; eine gepunktete Ziellinie wächst mit der geladenen Kraft.

## KI-Gegner

Die KI läuft für jeden nicht verbundenen Spieler. Zustandsautomat **AIM → CHARGE → FIRE**:

- **AIM**: Für fünf Kandidatenwinkel (45°–70°) wird die Flugbahn vorwärts simuliert und die Kraft per Binärsuche so bestimmt, dass der Stein das oberste noch stehende Segment der Gegnerburg erreicht. Weil die Simulation dieselbe Physik nutzt wie das Spiel, werden Wind und Berg automatisch berücksichtigt.
- **CHARGE**: Der Ladebalken läuft wie beim Menschen hoch, bis die Ziel-Kraft erreicht ist.
- **FIRE**: Schuss, danach 0,4–1,1 s Denkpause vor dem nächsten Zielvorgang.

Auf Winkel (±3°) und Kraft (±5 %) liegt Unschärfe, damit die KI schlagbar bleibt.

## Sounds

| Ereignis | Beschreibung |
|---|---|
| Laden | Ratschen-Tick alle 0,1 s, Tonhöhe steigt mit der Kraft (170→600 Hz) |
| Abschuss | Absteigender Sweep (220→60 Hz) + Rauschimpuls |
| Einschlag Boden/Berg | Dumpfer Rauschimpuls (Tiefpass 220 Hz) |
| Treffer auf Segment | Kurzer Knack (330 Hz) + heller Rauschimpuls |
| Segment zerstört | Absteigendes Grollen (250→70 Hz) + langer Rauschimpuls |
| Sieg | 5-Ton-Fanfare (523→1319 Hz) |
| Unentschieden | Zweistimmiger Akkord (392 + 523 Hz) |
