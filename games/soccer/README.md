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

## Zusehen

Zusehen ist **kein Modus, den man wählt** — es ist das, was übrig bleibt, wenn man die Finger stillhält. Nach der Mannschaftswahl läuft alles von selbst weiter, und wer aufhört zu spielen, gibt seinen Spieler nach `IDLE_TAKEOVER` an die KI ab.

Jede Tafel geht dafür von allein weiter; wer drückt, überspringt nur die Wartezeit:

| Tafel | Wartezeit |
|---|---|
| Anpfiff | `AUTO_INTRO` (6 s) |
| Toranzeige | 5 s, dann Wiederholung, danach direkt Anstoß |
| Halbzeit | `AUTO_HALF` (7 s) |
| Ergebnis, Meister, Aus | `AUTO_RESULT` (9 s) |

**Und es hört nicht auf:** Läuft die Ergebnistafel von selbst ab, beginnt das nächste Spiel mit einem neuen Gegner — im Turnier die nächste Runde oder ein neues Turnier. Drückt man dagegen selbst, kommt man wie gewohnt ins Menü. Genau dieser Unterschied macht das Zusehen möglich, ohne einen Modus dafür zu brauchen.

Nachgemessen über 27 Minuten ohne eine einzige Eingabe: drei Anschlussspiele, keine hängende Tafel, kein Spieler mehr unter menschlicher Kontrolle.

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

| Auslenkung | Tempo | Größte Vorlage | Ballkontakte |
|---|---|---|---|
| 0,20 | 0,059 | 0,038 | 2,1/s |
| 0,45 | 0,106 | 0,045 | 1,8/s |
| 0,70 | 0,153 | 0,056 | 1,2/s |
| 1,00 | 0,200 | 0,074 | 1,2/s |

**Getreten wird nur bei Berührung.** Schuss, Pass und Dribbelstoß lösen erst aus, wenn der Spielerrand den Ballrand wirklich berührt (`CONTACT` = 0,0335) — vorher reichte der Fuß unsichtbar bis 0,046 weit, und Schüsse gingen sogar, während der Ball beim Dribbeln weit vorauslief. Damit sich das nicht träge anfühlt, wird die Absicht bis zu `INTENT_TIME` (1,1 s) gemerkt und im Moment des Kontakts ausgeführt. Nachgemessen über 1325 Schüsse und Pässe: kein einziger ohne Berührung.

**Der vorgelegte Ball folgt der Laufrichtung** (`TURN_PULL`). Ohne das rollte er stur geradeaus weiter, während der Spieler abbog — nach `CONTROL_R` war er weg. Gemessen an 240 Kurvenläufen: vorher überstand nur die langsame 45-Grad-Kurve den Richtungswechsel, jede andere Drehung kostete den Ball; jetzt bleibt er bei allen Winkeln bis 180 Grad am Fuß. Der Abstand zum Spieler bleibt beim Mitschwenken gleich, die Vorlage wird also nicht kürzer, nur richtungstreu.

Nebenwirkung des alten Verhaltens waren **tote Bälle**: der beim Abbiegen verlorene Ball rollte aus und blieb liegen. Über vier Spiele gemessen lag der Ball 6,4 % der Spielzeit bewegungslos und herrenlos herum (533 Phasen); mit der Kurvenführung sind es 0,0 % (keine einzige).

Zum Vergleich: Ballkontakt am Fuß ist 0,0335 — beim langsamen Dribbeln liegt der Ball also kaum weiter als eine Ballbreite vorn, und die Kontakte kommen fast doppelt so oft wie im Sprint. Der wirksamste Regler dafür ist `DRIBBLE_FRIC`: mehr Reibung heißt kürzere Vorlagen *und* häufigere Kontakte.

Läuft der Ball weiter als `CONTROL_R` (0,115) voraus — etwa bei einer scharfen Richtungsänderung im Sprint — ist er frei, und wer zuerst dran ist bekommt ihn.

