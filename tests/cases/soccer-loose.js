// Kein toter Ball: Der Ball darf nicht herrenlos liegenbleiben.
const { session, playMatch } = require('../harness');

module.exports = {
  name: 'Fussball · keine toten Baelle',
  run() {
    let still = 0, frames = 0, lauf = 0, laengste = 0;
    for (let m = 0; m < 2; m++) {
      const s = session('soccer');
      const S = s.state;
      playMatch(s, () => {
        if (S.phase !== 'play' || S.restart > 0) return;
        frames++;
        const b = S.ball;
        if (!b.owner && Math.hypot(b.vx, b.vy) < 0.012) {
          still++; lauf++; laengste = Math.max(laengste, lauf);
        } else lauf = 0;
      });
    }
    const anteil = 100 * still / frames;
    return {
      ok: anteil < 1.5 && laengste / 60 < 1.5,
      info: `${anteil.toFixed(1)} % der Spielzeit still (Grenze 1,5 %), laengster Stillstand ${(laengste / 60).toFixed(1)} s`
    };
  }
};
