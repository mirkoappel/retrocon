# STREET SOCCER

**Spieler:** 1–2 · **Modi:** WORLD CUP · FREUNDSCHAFTSSPIEL

Kleinfeld-Fußball aus der Vogelperspektive, **3 gegen 3** (Torwart + zwei Feldspieler).

Das Feld richtet sich nach dem Bildschirm: im **Hochformat** liegt es senkrecht und du greifst nach oben an, im **Querformat** liegt es waagerecht und du greifst nach rechts an (`isLandscape()`, ab Seitenverhältnis 1,15). Sonst bliebe auf einem breiten Bildschirm links und rechts viel Platz ungenutzt. Die Steuerung dreht sich mit — im Querformat ist „rechts" vorwärts.

Der Menüablauf ist: **Modus → Spielerzahl → (zu zweit) Seiten → Mannschaft**.

Die Spielerzahl wird bewusst **abgefragt statt aus den Verbindungen abgeleitet**: Spieler 2 an der Tastatur existiert erst, wenn jemand im Spiel eine WASD-Taste drückt (`claimByKey` in `console/views/game.js`). Im Menü meldet `api.getConns()` also oft nur einen Spieler, obwohl zwei mitspielen wollen.

Bei **1 Spieler** entfällt die Seiten-Frage und der Teammodus steht auf „miteinander" — verbindet sich später doch ein zweiter Controller, landet er in deiner Mannschaft.

Zu zweit lässt sich wählen, ob man **miteinander** oder **gegeneinander** spielt:

| Auswahl | Bedeutung |
|---|---|
| **MITEINANDER** | Beide Menschen in derselben Mannschaft, Gegner ist KI |
| **GEGENEINANDER** | Spieler 2 steuert die gegnerische Mannschaft |

Im **Freundschaftsspiel** wählt dabei jeder seine eigene Mannschaft: erst Spieler 1, dann übernimmt Spieler 2 den zweiten Auswahlbildschirm. Solange Spieler 2 noch nicht verbunden ist (zwei Leute an einer Tastatur), darf Spieler 1 stellvertretend wählen.

Im **World Cup** geht gegeneinander ebenfalls, nur wählt Spieler 2 dort nichts: die Gegner werden ausgelost, und er übernimmt jede Runde das gezogene Team. Es bleibt der Turnierlauf von Spieler 1 — der andere versucht, ihn zu stoppen.

## Modi

| Modus | Ablauf |
|---|---|
| **WORLD CUP** | Achtelfinale → Viertelfinale → Halbfinale → Finale. Vier Siege in Folge machen dich zum Weltmeister. Eine Niederlage und der Lauf ist vorbei. Endet ein Spiel unentschieden, geht es in die **Verlängerung mit Golden Goal** |
| **FREUNDSCHAFTSSPIEL** | Ein einzelnes Spiel, Gegner frei wählbar. Unentschieden bleibt Unentschieden |

Die KI wird pro Turnierrunde stärker (`skill()`): schnellere Spieler, präzisere Schüsse, härtere Zweikämpfe.

Damit die Verlängerung nicht endlos läuft, lassen beide Torhüter dort gleichmäßig nach (`gkFatigue`): ihr Fangradius schrumpft über 90 Sekunden auf 35 %, ein Tor fällt also zuverlässig.

## Steuerung

Drückt an einem Platz **8 Sekunden lang niemand etwas** (`IDLE_TAKEOVER`), übernimmt dort die KI — sonst stünde die Figur nutzlos herum. Die erste Eingabe holt sie sofort zurück. Als Eingabe zählt nur echte Aktivität: ein ruhender Controller sendet trotzdem 30 Pakete pro Sekunde, die dürfen nicht als Spielen durchgehen. Dass die KI übernommen hat, erkennt man am fehlenden Markierungsring.

