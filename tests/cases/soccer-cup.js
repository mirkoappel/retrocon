// WM-Kurve: Der Gegner muss von Runde zu Runde staerker werden — und der
// Aufschlag darf nur fuer ihn gelten, nicht fuer die eigene Mannschaft.
const { session, playMatch } = require('../harness');

module.exports = {
  name: 'Fussball · WM wird von Runde zu Runde schwerer',
  slow: true,
  run() {
    const N = 10;
    const diff = [];
    for (const runde of [0, 3]) {
      let a = 0, b = 0;
      for (let i = 0; i < N; i++) {
        const s = session('soccer');
        const S = s.state;
        const r = playMatch(s, () => { S.mode = 'cup'; S.round = runde; });
        if (!Array.isArray(r)) return { ok: false, info: `Runde ${runde}: ${r}` };
        a += r[0]; b += r[1];
      }
      diff.push((a - b) / N);
    }
    // Im Finale muss der Gegner deutlich besser dastehen als im Achtelfinale
    return {
      ok: diff[1] < diff[0] - 0.3,
      info: `Tordifferenz der Bezugsmannschaft: Achtelfinale ${diff[0].toFixed(1)}, Finale ${diff[1].toFixed(1)} (muss um mindestens 0,3 fallen)`
    };
  }
};
