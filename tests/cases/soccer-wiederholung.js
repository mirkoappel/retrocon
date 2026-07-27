// Die Wiederholung muss auch die Verformung mitschneiden. Ohne sie blieb ein
// Spieler, der beim Tor gerade grätschte, die ganze Zeitlupe über ein Oval —
// die Verformung kam aus dem laufenden Spiel, und das steht in der Torpause
// still. Und das Zeichnen der Wiederholung darf den echten Zustand nicht
// verändern, denn danach wird ja weitergespielt.
const { session } = require('../harness');

const FELDER = ['x', 'y', 'fx', 'fy', 'dive', 'down', 'downMax', 'tackle', 'poke', 'dx', 'dy', 'ctrl'];

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
        : `${S.hist.length} Frames mit je ${FELDER.length} Werten pro Spieler, ${bilder.size} Verformungsbilder, Zeichnen ohne Nebenwirkung`
    };
  }
};