Weil der Zweikampf gegen die **Ballposition** geht und nicht gegen den Körper, wird man im Sprint angreifbar: der Ball läuft voraus und ein Verteidiger kommt eher dran. Langsam dribbeln hält ihn am Fuß.
| **SELECT** | Zurück zum Menü | Zurück zum Menü |

Die Menüs sind zusätzlich **mit der Maus bedienbar**: Ein Klick auf einen Eintrag oder eine Mannschaftskachel wählt ihn direkt aus, auf den Panel-Screens (Anpfiff, Halbzeit, Ergebnis) bestätigt ein Klick irgendwohin. Weil die Menüs auf dem Canvas gezeichnet werden und es keine DOM-Elemente zum Anklicken gibt, registriert jede Zeichenfunktion ihre Klickflächen (`hotspot`); Tastatur, Controller und Maus laufen über dieselben Funktionen `activate()` und `goBack()`.

Bei zwei Menschen bekommt jeder seinen eigenen Spieler — dieselbe Figur kann nie doppelt belegt werden. Die Markierungsringe zeigen wer wen steuert: Cyan = Spieler 1, Pink = Spieler 2.

## Torhüter

Beide Torhüter bewegten sich **im Gleichschritt** — 88,5 % der Spielzeit standen sie seitlich exakt gleich weit aus der Mitte, weil beide dasselbe Ziel ausrechneten. Und sie kamen praktisch nie heraus: 0,4 % der Zeit standen sie vor ihrer Grundstellung.

Der naheliegende Weg — den entfernten Torwart träger decken lassen — war falsch. **Die seitliche Deckung ist der empfindlichste Wert im ganzen Spiel:** Jede Abschwächung (trägeres Nachziehen, eigener Versatz, kleinerer Faktor) kostete in der Messung drei bis vier Tore pro Spiel. Sie ist deshalb für beide identisch geblieben.

Unterschieden wird über die **Tiefe**, und die kostet nichts, solange der Ball weit weg ist:

| Lage des Balls | Torwart |
|---|---|
| am anderen Ende | steht bis `GK_OUT_FAR` (0,07) vor dem Tor und spielt mit |
| im Anmarsch | zieht sich gleitend auf die Linie zurück |
| Gegner im Strafraum | geht `GK_OUT` (0,05) heraus und verkürzt den Winkel |
| freier Ball ganz nah | holt ihn selbst |

**Der Torwart hechtet.** Reicht die Zeit nicht, den Kreuzungspunkt zu Fuß zu erreichen (`GK_DIVE_GAP`, und die Strecke ist in der verbleibenden Flugzeit nicht zu schaffen), wirft er sich — flacher und weiter als ein Feldspieler (`GK_DIVE_TIME` 0,55 s, Reichweite ×1,25) — und **fängt** den Ball, statt ihn abzufälschen. Gemessen: 19,3 Sprünge pro Spiel, davon rund 16 mit Fang.

Nachgemessen: Gleichschritt 88,5 % → **5,4 %**, vor der Grundstellung 0,4 % → **58 %**.

**Was nicht ging:** Die seitliche Deckung auch nur jenseits jeder Schussdistanz träge zu machen, ließ die Torquote auf **34,8 Tore pro Spiel** springen. Ein Rest an Gleichlauf bleibt deshalb bewusst bestehen — es gibt einen Ball, und beide Torhüter reagieren richtig darauf.

## Tafeln

Anpfiff, Tor, Halbzeit, Ergebnis, Weltmeister und Aus benutzen **dieselbe Box** (`zeichneBox`): abgerundete Fläche mit Schlagschatten und Haarlinie, gelbe Überschrift, darunter Menüpunkte mit Klickflächen.

Vorher gab es zwei Sorten nebeneinander — diese Box für Tor und Ergebnis, und eine Vollbild-Abdunklung für alles andere, bei der ein Klick **irgendwohin** bestätigte. Das sah nicht nur unterschiedlich aus, es verhielt sich auch unterschiedlich: Die Halbzeittafel ließ sich versehentlich wegklicken, genau der Fehler, den wir bei der Toranzeige behoben hatten.

