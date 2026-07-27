// Torhüter: Sie dürfen sich nicht im Gleichschritt bewegen, sie sollen
// herauskommen, und sie sollen hechten und dabei fangen.
const { session, playMatch } = require('../harness');

module.exports = {
  name: 'Fussball · Torhueter kommen heraus und hechten',
  slow: true,
  run() {
    let frames = 0, gleich = 0, raus = 0, spruenge = 0, faenge = 0;
    const spiele = 3;
    for (let m = 0; m < spiele; m++) {
      const s = session('soccer');
      const S = s.state;
      const war = new Map();
      playMatch(s, () => {
        if (S.phase !== 'play' || S.restart > 0) return;
        const gks = S.players.filter(p => p.role === 'GK');
        if (gks.length !== 2) return;
        frames++;
        // Gleichschritt: gleiche Seitenlage UND gleiche Tiefe
        const dx0 = gks[0].x - 0.29, dx1 = gks[1].x - 0.29;
        const dy0 = Math.abs(gks[0].y - 0.035), dy1 = Math.abs(gks[1].y - 0.965);
        if (Math.abs(dx0 - dx1) < 0.004 && Math.abs(dy0 - dy1) < 0.006) gleich++;
        for (const g of gks) {
          const line = g.team === 0 ? 0.035 : 0.965;
          if (Math.abs(g.y - line) > 0.02) raus++;
          const v = war.get(g) || 0;
          if (g.dive > 0 && v <= 0) spruenge++;
          if (v > 0 && g.dive <= 0 && S.ball.owner === g) faenge++;
          war.set(g, g.dive);
        }
      });
    }
    const pct = v => 100 * v / frames;
    const fehler = [];
    if (pct(gleich) > 25) fehler.push(`Gleichschritt ${pct(gleich).toFixed(1)} % (frueher 88,5 %)`);
    if (pct(raus) / 2 < 5) fehler.push(`nur ${(pct(raus) / 2).toFixed(1)} % vor der Grundstellung`);
    if (spruenge / spiele < 2) fehler.push(`nur ${(spruenge / spiele).toFixed(1)} Hechtspruenge pro Spiel`);
    if (faenge < 1) fehler.push('kein einziger Ball im Sprung gefangen');
    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : `Gleichschritt ${pct(gleich).toFixed(1)} %, vor der Grundstellung ${(pct(raus) / 2).toFixed(0)} %, ` +
          `${(spruenge / spiele).toFixed(1)} Hechtspruenge pro Spiel, ${faenge} Faenge`
    };
  }
};
