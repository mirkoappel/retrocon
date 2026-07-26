# STREET SOCCER

**Spieler:** 1–2 · **Modi:** WORLD CUP · FREUNDSCHAFTSSPIEL

Kleinfeld-Fußball aus der Vogelperspektive, **3 gegen 3** (Torwart + zwei Feldspieler). Du greifst immer **nach oben** an, dein Tor liegt unten.

Zu zweit lässt sich wählen, ob man **miteinander** oder **gegeneinander** spielt:

| Auswahl | Bedeutung |
|---|---|
| **MITEINANDER** | Beide Menschen in derselben Mannschaft, Gegner ist KI |
| **GEGENEINANDER** | Spieler 2 steuert die gegnerische Mannschaft. Im World Cup bleibt es der Turnierlauf von Spieler 1 |

Mit nur einem verbundenen Spieler hat die Auswahl keine Wirkung.

## Modi

| Modus | Ablauf |
|---|---|
| **WORLD CUP** | Achtelfinale → Viertelfinale → Halbfinale → Finale. Vier Siege in Folge machen dich zum Weltmeister. Eine Niederlage und der Lauf ist vorbei. Endet ein Spiel unentschieden, geht es in die **Verlängerung mit Golden Goal** |
| **FREUNDSCHAFTSSPIEL** | Ein einzelnes Spiel, Gegner frei wählbar. Unentschieden bleibt Unentschieden |

Die KI wird pro Turnierrunde stärker (`skill()`): schnellere Spieler, präzisere Schüsse, härtere Zweikämpfe.

Damit die Verlängerung nicht endlos läuft, lassen beide Torhüter dort gleichmäßig nach (`gkFatigue`): ihr Fangradius schrumpft über 90 Sekunden auf 35 %, ein Tor fällt also zuverlässig.

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

**Der Torwart darf nicht bedrängt werden.** Hat er den Ball in der Hand, kann ihn niemand erobern (die Zweikampf-Schleife überspringt Torhüter), und gegnerische Feldspieler weichen aktiv auf `KEEPER_SPACE` (0,17) zurück. Ohne das Zurückweichen stünden sie ihm im Abschlag und fingen den Ball sofort wieder ab.

Die **Torprüfung läuft vor der Ballaufnahme**. Der Fangradius des Torwarts reicht tiefer als das Tor — stünde die Aufnahme vorn, fischte er auch Bälle heraus, die die Linie längst überquert haben, und es fiele überhaupt kein Tor mehr.

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

Ein KI-gegen-KI-Spiel endet im Schnitt bei **rund 4 Toren gesamt** (typisch 5:2, 1:3, 2:3). Menschen treffen besser: ihre Schussstreuung ist mit dem Faktor 0,7 deutlich enger als die der KI.

Das Grundtempo ist bewusst gemächlich — ein Feldspieler braucht rund 5 Sekunden für die Feldlänge. Wer daran dreht, muss **Spieler- und Balltempo zusammen** verstellen: verlangsamt man nur die Spieler, wird der Torwart gegenüber dem Schuss wehrlos.

Stellschrauben:

| Konstante | Wirkung |
|---|---|
| `GK_REACH`, `SPEED_GK`, `GK_REACT` | Reichweite, Tempo und Reaktionszeit des Torwarts — in dieser Größenordnung der **stärkste** Hebel |
| `GOAL_W` | Torbreite. Wirkt nur, solange der Fangradius des Torwarts klar darunter liegt — sonst deckt er das ganze Tor ab |
| `spread` in `doShoot` | Schussstreuung; wächst mit der Distanz |
| `PLAYER_R * 2.9`, `rate` im Zweikampf | Wie leicht der Ball erobert wird |
| `SPEED`, `SPEED_HUM`, `SPEED_GK` | Lauftempo. Immer zusammen mit `PASS_SPEED`, `SHOT_SPEED` und `FRICTION` anpassen |
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