## Nach dem Turnier

Nach AUSGESCHIEDEN oder WELTMEISTER steht auf der Tafel, was folgt: **NEUE WELTMEISTERSCHAFT**. Wer nichts drückt, sieht ihr zu — Runde, Spielstand und Höhepunkte werden dabei zurückgesetzt, es beginnt wirklich von vorn. Ohne die Ansage sah es aus, als starte nach dem Aus grundlos noch ein Spiel.

## Nach dem Spiel

Die Ergebnistafel funktioniert wie die Toranzeige — ein Panel mit Menü statt einer Tafel, die man wegdrückt:

| Punkt | Wirkung |
|---|---|
| **HÖHEPUNKTE** | alle Tore des Spiels nacheinander in Zeitlupe, mit Zähler „2 / 3" |
| **NÄCHSTES SPIEL** bzw. der Name der nächsten Runde | weiter |

Jede Torszene wird beim Tor aus dem Mitschnitt zur Seite gelegt (`HL_MAX`, höchstens acht), bevor der Anstoß ihn löscht. Jede Taste bricht die Schau ab.

**Der Ausgang heißt jetzt, was er ist.** Vorher stand im Turnier „WEITER" als Ergebnis da und las sich wie eine Taste; gemeint war, dass man eine Runde weiterkommt:

| Lage | Text | Menüpunkt |
|---|---|---|
| Turnier, gewonnen | GEWONNEN | WEITER ZUM HALBFINALE |
| Turnier, verloren | AUSGESCHIEDEN | ZURÜCK ZUM MENÜ |
| Freundschaftsspiel | SIEG · NIEDERLAGE · UNENTSCHIEDEN | NÄCHSTES SPIEL |

Auf dem Panel steht nur der Ausgang und das Menü — **im selben Gelb wie TOR!**. Spielstand und Mannschaften stehen schon in der Kopfzeile; unten wiederholt machten sie es nur voll, und die Zeile lief obendrein aus der Box heraus. Was bleibt, wird über `fitText` auf die Panelbreite eingepasst.

In der Kopfzeile steht nach dem Abpfiff die Runde (bzw. ABPFIFF im Freundschaftsspiel) statt der stehengebliebenen Uhr — dort las man vorher weiter „1. HALBZEIT 2:56", obwohl das Spiel vorbei war.

## Nach dem Tor

Ein Tor war nach 2,4 Sekunden vorbei — man bekam es kaum mit. Jetzt hält das Spiel an und zeigt eine Anzeige mit Torschütze und Spielstand:

**Die Anzeige lässt sich nicht versehentlich wegdrücken.** In den ersten `GOAL_LOCK` (1,2 s) nimmt sie gar keine Eingabe an, das Panel fährt ein und die Menüpunkte sind noch nicht da — sie werden erst danach gezeichnet und damit auch erst dann anklickbar. Wer im Spielfieber weiterdrückt, klickte sie sonst weg, bevor er sie gelesen hatte.

**Der Anstoß beginnt erst nach der Torpause** — nie hinter einer laufenden Wiederholung. Während der Pause stehen Ball und Spieler dort, wo das Tor fiel; erst `weiterNachTor()` setzt sie neu.

**Drückt niemand, läuft die Wiederholung nach `AUTO_REPLAY` (5 s) von selbst an — und pfeift danach direkt wieder an.** Wer sie dagegen selbst aufruft, hat entschieden: Danach kommt keine automatische mehr hinterher. Wer nichts drückt, will offensichtlich nur zusehen. Selbst über das Menü ausgewählt kehrt sie dagegen in die Anzeige zurück. Sie ist deutlich als solche gekennzeichnet: unten mittig steht WIEDERHOLUNG, im selben Gelb wie TOR!. Ohne Punkt und ohne Blinken — es ist eine Beschriftung, kein Bedienelement. Ohne die Kennzeichnung hält man die Zeitlupe für das laufende Spiel und wundert sich, warum nichts reagiert.