Solange du spielst, behältst du deinen Spieler und **wechselst selbst mit B**. Es gibt nur eine Automatik: sobald deine Mannschaft den Ball erobert, übernimmst du den Ballführenden — sonst würdest du einen Spieler ohne Ball steuern, während die KI dribbelt. Der Torwart bleibt immer KI.

Früher wechselte die Steuerung zusätzlich laufend zum ballnächsten Mitspieler. Das war im Alleingang verwirrend, weil einem die Figur ständig unter den Fingern wegsprang (gemessen: 21 Wechsel in zwei Minuten). Jetzt sind es nur noch die Übernahmen des Ballführenden.

**Zu zweit in einer Mannschaft steht die Zuordnung fest.** Sind ohnehin alle Feldspieler von Menschen besetzt, bringt ein Wechsel nach Ballnähe nichts — er würde den beiden nur gegenseitig die Figur wegtauschen. Jeder behält deshalb seine Figur das ganze Spiel über.

| Eingabe | Mit Ball | Ohne Ball |
|---|---|---|
| **A** (Enter / Leertaste) | Schuss aufs Tor | Spieler wechseln |
| **B** (Shift / Q) | Abspiel zum besten Mitspieler | Grätsche — 0,4 s Antritt mit deutlich höherer Chance auf Balleroberung, sichtbar als in Laufrichtung gestreckter Körper |
| **Richtung** | Laufen | Laufen |

Am **Analogstick bestimmt die Auslenkung das Tempo**, von langsamem Gehen bis zum Sprint (Totzone 0,12, volles Tempo ab 0,95, minimal 22 % — gut vierfache Spanne). Tastatur und Dpad bleiben digital; dort gibt es nur ganz oder gar nicht, und zwar volles Tempo.

**Dribbling.** Der Ball klebt nicht am Spieler, sondern wird **angetippt und rollt frei weiter**; der Spieler läuft ihm nach und tippt erneut, sobald er ihn wieder am Fuß hat. Die Stoßhärte wächst mit dem Lauftempo (`TOUCH_K_LOW` … `TOUCH_K_HIGH`), die Vorlagen werden dadurch überproportional länger:

| Auslenkung | Tempo | Größte Vorlage |
|---|---|---|
| 0,20 | 0,059 | 0,055 |
| 0,45 | 0,106 | 0,070 |
| 0,70 | 0,153 | 0,094 |
| 1,00 | 0,200 | 0,129 |

Rund ein Ballkontakt pro Sekunde. Läuft der Ball weiter als `CONTROL_R` (0,16) voraus — etwa bei einer scharfen Richtungsänderung im Sprint — ist er frei, und wer zuerst dran ist bekommt ihn.

Weil der Zweikampf gegen die **Ballposition** geht und nicht gegen den Körper, wird man im Sprint angreifbar: der Ball läuft voraus und ein Verteidiger kommt eher dran. Langsam dribbeln hält ihn am Fuß.
| **SELECT** | Zurück zum Menü | Zurück zum Menü |

Die Menüs sind zusätzlich **mit der Maus bedienbar**: Ein Klick auf einen Eintrag oder eine Mannschaftskachel wählt ihn direkt aus, auf den Panel-Screens (Anpfiff, Halbzeit, Ergebnis) bestätigt ein Klick irgendwohin. Weil die Menüs auf dem Canvas gezeichnet werden und es keine DOM-Elemente zum Anklicken gibt, registriert jede Zeichenfunktion ihre Klickflächen (`hotspot`); Tastatur, Controller und Maus laufen über dieselben Funktionen `activate()` und `goBack()`.

Bei zwei Menschen bekommt jeder seinen eigenen Spieler — dieselbe Figur kann nie doppelt belegt werden. Die Markierungsringe zeigen wer wen steuert: Cyan = Spieler 1, Pink = Spieler 2.

## Regeln

