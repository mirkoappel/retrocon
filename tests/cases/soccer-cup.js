// WM-Kurve: Der Gegner muss von Runde zu Runde staerker werden — und der
// Aufschlag darf nur fuer ihn gelten, nicht fuer die eigene Mannschaft.
//
// Die Stichprobe war zu klein. Gemessen ueber 500 Spiele je Runde liegt die
// Tordifferenz bei -0,10 / -0,59 / -0,94 / -1,13, der Abfall also bei
// 1,04 +/- 0,15 — bei einer Streuung von 2,4 Toren je Spiel. Mit den
// frueheren 10 Spielen je Runde streute die Messung um 1,08, und die
// Schranke 0,3 lag mitten im Rauschen: Der Test fiel in 6 von 12 Laeufen
// durch, ohne dass sich am Spiel etwas geaendert hatte.
const { session, playMatch } = require('../harness');

const N = 150;          // Spiele je Runde — Streuung der Messung damit 0,28
const SCHRANKE = 0.15;  // 3,1 Sigma Abstand zum gemessenen Abfall von 1,04

function tordifferenz(runde) {
  let summe = 0, gezaehlt = 0;
  for (let i = 0; i < N; i++) {
    const s = session('soccer');
    const S = s.state;
    const r = playMatch(s, () => { S.mode = 'cup'; S.round = runde; });
    if (!Array.isArray(r)) return { fehler: `Runde ${runde}: ${r}` };
    summe += r[0] - r[1]; gezaehlt++;
  }
  return { mittel: summe / gezaehlt };
}

module.exports = {
  name: 'Fussball · WM wird von Runde zu Runde schwerer',
  slow: true,
  run() {
    const mittel = [];
    for (const runde of [0, 3]) {
      const r = tordifferenz(runde);
      if (r.fehler) return { ok: false, info: r.fehler };
      mittel.push(r.mittel);
    }
    const abfall = mittel[0] - mittel[1];
    return {
      ok: abfall > SCHRANKE,
      info: `Tordifferenz der Bezugsmannschaft ueber je ${N} Spiele: Achtelfinale ${mittel[0].toFixed(2)}, `
          + `Finale ${mittel[1].toFixed(2)} — Abfall ${abfall.toFixed(2)} (muss ueber ${SCHRANKE} liegen)`
    };
  }
};