Jede Taste bricht sie ab und führt zurück auf die Anzeige. Dort gibt es zwei Menüpunkte, keine Tastenansage:

| Punkt | Wirkung |
|---|---|
| **WIEDERHOLUNG** | die Szene noch einmal |
| **WEITER** | Anstoß für die andere Mannschaft |
| — | ohne Eingabe geht es nach `GOAL_WAIT` (12 s) von selbst weiter |

Abschaltbar über die Einstellung **WIEDERHOLUNG**; dann bleibt in der Torpause nur WEITER stehen.

Auf dem Panel steht nur **TOR!** — groß, gelb und mit Einschlag: Beim Tor federt der Schriftzug einmal auf (gedämpfte Schwingung über 0,6 s), danach atmet er leise weiter. Torschütze und Spielstand stehen ohnehin in der Kopfzeile; im Panel wiederholt machten sie es nur voll.

Das Panel selbst ist eine weiche, abgerundete Fläche mit Schlagschatten und Haarlinie. Ein harter gelber Rahmen stand in Konkurrenz zum Schriftzug und klebte am Inhalt.

**Der vorgewählte Punkt steht oben** — und das ist die Wiederholung. Ein versehentlicher Druck kann sie nicht auslösen, weil die Anzeige die ersten 1,2 Sekunden ohnehin keine Eingabe annimmt. Nach einer angesehenen Wiederholung springt die Auswahl auf WEITER: gesehen ist gesehen. Nach einer Wiederholung springt die Auswahl ebenfalls dorthin zurück. Ausgewertet wird über den Namen des Punktes, nicht über seinen Index: Ist die Wiederholung abgeschaltet, steht WEITER an erster Stelle.

Die Wiederholung läuft bis zu dem Punkt, an dem der Ball **wirklich im Netz liegt**, und hält dort `REPLAY_HALT` (0,7 s) als Standbild, bevor es weitergeht. Der Mitschnitt endet nämlich genau auf der Torlinie — dort wird im Spiel abgepfiffen —, deshalb werden beim Tor noch `GOAL_TAIL` Frames angehängt, in denen der Ball bis `NETZ_TIEFE` ins Tor rollt.

Sie läuft aus einem **Mitschnitt der letzten 2,2 Sekunden** (`HIST_LEN` = 130 Frames). Mitgeschnitten werden nicht nur Positionen, sondern auch alles, was die Figur verformt — Hechtsprung, Grätsche, Angriff, Liegen und die Blickrichtung. Ohne das blieb ein Spieler, der beim Tor gerade grätschte, die ganze Zeitlupe über ein Oval: Die Verformung kam aus dem laufenden Spiel, und das steht während der Torpause still und dauert bei 0,45-facher Geschwindigkeit 5,6 Sekunden. Der erste Entwurf zeigte 3,5 Sekunden bei 0,34-fach — 10,3 Sekunden Zeitlupe, das zog sich. Aufgezeichnet werden nur Positionen und Blickrichtungen — mehr braucht es nicht, um die Szene noch einmal zu zeichnen, und gezeichnet wird sie mit demselben Code wie das laufende Spiel: Die Positionen werden kurz aus dem Mitschnitt gesetzt und danach zurückgeschrieben.



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

## Flaggen

Sie werden schlicht gezeichnet — Streifen, Kreuz, Scheibe, Raute. Wappen und Sterne wären in Menügröße ohnehin Matsch. Drei brauchten trotzdem ein Zusatzzeichen, weil sie sonst nicht auseinanderzuhalten sind:

| | Problem | Zeichen |
|---|---|---|
| MEXIKO | dieselbe Bauart wie Italien, mittlerer Farbabstand nur 25 von 255 | Wappen als dunkler Kreis in der Mitte |
| KROATIEN | rot-weiß-blau waagerecht wie die Niederlande | Schachbrett, 4 × 2 Felder |
| URUGUAY | ohne Gösch nur Streifen | Sonne in der weißen Gösch |

