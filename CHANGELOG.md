# Changelog

Alle nennenswerten Änderungen an RETROCON. Format orientiert an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

## [0.15.2]

### Geändert
- **STREET SOCCER: Die Toranzeige ist ein Auswahlmenü.** WEITER und WIEDERHOLUNG stehen als Punkte da und werden ausgewählt, statt als Tastenansage aufzutreten — bedienbar mit Pfeilen, A und Maus. Nach einer Wiederholung springt die Auswahl zurück auf WEITER
- Der Mannschaftsname steht in einer eigenen Zeile und wird auf die Panelbreite eingepasst; „DEUTSCHLAND 2 : 1" in einer Zeile lief aus dem Panel heraus. Das Panel ist außerdem höher, damit der letzte Punkt nicht am Rand klebt

### Behoben
- **Die Kontur der Spieler wurde mitverzerrt.** Gedehnt wurde per `ctx.scale`, was auch die Linienstärke ungleich skaliert — an den Spitzen entstand dadurch eine dicke Zunge. Gezeichnet wird jetzt als Ellipse mit zwei Radien (`ctx.ellipse`), die Linienstärke bleibt überall gleich
- `GOAL_ITEMS` stand hinter dem `return` der Schnittstelle und wurde nie initialisiert — dieselbe Falle wie zuvor bei `uni` und `ELAST_N`. Vom Prüfstand gefangen

## [0.15.1]

### Neu
- **STREET SOCCER: Der Spielerwechsel ist einstellbar** (Ingame-Menü, SPIELERWECHSEL): **NUR SELBST** wechselt nie von allein, **BEI BALLGEWINN** übernimmt den Spieler mit dem Ball (bisheriges Verhalten, weiterhin Vorgabe), **AM BALL** wechselt zusätzlich immer zu dem Spieler, der dem Ball am nächsten ist
- `AM BALL` ist das, was man aus anderen Fußballspielen kennt, aber bewusst nicht die Vorgabe — im Alleingang wechselt einem die Figur damit ständig unter den Fingern

## [0.15.0]

### Neu
- **STREET SOCCER: Torpause mit Wiederholung.** Ein Tor war nach 2,4 Sekunden vorbei — jetzt hält das Spiel an und zeigt Torschütze und Spielstand. **A** pfeift wieder an, **B** zeigt die Szene in Zeitlupe (0,34-fach), und ohne Eingabe geht es nach 12 Sekunden von selbst weiter, damit ein Spiel nie hängen bleibt
- Die Wiederholung läuft aus einem Mitschnitt der letzten 3,5 Sekunden. Aufgezeichnet werden nur Positionen und Blickrichtungen; gezeichnet wird sie mit demselben Code wie das laufende Spiel
- Angesagt wird nur die Wiederholung — A führt überall weiter und muss nicht auf dem Bildschirm stehen

## [0.14.1]

### Behoben
- **STREET SOCCER: Angriff und Grätsche ließen sich mit der Tastatur kaum auslösen.** Der Angriff kam erst **beim Loslassen** der B-Taste — auf den Tastendruck geschah sichtbar nichts, und zwei schnelle Antipper wurden zu einem. Jetzt löst der Angriff **sofort beim Drücken** aus; bleibt die Taste liegen, wird ab 0,20 s die Grätsche daraus
- Der Angriff hatte außerdem keinen eigenen Ton (er lief auf dem Menü-Blip mit) und war mit einer Streckung von 1,3 kaum zu sehen — jetzt eigener Ton, 1,42 Streckung und ein kurzer Versatz nach vorn
- Neuer Prüfstandsfall über den vollständigen Tastaturweg: antippen ergibt einen Angriff, halten einen Angriff und eine Grätsche, zweimal antippen zwei Angriffe, und die Reaktion kommt im selben Frame

## [0.14.0]

### Neu
- **STREET SOCCER: Zwei Stufen auf der B-Taste.** Kurz antippen greift an — ein kurzer Schritt zum Ball, ohne Risiko. Ab 0,20 s gehalten wird daraus die Grätsche mit Antritt, mehr Reichweite und Liegezeit danach. Beide haben eigene Animationen: der Angriff ein kurzer Stich, die Grätsche das Strecken und Rutschen. Die KI trifft dieselbe Abwägung und greift überwiegend nur an

### Geändert
- **Der passive Zweikampfdruck ist von 1,5 auf 0,7 gesenkt.** Sonst wäre die Taste Zierde gewesen: Bloßes Danebenstehen gewann den Ball in 0,6 s, und ob man drückte oder nicht, machte messbar keinen Unterschied (22/40 ohne Taste gegen 25/40 mit). Jetzt gewinnt Danebenstehen 6/40, Angreifen 28/40 und Grätschen 22/40
- Der Prüfstandsfall zum Zweikampf von hinten rechnet jetzt mit 40 statt 20 Versuchen je Abstand: Von hinten hilft nur die Grätsche, die Quote ist entsprechend klein und schwankte zwischen 2 % und 8 %

## [0.13.5]

### Geändert
- **STREET SOCCER: Die Grätsche wackelt nicht mehr, sie rutscht.** Sich strecken, antreten, ausrutschen, kurz liegen: Die Streckung wird in 0,08 s aufgebaut und dann **gehalten** statt zu federn, und der Tempobonus ist nicht mehr konstant 1,35, sondern beginnt bei ×1,50 und fällt auf ×0,91 — am Ende ist man langsamer als im normalen Lauf. Die federnde Schwingung gehört zum Aufprall, nicht in die Bewegung

### Behoben
- **Der Prüfstand erkannte Halbzeit und Abpfiff am gezeichneten Text „A · WEITER".** Als der mit den Tastenhinweisen verschwand, liefen die statistischen Fälle still ins Zeitlimit und lieferten den **Halbzeitstand als Endstand** — die Torquote sah dadurch nach 1,9 statt 3,3 aus. Erkannt wird jetzt über `state.phase`

## [0.13.4]

