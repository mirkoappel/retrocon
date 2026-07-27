// Nach einem Tor bleibt die Anzeige stehen, die Wiederholung startet von selbst
// und lässt sich abbrechen. Vorher war ein Tor nach 2,4 s vorbei.
const { session, pad } = require('../harness');

function bisZumTor(einstellung) {
  const s = session('soccer', { setting: einstellung });
  for (let i = 0; i < 4; i++) s.tap();
  const S = s.state;
  for (let f = 0; f < 60 * 400; f++) {
    s.step();
    if (S.phase === 'goal') return { s, S };
    if (S.phase !== 'play') return null;
  }
  return null;
}

function tor(einstellung) {
  for (let versuch = 0; versuch < 6; versuch++) {
    const t = bisZumTor(einstellung);
    if (t) return t;
  }
  return null;
}

module.exports = {
  name: 'Fussball · Torpause mit Wiederholung',
  run() {
    const fehler = [];

    // ── Mit Wiederholung (Vorgabe) ──
    const a = tor(undefined);
    if (!a) return { ok: false, info: 'in sechs Anlaeufen kein Tor erreicht' };
    {
      const { s, S } = a;
      // Sie startet von selbst, aber nicht sofort — TOR! soll erst stehen
      s.step();
      if (S.replay) fehler.push('Wiederholung startet ohne Vorlauf');
      for (let f = 0; f < 60 * 2; f++) s.step();
      if (!S.replay) fehler.push('Wiederholung startet nicht von selbst');

      // Abbrechen
      s.send(pad({ a: true })); s.send(pad()); s.step();
      if (S.replay) fehler.push('Wiederholung laesst sich nicht abbrechen');
      if (S.phase !== 'goal') fehler.push('Abbrechen verlaesst die Torpause');

      // Danach ist das Menue bedienbar: zweiter Punkt startet sie erneut
      s.send(pad({ dpad: { down: true } })); s.send(pad());
      if (S.menuSel !== 1) fehler.push(`Blaettern landet auf ${S.menuSel}, erwartet 1`);
      s.send(pad({ a: true })); s.send(pad());
      if (!S.replay) fehler.push('Auswahl startet keine Wiederholung');
      s.send(pad({ a: true })); s.send(pad()); s.step();

      // WEITER pfeift wieder an
      S.menuSel = 0;
      s.send(pad({ a: true })); s.send(pad()); s.step();
      if (S.phase !== 'play') fehler.push(`nach WEITER ist die Phase ${S.phase}, erwartet play`);
    }

    // ── Abgeschaltet ──
    const b = tor(k => (k === 'replay' ? 'aus' : k === 'duration' ? 180 : k === 'switch' ? 'ballgewinn' : 'normal'));
    if (!b) fehler.push('mit abgeschalteter Wiederholung kein Tor erreicht');
    else {
      const { s, S } = b;
      for (let f = 0; f < 60 * 3; f++) s.step();
      if (S.replay) fehler.push('abgeschaltet, laeuft aber trotzdem');
      if (S.phase !== 'goal') fehler.push('Torpause haelt nicht');
    }

    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : 'startet nach Vorlauf von selbst, abbrechbar, erneut aufrufbar, WEITER pfeift an, abschaltbar'
    };
  }
};
