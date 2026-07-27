// Getreten wird nur bei Berührung. Der Prüfstand schreibt bei jedem Schuss
// und jedem Pass den Abstand Spieler–Ball mit.
const { session, playMatch } = require('../harness');

const inject = src => {
  for (const name of ['doShoot', 'doPass']) {
    const i = src.indexOf(`    function ${name}(p`);
    const j = src.indexOf('if (b.owner !== p) return;', i) + 'if (b.owner !== p) return;'.length;
    src = src.slice(0, j) +
      '\n      global.__kicks.push(Math.hypot(b.x - p.x, b.y - p.y));' + src.slice(j);
  }
  return src;
};

module.exports = {
  name: 'Fussball · getreten wird nur bei Beruehrung',
  run() {
    global.__kicks = [];
    for (let m = 0; m < 2; m++) playMatch(session('soccer', { inject }));
    const k = global.__kicks;
    const GRENZE = 0.021 + 0.0105 + 0.002;          // PLAYER_R + BALL_R + Toleranz
    const max = Math.max(...k);
    const ohne = k.filter(d => d > GRENZE + 1e-9).length;
    return {
      ok: k.length > 200 && ohne === 0,
      info: `${k.length} Tritte, groesster Abstand ${max.toFixed(4)} (Grenze ${GRENZE.toFixed(4)}), ohne Beruehrung: ${ohne}`
    };
  }
};
