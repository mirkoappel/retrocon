// Mit Ball um die Kurve: Der Ball muss der Laufrichtung folgen, sonst
// verliert man ihn bei jeder Richtungsaenderung.
const { session, stick, pad } = require('../harness');

function trial(turnDeg, push) {
  const s = session('soccer', { conns: new Map([[1, 'keyboard']]) });
  for (let i = 0; i < 4; i++) s.tap();
  const S = s.state;
  const me = S.players.find(p => p.ctrl);
  if (!me) throw new Error('kein gesteuerter Spieler');
  const park = () => { for (const p of S.players) if (p !== me) { p.x = 0.29; p.y = p.team === 0 ? 0.03 : 0.97; } };
  park();
  me.x = 0.29; me.y = 0.35;
  S.ball.x = me.x; S.ball.y = me.y + 0.03; S.ball.vx = 0; S.ball.vy = 0; S.ball.owner = me;
  S.kickoffTo = null; S.kickoffToT = 0; S.kickoffLock = 0; S.restart = 0;
  let ang = Math.PI / 2;
  for (let f = 0; f < 120; f++) {
    if (f === 40) ang += turnDeg * Math.PI / 180;
    s.send(stick(Math.cos(ang) * push, Math.sin(ang) * push));
    park();
    s.step();
    if (S.ball.owner !== me) return false;
  }
  return true;
}

module.exports = {
  name: 'Fussball · Ball bleibt in der Kurve am Fuss',
  run() {
    const zeilen = [];
    let schlechteste = 1;
    for (const push of [0.35, 1.0]) {
      for (const deg of [45, 90, 180]) {
        let kept = 0;
        for (let i = 0; i < 10; i++) if (trial(deg, push)) kept++;
        schlechteste = Math.min(schlechteste, kept / 10);
        zeilen.push(`${push.toFixed(2)}/${deg}°:${kept}/10`);
      }
    }
    return { ok: schlechteste >= 0.8, info: zeilen.join('  ') };
  }
};