**USA** war schlicht falsch: sieben Streifen und ein zu breiter blauer Block ohne Sterne — das las sich eher als Frankreich. Jetzt 13 Streifen, Gösch über sieben davon und 2/5 der Breite, dazu ein versetztes Punktraster als Sternenfeld.

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

## Angriffsverhalten der KI

Die KI lief früher jeden Angriff durch die Mitte und dribbelte dem Torwart in die Arme, ohne abzuschließen. Gemessen über vier Spiele: **97 % aller Vorstöße ins letzte Viertel kamen zentral**, und es gab 38 Läufe pro Spiel direkt in den Torwart.

Ursache war der Abschluss-Test: Er wertete *jeden* Gegner im Weg als Block — **auch den Torwart**. Genau in Schussdistanz stand der aber immer davor, also fiel die Entscheidung dauerhaft gegen den Schuss.

Drei Bausteine ersetzen das:

| Baustein | Wirkung |
|---|---|
| `shotLane(p)` | Prüft sieben Zielpunkte über die Torbreite und misst, wie viel Luft die Schussbahn am nächsten Gegner lässt. Der Torwart zählt breiter mit (`PLAYER_R * 1,5`) — an ihm muss man **vorbeizielen**, er darf den Abschluss nicht verhindern. Geschossen wird auf die freieste Ecke, mit einer Bereitschaft, die mit Nähe und freier Bahn steigt |
| `state.route` | Je Ballgewinn wird ein Angriffsweg gewürfelt (`ROUTES`, Flügel doppelt gewichtet). Der Ballführende zieht erst auf diese Bahn und stößt dann vor; erst auf Strafraumhöhe schneidet er nach innen |
| Einlaufen | Liegt der Ball im letzten Drittel, läuft der zweite Angreifer auf der **ballabgewandten** Seite in den Strafraum. Vorher hing er immer hinter dem Ballführenden |

Nachgemessen, je vier volle Spiele:

| | vorher | jetzt |
|---|---|---|
| Vorstöße durch die Mitte | 97 % | 52 % |
| über den Halbraum | 2 % | 34 % |
| über den Flügel | 1 % | 14 % |
| Schüsse pro Spiel | 34,3 | 22,8 |
| Schussentfernung (10 %–90 %) | 0,156–0,224 | 0,163–0,333 |
| Läufe direkt in den Torwart | 38,3 | 25,3 |

Es wird also **seltener, aber aus deutlich verschiedeneren Lagen** geschossen — der schmale Ring vor dem Tor ist weg.

## Turnierstärke (WM)

Ein einziger Regler steuert, wie stark der Gegner ist: **`SKILL_STEP`** (0,075). Daraus ergibt sich `skill = 1 + runde * SKILL_STEP`, also 1,00 im Achtelfinale bis 1,23 im Finale.

Entscheidend ist, dass er **nur für den Gegner gilt** — in der WM immer Team 1, denn Gegeneinander gibt es nur im Freundschaftsspiel. Vorher galt derselbe Aufschlag für *beide* Seiten: Er machte auch die eigenen Mitspieler und den eigenen Torwart stärker und hob damit den Großteil seiner Wirkung wieder auf.

Woran der Aufschlag hängt, und was er zwischen Achtel- und Finale bewirkt:

| Hebel | Wirkung im Finale |
|---|---|
| Schussstreuung (`1 / skill`) | 19 % genauer |
| Torwarttempo, Schussbereitschaft, Grätschenhäufigkeit, Zweikampfrate | je 23 % mehr |
| Lauftempo mit / ohne Ball | 1,4 % / 2,3 % mehr — bewusst wenig, Tempo entscheidet zu hart |
| Schussreichweite | 3 % weiter |

Gemessen, Team 0 als feste Bezugsmannschaft gegen den skalierenden Gegner, je 14 Spiele pro Runde:

| Runde | Aufschlag | Tore Bezug | Tore Gegner | Differenz |
|---|---|---|---|---|
| Achtelfinale | 1,00 | 0,8 | 1,2 | −0,4 |
| Viertelfinale | 1,07 | 0,9 | 1,6 | −0,7 |
| Halbfinale | 1,15 | 0,9 | 1,7 | −0,8 |
| Finale | 1,23 | 0,7 | 2,0 | −1,3 |

Die Differenz ist das belastbare Signal; die reinen Siegzahlen rauschen bei rund zwei Toren pro Spiel zu stark. Zum Maßstab: Die Bezugsmannschaft ist **selbst eine KI** — ein Mensch ersetzt einen ihrer Feldspieler und zielt genauer (Streuungsfaktor 0,7) und erobert schneller (1,15). Für eine Spielerin oder einen Spieler fällt die Kurve also flacher aus als hier.

Zum Vergleich der Steilheit: Mit `SKILL_STEP` = 0,11 endete das Finale bei 0,1 : 2,6 und 0 von 12 Siegen — zu hart. Mit 0,05 war zwischen den Runden kaum ein Unterschied messbar.

## Verformung: Spieler sind Flummi-Scheiben

Grätsche und Hechtsprung waren als **konstantes Oval** gezeichnet — über die ganze Aktion dieselbe Streckung (1,75 × 0,62 bzw. 2,15 × 0,52). Das sah nach einem lang gezogenen Körper aus, nicht nach einer Bewegung.

Die Figur bleibt dabei immer **deckend** — nur der Schatten beim Hechtsprung ist durchscheinend. Ein liegender Spieler war vorher halbtransparent und sah aus, als gehöre er nicht mehr richtig aufs Feld.

Gezeichnet wird als **Ellipse mit zwei Radien** (`ctx.ellipse`), nicht als Kreis unter `ctx.scale`: Eine ungleiche Skalierung verzerrt auch die Kontur, wodurch an den Spitzen eine dicke Zunge entstand. So bleibt die Linienstärke überall gleich.

Die Dehnung ist **flächentreu** — längs `k`, quer `1/k`; die Scheibe wird gedehnt, nicht größer. Und sie wird **schnell aufgebaut und dann gehalten**, solange die Aktion dauert. Gefedert wird nur beim Aufprall.

Eine gedämpfte Schwingung während der Bewegung war der falsche Weg: Sie sah aus wie Gummi, nicht wie ein Spieler, der sich lang macht.

**Grätsche** (0,55 s) — sich strecken, antreten, ausrutschen, kurz liegen:

| Zeit | Streckung | Tempo |
|---|---|---|
| 0,00 s | 1,00 | ×1,50 — Antritt |
| 0,08 s | 1,60 | ×1,32 |
| 0,28 s | 1,60 | ×1,02 |
| 0,55 s | 1,60 | ×0,91 — ausgerutscht |
| danach 0,35 s | liegen | — |

Der Tempobonus war vorher **konstant 1,35** über die ganze Grätsche. Das fühlte sich an wie Rennen, nicht wie Rutschen; jetzt gibt es einen Antritt, und am Ende ist man langsamer als im normalen Lauf.

**Der Hechtsprung läuft anders** — er ist kein Gummi, sondern ein Sprung:

| Phase | Was passiert |
|---|---|
| 0,00–0,08 s | Absprung: streckt sich schnell auf 1,85 und **bleibt** gestreckt |
| 0,08–0,23 s | in der Luft: der Körper löst sich vom Schatten, wird 12 % größer, der Schatten am Boden schrumpft |
| 0,23–0,45 s | zurück auf den Schatten |
| danach 0,7 s | Aufschlag (kurz auf 1,73 breit geklatscht), liegen bei 1,38, dann aufstehen |

Ohne die **Höhe** las sich der Sprung in der Draufsicht wie eine Grätsche: ein gedehntes Oval am Boden. Erst der Schatten, von dem sich der Körper löst, macht daraus ein Abheben. Und die federnde Schwingung gehört zum Aufprall, nicht in die Luft — mitten im Flug zu wackeln sah nach Wackelpudding aus.

## Hechtsprung

