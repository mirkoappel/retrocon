// Nach einem Tor bleibt die Anzeige stehen, bis jemand weiterdrückt — und man
// kann die Szene in Zeitlupe wiederholen. Vorher war das Tor nach 2,4 s vorbei.
const { session, pad } = require('../harness');

function bisZumTor() {
  const s = session('soccer');
  for (let i = 0; i < 4; i++) s.tap();
  const S = s.state;
  for (let f = 0; f < 60 * 400; f++) {
    s.step();
    if (S.phase === 'goal') return { s, S, f };
    if (S.phase !== 'play') return null;      // Halbzeit vor dem ersten Tor
  }
  return null;
}

module.exports = {
  name: 'Fussball · Torpause mit Wiederholung',
  run() {
    let treffer = null;
    for (let versuch = 0; versuch < 6 && !treffer; versuch++) treffer = bisZumTor();
    if (!treffer) return { ok: false, info: 'in sechs Anläufen kein Tor erreicht' };
    const { s, S } = treffer;
    const fehler = [];

    // Die Anzeige muss stehen bleiben, deutlich länger als die alten 2,4 s
    for (let f = 0; f < 60 * 6; f++) s.step();
    if (S.phase !== 'goal') fehler.push('Anzeige verschwindet schon nach 6 s von selbst');

    // B startet die Wiederholung
    s.send(pad({ b: true })); s.send(pad());
    if (!S.replay) fehler.push('B startet keine Wiederholung');
    else {
      const vorher = S.replay.i;
      for (let f = 0; f < 10; f++) s.step();
      if (!(S.replay && S.replay.i > vorher)) fehler.push('Wiederholung läuft nicht weiter');
    }

    // A führt zurück ins Spiel
    for (let f = 0; f < 60 * 12; f++) s.step();      // Wiederholung auslaufen lassen
    if (S.phase === 'goal') { s.send(pad({ a: true })); s.send(pad()); s.step(); }
    if (S.phase !== 'play') fehler.push(`nach A ist die Phase ${S.phase}, erwartet play`);

    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : 'Anzeige bleibt stehen, B zeigt die Zeitlupe, A pfeift wieder an'
    };
  }
};