Bewusst weggelassen: **Abseits, Fouls, Einwurf, Ecken**. Der Ball prallt stattdessen von den Seitenlinien ab. Das hält das Spiel durchgehend in Bewegung und passt zum Arcade-Charakter der anderen RETROCON-Spiele.

Ein Tor zählt nur bei **freiem Ball** — der Ball muss geschossen oder gepasst über die Linie gehen. Sonst könnte man ihn einfach ins Tor tragen, indem man vorwärts läuft.

**Der Torwart darf nicht bedrängt werden.** Hat er den Ball in der Hand, kann ihn niemand erobern (die Zweikampf-Schleife überspringt Torhüter), und gegnerische Feldspieler weichen aktiv auf `KEEPER_SPACE` (0,17) zurück. Ohne das Zurückweichen stünden sie ihm im Abschlag und fingen den Ball sofort wieder ab.

Die **Torprüfung läuft vor der Ballaufnahme**. Der Fangradius des Torwarts reicht tiefer als das Tor — stünde die Aufnahme vorn, fischte er auch Bälle heraus, die die Linie längst überquert haben, und es fiele überhaupt kein Tor mehr.

**Kein Seitenwechsel zur Halbzeit.** Es gibt eine Pause mit Zwischenstand, aber die Blickrichtung bleibt: sonst würde „hoch" in der zweiten Halbzeit rückwärts bedeuten.

Spielzeit: 2 × 3 Minuten (`HALF_TIME`).

**Anstoß.** Der Ball liegt auf dem Mittelpunkt, ein Spieler legt ihn nach der Pause kurz zum Mitspieler ab — er dribbelt nicht einfach los. Wie im echten Fußball bleibt die andere Mannschaft dabei in ihrer eigenen Hälfte; sonst stünde ihr Stürmer genau auf dem Abnehmer und finge den Anstoßpass sofort ab.

Zusätzlich ist der Anstoßball **dem vorgesehenen Abnehmer reserviert** (`kickoffTo`, bis zu 3,5 s): nur er kann ihn aufnehmen, und er läuft ihm gezielt entgegen. Letzteres ist entscheidend — ohne das gilt der Schütze weiter als „nächster zum Ball", der Abnehmer bleibt stehen, und der reservierte Ball rollt ungenutzt durch, bis die Reservierung abläuft und der Gegner ihn holt. Ohne diese Reservierung ging der erste Ball regelmäßig verloren — abgefangen oder am Mitspieler vorbeigerollt, wenn der sich wegbewegt hatte. Den Anstoß gleich wieder zu verlieren fühlt sich schlicht unfair an.

**Anstoß-Pause.** Vor dem Anpfiff, nach der Halbzeit und nach jedem Tor steht das Spiel kurz still (`RESTART_KICK` 1,6 s bzw. `RESTART_GOAL` 2,4 s) und zeigt „ANSTOSS" beziehungsweise „TOR!". Ohne diese Pause lief das Spiel unter dem Torjubel sofort weiter und man bekam den Neubeginn nicht mit. Die Uhr steht während der Pause ebenfalls, es geht also keine Spielzeit verloren.

## Mannschaften

16 Nationen. Jede hat **zwei getrennte Farbwelten**:

- **Flagge** (`f`) in den echten Landesfarben — nur fürs Menü. Gezeichnet werden Streifen, Kreuz, Scheibe und zwei Sonderfälle (Brasilien, USA); Wappen und Sterne wären in dieser Größe ohnehin Matsch.
- **Trikot** (`c` / `a`) in bewusst hellen Farben — nur fürs Spielfeld.

Die Trennung ist nötig, weil viele Landesfarben dunkel sind. Vorher wurde die Flaggenfarbe als Trikot benutzt, und **8 von 32 Trikots** hatten auf dem dunklen Rasen einen Kontrast unter 3:1 — Deutschlands schwarzes Auswärtstrikot lag bei 1,0:1, war also nicht vom Grün zu unterscheiden. Jetzt liegt der schlechteste Wert bei 3,4:1.

