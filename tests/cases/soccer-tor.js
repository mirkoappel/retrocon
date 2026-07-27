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

    // ── Nicht versehentlich wegklickbar ──
    const w = tor(undefined);
    if (!w) fehler.push('kein Tor fuer die Sperrpruefung erreicht');
    else {
      const { s, S } = w;
      // Im Spielfieber weiterdruecken: darf die Anzeige nicht wegklicken
      for (let f = 0; f < 40; f++) { s.send(pad({ a: true })); s.send(pad()); s.step(); }
      if (S.phase !== 'goal') fehler.push('Toranzeige laesst sich sofort wegdruecken');
      // Nach Ablauf der Sperre zaehlt der Druck wieder — vorgewaehlt ist die
      // Wiederholung, also muss sie anlaufen
      for (let f = 0; f < 90; f++) s.step();
      s.send(pad({ dpad: { down: true } })); s.send(pad());
      s.send(pad({ a: true })); s.send(pad()); s.step();
      if (!S.replay) fehler.push('nach der Sperre reagiert die Anzeige nicht');
    }

    // ── Selbst ausgewählt: zurück in die Anzeige ──
    const b = tor(undefined);
    if (!b) fehler.push('kein zweites Tor erreicht');
    else {
      const { s, S } = b;
      for (let f = 0; f < 90; f++) s.step();          // Sperre abwarten
      // Der vorgewaehlte Punkt steht oben: WEITER auf 0, Wiederholung darunter
      if (S.menuSel !== 0) fehler.push(`vorgewaehlt ist ${S.menuSel}, erwartet WEITER (0)`);
      s.send(pad({ dpad: { down: true } })); s.send(pad());
      if (S.menuSel !== 1) fehler.push(`Blaettern landet auf ${S.menuSel}, erwartet WIEDERHOLUNG (1)`);
      s.send(pad({ a: true })); s.send(pad());
      if (!S.replay) fehler.push('Auswahl startet keine Wiederholung');
      for (let f = 0; f < 60 * 12; f++) { s.step(); if (!S.replay) break; }
      if (S.phase !== 'goal') fehler.push('nach der selbst gewaehlten Wiederholung geht es ungefragt weiter');
      if (S.menuSel !== 0) fehler.push('nach der Wiederholung steht die Auswahl nicht auf WEITER');
      s.send(pad({ a: true })); s.send(pad()); s.step();
      if (S.phase !== 'play') fehler.push(`nach WEITER ist die Phase ${S.phase}, erwartet play`);
    }

    // ── Selbst gewaehlt: danach keine automatische hinterher ──
    const d = tor(undefined);
    if (!d) fehler.push('kein drittes Tor erreicht');
    else {
      const { s, S } = d;
      for (let f = 0; f < 90; f++) s.step();          // Sperre abwarten
      s.send(pad({ dpad: { down: true } })); s.send(pad());
      s.send(pad({ a: true })); s.send(pad());        // Wiederholung waehlen
      if (!S.replay) fehler.push('Auswahl startet keine Wiederholung');
      for (let f = 0; f < 60 * 12; f++) { s.step(); if (!S.replay) break; }
      let zweite = false;
      for (let f = 0; f < 60 * 11; f++) { s.step(); if (S.replay) { zweite = true; break; } if (S.phase !== 'goal') break; }
      if (zweite) fehler.push('nach der selbst gewaehlten kommt noch eine automatische');
    }

    // ── Der Anstoss darf nicht hinter einer Wiederholung liegen ──
    const e = tor(undefined);
    if (!e) fehler.push('kein viertes Tor erreicht');
    else {
      const { s, S } = e;
      const beim = { x: S.ball.x, y: S.ball.y };
      let frueh = 0;
      for (let f = 0; f < 60 * 20; f++) {
        if (S.phase !== 'goal') break;
        s.step();
        // Solange die Torpause laeuft, steht der Ball noch dort, wo das Tor fiel
        if (S.phase === 'goal' && S.restart > 0) frueh++;
      }
      if (frueh > 0) fehler.push('der Anstoss laeuft schon waehrend der Torpause');
      if (Math.abs(beim.x - S.ball.x) > 0.5) fehler.push('der Ball wird zu frueh versetzt');
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
        : 'nicht wegklickbar in den ersten 1,2 s; laeuft nach 5 s von selbst an und pfeift danach direkt an; selbst gewaehlt keine automatische hinterher; der Anstoss beginnt erst danach; abschaltbar'
    };
  }
};
