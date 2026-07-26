# STREET SOCCER

**Spieler:** 1–2 · **Modi:** WORLD CUP · FREUNDSCHAFTSSPIEL

Kleinfeld-Fußball aus der Vogelperspektive, 5 gegen 5. Du greifst immer **nach oben** an, dein Tor liegt unten. Zwei Menschen spielen in **derselben** Mannschaft — die gegnerische Mannschaft ist immer KI.

## Modi

| Modus | Ablauf |
|---|---|
| **WORLD CUP** | Achtelfinale → Viertelfinale → Halbfinale → Finale. Vier Siege in Folge machen dich zum Weltmeister. Eine Niederlage und der Lauf ist vorbei. Endet ein Spiel unentschieden, geht es in die **Verlängerung mit Golden Goal** |
| **FREUNDSCHAFTSSPIEL** | Ein einzelnes Spiel, Gegner frei wählbar. Unentschieden bleibt Unentschieden |

Die KI wird pro Turnierrunde stärker (`skill()`): schnellere Spieler, präzisere Schüsse, härtere Zweikämpfe.

## Steuerung

Der aktive Spieler wechselt **automatisch** zum ballnächsten Mitspieler; hat deine Mannschaft den Ball, übernimmst du den Ballführenden. Der Torwart bleibt immer KI.

| Eingabe | Mit Ball | Ohne Ball |
|---|---|---|
| **A** (Enter / Leertaste) | Schuss aufs Tor | Grätsche — kurzer Antritt, deutlich höhere Chance auf Balleroberung |
| **B** (Shift / Q) | Abspiel zum besten Mitspieler | Spieler wechseln |
| **Richtung** | Laufen | Laufen |
| **SELECT** | Zurück zum Menü | Zurück zum Menü |

Bei zwei Menschen bekommt jeder seinen eigenen Spieler — dieselbe Figur kann nie doppelt belegt werden. Die Markierungsringe zeigen wer wen steuert: Cyan = Spieler 1, Pink = Spieler 2.

## Regeln

Bewusst weggelassen: **Abseits, Fouls, Einwurf, Ecken**. Der Ball prallt stattdessen von den Seitenlinien ab. Das hält das Spiel durchgehend in Bewegung und passt zum Arcade-Charakter der anderen RETROCON-Spiele.

Ein Tor zählt nur bei **freiem Ball** — der Ball muss geschossen oder gepasst über die Linie gehen. Sonst könnte man ihn einfach ins Tor tragen, indem man vorwärts läuft.

**Kein Seitenwechsel zur Halbzeit.** Es gibt eine Pause mit Zwischenstand, aber die Blickrichtung bleibt: sonst würde „hoch" in der zweiten Halbzeit rückwärts bedeuten.

Spielzeit: 2 × 3 Minuten (`HALF_TIME`).

## Mannschaften

16 Nationen mit Trikotfarben. Sind sich die Farben zweier Mannschaften zu ähnlich (`colorClash`, RGB-Abstand < 110), weicht der Gegner automatisch auf sein Zweitset aus.

## Feld und Koordinaten

Positionen liegen in **Feldeinheiten**: Feldlänge = 1,0, Breite = `FIELD_W` (0,66), beide Achsen im selben Maßstab. Dadurch ist Bewegung richtungsunabhängig und `resize()` muss nichts umrechnen — es merkt sich nur die neue Canvas-Größe.

`y = 0` ist die eigene Torlinie (unten im Bild), `y = 1` die gegnerische.

## Reihenfolge-Unabhängigkeit

Damit keine Mannschaft allein dadurch im Vorteil ist, dass sie im Array weiter hinten steht, laufen drei Dinge bewusst in zwei Schritten:

1. **Bewegung**: Erst entscheiden alle Spieler aus demselben Weltzustand, dann bewegen sich alle. Sonst sähe die zweite Mannschaft bereits die neuen Positionen der ersten.
2. **Ballaktionen**: Schuss und Abspiel werden nur vorgemerkt und erst nach dem Entscheidungsdurchgang ausgeführt (`pending` / `applyPending`). Sonst reagierte die später verarbeitete Mannschaft einen Tick früher auf den freigegebenen Ball.
3. **Zweikampf und Kollision**: Der Ballführende wird zu Beginn festgehalten, es gibt höchstens einen Ballwechsel pro Frame, und Abstoßungen werden gesammelt statt sofort angewandt.

Ohne diese Trennung gewann die zweite Mannschaft im Testlauf rund **dreimal so viele Tore**.

## Balance

Ein KI-gegen-KI-Spiel endet im Schnitt bei **rund 8 Toren gesamt** (typisch 3:5, 4:6, 1:4). Stellschrauben:

| Konstante | Wirkung |
|---|---|
| `GOAL_W` | Torbreite — der stärkste Hebel für die Torquote |
| `GK_REACH`, `SPEED_GK` | Reichweite und Tempo des Torwarts |
| `spread` in `doShoot` | Schussstreuung; wächst mit der Distanz |
| `PLAYER_R * 2.9`, `rate` im Zweikampf | Wie leicht der Ball erobert wird |
| `HALF_TIME` | Halbzeitlänge |

## Sounds

| Ereignis | Beschreibung |
|---|---|
| Anpfiff / Halbzeit / Abpfiff | Doppelter Trillerpfiff (Sweep 2100→2600 Hz) |
| Schuss | Tiefer Impuls (140 Hz) + heller Anschlag |
| Abspiel | Kurzer Blip (420 Hz) |
| Balleroberung | Kratziger Sägezahn (90 Hz) |
| Pfosten / Seitenlinie | Heller Klack (900 Hz) |
| Parade | Blip (260 Hz) |
| Tor | 4-Ton-Fanfare (523→1046 Hz) |
| Sieg | 6-Ton-Fanfare |
| Aus | Absteigender Dreiklang (392→262 Hz) |