### Geändert
- **STREET SOCCER: Der Hechtsprung hebt jetzt ab.** In der Draufsicht las er sich wie eine Grätsche — ein gedehntes Oval am Boden. Jetzt bleibt ein **Schatten am Boden**, während der Körper sich löst, 12 % größer wird und wieder landet; danach folgt der Aufschlag mit kurzem Breitklatschen. Die federnde Schwingung gehört zum Aufprall, nicht in die Luft — mitten im Flug zu wackeln sah nach Wackelpudding aus
- **Flaggen nachgebessert.** USA war falsch aufgebaut: sieben Streifen und ein zu breiter blauer Block ohne Sterne, was eher nach Frankreich aussah. Jetzt 13 Streifen, Gösch über sieben davon und 2/5 der Breite, dazu ein Punktraster als Sternenfeld
- Drei weitere waren nicht unterscheidbar: **Mexiko** und Italien haben dieselbe Bauart bei einem Farbabstand von nur 25 von 255 — Mexiko bekommt sein Wappen; **Kroatien** sah aus wie die Niederlande und bekommt sein Schachbrett; **Uruguay** war ohne Gösch nur ein Streifenmuster und bekommt seine Sonne
- **Die Tastenhinweise in den Menüs sind weg** („A · WÄHLEN   B · ZURÜCK" und acht weitere). A und B bedeuten überall dasselbe; stehen bleibt nur, was man nicht erraten kann — etwa „SPIELER 2 WÄHLT"

## [0.13.3]

### Geändert
- **STREET SOCCER: Nach einer Grätsche liegt man kurz** (0,35 s) — aber nur, wenn man den Ball verfehlt hat. Eine geglückte Grätsche belohnt sich selbst; sonst verlöre man den eben eroberten Ball sofort wieder. Nebenwirkung, nachgemessen: Die Ballabnahme von hinten fällt von rund 14 % auf rund 7 % der Verfolgungen; Torquote unverändert 2,6
- **Die Verformung federt jetzt.** Statt einer einzelnen Beule eine gedämpfte Schwingung, die über die Kugelform hinaus in die Stauchung schwingt und ausschwingt — eine Beule sah aus wie ein gedrehtes Oval, erst das Nachfedern fühlt sich nach Material an

### Behoben
- `ELAST_N` wurde nach seiner ersten Verwendung deklariert — das Spiel wäre beim ersten Zeichnen abgestürzt. Vom Prüfstand gefangen, bevor es deployt wurde

## [0.13.2]

### Geändert
- **STREET SOCCER: Grätsche und Hechtsprung sind jetzt eine Bewegung, kein lang gezogenes Oval.** Beide waren über die ganze Aktion konstant gestreckt gezeichnet (1,75 × 0,62 bzw. 2,15 × 0,52). Jetzt verformt sich die Spielerscheibe wie ein Flummi: **flächentreu** (längs `k`, quer `1/k`) und **über die Dauer** — schnell auseinander, langsamer zurück in die Kugel. Spitze 1,55 bei der Grätsche, 1,85 beim Sprung; wer liegt, federt beim Aufstehen von 1,45 auf 1,00 zurück

## [0.13.1]

### Geändert
- **STREET SOCCER: Auch im Menü ZU ZWEIT SPIELEN sind die Unterzeilen weg.** Damit haben alle drei Auswahlbildschirme — Modus, Spielerzahl, Seiten — nur noch die Punkte selbst

## [0.13.0]

### Neu
- **STREET SOCCER: Hechtsprung vor dem Tor.** Mit **B ohne Ball** macht man sich lang, um eine scharfe Hereingabe doch noch zu erreichen, und fälscht sie Richtung Tor ab — angenommen wird der Ball dabei nicht. Danach liegt man kurz am Boden; das ist der Preis, wenn man daneben springt. Die KI nutzt denselben Sprung
- Er bleibt bewusst die Ausnahme: nur nahe am gegnerischen Tor, nur auf einen freien, scharf gespielten Ball, und nur wenn der zu Fuß gerade nicht mehr erreichbar ist. Im Sprung zielt niemand genau (Streuung 2,4 statt 0,7 Torbreiten). Nachgemessen: 13 Sprünge pro Spiel, 37 % davon am Ball, Torquote unverändert bei 2,4. Der erste Entwurf lag bei 99 Sprüngen und 10,1 Toren pro Spiel

### Geändert
- **Kartentexte im Karussell lesbar.** „1–2 SPIELER · CLASSIC ARCADE" stand mit 3,4:1 gegen den Kartenhintergrund, auf den nicht gewählten Karten mit 1,4:1 — jetzt 8,9:1 bzw. 3,0:1
- Die Tastenhinweise unter den Einstellungen sind weg; die ‹ › an der Karte zeigen die Achse schon. Stehen bleibt nur „GILT AB DEM NÄCHSTEN SPIEL", was man nicht sehen kann

## [0.12.4]

### Geändert
- **Popup-Menüs sind nicht mehr durchsichtig.** Das Spielfeld schien mit 18 % durch und machte gerade die Screens mit Werten unruhig; das Overlay ist jetzt fast deckend, die Behelfs-Panel darunter konnten weg
- **VOLLBILD steht an erster Stelle** und zeigt den **tatsächlichen** Zustand des Fensters statt eines gespeicherten Werts — Vollbild lässt sich jederzeit mit ESC verlassen, ohne dass die Konsole etwas davon mitbekäme. Der Wert wird deshalb bewusst nicht gespeichert
- **Hilfeseite neu.** Statt dreier loser Textblöcke eine Tabelle: Taste, zweite Taste, Bedeutung — dazu drei Abschnitte (Bewegen, Tasten, Wer spielt mit). Bisher fehlten die B-Tasten, ESC und die ganze Frage, wie ein zweiter Spieler einsteigt
- Spiele liefern ihre eigenen Hilfezeilen (`help` am Modul), die die Konsole anhängt. STREET SOCCER erklärt damit A und B mit und ohne Ball, CATAPULT das Spannen und den Wind
- Die Unterzeilen im Modus- und im Spielerzahl-Menü sind weg — sie überluden den ersten Bildschirm

### Behoben
- **STREET SOCCER: Die Grätsche des Menschen dauerte 0,4 s, die der KI 0,55 s.** Beim Vereinheitlichen in v0.11.26 hatte ich nur `p.tackle` erwischt, nicht `me.tackle` — der Mensch war im Zweikampf schlechter gestellt als die KI. Beide nutzen jetzt `TACKLE_TIME`

## [0.12.3]

### Neu
- **STREET SOCCER: EINSTELLUNGEN als dritter Punkt** neben WORLD CUP und FREUNDSCHAFTSSPIEL. So kommt man an Halbzeitlänge und Schwierigkeit, ohne erst anpfeifen und pausieren zu müssen
- Dafür neu in der Spiel-Schnittstelle: `api.openSettings()`. Zurück führt dann ins Startmenü des Spiels und nicht ins Pausenmenü, das man nie aufgerufen hat
- Der Screen heißt jetzt **INGAME EINSTELLUNGEN** statt den Spielnamen zu tragen

## [0.12.2]

### Geändert
- **Der Einstellungs-Screen im Spiel ist jetzt dasselbe Karussell wie im Konsolenmenü** — gleiche Karten, gleiche Achse, gleiche Tasten: ← → blättert, A / Enter ändert, ↑ ↓ verlässt den Screen. Vorher war es dort eine senkrechte Liste, man musste also zwei Bedienarten lernen
- Die Karussell-Regeln teilen sich beide Screens (`.settings-carousel`, `.settings-track`, `.setting`), damit sie nicht auseinanderlaufen

## [0.12.1]

### Geändert
- **Globale und spielspezifische Einstellungen sauber getrennt.** SPIELDAUER und SCHWIERIGKEIT gehörten nie ins Konsolenmenü — dort stehen jetzt ausschließlich Lautstärke, Bildröhre und Vollbild
- Spielspezifische Regler liegen im **Ingame-Menü des laufenden Spiels** (ESC → EINSTELLUNGEN). Der Screen trägt den Namen des Spiels und zeigt nur dessen Regler
- Jedes Spiel **deklariert seine Regler selbst** (`settings` am Modul) und liest sie über `api.setting(key)`. Die Konsole zeigt und speichert sie nur, unter `retrocon.game.<id>` — sie kennt weder Halbzeitlänge noch Turnierstärke
- STREET SOCCER bietet HALBZEIT (1–5 Minuten) und SCHWIERIGKEIT, CATAPULT die SPIELZEIT
- **Die globalen Einstellungen sind jetzt ein Karussell**, dieselbe Achse wie bei den Spielen: ← → blättert, A / Enter ändert, ↑ ↓ verlässt die Zeile. Als senkrechte Liste stritt sich die Bedienung mit der Zeilennavigation

## [0.12.0]

### Neu
- **Prüfstand im Repo.** `node tests/run.js` — kein Build, keine Abhängigkeiten. Neun Fälle, jeder für einen Fehler, der schon einmal im Spiel war: unsichtbare Füße, Ballverlust in jeder Kurve, tote Bälle, verfehlter Anstoß, unmögliche Ballabnahme von hinten, falsche Zurück-Navigation, einseitige Torverteilung, wirkungsloser WM-Aufschlag. `--full` nimmt die statistischen Fälle dazu (mehrere Minuten, viele volle Spiele)
- **Einstellungen-Menü** statt „BALD VERFÜGBAR": Lautstärke, Spieldauer, Schwierigkeit, Bildröhre und Vollbild. Bedienbar mit Tastatur, Controller und Maus, gespeichert in `localStorage`
- Die Lautstärke wirkt über einen Master-Gain, den die Spiele als `audioCtx.destination` untergeschoben bekommen — kein einziges Spiel musste dafür angefasst werden
- Spieldauer und Schwierigkeit reicht die Konsole als `api.settings` an die Spiele. STREET SOCCER nimmt beides (Halbzeitlänge, Grundstärke der Gegner), CATAPULT die Spieldauer. Fehlt das Feld, gelten die Vorgabewerte

## [0.11.28]

### Geändert
- **STREET SOCCER: Ballabnahme von hinten wieder schwerer.** Sie war nach v0.11.26 zu leicht geworden (rund 29 % der Verfolgungen führten binnen 5 s zum Ballgewinn), jetzt sind es rund 14 %: 10/40 · 3/40 · 5/40 bei Abstand 0,05 / 0,08 / 0,12
- Dosiert über die Grätschenreichweite `TACKLE_MAN` (`PLAYER_R * 3,4` → `2,9` → `2,6`), **nicht** über die Zweikampfrate am Mann: Die Rate ist ein Kippschalter, weil der Zweikampf innerhalb der Grätsche von 0,55 s durchlaufen muss. Bei Faktor 0,85 braucht er 0,35 s und gelingt, bei 0,55 braucht er 0,53 s und scheitert fast immer — ein Zwischenwert existiert praktisch nicht. Der erste Versuch über die Rate landete prompt bei 0/40 · 0/40 · 3/40
- 2 gegen 1 und Torquote unverändert (13 % der Ballbesitzzeit, 2,5 Tore pro Spiel)

## [0.11.27]

### Behoben
- **STREET SOCCER: Der WM-Schwierigkeitsregler wirkte kaum.** `skill()` galt für **beide** Mannschaften — der Turnieraufschlag machte also auch die eigenen Mitspieler und den eigenen Torwart stärker und hob damit den Großteil seiner Wirkung wieder auf. Er gilt jetzt nur noch für den Gegner (in der WM immer Team 1; Gegeneinander gibt es nur im Freundschaftsspiel)
- Damit gibt es überhaupt erst eine messbare Schwierigkeitskurve. Gemessen mit einer festen Bezugsmannschaft gegen den skalierenden Gegner, je 14 Spiele pro Runde: Torverhältnis −0,4 (Achtelfinale) · −0,7 (Viertelfinale) · −0,8 (Halbfinale) · −1,3 (Finale)
- Die Schrittweite steckt jetzt in einer eigenen Konstante `SKILL_STEP` und wurde von 0,11 auf 0,075 gesenkt: Mit 0,11 endete das Finale bei 0,1 : 2,6 und 0 von 12 Siegen, mit 0,05 war zwischen den Runden kaum ein Unterschied messbar
- Freundschaftsspiele sind unverändert — dort ist der Aufschlag ohnehin 1,00

## [0.11.26]

### Geändert
- **STREET SOCCER: Mit Ball am Fuß läuft man langsamer** (`BALL_DRAG` = 0,92). Ohne das ist ein Ballführender nicht einzuholen und jeder Zweikampf entschieden, bevor er beginnt
- **Ballabnahme von hinten ist jetzt möglich.** Sie war vorher *geometrisch unmöglich*: Der Ball liegt beim Dribbeln vorn, die Körper werden auf `PLAYER_R * 2` auseinandergehalten — Körperabstand 0,042 plus Vorlage 0,038 ergibt mindestens 0,080, die Zweikampfgrenze lag bei 0,052. Gemessen: 0 von 120 Verfolgungen führten zum Ballgewinn. Die Grätsche zählt jetzt zusätzlich gegen den Mann (`TACKLE_MAN`), etwas zäher als der Zweikampf am Ball
- **Auch die KI macht bei der Grätsche einen Ausfallschritt.** Der Tempobonus galt bisher nur für Menschen — die KI-Grätsche setzte das Flag, kam dem Ball aber keinen Zentimeter näher
- **Der zweite Verteidiger verdoppelt** im eigenen Drittel, seitlich versetzt und einen Schritt näher am eigenen Tor. Hintereinander stehend wären beide auf einmal ausgespielt
- Nachgemessen: Ballgewinn von hinten binnen 5 s (Abstand 0,05 / 0,08 / 0,12) von 0/40 · 0/40 · 0/40 auf 9/40 · 16/40 · 17/40. Ballführender unter Druck von einem Gegner 58 % → 73 %, von zweien 5 % → 14 %. Läufe direkt in den Torwart 25,3 → 18,8 pro Spiel
- Torquote dadurch 3,2 → 2,8 pro Spiel — der Preis für den höheren Druck

## [0.11.25]

### Geändert
- **STREET SOCCER: Die KI greift strategischer und abwechslungsreicher an.** Sie lief bisher jeden Angriff durch die Mitte und dribbelte dem Torwart in die Arme, ohne abzuschließen — gemessen über vier Spiele: 97 % aller Vorstöße ins letzte Viertel kamen zentral, 38 Läufe pro Spiel endeten direkt im Torwart. Ursache war der Abschluss-Test: Er wertete jeden Gegner im Weg als Block, **auch den Torwart** — und der stand in Schussdistanz immer davor
- Neu: `shotLane()` prüft sieben Zielpunkte über die Torbreite und misst die Luft am nächsten Gegner. Der Torwart zählt breiter mit, an ihm wird vorbeigezielt statt vor ihm abgebrochen. Geschossen wird auf die freieste Ecke
- Neu: Je Ballgewinn würfelt die KI einen Angriffsweg (links / Mitte / rechts, Flügel doppelt gewichtet), zieht erst auf diese Bahn und schneidet erst auf Strafraumhöhe nach innen
- Neu: Liegt der Ball im letzten Drittel, läuft der zweite Angreifer auf der ballabgewandten Seite in den Strafraum ein — vorher hing er immer hinter dem Ballführenden
- Ergebnis, je vier Spiele nachgemessen: Vorstöße durch die Mitte 97 % → 52 %, über den Halbraum 2 % → 34 %, über den Flügel 1 % → 14 %. Läufe direkt in den Torwart 38,3 → 25,3 pro Spiel. Geschossen wird seltener (34,3 → 22,8), aber aus viel verschiedeneren Lagen: Entfernung 0,156–0,224 → 0,163–0,333
- Torquote über 48 Spiele: 3,2 und 3,0 pro Spiel in zwei Stichproben, Halbzeiten gleichmäßig

## [0.11.24]

### Behoben
- **STREET SOCCER: Mit Ball ließ sich die Richtung nicht mehr ändern.** Der vorgelegte Ball rollte stur geradeaus weiter, während der Spieler abbog — nach `CONTROL_R` war er weg. Über 240 Kurvenläufe gemessen: vorher überstand nur die langsame 45-Grad-Kurve den Richtungswechsel (20/20), jede andere Drehung kostete den Ball (0/20); jetzt bleibt er bei allen Winkeln bis 180 Grad am Fuß. Der Ball schwenkt jetzt in die Laufrichtung mit (`TURN_PULL`), bei gleichbleibendem Abstand — die Vorlage wird dadurch nicht kürzer, nur richtungstreu
- **Tote Bälle.** Dieselbe Ursache: der beim Abbiegen verlorene Ball rollte aus und blieb liegen. Über vier Spiele lag der Ball 6,4 % der Spielzeit bewegungslos und herrenlos herum (533 Phasen), in v0.11.22 waren es 0,1 %. Mit der Kurvenführung sind es 0,0 %
- Die Notbehelfe aus v0.11.23 sind damit hinfällig und zurückgenommen: Der Torwart greift wieder so weit wie vorher (`GK_REACH` 0,52 → 0,65) und die KI schießt nicht mehr im Akkord (Rate 2,8 → 2,2). Torquote 4,2 pro Spiel bei 2,0 : 2,2 Seitenverteilung

## [0.11.23]

### Behoben
- **STREET SOCCER: Spieler traten den Ball, ohne ihn zu berühren.** Der Dribbelstoß löste schon aus 0,046 Entfernung aus (Berührung wäre 0,0335), und Schuss und Pass gingen sogar, während der Ball beim Dribbeln weit vorauslief — es sah aus, als hätten die Spieler unsichtbare Füße. Alle drei Aktionen setzen jetzt echten Kontakt voraus. Damit es sich nicht träge anfühlt, wird die Absicht bis zu 1,1 s gemerkt und im Moment der Berührung ausgeführt. Nachgemessen über 402 Schüsse und Pässe: kein einziger ohne Berührung
- Nebenwirkung: Die Ballvorlagen wurden dadurch nochmals kürzer (Sprint 0,079 → 0,064, Dribbeln 0,049 → 0,036, also praktisch am Fuß). Weil Abschlüsse jetzt seltener zustande kommen, schließt die KI häufiger ab und der Torwart greift etwas kürzer — die Torquote liegt wieder bei rund 3,9 pro Spiel, gleichmäßig über beide Halbzeiten

## [0.11.22]

### Geändert
- **STREET SOCCER: kürzere Ballvorlagen.** Im Sprint lief der Ball zu weit voraus (0,129), beim Dribbeln zu locker. Jetzt 0,079 im Sprint und 0,049 beim langsamen Dribbeln — letzteres nur 0,014 über dem Ballkontakt am Fuß. Die Ballkontakte kamen dabei von 0,9/s auf bis zu 1,8/s hoch, was zusätzlich nach Dribbling aussieht. Wirksamster Hebel war die Rollreibung des gedribbelten Balls (`DRIBBLE_FRIC` 1,9 → 3,0), weil sie Vorlagen kürzt und Kontakte häufiger macht

## [0.11.21]

### Geändert
- **STREET SOCCER: echtes Dribbling statt starrem Ballabstand.** Vorher hing der Ball in festem Abstand am Spieler, was aussah, als schöbe er ihn mit einer unsichtbaren Stange vor sich her. Jetzt wird der Ball angetippt und rollt frei weiter, der Spieler läuft ihm nach und tippt erneut. Die Stoßhärte wächst mit dem Tempo, die Vorlagen reichen dadurch von 0,055 beim langsamen Dribbeln bis 0,129 im Sprint (2,4-fach), bei rund einem Ballkontakt pro Sekunde
- Läuft der Ball weiter als 0,16 voraus, etwa bei einer scharfen Richtungsänderung im Sprint, ist er frei

## [0.11.20]

### Geändert
- **STREET SOCCER: Deutlich größere Tempospanne am Analogstick.** Der Mindestwert lag bei 40 % des Maximums, die Spanne war damit nur 2,5-fach — jetzt 22 % bis 100 % bei kleinerer Totzone (0,12 statt 0,18) und höherem Sprinttempo, also gut vierfache Spanne
- **STREET SOCCER: Ballkontrolle hängt jetzt am Tempo.** Wer langsam dribbelt, behält den Ball am Fuß (Abstand 0,043); im Sprint läuft er 56 % weiter voraus (0,068). Der Zweikampf prüft zudem die **Ballposition** statt der Körperposition — im Sprint wird man dadurch angreifbar, langsames Dribbeln ist sicherer
- Nebenwirkung: KI gegen KI liegt jetzt bei rund 4,3 Toren pro Spiel statt 3,0, weil Ballverluste häufiger sind

## [0.11.19]

### Hinzugefügt
- **STREET SOCCER: Die KI übernimmt untätige Plätze.** Drückt an einem Platz 8 Sekunden lang niemand etwas, spielt dort die KI weiter — die erste Eingabe holt die Steuerung sofort zurück. Als Aktivität zählt nur echte Eingabe: ein ruhender Controller sendet weiterhin 30 Pakete pro Sekunde, die werden ignoriert. Erkennbar ist die Übernahme am fehlenden Markierungsring

## [0.11.18]

### Behoben
- **STREET SOCCER: Flaggen im Spiel-HUD saßen zu tief.** Sie waren an der Textgrundlinie ausgerichtet, und die liegt unter den Buchstaben. Jetzt wird über `actualBoundingBoxAscent/Descent` die echte Glyphenhöhe gemessen und die Flagge auf die optische Mitte des Textes gesetzt

## [0.11.17]

### Hinzugefügt
- **STREET SOCCER: Flaggen auch in der Anzeige während des Spiels.** Sie stehen links bzw. rechts neben den Ländernamen; die Position wird aus der gemessenen Textbreite berechnet, liegt also unabhängig von der Namenslänge sauber an

## [0.11.16]

### Hinzugefügt
- **STREET SOCCER: Flaggen statt Farbklötze.** Die Mannschaftsauswahl und der Anpfiff-Screen zeigen jetzt gezeichnete Landesflaggen (Streifen, Kreuz, Scheibe, dazu Brasilien und USA als Sonderfälle)

### Behoben
- **STREET SOCCER: Trikotfarben waren auf dem Rasen teils unsichtbar.** Bisher diente die Landesfarbe zugleich als Trikot — **8 von 32 Trikots** lagen damit unter 3:1 Kontrast zum dunklen Grün, Deutschlands schwarzes Auswärtstrikot bei 1,0:1 also exakt auf Rasenniveau. Flaggen- und Trikotfarben sind jetzt getrennt; die Trikots sind durchweg hell gewählt, schlechtester Wert 3,4:1

### Geändert
- **STREET SOCCER:** Ländernamen im Anpfiff-Screen stehen neutral in Weiß statt in der Trikotfarbe; die Zuordnung übernimmt die Flagge daneben. Die Anzeige während des Spiels bleibt eingefärbt, dort unterscheidet die Farbe die Seiten

## [0.11.15]

### Behoben
- **Tastatur war bei verbundenem Controller komplett tot.** `game.js` reichte Tastatureingaben nur durch, wenn für den Platz *kein* Controller verbunden war — mit angeschlossenem Smartphone ließen sich Menüs also weder mit der Tastatur bedienen noch das Spiel steuern. Die Tastatur wird jetzt immer durchgereicht, bei verbundenem Controller aber nur solange wirklich eine Taste liegt (plus Loslass-Frame). Ein leeres Tastatur-Gamepad hätte sonst jeden Frame die Controller-Eingabe überschrieben. Gilt für alle Spiele

### Geändert
- **STREET SOCCER: Am Analogstick bestimmt die Auslenkung das Tempo.** Vorher wurde der Stick-Vektor normalisiert, man lief also immer mit Volltempo. Jetzt Totzone bei 0,18, volles Tempo ab 0,90, dazwischen linear ab 40 %. Tastatur und Dpad bleiben digital

## [0.11.14]

### Geändert
- **STREET SOCCER: Feld etwas höher.** Breite zu Länge von 0,50 auf **0,58**, also zwischen Futsal (0,50) und Großfeld (0,648). Tor, Strafraum und Torwart-Reichweite wurden wieder mitskaliert, damit ihre Anteile und die Balance gleich bleiben — KI gegen KI liegt weiter bei 3,0 Toren pro Spiel, über 20 Spiele symmetrisch (1,5 : 1,5)

## [0.11.13]

### Geändert
- **STREET SOCCER: Feld auf Futsal-Proportionen umgestellt** — Breite zu Länge von 0,66 auf **0,50** (40 × 20 m). Das passt zum Kleinfeld-Charakter und nutzt im Querformat den Bildschirm deutlich besser aus. Tor und Strafraum wurden mitskaliert, damit ihr Anteil an der Feldbreite gleich bleibt
- Der Torwart musste nachgezogen werden: Bei gleicher Reichweite deckte er im schmaleren Tor 42 % statt 32 % ab, die Torquote brach von 2,8 auf 1,0 pro Spiel ein. Mit `GK_REACH` 0,85 → **0,50** liegt sie wieder bei 2,8, gleichmäßig über beide Halbzeiten verteilt
- Vorschaugrafik im Menü an die neuen Proportionen angepasst

## [0.11.12]

### Hinzugefügt
- **STREET SOCCER: Das Feld dreht sich im Querformat.** Auf breiten Bildschirmen liegt es jetzt waagerecht und man greift nach rechts an, statt dass links und rechts viel Platz ungenutzt bleibt. Die Steuerung dreht sich mit; Feldlinien, Strafräume und Tore werden aus Feld-Eckpunkten gezeichnet und folgen der Ausrichtung automatisch
- **STREET SOCCER: Die KI grätscht jetzt auch.** Bisher wurde `tackle` ausschließlich durch menschliche Eingaben gesetzt — Zweikämpfe der KI blieben unsichtbar und zahnlos. Gemessen: rund 54 KI-Grätschen in drei Minuten

## [0.11.11]

### Behoben
- **STREET SOCCER: Der Anstoß ging weiterhin verloren.** Die Reservierung des Balls allein reichte nicht — der vorgesehene Abnehmer lief dem Pass gar nicht entgegen. Die KI bestimmt den Balljäger als „nächster zum Ball", und das ist direkt nach dem Anstoß noch der Schütze; der darf den Ball aber wegen der Reservierung nicht aufnehmen. Also rollte der Ball durch, die Reservierung lief ab und der Gegner holte ihn. Der Abnehmer läuft dem Ball jetzt gezielt entgegen, die Reservierung hält bis zu 3,5 s. Nachgemessen über **240 Anstöße** in vier Varianten (reine KI, Mensch still, Mensch läuft weg, Mensch läuft mit): 240 von 240 kommen an

### Geändert
- **STREET SOCCER: Grätsche liegt jetzt auf der Abspieltaste B**, der Spielerwechsel auf A. Beide B-Aktionen gehen damit „an den Ball": mit Ball abspielen, ohne Ball grätschen
- Die Schleifspur der Grätsche ist wieder weg, der in Laufrichtung gestreckte Körper bleibt

## [0.11.10]

### Geändert
- **STREET SOCCER: Die Grätsche ist jetzt sichtbar.** Vorher änderte sie nur Tempo und Zweikampfchance, man sah aber nichts davon. Der Spieler wird während der Grätsche in Laufrichtung gestreckt gezeichnet und zieht eine Schleifspur hinter sich her; die Dauer stieg von 0,28 s auf 0,4 s, damit es auch zu erkennen ist

## [0.11.9]

### Geändert
- **STREET SOCCER: kein automatischer Spielerwechsel nach Ballnähe mehr.** Im Alleingang war es verwirrend, dass die Figur ständig unter den Fingern wechselte. Du behältst jetzt deinen Spieler und wechselst bewusst mit **B**; die einzige verbleibende Automatik ist die Übernahme des Ballführenden, sobald die eigene Mannschaft den Ball hat
- Gemessen über 2 Minuten ohne Tastendruck: 14 Wechsel, davon **14 Übernahmen des Ballführenden** und keiner nach Ballnähe (vorher 21 Wechsel nach Ballnähe)

## [0.11.8]

### Behoben
- **STREET SOCCER: Der Anstoßpass ging oft daneben** und die Mannschaft verlor den Ball sofort wieder — abgefangen oder am Mitspieler vorbeigerollt, wenn der sich schon wegbewegt hatte. Der Anstoßball ist jetzt 1,6 s lang dem vorgesehenen Abnehmer reserviert; nur er kann ihn aufnehmen. Nachgemessen über 120 Anstöße (reine KI, mit Mensch, und mit einem Menschen der bewusst wegläuft): **120 von 120** kommen bei der eigenen Mannschaft an, vorher ging der erste Ball regelmäßig an den Gegner

## [0.11.7]

### Hinzugefügt
- **STREET SOCCER: echter Anstoß.** Der Ball liegt auf dem Mittelpunkt und wird nach der Anstoß-Pause kurz zum Mitspieler abgelegt, statt dass der Schütze einfach losdribbelt
- Die andere Mannschaft bleibt beim Anstoß in ihrer eigenen Hälfte. Ohne diese Regel stand ihr Stürmer auf seiner Grundposition praktisch genau auf dem Abnehmer und fing den Anstoßpass sofort ab — im Test ging der erste Ball jedes Anstoßes direkt an den Gegner

## [0.11.6]

### Hinzugefügt
- **STREET SOCCER: Anstoß-Pause.** Vor dem Anpfiff, nach der Halbzeit und nach jedem Tor steht das Spiel jetzt kurz still (1,6 s bzw. 2,4 s nach einem Tor) und zeigt „ANSTOSS" bzw. „TOR!". Vorher wurde der Torjubel zwar eingeblendet, darunter lief das Spiel aber sofort weiter — den Neubeginn bekam man gar nicht mit. Die Uhr steht während der Pause ebenfalls, es geht also keine Spielzeit verloren

## [0.11.5]

### Hinzugefügt
- **STREET SOCCER: Menüs sind jetzt mit der Maus bedienbar.** Bisher reagierten sie ausschließlich auf Tastatur und Controller — die Menüs werden auf dem Canvas gezeichnet, es gibt also keine DOM-Elemente zum Anklicken. Jede Zeichenfunktion registriert nun ihre Klickflächen; Tastatur, Controller und Maus laufen über dieselben Funktionen `activate()` und `goBack()`
  - Klick auf einen Listeneintrag oder eine Mannschaftskachel wählt direkt aus
  - Auf den Panel-Screens (Anpfiff, Halbzeit, Ergebnis, Weltmeister, Aus) bestätigt ein Klick irgendwohin

## [0.11.4]

### Hinzugefügt
- **STREET SOCCER: Im Freundschaftsspiel gegeneinander wählt jeder seine eigene Mannschaft.** Erst Spieler 1, dann übernimmt Spieler 2 den zweiten Auswahlbildschirm; die Überschriften heißen jetzt „SPIELER 1 · MANNSCHAFT" und „SPIELER 2 · MANNSCHAFT". Ist Spieler 2 noch nicht verbunden, darf Spieler 1 stellvertretend wählen
- **STREET SOCCER:** Gegeneinander bleibt auch im World Cup möglich — der Anpfiff-Screen weist darauf hin, dass Spieler 2 dort den ausgelosten Gegner übernimmt

### Geändert
- **STREET SOCCER: Spieltempo nochmals um rund 26 % gesenkt.** Ein Feldspieler braucht jetzt ~6,5 s für die Feldlänge (vorher ~5 s). Spieler und Ball wieder gemeinsam gedrosselt; KI gegen KI liegt bei 3,1 Toren pro Spiel, über 24 Spiele symmetrisch (1,6 : 1,5)

## [0.11.3]

### Geändert
- **STREET SOCCER: Menüablauf umgestellt** auf Modus → **Spielerzahl** → (nur zu zweit) Seiten → Mannschaft. Die Frage „miteinander oder gegeneinander" erscheint nur noch, wenn sie überhaupt Sinn ergibt; allein steht der Teammodus fest auf „miteinander"
- Die Spielerzahl wird abgefragt statt aus den Verbindungen abgeleitet. Spieler 2 an der Tastatur existiert erst, wenn im Spiel eine WASD-Taste gedrückt wird — im Menü meldet `getConns()` deshalb oft nur einen Spieler, obwohl zwei mitspielen wollen

## [0.11.2]

### Behoben
- **STREET SOCCER: Die Zuordnung der Figuren zu Spieler 1 und 2 sprang.** Zu zweit in einer Mannschaft sind beide Feldspieler ohnehin besetzt — die Zuweisung nach Ballnähe tauschte den beiden dann nur gegenseitig die Figur weg. Sind alle Feldspieler von Menschen besetzt, bleibt die Zuordnung jetzt fest (nachgemessen: 0 Wechsel über 2 Minuten, vorher sprang sie regelmäßig)

### Geändert
- **STREET SOCCER:** Auch im Alleingang ist der automatische Spielerwechsel ruhiger — Sperre 0,25 → 0,4 s, Hysterese 1,35 → 1,9. Statt alle 2,4 s wechselt die Steuerung jetzt rund alle 6 s

## [0.11.1]

### Geändert
- **STREET SOCCER: ruhigeres Spieltempo.** Lauftempo um rund 30 % gesenkt (ein Feldspieler braucht jetzt ~5 s für die Feldlänge statt ~3 s), Ballgeschwindigkeiten um 25 % und die Reibung entsprechend. Spieler und Ball wurden bewusst gemeinsam gedrosselt — bei nur langsameren Spielern wäre der Torwart gegenüber dem Schuss wehrlos geworden
- **STREET SOCCER: mehr Tore.** Durch das langsamere Spiel entstanden in regulärer Zeit kaum noch Treffer, fast jede Partie wurde erst im Golden Goal entschieden. Der Fangradius des Torwarts ist deshalb weiter reduziert; ein KI-gegen-KI-Spiel endet jetzt bei rund **4 Toren** (vorher 1,6) mit Ergebnissen wie 5:2, 1:3 oder 2:3, und die Treffer verteilen sich wieder über beide Halbzeiten

## [0.11.0]

### Hinzugefügt
- **STREET SOCCER — miteinander oder gegeneinander wählbar.** Neuer Auswahlschritt nach der Modus-Wahl: bei MITEINANDER spielen beide Menschen in derselben Mannschaft gegen die KI, bei GEGENEINANDER steuert Spieler 2 die gegnerische Mannschaft. Im World Cup bleibt es der Turnierlauf von Spieler 1
- **STREET SOCCER — Torwart-Schutz.** Hat der Torwart den Ball in der Hand, weichen gegnerische Feldspieler auf 0,17 Feldeinheiten zurück, statt ihm im Abschlag zu stehen und den Ball sofort wieder abzufangen. Erobern konnte man ihm den Ball schon vorher nicht
- **STREET SOCCER — Verlängerung endet garantiert.** Im Golden Goal schrumpft der Fangradius beider Torhüter gleichmäßig über 90 Sekunden auf 35 %. Vorher konnte ein torloses Turnierspiel unbegrenzt weiterlaufen

### Geändert
- **STREET SOCCER: 3 gegen 3** statt 5 gegen 5 (Torwart + zwei Feldspieler). Die Aufstellung wird für die zweite Mannschaft jetzt auch in x gespiegelt
- **STREET SOCCER:** Die KI schießt nur noch bei freier Schussbahn und dribbelt weiter, statt ohne Anspielpartner blind aufs Tor zu dreschen. Das halbierte die Zahl der Schüsse auf ein realistisches Maß
- **STREET SOCCER:** Torhüter reagieren mit Verzögerung (`GK_REACT`) statt den Kreuzungspunkt sofort vorauszuberechnen, und bleiben näher an der Tormitte; die KI zielt auf die Ecken statt in die Mitte

### Behoben
- **STREET SOCCER: In 3 gegen 3 fiel überhaupt kein Tor mehr.** Zwei Ursachen, beide durch Simulation eingekreist:
  - Der Fangradius des Torwarts (0,0795) war größer als die halbe Torbreite (0,0775) — er deckte das komplette Tor ab. In 5 gegen 5 fiel das nicht auf, weil im Gewühl mehr Abpraller entstanden
  - Die Ballaufnahme lief vor der Torprüfung, sodass der Torwart auch Bälle herausfischte, die die Linie bereits überquert hatten

## [0.10.0]

### Hinzugefügt
- Neues Spiel: **STREET SOCCER** (1–2 Spieler) — Kleinfeld-Fußball aus der Vogelperspektive, 5 gegen 5
  - **Zwei Menschen in derselben Mannschaft.** Anders als in allen bisherigen Spielen sind P1 und P2 keine Gegner; die gegnerische Mannschaft ist immer KI. Jeder Mensch steuert einen eigenen Feldspieler, dieselbe Figur kann nie doppelt belegt werden
  - **Automatischer Spielerwechsel** zum ballnächsten Mitspieler; hat die eigene Mannschaft den Ball, übernimmt man den Ballführenden. Der Torwart bleibt immer KI. Hysterese verhindert Flackern im Getümmel
  - **Steuerung**: A schießt bzw. grätscht, B spielt ab bzw. wechselt den Spieler, Richtung läuft. Man greift immer nach oben an — deshalb gibt es zur Halbzeit bewusst **keinen Seitenwechsel**
  - **WORLD CUP**: Achtelfinale → Viertelfinale → Halbfinale → Finale, vier Siege in Folge zum Titel, eine Niederlage beendet den Lauf. Unentschieden führt in die Verlängerung mit Golden Goal. Die KI wird pro Runde stärker
  - **FREUNDSCHAFTSSPIEL**: einzelnes Spiel mit freier Gegnerwahl
  - 16 Nationen mit Trikotfarben; bei zu ähnlichen Farben weicht der Gegner automatisch auf sein Zweitset aus
  - Bewusst ohne Abseits, Fouls, Einwurf und Ecken — der Ball prallt von den Seitenlinien ab und bleibt im Spiel
  - Spielzeit 2 × 3 Minuten

### Behoben
- **STREET SOCCER — die zweite Mannschaft war systematisch im Vorteil** (rund dreifache Torausbeute im Testlauf), allein weil sie im Spieler-Array weiter hinten stand. Drei Stellen liefen reihenfolgeabhängig und wurden getrennt:
  - Bewegung: erst entscheiden alle aus demselben Weltzustand, dann bewegen sich alle
  - Ballaktionen: Schuss und Abspiel werden vorgemerkt und erst nach dem Entscheidungsdurchgang ausgeführt — sonst reagierte die später verarbeitete Mannschaft einen Tick früher auf den freigegebenen Ball
  - Zweikampf und Kollisionsauflösung: Ballführender wird festgehalten, höchstens ein Ballwechsel pro Frame, Abstoßungen werden gesammelt statt sofort angewandt
- **STREET SOCCER:** Ein Tor zählt nur noch bei freiem Ball. Vorher genügte es, den Ball durch bloßes Vorwärtslaufen über die Linie zu tragen — der Ball liegt vor dem Spieler und überschritt die Torlinie von selbst
- **STREET SOCCER:** Menütexte liefen im Hochformat seitlich aus dem Bild; Schriftgrößen hängen jetzt an der kleineren Bildschirmdimension

## [0.9.1]

### Behoben
- **Spiele-Karussell: aktive Karte saß links und wurde abgeschnitten.** `#carousel` war `justify-content: center`, wodurch der überbreite Track zusätzlich um den halben Überhang nach links rutschte. `menu.js` zentriert die aktive Karte aber über `offsetLeft`, das diese Verschiebung nicht enthält — beide Werte lagen in verschiedenen Koordinatensystemen, und die Karte saß konstant um `(Trackbreite − Karussellbreite) / 2` daneben (gemessen: 244 px bei 1080 px Track und 592 px Karussell), links vom `overflow: hidden` beschnitten. Mit `justify-content: flex-start` fallen beide Nullpunkte zusammen; alle vier Karten zentrieren jetzt exakt

## [0.9.0]

### Hinzugefügt
- **Zweiter Tastaturspieler ohne jede Auswahl.** Ein Platz gehört der KI, bis ihn jemand übernimmt — P2 beansprucht, wer **im Spiel** eine WASD-Richtungstaste drückt (`claimByKey` in `game.js`). Tastatur und Smartphone-Controller laufen gleichzeitig; verbindet sich ein Controller für einen Platz, hat er Vorrang, fällt er weg, springt Tastatur bzw. KI wieder ein
  - P1 bleibt wie bisher fest an den Pfeiltasten und wird nie von der KI gespielt
  - Bewusst nur Richtungstasten beanspruchen einen Platz: die Leertaste ist P2s Aktionstaste, ein Reflex darauf hätte sonst stillschweigend den KI-Gegner abgeschaltet
  - Bewusst nur im laufenden Spiel: im Menü ist WASD gleichwertige Navigation, mit der sich ein Solospieler nicht versehentlich den Gegner wegnehmen soll
  - Gilt für alle Spiele — sie werten `api.getConns()` pro Frame aus, deshalb kann ein zweiter Spieler mitten im Match einsteigen
- **CATAPULT:** Wechselt ein Platz zwischen KI und Mensch, wird ein halb geladener Schuss verworfen. Sonst hätte ein Ladevorgang der KI auf ein Loslassen gewartet, das nie kommt

## [0.8.3]

### Behoben
- **CATAPULT — Tastatursteuerung sprang statt zu zielen:** Die Console meldet bei jeder gedrückten Pfeiltaste `joystick.active` mit `y = ±1` (`game.js`). Das Spiel nahm dadurch immer den Joystick-Zweig und setzte den Winkel schlagartig auf 75° bzw. 15°; der ratenbasierte Zweig für Dpad/Tastatur lief nie. Tastatur wird jetzt über `gp.type === 'keyboard'` erkannt und getrennt behandelt

### Geändert
- **CATAPULT — Tastatur komplett auf den Pfeiltasten spielbar:**
  - **← / →** schwenken den Wurfarm (vorher hoch/runter). Die Richtung folgt der Blickrichtung: bei P1 senkt → den Winkel, bei P2 spiegelbildlich ←
  - **↓ halten/loslassen** spannt und feuert das Katapult — Enter wird nicht mehr gebraucht, funktioniert aber weiterhin
  - Zielen beginnt fein (15°/s) und beschleunigt beim Halten auf 58°/s: ein Tipper verstellt rund 2°, ein voller Schwenk dauert ~1,4 s
  - Am Controller bleibt alles wie gehabt — Dpad-runter spannt dort **nicht**, weil das Dpad aus dem Joystick abgeleitet wird und sonst jedes Zielen nach unten einen Schuss auslösen würde

### Dokumentation
- `console/README.md`: Die Keyboard-Tabelle erweckte den Eindruck, zwei Spieler könnten sich eine Tastatur teilen. Tatsächlich reicht `game.js` nur `localPlayers` durch, und dort steht per `addLocalPlayer(1)` nur P1 — die P2-Belegung ist definiert, wird in-game aber nie abgefragt. Jetzt korrekt beschrieben

## [0.8.2]

### Geändert
- **CATAPULT:** Matchzeit von 180 s auf **5 Minuten** erhöht
- **CATAPULT:** Sieg erst, wenn **alle vier Segmente** der gegnerischen Burg abgeräumt sind — vorher beendete ein Treffer auf den Kern das Spiel sofort, auch wenn darüber noch Segmente standen

### Entfernt
- **CATAPULT:** Windskala unter der Zeitanzeige — die Flagge auf der Bergspitze allein genügt als Indikator, der HUD-Bereich unter dem Timer ist jetzt frei

## [0.8.1]

### Geändert
- **CATAPULT — Balancing nach dem ersten Playtest:**
  - Segmente fliegen jetzt **beim ersten Treffer** weg (vorher 2–4 HP): vier Treffer legen eine Burg, jeder Treffer ist sofort sichtbar
  - Matchdauer von 90 s auf **180 s** erhöht — Matches liefen vorher regelmäßig in den Timer
  - KI schießt bedächtiger (Denkpause 1,4–3,2 s statt 0,4–1,1 s) und streut etwas mehr (±7° / ±11 %). Da jedes Segment beim ersten Treffer fällt, ist die Denkpause der wirksamste Hebel für die Spiellänge; ein KI-gegen-KI-Match dauert damit ~28–56 s statt ~13 s
  - Mehr Trümmer und stärkerer Screenshake beim Einsturz
- **CATAPULT — Windanzeige ohne Zahlenwert**, weil sich „WIND 0.5" schlecht vorstellen ließ:
  - **Flagge auf der Bergspitze** — streckt sich in Windrichtung, weht schneller bei starkem Wind, hängt bei Flaute schlaff herunter
  - **Skala unter dem Timer** — Balken wächst aus der Mitte in die Windrichtung, dahinter leuchten bis zu drei Chevrons je nach Stärke auf

## [0.8.0]

### Hinzugefügt
- Neues Spiel: **CATAPULT** (1–2 Spieler) — Burgen-Duell in Echtzeit, angelehnt an Castle Crush
  - **Steuerung**: Joystick stellt den Abschusswinkel (15°–75°) absolut ein, A halten lädt die Kraft (1,1 s auf Maximum), Loslassen feuert; 2 s Nachladezeit nach jedem Schuss
  - **Echtzeit statt Zügen**: beide Spieler zielen, laden und feuern unabhängig voneinander
  - **Zerstörbare Burg** aus vier gestapelten Segmenten (ZINNE 2 HP · TURM 3 HP · MAUER 3 HP · KERN 4 HP); jeder Treffer zeichnet einen Riss, bei 0 HP bricht das Segment weg und die darüberliegenden rutschen nach
  - **Sieg** durch Zerstörung des gegnerischen Kerns — oder nach 90 s durch die höhere Trefferzahl
  - **Wind** driftet alle ~7 s weich auf einen neuen Wert und lenkt jede Flugbahn ab (Anzeige mit Richtung + Stärke oben mittig)
  - **Berg** in der Bildmitte blockiert flache Schüsse und erzwingt hohe Bögen
  - **KI-Gegner** mit AIM→CHARGE→FIRE-Zustandsautomat: bestimmt Winkel und Kraft per Vorwärts-Simulation der echten Spielphysik (Binärsuche über die Kraft), berücksichtigt dadurch Wind und Berg automatisch; Unschärfe auf Winkel (±3°) und Kraft (±5 %) hält sie schlagbar
  - **Sounds**: Ratschen beim Laden, Abschuss-Sweep, dumpfe Einschläge, Knack bei Segmenttreffern, Grollen beim Einsturz, 5-Ton-Siegfanfare
  - Trümmerpartikel und Screenshake bei Einschlägen
- Boot-Terminal: Game-Module-Counter von 3 auf 4 aktualisiert

## [0.7.0]

### Hinzugefügt
- **2D-Slide-Menü**: Hauptmenü als vertikale Slide-Liste (RETROCON · CONTROLLER · SPIELE · EINSTELLUNGEN · CREDITS) statt flachem Karussell
  - Pfeiltasten / Mausrad / Klick auf Pfeil+Label navigieren zwischen Slides
  - Pfeil-Labels zeigen das Ziel-Slide (nicht das aktuelle)
  - Erstes Slide zeigt RETROCON-Logo-Animation; „WEITER"-Label führt den Nutzer ins Menü
  - Controller-Slide ist direkt in die Slide-Liste integriert (kein separater Setup-Screen mehr)
- **Ingame-Menü** (ESC / Controller-SELECT): Pause-Overlay mit eigenem Slide-Mechanismus
  - Slide 0: WEITER · SPIEL BEENDEN · HILFE
  - Slide 1 (HILFE): Steuerungs-Übersicht im selben visuellen Stil wie das Hauptmenü
  - Spiel pausiert beim Öffnen, Canvas bleibt sichtbar im Hintergrund
  - Navigation per Tastatur, Maus und Controller (Dpad + A/B)
- **Tastatur-Belegung**: P1 = Pfeiltasten + Enter, P2 = WASD + Leertaste; beide Schemas funktionieren auch zur Menü-Navigation
- **Toast-Hinweis** beim Spielstart: „ESC · MENÜ" erscheint 3 s unten mittig und blendet aus
- **Spiel beenden** kehrt zum SPIELE-Slide zurück, das zuletzt gespielte Spiel ist im Karussell fokussiert

### Geändert
- Boot-Terminal oben links ausgerichtet — echter Terminal-Look, „PRESS ANY KEY TO START" fließt als normale blinkende Zeile im Textfluss
- Alle Pfeile als weiche CSS-Chevrons (border-right + border-top + rotate)
- ESC im Spiel öffnet Ingame-Menü statt direkt zu beenden
- Controller-SELECT öffnet Ingame-Menü (vorher: direkt zurück ins Hauptmenü)

## [0.6.0]

### Hinzugefügt
- Neues Spiel: **DUST RUSH** (1–2 Spieler) — Staubsauger-Roboter-Wettbewerb in der Vogelperspektive
  - **Panzersteuerung**: Joystick Y = vorwärts/rückwärts, X = Rotation
  - **Gitterboden**: Spielfeld aus quadratischen Sektoren (Sektorgröße = Roboterdurchmesser); wer den letzten Krümel eines Sektors einsammelt bekommt +1 Punkt; gereinigte Sektoren färben sich in Spielerfarbe
  - **175 Partikel** zufällig verteilt; Behälter füllt sich pro Partikel, Akku entlädt sich kontinuierlich
  - **Ladestation** (Mitte unten): lädt Akku und leert Behälter gleichzeitig, automatisches Andocken per Nähe
  - **HUD**: Akku-Bar (Spielerfarbe) + Behälter-Bar (Amber) + Score + Timer; beide Bars blinken rot bei kritischem Stand
  - **KI-Gegner** mit SEEK/DOCK-Zustandsautomat und Stuck-Recovery für Solo-Modus
  - **Sounds**: Collect-Blip, 3-Ton-Sektor-Chime, Dock-Sound, Warnpiepser (Akku/Behälter), Win-Fanfare, Unentschieden-Akkord
  - Spielende: Timer (90 s) oder alle Partikel gesammelt; Siegerscreen mit zwei Zeilen + Score-Anzeige
- Boot-Terminal: Game-Module-Counter von 2 auf 3 aktualisiert

## [0.5.0]

### Hinzugefügt
- Controller als **PWA installierbar**: Web-Manifest + iOS/Android-Meta-Tags + generierte Icons (192, 512, maskable). „Zum Home-Screen" → Fullscreen-Start, Scanner öffnet automatisch wenn kein Code in der URL
- Manifest `display: fullscreen` (Android blendet System-Bars aus; iOS bleibt bei black-translucent da Apple keinen PWA-Statusleisten-Hide erlaubt)
- QR-Scanner: **antippbare Rahmen** um erkannte Codes — Tap auf den Rahmen verbindet direkt als Spieler 1/2, Label zeigt welcher
- QR-Scanner nutzt nativen `BarcodeDetector` (Chromium Android, Safari iOS 17+), jsQR bleibt als Fallback
- ABBRECHEN-Button im Scanner prominent rot unten mittig (vorher unscheinbarer „SCHLIESSEN"-Pill oben rechts)
- Hauptmenü: B öffnet den Setup-Screen zum Hinzufügen/Wechseln eines Spielers (gleiches Layout wie beim Start, kein separater Settings-Screen mehr)
- Keyboard-Steuerung in der Console: `B` öffnet Setup, `A`/`Enter`/`Esc` zurück ins Menü, `Esc` im Spiel kehrt ins Hauptmenü

### Geändert
- Controller-Layout respektiert `safe-area-inset-left/right` (Landscape-relevant), Joystick bleibt vertikal exakt zentriert via ResizeObserver
- `connect()` im Controller reloadet bei Peer-Fehler nicht mehr automatisch — LED wird rot, User scannt bei Bedarf neu
- Setup-Screen Typografie: H1 `clamp(1.6rem, 3.5vw, 2.6rem)`, Hinweistext 1.4rem — lesbar aus Sofa-Distanz
- Controller-Skripte via `?v=` Cache-Bust versioniert, damit Produktions-Handys neue JS-Versionen ohne manuellen Clear bekommen

### Entfernt
- Viewfinder-Crop + 40%-Mindestgrößen-Filter im Scanner (durch kontinuierliche Multi-Code-Erkennung mit Frame-Tap ersetzt)
- Auto-Reload im Controller bei Peer-Disconnect
- Separater Settings-Screen im Console-UI (ungenutzter Duplikat)

## [0.4.0]

### Hinzugefügt
- Neues Spiel: **Slime Volleyball** (1–2 Spieler, Joystick + A zum Springen, KI pro fehlendem Spieler)
- Volleyball: Joystick steuert Slime-Position direkt (statt kraft-basiert), kritisch gedämpfte Interpolation
- QR-Scanner: nur das sichtbare Viewfinder-Rechteck wird an jsQR übergeben (object-fit:cover korrekt zurückgerechnet) + Mindest-Größen-Check (40% der Framefläche), damit bei zwei sichtbaren QR-Codes nicht zufällig der falsche gewinnt
- Controller: QR-Scanner in eigene Datei `controller/qr-scanner.js` (`window.QRScanner`)
- SPA-Architektur: Boot + Setup + Menü + Game in einem Dokument — Audio-Gesture bleibt gültig
- `services/audio.js`: globaler AudioContext, im Boot-Klick erzeugt, an Spiele via `api.audioCtx`
- Console als ES-Module aufgeteilt (`services/` + `views/` + `app.js` + `style.css`)
- Hauptmenü: horizontales Spiele-Karussell mit Game-Cards (`artSvg` + `tagline` aus dem Spielmodul)
- Menü-Legende „(A) SPIEL AUSWÄHLEN / (B) EINSTELLUNGEN" — B öffnet den Setup-Screen
- Press Start 2P als Arcade-Schrift für Logo, Titel, Scores und Sieger-Screen (inkl. Canvas-Preload)
- Pong: KI für jeden nicht verbundenen Spieler (auch P1, wenn nur P2 verbunden ist)

### Geändert
- Root-`index.html` ist nur noch Redirect zu `console/` (SPA lebt komplett dort)
- `console.html` → `console/index.html` (eigener Ordner)
- Spiele in eigene Ordner: `games/pong.js` → `games/pong/pong.js`
- Setup-Screen: neuer Titel „VERBINDE DEIN SMARTPHONE ALS GAME-CONTROLLER", einheitlicher Status „WARTE AUF VERBINDUNG" für beide Spieler, lesbarere SPIELER-Labels
- Boot-Terminal: grüner Phosphor → RETROCON-Blau
- Pong: größere Schläger mit mehr Rand-Abstand, Stil wie Menü-Vorschau, Countdown entfernt, neuer Sieger-Screen, SELECT-Hint weg
- Controller Classic: A/B-Buttons nach links gerückt für bequemere Daumen-Reichweite
- Controller Classic: Icon-Buttons (Home, Gear, Wifi) vertikal gestapelt statt horizontal
- Controller Classic: Größen via `vmax`/`vmin` statt `vw`/`vh` für orientierungsunabhängige Skalierung
- Portrait-Overlay im RETROCON-Stil (Gehäuse-Hintergrund, Crimson-Akzent, 3D-Phone-Icon, zweizeiliger zentrierter Text „SMARTPHONE DREHEN")

### Entfernt
- „SPIELER VERBINDEN"-Button im Hauptmenü (ersetzt durch B-Hint)
- User-Flow-Diagramm aus README (volatil)

## [0.3.3]

### Hinzugefügt
- Controller: Plugin-System mit austauschbaren Varianten unter `controller/variants/`
- Shared `core.js` für Verbindung, Gamepad-Protokoll, Scan-/Picker-Overlays
- Classic-Variante als Default (Joystick + A/B + Menü/Gear/Wifi, Skins crimson/emerald/cobalt/mono)
- Boot-Screen: Terminal-Bootloader → „PRESS ANY KEY" → RETROCON-Animation

### Geändert
- `controller.html` → `controller/` Plugin-Struktur mit Redirect-Stub
- Menü-Navigation: jeder verbundene Controller kann steuern (kein Player-Tracking)

## [0.3.2]

### Geändert
- Flow: Boot → Setup → Hauptmenü (Setup-Screen als initialer Screen)
- Setup-Screen: Hinweistext + A zum Starten statt START-Button

## [0.3.1]

### Geändert
- Flow: Boot → Hauptmenü, Setup via „Spieler verbinden"

## [0.3.0]

### Hinzugefügt
- Setup-Screen mit 2 QR-Codes (P1 + P2)
- Hauptmenü-Flow für Spielauswahl
- Einheitliches Branding: RETROCON blau mit Glow

## [0.2.0]

### Hinzugefügt
- Retro-Konsole-Plattform mit 4-stelligem Raum-Code
- Rebrand: pong-controller → RETROCON
- Wording: „Console" → „Raum" durchgängig

## [0.1.x]

### Hinzugefügt
- Joystick mit fixem Mittelpunkt und Rücksprung
- QR-Code bei Controller-Disconnect
- Direkte Paddle-Steuerung via Joystick
- Sound + Gewinner-Screen (bei 10 Punkten)

## [0.0.x] — frühe Prototypen

- Pong mit WebRTC-Handy-Steuerung (initial)
- NES-Gamepad Controller (D-Pad + A/B/SELECT/START)
- Fullscreen-Controller (ganzer Screen als Gamepad)
- Analoger Joystick + LED-Status
- QR-Scanner zum Neuverbinden
- Wake Lock API (Display bleibt wach)
- Portrait/Landscape-Support mit Dreh-Hinweis