Sind sich die Trikots zweier Mannschaften zu ähnlich (`colorClash`, RGB-Abstand < 110), weicht der Gegner automatisch auf sein Zweitset aus.

Im Menü stehen die Ländernamen **neutral in Weiß/Grau**, nicht in der Trikotfarbe — die Zuordnung macht die Flagge. In der Anzeige während des Spiels stehen die Flaggen ebenfalls neben den Namen; dort bleiben die Namen zusätzlich in der Trikotfarbe, weil man so sofort sieht, welche Farbe auf dem Platz zu welcher Mannschaft gehört.

## Maße

Das Feld liegt mit **0,58** zwischen Futsal (0,50) und Großfeld (0,648) — flach genug, um im Querformat den Bildschirm gut auszunutzen, aber nicht so schmal wie ein echter Futsalplatz.

| | Spiel | Futsal | Großfeld |
|---|---|---|---|
| Breite / Länge | **0,58** | 0,50 | 0,648 |
| Strafraum / Feldbreite | 0,58 | — | 0,59 |
| Strafraumtiefe / Feldlänge | 0,13 | — | 0,157 |
| **Torbreite / Feldbreite** | **0,33** | 0,15 | 0,108 |

Das Tor ist bewusst rund dreimal so breit wie am Großfeld. Mit realistischer Torbreite deckt der Torwart mit seinem Fangradius praktisch das ganze Tor ab, und es fällt kein einziger Treffer mehr — das war messbar so. Aus demselben Grund sind auch die Spieler proportional viel größer als echte Fußballer.

## Feld und Koordinaten

Positionen liegen in **Feldeinheiten**: Feldlänge = 1,0, Breite = `FIELD_W` (0,58), beide Achsen im selben Maßstab. Dadurch ist Bewegung richtungsunabhängig und `resize()` muss nichts umrechnen — es merkt sich nur die neue Canvas-Größe.

`y = 0` ist die eigene Torlinie, `y = 1` die gegnerische. Wo das auf dem Bildschirm liegt, entscheidet allein `px()` — im Hochformat unten/oben, im Querformat links/rechts. Alle Feldlinien werden über `fieldRect()` aus Feld-Eckpunkten gezeichnet und drehen dadurch automatisch mit.

## Reihenfolge-Unabhängigkeit

Damit keine Mannschaft allein dadurch im Vorteil ist, dass sie im Array weiter hinten steht, laufen drei Dinge bewusst in zwei Schritten:

1. **Bewegung**: Erst entscheiden alle Spieler aus demselben Weltzustand, dann bewegen sich alle. Sonst sähe die zweite Mannschaft bereits die neuen Positionen der ersten.
2. **Ballaktionen**: Schuss und Abspiel werden nur vorgemerkt und erst nach dem Entscheidungsdurchgang ausgeführt (`pending` / `applyPending`). Sonst reagierte die später verarbeitete Mannschaft einen Tick früher auf den freigegebenen Ball.
3. **Zweikampf und Kollision**: Der Ballführende wird zu Beginn festgehalten, es gibt höchstens einen Ballwechsel pro Frame, und Abstoßungen werden gesammelt statt sofort angewandt.

Ohne diese Trennung gewann die zweite Mannschaft im Testlauf rund **dreimal so viele Tore**.

## Balance

Ein KI-gegen-KI-Spiel endet im Schnitt bei **rund 4 Toren gesamt** (typisch 5:2, 1:3, 2:3). Menschen treffen besser: ihre Schussstreuung ist mit dem Faktor 0,7 deutlich enger als die der KI.

Das Grundtempo ist bewusst gemächlich — ein Feldspieler braucht rund 6,5 Sekunden für die Feldlänge. Wer daran dreht, muss **Spieler- und Balltempo zusammen** verstellen: verlangsamt man nur die Spieler, wird der Torwart gegenüber dem Schuss wehrlos.

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
