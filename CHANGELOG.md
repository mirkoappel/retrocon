# Changelog

Alle nennenswerten Änderungen an RETROCON. Format orientiert an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

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
