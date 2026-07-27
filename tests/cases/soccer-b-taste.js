// Die B-Taste ohne Ball: sofort angreifen, gehalten grätschen. Der Fall prüft
// den vollständigen Weg über ein Tastatur-Gamepad, wie ihn die Konsole baut —
// im Spiel ließ sich beides zunächst nicht auslösen, weil der Angriff erst
// beim Loslassen kam.
const { session } = require('../harness');

const taste = b => ({
  type: 'keyboard',
  joystick: { x: 0, y: 0, active: false },
  dpad: { up: false, down: false, left: false, right: false },
  a: false, b, select: false, start: false
});

function lauf(muster) {
  const s = session('soccer', { conns: new Map([[1, 'keyboard']]) });
  for (let i = 0; i < 4; i++) s.tap();
  const S = s.state;
  s.uebernehmen();
  const me = S.players.find(p => p.ctrl);
  if (!me) throw new Error('kein gesteuerter Spieler');
  const gegner = S.players.find(p => p.team !== me.team && p.role !== 'GK');
  // Ball zum Gegner — mit eigenem Ball ist B der Pass, nicht der Zweikampf
  S.restart = 0; S.kickoffTo = null; S.kickoffToT = 0; S.kickoffLock = 0;
  S.ball.owner = gegner; S.ball.x = gegner.x; S.ball.y = gegner.y + 0.03;
  me.x = 0.29; me.y = 0.5;

  let angriffe = 0, graetschen = 0, pw = 0, tw = 0, ersteReaktion = -1;
  for (let f = 0; f < 80; f++) {
    s.send(taste(muster(f)));
    s.step();
    if (me.poke > 0 && pw <= 0) { angriffe++; if (ersteReaktion < 0) ersteReaktion = f - 5; }
    pw = me.poke;
    if (me.tackle > 0 && tw <= 0) { graetschen++; if (ersteReaktion < 0) ersteReaktion = f - 5; }
    tw = me.tackle;
  }
  return { angriffe, graetschen, ersteReaktion };
}

module.exports = {
  name: 'Fussball · B-Taste: antippen greift an, halten graetscht',
  run() {
    const kurz    = lauf(f => f >= 5 && f < 8);
    const halten  = lauf(f => f >= 5 && f < 30);
    const doppelt = lauf(f => (f >= 5 && f < 8) || (f >= 20 && f < 23));
    const fehler = [];
    if (kurz.angriffe !== 1 || kurz.graetschen !== 0) fehler.push(`antippen: ${kurz.angriffe} Angriffe, ${kurz.graetschen} Graetschen`);
    if (halten.angriffe !== 1 || halten.graetschen !== 1) fehler.push(`halten: ${halten.angriffe} Angriffe, ${halten.graetschen} Graetschen`);
    if (doppelt.angriffe !== 2) fehler.push(`zweimal antippen: nur ${doppelt.angriffe} Angriffe`);
    // Der Angriff muss sofort kommen, nicht erst beim Loslassen
    if (kurz.ersteReaktion > 1) fehler.push(`Reaktion erst nach ${kurz.ersteReaktion} Frames`);
    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : `antippen 1 Angriff, halten 1 Angriff + 1 Graetsche, zweimal antippen 2 Angriffe, Reaktion im selben Frame`
    };
  }
};
