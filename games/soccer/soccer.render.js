// STREET SOCCER — alles, was gezeichnet wird: Feld, Spieler, Kopfzeile,
// Tafeln, Menübildschirme und die Wiederholung aus dem Mitschnitt.
//
// Ausgelagert, weil es mit 560 Zeilen ein knappes Viertel des Spiels ausmachte
// und sich sauber abgrenzen lässt: Es braucht 28 Namen von außen, die als
// Kontext hereingereicht werden — Konstanten, den Spielzustand und eine
// Handvoll Hilfen. Umgekehrt ruft der Spielteil nur die zurückgegebenen
// Zeichenfunktionen auf.
//
// Die Maße `w` und `h` bleiben lokal und werden über `resize()` nachgeführt;
// dadurch konnte der gesamte Rumpf unverändert übernommen werden.

window.RetroSoccer = window.RetroSoccer || {};

window.RetroSoccer.render = function (ctx, K) {
  let { w, h } = K;
  const {
    state, clamp, kit, hotspot, goalItems, drawFlagIcon, GOAL_DEPTH,
    MITTE_R, GOAL_AREA_W, GOAL_AREA_D, ELFMETER, TEILKREIS_R, ECK_R, STRASSE_R,
    AUTO_REPLAY, AUTO_HALF, AUTO_RESULT, AUTO_INTRO,
    FIELD_W, GOAL_W, BOX_W, BOX_D, PLAYER_R, BALL_R,
    TURF, TURF_ALT, LINE, P_COL, ROUNDS, TEAMS, rasenArt, rasenFarbe, linienArt,
    DIVE_TIME, DIVE_DOWN, GK_DIVE_TIME, TACKLE_TIME, POKE_TIME,
    GOAL_WAIT, GOAL_LOCK, MITSCHNITT_FELDER,
  } = K;

  // ── Rendering ────────────────────────────────────────
  // Schriftmaß: auf breiten Schirmen die Höhe, im Hochformat die Breite —
  // sonst laufen die Menütexte seitlich aus dem Bild.
  // Bewusst eine Funktionsdeklaration: dieser Abschnitt steht hinter dem
  // return, und nur Deklarationen werden hochgezogen, const nicht.
  function uni() { return Math.min(h, w * 0.6); }
  function font(px) { return `${Math.floor(px)}px "Press Start 2P", Courier New`; }

  // Im Querformat liegt die Feldlänge waagerecht — sonst bliebe links und
  // rechts viel Bildschirm ungenutzt. Angegriffen wird dann nach rechts.
  function isLandscape() { return w / h > 1.15; }

  function pitchRect() {
    const top = h * 0.11;
    const availH = h - top - h * 0.03;
    const availW = w * 0.96;
    // Die Tore stehen HINTER der Torlinie. Rechnet man nur mit der Feldlänge,
    // ragen sie an beiden Enden aus dem Bild — genau das war zu sehen.
    const LAENGE = 1 + 2 * GOAL_DEPTH;
    // Der Rasen ist der Hintergrund des GANZEN Schirms, nicht nur die
    // markierte Fläche: Das Feld liegt darin wie auf einem Tipp-Kick-Platz.
    const rasen = { x: 0, y: 0, w, h };
    if (isLandscape()) {
      const s = Math.min(availW / LAENGE, availH / FIELD_W);  // Pixel je Feldlänge
      const pw = s, ph = s * FIELD_W;
      return { x: (w - pw) / 2, y: top + (availH - ph) / 2, w: pw, h: ph, s, rot: true, rasen };
    }
    const s = Math.min(availH / LAENGE, availW / FIELD_W);
    const pw = s * FIELD_W, ph = s;
    return { x: (w - pw) / 2, y: top + (availH - ph) / 2, w: pw, h: ph, s, rot: false, rasen };
  }

  // Feldeinheiten → Pixel.
  // Hochformat: y = 0 unten (eigenes Tor). Querformat: y = 0 links.
  function px(r, x, y) {
    return r.rot
      ? { X: r.x + y * r.s,           Y: r.y + x * r.s }
      : { X: r.x + x * r.s,           Y: r.y + (1 - y) * r.s };
  }
  // Rechteck aus zwei Feld-Eckpunkten, unabhängig von der Ausrichtung
  function fieldRect(r, x1, y1, x2, y2) {
    const a = px(r, x1, y1), b = px(r, x2, y2);
    return { x: Math.min(a.X, b.X), y: Math.min(a.Y, b.Y),
             w: Math.abs(a.X - b.X), h: Math.abs(a.Y - b.Y) };
  }
  // Bildschirmwinkel einer Feldrichtung
  function screenAngle(r, fx, fy) {
    return r.rot ? Math.atan2(fx, fy) : Math.atan2(-fy, fx);
  }

  // Ein Linienzug in Feldkoordinaten. Damit sehen alle Markierungen in beiden
  // Ausrichtungen gleich aus, und die Kreisbögen stimmen auch im Querformat.
  function feldzug(r, punkte, schliessen) {
    ctx.beginPath();
    punkte.forEach(([fx, fy], i) => {
      const p = px(r, fx, fy);
      if (i === 0) ctx.moveTo(p.X, p.Y); else ctx.lineTo(p.X, p.Y);
    });
    if (schliessen) ctx.closePath();
    ctx.stroke();
  }

  function feldbogen(r, cx, cy, rad, von, bis) {
    const n = 28, pts = [];
    for (let i = 0; i <= n; i++) {
      const a = von + (bis - von) * i / n;
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
    feldzug(r, pts, false);
  }

  function feldpunkt(r, fx, fy) {
    const p = px(r, fx, fy);
    ctx.beginPath(); ctx.arc(p.X, p.Y, Math.max(1.5, r.s * 0.005), 0, Math.PI * 2); ctx.fill();
  }

  // Das Mähmuster. Es läuft über den ganzen Rasen weiter, nicht nur über die
  // markierte Fläche — sonst hörte der Platz an der Aussenlinie sichtbar auf.
  // Die Bahnen hängen am Feld, nicht am Bildschirm: Anfang und Breite kommen
  // aus den Feldkoordinaten, gekachelt wird darüber hinaus in beide Richtungen.
  const BAHNEN = 8;                               // Bahnen je Feldlänge

  function belag() { return rasenFarbe ? rasenFarbe() : [TURF, TURF_ALT]; }

  // Alle Bahnindizes, die den Rasen auf einer Bildschirmachse überdecken
  function bahnen(g, achse, null0, richt, breit) {
    const a = ((achse === 'x' ? g.x : g.y) - null0) * richt / breit;
    const b = ((achse === 'x' ? g.x + g.w : g.y + g.h) - null0) * richt / breit;
    const liste = [];
    for (let i = Math.floor(Math.min(a, b)) - 1; i <= Math.ceil(Math.max(a, b)) + 1; i++) liste.push(i);
    return liste;
  }
  function bahnKante(null0, richt, breit, i) {
    const a = null0 + richt * i * breit, b = a + richt * breit;
    return [Math.min(a, b), Math.max(a, b)];
  }

  function rasenMuster(r, g) {
    const art = rasenArt ? rasenArt() : 'keins';
    if (art !== 'quer') return;

    const breit = r.s / BAHNEN;
    const ecke = px(r, 0, 0);
    // Achse der Feldlänge auf dem Schirm — im Hochformat zeigt sie nach oben
    const lA = r.rot ? 'x' : 'y', l0 = r.rot ? ecke.X : ecke.Y, lR = r.rot ? 1 : -1;

    // Bahnen entlang der Feldlänge — quer zur Spielrichtung, wie gemäht wird.
    ctx.fillStyle = belag()[1];
    const achse = lA, null0 = l0, richt = lR;
    for (const i of bahnen(g, achse, null0, richt, breit)) {
      if (((i % 2) + 2) % 2 !== 0) continue;
      const [p0, p1] = bahnKante(null0, richt, breit, i);
      if (achse === 'x') ctx.fillRect(p0, g.y, p1 - p0, g.h);
      else               ctx.fillRect(g.x, p0, g.w, p1 - p0);
    }
  }

  function drawPitch(r) {
    const g = r.rasen || r;
    ctx.fillStyle = belag()[0];
    ctx.fillRect(g.x, g.y, g.w, g.h);
    rasenMuster(r, g);

    // Alle Markierungen in derselben Farbe und Stärke. Vorher waren sie
    // halbdurchsichtig, und wo zwei Linien aufeinanderlagen — Strafraum auf
    // Torlinie — sah es doppelt so kräftig aus.
    ctx.strokeStyle = belag()[2] || LINE;
    ctx.fillStyle = belag()[2] || LINE;
    ctx.lineWidth = Math.max(1.5, r.s * 0.0042);
    ctx.lineCap = 'butt';

    // Aussenlinien
    feldzug(r, [[0, 0], [FIELD_W, 0], [FIELD_W, 1], [0, 1]], true);

    // Mittellinie, Anstosskreis und Anstosspunkt
    feldzug(r, [[0, 0.5], [FIELD_W, 0.5]], false);
    feldbogen(r, FIELD_W / 2, 0.5, MITTE_R, 0, Math.PI * 2);
    feldpunkt(r, FIELD_W / 2, 0.5);

    const mitte = FIELD_W / 2;
    // Auf einem Kaefigplatz gibt es keinen Strafraum. Vorgabe ist deshalb ein
    // schlichter Bogen vor jedem Tor — mehr steht auf keiner Strasse. Kein
    // vorzeitiges `return` an dieser Stelle: Danach kommen noch die Tore.
    const komplett = (linienArt ? linienArt() : 'strasse') === 'komplett';
    if (!komplett) for (const gy of [0, 1]) {
      const grund = gy === 0 ? 0 : Math.PI;
      feldbogen(r, mitte, gy, STRASSE_R, grund, grund + Math.PI);
    }

    if (komplett) for (const gy of [0, 1]) {
      const ein = gy === 0 ? 1 : -1;              // ins Feld hinein
      // Strafraum — nur die drei Seiten im Feld. Die vierte liegt auf der
      // Torlinie und wird von den Aussenlinien schon gezogen.
      const bx = BOX_W / 2, bd = gy === 0 ? BOX_D : 1 - BOX_D;
      feldzug(r, [[mitte - bx, gy], [mitte - bx, bd], [mitte + bx, bd], [mitte + bx, gy]], false);

      // Torraum, der kleine Kasten davor
      const tx = GOAL_AREA_W / 2, td = gy === 0 ? GOAL_AREA_D : 1 - GOAL_AREA_D;
      feldzug(r, [[mitte - tx, gy], [mitte - tx, td], [mitte + tx, td], [mitte + tx, gy]], false);

      // Elfmeterpunkt und Teilkreis. Gezeichnet wird nur der Bogen ausserhalb
      // des Strafraums — genau so sieht ein echter Strafraum aus.
      const py = gy === 0 ? ELFMETER : 1 - ELFMETER;
      feldpunkt(r, mitte, py);
      const dy = Math.abs(bd - py);               // Abstand Punkt zur Strafraumkante
      if (TEILKREIS_R > dy) {
        const halb = Math.acos(dy / TEILKREIS_R);
        const grund = gy === 0 ? Math.PI / 2 : -Math.PI / 2;
        feldbogen(r, mitte, py, TEILKREIS_R, grund - halb, grund + halb);
      }

      // Eckviertel
      for (const ex of [0, FIELD_W]) {
        const sx = ex === 0 ? 1 : -1;
        const a0 = ex === 0 ? (gy === 0 ? 0 : -Math.PI / 2) : (gy === 0 ? Math.PI / 2 : Math.PI);
        feldbogen(r, ex, gy, ECK_R, a0, a0 + Math.PI / 2 * (sx * ein > 0 ? 1 : 1));
      }
    }

    // Tore mit Netz. Vorher war es nur ein weisser Balken hinter der Linie —
    // der Ball schien dadurch durch das Tor hindurchzufliegen, weil dahinter
    // nichts war, in dem er liegenbleiben konnte.
    const tiefe = GOAL_DEPTH * r.s;
    for (const gy of [0, 1]) {
      const g = fieldRect(r, FIELD_W / 2 - GOAL_W / 2, gy, FIELD_W / 2 + GOAL_W / 2, gy);
      // Das Tor steht HINTER der Torlinie, also aus dem Feld heraus. Im
      // Hochformat zeigt die Feldlaenge nach oben (y = 0 unten), das eigene
      // Tor liegt unten und geht nach unten weg — andersherum als im
      // Querformat. Vorher standen im Hochformat beide Tore im Feld.
      const kx = r.rot ? (gy === 0 ? g.x - tiefe : g.x) : g.x;
      const ky = r.rot ? g.y : (gy === 0 ? g.y : g.y - tiefe);
      const kw = r.rot ? tiefe : g.w;
      const kh = r.rot ? g.h : tiefe;

      // Kein Kasten hinter der Linie: Der Rasen laeuft durch, im Tor haengt
      // nur das Netz. Eine dunkle Fuellung sah aus wie ein Loch im Platz.

      // Netz: feines Raster, quer und laengs
      ctx.save();
      ctx.beginPath(); ctx.rect(kx, ky, kw, kh); ctx.clip();
      ctx.strokeStyle = belag()[2] || LINE;
      ctx.lineWidth = Math.max(1, r.s * 0.0014);
      const masche = r.s * 0.0105;
      ctx.beginPath();
      for (let x = kx + masche; x < kx + kw; x += masche) { ctx.moveTo(x, ky); ctx.lineTo(x, ky + kh); }
      for (let y = ky + masche; y < ky + kh; y += masche) { ctx.moveTo(kx, y); ctx.lineTo(kx + kw, y); }
      ctx.stroke();
      ctx.restore();

      // Pfosten und Latte — bewusst NUR die drei hinteren Kanten. Die vordere
      // liegt genau auf der Torlinie, die das Spielfeld ohnehin schon zieht;
      // gestrichelt man sie mit, liegen zwei Striche uebereinander und der
      // vordere Balken sieht dicker aus als die anderen.
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = Math.max(2, r.s * 0.005);
      ctx.beginPath();
      if (r.rot) {
        // Querformat: Tor liegt links (gy 0) oder rechts (gy 1)
        const vorn = gy === 0 ? kx + kw : kx;
        const hinten = gy === 0 ? kx : kx + kw;
        ctx.moveTo(vorn, ky); ctx.lineTo(hinten, ky);
        ctx.lineTo(hinten, ky + kh); ctx.lineTo(vorn, ky + kh);
      } else {
        const vorn = gy === 0 ? ky : ky + kh;
        const hinten = gy === 0 ? ky + kh : ky;
        ctx.moveTo(kx, vorn); ctx.lineTo(kx, hinten);
        ctx.lineTo(kx + kw, hinten); ctx.lineTo(kx + kw, vorn);
      }
      ctx.stroke();
    }
  }

  // Spieler sind Scheiben, die sich verformen. Die Dehnung ist flächentreu —
  // längs k, quer 1/k, die Scheibe wird also gedehnt, nicht größer.
  // Gestreckt wird schnell und dann gehalten, solange die Aktion dauert;
  // gefedert wird nur beim Aufprall. Eine Schwingung während der Bewegung
  // sah aus wie Gummi statt wie ein Spieler, der sich lang macht.

  function drawPlayers(r) {
    const b = state.ball;
    for (const p of state.players) {
      const q = px(r, p.x, p.y);
      const rad = PLAYER_R * r.s;
      // Markierung für die menschlich gesteuerten Spieler
      if (p.ctrl) {
        ctx.strokeStyle = P_COL[p.ctrl - 1];
        ctx.lineWidth = Math.max(2, r.s * 0.005);
        ctx.beginPath(); ctx.arc(q.X, q.Y, rad * 1.55, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = kit(p.team);
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = Math.max(1, r.s * 0.002);

      // Hechtsprung, Liegen und Grätsche: dieselbe Scheibe, nur verformt.
      // Bildschirm-y ist gespiegelt, deshalb der Winkel über screenAngle.
      let k = 1, ang = 0, hoehe = 0, gross = 1, vor = 0;   // Spieler bleiben immer deckend
      if (p.dive > 0) {
        // Der Torwart hechtet nur so weit wie noetig, seine Flugzeit steht
        // deshalb am Spieler und ist nicht mehr fest.
        const dauer = p.diveMax || (p.role === 'GK' ? GK_DIVE_TIME : DIVE_TIME);
        // Ein Sprung, keine Gummiwurst: schnell strecken und gestreckt
        // bleiben, solange man fliegt. Die federnde Schwingung gehört zum
        // Aufprall, nicht in die Luft.
        const t = 1 - p.dive / dauer;
        k = 1 + 0.85 * Math.min(1, t / 0.18);
        // In der Draufsicht liest sich „abheben" nur über Höhe: der Körper
        // löst sich vom Schatten, wird kurz größer und kommt wieder herunter.
        const bogen = Math.sin(Math.PI * t);
        hoehe = bogen;
        gross = 1 + bogen * 0.12;
        ang = screenAngle(r, p.dx, p.dy);
      } else if (p.down > 0) {
        // Aufschlag, liegen, aufstehen — in einem Zug
        const u = 1 - p.down / (p.downMax || DIVE_DOWN);
        const auf = Math.max(0, Math.min(1, (u - 0.72) / 0.28));
        const weich = auf * auf * (3 - 2 * auf);            // sanft aufstehen
        k = 1 + 0.38 * (1 - weich) + 0.35 * Math.exp(-14 * u);   // erster Klatscher
        ang = screenAngle(r, p.fx, p.fy);
      } else if (p.poke > 0) {
        // Angriff: ein kurzer Stich nach vorn — schnell raus, schnell zurück.
        // Bewusst deutlicher als der erste Entwurf (0,3), sonst sieht man im
        // Spiel gar nicht, dass überhaupt etwas passiert ist.
        const t = 1 - p.poke / POKE_TIME;
        const stich = Math.sin(Math.PI * Math.pow(t, 0.7));
        k = 1 + 0.42 * stich;
        vor = stich * rad * 0.5;                 // kurzer Versatz in Blickrichtung
        ang = screenAngle(r, p.fx, p.fy);
      } else if (p.tackle > 0) {
        // Wie beim Sprung: schnell lang machen und lang bleiben, solange man
        // rutscht. Eine federnde Schwingung sah aus wie Gummi statt wie ein
        // Spieler, der sich streckt.
        k = 1 + 0.6 * Math.min(1, (1 - p.tackle / TACKLE_TIME) / 0.14);
        ang = screenAngle(r, p.fx, p.fy);
      }

      if (Math.abs(k - 1) > 0.01) {
        // Gezeichnet wird als Ellipse mit zwei Radien, NICHT als Kreis unter
        // ctx.scale: Eine ungleiche Skalierung verzerrt auch die Kontur, und
        // an den Spitzen entstand dadurch eine dicke Zunge. Mit ctx.ellipse
        // bleibt die Linienstärke überall gleich.
        const koerper = (X, Y, sk, a, lw) => {
          ctx.globalAlpha = a;   // nur der Schatten ist durchscheinend
          ctx.beginPath();
          ctx.ellipse(X, Y, rad * k * sk, rad / k * sk, ang, 0, Math.PI * 2);
          ctx.fill();
          if (lw) { ctx.lineWidth = lw; ctx.stroke(); }
          ctx.globalAlpha = 1;
        };
        if (hoehe > 0.02) {
          // Schatten bleibt am Boden und wird kleiner, je höher der Sprung
          const merk = ctx.fillStyle;
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          koerper(q.X, q.Y, 1 - hoehe * 0.25, 0.5, 0);
          ctx.fillStyle = merk;
        }
        koerper(q.X + Math.cos(ang) * vor, q.Y + Math.sin(ang) * vor - hoehe * rad * 1.5,
                gross, 1, Math.max(1, r.s * 0.002));
      } else {
        ctx.beginPath(); ctx.arc(q.X, q.Y, rad, 0, Math.PI * 2); ctx.fill();
        ctx.stroke();
      }
    }
    const bq = px(r, b.x, b.y);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff'; ctx.shadowBlur = r.s * 0.02;
    ctx.beginPath(); ctx.arc(bq.X, bq.Y, BALL_R * r.s, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Torpause: entweder das Standbild mit Anzeige oder die Wiederholung.
  // Gezeichnet wird beides mit dem normalen Spielfeld — für die Wiederholung
  // werden die Positionen kurz aus dem Mitschnitt gesetzt und danach wieder
  // zurückgeschrieben.
  // Deutlich als Wiederholung gekennzeichnet — sonst hält man die Zeitlupe
  // für das laufende Spiel und wundert sich, warum nichts reagiert.
  function drawReplayBadge(text) {
    // Unten mittig, im selben Gelb wie TOR!, und pulsierend: So ist auf den
    // ersten Blick klar, dass das eine Wiederholung ist und nicht das
    // laufende Spiel.
    ctx.save();
    ctx.font = font(uni() * 0.032);
    ctx.shadowColor = '#ffb300';
    ctx.shadowBlur = uni() * 0.03;
    ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(state.t * 4));
    ctx.fillStyle = '#ffd54f';
    ctx.fillText(text, w / 2, h * 0.93);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Einen Frame aus einem Mitschnitt zeichnen. Der echte Spielzustand wird
  // dafür kurz überschrieben und danach zurückgeschrieben — danach wird ja
  // weitergespielt.
  // Text auf eine Höchstbreite einpassen, statt ihn aus dem Panel laufen zu
  // lassen. „DEUTSCHLAND 3 : 2 NIEDERLANDE" war deutlich breiter als die Box.
  // Menüpunkte behalten ihre Schriftgröße und brechen stattdessen um.
  // Vorher schrumpfte „WEITER ZUM VIERTELFINALE", und dann standen in einer
  // Liste Punkte in zwei verschiedenen Größen untereinander.
  function umbruch(text, maxW, size) {
    ctx.font = font(size);
    if (ctx.measureText(text).width <= maxW) return [text];
    const worte = text.split(' ');
    const zeilen = [];
    let z = '';
    for (const wort of worte) {
      const probe = z ? z + ' ' + wort : wort;
      if (z && ctx.measureText(probe).width > maxW) { zeilen.push(z); z = wort; }
      else z = probe;
    }
    if (z) zeilen.push(z);
    return zeilen;
  }

  // Groesse, bei der ALLE uebergebenen Texte in die Breite passen. Wird sie
  // je Text einzeln gesucht, stehen zwei Mannschaftsnamen nebeneinander in
  // verschiedenen Groessen da — das sieht aus wie ein Fehler.
  function gleicheGroesse(texte, maxW, size) {
    let s2 = size;
    for (let i = 0; i < 12 && s2 > size * 0.45; i++) {
      ctx.font = font(s2);
      if (texte.every(t => ctx.measureText(t).width <= maxW)) break;
      s2 *= 0.92;
    }
    return s2;
  }

  function fitText(text, x, y, maxW, size) {
    let s2 = size;
    for (let i = 0; i < 10 && s2 > size * 0.45; i++) {
      ctx.font = font(s2);
      if (ctx.measureText(text).width <= maxW) break;
      s2 *= 0.92;
    }
    ctx.fillText(text, x, y);
  }

  function zeichneMitschnitt(r, frames, pos) {
    const f = frames[Math.max(0, Math.min(frames.length - 1, Math.floor(pos)))];
    const sicherung = state.players.map(p => MITSCHNITT_FELDER.map(k => p[k]));
    const ball = [state.ball.x, state.ball.y];
    state.players.forEach((p, k) => MITSCHNITT_FELDER.forEach((k2, i) => { p[k2] = f.p[k][i]; }));
    state.ball.x = f.bx; state.ball.y = f.by;
    drawPitch(r); drawPlayers(r);
    state.players.forEach((p, k) => MITSCHNITT_FELDER.forEach((k2, i) => { p[k2] = sicherung[k][i]; }));
    state.ball.x = ball[0]; state.ball.y = ball[1];
  }

  // Eine Box für alle Tafeln: Tor, Halbzeit, Ergebnis, Weltmeister, Aus.
  // Vorher gab es zwei Sorten nebeneinander — eine abgerundete Box mit Menü
  // und eine Vollbild-Abdunklung, bei der ein Klick irgendwohin bestätigte.
  // Gleiches Aussehen, gleiche Bedienung, und nichts lässt sich mehr
  // versehentlich wegklicken.
  function zeichneBox(titel, punkte, o = {}) {
    const pw = Math.min(w * (o.breit || 0.78), uni() * (o.breit || 0.7));
    const innenBreite = pw * 0.86;
    // Erst umbrechen, dann die Höhe bestimmen: Ein Punkt, der auf zwei Zeilen
    // geht, braucht auch zwei Zeilen Platz — sonst stösst er unten heraus.
    const groesse = uni() * 0.03;
    const bloecke = punkte.map(it => umbruch(it, innenBreite * 0.82, groesse));
    const zeilen = bloecke.reduce((n, b) => n + b.length, 0) || 1;
    const ph = uni() * (0.28 + 0.1 * zeilen + (o.extra || 0));
    const x0 = w / 2 - pw / 2, y0 = h / 2 - ph / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = uni() * 0.05;
    ctx.fillStyle = 'rgba(6,9,14,0.96)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x0, y0, pw, ph, uni() * 0.022);
    else ctx.rect(x0, y0, pw, ph);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = Math.max(1, uni() * 0.002);
    ctx.stroke();

    const innen = pw * 0.86;
    ctx.save();
    if (o.gelb !== false) { ctx.shadowColor = '#ffb300'; ctx.shadowBlur = uni() * 0.045; }
    ctx.fillStyle = o.gelb === false ? '#fff' : '#ffd54f';
    fitText(titel, w / 2, y0 + ph * (o.titelY || 0.3), innen, uni() * (o.gross || 0.055));
    ctx.shadowBlur = 0;
    ctx.restore();

    if (o.zwischen) o.zwischen(x0, y0, pw, ph, innen);

    // Alle Punkte in derselben Größe; zu lange brechen um.
    const zeilenAbstand = ph * 0.085;
    const erste = o.punkteY || (zeilen > 1 ? 0.58 : 0.66);

    let yLauf = y0 + ph * erste;
    bloecke.forEach((zeilenText, i) => {
      const sel = i === state.menuSel;
      const hoehe = zeilenText.length * zeilenAbstand;
      const mitte = yLauf + (zeilenText.length - 1) * zeilenAbstand / 2;

      if (!o.gesperrt) hotspot(x0 + pw * 0.08, yLauf - ph * 0.075, pw * 0.84, hoehe + ph * 0.04, i);
      ctx.globalAlpha = o.punkteAlpha === undefined ? 1 : o.punkteAlpha;
      ctx.fillStyle = sel ? '#ffd54f' : '#666';
      ctx.font = font(groesse);
      let breit = 0;
      zeilenText.forEach((zt, k) => {
        breit = Math.max(breit, ctx.measureText(zt).width);
        ctx.fillText(zt, w / 2, yLauf + k * zeilenAbstand);
      });

      // Die Klammern stehen neben dem ganzen Block, nicht in jeder Zeile
      if (sel) {
        const rand = breit / 2 + groesse * 1.1;
        ctx.fillText('>', w / 2 - rand, mitte);
        ctx.fillText('<', w / 2 + rand, mitte);
      }

      // Läuft eine Uhr, erscheint unter dem Punkt, den sie auslösen wird, ein
      // schrumpfender Balken. Ohne ihn passiert nach ein paar Sekunden
      // scheinbar aus dem Nichts etwas.
      if (o.timer && o.timer.idx === i && o.timer.rest > 0) {
        const voll = innen * 0.45;
        const bw = voll * Math.max(0, Math.min(1, o.timer.rest));
        const by = yLauf + (zeilenText.length - 1) * zeilenAbstand + ph * 0.05;
        const dick = Math.max(2, uni() * 0.005);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(w / 2 - voll / 2, by, voll, dick);
        ctx.fillStyle = sel ? '#ffd54f' : '#4fc3f7';
        ctx.fillRect(w / 2 - bw / 2, by, bw, dick);
      }
      ctx.globalAlpha = 1;
      yLauf += hoehe + ph * 0.085;
    });

    return { x0, y0, pw, ph, innen };
  }

  function drawGoal() {
    const r = pitchRect();
    if (state.replay) {
      zeichneMitschnitt(r, state.hist, state.replay.i);
      drawHud();
      drawReplayBadge('WIEDERHOLUNG');
      return;
    }
    drawPitch(r); drawPlayers(r); drawHud();

    // Die Box fährt ein und nimmt in den ersten GOAL_LOCK Sekunden keine
    // Eingabe an — erst lesen, dann drücken. Der Schriftzug schlägt beim Tor
    // einmal ein und atmet danach leise weiter.
    const seit = Math.max(0, GOAL_WAIT - state.goalWait);
    const einzug = 1 - Math.pow(1 - Math.min(1, seit / 0.32), 3);
    const menuAuf = clamp((seit - GOAL_LOCK) / 0.3, 0, 1);
    const pop = 1 + 0.5 * Math.exp(-5 * seit) * Math.cos(seit * 20);
    const puls = 1 + 0.025 * Math.sin(state.t * 4);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(0.86 + 0.14 * einzug, 0.86 + 0.14 * einzug);
    ctx.translate(-w / 2, -h / 2);
    ctx.globalAlpha = einzug;
    const punkte = goalItems();
    const autoIdx = state.autoReplay > 0 ? punkte.indexOf('WIEDERHOLUNG') : punkte.indexOf('WEITER');
    const rest = state.autoReplay > 0 ? state.autoReplay / AUTO_REPLAY : state.goalWait / GOAL_WAIT;
    zeichneBox('TOR!', punkte, {
      timer: menuAuf > 0 && autoIdx >= 0 ? { idx: autoIdx, rest } : null,
      gross: 0.105 * pop * puls,
      titelY: 0.33,
      punkteAlpha: menuAuf,
      gesperrt: menuAuf <= 0,
      extra: 0.06,
    });
    ctx.restore();
  }

  function drawHud() {
    const me = TEAMS[state.myTeam], foe = TEAMS[state.foeTeam];
    const y = h * 0.055;
    ctx.font = font(uni() * 0.032);

    // Flaggen neben die Namen. Breite wird gemessen, damit sie unabhängig
    // von der Namenslänge direkt anliegen.
    const fh = uni() * 0.030, fw = fh * 1.55, gap = uni() * 0.014;

    // Die Flaggen auf die optische Mitte der Buchstaben setzen, nicht auf die
    // Grundlinie — die liegt unter dem Text, dadurch sähen sie zu tief aus.
    // actualBoundingBox* liefert die echte Höhe der gesetzten Glyphen.
    const flagTop = (txt) => {
      const m = ctx.measureText(txt);
      const asc  = m.actualBoundingBoxAscent  ?? uni() * 0.032 * 0.72;
      const desc = m.actualBoundingBoxDescent ?? 0;
      return y - (asc - desc) / 2 - fh / 2;
    };

    ctx.fillStyle = kit(0);
    ctx.textAlign = 'right';
    ctx.fillText(me.n, w * 0.36, y);
    const wl = ctx.measureText(me.n).width;
    drawFlagIcon(w * 0.36 - wl - gap - fw, flagTop(me.n), fw, fh, me.f);

    ctx.fillStyle = kit(1);
    ctx.textAlign = 'left';
    ctx.fillText(foe.n, w * 0.64, y);
    const wr = ctx.measureText(foe.n).width;
    drawFlagIcon(w * 0.64 + wr + gap, flagTop(foe.n), fw, fh, foe.f);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = font(uni() * 0.044);
    ctx.fillText(`${state.score[0]} : ${state.score[1]}`, w / 2, y + h * 0.008);

    const t = Math.max(0, Math.ceil(state.clock));
    ctx.font = font(uni() * 0.026);
    ctx.fillStyle = state.golden ? '#ffb300' : '#8a9bb0';
    // Nach dem Abpfiff hat die laufende Uhr nichts mehr zu sagen — dort stand
    // sonst weiter „1. HALBZEIT 2:56", obwohl das Spiel vorbei war.
    const vorbei = ['result', 'champion', 'out'].includes(state.phase);
    ctx.fillText(
      vorbei ? (state.mode === 'cup' ? ROUNDS[state.round] : 'ABPFIFF')
      : state.golden ? 'GOLDEN GOAL'
      : `${state.half}. HALBZEIT  ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`,
      w / 2, h * 0.092);
  }

  function drawMatch() {
    ctx.save();
    if (state.shake > 0) {
      const m = state.shake * h * 0.014;
      ctx.translate((Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m);
    }
    const r = pitchRect();
    drawPitch(r);
    drawPlayers(r);
    ctx.restore();
    drawHud();

    if (state.msgTimer > 0 && state.msg) {
      ctx.fillStyle = '#ffb300';
      ctx.shadowColor = '#ffb300'; ctx.shadowBlur = w * 0.02;
      ctx.font = font(uni() * 0.085);
      ctx.textAlign = 'center';
      ctx.fillText(state.msg, w / 2, h * 0.5);
      ctx.shadowBlur = 0;
    }
  }


  function hint(text) {
    ctx.fillStyle = '#555';
    ctx.font = font(uni() * 0.026);
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, h * 0.9);
  }

  function drawModeMenu() {
    ctx.fillStyle = '#fff';
    ctx.font = font(uni() * 0.075);
    ctx.fillText('STREET SOCCER', w / 2, h * 0.24);

    // Ohne Unterzeilen: Die Punkte erklären sich selbst, jede weitere Zeile
    // überlädt nur den ersten Bildschirm.
    const items = ['WORLD CUP', 'FREUNDSCHAFTSSPIEL', 'EINSTELLUNGEN'];
    items.forEach((it, i) => {
      const sel = i === state.menuSel;
      const y = h * (0.46 + i * 0.12);
      hotspot(w * 0.15, y - h * 0.04, w * 0.7, h * 0.085, i);
      ctx.fillStyle = sel ? '#4fc3f7' : '#555';
      ctx.font = font(uni() * 0.045);
      ctx.fillText(sel ? `> ${it} <` : it, w / 2, y);
    });
  }

  function drawCountMenu() {
    ctx.fillStyle = '#fff';
    ctx.font = font(uni() * 0.045);
    ctx.fillText('WIE VIELE SPIELER?', w / 2, h * 0.16);

    const items = ['1 SPIELER', '2 SPIELER'];
    items.forEach((it, i) => {
      const sel = i === state.menuSel;
      const y = h * (0.42 + i * 0.12);
      hotspot(w * 0.15, y - h * 0.04, w * 0.7, h * 0.085, i);
      ctx.fillStyle = sel ? '#4fc3f7' : '#555';
      ctx.font = font(uni() * 0.042);
      ctx.fillText(sel ? `> ${it} <` : it, w / 2, y);
    });
  }

  function drawSideMenu() {
    ctx.fillStyle = '#fff';
    ctx.font = font(uni() * 0.045);
    ctx.fillText('ZU ZWEIT SPIELEN', w / 2, h * 0.16);

    const items = ['MITEINANDER', 'GEGENEINANDER'];
    items.forEach((it, i) => {
      const sel = i === state.menuSel;
      const y = h * (0.42 + i * 0.12);
      hotspot(w * 0.15, y - h * 0.04, w * 0.7, h * 0.085, i);
      ctx.fillStyle = sel ? '#4fc3f7' : '#555';
      ctx.font = font(uni() * 0.042);
      ctx.fillText(sel ? `> ${it} <` : it, w / 2, y);
    });
  }


  function drawTeamMenu() {
    const pick = state.phase === 'team';
    ctx.fillStyle = '#fff';
    ctx.font = font(uni() * 0.045);
    const versus = state.teamMode === 'versus';
    ctx.fillText(pick ? (versus ? 'SPIELER 1 · MANNSCHAFT' : 'DEINE MANNSCHAFT')
                      : (versus ? 'SPIELER 2 · MANNSCHAFT' : 'GEGNER WÄHLEN'),
                 w / 2, h * 0.13);

    const cols = 4, rows = 4;
    const cw = w * 0.17, ch = h * 0.13;
    const x0 = w / 2 - (cols * cw) / 2, y0 = h * 0.2;
    TEAMS.forEach((t, i) => {
      const cx = x0 + (i % cols) * cw, cy = y0 + Math.floor(i / cols) * ch;
      hotspot(cx, cy, cw, ch, i);
      const sel = i === state.menuSel;
      const own = !pick && i === state.myTeam;

      ctx.globalAlpha = own ? 0.22 : sel ? 1 : 0.62;
      drawFlagIcon(cx + cw * 0.22, cy + ch * 0.12, cw * 0.56, ch * 0.42, t.f);
      ctx.globalAlpha = 1;
      if (sel) {
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = Math.max(2, w * 0.0022);
        ctx.strokeRect(cx + cw * 0.06, cy + ch * 0.06, cw * 0.88, ch * 0.78);
      }
      ctx.fillStyle = own ? '#333' : sel ? '#fff' : '#777';
      ctx.font = font(uni() * 0.017);
      ctx.fillText(t.n, cx + cw / 2, cy + ch * 0.72);
    });
    // Kein Tastenspickzettel — A und B bedeuten überall dasselbe. Stehen
    // bleibt nur, was man nicht erraten kann: wer gerade dran ist.
    if (!pick && versus) hint('SPIELER 2 WÄHLT');
  }

  function drawIntro() {
    const titel = state.mode === 'cup' ? ROUNDS[state.round] : 'FREUNDSCHAFTSSPIEL';
    zeichneBox(titel, ['ANPFIFF'], {
      gelb: false,
      gross: 0.04,
      titelY: 0.16,
      timer: { idx: 0, rest: state.tafel / AUTO_INTRO },
      extra: 0.24,
      zwischen: (x0, y0, pw, ph, innen) => {
        // Die beiden Mannschaften stehen NEBENeinander, mit dem Gegen dazwischen
        // — untereinander las es sich wie eine Liste, nicht wie eine Paarung.
        // Namen bewusst neutral: Die Zuordnung macht die Flagge, nicht die Farbe.
        const fw = uni() * 0.075, fh = fw * 0.62;
        const spalte = innen * 0.40;                 // Platz je Mannschaft
        const mitteY = y0 + ph * 0.52;
        // Beide Namen in derselben Groesse setzen, nach dem laengeren gewaehlt
        const gr = gleicheGroesse([TEAMS[state.myTeam].n, TEAMS[state.foeTeam].n],
                                  spalte, uni() * 0.030);
        const seite = (team, x) => {
          drawFlagIcon(x - fw / 2, mitteY - fh - uni() * 0.05, fw, fh, TEAMS[team].f);
          ctx.fillStyle = '#fff';
          ctx.font = font(gr);
          ctx.fillText(TEAMS[team].n, x, mitteY);
        };
        seite(state.myTeam,  w / 2 - innen * 0.29);
        seite(state.foeTeam, w / 2 + innen * 0.29);
        ctx.fillStyle = '#555';
        fitText('GEGEN', w / 2, mitteY, innen * 0.16, uni() * 0.02);
        if (state.teamMode === 'versus') {
          ctx.fillStyle = P_COL[1];
          fitText(state.mode === 'cup'
            ? 'SPIELER 2 STEUERT DEN AUSGELOSTEN GEGNER'
            : 'SPIELER 2 STEUERT DIE RECHTE MANNSCHAFT',
            w / 2, y0 + ph * 0.70, innen, uni() * 0.02);
        }
      },
      punkteY: 0.86,
    });
  }

  function drawHalf() {
    zeichneBox('HALBZEIT', ['WEITER'], { timer: { idx: 0, rest: state.tafel / AUTO_HALF } });
  }

  // Wie heißt der Ausgang, und wie heißt der Weg hinaus? „WEITER" stand
  // vorher als Ergebnis da und las sich wie eine Taste — gemeint war, dass
  // man eine Runde weiterkommt.
  // Im Turnier ist der Ausgang ein Paar: gewonnen oder ausgeschieden.
  // „EINE RUNDE WEITER" beschrieb die Folge statt des Ergebnisses.
  function resultTitel() {
    if (state.mode === 'friendly') return state.lastResult;
    return state.lastResult === 'WEITER' ? 'GEWONNEN' : 'AUSGESCHIEDEN';
  }
  function resultWeiter() {
    if (state.mode === 'friendly') return 'NÄCHSTES SPIEL';
    if (state.lastResult !== 'WEITER') return 'ZURÜCK ZUM MENÜ';
    return `WEITER ZUM ${ROUNDS[state.round + 1] || 'FINALE'}`;
  }
  // Bewusst eine Funktionsdeklaration: Sie wird auch von der Eingabe und vom
  // Update gerufen, die weit vor dieser Stelle stehen. Ein `const` hier wäre
  // zum Zeitpunkt des Aufrufs noch nicht initialisiert.
  function resultItems() {
    return state.highlights.length ? ['HÖHEPUNKTE', resultWeiter()] : [resultWeiter()];
  }

  function drawResult() {
    const r = pitchRect();
    if (state.hl) {                             // Höhepunkte laufen
      const szene = state.highlights[state.hl.clip];
      zeichneMitschnitt(r, szene.frames, state.hl.i);
      drawHud();
      drawReplayBadge(`HÖHEPUNKTE   ${state.hl.clip + 1} / ${state.highlights.length}`);
      return;
    }
    // Spielstand und Mannschaften stehen schon in der Kopfzeile — hier
    // wiederholt machten sie die Box nur voll.
    const rItems = resultItems();
    zeichneBox(resultTitel(), rItems, {
      timer: { idx: rItems.length - 1, rest: state.tafel / AUTO_RESULT },
    });
  }

  function drawChampion() {
    zeichneBox('WELTMEISTER!', ['NEUE WELTMEISTERSCHAFT'], {
      timer: { idx: 0, rest: state.tafel / AUTO_RESULT },
      extra: 0.04,
      zwischen: (x0, y0, pw, ph, innen) => {
        ctx.fillStyle = '#8a9bb0';
        fitText(`${TEAMS[state.myTeam].n} · ${ROUNDS.length} SIEGE`,
                w / 2, y0 + ph * 0.45, innen, uni() * 0.026);
      },
    });
  }

  function drawOut() {
    zeichneBox('AUSGESCHIEDEN', ['NEUE WELTMEISTERSCHAFT'], {
      timer: { idx: 0, rest: state.tafel / AUTO_RESULT },
      extra: 0.04,
      zwischen: (x0, y0, pw, ph, innen) => {
        ctx.fillStyle = '#8a9bb0';
        fitText(ROUNDS[state.round], w / 2, y0 + ph * 0.45, innen, uni() * 0.026);
      },
    });
  }

  return {
    resize(nw, nh) { w = nw; h = nh; },
    isLandscape, drawMatch, drawGoal, drawHalf, drawResult, drawChampion, drawOut,
    drawIntro, drawModeMenu, drawCountMenu, drawSideMenu, drawTeamMenu,
    resultItems,
  };
};
