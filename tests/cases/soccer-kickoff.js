// Der Anstosspass muss die eigene Mannschaft erreichen — auch dann, wenn der
// Mensch dabei stillsteht, wegläuft oder mitläuft.
const { session, stick, pad } = require('../harness');

function kickoff(verhalten) {
  const s = session('soccer', { conns: new Map([[1, 'keyboard']]) });
  for (let i = 0; i < 4; i++) s.tap();
  const S = s.state;
  for (let f = 0; f < 60 * 12; f++) {
    if (verhalten === 'weg')  s.send(stick(0, -1));
    if (verhalten === 'mit')  s.send(stick(0, 1));
    if (verhalten === 'steht') s.send(pad());
    s.step();
    const o = S.ball.owner;
    if (o && S.kickoffTo === null && S.restart <= 0) return o.team;
  }
  return null;
}

module.exports = {
  name: 'Fussball · Anstoss erreicht die eigene Mannschaft',
  run() {
    const zeilen = [];
    let ok = true;
    for (const v of ['nur-ki', 'steht', 'weg', 'mit']) {
      let eigene = 0, n = 15;
      for (let i = 0; i < n; i++) if (kickoff(v) === 0) eigene++;
      if (eigene < n) ok = false;
      zeilen.push(`${v}:${eigene}/${n}`);
    }
    return { ok, info: zeilen.join('  ') };
  }
};