Das offensive Gegenstück zur Grätsche, auf derselben Taste (**B ohne Ball**) und nach derselben Bauweise: Der Spieler macht sich lang, hat währenddessen eine gestreckte Reichweite (`DIVE_REACH`) und liegt danach `DIVE_DOWN` Sekunden am Boden.

Auch **nach einer Grätsche liegt man kurz** (`TACKLE_DOWN` = 0,35 s) — aber nur, wenn man den Ball verfehlt hat. Eine geglückte Grätsche belohnt sich selbst; sonst verlöre man den eben eroberten Ball sofort wieder, weil man reglos daneben liegt. Nachgemessen: Die Ballabnahme von hinten fällt dadurch von rund 14 % auf rund 7 % der Verfolgungen, die Torquote bleibt bei 2,6.

Er nimmt den Ball dabei **nicht an**, sondern fälscht ihn Richtung Tor ab — und zielt im Sprung deutlich ungenauer als beim normalen Schuss (Streuung 2,4 statt 0,7 Torbreiten).

Damit er die Ausnahme bleibt und nicht die bessere Grätsche wird, muss alles davon zutreffen:

| Bedingung | Warum |
|---|---|
| höchstens `DIVE_ZONE` (0,26) vom gegnerischen Tor | es ist ein Abschluss, kein Zweikampfmittel |
| Ball ist frei und schneller als `DIVE_MIN_V` (0,30) | nur eine scharfe Hereingabe, kein trudelnder Ball |
| Ball weiter weg als `CONTACT + 0,035` | zu Fuß erreichbare Bälle spielt man zu Fuß |
| Ball näher als 0,13 | darüber hinaus ist er ohnehin nicht zu erreichen |

Die KI nutzt denselben Sprung, sonst sähe man ihn nur beim eigenen Spieler.

Nachgemessen über vier Spiele: **13 Sprünge pro Spiel, 37 % davon am Ball.** Der erste Entwurf war deutlich zu großzügig — 99 Sprünge pro Spiel und 10,1 Tore statt 2,4; ausschlaggebend waren die Mindestgeschwindigkeit des Balls und die Bedingung, dass er zu Fuß gerade nicht mehr erreichbar sein darf.

## Spielerwechsel

Einstellbar im Ingame-Menü unter **SPIELERWECHSEL**:

| Wert | Wann das Spiel die Figur wechselt |
|---|---|
| **NUR SELBST** | nie — man behält seinen Spieler und wechselt mit A |
| **BEI BALLGEWINN** (Vorgabe) | sobald ein eigener Spieler den Ball hat |
| **AM BALL** | zusätzlich immer zu dem Spieler, der dem Ball am nächsten ist |

`AM BALL` ist das, was viele aus anderen Fußballspielen kennen. Es ist bewusst **nicht** die Vorgabe: Im Alleingang wechselt einem die Figur damit ständig unter den Fingern, was verwirrt — deshalb steht es zur Wahl, statt fest verdrahtet zu sein.

Mit A wechselt man in jeder Einstellung selbst zum nächsten eigenen Feldspieler, der nicht schon von einem anderen Menschen gesteuert wird.

## Zwei Stufen auf der B-Taste

Ohne Ball entscheidet die **Dauer des Tastendrucks**:

| | Dauer | Wirkung | Risiko |
|---|---|---|---|
| **Angreifen** | beim Drücken | kurzer Schritt zum Ball (×1,3), Zweikampfdruck 2,6 | keins |
| **Grätschen** | ab 0,20 s halten | Antritt und Rutschen, Reichweite auch zum **Mann**, Druck 3,4 | danach 0,35 s am Boden |

Der Angriff löst **beim Drücken** aus, nicht beim Loslassen. Anders herum gebaut fühlte es sich an, als reagierte die Taste gar nicht: Auf den Tastendruck geschah sichtbar nichts, und zwei schnelle Antipper wurden zu einem.

Die KI trifft dieselbe Abwägung: Sie greift überwiegend an und grätscht nur selten.

