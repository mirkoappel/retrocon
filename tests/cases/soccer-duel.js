// Ballabnahme von hinten: moeglich, aber nicht selbstverstaendlich.
// Untergrenze, damit sie nicht wieder unmoeglich wird (war einmal 0/120),
// Obergrenze, damit sie sich nicht zu leicht anfuehlt.
const { session } = require('../harness');

function chase(gap) {
  const s = session('soccer');
  for (let i = 0; i < 4; i++) s.tap();
  const S = s.state;
  const att = S.players.find(p => p.team === 0 && p.role !== 'GK');
  const def = S.players.find(p => p.team === 1 && p.role !== 'GK');
  const park = () => { for (const p of S.players) if (p !== att && p !== def) { p.x = 0.05; p.y = p.team === 0 ? 0.02 : 0.98; } };
  park();
  att.x = 0.29; att.y = 0.35; def.x = 0.29; def.y = 0.35 - gap;
  S.ball.x = att.x; S.ball.y = att.y + 0.03; S.ball.vx = 0; S.ball.vy = 0; S.ball.owner = att;
  S.kickoffTo = null; S.kickoffToT = 0; S.kickoffLock = 0; S.restart = 0;
  for (let f = 0; f < 300; f++) {
    park(); s.step();
    if (S.ball.owner === def) return true;
    if (S.ball.owner !== att || att.y > 0.9) return false;
  }
  return false;
}

module.exports = {
  name: 'Fussball · Zweikampf von hinten',
  run() {
    let won = 0, n = 0;
    const zeilen = [];
    for (const gap of [0.05, 0.08, 0.12]) {
      let w = 0;
      for (let i = 0; i < 20; i++) if (chase(gap)) w++;
      won += w; n += 20;
      zeilen.push(`${gap.toFixed(2)}:${w}/20`);
    }
    const quote = won / n;
    return {
      ok: quote >= 0.05 && quote <= 0.35,
      info: `${zeilen.join('  ')}  =  ${(100 * quote).toFixed(0)} % (erlaubt 5–35 %)`
    };
  }
};
