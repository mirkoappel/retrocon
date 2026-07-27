// Torhüter: Sie dürfen sich nicht im Gleichschritt bewegen, sie sollen
// herauskommen, und sie sollen hechten und dabei fangen — aber nicht am Tor
// vorbei. Vorher wurde der Kreuzungspunkt erst NACH der Sprungentscheidung
// auf den Torbereich begrenzt: Der Torwart warf sich auch hinter Bällen her,
// die weit vorbeigingen, und machte dabei das Tor frei. Gemessen landete er
// nach 41 % der Sprünge neben dem Tor, und ein Sprung trug ihn im Mittel
// 0,089 weit — bei einer Torbreite von 0,189.
const { session, playMatch } = require('../harness');

module.exports = {
  name: 'Fussball · Torhueter kommen heraus und hechten',
  slow: true,
  run() {
    let frames = 0, gleich = 0, raus = 0, spruenge = 0, faenge = 0;
    const weiten = [];
    let danebenGelandet = 0;
    const GOAL_W = 0.189, MITTE = 0.29;
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
          if (g.dive > 0 && v <= 0) { spruenge++; g.__ab = { x: g.x, y: g.y }; }
          if (v > 0 && g.dive <= 0) {
            if (S.ball.owner === g) faenge++;
            if (g.__ab) {
              weiten.push(Math.hypot(g.x - g.__ab.x, g.y - g.__ab.y));
              if (Math.abs(g.x - MITTE) > GOAL_W / 2) danebenGelandet++;
              g.__ab = null;
            }
          }
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
    const mittel = weiten.length ? weiten.reduce((a, b) => a + b, 0) / weiten.length : 0;
    const daneben = weiten.length ? 100 * danebenGelandet / weiten.length : 0;
    // Ein Sprung darf ihn nie ueber die ganze Torbreite tragen
    if (Math.max(0, ...weiten) > GOAL_W) fehler.push(`ein Sprung ging ${Math.max(...weiten).toFixed(3)} weit, das Tor ist ${GOAL_W} breit`);
    if (mittel > GOAL_W * 0.4) fehler.push(`Spruenge im Mittel ${mittel.toFixed(3)} weit (Grenze ${(GOAL_W * 0.4).toFixed(3)})`);
    if (daneben > 20) fehler.push(`nach ${daneben.toFixed(0)} % der Spruenge steht er neben dem Tor (frueher 41 %)`);
    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : `Gleichschritt ${pct(gleich).toFixed(1)} %, vor der Grundstellung ${(pct(raus) / 2).toFixed(0)} %, ` +
          `${(spruenge / spiele).toFixed(1)} Hechtspruenge pro Spiel, ${faenge} Faenge, ` +
          `Sprungweite ${mittel.toFixed(3)}, danach neben dem Tor ${daneben.toFixed(0)} %`
    };
  }
};
