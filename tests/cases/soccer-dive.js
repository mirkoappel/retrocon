// Hechtsprung: muss vorkommen, aber die Ausnahme bleiben — und er nimmt den
// Ball nie an, sondern fälscht ihn ab.
const { session, playMatch } = require('../harness');

module.exports = {
  name: 'Fussball · Hechtsprung vor dem Tor',
  run() {
    let spruenge = 0, angenommen = 0, imSprungGefuehrt = 0, spiele = 2;
    for (let m = 0; m < spiele; m++) {
      const s = session('soccer');
      const S = s.state;
      const warDive = new Map();
      playMatch(s, () => {
        for (const p of S.players) {
          const vorher = warDive.get(p) || 0;
          if (p.dive > 0 && vorher <= 0) spruenge++;
          warDive.set(p, p.dive);
          // Wer springt oder liegt, darf den Ball nicht führen
          if ((p.dive > 0 || p.down > 0) && S.ball.owner === p) imSprungGefuehrt++;
        }
      });
    }
    const proSpiel = spruenge / spiele;
    return {
      ok: proSpiel >= 2 && proSpiel <= 35 && imSprungGefuehrt === 0,
      info: `${proSpiel.toFixed(1)} Spruenge pro Spiel (erlaubt 2–35), ` +
            `Ball im Sprung gefuehrt: ${imSprungGefuehrt} (muss 0 sein)`
    };
  }
};
