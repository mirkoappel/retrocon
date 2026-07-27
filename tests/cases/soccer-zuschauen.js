// Zusehen ist kein Modus, sondern das, was übrig bleibt, wenn man die Finger
// stillhält: Nach der Mannschaftswahl läuft alles von selbst weiter — Anpfiff,
// Tore, Halbzeit, Abpfiff und das nächste Spiel.
const { session, pad } = require('../harness');

// Vorgabe ist die KI: Nach dem Anpfiff steuert niemand einen Spieler, bis
// wirklich eine Taste kommt. Vorher trug `startMatch` beide Slots als aktiv
// ein — man steuerte ab Anpfiff und gab erst nach IDLE_TAKEOVER ab, obwohl
// man nie etwas angeruehrt hatte.
function uebernahme(fehler) {
  const s = session('soccer', { conns: new Map([[1, 'keyboard']]) });
  for (let i = 0; i < 4; i++) s.tap();
  const S = s.state;
  for (let f = 0; f < 60 * 3; f++) s.step();
  if (S.players.some(p => p.ctrl)) fehler.push('beim Anpfiff steuert schon jemand');

  s.uebernehmen();
  if (!S.players.some(p => p.ctrl === 1)) fehler.push('ein Tastendruck holt den Slot nicht ans Steuer');

  // Und wieder abgeben, wenn nichts mehr kommt
  for (let f = 0; f < 60 * 12; f++) s.step();
  if (S.players.some(p => p.ctrl)) fehler.push('die KI uebernimmt nach Untaetigkeit nicht zurueck');
}

module.exports = {
  name: 'Fussball · laeuft ohne Tastendruck weiter',
  slow: true,
  run() {
    const fehler = [];
    uebernahme(fehler);
    for (const [was, waehlen] of [
      ['World Cup', s => { for (let i = 0; i < 4; i++) s.tap(); }],
      ['Freundschaftsspiel', s => {
        s.send(pad({ dpad: { down: true } })); s.send(pad());
        for (let i = 0; i < 4; i++) s.tap();
      }],
    ]) {
      const s = session('soccer', { conns: new Map([[1, 'keyboard']]) });
      const S = s.state;
      waehlen(s);

      const phasen = new Set();
      let anschluss = 0, letzte = S.phase, gleich = 0, vor = S.phase, haenger = 0;
      for (let f = 0; f < 60 * 1600; f++) {
        s.step();
        phasen.add(S.phase);
        // Nach einem Sieg geht es result -> intro weiter, nach dem Ausscheiden
        // result -> out -> intro (neues Turnier von vorn). Beides zaehlt.
        if (S.phase === 'intro' && ['result', 'out'].includes(letzte)) anschluss++;
        letzte = S.phase;
        if (S.phase === vor) gleich++; else { gleich = 0; vor = S.phase; }
        // Tafeln duerfen nicht haengen; play und goal duerfen dauern
        if (gleich > 60 * 40 && !['play', 'goal'].includes(S.phase)) haenger++;
      }
      if (anschluss < 1) fehler.push(`${was}: kein Anschlussspiel ohne Eingabe`);
      if (haenger > 0) fehler.push(`${was}: eine Tafel bleibt haengen (${vor})`);
      for (const p of ['play', 'half', 'result']) if (!phasen.has(p)) fehler.push(`${was}: Phase ${p} nie erreicht`);
      // Wer nichts drueckt, gibt seinen Spieler an die KI ab
      if (S.players.some(p => p.ctrl)) fehler.push(`${was}: ein Spieler wird noch gesteuert`);
    }
    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : 'die KI faengt an, ein Tastendruck uebernimmt, Untaetigkeit gibt zurueck; '
          + 'World Cup und Freundschaftsspiel laufen ueber Stunden ohne einen Tastendruck weiter'
    };
  }
};
