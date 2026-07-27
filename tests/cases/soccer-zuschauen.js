// Zusehen wie im Fernsehen: Nach dem Menüpunkt ZUSCHAUEN darf kein einziger
// Tastendruck mehr nötig sein — Anpfiff, Tore, Halbzeit, Abpfiff und das
// nächste Spiel laufen von selbst.
const { session, pad } = require('../harness');

module.exports = {
  name: 'Fussball · Zuschauen laeuft ohne Tastendruck',
  slow: true,
  run() {
    const s = session('soccer', { conns: new Map([[1, 'keyboard']]) });
    const S = s.state;
    // Einmal auswählen — danach nichts mehr
    s.send(pad({ dpad: { down: true } })); s.send(pad());
    s.send(pad({ dpad: { down: true } })); s.send(pad());
    s.send(pad({ a: true })); s.send(pad());
    if (!S.watch) return { ok: false, info: 'ZUSCHAUEN startet nicht' };

    const phasen = new Set();
    let anschluss = 0, gesteuert = 0, letzte = S.phase, haenger = 0, vorPhase = S.phase, gleich = 0;
    for (let f = 0; f < 60 * 1500; f++) {
      s.step();
      phasen.add(S.phase);
      if (S.players.some(p => p.ctrl)) gesteuert++;
      if (S.phase === 'intro' && letzte === 'result') anschluss++;
      letzte = S.phase;
      // Hängt eine Tafel? play und goal dürfen lange dauern, Tafeln nicht
      if (S.phase === vorPhase) gleich++; else { gleich = 0; vorPhase = S.phase; }
      if (gleich > 60 * 40 && !['play', 'goal'].includes(S.phase)) haenger++;
    }
    const fehler = [];
    if (gesteuert > 0) fehler.push(`${gesteuert} Frames mit menschlicher Steuerung`);
    if (anschluss < 1) fehler.push('kein Anschlussspiel');
    if (haenger > 0) fehler.push('eine Tafel bleibt haengen');
    for (const p of ['play', 'half', 'result']) if (!phasen.has(p)) fehler.push(`Phase ${p} nie erreicht`);
    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : `${anschluss} Anschlussspiele in 25 Minuten, kein Tastendruck noetig, keine haengende Tafel`
    };
  }
};
