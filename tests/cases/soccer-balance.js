// Torquote und Seitenverteilung. Statistisch, deshalb nur im vollen Lauf.
const { session, playMatch } = require('../harness');

module.exports = {
  name: 'Fussball · Torquote und Seitenverteilung',
  slow: true,
  run() {
    const N = 16;
    let a = 0, b = 0;
    for (let i = 0; i < N; i++) {
      const r = playMatch(session('soccer'));
      if (!Array.isArray(r)) return { ok: false, info: `Spiel ${i + 1}: ${r}` };
      a += r[0]; b += r[1];
    }
    const tore = (a + b) / N;
    // Seitenverteilung: erlaubt ist Rauschen, nicht mehr als 2,5 Sigma
    const ges = a + b, sigma = Math.sqrt(ges * 0.25);
    const abw = Math.abs(a - b) / 2 / sigma;
    return {
      ok: tore >= 1.5 && tore <= 5.0 && abw < 2.5,
      info: `${(a / N).toFixed(1)} : ${(b / N).toFixed(1)} — ${tore.toFixed(1)} Tore/Spiel (erlaubt 1,5–5,0), Seitenabweichung ${abw.toFixed(1)} Sigma`
    };
  }
};
