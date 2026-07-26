# CATAPULT

**Spieler:** 1–2 · **Siegbedingung:** die gegnerische Burg komplett abräumen — oder nach 5 Minuten mehr Treffer gelandet haben

Zwei Katapulte beschießen sich über einen Berg hinweg. Jeder Spieler steht vor seiner eigenen Burg (P1 links/Cyan, P2 rechts/Pink) und wirft Steine im Bogen auf die gegnerische Seite. Wer zuerst **alle vier Segmente** der gegnerischen Burg abgeräumt hat, gewinnt.

## Steuerung

**Controller (Smartphone):**

| Eingabe | Aktion |
|---|---|
| Joystick hoch/runter | Abschusswinkel (15°–75°, absolut) |
| A halten | Kraft laden (Balken füllt sich in 1,1 s) |
| A loslassen | Stein abfeuern |
| A / START (Game Over) | Neustart |
| SELECT | Zurück zum Menü |

**Tastatur** — alles mit den Pfeiltasten spielbar, Enter wird nicht gebraucht:

| Taste | Aktion |
|---|---|
| ← / → | Wurfarm schwenken |
| ↓ halten | Kraft laden |
| ↓ loslassen | Stein abfeuern |
| Enter | spannt ebenfalls (gleichwertig zu ↓) |

Links/rechts folgen der Blickrichtung: bei P1 (links) senkt **→** den Winkel, bei P2 (rechts) spiegelbildlich **←**. Der Arm bewegt sich also immer dorthin, wohin die Taste zeigt.

Das Schwenken beginnt fein (15°/s) und beschleunigt beim Halten auf 58°/s — ein kurzer Tipper verstellt den Winkel um rund 2°, ein voller Schwenk von 15° auf 75° dauert etwa 1,4 s. Die Werte stehen als `ANGLE_RATE_MIN`, `ANGLE_RATE_MAX` und `ANGLE_ACCEL_T` im Modul.

**Spieler 2 an derselben Tastatur:** `W A S D` steuert P2 spiegelbildlich — `A`/`D` schwenken, `S` spannt und feuert, Leertaste spannt ebenfalls. Spieler 2 wird von der KI gespielt, bis jemand im Spiel eine der WASD-Richtungstasten drückt; ab dann gehört der Platz dem Menschen. Es gibt nichts auszuwählen, und ein Smartphone-Controller hat jederzeit Vorrang. Details: [console/README.md](../../console/README.md).

Nach jedem Schuss folgen **2 s Nachladezeit** — solange zeigt der Balken grau den Fortschritt. Beide Spieler feuern unabhängig voneinander, es gibt keine Züge.

## Burg

Die Burg besteht aus vier gestapelten Segmenten — ZINNE und TURM schmal, MAUER und KERN breit. Jedes Segment fliegt **beim ersten Treffer** weg, und **alle darüberliegenden rutschen nach**: die Burg sackt sichtbar zusammen. Erst wenn alle vier abgeräumt sind, ist die Burg gefallen — es gibt keine Abkürzung über ein einzelnes Schlüsselsegment.

Die Trefferzahl pro Segment steckt als `hp` in `SEG_DEF` — auf 2 oder 3 gesetzt braucht ein Segment entsprechend mehr Treffer und zeigt dann Risse als Schadensanzeige.

Da Steine im Bogen von oben kommen, wird eine Burg in der Regel von oben nach unten abgetragen: die Zinne fällt zuerst, der Kern zuletzt.

## Umgebung

- **Gravitation** zieht jeden Stein in eine Parabel.
- **Wind** wirkt seitlich auf die Flugbahn und driftet alle ~7 s weich auf einen neuen Wert.
- **Berg** in der Bildmitte blockiert flache Schüsse und erzwingt hohe Bögen.

Der Wind wird ausschließlich über die **Flagge auf der Bergspitze** angezeigt — genau dort, wo die Flugbahnen vorbeikommen, und ohne Zahlenwert. Sie streckt sich in Windrichtung und weht umso schneller, je stärker der Wind ist; bei Flaute hängt sie schlaff herunter.

Treffer auf die eigene Burg sind möglich (z. B. bei starkem Gegenwind), zählen aber nicht auf das eigene Trefferkonto.

## HUD

```
P1 █████░░░░░             4:47              ░░░███████ P2
1 TREFFER                                    2 TREFFER
```

Der Balken zeigt die verbleibenden Segmente der jeweiligen Burg, darunter die gelandeten Treffer — sie entscheiden das Spiel, wenn die Zeit abläuft. Der Timer blinkt rot in den letzten 10 Sekunden. Unter dem Timer steht bewusst nichts: den Wind liest man an der Flagge ab.

Am Katapult selbst stehen der aktuelle Winkel und der Kraft-/Nachladebalken; eine gepunktete Ziellinie wächst mit der geladenen Kraft.

## KI-Gegner

Die KI läuft für jeden nicht verbundenen Spieler. Zustandsautomat **AIM → CHARGE → FIRE**:

- **AIM**: Für fünf Kandidatenwinkel (45°–70°) wird die Flugbahn vorwärts simuliert und die Kraft per Binärsuche so bestimmt, dass der Stein das oberste noch stehende Segment der Gegnerburg erreicht. Weil die Simulation dieselbe Physik nutzt wie das Spiel, werden Wind und Berg automatisch berücksichtigt.
- **CHARGE**: Der Ladebalken läuft wie beim Menschen hoch, bis die Ziel-Kraft erreicht ist.
- **FIRE**: Schuss, danach 1,4–3,2 s Denkpause vor dem nächsten Zielvorgang.

Auf Winkel (`AI_ANGLE_ERR`, ±7°) und Kraft (`AI_POWER_ERR`, ±11 %) liegt Unschärfe, damit die KI schlagbar bleibt.

**Spiellänge justieren:** Da jedes Segment schon beim ersten Treffer wegfliegt, ist die **Denkpause** (`AI_THINK_MIN` / `AI_THINK_VAR`) der wirksamste Hebel — eine bedächtigere KI lässt dem Menschen Zeit, ohne schlechter zu zielen. Mehr Streuung auf Winkel und Kraft bringt ab einem gewissen Punkt kaum noch etwas und lässt die KI nur planlos wirken. Mit den aktuellen Werten dauert ein KI-gegen-KI-Match rund 23–67 s (Mittel ~34 s); die 5 Minuten Matchzeit sind also eine Obergrenze, kein Richtwert. Wer längere Partien will, gibt der Burg in `SEG_DEF` mehr Segmente.

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
