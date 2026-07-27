// Die Wiederholung muss auch die Verformung mitschneiden. Ohne sie blieb ein
// Spieler, der beim Tor gerade grätschte, die ganze Zeitlupe über ein Oval —
// die Verformung kam aus dem laufenden Spiel, und das steht in der Torpause
// still. Und das Zeichnen der Wiederholung darf den echten Zustand nicht
// verändern, denn danach wird ja weitergespielt.
const { session } = require('../harness');

// Die Feldliste wird aus dem Spiel gelesen, nicht hier gepflegt. Eine eigene
// Kopie ging schon einmal auseinander: Als `diveMax` im Spiel dazukam, schrieb
// der Mitschnitt weiter zwoelf Werte, gelesen wurde aber nach dreizehn Namen —
// in der Wiederholung war ab `dive` alles um eine Stelle verschoben, und der
// Test merkte nichts, weil er seine alte Liste gegen sich selbst prueste.
const fs = require('fs');
const path = require('path');
const quelle = fs.readFileSync(path.join(__dirname, '../../games/soccer/soccer.js'), 'utf8');
const roh = quelle.match(/const MITSCHNITT_FELDER = \[([\s\S]*?)\];/);
if (!roh) throw new Error('MITSCHNITT_FELDER nicht gefunden');
const FELDER = roh[1].match(/'([a-zA-Z]+)'/g).map(t => t.slice(1, -1));

module.exports = {
  name: 'Fussball · Wiederholung schneidet die Verformung mit',
  run() {
    let treffer = null;
    for (let versuch = 0; versuch < 8 && !treffer; versuch++) {
      const s = session('soccer');
      const S = s.state;
      for (let i = 0; i < 4; i++) s.tap();
      for (let f = 0; f < 60 * 400; f++) {
        s.step();
        if (S.phase === 'goal') { treffer = { s, S }; break; }
        if (S.phase !== 'play') break;
      }
    }
    if (!treffer) return { ok: false, info: 'in acht Anlaeufen kein Tor erreicht' };
    const { s, S } = treffer;
    const fehler = [];

    if (!S.hist.length) fehler.push('kein Mitschnitt vorhanden');
    else {
      const eintrag = S.hist[0].p[0];
      if (eintrag.length !== FELDER.length)
        fehler.push(`Mitschnitt hat ${eintrag.length} Werte je Spieler, erwartet ${FELDER.length}`);
    }

    // Verformung muss sich ueber den Mitschnitt hinweg aendern koennen
    const bilder = new Set(S.hist.map(f =>
      f.p.map(p => (p[4] > 0 ? 'H' : p[5] > 0 ? 'L' : p[7] > 0 ? 'G' : p[8] > 0 ? 'A' : '-')).join('')));
    if (bilder.size < 1) fehler.push('keine Verformungsbilder im Mitschnitt');

    // Der Mitschnitt muss IM NETZ enden, nicht auf der Torlinie. Er tat das
    // eine Zeit lang nicht: `verlaengereMitschnitt` rechnete mit der
    // Ballgeschwindigkeit, die `scoreGoal` ein paar Zeilen vorher auf null
    // gesetzt hatte — die angehaengten Frames lagen deshalb alle auf der Linie.
    const letzte = S.hist[S.hist.length - 1];
    const drin = letzte.by < 0.5 ? -letzte.by : letzte.by - 1;
    if (!(drin > 0.005)) {
      fehler.push(`der Mitschnitt endet bei y=${letzte.by.toFixed(4)}, also nicht hinter der Torlinie`);
    }
    // Und er muss sich dorthin bewegen, nicht dort erscheinen
    const wege = S.hist.slice(-20).map(f => f.by);
    if (Math.abs(wege[wege.length - 1] - wege[0]) < 0.004) {
      fehler.push('der Ball bewegt sich im Anhang nicht ins Netz');
    }

    // Zeichnen der Wiederholung darf den echten Zustand nicht anfassen
    S.replay = { i: 10, auto: false };
    const vorher = S.players.map(p => FELDER.map(k => p[k]));
    s.screen();
    const nachher = S.players.map(p => FELDER.map(k => p[k]));
    if (JSON.stringify(vorher) !== JSON.stringify(nachher))
      fehler.push('das Zeichnen der Wiederholung veraendert den Spielzustand');
    if (Math.abs(S.ball.x - S.hist[10].bx) < 1e-9 && Math.abs(S.ball.y - S.hist[10].by) < 1e-9)
      fehler.push('der Ball bleibt auf der Position aus dem Mitschnitt stehen');

    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : `${S.hist.length} Frames mit je ${FELDER.length} Werten pro Spieler, ${bilder.size} Verformungsbilder, `
          + `Ball ${(letzte.by < 0.5 ? -letzte.by : letzte.by - 1).toFixed(4)} hinter der Linie, Zeichnen ohne Nebenwirkung`
    };
  }
};