**Damit die Taste überhaupt zählt, wurde der passive Druck gesenkt** (1,5 → 0,7). Vorher gewann bloßes Danebenstehen den Ball in 0,6 s, und ob man drückte oder nicht, war messbar egal:

| Verfolgung von hinten, 1,25 s | vorher | jetzt |
|---|---|---|
| nichts drücken | 22/40 und 30/40 | 6/40 und 3/40 |
| kurz antippen | 25/40 und 25/40 | 28/40 und 26/40 |
| halten | 22/40 und 27/40 | 22/40 und 28/40 |

## Zweikampf

**Mit Ball am Fuß läuft man langsamer** (`BALL_DRAG` = 0,92). Ohne das ist ein Ballführender schlicht nicht einzuholen und jeder Zweikampf entschieden, bevor er beginnt.

**Die Grätsche zählt gegen den Mann, nicht nur gegen den Ball** (`TACKLE_MAN`). Vorher war eine Ballabnahme von hinten *geometrisch unmöglich*: Der Ball liegt beim Dribbeln vorn, die Körper werden auf `PLAYER_R * 2` auseinandergehalten — Körperabstand 0,042 plus Vorlage 0,038 ergibt mindestens 0,080, die Zweikampfgrenze liegt aber bei 0,052. Gemessen: **0 von 120** Verfolgungen führten zum Ballgewinn. Der Zweikampf am Mann läuft etwas zäher als der am Ball (Faktor 0,95).

**Auch die KI macht bei der Grätsche einen Ausfallschritt.** Der Tempobonus von 1,35 galt vorher nur für Menschen — die KI-Grätsche setzte das Flag, kam dem Ball aber keinen Zentimeter näher. Das war der Grund für einen bis dahin unerklärlichen Einbruch mitten in der Messreihe (bei 0,08 Abstand 2/40, bei 0,05 und 0,12 dagegen 19/40 und 11/40).

**Der zweite Verteidiger verdoppelt** im eigenen Drittel — seitlich versetzt und einen Schritt näher am eigenen Tor. Stünden beide hintereinander, liefe der Gegner an einem vorbei und wäre den anderen gleich mit los.

Nachgemessen:

| | vorher | jetzt |
|---|---|---|
| Ballgewinn von hinten, 5 s (Abstand 0,05 / 0,08 / 0,12) | 0/40 · 0/40 · 0/40 | 10/40 · 3/40 · 5/40 |
| Ballführender unter Druck von einem Gegner | 58 % | 73 % |
| … von zwei Gegnern (2 gegen 1) | 5 % | 14 % |
| Läufe direkt in den Torwart | 25,3 | 18,8 |

Von hinten ist die Ballabnahme damit **möglich, aber nicht selbstverständlich** — sie verlangt eine getimte Grätsche aus kurzer Distanz.

Dosiert wird das über `TACKLE_MAN` (Reichweite), **nicht** über die Zweikampfrate am Mann: Die Rate ist ein Kippschalter. Der Zweikampf muss innerhalb der Grätsche von 0,55 s durchlaufen; bei Faktor 0,85 braucht er 0,35 s und gelingt, bei 0,55 braucht er 0,53 s und scheitert fast immer — dazwischen liegt kaum etwas. Die Reichweite dagegen wirkt weich: Bei `PLAYER_R * 3,4` gelangen 12/13/10 von je 40 Verfolgungen, bei `2,6` noch 10/3/5. Die Torquote sinkt dadurch von 3,2 auf 2,8 pro Spiel; das ist der Preis für den höheren Druck.

## Balance

Ein KI-gegen-KI-Spiel endet im Schnitt bei **rund 3 Toren gesamt** (2,8 über 12 Spiele; davor 3,2 und 3,0 in zwei Stichproben à 24 Spielen — die Seitenverteilung schwankt zwischen 1,9 : 1,3 und 1,4 : 1,5 und ist damit Rauschen). Menschen treffen besser: ihre Schussstreuung ist mit dem Faktor 0,7 deutlich enger als die der KI.

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
