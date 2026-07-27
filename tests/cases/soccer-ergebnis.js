// Die Ergebnistafel ist ein Menü wie die Toranzeige: Höhepunkte ansehen oder
// weiter. Und der Ausgang muss lesbar sein — „WEITER" stand vorher als Ergebnis
// da und las sich wie eine Taste.
const { session, pad } = require('../harness');

function bisErgebnis() {
  const s = session('soccer', { setting: k => (k === 'duration' ? 60 : k === 'switch' ? 'ballgewinn' : k === 'replay' ? 'an' : 'normal') });
  const S = s.state;
  for (let i = 0; i < 4; i++) s.tap();
  for (let f = 0; f < 60 * 900; f++) {
    s.step();
    if (S.phase === 'goal') { S.goalLock = 0; s.send(pad({ a: true })); s.send(pad()); }
    if (S.phase === 'result') return { s, S };
  }
  return null;
}

module.exports = {
  name: 'Fussball · Ergebnistafel mit Hoehepunkten',
  slow: true,
  run() {
    const t = bisErgebnis();
    if (!t) return { ok: false, info: 'keine Ergebnistafel erreicht' };
    const { s, S } = t;
    const fehler = [];

    const texte = s.screen();
    if (/\bWEITER\b/.test(texte) && S.mode === 'cup' && S.lastResult === 'WEITER' && !/RUNDE WEITER|FINALE/.test(texte))
      fehler.push('der Ausgang heisst weiterhin blank WEITER');

    if (S.highlights.length) {
      if (!/HÖHEPUNKTE/.test(texte)) fehler.push('kein Menuepunkt HÖHEPUNKTE trotz Toren');
      // Ersten Punkt waehlen und die Schau starten
      S.menuSel = 0;
      s.send(pad({ a: true })); s.send(pad()); s.step();
      if (!S.hl) fehler.push('HÖHEPUNKTE startet nicht');
      else {
        const vorher = S.hl.i;
        for (let f = 0; f < 10; f++) s.step();
        if (!(S.hl && S.hl.i > vorher)) fehler.push('die Schau laeuft nicht weiter');
        // Abbrechen muss zurueck auf die Tafel fuehren
        s.send(pad({ a: true })); s.send(pad()); s.step();
        if (S.hl) fehler.push('die Schau laesst sich nicht abbrechen');
        if (S.phase !== 'result') fehler.push('Abbrechen verlaesst die Ergebnistafel');
      }
    }

    // Der letzte Punkt fuehrt hinaus
    S.menuSel = S.highlights.length ? 1 : 0;
    s.send(pad({ a: true })); s.send(pad()); s.step();
    if (S.phase === 'result') fehler.push('der letzte Menuepunkt fuehrt nicht weiter');

    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : `${S.highlights.length} Torszenen aufbewahrt, Schau laeuft und laesst sich abbrechen, Ausgang lesbar`
    };
  }
};
