// Nach einem Tor bleibt die Anzeige stehen. Drückt niemand, läuft die
// Wiederholung nach AUTO_REPLAY von selbst an und pfeift danach direkt an.
// Selbst ausgewählt kehrt sie in die Anzeige zurück.
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

    // ── Niemand drückt: von selbst, danach direkt weiter ──
    const a = tor(undefined);
    if (!a) return { ok: false, info: 'in sechs Anlaeufen kein Tor erreicht' };
    {
      const { s, S } = a;
      for (let f = 0; f < 60 * 3; f++) s.step();
      if (S.replay) fehler.push('Wiederholung startet zu frueh');
      if (S.phase !== 'goal') fehler.push('Torpause haelt nicht');

      for (let f = 0; f < 60 * 4; f++) { s.step(); if (S.replay) break; }
      if (!S.replay) fehler.push('Wiederholung startet nicht von selbst');

      for (let f = 0; f < 60 * 12; f++) { s.step(); if (S.phase === 'play') break; }
      if (S.phase !== 'play') fehler.push(`nach der automatischen Wiederholung ist die Phase ${S.phase}, erwartet play`);
    }

    // ── Selbst ausgewählt: zurück in die Anzeige ──
    const b = tor(undefined);
    if (!b) fehler.push('kein zweites Tor erreicht');
    else {
      const { s, S } = b;
      // WEITER ist vorgewaehlt, die Wiederholung steht darueber
      if (S.menuSel !== 1) fehler.push(`vorgewaehlt ist ${S.menuSel}, erwartet WEITER (1)`);
      s.send(pad({ dpad: { up: true } })); s.send(pad());
      if (S.menuSel !== 0) fehler.push(`Blaettern landet auf ${S.menuSel}, erwartet WIEDERHOLUNG (0)`);
      s.send(pad({ a: true })); s.send(pad());
      if (!S.replay) fehler.push('Auswahl startet keine Wiederholung');
      for (let f = 0; f < 60 * 12; f++) { s.step(); if (!S.replay) break; }
      if (S.phase !== 'goal') fehler.push('nach der selbst gewaehlten Wiederholung geht es ungefragt weiter');
      s.send(pad({ a: true })); s.send(pad()); s.step();
      if (S.phase !== 'play') fehler.push(`nach WEITER ist die Phase ${S.phase}, erwartet play`);
    }

    // ── Abgeschaltet: keine Wiederholung, auch nicht von selbst ──
    const c = tor(k => (k === 'replay' ? 'aus' : k === 'duration' ? 180 : k === 'switch' ? 'ballgewinn' : 'normal'));
    if (!c) fehler.push('mit abgeschalteter Wiederholung kein Tor erreicht');
    else {
      const { s, S } = c;
      for (let f = 0; f < 60 * 8; f++) s.step();
      if (S.replay) fehler.push('abgeschaltet, laeuft aber trotzdem');
      if (S.phase !== 'goal') fehler.push('Torpause haelt nicht');
    }

    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : 'laeuft nach 5 s von selbst an und pfeift danach direkt an; selbst gewaehlt kehrt sie in die Anzeige zurueck; abschaltbar'
    };
  }
};
